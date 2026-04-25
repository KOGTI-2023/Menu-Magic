'use client';

import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-2">
          <FileQuestion className="h-8 w-8 text-zinc-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">404 - Nicht gefunden</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Die gesuchte Seite oder Ressource existiert nicht. Möglicherweise wurde die URL falsch eingegeben oder der Inhalt wurde verschoben.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            asChild
            className="bg-indigo-600 hover:bg-indigo-500 w-full"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
