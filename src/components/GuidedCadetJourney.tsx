import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Shield,
  Rocket,
  Activity,
  Award,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface GuidedCadetJourneyProps {
  onOpenStep: (stepNumber: number) => void;
  completedMissionsCount: number;
}

export const GuidedCadetJourney: React.FC<GuidedCadetJourneyProps> = ({
  onOpenStep,
  completedMissionsCount,
}) => {
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [step4Done, setStep4Done] = useState(false);
  const [step5Done, setStep5Done] = useState(false);

  useEffect(() => {
    try {
      // Step 1: Classes completed
      const rawClasses = localStorage.getItem('astro_camp_completed_classes');
      const classes = rawClasses ? JSON.parse(rawClasses) : [];
      setStep1Done(Array.isArray(classes) && classes.length > 0);

      // Step 2: Gear equipped
      const rawCatalog = localStorage.getItem('astro_camp_equipment_catalog');
      const catalog = rawCatalog ? JSON.parse(rawCatalog) : [];
      setStep2Done(
        Array.isArray(catalog) &&
        catalog.some((item: { equipped?: boolean }) => item.equipped)
      );

      // Step 3: Missions flown
      setStep3Done(completedMissionsCount > 0);

      // Step 4: Moonquake / Rover
      const mqDone = localStorage.getItem('astro_camp_moonquake_inspected') === 'true';
      setStep4Done(mqDone || completedMissionsCount >= 2);

      // Step 5: Certificate claimed
      const certDone = localStorage.getItem('astro_camp_cert_claimed') === 'true';
      setStep5Done(certDone || completedMissionsCount >= 3);
    } catch {
      // Default fallback
    }
  }, [completedMissionsCount]);

  const steps = [
    {
      step: 1,
      title: 'Ground School',
      sub: 'ASCAN Exam & Science',
      icon: <GraduationCap size={16} className="text-cyan-400" />,
      color: '#00d2ff',
      isCompleted: step1Done,
    },
    {
      step: 2,
      title: 'Spacesuit & Gear',
      sub: 'Depot & 3D xEMU',
      icon: <Shield size={16} className="text-amber-400" />,
      color: '#fbbf24',
      isCompleted: step2Done,
    },
    {
      step: 3,
      title: 'Earth to Moon',
      sub: 'Multi-Stage Staging',
      icon: <Rocket size={16} className="text-emerald-400" />,
      color: '#10b981',
      isCompleted: step3Done,
    },
    {
      step: 4,
      title: 'Moonquake Lab',
      sub: 'Apollo PSE & Rover',
      icon: <Activity size={16} className="text-purple-400" />,
      color: '#c084fc',
      isCompleted: step4Done,
    },
    {
      step: 5,
      title: 'Graduation',
      sub: 'Official NASA Diploma',
      icon: <Award size={16} className="text-rose-400" />,
      color: '#f43f5e',
      isCompleted: step5Done,
    },
  ];

  const completedTotal = steps.filter((s) => s.isCompleted).length;
  const progressPct = Math.round((completedTotal / 5) * 100);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(7, 11, 20, 0.95) 100%)',
        border: '1px solid rgba(0, 210, 255, 0.28)',
        borderRadius: '12px',
        padding: '10px 16px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        width: '100%',
        maxWidth: '1120px',
        margin: '0 auto',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} className="text-cyan-400 animate-pulse" />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 900,
              fontFamily: 'var(--font-space, sans-serif)',
              letterSpacing: '0.08em',
              color: '#f8fafc',
              textTransform: 'uppercase',
            }}
          >
            Guided 5-Step Cadet Journey · NASA Space Apps 2026
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#38bdf8',
              background: 'rgba(0, 210, 255, 0.12)',
              padding: '1px 7px',
              borderRadius: '999px',
              border: '1px solid rgba(0, 210, 255, 0.25)',
            }}
          >
            {completedTotal}/5 STEPS COMPLETE ({progressPct}%)
          </span>
        </div>

        <span
          style={{
            fontSize: '10px',
            color: '#94a3b8',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          Click any step to launch directly ➔
        </span>
      </div>

      {/* 5 Step Pills Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
        }}
      >
        {steps.map((st, idx) => {
          return (
            <button
              key={st.step}
              onClick={() => {
                soundFx.playClick(900);
                onOpenStep(st.step);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: st.isCompleted
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: st.isCompleted
                  ? '1px solid rgba(16, 185, 129, 0.45)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              title={`Step ${st.step}: ${st.title} — ${st.sub}`}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: `1px solid ${st.color}40`,
                }}
              >
                {st.isCompleted ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  st.icon
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: st.isCompleted ? '#34d399' : '#f1f5f9',
                    fontFamily: 'var(--font-space, sans-serif)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {st.step}. {st.title}
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    color: '#94a3b8',
                    fontFamily: 'var(--font-mono, monospace)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {st.sub}
                </div>
              </div>

              {idx < 4 && (
                <ChevronRight
                  size={12}
                  className="text-slate-500"
                  style={{ opacity: 0.5, flexShrink: 0 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

