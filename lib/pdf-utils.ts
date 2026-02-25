export interface OptimizationOptions {
  intensity: 'low' | 'medium' | 'high';
  deskew: boolean;
  grayscale: boolean;
}

export async function convertPdfToImages(
  file: File, 
  options: OptimizationOptions = { intensity: 'medium', deskew: true, grayscale: true }
): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
    
    if (!context) throw new Error('Could not create canvas context');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

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
}
