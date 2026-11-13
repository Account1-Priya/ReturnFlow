import { z } from 'zod';
import { ReturnReason } from '../types/enums';

const returnItemSchema = z.object({
  orderItemId: z.coerce.number().int().positive('Order item ID must be a positive integer'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
});

export const returnPreviewSchema = z.object({
  orderId: z.coerce.number().int().positive('Order ID must be a positive integer'),
  items: z.array(returnItemSchema).min(1, 'At least one item must be selected for return'),
  reason: z.nativeEnum(ReturnReason, {
    errorMap: () => ({
      message: `Invalid reason. Must be one of: ${Object.values(ReturnReason).join(', ')}`,
    }),
  }),
  comment: z.string().trim().optional(),
});

export const returnSubmitSchema = z.object({
  orderId: z.coerce.number().int().positive('Order ID must be a positive integer'),
  items: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val) : val),
    z.array(returnItemSchema).min(1, 'At least one item must be selected for return')
  ),
  reason: z.nativeEnum(ReturnReason, {
    errorMap: () => ({
      message: `Invalid reason. Must be one of: ${Object.values(ReturnReason).join(', ')}`,
    }),
  }),
  comment: z.string().trim().optional(),
});

export const rejectReturnSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters long'),
});

export const processRefundSchema = z.object({
  forceFail: z.boolean().optional(),
});

