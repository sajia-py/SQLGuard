/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PipelineResult } from '../compiler/types';
import {
  Code2,
  FileCode2,
  TableProperties,
  Shield,
  Binary,
  Zap,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  Bot,
} from 'lucide-react';
import { ActiveTabType } from './PipelineStepper';

interface AllStepsWalkthroughProps {
  pipeline: PipelineResult;
  onSelectTab: (tab: ActiveTabType) => void;
  onAskAiAboutStep: (stepName: string) => void;
}

export const AllStepsWalkthrough: React.FC<AllStepsWalkthroughProps> = ({
  pipeline,
  onSelectTab,
  onAskAiAboutStep,
}) => {
  const steps = [
    {
      id: 'lexer' as ActiveTabType,
      number: '1',
      title: 'Lexical Analysis (Scanner & DFA)',
      icon: Code2,
      badge: `${pipeline.tokens.length} Tokens Generated`,
      status: pipeline.hasLexerError ? 'ERROR' : 'SUCCESS',
      whatItDid: `The Lexer scanned your SQL text character-by-character, ignored unnecessary spaces and newlines, and broke the code into ${pipeline.tokens.length} categorized compiler tokens (Keywords, Identifiers, Numbers, Strings, and Operators). It recorded the exact line and column coordinates for each token.`,
      simpleExplanation: `Jaise insaan sentence ko alag-alag words mein samajhte hain, waise hi compiler sabse pehle query ko chotey pieces ("Tokens") mein break karta hai. For example, 'SELECT' ko pehchan kar keyword banaya, 'students' ko table name identifier banaya, aur '3.0' ko number banaya.`,
      inputPreview: pipeline.sql,
      outputSummary: pipeline.tokens
        .slice(0, 8)
        .map(t => `${t.value} [${t.type}]`)
        .join('  •  ') + (pipeline.tokens.length > 8 ? ' ...' : ''),
    },
    {
      id: 'parser' as ActiveTabType,
      number: '2',
      title: 'Syntax Analysis (Recursive-Descent Parser & AST)',
      icon: FileCode2,
      badge: pipeline.ast ? 'Valid CFG Grammar' : 'Syntax Error',
      status: pipeline.hasParserError ? 'ERROR' : 'SUCCESS',
      whatItDid: pipeline.ast
        ? `The Parser verified your tokens against Backus-Naur Form (BNF) grammar rules. It verified that after SELECT comes projections, followed by FROM and table name, followed by optional WHERE/ORDER BY. It assembled them into an Abstract Syntax Tree (AST) representing the query structure.`
        : `Encountered a syntax error in your token sequence. The query does not conform to the Context-Free Grammar rules.`,
      simpleExplanation: `Parser grammar check karta hai. Jaise English mein 'I apples eat' galat hai aur 'I eat apples' theek hai, waise hi SQL mein SELECT ke baad columns aur FROM ke baad table aana zaroori hai. Agar grammar theek ho to ye ek Tree (AST) bana deta hai jo computer asani se samajh sakta hai.`,
      inputPreview: `Stream of ${pipeline.tokens.length} tokens`,
      outputSummary: pipeline.ast
        ? `Root: ${pipeline.ast.type} | From: ${pipeline.ast.fromTable?.tableName || 'None'} | Projections: ${pipeline.ast.projections.length} | Has Where: ${pipeline.ast.where ? 'Yes' : 'No'}`
        : 'Syntax Error in production rules',
    },
    {
      id: 'semantic' as ActiveTabType,
      number: '3',
      title: 'Semantic Analysis & Symbol Table',
      icon: TableProperties,
      badge: pipeline.hasSemanticError ? 'Semantic Mismatch' : 'Catalog Verified',
      status: pipeline.hasSemanticError ? 'ERROR' : 'SUCCESS',
      whatItDid: pipeline.hasSemanticError
        ? `Found a semantic error (e.g. unknown table, non-existent column, or incompatible data types in comparisons).`
        : `Verified that the table '${pipeline.ast?.fromTable?.tableName || 'students'}' actually exists in the database schema catalog, verified all requested columns exist without ambiguity, and verified that comparison operators compare compatible data types (e.g. numeric CGPA with a numeric literal).`,
      simpleExplanation: `Grammar theek hone ke baad Semantic analyzer check karta hai ke kya query ka MATLAB theek hai? Kya table aur columns sach mein database mein mojood hain? Agar aap 'salary' column mangenge jo students table mein hai hi nahi, to Semantic analysis yahan error dega.`,
      inputPreview: `AST Structure & Database Catalog Dictionary`,
      outputSummary: pipeline.hasSemanticError
        ? `Semantic validation failed`
        : `Verified table '${pipeline.ast?.fromTable?.tableName}' and attributes in university schema`,
    },
    {
      id: 'security' as ActiveTabType,
      number: '4',
      title: 'Security Analysis & SQL Injection Guard',
      icon: Shield,
      badge: `Risk Score: ${pipeline.securityReport.score}/100`,
      status:
        pipeline.securityReport.status === 'CRITICAL'
          ? 'ERROR'
          : pipeline.securityReport.status === 'WARNING'
          ? 'WARNING'
          : 'SUCCESS',
      whatItDid:
        pipeline.securityReport.issues.length === 0
          ? `Scanned your query conditions and syntax patterns. No suspicious tautologies ('1'='1'), UNION attacks, or stacked query injections were detected.`
          : `Flagged ${pipeline.securityReport.issues.length} potential SQL injection vulnerability (CWE-89), such as tautological conditions or stacked statements. Generated safe parameterized prepared statement alternative.`,
      simpleExplanation: `Ye phase hacker attacks ko detect karta hai! Agar user input mein 'OR 1=1' likh de taake authentication bypass ho jaye ya password leak ho, to Security Guard foran warn karta hai aur batata hai ke query ko Prepared Statement (parameters '?' ke sath) kaise safe banaya jaye.`,
      inputPreview: `AST WHERE conditions & token patterns`,
      outputSummary:
        pipeline.securityReport.issues.length === 0
          ? `Status: SAFE (No threats detected)`
          : `Flagged: ${pipeline.securityReport.issues.map(i => i.title).join(', ')}`,
    },
    {
      id: 'ir' as ActiveTabType,
      number: '5',
      title: 'Intermediate Representation (Relational Algebra & TAC)',
      icon: Binary,
      badge: pipeline.threeAddressCode ? `${pipeline.threeAddressCode.instructions.length} TAC Ops` : 'N/A',
      status: pipeline.threeAddressCode ? 'SUCCESS' : 'SKIPPED',
      whatItDid: pipeline.threeAddressCode
        ? `Translated the declarative SQL query into mathematical Relational Algebra operators (Projection π, Selection σ, Join ⨝, Sort τ) and linearized it into Three-Address Code (TAC) with temporary storage registers (t1, t2, t3).`
        : `Skipped due to earlier compilation errors.`,
      simpleExplanation: `Compiler complex query ko chotey chotey step-by-step assembly-style instructions mein convert karta hai jise Three-Address Code (TAC) kehte hain. Har instruction mein temporary variable hota hai jaise: t1 = scan table, t2 = filter t1, t3 = project columns.`,
      inputPreview: `Validated AST`,
      outputSummary: pipeline.threeAddressCode
        ? pipeline.threeAddressCode.instructions.map(i => i.instruction).join('  ➔  ')
        : 'N/A',
    },
    {
      id: 'optimizer' as ActiveTabType,
      number: '6',
      title: 'Query Optimization (Algebraic Rewriting)',
      icon: Zap,
      badge: `${pipeline.optimizationSteps.length} Rule Passes`,
      status: pipeline.optimizationSteps.length > 0 ? 'SUCCESS' : 'SUCCESS',
      whatItDid:
        pipeline.optimizationSteps.length > 0
          ? `Applied relational equivalence transformations: Predicate Pushdown (filtering tuples as early as possible before sorting/joining), Dead-Predicate Pruning (eliminating redundant 1=1 clauses), and Projection Pruning.`
          : `Analyzed query for redundant operations. The query is already in optimal canonical form.`,
      simpleExplanation: `Optimizer query ki speed ko fast karta hai! For example agar aapke paas 10,000 students hain, to pehle sabko sort karne ke bajaye pehle filter karke sirf 50 students nikalo phir unhe sort karo. Isse computer ka time aur memory bohat bachti hai.`,
      inputPreview: `Initial Relational Execution Tree`,
      outputSummary:
        pipeline.optimizationSteps.length > 0
          ? pipeline.optimizationSteps.map(s => `${s.ruleName}: ${s.costImpact}`).join(' | ')
          : 'Query is already in minimal canonical representation',
    },
    {
      id: 'execution' as ActiveTabType,
      number: '7',
      title: 'Database Execution Engine',
      icon: Play,
      badge: pipeline.executionResult ? `${pipeline.executionResult.rowCount} Tuples Returned` : 'Pending',
      status: pipeline.executionResult ? 'SUCCESS' : 'SKIPPED',
      whatItDid: pipeline.executionResult
        ? `Executed the validated relational plan on the in-memory database engine. Scanned tuples, applied filters, extracted projected columns, and measured latency (${pipeline.executionResult.executionTimeMs} ms).`
        : `Execution suspended due to diagnostic errors in previous phases.`,
      simpleExplanation: `Aakhri step par database ka engine actual data par query run karta hai. Students table se matching records nikaalta hai, required columns select karta hai aur final table user ke saamne display karta hai.`,
      inputPreview: `Optimized Execution Plan & In-Memory Database`,
      outputSummary: pipeline.executionResult
        ? `Returned ${pipeline.executionResult.rowCount} row(s) in ${pipeline.executionResult.executionTimeMs} ms`
        : 'Pending execution',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
                Complete Compiler Journey (Har Step Ka Asaan Khulasa)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Yahan aap asani se dekh sakte hain ke aapki SQL query ke sath compiler ke <strong>har step ne kya kiya</strong>, code kaise badla, aur iska asaan lafzon mein kya matlab hai.
            </p>
          </div>

          <button
            onClick={() => onAskAiAboutStep('all steps')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 transition shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI to Explain All Steps</span>
          </button>
        </div>
      </div>

      {/* 7 Stages Vertical Journey Cards */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;

          let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
          let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;

          if (step.status === 'ERROR') {
            badgeColor = 'bg-rose-950 text-rose-300 border-rose-800';
            statusIcon = <XCircle className="w-4 h-4 text-rose-400" />;
          } else if (step.status === 'WARNING') {
            badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
            statusIcon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
          } else if (step.status === 'SKIPPED') {
            badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
            statusIcon = <HelpCircle className="w-4 h-4 text-slate-500" />;
          }

          return (
            <div
              key={step.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition shadow-md flex flex-col gap-4 relative overflow-hidden"
            >
              {/* Left Color Accent Bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  step.status === 'ERROR'
                    ? 'bg-rose-500'
                    : step.status === 'WARNING'
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
              />

              {/* Step Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 pl-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-cyan-400 font-mono">
                    {step.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <h4 className="font-bold text-sm sm:text-base text-slate-100">
                        {step.title}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${badgeColor}`}
                  >
                    {statusIcon}
                    <span>{step.badge}</span>
                  </span>

                  <button
                    onClick={() => onSelectTab(step.id)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onAskAiAboutStep(step.title)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-800 transition"
                    title={`Ask AI to explain ${step.title}`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Two Column Explanation Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-2">
                {/* Technical: What it did to your code */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-mono block mb-1.5">
                      🛠️ What it did with your code (Compiler Action)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {step.whatItDid}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-900 font-mono text-[11px]">
                    <span className="text-slate-500 block text-[10px] uppercase">Output Transformation:</span>
                    <p className="text-cyan-300 mt-0.5 truncate">{step.outputSummary}</p>
                  </div>
                </div>

                {/* Simple / Conceptual: Asaan Lafzon Mein Khulasa */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 font-mono block mb-1.5">
                      💡 Simple Explanation (Asaan Samjh)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {step.simpleExplanation}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-slate-500">Need more depth?</span>
                    <button
                      onClick={() => onAskAiAboutStep(step.title)}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Bot className="w-3 h-3" />
                      <span>Ask AI Tutor</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
