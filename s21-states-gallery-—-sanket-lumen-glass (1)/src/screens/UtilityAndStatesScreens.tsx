import React, { useState } from 'react';
import {
  HOUSEHOLDS_DATA,
  OPEN_DECISIONS_LIST,
  ProvenanceEntry,
} from '../data/sanketData';
import {
  EvidenceState,
  RoleId,
  ScreenId,
  TEST_FIXTURES,
  TestFixtureId,
  filterHouseholdsByScope,
  formatINR,
  validateHouseholdProfileContract,
} from '../utils/sanketLogic';
import {
  CompletenessBar,
  CopyableId,
  EVIDENCE_STATE_META,
  EvidenceChip,
} from '../components/SharedPrimitives';

export interface DemoNotificationItem {
  id: string;
  group: 'Today' | 'This week';
  category: 'INSTALMENTS' | 'REMITTANCES' | 'DATA_QUALITY' | 'CHECKINS';
  title: string;
  household_id: string;
  date_label: string;
  state: EvidenceState;
  unread: boolean;
  targetScreen: ScreenId;
}

export interface DemoFollowupItem {
  id: string;
  household_id: string;
  requested_on: string;
  last_contact: string;
  status: 'Open';
  note: string;
}

interface S18Props {
  role: RoleId;
  notifications: DemoNotificationItem[];
  followups: DemoFollowupItem[];
  onMarkAllRead: () => void;
  onSelectHousehold: (id: string, screen?: ScreenId) => void;
  onNavigate: (screen: ScreenId) => void;
  onCopyId: (id: string) => void;
}

