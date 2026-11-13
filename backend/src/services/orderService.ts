import { prisma } from '../db/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { checkReturnEligibility } from './eligibilityService';
import { ReturnStatus } from '../types/enums';

export async function getCustomerOrders(customerId: number, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where: { customerId } }),
    prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
            returnItems: {
              include: {
                returnRequest: {
                  select: { status: true },
                },
              },
            },
          },
        },
        returnRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerOrderDetail(orderId: number, customerId: number, isAdmin = false) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          product: true,
          returnItems: {
            include: {
              returnRequest: {
                select: { id: true, status: true },
              },
            },
          },
        },
      },
      returnRequests: {
        include: {
          returnItems: true,
          refund: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(`Order #${orderId} not found`);
  }

  if (!isAdmin && order.customerId !== customerId) {
    throw new ForbiddenError('You do not have permission to view this order');
  }

  // Pre-calculate active returns per order item
  const activeStatuses = [
    ReturnStatus.SUBMITTED,
    ReturnStatus.UNDER_REVIEW,
    ReturnStatus.APPROVED,
    ReturnStatus.REFUND_INITIATED,
    ReturnStatus.REFUNDED,
  ];

  // Annotate items with eligibility & available quantities
  const itemsWithEligibility = order.items.map((item) => {
    const activeReturnedQty = item.returnItems
      .filter((ri) => activeStatuses.includes(ri.returnRequest.status as any))
      .reduce((sum, ri) => sum + ri.quantityReturned, 0);

    const availableQuantity = Math.max(0, item.quantity - activeReturnedQty);

    const eligibility = checkReturnEligibility({
      order: {
        id: order.id,
        customerId: order.customerId,
        status: order.status,
        deliveredAt: order.deliveredAt,
        items: [item as any],
      },
      requestedItems: [{ orderItemId: item.id, quantity: 1 }],
      existingReturnItems: item.returnItems.map((ri) => ({
        orderItemId: ri.orderItemId,
        quantityReturned: ri.quantityReturned,
        status: ri.returnRequest.status,
      })),
    });

    const isEligible = eligibility.isEligible && availableQuantity > 0;
    const ineligibilityReason = !isEligible
      ? eligibility.itemResults[0]?.reason || eligibility.reason || 'Not returnable'
      : undefined;

    return {
      ...item,
      activeReturnedQuantity: activeReturnedQty,
      availableReturnQuantity: availableQuantity,
      isReturnEligible: isEligible,
      ineligibilityReason,
    };
  });

  return {
    ...order,
    items: itemsWithEligibility,
  };
}

