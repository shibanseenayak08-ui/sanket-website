import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  formatDateDisplay,
  daysBetween,
  addDaysISO,
  evaluateWhatIfScenario,
  formatMaskedCount,
  getCompletenessBand,
  canRoleAccessHouseholdDetail,
  computeIndicatorCompletenessPct,
  resolveRecommendationState,
  mapStatusToOfficerLabel,
  mapDecisionToLabel,
  mapWarningTypeToPlainWords,
  mapReasonCodeToPlainWords,
  computeTimingGapNote,
  computeDeferralScenario,
  computeBalanceDelta,
  computeRedressDeadline,
  evaluateRecommendationGuards,
  validateHouseholdProfileContract,
  TEST_FIXTURES,
  filterHouseholdsByScope,
} from './sanketLogic.ts';

test('formatINR formats Indian currency with two decimals and handles null as Not recorded', () => {
  assert.equal(formatINR(4170), '₹4,170.00');
  assert.equal(formatINR(35000), '₹35,000.00');
  assert.equal(formatINR(123456.5), '₹1,23,456.50');
  assert.equal(formatINR(14583.33), '₹14,583.33');
  assert.equal(formatINR(null), 'Not recorded');
  assert.equal(formatINR(undefined), 'Not recorded');
});

test('formatDateDisplay converts ISO dates to unambiguous day month year', () => {
  assert.equal(formatDateDisplay('2026-10-28'), '28 Oct 2026');
  assert.equal(formatDateDisplay('2026-11-05'), '5 Nov 2026');
  assert.equal(formatDateDisplay(null), '—');
});

test('daysBetween and addDaysISO compute accurate date arithmetic', () => {
  assert.equal(daysBetween('2026-10-28', '2026-11-05'), 8);
  assert.equal(addDaysISO('2026-10-28', 14), '2026-11-11');
  assert.equal(daysBetween('2026-11-11', '2026-11-05'), -6);
});

test('evaluateWhatIfScenario computes SANKET-HH-000101 14-day deferral accurately (FO-TC-470)', () => {
  const result = evaluateWhatIfScenario('2026-10-28', 14, '2026-11-05', '2026-07-01', '2026-10-31');
  assert.equal(result.movedDate, '2026-11-11');
  assert.equal(result.originalSummary, 'Original: 28 Oct 2026 · 8 days before the expected remittance date');
  assert.equal(result.movedSummary, 'Moved: 11 Nov 2026 · 6 days after the expected remittance date');
  assert.equal(result.insideLeanSeasonOriginal, true);
  assert.equal(result.insideLeanSeasonMoved, false);
  assert.equal(result.seasonNote, 'Moved date is outside the recorded lean season (1 Jul 2026–31 Oct 2026).');
});

test('formatMaskedCount masks positive counts under 5 as < 5 (P-11, FO-TC-480)', () => {
  assert.equal(formatMaskedCount(3), '< 5');
  assert.equal(formatMaskedCount(4), '< 5');
  assert.equal(formatMaskedCount(5), '5');
  assert.equal(formatMaskedCount(12), '12');
  assert.equal(formatMaskedCount(0), '0');
});

test('getCompletenessBand follows HIGH >= 75, MEDIUM 50..<75, LOW < 50', () => {
  assert.equal(getCompletenessBand(100), 'HIGH');
  assert.equal(getCompletenessBand(75), 'HIGH');
  assert.equal(getCompletenessBand(50), 'MEDIUM');
  assert.equal(getCompletenessBand(12.5), 'LOW');
});

test('canRoleAccessHouseholdDetail restricts manager and compliance roles', () => {
  assert.equal(canRoleAccessHouseholdDetail('FIELD_OFFICER'), true);
  assert.equal(canRoleAccessHouseholdDetail('PORTFOLIO_MANAGER'), false);
  assert.equal(canRoleAccessHouseholdDetail('COMPLIANCE_REVIEWER'), false);
});

test('Day 1 Spec D8: computeIndicatorCompletenessPct enforces <90 day freshness window across 8 indicators', () => {
  const res = computeIndicatorCompletenessPct([10, null, 12, 12, 5, 111, 14, null]);
  assert.equal(res.validCount, 5);
  assert.equal(res.pct, 62.5);
  assert.equal(res.band, 'MEDIUM');

  const resHigh = computeIndicatorCompletenessPct([10, null, 12, 12, 5, 5, 14, 111]);
  assert.equal(resHigh.validCount, 6);
  assert.equal(resHigh.pct, 75);
  assert.equal(resHigh.band, 'HIGH');
});

test('Day 1 Spec D13: resolveRecommendationState enforces >=3 evidence signals and conflict/completeness fallback', () => {
  assert.deepEqual(
    resolveRecommendationState({
      hasConflict: true,
      completenessBand: 'HIGH',
      evidenceCount: 4,
      rulesConfigured: true,
      proposedActionCode: 'LEND_DIFFERENTLY',
    }),
    { recommendation_status: 'CONFLICT_REQUIRES_REVIEW', action_code: null }
  );

  assert.deepEqual(
    resolveRecommendationState({
      hasConflict: false,
      completenessBand: 'MEDIUM',
      evidenceCount: 2,
      rulesConfigured: true,
      proposedActionCode: 'LEND_DIFFERENTLY',
    }),
    { recommendation_status: 'INSUFFICIENT_DATA', action_code: null }
  );

  assert.deepEqual(
    resolveRecommendationState({
      hasConflict: false,
      completenessBand: 'MEDIUM',
      evidenceCount: 3,
      rulesConfigured: true,
      proposedActionCode: 'LEND_DIFFERENTLY',
    }),
    { recommendation_status: 'READY_FOR_REVIEW', action_code: 'LEND_DIFFERENTLY' }
  );
});

