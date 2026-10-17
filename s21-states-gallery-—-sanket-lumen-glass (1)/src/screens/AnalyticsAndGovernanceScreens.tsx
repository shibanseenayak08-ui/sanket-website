import React, { useState } from 'react';
import {
  ConflictItem,
  HOUSEHOLDS_DATA,
  HumanReviewRecord,
  OPEN_DECISIONS_LIST,
  ProvenanceEntry,
} from '../data/sanketData';
import {
  APAC_PORTABILITY_MATRIX,
  CSV_TEMPLATE_SPECS,
  DAY1_DECISION_REGISTER,
  DAY1_VALIDATION_RULES,
  PHASE2_KPI_TARGETS,
} from '../data/day1SpecData';
import {
  RoleId,
  ScreenId,
  computeRedressDeadline,
  filterHouseholdsByScope,
  formatDateDisplay,
  formatMaskedCount,
  mapDecisionToLabel,
  mapStatusToOfficerLabel,
} from '../utils/sanketLogic';
import { CopyableId, EvidenceChip } from '../components/SharedPrimitives';

interface S12Props {
  role: RoleId;
  onNavigate: (screen: ScreenId, filterPreset?: string) => void;
}

export const S12PortfolioInsights: React.FC<S12Props> = ({ role, onNavigate }) => {
  const [partnerFilter, setPartnerFilter] = useState<'ALL' | 'FSP-SYN-01' | 'FSP-SYN-02' | 'FSP-SYN-03'>('ALL');
  const [corridorFilter, setCorridorFilter] = useState<'ALL' | 'GANJAM-SURAT' | 'KALAHANDI-HYDERABAD' | 'GAJAPATI-VISAKHAPATNAM'>('ALL');
  const [seriesMode, setSeriesMode] = useState<'BOTH' | 'INSTALMENTS' | 'REMITTANCES'>('BOTH');
  const [viewAsTable, setViewAsTable] = useState(false);
  const [selectedSegmentNote, setSelectedSegmentNote] = useState<string | null>(null);

  const isOfficerCohortOnly = role === 'FIELD_OFFICER';
  const effectivePartner = isOfficerCohortOnly ? 'FSP-SYN-01' : partnerFilter;

  const scopedHouseholds = HOUSEHOLDS_DATA.filter((h) => {
    if (effectivePartner !== 'ALL' && h.fsp_partner_id !== effectivePartner) return false;
    if (corridorFilter !== 'ALL') {
      const hasCorr = h.seasonal_records.some((r) => r.corridor_name === corridorFilter);
      if (!hasCorr) return false;
    }
    return true;
  });

  const hhCount = scopedHouseholds.length;
  const activeLoanCount = scopedHouseholds.reduce(
    (acc, h) => acc + h.loans.filter((l) => l.loan_status === 'ACTIVE').length,
    0
  );
  const leanCount = scopedHouseholds.filter((h) =>
    h.seasonal_records.some((r) => r.season_label === 'LEAN')
  ).length;
  const insufficientCount = scopedHouseholds.filter(
    (h) => h.recommendation_status === 'INSUFFICIENT_DATA'
  ).length;
  const conflictReviewCount = scopedHouseholds.filter(
    (h) => h.recommendation_status === 'CONFLICT_REQUIRES_REVIEW'
  ).length;

  const monthlyData = [
    { month: 'Feb 26', inst: 18, remit: 2 },
    { month: 'Mar 26', inst: 24, remit: 6 },
    { month: 'Apr 26', inst: 27, remit: 3 },
    { month: 'May 26', inst: 29, remit: 1 },
    { month: 'Jun 26', inst: 30, remit: 1 },
    { month: 'Jul 26', inst: 30, remit: 2 },
    { month: 'Aug 26', inst: 30, remit: 2 },
    { month: 'Sep 26', inst: 30, remit: 3 },
    { month: 'Oct 26', inst: 30, remit: 5 },
    { month: 'Nov 26', inst: 29, remit: 14 },
    { month: 'Dec 26', inst: 27, remit: 3 },
    { month: 'Jan 27', inst: 26, remit: 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Portfolio Insights</h1>
          <p className="text-sm text-[#475569]">
            Counts and distributions across the demonstration portfolio. Aggregates only. Descriptive, not predictive.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="glass-1 rounded-full px-4 py-2 flex items-center gap-2">
            <label htmlFor="s12-partner" className="text-xs font-inter font-semibold text-[#475569]">
              Partner scope:
            </label>
            <select
              id="s12-partner"
              value={effectivePartner}
              disabled={isOfficerCohortOnly}
              onChange={(e) =>
                setPartnerFilter(e.target.value as 'ALL' | 'FSP-SYN-01' | 'FSP-SYN-02' | 'FSP-SYN-03')
              }
              className="bg-white border border-slate-300 rounded-full px-3 py-1 text-xs font-inter font-semibold text-[#0F172A]"
            >
              <option value="ALL">All partners (3 · 17 showcase / 30 dataset)</option>
              <option value="FSP-SYN-01">FSP-SYN-01 (12 households)</option>
              <option value="FSP-SYN-02">FSP-SYN-02 (2 showcase / 6 dataset)</option>
              <option value="FSP-SYN-03">FSP-SYN-03 (3 showcase / 12 dataset)</option>
            </select>
          </div>

          <div className="glass-1 rounded-full px-4 py-2 flex items-center gap-2">
            <label htmlFor="s12-corridor" className="text-xs font-inter font-semibold text-[#475569]">
              Corridor:
            </label>
            <select
              id="s12-corridor"
              value={corridorFilter}
              onChange={(e) =>
                setCorridorFilter(
                  e.target.value as
                    | 'ALL'
                    | 'GANJAM-SURAT'
                    | 'KALAHANDI-HYDERABAD'
                    | 'GAJAPATI-VISAKHAPATNAM'
                )
              }
              className="bg-white border border-slate-300 rounded-full px-3 py-1 text-xs font-inter font-semibold text-[#0F172A]"
            >
              <option value="ALL">All corridors</option>
              <option value="GANJAM-SURAT">GANJAM-SURAT</option>
              <option value="KALAHANDI-HYDERABAD">KALAHANDI-HYDERABAD</option>
              <option value="GAJAPATI-VISAKHAPATNAM">GAJAPATI-VISAKHAPATNAM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Role & Small-Cell Masking Notice (FO-INT-222, P-11, C-7) */}
      <div className="surface-solid rounded-[16px] p-3.5 border-l-4 border-l-[#5558E8] flex flex-wrap items-center justify-between gap-2 text-xs font-inter text-[#334155]">
        <span>
          <strong>Aggregate view (P-11):</strong> Any non-zero cell with fewer than 5 households (0 &lt; n &lt; 5) is displayed as <code className="font-bold text-[#4648D4]">&lt; 5</code> to prevent re-identification (Q-09). No household IDs appear on S12.
        </span>
        <EvidenceChip state="PROVISIONAL" customLabel="Small-cell rule < 5 (Q-09)" size="sm" />
      </div>

      {/* Four KPI Cards (FO-INT-224, AC-S12-1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-1 rounded-[24px] p-5">
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            Households in scope
          </span>
          <p className="text-3xl font-bold font-inter text-[#0F172A] mt-2 tabular-nums">
            {formatMaskedCount(hhCount)}
          </p>
          <p className="text-xs text-[#475569] mt-1">
            {effectivePartner === 'ALL'
              ? '17 in interactive showcase (30 in full CSV pack)'
              : `Scoped to ${effectivePartner}`}
          </p>
        </div>

        <div className="glass-1 rounded-[24px] p-5">
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            Active loan accounts
          </span>
          <p className="text-3xl font-bold font-inter text-[#0F172A] mt-2 tabular-nums">
            {formatMaskedCount(activeLoanCount)}
          </p>
          <p className="text-xs text-[#475569] mt-1">
            Across 3 synthetic FSP partners
          </p>
        </div>

        <div className="glass-1 rounded-[24px] p-5">
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            Households in lean season
          </span>
          <p className="text-3xl font-bold font-inter text-[#0F172A] mt-2 tabular-nums">
            {formatMaskedCount(leanCount)}
          </p>
          <p className="text-xs text-[#475569] mt-1">
            Active LEAN window on reference date
          </p>
        </div>

        <div className="glass-1 rounded-[24px] p-5">
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            Suggestions by status
          </span>
          <p className="text-lg font-extrabold font-inter text-[#0F172A] mt-2 tabular-nums">
            {formatMaskedCount(insufficientCount)} Insufficient data ·{' '}
            {formatMaskedCount(conflictReviewCount)} Conflict review
          </p>
          <p className="text-xs text-[#0E7490] font-semibold mt-1">
            0 Automated action codes (rules pending)
          </p>
        </div>
      </div>

      {/* Main Chart Panel + Right Activity Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 surface-solid rounded-[24px] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Instalments and expected remittances by month
              </h2>
              <p className="text-xs text-[#475569]">
                Counts of scheduled events per month (Feb 2026 to Jan 2027), never money balances.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200">
                {(['BOTH', 'INSTALMENTS', 'REMITTANCES'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSeriesMode(m)}
                    className={`px-3 py-1 rounded-full text-xs font-inter font-semibold ${
                      seriesMode === m ? 'btn-primary-gradient text-white' : 'text-[#475569]'
                    }`}
                  >
                    {m === 'BOTH' ? 'Both' : m === 'INSTALMENTS' ? 'Instalments' : 'Remittances'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setViewAsTable(!viewAsTable)}
                className="px-3 py-1.5 rounded-[10px] border border-slate-300 text-xs font-inter font-medium"
              >
                {viewAsTable ? 'Chart' : 'View as table'}
              </button>
            </div>
          </div>

          {viewAsTable ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-inter text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#475569]">
                    <th scope="col" className="py-2 px-3">Month</th>
                    <th scope="col" className="py-2 px-3">Scheduled instalments (count)</th>
                    <th scope="col" className="py-2 px-3">Expected remittances (count)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData.map((d) => (
                    <tr key={d.month}>
                      <td className="py-2 px-3 font-semibold">{d.month}</td>
                      <td className="py-2 px-3 tabular-nums">{d.inst}</td>
                      <td className="py-2 px-3 tabular-nums">{formatMaskedCount(d.remit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-2 pt-4 items-end h-52 border-b border-slate-200 pb-2">
              {monthlyData.map((d) => (
                <button
                  key={d.month}
                  type="button"
                  onClick={() =>
                    setSelectedSegmentNote(
                      `${d.month}: ${d.inst} scheduled instalments across active loan accounts; ${formatMaskedCount(
                        d.remit
                      )} remittance events expected or confirmed. Aggregate definition only — no household list is available to Portfolio Managers.`
                    )
                  }
                  className="col-span-1 flex flex-col items-center justify-end h-full group focus-ring rounded"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    {(seriesMode === 'BOTH' || seriesMode === 'INSTALMENTS') && (
                      <div
                        className="w-3 bg-[#5558E8] rounded-t"
                        style={{ height: `${(d.inst / 32) * 100}%` }}
                        title={`${d.month} Instalments: ${d.inst}`}
                      />
                    )}
                    {(seriesMode === 'BOTH' || seriesMode === 'REMITTANCES') && (
                      <div
                        className="w-3 bg-cyan-50 border-2 border-dashed border-[#06B6D4] rounded-t"
                        style={{ height: `${(d.remit / 32) * 100}%` }}
                        title={`${d.month} Expected remittances: ${d.remit}`}
                      />
                    )}
                  </div>
                  <span className="font-inter text-[10px] text-[#475569] mt-1.5">{d.month}</span>
                </button>
              ))}
            </div>
          )}

          {selectedSegmentNote && (
            <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
              <span>{selectedSegmentNote}</span>
              <button
                type="button"
                onClick={() => setSelectedSegmentNote(null)}
                className="font-inter font-semibold text-[#4648D4]"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Right Activity Column */}
        <div className="lg:col-span-4 surface-solid rounded-[24px] p-6 space-y-4">
          <h2 className="text-base font-bold text-[#0F172A]">What changed in data</h2>
          <div className="space-y-3 font-inter text-xs">
            <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span>New seasonal records</span>
              <span className="font-bold text-[#0F172A] tabular-nums">48 total</span>
            </div>
            <div className="p-3.5 rounded-[12px] bg-[#D99A36]/12 border border-[#D99A36]/40 flex items-center justify-between">
              <span className="text-[#8A5A00] font-medium">Records awaiting verification</span>
              <span className="font-bold text-[#8A5A00] tabular-nums">17</span>
            </div>
            <div className="p-3.5 rounded-[12px] bg-[#FFDAD6]/40 border border-[#BA1A1A]/40 flex items-center justify-between">
              <span className="text-[#93000A] font-medium">Conflicts open</span>
              <span className="font-bold text-[#93000A] tabular-nums">2 households</span>
            </div>
          </div>
          {role !== 'PORTFOLIO_MANAGER' && (
            <button
              type="button"
              onClick={() => onNavigate('S13')}
              className="text-xs font-inter font-semibold text-[#4648D4] hover:underline"
            >
              Inspect Data Sources and Quality (S13) →
            </button>
          )}
        </div>
      </div>

      {/* Three Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface-solid rounded-[24px] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0F172A]">By partner</h3>
          <div className="space-y-3 font-inter text-xs">
            {[
              { id: 'FSP-SYN-01', count: 12, pct: 40 },
              { id: 'FSP-SYN-02', count: 6, pct: 20 },
              { id: 'FSP-SYN-03', count: 12, pct: 40 },
            ].map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">{p.id}</span>
                  <span className="font-bold tabular-nums">{p.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5558E8]" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-solid rounded-[24px] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0F172A]">By migration corridor</h3>
          <div className="space-y-3 font-inter text-xs">
            {[
              { name: 'GANJAM-SURAT', count: 12, masked: false },
              { name: 'GAJAPATI-VISAKHAPATNAM', count: 5, masked: false },
              { name: 'KALAHANDI-HYDERABAD', count: 3, masked: true },
              { name: 'No corridor', count: 10, masked: false },
            ].map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">{c.name}</span>
                  <span className="font-bold tabular-nums">
                    {formatMaskedCount(c.count)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.masked ? 'hatch-provisional border border-slate-400' : 'bg-[#06B6D4]'}`}
                    style={{ width: `${(c.count / 15) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-solid rounded-[24px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A]">Data completeness</h3>
            <EvidenceChip state="PROVISIONAL" customLabel="provisional bands" size="sm" />
          </div>
          <div className="space-y-3 font-inter text-xs">
            {[
              { label: 'High (≥ 75%)', count: 22, pct: 73 },
              { label: 'Medium (50–74%)', count: 6, pct: 20 },
              { label: 'Low (< 50%)', count: 2, pct: 12, masked: true },
            ].map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex justify-between">
                  <span>{b.label}</span>
                  <span className="font-bold tabular-nums">{b.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#8B5CF6]" style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wide Card: Instalment outcomes recorded */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-[#0F172A]">Instalment outcomes recorded</h3>
          <span className="font-inter text-xs font-bold text-[#0F172A] tabular-nums">
            330 scheduled instalments
          </span>
        </div>

        <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-100">
          <div className="bg-[#5558E8] h-full" style={{ width: '58.8%' }} title="194 paid on time" />
          <div className="bg-[#8B5CF6] h-full" style={{ width: '3.6%' }} title="12 paid late" />
          <div className="bg-[#D99A36] h-full" style={{ width: '1%' }} title="1 partly paid" />
          <div className="hatch-unknown h-full" style={{ width: '1.8%' }} title="5 outcome unknown" />
          <div className="bg-slate-200 h-full" style={{ width: '34.8%' }} title="118 pending" />
        </div>

        <div className="flex flex-wrap items-center gap-4 font-inter text-xs text-[#334155]">
          <span>194 paid on time</span> · <span>12 paid late</span> · <span>1 partly paid</span> ·{' '}
          <span>5 outcome unknown</span> · <span>118 pending</span>
        </div>

        <p className="text-xs text-[#475569] border-t border-slate-100 pt-2">
          Counts of recorded events. They are not repayment rates or ratings. Groups with fewer than 5 households show &lsquo;&lt;5&rsquo; so individuals cannot be picked out. Masking rule is a design recommendation pending confirmation (Q-09).
        </p>
      </div>
    </div>
  );
};

interface S13Props {
  role: RoleId;
  entries: ProvenanceEntry[];
  onNavigate: (screen: ScreenId) => void;
  onCopyId: (id: string) => void;
}

export const S13DataQuality: React.FC<S13Props> = ({
  role,
  entries,
  onNavigate,
  onCopyId,
}) => {
  const [verifFilter, setVerifFilter] = useState<'ALL' | 'UNVERIFIED' | 'CONFLICT'>('ALL');
  const [datasetFilter, setDatasetFilter] = useState('ALL');
  const [selectedCsvSpec, setSelectedCsvSpec] = useState(CSV_TEMPLATE_SPECS[0].file);
  const [ruleActionFilter, setRuleActionFilter] = useState<
    'ALL' | 'REJECTED_AT_INGESTION' | 'FLAGGED_UNVERIFIED' | 'GATES_COMPLETENESS'
  >('ALL');

  const filteredEntries = entries.filter((e) => {
    if (verifFilter === 'UNVERIFIED' && e.verification_status !== 'UNVERIFIED') return false;
    if (verifFilter === 'CONFLICT' && e.conflict_status !== 'CONFLICT_DETECTED') return false;
    if (datasetFilter !== 'ALL' && e.referenced_dataset_name !== datasetFilter) return false;
    return true;
  });

  const activeCsvTemplate =
    CSV_TEMPLATE_SPECS.find((c) => c.file === selectedCsvSpec) || CSV_TEMPLATE_SPECS[0];
  const filteredRules = DAY1_VALIDATION_RULES.filter(
    (r) => ruleActionFilter === 'ALL' || r.actionTaken === ruleActionFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
            Data Sources and Quality
          </h1>
          <p className="text-sm text-[#475569]">
            Where each record came from, how fresh it is, and whether it has been verified.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-[10px] bg-white border border-slate-200 font-inter text-xs font-semibold text-[#0F172A]">
            Schema checks passed · 904 of 904
          </span>
          <span className="px-3 py-1.5 rounded-[10px] bg-white border border-slate-200 font-inter text-xs font-semibold text-[#0F172A]">
            Duplicate checks · 904 unique
          </span>
          <button
            type="button"
            onClick={() => onNavigate('S14')}
            className="btn-primary-gradient px-4 py-2 rounded-[10px] text-xs font-inter font-semibold"
          >
            Conflicts queue (S14)
          </button>
        </div>
      </div>

      {/* Four KPI Cards (FO-INT-243, AC-S13-1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setVerifFilter('ALL')}
          className="glass-1 rounded-[24px] p-5 text-left"
        >
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            Records with provenance
          </span>
          <p className="text-3xl font-bold font-inter text-[#0F172A] mt-2 tabular-nums">66</p>
          <p className="text-xs text-[#475569] mt-1">
            Showcase cohort (904 in full append-only CSV pack)
          </p>
        </button>

        <button
          type="button"
          onClick={() => setVerifFilter('ALL')}
          className="glass-1 rounded-[24px] p-5 text-left"
        >
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            Verified
          </span>
          <p className="text-3xl font-bold font-inter text-[#0F172A] mt-2 tabular-nums">58</p>
          <p className="text-xs text-[#475569] mt-1">
            Confirmed upstream or officer-verified (857 in full pack)
          </p>
        </button>

        <button
          type="button"
          onClick={() => setVerifFilter('UNVERIFIED')}
          className="glass-1 rounded-[24px] p-5 text-left"
        >
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#8A5A00]">
            Unverified
          </span>
          <p className="text-3xl font-bold font-inter text-[#8A5A00] mt-2 tabular-nums">8</p>
          <p className="text-xs text-[#475569] mt-1">
            Household-reported or pending verification (47 in full pack)
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('S14')}
          className="glass-1 rounded-[24px] p-5 text-left"
        >
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#93000A]">
            Conflicts
          </span>
          <p className="text-3xl font-bold font-inter text-[#93000A] mt-2 tabular-nums">
            2
          </p>
          <p className="text-xs text-[#93000A] font-semibold mt-1">
            2 households (SANKET-HH-000104, HH-000109) · Open S14 →
          </p>
        </button>
      </div>

      {/* Freshness Distribution Panel + By Source System */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 surface-solid rounded-[24px] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#0F172A]">How old are the records?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-inter">
            {[
              { bucket: '0–30 days', count: 464, pct: 100 },
              { bucket: '31–90 days', count: 137, pct: 35 },
              { bucket: '91–180 days', count: 236, pct: 55 },
              { bucket: '181+ days', count: 67, pct: 20 },
            ].map((b) => (
              <div key={b.bucket} className="p-4 rounded-[14px] bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs text-[#475569]">{b.bucket}</p>
                <p className="text-2xl font-bold text-[#0F172A] tabular-nums">{b.count}</p>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5558E8]" style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#475569] pt-2">
            No freshness boundary is configured, so SANKET shows ages and does not label records stale (Open Decision Q-05).
          </p>
        </div>

        <div className="lg:col-span-5 surface-solid rounded-[24px] p-6 space-y-3">
          <h2 className="text-lg font-bold text-[#0F172A]">By source system</h2>
          <ul className="space-y-2 font-inter text-xs">
            {[
              { sys: 'SYNTH_DEMO_CHECKIN_SURVEY_EXPORT', count: 275 },
              { sys: 'SYNTH_DEMO_MFI_A_LMS_EXPORT', count: 168 },
              { sys: 'SYNTH_DEMO_SHG_REGISTER_EXPORT', count: 156 },
              { sys: 'SYNTH_DEMO_NBFC_C_LMS_EXPORT', count: 102 },
              { sys: 'SYNTH_DEMO_MFI_B_LMS_EXPORT', count: 76 },
              { sys: '+7 more source systems', count: 127 },
            ].map((s) => (
              <li
                key={s.sys}
                className="p-2.5 rounded-[10px] bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <span className="truncate pr-2 text-[#334155]">{s.sys}</span>
                <span className="font-bold text-[#0F172A] tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* By Dataset Table */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">By dataset</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-inter text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[#475569]">
                <th scope="col" className="py-2.5 px-3">Dataset</th>
                <th scope="col" className="py-2.5 px-3">Entries</th>
                <th scope="col" className="py-2.5 px-3">Verified</th>
                <th scope="col" className="py-2.5 px-3">Unverified</th>
                <th scope="col" className="py-2.5 px-3">Conflicts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'household_master', entries: 60, ver: 30, unver: 30, conf: 0 },
                { name: 'mfi_loan_accounts', entries: 34, ver: 33, unver: 1, conf: 1 },
                { name: 'repayment_history', entries: 331, ver: 331, unver: 0, conf: 0 },
                { name: 'shg_savings_records', entries: 156, ver: 156, unver: 0, conf: 0 },
                { name: 'seasonal_context', entries: 48, ver: 32, unver: 16, conf: 2 },
                { name: 'household_checkins', entries: 275, ver: 275, unver: 0, conf: 0 },
              ].map((d) => (
                <tr key={d.name} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{d.name}</td>
                  <td className="py-2.5 px-3 tabular-nums">{d.entries}</td>
                  <td className="py-2.5 px-3 tabular-nums">{d.ver}</td>
                  <td className="py-2.5 px-3 tabular-nums">{d.unver}</td>
                  <td className="py-2.5 px-3 tabular-nums font-bold text-[#93000A]">
                    {d.conf}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry-Level Provenance Table (gated for Portfolio Manager) */}
      {role === 'PORTFOLIO_MANAGER' ? (
        <div className="surface-solid rounded-[24px] p-6 border-l-4 border-l-[#5558E8]">
          <p className="text-sm font-bold text-[#0F172A]">
            Entry-level detail is available to officers and compliance reviewers.
          </p>
          <p className="text-xs text-[#475569] mt-1">
            Portfolio Managers view dataset and source-system aggregates only (Open Decision Q-04).
          </p>
        </div>
      ) : (
        <div className="surface-solid rounded-[24px] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#0F172A]">Provenance entries</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                aria-label="Filter provenance by dataset"
                value={datasetFilter}
                onChange={(e) => setDatasetFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-[8px] px-2.5 py-1.5 text-xs font-inter"
              >
                <option value="ALL">All datasets</option>
                <option value="household_master">household_master</option>
                <option value="mfi_loan_accounts">mfi_loan_accounts</option>
                <option value="seasonal_context">seasonal_context</option>
                <option value="shg_savings_records">shg_savings_records</option>
                <option value="household_checkins">household_checkins</option>
              </select>
              {(['ALL', 'UNVERIFIED', 'CONFLICT'] as const).map((vf) => (
                <button
                  key={vf}
                  type="button"
                  onClick={() => setVerifFilter(vf)}
                  className={`px-3 py-1 rounded-full text-xs font-inter font-semibold ${
                    verifFilter === vf ? 'btn-primary-gradient text-white' : 'bg-slate-100 text-[#334155]'
                  }`}
                >
                  {vf === 'ALL' ? 'All entries' : vf === 'UNVERIFIED' ? 'Unverified only' : 'Conflicts only'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#475569]">
                  <th scope="col" className="py-2.5 px-2">Provenance ID</th>
                  <th scope="col" className="py-2.5 px-2">Household Token</th>
                  <th scope="col" className="py-2.5 px-2">Dataset</th>
                  <th scope="col" className="py-2.5 px-2">Record</th>
                  <th scope="col" className="py-2.5 px-2">Field</th>
                  <th scope="col" className="py-2.5 px-2">Source system</th>
                  <th scope="col" className="py-2.5 px-2">Freshness</th>
                  <th scope="col" className="py-2.5 px-2">Conflict</th>
                  <th scope="col" className="py-2.5 px-2">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((e) => (
                  <tr key={e.provenance_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2">
                      <CopyableId id={e.provenance_id} onCopy={onCopyId} />
                    </td>
                    <td className="py-2.5 px-2">
                      <CopyableId id={e.household_id} onCopy={onCopyId} />
                    </td>
                    <td className="py-2.5 px-2">{e.referenced_dataset_name}</td>
                    <td className="py-2.5 px-2 font-semibold">{e.referenced_record_id}</td>
                    <td className="py-2.5 px-2">{e.referenced_field_name}</td>
                    <td className="py-2.5 px-2 text-[#475569]">{e.source_system_name}</td>
                    <td className="py-2.5 px-2 tabular-nums">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{e.freshness_days} days</span>
                        {e.freshness_days > 90 && (
                          <EvidenceChip state="STALE" customLabel="Older than 90 days" size="sm" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      {e.conflict_status === 'CONFLICT_DETECTED' ? (
                        <button
                          type="button"
                          onClick={() => onNavigate('S14')}
                          className="text-left"
                        >
                          <EvidenceChip state="CONFLICT" size="sm" />
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <EvidenceChip
                        state={e.verification_status === 'VERIFIED' ? 'OBSERVED' : 'PROVISIONAL'}
                        customLabel={e.verification_status}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day 1 Data Architecture Spec: 7 CSV Templates (§3 & §10) */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#4648D4]">
              Day 1 Data Architecture Spec · §3 &amp; §10
            </span>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Seven core dataset schemas &amp; CSV ingestion templates (Decision D1)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onCopyId(activeCsvTemplate.columns.join(','))}
            className="px-3.5 py-2 rounded-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 font-inter text-xs font-semibold text-[#0F172A]"
          >
            Copy {activeCsvTemplate.file} header row
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {CSV_TEMPLATE_SPECS.map((tpl) => (
            <button
              key={tpl.file}
              type="button"
              onClick={() => setSelectedCsvSpec(tpl.file)}
              className={`px-3 py-1.5 rounded-full text-xs font-inter font-semibold transition-all ${
                selectedCsvSpec === tpl.file
                  ? 'btn-primary-gradient text-white'
                  : 'bg-slate-100 text-[#334155] hover:bg-slate-200'
              }`}
            >
              {tpl.dataset} · {tpl.file} ({tpl.columnCount})
            </button>
          ))}
        </div>

        <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200 space-y-3 font-inter text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div>
              <span className="font-bold text-[#0F172A]">{activeCsvTemplate.file}</span> ·{' '}
              <span className="text-[#475569]">Primary Key: </span>
              <code className="font-bold text-[#4648D4]">{activeCsvTemplate.pk}</code>
            </div>
            <div className="text-[#475569]">
              Foreign Key: <code className="text-[#0F172A] font-semibold">{activeCsvTemplate.fk}</code>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeCsvTemplate.columns.map((col, idx) => (
              <span
                key={col}
                className="px-2.5 py-1 rounded-[8px] bg-white border border-slate-200 text-[#0F172A] font-medium"
              >
                <span className="text-[#475569] mr-1">{idx + 1}.</span>
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Day 1 Data Architecture Spec: 16 Validation Rules (V-01 to V-16, §6) */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#4648D4]">
              Day 1 Data Architecture Spec · §6
            </span>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Validation &amp; conflict resolution rules (V-01 to V-16)
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'All (16)' },
                { id: 'REJECTED_AT_INGESTION', label: 'Rejected at ingestion (11)' },
                { id: 'FLAGGED_UNVERIFIED', label: 'Flagged unverified (4)' },
                { id: 'GATES_COMPLETENESS', label: 'Gates 90d completeness (1)' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRuleActionFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-inter font-semibold ${
                  ruleActionFilter === f.id
                    ? 'btn-primary-gradient text-white'
                    : 'bg-slate-100 text-[#334155]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-inter text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[#475569]">
                <th scope="col" className="py-2.5 px-3">Rule ID</th>
                <th scope="col" className="py-2.5 px-3">Condition checked</th>
                <th scope="col" className="py-2.5 px-3">Affected dataset(s)</th>
                <th scope="col" className="py-2.5 px-3">Action taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((r) => (
                <tr key={r.ruleId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-[#4648D4] whitespace-nowrap">{r.ruleId}</td>
                  <td className="py-2.5 px-3 text-[#0F172A]">{r.conditionChecked}</td>
                  <td className="py-2.5 px-3 text-[#475569]">{r.affectedDataset}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <EvidenceChip
                      state={
                        r.actionTaken === 'REJECTED_AT_INGESTION'
                          ? 'CONFLICT'
                          : r.actionTaken === 'FLAGGED_UNVERIFIED'
                          ? 'PROVISIONAL'
                          : 'DERIVED'
                      }
                      customLabel={r.actionTaken}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface S14Props {
  role: RoleId;
  conflicts: ConflictItem[];
  initialHouseholdFilter?: string;
  onRecordVerification: (conflictId: string, choice: string, howVerified: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectHousehold: (id: string) => void;
  onCopyId: (id: string) => void;
}

export const S14ConflictsVerification: React.FC<S14Props> = ({
  role,
  conflicts,
  initialHouseholdFilter,
  onRecordVerification,
  onNavigate,
  onSelectHousehold,
  onCopyId,
}) => {
  const [hhFilter, setHhFilter] = useState<string>(initialHouseholdFilter || 'ALL');
  const visibleConflicts = conflicts.filter(
    (c) => hhFilter === 'ALL' || c.household_id === hhFilter
  );
  const [selectedId, setSelectedId] = useState(
    visibleConflicts[0]?.conflict_id || conflicts[0]?.conflict_id || 'CONF-104'
  );
  const [demoWriteEnabled, setDemoWriteEnabled] = useState(true);
  const [choice, setChoice] = useState('The first source is correct');
  const [howNote, setHowNote] = useState(
    'Checked physical passbook and branch ledger extract on 17 Oct 2026'
  );
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const activeConflict =
    visibleConflicts.find((c) => c.conflict_id === selectedId) ||
    visibleConflicts[0] ||
    conflicts[0];

  const isSource1Verified =
    Boolean(activeConflict?.verified_at) &&
    Boolean(activeConflict?.verified_choice?.toLowerCase().includes('first'));
  const isSource2Verified =
    Boolean(activeConflict?.verified_at) &&
    Boolean(activeConflict?.verified_choice?.toLowerCase().includes('second'));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs font-inter text-[#475569] mb-1">
            <button type="button" onClick={() => onNavigate('S13')} className="hover:underline">
              Data Sources and Quality
            </button>{' '}
            › <span className="text-[#0F172A] font-semibold">Conflicts and Verification</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
            Conflicts and Verification
          </h1>
          <p className="text-sm text-[#475569]">
            Two sources report different values. SANKET shows both side by side and never silently overwrites either value (Decision D4).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hhFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setHhFilter('ALL')}
              className="px-3.5 py-2 rounded-[10px] bg-indigo-50 text-[#4648D4] border border-indigo-200 text-xs font-inter font-semibold"
            >
              Filtered to {hhFilter} · Show all ({conflicts.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('S16')}
            className="glass-1 px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold text-[#0F172A] hover:bg-white"
          >
            View in audit history (S16)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Open Conflicts (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {visibleConflicts.map((c) => {
            const isSelected = c.conflict_id === activeConflict.conflict_id;
            return (
              <button
                key={c.conflict_id}
                type="button"
                onClick={() => setSelectedId(c.conflict_id)}
                className={`w-full text-left rounded-[20px] p-4 transition-all focus-ring space-y-2 ${
                  isSelected
                    ? 'surface-solid border-2 border-[#5558E8]'
                    : 'glass-1 hover:bg-white/90'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <EvidenceChip state="CONFLICT" customLabel="Conflict" size="sm" />
                  <EvidenceChip
                    state={c.verified_at ? 'OBSERVED' : 'PROVISIONAL'}
                    customLabel={c.verified_at ? 'Verified in this session' : 'Unverified'}
                    size="sm"
                  />
                </div>
                <p className="text-sm font-bold text-[#0F172A]">{c.title}</p>
                <p className="font-inter text-xs text-[#475569]">
                  Record: {c.record_id} · Field: {c.field_name}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Comparison Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="surface-solid rounded-[24px] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-lg font-bold text-[#0F172A]">{activeConflict.title}</h2>
                  {activeConflict.verified_at && (
                    <EvidenceChip
                      state="OBSERVED"
                      customLabel="Verified in this session"
                      size="sm"
                    />
                  )}
                </div>
                <p className="font-inter text-xs text-[#475569]">
                  Dataset: {activeConflict.dataset_name} · Field: {activeConflict.field_name}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <EvidenceChip state="DERIVED" customLabel={`ƒ Derived · ${activeConflict.difference_label}`} size="sm" />
                {activeConflict.secondary_difference_label && (
                  <EvidenceChip
                    state="DERIVED"
                    customLabel={`ƒ ${activeConflict.secondary_difference_label}`}
                    size="sm"
                  />
                )}
              </div>
            </div>

            {/* Side-by-Side Two-Column Source Comparison (AC-S14-1, AC-S14-2, FO-TC-491) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-5 rounded-[18px] border space-y-2 ${
                  isSource1Verified
                    ? 'bg-emerald-50/70 border-2 border-emerald-600'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-inter text-xs font-semibold text-[#4648D4]">
                    Source 1 · {activeConflict.sourceA.title}
                  </span>
                  {isSource1Verified && (
                    <EvidenceChip state="OBSERVED" customLabel="Verified value" size="sm" />
                  )}
                </div>
                <p className="text-3xl font-extrabold font-inter text-[#0F172A] tabular-nums">
                  {activeConflict.sourceA.value_display}
                </p>
                <p className="text-xs text-[#334155]">{activeConflict.sourceA.sub_detail}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-inter text-[#475569]">
                  <CopyableId id={activeConflict.sourceA.record_id} onCopy={onCopyId} />
                  <span>Updated {activeConflict.sourceA.updated_at}</span>
                </div>
              </div>

              <div
                className={`p-5 rounded-[18px] border space-y-2 ${
                  isSource2Verified
                    ? 'bg-emerald-50/70 border-2 border-emerald-600'
                    : 'bg-[#FFDAD6]/25 border-[#BA1A1A]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-inter text-xs font-semibold text-[#93000A]">
                    Source 2 · {activeConflict.sourceB.title}
                  </span>
                  {isSource2Verified && (
                    <EvidenceChip state="OBSERVED" customLabel="Verified value" size="sm" />
                  )}
                </div>
                <p className="text-3xl font-extrabold font-inter text-[#0F172A] tabular-nums">
                  {activeConflict.sourceB.value_display}
                </p>
                <p className="text-xs text-[#334155]">{activeConflict.sourceB.sub_detail}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-inter text-[#475569]">
                  <CopyableId id={activeConflict.sourceB.record_id} onCopy={onCopyId} />
                  <span>Updated {activeConflict.sourceB.updated_at}</span>
                </div>
              </div>
            </div>

            {/* Documented Rule Callout */}
            <div className="p-4 rounded-[14px] bg-slate-100 border border-slate-300 text-xs text-[#0F172A] space-y-1">
              <p className="font-bold">
                Rule: the most recent verified record wins; conflicts are flagged for officer review. When neither record is verified, no value is chosen automatically.
              </p>
              <p className="text-[#475569]">
                Both values stay visible in the household profile and provenance log even after officer verification.
              </p>
            </div>

            {activeConflict.verified_at && (
              <div className="p-4 rounded-[14px] bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <p className="font-bold text-emerald-950">
                  Verified in this session ({activeConflict.verified_at}): {activeConflict.verified_choice} · Verified value marked above
                </p>
                <p className="text-[#334155]">
                  How verified: {activeConflict.verified_note} · Original source values remain visible.
                </p>
              </div>
            )}

            {/* Officer Verification Section (FO-INT-254, FO-INT-255) */}
            {role === 'FIELD_OFFICER' ? (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-bold text-[#0F172A]">Officer verification</h3>
                  <button
                    type="button"
                    onClick={() => setDemoWriteEnabled(!demoWriteEnabled)}
                    className="text-xs font-inter font-semibold text-[#4648D4] hover:underline"
                  >
                    {demoWriteEnabled
                      ? 'Show Q-07 disabled state'
                      : 'Enable Journey D interactive demo'}
                  </button>
                </div>

                {!demoWriteEnabled && (
                  <p className="text-xs text-[#8A5A00] bg-[#D99A36]/12 p-3 rounded-[10px]">
                    Recording a verification needs a defined write path. This is an open project decision (Q-07).
                  </p>
                )}

                <fieldset disabled={!demoWriteEnabled} className="space-y-3 disabled:opacity-50">
                  <legend className="text-xs font-inter font-semibold text-[#334155]">
                    Which source value was verified in the field?
                  </legend>
                  {[
                    'The first source is correct',
                    'The second source is correct',
                    'Neither; both need checking',
                  ].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-xs text-[#0F172A] cursor-pointer">
                      <input
                        type="radio"
                        name="s14-verify-choice"
                        checked={choice === opt}
                        onChange={() => setChoice(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}

                  <div className="space-y-1 pt-2">
                    <label htmlFor="s14-how" className="block text-xs font-inter font-semibold text-[#334155]">
                      Verification note (required)
                    </label>
                    <input
                      id="s14-how"
                      type="text"
                      value={howNote}
                      onChange={(e) => setHowNote(e.target.value)}
                      placeholder="e.g., Checked physical passbook and branch ledger extract on 17 Oct 2026"
                      className="w-full rounded-[10px] p-2.5 bg-white border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onSelectHousehold(activeConflict.household_id)}
                      className="text-xs font-inter font-semibold text-[#4648D4] hover:underline"
                    >
                      Open household {activeConflict.household_id} →
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onRecordVerification(
                            activeConflict.conflict_id,
                            choice,
                            howNote.trim() || 'Verified against branch passbook during demo session'
                          )
                        }
                        className="btn-primary-gradient px-4 py-2.5 rounded-[10px] text-xs font-inter font-semibold"
                      >
                        Record verification (demo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmModalOpen(true)}
                        className="px-3 py-2.5 rounded-[10px] border border-slate-300 bg-white text-xs font-inter font-semibold text-[#334155]"
                      >
                        Review append notice
                      </button>
                    </div>
                  </div>
                </fieldset>
              </div>
            ) : (
              <div className="p-4 rounded-[14px] bg-slate-50 border border-slate-200 text-xs font-inter text-[#334155]">
                Only a Field Officer assigned to this household can record field verification.
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="surface-solid rounded-[20px] max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A]">Append verification record?</h3>
            <p className="text-xs text-[#334155] leading-relaxed">
              This adds a verification record. It does not overwrite either source value.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-[10px] border border-slate-300 text-xs font-inter font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModalOpen(false);
                  onRecordVerification(
                    activeConflict.conflict_id,
                    choice,
                    howNote.trim() || 'Verified against branch passbook during demo session'
                  );
                }}
                className="btn-primary-gradient px-4 py-2 rounded-[10px] text-xs font-inter font-semibold"
              >
                Confirm verification (demo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface S16AuditProps {
  role: RoleId;
  entries: ProvenanceEntry[];
  reviews: HumanReviewRecord[];
  onNavigate: (screen: ScreenId) => void;
  onSwitchRole: (role: RoleId) => void;
  onSelectHousehold: (id: string) => void;
  onCopyId: (id: string) => void;
}

export const S16AuditHistory: React.FC<S16AuditProps> = ({
  role,
  entries,
  reviews,
  onSelectHousehold,
  onCopyId,
}) => {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DATA' | 'CONFLICT' | 'REVIEW'>('ALL');
  const [hhQuery, setHhQuery] = useState('');

  const scopedHouseholdIds = new Set(
    filterHouseholdsByScope(HOUSEHOLDS_DATA, role, 'FSP-SYN-01').map((h) => h.household_id)
  );

  const scopedReviews =
    role === 'FIELD_OFFICER'
      ? reviews.filter((r) => scopedHouseholdIds.has(r.household_id))
      : reviews;

  const scopedEntries =
    role === 'FIELD_OFFICER'
      ? entries.filter((e) => scopedHouseholdIds.has(e.household_id))
      : entries;

  const completedReviews = scopedReviews.filter((r) => r.review_status === 'REVIEWED');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Audit History</h1>
          <p className="text-sm text-[#475569]">
            Append-only provenance log and human review audit trail (Decision D4, D9).
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 font-inter text-xs font-semibold text-[#334155]">
          Scope:{' '}
          {role === 'FIELD_OFFICER'
            ? 'Field Officer Cohort (12 households · FSP-SYN-01)'
            : role === 'PORTFOLIO_MANAGER'
            ? 'Portfolio Manager Aggregate (Household IDs hidden)'
            : 'Compliance Reviewer (All 17 showcase / 30 dataset households)'}
        </span>
      </div>

      {/* Four Stat Tiles (FO-INT-272, AC-S16-1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-1 rounded-[24px] p-5">
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            Total provenance records
          </span>
          <p className="text-3xl font-bold font-inter text-[#0F172A] mt-2 tabular-nums">
            {66 + Math.max(0, entries.length - 11)}
          </p>
          <p className="text-xs text-[#475569] mt-1">Append-only (904 in full CSV pack)</p>
        </div>

        <div className="glass-1 rounded-[24px] p-5">
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            Verified records
          </span>
          <p className="text-3xl font-bold font-inter text-[#0F172A] mt-2 tabular-nums">
            {58 + Math.max(0, entries.length - 11)}
          </p>
          <p className="text-xs text-[#475569] mt-1">Upstream + session verifications</p>
        </div>

        <div className="glass-1 rounded-[24px] p-5">
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#8A5A00]">
            Unverified records
          </span>
          <p className="text-3xl font-bold font-inter text-[#8A5A00] mt-2 tabular-nums">8</p>
          <p className="text-xs text-[#475569] mt-1">Flagged for field verification</p>
        </div>

        <div className="glass-1 rounded-[24px] p-5">
          <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#4648D4]">
            Recorded human reviews
          </span>
          <p className="text-3xl font-bold font-inter text-[#4648D4] mt-2 tabular-nums">
            {completedReviews.length}
          </p>
          <p className="text-xs text-[#475569] mt-1">
            {completedReviews.length === 0
              ? '0 at start of demo; increments on S15 save'
              : 'Recorded in this browser session'}
          </p>
        </div>
      </div>

      {/* Human Review History Table (FO-INT-274, AC-S16-2, FO-TC-500, 6 columns) */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Human Review History ({scopedReviews.length} households in scope)
            </h2>
            <p className="text-xs text-[#475569]">
              Every human decision recorded on S15 is appended here with officer ID, timestamp, and reason.
            </p>
          </div>
          <EvidenceChip
            state="OBSERVED"
            customLabel={`${completedReviews.length} reviewed · ${
              scopedReviews.length - completedReviews.length
            } pending`}
            size="sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-inter text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[#475569]">
                <th scope="col" className="py-2.5 px-3">Household</th>
                <th scope="col" className="py-2.5 px-3">Suggestion status</th>
                <th scope="col" className="py-2.5 px-3">Officer decision</th>
                <th scope="col" className="py-2.5 px-3">Reason</th>
                <th scope="col" className="py-2.5 px-3">Officer ID</th>
                <th scope="col" className="py-2.5 px-3">Reviewed at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scopedReviews.map((rev) => {
                const hh = HOUSEHOLDS_DATA.find((h) => h.household_id === rev.household_id);
                const statusLabel = hh
                  ? mapStatusToOfficerLabel(hh.recommendation_status, hh.reason_codes).label
                  : 'Insufficient data · Field visit recommended';
                return (
                  <tr key={rev.review_id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-[#0F172A]">
                      {role === 'PORTFOLIO_MANAGER' ? (
                        <span className="text-[#475569]">[Hidden in PM scope]</span>
                      ) : (
                        <CopyableId
                          id={rev.household_id}
                          onClick={
                            role === 'FIELD_OFFICER'
                              ? () => onSelectHousehold(rev.household_id)
                              : undefined
                          }
                          onCopy={onCopyId}
                        />
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#334155]">{statusLabel}</td>
                    <td className="py-3 px-3">
                      <EvidenceChip
                        state={rev.review_status === 'REVIEWED' ? 'OBSERVED' : 'PROVISIONAL'}
                        customLabel={mapDecisionToLabel(rev.officer_decision)}
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-3 text-[#0F172A]">
                      {rev.override_reason || '—'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#334155]">
                      {rev.officer_id || '—'}
                    </td>
                    <td className="py-3 px-3 tabular-nums text-[#475569]">
                      {rev.reviewed_at || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Bar + Provenance Log Table (FO-INT-273, FO-INT-277) */}
      <div className="glass-1 rounded-[20px] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(['ALL', 'DATA', 'CONFLICT', 'REVIEW'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-inter font-semibold ${
                typeFilter === t ? 'btn-primary-gradient text-white' : 'bg-white text-[#334155]'
              }`}
            >
              {t === 'ALL'
                ? 'All events'
                : t === 'DATA'
                ? 'Data & verification'
                : t === 'CONFLICT'
                ? 'Conflicts'
                : 'Human reviews'}
            </button>
          ))}
          {role !== 'PORTFOLIO_MANAGER' && (
            <input
              type="search"
              value={hhQuery}
              onChange={(e) => setHhQuery(e.target.value)}
              placeholder="Filter by household token…"
              className="bg-white border border-slate-300 rounded-[8px] px-3 py-1.5 text-xs font-inter"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 surface-solid rounded-[24px] p-6 space-y-4">
          <ol className="space-y-3">
            {/* Provenance entries */}
            {scopedEntries
              .filter((e) => {
                if (typeFilter === 'REVIEW') return false;
                if (typeFilter === 'CONFLICT' && e.conflict_status !== 'CONFLICT_DETECTED')
                  return false;
                if (
                  hhQuery.trim() !== '' &&
                  !e.household_id.toLowerCase().includes(hhQuery.toLowerCase()) &&
                  !e.referenced_record_id.toLowerCase().includes(hhQuery.toLowerCase())
                )
                  return false;
                return true;
              })
              .map((e) => {
                const isConflict = e.conflict_status === 'CONFLICT_DETECTED';
                const isVerif = e.provenance_id.startsWith('SANKET-PV-DEMO');
                return (
                  <li
                    key={e.provenance_id}
                    className={`p-4 rounded-[14px] border space-y-1.5 ${
                      isConflict
                        ? 'bg-[#FFDAD6]/30 border-[#BA1A1A]/40'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <EvidenceChip
                        state={isConflict ? 'CONFLICT' : 'OBSERVED'}
                        customLabel={
                          isConflict
                            ? 'Conflict detected'
                            : isVerif
                            ? 'Verification recorded'
                            : 'Data record added'
                        }
                        size="sm"
                      />
                      <time className="font-inter text-xs text-[#475569]">
                        {e.extraction_timestamp}
                      </time>
                    </div>
                    <p className="text-sm font-bold text-[#0F172A] font-inter">
                      {e.referenced_dataset_name} · {e.referenced_record_id} · {e.referenced_field_name}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-inter text-[#475569]">
                      <span>
                        Source: {e.source_system_name} · Freshness: {e.freshness_days}d
                      </span>
                      {role === 'PORTFOLIO_MANAGER' ? (
                        <span className="text-[11px] text-[#64748B]">
                          Aggregate view — household ID hidden
                        </span>
                      ) : (
                        <CopyableId
                          id={e.household_id}
                          onClick={
                            role === 'FIELD_OFFICER'
                              ? () => onSelectHousehold(e.household_id)
                              : undefined
                          }
                          onCopy={onCopyId}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
          </ol>
        </div>

        <div className="lg:col-span-4 surface-solid rounded-[24px] p-6 space-y-3">
          <h2 className="text-base font-bold text-[#0F172A]">About this log</h2>
          <p className="text-xs text-[#334155] leading-relaxed">
            This log is append-only. Entries cannot be edited or removed. Sign-in events, page views and exports are not in the data architecture and are not shown.
          </p>
          <p className="text-xs text-[#475569] leading-relaxed">
            No actor identities are invented for upstream dataset extracts; absent actors read &ldquo;Not recorded&rdquo;.
          </p>
        </div>
      </div>
    </div>
  );
};

export const S17GovernanceCompliance: React.FC<{
  onNavigate: (screen: ScreenId) => void;
}> = ({ onNavigate }) => {
  const [specTab, setSpecTab] = useState<'DECISIONS' | 'KPIS' | 'APAC'>('DECISIONS');
  const [openDecisionFilter, setOpenDecisionFilter] = useState('');

  const filteredOpenDecisions = OPEN_DECISIONS_LIST.filter((q) => {
    if (!openDecisionFilter.trim()) return true;
    const s = openDecisionFilter.toLowerCase();
    return (
      q.id.toLowerCase().includes(s) ||
      q.title.toLowerCase().includes(s) ||
      q.impactOnBuild.toLowerCase().includes(s) ||
      q.safeHandling.toLowerCase().includes(s) ||
      q.targetWorkstream.toLowerCase().includes(s)
    );
  });

  const sampleRedressDeadline = computeRedressDeadline('2026-10-17T08:00:00Z', 7);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
          Governance and Compliance
        </h1>
        <p className="text-sm text-[#475569]">
          Documented controls, configuration status, Day 1 Decision Register (D1–D15), and all 20 Open Project Decisions (Q-01 to Q-20).
        </p>
      </div>

      {/* Hero Card */}
      <div className="glass-1 rounded-[24px] p-6 md:p-8 space-y-2">
        <span className="font-inter text-xs font-semibold uppercase tracking-wider text-[#4648D4]">
          How SANKET is meant to be used
        </span>
        <p className="text-lg md:text-xl font-bold text-[#0F172A] leading-relaxed">
          SANKET is read-only and human-led. It shows evidence and, once rules are approved, a suggestion. A person decides. It does not approve, reject or disburse anything.
        </p>
      </div>

      {/* 2x2 Grid (FO-INT-282, FO-INT-283, P-01, C-9) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="surface-solid rounded-[24px] p-6 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-bold text-[#0F172A]">Consent &amp; Redress (P-01, C-9)</h2>
            <EvidenceChip
              state="PROVISIONAL"
              customLabel="Provisional — pending legal sign-off (Q-17)"
              size="sm"
            />
          </div>
          <p className="text-sm text-[#334155]">
            Consent status · Granted for 30 of 30 households · version DEMO-CONSENT-v1. Revocation propagates within 48 hours via soft status (Decision D14).
          </p>
          <p className="text-xs font-inter text-[#0F172A] bg-slate-50 p-3 rounded-[10px] border border-slate-200">
            <strong>Redress SLA target:</strong> <code className="font-bold">target_resolution_days = 7</code> (7 days from <code className="font-inter">created_at</code>; sample 17 Oct 2026 →{' '}
            <strong>{formatDateDisplay(sampleRedressDeadline.deadlineDateISO)}</strong>). Provisional until legal sign-off (Q-17).
          </p>
        </div>

        <div className="surface-solid rounded-[24px] p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A]">Access boundary</h2>
            <EvidenceChip state="OBSERVED" customLabel="fsp_partner_id" size="sm" />
          </div>
          <p className="text-sm text-[#334155]">
            Officers see only households of their own partner (the <code className="font-inter">fsp_partner_id</code> boundary). Managers see aggregates, never households. Compliance household-level access is tracked under Q-04.
          </p>
        </div>

        <div className="surface-solid rounded-[24px] p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A]">Human review</h2>
            <EvidenceChip state="OBSERVED" customLabel="Append-only" size="sm" />
          </div>
          <p className="text-sm text-[#334155]">
            Every suggestion is reviewed by an officer. Reviews are recorded and cannot be edited.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('S16')}
            className="text-xs font-inter font-semibold text-[#4648D4] hover:underline"
          >
            Inspect Audit History (S16) →
          </button>
        </div>

        <div className="surface-solid rounded-[24px] p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A]">Synthetic data &amp; non-discrimination</h2>
            <EvidenceChip state="PROVISIONAL" customLabel="is_synthetic = TRUE" size="sm" />
          </div>
          <p className="text-sm text-[#334155]">
            All records are synthetic (D5). No table, field, or enum encodes caste, religion, occupation, or region as a scoring input (Decision D11).
          </p>
          <button
            type="button"
            onClick={() => onNavigate('S13')}
            className="text-xs font-inter font-semibold text-[#4648D4] hover:underline"
          >
            Review provenance (S13) →
          </button>
        </div>
      </div>

      {/* Wide Configuration Status Table */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">Configuration status</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-inter text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[#475569]">
                <th scope="col" className="py-2.5 px-3">Item</th>
                <th scope="col" className="py-2.5 px-3">Status</th>
                <th scope="col" className="py-2.5 px-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { item: 'Scoring methodology', state: 'NOT_CONFIGURED' as const, label: 'Not configured', note: 'Four dimension scores and Seasonal Context Score formula pending (Q-01, Q-13)' },
                { item: 'Indicator definitions', state: 'NOT_CONFIGURED' as const, label: 'Not configured', note: 'Solution Package mentions 8 indicators (IND_01..IND_08); definitions not supplied (D10, Q-01)' },
                { item: 'Decision rules', state: 'NOT_CONFIGURED' as const, label: 'Not configured', note: 'Rules mapping evidence to the 5 advisory actions are pending (D9, Q-03)' },
                { item: 'Confidence rules', state: 'NOT_CONFIGURED' as const, label: 'Not configured', note: 'Synthetic profiles carry LOW as a placeholder; hidden in UI (Q-12)' },
                { item: 'Check-in instrument', state: 'PROVISIONAL' as const, label: 'Provisional · DEMO-PROVISIONAL-v0.1', note: '9-question survey instrument pending confirmation (Q-06)' },
                { item: 'Data freshness boundary', state: 'PROVISIONAL' as const, label: 'Older than 90 days (P-10)', note: 'Records with freshness_days > 90 display Older than 90 days alongside exact age (Q-05)' },
                { item: 'Completeness bands', state: 'PROVISIONAL' as const, label: 'Provisional', note: 'Proxy of 8 source-field readiness checks (HIGH ≥ 75, MEDIUM 50–74, LOW < 50; Decision D8)' },
                { item: 'Redress SLA target', state: 'PROVISIONAL' as const, label: '7 days (provisional, P-01)', note: 'target_resolution_days = 7 pending legal sign-off (Q-17)' },
              ].map((row) => (
                <tr key={row.item}>
                  <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{row.item}</td>
                  <td className="py-2.5 px-3">
                    <EvidenceChip state={row.state} customLabel={row.label} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-[#475569]">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Day 1 Architecture Decision Register & Solution Package Reference */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#4648D4]">
              Project Pack Reference · Day 1 Spec &amp; Phase 2 Solution Package
            </span>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Architecture Decision Register, Pilot KPIs &amp; APAC Portability
            </h2>
          </div>
          <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200">
            {[
              { id: 'DECISIONS', label: 'Decision Register (D1–D15)' },
              { id: 'KPIS', label: 'Phase 2 KPI Targets (§13)' },
              { id: 'APAC', label: 'APAC Portability (§12)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSpecTab(t.id as 'DECISIONS' | 'KPIS' | 'APAC')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-inter font-semibold ${
                  specTab === t.id ? 'btn-primary-gradient text-white' : 'text-[#475569]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {specTab === 'DECISIONS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#475569]">
                  <th scope="col" className="py-2.5 px-3">ID</th>
                  <th scope="col" className="py-2.5 px-3">Decision</th>
                  <th scope="col" className="py-2.5 px-3">Rationale</th>
                  <th scope="col" className="py-2.5 px-3">Grounded vs Proposed</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAY1_DECISION_REGISTER.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-[#4648D4] whitespace-nowrap">{d.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{d.decision}</td>
                    <td className="py-2.5 px-3 text-[#334155]">{d.rationale}</td>
                    <td className="py-2.5 px-3 text-[#475569]">{d.groundedIn}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <EvidenceChip state="OBSERVED" customLabel={d.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {specTab === 'KPIS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#475569]">
                  <th scope="col" className="py-2.5 px-3">KPI</th>
                  <th scope="col" className="py-2.5 px-3">Metric</th>
                  <th scope="col" className="py-2.5 px-3">Pilot Target</th>
                  <th scope="col" className="py-2.5 px-3">Measurement Source</th>
                  <th scope="col" className="py-2.5 px-3">Phase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PHASE2_KPI_TARGETS.map((k) => (
                  <tr key={k.kpi} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-[#0F172A]">{k.kpi}</td>
                    <td className="py-2.5 px-3 text-[#334155]">{k.metric}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#4648D4]">{k.target}</td>
                    <td className="py-2.5 px-3 text-[#475569]">{k.source}</td>
                    <td className="py-2.5 px-3">
                      <EvidenceChip state="PROVISIONAL" customLabel={k.phase} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {specTab === 'APAC' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#475569]">
                  <th scope="col" className="py-2.5 px-3">Component</th>
                  <th scope="col" className="py-2.5 px-3">Constant across APAC (IN · PH · ID · VN)</th>
                  <th scope="col" className="py-2.5 px-3">Localise per market</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {APAC_PORTABILITY_MATRIX.map((row) => (
                  <tr key={row.component} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-[#0F172A]">{row.component}</td>
                    <td className="py-2.5 px-3 text-[#334155]">{row.constantStatus}</td>
                    <td className="py-2.5 px-3 text-[#475569]">{row.localisePerMarket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Wide Open Decisions Register (Q-01 to Q-20, 5 columns, FO-INT-284, AC-S17-2, FO-TC-510) */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Open Decisions Register (Q-01 to Q-20)
            </h2>
            <p className="text-xs text-[#475569]">
              All 20 open items tracked with impact on build, temporary safe handling in this UI, and target workstream.
            </p>
          </div>
          <input
            type="search"
            value={openDecisionFilter}
            onChange={(e) => setOpenDecisionFilter(e.target.value)}
            placeholder="Filter Q-01..Q-20 or workstream…"
            className="bg-slate-50 border border-slate-300 rounded-[10px] px-3 py-1.5 text-xs font-inter"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-inter text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[#475569]">
                <th scope="col" className="py-2.5 px-3">ID</th>
                <th scope="col" className="py-2.5 px-3">Decision Needed</th>
                <th scope="col" className="py-2.5 px-3">Impact on Build</th>
                <th scope="col" className="py-2.5 px-3">Temporary Safe Handling</th>
                <th scope="col" className="py-2.5 px-3">Target Workstream</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOpenDecisions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <th scope="row" className="py-3 px-3 font-bold text-[#4648D4] whitespace-nowrap">
                    {q.id}
                  </th>
                  <td className="py-3 px-3 font-semibold text-[#0F172A]">{q.title}</td>
                  <td className="py-3 px-3 text-[#334155]">{q.impactOnBuild}</td>
                  <td className="py-3 px-3 text-[#0F172A]">{q.safeHandling}</td>
                  <td className="py-3 px-3 text-[#475569] whitespace-nowrap">
                    {q.targetWorkstream} ({q.affects})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
