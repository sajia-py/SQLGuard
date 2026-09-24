/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SecurityReport } from '../compiler/types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Shield,
  FileKey,
  Flame,
} from 'lucide-react';

interface SecurityTabProps {
  securityReport: SecurityReport;
  onApplySafeQuery?: (safeSql: string) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ securityReport, onApplySafeQuery }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySafe = () => {
    if (securityReport.safeAlternativeQuery) {
      navigator.clipboard.writeText(securityReport.safeAlternativeQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 50) return 'text-amber-400 stroke-amber-400';
    return 'text-rose-400 stroke-rose-400';
  };

  const isSafe = securityReport.status === 'SAFE';

  return (
    <div className="space-y-4">
      {/* Header & Gauge Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Phase 4: Security Analysis & Vulnerability Guard
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                securityReport.status === 'SAFE'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : securityReport.status === 'WARNING'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
              }`}
            >
              {securityReport.status} RISK
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {securityReport.explanation}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono text-slate-400">
            <span>Threats Found: {securityReport.issues.length}</span>
            <span>•</span>
            <span>Heuristic & AST Pattern Inspection</span>
            <span>•</span>
            <span className="text-cyan-400">CWE-89 Coverage</span>
          </div>
        </div>

        {/* Circular Risk Score Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={getScoreColor(securityReport.score)}
                strokeDasharray={`${securityReport.score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-base font-extrabold font-mono leading-none ${getScoreColor(securityReport.score)}`}>
                {securityReport.score}
              </span>
              <span className="text-[8px] text-slate-500 font-mono">/100</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Security Index</div>
            <div className="text-[11px] text-slate-400 font-mono">
              {securityReport.score >= 85
                ? 'High Resilience'
                : securityReport.score >= 50
                ? 'Moderate Caution'
                : 'Exploitable'}
            </div>
          </div>
        </div>
      </div>

      {/* Detected Vulnerabilities List */}
      {securityReport.issues.length === 0 ? (
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-6 text-center text-emerald-300">
          <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
          <h4 className="font-bold text-sm">No Suspicious SQL Injection Patterns Detected</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            The query was analyzed against tautology injections ('1'='1'), UNION exfiltration, stacked query execution, and destructive DDL signatures.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Vulnerability Findings ({securityReport.issues.length})
          </h4>

          {securityReport.issues.map(issue => (
            <div
              key={issue.id}
              className={`p-4 rounded-xl border ${
                issue.severity === 'CRITICAL'
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : issue.severity === 'HIGH'
                  ? 'bg-orange-950/40 border-orange-800/80 text-orange-200'
                  : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-bold text-sm text-slate-100">{issue.title}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      issue.severity === 'CRITICAL'
                        ? 'bg-rose-900/80 border-rose-700 text-rose-300'
                        : 'bg-amber-900/80 border-amber-700 text-amber-300'
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {issue.cwe}
                </span>
              </div>

              <p className="text-xs text-slate-300">{issue.description}</p>

              {/* Matched Pattern */}
              <div className="mt-2.5 p-2 bg-slate-950/90 rounded-lg border border-slate-800 font-mono text-xs">
                <span className="text-slate-500 mr-2">Signature Pattern:</span>
                <span className="text-rose-400 font-bold">{issue.patternFound}</span>
              </div>

              {/* Technical Risk & Remediation */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800">
                  <div className="font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Attack Impact</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {issue.riskExplanation}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800">
                  <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recommended Mitigation</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {issue.remediation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Parameterized Prepared Statement Solution */}
      {securityReport.safeAlternativeQuery && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileKey className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-xs sm:text-sm text-slate-200">
                Safe Parameterized Representation (Prepared Statement)
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySafe}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            In production applications, never concatenate user inputs into SQL strings. Use parameter markers (<code className="text-cyan-300">?</code>) so the database engine compiles the query plan before data is bound:
          </p>

          <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-300/90 leading-5 overflow-x-auto">
            {securityReport.safeAlternativeQuery}
          </pre>
        </div>
      )}
    </div>
  );
};
