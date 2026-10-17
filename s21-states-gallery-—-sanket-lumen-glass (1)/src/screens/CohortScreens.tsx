import React, { useState } from 'react';
import { HOUSEHOLDS_DATA, HouseholdProfile } from '../data/sanketData';
import {
  RoleId,
  ScreenId,
  formatDateDisplay,
  formatINR,
  mapStatusToOfficerLabel,
} from '../utils/sanketLogic';
import { CompletenessBar, CopyableId, EvidenceChip } from '../components/SharedPrimitives';
import { RestrictedAccessCard } from '../components/HouseholdProfileHeader';

interface S02Props {
  role: RoleId;
  onNavigate: (screen: ScreenId, filterPreset?: string) => void;
  onSelectHousehold: (id: string, targetScreen?: ScreenId) => void;
  onCopyId: (id: string) => void;
}

const OFFICER_COHORT_LANES = [
  { id: 'SANKET-HH-000110', village: 'Kabisuryanagar', dueDay: 18, dueDate: '18 Oct 2026', dueAmt: 3080, remitDay: null, remitDate: '3 Nov 2025 (confirmed)', remitAmt: 22000, remitState: 'STALE' as const, gapText: 'Older than 90 days (311d)' },
  { id: 'SANKET-HH-000103', village: 'Chhatrapur', dueDay: 20, dueDate: '20 Oct 2026', dueAmt: 2340, remitDay: 37, remitDate: '6 Nov 2026', remitAmt: 28000, remitState: 'EXPECTED' as const, gapText: '17 days before remittance' },
  { id: 'SANKET-HH-000117', village: 'Brahmapur', dueDay: 22, dueDate: '22 Oct 2026', dueAmt: 3050, remitDay: 39, remitDate: '8 Nov 2026', remitAmt: 31000, remitState: 'EXPECTED' as const, gapText: '17 days before remittance' },
  { id: 'SANKET-HH-000106', village: 'Brahmapur', dueDay: 25, dueDate: '25 Oct 2026', dueAmt: 3420, remitDay: 53, remitDate: '22 Nov 2026', remitAmt: 26000, remitState: 'DELAYED' as const, gapText: '28 days before delayed remittance' },
  { id: 'SANKET-HH-000101', village: 'Brahmapur', dueDay: 28, dueDate: '28 Oct 2026', dueAmt: 4170, remitDay: 36, remitDate: '5 Nov 2026', remitAmt: 35000, remitState: 'EXPECTED' as const, gapText: '8 days before remittance' },
  { id: 'SANKET-HH-000126', village: 'Chhatrapur', dueDay: 28, dueDate: '28 Oct 2026', dueAmt: 3800, remitDay: 8, remitDate: '8 Oct 2026', remitAmt: 36000, remitState: 'OBSERVED' as const, gapText: 'Confirmed 8 Oct 2026' },
  { id: 'SANKET-HH-000121', village: 'Bhanjanagar', dueDay: 30, dueDate: '30 Oct 2026', dueAmt: 2950, remitDay: 43, remitDate: '12 Nov 2026', remitAmt: 27000, remitState: 'EXPECTED' as const, gapText: '13 days before remittance' },
  { id: 'SANKET-HH-000109', village: 'Bhanjanagar', dueDay: 39, dueDate: '8 Nov 2026', dueAmt: 3560, remitDay: 35, remitDate: '4 Nov 2026', remitAmt: 29000, remitState: 'CONFLICT' as const, gapText: 'Loan balance conflict' },
  { id: 'SANKET-HH-000120', village: 'Brahmapur', dueDay: 41, dueDate: '10 Nov 2026', dueAmt: 3650, remitDay: 37, remitDate: '6 Nov / 15 Nov', remitAmt: 30000, remitState: 'CONFLICT' as const, gapText: 'Remittance conflict' },
  { id: 'SANKET-HH-000113', village: 'Chhatrapur', dueDay: 42, dueDate: '11 Nov 2026', dueAmt: 3290, remitDay: 49, remitDate: '18 Nov 2026', remitAmt: 32000, remitState: 'EXPECTED' as const, gapText: '7 days before remittance' },
  { id: 'SANKET-HH-000129', village: 'Chhatrapur', dueDay: 43, dueDate: '12 Nov 2026', dueAmt: 2740, remitDay: 2, remitDate: '2 Oct 2026', remitAmt: 19500, remitState: 'OBSERVED' as const, gapText: 'Returned migrant' },
  { id: 'SANKET-HH-000124', village: 'Kabisuryanagar', dueDay: null, dueDate: '— extract out of date', dueAmt: 3450, remitDay: null, remitDate: 'Not recorded', remitAmt: null, remitState: 'STALE' as const, gapText: 'Older than 90 days (111d)' },
];

