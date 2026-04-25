import { AppError } from './errors';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

export async function safeFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...restOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...restOptions,
      signal: controller.signal,
    });
    
    clearTimeout(id);

    // Parse JSON safely
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e: any) {
        throw new AppError(`Fehler beim Verarbeiten der Serverantwort: ${e.message}`, 'PARSE_ERROR', response.status, true);
      }
    } else {
      const text = await response.text().catch(() => 'No text');
      console.warn(`Unexpected non-JSON response from ${url}:`, text.substring(0, 500));
      
      if (response.ok) {
        // AI Studio Dev Environment proxy sometimes returns HTML loading screens with 200 OK
        if (text.includes("wait") || text.includes("starting") || text.includes("<html")) {
          throw new AppError("Der Server startet gerade neu oder ist ausgelastet. Bitte warten Sie einen Moment und versuchen Sie es erneut.", "SERVER_BUSY", 503, true);
        }
        
        // Just try parsing as JSON anyway in case the header was missing/mutated
        try {
          data = JSON.parse(text);
        } catch (e: any) {
          throw new AppError(`Unerwartetes Format: ${contentType || 'None'}. Snippet: ${text.substring(0, 100)}`, 'UNEXPECTED_FORMAT', response.status, true);
        }
      } else {
        throw new AppError(text.substring(0, 200) || 'Serverfehler ohne Fehlermeldung', 'SERVER_ERROR', response.status, true);
      }
    }

    if (!response.ok) {
      // Find error message
      const errorMessage = data?.error?.message 
        || data?.message 
        || data?.error 
        || `HTTP Fehler ${response.status} (${response.statusText}). Content-Type war: ${contentType}`;
      
      const errorCode = data?.error?.code || 'API_ERROR';
      
      throw new AppError(errorMessage, errorCode, response.status, true);
    }

    // Return the response data (or just raw text/blob if not json, though typically API returns JSON)
    return data !== undefined ? data as T : response as unknown as T;
  } catch (error: any) {
    clearTimeout(id);
    
    if (error.name === 'AbortError') {
      throw new AppError('Zeitüberschreitung bei der Anfrage.', 'TIMEOUT', 408, true);
    }
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(error.message || 'Netzwerkfehler aufgetreten', 'NETWORK_ERROR', 0, true);
  }
}
