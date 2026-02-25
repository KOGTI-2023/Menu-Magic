export interface OptimizationOptions {
  intensity: 'low' | 'medium' | 'high';
  deskew: boolean;
  rotationAngle: number;
  grayscale: boolean;
}

export async function convertPdfToImages(
  file: File, 
  options: OptimizationOptions = { intensity: 'medium', deskew: true, rotationAngle: 0, grayscale: true }
): Promise<string[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const images: string[] = [];

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
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.5 }); // Higher scale for better quality

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Konnte keinen Canvas-Kontext erstellen.');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (options.rotationAngle !== 0) {
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate((options.rotationAngle * Math.PI) / 180);
        context.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Apply filters based on intensity
      const contrast = contrastMap[options.intensity];
      const brightness = brightnessMap[options.intensity];
      const grayscale = options.grayscale ? 'grayscale(1)' : '';
      
      context.filter = `contrast(${contrast}) brightness(${brightness}) ${grayscale} sharp(1.2)`;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };

      await page.render(renderContext).promise;
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const base64Data = dataUrl.split(',')[1];
      images.push(base64Data);
    }

    return images;
  } catch (error) {
    console.error("Error converting PDF to images:", error);
    throw new Error(`Fehler bei der PDF-Verarbeitung: ${error instanceof Error ? error.message : String(error)}`);
  }
}
