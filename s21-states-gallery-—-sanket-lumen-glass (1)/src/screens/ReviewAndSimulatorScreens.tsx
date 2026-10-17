import React, { useState } from 'react';
import { HouseholdProfile } from '../data/sanketData';
import {
  ACTION_FRAMEWORK_MEANINGS,
  ActionCode,
  OfficerDecision,
  RoleId,
  ScreenId,
  TestFixtureId,
  addDaysISO,
  computeRedressDeadline,
  evaluateWhatIfScenario,
  formatDateDisplay,
  formatINR,
  mapDecisionToOfficerLabel,
  mapReasonCodeToPlainWords,
  mapStatusToOfficerLabel,
  mapWarningTypeToLabel,
  presentRecommendation,
} from '../utils/sanketLogic';
import { CompletenessBar, CopyableId, EvidenceChip } from '../components/SharedPrimitives';
import { RestrictedAccessCard } from '../components/HouseholdProfileHeader';

interface S10QueueProps {
  role: RoleId;
  households: HouseholdProfile[];
  onSelectHouseholdReview: (id: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onSwitchRole: (role: RoleId) => void;
  onCopyId: (id: string) => void;
}

export const S10RecommendationQueue: React.FC<S10QueueProps> = ({
  role,
  households,
  onSelectHouseholdReview,
  onNavigate,
  onSwitchRole,
  onCopyId,
}) => {
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'NO_SUGGESTION' | 'INSUFFICIENT' | 'CONFLICT' | 'READY'
  >('ALL');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL');
  const [includeCrossPartner, setIncludeCrossPartner] = useState(false);

  if (role === 'PORTFOLIO_MANAGER') {
    return (
      <RestrictedAccessCard
        role={role}
        attemptedView="S10 Recommendation Reviews"
        onNavigate={onNavigate}
        onSwitchRole={onSwitchRole}
      />
    );
  }

  const scopedHouseholds = includeCrossPartner
    ? households
    : households.filter((h) => h.fsp_partner_id === 'FSP-SYN-01');

  const filtered = scopedHouseholds.filter((h) => {
    const isConflict = h.recommendation_status === 'CONFLICT_REQUIRES_REVIEW';
    const isLowComp = h.reason_codes.includes('DATA_COMPLETENESS_LOW');
    const isReady = h.recommendation_status === 'READY_FOR_REVIEW';
    const isRulesPendingOnly = !isConflict && !isLowComp && !isReady;

    if (statusFilter === 'NO_SUGGESTION' && !isRulesPendingOnly) return false;
    if (statusFilter === 'INSUFFICIENT' && !isLowComp) return false;
    if (statusFilter === 'CONFLICT' && !isConflict) return false;
    if (statusFilter === 'READY' && !isReady) return false;
    if (reviewFilter !== 'ALL' && h.human_review.review_status !== reviewFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Recommendation Reviews</h1>
          <p className="text-sm text-[#475569]">
            Households in your cohort and what SANKET can say about each. No sort by risk exists (FO-INT-202).
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-inter bg-white/80 px-3 py-2 rounded-[10px] border border-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={includeCrossPartner}
            onChange={(e) => setIncludeCrossPartner(e.target.checked)}
          />
          <span>Include cross-partner demo cast (HH-000125, 108)</span>
        </label>
      </div>

      {/* FO-INT-200: Queue filter chips */}
      <div className="glass-1 rounded-[20px] p-4 flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-inter font-semibold text-[#475569]">Status:</span>
        {(
          [
            { id: 'ALL', label: 'All' },
            { id: 'NO_SUGGESTION', label: 'No suggestion' },
            { id: 'INSUFFICIENT', label: 'Insufficient data' },
            { id: 'CONFLICT', label: 'Conflict' },
            { id: 'READY', label: 'Ready for review' },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (s.id === 'INSUFFICIENT') setIncludeCrossPartner(true);
              setStatusFilter(s.id);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-inter font-semibold ${
              statusFilter === s.id ? 'btn-primary-gradient text-white' : 'bg-white text-[#334155]'
            }`}
          >
            {s.label}
          </button>
        ))}

        <span className="text-xs font-inter font-semibold text-[#475569] ml-2">Review:</span>
        {(
          [
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'REVIEWED', label: 'Reviewed' },
          ] as const
        ).map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setReviewFilter(r.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-inter font-semibold ${
              reviewFilter === r.id ? 'btn-primary-gradient text-white' : 'bg-white text-[#334155]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="surface-solid rounded-[24px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-[#475569]">
            No households need review in your cohort.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[#475569]">
                  <th scope="col" className="py-3.5 px-4">Household</th>
                  <th scope="col" className="py-3.5 px-4">Village</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4">Reason</th>
                  <th scope="col" className="py-3.5 px-4">Completeness</th>
                  <th scope="col" className="py-3.5 px-4">Review</th>
                  <th scope="col" className="py-3.5 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filtered.map((h) => {
                  const mapped = mapStatusToOfficerLabel(h.recommendation_status, h.reason_codes);
                  return (
                    <tr
                      key={h.household_id}
                      onClick={() => onSelectHouseholdReview(h.household_id)}
                      className="hover:bg-indigo-50/40 cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <CopyableId
                          id={h.household_id}
                          onClick={() => onSelectHouseholdReview(h.household_id)}
                          onCopy={onCopyId}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-[#334155]">
                        {h.village_name} · {h.block_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <EvidenceChip
                          state={mapped.chipState}
                          customLabel={mapped.label}
                          size="sm"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">
                        {h.reason_codes.join(', ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <CompletenessBar
                          pct={h.data_completeness_pct}
                          band={h.data_completeness_band}
                          compact
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-[8px] font-semibold ${
                            h.human_review.review_status === 'REVIEWED'
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-slate-100 text-[#334155]'
                          }`}
                        >
                          {h.human_review.review_status === 'REVIEWED' ? 'Reviewed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        {formatDateDisplay(h.profile_last_updated_at)}
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

interface S10DetailProps {
  role: RoleId;
  household: HouseholdProfile;
  allHouseholds: HouseholdProfile[];
  onSelectHousehold: (id: string) => void;
  onOpenDecisionDrawer: (previewMode: boolean) => void;
  onOpenWhatIf: () => void;
  onOpenProfile: () => void;
  onNavigate: (screen: ScreenId) => void;
  onCreateVerificationTask: (householdId: string) => void;
  onCopyId: (id: string) => void;
}

export const S10RecommendationDetail: React.FC<S10DetailProps> = ({
  role,
  household,
  allHouseholds,
  onSelectHousehold,
  onOpenDecisionDrawer,
  onOpenWhatIf,
  onOpenProfile,
  onNavigate,
  onCopyId,
}) => {
  const [activeFixture, setActiveFixture] = useState<TestFixtureId>('NONE');
  const [selectedActionCard, setSelectedActionCard] = useState<ActionCode | null>(null);
  const [confidenceInfoOpen, setConfidenceInfoOpen] = useState(false);

  // Build effective recommendation + evidence from activeFixture (Section 14.1 FX-01, FX-02, FX-03, FX-07)
  const effectiveEvidence =
    activeFixture === 'FX-02' ? household.evidence.slice(0, 2) : household.evidence;

  const recommendationInput =
    activeFixture === 'FX-03'
      ? null
      : activeFixture === 'FX-01' || activeFixture === 'FX-02'
      ? {
          recommendation_status: 'READY_FOR_REVIEW',
          action_code: 'WAIT',
          reason_codes: [],
          confidence_band: 'LOW',
          llm_explanation: null,
        }
      : activeFixture === 'FX-07'
      ? {
          recommendation_status: household.recommendation_status,
          action_code: household.action_code,
          reason_codes: household.reason_codes,
          confidence_band: 'LOW',
          llm_explanation:
            'Household SANKET-HH-000101 has a scheduled instalment of ₹4,170.00 on 28 Oct 2026, which falls 8 days before the household-reported expected Surat remittance of ₹35,000.00 on 5 Nov 2026.',
        }
      : {
          recommendation_status: household.recommendation_status,
          action_code: household.action_code,
          reason_codes: household.reason_codes,
          confidence_band: 'LOW',
          llm_explanation: null,
        };

  const presented = presentRecommendation({
    recommendation: recommendationInput,
    evidenceCount: effectiveEvidence.length,
    recordStatus: activeFixture === 'FX-04' ? 'CONSENT_WITHDRAWN' : household.record_status,
    generatedAtIso: household.profile_last_updated_at,
  });

  const isConflict = presented.effectiveStatus === 'CONFLICT_REQUIRES_REVIEW';
  const redressDeadline = computeRedressDeadline(household.profile_last_updated_at);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb + Household Strip + PRD Fixture Selector */}
      <div className="glass-1 rounded-[20px] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('S10')}
            className="text-xs font-inter font-semibold text-[#4648D4] hover:underline inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
            <span>Back to queue</span>
          </button>
          <span className="text-slate-300">|</span>
          <CopyableId id={household.household_id} onClick={onOpenProfile} onCopy={onCopyId} />
          <span className="text-xs text-[#334155]">
            {household.village_name} · {household.block_name}
          </span>
          <CompletenessBar
            pct={household.data_completeness_pct}
            band={household.data_completeness_band}
            compact
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="s10-fixture-select" className="text-[11px] font-inter font-semibold text-[#475569]">
            Test Fixture (§14.1):
          </label>
          <select
            id="s10-fixture-select"
            value={activeFixture}
            onChange={(e) => setActiveFixture(e.target.value as TestFixtureId)}
            className="bg-indigo-50/90 border border-indigo-200 rounded-[8px] px-2.5 py-1.5 text-xs font-inter font-semibold text-[#4F46E5]"
          >
            <option value="NONE">Demo Data (action_code = null)</option>
            <option value="FX-01">FX-01: WAIT Ready for review (3+ evidence)</option>
            <option value="FX-02">FX-02: WAIT with &lt;3 evidence (CF-04 guard)</option>
            <option value="FX-03">FX-03: recommendation = null (Q-17 guard)</option>
            <option value="FX-07">FX-07: Supplementary llm_explanation (FO-FR-024)</option>
          </select>

          <select
            aria-label="Switch household in recommendation review"
            value={household.household_id}
            onChange={(e) => onSelectHousehold(e.target.value)}
            className="bg-white border border-slate-300 rounded-[8px] px-2.5 py-1.5 text-xs font-inter"
          >
            {allHouseholds
              .filter((h) => h.fsp_partner_id === 'FSP-SYN-01' || h.household_id === household.household_id)
              .map((h) => (
                <option key={h.household_id} value={h.household_id}>
                  {h.household_id} ({h.block_name})
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={onOpenProfile}
            className="px-3 py-1.5 rounded-[8px] bg-white border border-slate-300 text-xs font-inter font-semibold text-[#0F172A] hover:bg-slate-50"
          >
            Open household
          </button>
        </div>
      </div>

      {/* Conflict Alert if H109 or H120 (FO-INT-210) */}
      {isConflict && (
        <div
          role="alert"
          className="surface-solid rounded-[16px] p-4 border-l-4 border-l-[#BA1A1A] bg-[#FFDAD6]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#93000A]">
              Data conflict — officer verification required
            </p>
            <p className="text-xs text-[#0F172A]">
              {household.data_quality_warnings[0]?.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('S14')}
            className="px-4 py-2 rounded-[10px] bg-[#BA1A1A] text-white text-xs font-inter font-semibold whitespace-nowrap shrink-0"
          >
            Go to verification
          </button>
        </div>
      )}

      {/* Guard Message if FX-02 (<3 evidence signals, FO-FR-020 / FO-FR-021 / FO-TC-451) */}
      {presented.guardMessage && (
        <div
          role="alert"
          className="surface-solid rounded-[16px] p-4 border-l-4 border-l-[#D99A36] bg-amber-50/90 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#8A5A00]">shield</span>
            <p className="text-xs font-bold text-[#0F172A]">{presented.guardMessage}</p>
          </div>
          <EvidenceChip state="MISSING" customLabel="CF-04 / FO-FR-020 Guard" size="sm" />
        </div>
      )}

      {/* Hero Recommendation Status Panel */}
      <div className="glass-1 rounded-[24px] p-6 md:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="font-inter text-xs font-semibold uppercase tracking-wider text-[#475569]">
              Suggested action
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A]">
                {presented.displayedActionLabel}
              </h1>
              <EvidenceChip
                state={presented.statusChipState}
                customLabel={presented.statusLabel}
              />
            </div>
            <p className="text-sm text-[#334155] max-w-2xl leading-relaxed">
              {presented.displayedActionMeaning
                ? presented.displayedActionMeaning
                : 'No approved decision rules exist, so SANKET cannot suggest one of its five actions for this household.'}
            </p>

            {/* FO-FR-027 & CF-17: 60-day WAIT reassessment window */}
            {presented.waitReassessmentNotice && (
              <div className="p-3 rounded-[12px] bg-[#EEF2FF] border border-indigo-200 text-xs font-inter font-semibold text-[#312E81]">
                {presented.waitReassessmentNotice}
              </div>
            )}
          </div>

          {role === 'FIELD_OFFICER' && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onOpenDecisionDrawer(presented.displayedActionCode !== null)}
                className="btn-primary-gradient px-5 py-3 rounded-[12px] text-xs font-inter font-semibold focus-ring"
              >
                Start review
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFixture('FX-01');
                  onOpenDecisionDrawer(true);
                }}
                className="glass-2 px-4 py-3 rounded-[12px] text-xs font-inter font-semibold text-[#4648D4] hover:bg-white focus-ring"
              >
                Test FX-01 review form
              </button>
              <button
                type="button"
                onClick={onOpenWhatIf}
                className="glass-2 px-4 py-3 rounded-[12px] text-xs font-inter font-semibold text-[#0F172A] hover:bg-white focus-ring"
              >
                What if?
              </button>
            </div>
          )}
        </div>

        {/* FO-INT-204 & FO-FR-022 & CF-02: Actions in the framework with documented one-line meanings */}
        <div className="surface-solid rounded-[16px] p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-inter text-xs font-bold text-[#334155]">
              Actions in the framework (CF-02)
            </span>
            <span className="text-xs text-[#475569]">
              {presented.displayedActionCode
                ? 'Select any action chip to read its documented meaning and boundaries.'
                : 'The five actions have documented one-line meanings (SRC-1 §06); selection rules are pending (Q-13).'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {(Object.keys(ACTION_FRAMEWORK_MEANINGS) as ActionCode[]).map((code) => {
              const item = ACTION_FRAMEWORK_MEANINGS[code];
              const isSuggested = presented.displayedActionCode === code;
              const isExpanded = selectedActionCard === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedActionCard(isExpanded ? null : code)}
                  className={`p-3 rounded-[12px] border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isSuggested
                      ? 'bg-[#EEF2FF] border-2 border-[#6366F1] shadow-xs'
                      : isExpanded
                      ? 'bg-white border-[#6366F1]'
                      : 'bg-slate-50/90 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-inter text-[11px] font-extrabold text-[#0F172A]">
                      {code}
                    </span>
                    {isSuggested && (
                      <span className="px-2 py-0.5 rounded-full bg-[#6366F1] text-white font-inter text-[10px] font-bold">
                        Suggested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#334155] leading-snug">{item.meaningShown}</p>
                </button>
              );
            })}
          </div>

          {selectedActionCard && (
            <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200 font-inter text-xs space-y-1">
              <p className="font-bold text-[#0F172A]">
                {ACTION_FRAMEWORK_MEANINGS[selectedActionCard].meaningShown}
              </p>
              <p className="text-[#475569]">
                <strong>Evidence rule:</strong> {ACTION_FRAMEWORK_MEANINGS[selectedActionCard].evidenceRule} ·{' '}
                <strong>What SANKET does not do:</strong>{' '}
                {ACTION_FRAMEWORK_MEANINGS[selectedActionCard].whatSanketDoesNotDo}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Left (7) Evidence + Reason Codes + Explanation; Right (5) Warnings, Missing Info, Confidence, Review, Redress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="surface-solid rounded-[24px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A]">Evidence</h2>
              <span className="font-inter text-xs text-[#475569]">
                {effectiveEvidence.length} signals (minimum 3 required to show an action · CF-04)
              </span>
            </div>

            {effectiveEvidence.length === 0 ? (
              <p className="text-xs text-[#475569]">No evidence recorded.</p>
            ) : (
              <div className="space-y-3">
                {effectiveEvidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-[14px] bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#475569]">{ev.signal_name}</p>
                      <p className="text-sm font-bold text-[#0F172A]">{ev.observed_value}</p>
                      <p className="font-inter text-[11px] text-[#475569]">
                        {ev.source_dataset} · {ev.source_reference} · Observed {ev.observation_date} · Relates to {ev.relates_to}
                      </p>
                    </div>
                    <EvidenceChip state={ev.state} size="sm" />
                  </div>
                ))}
              </div>
            )}

            {/* FO-INT-203: Reason codes in plain words */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <p className="font-inter text-xs font-semibold text-[#475569]">Reason codes</p>
              <div className="flex flex-wrap gap-2">
                {household.reason_codes.map((rc) => {
                  const mappedRc = mapReasonCodeToPlainWords(rc);
                  return (
                    <span
                      key={rc}
                      title={mappedRc.tooltip}
                      className="px-2.5 py-1 rounded-[8px] bg-slate-100 border border-slate-300 font-inter text-xs font-medium text-[#334155]"
                    >
                      {mappedRc.label} — <span className="text-[#64748B]">{mappedRc.tooltip}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FO-FR-024: Plain-language explanation card (below evidence) */}
          <div className="surface-solid rounded-[24px] p-6 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-[#0F172A]">Plain-language explanation</h2>
              {presented.isExplanationSupplementary && (
                <EvidenceChip
                  state="PROVISIONAL"
                  customLabel="Supplementary explanation. The evidence above is the basis."
                  size="sm"
                />
              )}
            </div>
            <p className="text-sm text-[#334155] leading-relaxed">{presented.explanationText}</p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="surface-solid rounded-[24px] p-6 space-y-3">
            <h2 className="text-base font-bold text-[#0F172A]">Data warnings</h2>
            {household.data_quality_warnings.length === 0 ? (
              <p className="text-xs text-[#475569]">No data warnings</p>
            ) : (
              household.data_quality_warnings.map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-[12px] bg-[#D99A36]/12 border border-[#D99A36]/40 space-y-1.5"
                >
                  <EvidenceChip
                    state={w.state}
                    customLabel={mapWarningTypeToLabel(w.warning_type)}
                    size="sm"
                  />
                  <p className="text-xs text-[#0F172A]">{w.description}</p>
                </div>
              ))
            )}
          </div>

          <div className="surface-solid rounded-[24px] p-6 space-y-2">
            <h2 className="text-base font-bold text-[#0F172A]">Missing information</h2>
            {household.missing_data_flags.length === 0 ? (
              <p className="text-xs text-[#334155]">Nothing missing for the fields SANKET reads.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-[#334155]">
                {household.missing_data_flags.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[15px] text-[#475569]">
                      radio_button_unchecked
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* FO-FR-023 & FO-INT-212: Confidence display ("Not configured", never LOW) */}
          <div className="surface-solid rounded-[24px] p-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A]">Confidence</h2>
                <button
                  type="button"
                  onClick={() => setConfidenceInfoOpen(!confidenceInfoOpen)}
                  aria-label="Confidence definition info"
                  className="text-[#4648D4] hover:text-[#0F172A] inline-flex items-center"
                >
                  <span className="material-symbols-outlined !text-[18px]">info</span>
                </button>
              </div>
              <EvidenceChip state="NOT_CONFIGURED" customLabel="Not configured" />
            </div>
            {confidenceInfoOpen && (
              <p className="p-3 rounded-[10px] bg-slate-50 border border-slate-200 text-xs text-[#334155]">
                Confidence bands are High, Medium or Low, but how they are set has not been defined. SANKET does not show a band until it is (P-04, Q-13).
              </p>
            )}
          </div>

          {/* Review Card */}
          <div className="surface-solid rounded-[24px] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F172A]">Review</h2>
              <span className="font-inter text-xs font-semibold text-[#4648D4]">
                {household.human_review.review_status === 'REVIEWED' ? 'Reviewed' : 'Not reviewed yet'}
              </span>
            </div>
            {household.human_review.review_status === 'REVIEWED' ? (
              <div className="p-3 rounded-[12px] bg-emerald-50/70 border border-emerald-200 space-y-1 text-xs">
                <p className="font-bold text-emerald-950">
                  Decision: {mapDecisionToOfficerLabel(household.human_review.officer_decision)} (
                  {household.human_review.officer_decision})
                </p>
                <p className="text-[#334155]">
                  Reasons: {household.human_review.override_reason || '—'}
                </p>
                <p className="font-inter text-[11px] text-[#475569]">
                  Recorded {household.human_review.reviewed_at} by {household.human_review.officer_id}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('S05_REVIEWS')}
                  className="text-xs font-inter font-semibold text-[#4648D4] hover:underline pt-1 inline-block"
                >
                  View in Review History (Tab 7) →
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDecisionDrawer(presented.displayedActionCode !== null)}
                  className="btn-primary-gradient px-4 py-2.5 rounded-[10px] text-xs font-inter font-semibold"
                >
                  Start review
                </button>
                <button
                  type="button"
                  onClick={onOpenWhatIf}
                  className="glass-1 px-4 py-2.5 rounded-[10px] text-xs font-inter font-semibold text-[#0F172A]"
                >
                  What if?
                </button>
              </div>
            )}
          </div>

          {/* FO-FR-028 & FO-INT-211: Household-requested review (redress) panel */}
          <div className="surface-solid rounded-[24px] p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#0F172A]">
                Household-requested review (redress)
              </h2>
              <EvidenceChip state="NOT_CONFIGURED" customLabel="Write blocked · Q-16" size="sm" />
            </div>
            <p className="text-xs text-[#334155] leading-relaxed">
              A household may ask for a review within 30 days of a suggestion (until{' '}
              <strong>{redressDeadline}</strong>). Entering corrective information triggers recalculation once a write path is approved (CF-17).
            </p>
            <button
              type="button"
              aria-disabled="true"
              title="Recording review requests needs an approved write path (Q-16)."
              className="w-full py-2.5 px-4 rounded-[10px] bg-slate-100 border border-slate-300 text-xs font-inter font-semibold text-slate-500 cursor-not-allowed focus-ring"
            >
              Record a household&apos;s review request (Disabled · Q-16)
            </button>
            <p className="font-inter text-[11px] text-[#64748B]">
              Recording review requests needs an approved write path (Q-16).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface S15DrawerProps {
  open: boolean;
  household: HouseholdProfile;
  initialPreviewMode: boolean;
  onClose: () => void;
  onSaveDecision: (
    householdId: string,
    decision: OfficerDecision,
    reason: string,
    isPreview: boolean
  ) => void;
}

export const S15HumanReviewDrawer: React.FC<S15DrawerProps> = ({
  open,
  household,
  initialPreviewMode,
  onClose,
  onSaveDecision,
}) => {
  const [previewEnabled, setPreviewEnabled] = useState(initialPreviewMode);
  const [decision, setDecision] = useState<OfficerDecision>('OVERRIDDEN');
  const [modifiedActionCode, setModifiedActionCode] = useState<ActionCode>('LEND_DIFFERENTLY');
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardPromptOpen, setDiscardPromptOpen] = useState(false);

  if (!open) return null;

  const requiresReason = decision === 'MODIFIED' || decision === 'OVERRIDDEN';

  const handleRequestClose = () => {
    if (reason.trim().length > 0) {
      setDiscardPromptOpen(true);
    } else {
      onClose();
    }
  };

  const handleAttemptSave = () => {
    if (reason.length > 1000) {
      setValidationError('Keep your reasons under 1,000 characters.');
      return;
    }
    if (requiresReason && reason.trim().length < 10) {
      setValidationError('Add your reasons before recording.');
      return;
    }
    setValidationError(null);
    setConfirmOpen(true);
  };

  const handleConfirmRecord = () => {
    setConfirmOpen(false);
    const formattedReason =
      decision === 'MODIFIED'
        ? `Modified to: ${modifiedActionCode}${reason.trim() ? ` — ${reason.trim()}` : ''}`
        : reason.trim();
    onSaveDecision(household.household_id, decision, formattedReason, previewEnabled);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="s15-drawer-title"
    >
      <div className="glass-2 w-full max-w-[480px] h-full flex flex-col justify-between p-6 overflow-y-auto">
        <div className="space-y-5">
          {/* Drawer Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-inter text-xs font-bold text-[#4648D4]">
                  {household.household_id}
                </span>
                <EvidenceChip
                  state={previewEnabled ? 'OBSERVED' : 'NOT_CONFIGURED'}
                  customLabel={
                    previewEnabled
                      ? 'FX-01 · Ready for review (WAIT)'
                      : 'No suggestion · Decision rules pending'
                  }
                  size="sm"
                />
              </div>
              <h2 id="s15-drawer-title" className="text-xl font-bold text-[#0F172A]">
                Record your review
              </h2>
              <p className="text-xs text-[#475569]">
                Records your view of the suggestion. It is not a loan decision (CF-01).
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Close review drawer"
              className="p-2 rounded-full hover:bg-white text-[#475569]"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Toggle between Default Disabled Demo State (FO-INT-240) & FX-01 Enabled State */}
          <div className="surface-solid rounded-[14px] p-3.5 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-[#0F172A]">
                {previewEnabled
                  ? 'Fixture FX-01 enabled (WAIT suggestion present)'
                  : 'Default demo state (action_code = null)'}
              </p>
              <p className="text-[#475569]">
                {previewEnabled
                  ? 'Testing J-C / J-G human review and override workflow.'
                  : 'There is no suggestion to respond to yet. Review recording opens when the decision rules produce a suggestion.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewEnabled(!previewEnabled);
                setValidationError(null);
              }}
              className="px-3 py-1.5 rounded-[8px] bg-[#EEF2FF] text-[#4648D4] font-inter text-xs font-semibold shrink-0"
            >
              {previewEnabled ? 'Show disabled state' : 'Enable FX-01'}
            </button>
          </div>

          {/* Section 1: What SANKET showed */}
          <div className="surface-solid rounded-[16px] p-4 space-y-1">
            <span className="font-inter text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
              What SANKET showed
            </span>
            <p className="text-xs font-semibold text-[#0F172A]">
              Suggested action:{' '}
              {previewEnabled
                ? 'Wait (WAIT) · Reassess within 60 days (default)'
                : 'None yet · No suggestion · Decision rules pending'}{' '}
              · {household.evidence.length} evidence signals shown ·{' '}
              {household.data_quality_warnings.length} data warning
            </p>
          </div>

          {/* Section 2: Your decision (FO-INT-241, P-03) */}
          <fieldset disabled={!previewEnabled} className="space-y-2.5 disabled:opacity-55">
            <legend className="text-xs font-inter font-bold text-[#0F172A]">
              Your decision
            </legend>
            {[
              {
                val: 'APPROVED' as OfficerDecision,
                label: 'Agree with the suggestion',
                sub: 'Records officer_decision = APPROVED (reasons optional)',
              },
              {
                val: 'MODIFIED' as OfficerDecision,
                label: 'Modify the suggestion',
                sub: 'Records officer_decision = MODIFIED (reasons required · P-07)',
              },
              {
                val: 'OVERRIDDEN' as OfficerDecision,
                label: 'Override the suggestion',
                sub: 'Records officer_decision = OVERRIDDEN (reasons required · CF-06)',
              },
            ].map((opt) => (
              <label
                key={opt.val}
                className={`block p-3.5 rounded-[14px] border cursor-pointer transition-colors ${
                  decision === opt.val
                    ? 'surface-solid border-2 border-[#5558E8]'
                    : 'bg-white/80 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="officer_decision"
                    checked={decision === opt.val}
                    onChange={() => {
                      setDecision(opt.val);
                      setValidationError(null);
                    }}
                  />
                  <div>
                    <span className="text-sm font-bold text-[#0F172A] block">{opt.label}</span>
                    <span className="text-[11px] font-inter text-[#475569]">{opt.sub}</span>
                  </div>
                </div>
              </label>
            ))}
          </fieldset>

          {/* FO-INT-243: "What would you do instead?" select when Modify is selected */}
          {decision === 'MODIFIED' && (
            <div className={`space-y-1.5 ${!previewEnabled ? 'opacity-55 pointer-events-none' : ''}`}>
              <label
                htmlFor="s15-modified-action"
                className="block text-xs font-inter font-bold text-[#0F172A]"
              >
                What would you do instead? (FO-INT-243 · Q-03)
              </label>
              <select
                id="s15-modified-action"
                disabled={!previewEnabled}
                value={modifiedActionCode}
                onChange={(e) => setModifiedActionCode(e.target.value as ActionCode)}
                className="w-full rounded-[10px] p-2.5 bg-white border border-slate-300 text-xs font-inter text-[#0F172A]"
              >
                <option value="LEND_DIFFERENTLY">
                  LEND_DIFFERENTLY — Lend differently (flexible EMI, seasonal schedule)
                </option>
                <option value="EXTEND_CREDIT">
                  EXTEND_CREDIT — Extend credit (timing or structure adjusted)
                </option>
                <option value="RECOMMEND_PROTECTION">
                  RECOMMEND_PROTECTION — Recommend protection (insurance, savings product)
                </option>
                <option value="CHECK_IN">
                  CHECK_IN — Check in (support, financial coaching)
                </option>
              </select>
              <p className="text-[11px] font-inter text-[#64748B]">
                Until Q-03 closes, your choice is written into the reasons text as &ldquo;Modified to: {modifiedActionCode}&rdquo;.
              </p>
            </div>
          )}

          {/* Section 3: Your reasons (FO-INT-242) */}
          <div className={`space-y-1.5 ${!previewEnabled ? 'opacity-55 pointer-events-none' : ''}`}>
            <label
              htmlFor="s15-reason-textarea"
              className="block text-xs font-inter font-bold text-[#0F172A]"
            >
              Why? {requiresReason ? '(required to modify or override)' : '(optional)'}
            </label>
            <p className="text-xs text-[#475569]">
              Write in your own words. This is saved exactly as typed into override_reason.
            </p>
            <textarea
              id="s15-reason-textarea"
              rows={4}
              disabled={!previewEnabled}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Household instalment on 28 Oct falls 8 days before expected Surat remittance on 5 Nov; scheduling field check-in first."
              className="w-full rounded-[12px] p-3 bg-white border border-slate-300 text-xs text-[#0F172A] focus-ring"
            />
            <div className="flex items-center justify-between text-[11px] font-inter text-[#475569]">
              <span>Minimum 10 characters when modifying or overriding (max 1,000)</span>
              <span>{reason.length} / 1,000</span>
            </div>
            {validationError && (
              <p role="alert" className="text-xs font-semibold text-[#93000A] pt-1">
                {validationError}
              </p>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleRequestClose}
            className="glass-1 px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold text-[#0F172A]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewEnabled}
            onClick={handleAttemptSave}
            className="btn-primary-gradient px-5 py-2.5 rounded-[12px] text-xs font-inter font-semibold disabled:opacity-40 focus-ring"
          >
            Record review
          </button>
        </div>

        {/* Solid Confirmation Modal inside Drawer (FO-INT-245, FO-INT-246) */}
        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="surface-solid rounded-[20px] max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-[#0F172A]">Record this review?</h3>
              <p className="text-xs text-[#334155] leading-relaxed">
                This appends a human_review record and an audit event REVIEW_RECORDED. Earlier reviews cannot be edited or deleted (FO-FR-026).
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-2 rounded-[10px] border border-slate-300 text-xs font-inter font-semibold text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRecord}
                  className="btn-primary-gradient px-4 py-2 rounded-[10px] text-xs font-inter font-semibold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NAV-05 & FO-TC-470: Unsaved input prompt */}
        {discardPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="surface-solid rounded-[20px] max-w-sm w-full p-6 space-y-4">
              <h3 className="text-base font-bold text-[#0F172A]">Discard what you typed?</h3>
              <p className="text-xs text-[#334155]">
                You have unsaved reasons in the review form.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDiscardPromptOpen(false)}
                  className="btn-primary-gradient px-4 py-2 rounded-[10px] text-xs font-inter font-semibold"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscardPromptOpen(false);
                    setReason('');
                    onClose();
                  }}
                  className="px-4 py-2 rounded-[10px] border border-slate-300 text-xs font-inter font-semibold text-[#0F172A]"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface S11WhatIfProps {
  role: RoleId;
  household: HouseholdProfile;
  onBackToHousehold: () => void;
  onBackToReview: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSwitchRole: (role: RoleId) => void;
}

export const S11WhatIfSimulator: React.FC<S11WhatIfProps> = ({
  role,
  household,
  onBackToHousehold,
  onBackToReview,
  onNavigate,
  onSwitchRole,
}) => {
  const activeLoans = household.loans.filter((l) => l.loan_status === 'ACTIVE');
  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    activeLoans[0]?.loan_account_id || ''
  );
  // C-5, P-08, FO-INT-227: Presets 7 days, 14 days, 30 days, 6 weeks (42 days), Custom date
  const [moveByPreset, setMoveByPreset] = useState<7 | 14 | 30 | 42 | 'CUSTOM'>(14);
  const [customDate, setCustomDate] = useState('2026-11-11');

  if (role !== 'FIELD_OFFICER') {
    return (
      <RestrictedAccessCard
        role={role}
        attemptedView="S11 What If? Simulator"
        onNavigate={onNavigate}
        onSwitchRole={onSwitchRole}
      />
    );
  }

  const activeLoan =
    activeLoans.find((l) => l.loan_account_id === selectedLoanId) || activeLoans[0];
  const pendingInstalmentDue = activeLoan?.next_due_date || null;
  const expectedOrDelayedRemit = household.seasonal_records.find(
    (r) => r.remittance_status === 'EXPECTED' || r.remittance_status === 'DELAYED'
  );
  const remitDate = expectedOrDelayedRemit?.expected_remittance_date || null;

  // FO-INT-226: Empty state when household has no pending instalment
  if (!activeLoan || !pendingInstalmentDue) {
    return (
      <div className="space-y-6">
        <div className="surface-solid rounded-[24px] p-8 text-center space-y-3">
          <h1 className="text-xl font-bold text-[#0F172A]">
            This household has no pending instalment to explore.
          </h1>
          <p className="text-xs text-[#475569]">
            {household.household_id} does not have an active loan with a recorded pending due date.
          </p>
          <button
            type="button"
            onClick={onBackToHousehold}
            className="btn-primary-gradient px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold"
          >
            Back to household
          </button>
        </div>
      </div>
    );
  }

  const customDateInvalid = moveByPreset === 'CUSTOM' && customDate <= '2026-10-17';

  const effectiveDays =
    moveByPreset === 'CUSTOM'
      ? customDateInvalid
        ? 14
        : Math.max(
            1,
            Math.round(
              (new Date(`${customDate}T00:00:00Z`).getTime() -
                new Date(`${pendingInstalmentDue}T00:00:00Z`).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
      : moveByPreset;

  const evalResult = evaluateWhatIfScenario(
    pendingInstalmentDue,
    effectiveDays,
    remitDate || '2026-11-05',
    '2026-07-01',
    '2026-10-31'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <EvidenceChip state="DERIVED" customLabel="ƒ Derived · Nothing stored" size="sm" />
            <span className="font-inter text-xs font-bold text-[#4648D4]">
              {household.household_id} · {household.block_name}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">What if?</h1>
          <p className="text-sm text-[#475569] max-w-3xl">
            Explore how moving one instalment changes its timing against an expected remittance. This is an illustration, not a recommendation and not a change to the loan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToHousehold}
            className="glass-1 px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold text-[#0F172A] hover:bg-white"
          >
            Back to household
          </button>
          <button
            type="button"
            onClick={onBackToReview}
            className="btn-primary-gradient px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold"
          >
            Back to review (S10)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Frosted Panel: Scenario Inputs */}
        <div className="lg:col-span-5 glass-2 rounded-[24px] p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#0F172A]">Scenario</h2>

          {/* FO-INT-225: Loan select if more than one loan */}
          {activeLoans.length > 1 && (
            <div className="space-y-1.5">
              <label htmlFor="wi-loan" className="block text-xs font-inter font-semibold text-[#334155]">
                Loan account
              </label>
              <select
                id="wi-loan"
                value={activeLoan.loan_account_id}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="w-full rounded-[10px] p-2.5 bg-white border border-slate-300 text-xs font-inter text-[#0F172A]"
              >
                {activeLoans.map((l) => (
                  <option key={l.loan_account_id} value={l.loan_account_id}>
                    {l.loan_account_id} · {l.originating_institution_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* FO-INT-226: Instalment select */}
          <div className="space-y-1.5">
            <label htmlFor="wi-inst" className="block text-xs font-inter font-semibold text-[#334155]">
              Instalment
            </label>
            <select
              id="wi-inst"
              className="w-full rounded-[10px] p-2.5 bg-white border border-slate-300 text-xs font-inter text-[#0F172A]"
            >
              <option>
                {formatDateDisplay(pendingInstalmentDue)} ·{' '}
                {formatINR(activeLoan.scheduled_installment_amount)} (Pending)
              </option>
            </select>
          </div>

          {/* FO-INT-227: Move by control: 7 days, 14 days, 30 days, 6 weeks (42 days), Custom date */}
          <div className="space-y-1.5">
            <span className="block text-xs font-inter font-semibold text-[#334155]">Move by</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { val: 7, label: '7 days' },
                  { val: 14, label: '14 days' },
                  { val: 30, label: '30 days' },
                  { val: 42, label: '6 weeks' },
                  { val: 'CUSTOM', label: 'Custom date' },
                ] as const
              ).map((opt) => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => {
                    setMoveByPreset(opt.val);
                    if (typeof opt.val === 'number') {
                      setCustomDate(addDaysISO(pendingInstalmentDue, opt.val));
                    }
                  }}
                  className={`py-2 px-3 rounded-[10px] text-xs font-inter font-semibold border transition-colors ${
                    moveByPreset === opt.val
                      ? 'btn-primary-gradient text-white border-transparent'
                      : 'bg-white text-[#334155] border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* FO-INT-228: Custom date picker */}
          {moveByPreset === 'CUSTOM' && (
            <div className="space-y-1">
              <label htmlFor="wi-custom-date" className="block text-xs font-inter font-semibold text-[#334155]">
                Custom moved date
              </label>
              <input
                id="wi-custom-date"
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full rounded-[10px] p-2.5 bg-white border border-slate-300 text-xs font-inter"
              />
              {customDateInvalid && (
                <p role="alert" className="text-xs font-semibold text-[#93000A]">
                  Choose a date after 17 Oct 2026.
                </p>
              )}
            </div>
          )}

          {/* FO-INT-229: Reference remittance select */}
          <div className="space-y-1.5">
            <label htmlFor="wi-remit" className="block text-xs font-inter font-semibold text-[#334155]">
              Reference remittance
            </label>
            {expectedOrDelayedRemit ? (
              <div className="space-y-1.5">
                <select
                  id="wi-remit"
                  className="w-full rounded-[10px] p-2.5 bg-white border border-slate-300 text-xs font-inter text-[#0F172A]"
                >
                  {household.seasonal_records
                    .filter(
                      (r) =>
                        r.remittance_status === 'EXPECTED' || r.remittance_status === 'DELAYED'
                    )
                    .map((r) => (
                      <option key={r.seasonal_record_id} value={r.seasonal_record_id}>
                        {formatDateDisplay(r.expected_remittance_date)} ·{' '}
                        {formatINR(r.expected_remittance_amount)} ·{' '}
                        {r.remittance_status === 'DELAYED'
                          ? 'Delayed'
                          : 'Expected, not received'}{' '}
                        ({r.seasonal_record_id})
                      </option>
                    ))}
                </select>
                {expectedOrDelayedRemit.remittance_status === 'DELAYED' && (
                  <EvidenceChip state="DELAYED" customLabel="Delayed remittance" size="sm" />
                )}
                {household.recommendation_status === 'CONFLICT_REQUIRES_REVIEW' && (
                  <EvidenceChip state="CONFLICT" customLabel="Sources disagree" size="sm" />
                )}
              </div>
            ) : (
              <div className="p-3 rounded-[10px] bg-slate-50 border border-dashed border-slate-300 text-xs text-[#475569]">
                No expected remittance is recorded. Timing against a remittance cannot be shown.
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setMoveByPreset(14);
                setCustomDate(addDaysISO(pendingInstalmentDue, 14));
              }}
              className="glass-1 px-4 py-2 rounded-[10px] text-xs font-inter font-semibold text-[#0F172A]"
            >
              Reset
            </button>
            <span className="text-[11px] font-inter text-[#475569]">
              Nothing on this page is stored
            </span>
          </div>
        </div>

        {/* Right Solid Panel: Result */}
        <div className="lg:col-span-7 surface-solid rounded-[24px] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A]">Result</h2>
            <EvidenceChip state="DERIVED" customLabel="ƒ Derived" />
          </div>

          {/* Horizontal Before / After Timeline */}
          <div className="p-5 rounded-[16px] bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex justify-between text-[11px] font-inter font-semibold text-[#475569]">
              <span>20 Oct 2026</span>
              <span>31 Oct (Lean ends)</span>
              <span>5 Nov (Expected remit)</span>
              <span>10 Dec 2026</span>
            </div>

            <div className="relative h-14 bg-white rounded-[12px] border border-slate-200 flex items-center px-4 overflow-hidden">
              {/* Lean season band 1–31 Oct */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[34%] bg-indigo-100/70 border-r border-indigo-300 flex items-end p-1"
                title="Lean season (household record: 1 Jul–31 Oct 2026)"
              >
                <span className="text-[9px] font-inter font-semibold text-[#4648D4]">
                  Lean season (to 31 Oct)
                </span>
              </div>

              {/* Original Marker */}
              <div
                className="absolute left-[22%] flex flex-col items-center -translate-x-1/2"
                title={`Original due date: ${formatDateDisplay(pendingInstalmentDue)}`}
              >
                <div className="w-4 h-4 rounded-full bg-white border-2 border-[#5558E8]" />
                <span className="text-[10px] font-inter font-bold text-[#0F172A] mt-0.5">
                  Original ({formatDateDisplay(pendingInstalmentDue).slice(0, 6)})
                </span>
              </div>

              {/* Expected Remittance Hollow Diamond */}
              {remitDate && (
                <div
                  className="absolute left-[48%] flex flex-col items-center -translate-x-1/2"
                  title={`Expected, not received: ${formatDateDisplay(remitDate)}`}
                >
                  <div className="w-4 h-4 rotate-45 bg-white border-2 border-dashed border-[#06B6D4]" />
                  <span className="text-[10px] font-inter font-bold text-[#0E7490] mt-0.5">
                    Expected ({formatDateDisplay(remitDate).slice(0, 6)})
                  </span>
                </div>
              )}

              {/* Moved Marker */}
              <div
                className="absolute flex flex-col items-center -translate-x-1/2 transition-all"
                style={{
                  left:
                    moveByPreset === 7
                      ? '42%'
                      : moveByPreset === 14
                      ? '66%'
                      : moveByPreset === 30
                      ? '82%'
                      : moveByPreset === 42
                      ? '91%'
                      : '66%',
                }}
              >
                <div className="w-4 h-4 rounded-full bg-[#EEF2FF] border-2 border-dashed border-[#5558E8]" />
                <span className="text-[10px] font-inter font-bold text-[#4648D4] mt-0.5">
                  Moved ({formatDateDisplay(evalResult.movedDate)})
                </span>
              </div>
            </div>
          </div>

          {/* Result Lines (Live Region) */}
          <div aria-live="polite" className="space-y-2.5 font-inter text-xs">
            {remitDate ? (
              <>
                <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200 font-semibold text-[#0F172A] flex items-center justify-between">
                  <span>{evalResult.originalSummary}</span>
                  <EvidenceChip state="DERIVED" size="sm" />
                </div>
                <div className="p-3.5 rounded-[12px] bg-[#EEF2FF] border border-[#5558E8]/30 font-bold text-[#0F172A] flex items-center justify-between">
                  <span>{evalResult.movedSummary}</span>
                  <EvidenceChip state="DERIVED" size="sm" />
                </div>
              </>
            ) : null}
            <div className="p-3.5 rounded-[12px] bg-slate-50 border border-slate-200 text-[#334155] flex items-center justify-between">
              <span>{evalResult.seasonNote}</span>
              <EvidenceChip state="DERIVED" size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: What this does not tell you (AC-S11-3, C-5, Q-08) */}
      <div className="surface-solid rounded-[24px] p-6 border-l-4 border-l-[#06B6D4] space-y-1.5">
        <h3 className="text-base font-bold text-[#0F172A]">What this does not tell you</h3>
        <p className="text-sm text-[#334155]">
          Does not show: cash balance, ability to pay, whether the remittance will arrive, changes to interest or fees, or a lender&apos;s decision. The remittance is expected, not received. Debt-service ratio is not shown because no household income data or formula exists (Q-08).
        </p>
      </div>
    </div>
  );
};
