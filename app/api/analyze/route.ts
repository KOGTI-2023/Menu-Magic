import { NextRequest, NextResponse } from 'next/server';
import { extractMenuData } from '@/lib/gemini';
import { createErrorResponse } from '@/lib/error-handler';

export const maxDuration = 60; // Allow longer execution for Gemini API

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { images, model, detailLevel } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        createErrorResponse('BAD_REQUEST', 'Keine Bilder für die Analyse bereitgestellt.'),
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Gemini API-Schlüssel fehlt auf dem Server.'),
        { status: 401 }
      );
    }

    const data = await extractMenuData(images, model || 'gemini-3.1-pro-preview', apiKey, detailLevel || 'standard');

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Route Error (/api/analyze):', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', error.message || 'Fehler bei der Server-Analyse', error),
      { status: 500 }
    );
  }
}
