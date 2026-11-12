import React, { useState } from 'react';
import type { DifficultyMode } from '../types/game';
import { DIFFICULTY_PROFILES, type DifficultyProfile } from '../config/outpostBalanceConfig';
import { soundFx } from '../utils/audioEffects';
import {
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  Droplets,
  Apple,
  Shield,
  Heart,
  Smile,
  Check,
  Pencil,
  Wrench,
  Activity,
  Sprout,
  Compass,
  Info,
} from 'lucide-react';

export interface LaunchMissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (destination: 'MOON' | 'MARS', difficulty: DifficultyMode, cargoId: string) => void;
  initialDestination?: 'MOON' | 'MARS';
}

const NASA_DID_YOU_KNOW = [
  "Did you know? NASA's MOXIE instrument on the Perseverance rover successfully made breathable oxygen directly out of Martian carbon dioxide air!",
  "Did you know? The International Space Station recycles over 98% of all water from breath moisture, sweat, and urine through closed-loop catalytic distillation!",
  "Did you know? Lunar regolith can be melted into solid interlocking bricks using concentrated solar lenses or microwaves — no cement needed from Earth!",
  "Did you know? Because Mars is 1.52 AU from the Sun, it receives less than half as much sunlight as Earth, making solar panels less than 43% as effective!",
  "Did you know? NASA's Kilopower project tested a 1 kW to 10 kW compact nuclear Stirling engine designed specifically to keep outposts alive through freezing 14-day lunar nights!",
];

// ── Realistic SVG Planet Previews for Step 1 ──
const MoonPlanetSvg: React.FC = () => (
  <svg
    width="58"
    height="58"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, filter: 'drop-shadow(0 0 12px rgba(226, 232, 240, 0.4))' }}
  >
    <defs>
      <radialGradient id="moonSphereGrad" cx="35%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="40%" stopColor="#cbd5e1" />
        <stop offset="72%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#1e293b" />
      </radialGradient>
      <radialGradient id="craterDark" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>
    </defs>
    {/* Base Moon Sphere */}
    <circle cx="30" cy="30" r="27" fill="url(#moonSphereGrad)" />
    
    {/* Lunar Maria (Dark Basaltic Plains) */}
    <path d="M 17 21 Q 23 16 30 20 Q 35 25 28 32 Q 20 30 17 21 Z" fill="#475569" opacity="0.65" />
    <path d="M 32 27 Q 41 24 45 32 Q 40 40 33 37 Q 29 33 32 27 Z" fill="#475569" opacity="0.6" />
    <path d="M 16 34 Q 22 36 24 43 Q 18 47 14 42 Z" fill="#475569" opacity="0.55" />
    
    {/* Craters with Highlight Rims & Deep Shadows */}
    {/* Tycho Crater at South */}
    <circle cx="31" cy="46" r="4.5" fill="url(#craterDark)" />
    <path d="M 31 41.5 A 4.5 4.5 0 0 1 35.5 46" stroke="#f8fafc" strokeWidth="0.9" opacity="0.85" />
    {/* Copernicus Crater */}
    <circle cx="23" cy="27" r="3.6" fill="url(#craterDark)" />
    <path d="M 23 23.4 A 3.6 3.6 0 0 1 26.6 27" stroke="#f8fafc" strokeWidth="0.8" opacity="0.8" />
    {/* Kepler Crater */}
    <circle cx="39" cy="20" r="2.8" fill="url(#craterDark)" />
    <path d="M 39 17.2 A 2.8 2.8 0 0 1 41.8 20" stroke="#f8fafc" strokeWidth="0.7" opacity="0.75" />
    {/* Aristarchus Crater */}
    <circle cx="16" cy="24" r="2.2" fill="url(#craterDark)" />
    <path d="M 16 21.8 A 2.2 2.2 0 0 1 18.2 24" stroke="#f8fafc" strokeWidth="0.6" opacity="0.75" />
    
    {/* South Pole Shackleton Crater Rim Highlight */}
    <path d="M 27 54.5 Q 30 55.5 33 54.5" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const MarsPlanetSvg: React.FC = () => (
  <svg
    width="58"
    height="58"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, filter: 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.45))' }}
  >
    <defs>
      <radialGradient id="marsSphereGrad" cx="35%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#fdba74" />
        <stop offset="35%" stopColor="#f97316" />
        <stop offset="68%" stopColor="#c2410c" />
        <stop offset="100%" stopColor="#431407" />
      </radialGradient>
      <radialGradient id="marsDarkMarking" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#6a1d0b" />
        <stop offset="100%" stopColor="#3d1005" />
      </radialGradient>
    </defs>
    {/* Base Mars Sphere */}
    <circle cx="30" cy="30" r="27" fill="url(#marsSphereGrad)" />
    
    {/* Dark Volcanic Markings (Syrtis Major & Acidalia Planitia) */}
    <path d="M 22 21 Q 28 16 38 20 Q 42 27 34 33 Q 26 31 22 21 Z" fill="url(#marsDarkMarking)" opacity="0.7" />
    <path d="M 15 32 Q 24 33 27 41 Q 19 45 14 39 Z" fill="url(#marsDarkMarking)" opacity="0.65" />
    <path d="M 32 35 Q 40 33 45 42 Q 38 46 30 43 Z" fill="url(#marsDarkMarking)" opacity="0.65" />
    
    {/* Jezero Crater Landing Site Delta Indicator */}
    <circle cx="37" cy="27" r="2.8" fill="#380c04" />
    <circle cx="36.8" cy="26.8" r="1.8" fill="#200502" />
    <path d="M 37 24.2 A 2.8 2.8 0 0 1 39.8 27" stroke="#fdba74" strokeWidth="0.7" opacity="0.8" />
    <circle cx="37" cy="27" r="0.8" fill="#facc15" />

    {/* Bright North Polar Ice Cap */}
    <ellipse cx="30" cy="5.8" rx="8.5" ry="3.2" fill="#f8fafc" opacity="0.95" />
    {/* South Polar Seasonal Frost */}
    <ellipse cx="30" cy="55.2" rx="6" ry="2" fill="#ffedd5" opacity="0.6" />
    
    {/* Atmosphere Thin Rim Glow */}
    <circle cx="30" cy="30" r="26.5" stroke="rgba(251, 146, 60, 0.45)" strokeWidth="1" />
  </svg>
);

