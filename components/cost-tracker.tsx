'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

// Pricing for Gemini 1.5 Pro (approximate, per 1M tokens)
// Input: $1.25, Output: $3.75
const COST_PER_1M_INPUT = 1.25;
const COST_PER_1M_OUTPUT = 3.75;

export function CostTracker({ usage, sessionUsage, isProcessing }: { usage: TokenUsage, sessionUsage: TokenUsage, isProcessing: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const calculateCost = (u: TokenUsage) => {
    const inputCost = (u.promptTokenCount / 1000000) * COST_PER_1M_INPUT;
    const outputCost = (u.candidatesTokenCount / 1000000) * COST_PER_1M_OUTPUT;
    return (inputCost + outputCost).toFixed(4);
  };

  const currentCost = calculateCost(usage);
  const totalCost = calculateCost(sessionUsage);
  const totalCostNum = parseFloat(totalCost);
  const warningThreshold = parseFloat(process.env.NEXT_PUBLIC_COST_WARNING_THRESHOLD || "0.50");
  const isWarning = totalCostNum >= warningThreshold;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={cn(
        "bg-zinc-900/80 backdrop-blur-md border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
        isWarning ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "border-white/10"
      )}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Coins className={`w-4 h-4 ${isProcessing ? 'text-amber-400 animate-pulse' : isWarning ? 'text-amber-500' : 'text-indigo-400'}`} />
            <span className={isWarning ? 'text-amber-400' : ''}>Cost: ${totalCost}</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 ml-2 opacity-50" /> : <ChevronDown className="w-4 h-4 ml-2 opacity-50" />}
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3 pt-1 border-t border-white/5 text-[10px] text-zinc-400 space-y-2"
            >
              <div className="flex justify-between">
                <span>Last Request:</span>
                <span className="text-zinc-200">${currentCost}</span>
              </div>
              <div className="flex justify-between">
                <span>Input Tokens:</span>
                <span className="text-zinc-200">{sessionUsage.promptTokenCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Output Tokens:</span>
                <span className="text-zinc-200">{sessionUsage.candidatesTokenCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium text-indigo-300 pt-1 border-t border-white/5">
                <span>Total Tokens:</span>
                <span>{sessionUsage.totalTokenCount.toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