export const S02Overview: React.FC<S02Props> = ({
  role,
  onNavigate,
  onSelectHousehold,
  onCopyId,
}) => {
  const [rangeWindow, setRangeWindow] = useState<'14d' | '45d'>('45d');
  const [chartTab, setChartTab] = useState<'CURVE' | 'LANES' | 'TABLE'>('CURVE');
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>('SANKET-HH-000101');
  const [deferralPreviewDays, setDeferralPreviewDays] = useState(14);
  const [rbacToggle, setRbacToggle] = useState(true);
  const [maskingToggle, setMaskingToggle] = useState(true);

  const visibleLanes =
    rangeWindow === '14d'
      ? OFFICER_COHORT_LANES.filter((l) => l.dueDay !== null && l.dueDay <= 31)
      : OFFICER_COHORT_LANES;

  const selectedLane =
    OFFICER_COHORT_LANES.find((l) => l.id === selectedLaneId) || OFFICER_COHORT_LANES[4];

  const roleDisplayName =
    role === 'FIELD_OFFICER'
      ? 'Field Officer'
      : role === 'PORTFOLIO_MANAGER'
      ? 'Portfolio Manager'
      : 'Compliance Reviewer';

  if (role === 'PORTFOLIO_MANAGER') {
    return (
      <div className="space-y-6">
        <div className="surface-solid rounded-[20px] p-4 border-l-4 border-l-[#7C3AED] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm font-medium text-[#0F172A]">
            <span className="material-symbols-outlined text-[#6D28D9]">shield_lock</span>
            <span>Aggregates only. Household details are not available to this role.</span>
          </div>
          <span className="font-inter text-xs text-[#475569]">30 synthetic households · 3 FSP partners</span>
        </div>

        <div className="glass-1 rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3.5 py-1.5 rounded-full bg-white/95 border border-white shadow-2xs font-inter text-xs font-semibold text-[#0F172A] inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined !text-[15px] text-[#6366F1]">calendar_today</span>
                <span>Saturday, October 17</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50/95 border border-emerald-200/80 font-inter text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>AGGREGATE NODE: 3 PARTNERS · 30 HOUSEHOLDS</span>
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight">
              Welcome back, <span className="text-gradient-lumen">Portfolio Manager</span>
            </h1>
            <p className="text-sm text-[#475569] max-w-2xl">
              Descriptive aggregate counts across FSP-SYN-01, FSP-SYN-02 and FSP-SYN-03. Groups with fewer than 5 households show &ldquo;&lt;5&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('S12')}
            className="btn-primary-gradient px-6 py-3.5 rounded-full text-xs font-inter font-bold whitespace-nowrap shrink-0 focus-ring"
          >
            Open Portfolio Insights
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'PARTNERS IN VIEW', val: '3', sub: 'FSP-SYN-01, 02, 03', badge: 'ALL ACTIVE', target: 'S12' as ScreenId },
            { label: 'HOUSEHOLDS IN AGGREGATE', val: '30', sub: '12 + 6 + 12 across cohorts', badge: '19 MIGRANT', target: 'S12' as ScreenId },
            { label: 'HOUSEHOLDS WITH DATA WARNINGS', val: '16', sub: 'Aggregate count across partners', badge: '2 CONFLICTS', target: 'S13' as ScreenId },
            { label: 'INSTALMENTS DUE IN 14 DAYS', val: '14', sub: 'By 31 Oct 2026 across 3 FSPs', badge: '330 TOTAL', target: 'S12' as ScreenId },
          ].map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => onNavigate(k.target)}
              className="surface-solid rounded-[26px] p-5 text-left hover:translate-y-[-2px] transition-all focus-ring space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[12px] bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center">
                  <span className="material-symbols-outlined !text-[20px]">insights</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 font-inter text-[11px] font-bold text-emerald-700">
                  {k.badge}
                </span>
              </div>
              <div>
                <span className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  {k.label}
                </span>
                <p className="text-3xl font-extrabold font-inter text-[#0F172A] mt-1 tabular-nums">{k.val}</p>
              </div>
              <p className="text-xs text-[#64748B] pt-1 border-t border-slate-100">{k.sub}</p>
            </button>
          ))}
        </div>

        <div className="surface-solid rounded-[28px] p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Instalments and Expected Remittances by Week (Aggregate)
              </h2>
              <p className="text-xs text-[#475569]">
                Weekly counts of scheduled instalments and expected remittance dates across 30 households. No household IDs are shown.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('S12')}
              className="text-xs font-inter font-semibold text-[#6D28D9] hover:underline"
            >
              View full distribution charts (S12) →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {[
              { week: 'Week of 12 Oct', inst: 2, remit: 1 },
              { week: 'Week of 19 Oct', inst: 8, remit: 2 },
              { week: 'Week of 26 Oct', inst: 4, remit: 3 },
              { week: 'Week of 2 Nov', inst: 6, remit: 6 },
              { week: 'Week of 9 Nov', inst: 9, remit: 4 },
            ].map((w) => (
              <div key={w.week} className="p-4 rounded-[16px] bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-inter text-xs font-semibold text-[#0F172A]">{w.week}</p>
                <div className="space-y-1 text-xs font-inter">
                  <div className="flex items-center justify-between">
                    <span className="text-[#334155]">Instalments:</span>
                    <span className="font-bold text-[#6D28D9] tabular-nums">{w.inst}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#0E7490]">Expected remit:</span>
                    <span className="font-bold text-[#0E7490] tabular-nums">{w.remit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Welcome Panel (matching Lumina reference image) */}
      <section aria-labelledby="overview-hero-heading" className="glass-1 rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3.5 py-1.5 rounded-full bg-white/95 border border-white shadow-2xs font-inter text-xs font-semibold text-[#0F172A] inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined !text-[15px] text-[#6366F1]">
                  calendar_today
                </span>
                <span>Saturday, October 17</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50/95 border border-emerald-200/80 font-inter text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                <span>SCHEMA VALIDATION: PASSED 904 / 904 (100%)</span>
              </span>
            </div>

            <h1
              id="overview-hero-heading"
              className="text-3xl sm:text-4xl md:text-[44px] font-extrabold text-[#0F172A] tracking-tight leading-tight"
            >
              Welcome back, <span className="text-gradient-lumen">{roleDisplayName}</span>
            </h1>

            <p className="text-sm md:text-[15px] text-[#475569] max-w-2xl leading-relaxed">
              Cross-source household intelligence indicates 12 active households in FSP-SYN-01. 7 instalments fall due in the next 14 days and 7 households have data warnings awaiting officer verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('S13')}
              className="px-5 py-3.5 rounded-full bg-white/90 hover:bg-white border border-white shadow-sm text-xs font-inter font-bold text-[#0F172A] whitespace-nowrap focus-ring inline-flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined !text-[18px] text-[#475569]">
                cloud_done
              </span>
              <span>Review data warnings</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('S03', 'ALL')}
              className="btn-primary-gradient px-6 py-3.5 rounded-full text-xs font-inter font-bold whitespace-nowrap focus-ring inline-flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined !text-[18px]">add_circle</span>
              <span>Open worklist</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Row of 4 KPI Cards (AC-S02-1: 12, 0 of 12, 7, 7; FO-INT-032..035; Lumen Glass visual style) */}
      <section
        aria-label="Cohort summary indicators"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {/* KPI 1 (FO-INT-032): Households in your worklist · 12 -> S03 tab All */}
        <button
          type="button"
          onClick={() => onNavigate('S03', 'ALL')}
          className="surface-solid rounded-[26px] p-5 text-left hover:translate-y-[-2px] transition-all focus-ring flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined !text-[20px]">hub</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 font-inter text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">trending_up</span>
              <span>FSP-SYN-01</span>
            </span>
          </div>
          <div>
            <span className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              HOUSEHOLDS IN YOUR WORKLIST
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-[30px] font-extrabold font-inter text-[#0F172A] tabular-nums tracking-tight leading-none">
                12
              </p>
              <svg viewBox="0 0 90 28" className="w-24 h-7 overflow-visible" aria-hidden="true">
                <path
                  d="M 2 22 Q 20 20, 32 14 T 62 12 T 82 6"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="82" cy="6" r="4" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2.5" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-inter pt-1 border-t border-slate-100">
            <span className="text-[#64748B] inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" /> Assigned cohort
            </span>
            <span className="font-bold text-[#4F46E5]">Open worklist →</span>
          </div>
        </button>

        {/* KPI 2 (FO-INT-033): Ready for officer review · 0 of 12 -> S10 queue */}
        <button
          type="button"
          onClick={() => onNavigate('S10')}
          className="surface-solid rounded-[26px] p-5 text-left hover:translate-y-[-2px] transition-all focus-ring flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined !text-[20px]">fact_check</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 font-inter text-[11px] font-bold text-[#475569] inline-flex items-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">lock</span>
              <span>Q-06 / Q-13</span>
            </span>
          </div>
          <div>
            <span className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              READY FOR OFFICER REVIEW
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-[30px] font-extrabold font-inter text-[#0F172A] tabular-nums tracking-tight leading-none">
                0 of 12
              </p>
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90" aria-hidden="true">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#8B3DFF"
                    strokeWidth="3.5"
                    strokeDasharray="68 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-inter text-[9px] font-extrabold text-[#0F172A]">
                  0/12
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-inter pt-1 border-t border-slate-100">
            <span className="text-[#64748B]">Decision rules pending</span>
            <span className="font-bold text-[#6D28D9]">Review queue →</span>
          </div>
        </button>

        {/* KPI 3 (FO-INT-034): Households with data warnings · 7 -> S03 Needs verification */}
        <button
          type="button"
          onClick={() => onNavigate('S03', 'WARNINGS')}
          className="surface-solid rounded-[26px] p-5 text-left hover:translate-y-[-2px] transition-all focus-ring flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined !text-[20px]">verified_user</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 font-inter text-[11px] font-bold text-[#8A5A00] inline-flex items-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">report</span>
              <span>2 Conflicts</span>
            </span>
          </div>
          <div>
            <span className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              HOUSEHOLDS WITH DATA WARNINGS
            </span>
            <p className="text-[30px] font-extrabold font-inter text-[#0F172A] mt-1 tabular-nums tracking-tight leading-none">
              7
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: '58.3%',
                  background: 'linear-gradient(90deg, #F97316 0%, #8B3DFF 100%)',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-inter">
              <span className="text-[#64748B]">Unverified, old or conflict</span>
              <span className="font-bold text-[#0F172A]">Needs verification →</span>
            </div>
          </div>
        </button>

        {/* KPI 4 (FO-INT-035): Instalments due in 14 days · 7 -> S03 Due in 14 days */}
        <button
          type="button"
          onClick={() => onNavigate('S03', 'DUE_14')}
          className="surface-solid rounded-[26px] p-5 text-left hover:translate-y-[-2px] transition-all focus-ring flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-[12px] bg-[#ECFEFF] text-[#0D9488] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined !text-[20px]">payments</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 font-inter text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">trending_up</span>
              <span>₹22,810.00</span>
            </span>
          </div>
          <div>
            <span className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              INSTALMENTS DUE IN 14 DAYS
            </span>
            <p className="text-[30px] font-extrabold font-inter text-[#0F172A] mt-1 tabular-nums tracking-tight leading-none">
              7
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-inter pt-1 border-t border-slate-100">
            <span className="text-[#64748B]">17 Oct – 31 Oct 2026</span>
            <span className="font-bold text-[#0E7490]">Due in 14 days →</span>
          </div>
        </button>
      </section>

      {/* 3. Main 12-column Grid: 8 cols Analysis + Attribution/Queues + 4 cols Right Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Large Analysis Panel (matching "Revenue & Growth Velocity" card in reference image) */}
          <section className="surface-solid rounded-[28px] p-6 md:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
                  <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                    Seasonal Cash Flow &amp; Obligation Velocity
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Real-time schedule aggregate across 12 FSP-SYN-01 loan accounts and migration remittance corridors.
                </p>
              </div>

              <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200/80 shrink-0">
                {[
                  { id: '14D', label: '14D', action: () => { setRangeWindow('14d'); setChartTab('CURVE'); } },
                  { id: '45D', label: '45D', action: () => { setRangeWindow('45d'); setChartTab('CURVE'); } },
                  { id: 'LANES', label: 'Lanes', action: () => setChartTab('LANES') },
                  { id: 'TABLE', label: 'Table', action: () => setChartTab('TABLE') },
                ].map((tab) => {
                  const isActive =
                    (tab.id === '14D' && rangeWindow === '14d' && chartTab === 'CURVE') ||
                    (tab.id === '45D' && rangeWindow === '45d' && chartTab === 'CURVE') ||
                    (tab.id === 'LANES' && chartTab === 'LANES') ||
                    (tab.id === 'TABLE' && chartTab === 'TABLE');
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={tab.action}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-inter font-bold transition-all ${
                        isActive ? 'btn-primary-gradient text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Three Vibrant Gradient Metric Cards (Cyan, Purple, Orange — matching reference image) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-gradient-cyan rounded-[22px] p-5 space-y-1.5">
                <p className="font-inter text-[10px] font-extrabold uppercase tracking-widest text-white/90">
                  SCHEDULED INSTALMENTS
                </p>
                <p className="text-2xl md:text-[26px] font-extrabold font-inter text-white tabular-nums tracking-tight">
                  {rangeWindow === '14d' ? '₹22,810.00' : '₹39,460.00'}
                </p>
                <p className="text-xs font-inter text-white/95 inline-flex items-center gap-1 pt-0.5">
                  <span className="material-symbols-outlined !text-[15px]">check_circle</span>
                  <span>{rangeWindow === '14d' ? '7 instalments due (14d)' : '12 loan accounts synced'}</span>
                </p>
              </div>

              <div className="card-gradient-purple rounded-[22px] p-5 space-y-1.5">
                <p className="font-inter text-[10px] font-extrabold uppercase tracking-widest text-white/90">
                  EXPECTED REMITTANCES
                </p>
                <p className="text-2xl md:text-[26px] font-extrabold font-inter text-white tabular-nums tracking-tight">
                  ₹2,60,500.00
                </p>
                <p className="text-xs font-inter text-white/95 inline-flex items-center gap-1 pt-0.5">
                  <span className="material-symbols-outlined !text-[15px]">bolt</span>
                  <span>9 expected/delayed · Not cash</span>
                </p>
              </div>

              <div className="card-gradient-orange rounded-[22px] p-5 space-y-1.5">
                <p className="font-inter text-[10px] font-extrabold uppercase tracking-widest text-white/90">
                  LEAN TIMING GAP INDEX
                </p>
                <p className="text-2xl md:text-[26px] font-extrabold font-inter text-white tabular-nums tracking-tight">
                  5 Households
                </p>
                <p className="text-xs font-inter text-white/95 inline-flex items-center gap-1 pt-0.5">
                  <span className="material-symbols-outlined !text-[15px]">shield</span>
                  <span>Due 7–28d before remittance</span>
                </p>
              </div>
            </div>

            {/* Interactive Smooth Curve Chart OR Household Swimlanes OR Accessible Table */}
            {chartTab === 'CURVE' && (
              <div className="space-y-4">
                <div className="relative pt-6 pb-2">
                  {/* Dark Floating Peak Session Callout Pill (matching reference image) */}
                  <div className="md:absolute md:top-2 md:left-[40%] z-10 mb-3 md:mb-0 inline-block bg-[#1E2436] text-white rounded-[18px] px-4 py-3 shadow-xl border border-slate-700/80">
                    <div className="flex items-center gap-1.5 font-inter text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                      <span>OCT 28 · PEAK TIMING GAP ({selectedLane.id})</span>
                    </div>
                    <p className="text-lg font-extrabold font-inter text-white tabular-nums mt-0.5">
                      {formatINR(selectedLane.dueAmt)} due
                    </p>
                    <p className="text-[11px] font-inter font-semibold text-[#22D3EE]">
                      {selectedLane.gapText} ({selectedLane.remitDate})
                    </p>
                  </div>

                  {/* Smooth Dual-Curve Area SVG */}
                  <svg
                    viewBox="0 0 680 220"
                    className="w-full h-52 overflow-visible"
                    role="img"
                    aria-label="Seasonal obligation and expected remittance curve across October and November 2026"
                  >
                    <defs>
                      <linearGradient id="lumenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.26" />
                        <stop offset="65%" stopColor="#06B6D4" stopOpacity="0.10" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lumenStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="55%" stopColor="#8B3DFF" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    {[40, 85, 130, 175].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="680"
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Area Fill under primary curve */}
                    <path
                      d="M 10 175 C 95 162, 150 120, 235 108 C 320 96, 370 74, 455 78 C 525 82, 575 45, 625 42 L 665 55 L 665 200 L 10 200 Z"
                      fill="url(#lumenAreaGrad)"
                    />

                    {/* Secondary Dashed Trajectory Line (Expected Remittances) */}
                    <path
                      d="M 10 185 C 120 175, 210 155, 310 140 C 410 125, 495 88, 625 65 L 665 60"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="2"
                      strokeDasharray="6 6"
                    />

                    {/* Primary Smooth Curve (Scheduled Obligations & Timing Gap) */}
                    <path
                      d="M 10 175 C 95 162, 150 120, 235 108 C 320 96, 370 74, 455 78 C 525 82, 575 45, 625 42 L 665 55"
                      fill="none"
                      stroke="url(#lumenStrokeGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {/* Vertical Indicator Line at Peak Point */}
                    <line
                      x1="625"
                      y1="42"
                      x2="625"
                      y2="200"
                      stroke="#6366F1"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />

                    {/* Glowing Node Ring at Peak Point */}
                    <circle cx="625" cy="42" r="9" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="3" />
                    <circle cx="625" cy="42" r="4" fill="#7C3AED" />
                  </svg>

                  {/* X-Axis Date Labels */}
                  <div className="flex items-center justify-between font-inter text-[11px] font-bold uppercase tracking-wider text-[#64748B] pt-2 px-2">
                    <span>OCT 17</span>
                    <span>OCT 22</span>
                    <span>OCT 25</span>
                    <span>OCT 28</span>
                    <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                      NOV 05 (DIWALI REMIT)
                    </span>
                    <span>NOV 22</span>
                  </div>
                </div>

                {/* Quick Household Selector Pills below curve */}
                <div className="p-3.5 rounded-[18px] bg-slate-50/90 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-inter text-xs font-bold text-[#0F172A]">
                      Inspect household timing gap:
                    </span>
                    {OFFICER_COHORT_LANES.slice(0, 5).map((lane) => (
                      <button
                        key={lane.id}
                        type="button"
                        onClick={() => setSelectedLaneId(lane.id)}
                        className={`px-2.5 py-1 rounded-full font-inter text-xs font-semibold transition-all ${
                          selectedLane.id === lane.id
                            ? 'btn-primary-gradient text-white'
                            : 'bg-white border border-slate-200 text-[#334155] hover:border-[#6366F1]'
                        }`}
                      >
                        {lane.id.replace('SANKET-HH-000', 'HH-')}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectHousehold(selectedLane.id, 'S07')}
                      className="text-xs font-inter font-bold text-[#6D28D9] hover:underline"
                    >
                      Open {selectedLane.id} Cash Flow (S07) →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {chartTab === 'LANES' && (
              <div className="space-y-2.5 pt-2">
                <div className="hidden sm:grid sm:grid-cols-12 text-[11px] font-inter font-semibold text-[#475569] pb-1 border-b border-slate-200">
                  <div className="col-span-3">Household (FSP-SYN-01)</div>
                  <div className="col-span-6 flex justify-between px-2">
                    <span>17 Oct (Ref)</span>
                    <span>28 Oct</span>
                    <span>5 Nov</span>
                    <span>22 Nov</span>
                  </div>
                  <div className="col-span-3 text-right">Timing &amp; Evidence</div>
                </div>

                {visibleLanes.map((lane) => {
                  const isSelected = selectedLane.id === lane.id;
                  const dueLeftPct = lane.dueDay
                    ? Math.min(92, Math.max(4, ((lane.dueDay - 17) / 40) * 100))
                    : null;
                  const remitLeftPct = lane.remitDay
                    ? Math.min(95, Math.max(6, ((lane.remitDay - 17) / 40) * 100))
                    : null;

                  return (
                    <div
                      key={lane.id}
                      onClick={() => setSelectedLaneId(lane.id)}
                      className={`grid grid-cols-1 sm:grid-cols-12 items-center gap-2 p-2.5 rounded-[12px] cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EEF2FF]/90 border border-[#5558E8]/40'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectHousehold(lane.id, 'S05');
                          }}
                          className="font-inter text-xs font-bold text-[#4648D4] hover:underline focus-ring rounded"
                        >
                          {lane.id}
                        </button>
                        <span className="text-[11px] text-[#475569] truncate">{lane.village}</span>
                      </div>

                      <div className="sm:col-span-6 relative h-7 bg-slate-100/90 rounded-full px-3 flex items-center">
                        <div
                          className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-400"
                          title="Reference date: 17 Oct 2026"
                        />
                        {dueLeftPct !== null && remitLeftPct !== null && (
                          <div
                            className="absolute h-0.5 bg-[#8B5CF6]/60"
                            style={{
                              left: `${Math.min(dueLeftPct, remitLeftPct)}%`,
                              width: `${Math.abs(remitLeftPct - dueLeftPct)}%`,
                            }}
                          />
                        )}
                        {dueLeftPct !== null && (
                          <div
                            className="absolute w-3.5 h-3.5 rounded-full bg-[#5558E8] border-2 border-white shadow-xs -translate-x-1/2"
                            style={{ left: `${dueLeftPct}%` }}
                            title={`Instalment due ${lane.dueDate}: ${formatINR(lane.dueAmt)}`}
                          />
                        )}
                        {remitLeftPct !== null && (
                          <div
                            className={`absolute w-3.5 h-3.5 rotate-45 -translate-x-1/2 bg-white ${
                              lane.remitState === 'DELAYED'
                                ? 'border-2 border-dashed border-[#D99A36]'
                                : lane.remitState === 'CONFLICT'
                                ? 'border-2 border-[#BA1A1A] bg-[#FFDAD6]'
                                : 'border-2 border-dashed border-[#06B6D4]'
                            }`}
                            style={{ left: `${remitLeftPct}%` }}
                            title={`Remittance (${lane.remitState}): ${lane.remitDate}`}
                          />
                        )}
                        {dueLeftPct === null && (
                          <span className="text-[11px] font-inter text-[#8A5A00] pl-3">
                            — Loan extract out of date (28 Jun 2026)
                          </span>
                        )}
                      </div>

                      <div className="sm:col-span-3 flex justify-end">
                        <EvidenceChip state={lane.remitState} customLabel={lane.gapText} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {chartTab === 'TABLE' && (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse font-inter text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#475569]">
                      <th scope="col" className="py-2.5 px-2">Household</th>
                      <th scope="col" className="py-2.5 px-2">Next instalment</th>
                      <th scope="col" className="py-2.5 px-2">Expected remittance</th>
                      <th scope="col" className="py-2.5 px-2">Timing observation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleLanes.map((lane) => (
                      <tr key={lane.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-2 font-semibold">
                          <button
                            type="button"
                            onClick={() => onSelectHousehold(lane.id, 'S07')}
                            className="text-[#4648D4] hover:underline"
                          >
                            {lane.id}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 tabular-nums">
                          {lane.dueDate} · {formatINR(lane.dueAmt)}
                        </td>
                        <td className="py-2.5 px-2 tabular-nums">{lane.remitDate}</td>
                        <td className="py-2.5 px-2">
                          <EvidenceChip state={lane.remitState} customLabel={lane.gapText} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 5. Two Bottom Sub-Cards below chart (matching "Traffic Attribution" and "Active Deployments" in reference image) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Sub-Card: Corridor & Completeness Attribution */}
            <div className="surface-solid rounded-[28px] p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#6366F1]">share</span>
                    <h3 className="text-lg font-extrabold text-[#0F172A] leading-snug">
                      Corridor Attribution
                    </h3>
                  </div>
                  <div className="text-right font-inter">
                    <p className="text-sm font-extrabold text-[#0F172A]">12 Households</p>
                    <p className="text-[11px] text-[#64748B]">FSP-SYN-01</p>
                  </div>
                </div>

                {/* Multi-Segment Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex gap-1">
                  <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: '58%' }} />
                  <div className="h-full rounded-full bg-[#06B6D4]" style={{ width: '17%' }} />
                  <div className="h-full rounded-full bg-[#F97316]" style={{ width: '17%' }} />
                  <div className="h-full rounded-full bg-[#94A3B8]" style={{ width: '8%' }} />
                </div>

                {/* 2x2 Pill Grid */}
                <div className="grid grid-cols-2 gap-2.5 font-inter text-xs">
                  <div className="px-3.5 py-2.5 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[#334155]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                      <span>Ganjam–Surat</span>
                    </span>
                    <span className="font-extrabold text-[#0F172A]">58%</span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[#334155]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                      <span>Vizag</span>
                    </span>
                    <span className="font-extrabold text-[#0F172A]">17%</span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[#334155]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                      <span>No Corridor</span>
                    </span>
                    <span className="font-extrabold text-[#0F172A]">17%</span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[#334155]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
                      <span>Hyderabad</span>
                    </span>
                    <span className="font-extrabold text-[#0F172A]">8%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between font-inter text-xs">
                <span className="text-[#64748B]">Completeness Readiness</span>
                <span className="font-extrabold text-[#4F46E5]">High (83.3%)</span>
              </div>
            </div>

            {/* Right Sub-Card: Active Verification & Review Pipelines */}
            <div className="surface-solid rounded-[28px] p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#6366F1]">rocket_launch</span>
                    <h3 className="text-lg font-extrabold text-[#0F172A] leading-snug">
                      Active Workstreams
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#EEF2FF] font-inter text-[10px] font-extrabold uppercase tracking-wider text-[#4F46E5]">
                    D1–D15 Spec
                  </span>
                </div>

                {[
                  {
                    name: 'cohort-worklist-fsp01',
                    hash: '#S03-12HH',
                    target: 'Target: Ganjam 3 Blocks',
                    pct: 83,
                    color: 'bg-[#6366F1]',
                    dot: 'bg-emerald-500',
                    screen: 'S03' as ScreenId,
                  },
                  {
                    name: 'conflict-verification',
                    hash: '#S14-2OPEN',
                    target: 'Target: HH-109 & HH-120',
                    pct: 100,
                    color: 'bg-[#8B3DFF]',
                    dot: 'bg-[#8B3DFF]',
                    screen: 'S14' as ScreenId,
                  },
                  {
                    name: 'seasonal-corridor-sync',
                    hash: '#S13-48REC',
                    target: 'Target: APEDA / ORYZA / Survey',
                    pct: 67,
                    color: 'bg-[#06B6D4]',
                    dot: 'bg-[#06B6D4]',
                    screen: 'S13' as ScreenId,
                  },
                ].map((pipe) => (
                  <button
                    key={pipe.name}
                    type="button"
                    onClick={() => onNavigate(pipe.screen)}
                    className="w-full text-left p-3.5 rounded-[18px] bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/80 space-y-2 transition-colors focus-ring"
                  >
                    <div className="flex items-center justify-between font-inter text-xs">
                      <span className="font-bold text-[#0F172A] inline-flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${pipe.dot}`} />
                        <span>{pipe.name}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200/70 text-[10px] font-semibold text-[#475569]">
                        {pipe.hash}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-inter text-[11px]">
                      <span className="text-[#64748B]">{pipe.target}</span>
                      <span className="font-extrabold text-[#4F46E5]">{pipe.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full ${pipe.color}`} style={{ width: `${pipe.pct}%` }} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-inter text-xs">
                <span className="text-[#64748B]">Verification Queue</span>
                <span className="font-extrabold text-[#0F172A]">2 Conflicts · 2 Follow-ups</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Right Column (4 cols): Live Activity + Simulation & Guardrails + Upcoming Milestones */}
        <div className="lg:col-span-4 space-y-6">
          {/* Right Card 1: Live Activity / Provenance Feed (matching reference image) */}
          <div className="surface-solid rounded-[28px] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <h3 className="text-lg font-extrabold text-[#0F172A]">Live Provenance</h3>
              </div>
              <span className="font-inter text-[11px] font-extrabold uppercase tracking-widest text-[#64748B]">
                FEED
              </span>
            </div>

            <ul className="space-y-4 text-xs">
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#8B3DFF] text-white font-inter text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                  PV
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[#0F172A] leading-snug">
                    <strong>Re-verified</strong> seasonal corridor record{' '}
                    <span className="font-inter font-semibold">SANKET-SC-00027</span>
                  </p>
                  <p className="font-inter text-[11px] text-[#64748B]">
                    16 Oct ·{' '}
                    <button
                      type="button"
                      onClick={() => onSelectHousehold('SANKET-HH-000113', 'S05')}
                      className="font-bold text-[#6D28D9] hover:underline"
                    >
                      SANKET-HH-000113
                    </button>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#06B6D4] text-white font-inter text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                  CF
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[#0F172A] leading-snug">
                    <strong>Conflict flagged</strong> on{' '}
                    <span className="font-inter font-semibold">outstanding_balance</span> (₹14.2k vs ₹18.9k)
                  </p>
                  <p className="font-inter text-[11px] text-[#64748B]">
                    15 Oct ·{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('S14')}
                      className="font-bold text-[#0E7490] hover:underline"
                    >
                      Compare in S14
                    </button>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F97316] text-white font-inter text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                  CI
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[#0F172A] leading-snug">
                    <strong>Check-in Q09</strong> requested officer follow-up during lean month
                  </p>
                  <p className="font-inter text-[11px] text-[#64748B]">
                    1 Oct ·{' '}
                    <button
                      type="button"
                      onClick={() => onSelectHousehold('SANKET-HH-000103', 'S09')}
                      className="font-bold text-[#4F46E5] hover:underline"
                    >
                      Session CS-000103
                    </button>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#6366F1]/30 font-inter text-[11px] font-extrabold flex items-center justify-center shrink-0">
                  SC
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[#0F172A] leading-snug">
                    <strong>Diwali Remittance</strong> logged as EXPECTED (₹35,000.00)
                  </p>
                  <p className="font-inter text-[11px] text-[#64748B]">
                    20 Sep ·{' '}
                    <button
                      type="button"
                      onClick={() => onSelectHousehold('SANKET-HH-000101', 'S07')}
                      className="font-bold text-[#6D28D9] hover:underline"
                    >
                      SANKET-HH-000101
                    </button>
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Right Card 2: Simulation & Guardrails (matching "Resource Control" in reference image) */}
          <div className="surface-solid rounded-[28px] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#0F172A]">Simulation &amp; Guardrails</h3>
              <button
                type="button"
                onClick={() => onNavigate('S11')}
                title="Open What-If Simulator (S11)"
                className="text-[#6366F1] hover:text-[#4F46E5]"
              >
                <span className="material-symbols-outlined !text-[20px]">tune</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between font-inter text-xs">
                <span className="font-bold text-[#334155]">Instalment Deferral Test</span>
                <span className="font-extrabold text-[#6366F1] tabular-nums">
                  +{deferralPreviewDays} days
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                aria-label="Instalment deferral preview days"
                value={deferralPreviewDays}
                onChange={(e) => setDeferralPreviewDays(Number(e.target.value))}
                className="w-full accent-[#6D28D9] cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-[18px] bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-[#0F172A]">Partner Granular RBAC</p>
                  <p className="text-[11px] text-[#64748B]">Enforce fsp_partner_id boundary</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={rbacToggle}
                  onClick={() => setRbacToggle(!rbacToggle)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                    rbacToggle ? 'bg-[#6366F1] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="p-3.5 rounded-[18px] bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-[#0F172A]">Small-Group Masking (&lt;5)</p>
                  <p className="text-[11px] text-[#64748B]">Hide aggregate cohorts under 5</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={maskingToggle}
                  onClick={() => setMaskingToggle(!maskingToggle)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                    maskingToggle ? 'bg-[#6366F1] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('S17')}
              className="w-full py-3.5 rounded-full btn-primary-gradient font-inter text-xs font-bold flex items-center justify-center gap-2 focus-ring"
            >
              <span className="material-symbols-outlined !text-[18px]">verified_user</span>
              <span>Run Governance Audit</span>
            </button>
          </div>

          {/* Right Card 3: Upcoming Instalments & Milestones (matching "Upcoming Milestones" in reference image) */}
          <div className="surface-solid rounded-[28px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#0F172A]">Upcoming Schedule</h3>
              <span className="material-symbols-outlined text-[#64748B] !text-[19px]">flag</span>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onSelectHousehold('SANKET-HH-000110', 'S08')}
                className="w-full text-left p-3.5 rounded-[20px] bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[14px] bg-[#8B3DFF] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined !text-[19px]">event</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#0F172A] truncate">
                      Instalment · ₹3,080.00
                    </p>
                    <p className="font-inter text-[11px] text-[#64748B] truncate">
                      Oct 18 · SANKET-HH-000110
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EEF2FF] font-inter text-[10px] font-extrabold text-[#4F46E5] shrink-0">
                  IN 1 DAY
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectHousehold('SANKET-HH-000103', 'S08')}
                className="w-full text-left p-3.5 rounded-[20px] bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[14px] bg-[#06B6D4] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined !text-[19px]">deployed_code</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#0F172A] truncate">
                      Instalment · ₹2,340.00
                    </p>
                    <p className="font-inter text-[11px] text-[#64748B] truncate">
                      Oct 20 · SANKET-HH-000103
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#ECFEFF] font-inter text-[10px] font-extrabold text-[#0E7490] shrink-0">
                  SCHEDULED
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectHousehold('SANKET-HH-000101', 'S07')}
                className="w-full text-left p-3.5 rounded-[20px] bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[14px] bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined !text-[19px]">currency_rupee</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#0F172A] truncate">
                      Diwali Remittance · ₹35k
                    </p>
                    <p className="font-inter text-[11px] text-[#64748B] truncate">
                      Nov 05 · Ganjam–Surat
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-200/80 font-inter text-[10px] font-extrabold text-[#475569] shrink-0">
                  EXPECTED
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface S03WorklistProps {
  role: RoleId;
  initialTab?: string;
  onSelectHousehold: (id: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onSwitchRole: (role: RoleId) => void;
  onCopyId: (id: string) => void;
}

export const S03Worklist: React.FC<S03WorklistProps> = ({
  role,
  initialTab = 'ALL',
  onSelectHousehold,
  onNavigate,
  onSwitchRole,
  onCopyId,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [blockFilter, setBlockFilter] = useState('ALL');
  const [completenessFilter, setCompletenessFilter] = useState('ALL');
  const [remittanceFilter, setRemittanceFilter] = useState('ALL');
  const [includeDemoCastAll, setIncludeDemoCastAll] = useState(false);

  if (role !== 'FIELD_OFFICER') {
    return (
      <RestrictedAccessCard
        role={role}
        attemptedView="S03 Household Worklist"
        onNavigate={onNavigate}
        onSwitchRole={onSwitchRole}
      />
    );
  }

  const baseList = includeDemoCastAll
    ? HOUSEHOLDS_DATA
    : HOUSEHOLDS_DATA.filter((h) => h.fsp_partner_id === 'FSP-SYN-01');

  const filtered = baseList.filter((h) => {
    if (activeTab === 'DUE_14') {
      const due = h.loans[0]?.next_due_date;
      if (!due || due > '2026-10-31') return false;
    }
    if (activeTab === 'WARNINGS' && h.data_quality_warnings.length === 0) return false;
    if (activeTab === 'FOLLOWUP' && !h.checkin_sessions.some((c) => c.followup_requested)) return false;
    if (activeTab === 'CONFLICTS' && h.recommendation_status !== 'CONFLICT_REQUIRES_REVIEW') return false;
    if (activeTab === 'INSUFFICIENT' && h.data_completeness_band !== 'LOW') return false;

    if (blockFilter !== 'ALL' && h.block_name !== blockFilter) return false;
    if (completenessFilter !== 'ALL' && h.data_completeness_band !== completenessFilter) return false;
    if (remittanceFilter !== 'ALL') {
      const remStatus = h.seasonal_records[0]?.remittance_status || 'UNKNOWN';
      if (remStatus !== remittanceFilter) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dateA = a.loans[0]?.next_due_date || '9999-12-31';
    const dateB = b.loans[0]?.next_due_date || '9999-12-31';
    return dateA.localeCompare(dateB);
  });

  const clearFilters = () => {
    setActiveTab('ALL');
    setBlockFilter('ALL');
    setCompletenessFilter('ALL');
    setRemittanceFilter('ALL');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs font-inter text-[#475569] mb-1">
            <button type="button" onClick={() => onNavigate('S02')} className="hover:underline">
              Overview
            </button>{' '}
            › <span className="text-[#0F172A] font-semibold">Household Worklist</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Household Worklist</h1>
          <p className="text-sm text-[#475569]">
            Households in your cohort that have something to review. Sorted by next instalment date, not by any risk score.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-inter bg-white/80 px-3 py-2 rounded-[10px] border border-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={includeDemoCastAll}
            onChange={(e) => setIncludeDemoCastAll(e.target.checked)}
            className="rounded text-[#5558E8]"
          />
          <span>Include cross-partner demo cast (HH-000125, 116, 108, 128)</span>
        </label>
      </div>

      {/* Glass Filter Bar */}
      <div className="glass-1 rounded-[20px] p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="wl-block" className="text-xs font-inter font-medium text-[#475569]">
            Block:
          </label>
          <select
            id="wl-block"
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-[8px] px-2.5 py-1.5 text-xs font-inter text-[#0F172A]"
          >
            <option value="ALL">All blocks</option>
            <option value="Brahmapur">Brahmapur</option>
            <option value="Chhatrapur">Chhatrapur</option>
            <option value="Bhanjanagar">Bhanjanagar</option>
            <option value="Kabisuryanagar">Kabisuryanagar</option>
            <option value="Paralakhemundi">Paralakhemundi</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="wl-comp" className="text-xs font-inter font-medium text-[#475569]">
            Data completeness (provisional):
          </label>
          <select
            id="wl-comp"
            value={completenessFilter}
            onChange={(e) => setCompletenessFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-[8px] px-2.5 py-1.5 text-xs font-inter text-[#0F172A]"
          >
            <option value="ALL">All bands</option>
            <option value="HIGH">HIGH (≥ 75%)</option>
            <option value="MEDIUM">MEDIUM (50–74%)</option>
            <option value="LOW">LOW (&lt; 50%)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="wl-remit" className="text-xs font-inter font-medium text-[#475569]">
            Remittance status:
          </label>
          <select
            id="wl-remit"
            value={remittanceFilter}
            onChange={(e) => setRemittanceFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-[8px] px-2.5 py-1.5 text-xs font-inter text-[#0F172A]"
          >
            <option value="ALL">All statuses</option>
            <option value="EXPECTED">Expected, not received</option>
            <option value="DELAYED">Delayed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="UNKNOWN">Not recorded / Unknown</option>
          </select>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="ml-auto text-xs font-inter font-semibold text-[#4648D4] hover:underline focus-ring px-2 py-1"
        >
          Clear all
        </button>
      </div>

      {/* Segmented Tabs with Counts */}
      <div role="tablist" aria-label="Worklist filter tabs" className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All 12' },
          { id: 'DUE_14', label: 'Due in 14 days 7' },
          { id: 'WARNINGS', label: 'Needs verification 7' },
          { id: 'FOLLOWUP', label: 'Follow-up requested 2' },
          { id: 'CONFLICTS', label: 'Conflicts 2' },
          { id: 'INSUFFICIENT', label: 'Insufficient data' },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            type="button"
            onClick={() => {
              if (t.id === 'INSUFFICIENT') setIncludeDemoCastAll(true);
              setActiveTab(t.id);
            }}
            className={`px-3.5 py-2 rounded-full text-xs font-inter font-semibold whitespace-nowrap shrink-0 transition-colors focus-ring ${
              activeTab === t.id
                ? 'btn-primary-gradient text-white'
                : 'glass-1 text-[#334155] hover:bg-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Solid Data Table */}
      <div className="surface-solid rounded-[24px] overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <span className="material-symbols-outlined !text-[32px] text-[#475569]">search_off</span>
            <h3 className="text-base font-bold text-[#0F172A]">
              No households match these filters. Clear a filter or choose All.
            </h3>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-primary-gradient px-4 py-2 rounded-[10px] text-xs font-inter font-semibold"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-inter text-xs font-semibold text-[#475569]">
                  <th scope="col" className="py-3.5 px-4">Household</th>
                  <th scope="col" className="py-3.5 px-4">Why it is here</th>
                  <th scope="col" className="py-3.5 px-4">Next instalment</th>
                  <th scope="col" className="py-3.5 px-4">Expected remittance</th>
                  <th scope="col" className="py-3.5 px-4">Data</th>
                  <th scope="col" className="py-3.5 px-4">Last updated</th>
                  <th scope="col" className="py-3.5 px-4">Suggestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {sorted.map((h) => {
                  const activeLoans = h.loans.filter((l) => l.loan_status === 'ACTIVE');
                  const activeLoan = activeLoans[0];
                  const primarySeasonal = h.seasonal_records[0];
                  const mappedStatus = mapStatusToOfficerLabel(
                    h.recommendation_status,
                    h.reason_codes
                  );

                  return (
                    <tr
                      key={h.household_id}
                      onClick={() => onSelectHousehold(h.household_id)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <CopyableId
                          id={h.household_id}
                          onClick={() => onSelectHousehold(h.household_id)}
                          onCopy={onCopyId}
                        />
                        <p className="text-[11px] text-[#475569] mt-0.5">
                          {h.village_name} · {h.block_name}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {h.worklist_reasons.length === 0 ? (
                            <span className="text-[#64748B]">No open flags</span>
                          ) : (
                            h.worklist_reasons.map((r, i) => (
                              <EvidenceChip
                                key={i}
                                state={r.state}
                                customLabel={r.label}
                                size="sm"
                              />
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-inter tabular-nums">
                        {activeLoan ? (
                          activeLoan.next_due_date ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-[#0F172A] block">
                                {formatDateDisplay(activeLoan.next_due_date)}
                              </span>
                              <span className="block text-[#475569]">
                                {formatINR(activeLoan.scheduled_installment_amount)}
                              </span>
                              {activeLoans.length > 1 && (
                                <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-[#4F46E5] text-[10px] font-bold">
                                  {activeLoans.length} loans
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#8A5A00]">— extract out of date</span>
                          )
                        ) : (
                          <span className="text-[#475569]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {primarySeasonal ? (
                          <div className="space-y-1">
                            <EvidenceChip
                              state={
                                primarySeasonal.remittance_status === 'EXPECTED'
                                  ? 'EXPECTED'
                                  : primarySeasonal.remittance_status === 'DELAYED'
                                  ? 'DELAYED'
                                  : 'OBSERVED'
                              }
                              customLabel={
                                primarySeasonal.remittance_status === 'EXPECTED'
                                  ? `Expected, not received · ${formatDateDisplay(primarySeasonal.expected_remittance_date)}`
                                  : primarySeasonal.remittance_status === 'DELAYED'
                                  ? `Delayed · ${formatDateDisplay(primarySeasonal.expected_remittance_date)}`
                                  : `Remittance confirmed · ${formatDateDisplay(primarySeasonal.expected_remittance_date)}`
                              }
                              size="sm"
                            />
                          </div>
                        ) : (
                          <EvidenceChip state="MISSING" customLabel="Not recorded" size="sm" />
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <CompletenessBar
                          pct={h.data_completeness_pct}
                          band={h.data_completeness_band}
                          compact
                        />
                        {h.data_quality_warnings.length > 0 && (
                          <span className="block text-[11px] font-inter text-[#8A5A00] mt-0.5">
                            {h.data_quality_warnings.length} warning
                            {h.data_quality_warnings.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-inter tabular-nums text-[#475569]">
                        {formatDateDisplay(h.profile_last_updated_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <EvidenceChip
                          state={mappedStatus.chipState}
                          customLabel={mappedStatus.label}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

interface S04DirectoryProps {
  role: RoleId;
  onSelectHousehold: (id: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onSwitchRole: (role: RoleId) => void;
  onCopyId: (id: string) => void;
}

export const S04HouseholdsDirectory: React.FC<S04DirectoryProps> = ({
  role,
  onSelectHousehold,
  onNavigate,
  onSwitchRole,
  onCopyId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [migrationFilter, setMigrationFilter] = useState('ALL');
  const [hasActiveLoanFilter, setHasActiveLoanFilter] = useState(false);
  const [hasShgFilter, setHasShgFilter] = useState(false);
  const [showAllPartners, setShowAllPartners] = useState(false);

  if (role !== 'FIELD_OFFICER') {
    return (
      <RestrictedAccessCard
        role={role}
        attemptedView="S04 Households Directory"
        onNavigate={onNavigate}
        onSwitchRole={onSwitchRole}
      />
    );
  }

  const matches = HOUSEHOLDS_DATA.filter((h) => {
    if (!showAllPartners && h.fsp_partner_id !== 'FSP-SYN-01') return false;
    if (migrationFilter !== 'ALL' && h.migration_status !== migrationFilter) return false;
    if (hasActiveLoanFilter && !h.loans.some((l) => l.loan_status === 'ACTIVE')) return false;
    if (hasShgFilter && h.shg_records.length === 0) return false;
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.trim().toLowerCase();
      const hay = `${h.household_id} ${h.village_name} ${h.block_name} ${h.district_name} ${h.shg_group_id || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Households</h1>
          <p className="text-sm text-[#475569]">
            Every household in your cohort (FSP-SYN-01). Location is operational context only, never a scoring input (CF-05).
          </p>
        </div>
        <span className="font-inter text-xs font-semibold text-[#475569]">
          Showing {matches.length} households
        </span>
      </div>

      {/* Glass Search & Filter Bar (FO-INT-070, FO-INT-071) */}
      <div className="glass-1 rounded-[20px] p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] !text-[18px]">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search households…"
            aria-label="Search households by ID, village, block, district or SHG group"
            className="w-full pl-9 pr-4 py-2 rounded-[10px] bg-white border border-slate-300 text-xs font-inter text-[#0F172A] focus-ring"
          />
        </div>

        <select
          aria-label="Filter by migration status"
          value={migrationFilter}
          onChange={(e) => setMigrationFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-[10px] px-3 py-2 text-xs font-inter text-[#0F172A]"
        >
          <option value="ALL">All migration statuses</option>
          <option value="ACTIVE_MIGRANT">Active migrant</option>
          <option value="RETURNED_MIGRANT">Returned migrant</option>
          <option value="NO_MIGRATION">No migration</option>
          <option value="UNKNOWN">Unknown</option>
        </select>

        <label className="inline-flex items-center gap-1.5 text-xs font-inter text-[#334155] bg-white px-3 py-2 rounded-[10px] border border-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={hasActiveLoanFilter}
            onChange={(e) => setHasActiveLoanFilter(e.target.checked)}
          />
          <span>Has active loan</span>
        </label>

        <label className="inline-flex items-center gap-1.5 text-xs font-inter text-[#334155] bg-white px-3 py-2 rounded-[10px] border border-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={hasShgFilter}
            onChange={(e) => setHasShgFilter(e.target.checked)}
          />
          <span>Has SHG record</span>
        </label>

        <label className="inline-flex items-center gap-1.5 text-xs font-inter text-[#475569] cursor-pointer">
          <input
            type="checkbox"
            checked={showAllPartners}
            onChange={(e) => setShowAllPartners(e.target.checked)}
          />
          <span>Cross-partner fixture (FSP-SYN-02/03)</span>
        </label>

        {(searchQuery || migrationFilter !== 'ALL' || hasActiveLoanFilter || hasShgFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setMigrationFilter('ALL');
              setHasActiveLoanFilter(false);
              setHasShgFilter(false);
            }}
            className="text-xs font-inter font-semibold text-[#4648D4] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="surface-solid rounded-[24px] overflow-hidden">
        {matches.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-base font-bold text-[#0F172A]">
              No households found for &ldquo;{searchQuery}&rdquo;. Check the household ID or clear the filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-inter text-xs font-semibold text-[#475569]">
                  <th scope="col" className="py-3.5 px-4">Household</th>
                  <th scope="col" className="py-3.5 px-4">Location</th>
                  <th scope="col" className="py-3.5 px-4">Migration status</th>
                  <th scope="col" className="py-3.5 px-4">Active loans</th>
                  <th scope="col" className="py-3.5 px-4">SHG group</th>
                  <th scope="col" className="py-3.5 px-4">Data completeness (provisional)</th>
                  <th scope="col" className="py-3.5 px-4">Warnings</th>
                  <th scope="col" className="py-3.5 px-4">Last updated</th>
                  <th scope="col" className="py-3.5 px-4">Suggestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {matches.map((h) => {
                  const activeLoansCount = h.loans.filter((l) => l.loan_status === 'ACTIVE').length;
                  const mappedStatus = mapStatusToOfficerLabel(
                    h.recommendation_status,
                    h.reason_codes
                  );
                  return (
                    <tr
                      key={h.household_id}
                      onClick={() => onSelectHousehold(h.household_id)}
                      className="hover:bg-indigo-50/40 cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <CopyableId
                          id={h.household_id}
                          onClick={() => onSelectHousehold(h.household_id)}
                          onCopy={onCopyId}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-[#334155]">
                        {h.village_name}, {h.block_name}, {h.district_name}
                      </td>
                      <td className="py-3.5 px-4 font-inter">
                        {h.migration_status === 'ACTIVE_MIGRANT'
                          ? 'Active migrant'
                          : h.migration_status === 'RETURNED_MIGRANT'
                          ? 'Returned migrant'
                          : h.migration_status === 'NO_MIGRATION'
                          ? 'No migration'
                          : 'Unknown'}
                      </td>
                      <td className="py-3.5 px-4 font-inter tabular-nums">
                        {activeLoansCount === 0 ? 'None' : activeLoansCount}
                      </td>
                      <td className="py-3.5 px-4 font-inter text-[#334155]">
                        {h.shg_records.length > 0 && h.shg_group_id
                          ? h.shg_group_id
                          : 'No SHG record'}
                      </td>
                      <td className="py-3.5 px-4">
                        <CompletenessBar
                          pct={h.data_completeness_pct}
                          band={h.data_completeness_band}
                          compact
                        />
                      </td>
                      <td className="py-3.5 px-4 font-inter">
                        {h.data_quality_warnings.length === 0 ? (
                          <span className="text-[#475569]">No warnings</span>
                        ) : (
                          <EvidenceChip
                            state={
                              h.recommendation_status === 'CONFLICT_REQUIRES_REVIEW'
                                ? 'CONFLICT'
                                : 'PROVISIONAL'
                            }
                            customLabel={`${h.data_quality_warnings.length} warning${
                              h.data_quality_warnings.length > 1 ? 's' : ''
                            }`}
                            size="sm"
                          />
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-inter tabular-nums text-[#475569]">
                        {formatDateDisplay(h.profile_last_updated_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <EvidenceChip
                          state={mappedStatus.chipState}
                          customLabel={mappedStatus.label}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
