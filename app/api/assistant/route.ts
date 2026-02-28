import { NextRequest, NextResponse } from 'next/server';
import { updateMenuData } from '@/lib/gemini';
import { createErrorResponse } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const requestId = crypto.randomUUID();
    const body = await req.json();
    const { currentData, prompt, thinkingLevel } = body;

    if (!currentData || !prompt) {
      logger.warn(`[${requestId}] Assistant API called with missing data or prompt`);
      return NextResponse.json(
        createErrorResponse('BAD_REQUEST', 'Fehlende Daten für den KI-Assistenten.'),
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error(`[${requestId}] Assistant API called without API key configured`);
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Gemini API-Schlüssel fehlt auf dem Server.'),
        { status: 401 }
      );
    }

    const tLevel = thinkingLevel || 'BALANCED';
    logger.info(`[${requestId}] Starting assistant update with prompt: "${prompt.substring(0, 50)}...", thinkingLevel: ${tLevel}`);
    const { data: updatedData, usage } = await updateMenuData(currentData, prompt, apiKey, tLevel);
    logger.info(`[${requestId}] Assistant update completed successfully. Total tokens: ${usage?.totalTokenCount || 0}`);

    return NextResponse.json({ success: true, data: updatedData, usage });
  } catch (error: any) {
    logger.error('API Route Error (/api/assistant):', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', error.message || 'Fehler beim KI-Assistenten', error),
      { status: 500 }
    );
  }
}
