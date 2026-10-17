import React, { useState } from 'react';
import {
  CORRIDOR_SEASONAL_RECORDS,
  HouseholdProfile,
  ProvenanceEntry,
} from '../data/sanketData';
import { SECTION_11_SYNTHETIC_JSON_EXAMPLE } from '../data/day1SpecData';
import {
  ScreenId,
  TEST_FIXTURES,
  computeTimingGapNote,
  daysBetween,
  formatDateDisplay,
  formatINR,
  mapDecisionToLabel,
  mapStatusToOfficerLabel,
  validateHouseholdProfileContract,
} from '../utils/sanketLogic';
import { CopyableId, EvidenceChip } from '../components/SharedPrimitives';

interface ProfileTabCommonProps {
  household: HouseholdProfile;
  onSelectTab: (tab: ScreenId) => void;
  onNavigate: (screen: ScreenId, filterPreset?: string) => void;
  onCopyId: (id: string) => void;
}

export const S05ProfileOverview: React.FC<ProfileTabCommonProps> = ({
  household,
  onSelectTab,
  onNavigate,
  onCopyId,
}) => {
  const activeLoan = household.loans.find((l) => l.loan_status === 'ACTIVE');
  const latestShg = household.shg_records[household.shg_records.length - 1];
  const expectedOrDelayedRemit = household.seasonal_records.find(
    (r) => r.remittance_status === 'EXPECTED' || r.remittance_status === 'DELAYED'
  );
  const latestCheckin = household.checkin_sessions[0];

  // Derived timing banner when next_due_date precedes expected/delayed remittance
  let timingBannerText: string | null = null;
  if (
    activeLoan?.next_due_date &&
    expectedOrDelayedRemit?.expected_remittance_date &&
    activeLoan.next_due_date < expectedOrDelayedRemit.expected_remittance_date
  ) {
    const gap = daysBetween(
      activeLoan.next_due_date,
      expectedOrDelayedRemit.expected_remittance_date
    );
    timingBannerText = `Next instalment (${formatDateDisplay(
      activeLoan.next_due_date
    )}) is ${gap} days before the expected remittance date (${formatDateDisplay(
      expectedOrDelayedRemit.expected_remittance_date
    )}). The remittance is expected, not received.`;
  }

  const isLowCompleteness = household.reason_codes.includes('DATA_COMPLETENESS_LOW');
  const isConflict = household.recommendation_status === 'CONFLICT_REQUIRES_REVIEW';

  return (
    <div className="space-y-6">
      {/* Conflict Banner if applicable */}
      {isConflict && (
        <div
          role="alert"
          className="surface-solid rounded-[16px] p-4 border-l-4 border-l-[#BA1A1A] bg-[#FFDAD6]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#93000A]">report</span>
            <div>
              <p className="text-sm font-bold text-[#93000A]">
                Data conflict — officer verification required
              </p>
              <p className="text-xs text-[#334155]">
                {household.data_quality_warnings[0]?.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('S14')}
            className="px-3.5 py-2 rounded-[10px] bg-[#BA1A1A] text-white text-xs font-inter font-semibold whitespace-nowrap shrink-0 focus-ring"
          >
            Go to verification (S14)
          </button>
        </div>
      )}

      {/* Derived Timing Banner */}
      {timingBannerText && (
        <div
          role="status"
          className="surface-solid rounded-[16px] p-4 border-l-4 border-l-[#06B6D4] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#0E7490]">schedule</span>
            <p className="text-sm font-semibold text-[#0F172A]">{timingBannerText}</p>
          </div>
          <EvidenceChip state="DERIVED" customLabel="ƒ Derived timing gap" size="sm" />
        </div>
      )}

      {/* Four Solid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onSelectTab('S08')}
          className="surface-solid rounded-[20px] p-5 text-left hover:border-[#5558E8] transition-colors focus-ring flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider text-[#475569]">
              Loans
            </span>
            <span className="material-symbols-outlined text-[#4648D4]">credit_score</span>
          </div>
          {activeLoan ? (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-bold text-[#0F172A]">
                {household.loans.filter((l) => l.loan_status === 'ACTIVE').length} active loan ·{' '}
                {activeLoan.originating_institution_name}
              </p>
              <p className="text-xs font-inter text-[#334155] tabular-nums">
                Next instalment{' '}
                {activeLoan.next_due_date
                  ? formatDateDisplay(activeLoan.next_due_date)
                  : '— extract out of date'}{' '}
                · {formatINR(activeLoan.scheduled_installment_amount)}
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <EvidenceChip state="MISSING" customLabel="No loan account on record" size="sm" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('S09')}
          className="surface-solid rounded-[20px] p-5 text-left hover:border-[#5558E8] transition-colors focus-ring flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider text-[#475569]">
              SHG Savings
            </span>
            <span className="material-symbols-outlined text-[#4648D4]">savings</span>
          </div>
          {latestShg ? (
            <div className="mt-3 space-y-1.5">
              <p className="text-sm font-bold text-[#0F172A] font-inter tabular-nums">
                {formatINR(latestShg.savings_balance)} latest balance
              </p>
              <p className="text-xs text-[#334155]">
                Period ending {formatDateDisplay(latestShg.record_period_end_date)} ·{' '}
                {latestShg.shg_bank_linkage_status === 'LINKED'
                  ? 'Bank-linked'
                  : latestShg.shg_bank_linkage_status === 'UNLINKED'
                  ? 'Unlinked'
                  : 'Linkage unknown'}
              </p>
              {daysBetween(latestShg.source_record_updated_at, '2026-10-17') > 90 && (
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <EvidenceChip state="STALE" customLabel="Older than 90 days" size="sm" />
                  <span className="font-inter text-[11px] text-[#8A5A00] font-semibold">
                    Updated {daysBetween(latestShg.source_record_updated_at, '2026-10-17')} days ago (
                    {formatDateDisplay(latestShg.source_record_updated_at)})
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              <EvidenceChip state="MISSING" customLabel="Missing — not on file" size="sm" />
              <p className="text-xs text-[#334155]">
                No SHG savings record is on file for this household.
              </p>
              <span className="text-[11px] font-inter font-semibold text-[#4648D4] block">
                Open Savings &amp; Check-ins (S09) →
              </span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('S07')}
          className="surface-solid rounded-[20px] p-5 text-left hover:border-[#5558E8] transition-colors focus-ring flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider text-[#475569]">
              Seasonal context
            </span>
            <span className="material-symbols-outlined text-[#0E7490]">wb_sunny</span>
          </div>
          {household.seasonal_records[0] ? (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-bold text-[#0F172A]">
                {household.seasonal_records[0].season_label === 'LEAN'
                  ? 'Lean season'
                  : 'Liquid season'}{' '}
                ·{' '}
                {household.seasonal_records[0].remittance_status === 'CONFIRMED'
                  ? 'Confirmed remittance'
                  : household.seasonal_records[0].remittance_status === 'DELAYED'
                  ? 'Delayed remittance'
                  : 'Expected remittance'}
              </p>
              <p className="text-xs font-inter text-[#334155] tabular-nums">
                {formatINR(household.seasonal_records[0].expected_remittance_amount)} on{' '}
                {formatDateDisplay(household.seasonal_records[0].expected_remittance_date)} ·{' '}
                {household.seasonal_records[0].remittance_status === 'CONFIRMED'
                  ? 'Confirmed'
                  : 'Not received'}
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <EvidenceChip state="MISSING" customLabel="No seasonal information recorded" size="sm" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('S09')}
          className="surface-solid rounded-[20px] p-5 text-left hover:border-[#5558E8] transition-colors focus-ring flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider text-[#475569]">
              Latest check-in
            </span>
            <span className="material-symbols-outlined text-[#4648D4]">fact_check</span>
          </div>
          {latestCheckin ? (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-bold text-[#0F172A]">
                {formatDateDisplay(latestCheckin.checkin_date)}
              </p>
              <p className="text-xs text-[#334155]">
                {latestCheckin.answered_count} of {latestCheckin.total_questions} questions answered
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <EvidenceChip state="MISSING" customLabel="No check-in recorded" size="sm" />
            </div>
          )}
        </button>
      </div>

      {/* Two-Column Body: Left (7) What SANKET can say + Evidence; Right (5) Warnings + Missing Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Panel: Suggestion status / What SANKET can say today (Card 6, FO-INT-089) */}
          <div className="surface-solid rounded-[24px] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#0F172A]">Suggestion status</h2>
              <EvidenceChip
                state={
                  isConflict
                    ? 'CONFLICT'
                    : isLowCompleteness
                    ? 'MISSING'
                    : 'NOT_CONFIGURED'
                }
                customLabel={
                  mapStatusToOfficerLabel(
                    household.recommendation_status,
                    household.reason_codes
                  ).label
                }
              />
            </div>
            <p className="text-sm text-[#334155] leading-relaxed">
              {isConflict
                ? 'Conflicting source values are on file for this household. No action can be suggested until an officer verifies the conflicting records on S14.'
                : isLowCompleteness
                ? 'Data completeness is low and fewer than three evidence items are on file. A field visit is recommended before any suggestion can be made.'
                : 'Decision rules are not yet configured and fewer than three evidence items are on file. Review the available evidence and record a human decision.'}
            </p>
            <div className="pt-1 flex items-center justify-between text-xs font-inter border-t border-slate-100">
              <span className="text-[#475569]">
                Human review:{' '}
                <strong className="text-[#0F172A]">
                  {household.human_review.review_status === 'REVIEWED'
                    ? `Reviewed (${mapDecisionToLabel(household.human_review.officer_decision)})`
                    : 'Pending human review'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => onNavigate('S10_DETAIL')}
                className="font-semibold text-[#4648D4] hover:underline focus-ring rounded"
              >
                Open Recommendation Review (S10) →
              </button>
            </div>
          </div>

          {/* Panel: Evidence available */}
          <div className="surface-solid rounded-[24px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A]">Evidence available</h2>
              <span className="font-inter text-xs text-[#475569]">
                {household.evidence.length} signals
              </span>
            </div>

            {household.evidence.length === 0 ? (
              <div className="p-4 rounded-[12px] bg-slate-50 border border-dashed border-slate-300 text-xs text-[#475569]">
                No evidence signals recorded for this household yet.
              </div>
            ) : (
              <div className="space-y-3">
                {household.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-[14px] bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#475569]">{ev.signal_name}</p>
                      <p className="text-sm font-bold text-[#0F172A]">{ev.observed_value}</p>
                      <p className="font-inter text-[11px] text-[#475569]">
                        Source: <span className="font-semibold">{ev.source_dataset}</span> (
                        {ev.source_reference}) · Observed {ev.observation_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <EvidenceChip state={ev.state} size="sm" />
                      <button
                        type="button"
                        onClick={() => onSelectTab('S05_DATA')}
                        aria-label={`Inspect source for ${ev.signal_name}`}
                        className="px-2.5 py-1 rounded-[8px] bg-white border border-slate-300 text-xs font-inter font-medium text-[#334155] hover:text-[#0F172A]"
                      >
                        Source
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-[#475569] pt-1 border-t border-slate-100">
              Descriptive observations only. They are not scores.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Panel: Data warnings */}
          <div className="surface-solid rounded-[24px] p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Data warnings</h2>
            {household.data_quality_warnings.length === 0 ? (
              <p className="text-xs text-[#475569]">No data warnings for this household.</p>
            ) : (
              <div className="space-y-3">
                {household.data_quality_warnings.map((w) => (
                  <div
                    key={w.id}
                    className={`p-4 rounded-[14px] border space-y-2 ${
                      w.state === 'CONFLICT'
                        ? 'bg-[#FFDAD6]/40 border-[#BA1A1A]/40'
                        : 'bg-[#D99A36]/12 border-[#D99A36]/45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <EvidenceChip state={w.state} customLabel={w.warning_type} size="sm" />
                      <CopyableId id={w.affected_record_reference} onCopy={onCopyId} />
                    </div>
                    <p className="text-xs text-[#0F172A] leading-relaxed">{w.description}</p>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate(
                          w.state === 'CONFLICT' ? 'S14' : 'S13',
                          household.household_id
                        )
                      }
                      className="text-xs font-inter font-semibold text-[#4648D4] hover:underline"
                    >
                      {w.state === 'CONFLICT'
                        ? 'Verify on Conflicts & Verification (S14) →'
                        : 'Verify on Conflicts & Verification (S14) / Inspect provenance (S13) →'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel: Missing information */}
          <div className="surface-solid rounded-[24px] p-6 space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">Missing information</h2>
            {household.missing_data_flags.length === 0 ? (
              <p className="text-sm text-[#334155]">
                Nothing missing for the fields SANKET reads.
              </p>
            ) : (
              <ul className="space-y-2">
                {household.missing_data_flags.map((flag, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-[12px] bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between gap-2 text-xs text-[#334155]"
                  >
                    <span>{flag}</span>
                    <EvidenceChip state="MISSING" size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const S06FinancialHealth: React.FC<ProfileTabCommonProps> = ({
  household,
  onSelectTab,
}) => {
  const [simulateFx04, setSimulateFx04] = useState(false);

  const fx04Validation = simulateFx04
    ? validateHouseholdProfileContract(TEST_FIXTURES['FX-04'].payload)
    : null;

  const activeLoan = household.loans[0];
  const latestShg = household.shg_records[household.shg_records.length - 1];
  const primarySeasonal = household.seasonal_records[0];
  const latestCheckin = household.checkin_sessions[0];

  const dimensions: {
    name: 'Spend' | 'Save' | 'Borrow' | 'Plan';
    subtitle: string;
    indicators: [string, string];
    observedEvidence: string;
    linkTab: ScreenId;
    linkLabel: string;
  }[] = [
    {
      name: 'Spend',
      subtitle: 'Day-to-day cash management signals',
      indicators: ['IND_01', 'IND_02'],
      observedEvidence: latestCheckin
        ? 'Check-in Q2 (Food & essential expenses): Covered with difficulty. Check-in Q3 (Unexpected medical/travel expense): None reported.'
        : 'No check-in session recorded yet for Spend observations.',
      linkTab: 'S09',
      linkLabel: 'Open Check-ins on S09 →',
    },
    {
      name: 'Save',
      subtitle: 'SHG savings trajectory',
      indicators: ['IND_03', 'IND_04'],
      observedEvidence: latestShg
        ? `SHG Maa Tarini Mahila SHG: latest balance ${formatINR(
            latestShg.savings_balance
          )} (period ending ${formatDateDisplay(
            latestShg.record_period_end_date
          )}), 6 consecutive monthly contributions of ${formatINR(
            latestShg.contribution_amount
          )}, attendance ${Math.round(
            latestShg.meeting_attendance_rate * 100
          )}%, bank-linked.`
        : 'No SHG savings record is on file for this household.',
      linkTab: 'S09',
      linkLabel: 'Open SHG Savings on S09 →',
    },
    {
      name: 'Borrow',
      subtitle: 'Debt-service coverage and concentration of borrowing',
      indicators: ['IND_05', 'IND_06'],
      observedEvidence: activeLoan
        ? `${household.loans.filter((l) => l.loan_status === 'ACTIVE').length} active loan (${
            activeLoan.loan_account_id
          }, ${activeLoan.originating_institution_name}): principal ${formatINR(
            activeLoan.principal_amount
          )}, outstanding ${formatINR(
            activeLoan.outstanding_balance
          )}, scheduled instalment ${formatINR(
            activeLoan.scheduled_installment_amount
          )} due ${
            activeLoan.next_due_date ? formatDateDisplay(activeLoan.next_due_date) : '—'
          }, 8 of 12 instalments paid on time.`
        : 'No loan account is on record for this household.',
      linkTab: 'S08',
      linkLabel: 'Open Loans & Repayments on S08 →',
    },
    {
      name: 'Plan',
      subtitle: 'Evidence of forward financial behaviour',
      indicators: ['IND_07', 'IND_08'],
      observedEvidence: primarySeasonal
        ? `Expected remittance ${
            primarySeasonal.expected_remittance_amount
              ? formatINR(primarySeasonal.expected_remittance_amount)
              : '—'
          } on ${formatDateDisplay(
            primarySeasonal.expected_remittance_date
          )} (household-reported, unverified). Check-in Q4 (Plan for next instalment): Waiting for remittance in early November.`
        : 'No seasonal remittance expectation or forward planning check-in recorded.',
      linkTab: 'S07',
      linkLabel: 'Open Seasonal Cash Flow on S07 →',
    },
  ];

  const indicatorRows = [
    {
      code: 'IND_01',
      dimension: 'Spend',
      evidence: latestCheckin
        ? 'Check-in Q2: Covered with difficulty'
        : 'No check-in recorded',
      source: 'household_checkins (provisional)',
    },
    {
      code: 'IND_02',
      dimension: 'Spend',
      evidence: latestCheckin
        ? 'Check-in Q3: None reported'
        : 'No check-in recorded',
      source: 'household_checkins (provisional)',
    },
    {
      code: 'IND_03',
      dimension: 'Save',
      evidence: latestShg
        ? `SHG balance ${formatINR(latestShg.savings_balance)}; ${formatINR(
            latestShg.contribution_amount
          )} × 6 months`
        : 'No SHG record on file',
      source: 'shg_savings_records',
    },
    {
      code: 'IND_04',
      dimension: 'Save',
      evidence: latestShg
        ? `Attendance ${Math.round(
            latestShg.meeting_attendance_rate * 100
          )}%; bank-linked`
        : 'No SHG record on file',
      source: 'shg_savings_records',
    },
    {
      code: 'IND_05',
      dimension: 'Borrow',
      evidence: activeLoan
        ? `Outstanding ${formatINR(activeLoan.outstanding_balance)}; instalment ${formatINR(
            activeLoan.scheduled_installment_amount
          )}`
        : 'No loan account on record',
      source: 'mfi_loan_accounts',
    },
    {
      code: 'IND_06',
      dimension: 'Borrow',
      evidence: activeLoan?.repayments.length
        ? '8 of 12 paid on time; 0 late'
        : 'No repayment history rows recorded',
      source: 'repayment_history',
    },
    {
      code: 'IND_07',
      dimension: 'Plan',
      evidence: primarySeasonal?.expected_remittance_date
        ? `Expected remittance ${formatINR(
            primarySeasonal.expected_remittance_amount
          )} on ${formatDateDisplay(primarySeasonal.expected_remittance_date)}`
        : 'No expected remittance recorded',
      source: 'seasonal_context (unverified)',
    },
    {
      code: 'IND_08',
      dimension: 'Plan',
      evidence: latestCheckin
        ? 'Check-in Q4: Waiting for remittance'
        : 'No check-in recorded',
      source: 'household_checkins (provisional)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top-of-Tab Notice (FO-INT-103) */}
      <div className="surface-solid rounded-[16px] p-4 border-l-4 border-l-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[#334155] mt-0.5">lock</span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#0F172A]">
              Dimension scores (Spend, Save, Borrow, Plan) and the eight underlying indicators (IND_01 to IND_08) are not yet configured. Observed evidence from the seven datasets is shown below each dimension.
            </p>
            <p className="text-xs text-[#475569]">
              No composite score is shown. SANKET does not combine the four dimensions into a single household score (Decision D6).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSimulateFx04((v) => !v)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-inter font-bold shrink-0 border transition-colors ${
            simulateFx04
              ? 'bg-[#BA1A1A] text-white border-[#BA1A1A]'
              : 'bg-slate-100 text-[#334155] border-slate-300 hover:bg-slate-200'
          }`}
        >
          {simulateFx04 ? 'Clear FX-04 Check' : 'Test FX-04 (composite_score guard)'}
        </button>
      </div>

      {/* FX-04 Contract Validator Rejection Banner (FO-TC-451) */}
      {simulateFx04 && fx04Validation && !fx04Validation.valid && (
        <div
          role="alert"
          className="surface-solid rounded-[18px] p-4 border-2 border-[#BA1A1A] bg-[#FFDAD6]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <EvidenceChip
                state="CONFLICT"
                customLabel="This record failed a data check"
                size="sm"
              />
              <span className="font-inter text-xs font-bold text-[#93000A]">
                FX-04 · ContractValidator rejected payload
              </span>
            </div>
            <p className="text-xs font-inter text-[#0F172A]">
              {fx04Validation.OfficerBanner}:{' '}
              <strong>{fx04Validation.errors.join(' ')}</strong> No composite score is rendered.
            </p>
          </div>
        </div>
      )}

      {/* 2x2 Grid of Dimension Cards (FO-INT-104..107, AC-S06-1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {dimensions.map((d) => (
          <section
            key={d.name}
            aria-label={`${d.name} dimension`}
            className="surface-solid rounded-[24px] p-6 border-2 border-dashed border-slate-300 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    {d.name} ·{' '}
                    <span className="font-medium text-sm text-[#475569]">{d.subtitle}</span>
                  </h2>
                </div>
                <EvidenceChip state="NOT_CONFIGURED" customLabel="Score not configured" size="sm" />
              </div>

              <div className="flex items-baseline gap-3 py-1">
                <span
                  aria-label="No value; not yet configured"
                  className="text-4xl font-extrabold font-inter text-slate-400"
                >
                  —
                </span>
                <span className="font-inter text-xs font-semibold text-[#475569]">
                  Scoring formula pending (Q-01)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {d.indicators.map((ind) => (
                  <span
                    key={ind}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-slate-100 border border-dashed border-slate-300 font-inter text-xs font-semibold text-[#334155]"
                  >
                    <span>{ind}</span>
                    <span className="text-slate-400">·</span>
                    <span>NOT_CONFIGURED</span>
                  </span>
                ))}
              </div>

              <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Observed evidence available today
                </p>
                <p className="text-xs text-[#0F172A] leading-relaxed">{d.observedEvidence}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-inter">
              <span className="text-[#475569]">Calculation status: Not configured</span>
              <button
                type="button"
                onClick={() => onSelectTab(d.linkTab)}
                className="font-semibold text-[#4648D4] hover:underline focus-ring rounded"
              >
                {d.linkLabel}
              </button>
            </div>
          </section>
        ))}
      </div>

      {/* 8-Indicator Table (IND_01 to IND_08) (FO-INT-108, AC-S06-1, FO-TC-450) */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">
              Eight Indicators (IND_01 to IND_08)
            </h3>
            <p className="text-xs text-[#475569]">
              All eight indicator slots are shown with NOT_CONFIGURED status alongside observed source evidence available today.
            </p>
          </div>
          <EvidenceChip
            state="NOT_CONFIGURED"
            customLabel="Not configured (formula pending)"
            size="sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-inter text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[#475569]">
                <th scope="col" className="py-2.5 px-3">Code</th>
                <th scope="col" className="py-2.5 px-3">Dimension</th>
                <th scope="col" className="py-2.5 px-3">Status</th>
                <th scope="col" className="py-2.5 px-3">Observed evidence available today</th>
                <th scope="col" className="py-2.5 px-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {indicatorRows.map((row) => (
                <tr key={row.code} className="hover:bg-slate-50">
                  <th scope="row" className="py-3 px-3 font-bold text-[#0F172A]">
                    {row.code}
                  </th>
                  <td className="py-3 px-3 font-semibold text-[#334155]">{row.dimension}</td>
                  <td className="py-3 px-3">
                    <EvidenceChip
                      state="NOT_CONFIGURED"
                      customLabel="Not configured (formula pending)"
                      size="sm"
                    />
                  </td>
                  <td className="py-3 px-3 text-[#0F172A]">{row.evidence}</td>
                  <td className="py-3 px-3 text-[#475569]">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seasonal Context Card (FO-INT-109, AC-S06-2) */}
      <section
        aria-label="Seasonal Context Score"
        className="surface-solid rounded-[24px] p-6 border-2 border-dashed border-slate-300 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Seasonal Context Score ·{' '}
              <span className="text-sm font-medium text-[#475569]">
                Separate seasonal classification and numeric score slot (Decision D6)
              </span>
            </h2>
          </div>
          <EvidenceChip
            state="NOT_CONFIGURED"
            customLabel="Numeric score: Not configured"
            size="sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-inter text-xs">
          <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200">
            <span className="text-[#475569] block">Classification</span>
            <span className="text-sm font-bold text-[#0F172A] mt-1 block">
              {primarySeasonal?.season_label === 'LEAN' ? 'LEAN_PRESSURE' : 'NOT_CLASSIFIED'}
            </span>
          </div>
          <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200">
            <span className="text-[#475569] block">Numeric score</span>
            <span className="text-sm font-bold text-[#334155] mt-1 block">
              Not configured (formula pending, Q-13)
            </span>
          </div>
          <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200">
            <span className="text-[#475569] block">Confidence</span>
            <span className="text-sm font-bold text-[#8A5A00] mt-1 block">
              Low (expected remittance is household-reported and unverified)
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="font-inter text-xs font-bold text-[#334155]">Supporting evidence:</p>
          <ul className="list-disc pl-5 text-xs text-[#0F172A] space-y-1">
            <li>
              {primarySeasonal
                ? `Active ${primarySeasonal.season_label} season window (${formatDateDisplay(
                    primarySeasonal.observation_period_start_date
                  )}–${formatDateDisplay(primarySeasonal.observation_period_end_date)})`
                : 'No seasonal window recorded'}
            </li>
            <li>
              {primarySeasonal?.expected_remittance_date
                ? `Expected remittance ${formatINR(
                    primarySeasonal.expected_remittance_amount
                  )} on ${formatDateDisplay(primarySeasonal.expected_remittance_date)} (${
                    primarySeasonal.remittance_status
                  })`
                : 'No expected remittance on file'}
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export const S07SeasonalCashFlow: React.FC<
  ProfileTabCommonProps & { onOpenWhatIf: () => void }
> = ({ household, onSelectTab, onOpenWhatIf }) => {
  const [rangeMode, setRangeMode] = useState<'TERM' | '90D'>('TERM');
  const [viewAsTable, setViewAsTable] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<'EXPECTED' | 'CONFIRMED' | 'INSTALMENT'>(
    'EXPECTED'
  );

  const activeLoan = household.loans[0];
  const expectedRemit =
    household.seasonal_records.find((r) => r.remittance_status === 'EXPECTED' || r.remittance_status === 'DELAYED') ||
    household.seasonal_records[0];

  const allSeasonalRows = [...household.seasonal_records, ...CORRIDOR_SEASONAL_RECORDS];

  const MONTHS_AXIS = [
    { label: 'Feb 26', m: '2026-02', shg: false, hhLean: false, corrSeason: null },
    { label: 'Mar 26', m: '2026-03', shg: false, hhLean: false, hhLiquid: true, corrSeason: 'LIQUID' },
    { label: 'Apr 26', m: '2026-04', shg: true, hhLean: false, corrSeason: 'LIQUID' },
    { label: 'May 26', m: '2026-05', shg: true, hhLean: false, corrSeason: null },
    { label: 'Jun 26', m: '2026-06', shg: true, hhLean: false, corrSeason: 'LEAN' },
    { label: 'Jul 26', m: '2026-07', shg: true, hhLean: true, corrSeason: 'LEAN' },
    { label: 'Aug 26', m: '2026-08', shg: true, hhLean: true, corrSeason: 'LEAN' },
    { label: 'Sep 26', m: '2026-09', shg: true, hhLean: true, corrSeason: 'LEAN' },
    { label: 'Oct 26', m: '2026-10', shg: false, hhLean: true, corrSeason: 'LIQUID (low conf.)', isRef: true },
    { label: 'Nov 26', m: '2026-11', shg: false, hhLean: false, corrSeason: 'LIQUID (low conf.)', hasExpected: true },
    { label: 'Dec 26', m: '2026-12', shg: false, hhLean: false, corrSeason: 'LIQUID' },
    { label: 'Jan 27', m: '2027-01', shg: false, hhLean: false, corrSeason: 'LIQUID' },
  ];

  const visibleMonths = rangeMode === '90D' ? MONTHS_AXIS.slice(7, 11) : MONTHS_AXIS;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Seasonal Cash Flow</h2>
          <p className="text-sm text-[#475569]">
            When money is due and when money is expected, by source and status.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenWhatIf}
            className="btn-primary-gradient px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold focus-ring"
          >
            Explore a deferral
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('S05_DATA')}
            className="glass-1 px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold text-[#0F172A] hover:bg-white focus-ring"
          >
            View source records
          </button>
        </div>
      </div>

      {/* Three Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[20px] p-5 bg-[#EEF2FF] border border-[#6366F1]/30">
          <p className="font-inter text-xs font-semibold uppercase tracking-wider text-[#4648D4]">
            Next instalment
          </p>
          <p className="text-xl font-bold font-inter text-[#0F172A] mt-1 tabular-nums">
            {activeLoan?.next_due_date ? formatDateDisplay(activeLoan.next_due_date) : '—'} ·{' '}
            {activeLoan ? formatINR(activeLoan.scheduled_installment_amount) : 'None'}
          </p>
          <p className="text-xs text-[#334155] mt-1">Observed from active loan schedule</p>
        </div>

        <div className="rounded-[20px] p-5 bg-[#ECFEFF] border border-dashed border-[#06B6D4]">
          <p className="font-inter text-xs font-semibold uppercase tracking-wider text-[#0E7490]">
            Expected remittance
          </p>
          <p className="text-xl font-bold font-inter text-[#0F172A] mt-1 tabular-nums">
            {expectedRemit?.expected_remittance_date
              ? `${formatDateDisplay(expectedRemit.expected_remittance_date)} · ${formatINR(
                  expectedRemit.expected_remittance_amount
                )}`
              : 'Not recorded'}
          </p>
          <p className="text-xs text-[#0E7490] mt-1 font-semibold">Expected, not received</p>
        </div>

        <div className="rounded-[20px] p-5 bg-[#F5F3FF] border border-[#8B5CF6]/35">
          <p className="font-inter text-xs font-semibold uppercase tracking-wider text-[#6D28D9]">
            ƒ Derived · Timing note
          </p>
          <p className="text-base font-bold text-[#0F172A] mt-1">
            {computeTimingGapNote(
              activeLoan?.next_due_date,
              expectedRemit?.expected_remittance_date
            ) || 'No timing gap derived for this household'}
          </p>
          <p className="text-xs text-[#475569] mt-1">
            Date difference only (28 Oct vs 5 Nov 2026)
          </p>
        </div>
      </div>

      {/* Main Solid Timeline Panel */}
      <div className="surface-solid rounded-[24px] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">
              Instalments, remittances and SHG contributions
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              Between February 2026 and January 2027 this household has 12 scheduled instalments of ₹4,170.00, 8 recorded paid and 4 pending. One remittance of ₹24,000.00 was confirmed on 14 Mar 2026. One remittance of ₹35,000.00 is expected on 5 Nov 2026.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setRangeMode('TERM')}
                className={`px-3 py-1 rounded-full text-xs font-inter font-semibold ${
                  rangeMode === 'TERM' ? 'btn-primary-gradient text-white' : 'text-[#475569]'
                }`}
              >
                Loan term
              </button>
              <button
                type="button"
                onClick={() => setRangeMode('90D')}
                className={`px-3 py-1 rounded-full text-xs font-inter font-semibold ${
                  rangeMode === '90D' ? 'btn-primary-gradient text-white' : 'text-[#475569]'
                }`}
              >
                Next 90 days
              </button>
            </div>
            <button
              type="button"
              onClick={() => setViewAsTable(!viewAsTable)}
              className="px-3 py-1.5 rounded-[10px] bg-white border border-slate-300 text-xs font-inter font-medium text-[#0F172A]"
            >
              {viewAsTable ? 'View as chart' : 'View as table'}
            </button>
          </div>
        </div>

        {household.seasonal_records.length === 0 ? (
          <div className="p-6 rounded-[16px] bg-slate-50 border border-dashed border-slate-300 text-sm text-[#334155]">
            No seasonal information is recorded for this household. Instalments are shown without season windows.
          </div>
        ) : viewAsTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#475569]">
                  <th scope="col" className="py-2.5 px-3">Month</th>
                  <th scope="col" className="py-2.5 px-3">Household Season</th>
                  <th scope="col" className="py-2.5 px-3">Corridor Profile (GANJAM-SURAT)</th>
                  <th scope="col" className="py-2.5 px-3">Instalment (28th)</th>
                  <th scope="col" className="py-2.5 px-3">Remittance / SHG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleMonths.map((item, idx) => (
                  <tr key={item.m}>
                    <td className="py-2.5 px-3 font-semibold">{item.label}</td>
                    <td className="py-2.5 px-3">
                      {item.hhLean ? 'LEAN (1 Jul–31 Oct)' : item.hhLiquid ? 'LIQUID (Mar)' : '—'}
                    </td>
                    <td className="py-2.5 px-3">{item.corrSeason || '—'}</td>
                    <td className="py-2.5 px-3 tabular-nums">
                      ₹4,170.00 ({idx < 8 ? 'Paid on time' : 'Pending'})
                    </td>
                    <td className="py-2.5 px-3">
                      {item.m === '2026-03' && 'Confirmed remittance ₹24,000.00 (14 Mar) '}
                      {item.m === '2026-11' && 'Expected, not received ₹35,000.00 (5 Nov) '}
                      {item.shg && 'SHG ₹350.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Two Season Lanes: Household observation vs Corridor profile */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 items-center gap-2 text-xs font-inter">
                <div className="col-span-12 sm:col-span-3 font-semibold text-[#334155]">
                  Household observation
                </div>
                <div className="col-span-12 sm:col-span-9 grid grid-cols-12 gap-1">
                  {visibleMonths.map((m) => (
                    <div
                      key={m.m}
                      className={`col-span-1 h-7 rounded px-1 flex items-center justify-center text-[10px] font-semibold ${
                        m.hhLean
                          ? 'bg-indigo-100/90 text-[#334155] border border-indigo-200'
                          : m.hhLiquid
                          ? 'bg-cyan-100/80 text-[#0E7490] border border-cyan-200'
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      {m.hhLean ? 'LEAN' : m.hhLiquid ? 'LIQ' : ''}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-12 items-center gap-2 text-xs font-inter">
                <div className="col-span-12 sm:col-span-3 font-semibold text-[#475569]">
                  Corridor profile (public data)
                </div>
                <div className="col-span-12 sm:col-span-9 grid grid-cols-12 gap-1">
                  {visibleMonths.map((m) => (
                    <div
                      key={m.m}
                      className={`col-span-1 h-7 rounded px-1 flex items-center justify-center text-[10px] font-medium ${
                        m.corrSeason?.startsWith('LEAN')
                          ? 'bg-slate-200/80 text-[#334155]'
                          : m.corrSeason?.startsWith('LIQUID')
                          ? 'bg-cyan-50 text-[#0E7490] border border-dashed border-cyan-300'
                          : 'bg-slate-50 text-slate-400'
                      }`}
                      title={m.corrSeason || 'No corridor window'}
                    >
                      {m.corrSeason?.startsWith('LEAN')
                        ? 'LEAN'
                        : m.corrSeason?.includes('low')
                        ? 'LIQ*'
                        : m.corrSeason
                        ? 'LIQ'
                        : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Obligations, Remittance, and SHG Track */}
            <div className="grid grid-cols-12 items-center gap-2 pt-2 border-t border-slate-200">
              <div className="col-span-12 sm:col-span-3 space-y-1 text-xs font-inter">
                <p className="font-bold text-[#0F172A]">Instalments &amp; Remittances</p>
                <p className="text-[11px] text-[#475569]">No cash-balance line is drawn</p>
              </div>
              <div className="col-span-12 sm:col-span-9 grid grid-cols-12 gap-1">
                {visibleMonths.map((m) => {
                  const isPaid = m.m < '2026-10';
                  return (
                    <div
                      key={m.m}
                      className={`col-span-1 p-1.5 rounded-[10px] border flex flex-col items-center justify-between min-h-[104px] relative ${
                        m.isRef ? 'bg-indigo-50/60 border-[#5558E8]' : 'bg-slate-50/70 border-slate-200/80'
                      }`}
                    >
                      <span className="font-inter text-[10px] font-bold text-[#334155]">
                        {m.label}
                      </span>

                      {m.isRef && (
                        <span className="text-[9px] font-inter font-bold text-[#4648D4] bg-white px-1 rounded border border-[#5558E8]/30">
                          Ref 17 Oct
                        </span>
                      )}

                      {/* Instalment Marker */}
                      <button
                        type="button"
                        onClick={() => setSelectedMarker('INSTALMENT')}
                        title={`Instalment 28 ${m.label}: ₹4,170.00 (${isPaid ? 'Recorded paid' : 'Pending'})`}
                        className={`w-4 h-4 rounded-full focus-ring ${
                          isPaid
                            ? 'bg-[#5558E8] border-2 border-white shadow-xs'
                            : 'bg-white border-2 border-[#5558E8]'
                        }`}
                      />

                      {/* Confirmed or Expected Remittance Diamond */}
                      {m.m === '2026-03' && (
                        <button
                          type="button"
                          onClick={() => setSelectedMarker('CONFIRMED')}
                          title="Confirmed remittance 14 Mar 2026: ₹24,000.00"
                          className="w-4 h-4 rotate-45 bg-[#06B6D4] border border-white shadow-xs focus-ring"
                        />
                      )}
                      {m.m === '2026-11' && (
                        <button
                          type="button"
                          onClick={() => setSelectedMarker('EXPECTED')}
                          title="Expected, not received · 5 Nov 2026 · ₹35,000.00"
                          className="w-4 h-4 rotate-45 bg-white border-2 border-dashed border-[#06B6D4] focus-ring"
                        />
                      )}

                      {/* SHG Bar */}
                      <div className="w-full flex flex-col items-center">
                        {m.shg ? (
                          <div
                            className="w-4 h-2.5 bg-slate-400 rounded-t"
                            title="SHG contribution ₹350.00"
                          />
                        ) : (
                          <div className="h-2.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Marker Evidence Popover Card */}
            <div className="p-4 rounded-[14px] bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {selectedMarker === 'EXPECTED' && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <EvidenceChip state="EXPECTED" customLabel="Expected, not received · 5 Nov 2026 · ₹35,000.00" size="sm" />
                      <EvidenceChip state="PROVISIONAL" customLabel="Not yet verified" size="sm" />
                    </div>
                    <p className="text-xs font-inter text-[#334155]">
                      Household reported · Medium confidence · <strong>SANKET-SC-00013</strong> · source updated 20 Sep 2026 · Not yet verified
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab('S05_DATA')}
                    className="text-xs font-inter font-semibold text-[#4648D4] hover:underline whitespace-nowrap"
                  >
                    Open source record →
                  </button>
                </>
              )}
              {selectedMarker === 'CONFIRMED' && (
                <>
                  <div className="space-y-1">
                    <EvidenceChip state="OBSERVED" customLabel="Confirmed · 14 Mar 2026 · ₹24,000.00" size="sm" />
                    <p className="text-xs font-inter text-[#334155]">
                      NGO case file · High confidence · <strong>SANKET-SC-00014</strong> · source updated 20 Mar 2026 · Verified
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab('S05_DATA')}
                    className="text-xs font-inter font-semibold text-[#4648D4] hover:underline whitespace-nowrap"
                  >
                    Open source record →
                  </button>
                </>
              )}
              {selectedMarker === 'INSTALMENT' && (
                <>
                  <div className="space-y-1">
                    <EvidenceChip state="OBSERVED" customLabel="Scheduled instalment · 28th of month · ₹4,170.00" size="sm" />
                    <p className="text-xs font-inter text-[#334155]">
                      Loan account <strong>SANKET-LN-TB6MH9XM</strong> · Synthetic Demo MFI A · 8 recorded paid, 4 pending
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab('S08')}
                    className="text-xs font-inter font-semibold text-[#4648D4] hover:underline whitespace-nowrap"
                  >
                    Open Loans and Repayments (S08) →
                  </button>
                </>
              )}
            </div>

            {/* Legend Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#475569] pt-2 border-t border-slate-100">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#5558E8] inline-block" /> Instalment, recorded paid
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-[#5558E8] bg-white inline-block" /> Instalment, pending
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rotate-45 bg-[#06B6D4] inline-block" /> Remittance confirmed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rotate-45 border-2 border-dashed border-[#06B6D4] bg-white inline-block" /> Remittance expected, not received
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-2.5 bg-slate-400 inline-block" /> SHG contribution
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Seasonal Records Table + How to read this chart card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 surface-solid rounded-[24px] p-5 overflow-x-auto space-y-3">
          <h3 className="text-base font-bold text-[#0F172A]">Seasonal records</h3>
          <table className="w-full text-left border-collapse font-inter text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[#475569]">
                <th scope="col" className="py-2.5 px-2">Record</th>
                <th scope="col" className="py-2.5 px-2">Scope</th>
                <th scope="col" className="py-2.5 px-2">Period</th>
                <th scope="col" className="py-2.5 px-2">Season</th>
                <th scope="col" className="py-2.5 px-2">Remittance</th>
                <th scope="col" className="py-2.5 px-2">Amount</th>
                <th scope="col" className="py-2.5 px-2">Confidence</th>
                <th scope="col" className="py-2.5 px-2">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allSeasonalRows.map((row) => (
                <tr key={row.seasonal_record_id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-2 font-semibold">{row.seasonal_record_id}</td>
                  <td className="py-2.5 px-2">{row.scope}</td>
                  <td className="py-2.5 px-2 tabular-nums">
                    {formatDateDisplay(row.observation_period_start_date)} –{' '}
                    {formatDateDisplay(row.observation_period_end_date)}
                  </td>
                  <td className="py-2.5 px-2 font-semibold">{row.season_label}</td>
                  <td className="py-2.5 px-2">
                    {row.remittance_status === 'EXPECTED' ? (
                      <EvidenceChip state="EXPECTED" size="sm" />
                    ) : row.remittance_status === 'DELAYED' ? (
                      <EvidenceChip state="DELAYED" size="sm" />
                    ) : row.remittance_status === 'CONFIRMED' ? (
                      <EvidenceChip state="OBSERVED" customLabel="Confirmed" size="sm" />
                    ) : (
                      <span className="text-[#475569]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 tabular-nums">
                    {row.expected_remittance_amount
                      ? formatINR(row.expected_remittance_amount)
                      : '—'}
                  </td>
                  <td className="py-2.5 px-2">{row.confidence_level}</td>
                  <td className="py-2.5 px-2 text-[#475569]">{row.source_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-4 surface-solid rounded-[24px] p-5 space-y-3">
          <h3 className="text-base font-bold text-[#0F172A]">How to read this chart</h3>
          <p className="text-xs text-[#334155] leading-relaxed">
            The household lane and the corridor lane can disagree. SANKET shows both and does not merge them.
          </p>
          <p className="text-xs text-[#475569] leading-relaxed">
            For SANKET-HH-000101, the household observation records <strong>LEAN</strong> through 31 Oct 2026 while public corridor data for GANJAM-SURAT lists <strong>LIQUID</strong> from 1 Oct 2026 with low confidence.
          </p>
          <p className="text-xs text-[#475569] leading-relaxed">
            No cumulative cash-balance line or projected income series is drawn because no income or expense series exists in the seven datasets.
          </p>
        </div>
      </div>
    </div>
  );
};

export const S08LoansRepayments: React.FC<
  ProfileTabCommonProps & { onOpenWhatIf: () => void }
> = ({ household, onOpenWhatIf, onCopyId }) => {
  const [selectedLoanIdx, setSelectedLoanIdx] = useState(0);
  const loan = household.loans[selectedLoanIdx] || household.loans[0];

  if (!loan) {
    return (
      <div className="surface-solid rounded-[24px] p-8 text-center space-y-2">
        <EvidenceChip state="MISSING" customLabel="No loan account on record" />
        <p className="text-sm font-bold text-[#0F172A] mt-2">
          No loan account is on record for this household.
        </p>
      </div>
    );
  }

  const paidCount = loan.repayments.filter((r) => r.repayment_status === 'PAID_ON_TIME').length;
  const pendingCount = loan.repayments.filter((r) => r.repayment_status === 'PENDING').length;
  const unknownCount = loan.repayments.filter((r) => r.repayment_status === 'UNKNOWN').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#0F172A]">Loans and Repayments</h2>

        {/* Multi-loan selector */}
        {household.loans.length > 1 && (
          <div className="inline-flex p-1 rounded-full glass-1 gap-1">
            {household.loans.map((l, idx) => (
              <button
                key={l.loan_account_id}
                type="button"
                onClick={() => setSelectedLoanIdx(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-inter font-semibold transition-colors ${
                  selectedLoanIdx === idx
                    ? 'btn-primary-gradient text-white'
                    : 'text-[#334155] hover:bg-white'
                }`}
              >
                {l.loan_account_id} ({l.loan_status === 'ACTIVE' ? 'Active' : 'Closed'})
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Solid Loan Summary Card */}
        <div className="lg:col-span-8 surface-solid rounded-[24px] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                {loan.originating_institution_name} · {loan.loan_product_type}
              </h3>
              <p className="font-inter text-xs text-[#475569] mt-0.5">
                Source {loan.source_system_name} · updated {formatDateDisplay(loan.source_record_updated_at)}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-inter text-xs font-semibold ${
                loan.loan_status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              {loan.loan_status === 'ACTIVE' ? 'Active' : 'Closed'}
            </span>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-inter text-xs">
            <div className="p-3 rounded-[12px] bg-slate-50">
              <dt className="text-[#475569]">Principal</dt>
              <dd className="text-sm font-bold text-[#0F172A] mt-1 tabular-nums">
                {formatINR(loan.principal_amount)}
              </dd>
            </div>
            <div className="p-3 rounded-[12px] bg-slate-50">
              <dt className="text-[#475569]">Outstanding balance</dt>
              <dd className="text-sm font-bold text-[#0F172A] mt-1 tabular-nums">
                {formatINR(loan.outstanding_balance)}
              </dd>
            </div>
            <div className="p-3 rounded-[12px] bg-slate-50">
              <dt className="text-[#475569]">Disbursed</dt>
              <dd className="text-sm font-bold text-[#0F172A] mt-1 tabular-nums">
                {formatDateDisplay(loan.disbursement_date)}
              </dd>
            </div>
            <div className="p-3 rounded-[12px] bg-slate-50">
              <dt className="text-[#475569]">Term</dt>
              <dd className="text-sm font-bold text-[#0F172A] mt-1">
                {loan.loan_term_months} months · {loan.repayment_frequency}
              </dd>
            </div>
            <div className="p-3 rounded-[12px] bg-slate-50">
              <dt className="text-[#475569]">Instalment</dt>
              <dd className="text-sm font-bold text-[#0F172A] mt-1 tabular-nums">
                {formatINR(loan.scheduled_installment_amount)}
              </dd>
            </div>
            <div className="p-3 rounded-[12px] bg-slate-50">
              <dt className="text-[#475569]">Next due</dt>
              <dd className="text-sm font-bold text-[#0F172A] mt-1 tabular-nums">
                {loan.next_due_date ? formatDateDisplay(loan.next_due_date) : '—'}
              </dd>
            </div>
            <div className="p-3 rounded-[12px] bg-slate-50 col-span-2">
              <dt className="text-[#475569]">Loan account</dt>
              <dd className="mt-1">
                <CopyableId id={loan.loan_account_id} onCopy={onCopyId} />
              </dd>
            </div>
          </dl>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[#475569]">
              No credit-limit field exists in any of the seven datasets.
            </span>
            <button
              type="button"
              onClick={onOpenWhatIf}
              className="text-xs font-inter font-semibold text-[#4648D4] hover:underline focus-ring"
            >
              Explore a deferral →
            </button>
          </div>
        </div>

        {/* Recorded History Summary Card */}
        <div className="lg:col-span-4 surface-solid rounded-[24px] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0F172A]">Recorded history</h3>
          <p className="text-sm font-semibold text-[#0F172A] font-inter">
            {loan.repayments.length} scheduled instalments · {paidCount} recorded paid on time ·{' '}
            {pendingCount} pending
            {unknownCount > 0 ? ` · ${unknownCount} outcome unknown` : ''}
          </p>

          {/* Compact strip of 12 markers */}
          {loan.repayments.length > 0 && (
            <div className="space-y-2">
              <div
                aria-label={`${paidCount} paid on time, ${pendingCount} pending`}
                className="flex items-center gap-1.5"
              >
                {loan.repayments.map((r) => (
                  <span
                    key={r.repayment_id}
                    title={`${formatDateDisplay(r.scheduled_due_date)}: ${r.repayment_status}`}
                    className={`w-4 h-4 rounded-full inline-block ${
                      r.repayment_status === 'PAID_ON_TIME'
                        ? 'bg-[#5558E8]'
                        : r.repayment_status === 'UNKNOWN'
                        ? 'hatch-unknown border border-slate-400'
                        : 'border-2 border-[#5558E8] bg-white'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-inter text-[#475569]">
                {paidCount} paid on time, {pendingCount} pending
                {unknownCount > 0 ? `, ${unknownCount} outcome unknown` : ''}
              </p>
            </div>
          )}

          <p className="text-xs text-[#475569] pt-2 border-t border-slate-100">
            Counts of recorded events. They are not a repayment rating.
          </p>
        </div>
      </div>

      {/* Repayment History Table */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <h3 className="text-base font-bold text-[#0F172A]">Repayment schedule and history</h3>
        {loan.repayments.length === 0 ? (
          <div className="p-6 rounded-[16px] bg-slate-50 border border-dashed border-slate-300 space-y-1">
            <EvidenceChip state="MISSING" customLabel="No repayment rows recorded" size="sm" />
            <p className="text-sm font-semibold text-[#0F172A] pt-1">
              No repayment rows recorded. This does not mean no payments were made.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#475569]">
                  <th scope="col" className="py-3 px-3">Due date</th>
                  <th scope="col" className="py-3 px-3">Amount due</th>
                  <th scope="col" className="py-3 px-3">Paid on</th>
                  <th scope="col" className="py-3 px-3">Amount paid</th>
                  <th scope="col" className="py-3 px-3">Status</th>
                  <th scope="col" className="py-3 px-3">Days late</th>
                  <th scope="col" className="py-3 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loan.repayments.map((r) => (
                  <tr key={r.repayment_id} className="hover:bg-slate-50">
                    <th scope="row" className="py-3 px-3 font-semibold text-[#0F172A] tabular-nums">
                      {formatDateDisplay(r.scheduled_due_date)}
                    </th>
                    <td className="py-3 px-3 tabular-nums">{formatINR(r.amount_due)}</td>
                    <td className="py-3 px-3 tabular-nums">
                      {r.actual_payment_date ? formatDateDisplay(r.actual_payment_date) : ''}
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      {r.amount_paid !== null ? formatINR(r.amount_paid) : ''}
                    </td>
                    <td className="py-3 px-3">
                      {r.repayment_status === 'PAID_ON_TIME' ? (
                        <EvidenceChip state="OBSERVED" customLabel="Paid on time" size="sm" />
                      ) : r.repayment_status === 'UNKNOWN' ? (
                        <EvidenceChip state="MISSING" customLabel="Outcome unknown" size="sm" />
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] border border-slate-300 bg-white text-[11px] font-medium text-[#334155]">
                          <span className="material-symbols-outlined !text-[14px]">radio_button_unchecked</span>
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      {r.days_late !== null ? r.days_late : '—'}
                    </td>
                    <td className="py-3 px-3 text-[#475569]">{r.source_system_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const S09SavingsCheckins: React.FC<ProfileTabCommonProps> = ({ household }) => {
  const [subTab, setSubTab] = useState<'SHG' | 'CHECKINS'>('SHG');
  const [viewChartAsTable, setViewChartAsTable] = useState(false);

  const latestShg = household.shg_records[household.shg_records.length - 1];
  const session = household.checkin_sessions[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#0F172A]">Savings and Check-ins</h2>
        <div role="tablist" aria-label="Savings and Check-ins sub-tabs" className="inline-flex p-1 rounded-full glass-1">
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'SHG'}
            onClick={() => setSubTab('SHG')}
            className={`px-4 py-1.5 rounded-full text-xs font-inter font-semibold ${
              subTab === 'SHG' ? 'btn-primary-gradient text-white' : 'text-[#334155]'
            }`}
          >
            SHG savings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'CHECKINS'}
            onClick={() => setSubTab('CHECKINS')}
            className={`px-4 py-1.5 rounded-full text-xs font-inter font-semibold ${
              subTab === 'CHECKINS' ? 'btn-primary-gradient text-white' : 'text-[#334155]'
            }`}
          >
            Check-ins
          </button>
        </div>
      </div>

      {subTab === 'SHG' ? (
        household.shg_records.length === 0 ? (
          <div className="surface-solid rounded-[24px] p-8 border-2 border-dashed border-slate-300 text-center space-y-2">
            <EvidenceChip state="MISSING" customLabel="No SHG record" />
            <p className="text-sm font-bold text-[#0F172A] mt-2">
              No SHG savings record is on file for this household.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="font-inter text-xs font-semibold text-[#4648D4]">
              {latestShg.shg_group_name} · {latestShg.shg_group_id}
            </p>

            {/* Four Stat Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="surface-solid rounded-[20px] p-5">
                <p className="font-inter text-xs text-[#475569]">Latest balance</p>
                <p className="text-2xl font-bold font-inter text-[#0F172A] mt-1 tabular-nums">
                  {formatINR(latestShg.savings_balance)}
                </p>
                <p className="text-xs text-[#475569] mt-1">
                  period ending {formatDateDisplay(latestShg.record_period_end_date)}
                </p>
              </div>
              <div className="surface-solid rounded-[20px] p-5">
                <p className="font-inter text-xs text-[#475569]">Monthly contribution</p>
                <p className="text-2xl font-bold font-inter text-[#0F172A] mt-1 tabular-nums">
                  {formatINR(latestShg.contribution_amount)}
                </p>
                <p className="text-xs text-[#475569] mt-1">Steady across 6 recorded periods</p>
              </div>
              <div className="surface-solid rounded-[20px] p-5">
                <p className="font-inter text-xs text-[#475569]">Latest meeting attendance</p>
                <p className="text-2xl font-bold font-inter text-[#0F172A] mt-1 tabular-nums">
                  {Math.round(latestShg.meeting_attendance_rate * 100)}%
                </p>
                <p className="text-xs text-[#475569] mt-1">Source: SHG Register Export</p>
              </div>
              <div className="surface-solid rounded-[20px] p-5">
                <p className="font-inter text-xs text-[#475569]">Bank linkage</p>
                <p className="text-2xl font-bold font-inter text-[#0F172A] mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#4648D4]">link</span>
                  <span>
                    {latestShg.shg_bank_linkage_status === 'LINKED'
                      ? 'Linked'
                      : latestShg.shg_bank_linkage_status === 'UNLINKED'
                      ? 'Unlinked'
                      : 'Unknown'}
                  </span>
                </p>
                <p className="text-xs text-[#475569] mt-1">
                  {daysBetween(latestShg.source_record_updated_at, '2026-10-17') > 90
                    ? `Updated ${daysBetween(latestShg.source_record_updated_at, '2026-10-17')} days ago (${formatDateDisplay(
                        latestShg.source_record_updated_at
                      )}) · Older than 90 days`
                    : 'Verified group linkage'}
                </p>
              </div>
            </div>

            {/* Contribution Bar Chart + Table */}
            <div className="surface-solid rounded-[24px] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Monthly SHG contributions (Apr–Sep 2026)
                  </h3>
                  <p className="text-xs text-[#475569]">
                    Six monthly contributions of ₹350.00 each, growing savings balance from ₹2,150.00 to ₹3,900.00.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewChartAsTable(!viewChartAsTable)}
                  className="px-3 py-1.5 rounded-[10px] bg-slate-100 text-xs font-inter font-medium text-[#0F172A]"
                >
                  {viewChartAsTable ? 'Show bars' : 'View as table'}
                </button>
              </div>

              {!viewChartAsTable && (
                <div className="grid grid-cols-6 gap-3 pt-2">
                  {household.shg_records.map((r) => (
                    <div
                      key={r.shg_record_id}
                      className="p-3 rounded-[12px] bg-slate-50 border border-slate-200 flex flex-col items-center gap-2"
                    >
                      <div className="w-full h-20 flex items-end justify-center">
                        <div
                          className="w-8 bg-[#5558E8] rounded-t"
                          style={{ height: `${(r.savings_balance / 4000) * 100}%` }}
                          title={`Balance ${formatINR(r.savings_balance)}`}
                        />
                      </div>
                      <span className="font-inter text-xs font-bold text-[#0F172A] tabular-nums">
                        {formatINR(r.contribution_amount)}
                      </span>
                      <span className="font-inter text-[11px] text-[#475569]">
                        {formatDateDisplay(r.record_period_end_date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse font-inter text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#475569]">
                      <th scope="col" className="py-2.5 px-3">Period</th>
                      <th scope="col" className="py-2.5 px-3">Balance</th>
                      <th scope="col" className="py-2.5 px-3">Contribution</th>
                      <th scope="col" className="py-2.5 px-3">Withdrawal</th>
                      <th scope="col" className="py-2.5 px-3">Attendance</th>
                      <th scope="col" className="py-2.5 px-3">Linkage</th>
                      <th scope="col" className="py-2.5 px-3">Source</th>
                      <th scope="col" className="py-2.5 px-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {household.shg_records.map((r) => (
                      <tr key={r.shg_record_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold tabular-nums">
                          {formatDateDisplay(r.record_period_end_date)}
                        </td>
                        <td className="py-2.5 px-3 font-bold tabular-nums">
                          {formatINR(r.savings_balance)}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums">
                          {formatINR(r.contribution_amount)}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums">
                          {formatINR(r.withdrawal_amount)}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums">
                          {Math.round(r.meeting_attendance_rate * 100)}%
                        </td>
                        <td className="py-2.5 px-3">Linked</td>
                        <td className="py-2.5 px-3 text-[#475569]">{r.source_system_name}</td>
                        <td className="py-2.5 px-3 tabular-nums">
                          {formatDateDisplay(r.source_record_updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-5">
          {/* Amber-edged Instrument Banner */}
          <div className="surface-solid rounded-[16px] p-4 border-l-4 border-l-[#D99A36] bg-[#D99A36]/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#8A5A00]">science</span>
              <p className="text-xs font-semibold text-[#8A5A00]">
                Demonstration instrument DEMO-PROVISIONAL-v0.1. Questions and categories are provisional until the project team confirms the instrument.
              </p>
            </div>
            <EvidenceChip state="PROVISIONAL" size="sm" />
          </div>

          {!session ? (
            <div className="surface-solid rounded-[24px] p-8 text-center space-y-2">
              <EvidenceChip state="MISSING" customLabel="No check-in recorded" />
              <p className="text-sm font-bold text-[#0F172A] mt-2">
                No check-in has been recorded for this household.
              </p>
            </div>
          ) : (
            <div className="surface-solid rounded-[24px] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] font-inter">
                    Session {session.checkin_session_id} · {formatDateDisplay(session.checkin_date)} · Collected by{' '}
                    {session.collected_by} · {session.answered_count} of {session.total_questions} questions answered
                  </h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Responses are displayed as stored and are never converted into a numeric score or colour grade.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200/80">
                {session.responses.map((q) => (
                  <div
                    key={q.question_code}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#4648D4]">
                        {q.question_category} ({q.question_code})
                      </span>
                      <p className="text-sm text-[#0F172A] font-medium">{q.question_text}</p>
                    </div>
                    <div className="shrink-0">
                      {q.response_value === null ? (
                        <EvidenceChip state="MISSING" customLabel="Not answered" size="sm" />
                      ) : (
                        <span className="px-3 py-1 rounded-[8px] bg-slate-100 border border-slate-300 font-inter text-xs font-bold text-[#0F172A]">
                          {q.response_value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ProfileTab6DataSources: React.FC<{
  household: HouseholdProfile;
  provenanceEntries: ProvenanceEntry[];
  onCopyId: (id: string) => void;
}> = ({ household, provenanceEntries, onCopyId }) => {
  const [jsonMode, setJsonMode] = useState<'LIVE_HOUSEHOLD' | 'SECTION_11_SPEC'>('LIVE_HOUSEHOLD');

  const hhEntries = provenanceEntries.filter((p) => p.household_id === household.household_id);
  const verifiedCount = hhEntries.filter((p) => p.verification_status === 'VERIFIED').length;
  const unverifiedCount = hhEntries.filter((p) => p.verification_status === 'UNVERIFIED').length;
  const conflictCount = hhEntries.filter((p) => p.conflict_status === 'CONFLICT_DETECTED').length;

  const latestShg = household.shg_records[household.shg_records.length - 1];
  const primarySeasonal = household.seasonal_records[0];

  const liveContractJson = {
    contract_version: 'sanket.household_profile.v1',
    household_id: household.household_id,
    profile_context: {
      district_name: household.district_name.toUpperCase(),
      block_name: household.block_name,
      migration_status: household.migration_status,
      fsp_partner_id: household.fsp_partner_id,
      is_synthetic: true,
      record_status: 'ACTIVE',
    },
    loan_summary: household.loans.map((l) => ({
      loan_account_id: l.loan_account_id,
      originating_institution_name: l.originating_institution_name,
      loan_status: l.loan_status,
      outstanding_balance: l.outstanding_balance,
      scheduled_installment_amount: l.scheduled_installment_amount,
      next_due_date: l.next_due_date,
      recent_repayment_status: l.repayments[l.repayments.length - 1]?.repayment_status || 'UNKNOWN',
    })),
    savings_summary: latestShg
      ? {
          shg_group_name: latestShg.shg_group_name,
          latest_savings_balance: latestShg.savings_balance,
          latest_period_end_date: latestShg.record_period_end_date,
          shg_bank_linkage_status: latestShg.shg_bank_linkage_status,
          meeting_attendance_rate: latestShg.meeting_attendance_rate,
        }
      : {
          shg_group_name: null,
          latest_savings_balance: null,
          latest_period_end_date: null,
          shg_bank_linkage_status: 'UNKNOWN',
          meeting_attendance_rate: null,
        },
    seasonal_context: primarySeasonal
      ? {
          season_label: primarySeasonal.season_label,
          remittance_status: primarySeasonal.remittance_status,
          expected_remittance_amount: primarySeasonal.expected_remittance_amount,
          expected_remittance_date: primarySeasonal.expected_remittance_date,
          confidence_level: primarySeasonal.confidence_level,
          source_type: primarySeasonal.source_type,
          migration_corridor_name: primarySeasonal.corridor_name,
        }
      : null,
    indicator_results: ['IND_01', 'IND_02', 'IND_03', 'IND_04', 'IND_05', 'IND_06', 'IND_07', 'IND_08'].map(
      (code, i) => ({
        indicator_code: code,
        dimension: i < 2 ? 'SPEND' : i < 4 ? 'SAVE' : i < 6 ? 'BORROW' : 'PLAN',
        value: null,
        calculation_status: 'NOT_CONFIGURED',
        data_sources_used: [],
      })
    ),
    dimension_scores: {
      spend_score: null,
      save_score: null,
      borrow_score: null,
      plan_score: null,
    },
    seasonal_context_score: {
      value: null,
      classification: primarySeasonal?.season_label === 'LEAN' ? 'LEAN_PRESSURE' : 'NOT_CLASSIFIED',
      supporting_evidence: primarySeasonal
        ? [
            `Active ${primarySeasonal.season_label} season window (${primarySeasonal.observation_period_start_date} to ${primarySeasonal.observation_period_end_date})`,
            primarySeasonal.expected_remittance_date
              ? `Expected remittance ${formatINR(primarySeasonal.expected_remittance_amount)} on ${primarySeasonal.expected_remittance_date}`
              : 'No expected remittance on file',
          ]
        : [],
      confidence_level: 'LOW',
    },
    evidence: household.evidence.map((ev) => ({
      signal_name: ev.signal_name,
      observed_value: ev.observed_value,
      source_reference: ev.source_reference,
      observation_date: ev.observation_date,
      relates_to: ev.relates_to,
    })),
    confidence_band: 'LOW',
    data_completeness_pct: household.data_completeness_pct,
    data_completeness_band: household.data_completeness_band,
    data_quality_warnings: household.data_quality_warnings,
    recommendation: {
      action_code: household.action_code,
      reason_codes: household.reason_codes,
      recommendation_status: household.recommendation_status,
    },
    human_review: {
      review_status: household.human_review.review_status,
      officer_id: household.human_review.officer_id,
      officer_decision: household.human_review.officer_decision,
      override_reason: household.human_review.override_reason,
      reviewed_at: household.human_review.reviewed_at,
      outcome_feedback: null,
    },
    llm_explanation: null,
    generated_at: `${household.profile_last_updated_at}T08:00:00Z`,
  };

  const displayedJson =
    jsonMode === 'LIVE_HOUSEHOLD' ? liveContractJson : SECTION_11_SYNTHETIC_JSON_EXAMPLE;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="surface-solid rounded-[18px] p-4">
          <p className="font-inter text-xs text-[#475569]">Records with provenance</p>
          <p className="text-2xl font-bold font-inter text-[#0F172A] mt-1 tabular-nums">{hhEntries.length}</p>
        </div>
        <div className="surface-solid rounded-[18px] p-4">
          <p className="font-inter text-xs text-[#475569]">Verified</p>
          <p className="text-2xl font-bold font-inter text-[#0F172A] mt-1 tabular-nums">{verifiedCount}</p>
        </div>
        <div className="surface-solid rounded-[18px] p-4">
          <p className="font-inter text-xs text-[#475569]">Unverified</p>
          <p className="text-2xl font-bold font-inter text-[#8A5A00] mt-1 tabular-nums">{unverifiedCount}</p>
        </div>
        <div className="surface-solid rounded-[18px] p-4">
          <p className="font-inter text-xs text-[#475569]">Conflicts</p>
          <p className="text-2xl font-bold font-inter text-[#93000A] mt-1 tabular-nums">{conflictCount}</p>
        </div>
      </div>

      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-[#0F172A]">
            Provenance entries scoped to {household.household_id}
          </h3>
          <span className="font-inter text-xs text-[#475569]">
            Freshness boundary not configured (Q-05) · Append-only
          </span>
        </div>

        {hhEntries.length === 0 ? (
          <p className="text-xs text-[#475569]">No provenance entries for this household.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#475569]">
                  <th scope="col" className="py-2.5 px-2">Provenance ID</th>
                  <th scope="col" className="py-2.5 px-2">Dataset</th>
                  <th scope="col" className="py-2.5 px-2">Record</th>
                  <th scope="col" className="py-2.5 px-2">Field</th>
                  <th scope="col" className="py-2.5 px-2">Source system</th>
                  <th scope="col" className="py-2.5 px-2">Freshness</th>
                  <th scope="col" className="py-2.5 px-2">Verification</th>
                  <th scope="col" className="py-2.5 px-2">Derived</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hhEntries.map((entry) => (
                  <tr key={entry.provenance_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2">
                      <CopyableId id={entry.provenance_id} onCopy={onCopyId} />
                    </td>
                    <td className="py-2.5 px-2">{entry.referenced_dataset_name}</td>
                    <td className="py-2.5 px-2 font-semibold">{entry.referenced_record_id}</td>
                    <td className="py-2.5 px-2">{entry.referenced_field_name}</td>
                    <td className="py-2.5 px-2 text-[#475569]">{entry.source_system_name}</td>
                    <td className="py-2.5 px-2 tabular-nums">{entry.freshness_days} days</td>
                    <td className="py-2.5 px-2">
                      <EvidenceChip
                        state={
                          entry.conflict_status === 'CONFLICT_DETECTED'
                            ? 'CONFLICT'
                            : entry.verification_status === 'VERIFIED'
                            ? 'OBSERVED'
                            : 'PROVISIONAL'
                        }
                        customLabel={entry.verification_status}
                        size="sm"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      {entry.is_derived ? (
                        <EvidenceChip state="DERIVED" customLabel="ƒ Derived" size="sm" />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Day 1 Spec §8 & §11: sanket.household_profile.v1 JSON Contract Inspector */}
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#4648D4]">
              Day 1 Data Architecture Spec · §8 &amp; §11 Contract Inspector
            </span>
            <h3 className="text-base font-bold text-[#0F172A]">
              sanket.household_profile.v1 JSON Contract Payload
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setJsonMode('LIVE_HOUSEHOLD')}
                className={`px-3 py-1 rounded-full text-xs font-inter font-semibold ${
                  jsonMode === 'LIVE_HOUSEHOLD'
                    ? 'btn-primary-gradient text-white'
                    : 'text-[#475569]'
                }`}
              >
                {household.household_id} (Live)
              </button>
              <button
                type="button"
                onClick={() => setJsonMode('SECTION_11_SPEC')}
                className={`px-3 py-1 rounded-full text-xs font-inter font-semibold ${
                  jsonMode === 'SECTION_11_SPEC'
                    ? 'btn-primary-gradient text-white'
                    : 'text-[#475569]'
                }`}
              >
                §11 Spec Example (SANKET-HH-000142)
              </button>
            </div>
            <button
              type="button"
              onClick={() => onCopyId(JSON.stringify(displayedJson, null, 2))}
              className="px-3.5 py-1.5 rounded-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 font-inter text-xs font-semibold text-[#0F172A]"
            >
              Copy JSON
            </button>
          </div>
        </div>

        {jsonMode === 'SECTION_11_SPEC' && (
          <div className="p-3.5 rounded-[12px] bg-[#EEF2FF] border border-[#5558E8]/30 text-xs text-[#0F172A] flex items-center justify-between gap-2">
            <span>
              <strong>Section 11 Illustrative Payload (SANKET-HH-000142):</strong> Demonstrates the target contract shape when scoring &amp; decision workstreams populate <code className="font-inter">IND_01..IND_08</code>, <code className="font-inter">LEND_DIFFERENTLY</code>, and ≥3 evidence entries (Decision D13).
            </span>
            <EvidenceChip state="PROVISIONAL" customLabel="Spec §11 Example" size="sm" />
          </div>
        )}

        <pre className="p-4 rounded-[16px] bg-slate-950 text-slate-100 font-inter text-xs overflow-x-auto max-h-96 leading-relaxed">
          {JSON.stringify(displayedJson, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const ProfileTab7ReviewHistory: React.FC<{
  household: HouseholdProfile;
  onOpenReviewPage: () => void;
}> = ({ household, onOpenReviewPage }) => {
  const rev = household.human_review;

  return (
    <div className="space-y-6">
      <div className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-[#0F172A]">
              Review · {rev.review_status === 'REVIEWED' ? 'Reviewed' : 'Pending'}
            </h3>
            {rev.is_demo_preview && (
              <EvidenceChip state="PROVISIONAL" customLabel="Demo preview entry" size="sm" />
            )}
          </div>
          <button
            type="button"
            onClick={onOpenReviewPage}
            className="btn-primary-gradient px-4 py-2 rounded-[10px] text-xs font-inter font-semibold"
          >
            Open Recommendation Review (S10)
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-inter">
          <div className="p-3.5 rounded-[12px] bg-slate-50">
            <dt className="text-[#475569]">Suggested action</dt>
            <dd className="text-sm font-bold text-[#0F172A] mt-1">
              {
                mapStatusToOfficerLabel(
                  household.recommendation_status,
                  household.reason_codes
                ).label
              }
            </dd>
          </div>
          <div className="p-3.5 rounded-[12px] bg-slate-50">
            <dt className="text-[#475569]">Officer decision</dt>
            <dd className="text-sm font-bold text-[#0F172A] mt-1">
              {mapDecisionToLabel(rev.officer_decision)}
            </dd>
          </div>
          <div className="p-3.5 rounded-[12px] bg-slate-50 sm:col-span-2">
            <dt className="text-[#475569]">Rationale</dt>
            <dd className="text-sm text-[#0F172A] mt-1">
              {rev.override_reason || 'No review has been recorded for this household. Open Review suggestion to start one.'}
            </dd>
          </div>
          <div className="p-3.5 rounded-[12px] bg-slate-50">
            <dt className="text-[#475569]">Reviewed by</dt>
            <dd className="text-sm font-semibold text-[#0F172A] mt-1">
              {rev.officer_id || 'Not recorded'}
            </dd>
          </div>
          <div className="p-3.5 rounded-[12px] bg-slate-50">
            <dt className="text-[#475569]">Reviewed at</dt>
            <dd className="text-sm font-semibold text-[#0F172A] mt-1">
              {rev.reviewed_at || '—'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
