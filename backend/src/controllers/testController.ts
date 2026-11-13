import { Request, Response } from 'express';
import { execSync } from 'child_process';
import path from 'path';
import { ForbiddenError } from '../utils/errors';

export async function resetDatabase(_req: Request, res: Response) {
  const allowed =
    process.env.ALLOW_TEST_ROUTES === 'true' || process.env.NODE_ENV === 'test';

  if (!allowed) {
    throw new ForbiddenError('Test utility routes are disabled in this environment.');
  }

  const root = path.resolve(__dirname, '../../');
  execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit', cwd: root });

  res.status(200).json({
    message: 'Test database reset and re-seeded successfully with baseline dataset.',
  });
}

export async function seedDatabase(_req: Request, res: Response) {
  const allowed =
    process.env.ALLOW_TEST_ROUTES === 'true' || process.env.NODE_ENV === 'test';

  if (!allowed) {
    throw new ForbiddenError('Test utility routes are disabled in this environment.');
  }

  const root = path.resolve(__dirname, '../../');
  execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit', cwd: root });

  res.status(200).json({
    message: 'Test database seeded successfully.',
  });
}

