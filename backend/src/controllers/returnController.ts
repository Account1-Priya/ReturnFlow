import { Request, Response } from 'express';
import {
  returnPreviewSchema,
  returnSubmitSchema,
} from '../validators/returnValidator';
import * as returnService from '../services/returnService';
import xss from 'xss';

export async function previewReturn(req: Request, res: Response) {
  const customerId = req.user!.userId;
  const validated = returnPreviewSchema.parse(req.body);

  const result = await returnService.previewReturn({
    customerId,
    orderId: validated.orderId,
    items: validated.items,
    reason: validated.reason,
    comment: validated.comment ? xss(validated.comment) : undefined,
  });

  res.status(200).json(result);
}

export async function createReturn(req: Request, res: Response) {
  const customerId = req.user!.userId;
  const validated = returnSubmitSchema.parse(req.body);

  const files = (req.files as Express.Multer.File[] | undefined) || [];
  const fileRecords = files.map((f) => ({
    fileName: f.originalname,
    filePath: f.path,
    mimeType: f.mimetype,
    fileSizeBytes: f.size,
  }));

  const result = await returnService.createReturnRequest({
    customerId,
    orderId: validated.orderId,
    items: validated.items,
    reason: validated.reason,
    comment: validated.comment ? xss(validated.comment) : undefined,
    files: fileRecords,
  });

  res.status(201).json(result);
}

export async function listCustomerReturns(req: Request, res: Response) {
  const customerId = req.user!.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const result = await returnService.getCustomerReturns(customerId, page, limit);
  res.status(200).json(result);
}

export async function getReturnDetail(req: Request, res: Response) {
  const returnId = parseInt(req.params.id, 10);
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const returnDetail = await returnService.getReturnDetail(returnId, userId, userRole);
  res.status(200).json({ returnRequest: returnDetail });
}

export async function cancelReturn(req: Request, res: Response) {
  const returnId = parseInt(req.params.id, 10);
  const customerId = req.user!.userId;

  const updated = await returnService.cancelReturnRequest(returnId, customerId);
  res.status(200).json({
    message: 'Return request successfully cancelled',
    returnRequest: updated,
  });
}

export async function uploadImages(req: Request, res: Response) {
  const returnId = parseInt(req.params.id, 10);
  const customerId = req.user!.userId;
  const files = (req.files as Express.Multer.File[] | undefined) || [];

  const fileRecords = files.map((f) => ({
    fileName: f.originalname,
    filePath: f.path,
    mimeType: f.mimetype,
    fileSizeBytes: f.size,
  }));

  const images = await returnService.addReturnImages(returnId, customerId, fileRecords);
  res.status(201).json({ images });
}

