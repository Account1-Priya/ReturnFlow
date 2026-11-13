import {
  OrderStatus,
  ProductCategory,
  ReturnReason,
  ReturnStatus,
} from '../types/enums';

export interface EligibilityItemInput {
  orderItemId: number;
  quantity: number;
}

export interface OrderItemDetail {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  lineTotalCents: number;
  product: {
    id: number;
    sku: string;
    name: string;
    category: string;
    isFinalSale: boolean;
  };
}

export interface ReturnItemCoverage {
  orderItemId: number;
  quantityReturned: number;
  status: string;
}

export interface EligibilityCheckOrder {
  id: number;
  customerId: number;
  status: string;
  deliveredAt: Date | null;
  items: OrderItemDetail[];
}

export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  itemResults: {
    orderItemId: number;
    isEligible: boolean;
    availableQuantity: number;
    requestedQuantity: number;
    reason?: string;
  }[];
}

const NON_RETURNABLE_CATEGORIES: string[] = [
  ProductCategory.GIFT_CARD,
  ProductCategory.PERISHABLE,
  ProductCategory.PERSONALIZED,
];

const SELLER_FAULT_REASONS: string[] = [
  ReturnReason.DEFECTIVE,
  ReturnReason.DAMAGED_IN_TRANSIT,
  ReturnReason.WRONG_ITEM,
];

/**
 * Checks overall and per-item return eligibility for an order.
 */
export function checkReturnEligibility(params: {
  order: EligibilityCheckOrder;
  requestedItems: EligibilityItemInput[];
  existingReturnItems?: ReturnItemCoverage[];
  reason?: string;
  comment?: string | null;
  imageCount?: number;
}): EligibilityResult {
  const {
    order,
    requestedItems,
    existingReturnItems = [],
    reason,
    comment,
    imageCount = 0,
  } = params;

  const seededBugsEnabled = process.env.ENABLE_SEEDED_BUGS === 'true';

  // 1. Order Status Check
  if (order.status !== OrderStatus.DELIVERED) {
    return {
      isEligible: false,
      reason: `Order must be in DELIVERED status to request a return. Current status: ${order.status}`,
      itemResults: [],
    };
  }

  // 2. Delivery Date & 30-Day Window Check
  if (!order.deliveredAt) {
    return {
      isEligible: false,
      reason: 'Order delivery date is missing.',
      itemResults: [],
    };
  }

  const now = new Date();
  const deliveryTime = new Date(order.deliveredAt).getTime();
  const diffMs = now.getTime() - deliveryTime;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Business Rule: day 30 allowed, day 31 rejected (window is up to 31 full days).
  // Seeded Bug: If ENABLE_SEEDED_BUGS is true, off-by-one bug uses 30.0 days (strictly rejecting day 30).
  const maxDays = seededBugsEnabled ? 30.0 : 31.0;
  if (diffDays >= maxDays) {
    return {
      isEligible: false,
      reason: `The 30-day return window has expired. Order was delivered ${Math.floor(
        diffDays
      )} days ago.`,
      itemResults: [],
    };
  }

  // 3. Reason & Comment Validation
  if (reason) {
    const validReasons = Object.values(ReturnReason);
    if (!validReasons.includes(reason as any)) {
      return {
        isEligible: false,
        reason: `Invalid return reason: ${reason}. Valid reasons: ${validReasons.join(', ')}`,
        itemResults: [],
      };
    }

    if (reason === ReturnReason.OTHER) {
      if (!comment || comment.trim().length < 10) {
        return {
          isEligible: false,
          reason: 'Reason "OTHER" requires an explanatory comment of at least 10 characters.',
          itemResults: [],
        };
      }
    }

    // 4. Proof Image Requirement
    const requiresProof = SELLER_FAULT_REASONS.includes(reason);
    if (requiresProof && imageCount < 1) {
      return {
        isEligible: false,
        reason: `At least one proof image is required for returns due to ${reason}.`,
        itemResults: [],
      };
    }
  }

  // 5. Item-Level Eligibility & Quantity Checks
  const activeStatuses: string[] = [
    ReturnStatus.SUBMITTED,
    ReturnStatus.UNDER_REVIEW,
    ReturnStatus.APPROVED,
    ReturnStatus.REFUND_INITIATED,
    ReturnStatus.REFUNDED,
  ];

  // Calculate active returned quantity per order_item_id
  const activeReturnedQtyByItem: Record<number, number> = {};
  for (const ret of existingReturnItems) {
    if (activeStatuses.includes(ret.status)) {
      activeReturnedQtyByItem[ret.orderItemId] =
        (activeReturnedQtyByItem[ret.orderItemId] || 0) + ret.quantityReturned;
    }
  }

  const itemResults: EligibilityResult['itemResults'] = [];
  let allItemsEligible = true;

  if (requestedItems.length === 0) {
    return {
      isEligible: false,
      reason: 'At least one item must be selected for return.',
      itemResults: [],
    };
  }

  for (const reqItem of requestedItems) {
    const orderItem = order.items.find((i) => i.id === reqItem.orderItemId);

    if (!orderItem) {
      allItemsEligible = false;
      itemResults.push({
        orderItemId: reqItem.orderItemId,
        isEligible: false,
        availableQuantity: 0,
        requestedQuantity: reqItem.quantity,
        reason: 'Item does not belong to this order.',
      });
      continue;
    }

    // Check non-returnable categories
    if (NON_RETURNABLE_CATEGORIES.includes(orderItem.product.category)) {
      allItemsEligible = false;
      itemResults.push({
        orderItemId: reqItem.orderItemId,
        isEligible: false,
        availableQuantity: 0,
        requestedQuantity: reqItem.quantity,
        reason: `Category "${orderItem.product.category}" is non-returnable.`,
      });
      continue;
    }

    // Check final sale
    if (orderItem.product.isFinalSale) {
      allItemsEligible = false;
      itemResults.push({
        orderItemId: reqItem.orderItemId,
        isEligible: false,
        availableQuantity: 0,
        requestedQuantity: reqItem.quantity,
        reason: 'Item is marked as final sale and cannot be returned.',
      });
      continue;
    }

    // Quantity checks
    const alreadyReturned = activeReturnedQtyByItem[orderItem.id] || 0;
    const availableQty = orderItem.quantity - alreadyReturned;

    if (reqItem.quantity < 1) {
      allItemsEligible = false;
      itemResults.push({
        orderItemId: reqItem.orderItemId,
        isEligible: false,
        availableQuantity: availableQty,
        requestedQuantity: reqItem.quantity,
        reason: 'Requested return quantity must be at least 1.',
      });
      continue;
    }

    if (reqItem.quantity > availableQty) {
      allItemsEligible = false;
      itemResults.push({
        orderItemId: reqItem.orderItemId,
        isEligible: false,
        availableQuantity: availableQty,
        requestedQuantity: reqItem.quantity,
        reason:
          availableQty === 0
            ? 'Item has already been fully returned or has an active return request pending.'
            : `Requested quantity (${reqItem.quantity}) exceeds remaining returnable quantity (${availableQty}).`,
      });
      continue;
    }

    itemResults.push({
      orderItemId: reqItem.orderItemId,
      isEligible: true,
      availableQuantity: availableQty,
      requestedQuantity: reqItem.quantity,
    });
  }

  return {
    isEligible: allItemsEligible,
    reason: allItemsEligible
      ? undefined
      : 'One or more requested items are ineligible for return.',
    itemResults,
  };
}

