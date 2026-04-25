import { NextRequest, NextResponse } from 'next/server';
import { updateMenuData } from '@/lib/menu-assistant';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/withErrorHandler';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

export const maxDuration = 120;

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError("TIMEOUT: Der KI-Assistent hat zu lange gebraucht. Bitte versuchen Sie es erneut.", "TIMEOUT", 504));
    }, 110000);
  });

  const processPromise = async () => {
    const body = await req.json();
    const { currentData, prompt, thinkingLevel } = body;

    if (!currentData || !prompt) {
      logger.warn(`[${requestId}] Assistant API called with missing data or prompt`);
      throw new AppError('Fehlende Daten für den KI-Assistenten.', 'BAD_REQUEST', 400);
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error(`[${requestId}] Assistant API called without API key configured`);
      throw new AppError('Gemini API-Schlüssel fehlt auf dem Server.', 'UNAUTHORIZED', 401);
    }

    const tLevel = thinkingLevel || 'BALANCED';
    logger.info(`[${requestId}] Starting assistant update with prompt: "${prompt.substring(0, 50)}...", thinkingLevel: ${tLevel}`);
    const { data: updatedData, usage } = await updateMenuData(currentData, prompt, apiKey, tLevel);
    logger.info(`[${requestId}] Assistant update completed successfully. Total tokens: ${usage?.totalTokenCount || 0}`);

    return NextResponse.json({ success: true, data: updatedData, usage });
  };

  return await Promise.race([processPromise(), timeoutPromise]);
});
