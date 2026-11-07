import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audioEffects';
import { speechEngine } from '../../utils/speechEngine';

interface MarsRoverDroneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddXp: (amount: number) => void;
  onUnlockBadge?: (badgeName: string) => void;
}

export const MarsRoverDroneModal: React.FC<MarsRoverDroneModalProps> = ({
  isOpen,
  onClose,
  onAddXp,
  onUnlockBadge,
}) => {
  const [activeTab, setActiveTab] = useState<'ROVER' | 'INGENUITY'>('ROVER');

  // Rover state
  const [roverX, setRoverX] = useState<number>(50); // 0 to 100% position
  const [wheelSlipPercent, setWheelSlipPercent] = useState<number>(12);
  const [gearMode, setGearMode] = useState<'STANDARD' | 'HIGH_TORQUE_LOW_GEAR'>('STANDARD');
  const [samplesDrilled, setSamplesDrilled] = useState<number>(0);
  const [spectrometerReading, setSpectrometerReading] = useState<string | null>(null);

  // Ingenuity drone state
  const [rotorRpm, setRotorRpm] = useState<number>(600);
  const [droneAltitudeMeters, setDroneAltitudeMeters] = useState<number>(0);
  const [isDroneAirborne, setIsDroneAirborne] = useState<boolean>(false);
  const [droneBattery, setDroneBattery] = useState<number>(100);

  const [capcomCallout, setCapcomCallout] = useState<string>(
    'Houston to Cadet: Welcome to Jezero Crater. Choose your vehicle: Drive the Perseverance Rover or fly the Ingenuity drone!'
  );

  const speakCapCom = (text: string) => {
    setCapcomCallout(text);
    speechEngine.speak(text, 'HOUSTON_CAPCOM');
  };

  useEffect(() => {
    if (isOpen) {
      setRoverX(50);
      setWheelSlipPercent(12);
      setGearMode('STANDARD');
      setSamplesDrilled(0);
      setSpectrometerReading(null);
      setRotorRpm(600);
      setDroneAltitudeMeters(0);
      setIsDroneAirborne(false);
      setDroneBattery(100);
      soundFx.playPowerUp();
      speakCapCom('Perseverance and Ingenuity operational on Mars. Explore Jezero Crater and drill for ancient lakebed biosignatures!');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Rover controls
  const handleDrive = (direction: 'LEFT' | 'RIGHT') => {
    soundFx.playClick(750);
    setRoverX((prev) => {
      const next = direction === 'LEFT' ? Math.max(10, prev - 8) : Math.min(90, prev + 8);
      // If in standard gear on sand dunes, wheel slip increases
      if (gearMode === 'STANDARD' && next > 60) {
        setWheelSlipPercent(42);
        soundFx.playWarningAlarm();
        speakCapCom('WARNING: High wheel slip in soft Martian sand dune! Shift to High-Torque Low-Gear to prevent getting stuck!');
      } else {
        setWheelSlipPercent(gearMode === 'HIGH_TORQUE_LOW_GEAR' ? 8 : 14);
      }
      return next;
    });
  };

  const handleToggleGear = () => {
    soundFx.playReactorStart();
    const nextGear = gearMode === 'STANDARD' ? 'HIGH_TORQUE_LOW_GEAR' : 'STANDARD';
    setGearMode(nextGear);
    setWheelSlipPercent(nextGear === 'HIGH_TORQUE_LOW_GEAR' ? 8 : 22);
    if (nextGear === 'HIGH_TORQUE_LOW_GEAR') {
      speakCapCom('High-Torque Low-Gear engaged! 6-wheel titanium spring drive distributing even torque across regolith.');
    }
  };

  const handleFireRamanLaser = () => {
    soundFx.playTelemetryChirp();
    const discoveries = [
      'RAMAN SPECTROMETRY: Volatile sub-surface water-ice detected at 15cm depth! (H2O Crystals)',
      'RAMAN SPECTROMETRY: Carbonate mineral delta veins detected! Proof of ancient Martian lakebed water!',
      'RAMAN SPECTROMETRY: Olivine & Pyroxene volcanic basalt rocks with micro-porosity.',
    ];
    const picked = discoveries[samplesDrilled % discoveries.length];
    setSpectrometerReading(picked);
    setSamplesDrilled((prev) => {
      const nextCount = prev + 1;
      if (nextCount === 3) {
        soundFx.playVictory();
        confetti({ particleCount: 150, spread: 80 });
        onAddXp(150);
        if (onUnlockBadge) onUnlockBadge('Martian Aviator');
        speakCapCom('Historic discovery! 3 core samples sealed in titanium tubes for Mars Sample Return! Badge Unlocked!');
      }
      return nextCount;
    });
  };

  // Drone controls
  const handleThrottleRotor = (amount: number) => {
    soundFx.playClick(800);
    setRotorRpm((prev) => {
      const nextRpm = Math.min(2800, Math.max(0, prev + amount));
      // NASA Science: Martian air density is ~0.02 kg/m3 (1% Earth). Takes 2400 RPM for lift!
      if (nextRpm >= 2400) {
        setIsDroneAirborne(true);
        setDroneAltitudeMeters(Math.min(12, Math.round((nextRpm - 2400) * 0.03 + 2)));
        soundFx.playThruster();
      } else {
        setIsDroneAirborne(false);
        setDroneAltitudeMeters(0);
      }
      return nextRpm;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="cockpit-panel-amber rounded-3xl max-w-4xl w-full relative overflow-hidden shadow-2xl border-2 border-red-500/50 space-y-5 p-5 md:p-8 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚜</span>
            <div>
              <div className="text-[10px] font-arcade text-amber-400 tracking-wider">NASA MARS 2020 EXPLORATION LAB</div>
              <h3 className="font-space font-black text-xl md:text-2xl text-white">PERSEVERANCE ROVER &amp; INGENUITY DRONE</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Vehicle Selection Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('ROVER')}
            className={`flex-1 py-3 rounded-xl font-arcade text-xs transition-all ${
              activeTab === 'ROVER' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            🚜 PERSEVERANCE ROVER (SURFACE REGOLITH)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INGENUITY')}
            className={`flex-1 py-3 rounded-xl font-arcade text-xs transition-all ${
              activeTab === 'INGENUITY' ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            🚁 INGENUITY HELICOPTER (2,400 RPM THIN AIR)
          </button>
        </div>

        {/* Tab 1: Perseverance Rover Driving & Spectrometry */}
        {activeTab === 'ROVER' && (
          <div className="space-y-4">
            {/* Visual Rover Viewport */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-red-500/30 h-56 bg-gradient-to-b from-[#451a03] via-[#78350f] to-[#9a3412] p-4 flex flex-col justify-between">
              
              <div className="flex justify-between items-center text-xs font-mono-code bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/20 text-slate-300">
                <span>SECTOR: JEZERO CRATER DELTA</span>
                <span>WHEEL SLIP: <strong className={wheelSlipPercent > 30 ? 'text-red-400' : 'text-emerald-400'}>{wheelSlipPercent}%</strong></span>
                <span>GEAR: <strong className="text-amber-400">{gearMode === 'HIGH_TORQUE_LOW_GEAR' ? 'LOW GEAR (ROCK CLIMB)' : 'STANDARD'}</strong></span>
                <span>SAMPLES SEALED: <strong className="text-sky-300">{samplesDrilled} / 3</strong></span>
              </div>

              {/* Rover Avatar Positioning */}
              <div className="relative w-full h-24">
                <div
                  className="absolute bottom-2 transition-all duration-300 transform -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${roverX}%` }}
                >
                  <span className="text-4xl">🚜</span>
                  <span className="text-[9px] bg-slate-950/90 text-white px-2 py-0.5 rounded font-mono-code font-bold">PERSEVERANCE</span>
                </div>
              </div>

              {/* Sand Dune Hazard Area (Right Side) */}
              <div className="flex justify-between text-[11px] font-mono-code text-slate-300 border-t border-red-500/30 pt-1">
                <span>◀ ROCKY CRATER RIM</span>
                <span className="text-amber-400 font-bold">⚠️ SOFT SAND DUNE ZONE (WATCH WHEEL SLIP!) ▶</span>
              </div>
            </div>

            {/* Spectrometer Results Banner */}
            {spectrometerReading && (
              <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-400/40 text-purple-200 text-xs font-mono-code flex items-center justify-between">
                <span>🔬 {spectrometerReading}</span>
                <span className="text-emerald-400 font-bold">+50 XP</span>
              </div>
            )}

            {/* Tactical Rover Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Drive Left/Right */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDrive('LEFT')}
                  className="btn-arcade-cyan flex-1 py-3 rounded-xl font-bold text-xs"
                >
                  ◀ REVERSE
                </button>
                <button
                  type="button"
                  onClick={() => handleDrive('RIGHT')}
                  className="btn-arcade-gold flex-1 py-3 rounded-xl font-bold text-xs"
                >
                  FORWARD ▶
                </button>
              </div>

              {/* Gear Shift */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleToggleGear}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-arcade text-xs border border-amber-400/30"
                >
                  ⚙️ TOGGLE {gearMode === 'STANDARD' ? 'LOW GEAR (PREVENT SLIP)' : 'STANDARD GEAR'}
                </button>
              </div>

              {/* Raman Laser Spectrometer */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={handleFireRamanLaser}
                  className="btn-arcade-emerald w-full py-3 rounded-xl font-arcade text-xs"
                >
                  ⚡ FIRE RAMAN LASER &amp; SAMPLE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ingenuity Drone Flight */}
        {activeTab === 'INGENUITY' && (
          <div className="space-y-4">
            {/* Visual Drone Flight Deck */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-sky-500/30 h-56 bg-gradient-to-b from-[#0f172a] via-[#451a03] to-[#7c2d12] p-4 flex flex-col justify-between">
              
              <div className="flex justify-between items-center text-xs font-mono-code bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-500/20 text-slate-300">
                <span>AERODYNAMICS: MARS AIR DENSITY (1% EARTH)</span>
                <span>ROTOR RPM: <strong className={rotorRpm >= 2400 ? 'text-emerald-400 font-black' : 'text-amber-400'}>{rotorRpm} RPM</strong></span>
                <span>ALTITUDE: <strong className="text-sky-300">{droneAltitudeMeters} meters</strong></span>
                <span>STATUS: <strong className={isDroneAirborne ? 'text-emerald-400' : 'text-slate-400'}>{isDroneAirborne ? 'AIRBORNE' : 'GROUNDED'}</strong></span>
              </div>

              {/* Flying Drone Avatar */}
              <div className="relative w-full h-24 flex items-center justify-center">
                <div
                  className="transition-all duration-300 flex flex-col items-center"
                  style={{ transform: `translateY(-${droneAltitudeMeters * 5}px)` }}
                >
                  <span className={`text-4xl ${rotorRpm > 1800 ? 'animate-bounce' : ''}`}>🚁</span>
                  <span className="text-[9px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded font-mono-code font-bold">INGENUITY (1.8 KG)</span>
                </div>
              </div>

              <div className="text-[11px] font-mono-code text-slate-300 border-t border-sky-500/30 pt-1 text-center">
                NASA Rule: Martian atmospheric pressure is only 610 Pa (Earth: 101,300 Pa). Rotor blades must spin at 2,400 RPM to lift off!
              </div>
            </div>

            {/* Tactical Helicopter Throttle Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white">Dual Counter-Rotating Blade Throttle:</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleThrottleRotor(-400)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    ⬇ Throttle Down (-400 RPM)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThrottleRotor(400)}
                    className="btn-arcade-gold flex-1 py-3 rounded-xl font-arcade text-xs"
                  >
                    ⬆ THROTTLE UP (+400 RPM)
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Target Flight Milestone:</div>
                  <div className="text-[11px] text-slate-400">Reach 2,400 RPM &amp; hover above 5 meters!</div>
                </div>
                {isDroneAirborne && (
                  <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl font-bold text-xs border border-emerald-400/40 animate-pulse">
                    🎉 FLIGHT ACHIEVED! (+150 XP)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Houston CapCom Radio Audio Feed */}
        <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-sky-500/30 flex items-center gap-3 text-xs">
          <span className="text-xl">🎙️</span>
          <div>
            <span className="text-[10px] font-mono-code font-bold text-sky-400 uppercase tracking-wider block">
              HOUSTON CAPCOM TACTICAL MARS SORTIE FEED
            </span>
            <p className="text-slate-200 font-medium">{capcomCallout}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MarsRoverDroneModal;

