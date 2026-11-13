import { prisma } from '../db/prisma';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';
import { checkReturnEligibility } from './eligibilityService';
import { calculateRefund } from './refundCalculator';
import { logStatusChange } from './auditService';
import { ReturnReason, ReturnStatus } from '../types/enums';

export interface SubmitReturnItemInput {
  orderItemId: number;
  quantity: number;
}

export interface UploadedFileRecord {
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes: number;
}

export async function previewReturn(params: {
  customerId: number;
  orderId: number;
  items: SubmitReturnItemInput[];
  reason: ReturnReason;
  comment?: string;
}) {
  const { customerId, orderId, items, reason, comment } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          returnItems: {
            include: {
              returnRequest: { select: { status: true } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(`Order #${orderId} not found`);
  }

  if (order.customerId !== customerId) {
    throw new ForbiddenError('You do not own this order');
  }

  // Flatten existing return items across all order items
  const existingReturnItems = order.items.flatMap((item) =>
    item.returnItems.map((ri) => ({
      orderItemId: ri.orderItemId,
      quantityReturned: ri.quantityReturned,
      status: ri.returnRequest.status,
    }))
  );

  // 1. Eligibility Check
  const eligibility = checkReturnEligibility({
    order: {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      deliveredAt: order.deliveredAt,
      items: order.items as any,
    },
    requestedItems: items,
    existingReturnItems,
    reason,
    comment,
    imageCount: 1, // Preview doesn't require uploaded image yet
  });

  if (!eligibility.isEligible) {
    throw new BadRequestError(
      eligibility.reason || 'One or more items are ineligible for return',
      eligibility.itemResults.map((ir) => ({
        field: `orderItemId:${ir.orderItemId}`,
        message: ir.reason || 'Item is ineligible',
      }))
    );
  }

  // 2. Refund Calculation
  const refundPreview = calculateRefund({
    order: {
      id: order.id,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        discountCents: i.discountCents,
        taxCents: i.taxCents,
        lineTotalCents: i.lineTotalCents,
      })),
    },
    returnItems: items,
    reason,
  });

  return {
    orderId,
    reason,
    refundPreview,
  };
}

export async function createReturnRequest(params: {
  customerId: number;
  orderId: number;
  items: SubmitReturnItemInput[];
  reason: ReturnReason;
  comment?: string;
  files?: UploadedFileRecord[];
}) {
  const { customerId, orderId, items, reason, comment, files = [] } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          returnItems: {
            include: {
              returnRequest: { select: { status: true } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(`Order #${orderId} not found`);
  }

  if (order.customerId !== customerId) {
    throw new ForbiddenError('You do not own this order');
  }

  const existingReturnItems = order.items.flatMap((item) =>
    item.returnItems.map((ri) => ({
      orderItemId: ri.orderItemId,
      quantityReturned: ri.quantityReturned,
      status: ri.returnRequest.status,
    }))
  );

  // 1. Eligibility Check
  const eligibility = checkReturnEligibility({
    order: {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      deliveredAt: order.deliveredAt,
      items: order.items as any,
    },
    requestedItems: items,
    existingReturnItems,
    reason,
    comment,
    imageCount: files.length,
  });

  if (!eligibility.isEligible) {
    throw new BadRequestError(
      eligibility.reason || 'One or more items are ineligible for return',
      eligibility.itemResults.map((ir) => ({
        field: `orderItemId:${ir.orderItemId}`,
        message: ir.reason || 'Item is ineligible',
      }))
    );
  }

  // 2. Calculate Refund
  const refundCalc = calculateRefund({
    order: {
      id: order.id,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        discountCents: i.discountCents,
        taxCents: i.taxCents,
        lineTotalCents: i.lineTotalCents,
      })),
    },
    returnItems: items,
    reason,
  });

  // 3. Atomic Database Insertion
  return prisma.$transaction(async (tx) => {
    // Create Return Request
    const returnReq = await tx.returnRequest.create({
      data: {
        orderId,
        customerId,
        reason,
        comment: comment ?? null,
        status: ReturnStatus.SUBMITTED,
      },
    });

    // Create Return Items
    for (const calculated of refundCalc.items) {
      await tx.returnItem.create({
        data: {
          returnRequestId: returnReq.id,
          orderItemId: calculated.orderItemId,
          quantityReturned: calculated.quantityReturned,
          itemRefundCents: calculated.itemRefundCents,
          taxRefundCents: calculated.taxRefundCents,
          restockingFeeCents: calculated.restockingFeeCents,
          shippingRefundCents: calculated.shippingRefundCents,
          totalRefundCents: calculated.totalRefundCents,
        },
      });
    }

    // Create Return Images
    if (files.length > 0) {
      await tx.returnImage.createMany({
        data: files.map((f) => ({
          returnRequestId: returnReq.id,
          fileName: f.fileName,
          filePath: f.filePath,
          mimeType: f.mimeType,
          fileSizeBytes: f.fileSizeBytes,
        })),
      });
    }

    // Create Initial Audit History
    await tx.returnStatusHistory.create({
      data: {
        returnRequestId: returnReq.id,
        changedById: customerId,
        fromStatus: null,
        toStatus: ReturnStatus.SUBMITTED,
        note: 'Return request submitted by customer.',
      },
    });

    return {
      returnRequest: returnReq,
      refundSummary: refundCalc,
    };
  });
}

