import { prisma } from '../db/prisma';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import { RefundStatus, ReturnStatus } from '../types/enums';
import { v4 as uuidv4 } from 'uuid';

export interface AdminReturnsFilter {
  status?: string;
  startDate?: string;
  endDate?: string;
  customerId?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getAdminReturns(filters: AdminReturnsFilter) {
  const {
    status,
    startDate,
    endDate,
    customerId,
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (customerId) {
    where.customerId = Number(customerId);
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { comment: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { email: { contains: search } } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, returnRequests] = await Promise.all([
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, totalCents: true, deliveredAt: true } },
        returnItems: {
          include: {
            orderItem: { include: { product: true } },
          },
        },
        refund: true,
      },
      orderBy: { [sortBy]: sortOrder },
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

export async function markUnderReview(returnId: number, adminId: number) {
  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnId },
  });

  if (!returnReq) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  // State machine: only SUBMITTED -> UNDER_REVIEW
  if (returnReq.status !== ReturnStatus.SUBMITTED) {
    throw new ConflictError(
      `Cannot move return #${returnId} to UNDER_REVIEW from current status "${returnReq.status}". Valid transition is SUBMITTED -> UNDER_REVIEW.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.UNDER_REVIEW,
        reviewedById: adminId,
      },
    });

    await tx.returnStatusHistory.create({
      data: {
        returnRequestId: returnId,
        changedById: adminId,
        fromStatus: ReturnStatus.SUBMITTED,
        toStatus: ReturnStatus.UNDER_REVIEW,
        note: 'Admin initiated review.',
      },
    });

    return updated;
  });
}

export async function approveReturn(returnId: number, adminId: number) {
  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { returnItems: true },
  });

  if (!returnReq) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  // State machine: only UNDER_REVIEW -> APPROVED
  if (returnReq.status !== ReturnStatus.UNDER_REVIEW) {
    throw new ConflictError(
      `Cannot approve return #${returnId} from current status "${returnReq.status}". Returns must be in UNDER_REVIEW before approval.`
    );
  }

  const totalRefundAmount = returnReq.returnItems.reduce(
    (sum, item) => sum + item.totalRefundCents,
    0
  );

  return prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.APPROVED,
        reviewedById: adminId,
      },
    });

    // Create or update pending Refund record
    await tx.refund.upsert({
      where: { returnRequestId: returnId },
      create: {
        returnRequestId: returnId,
        totalRefundCents: totalRefundAmount,
        status: RefundStatus.PENDING,
      },
      update: {
        totalRefundCents: totalRefundAmount,
        status: RefundStatus.PENDING,
      },
    });

    await tx.returnStatusHistory.create({
      data: {
        returnRequestId: returnId,
        changedById: adminId,
        fromStatus: ReturnStatus.UNDER_REVIEW,
        toStatus: ReturnStatus.APPROVED,
        note: `Return approved by admin. Total refund prepared: $${(
          totalRefundAmount / 100
        ).toFixed(2)}.`,
      },
    });

    return updated;
  });
}

