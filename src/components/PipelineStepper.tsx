/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Code2,
  FileCode2,
  TableProperties,
  Shield,
  Binary,
  Zap,
  Play,
  FileText,
  Layers,
} from 'lucide-react';
import { PipelineResult } from '../compiler/types';

export type ActiveTabType =
  | 'walkthrough'
  | 'report'
  | 'lexer'
  | 'parser'
  | 'semantic'
  | 'security'
  | 'ir'
  | 'optimizer'
  | 'execution';

interface PipelineStepperProps {
  pipeline: PipelineResult;
  activeTab: ActiveTabType;
  onSelectTab: (tab: ActiveTabType) => void;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  pipeline,
  activeTab,
  onSelectTab,
}) => {
  const steps = [
    {
      id: 'walkthrough' as ActiveTabType,
      number: '⚡',
      title: 'All Steps',
      subtitle: 'Simple Explainer',
      icon: Layers,
      status: 'pass',
    },
    {
      id: 'report' as ActiveTabType,
      number: '★',
      title: 'Report',
      subtitle: 'Overview',
      icon: FileText,
      status: 'pass',
    },
    {
      id: 'lexer' as ActiveTabType,
      number: '1',
      title: 'Lexer',
      subtitle: `${pipeline.tokens.length} Tokens`,
      icon: Code2,
      status: pipeline.hasLexerError ? 'error' : 'pass',
    },
    {
      id: 'parser' as ActiveTabType,
      number: '2',
      title: 'Parser / AST',
      subtitle: pipeline.ast ? 'Valid CFG' : 'Syntax Error',
      icon: FileCode2,
      status: pipeline.hasLexerError
        ? 'skipped'
        : pipeline.hasParserError
        ? 'error'
        : 'pass',
    },
    {
      id: 'semantic' as ActiveTabType,
      number: '3',
      title: 'Semantic',
      subtitle: pipeline.hasSemanticError ? 'Type/Scope Error' : 'Resolved',
      icon: TableProperties,
      status:
        pipeline.hasLexerError || pipeline.hasParserError
          ? 'skipped'
          : pipeline.hasSemanticError
          ? 'error'
          : 'pass',
    },
    {
      id: 'security' as ActiveTabType,
      number: '4',
      title: 'Security',
      subtitle:
        pipeline.securityReport.status === 'SAFE'
          ? 'No Threats'
          : `${pipeline.securityReport.issues.length} Threat(s)`,
      icon: Shield,
      status:
        pipeline.securityReport.status === 'CRITICAL'
          ? 'error'
          : pipeline.securityReport.status === 'WARNING'
          ? 'warning'
          : 'pass',
    },
    {
      id: 'ir' as ActiveTabType,
      number: '5',
      title: 'IR & TAC',
      subtitle: pipeline.irTree ? 'Relational π/σ/⨝' : 'N/A',
      icon: Binary,
      status: pipeline.irTree ? 'pass' : 'skipped',
    },
    {
      id: 'optimizer' as ActiveTabType,
      number: '6',
      title: 'Optimizer',
      subtitle: `${pipeline.optimizationSteps.length} Rule(s)`,
      icon: Zap,
      status: pipeline.optimizationSteps.length > 0 ? 'pass' : 'skipped',
    },
    {
      id: 'execution' as ActiveTabType,
      number: '7',
      title: 'Execution',
      subtitle: pipeline.executionResult
        ? `${pipeline.executionResult.rowCount} Row(s)`
        : 'Pending',
      icon: Play,
      status: pipeline.executionResult ? 'pass' : 'skipped',
    },
  ];

  return (
    <div className="bg-slate-900/80 border-b border-slate-800 p-2 overflow-x-auto scrollbar-thin">
      <div className="flex items-center min-w-max gap-1.5 px-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeTab === step.id;

          let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
          let statusIcon = null;

          if (step.status === 'pass') {
            badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
            statusIcon = <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />;
          } else if (step.status === 'warning') {
            badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
            statusIcon = <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />;
          } else if (step.status === 'error') {
            badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
            statusIcon = <XCircle className="w-3 h-3 text-rose-400 shrink-0" />;
          }

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onSelectTab(step.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition relative border ${
                  isActive
                    ? 'bg-slate-800 border-cyan-500/80 shadow-md shadow-cyan-500/10 text-white'
                    : 'bg-slate-900/50 hover:bg-slate-800/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold border ${badgeColor}`}
                >
                  {step.number}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 font-semibold text-xs leading-none">
                    <span>{step.title}</span>
                    {statusIcon}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 leading-none font-mono">
                    {step.subtitle}
                  </span>
                </div>

                {isActive && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-cyan-400 rounded-full" />
                )}
              </button>

              {idx < steps.length - 1 && (
                <div className="text-slate-700 font-bold text-xs select-none">→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
