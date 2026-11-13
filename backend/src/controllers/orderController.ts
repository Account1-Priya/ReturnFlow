import { Request, Response } from 'express';
import * as orderService from '../services/orderService';
import { Role } from '../types/enums';

export async function listOrders(req: Request, res: Response) {
  const customerId = req.user!.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const result = await orderService.getCustomerOrders(customerId, page, limit);
  res.status(200).json(result);
}

export async function getOrder(req: Request, res: Response) {
  const orderId = parseInt(req.params.id, 10);
  const customerId = req.user!.userId;
  const isAdmin = req.user!.role === Role.ADMIN;

  const order = await orderService.getCustomerOrderDetail(orderId, customerId, isAdmin);
  res.status(200).json({ order });
}