export async function rejectReturn(
  returnId: number,
  adminId: number,
  rejectionReason: string
) {
  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new BadRequestError('Rejection reason is required');
  }

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnId },
  });

  if (!returnReq) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  // State machine: only UNDER_REVIEW -> REJECTED
  if (returnReq.status !== ReturnStatus.UNDER_REVIEW) {
    throw new ConflictError(
      `Cannot reject return #${returnId} from current status "${returnReq.status}". Returns must be in UNDER_REVIEW before rejection.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.REJECTED,
        reviewedById: adminId,
        rejectionReason,
      },
    });

    await tx.returnStatusHistory.create({
      data: {
        returnRequestId: returnId,
        changedById: adminId,
        fromStatus: ReturnStatus.UNDER_REVIEW,
        toStatus: ReturnStatus.REJECTED,
        note: `Return rejected. Reason: ${rejectionReason}`,
      },
    });

    return updated;
  });
}

export async function processRefund(
  returnId: number,
  adminId: number,
  forceFail = false
) {
  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { refund: true, returnItems: true },
  });

  if (!returnReq) {
    throw new NotFoundError(`Return request #${returnId} not found`);
  }

  // State machine: APPROVED -> REFUND_INITIATED, or retry from REFUND_FAILED -> REFUND_INITIATED
  const allowedStatuses = [ReturnStatus.APPROVED, ReturnStatus.REFUND_FAILED];
  if (!allowedStatuses.includes(returnReq.status as any)) {
    throw new ConflictError(
      `Cannot process refund for return #${returnId} in status "${returnReq.status}". Return must be APPROVED or REFUND_FAILED.`
    );
  }

  const totalRefundAmount =
    returnReq.refund?.totalRefundCents ||
    returnReq.returnItems.reduce((sum, item) => sum + item.totalRefundCents, 0);

  // Check simulated payment gateway failure
  const envForceFail = process.env.GATEWAY_FORCE_FAIL === 'true';
  const shouldFail = forceFail || envForceFail;

  return prisma.$transaction(async (tx) => {
    // 1. Move to REFUND_INITIATED
    await tx.returnRequest.update({
      where: { id: returnId },
      data: { status: ReturnStatus.REFUND_INITIATED },
    });

    await tx.returnStatusHistory.create({
      data: {
        returnRequestId: returnId,
        changedById: adminId,
        fromStatus: returnReq.status as any,
        toStatus: ReturnStatus.REFUND_INITIATED,
        note: `Payment gateway refund initiated for $${(
          totalRefundAmount / 100
        ).toFixed(2)}.`,
      },
    });

    if (shouldFail) {
      // Simulated gateway failure
      const failureReason = 'Simulated Gateway Error: Card issuer declined transaction or network timeout';

      const updated = await tx.returnRequest.update({
        where: { id: returnId },
        data: { status: ReturnStatus.REFUND_FAILED },
      });

      await tx.refund.upsert({
        where: { returnRequestId: returnId },
        create: {
          returnRequestId: returnId,
          totalRefundCents: totalRefundAmount,
          status: RefundStatus.FAILED,
          failureReason,
        },
        update: {
          status: RefundStatus.FAILED,
          failureReason,
        },
      });

      await tx.returnStatusHistory.create({
        data: {
          returnRequestId: returnId,
          changedById: adminId,
          fromStatus: ReturnStatus.REFUND_INITIATED,
          toStatus: ReturnStatus.REFUND_FAILED,
          note: `Refund failed: ${failureReason}`,
        },
      });

      return {
        success: false,
        status: ReturnStatus.REFUND_FAILED,
        returnRequest: updated,
        failureReason,
      };
    }

    // Simulated gateway success
    const gatewayRef = `GW-REF-${uuidv4().substring(0, 8).toUpperCase()}`;

    const updated = await tx.returnRequest.update({
      where: { id: returnId },
      data: { status: ReturnStatus.REFUNDED },
    });

    await tx.refund.upsert({
      where: { returnRequestId: returnId },
      create: {
        returnRequestId: returnId,
        totalRefundCents: totalRefundAmount,
        status: RefundStatus.COMPLETED,
        gatewayRef,
        completedAt: new Date(),
      },
      update: {
        status: RefundStatus.COMPLETED,
        gatewayRef,
        completedAt: new Date(),
      },
    });

    await tx.returnStatusHistory.create({
      data: {
        returnRequestId: returnId,
        changedById: adminId,
        fromStatus: ReturnStatus.REFUND_INITIATED,
        toStatus: ReturnStatus.REFUNDED,
        note: `Refund settled successfully via payment gateway. Gateway Ref: ${gatewayRef}`,
      },
    });

    return {
      success: true,
      status: ReturnStatus.REFUNDED,
      returnRequest: updated,
      gatewayRef,
    };
  });
}

export async function getAdminStats() {
  const [
    totalReturns,
    submittedCount,
    underReviewCount,
    approvedCount,
    rejectedCount,
    refundedCount,
    cancelledCount,
    refundFailedCount,
    totalRefundResult,
    reasonsBreakdown,
  ] = await Promise.all([
    prisma.returnRequest.count(),
    prisma.returnRequest.count({ where: { status: ReturnStatus.SUBMITTED } }),
    prisma.returnRequest.count({ where: { status: ReturnStatus.UNDER_REVIEW } }),
    prisma.returnRequest.count({ where: { status: ReturnStatus.APPROVED } }),
    prisma.returnRequest.count({ where: { status: ReturnStatus.REJECTED } }),
    prisma.returnRequest.count({ where: { status: ReturnStatus.REFUNDED } }),
    prisma.returnRequest.count({ where: { status: ReturnStatus.CANCELLED } }),
    prisma.returnRequest.count({ where: { status: ReturnStatus.REFUND_FAILED } }),
    prisma.refund.aggregate({
      where: { status: RefundStatus.COMPLETED },
      _sum: { totalRefundCents: true },
    }),
    prisma.returnRequest.groupBy({
      by: ['reason'],
      _count: { id: true },
    }),
  ]);

  return {
    totalReturns,
    byStatus: {
      SUBMITTED: submittedCount,
      UNDER_REVIEW: underReviewCount,
      APPROVED: approvedCount,
      REJECTED: rejectedCount,
      REFUNDED: refundedCount,
      CANCELLED: cancelledCount,
      REFUND_FAILED: refundFailedCount,
    },
    totalRefundedCents: totalRefundResult._sum.totalRefundCents || 0,
    topReasons: reasonsBreakdown.map((r) => ({
      reason: r.reason,
      count: r._count.id,
    })),
  };
}

