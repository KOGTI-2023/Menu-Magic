import { NextRequest, NextResponse } from 'next/server';
import { extractMenuData } from '@/lib/gemini';
import { createErrorResponse } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export const maxDuration = 60; // Allow longer execution for Gemini API

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { images, model, detailLevel } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      logger.warn('Analyze API called without images');
      return NextResponse.json(
        createErrorResponse('BAD_REQUEST', 'Keine Bilder für die Analyse bereitgestellt.'),
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error('Analyze API called without API key configured');
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Gemini API-Schlüssel fehlt auf dem Server.'),
        { status: 401 }
      );
    }

    logger.info(`Starting menu extraction with model: ${model || 'gemini-3.1-pro-preview'} and detailLevel: ${detailLevel || 'standard'}`);
    const data = await extractMenuData(images, model || 'gemini-3.1-pro-preview', apiKey, detailLevel || 'standard');
    logger.info('Menu extraction completed successfully');

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error('API Route Error (/api/analyze):', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', error.message || 'Fehler bei der Server-Analyse', error),
      { status: 500 }
    );
  }
}
