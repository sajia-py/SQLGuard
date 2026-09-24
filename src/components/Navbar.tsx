/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Database,
  BookOpen,
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Sparkles,
} from 'lucide-react';
import { SecurityReport } from '../compiler/types';

interface NavbarProps {
  securityReport: SecurityReport | null;
  onOpenSchema: () => void;
  onOpenGuide: () => void;
  onExportReport: () => void;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  securityReport,
  onOpenSchema,
  onOpenGuide,
  onExportReport,
  onOpenChat,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
                SQLGuard
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                Compiler & SecAnalyzer
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Lexer • Parser • AST • Symbol Table • SQLi Guard • TAC IR • Optimizer • Engine
            </p>
          </div>
        </div>

        {/* Security Indicator & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Real-time Security Badge */}
          {securityReport && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                securityReport.status === 'SAFE'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : securityReport.status === 'WARNING'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                  : 'bg-rose-950/70 text-rose-300 border-rose-800/80 animate-pulse'
              }`}
            >
              {securityReport.status === 'SAFE' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : securityReport.status === 'WARNING' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span>Security Score: {securityReport.score}/100</span>
            </div>
          )}

          {/* Database Schema Button */}
          <button
            onClick={onOpenSchema}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition shadow-sm"
            title="Inspect Database Schema & Tables"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">DB Schema</span>
          </button>

          {/* Compiler Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition shadow-sm"
            title="Compiler Construction Concepts & Grammar Rules"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Grammar & Guide</span>
          </button>

          {/* AI Compiler Tutor Button */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-200 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/80 transition shadow-sm cursor-pointer group"
            title="Open Free AI Compiler Tutor"
          >
            <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">AI Tutor</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </button>

          {/* Export Report */}
          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 transition shadow-md shadow-indigo-500/20"
            title="Export Query Analysis Report (Submission Ready)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