export const S18NotificationsFollowups: React.FC<S18Props> = ({
  role,
  notifications,
  followups,
  onMarkAllRead,
  onSelectHousehold,
  onNavigate,
  onCopyId,
}) => {
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'FOLLOWUPS'>('NOTIFICATIONS');
  const [catFilter, setCatFilter] = useState<
    'ALL' | 'INSTALMENTS' | 'REMITTANCES' | 'DATA_QUALITY' | 'CHECKINS'
  >('ALL');

  if (role === 'PORTFOLIO_MANAGER') {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
          Notifications and Follow-ups (Aggregate Alerts)
        </h1>
        <div className="surface-solid rounded-[16px] p-4 border-l-4 border-l-[#5558E8]">
          <p className="text-xs font-semibold text-[#0F172A]">
            Demonstration workflow. Notifications are worked out from the data on screen; the data architecture defines no notification or task store (Q-02). Portfolio Managers receive aggregate counts only.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-inter">
          <div className="surface-solid rounded-[20px] p-5">
            <p className="text-xs text-[#475569]">Instalments due in 14 days</p>
            <p className="text-3xl font-bold text-[#0F172A] mt-1 tabular-nums">14</p>
          </div>
          <div className="surface-solid rounded-[20px] p-5">
            <p className="text-xs text-[#475569]">Open source conflicts</p>
            <p className="text-3xl font-bold text-[#93000A] mt-1 tabular-nums">2 households</p>
          </div>
          <div className="surface-solid rounded-[20px] p-5">
            <p className="text-xs text-[#475569]">Check-in follow-ups requested</p>
            <p className="text-3xl font-bold text-[#4648D4] mt-1 tabular-nums">{followups.length}</p>
          </div>
        </div>
      </div>
    );
  }

  const visibleNotifs = notifications.filter(
    (n) => catFilter === 'ALL' || n.category === catFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
            Notifications and Follow-ups
          </h1>
          <p className="text-sm text-[#475569]">
            Items in the synthetic dataset that deserve attention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Notifications tabs" className="inline-flex p-1 rounded-full glass-1">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'NOTIFICATIONS'}
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`px-4 py-1.5 rounded-full text-xs font-inter font-semibold ${
                activeTab === 'NOTIFICATIONS' ? 'btn-primary-gradient text-white' : 'text-[#334155]'
              }`}
            >
              Notifications ({notifications.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'FOLLOWUPS'}
              onClick={() => setActiveTab('FOLLOWUPS')}
              className={`px-4 py-1.5 rounded-full text-xs font-inter font-semibold ${
                activeTab === 'FOLLOWUPS' ? 'btn-primary-gradient text-white' : 'text-[#334155]'
              }`}
            >
              Follow-ups ({followups.length})
            </button>
          </div>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="glass-1 px-3.5 py-2 rounded-[10px] text-xs font-inter font-semibold text-[#0F172A] hover:bg-white"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="surface-solid rounded-[16px] p-4 border-l-4 border-l-[#5558E8] flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[#0F172A]">
          Demonstration workflow. Notifications are worked out from the data on screen; the data architecture defines no notification or task store (Q-02).
        </p>
        <EvidenceChip state="PROVISIONAL" customLabel="Browser session only" size="sm" />
      </div>

      {activeTab === 'NOTIFICATIONS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'INSTALMENTS', label: 'Instalments' },
                  { id: 'REMITTANCES', label: 'Remittances' },
                  { id: 'DATA_QUALITY', label: 'Data quality' },
                  { id: 'CHECKINS', label: 'Check-ins' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCatFilter(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-inter font-semibold ${
                    catFilter === c.id
                      ? 'btn-primary-gradient text-white'
                      : 'surface-solid text-[#334155]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {(['Today', 'This week'] as const).map((grp) => {
              const items = visibleNotifs.filter((n) => n.group === grp);
              if (items.length === 0) return null;
              return (
                <div key={grp} className="space-y-3">
                  <h2 className="font-inter text-xs font-bold uppercase tracking-wider text-[#475569]">
                    {grp}
                  </h2>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="surface-solid rounded-[18px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <EvidenceChip state={item.state} size="sm" />
                          {item.unread ? (
                            <span className="px-2 py-0.5 rounded bg-[#EEF2FF] text-[#4648D4] font-inter text-[11px] font-bold">
                              New
                            </span>
                          ) : (
                            <span className="font-inter text-[11px] text-[#475569]">
                              Read on this device
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-[#0F172A] pt-1">{item.title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          item.targetScreen === 'S14'
                            ? onNavigate('S14')
                            : onSelectHousehold(item.household_id, item.targetScreen)
                        }
                        className="px-3.5 py-2 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-xs font-inter font-semibold text-[#0F172A] shrink-0"
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-4 surface-solid rounded-[24px] p-6 space-y-3">
            <h2 className="text-base font-bold text-[#0F172A]">Summary</h2>
            <ul className="space-y-2 font-inter text-xs">
              <li className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Instalments due soon</span>
                <span className="font-bold">2</span>
              </li>
              <li className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Expected remittances</span>
                <span className="font-bold">1</span>
              </li>
              <li className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Data quality &amp; conflicts</span>
                <span className="font-bold">2</span>
              </li>
              <li className="flex justify-between py-1.5">
                <span>Check-in follow-ups</span>
                <span className="font-bold">{followups.length}</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="surface-solid rounded-[24px] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#0F172A]">
            Follow-ups requested at check-in (plus demo verification tasks)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-inter text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#475569]">
                  <th scope="col" className="py-3 px-3">Household</th>
                  <th scope="col" className="py-3 px-3">Requested on</th>
                  <th scope="col" className="py-3 px-3">Note / Source</th>
                  <th scope="col" className="py-3 px-3">Last contact</th>
                  <th scope="col" className="py-3 px-3">Status</th>
                  <th scope="col" className="py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followups.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <CopyableId
                        id={f.household_id}
                        onClick={() => onSelectHousehold(f.household_id, 'S05')}
                        onCopy={onCopyId}
                      />
                    </td>
                    <td className="py-3 px-3 tabular-nums">{f.requested_on}</td>
                    <td className="py-3 px-3 text-[#334155]">{f.note}</td>
                    <td className="py-3 px-3 text-[#475569]">{f.last_contact}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-[#4648D4] font-semibold">
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onSelectHousehold(f.household_id, 'S05')}
                        className="text-[#4648D4] font-semibold hover:underline"
                      >
                        Open household →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface S19Props {
  open: boolean;
  role: RoleId;
  provenanceEntries: ProvenanceEntry[];
  onClose: () => void;
  onSelectHousehold: (id: string, screen?: ScreenId) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const S19GlobalSearchModal: React.FC<S19Props> = ({
  open,
  role,
  provenanceEntries,
  onClose,
  onSelectHousehold,
  onNavigate,
}) => {
  const [query, setQuery] = useState('SANKET-HH-0001');
  const [scope, setScope] = useState<'ALL' | 'HOUSEHOLDS' | 'LOANS' | 'RECORDS' | 'DECISIONS'>('ALL');

  if (!open) return null;

  const q = query.trim().toLowerCase();

  // Enforce role & FSP-SYN-01 cohort scoping (FO-INT-304, AC-S19-2, FO-TC-411, FX-05)
  const scopedHouseholds = filterHouseholdsByScope(HOUSEHOLDS_DATA, role, 'FSP-SYN-01');
  const scopedHouseholdIds = new Set(scopedHouseholds.map((h) => h.household_id));

  const matchedHouseholds = scopedHouseholds
    .filter((h) =>
      `${h.household_id} ${h.village_name} ${h.block_name} ${h.shg_group_id || ''}`
        .toLowerCase()
        .includes(q)
    )
    .slice(0, 6);

  const matchedLoans = scopedHouseholds
    .flatMap((h) => h.loans)
    .filter((l) =>
      `${l.loan_account_id} ${l.originating_institution_name} ${l.household_id}`
        .toLowerCase()
        .includes(q)
    )
    .slice(0, 4);

  const matchedRecords =
    role === 'PORTFOLIO_MANAGER'
      ? []
      : provenanceEntries
          .filter(
            (p) =>
              (role === 'COMPLIANCE_REVIEWER' || scopedHouseholdIds.has(p.household_id)) &&
              `${p.referenced_record_id} ${p.provenance_id} ${p.referenced_dataset_name} ${p.household_id}`
                .toLowerCase()
                .includes(q)
          )
          .slice(0, 4);

  const matchedDecisions = OPEN_DECISIONS_LIST.filter((d) =>
    `${d.id} ${d.title} ${d.targetWorkstream}`.toLowerCase().includes(q)
  ).slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs pt-14 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
    >
      <div className="glass-2 rounded-[24px] max-w-[660px] w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-3 bg-white rounded-[14px] px-3.5 py-2.5 border border-slate-300">
          <span className="material-symbols-outlined text-[#475569]">search</span>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search households (SANKET-HH-...), loans (SANKET-LN-...), provenance, or Q-01..Q-20"
            className="w-full text-sm font-inter text-[#0F172A] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-inter font-semibold text-[#475569] hover:text-[#0F172A]"
          >
            Esc
          </button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'HOUSEHOLDS', 'LOANS', 'RECORDS', 'DECISIONS'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`px-2.5 py-1 rounded-[8px] text-xs font-inter font-semibold ${
                  scope === s ? 'btn-primary-gradient text-white' : 'bg-white text-[#334155]'
                }`}
              >
                {s === 'ALL'
                  ? 'All'
                  : s === 'HOUSEHOLDS'
                  ? 'Households'
                  : s === 'LOANS'
                  ? 'Loans'
                  : s === 'RECORDS'
                  ? 'Provenance'
                  : 'Open Decisions'}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-inter text-[#475569]">
            Households are pseudonymous tokens (Decision D5).
          </span>
        </div>

        {role === 'PORTFOLIO_MANAGER' && (scope === 'HOUSEHOLDS' || scope === 'LOANS') ? (
          <div className="surface-solid rounded-[16px] p-4 space-y-2">
            <p className="text-xs font-bold text-[#0F172A]">
              Household-level search is not available for Portfolio Manager. You can search corridors, datasets, and Open Decisions (Q-01..Q-20).
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('S12');
              }}
              className="text-xs font-inter font-semibold text-[#4648D4] hover:underline"
            >
              Open Portfolio Insights (S12) →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {role === 'PORTFOLIO_MANAGER' && (
              <div className="p-3 rounded-[12px] bg-indigo-50/80 border border-indigo-200 text-xs font-inter text-[#334155]">
                Household-level search is not available for Portfolio Manager. Showing aggregate &amp; governance results only.
              </div>
            )}

            {(scope === 'ALL' || scope === 'HOUSEHOLDS') && matchedHouseholds.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Households ({matchedHouseholds.length})
                </p>
                {matchedHouseholds.map((h) => (
                  <button
                    key={h.household_id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectHousehold(h.household_id, 'S05');
                    }}
                    className="w-full surface-solid rounded-[12px] p-3 text-left hover:border-[#5558E8] flex items-center justify-between"
                  >
                    <span className="font-inter text-xs font-bold text-[#0F172A]">
                      {h.household_id} · {h.village_name}, {h.block_name} · {h.fsp_partner_id}
                    </span>
                    <span className="text-xs font-inter text-[#4648D4]">Open S05 →</span>
                  </button>
                ))}
              </div>
            )}

            {(scope === 'ALL' || scope === 'LOANS') && matchedLoans.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Loans ({matchedLoans.length})
                </p>
                {matchedLoans.map((l) => (
                  <button
                    key={l.loan_account_id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectHousehold(l.household_id, 'S08');
                    }}
                    className="w-full surface-solid rounded-[12px] p-3 text-left hover:border-[#5558E8] flex items-center justify-between"
                  >
                    <span className="font-inter text-xs font-bold text-[#0F172A]">
                      {l.loan_account_id} · {l.originating_institution_name} · {l.loan_status}
                    </span>
                    <span className="text-xs font-inter text-[#4648D4]">{l.household_id} (S08) →</span>
                  </button>
                ))}
              </div>
            )}

            {(scope === 'ALL' || scope === 'RECORDS') && matchedRecords.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Provenance &amp; Source Records ({matchedRecords.length})
                </p>
                {matchedRecords.map((r) => (
                  <button
                    key={r.provenance_id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('S13');
                    }}
                    className="w-full surface-solid rounded-[12px] p-3 text-left hover:border-[#5558E8] flex items-center justify-between"
                  >
                    <span className="font-inter text-xs font-bold text-[#0F172A]">
                      {r.referenced_record_id} · {r.referenced_dataset_name} ({r.household_id})
                    </span>
                    <span className="text-xs font-inter text-[#475569]">{r.provenance_id} →</span>
                  </button>
                ))}
              </div>
            )}

            {(scope === 'ALL' || scope === 'DECISIONS') && matchedDecisions.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-inter text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Open Decisions ({matchedDecisions.length})
                </p>
                {matchedDecisions.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('S17');
                    }}
                    className="w-full surface-solid rounded-[12px] p-3 text-left hover:border-[#5558E8] flex items-center justify-between gap-2"
                  >
                    <span className="font-inter text-xs font-bold text-[#0F172A] truncate">
                      {d.id} · {d.title}
                    </span>
                    <span className="text-xs font-inter text-[#4648D4] shrink-0">S17 →</span>
                  </button>
                ))}
              </div>
            )}

            {matchedHouseholds.length === 0 &&
              matchedLoans.length === 0 &&
              matchedRecords.length === 0 &&
              matchedDecisions.length === 0 && (
                <div className="surface-solid rounded-[14px] p-6 text-center text-xs font-inter text-[#475569]">
                  No matching records in your scope ({role === 'FIELD_OFFICER' ? 'FSP-SYN-01' : role}).
                </div>
              )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-inter text-[#475569]">
          <span>↑↓ to move · Enter to open · Esc to close</span>
          <span>
            Scope: {role === 'FIELD_OFFICER' ? 'FIELD_OFFICER · FSP-SYN-01' : role}
          </span>
        </div>
      </div>
    </div>
  );
};

