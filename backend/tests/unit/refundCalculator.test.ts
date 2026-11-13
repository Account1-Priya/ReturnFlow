import {
  calculateRefund,
  OrderCalculationData,
} from '../../src/services/refundCalculator';
import { ReturnReason } from '../../src/types/enums';

describe('RefundCalculator – Monetary Math & Business Rules', () => {
  const baseOrder: OrderCalculationData = {
    id: 1,
    subtotalCents: 10000, // $100.00
    discountCents: 1000,  // $10.00 order-level discount (10%)
    shippingCents: 600,   // $6.00
    taxCents: 720,        // 8% on (100 - 10) = $7.20
    totalCents: 10320,
    items: [
      {
        id: 1,
        productId: 101,
        quantity: 2,
        unitPriceCents: 3000, // 2 x $30.00 = $60.00 (60% of subtotal)
        discountCents: 0,
        taxCents: 432,        // 8% on ($60 - $6) = $4.32
        lineTotalCents: 6000,
      },
      {
        id: 2,
        productId: 102,
        quantity: 1,
        unitPriceCents: 4000, // 1 x $40.00 = $40.00 (40% of subtotal)
        discountCents: 0,
        taxCents: 288,        // 8% on ($40 - $4) = $2.88
        lineTotalCents: 4000,
      },
    ],
  };

  test('Calculates prorated discount per unit accurately (Item 1, 1 qty)', () => {
    // Item 1: unitPrice $30.00. 60% of order -> discount share is $6.00 total, so $3.00 per unit.
    // Net item refund = $30.00 - $3.00 = $27.00 (2700 cents)
    // Tax per unit = $4.32 / 2 = $2.16 (216 cents)
    // Reason: DEFECTIVE -> Restock fee = 0. Partial return -> Shipping = 0
    // Total line refund = 2700 + 216 = 2916 cents ($29.16)
    const res = calculateRefund({
      order: baseOrder,
      returnItems: [{ orderItemId: 1, quantity: 1 }],
      reason: ReturnReason.DEFECTIVE,
    });

    expect(res.items[0].itemRefundCents).toBe(2700);
    expect(res.items[0].taxRefundCents).toBe(216);
    expect(res.items[0].restockingFeeCents).toBe(0);
    expect(res.items[0].shippingRefundCents).toBe(0);
    expect(res.totalRefundCents).toBe(2916);
  });

  test('15% restocking fee applied for CHANGED_MIND and NOT_AS_DESCRIBED', () => {
    // Net item refund = 2700 cents
    // 15% restocking fee = 2700 * 0.15 = 405 cents
    // Tax refund = 216 cents
    // Total = 2700 + 216 - 405 = 2511 cents
    const resChangedMind = calculateRefund({
      order: baseOrder,
      returnItems: [{ orderItemId: 1, quantity: 1 }],
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(resChangedMind.items[0].restockingFeeCents).toBe(405);
    expect(resChangedMind.totalRefundCents).toBe(2511);

    const resNotAsDescribed = calculateRefund({
      order: baseOrder,
      returnItems: [{ orderItemId: 1, quantity: 1 }],
      reason: ReturnReason.NOT_AS_DESCRIBED,
    });

    expect(resNotAsDescribed.items[0].restockingFeeCents).toBe(405);
    expect(resNotAsDescribed.totalRefundCents).toBe(2511);
  });

  test('Restocking fee waived for DEFECTIVE, DAMAGED_IN_TRANSIT, WRONG_ITEM', () => {
    for (const sellerFault of [
      ReturnReason.DEFECTIVE,
      ReturnReason.DAMAGED_IN_TRANSIT,
      ReturnReason.WRONG_ITEM,
    ]) {
      const res = calculateRefund({
        order: baseOrder,
        returnItems: [{ orderItemId: 1, quantity: 1 }],
        reason: sellerFault,
      });
      expect(res.items[0].restockingFeeCents).toBe(0);
    }
  });

  test('Full shipping refunded ONLY IF entire order is returned AND reason is seller-fault', () => {
    // Entire order returned: item 1 (qty 2) + item 2 (qty 1)
    const entireReturn = [
      { orderItemId: 1, quantity: 2 },
      { orderItemId: 2, quantity: 1 },
    ];

    // Case 1: Entire order + DEFECTIVE -> Shipping refunded
    const resSellerFault = calculateRefund({
      order: baseOrder,
      returnItems: entireReturn,
      reason: ReturnReason.DEFECTIVE,
    });
    expect(resSellerFault.isEntireOrderReturned).toBe(true);
    expect(resSellerFault.shippingRefundCents).toBe(600);

    // Case 2: Entire order + CHANGED_MIND -> Shipping is 0
    const resCustomerFault = calculateRefund({
      order: baseOrder,
      returnItems: entireReturn,
      reason: ReturnReason.CHANGED_MIND,
    });
    expect(resCustomerFault.shippingRefundCents).toBe(0);

    // Case 3: Partial order + DEFECTIVE -> Shipping is 0
    const resPartial = calculateRefund({
      order: baseOrder,
      returnItems: [{ orderItemId: 1, quantity: 2 }],
      reason: ReturnReason.DEFECTIVE,
    });
    expect(resPartial.isEntireOrderReturned).toBe(false);
    expect(resPartial.shippingRefundCents).toBe(0);
  });

  test('Refund can never exceed amount paid for the item', () => {
    const res = calculateRefund({
      order: baseOrder,
      returnItems: [{ orderItemId: 2, quantity: 1 }],
      reason: ReturnReason.DEFECTIVE,
    });
    // Max paid for item 2: 4000 - 400 (prorated discount) + 288 (tax) = 3888 cents
    expect(res.totalRefundCents).toBeLessThanOrEqual(3888);
  });
});

