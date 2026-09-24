/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { runCompilerPipeline } from './compiler/pipeline';
import { UNIVERSITY_SCHEMA } from './compiler/database';
import { PipelineResult } from './compiler/types';
import { QUERY_PRESETS } from './compiler/presets';
import { Navbar } from './components/Navbar';
import { PipelineStepper, ActiveTabType } from './components/PipelineStepper';
import { SqlEditor } from './components/SqlEditor';
import { DiagnosticBanner } from './components/DiagnosticBanner';
import { LexerTab } from './components/LexerTab';
import { AstTab } from './components/AstTab';
import { SemanticTab } from './components/SemanticTab';
import { SecurityTab } from './components/SecurityTab';
import { IrTab } from './components/IrTab';
import { OptimizerTab } from './components/OptimizerTab';
import { ExecutionTab } from './components/ExecutionTab';
import { ReportTab } from './components/ReportTab';
import { AllStepsWalkthrough } from './components/AllStepsWalkthrough';
import { AiChatbotDrawer } from './components/AiChatbotDrawer';
import { SchemaModal } from './components/SchemaModal';
import { CourseGuideModal } from './components/CourseGuideModal';
import {
  Sparkles,
  Zap,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  Bot,
  Layers,
} from 'lucide-react';

const INITIAL_SQL = `SELECT name, cgpa
FROM students
WHERE cgpa > 3.0;`;

