// ============================================================
// MarsEDLSimulatorModal.tsx
// Inspired by NASA Mars 2020 EDL Simulator (eyes.nasa.gov/apps/mars2020)
// High-Fidelity 3D Simulation of the "7 Minutes of Terror"
// Built for NASA Space Apps Challenge 2026
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  X,
  Rocket,
  Shield,
  Radio,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Flame,
  Camera,
  Play,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface MarsEDLSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type EDLStage = 'ENTRY' | 'PARACHUTE' | 'HEATSHIELD_TRN' | 'SKYCRANE' | 'TOUCHDOWN' | 'CRASHED';

export const MarsEDLSimulatorModal: React.FC<MarsEDLSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<EDLStage>('ENTRY');
  const [altitudeKm, setAltitudeKm] = useState<number>(35);
  const [velocityKms, setVelocityKms] = useState<number>(5.4); // ~19,440 km/h
  const [heatShieldTempC, setHeatShieldTempC] = useState<number>(1350);
  const [throttle, setThrottle] = useState<number>(0.5);
  const [descentRateMs, setDescentRateMs] = useState<number>(140);
  const [trnSafeRating, setTrnSafeRating] = useState<number>(94);
  const [capcomCallout, setCapcomCallout] = useState<string>('ATMOSPHERIC ENTRY INTERFACE CONFIRMED · PLASMA SHEATH ACTIVE');

  const simRef = useRef({
    altitude: 35, // km
    velocity: 5.4, // km/s
    descentRate: 140, // m/s
    tempC: 1350,
    stage: 'ENTRY' as EDLStage,
    throttle: 0.5,
    keys: {} as Record<string, boolean>,
    lateralX: 0,
    lateralZ: 0,
    chuteDeployed: false,
    heatShieldSeparated: false,
    skycraneIgnited: false,
  });

  const resetSimulation = () => {
    simRef.current = {
      altitude: 35,
      velocity: 5.4,
      descentRate: 140,
      tempC: 1350,
      stage: 'ENTRY',
      throttle: 0.5,
      keys: {},
      lateralX: 0,
      lateralZ: 0,
      chuteDeployed: false,
      heatShieldSeparated: false,
      skycraneIgnited: false,
    };
    setStage('ENTRY');
    setAltitudeKm(35);
    setVelocityKms(5.4);
    setDescentRateMs(140);
    setHeatShieldTempC(1350);
    setCapcomCallout('ATMOSPHERIC ENTRY INTERFACE CONFIRMED · PLASMA SHEATH ACTIVE');
    soundFx.playReactorStart();
  };

  // Keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      simRef.current.keys[e.key.toLowerCase()] = true;
      simRef.current.keys[e.code] = true;

      // Quick action triggers
      if (e.code === 'Space') {
        e.preventDefault();
        triggerNextStageAction();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys[e.key.toLowerCase()] = false;
      simRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  // Next Stage Button
  const triggerNextStageAction = () => {
    const s = simRef.current;
    if (s.stage === 'ENTRY') {
      s.altitude = 11;
      s.stage = 'PARACHUTE';
      s.chuteDeployed = true;
      soundFx.playExplosion();
      setCapcomCallout('SUPERSONIC PARACHUTE MORTAR FIRED AT MACH 1.7 · DECELERATION CONFIRMED');
    } else if (s.stage === 'PARACHUTE') {
      s.altitude = 3.5;
      s.stage = 'HEATSHIELD_TRN';
      s.heatShieldSeparated = true;
      soundFx.playRadioChirp();
      setCapcomCallout('HEAT SHIELD JETTISONED · TERRAIN-RELATIVE NAVIGATION (TRN) LOCKED ON JEZERO CRATER');
    } else if (s.stage === 'HEATSHIELD_TRN') {
      s.altitude = 1.0;
      s.stage = 'SKYCRANE';
      s.skycraneIgnited = true;
      soundFx.playThruster();
      setCapcomCallout('SKY CRANE POWERED DESCENT · 8 RETRO ROCKETS IGNITED · LOWERING ROVER ON TETHER');
    } else if (s.stage === 'SKYCRANE') {
      // Soft touchdown
      s.altitude = 0.0;
      s.descentRate = 1.2;
      s.stage = 'TOUCHDOWN';
      soundFx.playVictory();
      confetti({ particleCount: 200, spread: 100 });
      setCapcomCallout('TOUCHDOWN CONFIRMED! PERSEVERANCE IS SAFE ON THE SURFACE OF MARS!');
      if (onSuccess) onSuccess();
    }
    setStage(s.stage);
  };

  // 3D Scene Setup & Loop
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 560;

    resetSimulation();

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0804);
    scene.fog = new THREE.FogExp2(0x9a3412, 0.0035);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 8, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.8);
    sunLight.position.set(60, 90, 60);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xc2410c, 0.7);
    scene.add(ambientLight);

    // 3. Mars Ground Plane & Crater Terrain
    const groundGeo = new THREE.PlaneGeometry(1000, 1000, 48, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    // Jezero Crater Rim Rocks
    for (let i = 0; i < 40; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(2 + Math.random() * 5);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 40) * Math.PI * 2;
      const r = 40 + Math.random() * 80;
      rock.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      scene.add(rock);
    }

    // 4. Spacecraft Hierarchy
    const landerGroup = new THREE.Group();
    landerGroup.position.set(0, 15, 0);
    scene.add(landerGroup);

    // Heat Shield (Bottom gold/ablative ceramic)
    const heatShieldGeo = new THREE.ConeGeometry(3.8, 1.3, 32);
    const heatShieldMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.8,
      emissive: 0xef4444,
      emissiveIntensity: 0.8,
    });
    const heatShield = new THREE.Mesh(heatShieldGeo, heatShieldMat);
    heatShield.rotation.x = Math.PI;
    heatShield.position.y = -1;
    landerGroup.add(heatShield);

    // Backshell
    const backshellGeo = new THREE.CylinderGeometry(0.8, 3.8, 3.2, 32);
    const backshellMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const backshell = new THREE.Mesh(backshellGeo, backshellMat);
    backshell.position.y = 1;
    landerGroup.add(backshell);

    // Rover chassis inside
    const roverGeo = new THREE.BoxGeometry(2.4, 1.0, 3.2);
    const roverMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.5, roughness: 0.3 });
    const rover = new THREE.Mesh(roverGeo, roverMat);
    rover.position.y = 0.5;
    landerGroup.add(rover);

    // Parachute Mesh
    const chuteGroup = new THREE.Group();
    const canopyGeo = new THREE.SphereGeometry(8, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      side: THREE.DoubleSide,
      roughness: 0.6,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 18;
    chuteGroup.add(canopy);

    const lineGeo = new THREE.CylinderGeometry(0.04, 3.8, 16, 8);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const lines = new THREE.Mesh(lineGeo, lineMat);
    lines.position.y = 9;
    chuteGroup.add(lines);

    chuteGroup.visible = false;
    landerGroup.add(chuteGroup);

    // Sky Crane Retro Engines Flames
    const engineGlowGeo = new THREE.ConeGeometry(0.6, 3.2, 16);
    const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const retroFlame1 = new THREE.Mesh(engineGlowGeo, engineGlowMat);
    retroFlame1.position.set(-1.4, -0.8, 0);
    const retroFlame2 = retroFlame1.clone();
    retroFlame2.position.set(1.4, -0.8, 0);
    retroFlame1.visible = false;
    retroFlame2.visible = false;
    landerGroup.add(retroFlame1);
    landerGroup.add(retroFlame2);

    // Plasma Fire Particle Halo
    const fireGeo = new THREE.TorusGeometry(4.2, 0.45, 16, 32);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const plasmaHalo = new THREE.Mesh(fireGeo, fireMat);
    plasmaHalo.rotation.x = Math.PI / 2;
    plasmaHalo.position.y = -1;
    landerGroup.add(plasmaHalo);

    // 5. Main Simulation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.1);
      const s = simRef.current;

      if (s.stage !== 'TOUCHDOWN' && s.stage !== 'CRASHED') {
        // Lateral steering
        if (s.keys['a'] || s.keys['arrowleft']) {
          s.lateralX = Math.max(-25, s.lateralX - 22 * dt);
          landerGroup.rotation.z = 0.15;
        } else if (s.keys['d'] || s.keys['arrowright']) {
          s.lateralX = Math.min(25, s.lateralX + 22 * dt);
          landerGroup.rotation.z = -0.15;
        } else {
          landerGroup.rotation.z *= 0.9;
        }

        landerGroup.position.x = s.lateralX;

        // Dynamic Stage Progression
        if (s.stage === 'ENTRY') {
          s.altitude -= 1.8 * dt; // Rapid, thrilling entry
          s.velocity = Math.max(1.8, s.velocity - 0.3 * dt);
          s.descentRate = 140;
          s.tempC = 1350 + Math.sin(Date.now() * 0.01) * 40;
          plasmaHalo.visible = true;
          chuteGroup.visible = false;

          if (s.altitude <= 11) {
            triggerNextStageAction();
          }
        } else if (s.stage === 'PARACHUTE') {
          plasmaHalo.visible = false;
          chuteGroup.visible = true;
          s.altitude -= 0.8 * dt;
          s.velocity = Math.max(0.18, s.velocity - 0.25 * dt);
          s.descentRate = 65;
          s.tempC = Math.max(120, s.tempC - dt * 250);

          if (s.altitude <= 3.5) {
            triggerNextStageAction();
          }
        } else if (s.stage === 'HEATSHIELD_TRN') {
          heatShield.visible = false;
          chuteGroup.visible = true;
          s.altitude -= 0.5 * dt;
          s.descentRate = 35;

          if (s.altitude <= 1.0) {
            triggerNextStageAction();
          }
        } else if (s.stage === 'SKYCRANE') {
          chuteGroup.visible = false;
          backshell.visible = false;
          retroFlame1.visible = true;
          retroFlame2.visible = true;

          // Throttle Control with W/S or touch buttons
          if (s.keys['w'] || s.keys['arrowup'] || s.keys['thrust_up']) {
            s.throttle = Math.min(1.0, s.throttle + dt * 2);
            s.descentRate = Math.max(0.8, s.descentRate - dt * 15);
          } else if (s.keys['s'] || s.keys['arrowdown'] || s.keys['thrust_down']) {
            s.throttle = Math.max(0.1, s.throttle - dt * 2);
            s.descentRate = Math.min(16, s.descentRate + dt * 10);
          } else {
            // Auto terminal guidance decelerates towards touchdown
            s.descentRate = Math.max(1.2, s.descentRate - dt * 8);
          }

          s.altitude = Math.max(0, s.altitude - s.descentRate * dt * 0.05);

          if (s.altitude <= 0.05) {
            if (s.descentRate <= 3.2 && Math.abs(s.lateralX) < 20) {
              s.stage = 'TOUCHDOWN';
              retroFlame1.visible = false;
              retroFlame2.visible = false;
              soundFx.playVictory();
              confetti({ particleCount: 220, spread: 110 });
              setCapcomCallout('TOUCHDOWN CONFIRMED! PERSEVERANCE IS SAFE ON THE SURFACE OF MARS!');
              if (onSuccess) onSuccess();
            } else {
              s.stage = 'CRASHED';
              soundFx.playAlarm();
              setCapcomCallout(`HARD LANDING: Descent rate ${s.descentRate.toFixed(1)} m/s exceeded sky-crane limit.`);
            }
          }
        }

        // Camera follow
        camera.position.set(landerGroup.position.x * 0.35, landerGroup.position.y + 7, 26);
        camera.lookAt(landerGroup.position);

        // Update state hooks
        setStage(s.stage);
        setAltitudeKm(Math.max(0, parseFloat(s.altitude.toFixed(1))));
        setVelocityKms(parseFloat(s.velocity.toFixed(2)));
        setDescentRateMs(parseFloat(s.descentRate.toFixed(1)));
        setHeatShieldTempC(Math.round(s.tempC));
        setThrottle(parseFloat(s.throttle.toFixed(2)));
      }

      renderer.render(scene, camera);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.92)',
      backdropFilter: 'blur(16px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        height: '92dvh',
        backgroundColor: 'var(--color-paper)',
        borderRadius: 0,
        border: '1px solid var(--rule-light)',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          borderBottom: '1px solid var(--rule-subtle)',
          background: 'var(--color-paper-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 0,
              background: 'var(--color-paper-3)',
              border: '1px solid var(--rule-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Flame size={18} style={{ color: 'var(--color-nasa-red)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.01em' }}>
                  NASA Mars 2020: 7 Minutes of Terror (EDL)
                </h2>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 0,
                  background: 'var(--color-paper-3)',
                  border: '1px solid var(--rule-subtle)',
                  color: 'var(--color-accent)',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {stage} PHASE
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>
                Perseverance Entry, Descent &amp; Landing Interactive Engineering Simulator
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={resetSimulation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 0,
                background: 'var(--color-paper-3)',
                border: '1px solid var(--rule-subtle)',
                color: 'var(--color-ink)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
              title="Restart EDL Sequence from Atmospheric Entry"
            >
              <RotateCcw size={13} />
              <span>Restart Entry</span>
            </button>

            <button
              onClick={() => { onClose(); soundFx.playClick(500); }}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: '1px solid var(--rule-subtle)',
                borderRadius: 0,
                padding: '6px',
                color: 'var(--color-ink-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 3D Scene Viewport */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

          {/* Telemetry HUD Top Left */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'var(--color-paper-2)',
            border: '1px solid var(--rule-subtle)',
            borderRadius: 0,
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            minWidth: '240px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
              <span>ALTITUDE:</span>
              <strong style={{ color: 'var(--color-accent-2)', fontVariantNumeric: 'tabular-nums' }}>{altitudeKm} km</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
              <span>ENTRY VELOCITY:</span>
              <strong style={{ color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>{velocityKms} km/s</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
              <span>DESCENT RATE:</span>
              <strong style={{ color: descentRateMs > 3.5 ? 'var(--color-error)' : 'var(--color-accent-green)', fontVariantNumeric: 'tabular-nums' }}>{descentRateMs} m/s</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
              <span>HEAT SHIELD TEMP:</span>
              <strong style={{ color: 'var(--color-error)', fontVariantNumeric: 'tabular-nums' }}>{heatShieldTempC}°C</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-ink-muted)' }}>
              <span>TRN TERRAIN SAFETY:</span>
              <strong style={{ color: 'var(--color-accent-green)', fontVariantNumeric: 'tabular-nums' }}>{trnSafeRating}% HAZARD-FREE</strong>
            </div>
          </div>

          {/* Action Trigger Button Top Right */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {stage === 'ENTRY' && (
              <button
                onClick={triggerNextStageAction}
                style={{
                  padding: '10px 18px',
                  borderRadius: 0,
                  background: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Deploy Supersonic Parachute [SPACE]
              </button>
            )}

            {stage === 'PARACHUTE' && (
              <button
                onClick={triggerNextStageAction}
                style={{
                  padding: '10px 18px',
                  borderRadius: 0,
                  background: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Jettison Heat Shield &amp; Activate TRN [SPACE]
              </button>
            )}

            {stage === 'HEATSHIELD_TRN' && (
              <button
                onClick={triggerNextStageAction}
                style={{
                  padding: '10px 18px',
                  borderRadius: 0,
                  background: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Ignite Sky Crane Retro Engines [SPACE]
              </button>
            )}

            {stage === 'SKYCRANE' && (
              <button
                onClick={triggerNextStageAction}
                style={{
                  padding: '10px 18px',
                  borderRadius: 0,
                  background: 'var(--color-accent-green)',
                  border: '1px solid var(--color-accent-green)',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Lower Tether &amp; Confirm Touchdown [SPACE]
              </button>
            )}
          </div>

          {/* Lateral Steering Touch Controls (Bottom Left) */}
          <div style={{
            position: 'absolute',
            bottom: '84px',
            left: '20px',
            display: 'flex',
            gap: '6px',
          }}>
            <button
              onMouseDown={() => (simRef.current.keys['arrowleft'] = true)}
              onMouseUp={() => (simRef.current.keys['arrowleft'] = false)}
              onTouchStart={() => (simRef.current.keys['arrowleft'] = true)}
              onTouchEnd={() => (simRef.current.keys['arrowleft'] = false)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 0,
                background: 'var(--color-paper-2)',
                border: '1px solid var(--rule-subtle)',
                color: 'var(--color-ink)',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ◀
            </button>
            <button
              onMouseDown={() => (simRef.current.keys['arrowright'] = true)}
              onMouseUp={() => (simRef.current.keys['arrowright'] = false)}
              onTouchStart={() => (simRef.current.keys['arrowright'] = true)}
              onTouchEnd={() => (simRef.current.keys['arrowright'] = false)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 0,
                background: 'var(--color-paper-2)',
                border: '1px solid var(--rule-subtle)',
                color: 'var(--color-ink)',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ▶
            </button>
          </div>

          {/* CapCom Transmission Box Bottom Center */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
            maxWidth: '820px',
            margin: '0 auto',
            background: 'var(--color-paper-2)',
            border: '1px solid var(--rule-subtle)',
            borderRadius: 0,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Radio size={16} style={{ color: 'var(--color-accent-2)' }} />
              <div>
                <span style={{ fontSize: '10px', color: 'var(--color-accent-2)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  NASA JPL CAPCOM LIVE TELEMETRY
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-ink)', fontWeight: 600 }}>
                  {capcomCallout}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-accent)' }}>
              <kbd style={{ background: 'var(--color-paper-3)', padding: '3px 6px', borderRadius: 0, color: 'var(--color-ink)', border: '1px solid var(--rule-subtle)' }}>A / D (◀ / ▶)</kbd>
              <span>Steer</span>
              <kbd style={{ background: 'var(--color-paper-3)', padding: '3px 6px', borderRadius: 0, color: 'var(--color-ink)', border: '1px solid var(--rule-subtle)' }}>SPACE</kbd>
              <span>Action</span>
            </div>
        </div>
      </div>
    </div>
  </div>
  );
};
