/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PipelineResult } from '../compiler/types';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';

interface ReportTabProps {
  pipeline: PipelineResult;
}

export const ReportTab: React.FC<ReportTabProps> = ({ pipeline }) => {
  const [copied, setCopied] = useState(false);

  const generateMarkdownReport = (): string => {
    return `======================================================
           SQLGUARD: QUERY COMPILER & SECURITY REPORT
======================================================
Generated at: ${new Date().toISOString()}

INPUT QUERY:
------------------------------------------------------
${pipeline.sql}

1. LEXICAL ANALYSIS:
------------------------------------------------------
Status: ${pipeline.hasLexerError ? 'FAILED' : 'PASSED'}
Total Tokens Identified: ${pipeline.tokens.length}
Keywords, Identifiers, Literals, Operators, Punctuation mapped successfully.

2. SYNTAX ANALYSIS (PARSER & AST):
------------------------------------------------------
Status: ${pipeline.hasParserError ? 'FAILED' : 'PASSED'}
Grammar: Context-Free Grammar (CFG) in BNF
Root AST Node: ${pipeline.ast ? pipeline.ast.type : 'N/A'}
Projections: ${pipeline.ast?.projections.length || 0}
Target Relation: ${pipeline.ast?.fromTable?.tableName || 'None'}

3. SEMANTIC ANALYSIS & SYMBOL TABLE:
------------------------------------------------------
Status: ${pipeline.hasSemanticError ? 'FAILED' : 'PASSED'}
Scope Validation: Catalog existence, attribute bindings, and type compatibility verified.

4. SECURITY ANALYSIS (SQL INJECTION GUARD):
------------------------------------------------------
Security Index: ${pipeline.securityReport.score} / 100 (${pipeline.securityReport.status})
Vulnerabilities Flagged: ${pipeline.securityReport.issues.length}
Findings:
${
  pipeline.securityReport.issues.length === 0
    ? '- None. Query conforms to safe relational read semantics.'
    : pipeline.securityReport.issues
        .map(i => `  * [${i.severity}] ${i.title} (${i.cwe}): ${i.patternFound}`)
        .join('\n')
}

5. INTERMEDIATE REPRESENTATION (THREE-ADDRESS CODE):
------------------------------------------------------
${
  pipeline.threeAddressCode
    ? pipeline.threeAddressCode.instructions.map(i => i.instruction).join('\n')
    : 'N/A'
}

6. QUERY OPTIMIZATION PASSES:
------------------------------------------------------
Rules Applied: ${pipeline.optimizationSteps.length}
${
  pipeline.optimizationSteps.length === 0
    ? '- Direct relational form; no dead predicates.'
    : pipeline.optimizationSteps.map(s => `  * ${s.ruleName}: ${s.costImpact}`).join('\n')
}

7. EXECUTION ENGINE:
------------------------------------------------------
Status: ${pipeline.executionResult ? 'SUCCESSFUL' : 'SKIPPED'}
Rows Returned: ${pipeline.executionResult?.rowCount || 0}
Execution Time: ${pipeline.executionResult?.executionTimeMs || 0} ms
======================================================`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Query Compiler & Security Analysis Report
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              Submission Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete compilation lifecycle diagnostics, security posture, and relational execution trace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Formatted Report Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        {/* Title & Query Display */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
              SQLGUARD COMPILER ENGINE • COURSE PROJECT REPORT
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Timestamp: {new Date().toLocaleTimeString()}
            </span>
          </div>

          <div className="mt-3">
            <span className="text-xs text-slate-400 font-mono">Target SQL Expression:</span>
            <pre className="mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs sm:text-sm text-cyan-200">
              {pipeline.sql}
            </pre>
          </div>
        </div>

        {/* 7-Phase Audit Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. Lexer */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300 font-mono">1. Lexical Analysis</span>
              {pipeline.hasLexerError ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> FAILED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {pipeline.hasLexerError ? 'Illegal character encountered' : `Tokenized ${pipeline.tokens.length} lexemes correctly`}
            </p>
          </div>

          {/* 2. Parser */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300 font-mono">2. Syntax Analysis</span>
              {pipeline.hasParserError ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> FAILED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {pipeline.ast ? 'Grammar validated; AST constructed' : 'Syntax error in production rules'}
            </p>
          </div>

          {/* 3. Semantic */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300 font-mono">3. Semantic Analysis</span>
              {pipeline.hasSemanticError ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> FAILED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {pipeline.hasSemanticError ? 'Schema mismatch / type conflict' : 'Symbol table lookup succeeded'}
            </p>
          </div>

          {/* 4. Security */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300 font-mono">4. Security Posture</span>
              <span
                className={`flex items-center gap-1 text-[11px] font-bold ${
                  pipeline.securityReport.status === 'SAFE'
                    ? 'text-emerald-400'
                    : pipeline.securityReport.status === 'WARNING'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {pipeline.securityReport.status === 'SAFE' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                SCORE: {pipeline.securityReport.score}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {pipeline.securityReport.issues.length === 0
                ? 'No SQLi signatures found'
                : `${pipeline.securityReport.issues.length} potential attack pattern(s)`}
            </p>
          </div>

          {/* 5. IR */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300 font-mono">5. Intermediate Code</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> GENERATED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {pipeline.threeAddressCode ? `${pipeline.threeAddressCode.instructions.length} TAC instructions` : 'N/A'}
            </p>
          </div>

          {/* 6. Optimizer */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300 font-mono">6. Query Optimizer</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-purple-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {pipeline.optimizationSteps.length} PASSES
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {pipeline.optimizationSteps.length > 0 ? 'Predicate pushdown & folding applied' : 'Optimal canonical form'}
            </p>
          </div>
        </div>

        {/* Three Address Code Section */}
        {pipeline.threeAddressCode && (
          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
              Generated Three-Address Code (TAC):
            </h4>
            <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto">
              {pipeline.threeAddressCode.instructions.map(i => `${i.instruction.padEnd(45)} # ${i.description}`).join('\n')}
            </pre>
          </div>
        )}

        {/* Execution Summary */}
        <div className="border-t border-slate-800 pt-5 flex flex-wrap items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-xl">
          <div>
            <span className="text-xs font-bold text-slate-300 block font-mono">
              7. Relational Engine Execution Result:
            </span>
            <span className="text-xs text-slate-400">
              {pipeline.executionResult
                ? `Returned ${pipeline.executionResult.rowCount} rows in ${pipeline.executionResult.executionTimeMs} ms.`
                : 'Execution not attempted due to earlier stage halts.'}
            </span>
          </div>

          {pipeline.executionResult && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-emerald-400 font-bold">
                ✓ Validated & Executed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
