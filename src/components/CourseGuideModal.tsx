/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, GraduationCap, CheckCircle2, Shield, Code, Cpu } from 'lucide-react';

interface CourseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CourseGuideModal: React.FC<CourseGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Compiler Construction & Security Specification Guide
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Theoretical foundation and phase-by-phase course syllabus alignment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed scrollbar-thin">
          {/* Project Overview Statement */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 to-indigo-950/50 border border-cyan-800/40">
            <h4 className="font-bold text-slate-100 text-sm mb-1">
              Project Defense Thesis (For University Presentation):
            </h4>
            <blockquote className="italic text-cyan-200/90 text-xs font-serif leading-relaxed">
              "We designed <strong>SQLGuard</strong>, a real-world SQL query analysis system that applies compiler construction phases to SQL. It tokenizes the query, parses it according to our grammar, validates its semantics against a database schema, analyzes suspicious patterns, generates an intermediate representation, performs basic optimization, and finally executes the validated query."
            </blockquote>
          </div>

          {/* Detailed 7 Phases Breakdown */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
              Compiler Pipeline Phases & Theoretical Foundations:
            </h4>

            {/* 1. Lexical */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">1</span>
                <span>Lexical Analysis (Scanner & DFA)</span>
              </div>
              <p className="text-slate-400 text-xs">
                Splits source code into a stream of categorized tokens: <code className="text-cyan-300">KEYWORD</code>, <code className="text-emerald-300">IDENTIFIER</code>, <code className="text-amber-300">NUMBER</code>, <code className="text-purple-300">STRING</code>, <code className="text-pink-300">OPERATOR</code>, and punctuation. Tracks line and column positions for exact diagnostic reporting.
              </p>
            </div>

            {/* 2. Syntax */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-[10px]">2</span>
                <span>Syntax Analysis & Context-Free Grammar (Parser & AST)</span>
              </div>
              <p className="text-slate-400 text-xs">
                Implements a recursive-descent parser based on Backus-Naur Form (BNF) grammar. Verifies production rules and outputs a typed Abstract Syntax Tree representing the hierarchical query structure.
              </p>
              <pre className="p-2 bg-slate-900 rounded font-mono text-[11px] text-indigo-200 overflow-x-auto">
                query → SELECT column_list FROM table [WHERE condition] [ORDER BY col [ASC|DESC]] [LIMIT n]
              </pre>
            </div>

            {/* 3. Semantic */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px]">3</span>
                <span>Semantic Analysis & Symbol Table Catalog</span>
              </div>
              <p className="text-slate-400 text-xs">
                Maintains a scoped Symbol Table mapping table identifiers and column attributes. Performs existence checks against schema dictionary, disambiguates joined columns, and verifies type compatibility in binary predicates.
              </p>
            </div>

            {/* 4. Security */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <span className="w-5 h-5 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center text-[10px]">4</span>
                <span>Security Analysis & SQLi Detection (CWE-89)</span>
              </div>
              <p className="text-slate-400 text-xs">
                Inspects AST condition nodes and token patterns for dangerous signatures: tautological expressions (<code className="text-rose-300">OR '1'='1'</code>), stacked destructive queries (<code className="text-rose-300">; DROP TABLE</code>), UNION injection attempts, and comment truncation. Generates parameterized prepared statement equivalents.
              </p>
            </div>

            {/* 5. IR */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">5</span>
                <span>Intermediate Representation (Relational Algebra & 3-Address Code)</span>
              </div>
              <p className="text-slate-400 text-xs">
                Translates declarative queries into procedural relational algebra operators (Projection π, Selection σ, Join ⨝, Sort τ, Limit λ) and emits linear Three-Address Code with temporary storage registers (<code className="text-cyan-300">t1, t2, t3</code>).
              </p>
            </div>

            {/* 6. Optimizer */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-purple-300">
                <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-[10px]">6</span>
                <span>Query Optimizer (Heuristic Algebraic Rewriting)</span>
              </div>
              <p className="text-slate-400 text-xs">
                Implements predicate pushdown (filtering tuples before sorting or joining), dead-predicate pruning (eliminating redundant <code className="text-purple-300">1=1</code> tautologies), and projection pruning (retaining only demanded columns).
              </p>
            </div>

            {/* 7. Execution */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px]">7</span>
                <span>Relational Query Execution Engine</span>
              </div>
              <p className="text-slate-400 text-xs">
                Executes the validated and optimized relational plan against an in-memory database instance, returning tuples, measured latency, and execution trace logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
