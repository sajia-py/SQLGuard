/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronDown,
  Terminal,
  Layers,
  Search,
} from 'lucide-react';
import { QUERY_PRESETS, QueryPreset } from '../compiler/presets';

interface SqlEditorProps {
  sql: string;
  onChange: (val: string) => void;
  onAnalyze: () => void;
  isCompiling: boolean;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({
  sql,
  onChange,
  onAnalyze,
  isCompiling,
}) => {
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scrolling between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onAnalyze();
    }
  };

  const lineCount = Math.max(1, sql.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleFormat = () => {
    // Basic standard SQL formatter
    const formatted = sql
      .replace(/\s+/g, ' ')
      .replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|LIMIT|JOIN|INNER JOIN|LEFT JOIN|ON)\b/gi, '\n$1')
      .trim();
    onChange(formatted);
  };

  const filteredPresets = QUERY_PRESETS.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.query.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Editor Header & Preset Selector */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-300">
            SQL Input Buffer
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            ({lineCount} {lineCount === 1 ? 'line' : 'lines'}, {sql.length} chars)
          </span>
        </div>

        {/* Quick Presets Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Test Case ({QUERY_PRESETS.length})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showPresetsDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[480px] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
              {/* Filter Tabs */}
              <div className="p-2 border-b border-slate-800 bg-slate-950/50 flex flex-col gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search test queries..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                  {['ALL', 'VALID', 'SYNTAX_ERROR', 'SEMANTIC_ERROR', 'SECURITY_ATTACK', 'OPTIMIZATION'].map(
                    cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 rounded-md whitespace-nowrap transition font-medium ${
                          selectedCategory === cat
                            ? 'bg-cyan-500 text-slate-950 font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Presets List */}
              <div className="overflow-y-auto p-2 space-y-1.5 max-h-80">
                {filteredPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onChange(preset.query);
                      setShowPresetsDropdown(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300">
                        {preset.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          preset.category === 'VALID'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : preset.category === 'SECURITY_ATTACK'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : preset.category === 'OPTIMIZATION'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {preset.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{preset.description}</p>
                    <pre className="text-[10px] text-cyan-400/80 font-mono bg-slate-950/60 p-1 rounded overflow-hidden text-ellipsis whitespace-nowrap">
                      {preset.query.replace(/\n/g, ' ')}
                    </pre>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Textarea with Line Numbers */}
      <div className="relative flex min-h-[160px] max-h-[260px] bg-slate-950 font-mono text-sm">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="w-11 py-3 bg-slate-950/80 border-r border-slate-800 text-slate-600 select-none text-right pr-2.5 overflow-hidden font-mono text-xs leading-6"
        >
          {lineNumbers.map(n => (
            <div key={n}>{n}</div>
          ))}
        </div>

        {/* SQL Textarea */}
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={e => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder="-- Enter SQL Query here (e.g. SELECT name, cgpa FROM students WHERE cgpa > 3.0;)"
          className="flex-1 p-3 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none font-mono text-xs sm:text-sm leading-6 selection:bg-cyan-500/30 overflow-y-auto"
          spellCheck={false}
          rows={6}
        />
      </div>

      {/* Editor Action Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 transition"
            title="Format SQL Query"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Format</span>
          </button>
          <button
            onClick={() => onChange('')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 bg-slate-800/50 hover:bg-slate-800 transition"
            title="Clear buffer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] text-slate-500 font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">Ctrl+Enter</kbd>
          </span>

          <button
            onClick={onAnalyze}
            disabled={isCompiling || !sql.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
            <span>{isCompiling ? 'Compiling Pipeline...' : 'Analyze & Compile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
