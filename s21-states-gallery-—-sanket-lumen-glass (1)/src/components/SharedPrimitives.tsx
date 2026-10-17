import React from 'react';
import { CompletenessBand, EvidenceState } from '../utils/sanketLogic';

export const SanketLogoMark: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const dims =
    size === 'sm'
      ? 'w-8 h-8 rounded-[10px]'
      : size === 'lg'
      ? 'w-12 h-12 rounded-[14px]'
      : 'w-9 h-9 rounded-[12px]';
  const svgDims = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div
      className={`${dims} bg-white border border-slate-200/90 shadow-xs flex items-center justify-center shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={svgDims}
        aria-hidden="true"
      >
        <g fill="#05070B">
          <path d="M 47.5 19.0 H 70.2 C 71.6 19.0 72.3 20.7 71.3 21.8 L 64.2 29.8 C 63.6 30.4 62.8 30.8 61.9 30.8 H 47.5 C 41.6 30.8 36.8 35.5 36.8 41.3 C 36.8 47.1 41.6 51.8 47.5 51.8 H 52.8 C 54.2 51.8 55.0 53.4 54.2 54.6 L 49.4 61.8 C 48.8 62.7 47.8 63.2 46.7 63.2 H 46.5 C 34.4 63.2 24.6 53.4 24.6 41.3 C 24.6 29.0 34.6 19.0 47.5 19.0 Z" />
          <path
            transform="rotate(180 50 50)"
            d="M 47.5 19.0 H 70.2 C 71.6 19.0 72.3 20.7 71.3 21.8 L 64.2 29.8 C 63.6 30.4 62.8 30.8 61.9 30.8 H 47.5 C 41.6 30.8 36.8 35.5 36.8 41.3 C 36.8 47.1 41.6 51.8 47.5 51.8 H 52.8 C 54.2 51.8 55.0 53.4 54.2 54.6 L 49.4 61.8 C 48.8 62.7 47.8 63.2 46.7 63.2 H 46.5 C 34.4 63.2 24.6 53.4 24.6 41.3 C 24.6 29.0 34.6 19.0 47.5 19.0 Z"
          />
        </g>
      </svg>
    </div>
  );
};

interface EvidenceChipProps {
  state: EvidenceState;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export const EVIDENCE_STATE_META: Record<
  EvidenceState,
  {
    icon: string;
    label: string;
    meaning: string;
    fieldTrigger: string;
    className: string;
  }
> = {
  OBSERVED: {
    icon: 'check_circle',
    label: 'Observed',
    meaning: 'A recorded fact in a source row',
    fieldTrigger: 'verification_status = VERIFIED / source row',
    className: 'bg-[#EEF2FF] text-[#4648D4] border border-[#6366F1]/40',
  },
  EXPECTED: {
    icon: 'diamond',
    label: 'Expected, not received',
    meaning: 'remittance_status = EXPECTED; never counted as money received',
    fieldTrigger: 'remittance_status = EXPECTED',
    className: 'bg-[#ECFEFF] text-[#0E7490] border border-dashed border-[#06B6D4]',
  },
  DELAYED: {
    icon: 'schedule',
    label: 'Delayed',
    meaning: 'remittance_status = DELAYED',
    fieldTrigger: 'remittance_status = DELAYED',
    className: 'bg-[#D99A36]/14 text-[#8A5A00] border border-dashed border-[#D99A36]/60',
  },
  DERIVED: {
    icon: 'functions',
    label: 'ƒ Derived',
    meaning: 'Counted or date-differenced by the interface from source fields; no formula involved',
    fieldTrigger: 'is_derived = TRUE',
    className: 'bg-[#F5F3FF] text-[#6D28D9] border border-[#8B5CF6]/40',
  },
  PROVISIONAL: {
    icon: 'science',
    label: 'Provisional',
    meaning: 'Placeholder or inferred value pending confirmation',
    fieldTrigger: 'survey_instrument_version / data_completeness_pct',
    className: 'hatch-provisional bg-white text-[#334155] border border-[#94A3B8]',
  },
  MISSING: {
    icon: 'radio_button_unchecked',
    label: 'Not recorded',
    meaning: 'Empty cell; never shown as 0',
    fieldTrigger: 'field IS NULL',
    className: 'bg-slate-50 text-[#475569] border border-dashed border-slate-400',
  },
  STALE: {
    icon: 'history',
    label: 'Older than 90 days',
    meaning: 'Record is older than the documented 90-day freshness window (P-10, CF-10)',
    fieldTrigger: 'freshness_days > 90 (SRC-2 D8, V-12)',
    className: 'bg-[#D99A36]/14 text-[#8A5A00] border border-[#D99A36]/45',
  },
  CONFLICT: {
    icon: 'report',
    label: 'Sources disagree',
    meaning: 'conflict_status = CONFLICT_DETECTED',
    fieldTrigger: 'conflict_status = CONFLICT_DETECTED',
    className: 'bg-[#FFDAD6] text-[#93000A] border border-[#BA1A1A]/40',
  },
  NOT_CONFIGURED: {
    icon: 'lock',
    label: 'Not yet configured',
    meaning: 'Needs an approved method or rule',
    fieldTrigger: 'DECISION_RULES_PENDING / dimension_scores = null',
    className: 'bg-slate-100 text-[#334155] border border-dashed border-slate-400',
  },
};

export const EvidenceChip: React.FC<EvidenceChipProps> = ({ state, customLabel, size = 'md' }) => {
  const meta = EVIDENCE_STATE_META[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[8px] font-inter font-medium whitespace-nowrap shrink-0 ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${meta.className}`}
    >
      <span className="material-symbols-outlined !text-[15px]" aria-hidden="true">
        {meta.icon}
      </span>
      <span>{customLabel || meta.label}</span>
    </span>
  );
};

