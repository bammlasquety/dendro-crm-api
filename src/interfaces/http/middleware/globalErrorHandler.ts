/**
 * Interface Layer — Global Error Handler Middleware
 *
 * Maps domain / application errors to appropriate HTTP status codes.
 * Express requires the 4-arg signature for error handlers.
 */

import type { Request, Response, NextFunction } from 'express';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from '../../../application/errors/NotFoundError';

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  void _next; // mark as used for ESLint

  if (err instanceof NotFoundError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    res.status(404).json(body);
    return;
  }

  // if (err instanceof NotFoundError) {
  //   const body: ApiErrorResponse = {
  //     success: false,
  //     error: { code: err.code, message: err.message },
  //   };
  //   res.status(404).json(body);
  //   return;
  // }

  if (err instanceof ValidationError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(422).json(body);
    return;
  }

  if (err instanceof UnauthorizedError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    res.status(401).json(body);
    return;
  }

  // Unknown / unexpected errors — do not leak internals
  console.error('[Unhandled error]', err);
  const body: ApiErrorResponse = {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  };
  res.status(500).json(body);
}
