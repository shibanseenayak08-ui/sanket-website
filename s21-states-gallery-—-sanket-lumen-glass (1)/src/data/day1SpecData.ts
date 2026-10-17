export interface ArchitectureDecisionItem {
  id: string;
  decision: string;
  rationale: string;
  groundedIn: string;
  status: string;
}

export interface ValidationRuleItem {
  ruleId: string;
  conditionChecked: string;
  affectedDataset: string;
  actionTaken: 'REJECTED_AT_INGESTION' | 'FLAGGED_UNVERIFIED' | 'GATES_COMPLETENESS';
}

export const DAY1_DECISION_REGISTER: ArchitectureDecisionItem[] = [
  {
    id: 'D1',
    decision: 'Exactly seven datasets: household_master, mfi_loan_accounts, repayment_history, shg_savings_records, seasonal_context, household_checkins, data_provenance_validation.',
    rationale: 'Matches the Solution Package four source families (MFI, SHG, NGO/seasonal, survey) plus a master record and an append-only provenance layer.',
    groundedIn: 'Grounded — prompt §3 names all seven explicitly',
    status: 'Final',
  },
  {
    id: 'D2',
    decision: 'household_master holds identity, geography, migration flags, consent/record status, and data-completeness cache fields only — scores/indicators live only in the JSON contract.',
    rationale: 'Scoring is assigned to a separate workstream (Solution Package §8, p.14). Scores are returned through sanket.household_profile.v1 and traced via data_provenance_validation (is_derived=TRUE).',
    groundedIn: 'Proposed',
    status: 'Final for Phase 2',
  },
  {
    id: 'D3',
    decision: 'seasonal_context carries a single context_scope field (HOUSEHOLD or CORRIDOR) with a nullable household_id rather than splitting into two tables.',
    rationale: 'Supports both public corridor data (APEDA, ORYZA, CMID) and household-reported remittance context without an eighth dataset.',
    groundedIn: 'Proposed',
    status: 'Final for Phase 2',
  },
  {
    id: 'D4',
    decision: 'data_provenance_validation uses a polymorphic reference (referenced_dataset_name + referenced_record_id + nullable referenced_field_name).',
    rationale: 'Links to any entity and field across all six substantive datasets without requiring seven separate provenance tables.',
    groundedIn: 'Proposed',
    status: 'Final for Phase 2',
  },
  {
    id: 'D5',
    decision: 'Household identifiers are synthetic tokens (SANKET-HH-XXXXXX). No Aadhaar number, phone number, or real name field exists anywhere in the schema.',
    rationale: 'Explicitly forbids raw PII in the demonstration dataset; UIDAI Aadhaar number is never stored even in target Phase 3 design (Solution Package §09, p.16).',
    groundedIn: 'Grounded — prompt §6 & Solution Package §09',
    status: 'Final, non-negotiable',
  },
  {
    id: 'D6',
    decision: 'Repayment records use repayment_status = PENDING (not MISSED) when due date has not passed, and UNKNOWN when a due date has passed with no source record.',
    rationale: 'Do not treat an absent payment record as proof of a missed repayment (Prompt §3C).',
    groundedIn: 'Grounded — prompt §3C',
    status: 'Final, non-negotiable',
  },
  {
    id: 'D7',
    decision: 'seasonal_context.remittance_status is a four-value enum (CONFIRMED, EXPECTED, DELAYED, UNKNOWN) and EXPECTED is never treated as guaranteed income.',
    rationale: 'Illustrated directly by the Meena case study where October Diwali remittance is logged as MEDIUM confidence and not yet confirmed (Solution Package §11, p.18).',
    groundedIn: 'Grounded — prompt §3E & Solution Package §11',
    status: 'Final, non-negotiable',
  },
  {
    id: 'D8',
    decision: 'Completeness bands fixed at HIGH ≥75%, MEDIUM 50–74.99%, LOW <50%, computed against the 8 financial-health indicators within a 90-day freshness window (< 90 days old).',
    rationale: 'Carried from Solution Package §07 (p.13): "% of 8 FH indicators that have current data (< 90 days old)".',
    groundedIn: 'Grounded — prompt §7 & Solution Package §07',
    status: 'Final, non-negotiable',
  },
  {
    id: 'D9',
    decision: 'The five recommendation action codes are stored as a fixed enum: EXTEND_CREDIT, LEND_DIFFERENTLY, RECOMMEND_PROTECTION, CHECK_IN, WAIT.',
    rationale: 'Exact match to Solution Package §06 (p.11) and §08 (p.14).',
    groundedIn: 'Grounded — Solution Package §06, §08',
    status: 'Final, non-negotiable',
  },
  {
    id: 'D10',
    decision: 'The eight indicator outputs are represented as an array of generically-coded indicator objects (IND_01..IND_08, dimension, value, calculation_status), not fixed columns.',
    rationale: 'Final indicator names/weights are owned by the scoring workstream; extensible array avoids schema changes.',
    groundedIn: 'Grounded — prompt §5 scope boundary',
    status: 'Final for Phase 2',
  },
  {
    id: 'D11',
    decision: 'No table, field, or enum value encodes caste, religion, occupation, or region as a scoring input.',
    rationale: 'district_name and village_name exist only as operational context on household_master, never joined into scoring or adverse recommendations.',
    groundedIn: 'Grounded — prompt §10 & Solution Package §09',
    status: 'Final, non-negotiable',
  },
  {
    id: 'D12',
    decision: 'All date/time fields use ISO 8601 (YYYY-MM-DD, YYYY-MM-DDThh:mm:ssZ UTC). Monetary fields are DECIMAL(12,2) in INR. Booleans are TRUE/FALSE.',
    rationale: 'Standard engineering convention across CSV templates and JSON contract.',
    groundedIn: 'Proposed',
    status: 'Final for Phase 2',
  },
  {
    id: 'D13',
    decision: 'Evidence array must contain >= 3 named entries whenever a recommendation is shown, else fall back to insufficient-data state.',
    rationale: 'Solution Package §06 (p.11) Step 6: "Every recommendation surfaces: top 3 evidence signals".',
    groundedIn: 'Grounded — Solution Package §06 & prompt §8',
    status: 'Final, non-negotiable',
  },
  {
    id: 'D14',
    decision: 'No hard deletes; consent withdrawal handled via record_status=CONSENT_WITHDRAWN plus application-layer exclusion within 48 hours, with provenance retained.',
    rationale: 'Implements Solution Package §09 (p.16) 48-hour revocation and tamper-evident append-only audit log together.',
    groundedIn: 'Proposed from Solution Package §09',
    status: 'Final for Phase 2',
  },
  {
    id: 'D15',
    decision: 'Account Aggregator (DEPA) and UIDAI Aadhaar Auth API are documented in the ingestion map but have zero schema footprint in Phase 2.',
    rationale: 'Solution Package §10 (p.17) "What we will NOT build in Phase 2".',
    groundedIn: 'Grounded — Solution Package §10',
    status: 'Final; revisit in Phase 3',
  },
];