export const CompletenessBar: React.FC<{
  pct: number;
  band: CompletenessBand;
  compact?: boolean;
}> = ({ pct, band, compact = false }) => {
  return (
    <div
      className="inline-flex items-center gap-2"
      title="Completeness percentage is a provisional proxy of 8 source-field readiness checks. Band does not indicate household quality."
    >
      {!compact && (
        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-[#5558E8] rounded-full"
            style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
          />
        </div>
      )}
      <span className="font-inter text-xs font-semibold text-[#0F172A] tabular-nums whitespace-nowrap">
        {pct.toFixed(1)}%
      </span>
      <span className="hatch-provisional inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] border border-slate-300 text-[11px] font-inter font-medium text-[#334155] whitespace-nowrap">
        {band} · provisional
      </span>
    </div>
  );
};

export const CopyableId: React.FC<{
  id: string;
  onClick?: () => void;
  onCopy?: (id: string) => void;
  className?: string;
}> = ({ id, onClick, onCopy, className = '' }) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id).catch(() => {});
    }
    onCopy?.(id);
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-inter font-semibold text-[#0F172A] tabular-nums whitespace-nowrap ${className}`}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="text-left text-[#4648D4] hover:underline focus-ring rounded px-0.5 font-inter font-semibold"
        >
          {id}
        </button>
      ) : (
        <span>{id}</span>
      )}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ID ${id}`}
        title={`Copy ${id}`}
        className="text-[#475569] hover:text-[#0F172A] p-0.5 rounded focus-ring inline-flex items-center"
      >
        <span className="material-symbols-outlined !text-[15px]" aria-hidden="true">
          content_copy
        </span>
      </button>
    </span>
  );
};

export const LegendModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) return null;
  const states = Object.keys(EVIDENCE_STATE_META) as EvidenceState[];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legend-modal-title"
    >
      <div className="surface-solid rounded-[24px] max-w-3xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#4648D4]">
              SANKET Lumen Glass · Evidence-state language
            </p>
            <h2 id="legend-modal-title" className="text-2xl font-bold text-[#0F172A] mt-1">
              How to read evidence states
            </h2>
            <p className="text-sm text-[#475569] mt-1">
              Colour never carries meaning alone: every state pairs an icon and a plain-language word. Expected remittances are never counted as money received, and missing records never read as 0.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close evidence legend modal"
            className="p-2 rounded-full hover:bg-slate-100 text-[#475569] focus-ring"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {states.map((st) => {
            const meta = EVIDENCE_STATE_META[st];
            return (
              <div key={st} className="p-3.5 rounded-[12px] border border-slate-200 bg-slate-50/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <EvidenceChip state={st} />
                  <span className="font-inter text-[11px] text-[#475569]">{meta.fieldTrigger}</span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">{meta.meaning}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-[#475569]">
            SANKET is read-only. Nothing in the data contract approves, rejects, or disburses a loan.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary-gradient px-5 py-2.5 rounded-[12px] text-sm font-semibold focus-ring"
          >
            Close legend
          </button>
        </div>
      </div>
    </div>
  );
};
