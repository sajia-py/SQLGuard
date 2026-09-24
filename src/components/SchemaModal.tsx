/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UNIVERSITY_SCHEMA, INITIAL_DATABASE_DATA } from '../compiler/database';
import { X, Database, Table, Key, FileText, ChevronRight } from 'lucide-react';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTableQuery?: (tableName: string) => void;
}

export const SchemaModal: React.FC<SchemaModalProps> = ({
  isOpen,
  onClose,
  onSelectTableQuery,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('students');
  const [activeTab, setActiveTab] = useState<'COLUMNS' | 'DATA'>('DATA');

  if (!isOpen) return null;

  const tableSchema = UNIVERSITY_SCHEMA.tables[selectedTable];
  const tableData = INITIAL_DATABASE_DATA[selectedTable] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Database Schema & Catalog Browser
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                5 persistent relations preloaded for query execution & security auditing
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
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Table List Sidebar */}
          <div className="w-full md:w-56 bg-slate-950/50 border-r border-slate-800 p-2 space-y-1 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Schema Tables
            </div>
            {Object.values(UNIVERSITY_SCHEMA.tables).map(t => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono font-semibold transition flex items-center justify-between group ${
                  selectedTable === t.name
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5" />
                  <span>{t.name}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition ${
                    selectedTable === t.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Table Details Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            {/* Table Header Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base font-mono text-cyan-300">
                    {tableSchema.name}
                  </span>
                  <span className="text-xs text-slate-400">({tableData.length} records)</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{tableSchema.description}</p>
              </div>

              {/* Tab Selector */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('DATA')}
                  className={`px-3 py-1 rounded-md transition font-semibold ${
                    activeTab === 'DATA'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Preview Data
                </button>
                <button
                  onClick={() => setActiveTab('COLUMNS')}
                  className={`px-3 py-1 rounded-md transition font-semibold ${
                    activeTab === 'COLUMNS'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Column Definitions
                </button>
              </div>
            </div>

            {/* Table Content Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {activeTab === 'DATA' ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        {tableSchema.columns.map(c => (
                          <th key={c.name} className="py-2 px-3 font-semibold">
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {tableData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          {tableSchema.columns.map(c => (
                            <td key={c.name} className="py-2 px-3 text-slate-200">
                              {String(row[c.name] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {tableSchema.columns.map(col => (
                    <div
                      key={col.name}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-200">{col.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
                          {col.type}
                        </span>
                        {col.primaryKey && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                            <Key className="w-3 h-3" /> PRIMARY KEY
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px] font-sans">
                        {col.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
