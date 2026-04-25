export class AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Ungültige Anfrage') {
    super(message, 'BAD_REQUEST', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource nicht gefunden') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Nicht autorisiert') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500, false);
  }
  
  return new AppError(String(error) || 'Unbekannter Fehler', 'UNKNOWN_ERROR', 500, false);
}
