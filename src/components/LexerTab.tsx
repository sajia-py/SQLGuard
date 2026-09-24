/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Token, TokenType } from '../compiler/types';
import { Search, Filter, Hash, CheckCircle2 } from 'lucide-react';

interface LexerTabProps {
  tokens: Token[];
}

export const LexerTab: React.FC<LexerTabProps> = ({ tokens }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const tokenTypeCounts = tokens.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredTokens = tokens.filter(t => {
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesSearch =
      t.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeBadgeStyle = (type: TokenType) => {
    switch (type) {
      case 'KEYWORD':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'IDENTIFIER':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'NUMBER':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'STRING':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'OPERATOR':
        return 'bg-pink-950/80 text-pink-300 border-pink-800';
      case 'PUNCTUATION':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'COMMENT':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800';
      case 'EOF':
        return 'bg-slate-900 text-slate-500 border-slate-800';
      default:
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Phase 1: Lexical Analysis (Scanner)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Deterministic Finite Automaton (DFA)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Converts raw character stream into categorized compiler tokens with line and column coordinates.
          </p>
        </div>

        {/* Token Counts */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(tokenTypeCounts).map(([type, count]) => (
            <div
              key={type}
              onClick={() => setFilterType(filterType === type ? 'ALL' : type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border cursor-pointer transition ${
                filterType === type
                  ? 'ring-2 ring-cyan-400 font-bold'
                  : 'hover:bg-slate-800/80'
              } ${getTypeBadgeStyle(type as TokenType)}`}
            >
              <span className="opacity-70">{type}:</span> {count}
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search tokens or types..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs text-slate-400 font-mono">
          <span>Showing {filteredTokens.length} of {tokens.length} tokens</span>
        </div>
      </div>

      {/* Tokens Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto max-h-[460px] scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Token Type</th>
                <th className="py-2.5 px-4">Lexeme (Value)</th>
                <th className="py-2.5 px-4">Position (Line:Col)</th>
                <th className="py-2.5 px-4">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredTokens.map(token => (
                <tr key={token.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-4 text-slate-500">{token.id}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getTypeBadgeStyle(
                        token.type
                      )}`}
                    >
                      {token.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-200">
                    {token.type === 'EOF' ? (
                      <span className="text-slate-500">&lt;EOF&gt;</span>
                    ) : (
                      <code>{token.value}</code>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    Line {token.line}, Col {token.column}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">{token.length} chars</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
