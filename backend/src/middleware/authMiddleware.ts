import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/authService';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role } from '../types/enums';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication required. Missing Bearer token.');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  req.user = payload;
  next();
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (req.user.role !== Role.ADMIN) {
    throw new ForbiddenError('Administrator access required');
  }

  next();
}

export function requireCustomer(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  next();
}

