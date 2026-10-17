export type RoleId = 'FIELD_OFFICER' | 'PORTFOLIO_MANAGER' | 'COMPLIANCE_REVIEWER';

export type ScreenId =
  | 'S01' // Demo Entry
  | 'S02' // Overview
  | 'S03' // Household Worklist
  | 'S04' // Households
  | 'S05' // Profile: Overview
  | 'S06' // Profile: Financial Health
  | 'S07' // Profile: Seasonal Cash Flow
  | 'S08' // Profile: Loans and Repayments
  | 'S09' // Profile: Savings and Check-ins
  | 'S05_DATA' // Profile Tab 6: Data and Sources
  | 'S05_REVIEWS' // Profile Tab 7: Review History
  | 'S10' // Recommendation Review (Queue)
  | 'S10_DETAIL' // Recommendation Review (Detail)
  | 'S11' // What If? Simulator
  | 'S12' // Portfolio Insights
  | 'S13' // Data Sources and Quality
  | 'S14' // Conflicts and Verification
  | 'S16' // Audit History
  | 'S17' // Governance and Compliance
  | 'S18' // Notifications and Follow-ups
  | 'S19_PAGE' // Global Search Page
  | 'S20' // Settings and Preferences
  | 'S21'; // States Gallery

export type EvidenceState =
  | 'OBSERVED'
  | 'EXPECTED'
  | 'DELAYED'
  | 'DERIVED'
  | 'PROVISIONAL'
  | 'MISSING'
  | 'STALE'
  | 'CONFLICT'
  | 'NOT_CONFIGURED';

export type RecommendationStatus =
  | 'READY_FOR_REVIEW'
  | 'INSUFFICIENT_DATA'
  | 'CONFLICT_REQUIRES_REVIEW';

export type CompletenessBand = 'HIGH' | 'MEDIUM' | 'LOW';

export type MigrationStatus = 'ACTIVE_MIGRANT' | 'RETURNED_MIGRANT' | 'NO_MIGRATION' | 'UNKNOWN';

export type RemittanceStatus = 'CONFIRMED' | 'EXPECTED' | 'DELAYED' | 'UNKNOWN';

export type RepaymentStatus =
  | 'PAID_ON_TIME'
  | 'PAID_LATE'
  | 'PARTIAL'
  | 'MISSED'
  | 'PENDING'
  | 'UNKNOWN';

export type OfficerDecision = 'APPROVED' | 'MODIFIED' | 'OVERRIDDEN';

/**
 * Formats an INR amount with Indian digit grouping and always two decimals:
 * e.g., 4170 -> "₹4,170.00", 123456 -> "₹1,23,456.00"
 * Null or undefined returns "Not recorded"
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'Not recorded';
  }
  const fixed = Math.abs(amount).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  let formattedInt = intPart;
  if (intPart.length > 3) {
    const lastThree = intPart.slice(-3);
    const otherNumbers = intPart.slice(0, -3);
    formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  const sign = amount < 0 ? '-' : '';
  return `${sign}₹${formattedInt}.${decPart}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats an ISO date string "YYYY-MM-DD" into "28 Oct 2026"
 */
export function formatDateDisplay(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const year = match[1];
  const monthIdx = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  if (monthIdx < 0 || monthIdx > 11) return isoDate;
  return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
}

/**
 * Computes day difference between two ISO dates (dateB - dateA in days)
 * Positive means dateB is after dateA.
 */