interface S20SettingsProps {
  role: RoleId;
  textSize: 'default' | 'large' | 'larger';
  density: 'comfortable' | 'compact';
  contrast: 'standard' | 'high';
  reduceMotion: boolean;
  onUpdateTextSize: (s: 'default' | 'large' | 'larger') => void;
  onUpdateDensity: (d: 'comfortable' | 'compact') => void;
  onUpdateContrast: (c: 'standard' | 'high') => void;
  onUpdateReduceMotion: (r: boolean) => void;
  onRequestRoleSwitch: (newRole: RoleId) => void;
  onResetDemo: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const S20Settings: React.FC<S20SettingsProps> = ({
  role,
  textSize,
  density,
  contrast,
  reduceMotion,
  onUpdateTextSize,
  onUpdateDensity,
  onUpdateContrast,
  onUpdateReduceMotion,
  onRequestRoleSwitch,
  onResetDemo,
  onNavigate,
}) => {
  const [pendingRoleModal, setPendingRoleModal] = useState<RoleId | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-sm text-[#475569]">
          Display preferences stored on this device, plus the demonstration role switch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 glass-1 rounded-[24px] p-4 space-y-1 font-inter text-xs font-semibold">
          {['Display', 'Language', 'Notifications', 'Demonstration', 'About'].map((sec) => (
            <a
              key={sec}
              href={`#settings-${sec.toLowerCase()}`}
              className="block px-3.5 py-2.5 rounded-[10px] text-[#334155] hover:bg-white hover:text-[#0F172A]"
            >
              {sec}
            </a>
          ))}
        </div>

        <div className="lg:col-span-9 space-y-6">
          <section id="settings-display" className="surface-solid rounded-[24px] p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Display</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-inter">
              <div className="space-y-1.5">
                <span className="font-semibold text-[#334155]">Text size</span>
                <div className="flex gap-1.5">
                  {(['default', 'large', 'larger'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onUpdateTextSize(sz)}
                      className={`px-3 py-1.5 rounded-[8px] font-semibold capitalize ${
                        textSize === sz
                          ? 'btn-primary-gradient text-white'
                          : 'bg-slate-100 text-[#334155]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-[#334155]">Density</span>
                <div className="flex gap-1.5">
                  {(['comfortable', 'compact'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onUpdateDensity(d)}
                      className={`px-3 py-1.5 rounded-[8px] font-semibold capitalize ${
                        density === d
                          ? 'btn-primary-gradient text-white'
                          : 'bg-slate-100 text-[#334155]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-[#334155]">Contrast</span>
                <div className="flex gap-1.5">
                  {(['standard', 'high'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onUpdateContrast(c)}
                      className={`px-3 py-1.5 rounded-[8px] font-semibold capitalize ${
                        contrast === c
                          ? 'btn-primary-gradient text-white'
                          : 'bg-slate-100 text-[#334155]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[12px] bg-slate-50">
                <label htmlFor="s20-motion" className="font-semibold text-[#0F172A]">
                  Reduce motion
                </label>
                <input
                  id="s20-motion"
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => onUpdateReduceMotion(e.target.checked)}
                />
              </div>
            </div>
          </section>

          <section id="settings-language" className="surface-solid rounded-[24px] p-6 space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">Language</h2>
            <div className="space-y-2 text-xs font-inter">
              <div className="p-3 rounded-[10px] bg-[#EEF2FF] border border-[#5558E8] font-bold text-[#0F172A]">
                English (selected)
              </div>
              <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200 text-slate-400">
                ଓଡ଼ିଆ (Odia) · Not yet available
              </div>
              <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200 text-slate-400">
                हिन्दी (Hindi) · Not yet available
              </div>
            </div>
            <p className="text-xs text-[#475569]">
              Translations have not been supplied (Open Decision Q-11).
            </p>
          </section>

          <section id="settings-demonstration" className="surface-solid rounded-[24px] p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-[#0F172A]">Demonstration</h2>
              <span className="px-2.5 py-1 rounded bg-[#EEF2FF] text-[#4648D4] font-inter text-xs font-bold">
                Demonstration control. Not authentication.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { id: 'FIELD_OFFICER', label: 'Field Officer (OFFICER-SYN-01)' },
                  { id: 'PORTFOLIO_MANAGER', label: 'Portfolio Manager (Aggregates)' },
                  { id: 'COMPLIANCE_REVIEWER', label: 'Compliance Reviewer (Audit)' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    if (r.id !== role) setPendingRoleModal(r.id);
                  }}
                  className={`p-3.5 rounded-[12px] text-left font-inter text-xs font-semibold border transition-colors ${
                    role === r.id
                      ? 'border-2 border-[#5558E8] bg-[#EEF2FF] text-[#0F172A]'
                      : 'border-slate-300 bg-white text-[#334155] hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onResetDemo}
                className="px-4 py-2 rounded-[10px] border border-slate-300 text-xs font-inter font-semibold text-[#0F172A] hover:bg-slate-100"
              >
                Reset demonstration
              </button>
            </div>
          </section>

          <section id="settings-about" className="surface-solid rounded-[24px] p-6 space-y-3">
            <h2 className="text-lg font-bold text-[#0F172A]">About</h2>
            <p className="text-xs font-inter text-[#334155]">
              SANKET Demonstration · Data contract <code className="font-semibold">sanket.household_profile.v1</code> · Reference date 17 Oct 2026 · All data is synthetic.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('S21')}
                className="btn-primary-gradient px-4 py-2.5 rounded-[10px] text-xs font-inter font-semibold inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined !text-[18px]">palette</span>
                <span>Open S21 States Gallery</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {pendingRoleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="surface-solid rounded-[20px] max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A]">
              Switch to{' '}
              {pendingRoleModal === 'PORTFOLIO_MANAGER'
                ? 'Portfolio Manager'
                : pendingRoleModal === 'COMPLIANCE_REVIEWER'
                ? 'Compliance Reviewer'
                : 'Field Officer'}
              ?
            </h3>
            <p className="text-xs text-[#334155]">
              {pendingRoleModal === 'PORTFOLIO_MANAGER'
                ? 'Switch to Portfolio Manager? You will see aggregates only.'
                : pendingRoleModal === 'COMPLIANCE_REVIEWER'
                ? 'Switch to Compliance Reviewer? You will see provenance tokens, conflicts and audit history.'
                : 'Switch to Field Officer? You will see the 12 households in FSP-SYN-01.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingRoleModal(null)}
                className="px-4 py-2 rounded-[10px] border border-slate-300 text-xs font-inter font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = pendingRoleModal;
                  setPendingRoleModal(null);
                  onRequestRoleSwitch(target);
                }}
                className="btn-primary-gradient px-4 py-2 rounded-[10px] text-xs font-inter font-semibold"
              >
                Confirm switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const S21StatesGallery: React.FC<{
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onNavigate: (screen: ScreenId) => void;
}> = ({ highContrast, onToggleHighContrast, onNavigate }) => {
  const [selectedFixtureId, setSelectedFixtureId] = useState<TestFixtureId>('FX-01');
  const activeFixture = TEST_FIXTURES[selectedFixtureId];
  const fixtureValidation = validateHouseholdProfileContract(activeFixture.payload);

  const statesOrder: EvidenceState[] = [
    'OBSERVED',
    'DERIVED',
    'EXPECTED',
    'DELAYED',
    'NOT_CONFIGURED',
    'MISSING',
    'STALE',
    'CONFLICT',
    'PROVISIONAL',
  ];

  const eightEmptyPendingPatterns = [
    {
      code: 'E-01',
      field: 'indicator_results[IND_01..IND_08].value = null',
      screens: 'S06 Financial Health',
      chipLabel: 'Not configured (formula pending)',
      chipState: 'NOT_CONFIGURED' as const,
      copy: 'All 8 indicator slots render with NOT_CONFIGURED status alongside observed source evidence.',
    },
    {
      code: 'E-02',
      field: 'dimension_scores.spend_score..plan_score = null',
      screens: 'S06 Financial Health',
      chipLabel: 'Score not configured',
      chipState: 'NOT_CONFIGURED' as const,
      copy: 'Spend, Save, Borrow, and Plan score cards show — and Scoring formula pending (Q-01).',
    },
    {
      code: 'E-03',
      field: 'seasonal_context_score.value = null',
      screens: 'S06 Financial Health',
      chipLabel: 'Numeric score: Not configured',
      chipState: 'NOT_CONFIGURED' as const,
      copy: 'Classification LEAN_PRESSURE is shown with supporting evidence; numeric score slot is Not configured (Q-13).',
    },
    {
      code: 'E-04',
      field: 'recommendation.recommendation_status = INSUFFICIENT_DATA',
      screens: 'S03, S04, S05, S10',
      chipLabel: 'Insufficient data · Field visit recommended',
      chipState: 'MISSING' as const,
      copy: 'Decision rules pending or < 3 evidence items or LOW completeness; action_code is null.',
    },
    {
      code: 'E-05',
      field: 'recommendation.recommendation_status = CONFLICT_REQUIRES_REVIEW',
      screens: 'S03, S04, S05, S10, S14',
      chipLabel: 'Hold · Verify conflicting records',
      chipState: 'CONFLICT' as const,
      copy: 'Active source conflict blocks automated suggestions until officer field verification.',
    },
    {
      code: 'E-06',
      field: 'savings_summary.shg_group_name = null (HH-000105)',
      screens: 'S05 Overview, S09 Savings',
      chipLabel: 'Missing — not on file',
      chipState: 'MISSING' as const,
      copy: 'No SHG savings record is on file for this household.',
    },
    {
      code: 'E-07',
      field: 'repayment_history = [] (HH-000112)',
      screens: 'S08 Loans & Repayments',
      chipLabel: 'No repayment rows recorded',
      chipState: 'MISSING' as const,
      copy: 'No repayment rows recorded. This does not mean no payments were made.',
    },
    {
      code: 'E-08',
      field: 'llm_explanation = null',
      screens: 'S10 Recommendation Review',
      chipLabel: 'Not generated',
      chipState: 'NOT_CONFIGURED' as const,
      copy: 'Supplementary explanation not generated. When present, always labelled Supplementary explanation. The evidence above is the basis.',
    },
  ];

  const fourErrorConflictAccessPatterns = [
    {
      id: 'ERR-01',
      title: '1. CONFLICT_DETECTED comparison card (SANKET-HH-000104)',
      state: 'CONFLICT' as const,
      badge: 'Conflict · Compare side by side',
      body: 'Source 1 (MFI A LMS): ₹38,000.00 (25 Sep 2026) vs Source 2 (NBFC C LMS): ₹41,200.00 (2 Oct 2026). Neither value is overwritten.',
      trigger: 'conflict_status = CONFLICT_DETECTED',
    },
    {
      id: 'ERR-02',
      title: '2. Validation failed banner (FX-04 / FX-06)',
      state: 'CONFLICT' as const,
      badge: 'This record failed a data check',
      body: 'This record failed a data check: composite_score is forbidden (D6) or action_code is non-null while status is INSUFFICIENT_DATA.',
      trigger: 'schema_validation_status = FAILED',
    },
    {
      id: 'ERR-03',
      title: '3. Duplicate record warning',
      state: 'PROVISIONAL' as const,
      badge: 'Duplicate record flagged',
      body: 'Duplicate record detected on ingestion; retained in provenance log with duplicate_check_status = DUPLICATE for audit review.',
      trigger: 'duplicate_check_status = DUPLICATE',
    },
    {
      id: 'ERR-04',
      title: '4. Restricted role view card (FX-08)',
      state: 'CONFLICT' as const,
      badge: 'Restricted role view',
      body: 'Household-level records are not available for the Portfolio Manager role. Switch to Portfolio Insights (S12) for aggregate cohort views.',
      trigger: 'Role = PORTFOLIO_MANAGER on S03/S04/S05–S11',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="glass-1 rounded-[24px] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-inter text-xs font-semibold uppercase tracking-wider text-[#4648D4]">
            S21 · Prototype Review Catalogue (Section 5.20 &amp; Section 14.1)
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mt-0.5">States Gallery</h1>
          <p className="text-sm text-[#475569]">
            All evidence-state chips, E-01..E-08 empty/pending card patterns, 4 error/conflict/access patterns, and FX-01..FX-10 test fixtures.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleHighContrast}
            className="glass-2 px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold text-[#0F172A] focus-ring"
          >
            Canvas: {highContrast ? 'High-contrast' : 'Light-canvas'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('S02')}
            className="btn-primary-gradient px-4 py-2.5 rounded-[12px] text-xs font-inter font-semibold"
          >
            Back to Overview (S02)
          </button>
        </div>
      </div>

      {/* Section 1: Evidence-State Chips */}
      <section className="surface-solid rounded-[24px] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">
          1. Evidence-State Chips (Icon + Text, never colour alone · Section 3.3)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {statesOrder.map((st) => {
            const meta = EVIDENCE_STATE_META[st];
            return (
              <div
                key={st}
                className="p-3.5 rounded-[14px] bg-slate-50 border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <EvidenceChip state={st} />
                  <span className="font-inter text-[11px] text-[#475569]">icon: {meta.icon}</span>
                </div>
                <p className="text-xs text-[#334155]">{meta.meaning}</p>
                <p className="font-inter text-[11px] text-[#475569]">Trigger: {meta.fieldTrigger}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Eight Empty & Pending Card Patterns (E-01 to E-08, FO-INT-323, AC-S21-1) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">
          2. Eight Empty &amp; Pending Card Patterns (E-01 to E-08 · Section 3.4)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {eightEmptyPendingPatterns.map((pat) => (
            <div
              key={pat.code}
              className="surface-solid rounded-[20px] p-5 flex flex-col justify-between space-y-3 border-2 border-dashed border-slate-300"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-inter text-xs font-extrabold text-[#4648D4]">
                    {pat.code}
                  </span>
                  <EvidenceChip state={pat.chipState} customLabel={pat.chipLabel} size="sm" />
                </div>
                <p className="font-inter text-[11px] font-semibold text-[#0F172A]">{pat.field}</p>
                <p className="text-xs text-[#334155] leading-relaxed">{pat.copy}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 font-inter text-[11px] text-[#475569]">
                Screens: <strong>{pat.screens}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Four Error, Conflict & Access Patterns (FO-INT-324, AC-S21-1) */}
      <section className="surface-solid rounded-[24px] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">
          3. Four Error, Conflict &amp; Access Patterns (FO-INT-324)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fourErrorConflictAccessPatterns.map((err) => (
            <div
              key={err.id}
              className="p-4 rounded-[16px] bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-inter text-xs font-bold text-[#0F172A]">{err.title}</span>
                <EvidenceChip state={err.state} customLabel={err.badge} size="sm" />
              </div>
              <p className="text-xs text-[#334155] leading-relaxed">{err.body}</p>
              <p className="font-inter text-[11px] text-[#475569]">Trigger: {err.trigger}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Ten Named Test Fixtures Inspector (FX-01 to FX-10, Section 14.1) */}
      <section className="surface-solid rounded-[24px] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              4. Named Test Fixtures Inspector (FX-01 to FX-10 · Section 14.1)
            </h2>
            <p className="text-xs text-[#475569]">
              Inspect each of the 10 PRD/TRD test fixtures and verify ContractValidator &amp; RecommendationPresenter guard outputs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(TEST_FIXTURES) as TestFixtureId[]).map((fxId) => (
              <button
                key={fxId}
                type="button"
                onClick={() => setSelectedFixtureId(fxId)}
                className={`px-3 py-1 rounded-full text-xs font-inter font-bold transition-all ${
                  selectedFixtureId === fxId
                    ? 'btn-primary-gradient text-white'
                    : 'bg-slate-100 text-[#334155] hover:bg-slate-200'
                }`}
              >
                {fxId}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200 space-y-3 font-inter text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-extrabold text-[#4648D4]">{activeFixture.fixture_id}</span> ·{' '}
              <span className="font-bold text-[#0F172A]">{activeFixture.name}</span> (
              <code>{activeFixture.household_id}</code>)
            </div>
            <EvidenceChip
              state={fixtureValidation.valid ? 'OBSERVED' : 'CONFLICT'}
              customLabel={
                fixtureValidation.valid
                  ? 'ContractValidator: PASSED'
                  : `Rejected · ${fixtureValidation.OfficerBanner}`
              }
              size="sm"
            />
          </div>
          <p className="text-[#334155]">
            <strong>Condition:</strong> {activeFixture.condition} · <strong>Expected:</strong>{' '}
            {activeFixture.expected_outcome}
          </p>
          {!fixtureValidation.valid && (
            <div
              role="alert"
              className="p-3 rounded-[10px] bg-[#FFDAD6]/40 border border-[#BA1A1A] text-[#93000A] font-semibold"
            >
              {fixtureValidation.OfficerBanner}: {fixtureValidation.errors.join(' ')}
            </div>
          )}
          <pre className="p-3 rounded-[12px] bg-slate-950 text-slate-100 overflow-x-auto max-h-60 text-[11px]">
            {JSON.stringify(activeFixture.payload, null, 2)}
          </pre>
        </div>
      </section>

      {/* Section 5: Responsive Samples (Desktop 1440px, Tablet 834px, Mobile 390px) */}
      <section className="surface-solid rounded-[24px] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#0F172A]">
          5. Responsive Samples (Desktop 1440px, Tablet 834px, Mobile 390px)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-6 p-4 rounded-[16px] bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-inter text-[11px] font-bold uppercase text-[#4648D4]">
              Desktop sample (full metadata row)
            </span>
            <div className="p-4 rounded-[14px] bg-white border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <p className="font-inter text-sm font-bold text-[#0F172A]">
                  SANKET-HH-000101 · Demo Palli 01, Brahmapur, Ganjam
                </p>
                <p className="text-xs text-[#334155] mt-0.5">
                  Next instalment 28 Oct 2026 ({formatINR(4170)}) · Expected remittance 5 Nov 2026 ({formatINR(35000)})
                </p>
              </div>
              <CompletenessBar pct={100} band="HIGH" />
            </div>
          </div>

          <div className="lg:col-span-3 p-4 rounded-[16px] bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-inter text-[11px] font-bold uppercase text-[#4648D4]">
              Tablet sample (2x2 compact)
            </span>
            <div className="p-3.5 rounded-[14px] bg-white border border-slate-200 space-y-1.5">
              <p className="font-inter text-xs font-bold text-[#0F172A]">SANKET-HH-000101</p>
              <p className="text-xs text-[#334155]">Due 28 Oct · ₹4,170.00</p>
              <EvidenceChip state="EXPECTED" customLabel="Expected 5 Nov" size="sm" />
            </div>
          </div>

          <div className="lg:col-span-3 p-4 rounded-[16px] bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-inter text-[11px] font-bold uppercase text-[#4648D4]">
              Mobile sample (390px stacked card)
            </span>
            <div className="p-3.5 rounded-[14px] bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs font-bold">SANKET-HH-000101</span>
                <span className="text-[11px] text-[#475569]">Brahmapur</span>
              </div>
              <EvidenceChip state="DERIVED" customLabel="8d before remittance" size="sm" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
