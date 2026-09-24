/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Lightbulb } from 'lucide-react';
import { Diagnostic } from '../compiler/types';

interface DiagnosticBannerProps {
  diagnostics: Diagnostic[];
  sql: string;
}

export const DiagnosticBanner: React.FC<DiagnosticBannerProps> = ({ diagnostics, sql }) => {
  if (!diagnostics || diagnostics.length === 0) return null;

  const errors = diagnostics.filter(d => d.severity === 'ERROR');
  const warnings = diagnostics.filter(d => d.severity === 'WARNING');

  if (errors.length === 0 && warnings.length === 0) return null;

  const sqlLines = sql.split('\n');

  return (
    <div className="space-y-3">
      {/* Error / Warning Alert Cards */}
      {diagnostics.map((diag, index) => {
        const isError = diag.severity === 'ERROR';
        const isWarning = diag.severity === 'WARNING';

        const lineText = sqlLines[diag.line - 1] || '';
        const pointerSpaces = ' '.repeat(Math.max(0, diag.column - 1));

        return (
          <div
            key={index}
            className={`p-4 rounded-xl border font-sans transition shadow-md ${
              isError
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                : isWarning
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                : 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isError
                      ? 'bg-rose-900/60 border-rose-700 text-rose-300'
                      : 'bg-amber-900/60 border-amber-700 text-amber-300'
                  }`}
                >
                  {diag.stage} {diag.severity}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Line {diag.line}, Col {diag.column}
                </span>
              </div>

              {diag.rule && (
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  [{diag.rule}]
                </span>
              )}
            </div>

            {/* Error Message */}
            <p className="text-xs sm:text-sm font-medium mt-2 text-slate-200">
              {diag.message}
            </p>

            {/* Visual Code Snippet with Error Pointer (^) */}
            {lineText && (
              <div className="mt-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-900 font-mono text-xs overflow-x-auto">
                <div className="text-slate-400">
                  <span className="text-slate-600 select-none mr-2">{diag.line} |</span>
                  {lineText}
                </div>
                <div className="text-rose-400 font-bold">
                  <span className="text-transparent select-none mr-2">{diag.line} |</span>
                  {pointerSpaces}
                  <span className="animate-bounce inline-block">^</span>
                  <span className="text-[10px] text-rose-300/80 ml-1.5 font-sans font-normal">
                    error encountered here
                  </span>
                </div>
              </div>
            )}

            {/* Actionable Suggestion */}
            {diag.suggestion && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-900/60">
                <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  <strong>Suggestion:</strong> {diag.suggestion}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
