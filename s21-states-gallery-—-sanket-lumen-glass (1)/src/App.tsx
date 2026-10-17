import React, { useEffect, useState } from 'react';
import {
  ConflictItem,
  HOUSEHOLDS_DATA,
  HouseholdProfile,
  INITIAL_CONFLICTS,
  INITIAL_PROVENANCE_ENTRIES,
  ProvenanceEntry,
} from './data/sanketData';
import { OfficerDecision, RoleId, ScreenId, canRoleAccessHouseholdDetail } from './utils/sanketLogic';
import { LegendModal, SanketLogoMark } from './components/SharedPrimitives';
import {
  HouseholdProfileHeader,
  RestrictedAccessCard,
} from './components/HouseholdProfileHeader';
import { S01DemoEntry } from './screens/S01DemoEntry';
import {
  S02Overview,
  S03Worklist,
  S04HouseholdsDirectory,
} from './screens/CohortScreens';
import {
  ProfileTab6DataSources,
  ProfileTab7ReviewHistory,
  S05ProfileOverview,
  S06FinancialHealth,
  S07SeasonalCashFlow,
  S08LoansRepayments,
  S09SavingsCheckins,
} from './screens/ProfileTabs';
import {
  S10RecommendationDetail,
  S10RecommendationQueue,
  S11WhatIfSimulator,
  S15HumanReviewDrawer,
} from './screens/ReviewAndSimulatorScreens';
import {
  S12PortfolioInsights,
  S13DataQuality,
  S14ConflictsVerification,
  S16AuditHistory,
  S17GovernanceCompliance,
} from './screens/AnalyticsAndGovernanceScreens';
import {
  DemoFollowupItem,
  DemoNotificationItem,
  S18NotificationsFollowups,
  S19GlobalSearchModal,
  S20Settings,
  S21StatesGallery,
} from './screens/UtilityAndStatesScreens';

const INITIAL_NOTIFICATIONS: DemoNotificationItem[] = [
  {
    id: 'N-1',
    group: 'Today',
    category: 'INSTALMENTS',
    title: 'Instalment due in 1 day · SANKET-HH-000110 · 18 Oct 2026 · ₹3,080.00',
    household_id: 'SANKET-HH-000110',
    date_label: '18 Oct 2026',
    state: 'OBSERVED',
    unread: true,
    targetScreen: 'S08',
  },
  {
    id: 'N-2',
    group: 'Today',
    category: 'INSTALMENTS',
    title: 'Instalment due in 3 days · SANKET-HH-000103 · 20 Oct 2026 · ₹2,340.00',
    household_id: 'SANKET-HH-000103',
    date_label: '20 Oct 2026',
    state: 'OBSERVED',
    unread: true,
    targetScreen: 'S08',
  },
  {
    id: 'N-3',
    group: 'Today',
    category: 'REMITTANCES',
    title: 'Expected remittance, not received · SANKET-HH-000101 · 5 Nov 2026',
    household_id: 'SANKET-HH-000101',
    date_label: '5 Nov 2026',
    state: 'EXPECTED',
    unread: true,
    targetScreen: 'S07',
  },
  {
    id: 'N-4',
    group: 'This week',
    category: 'DATA_QUALITY',
    title: 'Conflict recorded · outstanding_balance · SANKET-LN-GA84SZ8J · ingested 15 Oct 2026',
    household_id: 'SANKET-HH-000109',
    date_label: '15 Oct 2026',
    state: 'CONFLICT',
    unread: false,
    targetScreen: 'S14',
  },
  {
    id: 'N-5',
    group: 'This week',
    category: 'DATA_QUALITY',
    title: 'Re-verified · seasonal record SANKET-SC-00027 · 16 Oct 2026, 08:00 UTC',
    household_id: 'SANKET-HH-000113',
    date_label: '16 Oct 2026',
    state: 'OBSERVED',
    unread: false,
    targetScreen: 'S05',
  },
  {
    id: 'N-6',
    group: 'This week',
    category: 'CHECKINS',
    title: 'Follow-up requested at check-in · SANKET-HH-000103 · 1 Oct 2026',
    household_id: 'SANKET-HH-000103',
    date_label: '1 Oct 2026',
    state: 'OBSERVED',
    unread: false,
    targetScreen: 'S09',
  },
];

