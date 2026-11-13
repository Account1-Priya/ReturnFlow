import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../validators/authValidator';
import * as authService from '../services/authService';

export async function register(req: Request, res: Response) {
  const validated = registerSchema.parse(req.body);
  const result = await authService.registerCustomer(validated);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const validated = loginSchema.parse(req.body);
  const result = await authService.loginUser(validated);
  res.status(200).json(result);
}

export async function getMe(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.userId);
  res.status(200).json({ user });
}

