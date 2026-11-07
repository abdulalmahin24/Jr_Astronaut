import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audioEffects';
import { speechEngine } from '../../utils/speechEngine';

interface MarsEDLArcadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddXp: (amount: number) => void;
  onUnlockBadge?: (badgeName: string) => void;
}

type EDLStage = 'ENTRY' | 'PARACHUTE' | 'SKYCRANE' | 'TOUCHDOWN' | 'CRASHED';

export const MarsEDLArcadeModal: React.FC<MarsEDLArcadeModalProps> = ({
  isOpen,
  onClose,
  onAddXp,
  onUnlockBadge,
}) => {
  const [stage, setStage] = useState<EDLStage>('ENTRY');
  const [altitudeKm, setAltitudeKm] = useState<number>(35);
  const [velocityMach, setVelocityMach] = useState<number>(20.4);
  const [heatShieldTempC, setHeatShieldTempC] = useState<number>(1480);
  const [dynamicPressureQ, setDynamicPressureQ] = useState<number>(4.2);
  const [tiltAngle, setTiltAngle] = useState<number>(0); // -15 to +15 deg
  const [capcomCallout, setCapcomCallout] = useState<string>(
    'Houston to Cadet: Hypersonic atmospheric entry interface confirmed. Balance the heat shield angle!'
  );
  const [telemetryDebrief, setTelemetryDebrief] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Play voice helper
  const speakCapCom = (text: string) => {
    setCapcomCallout(text);
    if (isVoiceActive) {
      speechEngine.speak(text, 'HOUSTON_CAPCOM');
    }
  };

  const handleStartMission = () => {
    setStage('ENTRY');
    setAltitudeKm(35);
    setVelocityMach(20.4);
    setHeatShieldTempC(1480);
    setDynamicPressureQ(4.2);
    setTiltAngle(0);
    setTelemetryDebrief(null);
    soundFx.playPowerUp();
    speakCapCom('Atmospheric entry at Mach 20! Keep heat shield tilt within 5 degrees to survive plasma shock!');
  };

  useEffect(() => {
    if (isOpen) {
      handleStartMission();
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
  }, [isOpen]);

  // Main Physics Simulation Loop
  useEffect(() => {
    if (!isOpen || stage === 'TOUCHDOWN' || stage === 'CRASHED') return;

    let alt = altitudeKm;
    let mach = velocityMach;
    let temp = heatShieldTempC;
    let q = dynamicPressureQ;
    let angle = tiltAngle;

    const interval = setInterval(() => {
      if (stage === 'ENTRY') {
        // Hypersonic descent
        alt -= 0.35;
        mach = Math.max(1.6, mach - 0.28);
        q = Math.min(16, q + 0.18);
        
        // Temperature depends on angle stability
        const angleStress = Math.abs(angle) * 35;
        temp = Math.round(1450 + angleStress);

        if (Math.abs(angle) > 12) {
          // Heat shield burned through
          setStage('CRASHED');
          soundFx.playExplosion();
          setTelemetryDebrief(
            'CRITICAL THERMAL FAILURE: Heat shield tilt exceeded 12°. Hypersonic plasma (1600°C) breached the aeroshell. NASA science: Entry angle must remain within a narrow 4° corridor!'
          );
          speakCapCom('Telemetry loss! Aeroshell breached due to excessive entry angle. Aborting descent.');
          clearInterval(interval);
          return;
        }

        if (alt <= 11) {
          // Ready for parachute stage
          alt = 11;
          speakCapCom('Dynamic pressure window reached! FIRE SUPERSONIC PARACHUTE MORTAR NOW!');
        }
      } else if (stage === 'PARACHUTE') {
        alt -= 0.18;
        mach = Math.max(0.2, mach - 0.15);
        temp = Math.max(80, temp - 60);

        if (alt <= 2.0) {
          alt = 2.0;
          speakCapCom('Radar altimeter locked on Jezero Crater! IGNITE SKY CRANE RETRO ROCKETS!');
        }
      } else if (stage === 'SKYCRANE') {
        alt = Math.max(0, alt - 0.04);
        mach = 0.05;

        if (alt <= 0.05) {
          alt = 0;
          setStage('TOUCHDOWN');
          soundFx.playVictory();
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          speakCapCom('Touchdown confirmed! Perseverance is safe on the surface of Mars! Outstanding piloting, Cadet!');
          onAddXp(200);
          if (onUnlockBadge) onUnlockBadge('Sky Crane Engineer');
          clearInterval(interval);
          return;
        }
      }

      setAltitudeKm(Math.max(0, parseFloat(alt.toFixed(1))));
      setVelocityMach(parseFloat(mach.toFixed(1)));
      setHeatShieldTempC(Math.round(temp));
      setDynamicPressureQ(parseFloat(q.toFixed(1)));
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, stage, tiltAngle]);

  // Canvas visual rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;

      // 1. Sky Gradient (Mars Ochre / Red Atmosphere)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (stage === 'ENTRY') {
        grad.addColorStop(0, '#1c0502');
        grad.addColorStop(0.5, '#451a03');
        grad.addColorStop(1, '#78350f');
      } else if (stage === 'PARACHUTE') {
        grad.addColorStop(0, '#451a03');
        grad.addColorStop(0.7, '#7c2d12');
        grad.addColorStop(1, '#9a3412');
      } else {
        grad.addColorStop(0, '#7c2d12');
        grad.addColorStop(0.8, '#b45309');
        grad.addColorStop(1, '#c2410c');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Mars Jezero Crater Surface (Bottom)
      const groundY = h - 60;
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 30) {
        const ny = groundY + Math.sin((x + frame * 0.5) * 0.02) * 8;
        ctx.lineTo(x, ny);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // 3. Spacecraft Animation based on Stage
      const craftY = stage === 'TOUCHDOWN' ? groundY - 24 : Math.min(groundY - 30, 80 + (35 - altitudeKm) * 6);

      ctx.save();
      ctx.translate(cx, craftY);
      ctx.rotate((tiltAngle * Math.PI) / 180);

      if (stage === 'ENTRY') {
        // Hypersonic Shockwave Glow
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 20, 48 + Math.sin(frame * 0.5) * 6, Math.PI, 0, false);
        ctx.fill();

        // Aeroshell Capsule
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-28, 14);
        ctx.lineTo(28, 14);
        ctx.lineTo(16, -18);
        ctx.lineTo(-16, -18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Heat Shield Glow Edge
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 14, 28, 0, Math.PI);
        ctx.stroke();
      } else if (stage === 'PARACHUTE') {
        // Supersonic Chute Canopy
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-40, -90);
        ctx.moveTo(18, 0);
        ctx.lineTo(40, -90);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -95);
        ctx.stroke();

        // Striped Orange/White Canopy
        ctx.fillStyle = frame % 20 < 10 ? '#ea580c' : '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -95, 45, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Capsule Body
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, 0, 36, 28);
      } else if (stage === 'SKYCRANE' || stage === 'TOUCHDOWN') {
        // Sky Crane Platform
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-35, -40, 70, 16);

        // 8 Retro Rocket Thruster Flames
        if (stage === 'SKYCRANE') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(-32, -24);
          ctx.lineTo(-24, -24);
          ctx.lineTo(-28, -24 + 18 + Math.random() * 8);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(24, -24);
          ctx.lineTo(32, -24);
          ctx.lineTo(28, -24 + 18 + Math.random() * 8);
          ctx.fill();

          // Nylon Lowering Tethers
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-15, -24);
          ctx.lineTo(-12, 10);
          ctx.moveTo(15, -24);
          ctx.lineTo(12, 10);
          ctx.stroke();
        }

        // Perseverance Rover Body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-22, 10, 44, 20);
        ctx.fillStyle = '#1e293b';
        // 6 Wheels
        ctx.fillRect(-24, 26, 8, 8);
        ctx.fillRect(-6, 26, 8, 8);
        ctx.fillRect(16, 26, 8, 8);
        // Mastcam
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(8, 0, 6, 10);
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isOpen, stage, altitudeKm, tiltAngle]);

  if (!isOpen) return null;

  // Tactical stage transition actions
  const handleDeployChute = () => {
    if (stage !== 'ENTRY') return;
    if (altitudeKm > 14) {
      // Deployed too early at hypersonic velocity -> chute shredded!
      setStage('CRASHED');
      soundFx.playExplosion();
      setTelemetryDebrief(
        'CHUTE DESTROYED: Parachute mortar fired at Mach 14. Aerodynamic dynamic pressure (Q) exceeded 30 kPa, shredding the Kevlar canopy. NASA rule: Wait until decelerated to Mach 1.8 below 12 km!'
      );
      speakCapCom('Telemetry error! Parachute ripped apart by hypersonic wind! We lost the vehicle.');
      return;
    }
    soundFx.playPowerUp();
    setStage('PARACHUTE');
    speakCapCom('Mortar fired! Supersonic parachute successfully deployed at Mach 1.8. Decelerating through thin CO2 air.');
  };

  const handleIgniteSkyCrane = () => {
    if (stage !== 'PARACHUTE') return;
    if (altitudeKm > 4.0) {
      speakCapCom('Altitude too high! Wait until radar altimeter reads below 3 km.');
      return;
    }
    soundFx.playThruster();
    setStage('SKYCRANE');
    speakCapCom('Sky Crane powered descent initiated! 8 hydrazine retro-rockets firing. Lowering Perseverance on nylon tethers!');
  };

  const handleCutTether = () => {
    if (stage !== 'SKYCRANE') return;
    if (altitudeKm > 0.8) {
      setStage('CRASHED');
      soundFx.playExplosion();
      setTelemetryDebrief(
        'ROVER HARD IMPACT: Tether severed at 800m altitude! Perseverance hit Jezero Crater at 45 m/s. NASA procedure: Winch rover down to surface contact before pyrotechnic blade cut!'
      );
      speakCapCom('Disaster! Rover dropped from high altitude. Struts collapsed.');
      return;
    }
    soundFx.playVictory();
    setStage('TOUCHDOWN');
    confetti({ particleCount: 200, spread: 100 });
    onAddXp(200);
    if (onUnlockBadge) onUnlockBadge('Sky Crane Engineer');
    speakCapCom('Pyrotechnic blade cut confirmed! Sky Crane flyaway maneuver initiated. Rover is safely on Martian soil!');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="cockpit-panel-amber rounded-3xl max-w-4xl w-full relative overflow-hidden shadow-2xl border-2 border-red-500/50 space-y-4 p-5 md:p-8 my-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🔴</span>
            <div>
              <div className="text-[10px] font-arcade text-amber-400 tracking-wider">NASA MARS 2020 PERSEVERANCE MISSION</div>
              <h3 className="font-space font-black text-xl md:text-2xl text-white">MARS 7 MINUTES OF TERROR: EDL ARCADE</h3>
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

        {/* Live Simulation Visual Viewport */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-red-500/30 h-64 md:h-80 bg-black">
          <canvas ref={canvasRef} width={800} height={320} className="w-full h-full object-cover" />

          {/* Cockpit Scan Beam */}
          <div className="scan-beam"></div>

          {/* Telemetry HUD Overlay (Top Left) */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-sky-500/30 font-mono-code text-xs space-y-1">
            <div className="flex justify-between gap-4 text-slate-300">
              <span>ALTITUDE:</span>
              <strong className="text-amber-400 font-bold">{altitudeKm} km</strong>
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>SPEED:</span>
              <strong className="text-sky-400 font-bold">Mach {velocityMach}</strong>
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>HEAT SHIELD:</span>
              <strong className={heatShieldTempC > 1500 ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'}>
                {heatShieldTempC}°C
              </strong>
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>STAGE:</span>
              <strong className="text-purple-300 font-bold">{stage}</strong>
            </div>
          </div>

          {/* Stage Progress Bar (Top Right) */}
          <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-amber-500/30 text-right">
            <div className="text-[10px] text-slate-400 font-mono-code">AUTONOMOUS MISSION CLOCK</div>
            <div className="text-amber-400 font-arcade text-sm">
              {stage === 'ENTRY' ? 'PHASE 1: AERO-BRAKE' : stage === 'PARACHUTE' ? 'PHASE 2: CHUTE' : stage === 'SKYCRANE' ? 'PHASE 3: SKY CRANE' : stage}
            </div>
          </div>

          {/* Touchdown Victory Banner */}
          {stage === 'TOUCHDOWN' && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="text-5xl animate-bounce">🎉</div>
              <h2 className="font-arcade text-2xl md:text-3xl text-emerald-400">TOUCHDOWN AT JEZERO CRATER!</h2>
              <p className="text-xs md:text-sm text-slate-200 max-w-md">
                Incredible flight work! You navigated thin Martian atmospheric heating, timed the supersonic chute deployment, and gently winched Perseverance onto the ancient river delta!
              </p>
              <div className="bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full font-bold text-xs border border-emerald-400/40">
                🏅 Unlocked Badge: Sky Crane Engineer (+200 XP)
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-arcade-emerald px-8 py-3 rounded-xl font-arcade text-xs mt-2"
              >
                PROCEED TO MISSION CONTROL ▶
              </button>
            </div>
          )}

          {/* Crash / Failure As Data Debrief Modal */}
          {stage === 'CRASHED' && (
            <div className="absolute inset-0 bg-red-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="text-4xl animate-bounce">⚠️</div>
              <h3 className="font-space font-black text-xl text-red-400">HOUSTON FLIGHT TELEMETRY DEBRIEF</h3>
              <p className="text-xs text-slate-200 max-w-lg bg-slate-900/90 p-4 rounded-xl border border-red-500/40 text-left font-mono-code leading-relaxed">
                {telemetryDebrief || 'Atmospheric telemetry lost. NASA engineering rule: Failure is data! Analyze parameters and try again.'}
              </p>
              <button
                type="button"
                onClick={handleStartMission}
                className="btn-arcade-gold px-8 py-3 rounded-xl font-arcade text-xs"
              >
                RE-ATTEMPT ENTRY &amp; LANDING 🔄
              </button>
            </div>
          )}
        </div>

        {/* Houston CapCom Radio Feed */}
        <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-sky-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎙️</span>
            <div>
              <span className="text-[10px] font-mono-code font-bold text-sky-400 uppercase tracking-wider block">
                NASA JPL CAPCOM RADIO (VOICE SYNTHESIS ACTIVE)
              </span>
              <p className="text-slate-200 font-medium">{capcomCallout}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className="px-2.5 py-1 rounded bg-slate-800 text-[10px] font-mono-code text-slate-400 hover:text-white"
          >
            {isVoiceActive ? 'MUTE VOICE 🔊' : 'UNMUTE 🔇'}
          </button>
        </div>

        {/* Tactical Stage Actions & Controls */}
        <div className="space-y-3">
          {stage === 'ENTRY' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white">Heat Shield Tilt Angle: {tiltAngle}°</div>
                <div className="text-[11px] text-slate-400">Balance angle within ±5° to prevent hypersonic plasma burn-through!</div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick(600);
                      setTiltAngle((prev) => Math.max(-15, prev - 3));
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                  >
                    ◀ Tilt Left (-3°)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick(600);
                      setTiltAngle(0);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs"
                  >
                    Center (0°)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick(600);
                      setTiltAngle((prev) => Math.min(15, prev + 3));
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                  >
                    Tilt Right (+3°) ▶
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeployChute}
                disabled={altitudeKm > 14}
                className={`px-8 py-5 rounded-2xl font-arcade text-sm transition-all ${
                  altitudeKm <= 13
                    ? 'btn-arcade-gold animate-bounce'
                    : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {altitudeKm <= 13 ? '💥 FIRE PARACHUTE MORTAR!' : `LOCKED (WAIT FOR < 13 KM: ${altitudeKm} KM)`}
              </button>
            </div>
          )}

          {stage === 'PARACHUTE' && (
            <div className="flex items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-sky-500/30">
              <div>
                <div className="text-xs font-bold text-white">Supersonic Chute Active: Decelerating through thin CO2 air</div>
                <div className="text-[11px] text-slate-400">Terrain-Relative Navigation (TRN) scanning Jezero Crater floor...</div>
              </div>
              <button
                type="button"
                onClick={handleIgniteSkyCrane}
                disabled={altitudeKm > 3.0}
                className={`px-8 py-5 rounded-2xl font-arcade text-sm ${
                  altitudeKm <= 3.0 ? 'btn-arcade-cyan animate-pulse' : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {altitudeKm <= 3.0 ? '🔥 IGNITE SKY CRANE RETRO ROCKETS!' : `WAITING RADAR LOCK (< 3 KM: ${altitudeKm} KM)`}
              </button>
            </div>
          )}

          {stage === 'SKYCRANE' && (
            <div className="flex items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30">
              <div>
                <div className="text-xs font-bold text-white">Sky Crane Hovering: 8 Hydrazine Thrusters Firing</div>
                <div className="text-[11px] text-slate-400">Nylon cords lowering Perseverance at 0.75 m/s... Cut when touchdown contact is made!</div>
              </div>
              <button
                type="button"
                onClick={handleCutTether}
                className="btn-arcade-emerald px-8 py-5 rounded-2xl font-arcade text-sm"
              >
                ✂️ PYROTECHNIC BLADE: CUT TETHER!
              </button>
            </div>
          )}
        </div>

        {/* Educational NASA Science Footer Note */}
        <div className="text-[11px] font-mono-code text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span>NASA Science: Speed-of-light radio delay to Mars is 14 minutes; this landing must be 100% autonomous.</span>
          <span className="text-amber-400 font-bold">+200 Space XP</span>
        </div>

      </div>
    </div>
  );
};

export default MarsEDLArcadeModal;

