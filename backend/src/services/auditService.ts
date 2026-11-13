import { prisma } from '../db/prisma';
import { ReturnStatus } from '../types/enums';

export async function logStatusChange(params: {
  returnRequestId: number;
  changedById: number;
  fromStatus: ReturnStatus | null;
  toStatus: ReturnStatus;
  note?: string | null;
}) {
  const { returnRequestId, changedById, fromStatus, toStatus, note } = params;

  return prisma.returnStatusHistory.create({
    data: {
      returnRequestId,
      changedById,
      fromStatus: fromStatus ?? undefined,
      toStatus,
      note: note ?? null,
    },
  });
}

export async function getReturnAuditHistory(returnRequestId: number) {
  return prisma.returnStatusHistory.findMany({
    where: { returnRequestId },
    orderBy: { changedAt: 'asc' },
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

