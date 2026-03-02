export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  timestamp: string;
}

export class AppErrorFactory {
  static create(code: string, message: string, details?: any): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  static badRequest(message: string = "Ungültige Anfrage", details?: any): AppError {
    return this.create("BAD_REQUEST", message, details);
  }

  static unauthorized(message: string = "Nicht autorisiert"): AppError {
    return this.create("UNAUTHORIZED", message);
  }

  static apiError(message: string = "API-Fehler", details?: any): AppError {
    return this.create("API_ERROR", message, details);
  }

  static timeout(message: string = "Zeitüberschreitung"): AppError {
    return this.create("TIMEOUT", message);
  }

  static internal(message: string = "Interner Serverfehler", details?: any): AppError {
    return this.create("INTERNAL_ERROR", message, details);
  }
}

export function createErrorResponse(code: string, message: string, details?: any): ApiResponse {
  return {
    success: false,
    error: AppErrorFactory.create(code, message, details),
    timestamp: new Date().toISOString(),
  };
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message?.toLowerCase() || "";
      const statusCode = error?.status || error?.response?.status;
      
      const isRetryable = 
        statusCode === 429 || 
        statusCode === 500 || 
        statusCode === 503 ||
        errorMessage.includes("429") || 
        errorMessage.includes("500") || 
        errorMessage.includes("503") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("overloaded");

      if (!isRetryable || i === retries - 1) {
        throw error;
      }

      if (onRetry) onRetry(i + 1, error);
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw lastError;
}

/**
 * Helper to perform a fetch with a timeout.
 */
export async function fetchWithTimeout(
  resource: string | Request,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, signal, ...rest } = options; // Default 30s timeout

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // If a signal was provided, link it to our controller
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(resource, {
      ...rest,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Zeitüberschreitung bei der Anfrage. Bitte versuchen Sie es erneut.');
    }
    throw error;
  }
}
