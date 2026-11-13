import { checkReturnEligibility, EligibilityCheckOrder } from '../../src/services/eligibilityService';
import { calculateRefund, OrderCalculationData } from '../../src/services/refundCalculator';
import { OrderStatus, ProductCategory, ReturnReason } from '../../src/types/enums';

describe('Seeded Bugs Verification – QA Oracle & Defect Injection', () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  const day30Order: EligibilityCheckOrder = {
    id: 99,
    customerId: 1,
    status: OrderStatus.DELIVERED,
    deliveredAt: daysAgo(30),
    items: [
      {
        id: 901,
        orderId: 99,
        productId: 1,
        quantity: 1,
        unitPriceCents: 5000,
        discountCents: 0,
        taxCents: 400,
        lineTotalCents: 5000,
        product: {
          id: 1,
          sku: 'ELEC-001',
          name: 'Headphones',
          category: ProductCategory.ELECTRONICS,
          isFinalSale: false,
        },
      },
    ],
  };

  const defectOrder: OrderCalculationData = {
    id: 100,
    subtotalCents: 5000,
    discountCents: 0,
    shippingCents: 500,
    taxCents: 400,
    totalCents: 5900,
    items: [
      {
        id: 1001,
        productId: 1,
        quantity: 1,
        unitPriceCents: 5000,
        discountCents: 0,
        taxCents: 400,
        lineTotalCents: 5000,
      },
    ],
  };

  afterEach(() => {
    process.env.ENABLE_SEEDED_BUGS = 'false';
  });

  test('Bug 1: When ENABLE_SEEDED_BUGS=true, day 30 is rejected (off-by-one)', () => {
    // Normal baseline (bugs disabled): day 30 is eligible
    process.env.ENABLE_SEEDED_BUGS = 'false';
    const normalResult = checkReturnEligibility({
      order: day30Order,
      requestedItems: [{ orderItemId: 901, quantity: 1 }],
      reason: ReturnReason.DEFECTIVE,
      imageCount: 1,
    });
    expect(normalResult.isEligible).toBe(true);

    // Defect enabled: day 30 is improperly rejected
    process.env.ENABLE_SEEDED_BUGS = 'true';
    const bugResult = checkReturnEligibility({
      order: day30Order,
      requestedItems: [{ orderItemId: 901, quantity: 1 }],
      reason: ReturnReason.DEFECTIVE,
      imageCount: 1,
    });
    expect(bugResult.isEligible).toBe(false);
    expect(bugResult.reason).toContain('30-day return window has expired');
  });

  test('Bug 2: When ENABLE_SEEDED_BUGS=true, restocking fee is improperly applied to DEFECTIVE returns', () => {
    // Normal baseline: restocking fee is 0 for DEFECTIVE
    process.env.ENABLE_SEEDED_BUGS = 'false';
    const normalRefund = calculateRefund({
      order: defectOrder,
      returnItems: [{ orderItemId: 1001, quantity: 1 }],
      reason: ReturnReason.DEFECTIVE,
    });
    expect(normalRefund.items[0].restockingFeeCents).toBe(0);

    // Defect enabled: 15% restocking fee charged on DEFECTIVE
    process.env.ENABLE_SEEDED_BUGS = 'true';
    const bugRefund = calculateRefund({
      order: defectOrder,
      returnItems: [{ orderItemId: 1001, quantity: 1 }],
      reason: ReturnReason.DEFECTIVE,
    });
    expect(bugRefund.items[0].restockingFeeCents).toBe(750); // 15% of 5000
    expect(bugRefund.totalRefundCents).toBe(5000 + 400 - 750 + 500);
  });
});