export default function App() {
  const [sql, setSql] = useState<string>(INITIAL_SQL);
  const [pipeline, setPipeline] = useState<PipelineResult>(() =>
    runCompilerPipeline(INITIAL_SQL, UNIVERSITY_SCHEMA)
  );
  const [activeTab, setActiveTab] = useState<ActiveTabType>('walkthrough');
  const [isCompiling, setIsCompiling] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | undefined>();

  const handleAskAi = (prompt: string) => {
    setAiPrompt(prompt);
    setShowAiChat(true);
  };

  const handleAnalyze = (overrideSql?: string) => {
    const targetSql = overrideSql ?? sql;
    setIsCompiling(true);

    // Minor timeout for smooth UI feedback
    setTimeout(() => {
      const res = runCompilerPipeline(targetSql, UNIVERSITY_SCHEMA);
      setPipeline(res);
      setIsCompiling(false);

      // Smart tab navigation:
      // If there is an error, switch to the relevant error tab!
      if (res.hasLexerError) {
        setActiveTab('lexer');
      } else if (res.hasParserError) {
        setActiveTab('parser');
      } else if (res.hasSemanticError) {
        setActiveTab('semantic');
      } else if (res.securityReport.status === 'CRITICAL') {
        setActiveTab('security');
      }
    }, 60);
  };

  const handleSelectPreset = (query: string) => {
    setSql(query);
    handleAnalyze(query);
  };

  const handleApplySafeQuery = (safeSql: string) => {
    setSql(safeSql);
    handleAnalyze(safeSql);
  };

  const quickBadges = [
    { label: 'Basic SELECT', query: `SELECT name, cgpa\nFROM students\nWHERE cgpa > 3.0;`, type: 'valid' },
    { label: 'INNER JOIN', query: `SELECT students.name, enrollments.semester, enrollments.grade\nFROM students\nJOIN enrollments ON students.id = enrollments.student_id;`, type: 'valid' },
    { label: 'Syntax Error', query: `SELECT\nFROM students;`, type: 'syntax' },
    { label: 'Unknown Column (salary)', query: `SELECT salary\nFROM students;`, type: 'semantic' },
    { label: "SQLi: '1'='1'", query: `SELECT * FROM users\nWHERE username = 'admin' OR '1'='1';`, type: 'sqli' },
    { label: 'SQLi: UNION Attack', query: `SELECT name, email FROM students\nUNION SELECT username, password_hash FROM users;`, type: 'sqli' },
    { label: 'Optimizer: WHERE 1=1', query: `SELECT name, cgpa\nFROM students\nWHERE 1 = 1 AND cgpa > 3.0;`, type: 'opt' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        securityReport={pipeline.securityReport}
        onOpenSchema={() => setShowSchemaModal(true)}
        onOpenGuide={() => setShowGuideModal(true)}
        onExportReport={() => setActiveTab('report')}
        onOpenChat={() => setShowAiChat(true)}
      />

      {/* Compiler Stepper Bar */}
      <PipelineStepper
        pipeline={pipeline}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Top Quick Preset Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Tests:
          </span>
          {quickBadges.map((badge, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(badge.query)}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition font-mono text-[11px] font-medium cursor-pointer ${
                badge.type === 'valid'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                  : badge.type === 'sqli'
                  ? 'bg-rose-950/50 text-rose-300 border-rose-800/70 hover:bg-rose-900/70'
                  : badge.type === 'opt'
                  ? 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/60'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
              }`}
            >
              {badge.label}
            </button>
          ))}
        </div>

        {/* SQL Input Editor */}
        <SqlEditor
          sql={sql}
          onChange={setSql}
          onAnalyze={() => handleAnalyze()}
          isCompiling={isCompiling}
        />

        {/* Compiler Diagnostics Alert Banner (Shown when errors or warnings exist) */}
        <DiagnosticBanner diagnostics={pipeline.diagnostics} sql={pipeline.sql} />

        {/* Active Phase Inspection Panel */}
        <div className="transition-all duration-200">
          {activeTab === 'walkthrough' && (
            <AllStepsWalkthrough
              pipeline={pipeline}
              onSelectTab={setActiveTab}
              onAskAiAboutStep={handleAskAi}
            />
          )}
          {activeTab === 'report' && <ReportTab pipeline={pipeline} />}
          {activeTab === 'lexer' && <LexerTab tokens={pipeline.tokens} />}
          {activeTab === 'parser' && <AstTab ast={pipeline.ast} />}
          {activeTab === 'semantic' && (
            <SemanticTab
              ast={pipeline.ast}
              hasSemanticError={pipeline.hasSemanticError}
            />
          )}
          {activeTab === 'security' && (
            <SecurityTab
              securityReport={pipeline.securityReport}
              onApplySafeQuery={handleApplySafeQuery}
            />
          )}
          {activeTab === 'ir' && (
            <IrTab
              irTree={pipeline.irTree}
              threeAddressCode={pipeline.threeAddressCode}
            />
          )}
          {activeTab === 'optimizer' && (
            <OptimizerTab
              optimizationSteps={pipeline.optimizationSteps}
              rawTAC={pipeline.threeAddressCode}
              optimizedTAC={pipeline.optimizedTAC}
              rawIR={pipeline.irTree}
              optimizedIR={pipeline.optimizedIRTree}
            />
          )}
          {activeTab === 'execution' && (
            <ExecutionTab executionResult={pipeline.executionResult} />
          )}
        </div>
      </main>

      {/* Floating AI Tutor Summon Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setShowAiChat(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 text-slate-950 font-extrabold text-xs shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group border border-cyan-300/40"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-950 text-cyan-400 flex items-center justify-center">
            <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] uppercase tracking-wider font-mono opacity-80">Free AI Assistant</span>
            <span className="text-xs font-bold mt-0.5">Explain My Code</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-950 border border-emerald-400 animate-pulse ml-0.5" />
        </button>
      </div>

      {/* AI Chatbot Drawer Modal */}
      <AiChatbotDrawer
        isOpen={showAiChat}
        onClose={() => {
          setShowAiChat(false);
          setAiPrompt(undefined);
        }}
        pipeline={pipeline}
        initialPrompt={aiPrompt}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SQLGuard</span>
            <span>•</span>
            <span>Compiler Construction & Security Analyzer</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setShowGuideModal(true)}
              className="hover:text-cyan-400 transition underline decoration-slate-700"
            >
              Grammar & Theory
            </button>
            <span>•</span>
            <button
              onClick={() => setShowSchemaModal(true)}
              className="hover:text-cyan-400 transition underline decoration-slate-700"
            >
              Active Catalog
            </button>
            <span>•</span>
            <span className="text-slate-600">Pure Client-Side AST Engine</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SchemaModal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
      />

      <CourseGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}
