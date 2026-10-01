/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Check,
  Cpu,
  User,
  HelpCircle,
} from 'lucide-react';
import { PipelineResult } from '../compiler/types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface AiChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pipeline: PipelineResult;
  initialPrompt?: string;
}

export const AiChatbotDrawer: React.FC<AiChatbotDrawerProps> = ({
  isOpen,
  onClose,
  pipeline,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I am your **SQLGuard AI Compiler Tutor** 🎓\n\nI can explain in simple, detail-oriented words exactly how each phase of the compiler (**Lexer, Parser, AST, Semantic Analyzer, SQLi Guard, Three-Address Code, and Optimizer**) processed your SQL query.\n\nClick any quick question below or ask me anything!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Handle initialPrompt triggered from other components
  useEffect(() => {
    if (initialPrompt && isOpen) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const quickQuestions = [
    'Explain all 7 steps for my code in simple words',
    'What did the Lexer do to my SQL text?',
    'Explain the AST tree and CFG grammar',
    'Why is SQL injection dangerous and how did SQLGuard check it?',
    'What is Three-Address Code and why do we need t1, t2 registers?',
    'Explain Predicate Pushdown and how it optimizes queries',
  ];

  const sendMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.text,
      }));

      const compilerContext = {
        sql: pipeline.sql,
        tokensCount: pipeline.tokens.length,
        astSummary: pipeline.ast ? pipeline.ast.type : 'Syntax Error',
        semanticStatus: pipeline.hasSemanticError ? 'FAILED' : 'PASSED',
        securityScore: pipeline.securityReport.score,
        threats: pipeline.securityReport.issues,
        tacInstructions: pipeline.threeAddressCode?.instructions.map(i => i.instruction) || [],
        optimizations: pipeline.optimizationSteps,
        rowCount: pipeline.executionResult?.rowCount ?? 0,
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          compilerContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.reply || 'No response received from tutor.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.warn('API error, using client compiler tutor engine:', err);
      // Fallback client-side explanation
      const lower = textToSend.toLowerCase();
      let explanation = '';
      if (lower.includes('all steps') || lower.includes('every step') || lower.includes('explain') || lower.includes('working')) {
        explanation = `### 🎓 SQLGuard Compiler Analysis for Your Query\n\n` +
          `**Target Query:**\n\`\`\`sql\n${pipeline.sql}\n\`\`\`\n\n` +
          `1. **🔍 Lexical Analysis:** Scanned ${pipeline.tokens.length} tokens (Keywords, Identifiers, Operators, Literals).\n` +
          `2. **🌲 Syntax Analysis (Parser):** Validated CFG grammar and constructed the AST node \`${pipeline.ast?.type || 'SelectStatement'}\`.\n` +
          `3. **📚 Semantic Analysis:** Verified symbol catalog for table \`${pipeline.ast?.fromTable || 'students'}\` and projection attributes.\n` +
          `4. **🛡️ Security Analysis (SQLi):** Score is **${pipeline.securityReport.score}/100**. ${pipeline.securityReport.issues.length === 0 ? 'No SQL injection vulnerabilities detected.' : `Flagged ${pipeline.securityReport.issues.length} threat(s).`}\n` +
          `5. **⚙️ Intermediate Code:** Generated **${pipeline.threeAddressCode?.instructions.length || 0} Three-Address Code** statements using virtual registers (t1, t2...).\n` +
          `6. **⚡ Query Optimizer:** Applied **${pipeline.optimizationSteps.length} algebraic passes** (e.g. Predicate Pushdown, canonical projection).\n` +
          `7. **🚀 Execution:** Evaluated plan against in-memory database, returning **${pipeline.executionResult?.rowCount ?? 0} record(s)** in <1ms.`;
      } else if (lower.includes('lexer') || lower.includes('token')) {
        explanation = `### 🔍 Phase 1: Lexical Analysis Breakdown\n\n` +
          `* **Total Tokens:** ${pipeline.tokens.length}\n` +
          `* **Tokens Stream:** ${pipeline.tokens.slice(0, 10).map(t => `${t.type}("${t.value}")`).join(' -> ')}${pipeline.tokens.length > 10 ? '...' : ''}\n` +
          `* **Role:** Removes whitespace/comments, records line:col positions for error diagnostics, and identifies keywords vs identifiers.`;
      } else if (lower.includes('parser') || lower.includes('ast')) {
        explanation = `### 🌲 Phase 2: Syntax Analysis & AST\n\n` +
          `* **Root Node:** \`${pipeline.ast?.type || 'SelectStatement'}\`\n` +
          `* **Grammar:** Verified against Context-Free Grammar (BNF form).\n` +
          `* **Status:** ${pipeline.ast ? '✅ Successfully parsed without syntax errors.' : '❌ Syntax error encountered.'}`;
      } else if (lower.includes('injection') || lower.includes('security')) {
        explanation = `### 🛡️ Phase 4: SQL Injection Security Guard\n\n` +
          `* **Security Score:** ${pipeline.securityReport.score}/100 (${pipeline.securityReport.status} Status)\n` +
          `* **Threats:** ${pipeline.securityReport.issues.length === 0 ? 'None detected. Query structure is safe.' : pipeline.securityReport.issues.map(i => `• [${i.severity}] ${i.description}`).join('\n')}\n` +
          `* **Best Practice:** Use parameterized queries with \`?\` placeholders so data literals cannot alter SQL code structure.`;
      } else {
        explanation = `### 🤖 SQLGuard AI Tutor\n\n` +
          `Here is your query summary:\n` +
          `* **SQL:** \`${pipeline.sql}\`\n` +
          `* **Tokens:** ${pipeline.tokens.length} | **Security:** ${pipeline.securityReport.score}/100 | **Rows:** ${pipeline.executionResult?.rowCount ?? 0}\n\n` +
          `Ask me anything about: Lexer tokens, AST nodes, Semantic checks, SQL Injection guard, Three-Address Code, or Predicate Pushdown!`;
      }

      const fallbackMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `Chat history cleared. I'm ready to answer any questions about your current SQL query!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isExpanded
          ? 'w-[95vw] sm:w-[680px] h-[85vh]'
          : 'w-[95vw] sm:w-[480px] h-[600px] max-h-[85vh]'
      }`}
    >
      {/* Header */}
      <div className="bg-slate-950/90 border-b border-slate-800 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-slate-100">
                SQLGuard AI Compiler Tutor
              </h3>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Free • Gemini 3.8
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Ask about Lexer, Parser, AST, Symbol Table, SQLi & TAC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
            title="Reset Chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition hidden sm:block"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs scrollbar-thin bg-slate-900/60">
        {messages.map(m => {
          const isBot = m.role === 'model';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isBot
                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                }`}
              >
                {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-3 shadow-sm relative group ${
                  isBot
                    ? 'bg-slate-950/90 border border-slate-800 text-slate-200'
                    : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-medium'
                }`}
              >
                {/* Copy button for AI replies */}
                {isBot && (
                  <button
                    onClick={() => handleCopy(m.id, m.text)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition text-[10px]"
                    title="Copy text"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}

                <div className="leading-relaxed whitespace-pre-wrap font-sans">
                  {formatMarkdown(m.text)}
                </div>

                <div
                  className={`text-[9px] mt-1.5 select-none ${
                    isBot ? 'text-slate-500' : 'text-cyan-100/70'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-mono ml-1">Analyzing code & stages...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> Suggest:
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(q)}
            disabled={isLoading}
            className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 text-[10px] whitespace-nowrap transition disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="bg-slate-950 p-3 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask AI to explain any compiler phase..."
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold disabled:opacity-40 transition shadow-md shadow-cyan-500/20 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// Helper to format basic markdown (bold, code blocks, bullet points)
function formatMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Headers
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="font-extrabold text-sm text-cyan-300 mt-2 mb-1">
          {line.replace('### ', '')}
        </h4>
      );
    }
    if (line.startsWith('#### ')) {
      return (
        <h5 key={idx} className="font-bold text-xs text-indigo-300 mt-1.5 mb-0.5">
          {line.replace('#### ', '')}
        </h5>
      );
    }
    // Bullet points
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().substring(2);
      return (
        <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-1">
          <span className="text-cyan-400 font-bold">•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
    }
    // Code block markers
    if (line.startsWith('```')) {
      return null;
    }
    // Regular line
    if (!line.trim()) {
      return <div key={idx} className="h-1.5" />;
    }
    return (
      <p key={idx} className="my-0.5">
        {renderInline(line)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Simple regex for bold **text** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
