import Decimal from 'decimal.js';
import { ReturnReason } from '../types/enums';

// Configure Decimal for financial Banker's Rounding (ROUND_HALF_EVEN)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

export interface OrderItemCalculationData {
  id: number;
  productId: number;
  quantity: number;
  unitPriceCents: number;
  discountCents: number; // line discount
  taxCents: number;
  lineTotalCents: number;
}

export interface OrderCalculationData {
  id: number;
  subtotalCents: number;
  discountCents: number; // order-level discount
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  items: OrderItemCalculationData[];
}

export interface RefundLineItemInput {
  orderItemId: number;
  quantity: number;
}

export interface CalculatedItemRefund {
  orderItemId: number;
  quantityReturned: number;
  itemRefundCents: number;
  taxRefundCents: number;
  restockingFeeCents: number;
  shippingRefundCents: number;
  totalRefundCents: number;
}

export interface RefundCalculationResult {
  items: CalculatedItemRefund[];
  subtotalItemRefundCents: number;
  totalTaxRefundCents: number;
  totalRestockingFeeCents: number;
  shippingRefundCents: number;
  totalRefundCents: number;
  isEntireOrderReturned: boolean;
  reason: string;
}

const SELLER_FAULT_REASONS = [
  ReturnReason.DEFECTIVE,
  ReturnReason.DAMAGED_IN_TRANSIT,
  ReturnReason.WRONG_ITEM,
];

const RESTOCKING_FEE_REASONS = [
  ReturnReason.CHANGED_MIND,
  ReturnReason.NOT_AS_DESCRIBED,
];

/**
 * Calculates itemized and total refund according to business rules.
 */
export function calculateRefund(params: {
  order: OrderCalculationData;
  returnItems: RefundLineItemInput[];
  reason: string;
  previouslyReturnedItemIds?: number[]; // IDs of order items already returned in prior requests
}): RefundCalculationResult {
  const { order, returnItems, reason } = params;
  const seededBugsEnabled = process.env.ENABLE_SEEDED_BUGS === 'true';

  const orderSubtotal = new Decimal(order.subtotalCents);
  const orderDiscount = new Decimal(order.discountCents);

  // Check if entire order is being returned
  // An entire order return means all items in the order have their full quantity returned
  const totalPurchasedQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReturningQty = returnItems.reduce((sum, item) => sum + item.quantity, 0);
  const isEntireOrderReturned = totalPurchasedQty === totalReturningQty;

  const calculatedItems: CalculatedItemRefund[] = [];
  let sumItemRefundCents = 0;
  let sumTaxRefundCents = 0;
  let sumRestockingFeeCents = 0;

  for (const retItem of returnItems) {
    const orderItem = order.items.find((i) => i.id === retItem.orderItemId);
    if (!orderItem) {
      throw new Error(`Order item ${retItem.orderItemId} not found in order ${order.id}`);
    }

    const unitPrice = new Decimal(orderItem.unitPriceCents);
    const qty = new Decimal(retItem.quantity);
    const itemPurchasedQty = new Decimal(orderItem.quantity);

    // 1. Prorated order-level discount per unit
    // Prorated discount fraction = (lineTotal before order discount) / orderSubtotal
    let proratedDiscountPerUnit = new Decimal(0);
    if (orderSubtotal.greaterThan(0) && orderDiscount.greaterThan(0)) {
      const lineBeforeDiscount = unitPrice.times(itemPurchasedQty).minus(orderItem.discountCents);
      const itemShareOfSubtotal = lineBeforeDiscount.dividedBy(orderSubtotal);
      const totalItemDiscount = orderDiscount.times(itemShareOfSubtotal);
      proratedDiscountPerUnit = totalItemDiscount.dividedBy(itemPurchasedQty);
    }

    // Line-level discount per unit
    const lineDiscountPerUnit = new Decimal(orderItem.discountCents).dividedBy(itemPurchasedQty);

    // Net unit price after discounts
    let netUnitPrice = unitPrice.minus(lineDiscountPerUnit).minus(proratedDiscountPerUnit);
    if (netUnitPrice.isNegative()) {
      netUnitPrice = new Decimal(0);
    }

    // Item refund in cents
    let itemRefund = netUnitPrice.times(qty);
    let itemRefundCents = seededBugsEnabled
      ? Math.trunc(itemRefund.toNumber()) // Seeded Bug: Truncation rounding error
      : itemRefund.round().toNumber();

    // 2. Tax refund proportional to item's tax paid
    let taxRefund = new Decimal(0);
    if (orderItem.taxCents > 0) {
      const taxPerUnit = new Decimal(orderItem.taxCents).dividedBy(itemPurchasedQty);
      taxRefund = taxPerUnit.times(qty);
    }
    const taxRefundCents = taxRefund.round().toNumber();

    // 3. Restocking fee (15% of item refund for CHANGED_MIND and NOT_AS_DESCRIBED)
    let restockingFeeCents = 0;
    const shouldChargeRestock =
      RESTOCKING_FEE_REASONS.includes(reason as any) ||
      (seededBugsEnabled && reason === ReturnReason.DEFECTIVE); // Seeded Bug: Defective items incorrectly charged restocking

    if (shouldChargeRestock) {
      const fee = new Decimal(itemRefundCents).times(0.15);
      restockingFeeCents = fee.round().toNumber();
    }

    // Cap refund: refund can never exceed line total paid + tax paid
    const maxPaidForUnits = unitPrice
      .times(qty)
      .minus(lineDiscountPerUnit.times(qty))
      .minus(proratedDiscountPerUnit.times(qty))
      .plus(taxRefund)
      .round()
      .toNumber();

    let lineTotalRefund = itemRefundCents + taxRefundCents - restockingFeeCents;
    if (lineTotalRefund > maxPaidForUnits) {
      lineTotalRefund = maxPaidForUnits;
    }
    if (lineTotalRefund < 0) {
      lineTotalRefund = 0;
    }

    sumItemRefundCents += itemRefundCents;
    sumTaxRefundCents += taxRefundCents;
    sumRestockingFeeCents += restockingFeeCents;

    calculatedItems.push({
      orderItemId: orderItem.id,
      quantityReturned: retItem.quantity,
      itemRefundCents,
      taxRefundCents,
      restockingFeeCents,
      shippingRefundCents: 0, // shipping is allocated at order level
      totalRefundCents: lineTotalRefund,
    });
  }

  // 4. Shipping refund:
  // Full original shipping ONLY IF entire order returned AND seller-fault
  let shippingRefundCents = 0;
  const isSellerFault = SELLER_FAULT_REASONS.includes(reason as any);

  if (isEntireOrderReturned && isSellerFault) {
    shippingRefundCents = order.shippingCents;
  }

  // Allocate shipping refund to first item in return for database storage consistency
  if (shippingRefundCents > 0 && calculatedItems.length > 0) {
    calculatedItems[0].shippingRefundCents = shippingRefundCents;
    calculatedItems[0].totalRefundCents += shippingRefundCents;
  }

  const grandTotalRefundCents =
    sumItemRefundCents +
    sumTaxRefundCents -
    sumRestockingFeeCents +
    shippingRefundCents;

  return {
    items: calculatedItems,
    subtotalItemRefundCents: sumItemRefundCents,
    totalTaxRefundCents: sumTaxRefundCents,
    totalRestockingFeeCents: sumRestockingFeeCents,
    shippingRefundCents,
    totalRefundCents: grandTotalRefundCents,
    isEntireOrderReturned,
    reason,
  };
}

