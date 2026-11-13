import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. AppError (domain & business logic errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request payload validation failed',
      details,
    });
  }

  // 3. Multer Upload Error
  if (err instanceof MulterError) {
    let message = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum allowed limit of 5 MB.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded. Maximum allowed is 5 files.';
    }

    return res.status(400).json({
      code: 'FILE_UPLOAD_ERROR',
      message,
      details: [{ field: err.field, message: err.message, code: err.code }],
    });
  }

  // 4. JSON Syntax Error
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      code: 'INVALID_JSON',
      message: 'Malformed JSON payload in request body',
      details: [],
    });
  }

  // 5. Fallback Internal Server Error
  console.error('Unhandled server error:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: isProduction ? 'An unexpected internal error occurred' : err.message || 'Internal server error',
    details: [],
  });
}

