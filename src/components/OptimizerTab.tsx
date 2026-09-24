/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  OptimizationStep,
  RelationalAlgebraNode,
  ThreeAddressCode,
} from '../compiler/types';
import {
  Zap,
  CheckCircle,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';

interface OptimizerTabProps {
  optimizationSteps: OptimizationStep[];
  rawTAC: ThreeAddressCode | null;
  optimizedTAC: ThreeAddressCode | null;
  rawIR: RelationalAlgebraNode | null;
  optimizedIR: RelationalAlgebraNode | null;
}

export const OptimizerTab: React.FC<OptimizerTabProps> = ({
  optimizationSteps,
  rawTAC,
  optimizedTAC,
  rawIR,
  optimizedIR,
}) => {
  const hasOptimizations = optimizationSteps.length > 0;

  const rawCost = rawIR ? rawIR.estimatedCost : 100;
  const optCost = optimizedIR ? optimizedIR.estimatedCost : 80;
  const costDiff = rawCost - optCost;
  const costReductionPct = Math.round((costDiff / rawCost) * 100);

  return (
    <div className="space-y-4">
      {/* Header & Optimization Scorecard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Phase 6: Rule-Based Query Optimizer
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
              Heuristic Algebraic Rewriting
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Applies relational algebra equivalence rules to rewrite the execution plan into an optimal, lower-cost representation.
          </p>

          <div className="mt-3 flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Optimization Rules Fired: {optimizationSteps.length}</span>
            <span>•</span>
            <span className="text-emerald-400">
              {hasOptimizations ? `Estimated Gain: ~${costReductionPct}%` : 'Already in Canonical Form'}
            </span>
          </div>
        </div>

        {/* Cost Comparison Pill */}
        <div className="flex items-center gap-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-slate-500">Unoptimized Cost</span>
              <div className="text-sm font-extrabold text-slate-300 font-mono">{rawCost} Units</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">Optimized Cost</span>
              <div className="text-sm font-extrabold text-emerald-400 font-mono">{optCost} Units</div>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Transformations List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Applied Optimization Rewrite Passes ({optimizationSteps.length})</span>
        </h4>

        {optimizationSteps.length === 0 ? (
          <div className="p-6 bg-slate-950/60 rounded-lg text-center text-xs text-slate-400 font-mono">
            No redundant operations detected. Query was already written in direct relational form.
          </div>
        ) : (
          <div className="space-y-3">
            {optimizationSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 font-mono text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-100 text-sm font-sans">{step.ruleName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    {step.costImpact}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {step.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-rose-300">
                    <span className="text-[10px] uppercase text-rose-400/80 block font-bold mb-1">
                      Before Pass:
                    </span>
                    <code>{step.before}</code>
                  </div>
                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-300">
                    <span className="text-[10px] uppercase text-emerald-400/80 block font-bold mb-1">
                      After Pass (Optimized):
                    </span>
                    <code>{step.after}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side-by-side Three Address Code Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Raw TAC */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-slate-300">Initial Three-Address Code</span>
            <span className="text-slate-500">{rawTAC?.instructions.length || 0} ops</span>
          </div>
          <div className="p-3 font-mono text-xs text-slate-300 divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
            {rawTAC?.instructions.map(inst => (
              <div key={inst.id} className="py-1.5 flex items-center gap-2">
                <span className="text-cyan-400 font-bold">{inst.result}</span>
                <span className="text-slate-500">=</span>
                <span className="text-slate-200">{inst.instruction.replace(`${inst.result} = `, '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Optimized TAC */}
        <div className="bg-slate-900 border border-purple-900/50 rounded-xl overflow-hidden shadow-lg shadow-purple-950/20">
          <div className="p-3 bg-purple-950/40 border-b border-purple-800/60 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-purple-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Optimized Three-Address Code</span>
            </span>
            <span className="text-purple-300/80">{optimizedTAC?.instructions.length || 0} ops</span>
          </div>
          <div className="p-3 font-mono text-xs text-emerald-300 divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
            {optimizedTAC?.instructions.map(inst => (
              <div key={inst.id} className="py-1.5 flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{inst.result}</span>
                <span className="text-slate-500">=</span>
                <span className="text-slate-100">{inst.instruction.replace(`${inst.result} = `, '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
