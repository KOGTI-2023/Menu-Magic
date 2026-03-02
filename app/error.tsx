'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Global Error Boundary caught an error:', error);
    console.error('Error context:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Hoppla! Etwas ist schiefgelaufen.</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Ein unerwarteter Fehler ist aufgetreten. Keine Sorge, deine Daten sind sicher.
          </p>
        </div>

        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left overflow-hidden">
          <p className="text-xs font-mono text-zinc-500 break-all">
            {error.message || "Unbekannter Fehler"}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="bg-indigo-600 hover:bg-indigo-500 w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen (Retry)
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Zur Startseite
          </Button>
        </div>
        
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
          Fehlercode: NEXT_CRASH_{new Date().getTime().toString(36).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