export function daysBetween(isoDateA: string, isoDateB: string): number {
  const a = new Date(`${isoDateA.slice(0, 10)}T00:00:00Z`).getTime();
  const b = new Date(`${isoDateB.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Adds N days to an ISO date "YYYY-MM-DD" and returns new ISO date "YYYY-MM-DD"
 */
export function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Checks whether an ISO date falls inclusive within [startDate, endDate]
 */
export function isDateWithinPeriod(targetIso: string, startIso: string, endIso: string): boolean {
  const t = targetIso.slice(0, 10);
  const s = startIso.slice(0, 10);
  const e = endIso.slice(0, 10);
  return t >= s && t <= e;
}

/**
 * Evaluates What-If scenario (S11): pure date-difference and season containment logic
 */
export interface WhatIfEvaluation {
  originalDate: string;
  movedDate: string;
  remittanceDate: string;
  originalDiffDays: number; // positive = before remittance, negative = after
  movedDiffDays: number; // positive = before remittance, negative = after
  originalSummary: string;
  movedSummary: string;
  insideLeanSeasonOriginal: boolean;
  insideLeanSeasonMoved: boolean;
  seasonNote: string;
}

export function evaluateWhatIfScenario(
  originalDueIso: string,
  moveByDays: number,
  expectedRemittanceIso: string,
  leanStartIso = '2026-07-01',
  leanEndIso = '2026-10-31'
): WhatIfEvaluation {
  const movedDate = addDaysISO(originalDueIso, moveByDays);
  // days until remittance from original date:
  const origToRemit = daysBetween(originalDueIso, expectedRemittanceIso);
  const movedToRemit = daysBetween(movedDate, expectedRemittanceIso);

  const formatRel = (dateStr: string, diffToRemit: number) => {
    const disp = formatDateDisplay(dateStr);
    if (diffToRemit > 0) {
      return `${disp} · ${diffToRemit} ${diffToRemit === 1 ? 'day' : 'days'} before the expected remittance date`;
    } else if (diffToRemit < 0) {
      const after = Math.abs(diffToRemit);
      return `${disp} · ${after} ${after === 1 ? 'day' : 'days'} after the expected remittance date`;
    }
    return `${disp} · On the same day as the expected remittance date`;
  };

  const insideOrig = isDateWithinPeriod(originalDueIso, leanStartIso, leanEndIso);
  const insideMoved = isDateWithinPeriod(movedDate, leanStartIso, leanEndIso);

  let seasonNote = '';
  const periodLabel = `(${formatDateDisplay(leanStartIso)}–${formatDateDisplay(leanEndIso)})`;
  if (insideOrig && insideMoved) {
    seasonNote = `Both dates fall inside the household's recorded lean season ${periodLabel}.`;
  } else if (insideOrig && !insideMoved) {
    seasonNote = `Moved date is outside the recorded lean season ${periodLabel}.`;
  } else if (!insideOrig && insideMoved) {
    seasonNote = `Moved date falls inside the recorded lean season ${periodLabel}.`;
  } else {
    seasonNote = `Both dates are outside the recorded lean season ${periodLabel}.`;
  }

  return {
    originalDate: originalDueIso,
    movedDate,
    remittanceDate: expectedRemittanceIso,
    originalDiffDays: origToRemit,
    movedDiffDays: movedToRemit,
    originalSummary: `Original: ${formatRel(originalDueIso, origToRemit)}`,
    movedSummary: `Moved: ${formatRel(movedDate, movedToRemit)}`,
    insideLeanSeasonOriginal: insideOrig,
    insideLeanSeasonMoved: insideMoved,
    seasonNote,
  };
}

/**
 * Small-group masking rule (S12): counts > 0 and < 5 show "<5"
 */
export function formatMaskedCount(count: number): string {
  if (count > 0 && count < 5) {
    return '< 5';
  }
  return String(count);
}

/**
 * Completeness band classification (Documented: HIGH >= 75, MEDIUM 50 to < 75, LOW < 50)
 */
