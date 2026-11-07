import React, { useState } from 'react';
import type { AppRoute } from '../router/useAppRouter';
import { soundFx } from '../utils/audioEffects';
import { ShackletonSurvivalModal } from '../components/arcade/ShackletonSurvivalModal';
import { MarsRoverDroneModal } from '../components/arcade/MarsRoverDroneModal';

interface AcademyTrailPageProps {
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  onAddXp: (amount: number) => void;
  onOpenFullCurriculum: () => void;
}

interface LevelData {
  id: number;
  title: string;
  badge: string;
  desc: string;
  status: 'COMPLETED' | 'ACTIVE' | 'LOCKED';
  storySnippet: string;
  taskTitle: string;
  targetVal: number;
}

const ACADEMY_LEVELS: LevelData[] = [
  {
    id: 1,
    title: 'Airlock Delta-P & Pre-Breathe',
    badge: 'Airlock Specialist',
    desc: 'Atmospheric pressure differentials (ΔP) and 100% O2 pre-breathe to prevent decompression sickness.',
    status: 'COMPLETED',
    storySnippet: '"Cadet Maya dons the EMU suit. Atmospheric pressure inside the hab is 101.3 kPa, but the suit operates at 29.6 kPa to preserve glove dexterity!"',
    taskTitle: 'Balance Airlock Pressure Differential',
    targetVal: 30,
  },
  {
    id: 2,
    title: 'The Sabatier Oxygen Machine',
    badge: 'Sabatier Chemist',
    desc: 'Catalytic scrubbing: CO2 + 4H2 -> CH4 + 2H2O, recovering fresh breathing oxygen.',
    status: 'COMPLETED',
    storySnippet: '"Commander Dadu inspects the catalyst reactor. Without chemical recycling, human crews consume 0.84 kg of oxygen every single day!"',
    taskTitle: 'Catalyst Gas Mixture Ratio',
    targetVal: 40,
  },
  {
    id: 3,
    title: 'Survive the 354-Hour Lunar Night',
    badge: 'Kilopower Fission Master',
    desc: 'Kilopower Stirling nuclear fission vs 14 Earth days of freezing darkness at the South Pole.',
    status: 'ACTIVE',
    storySnippet: '"Emergency Alarm! Solar arrays output 0 kW as the Sun sets behind the crater rim. Deploy the Kilopower reactor core before base heaters freeze!"',
    taskTitle: 'Adjust Kilopower Stirling Output (Target: 40 kW)',
    targetVal: 40,
  },
  {
    id: 4,
    title: 'Water Closed-Loop Distillation',
    badge: 'Hydration Officer',
    desc: 'Thermoelectric membrane loops recovering up to 98% of human moisture.',
    status: 'LOCKED',
    storySnippet: '"Every drop of water on the Moon is precious. Vacuum distillation extracts clean water from human humidity."',
    taskTitle: 'Membrane Vacuum Pressure',
    targetVal: 50,
  },
  {
    id: 5,
    title: 'Space Salad Hydroponics',
    badge: 'Botanical Engineer',
    desc: 'Dual-spectrum 450nm/660nm LED growth lighting and fresh astronaut crop cycles.',
    status: 'LOCKED',
    storySnippet: '"Fresh greens provide essential vitamins and psychological well-being during long-duration deep space missions."',
    taskTitle: 'Tune LED Photosynthetic Spectrum',
    targetVal: 60,
  },
  {
    id: 6,
    title: 'Regolith Radiation Vaults',
    badge: 'Radiation Sentinel',
    desc: 'Galactic Cosmic Rays (GCR), Solar Particle Events, and 1.5m sintered regolith shielding.',
    status: 'LOCKED',
    storySnippet: '"Solar coronal mass ejection inbound! Seal the storm shelter with sintered lunar regolith blocks."',
    taskTitle: 'Shield Thickness Density',
    targetVal: 70,
  },
  {
    id: 7,
    title: 'Lunar Rover Terramechanics',
    badge: 'Lunar Pilot Ace',
    desc: 'Wheel-slip ratios, steering geometry, and negotiating crater slopes in low gravity.',
    status: 'LOCKED',
    storySnippet: '"Soft regolith sand reduces traction. Maintain optimal wheel slip ratio to prevent getting stuck in craters."',
    taskTitle: 'Rover Torque Distribution',
    targetVal: 80,
  },
  {
    id: 8,
    title: 'Polar Water-Ice Core Drilling',
    badge: 'Gold Wings Astronaut',
    desc: 'Raman spectroscopy and drilling permanently shadowed craters under 40 Kelvin.',
    status: 'LOCKED',
    storySnippet: '"Final Flight Certification: Drill core samples from Shackleton cold traps to prove volatile water ice reserves!"',
    taskTitle: 'Cryogenic Drill Rotation Speed',
    targetVal: 90,
  },
];

