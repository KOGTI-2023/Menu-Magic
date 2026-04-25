import { logger } from './logger';
import { AppError } from './errors';

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
      const statusCode = error?.statusCode || error?.status || error?.response?.status;
      
      const isRetryable = 
        statusCode === 429 || 
        statusCode === 500 || 
        statusCode === 502 ||
        statusCode === 503 ||
        statusCode === 504 ||
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

      if (onRetry) {
        onRetry(i + 1, error);
      } else {
        logger.warn(`Retrying operation... attempt ${i + 1} of ${retries}`);
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw lastError;
}