export const DAY1_VALIDATION_RULES: ValidationRuleItem[] = [
  { ruleId: 'V-01', conditionChecked: 'Required identifier missing (e.g. household_id, loan_account_id on a row that must carry one)', affectedDataset: 'Any', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-02', conditionChecked: 'Field value does not match its declared data type (e.g. text in a decimal field)', affectedDataset: 'Any', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-03', conditionChecked: 'Date field is not a valid, parseable ISO 8601 date (YYYY-MM-DD)', affectedDataset: 'Any', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-04', conditionChecked: 'Categorical field value is outside its defined upper-snake-case enum', affectedDataset: 'Any', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-05', conditionChecked: 'Duplicate source record detected: identical (source_system_name, source_record_id) already ingested', affectedDataset: 'Any', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-06', conditionChecked: 'Two source records for the same entity carry conflicting values for the same field at the same point in time (e.g. two different outstanding balances)', affectedDataset: 'Any', actionTaken: 'FLAGGED_UNVERIFIED' },
  { ruleId: 'V-07', conditionChecked: 'Foreign key does not resolve (e.g. mfi_loan_accounts.household_id has no matching household_master row)', affectedDataset: 'mfi_loan_accounts, shg_savings_records, seasonal_context, household_checkins', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-08', conditionChecked: 'repayment_history.loan_account_id does not resolve to an existing mfi_loan_accounts row', affectedDataset: 'repayment_history', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-09', conditionChecked: 'Loan or repayment balances are internally contradictory (e.g. PAID_ON_TIME but amount_paid is NULL, or outstanding_balance increases without new disbursement)', affectedDataset: 'mfi_loan_accounts, repayment_history', actionTaken: 'FLAGGED_UNVERIFIED' },
  { ruleId: 'V-10', conditionChecked: 'seasonal_context scope/household_id pairing invalid (HOUSEHOLD with null household_id, or CORRIDOR with non-null household_id or missing migration_corridor_name)', affectedDataset: 'seasonal_context', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-11', conditionChecked: 'Impossible date sequence (record_period_end_date before record_period_start_date; payment date before loan disbursement_date)', affectedDataset: 'shg_savings_records, seasonal_context, repayment_history', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-12', conditionChecked: 'Source record is older than the 90-day freshness window relevant to a specific financial-health indicator calculation (evaluated at calculation time, never deletes old records)', affectedDataset: 'Any (at calculation time)', actionTaken: 'GATES_COMPLETENESS' },
  { ruleId: 'V-13', conditionChecked: 'data_provenance_validation.referenced_record_id does not resolve within referenced_dataset_name', affectedDataset: 'data_provenance_validation', actionTaken: 'REJECTED_AT_INGESTION' },
  { ruleId: 'V-14', conditionChecked: 'household_checkins row has response_applicability=APPLICABLE but response_value is absent', affectedDataset: 'household_checkins', actionTaken: 'FLAGGED_UNVERIFIED' },
  { ruleId: 'V-15', conditionChecked: 'Conflicting household identifiers across source systems for same village+SHG combination at entity-resolution time', affectedDataset: 'household_master', actionTaken: 'FLAGGED_UNVERIFIED' },
  { ruleId: 'V-16', conditionChecked: 'data_provenance_validation record itself is missing required provenance fields (source_system_name, extraction_timestamp, referenced_dataset_name, referenced_record_id)', affectedDataset: 'data_provenance_validation', actionTaken: 'REJECTED_AT_INGESTION' },
];

export const CSV_TEMPLATE_SPECS = [
  {
    file: 'household_master.csv',
    dataset: 'Dataset A',
    pk: 'household_id',
    fk: 'none (root entity)',
    columnCount: 21,
    columns: [
      'household_id', 'village_name', 'block_name', 'district_name', 'state_name',
      'household_size', 'shg_group_id', 'primary_migrant_present', 'migration_corridor_destination',
      'migration_status', 'fsp_partner_id', 'enrollment_date', 'record_status', 'consent_status',
      'consent_version', 'consent_timestamp', 'data_completeness_pct', 'data_completeness_band',
      'profile_last_updated_at', 'created_at', 'is_synthetic',
    ],
  },
  {
    file: 'mfi_loan_accounts.csv',
    dataset: 'Dataset B',
    pk: 'loan_account_id',
    fk: 'household_id → household_master.household_id',
    columnCount: 17,
    columns: [
      'loan_account_id', 'household_id', 'originating_institution_name', 'originating_institution_type',
      'loan_product_type', 'principal_amount', 'outstanding_balance', 'disbursement_date',
      'loan_term_months', 'repayment_frequency', 'scheduled_installment_amount', 'loan_status',
      'next_due_date', 'source_record_id', 'source_system_name', 'source_record_updated_at', 'created_at',
    ],
  },
  {
    file: 'repayment_history.csv',
    dataset: 'Dataset C',
    pk: 'repayment_id',
    fk: 'loan_account_id → mfi_loan_accounts.loan_account_id',
    columnCount: 12,
    columns: [
      'repayment_id', 'loan_account_id', 'scheduled_due_date', 'amount_due',
      'actual_payment_date', 'amount_paid', 'repayment_status', 'days_late',
      'source_record_id', 'source_system_name', 'source_record_updated_at', 'created_at',
    ],
  },
  {
    file: 'shg_savings_records.csv',
    dataset: 'Dataset D',
    pk: 'savings_record_id',
    fk: 'household_id → household_master.household_id',
    columnCount: 15,
    columns: [
      'savings_record_id', 'household_id', 'shg_group_name', 'shg_group_id',
      'record_period_start_date', 'record_period_end_date', 'savings_balance',
      'contribution_amount', 'withdrawal_amount', 'meeting_attendance_rate',
      'shg_bank_linkage_status', 'source_record_id', 'source_system_name',
      'source_record_updated_at', 'created_at',
    ],
  },
  {
    file: 'seasonal_context.csv',
    dataset: 'Dataset E',
    pk: 'seasonal_context_id',
    fk: 'household_id → household_master.household_id (nullable when CORRIDOR)',
    columnCount: 16,
    columns: [
      'seasonal_context_id', 'household_id', 'context_scope', 'migration_corridor_name',
      'observation_period_start_date', 'observation_period_end_date', 'season_label',
      'remittance_status', 'expected_remittance_amount', 'expected_remittance_date',
      'confidence_level', 'source_type', 'source_record_id', 'source_system_name',
      'source_record_updated_at', 'created_at',
    ],
  },
  {
    file: 'household_checkins.csv',
    dataset: 'Dataset F',
    pk: 'checkin_response_id',
    fk: 'household_id → household_master.household_id',
    columnCount: 14,
    columns: [
      'checkin_response_id', 'household_id', 'checkin_session_id', 'survey_instrument_version',
      'question_code', 'question_text', 'question_category', 'response_applicability',
      'response_value', 'response_scale_type', 'checkin_date', 'collected_by',
      'source_record_id', 'created_at',
    ],
  },
  {
    file: 'data_provenance_validation.csv',
    dataset: 'Dataset G',
    pk: 'provenance_id',
    fk: 'Polymorphic: referenced_dataset_name + referenced_record_id',
    columnCount: 16,
    columns: [
      'provenance_id', 'referenced_dataset_name', 'referenced_record_id', 'referenced_field_name',
      'source_system_name', 'extraction_timestamp', 'last_verified_at', 'freshness_days',
      'schema_validation_status', 'duplicate_check_status', 'conflict_status', 'conflicting_value',
      'verification_status', 'is_derived', 'derivation_method', 'created_at',
    ],
  },
];

/**
 * Complete Synthetic JSON Example from Section 11 of Day 1 Data Architecture Specification
 * (SANKET-HH-000142 — Meena composite Ganjam->Surat storyline)
 */
export const SECTION_11_SYNTHETIC_JSON_EXAMPLE = {
  contract_version: 'sanket.household_profile.v1',
  household_id: 'SANKET-HH-000142',
  profile_context: {
    district_name: 'GANJAM',
    block_name: 'Brahmapur',
    migration_status: 'ACTIVE_MIGRANT',
    fsp_partner_id: 'FSP-0007',
    is_synthetic: true,
    record_status: 'ACTIVE',
  },
  loan_summary: [
    {
      loan_account_id: 'SANKET-LN-A1B2C3D4',
      originating_institution_name: 'Synthetic Demo MFI',
      loan_status: 'ACTIVE',
      outstanding_balance: 18500.0,
      scheduled_installment_amount: 4200.0,
      next_due_date: '2026-09-15',
      recent_repayment_status: 'PENDING',
    },
  ],
  savings_summary: {
    shg_group_name: 'Synthetic SHG Group 14',
    latest_savings_balance: 6200.0,
    latest_period_end_date: '2026-08-31',
    shg_bank_linkage_status: 'LINKED',
    meeting_attendance_rate: 0.85,
  },
  seasonal_context: {
    season_label: 'LEAN',
    remittance_status: 'EXPECTED',
    expected_remittance_amount: 35000.0,
    expected_remittance_date: '2026-10-20',
    confidence_level: 'MEDIUM',
    source_type: 'CORRIDOR_PROFILE',
    migration_corridor_name: 'Ganjam-Surat',
  },
  indicator_results: [
    { indicator_code: 'IND_01', dimension: 'SPEND', value: 0.48, calculation_status: 'CALCULATED', data_sources_used: ['repayment_history'] },
    { indicator_code: 'IND_02', dimension: 'SPEND', value: null, calculation_status: 'INSUFFICIENT_DATA', data_sources_used: [] },
    { indicator_code: 'IND_03', dimension: 'SAVE', value: 0.41, calculation_status: 'CALCULATED', data_sources_used: ['shg_savings_records'] },
    { indicator_code: 'IND_04', dimension: 'SAVE', value: 0.39, calculation_status: 'CALCULATED', data_sources_used: ['shg_savings_records'] },
    { indicator_code: 'IND_05', dimension: 'BORROW', value: 0.62, calculation_status: 'CALCULATED', data_sources_used: ['mfi_loan_accounts', 'repayment_history'] },
    { indicator_code: 'IND_06', dimension: 'BORROW', value: 0.58, calculation_status: 'CALCULATED', data_sources_used: ['mfi_loan_accounts'] },
    { indicator_code: 'IND_07', dimension: 'PLAN', value: 0.35, calculation_status: 'CALCULATED', data_sources_used: ['household_checkins'] },
    { indicator_code: 'IND_08', dimension: 'PLAN', value: null, calculation_status: 'INSUFFICIENT_DATA', data_sources_used: [] },
  ],
  dimension_scores: {
    spend_score: 0.48,
    save_score: 0.41,
    borrow_score: 0.62,
    plan_score: 0.35,
  },
  seasonal_context_score: {
    value: 0.3,
    classification: 'LEAN_MONTH_REPAYMENT_MISMATCH',
    supporting_evidence:
      "Illustrative: September repayment date falls inside the household's modeled zero-income window ahead of the expected October remittance.",
    confidence_level: 'MEDIUM',
  },
  evidence: [
    {
      signal_name: 'repayment_date_in_lean_month',
      observed_value: '2026-09-15',
      source_reference: 'mfi_loan_accounts:SANKET-LN-A1B2C3D4',
      observation_date: '2026-08-20',
      relates_to: 'seasonal_context_score',
    },
    {
      signal_name: 'expected_remittance_post_due_date',
      observed_value: '2026-10-20',
      source_reference: 'seasonal_context:SANKET-SC-00045',
      observation_date: '2026-08-01',
      relates_to: 'recommendation',
    },
    {
      signal_name: 'clean_prior_repayment_history',
      observed_value: '0 late payments in last 6 installments',
      source_reference: 'repayment_history:SANKET-RP-0009921100',
      observation_date: '2026-08-10',
      relates_to: 'dimension_scores.borrow_score',
    },
  ],
  confidence_band: 'MEDIUM',
  data_completeness_pct: 62.5,
  data_completeness_band: 'MEDIUM',
  data_quality_warnings: [],
  recommendation: {
    action_code: 'LEND_DIFFERENTLY',
    reason_codes: [
      'SEASONAL_LEAN_MONTH_MISMATCH',
      'STABLE_REPAYMENT_HISTORY',
      'REMITTANCE_EXPECTED_POST_DUE_DATE',
    ],
    recommendation_status: 'READY_FOR_REVIEW',
  },
  human_review: {
    review_status: 'PENDING',
    officer_id: null,
    officer_decision: null,
    override_reason: null,
    reviewed_at: null,
    outcome_feedback: null,
  },
  llm_explanation: null,
  generated_at: '2026-08-20T09:15:00Z',
};

export const APAC_PORTABILITY_MATRIX = [
  { component: 'Core data model', constantStatus: '✓ Household entity, FH indicators, action log', localisePerMarket: 'Local field names, ID formats' },
  { component: 'FH scoring framework', constantStatus: '✓ Spend/Save/Borrow/Plan + Seasonal sub-score', localisePerMarket: 'Indicator weights calibrated on local data' },
  { component: 'Suitable-action engine', constantStatus: '✓ 5-action logic; rule cascade structure', localisePerMarket: 'Thresholds adjusted to local lending norms' },
  { component: 'Explainability layer', constantStatus: '✓ Evidence-signal architecture; confidence bands', localisePerMarket: 'Language (Odia/Hindi, Tagalog, Bahasa, Vietnamese); LLM fine-tuning' },
  { component: 'Consent mechanism', constantStatus: '— Modular interface contract', localisePerMarket: 'AA (India DEPA), Open Finance (Philippines BSP), OJK SNAP (Indonesia)' },
  { component: 'Identity / deduplication', constantStatus: '— Tokenized cross-system ID concept', localisePerMarket: 'UIDAI UID Token (IN), PhilSys (PH), NIK (ID), CCCD (VN)' },
  { component: 'Public seasonal data', constantStatus: '— Pipeline structure & CORRIDOR scope', localisePerMarket: 'APEDA/ORYZA (IN) → PhilAtlas (PH) → BPS (ID)' },
  { component: 'Regulatory rules', constantStatus: '— Read-only human-in-the-loop boundary', localisePerMarket: 'RBI (IN) → BSP (PH) → OJK (ID)' },
];

export const PHASE2_KPI_TARGETS = [
  { kpi: 'Data completeness', metric: '% of households with ≥6/8 FH indicators populated (<90d)', target: '≥70% of pilot cohort', source: 'Sanket ingestion log', phase: 'P2 MVP / Pilot' },
  { kpi: 'Recommendation explainability', metric: '% of actions with ≥3 named evidence signals (Decision D13)', target: '100%', source: 'Decision log', phase: 'P2 MVP' },
  { kpi: 'Officer acceptance rate', metric: '% of Sanket recommendations accepted without modification', target: '>60% (relevance, not compliance)', source: 'Override log', phase: 'Pilot' },
  { kpi: 'Override quality', metric: '% of overrides with documented rationale', target: '100%', source: 'Override log', phase: 'Pilot' },
  { kpi: 'Timing-risk detection rate', metric: '% of "lean month" EMI dates correctly flagged before due date', target: '>80%', source: 'Seasonal calendar vs. repayment schedule', phase: 'Pilot' },
  { kpi: 'Early-warning lead time', metric: 'Days between Sanket stress flag and household missed payment', target: '>30 days average', source: 'Loan ledger vs. flag date', phase: 'Pilot' },
  { kpi: 'False-positive rate', metric: '% of "WAIT" recommendations where household subsequently performs normally', target: '<20%', source: 'Loan ledger (90-day follow-up)', phase: 'Pilot' },
  { kpi: 'Fairness: gender disparity', metric: 'Difference in WAIT recommendation rate between male/female-headed households', target: '<5 percentage points', source: 'Quarterly fairness audit', phase: 'Pilot' },
];
