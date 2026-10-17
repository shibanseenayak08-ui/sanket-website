import React from 'react';
import { HouseholdProfile } from '../data/sanketData';
import { RoleId, ScreenId, formatDateDisplay } from '../utils/sanketLogic';
import { CompletenessBar, CopyableId, EvidenceChip } from './SharedPrimitives';

interface RestrictedViewProps {
  role: RoleId;
  attemptedView: string;
  onNavigate: (screen: ScreenId) => void;
  onSwitchRole: (role: RoleId) => void;
}

export const RestrictedAccessCard: React.FC<RestrictedViewProps> = ({
  role,
  attemptedView,
  onNavigate,
  onSwitchRole,
}) => {
  const roleLabel =
    role === 'PORTFOLIO_MANAGER' ? 'Portfolio Manager' : 'Compliance Reviewer';

  return (
    <div className="surface-solid rounded-[24px] p-8 max-w-2xl mx-auto my-8 border-l-4 border-l-[#BA1A1A]">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-[#FFDAD6] text-[#93000A] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined">gpp_maybe</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-[8px] bg-[#FFDAD6] text-[#93000A] font-inter text-xs font-semibold">
              Restricted access · Role boundary
            </span>
            <span className="font-inter text-xs text-[#475569]">Current role: {roleLabel}</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">
            You don&apos;t have access to this view.
          </h2>
          <p className="text-sm text-[#334155] leading-relaxed">
            {role === 'PORTFOLIO_MANAGER'
              ? `Portfolio Managers query aggregates across fsp_partner_id values without household-level drill-down. "${attemptedView}" requires Field Officer access scoped to an assigned partner cohort.`
              : `Compliance Reviewers inspect provenance tokens, conflicts, and append-only audit trails without opening full household financial profiles (Open Decision Q-04).`}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate(role === 'PORTFOLIO_MANAGER' ? 'S12' : 'S13')}
              className="btn-primary-gradient px-4 py-2.5 rounded-[12px] text-sm font-semibold focus-ring inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              <span>
                {role === 'PORTFOLIO_MANAGER'
                  ? 'Go to Portfolio Insights (S12)'
                  : 'Go to Data Sources and Quality (S13)'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('FIELD_OFFICER')}
              className="glass-1 px-4 py-2.5 rounded-[12px] text-sm font-semibold text-[#0F172A] hover:bg-white/90 focus-ring inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined !text-[18px]">switch_account</span>
              <span>Switch demo role to Field Officer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HouseholdHeaderProps {
  household: HouseholdProfile;
  activeTab: ScreenId;
  onSelectTab: (tab: ScreenId) => void;
  onOpenReview: () => void;
  onOpenWhatIf: () => void;
  onCopyId: (id: string) => void;
  allHouseholds: HouseholdProfile[];
  onSelectHousehold: (id: string) => void;
}

const PROFILE_TABS: { id: ScreenId; label: string; code: string }[] = [
  { id: 'S05', label: 'Overview', code: 'S05' },
  { id: 'S06', label: 'Financial Health', code: 'S06' },
  { id: 'S07', label: 'Seasonal Cash Flow', code: 'S07' },
  { id: 'S08', label: 'Loans and Repayments', code: 'S08' },
  { id: 'S09', label: 'Savings and Check-ins', code: 'S09' },
  { id: 'S05_DATA', label: 'Data and Sources', code: 'Tab 6' },
  { id: 'S05_REVIEWS', label: 'Review History', code: 'Tab 7' },
];

export const HouseholdProfileHeader: React.FC<HouseholdHeaderProps> = ({
  household,
  activeTab,
  onSelectTab,
  onOpenReview,
  onOpenWhatIf,
  onCopyId,
  allHouseholds,
  onSelectHousehold,
}) => {
  const migrationLabel =
    household.migration_status === 'ACTIVE_MIGRANT'
      ? `Active migrant${household.migration_corridor_destination ? ` · ${household.migration_corridor_destination}` : ''}`
      : household.migration_status === 'RETURNED_MIGRANT'
      ? `Returned migrant${household.migration_corridor_destination ? ` · ${household.migration_corridor_destination}` : ''}`
      : household.migration_status === 'NO_MIGRATION'
      ? 'No migration'
      : 'Migration status: Unknown';

  return (
    <div className="space-y-4 mb-6">
      <div className="glass-1 rounded-[24px] p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                <CopyableId id={household.household_id} onCopy={onCopyId} className="text-2xl md:text-3xl" />
              </h1>
              <span className="text-sm font-medium text-[#334155]">
                {household.village_name} · {household.block_name} · {household.district_name} · {household.state_name}
              </span>
              <div className="ml-auto lg:ml-2 flex items-center gap-1.5">
                <label htmlFor="demo-cast-switcher" className="text-xs font-inter text-[#475569]">
                  Demo cast:
                </label>
                <select
                  id="demo-cast-switcher"
                  value={household.household_id}
                  onChange={(e) => onSelectHousehold(e.target.value)}
                  className="bg-white/90 border border-slate-300 rounded-[8px] px-2.5 py-1 text-xs font-inter font-medium text-[#0F172A] focus-ring"
                >
                  {allHouseholds.map((h) => (
                    <option key={h.household_id} value={h.household_id}>
                      {h.household_id} ({h.block_name}
                      {h.fsp_partner_id !== 'FSP-SYN-01' ? ` · ${h.fsp_partner_id}` : ''})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Identity chips row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-[8px] bg-white/85 border border-slate-200 font-inter font-medium text-[#0F172A]">
                {migrationLabel}
              </span>
              <span className="px-2.5 py-1 rounded-[8px] bg-white/85 border border-slate-200 font-inter font-medium text-[#334155]">
                {household.fsp_partner_id}
              </span>
              <span className="px-2.5 py-1 rounded-[8px] bg-white/85 border border-slate-200 font-inter font-medium text-[#334155]">
                {household.shg_group_id ? household.shg_group_id : 'No SHG record'}
              </span>
              <span className="px-2.5 py-1 rounded-[8px] bg-white/85 border border-slate-200 font-inter text-[#334155]">
                Enrolled {formatDateDisplay(household.enrollment_date)}
              </span>
              <span className="px-2.5 py-1 rounded-[8px] bg-white/85 border border-slate-200 font-inter text-[#334155]">
                Consent granted · {household.consent_version} · {formatDateDisplay(household.enrollment_date)}
              </span>
              <span className="px-2.5 py-1 rounded-[8px] bg-emerald-50 border border-emerald-200 font-inter font-medium text-emerald-900">
                Active
              </span>
              <div className="px-2.5 py-0.5 rounded-[8px] bg-white/85 border border-slate-200">
                <CompletenessBar
                  pct={household.data_completeness_pct}
                  band={household.data_completeness_band}
                />
              </div>
              <span className="px-2.5 py-1 rounded-[8px] bg-white/85 border border-slate-200 font-inter text-[#475569]">
                Updated {formatDateDisplay(household.profile_last_updated_at)}, 12:00 UTC
              </span>
              <EvidenceChip state="PROVISIONAL" customLabel="Synthetic record" size="sm" />
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenReview}
              className="btn-primary-gradient px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold whitespace-nowrap shrink-0 focus-ring inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined !text-[18px]">fact_check</span>
              <span>Review suggestion</span>
            </button>
            <button
              type="button"
              onClick={onOpenWhatIf}
              className="glass-2 px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold text-[#0F172A] hover:bg-white whitespace-nowrap shrink-0 focus-ring inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined !text-[18px]">event_repeat</span>
              <span>What if?</span>
            </button>
          </div>
        </div>

        {/* Segmented Tab Bar */}
        <div
          role="tablist"
          aria-label="Household profile sections"
          className="mt-5 pt-4 border-t border-white/70 flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {PROFILE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`px-3.5 py-2 rounded-full text-xs font-inter font-semibold transition-colors whitespace-nowrap shrink-0 focus-ring ${
                  isActive
                    ? 'btn-primary-gradient text-white shadow-xs'
                    : 'bg-white/60 text-[#334155] hover:bg-white hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
