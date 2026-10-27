import React, { useState } from 'react';
import { AuditCheck } from '../types';
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface AuditTrailProps {
  checks: AuditCheck[];
  confidenceScore: number;
  verdict: 'ANSWERED' | 'UNCERTAIN' | 'REFUSED';
  defaultExpanded?: boolean;
}

/**
 * Plain disclosure row for verification audit trail (NO nested boxes or panels)
 */
export const AuditTrail: React.FC<AuditTrailProps> = ({
  checks,
  confidenceScore,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;

  return (
    <div className="w-full pt-1">
      {/* Plain disclosure row (Chevron + label + count like "4 checks passed") */}
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="group flex items-center gap-2 py-1.5 text-xs text-[#B4BFDA] hover:text-[#F2F6FF] transition-colors text-left"
        aria-expanded={isExpanded}
      >
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8793B3] transition-transform duration-200 group-hover:text-[#F2F6FF] ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
        <span className="font-medium">Audit trail</span>
        <span className="font-mono text-[11px] text-[#34D399]">
          ({passCount} {passCount === 1 ? 'check' : 'checks'} passed
          {warningCount > 0 ? `, ${warningCount} advisory` : ''}
          {failCount > 0 ? `, ${failCount} failed` : ''})
        </span>
        <span className="text-[11px] text-[#8793B3] font-mono hidden sm:inline">
          • RMSE 0.18px • {confidenceScore > 0 ? `${confidenceScore}% confidence` : 'Refused'}
        </span>
      </button>

      {/* Clean Checklist (Check icon plus one line per check, NO nested boxes) */}
      {isExpanded && (
        <div className="pt-2 pb-1 pl-5 space-y-2 border-l border-[rgba(255,255,255,0.10)] ml-1.5 my-1">
          {checks.map(check => {
            const isPass = check.status === 'pass';
            const isWarning = check.status === 'warning';

            return (
              <div key={check.id} className="flex items-start gap-2.5 text-xs">
                <div className="mt-0.5 shrink-0">
                  {isPass && <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />}
                  {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" />}
                  {!isPass && !isWarning && <XCircle className="w-3.5 h-3.5 text-[#F87171]" />}
                </div>

                <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-[#F2F6FF]">
                    {check.name}
                  </span>
                  <span className="text-[#B4BFDA] text-[11px]">
                    {check.detail}
                  </span>
                  {check.metric && (
                    <span className="font-mono text-[10px] text-[#8793B3] ml-auto">
                      {check.metric}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
