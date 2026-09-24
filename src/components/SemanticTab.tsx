/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SelectStatementNode } from '../compiler/types';
import { SymbolTable } from '../compiler/symbolTable';
import { UNIVERSITY_SCHEMA } from '../compiler/database';
import {
  TableProperties,
  CheckCircle2,
  AlertCircle,
  Database,
  Key,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface SemanticTabProps {
  ast: SelectStatementNode | null;
  hasSemanticError: boolean;
}

export const SemanticTab: React.FC<SemanticTabProps> = ({ ast, hasSemanticError }) => {
  const symbolTable = new SymbolTable(UNIVERSITY_SCHEMA);

  if (ast?.fromTable) {
    symbolTable.registerTable(ast.fromTable.tableName, ast.fromTable.alias);
  }
  if (ast?.joins) {
    for (const j of ast.joins) {
      symbolTable.registerTable(j.table.tableName, j.table.alias);
    }
  }

  const activeTables = symbolTable.getAllActiveTables();

  const semanticChecks = [
    {
      title: 'Catalog Table Existence',
      desc: 'Verify referenced tables exist in database dictionary',
      status: ast?.fromTable ? (symbolTable.lookupTable(ast.fromTable.tableName) ? 'PASS' : 'FAIL') : 'SKIP',
    },
    {
      title: 'Column Resolution & Scope Binding',
      desc: 'Map projected attributes and qualifiers to active relations',
      status: hasSemanticError ? 'FAIL' : 'PASS',
    },
    {
      title: 'Type Checking & Domain Compatibility',
      desc: 'Verify operand types in binary comparison operators',
      status: hasSemanticError ? 'FAIL' : 'PASS',
    },
    {
      title: 'Semantic Constraints (LIMIT / OFFSET)',
      desc: 'Ensure pagination bounds are non-negative integers',
      status: ast?.limit && ast.limit.limit < 0 ? 'FAIL' : 'PASS',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Phase 3: Semantic Analysis & Symbol Table
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Scope & Type Checker
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforces type consistency, checks identifier existence in schema catalog, and resolves ambiguous references.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Active Scopes: {activeTables.length}</span>
        </div>
      </div>

      {/* Semantic Pipeline Verification Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {semanticChecks.map((chk, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              chk.status === 'PASS'
                ? 'bg-slate-900/60 border-emerald-800/40 text-slate-200'
                : chk.status === 'FAIL'
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs">{chk.title}</span>
                {chk.status === 'PASS' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : chk.status === 'FAIL' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <span className="text-[10px] text-slate-500">N/A</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">{chk.desc}</p>
            </div>
            <div className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider">
              Status: <span className={chk.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>{chk.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Symbol Table View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">
              Symbol Table Entries (Active Query Scope)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {activeTables.length === 0 ? 'No bound relations' : `${activeTables.length} relation(s) bound`}
          </span>
        </div>

        {activeTables.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No active tables bound in query scope.
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {activeTables.map(entry => (
              <div
                key={entry.tableName}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5"
              >
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-sm text-cyan-300 font-mono">
                      {entry.tableName}
                    </span>
                    {entry.alias && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        alias: {entry.alias}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {entry.schema.description}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-3">Column Identifier</th>
                        <th className="py-1.5 px-3">Data Type</th>
                        <th className="py-1.5 px-3">Constraints</th>
                        <th className="py-1.5 px-3">Semantic Semantics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {entry.schema.columns.map(col => (
                        <tr key={col.name} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-semibold text-slate-200">
                            {col.name}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                col.type === 'INTEGER' || col.type === 'REAL'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                                  : col.type === 'TEXT'
                                  ? 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
                                  : 'bg-purple-950/80 text-purple-300 border border-purple-800/80'
                              }`}
                            >
                              {col.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {col.primaryKey && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80">
                                <Key className="w-2.5 h-2.5" /> PRIMARY KEY
                              </span>
                            )}
                            {!col.nullable && !col.primaryKey && (
                              <span className="text-[10px] text-slate-500">NOT NULL</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px] font-sans">
                            {col.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