test('PRD/TRD Section 10.6–10.10 Mappers: mapStatusToOfficerLabel, mapDecisionToLabel, mapWarningTypeToPlainWords, mapReasonCodeToPlainWords', () => {
  assert.equal(
    mapStatusToOfficerLabel('INSUFFICIENT_DATA', ['DATA_COMPLETENESS_LOW']).label,
    'Insufficient data · Field visit recommended'
  );
  assert.equal(
    mapStatusToOfficerLabel('INSUFFICIENT_DATA', ['DECISION_RULES_PENDING']).label,
    'No suggestion · Decision rules pending'
  );
  assert.equal(
    mapStatusToOfficerLabel('CONFLICT_REQUIRES_REVIEW').label,
    'Conflict · Officer verification required'
  );
  assert.equal(
    mapStatusToOfficerLabel('READY_FOR_REVIEW').label,
    'Ready for review'
  );

  assert.equal(mapDecisionToLabel('APPROVED'), 'Approve');
  assert.equal(mapDecisionToLabel('MODIFIED'), 'Modify');
  assert.equal(mapDecisionToLabel('REJECTED'), 'Reject');
  assert.equal(mapDecisionToLabel('ESCALATED'), 'Escalate');
  assert.equal(mapDecisionToLabel('PENDING'), 'Pending human review');

  assert.equal(mapWarningTypeToPlainWords('STALE_RECORD'), 'Older than 90 days');
  assert.equal(mapWarningTypeToPlainWords('CONFLICT_DETECTED'), 'Conflicting values across sources');

  assert.equal(
    mapReasonCodeToPlainWords('DECISION_RULES_PENDING').tooltip,
    'No approved decision rules exist yet.'
  );
});

test('PRD/TRD Section 11.3 DerivedCalculator: computeTimingGapNote, computeDeferralScenario, computeBalanceDelta, computeRedressDeadline', () => {
  assert.equal(
    computeTimingGapNote('2026-10-28', '2026-11-05'),
    'Instalment falls 8 days before the expected remittance date'
  );
  const def6w = computeDeferralScenario('2026-10-28', 42, '2026-11-05', '2026-07-01', '2026-10-31');
  assert.equal(def6w.deferredDueDateISO, '2026-12-09');
  assert.equal(def6w.deferredGapDays, -34);

  const delta = computeBalanceDelta(38000, 41200);
  assert.equal(delta.deltaAmount, 3200);
  assert.equal(delta.displayLabel, 'Difference: ₹3,200.00');

  const redress = computeRedressDeadline('2026-10-17T08:00:00Z', 7);
  assert.equal(redress.deadlineDateISO, '2026-10-24');
  assert.equal(redress.provisionalLabel, 'Provisional — pending legal sign-off (Q-17)');
});

test('PRD/TRD Section 11.4 & 14.1: RecommendationPresenter Guards 1–5 and Fixtures FX-01..FX-10', () => {
  // FX-01: Future READY_FOR_REVIEW + LEND_DIFFERENTLY with 3 evidence items
  const fx01 = evaluateRecommendationGuards(TEST_FIXTURES['FX-01'].payload);
  assert.equal(fx01.canRenderActionCode, true);
  assert.equal(fx01.effectiveActionCode, 'LEND_DIFFERENTLY');
  assert.equal(fx01.effectiveStatus, 'READY_FOR_REVIEW');

  // FX-02: Future READY_FOR_REVIEW + LLM explanation -> labelled Supplementary explanation
  const fx02 = evaluateRecommendationGuards(TEST_FIXTURES['FX-02'].payload);
  assert.equal(fx02.showSupplementaryExplanation, true);
  assert.equal(
    fx02.supplementaryBannerLabel,
    'Supplementary explanation. The evidence above is the basis.'
  );

  // FX-03: Guard 5 rejects READY_FOR_REVIEW when evidence.length < 3 (FO-TC-461)
  const fx03 = evaluateRecommendationGuards(TEST_FIXTURES['FX-03'].payload);
  assert.equal(fx03.canRenderActionCode, false);
  assert.equal(fx03.effectiveActionCode, null);
  assert.equal(fx03.effectiveStatus, 'INSUFFICIENT_DATA');
  assert.equal(fx03.guardViolationBanner, 'This record failed a data check');

  // FX-04: ContractValidator rejects composite_score (FO-TC-451)
  const fx04 = validateHouseholdProfileContract(TEST_FIXTURES['FX-04'].payload);
  assert.equal(fx04.valid, false);
  assert.equal(fx04.OfficerBanner, 'This record failed a data check');

  // FX-05: ScopeFilter blocks Field Officer from FSP-SYN-02 household SANKET-HH-000102 (FO-TC-411)
  const scoped = filterHouseholdsByScope(
    [
      { household_id: 'SANKET-HH-000101', fsp_partner_id: 'FSP-SYN-01' },
      { household_id: 'SANKET-HH-000102', fsp_partner_id: 'FSP-SYN-02' },
    ],
    'FIELD_OFFICER',
    'FSP-SYN-01'
  );
  assert.equal(scoped.length, 1);
  assert.equal(scoped[0].household_id, 'SANKET-HH-000101');

  // FX-06: Guard 2 rejects INSUFFICIENT_DATA with non-null action_code
  const fx06 = validateHouseholdProfileContract(TEST_FIXTURES['FX-06'].payload);
  assert.equal(fx06.valid, false);
  assert.equal(fx06.OfficerBanner, 'This record failed a data check');

  // FX-07: Guard 4 hides LLM explanation when action_code is null
  const fx07 = evaluateRecommendationGuards(TEST_FIXTURES['FX-07'].payload);
  assert.equal(fx07.showSupplementaryExplanation, false);
});
