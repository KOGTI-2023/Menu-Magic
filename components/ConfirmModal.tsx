"use client"

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export interface Warning {
  page: number;
  severity: 'warning' | 'error';
  code: string;
  message: string;
  recommendedAction: string;
}

export interface Thumbnail {
  page: number;
  url: string;
  issues: string[];
}

export interface Config {
  model: string;
  detailLevel: string;
  style: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: Config;
  onConfigChange: (config: Config) => void;
  warnings: Warning[];
  thumbnails: Thumbnail[];
  onConfirm: (override: boolean, savePreset: boolean, presetScope: 'session' | 'device' | 'account') => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  onOpenChange,
  config,
  onConfigChange,
  warnings,
  thumbnails,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [savePreset, setSavePreset] = useState(false);
  const [presetScope, setPresetScope] = useState<'session' | 'device' | 'account'>('device');

  const hasBlockingError = warnings.some(w => w.severity === 'error');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSavePreset(false);
      setPresetScope('device');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Einstellungen bestätigen</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Bitte überprüfen Sie die Konfiguration vor der Optimierung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Config Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">KI-Modell</Label>
              <Select value={config.model} onValueChange={(v) => onConfigChange({ ...config, model: v })}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="gemini-2.5-flash-lite">Flash Lite (Schnell)</SelectItem>
                  <SelectItem value="gemini-2.5-flash">Flash (Ausgewogen)</SelectItem>
                  <SelectItem value="gemini-3.1-pro-preview">Pro (Beste Qualität)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Detailstufe</Label>
              <Select value={config.detailLevel} onValueChange={(v) => onConfigChange({ ...config, detailLevel: v })}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="standard">Standard (Originalgetreu)</SelectItem>
                  <SelectItem value="high">Hoch (Appetitanregend)</SelectItem>
                  <SelectItem value="premium">Premium (Hochglanz)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Stil</Label>
              <Select value={config.style} onValueChange={(v) => onConfigChange({ ...config, style: v })}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="original">Original (Restauration)</SelectItem>
                  <SelectItem value="modern">Modern (Minimalistisch)</SelectItem>
                  <SelectItem value="classic">Klassisch (Elegant)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thumbnails */}
          {thumbnails.length > 0 && (
            <div className="space-y-2">
              <Label className="text-zinc-400">Vorschau & Probleme</Label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
                {thumbnails.map((thumb) => {
                  const hasError = warnings.some(w => w.page === thumb.page && w.severity === 'error');
                  const hasWarning = warnings.some(w => w.page === thumb.page && w.severity === 'warning');
                  
                  return (
                    <div key={thumb.page} className="relative flex-shrink-0 w-20 h-28 rounded-md overflow-hidden border border-zinc-800">
                      <Image src={thumb.url} alt={`Page ${thumb.page}`} fill className="object-cover opacity-80" referrerPolicy="no-referrer" />
                      <div className="absolute top-1 right-1 flex gap-1">
                        {hasError && <XCircle className="h-4 w-4 text-red-500 bg-black/50 rounded-full" />}
                        {!hasError && hasWarning && <AlertTriangle className="h-4 w-4 text-amber-500 bg-black/50 rounded-full" />}
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-center py-0.5 text-zinc-300">
                        S. {thumb.page}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {warnings.map((w, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm flex gap-3 ${
                  w.severity === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                }`}>
                  {w.severity === 'error' ? <XCircle className="h-5 w-5 shrink-0 text-red-400" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />}
                  <div>
                    <p className="font-medium">{w.message}</p>
                    {w.recommendedAction && <p className="opacity-80 mt-1 text-xs">{w.recommendedAction}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preset Option */}
          <div className="flex items-start space-x-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
            <Checkbox 
              id="save-preset" 
              checked={savePreset} 
              onCheckedChange={(c) => setSavePreset(c as boolean)} 
              className="mt-1"
            />
            <div className="space-y-2 flex-1">
              <Label htmlFor="save-preset" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300">
                Als Preset speichern
              </Label>
              {savePreset && (
                <Select value={presetScope} onValueChange={(v: any) => setPresetScope(v)}>
                  <SelectTrigger className="h-8 text-xs bg-zinc-950 border-zinc-800 w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300 text-xs">
                    <SelectItem value="session">Session (Nur jetzt)</SelectItem>
                    <SelectItem value="device">Gerät (Lokal speichern)</SelectItem>
                    <SelectItem value="account">Account (Cloud)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            Einstellungen bearbeiten
          </Button>
          
          {hasBlockingError ? (
            <Button 
              variant="destructive" 
              onClick={() => onConfirm(true, savePreset, presetScope)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Trotzdem bestätigen
            </Button>
          ) : (
            <Button 
              onClick={() => onConfirm(false, savePreset, presetScope)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Speichern & Weiter
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
