import { NextResponse } from 'next/server';
import { createErrorResponse, AppErrorFactory } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// POST /api/upload
// Handles file upload, runs server-side validations, and returns structured warnings.
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        createErrorResponse("INVALID_CONTENT_TYPE", "Erwartet multipart/form-data"),
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(createErrorResponse("MISSING_FILE", "Keine Datei bereitgestellt"), { status: 400 });
    }

    // Mocking server-side validations
    const warnings = [];

    // Simulate a non-blocking warning (e.g., low DPI)
    warnings.push({
      page: 1,
      severity: 'warning',
      code: 'LOW_DPI',
      message: 'Für Premium (Hochglanz) empfehlen wir ≥ 300 DPI. Aktuell: 150 DPI.',
      recommendedAction: 'Laden Sie einen höher auflösenden Scan hoch, falls möglich.',
    });

    const isCorrupted = Math.random() < 0.1;
    if (isCorrupted) {
      warnings.push({
        page: 0,
        severity: 'error',
        code: 'FILE_CORRUPTED',
        message: 'PDF ist passwortgeschützt oder beschädigt. Optimierung nicht möglich, es sei denn, Sie wählen \'Trotzdem bestätigen\' (Risiko: schlechte Ausgabe).',
        recommendedAction: 'Entfernen Sie den Passwortschutz oder bestätigen Sie trotzdem.',
      });
    }

    const thumbnails = [
      { page: 1, url: 'https://picsum.photos/seed/page1/150/200', issues: ['LOW_DPI'] },
      { page: 2, url: 'https://picsum.photos/seed/page2/150/200', issues: [] },
    ];

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        warnings,
        thumbnails,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Upload error:', error);
    return NextResponse.json(createErrorResponse("UPLOAD_FAILED", "Fehler bei der Analyse des Uploads", error.message), { status: 500 });
  }
}
