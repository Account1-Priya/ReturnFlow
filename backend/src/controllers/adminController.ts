import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import { rejectReturnSchema, processRefundSchema } from '../validators/returnValidator';
import { getReturnAuditHistory } from '../services/auditService';
import xss from 'xss';

export async function listAllReturns(req: Request, res: Response) {
  const {
    status,
    startDate,
    endDate,
    customerId,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await adminService.getAdminReturns({
    status: status as string,
    startDate: startDate as string,
    endDate: endDate as string,
    customerId: customerId ? parseInt(customerId as string, 10) : undefined,
    search: search as string,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 10,
    sortBy: (sortBy as string) || 'createdAt',
    sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
  });

  res.status(200).json(result);
}

export async function markReview(req: Request, res: Response) {
  const returnId = parseInt(req.params.id, 10);
  const adminId = req.user!.userId;

  const updated = await adminService.markUnderReview(returnId, adminId);
  res.status(200).json({
    message: `Return #${returnId} marked as UNDER_REVIEW`,
    returnRequest: updated,
  });
}

export async function approveReturn(req: Request, res: Response) {
  const returnId = parseInt(req.params.id, 10);
  const adminId = req.user!.userId;

  const updated = await adminService.approveReturn(returnId, adminId);
  res.status(200).json({
    message: `Return #${returnId} approved successfully`,
    returnRequest: updated,
  });
}

export async function rejectReturn(req: Request, res: Response) {
  const returnId = parseInt(req.params.id, 10);
  const adminId = req.user!.userId;
  const validated = rejectReturnSchema.parse(req.body);

  const updated = await adminService.rejectReturn(
    returnId,
    adminId,
    xss(validated.reason)
  );

  res.status(200).json({
    message: `Return #${returnId} rejected`,
    returnRequest: updated,
  });
}

export async function refundReturn(req: Request, res: Response) {
  const returnId = parseInt(req.params.id, 10);
  const adminId = req.user!.userId;
  const validated = processRefundSchema.parse(req.body);

  const result = await adminService.processRefund(
    returnId,
    adminId,
    validated.forceFail
  );

  const statusCode = result.success ? 200 : 422;
  res.status(statusCode).json(result);
}

export async function getAuditHistory(req: Request, res: Response) {
  const returnId = parseInt(req.params.id, 10);
  const history = await getReturnAuditHistory(returnId);
  res.status(200).json({ history });
}

export async function getStats(_req: Request, res: Response) {
  const stats = await adminService.getAdminStats();
  res.status(200).json({ stats });
}

