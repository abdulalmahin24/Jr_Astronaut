import React, { useState, useEffect, useRef } from 'react';
import type { TrainingPillarId } from './RealisticTrainingCenterModal';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Film, 
  Tv, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw 
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { speechEngine } from '../utils/speechEngine';

export interface VideoLessonStep {
  stepNumber: number;
  title: string;
  caption: string;
}

export interface TrainingPillarVideoData {
  pillarId: TrainingPillarId;
  title: string;
  duration: string;
  youtubeId: string;
  nasaGovUrl: string;
  summary: string;
  steps: VideoLessonStep[];
}

export const TRAINING_VIDEO_DATA: Record<TrainingPillarId, TrainingPillarVideoData> = {
  FITNESS_NBL: {
    pillarId: 'FITNESS_NBL',
    title: 'Neutral Buoyancy Lab (NBL) Underwater Spacewalk Training',
    duration: '2:15',
    youtubeId: 'cwZb2mqId0A',
    nasaGovUrl: 'https://www.nasa.gov/johnson/neutral-buoyancy-laboratory/',
    summary: 'NASA astronauts spend 7 hours underwater in the 6.2-million-gallon NBL pool for every 1 hour in space. Lead weights cancel out gravity to simulate true weightlessness.',
    steps: [
      {
        stepNumber: 1,
        title: 'Deep Submersion into Houston 6.2M Gallon Pool',
        caption: 'Cadet enters the 40-foot deep NBL pool with safety scuba divers alongside, surrounded by full-scale ISS truss mockups.'
      },
      {
        stepNumber: 2,
        title: 'Neutral Buoyancy Ballast Calibration (Fb = m · g)',
        caption: 'Lead weights are carefully attached to the arms and torso until buoyancy exactly equals body weight, so the astronaut neither floats nor sinks.'
      },
      {
        stepNumber: 3,
        title: 'Pressurized Heavy Glove Ratchet Torque Drill',
        caption: 'Under 14.7 psi water pressure, astronauts operate oversized ratchets to torque critical hatch bolts onto space station trusses.'
      },
      {
        stepNumber: 4,
        title: 'Vestibular Bárány Chair Space Adaptation',
        caption: 'Rapid rotational conditioning desensitizes inner-ear fluid against Space Adaptation Syndrome (SAS) motion sickness before launch.'
      }
    ]
  },

  SPACESUIT_ECLSS: {
    pillarId: 'SPACESUIT_ECLSS',
    title: 'NASA EMU Spacesuit Architecture & Pre-Breathe Protocol',
    duration: '2:40',
    youtubeId: 'Pr2IsapvdaY',
    nasaGovUrl: 'https://www.nasa.gov/reference/extravehicular-mobility-unit/',
    summary: 'The Extravehicular Mobility Unit (EMU) is a 1-person personal spacecraft. Pure oxygen pre-breathe washes nitrogen from the blood to prevent the bends.',
    steps: [
      {
        stepNumber: 1,
        title: 'Liquid Cooling and Ventilation Garment (LCVG)',
        caption: 'Astronauts first wear the LCVG underwear, threaded with 300 feet of chilled plastic tubes circulating cool water against extreme body heat.'
      },
      {
        stepNumber: 2,
        title: '100% Pure Oxygen Pre-Breathe Nitrogen Washout',
        caption: 'To prevent decompression sickness (the bends), astronauts breathe pure oxygen for 2 hours to flush nitrogen gas out of their bloodstream.'
      },
      {
        stepNumber: 3,
        title: '4.3 PSI Suit Pressurization & Valsalva Ear Pop',
        caption: 'Suit pressure drops to 4.3 psi for finger mobility. The cadet presses their nose against the helmet Valsalva sponge to pop and equalize ears.'
      },
      {
        stepNumber: 4,
        title: 'Dual 55-Foot Braided Steel Safety Tether Lock',
        caption: 'Dual load-rated tethers clamp onto the Quest airlock slide-wire, ensuring the astronaut never floats away into the abyss of space.'
      }
    ]
  },

  HABITAT_NUTRITION: {
    pillarId: 'HABITAT_NUTRITION',
    title: 'Space Station Zero-G Daily Living, Nutrition & Ecology',
    duration: '2:20',
    youtubeId: 'YoLGwggKuec',
    nasaGovUrl: 'https://www.nasa.gov/international-space-station/',
    summary: 'In zero gravity, hot air never rises! Cabin ventilation fans prevent suffocating CO2 bubbles around sleeping astronauts, while tortillas replace crumbly bread.',
    steps: [
      {
        stepNumber: 1,
        title: 'Sleep Pod Forced Air Ventilation Fan',
        caption: 'Without gravity, exhaled carbon dioxide pools right around your mouth! Electric fans must blow air constantly to keep you breathing clean oxygen.'
      },
      {
        stepNumber: 2,
        title: 'Zero-Crumb Space Food: Tortillas vs Bread',
        caption: 'Bread crumbs float away into eyes and choke air circulation filters. NASA crews exclusively eat flour tortillas with peanut butter in space.'
      },
      {
        stepNumber: 3,
        title: 'Closed-Loop ECLSS Water Recovery System',
        caption: 'The water loop recycles 98% of all moisture, purifying cabin sweat and urine into ultra-pure drinking water for the next mission day.'
      },
      {
        stepNumber: 4,
        title: 'Wall-Strapped Sleeping Bag Restraints',
        caption: 'Astronauts zip into sleeping bags strapped securely to cabin bulkheads so they do not drift into control panels or switches while asleep.'
      }
    ]
  },

  SURFACE_REGOLITH: {
    pillarId: 'SURFACE_REGOLITH',
    title: 'Lunar Surface Operations, Electrostatic Dust & Canadarm',
    duration: '2:35',
    youtubeId: 'YywBMm8IvzI',
    nasaGovUrl: 'https://www.nasa.gov/artemis-campaign/',
    summary: 'Moon dust is electrostatically charged and sharp as crushed glass. Crews use electrostatic airlock showers and teleoperate the 50-foot Canadarm robot.',
    steps: [
      {
        stepNumber: 1,
        title: 'Airlock Electrostatic De-Dusting Ion Shower',
        caption: 'Before entering the lunar outpost, purple electrostatic electron beams neutralize and blast away jagged regolith dust clinging to suits.'
      },
      {
        stepNumber: 2,
        title: 'Canadarm Robotic Teleoperation & Snare Grapple',
        caption: 'Pilots use translational hand controllers to position the 50-foot articulated robotic arm, locking its snare wires onto cargo modules.'
      },
      {
        stepNumber: 3,
        title: 'Apollo Rotary Core Drill for Volatile Ice',
        caption: 'Astronauts drill 3 meters deep into permanently shadowed craters at Shackleton Rim to extract volatile water ice for rocket propellant.'
      },
      {
        stepNumber: 4,
        title: 'Extreme Polar Night Radiation Shielding',
        caption: 'Outpost habitats are buried under 2 meters of packed regolith shielding to survive -200°C polar nights and solar cosmic radiation.'
      }
    ]
  },

  EMERGENCY_DRILLS: {
    pillarId: 'EMERGENCY_DRILLS',
    title: 'Critical Space Emergencies: Zero-G Fire & SAFER Jetpack',
    duration: '2:15',
    youtubeId: 'Qqw-_-tfthg',
    nasaGovUrl: 'https://www.nasa.gov/directorates/somd/space-station-safety/',
    summary: 'Zero-g fire burns as a quiet, dome-shaped blue sphere. If a spacewalk tether breaks, the SAFER nitrogen jetpack flies the astronaut safely back to the airlock.',
    steps: [
      {
        stepNumber: 1,
        title: 'Zero-G Spherical Blue Flame Physics',
        caption: 'With no buoyancy-driven convection, orbital fires burn as faint blue spheres. Astronauts spray fine CO2 mist to instantly smother oxygen.'
      },
      {
        stepNumber: 2,
        title: '5-Second Quick-Don Emergency Smoke Mask',
        caption: 'In the event of toxic ammonia leaks or fire, crews have emergency breathing masks equipped within 5 seconds with independent oxygen.'
      },
      {
        stepNumber: 3,
        title: 'SAFER Cold-Gas Nitrogen Jetpack Activation',
        caption: 'If an astronaut becomes untethered and drifts away at 2 mph, clicking the SAFER chest controller deploys 24 cold-gas nitrogen thrusters.'
      },
      {
        stepNumber: 4,
        title: 'Automated Return-to-Station Vector Guidance',
        caption: 'The SAFER flight computer locks onto the station beacon, firing pulsed nitrogen bursts to fly the cadet straight back into the Quest airlock.'
      }
    ]
  }
};

