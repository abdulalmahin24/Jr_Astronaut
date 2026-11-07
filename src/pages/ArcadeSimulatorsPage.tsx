import React, { useState, useEffect, useRef } from 'react';
import type { AppRoute } from '../router/useAppRouter';
import { soundFx } from '../utils/audioEffects';
import { MarsEDLArcadeModal } from '../components/arcade/MarsEDLArcadeModal';
import { ShackletonSurvivalModal } from '../components/arcade/ShackletonSurvivalModal';
import { MarsRoverDroneModal } from '../components/arcade/MarsRoverDroneModal';

interface ArcadeSimulatorsPageProps {
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  onAddXp: (amount: number) => void;
  onLaunchMarsEDL?: () => void;
  onLaunchRover?: () => void;
  onLaunchBlackHole?: () => void;
  onLaunchOrrery?: () => void;
  onLaunchCampaign?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const ArcadeSimulatorsPage: React.FC<ArcadeSimulatorsPageProps> = ({
  onNavigate,
  onAddXp,
  onLaunchBlackHole,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'MOON' | 'MARS' | 'ORBIT'>('ALL');
  const [telemetry, setTelemetry] = useState({ alt: 250, speed: 1.2, fuel: 100 });
  const [isThrusterFiring, setIsThrusterFiring] = useState(false);
  const [showAhaAlert, setShowAhaAlert] = useState(false);

  // Dedicated Arcade Simulation Modals State
  const [isEDLModalOpen, setIsEDLModalOpen] = useState(false);
  const [isSurvivalModalOpen, setIsSurvivalModalOpen] = useState(false);
  const [isRoverModalOpen, setIsRoverModalOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landerStateRef = useRef({
    x: 250,
    y: 40,
    vy: 0,
    fuel: 100,
    isFiring: false,
    gameOver: false,
  });
  const particlesRef = useRef<Particle[]>([]);

  // Thruster activation
  const setThruster = (firing: boolean) => {
    landerStateRef.current.isFiring = firing;
    setIsThrusterFiring(firing);
    if (firing && landerStateRef.current.fuel > 0) {
      soundFx.playThruster();
      setShowAhaAlert(true);
    }
  };

  const restartSimulation = () => {
    soundFx.playClick(850);
    const canvas = canvasRef.current;
    landerStateRef.current = {
      x: canvas ? canvas.width / 2 : 250,
      y: 40,
      vy: 0,
      fuel: 100,
      isFiring: false,
      gameOver: false,
    };
    particlesRef.current = [];
    setShowAhaAlert(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = canvas.parentElement?.clientHeight || 360;
      landerStateRef.current.x = canvas.width / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') setThruster(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') setThruster(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Physics Loop
    const loop = () => {
      const lander = landerStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Clear Frame
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, w, h);

      // Starry background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 127) % w);
        const sy = ((i * 73) % (h - 70));
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Moon Terrain Ground
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, h - 45);
      ctx.lineTo(w * 0.35, h - 45);
      ctx.lineTo(w * 0.4, h - 25);
      ctx.lineTo(w * 0.6, h - 25); // Target Landing Pad
      ctx.lineTo(w * 0.65, h - 45);
      ctx.lineTo(w, h - 45);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Landing Pad Glow Strip
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.4, h - 25);
      ctx.lineTo(w * 0.6, h - 25);
      ctx.stroke();

      // Physics: Lunar Gravity g = 1.62 m/s^2
      if (!lander.gameOver) {
        const gravity = 0.045; // scaled 1.62 m/s^2
        const thrust = 0.11; // engine upward force

        if (lander.isFiring && lander.fuel > 0) {
          lander.vy -= thrust;
          lander.fuel = Math.max(0, lander.fuel - 0.22);

          // Emit Exhaust Particle Fire
          for (let p = 0; p < 4; p++) {
            particlesRef.current.push({
              x: lander.x + (Math.random() - 0.5) * 8,
              y: lander.y + 14,
              vx: (Math.random() - 0.5) * 2,
              vy: 2 + Math.random() * 4,
              life: 1.0,
              color: Math.random() > 0.4 ? '#fbbf24' : '#ef4444',
            });
          }
        }
        lander.vy += gravity;
        lander.y += lander.vy;

        // Ground Collision Check
        const groundHeight = lander.x >= w * 0.4 && lander.x <= w * 0.6 ? h - 25 : h - 45;
        if (lander.y >= groundHeight - 14) {
          lander.y = groundHeight - 14;
          lander.gameOver = true;

          // Touchdown Velocity Check (< 2.5 m/s threshold)
          if (lander.vy < 1.4 && lander.x >= w * 0.4 && lander.x <= w * 0.6) {
            soundFx.playVictory();
            onAddXp(150);
          } else {
            soundFx.playExplosion();
          }
        }

        setTelemetry({
          alt: Math.max(0, Math.round(groundHeight - 14 - lander.y)),
          speed: parseFloat(Math.abs(lander.vy * 2.8).toFixed(1)),
          fuel: Math.round(lander.fuel),
        });
      }

      // Draw Rocket Exhaust Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.life * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Lunar Descent Module
      ctx.save();
      ctx.translate(lander.x, lander.y);

      // Gold Foil Base
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-12, -4, 24, 12);

      // Silver Ascent Stage
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, -6, 9, 0, Math.PI * 2);
      ctx.fill();

      // Window
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-3, -8, 6, 4);