export const AcademyTrailPage: React.FC<AcademyTrailPageProps> = ({
  onNavigate,
  onAddXp,
  onOpenFullCurriculum,
}) => {
  const [activeLevel, setActiveLevel] = useState<LevelData | null>(null);
  const [sliderVal, setSliderVal] = useState<number>(20);
  const [challengeSolved, setChallengeSolved] = useState<boolean>(false);
  const [isSurvivalModalOpen, setIsSurvivalModalOpen] = useState(false);
  const [isRoverModalOpen, setIsRoverModalOpen] = useState(false);

  const handleOpenLevel = (lvl: LevelData) => {
    soundFx.playClick(lvl.status === 'LOCKED' ? 300 : 700);
    if (lvl.status === 'LOCKED') {
      alert(`Level ${lvl.id} is locked! Complete Level ${lvl.id - 1} first.`);
      return;
    }
    setActiveLevel(lvl);
    setSliderVal(20);
    setChallengeSolved(false);
  };

  const handleCompleteChallenge = () => {
    if (!activeLevel) return;
    if (Math.abs(sliderVal - activeLevel.targetVal) <= 6) {
      soundFx.playVictory();
      setChallengeSolved(true);
      onAddXp(100);
    } else {
      soundFx.playWarningAlarm();
      alert(`Adjust slider closer to ${activeLevel.targetVal} to balance the system!`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-arcade text-xs mb-1">
            ASCAN EXPEDITION MAP
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-space text-white">8 Levels to Astronaut Wings</h2>
          <p className="text-slate-400 text-sm">
            Master real NASA aerospace engineering by completing each interactive mission challenge!
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenFullCurriculum}
          className="btn-arcade-cyan px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 self-start md:self-auto"
        >
          <span>📖 Teacher Lesson Dossier</span>
        </button>
      </div>

      {/* Mario/Duolingo Style Visual Map */}
      <div className="cockpit-panel rounded-3xl p-6 md:p-12 relative max-w-4xl mx-auto overflow-hidden border-2 border-sky-400/30">
        <div className="relative space-y-10">
          
          {/* Central Connecting Track Line */}
          <div className="absolute left-6 md:left-1/2 top-10 bottom-10 w-2 bg-gradient-to-b from-emerald-500 via-sky-500 via-amber-500 to-purple-600 -translate-x-1/2 rounded-full opacity-60"></div>

          {ACADEMY_LEVELS.map((lvl) => {
            const isCompleted = lvl.status === 'COMPLETED';
            const isActive = lvl.status === 'ACTIVE';
            const isLocked = lvl.status === 'LOCKED';

            return (
              <div
                key={lvl.id}
                className={`relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-sky-950/60 p-6 rounded-3xl border-2 border-amber-400 shadow-2xl'
                    : isLocked
                    ? 'opacity-40'
                    : ''
                }`}
              >
                {/* Left Title & Description */}
                <div className="w-full md:w-5/12 text-left md:text-right">
                  {isActive && (
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase">
                      CURRENT MISSION
                    </span>
                  )}
                  <h4
                    className={`font-arcade text-lg mt-1 ${
                      isCompleted
                        ? 'text-emerald-400'
                        : isActive
                        ? 'text-amber-300'
                        : 'text-slate-400'
                    }`}
                  >
                    LEVEL {lvl.id}: {lvl.title.toUpperCase()}
                  </h4>
                  <p className="text-xs text-slate-300">{lvl.desc}</p>
                </div>

                {/* Center Node Button */}
                <button
                  type="button"
                  onClick={() => handleOpenLevel(lvl)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl font-arcade text-2xl md:text-3xl flex items-center justify-center border-4 transition-all cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 border-slate-900 shadow-lg shadow-emerald-500/50 hover:scale-110'
                      : isActive
                      ? 'bg-amber-400 text-slate-950 border-white shadow-xl shadow-amber-400/50 hover:scale-110 engine-pulse'
                      : 'bg-slate-800 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? '✓' : isActive ? '▶' : '🔒'}
                </button>

                {/* Right Action & Badge */}
                <div className="w-full md:w-5/12">
                  {isCompleted && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1.5 rounded-xl font-bold border border-emerald-500/40">
                      🏅 Badge: {lvl.badge}
                    </span>
                  )}
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => handleOpenLevel(lvl)}
                      className="btn-arcade-gold px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
                    >
                      Play Level {lvl.id} Challenge →
                    </button>
                  )}
                  {isLocked && (
                    <span className="text-xs text-slate-500 font-mono-code">
                      [ COMPLETE LEVEL {lvl.id - 1} TO UNLOCK ]
                    </span>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* 3-STEP LEVEL CHALLENGE MODAL */}
      {activeLevel && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cockpit-panel-amber rounded-3xl p-6 md:p-8 max-w-xl w-full relative space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  LEVEL {activeLevel.id} MISSION BRIEFING
                </span>
                <h3 className="font-space font-black text-2xl text-white">{activeLevel.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLevel(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Comic Dialogue Strip */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Episode Dialogue</div>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                {activeLevel.storySnippet}
              </p>
            </div>

            {/* Interactive Mini-Challenge */}
            <div className="bg-slate-900/90 p-5 rounded-2xl border-2 border-amber-400/40 space-y-4">
              <div className="text-sm font-bold text-white">{activeLevel.taskTitle}</div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderVal}
                onChange={(e) => setSliderVal(parseInt(e.target.value))}
                className="w-full accent-amber-400 h-3 cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono-code">
                <span className="text-slate-400">Current Output: <strong className="text-amber-400">{sliderVal} kW</strong></span>
                <span className="text-emerald-400 font-bold">Target: {activeLevel.targetVal} kW</span>
              </div>
            </div>

            {challengeSolved && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-center font-bold text-sm space-y-1 animate-bounce">
                <div>🎉 OUTSTANDING FLIGHT CADET!</div>
                <div className="text-xs text-emerald-400">Challenge balanced safely! Badge Unlocked: <strong>{activeLevel.badge}</strong> (+100 XP)</div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              {activeLevel.id === 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveLevel(null);
                    setIsSurvivalModalOpen(true);
                  }}
                  className="btn-arcade-cyan px-4 py-2.5 rounded-xl text-xs font-arcade"
                >
                  ⚡ PLAY FULL SHACKLETON SURVIVAL ▶
                </button>
              )}

              {activeLevel.id === 7 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveLevel(null);
                    setIsRoverModalOpen(true);
                  }}
                  className="btn-arcade-cyan px-4 py-2.5 rounded-xl text-xs font-arcade"
                >
                  🚜 PLAY MARS ROVER &amp; DRONE ▶
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setActiveLevel(null)}
                  className="px-5 py-3 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
                >
                  Close
                </button>
                {!challengeSolved ? (
                  <button
                    type="button"
                    onClick={handleCompleteChallenge}
                    className="btn-arcade-gold px-6 py-3 rounded-xl text-xs font-arcade"
                  >
                    BALANCE &amp; CLAIM BADGE 🏅
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveLevel(null)}
                    className="btn-arcade-emerald px-6 py-3 rounded-xl text-xs font-arcade"
                  >
                    CONTINUE EXPEDITION ▶
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Mounted Interactive Simulators */}
      <ShackletonSurvivalModal
        isOpen={isSurvivalModalOpen}
        onClose={() => setIsSurvivalModalOpen(false)}
        onAddXp={onAddXp}
      />

      <MarsRoverDroneModal
        isOpen={isRoverModalOpen}
        onClose={() => setIsRoverModalOpen(false)}
        onAddXp={onAddXp}
      />

    </div>
  );
};

export default AcademyTrailPage;
