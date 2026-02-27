import { NextRequest, NextResponse } from 'next/server';
import { updateMenuData } from '@/lib/gemini';
import { createErrorResponse } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentData, prompt } = body;

    if (!currentData || !prompt) {
      logger.warn('Assistant API called with missing data or prompt');
      return NextResponse.json(
        createErrorResponse('BAD_REQUEST', 'Fehlende Daten für den KI-Assistenten.'),
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error('Assistant API called without API key configured');
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Gemini API-Schlüssel fehlt auf dem Server.'),
        { status: 401 }
      );
    }

    logger.info(`Starting assistant update with prompt: "${prompt.substring(0, 50)}..."`);
    const updatedData = await updateMenuData(currentData, prompt, apiKey);
    logger.info('Assistant update completed successfully');

    return NextResponse.json({ success: true, data: updatedData });
  } catch (error: any) {
    logger.error('API Route Error (/api/assistant):', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', error.message || 'Fehler beim KI-Assistenten', error),
      { status: 500 }
    );
  }
}
