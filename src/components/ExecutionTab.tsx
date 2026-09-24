/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ExecutionResult } from '../compiler/types';
import {
  Play,
  Clock,
  Database,
  Search,
  Download,
  CheckCircle2,
  Table,
  ArrowUpDown,
} from 'lucide-react';

interface ExecutionTabProps {
  executionResult: ExecutionResult | null;
}

export const ExecutionTab: React.FC<ExecutionTabProps> = ({ executionResult }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  if (!executionResult) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
        Execution skipped. Please resolve compilation or semantic diagnostics first.
      </div>
    );
  }

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const filteredRows = useMemo(() => {
    let rows = [...executionResult.rows];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter(r =>
        Object.values(r).some(val => String(val).toLowerCase().includes(term))
      );
    }

    if (sortCol) {
      rows.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [executionResult.rows, searchTerm, sortCol, sortAsc]);

  const handleExportCsv = () => {
    if (executionResult.columns.length === 0) return;
    const header = executionResult.columns.join(',');
    const rows = executionResult.rows.map(r =>
      executionResult.columns.map(col => JSON.stringify(r[col] ?? '')).join(',')
    );
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sqlguard_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header & Runtime Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Phase 7: Relational Database Execution
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Live SQLite-Compatible Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Executes validated query plan against the populated university relational dataset.
          </p>
        </div>

        {/* Runtime Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{executionResult.executionTimeMs} ms</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{executionResult.rowCount} tuples returned</span>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={executionResult.rowCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 disabled:opacity-50"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Filter results..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredRows.length} of {executionResult.rowCount} rows
        </span>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            Query returned 0 records matching condition.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-300 uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-slate-800 select-none">
                <tr>
                  <th className="py-2.5 px-4 text-slate-500 w-12">#</th>
                  {executionResult.columns.map(col => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="py-2.5 px-4 cursor-pointer hover:text-cyan-300 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 text-slate-500">{idx + 1}</td>
                    {executionResult.columns.map(col => (
                      <td key={col} className="py-2.5 px-4 text-slate-200 font-medium">
                        {row[col] === null || row[col] === undefined ? (
                          <span className="text-slate-600 italic">NULL</span>
                        ) : typeof row[col] === 'boolean' ? (
                          <span className="text-purple-400">{String(row[col])}</span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Execution Engine Plan Logs */}
      {executionResult.planNotes && executionResult.planNotes.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs font-mono text-slate-400">
          <div className="font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>Relational Engine Trace Log:</span>
          </div>
          <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px]">
            {executionResult.planNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
