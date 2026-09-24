/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SelectStatementNode } from '../compiler/types';
import {
  FolderTree,
  Code,
  ChevronRight,
  ChevronDown,
  FileCode,
  Boxes,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

interface AstTabProps {
  ast: SelectStatementNode | null;
}

export const AstTab: React.FC<AstTabProps> = ({ ast }) => {
  const [viewMode, setViewMode] = useState<'TREE' | 'JSON'>('TREE');
  const [copied, setCopied] = useState(false);

  if (!ast) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Boxes className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <p className="font-semibold text-slate-300">AST Not Available</p>
        <p className="text-xs text-slate-500 mt-1">
          Fix the syntax error in your query to generate the Abstract Syntax Tree.
        </p>
      </div>
    );
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(ast, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Phase 2: Syntax Analysis & AST Generation
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              Recursive-Descent Parser
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Validates SQL query against Context-Free Grammar (CFG) and produces the hierarchical Abstract Syntax Tree.
          </p>
        </div>

        {/* View Toggle & Copy */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('TREE')}
              className={`px-3 py-1 rounded-md transition font-semibold flex items-center gap-1.5 ${
                viewMode === 'TREE'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Tree View</span>
            </button>
            <button
              onClick={() => setViewMode('JSON')}
              className={`px-3 py-1 rounded-md transition font-semibold flex items-center gap-1.5 ${
                viewMode === 'JSON'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          <button
            onClick={handleCopyJson}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Copy AST JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === 'TREE' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto shadow-md">
          <div className="font-mono text-xs">
            <AstNodeView label="SelectStatement" node={ast} isRoot />
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <pre className="font-mono text-xs text-cyan-300/90 leading-5">
            {JSON.stringify(ast, null, 2)}
          </pre>
        </div>
      )}

      {/* Grammar Rules Reference Box */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span>Active BNF Grammar Specification:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400 text-[11px]">
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
            <span className="text-cyan-300">query</span> → SELECT &lt;projection_list&gt; FROM &lt;table&gt; [WHERE &lt;cond&gt;] [ORDER BY &lt;col&gt;] [LIMIT &lt;n&gt;]
          </div>
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
            <span className="text-cyan-300">condition</span> → expression ((AND | OR) expression)*
          </div>
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
            <span className="text-cyan-300">expression</span> → &lt;identifier&gt; (= | &gt; | &lt; | &gt;= | &lt;= | != | LIKE) &lt;literal&gt;
          </div>
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
            <span className="text-cyan-300">join_clause</span> → (INNER | LEFT | RIGHT) JOIN &lt;table&gt; ON &lt;binary_expr&gt;
          </div>
        </div>
      </div>
    </div>
  );
};

// Recursive AST Node Visualizer component
const AstNodeView: React.FC<{ label: string; node: any; isRoot?: boolean }> = ({
  label,
  node,
  isRoot,
}) => {
  const [expanded, setExpanded] = useState(true);

  if (node === null || node === undefined) {
    return (
      <div className="pl-4 py-0.5 text-slate-500">
        <span className="text-slate-400">{label}:</span> null
      </div>
    );
  }

  if (typeof node !== 'object') {
    return (
      <div className="pl-4 py-0.5 text-slate-300">
        <span className="text-slate-400">{label}:</span>{' '}
        <span className="text-cyan-300 font-bold">{String(node)}</span>
      </div>
    );
  }

  if (Array.isArray(node)) {
    return (
      <div className="pl-4 py-1">
        <div
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer hover:text-cyan-300 flex items-center gap-1 text-slate-300 select-none"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="font-semibold text-indigo-400">{label}</span>
          <span className="text-slate-500 text-[10px]">[{node.length} items]</span>
        </div>
        {expanded && (
          <div className="border-l border-slate-800 ml-2 pl-2 space-y-1 mt-1">
            {node.map((item, idx) => (
              <AstNodeView key={idx} label={`[${idx}]`} node={item} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const nodeType = node.type || label;

  return (
    <div className={isRoot ? '' : 'pl-4 py-1'}>
      <div
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer hover:bg-slate-800/40 px-1 py-0.5 rounded flex items-center gap-1.5 text-slate-200 select-none group"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
        )}
        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
          {nodeType}
        </span>

        {/* Inline summary badges */}
        {node.operator && (
          <span className="text-pink-400 font-bold text-[11px] px-1.5 py-0.5 rounded bg-pink-950/60 border border-pink-800">
            op: {node.operator}
          </span>
        )}
        {node.tableName && (
          <span className="text-emerald-400 text-[11px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
            table: {node.tableName}
          </span>
        )}
        {node.columnName && (
          <span className="text-amber-400 text-[11px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800">
            col: {node.columnName}
          </span>
        )}
        {node.value !== undefined && (
          <span className="text-purple-400 text-[11px] px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800">
            val: {String(node.value)}
          </span>
        )}
      </div>

      {expanded && (
        <div className="border-l-2 border-slate-800/80 ml-2.5 pl-3 space-y-1 mt-1">
          {Object.entries(node).map(([key, val]) => {
            if (['type', 'rawSql', 'line', 'column'].includes(key)) return null;
            return <AstNodeView key={key} label={key} node={val} />;
          })}
        </div>
      )}
    </div>
  );
};