export function getCompletenessBand(pct: number): CompletenessBand {
  if (pct >= 75) return 'HIGH';
  if (pct >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Role access boundary helper
 */
export function canRoleAccessHouseholdDetail(role: RoleId): boolean {
  return role === 'FIELD_OFFICER';
}

/**
 * Day 1 Spec Decision D8 & Section 9:
 * Computes data_completeness_pct from 8 financial-health indicator readiness checks
 * within a 90-day freshness window (< 90 days old). No partial credit per indicator.
 */
export function computeIndicatorCompletenessPct(
  indicatorFreshDays: (number | null)[]
): { pct: number; band: CompletenessBand; validCount: number } {
  const total = 8;
  const validCount = indicatorFreshDays.slice(0, total).filter(
    (days) => days !== null && days >= 0 && days < 90
  ).length;
  const pct = (validCount / total) * 100;
  return {
    pct,
    band: getCompletenessBand(pct),
    validCount,
  };
}

/**
 * Day 1 Spec Decision D13 & Section 10:
 * Validates whether a recommendation object in sanket.household_profile.v1 is allowed
 * to present READY_FOR_REVIEW or must fall back to INSUFFICIENT_DATA / CONFLICT_REQUIRES_REVIEW.
 */
export function resolveRecommendationState(params: {
  hasConflict: boolean;
  completenessBand: CompletenessBand;
  evidenceCount: number;
  rulesConfigured: boolean;
  proposedActionCode: string | null;
}): {
  recommendation_status: RecommendationStatus;
  action_code: string | null;
} {
  if (params.hasConflict) {
    return {
      recommendation_status: 'CONFLICT_REQUIRES_REVIEW',
      action_code: null,
    };
  }
  if (
    !params.rulesConfigured ||
    params.completenessBand === 'LOW' ||
    params.evidenceCount < 3 ||
    !params.proposedActionCode
  ) {
    return {
      recommendation_status: 'INSUFFICIENT_DATA',
      action_code: null,
    };
  }
  return {
    recommendation_status: 'READY_FOR_REVIEW',
    action_code: params.proposedActionCode,
  };
}

export type ActionCode =
  | 'EXTEND_CREDIT'
  | 'LEND_DIFFERENTLY'
  | 'RECOMMEND_PROTECTION'
  | 'CHECK_IN'
  | 'WAIT';

/**
 * CF-02 & Section 11.3: The five actions and their documented one-line meanings
 */
export const ACTION_FRAMEWORK_MEANINGS: Record<
  ActionCode,
  {
    code: ActionCode;
    shortName: string;
    meaningShown: string;
    evidenceRule: string;
    extraDisplay: string;
    whatSanketDoesNotDo: string;
  }
> = {
  EXTEND_CREDIT: {
    code: 'EXTEND_CREDIT',
    shortName: 'Extend credit',
    meaningShown: 'Extend credit — timing or structure adjusted',
    evidenceRule: 'At least 3 entries (CF-04)',
    extraDisplay: '—',
    whatSanketDoesNotDo: 'Does not approve, size or disburse a loan; shows no amount or limit',
  },
  LEND_DIFFERENTLY: {
    code: 'LEND_DIFFERENTLY',
    shortName: 'Lend differently',
    meaningShown: 'Lend differently — flexible EMI, seasonal schedule',
    evidenceRule: 'At least 3 entries',
    extraDisplay: 'Timing banner and S07 link emphasised',
    whatSanketDoesNotDo: 'Does not change a schedule',
  },
  RECOMMEND_PROTECTION: {
    code: 'RECOMMEND_PROTECTION',
    shortName: 'Recommend protection',
    meaningShown: 'Recommend protection — insurance, savings product',
    evidenceRule: 'At least 3 entries',
    extraDisplay: '—',
    whatSanketDoesNotDo: 'Does not name or sell a product',
  },
  CHECK_IN: {
    code: 'CHECK_IN',
    shortName: 'Check in',
    meaningShown: 'Check in — support, financial coaching',
    evidenceRule:
      'At least 3 named, influenceable signals; never caste, occupation or region as the main driver (CF-05)',
    extraDisplay: '—',
    whatSanketDoesNotDo: 'Does not schedule a visit (Q-02)',
  },
  WAIT: {
    code: 'WAIT',
    shortName: 'Wait',
    meaningShown: 'Wait — time-bounded; reassessment trigger specified',
    evidenceRule: 'As CHECK_IN (CF-05)',
    extraDisplay:
      'Reassess within 60 days of this suggestion (default). Waiting does not lock the household out of credit.',
    whatSanketDoesNotDo: 'Does not store the reassessment date (Q-10)',
  },
};

/**
 * Proposal P-02 & C-8: Officer-facing status labels used consistently across S03, S04, S05, S10
 */
export function mapStatusToOfficerLabel(
  status: RecommendationStatus | null | undefined,
  reasonCodes: string[] = []
): { label: string; chipState: EvidenceState } {
  if (!status) {
    return {
      label: 'No suggestion · Decision rules pending',
      chipState: 'NOT_CONFIGURED',
    };
  }
  if (status === 'CONFLICT_REQUIRES_REVIEW') {
    return {
      label: 'Conflict · Officer verification required',
      chipState: 'CONFLICT',
    };
  }
  if (status === 'READY_FOR_REVIEW') {
    return {
      label: 'Ready for review',
      chipState: 'OBSERVED',
    };
  }
  if (reasonCodes.includes('DATA_COMPLETENESS_LOW')) {
    return {
      label: 'Insufficient data · Field visit recommended',
      chipState: 'MISSING',
    };
  }
  return {
    label: 'No suggestion · Decision rules pending',
    chipState: 'NOT_CONFIGURED',
  };
}

/**
 * Proposal P-03: Decision labels avoiding "Approve"
 */
export function mapDecisionToOfficerLabel(decision: OfficerDecision | null | undefined): string {
  if (decision === 'APPROVED') return 'Agree with the suggestion';
  if (decision === 'MODIFIED') return 'Modify the suggestion';
  if (decision === 'OVERRIDDEN') return 'Override the suggestion';
  return 'Not reviewed yet';
}

/**
 * PRD/TRD Section 10.7: Concise decision label mapper for tables & badges
 */
export function mapDecisionToLabel(decision: string | null | undefined): string {
  if (decision === 'APPROVED') return 'Approve';
  if (decision === 'MODIFIED') return 'Modify';
  if (decision === 'OVERRIDDEN') return 'Override';
  if (decision === 'REJECTED') return 'Reject';
  if (decision === 'ESCALATED') return 'Escalate';
  return 'Pending human review';
}

/**
 * Section 10.10 & C-9: Maps warning_type to plain-language UI label
 */
export function mapWarningTypeToLabel(warningType: string): string {
  switch (warningType) {
    case 'UNVERIFIED_RECORD':
      return 'Not yet verified';
    case 'STALE_DATA':
    case 'STALE_RECORD':
      return 'Older than 90 days';
    case 'CONFLICT_DETECTED':
      return 'Sources disagree';
    case 'MISSING_DATA':
      return 'Missing data';
    case 'INCOMPLETE_CHECKIN':
      return 'Check-in incomplete';
    case 'UNKNOWN_REPAYMENT_OUTCOME':
      return 'Repayment outcome unknown';
    default:
      return `${warningType} (unrecognised)`;
  }
}

export function mapWarningTypeToPlainWords(warningType: string): string {
  if (warningType === 'STALE_RECORD' || warningType === 'STALE_DATA') {
    return 'Older than 90 days';
  }
  if (warningType === 'CONFLICT_DETECTED') {
    return 'Conflicting values across sources';
  }
  return mapWarningTypeToLabel(warningType);
}

/**
 * FO-INT-203: Maps reason_codes[] to plain-language explanations
 */
export function mapReasonCodeToPlainWords(code: string): { label: string; tooltip: string } {
  switch (code) {
    case 'DECISION_RULES_PENDING':
      return {
        label: 'Decision rules pending (DECISION_RULES_PENDING)',
        tooltip: 'No approved decision rules exist yet.',
      };
    case 'DATA_COMPLETENESS_LOW':
      return {
        label: 'Data completeness low (DATA_COMPLETENESS_LOW)',
        tooltip: 'Less than half of the eight indicators have current data.',
      };
    case 'UNRESOLVED_CONFLICT_REQUIRES_OFFICER_REVIEW':
      return {
        label: 'Unresolved conflict requires officer review',
        tooltip: 'Two sources disagree and no verified value exists.',
      };
    default:
      return {
        label: code,
        tooltip: 'No description available.',
      };
  }
}

/**
 * Proposal P-10 & FO-FR-034: Record age formatting (over 90 days -> "Older than 90 days", never "Stale")
 */
export function formatRecordAge(freshnessDays: number): {
  ageText: string;
  isOlderThan90Days: boolean;
  badgeLabel: string | null;
} {
  const isOld = freshnessDays > 90;
  return {
    ageText: `${freshnessDays} ${freshnessDays === 1 ? 'day' : 'days'}`,
    isOlderThan90Days: isOld,
    badgeLabel: isOld ? 'Older than 90 days' : null,
  };
}

/**
 * PRD/TRD Section 11.3: Derived timing gap note
 */
export function computeTimingGapNote(
  nextDueDateIso?: string | null,
  expectedRemittanceIso?: string | null
): string | null {
  if (!nextDueDateIso || !expectedRemittanceIso) return null;
  const diff = daysBetween(nextDueDateIso, expectedRemittanceIso);
  if (diff > 0) {
    return `Instalment falls ${diff} ${diff === 1 ? 'day' : 'days'} before the expected remittance date`;
  }
  if (diff < 0) {
    const after = Math.abs(diff);
    return `Instalment falls ${after} ${after === 1 ? 'day' : 'days'} after the expected remittance date`;
  }
  return 'Instalment falls on the same day as the expected remittance date';
}

/**
 * PRD/TRD Section 11.3: Deferral scenario calculator
 */
export function computeDeferralScenario(
  originalDueIso: string,
  deferralDays: number,
  expectedRemittanceIso: string,
  leanStartIso = '2026-07-01',
  leanEndIso = '2026-10-31'
): {
  deferredDueDateISO: string;
  deferredGapDays: number;
  evaluation: WhatIfEvaluation;
} {
  const evaluation = evaluateWhatIfScenario(
    originalDueIso,
    deferralDays,
    expectedRemittanceIso,
    leanStartIso,
    leanEndIso
  );
  return {
    deferredDueDateISO: evaluation.movedDate,
    deferredGapDays: evaluation.movedDiffDays,
    evaluation,
  };
}

/**
 * PRD/TRD Section 11.3: Balance delta calculator for conflict comparison cards
 */
export function computeBalanceDelta(
  amountA: number,
  amountB: number
): { deltaAmount: number; displayLabel: string } {
  const deltaAmount = Math.abs(amountB - amountA);
  return {
    deltaAmount,
    displayLabel: `Difference: ${formatINR(deltaAmount)}`,
  };
}

/**
 * CF-17, FO-FR-028 & P-01: Redress deadline calculator
 * Supports 1-arg form (returns formatted 30-day review window string)
 * and 2-arg form (returns structured SLA deadline object with provisional Q-17 label).
 */
export function computeRedressDeadline(generatedAtIso?: string): string;
export function computeRedressDeadline(
  createdAtIso: string,
  targetResolutionDays: number
): { deadlineDateISO: string; deadlineDisplay: string; provisionalLabel: string };
export function computeRedressDeadline(
  isoDate = '2026-10-14',
  targetResolutionDays?: number
): string | { deadlineDateISO: string; deadlineDisplay: string; provisionalLabel: string } {
  if (typeof targetResolutionDays === 'number') {
    const deadlineDateISO = addDaysISO(isoDate, targetResolutionDays);
    return {
      deadlineDateISO,
      deadlineDisplay: formatDateDisplay(deadlineDateISO),
      provisionalLabel: 'Provisional — pending legal sign-off (Q-17)',
    };
  }
  return formatDateDisplay(addDaysISO(isoDate, 30));
}

/**
 * CF-17 & FO-FR-027: WAIT reassessment window = suggestion date + 60 days (default)
 */
export function computeWaitReassessmentDate(suggestionDateIso = '2026-10-17'): string {
  return formatDateDisplay(addDaysISO(suggestionDateIso, 60));
}

/**
 * Section 11.4 & TRD 12.4 RecommendationPresenter:
 * Enforces all 7 guards on incoming recommendation + evidence data
 */
export interface PresentedRecommendation {
  effectiveStatus: RecommendationStatus;
  statusLabel: string;
  statusChipState: EvidenceState;
  displayedActionCode: ActionCode | null;
  displayedActionLabel: string;
  displayedActionMeaning: string | null;
  guardMessage: string | null;
  waitReassessmentNotice: string | null;
  redressNotice: string;
  confidenceDisplay: 'Not configured';
  explanationText: string;
  isExplanationSupplementary: boolean;
}

export function presentRecommendation(params: {
  recommendation: {
    recommendation_status?: string | null;
    action_code?: string | null;
    reason_codes?: string[];
    confidence_band?: string | null;
    llm_explanation?: string | null;
  } | null;
  evidenceCount: number;
  recordStatus?: 'ACTIVE' | 'ARCHIVED' | 'CONSENT_WITHDRAWN';
  generatedAtIso?: string;
}): PresentedRecommendation {
  const generatedAt = params.generatedAtIso || '2026-10-14';
  const redressDeadline = computeRedressDeadline(generatedAt);
  const redressNotice = `A household may ask for a review within 30 days of a suggestion (until ${redressDeadline}).`;

  // Guard 7: Household CONSENT_WITHDRAWN
  if (params.recordStatus === 'CONSENT_WITHDRAWN' || params.recordStatus === 'ARCHIVED') {
    return {
      effectiveStatus: 'INSUFFICIENT_DATA',
      statusLabel: 'This household is no longer available.',
      statusChipState: 'MISSING',
      displayedActionCode: null,
      displayedActionLabel: 'None yet',
      displayedActionMeaning: null,
      guardMessage: 'This household is no longer available.',
      waitReassessmentNotice: null,
      redressNotice,
      confidenceDisplay: 'Not configured',
      explanationText: 'No explanation has been generated.',
      isExplanationSupplementary: false,
    };
  }

  // Guard 3: recommendation object null -> Treat as INSUFFICIENT_DATA (Q-17)
  if (!params.recommendation) {
    return {
      effectiveStatus: 'INSUFFICIENT_DATA',
      statusLabel: 'No suggestion · Decision rules pending',
      statusChipState: 'NOT_CONFIGURED',
      displayedActionCode: null,
      displayedActionLabel: 'None yet',
      displayedActionMeaning: null,
      guardMessage: null,
      waitReassessmentNotice: null,
      redressNotice,
      confidenceDisplay: 'Not configured',
      explanationText: 'No explanation has been generated.',
      isExplanationSupplementary: false,
    };
  }

  const rawStatus = params.recommendation.recommendation_status;
  const rawAction = params.recommendation.action_code;
  const reasons = params.recommendation.reason_codes || [];

  // Guard 5: llm_explanation present
  const hasExplanation = Boolean(
    params.recommendation.llm_explanation && params.recommendation.llm_explanation.trim().length > 0
  );
  const explanationText = hasExplanation
    ? params.recommendation.llm_explanation!.trim()
    : 'No explanation has been generated.';

  // Guard 4: Unknown action_code or status
  const validStatuses = ['READY_FOR_REVIEW', 'INSUFFICIENT_DATA', 'CONFLICT_REQUIRES_REVIEW'];
  const validActions = Object.keys(ACTION_FRAMEWORK_MEANINGS);
  if (
    (rawStatus && !validStatuses.includes(rawStatus)) ||
    (rawAction && !validActions.includes(rawAction))
  ) {
    return {
      effectiveStatus: 'INSUFFICIENT_DATA',
      statusLabel: 'Unrecognised suggestion. Contact the project team.',
      statusChipState: 'CONFLICT',
      displayedActionCode: null,
      displayedActionLabel: 'None yet',
      displayedActionMeaning: null,
      guardMessage: 'Unrecognised suggestion. Contact the project team.',
      waitReassessmentNotice: null,
      redressNotice,
      confidenceDisplay: 'Not configured',
      explanationText,
      isExplanationSupplementary: hasExplanation,
    };
  }

  // Guard 1 & Guard 2: Action (including WAIT or CHECK_IN) with fewer than 3 evidence entries
  if (rawAction && params.evidenceCount < 3) {
    return {
      effectiveStatus: 'INSUFFICIENT_DATA',
      statusLabel: 'Insufficient data · Field visit recommended',
      statusChipState: 'MISSING',
      displayedActionCode: null,
      displayedActionLabel: 'None yet',
      displayedActionMeaning: null,
      guardMessage: 'This suggestion cannot be shown: fewer than three evidence signals.',
      waitReassessmentNotice: null,
      redressNotice,
      confidenceDisplay: 'Not configured',
      explanationText,
      isExplanationSupplementary: hasExplanation,
    };
  }

  // Normal resolution when action_code is valid and >= 3 evidence signals
  if (rawStatus === 'READY_FOR_REVIEW' && rawAction && params.evidenceCount >= 3) {
    const actionKey = rawAction as ActionCode;
    const actionMeta = ACTION_FRAMEWORK_MEANINGS[actionKey];
    return {
      effectiveStatus: 'READY_FOR_REVIEW',
      statusLabel: 'Ready for review',
      statusChipState: 'OBSERVED',
      displayedActionCode: actionKey,
      displayedActionLabel: `${actionMeta.shortName} (${actionKey})`,
      displayedActionMeaning: actionMeta.meaningShown,
      guardMessage: null,
      waitReassessmentNotice:
        actionKey === 'WAIT'
          ? 'Reassess within 60 days of this suggestion (default). Waiting does not lock the household out of credit.'
          : null,
      redressNotice,
      confidenceDisplay: 'Not configured',
      explanationText,
      isExplanationSupplementary: hasExplanation,
    };
  }

  const mapped = mapStatusToOfficerLabel(
    (rawStatus as RecommendationStatus) || 'INSUFFICIENT_DATA',
    reasons
  );

  return {
    effectiveStatus: (rawStatus as RecommendationStatus) || 'INSUFFICIENT_DATA',
    statusLabel: mapped.label,
    statusChipState: mapped.chipState,
    displayedActionCode: null,
    displayedActionLabel: 'None yet',
    displayedActionMeaning: null,
    guardMessage: null,
    waitReassessmentNotice: null,
    redressNotice,
    confidenceDisplay: 'Not configured',
    explanationText,
    isExplanationSupplementary: hasExplanation,
  };
}

/**
 * TRD 12.4 ScopeFilter:
 * Enforces fsp_partner_id boundary (FO-FR-002, CF-07) and consent exclusion (FO-FR-018, CF-15)
 */
export function filterCohortForOfficer<
  T extends {
    household_id: string;
    fsp_partner_id: string;
    record_status?: string;
  }
>(rows: T[], assignedPartnerId = 'FSP-SYN-01'): T[] {
  return rows.filter(
    (r) =>
      r.fsp_partner_id === assignedPartnerId &&
      (!r.record_status || r.record_status === 'ACTIVE')
  );
}

/**
 * PRD/TRD Section 11.2 ScopeFilter by Role & Partner
 */
export function filterHouseholdsByScope<
  T extends {
    household_id: string;
    fsp_partner_id: string;
    record_status?: string;
  }
>(rows: T[], role: RoleId, assignedPartnerId = 'FSP-SYN-01'): T[] {
  if (role === 'FIELD_OFFICER') {
    return filterCohortForOfficer(rows, assignedPartnerId);
  }
  return rows.filter((r) => !r.record_status || r.record_status === 'ACTIVE');
}

/**
 * PRD/TRD Section 11.1 ContractValidator:
 * Validates sanket.household_profile.v1 payload invariants (D6 no composite_score, D13 >=3 evidence, etc.)
 */
export function validateHouseholdProfileContract(payload: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
  OfficerBanner: string;
} {
  const errors: string[] = [];

  if ('composite_score' in payload && payload.composite_score !== undefined) {
    errors.push('Forbidden field composite_score detected (violates Decision D6).');
  }
  const dimScores = payload.dimension_scores as Record<string, unknown> | undefined;
  if (dimScores && 'composite_score' in dimScores && dimScores.composite_score !== undefined) {
    errors.push('Forbidden field dimension_scores.composite_score detected (violates Decision D6).');
  }

  const rec = payload.recommendation as Record<string, unknown> | null | undefined;
  const ev = Array.isArray(payload.evidence) ? payload.evidence : [];

  if (rec) {
    const status = rec.recommendation_status as string | undefined;
    const actionCode = rec.action_code as string | null | undefined;
    if (
      (status === 'INSUFFICIENT_DATA' || status === 'CONFLICT_REQUIRES_REVIEW') &&
      actionCode !== null &&
      actionCode !== undefined
    ) {
      errors.push(
        `recommendation.action_code must be null when recommendation_status is ${status}.`
      );
    }
    if (status === 'READY_FOR_REVIEW' && ev.length < 3) {
      errors.push(
        `READY_FOR_REVIEW requires at least 3 evidence entries; found ${ev.length} (Decision D13).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    OfficerBanner: errors.length === 0 ? 'Contract valid' : 'This record failed a data check',
  };
}

/**
 * PRD/TRD Section 11.4 evaluateRecommendationGuards:
 * Evaluates Guards 1-5 on a contract payload
 */
export function evaluateRecommendationGuards(payload: Record<string, unknown>): {
  canRenderActionCode: boolean;
  effectiveActionCode: ActionCode | null;
  effectiveStatus: RecommendationStatus;
  showSupplementaryExplanation: boolean;
  supplementaryBannerLabel: string;
  guardViolationBanner: string | null;
} {
  const rec = payload.recommendation as
    | {
        recommendation_status?: string | null;
        action_code?: string | null;
        reason_codes?: string[];
        llm_explanation?: string | null;
      }
    | null
    | undefined;
  const ev = Array.isArray(payload.evidence) ? payload.evidence : [];

  const presented = presentRecommendation({
    recommendation: rec || null,
    evidenceCount: ev.length,
    recordStatus: (payload.record_status as 'ACTIVE' | 'CONSENT_WITHDRAWN' | undefined) || 'ACTIVE',
  });

  const canRenderActionCode = presented.displayedActionCode !== null;
  const showSupplementaryExplanation = Boolean(
    canRenderActionCode &&
      rec?.llm_explanation &&
      rec.llm_explanation.trim().length > 0
  );

  const rawAction = rec?.action_code;
  const guardViolationBanner =
    rawAction && ev.length < 3 ? 'This record failed a data check' : presented.guardMessage;

  return {
    canRenderActionCode,
    effectiveActionCode: presented.displayedActionCode,
    effectiveStatus: presented.effectiveStatus,
    showSupplementaryExplanation,
    supplementaryBannerLabel: 'Supplementary explanation. The evidence above is the basis.',
    guardViolationBanner,
  };
}

/**
 * Section 14.1 Test Fixtures (FX-01 to FX-10)
 */
export type TestFixtureId =
  | 'NONE'
  | 'FX-01'
  | 'FX-02'
  | 'FX-03'
  | 'FX-04'
  | 'FX-05'
  | 'FX-06'
  | 'FX-07'
  | 'FX-08'
  | 'FX-09'
  | 'FX-10';

export interface NamedTestFixture {
  fixture_id: TestFixtureId;
  name: string;
  household_id: string;
  condition: string;
  expected_outcome: string;
  payload: Record<string, unknown>;
}

export const TEST_FIXTURES: Record<TestFixtureId, NamedTestFixture> = {
  NONE: {
    fixture_id: 'NONE',
    name: 'Default Demo Bundle (SRC-5)',
    household_id: 'SANKET-HH-000101',
    condition: 'Standard demonstration state (rules pending, action_code = null)',
    expected_outcome: 'Displays INSUFFICIENT_DATA / Decision rules pending without automated action',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000101',
      recommendation: {
        recommendation_status: 'INSUFFICIENT_DATA',
        action_code: null,
        reason_codes: ['DECISION_RULES_PENDING'],
        llm_explanation: null,
      },
      evidence: [{ id: 'E1' }, { id: 'E2' }],
    },
  },
  'FX-01': {
    fixture_id: 'FX-01',
    name: 'Future READY_FOR_REVIEW + LEND_DIFFERENTLY (≥3 Evidence)',
    household_id: 'SANKET-HH-000101',
    condition: 'recommendation_status = READY_FOR_REVIEW, action_code = LEND_DIFFERENTLY, 3 evidence entries',
    expected_outcome: 'Renders LEND_DIFFERENTLY action card and enables officer decision workflow',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000101',
      recommendation: {
        recommendation_status: 'READY_FOR_REVIEW',
        action_code: 'LEND_DIFFERENTLY',
        reason_codes: ['TIMING_MISMATCH_LEAN_SEASON'],
        llm_explanation: null,
      },
      evidence: [
        { signal_name: 'Next scheduled instalment', observed_value: '2026-10-28 · ₹4,170.00' },
        { signal_name: 'Expected remittance date', observed_value: '2026-11-05 · ₹35,000.00' },
        { signal_name: 'SHG savings attendance', observed_value: '100% over 6 months' },
      ],
    },
  },
  'FX-02': {
    fixture_id: 'FX-02',
    name: 'Supplementary Plain-Language Explanation',
    household_id: 'SANKET-HH-000101',
    condition: 'READY_FOR_REVIEW with llm_explanation populated and 3 evidence entries',
    expected_outcome: 'Renders explanation below evidence labelled "Supplementary explanation. The evidence above is the basis."',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000101',
      recommendation: {
        recommendation_status: 'READY_FOR_REVIEW',
        action_code: 'LEND_DIFFERENTLY',
        reason_codes: ['TIMING_MISMATCH_LEAN_SEASON'],
        llm_explanation:
          'Household SANKET-HH-000101 has a scheduled instalment on 28 Oct 2026, 8 days before the expected Surat remittance on 5 Nov 2026.',
      },
      evidence: [{ id: 'E1' }, { id: 'E2' }, { id: 'E3' }],
    },
  },
  'FX-03': {
    fixture_id: 'FX-03',
    name: 'Evidence Guard Rejection (<3 Evidence Signals)',
    household_id: 'SANKET-HH-000101',
    condition: 'recommendation_status = READY_FOR_REVIEW, action_code = WAIT, but only 2 evidence entries',
    expected_outcome: 'Guard rejects action_code, falls back to INSUFFICIENT_DATA, and displays data check banner (FO-TC-461)',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000101',
      recommendation: {
        recommendation_status: 'READY_FOR_REVIEW',
        action_code: 'WAIT',
        reason_codes: [],
        llm_explanation: null,
      },
      evidence: [{ id: 'E1' }, { id: 'E2' }],
    },
  },
  'FX-04': {
    fixture_id: 'FX-04',
    name: 'Forbidden Composite Score Rejection (Decision D6)',
    household_id: 'SANKET-HH-000101',
    condition: 'Payload injects forbidden composite_score: 72 field',
    expected_outcome: 'ContractValidator rejects payload with "This record failed a data check" (FO-TC-451)',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000101',
      composite_score: 72,
      dimension_scores: {
        spend_score: null,
        save_score: null,
        borrow_score: null,
        plan_score: null,
      },
    },
  },
  'FX-05': {
    fixture_id: 'FX-05',
    name: 'Cross-Partner Scope Guard (FSP-SYN-02)',
    household_id: 'SANKET-HH-000102',
    condition: 'Field Officer (FSP-SYN-01) queries household SANKET-HH-000102 belonging to FSP-SYN-02',
    expected_outcome: 'ScopeFilter excludes SANKET-HH-000102 from Field Officer worklist and global search (FO-TC-411)',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000102',
      fsp_partner_id: 'FSP-SYN-02',
    },
  },
  'FX-06': {
    fixture_id: 'FX-06',
    name: 'Non-Null Action Code on INSUFFICIENT_DATA Rejection',
    household_id: 'SANKET-HH-000125',
    condition: 'recommendation_status = INSUFFICIENT_DATA but action_code = EXTEND_CREDIT',
    expected_outcome: 'ContractValidator rejects invalid combination with "This record failed a data check"',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000125',
      recommendation: {
        recommendation_status: 'INSUFFICIENT_DATA',
        action_code: 'EXTEND_CREDIT',
        reason_codes: ['DATA_COMPLETENESS_LOW'],
      },
      evidence: [],
    },
  },
  'FX-07': {
    fixture_id: 'FX-07',
    name: 'Suppressed LLM Explanation When Action Code Is Null',
    household_id: 'SANKET-HH-000101',
    condition: 'action_code = null but llm_explanation is non-null',
    expected_outcome: 'Guard suppresses standalone LLM explanation as a substitute for an action',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000101',
      recommendation: {
        recommendation_status: 'INSUFFICIENT_DATA',
        action_code: null,
        reason_codes: ['DECISION_RULES_PENDING'],
        llm_explanation: 'Unsolicited text while action_code is null.',
      },
      evidence: [{ id: 'E1' }, { id: 'E2' }],
    },
  },
  'FX-08': {
    fixture_id: 'FX-08',
    name: 'Verified Conflict Side (SANKET-HH-000120)',
    household_id: 'SANKET-HH-000120',
    condition: 'Conflict record with one side marked VERIFIED by Field Officer',
    expected_outcome: 'Verified side displays "Verified value" badge while retaining unverified side in provenance (FO-TC-491)',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000120',
      conflict_field: 'expected_remittance_date',
      verified_side: '2026-11-15',
      retained_side: '2026-11-06',
    },
  },
  'FX-09': {
    fixture_id: 'FX-09',
    name: 'Consent Withdrawn Exclusion (Decision D14)',
    household_id: 'SANKET-HH-000101',
    condition: 'record_status = CONSENT_WITHDRAWN',
    expected_outcome: 'Displays "This household is no longer available." and suppresses financial & recommendation panels',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000101',
      record_status: 'CONSENT_WITHDRAWN',
    },
  },
  'FX-10': {
    fixture_id: 'FX-10',
    name: 'Populated S06 Financial Health Dimension Scores',
    household_id: 'SANKET-HH-000142',
    condition: 'Future phase payload with dimension_scores and IND_01..IND_08 populated, no composite_score',
    expected_outcome: 'Passes ContractValidator and renders 4 separate dimensions without a single composite score',
    payload: {
      schema_version: 'sanket.household_profile.v1',
      household_id: 'SANKET-HH-000142',
      dimension_scores: {
        spend_score: 54.0,
        save_score: 78.5,
        borrow_score: 61.0,
        plan_score: 72.0,
      },
      evidence: [{ id: 'E1' }, { id: 'E2' }, { id: 'E3' }],
    },
  },
};

export const PRD_TEST_FIXTURES: {
  id: TestFixtureId;
  title: string;
  content: string;
  usedFor: string;
}[] = Object.values(TEST_FIXTURES).map((fx) => ({
  id: fx.fixture_id,
  title: `${fx.fixture_id} · ${fx.name}`,
  content: fx.condition,
  usedFor: fx.expected_outcome,
}));



