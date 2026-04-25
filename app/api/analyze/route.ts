import { NextRequest, NextResponse } from 'next/server';
import { extractMenuData, MenuData } from '@/lib/gemini';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/withErrorHandler';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

export const maxDuration = 300; // Allow up to 5 minutes for Gemini API

function mergeMenuData(target: MenuData, source: MenuData) {
  if (!target.restaurantName && source.restaurantName) target.restaurantName = source.restaurantName;
  if (!target.subtitle && source.subtitle) target.subtitle = source.subtitle;
  
  if (source.footer) {
    if (!target.footer) target.footer = { ...source.footer };
    else {
      if (source.footer.additives) target.footer.additives = (target.footer.additives ? target.footer.additives + ' ' : '') + source.footer.additives;
      if (source.footer.allergens) target.footer.allergens = (target.footer.allergens ? target.footer.allergens + ' ' : '') + source.footer.allergens;
    }
  }

  for (const sourceCat of source.categories) {
    if (sourceCat.category === "Fehler bei der Analyse") continue;
    const existingCat = target.categories.find(c => c.category === sourceCat.category);
    if (existingCat) {
      existingCat.items.push(...sourceCat.items);
    } else {
      target.categories.push(sourceCat);
    }
  }
}

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  
  // Create a timeout promise that rejects after 180 seconds (3 minutes)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError("TIMEOUT: Die KI-Analyse hat zu lange gedauert (über 3 Minuten). Bitte versuchen Sie es erneut.", "TIMEOUT", 504));
    }, 180000);
  });

  const processPromise = async () => {
    const body = await req.json();
    const { images, model, detailLevel, thinkingLevel } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      logger.warn(`[${requestId}] Analyze API called without images`);
      throw new AppError('Keine Bilder für die Analyse bereitgestellt.', 'BAD_REQUEST', 400);
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error(`[${requestId}] Analyze API called without API key configured`);
      throw new AppError('Gemini API-Schlüssel fehlt auf dem Server.', 'UNAUTHORIZED', 401);
    }

    const tLevel = thinkingLevel || 'BALANCED';
    logger.info(`[${requestId}] Starting menu extraction with model: ${model || 'gemini-3.1-pro-preview'}, detailLevel: ${detailLevel || 'standard'}, thinkingLevel: ${tLevel}, pages: ${images.length}`);
    
    const BATCH_SIZE = 5;
    let finalData: MenuData | null = null;
    let totalUsage = { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };

    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batchImages = images.slice(i, i + BATCH_SIZE);
      logger.info(`[${requestId}] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(images.length / BATCH_SIZE)}`);
      
      try {
        const { data, usage } = await extractMenuData(batchImages, model || 'gemini-3.1-pro-preview', apiKey, detailLevel || 'standard', tLevel);
        
        if (usage) {
          totalUsage.promptTokenCount += usage.promptTokenCount || 0;
          totalUsage.candidatesTokenCount += usage.candidatesTokenCount || 0;
          totalUsage.totalTokenCount += usage.totalTokenCount || 0;
        }

        if (data.processingDecision) {
          logger.info(`[${requestId}] Batch decision: ${data.processingDecision}`);
        }

        if (!finalData) {
          finalData = data;
        } else {
          mergeMenuData(finalData, data);
        }
        logger.info(`[${requestId}] Batch ${Math.floor(i / BATCH_SIZE) + 1} completed successfully`);
      } catch (batchError) {
        logger.error(`[${requestId}] Partial failure recovery: Batch ${Math.floor(i / BATCH_SIZE) + 1} failed`, batchError);
        // Continue with next batch instead of failing the whole process
      }
    }

    if (!finalData) {
      throw new AppError("Alle Batches sind fehlgeschlagen.", "INTERNAL_ERROR", 500);
    }

    logger.info(`[${requestId}] Menu extraction completed successfully. Total tokens: ${totalUsage.totalTokenCount}`);

    return NextResponse.json({ success: true, data: finalData, usage: totalUsage });
  };

  return await Promise.race([processPromise(), timeoutPromise]);
});
