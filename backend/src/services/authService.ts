import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { Role } from '../types/enums';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export interface TokenPayload {
  userId: number;
  email: string;
  role: Role;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid authentication token');
  }
}

export async function registerCustomer(params: {
  email: string;
  password: string;
  name: string;
}) {
  const { email, password, name } = params;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    throw new BadRequestError('Email is already registered');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: Role.CUSTOMER,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    name: user.name,
  });

  return { user, token };
}

export async function loginUser(params: { email: string; password: string }) {
  const { email, password } = params;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    name: user.name,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user;
}