export interface WizardCrewMember {
  id: string;
  role: string;
  name: string;
  bonus: string;
  color: string;
  icon: 'commander' | 'engineer' | 'doctor' | 'farmer';
}

const DEFAULT_CREW: WizardCrewMember[] = [
  { id: 'commander', role: 'Commander', name: 'Alex Rivera', bonus: '+15% Team Morale', color: '#38bdf8', icon: 'commander' },
  { id: 'engineer', role: 'Engineer', name: 'Maya Lin', bonus: 'Fast Module Repairs', color: '#fbbf24', icon: 'engineer' },
  { id: 'doctor', role: 'Doctor', name: 'Dr. Sam Okonjo', bonus: 'Crew Health Shield', color: '#22c55e', icon: 'doctor' },
  { id: 'farmer', role: 'Space Farmer', name: 'Chloe Patel', bonus: '+25% Crop Harvest', color: '#10b981', icon: 'farmer' },
];

export const LaunchMissionWizard: React.FC<LaunchMissionWizardProps> = ({
  isOpen,
  onClose,
  onLaunch,
  initialDestination = 'MOON',
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [destination, setDestination] = useState<'MOON' | 'MARS'>(initialDestination);
  const [difficulty, setDifficulty] = useState<DifficultyMode>('CADET');
  const [selectedCargo, setSelectedCargo] = useState<string>('battery');
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [loadingFactIdx, setLoadingFactIdx] = useState<number>(0);
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);

  // Crew state with localStorage persistence
  const [crew, setCrew] = useState<WizardCrewMember[]>(() => {
    try {
      const saved = localStorage.getItem('jr_astrocamp_crew');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CREW;
  });
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [editingCrewName, setEditingCrewName] = useState<string>('');

  const handleStartRename = (id: string, currentName: string) => {
    soundFx.playClick(750);
    setEditingCrewId(id);
    setEditingCrewName(currentName);
  };

  const handleSaveRename = (id: string) => {
    soundFx.playClick(850);
    const trimmed = editingCrewName.trim().slice(0, 14);
    if (trimmed) {
      setCrew((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c));
        try {
          localStorage.setItem('jr_astrocamp_crew', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
    setEditingCrewId(null);
  };

  React.useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
    }
  }, [initialDestination, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    soundFx.playClick(800);
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      // Step 4: Loading / Launch screen
      setIsLaunching(true);
      setLoadingFactIdx(Math.floor(Math.random() * NASA_DID_YOU_KNOW.length));
      soundFx.playReactorStart();
      setTimeout(() => {
        onLaunch(destination, difficulty, selectedCargo);
      }, 2200);
    }
  };

  const handleBack = () => {
    soundFx.playClick(750);
    if (step === 1) onClose();
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  // ── Step 4: Fullscreen Loading Launching Animation ──
  if (isLaunching) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3000,
          background: 'radial-gradient(circle at 50% 40%, #0a1738 0%, #030712 90%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'bounce 1s infinite' }}>
          🚀
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 10px 0', color: '#f8fafc' }}>
          Launching Expedition to {destination === 'MOON' ? 'the Moon' : 'Mars'}!
        </h2>
        <p style={{ fontSize: '15px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.04em', margin: '0 0 32px 0' }}>
          T-MINUS ZERO · TRAJECTORY INSERTION CONFIRMED
        </p>

        {/* Real NASA Did-You-Know Fact Card */}
        <div
          style={{
            maxWidth: '580px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid #0284c7',
            borderRadius: '20px',
            padding: '20px 24px',
            boxShadow: '0 0 30px rgba(2, 132, 199, 0.35)',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>
            <Sparkles size={16} />
            <span>NASA SCIENCE FACT FOR FLIGHT</span>
          </div>
          <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.55, margin: 0 }}>
            "{NASA_DID_YOU_KNOW[loadingFactIdx]}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="wizard-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        background:
          'radial-gradient(ellipse at 18% 80%, rgba(56, 189, 248, 0.16) 0%, transparent 45%), radial-gradient(ellipse at 82% 80%, rgba(249, 115, 22, 0.16) 0%, transparent 45%), rgba(3, 8, 24, 0.44)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          background: '#070e24',
          border: '2px solid #1e3a8a',
          borderRadius: '26px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease',
        }}
      >
        {/* Wizard Header Strip with Progress Bar */}
        <div
          style={{
            padding: '20px 28px',
            background: '#09132e',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              STEP {step} OF 3 // MISSION DISPATCH
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>
              {step === 1 && 'Step 1: Choose Your Destination'}
              {step === 2 && 'Step 2: Choose Mission Difficulty'}
              {step === 3 && 'Step 3: Crew of 4 & Launch Cargo'}
            </h2>
          </div>

          <button
            onClick={onClose}
            data-testid="wizard-close-btn"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid #334155',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close mission dispatch"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Pill Indicator */}
        <div style={{ display: 'flex', height: '4px', background: '#0b1633' }}>
          <div style={{ flex: 1, background: '#0284c7' }} />
          <div style={{ flex: 1, background: step >= 2 ? '#0284c7' : 'transparent', transition: 'background 0.3s' }} />
          <div style={{ flex: 1, background: step >= 3 ? '#0284c7' : 'transparent', transition: 'background 0.3s' }} />
        </div>

        {/* Wizard Body Content */}
        <div style={{ padding: '24px 28px', maxHeight: '68vh', overflowY: 'auto' }}>
          {/* ═════════════════════════════════════════════════════════════
              STEP 1: MOON VS MARS
             ═════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
              {/* Moon Card */}
              <div
                onClick={() => { setDestination('MOON'); soundFx.playClick(750); }}
                data-testid="wizard-dest-moon"
                style={{
                  background: destination === 'MOON' ? 'rgba(2, 132, 199, 0.18)' : 'rgba(9, 18, 42, 0.85)',
                  border: destination === 'MOON' ? '2.5px solid #38bdf8' : '1.5px solid rgba(30, 58, 138, 0.55)',
                  borderRadius: '20px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '340px',
                  boxShadow: destination === 'MOON' ? '0 0 25px rgba(56, 189, 248, 0.35)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                {destination === 'MOON' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: '#0284c7',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)',
                    }}
                  >
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
                <div>
                  {/* Detailed Round Moon SVG Planet with craters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <MoonPlanetSvg />
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        Shackleton Crater
                      </h3>
                      <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>
                        MOON · 30 DAYS · ARTEMIS POLAR EXPEDITION
                      </span>
                    </div>
                  </div>

                  {/* Kid-Friendly NASA Fact with Hover Tooltips */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase' }}>
                        🔬 Real NASA Science Fact
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                        A single night on the Moon lasts about{' '}
                        <span
                          onMouseEnter={() => setHoveredTerm('lunar-day')}
                          onMouseLeave={() => setHoveredTerm(null)}
                          style={{
                            textDecoration: 'underline dotted #38bdf8',
                            cursor: 'help',
                            color: '#bae6fd',
                            fontWeight: 700,
                            position: 'relative',
                          }}
                        >
                          14 Earth days
                          {hoveredTerm === 'lunar-day' && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '130%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#070e24',
                                border: '1px solid #38bdf8',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: '#f8fafc',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.85)',
                                zIndex: 100,
                                pointerEvents: 'none',
                              }}
                            >
                              Tidally locked to Earth: 1 full lunar day/night cycle = 29.5 Earth days
                            </span>
                          )}
                        </span>
                        ! But at the Moon's South Pole, high crater rims get sunlight for most of the year, while deep crater floors hold{' '}
                        <span
                          onMouseEnter={() => setHoveredTerm('psr')}
                          onMouseLeave={() => setHoveredTerm(null)}
                          style={{
                            textDecoration: 'underline dotted #38bdf8',
                            cursor: 'help',
                            color: '#bae6fd',
                            fontWeight: 700,
                            position: 'relative',
                          }}
                        >
                          frozen water ice
                          {hoveredTerm === 'psr' && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '130%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#070e24',
                                border: '1px solid #38bdf8',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: '#f8fafc',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.85)',
                                zIndex: 100,
                                pointerEvents: 'none',
                              }}
                            >
                              Permanently Shadowed Regions (PSRs) stay at -246°C (-410°F), trapping ice for billions of years
                            </span>
                          )}
                        </span>
                        .
                      </p>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                      Source: NASA Lunar Reconnaissance Orbiter (LRO) / Artemis Plan
                    </div>
                  </div>
                </div>

                {/* Consistent Selection Status Pill */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    background: destination === 'MOON' ? 'rgba(2, 132, 199, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                    border: destination === 'MOON' ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                    color: destination === 'MOON' ? '#ffffff' : '#94a3b8',
                    fontSize: '12.5px',
                    fontWeight: destination === 'MOON' ? 800 : 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {destination === 'MOON' ? (
                    <>
                      <Check size={15} strokeWidth={3} />
                      <span>Selected</span>
                    </>
                  ) : (
                    <span>Tap to select</span>
                  )}
                </div>
              </div>

              {/* Mars Card */}
              <div
                onClick={() => { setDestination('MARS'); soundFx.playClick(750); }}
                data-testid="wizard-dest-mars"
                style={{
                  background: destination === 'MARS' ? 'rgba(234, 88, 12, 0.18)' : 'rgba(9, 18, 42, 0.85)',
                  border: destination === 'MARS' ? '2.5px solid #f97316' : '1.5px solid rgba(124, 45, 18, 0.55)',
                  borderRadius: '20px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '340px',
                  boxShadow: destination === 'MARS' ? '0 0 25px rgba(249, 115, 22, 0.35)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                {destination === 'MARS' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: '#ea580c',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 12px rgba(249, 115, 22, 0.6)',
                    }}
                  >
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
                <div>
                  {/* Detailed Round Mars SVG Planet (red surface, dark markings, ice cap) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <MarsPlanetSvg />
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        Jezero Crater
                      </h3>
                      <span style={{ fontSize: '12px', color: '#fb923c', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setHoveredTerm(hoveredTerm === 'sols' ? null : 'sols');
                          }}
                          onMouseEnter={() => setHoveredTerm('sols')}
                          onMouseLeave={() => setHoveredTerm(null)}
                          style={{
                            textDecoration: 'underline dotted #fb923c',
                            cursor: 'help',
                            position: 'relative',
                          }}
                        >
                          40 SOLS
                          {hoveredTerm === 'sols' && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '135%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#070e24',
                                border: '1px solid #fb923c',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: '#f8fafc',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.85)',
                                zIndex: 100,
                                pointerEvents: 'none',
                              }}
                            >
                              1 Sol = 1 Mars day (about 24 hours 40 minutes).
                            </span>
                          )}
                        </span>
                        <span>· PERSEVERANCE EXPEDITION</span>
                      </span>
                    </div>
                  </div>

                  {/* Kid-Friendly NASA Fact with Hover Tooltips */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#fb923c', marginBottom: '4px', textTransform: 'uppercase' }}>
                        🔬 Real NASA Science Fact
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                        Mars gets only about{' '}
                        <span
                          onMouseEnter={() => setHoveredTerm('irradiance')}
                          onMouseLeave={() => setHoveredTerm(null)}
                          style={{
                            textDecoration: 'underline dotted #f97316',
                            cursor: 'help',
                            color: '#fdba74',
                            fontWeight: 700,
                            position: 'relative',
                          }}
                        >
                          43% of Earth's sunlight
                          {hoveredTerm === 'irradiance' && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '130%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#070e24',
                                border: '1px solid #f97316',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: '#f8fafc',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.85)',
                                zIndex: 100,
                                pointerEvents: 'none',
                              }}
                            >
                              Solar irradiance: ~590 W/m² on Mars vs ~1361 W/m² on Earth
                            </span>
                          )}
                        </span>{' '}
                        because it is{' '}
                        <span
                          onMouseEnter={() => setHoveredTerm('au')}
                          onMouseLeave={() => setHoveredTerm(null)}
                          style={{
                            textDecoration: 'underline dotted #f97316',
                            cursor: 'help',
                            color: '#fdba74',
                            fontWeight: 700,
                            position: 'relative',
                          }}
                        >
                          farther from the Sun
                          {hoveredTerm === 'au' && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '130%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#070e24',
                                border: '1px solid #f97316',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: '#f8fafc',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.85)',
                                zIndex: 100,
                                pointerEvents: 'none',
                              }}
                            >
                              Orbit distance: 1.52 AU (~228 million km) from the Sun
                            </span>
                          )}
                        </span>
                        . Giant dust storms can cover the whole planet and make the sky very dark!
                      </p>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                      Source: NASA Perseverance Mars 2020 / Mars Climate Sounder
                    </div>
                  </div>
                </div>

                {/* Consistent Selection Status Pill */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    background: destination === 'MARS' ? 'rgba(234, 88, 12, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                    border: destination === 'MARS' ? '1.5px solid #f97316' : '1px solid rgba(148, 163, 184, 0.25)',
                    color: destination === 'MARS' ? '#ffffff' : '#94a3b8',
                    fontSize: '12.5px',
                    fontWeight: destination === 'MARS' ? 800 : 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {destination === 'MARS' ? (
                    <>
                      <Check size={15} strokeWidth={3} />
                      <span>Selected</span>
                    </>
                  ) : (
                    <span>Tap to select</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              STEP 2: CHOOSE DIFFICULTY (Cadet / Officer / Commander)
             ═════════════════════════════════════════════════════════════ */}
          {step === 2 && (() => {
            // Dynamic stats derived from official outpostBalanceConfig DIFFICULTY_PROFILES
            const getDifficultyStats = (profile: DifficultyProfile) => {
              const hazards =
                profile.stormSeverityMultiplier < 1.0 ? 'Few' : profile.stormSeverityMultiplier === 1.0 ? 'Normal' : 'Many';
              const supplies =
                profile.consumptionMultiplier < 1.0 ? '+15%' : profile.consumptionMultiplier === 1.0 ? 'Normal' : 'Tight';
              const buildPoints = `${profile.dailyBuildPoints} BP/day`;
              return { hazards, supplies, buildPoints };
            };

            const cadetStats = getDifficultyStats(DIFFICULTY_PROFILES.CADET);
            const officerStats = getDifficultyStats(DIFFICULTY_PROFILES.OFFICER);
            const commanderStats = getDifficultyStats(DIFFICULTY_PROFILES.COMMANDER);

            const renderStatChip = (label: string, value: string, valueColor: string = '#f8fafc') => (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  padding: '2.5px 8px',
                  fontSize: '11px',
                }}
              >
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{label}:</span>
                <strong style={{ color: valueColor, fontWeight: 800 }}>{value}</strong>
              </div>
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 0 4px 0' }}>
                  Select your flight difficulty tier. Each mode adjusts daily life-support consumption and hazard frequency:
                </p>

                {/* Cadet Card */}
                <div
                  tabIndex={0}
                  role="button"
                  aria-pressed={difficulty === 'CADET'}
                  data-testid="wizard-diff-cadet"
                  onClick={() => { setDifficulty('CADET'); soundFx.playClick(750); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDifficulty('CADET');
                      soundFx.playClick(750);
                    }
                  }}
                  style={{
                    background: difficulty === 'CADET' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(9, 19, 46, 0.85)',
                    border: difficulty === 'CADET' ? '2px solid #38bdf8' : '1.5px solid rgba(56, 189, 248, 0.25)',
                    boxShadow: difficulty === 'CADET' ? '0 0 24px rgba(56, 189, 248, 0.28)' : '0 4px 14px rgba(0,0,0,0.4)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
                    <div style={{ fontSize: '28px', flexShrink: 0 }}>🧑‍🚀</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '16px', color: '#ffffff', letterSpacing: '0.02em' }}>Cadet</strong>
                        <span
                          style={{
                            fontSize: '11px',
                            background: 'rgba(34, 197, 94, 0.22)',
                            border: '1px solid rgba(34, 197, 94, 0.5)',
                            color: '#4ade80',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>🌱</span> Best for first time
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                        Your crew uses less air, water and food. Space storms are rare. Great for beginners!
                      </p>
                      {/* Real Stat Chips from outpostBalanceConfig */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {renderStatChip('Hazards', cadetStats.hazards, '#67e8f9')}
                        {renderStatChip('Supplies', cadetStats.supplies, '#4ade80')}
                        {renderStatChip('Build Points', cadetStats.buildPoints, '#38bdf8')}
                      </div>
                    </div>
                  </div>

                  {/* Selection Status Pill */}
                  <div
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: difficulty === 'CADET' ? 'rgba(56, 189, 248, 0.32)' : 'rgba(255, 255, 255, 0.05)',
                      border: difficulty === 'CADET' ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                      color: difficulty === 'CADET' ? '#ffffff' : '#94a3b8',
                      fontSize: '12.5px',
                      fontWeight: difficulty === 'CADET' ? 800 : 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      minWidth: '105px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {difficulty === 'CADET' ? (
                      <>
                        <Check size={15} strokeWidth={3} />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Tap to select</span>
                    )}
                  </div>
                </div>

                {/* Officer Card */}
                <div
                  tabIndex={0}
                  role="button"
                  aria-pressed={difficulty === 'ENGINEER'}
                  data-testid="wizard-diff-officer"
                  onClick={() => { setDifficulty('ENGINEER'); soundFx.playClick(800); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDifficulty('ENGINEER');
                      soundFx.playClick(800);
                    }
                  }}
                  style={{
                    background: difficulty === 'ENGINEER' ? 'rgba(251, 191, 36, 0.16)' : 'rgba(9, 19, 46, 0.85)',
                    border: difficulty === 'ENGINEER' ? '2px solid #fbbf24' : '1.5px solid rgba(251, 191, 36, 0.25)',
                    boxShadow: difficulty === 'ENGINEER' ? '0 0 24px rgba(251, 191, 36, 0.28)' : '0 4px 14px rgba(0,0,0,0.4)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
                    <div style={{ fontSize: '28px', flexShrink: 0 }}>⭐</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '16px', color: '#ffffff', letterSpacing: '0.02em' }}>Officer</strong>
                        <span
                          style={{
                            fontSize: '11px',
                            background: 'rgba(251, 191, 36, 0.18)',
                            border: '1px solid rgba(251, 191, 36, 0.45)',
                            color: '#fbbf24',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontWeight: 800,
                          }}
                        >
                          NASA Standard
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                        Real NASA-style balance. A fair challenge.
                      </p>
                      {/* Real Stat Chips from outpostBalanceConfig */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {renderStatChip('Hazards', officerStats.hazards, '#fde047')}
                        {renderStatChip('Supplies', officerStats.supplies, '#fde047')}
                        {renderStatChip('Build Points', officerStats.buildPoints, '#fbbf24')}
                      </div>
                    </div>
                  </div>

                  {/* Selection Status Pill */}
                  <div
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: difficulty === 'ENGINEER' ? 'rgba(251, 191, 36, 0.32)' : 'rgba(255, 255, 255, 0.05)',
                      border: difficulty === 'ENGINEER' ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.25)',
                      color: difficulty === 'ENGINEER' ? '#ffffff' : '#94a3b8',
                      fontSize: '12.5px',
                      fontWeight: difficulty === 'ENGINEER' ? 800 : 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      minWidth: '105px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {difficulty === 'ENGINEER' ? (
                      <>
                        <Check size={15} strokeWidth={3} />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Tap to select</span>
                    )}
                  </div>
                </div>

                {/* Commander Card */}
                <div
                  tabIndex={0}
                  role="button"
                  aria-pressed={difficulty === 'COMMANDER'}
                  data-testid="wizard-diff-commander"
                  onClick={() => { setDifficulty('COMMANDER'); soundFx.playClick(850); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDifficulty('COMMANDER');
                      soundFx.playClick(850);
                    }
                  }}
                  style={{
                    background: difficulty === 'COMMANDER' ? 'rgba(249, 115, 22, 0.16)' : 'rgba(9, 19, 46, 0.85)',
                    border: difficulty === 'COMMANDER' ? '2px solid #f97316' : '1.5px solid rgba(249, 115, 22, 0.25)',
                    boxShadow: difficulty === 'COMMANDER' ? '0 0 24px rgba(249, 115, 22, 0.28)' : '0 4px 14px rgba(0,0,0,0.4)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
                    <div style={{ fontSize: '28px', flexShrink: 0 }}>🎖️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '16px', color: '#ffffff', letterSpacing: '0.02em' }}>Commander</strong>
                        <span
                          style={{
                            fontSize: '11px',
                            background: 'rgba(249, 115, 22, 0.18)',
                            border: '1px solid rgba(249, 115, 22, 0.45)',
                            color: '#fb923c',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontWeight: 800,
                          }}
                        >
                          Extreme Challenge
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                        Storms hit often and supplies are tight. Only for experts!
                      </p>
                      {/* Real Stat Chips from outpostBalanceConfig */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {renderStatChip('Hazards', commanderStats.hazards, '#f87171')}
                        {renderStatChip('Supplies', commanderStats.supplies, '#f87171')}
                        {renderStatChip('Build Points', commanderStats.buildPoints, '#fb923c')}
                      </div>
                    </div>
                  </div>

                  {/* Selection Status Pill */}
                  <div
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: difficulty === 'COMMANDER' ? 'rgba(249, 115, 22, 0.32)' : 'rgba(255, 255, 255, 0.05)',
                      border: difficulty === 'COMMANDER' ? '1.5px solid #f97316' : '1px solid rgba(148, 163, 184, 0.25)',
                      color: difficulty === 'COMMANDER' ? '#ffffff' : '#94a3b8',
                      fontSize: '12.5px',
                      fontWeight: difficulty === 'COMMANDER' ? 800 : 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      minWidth: '105px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {difficulty === 'COMMANDER' ? (
                      <>
                        <Check size={15} strokeWidth={3} />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Tap to select</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═════════════════════════════════════════════════════════════
              STEP 3: CREW OF 4 & LAUNCH CARGO
             ═════════════════════════════════════════════════════════════ */}
          {step === 3 && (() => {
            const currentDiffKey = difficulty === 'CADET' || (difficulty as any) === 'EXPLORER' ? 'CADET' : difficulty === 'COMMANDER' || (difficulty as any) === 'SCIENTIST' ? 'COMMANDER' : 'OFFICER';
            const currentDiffProfile = DIFFICULTY_PROFILES[currentDiffKey] || DIFFICULTY_PROFILES.CADET;

            // Preview calculation (Requirement 4)
            let cargoPreviewText = '';
            if (selectedCargo === 'battery') {
              const base = currentDiffProfile.startingResources.power;
              cargoPreviewText = `Starting Power: ${base}% ➔ ${Math.min(100, base + 20)}% (+20% Power Boost)`;
            } else if (selectedCargo === 'water') {
              const base = currentDiffProfile.startingResources.water;
              cargoPreviewText = `Starting Water: ${base}% ➔ ${Math.min(100, base + 20)}% (+20% Clean Water)`;
            } else if (selectedCargo === 'food') {
              const base = destination === 'MARS' ? currentDiffProfile.startingResources.food + 6 : currentDiffProfile.startingResources.food;
              cargoPreviewText = `Starting Food: ${base} Rations ➔ ${base + 8} Rations (+8 Space Meals)`;
            } else if (selectedCargo === 'shield') {
              const base = currentDiffProfile.startingResources.shielding;
              cargoPreviewText = `Starting Radiation Shield: ${base}% ➔ ${Math.min(100, base + 15)}% (+15% Hull Shield)`;
            }

            const shieldTitle = destination === 'MOON' ? 'Moon Dust Shield' : 'Mars Soil Shield';
            const shieldTooltip = destination === 'MOON'
              ? 'Melted regolith bricks block space radiation'
              : 'Sintered basaltic Martian regolith blocks cosmic rays and space radiation';

            const CARGO_CARDS = [
              {
                id: 'battery',
                title: 'Battery Bank',
                effect: '+20% Starting Power',
                icon: Zap,
                color: '#fbbf24',
                tooltip: 'High-density lithium-sulfur battery storage provides instant power reserves',
              },
              {
                id: 'water',
                title: 'Water Resupply',
                effect: '+20% Clean Water',
                icon: Droplets,
                color: '#38bdf8',
                tooltip: 'Emergency potable water canisters for metabolic consumption and ECLSS loops',
              },
              {
                id: 'food',
                title: 'Calorie Rations',
                effect: '+8 Starting Food',
                icon: Apple,
                color: '#4ade80',
                tooltip: 'Nutrient-dense dehydrated rations designed for long-duration spaceflight',
              },
              {
                id: 'shield',
                title: shieldTitle,
                effect: '+15% Radiation Shield',
                icon: ShieldCheck,
                color: '#f97316',
                tooltip: shieldTooltip,
              },
            ];

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 4 Crew Members */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                      Assigned Crew of 4 Astronauts
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Click <Pencil size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> to rename
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                    {crew.map((member) => {
                      const isEditing = editingCrewId === member.id;
                      return (
                        <div
                          key={member.id}
                          data-testid={`crew-card-${member.id}`}
                          style={{
                            background: '#09132e',
                            border: `1.5px solid ${member.color}44`,
                            borderRadius: '14px',
                            padding: '12px 10px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {/* Avatar with consistent Lucide icon (Requirement 2) */}
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: `radial-gradient(circle at 35% 30%, ${member.color}33, #070e24)`,
                              border: `2px solid ${member.color}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '8px',
                              boxShadow: `0 0 12px ${member.color}33`,
                            }}
                          >
                            {member.icon === 'commander' && <Compass size={20} color={member.color} strokeWidth={2.4} />}
                            {member.icon === 'engineer' && <Wrench size={20} color={member.color} strokeWidth={2.4} />}
                            {member.icon === 'doctor' && <Activity size={20} color={member.color} strokeWidth={2.4} />}
                            {member.icon === 'farmer' && <Sprout size={20} color={member.color} strokeWidth={2.4} />}
                          </div>

                          {/* Crew Name or Rename Input (Requirement 3) */}
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                              <input
                                type="text"
                                maxLength={14}
                                autoFocus
                                data-testid={`input-rename-${member.id}`}
                                value={editingCrewName}
                                onChange={(e) => setEditingCrewName(e.target.value.slice(0, 14))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(member.id);
                                  if (e.key === 'Escape') setEditingCrewId(null);
                                }}
                                style={{
                                  width: '105px',
                                  padding: '3px 6px',
                                  fontSize: '12px',
                                  background: '#070e24',
                                  border: `1.5px solid ${member.color}`,
                                  borderRadius: '6px',
                                  color: '#ffffff',
                                  outline: 'none',
                                  textAlign: 'center',
                                }}
                              />
                              <button
                                onClick={() => handleSaveRename(member.id)}
                                data-testid={`save-rename-${member.id}`}
                                style={{
                                  background: member.color,
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#070e24',
                                  cursor: 'pointer',
                                  padding: '4px 6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Save name"
                              >
                                <Check size={12} strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '2px 0', maxWidth: '100%' }}>
                              <strong
                                style={{
                                  fontSize: '13px',
                                  color: '#ffffff',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={member.name}
                              >
                                {member.name}
                              </strong>
                              <button
                                onClick={() => handleStartRename(member.id, member.name)}
                                data-testid={`rename-crew-${member.id}`}
                                title="Rename crew member (max 14 chars)"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid rgba(148, 163, 184, 0.3)',
                                  borderRadius: '6px',
                                  color: '#cbd5e1',
                                  cursor: 'pointer',
                                  padding: '3px 4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Pencil size={11} strokeWidth={2.4} />
                              </button>
                            </div>
                          )}

                          <span style={{ fontSize: '11px', color: member.color, fontWeight: 700, marginTop: '2px' }}>
                            {member.role}
                          </span>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                            {member.bonus}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Cargo Selection (Requirements 1 & 2) */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px 0' }}>
                    Select Bonus Launch Cargo (Pick 1)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                    {CARGO_CARDS.map((item) => {
                      const isSelected = selectedCargo === item.id;
                      const IconComp = item.icon;
                      return (
                        <div
                          key={item.id}
                          tabIndex={0}
                          role="button"
                          aria-pressed={isSelected}
                          data-testid={`cargo-${item.id}`}
                          onClick={() => { setSelectedCargo(item.id); soundFx.playClick(750); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedCargo(item.id);
                              soundFx.playClick(750);
                            }
                          }}
                          style={{
                            background: isSelected ? 'rgba(56, 189, 248, 0.16)' : '#09132e',
                            border: isSelected ? '2px solid #38bdf8' : '1px solid #1e293b',
                            boxShadow: isSelected ? '0 0 18px rgba(56, 189, 248, 0.28)' : 'none',
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                background: `${item.color}22`,
                                border: `1px solid ${item.color}55`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconComp size={18} color={item.color} strokeWidth={2.4} />
                            </div>

                            {/* Tooltip trigger with hover state */}
                            <div
                              onMouseEnter={() => setHoveredTerm(`cargo-${item.id}`)}
                              onMouseLeave={() => setHoveredTerm(null)}
                              style={{
                                position: 'relative',
                                cursor: 'help',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Info size={14} />
                              {hoveredTerm === `cargo-${item.id}` && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: '125%',
                                    right: 0,
                                    background: '#070e24',
                                    border: `1px solid ${item.color}`,
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    fontSize: '11px',
                                    color: '#f8fafc',
                                    whiteSpace: 'normal',
                                    width: '180px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.85)',
                                    zIndex: 100,
                                    pointerEvents: 'none',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {item.tooltip}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block' }}>
                              {item.title}
                            </strong>
                            <p style={{ fontSize: '11.5px', color: isSelected ? '#38bdf8' : '#94a3b8', margin: '2px 0 0 0', fontWeight: isSelected ? 700 : 500 }}>
                              {item.effect}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Cargo Preview Line (Requirement 4) */}
                  <div
                    data-testid="cargo-preview-line"
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1.5px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12.5px',
                      color: '#f8fafc',
                    }}
                  >
                    <Sparkles size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#cbd5e1' }}>
                      <strong style={{ color: '#ffffff' }}>Bonus Cargo Effect:</strong>{' '}
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>{cargoPreviewText}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Wizard Footer Controls */}
        <div
          style={{
            padding: '18px 28px',
            background: '#09132e',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: step > 1 ? 'space-between' : 'flex-end',
          }}
        >
          {step > 1 && (
            <button
              id="wizard-back-btn"
              onClick={handleBack}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {/* Launch Button (Requirement 6) */}
          <button
            id="wizard-next-btn"
            onClick={handleNext}
            data-testid="wizard-next-btn"
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              background: step === 3 ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #0284c7, #2563eb)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: step === 3 ? '0 0 20px rgba(249, 115, 22, 0.5)' : '0 0 16px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {step === 3 ? (
              <>
                <Rocket size={17} strokeWidth={2.5} />
                <span>Launch Expedition</span>
              </>
            ) : (
              <>
                <span>
                  {step === 1 ? 'Next: Mission Difficulty' : 'Next: Crew of 4 & Cargo'}
                </span>
                <ChevronRight size={17} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchMissionWizard;