const INITIAL_FOLLOWUPS: DemoFollowupItem[] = [
  {
    id: 'FU-1',
    household_id: 'SANKET-HH-000103',
    requested_on: '1 Oct 2026',
    last_contact: 'Not recorded',
    status: 'Open',
    note: 'Q09 = YES in session SANKET-CS-000103-01',
  },
  {
    id: 'FU-2',
    household_id: 'SANKET-HH-000121',
    requested_on: '2 Oct 2026',
    last_contact: 'Not recorded',
    status: 'Open',
    note: 'Q09 = YES in session SANKET-CS-000121-01',
  },
];

export default function App() {
  const [role, setRole] = useState<RoleId>(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('role') as RoleId | null;
    if (r === 'FIELD_OFFICER' || r === 'PORTFOLIO_MANAGER' || r === 'COMPLIANCE_REVIEWER') {
      return r;
    }
    return 'FIELD_OFFICER';
  });
  const [screen, setScreen] = useState<ScreenId>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return 'S02';
    const sc = params.get('screen') as ScreenId | null;
    if (sc) return sc;
    return 'S02';
  });

  const [worklistFilterPreset, setWorklistFilterPreset] = useState<string>('ALL');
  const [s14HouseholdFilter, setS14HouseholdFilter] = useState<string>('ALL');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('hh') || 'SANKET-HH-000101';
  });
  const [households, setHouseholds] = useState<HouseholdProfile[]>(HOUSEHOLDS_DATA);
  const [conflicts, setConflicts] = useState<ConflictItem[]>(INITIAL_CONFLICTS);
  const [provenance, setProvenance] = useState<ProvenanceEntry[]>(INITIAL_PROVENANCE_ENTRIES);
  const [notifications, setNotifications] = useState<DemoNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [followups, setFollowups] = useState<DemoFollowupItem[]>(INITIAL_FOLLOWUPS);

  // Overlays & Drawers
  const [legendOpen, setLegendOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellPopoverOpen, setBellPopoverOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [s15Open, setS15Open] = useState(false);
  const [s15PreviewMode, setS15PreviewMode] = useState(false);

  // Display Preferences (S20)
  const [textSize, setTextSize] = useState<'default' | 'large' | 'larger'>('default');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [contrast, setContrast] = useState<'standard' | 'high'>('standard');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Toast message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize);
    document.documentElement.setAttribute('data-contrast', contrast);
    document.documentElement.setAttribute('data-reduce-motion', String(reduceMotion));
  }, [textSize, contrast, reduceMotion]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setBellPopoverOpen(false);
        setQuickActionOpen(false);
        setLegendOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const currentHousehold =
    households.find((h) => h.household_id === selectedHouseholdId) || households[0];

  const handleNavigate = (target: ScreenId, filterPreset?: string) => {
    if (target === 'S03' && filterPreset) {
      setWorklistFilterPreset(filterPreset);
    } else if (target === 'S14') {
      setS14HouseholdFilter(filterPreset || 'ALL');
    }
    setScreen(target);
    setBellPopoverOpen(false);
    setQuickActionOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHousehold = (id: string, targetScreen: ScreenId = 'S05') => {
    setSelectedHouseholdId(id);
    setScreen(targetScreen);
    setBellPopoverOpen(false);
    setQuickActionOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveHumanDecision = (
    hhId: string,
    decision: OfficerDecision,
    reason: string,
    isPreview: boolean
  ) => {
    const nowStr = '17 Oct 2026, 11:42 UTC';
    setHouseholds((prev) =>
      prev.map((h) =>
        h.household_id === hhId
          ? {
              ...h,
              human_review: {
                ...h.human_review,
                review_status: 'REVIEWED',
                officer_decision: decision,
                override_reason: reason || 'Confirmed in demo review',
                officer_id: 'OFFICER-SYN-01',
                reviewed_at: nowStr,
                is_demo_preview: isPreview,
              },
            }
          : h
      )
    );
    setS15Open(false);
    showToast('Decision recorded (demo).');
  };

  const handleRecordConflictVerification = (
    conflictId: string,
    choice: string,
    howVerified: string
  ) => {
    const nowStr = '17 Oct 2026, 11:45 UTC';
    const target = conflicts.find((c) => c.conflict_id === conflictId);
    setConflicts((prev) =>
      prev.map((c) =>
        c.conflict_id === conflictId
          ? {
              ...c,
              verified_choice: choice,
              verified_note: howVerified,
              verified_at: nowStr,
            }
          : c
      )
    );
    if (target) {
      const newProv: ProvenanceEntry = {
        provenance_id: `SANKET-PV-DEMO-${Math.floor(100 + Math.random() * 899)}`,
        household_id: target.household_id,
        referenced_dataset_name:
          target.dataset_name === 'mfi_loan_accounts' ? 'mfi_loan_accounts' : 'seasonal_context',
        referenced_record_id: target.record_id,
        referenced_field_name: target.field_name,
        source_system_name: `OFFICER_VERIFICATION (${choice})`,
        extraction_timestamp: nowStr,
        created_at: '2026-10-17T11:45:00Z',
        last_verified_at: nowStr,
        freshness_days: 0,
        schema_validation_status: 'PASSED',
        duplicate_check_status: 'UNIQUE',
        conflict_status: 'CONFLICT_DETECTED',
        conflicting_value: target.sourceB.value_display,
        verification_status: 'VERIFIED',
        is_derived: false,
        derivation_method: null,
      };
      setProvenance((prev) => [newProv, ...prev]);
    }
    showToast(
      'Verification entry appended to provenance log (demo). Original values remain visible.'
    );
  };

  const handleCreateVerificationTask = (hhId: string) => {
    const exists = followups.some((f) => f.household_id === hhId);
    if (!exists) {
      setFollowups((prev) => [
        {
          id: `FU-DEMO-${Date.now()}`,
          household_id: hhId,
          requested_on: '17 Oct 2026 (demo task)',
          last_contact: 'Not recorded',
          status: 'Open',
          note: 'Verification task added from S10 Insufficient Data review (demo workflow, Q-02)',
        },
        ...prev,
      ]);
    }
    showToast('Verification task added to your follow-ups (demo). Task store is not in the data architecture.');
  };

  if (screen === 'S01') {
    return (
      <>
        <S01DemoEntry
          selectedRole={role}
          onSelectRole={setRole}
          onEnterDemo={() => handleNavigate('S02')}
          onOpenLegend={() => setLegendOpen(true)}
          onOpenStatesGallery={() => handleNavigate('S21')}
        />
        <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
      </>
    );
  }

  const isProfileScreen =
    screen === 'S05' ||
    screen === 'S06' ||
    screen === 'S07' ||
    screen === 'S08' ||
    screen === 'S09' ||
    screen === 'S05_DATA' ||
    screen === 'S05_REVIEWS';

  const hasHouseholdContextChip =
    isProfileScreen || screen === 'S10_DETAIL' || screen === 'S11';

  const roleBadgeLabel =
    role === 'FIELD_OFFICER'
      ? 'Field Officer · demo'
      : role === 'PORTFOLIO_MANAGER'
      ? 'Portfolio Manager · demo'
      : 'Compliance Reviewer · demo';

  const sidebarItems: {
    id: ScreenId;
    label: string;
    icon: string;
    roles: RoleId[];
    subItems?: { id: ScreenId; label: string }[];
  }[] = [
    {
      id: 'S02',
      label: 'Overview',
      icon: 'dashboard',
      roles: ['FIELD_OFFICER', 'PORTFOLIO_MANAGER', 'COMPLIANCE_REVIEWER'],
    },
    {
      id: 'S03',
      label: 'Household Worklist',
      icon: 'Dynamic_Feed',
      roles: ['FIELD_OFFICER'],
    },
    {
      id: 'S04',
      label: 'Households',
      icon: 'holiday_village',
      roles: ['FIELD_OFFICER'],
    },
    {
      id: 'S10',
      label: 'Recommendation Reviews',
      icon: 'fact_check',
      roles: ['FIELD_OFFICER', 'COMPLIANCE_REVIEWER'],
    },
    {
      id: 'S12',
      label: 'Portfolio Insights',
      icon: 'insights',
      roles: ['FIELD_OFFICER', 'PORTFOLIO_MANAGER', 'COMPLIANCE_REVIEWER'],
    },
    {
      id: 'S13',
      label: 'Data Quality',
      icon: 'verified_user',
      roles: ['FIELD_OFFICER', 'PORTFOLIO_MANAGER', 'COMPLIANCE_REVIEWER'],
      subItems: [
        { id: 'S13', label: 'Data Sources & Quality (S13)' },
        { id: 'S14', label: 'Conflicts & Verification (S14)' },
      ],
    },
    {
      id: 'S16',
      label: 'Audit & Governance',
      icon: 'gavel',
      roles: ['FIELD_OFFICER', 'PORTFOLIO_MANAGER', 'COMPLIANCE_REVIEWER'],
      subItems: [
        { id: 'S16', label: 'Audit History (S16)' },
        { id: 'S17', label: 'Governance & Compliance (S17)' },
      ],
    },
    {
      id: 'S18',
      label: 'Notifications',
      icon: 'notifications',
      roles: ['FIELD_OFFICER', 'PORTFOLIO_MANAGER', 'COMPLIANCE_REVIEWER'],
    },
    {
      id: 'S20',
      label: 'Settings',
      icon: 'settings',
      roles: ['FIELD_OFFICER', 'PORTFOLIO_MANAGER', 'COMPLIANCE_REVIEWER'],
    },
  ];

  const visibleSidebarItems = sidebarItems.filter((item) => item.roles.includes(role));
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Ambient Background Blooms */}
      <div
        className="pointer-events-none fixed top-6 right-10 w-96 h-96 rounded-full blur-3xl opacity-45"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-8 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
      />

      {/* Skip link */}
      <a
        href="#sanket-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#4648D4] focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Fixed Rounded Glass Sidebar (Desktop >= 1024px) */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className="hidden lg:flex lg:flex-col lg:justify-between w-[264px] shrink-0 p-3.5 sticky top-0 h-screen z-20"
      >
        <div className="glass-1 rounded-[28px] h-full p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Brand Mark */}
            <div className="flex items-center justify-between px-2 pt-1">
              <button
                type="button"
                onClick={() => handleNavigate('S02')}
                className="text-left flex items-center gap-3 focus-ring rounded-xl"
              >
                <SanketLogoMark size="md" />
                <div>
                  <span className="text-[17px] font-extrabold tracking-tight text-[#0F172A] block leading-none">
                    SANKET
                  </span>
                  <span className="font-inter text-[10px] font-bold uppercase tracking-widest text-[#64748B] block mt-1">
                    LIQUID INTELLIGENCE OS
                  </span>
                </div>
              </button>
            </div>

            {/* Navigation Items */}
            <nav aria-label="Main sections" className="space-y-1.5">
              {visibleSidebarItems.map((item) => {
                const isGroupActive =
                  screen === item.id ||
                  (item.id === 'S04' && isProfileScreen) ||
                  (item.id === 'S10' && screen === 'S10_DETAIL') ||
                  (item.id === 'S13' && screen === 'S14') ||
                  (item.id === 'S16' && screen === 'S17');

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      aria-current={isGroupActive ? 'page' : undefined}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full h-[44px] px-4 rounded-full flex items-center gap-3 text-xs font-inter font-bold transition-all focus-ring ${
                        isGroupActive
                          ? 'btn-primary-gradient text-white'
                          : 'text-[#1E293B] hover:bg-white/80 hover:text-[#0F172A]'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined !text-[19px] shrink-0 ${
                          isGroupActive ? 'text-white' : 'text-[#6366F1]'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>

                    {item.subItems && isGroupActive && (
                      <div className="pl-8 space-y-1 pt-0.5">
                        {item.subItems.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleNavigate(sub.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-full text-[11px] font-inter font-semibold transition-colors ${
                              screen === sub.id
                                ? 'bg-white text-[#6D28D9] font-bold shadow-2xs'
                                : 'text-[#475569] hover:text-[#0F172A]'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Bottom Capacity / Readiness Card + Gateway Footer (matching reference image) */}
          <div className="space-y-3 pt-4">
            <div className="surface-solid rounded-[20px] p-4 space-y-2.5 text-[11px] font-inter">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase tracking-wider text-[#0F172A]">
                  COHORT READINESS
                </span>
                <span className="font-extrabold text-[#6366F1] tabular-nums">83%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: '83%',
                    background: 'linear-gradient(90deg, #6366F1 0%, #06B6D4 55%, #8B5CF6 100%)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[#64748B]">
                <span>FSP-SYN-01 Demo Node</span>
                <button
                  type="button"
                  onClick={() => setLegendOpen(true)}
                  className="text-[#6D28D9] font-bold hover:underline"
                >
                  Legend
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 text-[11px] font-inter text-[#475569]">
              <span className="inline-flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span>Synthetic Gateway</span>
              </span>
              <span className="font-bold text-[#334155]">v1.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        {/* Top Floating Pill Bar */}
        <header className="sticky top-0 z-30 px-3 sm:px-4 md:px-8 pt-3.5 pb-1.5">
          <div className="glass-1 rounded-[24px] px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-4 max-w-[1440px] mx-auto">
            {/* Mobile Brand Logo + Search Trigger */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 max-w-lg">
              <button
                type="button"
                onClick={() => handleNavigate('S02')}
                aria-label="SANKET Home"
                className="lg:hidden focus-ring rounded-[10px] shrink-0"
              >
                <SanketLogoMark size="sm" />
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open Global Search (Command or Control K)"
                className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-full bg-white/95 border border-white shadow-2xs text-xs font-inter text-[#64748B] hover:border-[#7C3AED]/40 focus-ring min-w-0"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined !text-[18px] text-[#94A3B8] shrink-0">
                    search
                  </span>
                  <span className="truncate">Search households, loans, provenance (Cmd+K)...</span>
                </span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-100 rounded border border-slate-200 text-[#475569] shrink-0">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Persistent Household Context Chip on S05–S11 and S15 */}
            {hasHouseholdContextChip && role === 'FIELD_OFFICER' && (
              <button
                type="button"
                onClick={() => handleNavigate('S05')}
                title="Return to Household Profile Overview (S05)"
                className="hidden xl:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#6366F1]/30 text-xs font-inter font-bold text-[#4648D4] hover:bg-indigo-100 focus-ring shrink-0"
              >
                <span className="material-symbols-outlined !text-[16px]">home_pin</span>
                <span>
                  {currentHousehold.household_id} · {currentHousehold.block_name},{' '}
                  {currentHousehold.district_name}
                </span>
              </button>
            )}

            {/* Right Controls: Bell, Quick Action Purple Pill, Divider, Profile Block */}
            <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 relative">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setBellPopoverOpen(!bellPopoverOpen);
                    setQuickActionOpen(false);
                  }}
                  aria-label={`Notifications (${unreadCount} unread)`}
                  className="p-2 rounded-full hover:bg-white/80 text-[#1E293B] focus-ring relative"
                >
                  <span className="material-symbols-outlined !text-[21px]">notifications</span>
                  {unreadCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full bg-[#6366F1] border-2 border-white absolute top-1.5 right-1.5"
                    />
                  )}
                </button>

                {bellPopoverOpen && (
                  <div
                    role="dialog"
                    aria-label="Recent notifications"
                    className="glass-2 rounded-[22px] p-4 w-72 sm:w-96 absolute right-0 mt-2 shadow-xl z-40 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-[#0F172A]">
                        Notifications (Demo workflow)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleNavigate('S18')}
                        className="text-xs font-inter font-semibold text-[#6D28D9] hover:underline"
                      >
                        View all (S18) →
                      </button>
                    </div>
                    <ul className="space-y-2 max-h-64 overflow-y-auto text-xs">
                      {notifications.slice(0, 5).map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setBellPopoverOpen(false);
                              if (n.targetScreen === 'S14') handleNavigate('S14');
                              else handleSelectHousehold(n.household_id, n.targetScreen);
                            }}
                            className="w-full text-left p-2.5 rounded-[12px] bg-white/90 hover:bg-white border border-slate-200 space-y-1"
                          >
                            <p className="font-semibold text-[#0F172A] leading-snug">{n.title}</p>
                            <span className="font-inter text-[11px] text-[#475569]">
                              {n.date_label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Quick Action Vibrant Purple Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setQuickActionOpen(!quickActionOpen);
                    setBellPopoverOpen(false);
                  }}
                  aria-expanded={quickActionOpen}
                  aria-label="Quick Action menu"
                  className="px-3.5 sm:px-4 py-2 rounded-full btn-primary-gradient text-xs font-inter font-bold whitespace-nowrap focus-ring inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined !text-[16px]">add</span>
                  <span className="hidden sm:inline">Quick Action</span>
                  <span className="sm:hidden">Action</span>
                </button>

                {quickActionOpen && (
                  <div className="glass-2 rounded-[18px] p-2 w-56 absolute right-0 mt-2 shadow-xl z-40 space-y-1 font-inter text-xs">
                    <button
                      type="button"
                      onClick={() => handleNavigate('S03')}
                      className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-white font-medium text-[#0F172A] flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-[16px]">list_alt</span>
                      <span>Open worklist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionOpen(false);
                        setSearchOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-white font-medium text-[#0F172A] flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-[16px]">search</span>
                      <span>Search households</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate('S14')}
                      className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-white font-medium text-[#0F172A] flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-[16px]">report</span>
                      <span>Go to conflicts queue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate('S21')}
                      className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-white font-medium text-[#6D28D9] flex items-center gap-2 border-t border-slate-200/70 pt-2"
                    >
                      <span className="material-symbols-outlined !text-[16px]">palette</span>
                      <span>States Gallery (S21)</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden sm:block h-6 w-px bg-slate-300/70" />

              {/* User / Role Avatar Pill (matching reference image top-right) */}
              <button
                type="button"
                onClick={() => handleNavigate('S01')}
                title="Switch demonstration role (S01)"
                className="flex items-center gap-2.5 text-left pl-1 pr-2 py-1 rounded-full hover:bg-white/70 transition-colors focus-ring"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white font-inter text-xs font-extrabold flex items-center justify-center shadow-xs shrink-0 border-2 border-white">
                  {role === 'FIELD_OFFICER' ? 'FO' : role === 'PORTFOLIO_MANAGER' ? 'PM' : 'CR'}
                </div>
                <div className="hidden md:block leading-tight">
                  <span className="text-xs font-extrabold text-[#0F172A] block">
                    {role === 'FIELD_OFFICER'
                      ? 'Field Officer'
                      : role === 'PORTFOLIO_MANAGER'
                      ? 'Portfolio Manager'
                      : 'Compliance Reviewer'}
                  </span>
                  <span className="font-inter text-[10px] font-medium text-[#64748B] block">
                    {role === 'FIELD_OFFICER'
                      ? 'OFFICER-SYN-01 · FSP-01'
                      : role === 'PORTFOLIO_MANAGER'
                      ? 'Aggregate Scope · 3 FSPs'
                      : 'Audit & Provenance'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Slim Demo Banner under Top Bar on Every Screen */}
          <div className="max-w-[1440px] mx-auto mt-1.5 px-3 sm:px-5 py-1 rounded-full bg-white/70 border border-white/90 flex items-center justify-between gap-2 text-[11px] font-inter text-[#334155]">
            <span className="truncate">
              <strong>Demonstration environment.</strong> All households, lenders and officers are synthetic.
            </span>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setLegendOpen(true)}
                className="font-semibold text-[#6D28D9] hover:underline whitespace-nowrap"
              >
                Evidence legend
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('S21')}
                className="hidden sm:inline font-semibold text-[#334155] hover:underline whitespace-nowrap"
              >
                S21 States Gallery
              </button>
            </div>
          </div>
        </header>

        {/* Main Screen Viewport */}
        <main
          id="sanket-main-content"
          className={`flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-8 ${
            density === 'compact' ? 'py-3' : 'py-5'
          }`}
        >
          {/* Household Profile Views (S05–S09 + Tab 6 + Tab 7) */}
          {isProfileScreen && (
            <>
              {!canRoleAccessHouseholdDetail(role) ? (
                <RestrictedAccessCard
                  role={role}
                  attemptedView={`Household Profile (${currentHousehold.household_id})`}
                  onNavigate={handleNavigate}
                  onSwitchRole={(newR) => {
                    setRole(newR);
                    showToast(`Switched demo role to ${newR}`);
                  }}
                />
              ) : (
                <>
                  <HouseholdProfileHeader
                    household={currentHousehold}
                    activeTab={screen}
                    onSelectTab={(tab) => setScreen(tab)}
                    onOpenReview={() => setScreen('S10_DETAIL')}
                    onOpenWhatIf={() => setScreen('S11')}
                    onCopyId={(id) => showToast(`Copied ${id} to clipboard`)}
                    allHouseholds={households}
                    onSelectHousehold={(id) => setSelectedHouseholdId(id)}
                  />
                  {screen === 'S05' && (
                    <S05ProfileOverview
                      household={currentHousehold}
                      onSelectTab={(t) => setScreen(t)}
                      onNavigate={handleNavigate}
                      onCopyId={(id) => showToast(`Copied ${id}`)}
                    />
                  )}
                  {screen === 'S06' && (
                    <S06FinancialHealth
                      household={currentHousehold}
                      onSelectTab={(t) => setScreen(t)}
                      onNavigate={handleNavigate}
                      onCopyId={(id) => showToast(`Copied ${id}`)}
                    />
                  )}
                  {screen === 'S07' && (
                    <S07SeasonalCashFlow
                      household={currentHousehold}
                      onSelectTab={(t) => setScreen(t)}
                      onNavigate={handleNavigate}
                      onOpenWhatIf={() => setScreen('S11')}
                      onCopyId={(id) => showToast(`Copied ${id}`)}
                    />
                  )}
                  {screen === 'S08' && (
                    <S08LoansRepayments
                      household={currentHousehold}
                      onSelectTab={(t) => setScreen(t)}
                      onNavigate={handleNavigate}
                      onOpenWhatIf={() => setScreen('S11')}
                      onCopyId={(id) => showToast(`Copied ${id}`)}
                    />
                  )}
                  {screen === 'S09' && (
                    <S09SavingsCheckins
                      household={currentHousehold}
                      onSelectTab={(t) => setScreen(t)}
                      onNavigate={handleNavigate}
                      onCopyId={(id) => showToast(`Copied ${id}`)}
                    />
                  )}
                  {screen === 'S05_DATA' && (
                    <ProfileTab6DataSources
                      household={currentHousehold}
                      provenanceEntries={provenance}
                      onCopyId={(id) => showToast(`Copied ${id}`)}
                    />
                  )}
                  {screen === 'S05_REVIEWS' && (
                    <ProfileTab7ReviewHistory
                      household={currentHousehold}
                      onOpenReviewPage={() => setScreen('S10_DETAIL')}
                    />
                  )}
                </>
              )}
            </>
          )}

          {screen === 'S02' && (
            <S02Overview
              role={role}
              onNavigate={handleNavigate}
              onSelectHousehold={handleSelectHousehold}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S03' && (
            <S03Worklist
              role={role}
              initialTab={worklistFilterPreset}
              onSelectHousehold={(id) => handleSelectHousehold(id, 'S05')}
              onNavigate={handleNavigate}
              onSwitchRole={setRole}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S04' && (
            <S04HouseholdsDirectory
              role={role}
              onSelectHousehold={(id) => handleSelectHousehold(id, 'S05')}
              onNavigate={handleNavigate}
              onSwitchRole={setRole}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S10' && (
            <S10RecommendationQueue
              role={role}
              households={households}
              onSelectHouseholdReview={(id) => {
                setSelectedHouseholdId(id);
                setScreen('S10_DETAIL');
              }}
              onNavigate={handleNavigate}
              onSwitchRole={setRole}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S10_DETAIL' && (
            <S10RecommendationDetail
              role={role}
              household={currentHousehold}
              allHouseholds={households}
              onSelectHousehold={(id) => setSelectedHouseholdId(id)}
              onOpenDecisionDrawer={(preview) => {
                setS15PreviewMode(preview);
                setS15Open(true);
              }}
              onOpenWhatIf={() => setScreen('S11')}
              onOpenProfile={() => setScreen('S05')}
              onNavigate={handleNavigate}
              onCreateVerificationTask={handleCreateVerificationTask}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S11' && (
            <S11WhatIfSimulator
              role={role}
              household={currentHousehold}
              onBackToHousehold={() => setScreen('S07')}
              onBackToReview={() => setScreen('S10_DETAIL')}
              onNavigate={handleNavigate}
              onSwitchRole={setRole}
            />
          )}

          {screen === 'S12' && (
            <S12PortfolioInsights role={role} onNavigate={handleNavigate} />
          )}

          {screen === 'S13' && (
            <S13DataQuality
              role={role}
              entries={provenance}
              onNavigate={handleNavigate}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S14' && (
            <S14ConflictsVerification
              role={role}
              conflicts={conflicts}
              initialHouseholdFilter={s14HouseholdFilter}
              onRecordVerification={handleRecordConflictVerification}
              onNavigate={handleNavigate}
              onSelectHousehold={(id) => handleSelectHousehold(id, 'S05')}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S16' && (
            <S16AuditHistory
              role={role}
              entries={provenance}
              reviews={households.map((h) => h.human_review)}
              onNavigate={handleNavigate}
              onSwitchRole={setRole}
              onSelectHousehold={(id) => handleSelectHousehold(id, 'S05')}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S17' && (
            <S17GovernanceCompliance onNavigate={handleNavigate} />
          )}

          {screen === 'S18' && (
            <S18NotificationsFollowups
              role={role}
              notifications={notifications}
              followups={followups}
              onMarkAllRead={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
                showToast('Marked all notifications as read on this device.');
              }}
              onSelectHousehold={handleSelectHousehold}
              onNavigate={handleNavigate}
              onCopyId={(id) => showToast(`Copied ${id}`)}
            />
          )}

          {screen === 'S20' && (
            <S20Settings
              role={role}
              textSize={textSize}
              density={density}
              contrast={contrast}
              reduceMotion={reduceMotion}
              onUpdateTextSize={(s) => {
                setTextSize(s);
                showToast('Saved on this device.');
              }}
              onUpdateDensity={(d) => {
                setDensity(d);
                showToast('Saved on this device.');
              }}
              onUpdateContrast={(c) => {
                setContrast(c);
                showToast('Saved on this device.');
              }}
              onUpdateReduceMotion={(r) => {
                setReduceMotion(r);
                showToast('Saved on this device.');
              }}
              onRequestRoleSwitch={(newRole) => {
                setRole(newRole);
                handleNavigate('S02');
                showToast(`Switched demonstration role to ${newRole}.`);
              }}
              onResetDemo={() => {
                setHouseholds(HOUSEHOLDS_DATA);
                setConflicts(INITIAL_CONFLICTS);
                setProvenance(INITIAL_PROVENANCE_ENTRIES);
                setNotifications(INITIAL_NOTIFICATIONS);
                setFollowups(INITIAL_FOLLOWUPS);
                setTextSize('default');
                setContrast('standard');
                handleNavigate('S01');
              }}
              onNavigate={handleNavigate}
            />
          )}

          {screen === 'S21' && (
            <S21StatesGallery
              highContrast={contrast === 'high'}
              onToggleHighContrast={() =>
                setContrast((c) => (c === 'high' ? 'standard' : 'high'))
              }
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (< 1024px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-2 border-t border-white px-2 py-1.5 flex items-center justify-around"
      >
        {[
          { id: 'S02' as ScreenId, label: 'Overview', icon: 'dashboard' },
          { id: 'S03' as ScreenId, label: 'Worklist', icon: 'list_alt' },
          { id: 'S04' as ScreenId, label: 'Households', icon: 'holiday_village' },
          { id: 'S10' as ScreenId, label: 'Reviews', icon: 'fact_check' },
          { id: 'S20' as ScreenId, label: 'More', icon: 'menu' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleNavigate(m.id)}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded-[10px] text-[11px] font-inter font-semibold ${
              screen === m.id ? 'text-[#4648D4]' : 'text-[#475569]'
            }`}
          >
            <span className="material-symbols-outlined !text-[20px]">{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </nav>

      {/* S15 Right Decision Drawer */}
      <S15HumanReviewDrawer
        open={s15Open}
        household={currentHousehold}
        initialPreviewMode={s15PreviewMode}
        onClose={() => setS15Open(false)}
        onSaveDecision={handleSaveHumanDecision}
      />

      {/* S19 Global Search Overlay */}
      <S19GlobalSearchModal
        open={searchOpen}
        role={role}
        provenanceEntries={provenance}
        onClose={() => setSearchOpen(false)}
        onSelectHousehold={handleSelectHousehold}
        onNavigate={handleNavigate}
      />

      {/* Evidence-State Legend Modal */}
      <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />

      {/* Global Polite Toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 lg:bottom-6 right-6 z-50 glass-2 rounded-[16px] px-4 py-3 shadow-xl flex items-center gap-3 max-w-md border border-[#5558E8]/30"
        >
          <span className="material-symbols-outlined text-[#4648D4]">check_circle</span>
          <span className="text-xs font-inter font-semibold text-[#0F172A]">{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            aria-label="Dismiss notification toast"
            className="text-[#475569] hover:text-[#0F172A] ml-2"
          >
            <span className="material-symbols-outlined !text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
