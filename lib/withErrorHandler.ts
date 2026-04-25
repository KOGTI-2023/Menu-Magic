import { NextResponse } from 'next/server';
import { normalizeError } from './errors';
import { logger } from './logger';

export function withErrorHandler(handler: Function) {
  return async function (...args: any[]) {
    try {
      return await handler(...args);
    } catch (error) {
      const appError = normalizeError(error);

      // Log the structured error
      logger.error('API Error:', {
        message: appError.message,
        code: appError.code,
        statusCode: appError.statusCode,
        stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined,
      });

      // Avoid leaking internal error details in production unless it is an operational error
      const isProduction = process.env.NODE_ENV === 'production';
      const safeMessage = (isProduction && !appError.isOperational) 
        ? 'Ein interner Serverfehler ist aufgetreten.' 
        : appError.message;

      return NextResponse.json(
        {
          success: false,
          error: {
            message: safeMessage,
            code: appError.code,
            statusCode: appError.statusCode,
          },
        },
        { status: appError.statusCode }
      );
    }
  };
}