export async function getCustomerReturns(customerId: number, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [total, returnRequests] = await Promise.all([
    prisma.returnRequest.count({ where: { customerId } }),
    prisma.returnRequest.findMany({
      where: { customerId },
      include: {
        order: {
          select: { id: true, deliveredAt: true, totalCents: true },
        },
        returnItems: {
          include: {
            orderItem: {
              include: { product: true },
            },
          },
        },
        refund: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    returnRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getReturnDetail(
  returnId: number,
  userId: number,
  userRole: string
) {
  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      order: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      },
      customer: {
        select: { id: true, name: true, email: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
      returnItems: {
        include: {
          orderItem: {
            include: { product: true },
          },
        },
      },
      images: true,
      refund: true,
      statusHistory: {
        include: {
          changedBy: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { changedAt: 'asc' },
      },
    },
  });

  if (!returnReq) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  // Seeded Bug: If ENABLE_SEEDED_BUGS=true, skip ownership check to simulate IDOR defect
  const seededBugsEnabled = process.env.ENABLE_SEEDED_BUGS === 'true';

  if (!seededBugsEnabled && userRole !== 'ADMIN' && returnReq.customerId !== userId) {
    throw new ForbiddenError('You do not have permission to view this return request');
  }

  return returnReq;
}

export async function cancelReturnRequest(returnId: number, customerId: number) {
  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnId },
  });

  if (!returnReq) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  if (returnReq.customerId !== customerId) {
    throw new ForbiddenError('You do not own this return request');
  }

  // State Machine Rule: Customer can ONLY cancel when status is SUBMITTED (before review)
  if (returnReq.status !== ReturnStatus.SUBMITTED) {
    throw new ConflictError(
      `Cannot cancel return in status "${returnReq.status}". Returns can only be cancelled while in SUBMITTED status.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: returnId },
      data: { status: ReturnStatus.CANCELLED },
    });

    await tx.returnStatusHistory.create({
      data: {
        returnRequestId: returnId,
        changedById: customerId,
        fromStatus: ReturnStatus.SUBMITTED,
        toStatus: ReturnStatus.CANCELLED,
        note: 'Return request cancelled by customer.',
      },
    });

    return updated;
  });
}

export async function addReturnImages(
  returnId: number,
  customerId: number,
  files: UploadedFileRecord[]
) {
  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { images: true },
  });

  if (!returnReq) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  if (returnReq.customerId !== customerId) {
    throw new ForbiddenError('You do not own this return request');
  }

  const currentCount = returnReq.images.length;
  if (currentCount + files.length > 5) {
    throw new BadRequestError(
      `Maximum 5 images allowed per return. Current count: ${currentCount}, attempting to add: ${files.length}`
    );
  }

  await prisma.returnImage.createMany({
    data: files.map((f) => ({
      returnRequestId: returnId,
      fileName: f.fileName,
      filePath: f.filePath,
      mimeType: f.mimeType,
      fileSizeBytes: f.fileSizeBytes,
    })),
  });

  return prisma.returnImage.findMany({ where: { returnRequestId: returnId } });
}

