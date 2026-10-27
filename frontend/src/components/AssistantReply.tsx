import React, { useState } from 'react';
import { DrishtiAnswer, AttachedImage } from '../types';
import { EvidenceImageViewer } from './EvidenceImageViewer';
import { AuditTrail } from './AuditTrail';
import { ComparisonSlider } from './ComparisonSlider';
import { Logo } from './Logo';
import { SAMPLE_IMAGES } from '../constants/sampleData';
import {
  Copy,
  Download,
  RotateCcw,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface AssistantReplyProps {
  answer: DrishtiAnswer;
  timestamp?: string;
  comparisonPair?: {
    before: AttachedImage;
    after: AttachedImage;
  };
  onRerun?: () => void;
  onCopy?: () => void;
  onExportPdf?: () => void;
}

export const AssistantReply: React.FC<AssistantReplyProps> = ({
  answer,
  timestamp = 'Just now',
  comparisonPair,
  onRerun,
  onCopy,
  onExportPdf
}) => {
  const [copied, setCopied] = useState(false);

  const isRefused = answer.verdict === 'REFUSED';
  const isUncertain = answer.verdict === 'UNCERTAIN';

  const getVerdictStyle = (v: string) => {
    switch (v) {
      case 'ANSWERED':
        return {
          color: '#34D399',
          bg: 'rgba(52, 211, 153, 0.12)',
          border: 'rgba(52, 211, 153, 0.25)',
          label: 'ANSWERED'
        };
      case 'UNCERTAIN':
        return {
          color: '#FBBF24',
          bg: 'rgba(251, 191, 36, 0.12)',
          border: 'rgba(251, 191, 36, 0.25)',
          label: 'UNCERTAIN'
        };
      case 'REFUSED':
      default:
        return {
          color: '#F87171',
          bg: 'rgba(248, 113, 113, 0.12)',
          border: 'rgba(248, 113, 113, 0.25)',
          label: 'REFUSED'
        };
    }
  };

  const verdictStyle = getVerdictStyle(answer.verdict);

  const handleCopy = () => {
    const textToCopy = `${answer.headline}\n\n${answer.summary}\n\nVerdict: ${answer.verdict}${answer.verdictReason ? ` (${answer.verdictReason})` : ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    });
  };

  return (
    <article className="w-full space-y-4 text-left py-1 font-sans">
      {/* Header: Small Avatar + Drishti Name + Timestamp */}
      <div className="flex items-center gap-2.5">
        <Logo size={24} />
        <span className="font-semibold text-sm text-[#E8ECF4]">
          Drishti
        </span>
        <span className="text-xs text-[#6B7385] font-mono">
          {timestamp}
        </span>
      </div>

      {/* ===================================================================
          1. THE ANSWER TEXT (Count, location, change report, summary)
          =================================================================== */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[#E8ECF4] tracking-tight">
          {answer.headline}
        </h2>

        {answer.metricValue && (
          <div className="flex items-baseline gap-2 py-0.5">
            <span className="text-2xl font-bold font-mono text-[#22D3EE]">
              {answer.metricValue}
            </span>
            {answer.metricUnit && (
              <span className="text-xs font-mono uppercase text-[#9AA3B5]">
                {answer.metricUnit}
              </span>
            )}
          </div>
        )}

        <p className="text-[16px] leading-[1.65] text-[#E8ECF4] whitespace-pre-wrap">
          {answer.summary}
        </p>
      </div>

      {/* ===================================================================
          2. THE IMAGE WITH EVIDENCE OVERLAYS (Boxes / Masks toggle, Lightbox)
          =================================================================== */}
      {!isRefused && (() => {
        const resolvedComparison = comparisonPair || (
          (answer.headline.toLowerCase().includes('canopy') ||
           answer.summary.toLowerCase().includes('bi-temporal') ||
           answer.summary.toLowerCase().includes('temporal change'))
            ? { before: SAMPLE_IMAGES.forestBefore, after: SAMPLE_IMAGES.forestAfter }
            : undefined
        );

        return (
          <div className="w-full rounded-xl overflow-hidden border border-[#262C3A]">
            {resolvedComparison ? (
              <ComparisonSlider
                beforeImage={resolvedComparison.before}
                afterImage={resolvedComparison.after}
                polygons={answer.polygons}
              />
            ) : answer.imageUrl ? (
              <EvidenceImageViewer
                imageUrl={answer.imageUrl}
                imageAlt={answer.headline}
                boxes={answer.boxes || []}
                polygons={answer.polygons || []}
                verdict={answer.verdict}
                confidenceScore={answer.confidenceScore || 95}
                categoryBreakdown={answer.categoryBreakdown}
              />
            ) : null}
          </div>
        );
      })()}

      {/* ===================================================================
          3. VERDICT BADGE (ANSWERED / UNCERTAIN / REFUSED, with stated reason)
          =================================================================== */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border"
            style={{
              backgroundColor: verdictStyle.bg,
              color: verdictStyle.color,
              borderColor: verdictStyle.border
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: verdictStyle.color }}
            />
            <span>{verdictStyle.label}</span>
          </div>
        </div>

        {/* Stated reason for REFUSED or UNCERTAIN */}
        {(isRefused || isUncertain) && answer.verdictReason && (
          <p className="text-xs text-[#9AA3B5] font-mono pl-0.5">
            <span className="text-[#FBBF24] font-semibold">Reason: </span>
            {answer.verdictReason}
          </p>
        )}
      </div>

      {/* ===================================================================
          4. COLLAPSED "AUDIT TRAIL" ACCORDION (Monospace)
          =================================================================== */}
      {answer.auditTrail && answer.auditTrail.length > 0 && (
        <div className="pt-1">
          <AuditTrail
            checks={answer.auditTrail}
            confidenceScore={answer.confidenceScore}
            verdict={answer.verdict}
            defaultExpanded={false}
          />
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center gap-3 pt-1 text-xs text-[#6B7385]">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-[#E8ECF4] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {onRerun && (
          <button
            type="button"
            onClick={onRerun}
            className="flex items-center gap-1 hover:text-[#E8ECF4] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rerun</span>
          </button>
        )}

        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="flex items-center gap-1 hover:text-[#E8ECF4] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </article>
  );
};
