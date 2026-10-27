import React, { useState } from 'react';
import { AuditCheck } from '../types';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';

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
    <div className="rounded-xl border border-[#151D33] bg-[#05070F] overflow-hidden text-xs transition-all">
      {/* Header Button to Toggle Accordion */}
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 bg-[#0A0F1D] hover:bg-[#0F1627] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#E8EEFC] text-xs">
            {isExpanded ? `Hide ${checks.length} verification steps` : `View ${checks.length} verification steps`}
          </span>
          <span className="text-[11px] text-[#8A97B8] font-mono">
            • RMSE 0.18px • {confidenceScore > 0 ? `${confidenceScore}% confidence` : 'Refused by policy'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="inline-flex items-center gap-0.5 text-[#34D399]">
              <CheckCircle2 className="w-3 h-3" /> {passCount}
            </span>
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[#FBBF24]">
                <AlertTriangle className="w-3 h-3" /> {warningCount}
              </span>
            )}
            {failCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[#F87171]">
                <XCircle className="w-3 h-3" /> {failCount}
              </span>
            )}
          </div>
          <span className="text-[#8A97B8]">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {/* Expanded Checklist */}
      {isExpanded && (
        <div className="p-3.5 space-y-2 border-t border-[#151D33] bg-[#05070F]">
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
                      ? 'bg-[#0A0F1D] border-[#34D399]/20'
                      : isWarning
                      ? 'bg-[#FBBF24]/5 border-[#FBBF24]/20'
                      : 'bg-[#F87171]/5 border-[#F87171]/20'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isPass && <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />}
                    {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" />}
                    {isFail && <XCircle className="w-3.5 h-3.5 text-[#F87171]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[#E8EEFC] text-xs">
                        {check.name}
                      </span>
                      {check.metric && (
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                            isPass
                              ? 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20'
                              : isWarning
                              ? 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20'
                              : 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20'
                          }`}
                        >
                          {check.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8A97B8] mt-0.5 leading-relaxed">
                      {check.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#151D33] flex items-center justify-between text-[10px] font-mono text-[#5A6685]">
            <span>Drishti Verification Engine</span>
            <span className="flex items-center gap-1 text-[#8A97B8]">
              <ShieldCheck className="w-3 h-3 text-[#22D3EE]" /> Ground-Truth Calibrated
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
