import React, { useState } from 'react';
import { AuditCheck } from '../types';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Cpu } from 'lucide-react';

interface AuditTrailProps {
  checks: AuditCheck[];
  confidenceScore: number;
  verdict: 'ANSWERED' | 'UNCERTAIN' | 'REFUSED';
  defaultExpanded?: boolean;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  checks,
  confidenceScore,
  verdict,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 overflow-hidden text-xs transition-all">
      {/* Header Button to Toggle Accordion */}
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 bg-slate-900/60 hover:bg-slate-900/90 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-800 text-cyan-400 border border-white/5">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-200 font-mono tracking-tight text-[11px] uppercase">
              Audit Trail & Guardrail Checks
            </span>
            <span className="text-[10px] text-slate-400 ml-2">
              ({passCount} passed{warningCount > 0 ? `, ${warningCount} warnings` : ''}{failCount > 0 ? `, ${failCount} failed` : ''})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="inline-flex items-center gap-0.5 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> {passCount}
            </span>
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-amber-400">
                <AlertTriangle className="w-3 h-3" /> {warningCount}
              </span>
            )}
            {failCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-rose-400">
                <XCircle className="w-3 h-3" /> {failCount}
              </span>
            )}
          </div>
          <span className="text-slate-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Expanded Checklist */}
      {isExpanded && (
        <div className="p-3.5 space-y-2.5 border-t border-white/5 bg-slate-950/80">
          <div className="space-y-2">
            {checks.map(check => {
              const isPass = check.status === 'pass';
              const isWarning = check.status === 'warning';
              const isFail = check.status === 'fail';

              return (
                <div
                  key={check.id}
                  className={`p-2.5 rounded-lg border transition-colors flex items-start gap-2.5 ${
                    isPass
                      ? 'bg-slate-900/40 border-emerald-500/20'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {isFail && <XCircle className="w-4 h-4 text-rose-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200 text-xs">
                        {check.name}
                      </span>
                      {check.metric && (
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                            isPass
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          }`}
                        >
                          {check.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {check.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Drishti Verification Engine v2.4</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-cyan-400" /> Ground-Truth Calibrated
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
