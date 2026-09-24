/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RelationalAlgebraNode, ThreeAddressCode } from '../compiler/types';
import {
  Binary,
  GitBranch,
  Copy,
  Check,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface IrTabProps {
  irTree: RelationalAlgebraNode | null;
  threeAddressCode: ThreeAddressCode | null;
}

export const IrTab: React.FC<IrTabProps> = ({ irTree, threeAddressCode }) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'TAC' | 'RELATIONAL'>('TAC');

  if (!irTree || !threeAddressCode) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
        Intermediate Representation not generated. Please resolve syntax/semantic errors.
      </div>
    );
  }

  const tacString = threeAddressCode.instructions
    .map(i => `${i.instruction.padEnd(45)} # ${i.description}`)
    .join('\n');

  const handleCopyTac = () => {
    navigator.clipboard.writeText(tacString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Phase 5: Intermediate Code Generation (IR & TAC)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              Machine-Independent IR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Translates high-level declarative SQL into Relational Algebra primitives and Linear Three-Address Code (TAC).
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveView('TAC')}
              className={`px-3 py-1 rounded-md transition font-semibold flex items-center gap-1.5 ${
                activeView === 'TAC'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Three-Address Code</span>
            </button>
            <button
              onClick={() => setActiveView('RELATIONAL')}
              className={`px-3 py-1 rounded-md transition font-semibold flex items-center gap-1.5 ${
                activeView === 'RELATIONAL'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Relational Algebra</span>
            </button>
          </div>

          {activeView === 'TAC' && (
            <button
              onClick={handleCopyTac}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Copy Three-Address Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main View */}
      {activeView === 'TAC' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono">
                Linearized Three-Address Code (Quadruples)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {threeAddressCode.instructions.length} instructions
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 font-mono text-xs">
            {threeAddressCode.instructions.map((inst, index) => (
              <div
                key={inst.id}
                className="p-3 hover:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-2 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-slate-600 font-bold select-none text-right">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      inst.op === 'SCAN'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : inst.op === 'FILTER'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : inst.op === 'PROJECT'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : inst.op === 'SORT'
                        ? 'bg-pink-950 text-pink-300 border border-pink-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {inst.op}
                  </span>
                  <span className="text-slate-100 font-bold text-xs sm:text-sm">
                    {inst.instruction}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans pl-11 md:pl-0 flex items-center gap-1.5">
                  <span className="text-slate-600 font-mono">#</span>
                  <span>{inst.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Relational Algebra Tree View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Relational Algebra Canonical Operator Pipeline</span>
          </h4>

          <div className="space-y-3 font-mono text-xs">
            <RelationalNodeCard node={irTree} />
          </div>
        </div>
      )}

      {/* Compiler Theory Explanation Box */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400">
        <span className="text-cyan-300 font-bold">Why Intermediate Representation?</span>
        <p className="mt-1 leading-relaxed text-slate-400 font-sans text-[12px]">
          Separating the front-end (Lexer/Parser) from the back-end (Optimizer/Executor) allows query engines to optimize logic irrespective of user input syntax. Three-Address Code breaks complex compound expressions into discrete atomic transformations with explicit temporary variables (<code className="text-cyan-300">t1, t2, t3</code>).
        </p>
      </div>
    </div>
  );
};

const RelationalNodeCard: React.FC<{ node: RelationalAlgebraNode; level?: number }> = ({
  node,
  level = 0,
}) => {
  const getOpBadge = (op: string) => {
    switch (op) {
      case 'PROJECT':
        return { symbol: 'π', bg: 'bg-purple-950/80 text-purple-300 border-purple-800' };
      case 'FILTER':
        return { symbol: 'σ', bg: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'JOIN':
        return { symbol: '⨝', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800' };
      case 'SORT':
        return { symbol: 'τ', bg: 'bg-pink-950/80 text-pink-300 border-pink-800' };
      case 'LIMIT':
        return { symbol: 'λ', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
      default:
        return { symbol: 'Scan', bg: 'bg-blue-950/80 text-blue-300 border-blue-800' };
    }
  };

  const badge = getOpBadge(node.op);

  return (
    <div className="flex flex-col">
      <div
        className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base border shadow-sm ${badge.bg}`}
          >
            {badge.symbol}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs sm:text-sm">
                {node.op} OPERATOR
              </span>
              <span className="text-[10px] text-slate-500 font-mono">[{node.id}]</span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">{node.description}</p>
          </div>
        </div>

        <div className="text-right font-mono text-[11px] text-slate-500 hidden sm:block">
          <div>Est. Cost: <span className="text-slate-300">{node.estimatedCost}</span></div>
          <div>Est. Tuples: <span className="text-cyan-400">{node.estimatedCardinality}</span></div>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="space-y-3 mt-3 relative">
          {node.children.map(child => (
            <RelationalNodeCard key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
