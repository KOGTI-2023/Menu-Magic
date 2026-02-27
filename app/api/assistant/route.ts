import { NextRequest, NextResponse } from 'next/server';
import { updateMenuData } from '@/lib/gemini';
import { createErrorResponse } from '@/lib/error-handler';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentData, prompt } = body;

    if (!currentData || !prompt) {
      return NextResponse.json(
        createErrorResponse('BAD_REQUEST', 'Fehlende Daten für den KI-Assistenten.'),
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

    const updatedData = await updateMenuData(currentData, prompt, apiKey);

    return NextResponse.json({ success: true, data: updatedData });
  } catch (error: any) {
    console.error('API Route Error (/api/assistant):', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', error.message || 'Fehler beim KI-Assistenten', error),
      { status: 500 }
    );
  }
}