interface CadetAnimationVideoStageProps {
  pillarId: TrainingPillarId;
  onDrillPassed?: (pillarId: string) => void;
}

export const CadetAnimationVideoStage: React.FC<CadetAnimationVideoStageProps> = ({
  pillarId,
  onDrillPassed,
}) => {
  const [videoStyle, setVideoStyle] = useState<'ANIMATION' | 'NASA_REAL'>('ANIMATION');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isVoiceNarratorOn, setIsVoiceNarratorOn] = useState<boolean>(true);

  const videoData = TRAINING_VIDEO_DATA[pillarId] || TRAINING_VIDEO_DATA.FITNESS_NBL;
  const currentStep = videoData.steps[currentStepIdx] || videoData.steps[0];

  // Reset step index when pillar changes
  useEffect(() => {
    setCurrentStepIdx(0);
    setIsPlaying(true);
  }, [pillarId]);

  // Houston voice narration on step change
  useEffect(() => {
    if (isVoiceNarratorOn && isPlaying) {
      speechEngine.speak(
        `${currentStep.title}. ${currentStep.caption}`,
        'HOUSTON_CAPCOM',
        () => {},
        () => {}
      );
    }
  }, [pillarId, currentStepIdx, isVoiceNarratorOn, isPlaying]);

  // Auto-play timer through the steps
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying && videoStyle === 'ANIMATION') {
      timer = setTimeout(() => {
        if (currentStepIdx < videoData.steps.length - 1) {
          setCurrentStepIdx((prev) => prev + 1);
          soundFx.playTelemetryChirp();
        } else {
          setIsPlaying(false);
          soundFx.playVictory();
          if (onDrillPassed) {
            onDrillPassed(pillarId);
          }
        }
      }, 7500); // 7.5 seconds per step
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIdx, videoData.steps.length, videoStyle, pillarId, onDrillPassed]);

  const handleNext = () => {
    if (currentStepIdx < videoData.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
      soundFx.playClick(750);
    } else {
      setIsPlaying(false);
      soundFx.playVictory();
      if (onDrillPassed) onDrillPassed(pillarId);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
      soundFx.playClick(600);
    }
  };

  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (!next) {
      speechEngine.stop();
    }
    soundFx.playClick(800);
  };

  // ── DYNAMIC ANIMATION SVG STAGES FOR EACH PILLAR ──
  const renderAnimationStage = () => {
    switch (pillarId) {
      case 'FITNESS_NBL':
        return (
          <svg viewBox="0 0 800 450" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="nblWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="40%" stopColor="#0369a1" />
                <stop offset="100%" stopColor="#082f49" />
              </linearGradient>
              <linearGradient id="suitGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
            {/* Water Tank */}
            <rect width="800" height="450" fill="url(#nblWater)" />

            {/* Underwater Grid Floor */}
            <line x1="0" y1="400" x2="800" y2="400" stroke="#38bdf8" strokeWidth="2" opacity="0.6" />
            <line x1="100" y1="400" x2="0" y2="450" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />
            <line x1="300" y1="400" x2="250" y2="450" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />
            <line x1="500" y1="400" x2="550" y2="450" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />
            <line x1="700" y1="400" x2="800" y2="450" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />

            {/* Rising Bubbles */}
            {[
              { cx: 180, cy: 350, r: 8, dur: '3.2s' },
              { cx: 220, cy: 380, r: 5, dur: '2.5s' },
              { cx: 420, cy: 330, r: 9, dur: '3.8s' },
              { cx: 460, cy: 360, r: 6, dur: '2.9s' },
              { cx: 620, cy: 340, r: 10, dur: '4.1s' },
            ].map((b, idx) => (
              <circle key={idx} cx={b.cx} cy={b.cy} r={b.r} fill="none" stroke="#e0f2fe" strokeWidth="2" opacity="0.8">
                <animate attributeName="cy" values={`${b.cy};50`} dur={b.dur} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur={b.dur} repeatCount="indefinite" />
              </circle>
            ))}

            {/* Underwater ISS Truss Mockup */}
            <g transform="translate(480, 180)">
              <rect x="0" y="0" width="240" height="90" fill="#1e293b" stroke="#64748b" strokeWidth="3" rx="4" />
              <line x1="0" y1="0" x2="240" y2="90" stroke="#475569" strokeWidth="2" />
              <line x1="0" y1="90" x2="240" y2="0" stroke="#475569" strokeWidth="2" />
              {/* Hatch Bolt with Torque Glow */}
              <circle cx="120" cy="45" r="16" fill="#f59e0b" stroke="#fbbf24" strokeWidth="3">
                {currentStepIdx >= 2 && (
                  <animate attributeName="r" values="16;22;16" dur="1.2s" repeatCount="indefinite" />
                )}
              </circle>
              <text x="120" y="80" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="bold">
                TORQUE: {currentStepIdx >= 2 ? '100% LOCKED' : '75% APPLIED'}
              </text>
            </g>

            {/* Astronaut Suspended in Neutral Buoyancy */}
            <g transform={`translate(${currentStepIdx >= 2 ? 380 : 320}, ${200 + (isPlaying ? Math.sin(Date.now() / 600) * 8 : 0)})`}>
              {/* PLSS Backpack */}
              <rect x="-35" y="-50" width="30" height="85" fill="#475569" stroke="#000" strokeWidth="2" rx="6" />
              {/* Torso */}
              <ellipse cx="10" cy="-5" rx="36" ry="48" fill="url(#suitGrad)" stroke="#334155" strokeWidth="3" />
              {/* Helmet & Gold Visor */}
              <circle cx="10" cy="-75" r="32" fill="url(#suitGrad)" stroke="#334155" strokeWidth="3" />
              <ellipse cx="15" cy="-75" rx="20" ry="16" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
              {/* Floating Arms holding Ratchet Tool */}
              <path d="M 35 -20 Q 80 -10 110 15" stroke="url(#suitGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />
              <path d="M -15 -20 Q 20 20 60 35" stroke="url(#suitGrad)" strokeWidth="16" strokeLinecap="round" fill="none" />
              {/* Ratchet Tool */}
              <rect x="95" y="10" width="40" height="12" fill="#0284c7" stroke="#fff" strokeWidth="2" rx="3" />
              {/* Legs Floating Neutral */}
              <path d="M -8 38 Q -20 100 -25 130" stroke="url(#suitGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />
              <path d="M 22 38 Q 28 95 38 128" stroke="url(#suitGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />
              {/* Lead Weights Badges */}
              <rect x="-36" y="80" width="16" height="14" fill="#3b82f6" rx="2" />
              <text x="-28" y="91" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">0kg</text>
              <rect x="42" y="80" width="16" height="14" fill="#3b82f6" rx="2" />
              <text x="50" y="91" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">0kg</text>
            </g>

            {/* Scuba Safety Diver */}
            <g transform="translate(140, 220)">
              <ellipse cx="0" cy="0" rx="28" ry="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="-35" cy="0" r="12" fill="#0f172a" />
              <path d="M 25 -5 L 60 -18" stroke="#0ea5e9" strokeWidth="8" strokeLinecap="round" />
              <text x="0" y="32" fill="#7dd3fc" fontSize="10" fontWeight="bold" textAnchor="middle">SAFETY DIVER</text>
            </g>

            {/* Buoyancy Status Gauge */}
            <g transform="translate(30, 30)">
              <rect width="210" height="65" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="2" rx="8" />
              <text x="16" y="24" fill="#38bdf8" fontSize="11" fontWeight="bold">NBL WATER BUOYANCY STATUS</text>
              <text x="16" y="48" fill="#4ade80" fontSize="18" fontFamily="monospace" fontWeight="900">
                ● NEUTRAL (0.00 kg)
              </text>
            </g>
          </svg>
        );

      case 'SPACESUIT_ECLSS':
        return (
          <svg viewBox="0 0 800 450" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="cleanroomBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#090d16" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <rect width="800" height="450" fill="url(#cleanroomBg)" />

            {/* Cleanroom Grid */}
            <line x1="0" y1="380" x2="800" y2="380" stroke="#00d2ff" strokeWidth="1" opacity="0.3" />

            {/* Spacesuit Cross-Section Layout */}
            <g transform="translate(400, 220)">
              {/* Oxygen Tank Lines from PLSS */}
              <path d="M -80 -60 Q -120 -20 -70 40" stroke="#38bdf8" strokeWidth="6" strokeDasharray="6,4" fill="none">
                <animate attributeName="strokeDashoffset" values="0;20" dur="1s" repeatCount="indefinite" />
              </path>
              {/* LCVG Water Chiller Cooling Lines */}
              <path d="M -40 -30 Q 0 -10 30 -40 Q 0 -20 -30 20" stroke="#06b6d4" strokeWidth="3" fill="none" opacity="0.9">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
              </path>

              {/* Main Suit Torso */}
              <ellipse cx="0" cy="0" rx="70" ry="90" fill="#f8fafc" stroke="#38bdf8" strokeWidth="4" />
              {/* Helmet */}
              <circle cx="0" cy="-130" r="50" fill="#f8fafc" stroke="#38bdf8" strokeWidth="4" />
              <ellipse cx="0" cy="-130" rx="35" ry="28" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />
              {/* Valsalva Sponge inside helmet */}
              <circle cx="-14" cy="-122" r="6" fill="#ef4444" stroke="#fff" strokeWidth="1.5">
                <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text x="60" y="-120" fill="#f87171" fontSize="11" fontWeight="bold">Valsalva Sponge (Ear Equalizer)</text>

              {/* PLSS Backpack on Side */}
              <rect x="-140" y="-100" width="60" height="150" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" rx="8" />
              <text x="-110" y="-70" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">NASA PLSS</text>
              <text x="-110" y="-45" fill="#4ade80" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">O2: 100%</text>
              <text x="-110" y="-25" fill="#fef08a" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">4.3 PSI</text>

              {/* Dual Safety Tether Line */}
              <path d="M 50 40 Q 180 80 280 20" stroke="#f59e0b" strokeWidth="4" fill="none" strokeDasharray="8,4" />
              <text x="220" y="10" fill="#fbbf24" fontSize="11" fontWeight="bold">Dual Braided Steel Safety Tether</text>
            </g>

            {/* Pre-Breathe Telemetry Banner */}
            <g transform="translate(30, 30)">
              <rect width="260" height="80" fill="rgba(15, 23, 42, 0.9)" stroke="#00d2ff" strokeWidth="2" rx="8" />
              <text x="16" y="24" fill="#00d2ff" fontSize="11" fontWeight="bold">100% PURE OXYGEN PRE-BREATHE</text>
              <text x="16" y="48" fill="#4ade80" fontSize="17" fontFamily="monospace" fontWeight="900">
                NITROGEN PURGE: {currentStepIdx >= 1 ? '100% COMPLETE' : '94% ACTIVE'}
              </text>
              <text x="16" y="68" fill="#94a3b8" fontSize="10">Decompression Sickness Risk: 0.00%</text>
            </g>
          </svg>
        );

      case 'HABITAT_NUTRITION':
        return (
          <svg viewBox="0 0 800 450" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="habBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            <rect width="800" height="450" fill="url(#habBg)" />

            {/* ISS Harmony Cabin Curve */}
            <circle cx="400" cy="225" r="320" fill="none" stroke="#475569" strokeWidth="12" />

            {/* Ventilation Fan with Air Current Lines */}
            <g transform="translate(680, 160)">
              <circle cx="0" cy="0" r="45" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              {/* Rotating fan blades */}
              <g>
                <line x1="-32" y1="0" x2="32" y2="0" stroke="#38bdf8" strokeWidth="6" />
                <line x1="0" y1="-32" x2="0" y2="32" stroke="#38bdf8" strokeWidth="6" />
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.8s" repeatCount="indefinite" />
              </g>
              <text x="0" y="62" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">SLEEP POD FAN</text>
            </g>

            {/* Blue Airflow Wave Lines */}
            {[
              { d: 'M 640 160 Q 400 120 180 180', dur: '1.5s' },
              { d: 'M 640 180 Q 450 240 220 220', dur: '1.8s' },
            ].map((wave, idx) => (
              <path key={idx} d={wave.d} stroke="#38bdf8" strokeWidth="3" fill="none" strokeDasharray="12,8" opacity="0.8">
                <animate attributeName="strokeDashoffset" values="40;0" dur={wave.dur} repeatCount="indefinite" />
              </path>
            ))}

            {/* Floating Space Food: Tortilla & Peanut Butter */}
            <g transform={`translate(280, ${180 + (isPlaying ? Math.sin(Date.now() / 500) * 12 : 0)}) rotate(-15)`}>
              <ellipse cx="0" cy="0" rx="42" ry="26" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
              <ellipse cx="-5" cy="-2" rx="22" ry="12" fill="#b45309" opacity="0.8" />
              <text x="0" y="45" fill="#fef08a" fontSize="11" fontWeight="bold" textAnchor="middle">ZERO-CRUMB TORTILLA</text>
            </g>

            {/* Astronaut Strapped to Bulkhead Sleep Bunk */}
            <g transform="translate(180, 280) rotate(90)">
              {/* Sleeping Bag */}
              <rect x="-30" y="-80" width="60" height="160" fill="#0284c7" stroke="#fff" strokeWidth="3" rx="16" />
              {/* Belts holding to wall */}
              <line x1="-35" y1="-30" x2="35" y2="-30" stroke="#f59e0b" strokeWidth="5" />
              <line x1="-35" y1="30" x2="35" y2="30" stroke="#f59e0b" strokeWidth="5" />
              {/* Astronaut Head */}
              <circle cx="0" cy="-60" r="18" fill="#fed7aa" stroke="#000" strokeWidth="1.5" />
            </g>

            {/* Water Recovery Closed Loop HUD */}
            <g transform="translate(30, 30)">
              <rect width="250" height="75" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" rx="8" />
              <text x="16" y="24" fill="#38bdf8" fontSize="11" fontWeight="bold">CLOSED-LOOP ECLSS WATER LOOP</text>
              <text x="16" y="48" fill="#4ade80" fontSize="17" fontFamily="monospace" fontWeight="900">
                RECYCLED: 98.4%
              </text>
              <text x="16" y="66" fill="#94a3b8" fontSize="10">Urine & Cabin Sweat → Ultra-Pure Water</text>
            </g>
          </svg>
        );

      case 'SURFACE_REGOLITH':
        return (
          <svg viewBox="0 0 800 450" style={{ width: '100%', height: '100%' }}>
            <rect width="800" height="450" fill="#000000" />
            {/* Stars */}
            {[
              { cx: 80, cy: 50 }, { cx: 220, cy: 90 }, { cx: 480, cy: 40 }, { cx: 720, cy: 80 }, { cx: 610, cy: 120 }
            ].map((s, i) => (
              <circle key={i} cx={s.cx} cy={s.cy} r={1.5} fill="#ffffff" />
            ))}

            {/* Earth in the Lunar Sky */}
            <circle cx="700" cy="80" r="32" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <path d="M 685 70 Q 710 65 725 85" stroke="#4ade80" strokeWidth="6" fill="none" />

            {/* Lunar Horizon & Craters */}
            <path d="M 0 280 Q 250 240 500 270 Q 700 250 800 280 L 800 450 L 0 450 Z" fill="#334155" />
            <ellipse cx="200" cy="330" rx="60" ry="18" fill="#1e293b" />
            <ellipse cx="620" cy="360" rx="90" ry="25" fill="#1e293b" />

            {/* Airlock Electrostatic Shower (Purple Ion Rays) */}
            <g transform="translate(140, 200)">
              <rect x="0" y="0" width="110" height="150" fill="#1e293b" stroke="#c084fc" strokeWidth="3" rx="6" />
              {/* Purple zap arcs */}
              <line x1="20" y1="20" x2="90" y2="60" stroke="#c084fc" strokeWidth="3" strokeDasharray="4,4">
                <animate attributeName="stroke-opacity" values="0.2;1;0.2" dur="0.4s" repeatCount="indefinite" />
              </line>
              <line x1="90" y1="80" x2="20" y2="120" stroke="#e879f9" strokeWidth="3" strokeDasharray="4,4">
                <animate attributeName="stroke-opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" />
              </line>
              <text x="55" y="170" fill="#e879f9" fontSize="10" fontWeight="bold" textAnchor="middle">ION DE-DUSTING</text>
            </g>

            {/* Canadarm Articulated Robotic Arm */}
            <g transform="translate(360, 180)">
              <path d="M 0 100 Q 80 20 160 50 Q 220 80 260 20" stroke="#f8fafc" strokeWidth="8" fill="none" />
              <circle cx="160" cy="50" r="12" fill="#38bdf8" />
              <circle cx="260" cy="20" r="10" fill="#f59e0b" />
              {/* Grappled Cargo Pod */}
              <rect x="250" y="20" width="55" height="55" fill="#d97706" stroke="#fbbf24" strokeWidth="2" rx="4" />
              <text x="210" y="-10" fill="#38bdf8" fontSize="11" fontWeight="bold">CANADARM ROBOTIC GRAPPLE</text>
            </g>

            {/* Regolith Status Banner */}
            <g transform="translate(30, 30)">
              <rect width="240" height="70" fill="rgba(15, 23, 42, 0.9)" stroke="#c084fc" strokeWidth="2" rx="8" />
              <text x="16" y="24" fill="#c084fc" fontSize="11" fontWeight="bold">ELECTROSTATIC DE-DUSTING</text>
              <text x="16" y="46" fill="#4ade80" fontSize="17" fontFamily="monospace" fontWeight="900">
                STATIC VOLTS: 0.0 kV
              </text>
              <text x="16" y="62" fill="#94a3b8" fontSize="10">Sharp Basalt Dust Repelled</text>
            </g>
          </svg>
        );

      case 'EMERGENCY_DRILLS':
        return (
          <svg viewBox="0 0 800 450" style={{ width: '100%', height: '100%' }}>
            <rect width="800" height="450" fill="#030712" />

            {/* Starfield */}
            {[
              { cx: 90, cy: 60 }, { cx: 280, cy: 110 }, { cx: 520, cy: 70 }, { cx: 710, cy: 90 }
            ].map((s, i) => (
              <circle key={i} cx={s.cx} cy={s.cy} r={1.5} fill="#ffffff" />
            ))}

            {/* Zero-G Spherical Blue Flame (smothered by CO2) */}
            <g transform="translate(240, 220)">
              {currentStepIdx === 0 ? (
                <>
                  <circle cx="0" cy="0" r="38" fill="#3b82f6" opacity="0.8">
                    <animate attributeName="r" values="36;42;36" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="22" fill="#93c5fd" opacity="0.9" />
                  <text x="0" y="60" fill="#60a5fa" fontSize="11" fontWeight="bold" textAnchor="middle">SPHERICAL ZERO-G FLAME</text>
                </>
              ) : (
                <>
                  {/* CO2 Extinguisher Cloud */}
                  <ellipse cx="0" cy="0" rx="60" ry="35" fill="#f8fafc" opacity="0.7">
                    <animate attributeName="rx" values="40;70;55" dur="1.2s" repeatCount="indefinite" />
                  </ellipse>
                  <text x="0" y="60" fill="#4ade80" fontSize="11" fontWeight="bold" textAnchor="middle">FLAME SMOTHERED (CO2)</text>
                </>
              )}
            </g>

            {/* Astronaut with SAFER Jetpack Flyback */}
            <g transform="translate(520, 220)">
              {/* SAFER Cold Gas Nitrogen Thruster Plumes */}
              <g>
                <path d="M 40 -15 L 85 -25 L 85 -5 Z" fill="#e0f2fe" opacity="0.8" />
                <path d="M 40 15 L 85 5 L 85 25 Z" fill="#e0f2fe" opacity="0.8" />
                <animate attributeName="opacity" values="0.3;1;0.3" dur="0.4s" repeatCount="indefinite" />
              </g>

              {/* Astronaut in Suit */}
              <ellipse cx="0" cy="0" rx="36" ry="48" fill="#f8fafc" stroke="#ef4444" strokeWidth="3" />
              <circle cx="0" cy="-60" r="26" fill="#f8fafc" stroke="#ef4444" strokeWidth="3" />
              <ellipse cx="0" cy="-60" rx="18" ry="14" fill="#fbbf24" />
              {/* SAFER Jetpack on back */}
              <rect x="25" y="-35" width="22" height="70" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <text x="0" y="70" fill="#f87171" fontSize="11" fontWeight="bold" textAnchor="middle">
                SAFER JETPACK: RETURN VECTOR
              </text>
            </g>

            {/* Station Airlock Target Vector */}
            <g transform="translate(710, 220)">
              <circle cx="0" cy="0" r="30" fill="none" stroke="#4ade80" strokeWidth="3" strokeDasharray="6,4">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
              </circle>
              <text x="0" y="45" fill="#4ade80" fontSize="10" fontWeight="bold" textAnchor="middle">QUEST AIRLOCK</text>
            </g>

            {/* Emergency Status Banner */}
            <g transform="translate(30, 30)">
              <rect width="250" height="75" fill="rgba(15, 23, 42, 0.9)" stroke="#ef4444" strokeWidth="2" rx="8" />
              <text x="16" y="24" fill="#f87171" fontSize="11" fontWeight="bold">EMERGENCY JETPACK TELEMETRY</text>
              <text x="16" y="48" fill="#4ade80" fontSize="17" fontFamily="monospace" fontWeight="900">
                RETURN SPEED: 3.2 m/s
              </text>
              <text x="16" y="66" fill="#94a3b8" fontSize="10">Target Locked: Quest Airlock</text>
            </g>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#030712' }}>
      {/* ── TOP CINEMA CONTROLS ── */}
      <div
        style={{
          padding: '10px 20px',
          backgroundColor: '#0a0f1d',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🎬</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 900 }}>
              {videoData.title}
            </h3>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              NASA Educational Space Curriculum · Duration: {videoData.duration}
            </span>
          </div>
        </div>

        {/* Style Switcher: 2D Animation vs NASA Real Video */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#0f172a', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => { setVideoStyle('ANIMATION'); soundFx.playClick(750); }}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                background: videoStyle === 'ANIMATION' ? 'linear-gradient(90deg, #0284c7, #2563eb)' : 'transparent',
                color: videoStyle === 'ANIMATION' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Film size={13} />
              <span>🎨 Animated Lesson</span>
            </button>
            <button
              onClick={() => { setVideoStyle('NASA_REAL'); setIsPlaying(false); soundFx.playClick(850); }}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                background: videoStyle === 'NASA_REAL' ? 'linear-gradient(90deg, #ea580c, #f97316)' : 'transparent',
                color: videoStyle === 'NASA_REAL' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Tv size={13} />
              <span>📹 Real NASA Video</span>
            </button>
          </div>

          {/* Voice Narrator Toggle */}
          <button
            onClick={() => {
              const next = !isVoiceNarratorOn;
              setIsVoiceNarratorOn(next);
              if (!next) speechEngine.stop();
              soundFx.playClick(700);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: isVoiceNarratorOn ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
              color: isVoiceNarratorOn ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Toggle Houston Voice Narrator"
          >
            {isVoiceNarratorOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{isVoiceNarratorOn ? 'VOICE ON' : 'VOICE OFF'}</span>
          </button>
        </div>
      </div>

      {/* ── VIDEO MAIN STAGE ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {videoStyle === 'ANIMATION' ? (
          renderAnimationStage()
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoData.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={videoData.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}

        {/* Animated Subtitle / Caption Banner (when in Animation mode) */}
        {videoStyle === 'ANIMATION' && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '20px',
              right: '20px',
              background: 'rgba(7, 11, 19, 0.88)',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              borderRadius: '10px',
              padding: '12px 20px',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 210, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00d2ff',
                fontSize: '15px',
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {currentStep.stepNumber}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#fef08a' }}>
                {currentStep.title}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.4 }}>
                {currentStep.caption}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM PLAYBACK BAR (MINIMAL, ZERO-CLUTTER: ONLY 3 BUTTONS!) ── */}
      <div
        style={{
          padding: '12px 24px',
          backgroundColor: '#0a0f1d',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Step Indicator Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {videoData.steps.map((st, i) => (
            <button
              key={st.stepNumber}
              onClick={() => {
                setCurrentStepIdx(i);
                soundFx.playClick(700);
              }}
              style={{
                width: i === currentStepIdx ? '32px' : '10px',
                height: '10px',
                borderRadius: '5px',
                border: 'none',
                background: i === currentStepIdx ? '#00d2ff' : 'rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.25s',
              }}
              title={`Jump to Step ${st.stepNumber}: ${st.title}`}
            />
          ))}
          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px', fontFamily: 'monospace' }}>
            STEP {currentStepIdx + 1} / {videoData.steps.length}
          </span>
        </div>

        {/* 3 Core Playback Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 1. Prev Button */}
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: currentStepIdx === 0 ? '#475569' : '#cbd5e1',
              fontSize: '12px',
              fontWeight: 800,
              cursor: currentStepIdx === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <ChevronLeft size={16} />
            <span>PREV</span>
          </button>

          {/* 2. Play / Pause Button */}
          <button
            onClick={togglePlay}
            style={{
              padding: '8px 22px',
              borderRadius: '8px',
              background: isPlaying ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #0284c7, #2563eb)',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(2, 132, 199, 0.5)',
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* 3. Next Button */}
          <button
            onClick={handleNext}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #059669, #10b981)',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
            }}
          >
            <span>{currentStepIdx === videoData.steps.length - 1 ? 'COMPLETE & PASS ✔' : 'NEXT'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