      // Landing Gear Struts
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, 8);
      ctx.lineTo(-18, 14);
      ctx.moveTo(12, 8);
      ctx.lineTo(18, 14);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 font-arcade text-xs mb-1">
            PILOT FLIGHT SIMULATORS · 60 FPS
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-space text-white">Aerospace Simulators Hub</h2>
          <p className="text-slate-400 text-sm">
            Fly real NASA physics simulations: Touch down on the Moon, survive Mars atmospheric entry, and manage life support!
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${filter === 'ALL' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('MOON')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${filter === 'MOON' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            🌕 Moon
          </button>
          <button
            type="button"
            onClick={() => setFilter('MARS')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${filter === 'MARS' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            🔴 Mars
          </button>
          <button
            type="button"
            onClick={() => setFilter('ORBIT')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${filter === 'ORBIT' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            🛰️ Orbit
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. FEATURED INTERACTIVE SIMULATOR: APOLLO 11 TOUCHDOWN */}
      {/* ======================================================== */}
      {(filter === 'ALL' || filter === 'MOON') && (
        <div className="cockpit-panel rounded-3xl p-6 md:p-8 border-2 border-sky-400/40 relative overflow-hidden shadow-2xl space-y-6">
          <div className="scan-beam"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono-code font-bold text-amber-400">PHYSICS ENGINE: NEWTONIAN DESCENT</span>
              <h3 className="font-space font-black text-2xl md:text-3xl text-white">Apollo 11 Lunar Touchdown</h3>
              <p className="text-xs text-slate-400">Target descent velocity: under 2.5 m/s. Moon gravity: 1.62 m/s² (1/6th of Earth).</p>
            </div>

            {/* Quick Live Telemetry Gauges */}
            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-sky-500/20 text-xs font-mono-code">
              <div>
                <div className="text-[10px] text-slate-500">ALTITUDE</div>
                <div className="text-amber-400 font-bold text-base">{telemetry.alt} m</div>
              </div>
              <div className="w-px h-6 bg-slate-800"></div>
              <div>
                <div className="text-[10px] text-slate-500">DESCENT RATE</div>
                <div className={`font-bold text-base ${telemetry.speed > 2.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {telemetry.speed} m/s
                </div>
              </div>
              <div className="w-px h-6 bg-slate-800"></div>
              <div>
                <div className="text-[10px] text-slate-500">FUEL (DPS)</div>
                <div className="text-sky-400 font-bold text-base">{telemetry.fuel}%</div>
              </div>
            </div>
          </div>

          {/* Canvas Gameplay Viewport */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 h-80 bg-slate-950">
            <canvas ref={canvasRef} className="w-full h-full" />
            
            {/* Soft Landing Success Banner */}
            {landerStateRef.current.gameOver && landerStateRef.current.vy < 1.4 && (
              <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="text-5xl animate-bounce">🏆</div>
                <h3 className="font-arcade text-3xl text-emerald-400">THE EAGLE HAS LANDED!</h3>
                <p className="text-sm text-slate-200 max-w-md">
                  Perfect touchdown at Shackleton Rim! Touchdown speed was under 2.5 m/s. (+150 Space XP)
                </p>
                <button
                  type="button"
                  onClick={restartSimulation}
                  className="btn-arcade-emerald px-6 py-3 rounded-xl font-arcade text-xs"
                >
                  FLY AGAIN 🔄
                </button>
              </div>
            )}

            {/* Hard Impact Crash Banner */}
            {landerStateRef.current.gameOver && landerStateRef.current.vy >= 1.4 && (
              <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="text-5xl animate-bounce">💥</div>
                <h3 className="font-space font-black text-3xl text-red-400">HARD TOUCHDOWN IMPACT</h3>
                <p className="text-sm text-slate-200 max-w-md font-mono-code">
                  Houston Telemetry: Impact velocity was {telemetry.speed} m/s. Due to Moon gravity (1.62 m/s²), throttle up earlier to cushion your descent!
                </p>
                <button
                  type="button"
                  onClick={restartSimulation}
                  className="btn-arcade-gold px-6 py-3 rounded-xl font-arcade text-xs"
                >
                  RETRY DESCENT 🔄
                </button>
              </div>
            )}
          </div>

          {/* Interactive Thrust Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400 font-mono-code">
              Controls: Press &amp; Hold <kbd className="bg-slate-800 px-2 py-1 rounded text-white border border-slate-700">SPACE</kbd> or use button to fire thruster.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={restartSimulation}
                className="px-4 py-3 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Reset Position 🔄
              </button>

              <button
                type="button"
                onMouseDown={() => setThruster(true)}
                onMouseUp={() => setThruster(false)}
                onTouchStart={() => setThruster(true)}
                onTouchEnd={() => setThruster(false)}
                className={`btn-arcade-gold px-8 py-4 rounded-2xl font-arcade text-base flex items-center gap-2 select-none ${
                  isThrusterFiring ? 'scale-95 shadow-inner' : ''
                }`}
              >
                <span>🔥 FIRE DESCENT THRUSTER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PLAYABLE SIMULATOR CARDS GRID */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Mars 7 Minutes of Terror EDL */}
        {(filter === 'ALL' || filter === 'MARS') && (
          <div className="cockpit-panel rounded-2xl p-5 border border-red-500/40 hover:border-red-400 transition-all group flex flex-col justify-between">
            <div>
              <div className="h-44 rounded-xl overflow-hidden relative">
                <img
                  src="/cinematic/mars_jezero.jpg"
                  alt="Mars Jezero"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-red-600 text-white font-arcade text-xs px-2.5 py-0.5 rounded shadow">
                  MARS EDL ARCADE
                </span>
                <span className="absolute bottom-3 right-3 bg-slate-950/80 text-amber-300 font-mono-code font-bold text-[10px] px-2 py-0.5 rounded">
                  +200 XP
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="font-space font-black text-lg text-white">Mars 7 Minutes of Terror</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Survive hypersonic Mach 20 entry, time the supersonic parachute mortar, and hover with the Sky Crane winch!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playPowerUp();
                setIsEDLModalOpen(true);
              }}
              className="btn-arcade-gold w-full py-3.5 rounded-xl font-arcade text-xs mt-4"
            >
              🚀 LAUNCH MARS EDL MISSION ▶
            </button>
          </div>
        )}

        {/* Card 2: Shackleton Base 354-Hour Lunar Night Survival */}
        {(filter === 'ALL' || filter === 'MOON') && (
          <div className="cockpit-panel rounded-2xl p-5 border border-amber-500/40 hover:border-amber-400 transition-all group flex flex-col justify-between">
            <div>
              <div className="h-44 rounded-xl overflow-hidden relative">
                <img
                  src="/cinematic/lunar_shackleton.jpg"
                  alt="Shackleton Base"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-arcade text-xs px-2.5 py-0.5 rounded shadow">
                  SURVIVAL LAB
                </span>
                <span className="absolute bottom-3 right-3 bg-slate-950/80 text-amber-300 font-mono-code font-bold text-[10px] px-2 py-0.5 rounded">
                  +150 XP
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="font-space font-black text-lg text-white">354-Hour Lunar Night Survival</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Solar output drops to 0 kW! Deploy Kilopower nuclear Stirling reactor &amp; Sabatier CO2 scrubbers to survive!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playReactorStart();
                setIsSurvivalModalOpen(true);
              }}
              className="btn-arcade-cyan w-full py-3.5 rounded-xl font-arcade text-xs mt-4"
            >
              ⚡ DEFEND SHACKLETON BASE ▶
            </button>
          </div>
        )}

        {/* Card 3: Perseverance Rover & Ingenuity Drone Scout */}
        {(filter === 'ALL' || filter === 'MARS') && (
          <div className="cockpit-panel rounded-2xl p-5 border border-sky-500/40 hover:border-sky-400 transition-all group flex flex-col justify-between">
            <div>
              <div className="h-44 rounded-xl overflow-hidden relative">
                <img
                  src="/cinematic/commander.jpg"
                  alt="Perseverance Rover"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-sky-500 text-slate-950 font-arcade text-xs px-2.5 py-0.5 rounded shadow">
                  ROVER &amp; DRONE
                </span>
                <span className="absolute bottom-3 right-3 bg-slate-950/80 text-amber-300 font-mono-code font-bold text-[10px] px-2 py-0.5 rounded">
                  +150 XP
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="font-space font-black text-lg text-white">Perseverance &amp; Ingenuity Drone</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Navigate soft sand dunes, prevent regolith wheel slip, fire Raman laser, and throttle drone to 2,400 RPM!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playPowerUp();
                setIsRoverModalOpen(true);
              }}
              className="btn-arcade-emerald w-full py-3.5 rounded-xl font-arcade text-xs mt-4"
            >
              🚜 DRIVE ROVER &amp; FLY DRONE ▶
            </button>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 3. MOUNTED ARCADE SIMULATOR MODALS */}
      {/* ======================================================== */}
      <MarsEDLArcadeModal
        isOpen={isEDLModalOpen}
        onClose={() => setIsEDLModalOpen(false)}
        onAddXp={onAddXp}
      />

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

export default ArcadeSimulatorsPage;
