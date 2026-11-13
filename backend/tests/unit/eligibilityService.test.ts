import {
  checkReturnEligibility,
  EligibilityCheckOrder,
} from '../../src/services/eligibilityService';
import {
  OrderStatus,
  ProductCategory,
  ReturnReason,
  ReturnStatus,
} from '../../src/types/enums';

describe('EligibilityService – Business Rules Oracle', () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  const baseOrder: EligibilityCheckOrder = {
    id: 1,
    customerId: 10,
    status: OrderStatus.DELIVERED,
    deliveredAt: daysAgo(10),
    items: [
      {
        id: 101,
        orderId: 1,
        productId: 1,
        quantity: 2,
        unitPriceCents: 5000,
        discountCents: 0,
        taxCents: 800,
        lineTotalCents: 10000,
        product: {
          id: 1,
          sku: 'ELEC-001',
          name: 'Headphones',
          category: ProductCategory.ELECTRONICS,
          isFinalSale: false,
        },
      },
      {
        id: 102,
        orderId: 1,
        productId: 2,
        quantity: 1,
        unitPriceCents: 2500,
        discountCents: 0,
        taxCents: 200,
        lineTotalCents: 2500,
        product: {
          id: 2,
          sku: 'GIFT-001',
          name: 'Gift Card',
          category: ProductCategory.GIFT_CARD,
          isFinalSale: false,
        },
      },
      {
        id: 103,
        orderId: 1,
        productId: 3,
        quantity: 1,
        unitPriceCents: 3500,
        discountCents: 0,
        taxCents: 280,
        lineTotalCents: 3500,
        product: {
          id: 3,
          sku: 'FINAL-001',
          name: 'Sale Item',
          category: ProductCategory.CLOTHING,
          isFinalSale: true,
        },
      },
    ],
  };

  test('Valid item within 30-day window is eligible', () => {
    const res = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(true);
    expect(res.itemResults[0].isEligible).toBe(true);
    expect(res.itemResults[0].availableQuantity).toBe(2);
  });

  test('Order not DELIVERED returns ineligible', () => {
    const nonDeliveredOrder = { ...baseOrder, status: OrderStatus.SHIPPED };
    const res = checkReturnEligibility({
      order: nonDeliveredOrder,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(false);
    expect(res.reason).toContain('Order must be in DELIVERED status');
  });

  test('Delivered 30 days ago is eligible (boundary day 30)', () => {
    const day30Order = { ...baseOrder, deliveredAt: daysAgo(30) };
    const res = checkReturnEligibility({
      order: day30Order,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(true);
  });

  test('Delivered 31 days ago is rejected (boundary day 31)', () => {
    const day31Order = { ...baseOrder, deliveredAt: daysAgo(31) };
    const res = checkReturnEligibility({
      order: day31Order,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(false);
    expect(res.reason).toContain('30-day return window has expired');
  });

  test('Non-returnable categories (GIFT_CARD, PERISHABLE, PERSONALIZED) are rejected', () => {
    const res = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 102, quantity: 1 }],
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(false);
    expect(res.itemResults[0].isEligible).toBe(false);
    expect(res.itemResults[0].reason).toContain('GIFT_CARD');
  });

  test('Items flagged isFinalSale are rejected', () => {
    const res = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 103, quantity: 1 }],
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(false);
    expect(res.itemResults[0].isEligible).toBe(false);
    expect(res.itemResults[0].reason).toContain('final sale');
  });

  test('Duplicate prevention: already returned quantity cannot be re-returned', () => {
    const existingReturns = [
      {
        orderItemId: 101,
        quantityReturned: 2,
        status: ReturnStatus.REFUNDED,
      },
    ];

    const res = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      existingReturnItems: existingReturns,
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(false);
    expect(res.itemResults[0].availableQuantity).toBe(0);
  });

  test('Duplicate prevention: pending return (SUBMITTED/UNDER_REVIEW) locks quantity', () => {
    const existingReturns = [
      {
        orderItemId: 101,
        quantityReturned: 1,
        status: ReturnStatus.SUBMITTED,
      },
    ];

    // Trying to return 2 when only 1 is remaining
    const res = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 101, quantity: 2 }],
      existingReturnItems: existingReturns,
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(false);
    expect(res.itemResults[0].availableQuantity).toBe(1);
  });

  test('Cancelled/Rejected returns free the quantity', () => {
    const existingReturns = [
      {
        orderItemId: 101,
        quantityReturned: 1,
        status: ReturnStatus.CANCELLED,
      },
      {
        orderItemId: 101,
        quantityReturned: 1,
        status: ReturnStatus.REJECTED,
      },
    ];

    const res = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 101, quantity: 2 }],
      existingReturnItems: existingReturns,
      reason: ReturnReason.CHANGED_MIND,
    });

    expect(res.isEligible).toBe(true);
    expect(res.itemResults[0].availableQuantity).toBe(2);
  });

  test('Reason OTHER requires comment of at least 10 characters', () => {
    const resShort = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      reason: ReturnReason.OTHER,
      comment: 'Too short',
    });
    expect(resShort.isEligible).toBe(false);
    expect(resShort.reason).toContain('at least 10 characters');

    const resValid = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      reason: ReturnReason.OTHER,
      comment: 'This is a valid detailed comment of sufficient length.',
    });
    expect(resValid.isEligible).toBe(true);
  });

  test('Proof images required for DEFECTIVE, DAMAGED_IN_TRANSIT, WRONG_ITEM', () => {
    const resWithoutImage = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      reason: ReturnReason.DEFECTIVE,
      imageCount: 0,
    });
    expect(resWithoutImage.isEligible).toBe(false);
    expect(resWithoutImage.reason).toContain('proof image is required');

    const resWithImage = checkReturnEligibility({
      order: baseOrder,
      requestedItems: [{ orderItemId: 101, quantity: 1 }],
      reason: ReturnReason.DEFECTIVE,
      imageCount: 1,
    });
    expect(resWithImage.isEligible).toBe(true);
  });
});

