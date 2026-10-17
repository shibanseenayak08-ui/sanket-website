import React from 'react';
import { RoleId } from '../utils/sanketLogic';
import { EvidenceChip, SanketLogoMark } from '../components/SharedPrimitives';

interface S01DemoEntryProps {
  selectedRole: RoleId;
  onSelectRole: (role: RoleId) => void;
  onEnterDemo: () => void;
  onOpenLegend: () => void;
  onOpenStatesGallery: () => void;
}

const ROLE_CARDS: {
  id: RoleId;
  title: string;
  badge: string;
  scopeLine: string;
  description: string;
  icon: string;
}[] = [
  {
    id: 'FIELD_OFFICER',
    title: 'Field Officer',
    badge: 'OFFICER-SYN-01',
    scopeLine: '12 households in FSP-SYN-01',
    description: 'Reviews households and records decisions',
    icon: 'badge',
  },
  {
    id: 'PORTFOLIO_MANAGER',
    title: 'Portfolio Manager',
    badge: 'AGGREGATE SCOPE',
    scopeLine: 'Aggregates across 3 partners',
    description: 'No household-level access',
    icon: 'Equalizer',
  },
  {
    id: 'COMPLIANCE_REVIEWER',
    title: 'Compliance Reviewer',
    badge: 'AUDIT & PROVENANCE',
    scopeLine: 'Provenance, conflicts and audit history',
    description: 'Household tokens only',
    icon: 'policy',
  },
];

export const S01DemoEntry: React.FC<S01DemoEntryProps> = ({
  selectedRole,
  onSelectRole,
  onEnterDemo,
  onOpenLegend,
  onOpenStatesGallery,
}) => {
  const activeRoleLabel =
    selectedRole === 'FIELD_OFFICER'
      ? 'Field Officer'
      : selectedRole === 'PORTFOLIO_MANAGER'
      ? 'Portfolio Manager'
      : 'Compliance Reviewer';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden">
      {/* Ambient Background Blooms */}
      <div
        className="pointer-events-none fixed top-8 right-12 w-96 h-96 rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-10 left-12 w-96 h-96 rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.20) 0%, transparent 70%)' }}
      />

      <main className="glass-1 rounded-[24px] max-w-[1040px] w-full p-6 md:p-10 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Half: SANKET Mark, Title, Subtitle, Notice */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <SanketLogoMark size="lg" />
                <div>
                  <span className="font-inter text-[11px] font-semibold uppercase tracking-widest text-[#4648D4]">
                    SANKET Lumen Glass · S01
                  </span>
                  <p className="text-xs font-inter text-[#475569]">Read-only explainable review layer</p>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight">
                SANKET
              </h1>
              <p className="text-lg font-medium text-[#334155] leading-snug">
                Financial health intelligence for seasonal rural households
              </p>

              {/* Solid Notice Card */}
              <div className="surface-solid rounded-[16px] p-4 border-l-4 border-l-[#5558E8] space-y-2">
                <div className="flex items-center gap-2 text-xs font-inter font-semibold text-[#0F172A]">
                  <span className="material-symbols-outlined !text-[18px] text-[#4648D4]">
                    info
                  </span>
                  <span>Demonstration control. Not authentication.</span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">
                  Demonstration environment. All households, lenders, officers and records are synthetic. This role selector is a prototype control, not sign-in.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/70">
              <p className="text-xs text-[#475569] leading-relaxed">
                Core principle: <strong className="text-[#0F172A]">show the situation, explain the evidence, make uncertainty visible, and leave the decision with the human officer.</strong>
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenLegend}
                  className="text-xs font-inter font-semibold text-[#4648D4] hover:underline focus-ring inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined !text-[16px]">help</span>
                  <span>How to read evidence states</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenStatesGallery}
                  className="text-xs font-inter font-semibold text-[#334155] hover:text-[#0F172A] hover:underline focus-ring inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined !text-[16px]">palette</span>
                  <span>Inspect S21 States Gallery</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Half: Selectable Role Cards + Reference Data Card + Primary Button */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div
              role="radiogroup"
              aria-label="Select demonstration role"
              className="space-y-3"
            >
              {ROLE_CARDS.map((card) => {
                const isSelected = selectedRole === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectRole(card.id)}
                    className={`w-full text-left rounded-[18px] p-4 transition-all focus-ring flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'surface-solid border-2 border-[#5558E8] shadow-md'
                        : 'bg-white/75 hover:bg-white border border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#EEF2FF] text-[#4648D4]'
                            : 'bg-slate-100 text-[#475569]'
                        }`}
                      >
                        <span className="material-symbols-outlined">{card.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-[#0F172A]">{card.title}</span>
                          <span className="font-inter text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#334155]">
                            {card.badge}
                          </span>
                        </div>
                        <p className="text-xs font-inter font-medium text-[#334155] mt-1">
                          {card.scopeLine} · {card.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                        isSelected
                          ? 'bg-[#5558E8] text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined !text-[16px]">check</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Reference Data Card */}
            <div className="surface-solid rounded-[16px] p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-inter text-[#334155]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined !text-[18px] text-[#4648D4]">
                  calendar_today
                </span>
                <span className="font-semibold text-[#0F172A]">
                  Reference date 17 Oct 2026 · 30 households · 7 linked datasets
                </span>
              </div>
              <EvidenceChip state="OBSERVED" customLabel="sanket.household_profile.v1" size="sm" />
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={onEnterDemo}
              className="btn-primary-gradient w-full py-3.5 px-6 rounded-[14px] text-sm font-inter font-semibold shadow-md focus-ring flex items-center justify-center gap-2"
            >
              <span>Enter demo as {activeRoleLabel}</span>
              <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
