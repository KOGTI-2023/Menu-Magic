import { logger } from "./logger";

export interface OptimizationOptions {
  intensity: 'low' | 'medium' | 'high';
  deskew: boolean;
  rotationAngle: number;
  grayscale: boolean;
}

export interface ProcessedImages {
  original: string;
  optimized: string;
}

export async function convertPdfToImages(
  file: File, 
  options: OptimizationOptions = { intensity: 'medium', deskew: true, rotationAngle: 0, grayscale: true },
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedImages[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // File size check (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Die Datei ist zu groß (maximal 20MB erlaubt).');
    }
    
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use a more robust way to set the worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const results: ProcessedImages[] = [];

    const contrastMap = {
      low: '1.1',
      medium: '1.4',
      high: '1.8'
    };

    const brightnessMap = {
      low: '1.0',
      medium: '1.1',
      high: '1.2'
    };

    for (let i = 1; i <= numPages; i++) {
      if (onProgress) onProgress(i, numPages);
      
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.5 }); // Higher scale for better quality

      // 1. Render Original
      const originalCanvas = document.createElement('canvas');
      const originalContext = originalCanvas.getContext('2d');
      if (!originalContext) throw new Error('Konnte keinen Canvas-Kontext für Original erstellen.');
      
      originalCanvas.height = viewport.height;
      originalCanvas.width = viewport.width;
      
      await page.render({
        canvasContext: originalContext,
        viewport: viewport,
      }).promise;
      
      const originalDataUrl = originalCanvas.toDataURL('image/jpeg', 0.8);
      const originalBase64 = originalDataUrl.split(',')[1];

      // 2. Render Optimized
      const optimizedCanvas = document.createElement('canvas');
      const optimizedContext = optimizedCanvas.getContext('2d');
      if (!optimizedContext) throw new Error('Konnte keinen Canvas-Kontext für Optimierung erstellen.');

      optimizedCanvas.height = viewport.height;
      optimizedCanvas.width = viewport.width;

      if (options.rotationAngle !== 0) {
        optimizedContext.translate(optimizedCanvas.width / 2, optimizedCanvas.height / 2);
        optimizedContext.rotate((options.rotationAngle * Math.PI) / 180);
        optimizedContext.translate(-optimizedCanvas.width / 2, -optimizedCanvas.height / 2);
      }

      // Apply filters based on intensity
      const contrast = contrastMap[options.intensity];
      const brightness = brightnessMap[options.intensity];
      const grayscale = options.grayscale ? 'grayscale(1)' : '';
      
      optimizedContext.filter = `contrast(${contrast}) brightness(${brightness}) ${grayscale} sharp(1.2)`;

      await page.render({
        canvasContext: optimizedContext,
        viewport: viewport,
      }).promise;
      
      const optimizedDataUrl = optimizedCanvas.toDataURL('image/jpeg', 0.9);
      const optimizedBase64 = optimizedDataUrl.split(',')[1];

      results.push({
        original: originalBase64,
        optimized: optimizedBase64
      });
    }

    return results;
  } catch (error) {
    logger.error("Error converting PDF to images:", error);
    throw new Error(`Fehler bei der PDF-Verarbeitung: ${error instanceof Error ? error.message : String(error)}`);
  }
}
