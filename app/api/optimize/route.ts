import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/withErrorHandler';
import { AppError } from '@/lib/errors';

// POST /api/optimize
// Handles the actual optimization process after confirmation.
export const POST = withErrorHandler(async function POST(req: Request) {
  const body = await req.json();
  const { confirmedConfig, userAcceptedWarnings, overrideCritical } = body;

  // API & Flow Gating: MUST require confirmation flag
  if (!confirmedConfig || typeof userAcceptedWarnings !== 'boolean') {
    throw new AppError("Konfiguration wurde nicht bestätigt oder Bestätigungs-Flag fehlt", "UNCONFIRMED_CONFIG", 400);
  }

  logger.info('Starting optimization with config:', confirmedConfig);

  // Simulate a long-running optimization process (e.g., 5 seconds)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Return success
  return NextResponse.json({
    success: true,
    data: {
      message: 'Optimierung erfolgreich abgeschlossen.',
      resultUrl: '/preview',
    },
    timestamp: new Date().toISOString(),
  });
});
