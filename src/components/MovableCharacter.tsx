import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundFx } from '../utils/audioEffects';
import { ASTRONAUT_CHARACTERS } from '../data/astronautCharacters';
import type { User } from '../types/auth';

export interface MovableCharacterProps {
  currentUser?: User | null;
  mode?: 'ARENA' | 'FREE_ROAM';
  onModeChange?: (mode: 'ARENA' | 'FREE_ROAM') => void;
  onStartMission?: () => void;
  onOpenMultiplayerLobby?: () => void;
  onOpenRover?: () => void;
  onOpenAcademy?: () => void;
  onOpenOrrery?: () => void;
  onOpenComics?: () => void;
  onOpenCharacterLocker?: () => void;
  onOpenDepot?: () => void;
  initialVehicle?: 'ASTRONAUT' | 'ROVER';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface Footprint {
  id: number;
  x: number;
  y: number;
  angle: number;
  isRight: boolean;
  opacity: number;
}

interface Hotspot {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  color: string;
  action: () => void;
}

export const MovableCharacter: React.FC<MovableCharacterProps> = ({
  currentUser,
  mode: controlledMode,
  onModeChange,
  onStartMission,
  onOpenMultiplayerLobby,
  onOpenRover,
  onOpenAcademy,
  onOpenOrrery,
  onOpenComics,
  onOpenCharacterLocker,
  onOpenDepot,
  initialVehicle = 'ASTRONAUT',
}) => {
  const [internalMode, setInternalMode] = useState<'ARENA' | 'FREE_ROAM'>('ARENA');
  const activeMode = controlledMode || internalMode;

  const setMode = (newMode: 'ARENA' | 'FREE_ROAM') => {
    setInternalMode(newMode);
    if (onModeChange) onModeChange(newMode);
  };

  const [vehicle, setVehicle] = useState<'ASTRONAUT' | 'ROVER'>(initialVehicle);
  const [showControlsGuide, setShowControlsGuide] = useState(true);
  const [showDPad, setShowDPad] = useState(true);

  // Equipped astronaut data
  const charId = currentUser?.selectedCharacterId || 'neil_armstrong';
  const astronautData = ASTRONAUT_CHARACTERS.find((c) => c.id === charId) || ASTRONAUT_CHARACTERS[0];

  // Character Physics state
  const posRef = useRef({ x: 240, y: 190 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);
  const altitudeRef = useRef(0); // Jetpack jump altitude
  const vzRef = useRef(0);
  const facingRightRef = useRef(true);
  const walkPhaseRef = useRef(0);
  const rcsFuelRef = useRef(100);
  const lastStepTimeRef = useRef(0);
  const nextParticleIdRef = useRef(1);
  const nextFootprintIdRef = useRef(1);

  // Render state for React (updated at 30-60fps)
  const [pos, setPos] = useState({ x: 240, y: 190 });
  const [altitude, setAltitude] = useState(0);
  const [facingRight, setFacingRight] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);
  const [rcsFuel, setRcsFuel] = useState(100);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [activeNearbyHotspot, setActiveNearbyHotspot] = useState<Hotspot | null>(null);
  const [interactFeedback, setInteractFeedback] = useState<string | null>(null);

  // Key tracking
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const arenaContainerRef = useRef<HTMLDivElement>(null);

  // Hotspots on the lunar staging ground (coordinates relative to arena size 480x380)
  const hotspots: Hotspot[] = [
    {
      id: 'deploy',
      label: 'DEPLOY MISSION',
      icon: '🚀',
      x: 390,
      y: 190,
      color: '#f59e0b',
      action: () => {
        soundFx.playReactorStart();
        if (onStartMission) onStartMission();
      },
    },
    {
      id: 'coop',
      label: 'CO-OP BRIDGE',
      icon: '👥',
      x: 340,
      y: 85,
      color: '#10b981',
      action: () => {
        soundFx.playTelemetryChirp();
        if (onOpenMultiplayerLobby) onOpenMultiplayerLobby();
      },
    },
    {
      id: 'rover',
      label: 'ROVER EXPEDITION',
      icon: '🚜',
      x: 90,
      y: 85,
      color: '#f59e0b',
      action: () => {
        soundFx.playTelemetryChirp();
        if (onOpenRover) onOpenRover();
      },
    },
    {
      id: 'orrery',
      label: '3D SOLAR EYES',
      icon: '🪐',
      x: 90,
      y: 295,
      color: '#0284c7',
      action: () => {
        soundFx.playTelemetryChirp();
        if (onOpenOrrery) onOpenOrrery();
      },
    },
    {
      id: 'crew',
      label: 'CREW LOCKER',
      icon: '🧑‍🚀',
      x: 340,
      y: 295,
      color: '#e2e8f0',
      action: () => {
        soundFx.playTelemetryChirp();
        if (onOpenCharacterLocker) onOpenCharacterLocker();
        else if (onOpenAcademy) onOpenAcademy();
      },
    },
  ];

  // Jetpack jump action
  const triggerJetpack = useCallback(() => {
    if (rcsFuelRef.current > 15) {
      vzRef.current = 6.8;
      rcsFuelRef.current = Math.max(0, rcsFuelRef.current - 18);
      soundFx.playThruster();

      // Emit thruster burst particles
      const newP: Particle[] = [];
      for (let i = 0; i < 7; i++) {
        newP.push({
          id: nextParticleIdRef.current++,
          x: posRef.current.x + (Math.random() * 16 - 8),
          y: posRef.current.y + 10,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2,
          size: Math.random() * 4 + 3,
          opacity: 0.9,
          color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
        });
      }
      setParticles((prev) => [...prev.slice(-25), ...newP]);
    } else {
      soundFx.playClick(300);
    }
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;

      // Space -> Jetpack jump
      if (e.code === 'Space') {
        e.preventDefault();
        triggerJetpack();
      }

      // E / Enter -> Interact with nearby hotspot
      if (e.key.toLowerCase() === 'e' || e.key === 'Enter') {
        if (activeNearbyHotspot) {
          e.preventDefault();
          setInteractFeedback(`Activated: ${activeNearbyHotspot.label}`);
          setTimeout(() => setInteractFeedback(null), 2000);
          activeNearbyHotspot.action();
        }
      }

      // R -> Switch Vehicle
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setVehicle((v) => {
          const next = v === 'ASTRONAUT' ? 'ROVER' : 'ASTRONAUT';
          soundFx.playTelemetryChirp();
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerJetpack, activeNearbyHotspot]);

  // Handle click on arena/surface to walk to coordinate
  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    targetPosRef.current = { x: clickX, y: clickY };
    soundFx.playClick(1200, 0.03);
  };

  // Main physics loop (requestAnimationFrame)
  useEffect(() => {
    let animId: number;

    const bounds = activeMode === 'FREE_ROAM'
      ? { minX: 40, maxX: window.innerWidth - 40, minY: 80, maxY: window.innerHeight - 80 }
      : { minX: 35, maxX: 445, minY: 40, maxY: 345 };

    const updatePhysics = () => {
      const keys = keysRef.current;
      const isSprint = keys['shift'] || keys['shiftleft'] || keys['shiftright'];
      const baseSpeed = vehicle === 'ROVER' ? 4.8 : 3.4;
      const speed = isSprint ? baseSpeed * 1.6 : baseSpeed;

      let dx = 0;
      let dy = 0;

      // Keyboard input
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      // Mouse/Tap target navigation
      if (targetPosRef.current && dx === 0 && dy === 0) {
        const diffX = targetPosRef.current.x - posRef.current.x;
        const diffY = targetPosRef.current.y - posRef.current.y;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);

        if (dist > 8) {
          dx = diffX / dist;
          dy = diffY / dist;
        } else {
          targetPosRef.current = null;
        }
      }

      // Normalize diagonal
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // Acceleration & friction
      const accel = 0.45;
      const friction = 0.82;

      velRef.current.vx = velRef.current.vx * friction + dx * speed * accel;
      velRef.current.vy = velRef.current.vy * friction + dy * speed * accel;

      // Apply positions
      posRef.current.x += velRef.current.vx;
      posRef.current.y += velRef.current.vy;

      // Boundary clamp
      if (posRef.current.x < bounds.minX) {
        posRef.current.x = bounds.minX;
        velRef.current.vx = 0;
      }
      if (posRef.current.x > bounds.maxX) {
        posRef.current.x = bounds.maxX;
        velRef.current.vx = 0;
      }
      if (posRef.current.y < bounds.minY) {
        posRef.current.y = bounds.minY;
        velRef.current.vy = 0;
      }
      if (posRef.current.y > bounds.maxY) {
        posRef.current.y = bounds.maxY;
        velRef.current.vy = 0;
      }

      // Altitude physics (1/6th lunar gravity)
      if (altitudeRef.current > 0 || vzRef.current > 0) {
        vzRef.current -= 0.35; // Lunar gravity
        altitudeRef.current += vzRef.current;
        if (altitudeRef.current <= 0) {
          altitudeRef.current = 0;
          vzRef.current = 0;
        }
      }

      // Facing orientation
      if (velRef.current.vx > 0.25) facingRightRef.current = true;
      else if (velRef.current.vx < -0.25) facingRightRef.current = false;

      // Movement magnitude
      const currentSpeed = Math.sqrt(velRef.current.vx * velRef.current.vx + velRef.current.vy * velRef.current.vy);
      const moving = currentSpeed > 0.2;

      if (moving && altitudeRef.current === 0) {
        walkPhaseRef.current += currentSpeed * 0.16;

        // Periodic lunar footstep sound & decals
        const now = Date.now();
        if (now - lastStepTimeRef.current > 380) {
          lastStepTimeRef.current = now;
          if (vehicle === 'ASTRONAUT') {
            soundFx.playFootstep();
            // Drop regolith footprint
            const angle = Math.atan2(velRef.current.vy, velRef.current.vx);
            const isRightFoot = Math.sin(walkPhaseRef.current) > 0;
            const offsetDist = isRightFoot ? 7 : -7;
            const normX = -Math.sin(angle) * offsetDist;
            const normY = Math.cos(angle) * offsetDist;

            setFootprints((prev) => [
              ...prev.slice(-30),
              {
                id: nextFootprintIdRef.current++,
                x: posRef.current.x + normX,
                y: posRef.current.y + 16 + normY,
                angle,
                isRight: isRightFoot,
                opacity: 0.65,
              },
            ]);
          } else {
            // Rover tire dust
            const newDust: Particle[] = [
              {
                id: nextParticleIdRef.current++,
                x: posRef.current.x - (facingRightRef.current ? 22 : -22),
                y: posRef.current.y + 14,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 1.2,
                size: Math.random() * 3 + 2,
                opacity: 0.7,
                color: '#94a3b8',
              },
            ];
            setParticles((prev) => [...prev.slice(-25), ...newDust]);
          }
        }
      }

      // Passive RCS fuel recharge on ground
      if (altitudeRef.current === 0 && rcsFuelRef.current < 100) {
        rcsFuelRef.current = Math.min(100, rcsFuelRef.current + 0.35);
      }

      // Check nearby hotspot
      let nearest: Hotspot | null = null;
      let minDistance = 55; // Trigger distance in pixels
      if (activeMode === 'ARENA') {
        for (const spot of hotspots) {
          const dX = spot.x - posRef.current.x;
          const dY = spot.y - posRef.current.y;
          const dist = Math.sqrt(dX * dX + dY * dY);
          if (dist < minDistance) {
            nearest = spot;
            break;
          }
        }
      }

      // Sync to React state
      setPos({ x: posRef.current.x, y: posRef.current.y });
      setAltitude(altitudeRef.current);
      setFacingRight(facingRightRef.current);
      setIsMoving(moving);
      setWalkPhase(walkPhaseRef.current);
      setRcsFuel(Math.round(rcsFuelRef.current));
      setActiveNearbyHotspot(nearest);

      // Fade particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.035,
          }))
          .filter((p) => p.opacity > 0)
      );

      // Fade footprints slowly
      setFootprints((prev) =>
        prev
          .map((f) => ({ ...f, opacity: f.opacity - 0.001 }))
          .filter((f) => f.opacity > 0)
      );

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [activeMode, vehicle]);

  // Virtual D-pad command helper
  const handleVirtualDir = (dx: number, dy: number, active: boolean) => {
    if (active) {
      if (dx < 0) keysRef.current['a'] = true;
      if (dx > 0) keysRef.current['d'] = true;
      if (dy < 0) keysRef.current['w'] = true;
      if (dy > 0) keysRef.current['s'] = true;
    } else {
      if (dx < 0) keysRef.current['a'] = false;
      if (dx > 0) keysRef.current['d'] = false;
      if (dy < 0) keysRef.current['w'] = false;
      if (dy > 0) keysRef.current['s'] = false;
    }
  };

  // Reset position to center of arena
  const handleResetPos = () => {
    posRef.current = { x: 240, y: 190 };
    velRef.current = { vx: 0, vy: 0 };
    altitudeRef.current = 0;
    targetPosRef.current = null;
    soundFx.playClick(900);
  };

  return (
    <div
      ref={arenaContainerRef}
      id="movable-character-arena"
      style={{
        position: activeMode === 'FREE_ROAM' ? 'fixed' : 'relative',
        inset: activeMode === 'FREE_ROAM' ? 0 : 'auto',
        width: activeMode === 'FREE_ROAM' ? '100vw' : '100%',
        height: activeMode === 'FREE_ROAM' ? '100vh' : '390px',
        maxWidth: activeMode === 'FREE_ROAM' ? 'none' : '480px',
        margin: '0 auto',
        borderRadius: 0,
        clipPath: activeMode === 'FREE_ROAM' ? 'none' : 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
        background: activeMode === 'FREE_ROAM'
          ? 'transparent'
          : 'linear-gradient(180deg, #111622 0%, #0a0d14 100%)',
        border: activeMode === 'FREE_ROAM' ? 'none' : '1px solid rgba(0, 210, 255, 0.35)',
        boxShadow: activeMode === 'FREE_ROAM' ? 'none' : '0 12px 36px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(0, 210, 255, 0.05)',
        overflow: 'hidden',
        zIndex: activeMode === 'FREE_ROAM' ? 99999 : 6,
        userSelect: 'none',
        pointerEvents: activeMode === 'FREE_ROAM' ? 'none' : 'auto',
      }}
      onClick={activeMode === 'ARENA' ? handleArenaClick : undefined}
    >
      {/* Lunar Hangar Regolith Grid & Tactical Markings (Arena Mode only) */}
      {activeMode === 'ARENA' && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(2, 132, 199, 0.08) 0%, transparent 70%),
                linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 32px 32px, 32px 32px',
              pointerEvents: 'none',
            }}
          />

          {/* Central Holographic Staging Landing Ring */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              border: '1px dashed rgba(245, 158, 11, 0.3)',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.08)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              pointerEvents: 'none',
            }}
          />

          {/* Sector Crosshairs */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '12%',
              right: '12%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.2), transparent)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '12%',
              bottom: '12%',
              width: '1px',
              background: 'linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.2), transparent)',
              pointerEvents: 'none',
            }}
          />

          {/* Lunar Staging Trigger Hotspots on the Floor */}
          {hotspots.map((spot) => {
            const isNear = activeNearbyHotspot?.id === spot.id;
            return (
              <div
                key={spot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  spot.action();
                }}
                style={{
                  position: 'absolute',
                  left: `${spot.x}px`,
                  top: `${spot.y}px`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: 'all 0.2s ease',
                  zIndex: 2,
                }}
                title={`Click or walk here to ${spot.label}`}
              >
                {/* Holographic glowing ring */}
                <div
                  style={{
                    width: isNear ? '48px' : '40px',
                    height: isNear ? '48px' : '40px',
                    borderRadius: '50%',
                    background: isNear ? 'rgba(245, 158, 11, 0.22)' : 'rgba(15, 23, 42, 0.85)',
                    border: `1.5px solid ${isNear ? spot.color : 'rgba(148, 163, 184, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isNear ? '1.35rem' : '1.15rem',
                    boxShadow: isNear ? `0 0 16px ${spot.color}` : '0 2px 8px rgba(0,0,0,0.5)',
                    transform: isNear ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {spot.icon}
                </div>
                <span
                  style={{
                    marginTop: '4px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: isNear ? spot.color : '#94a3b8',
                    letterSpacing: '0.04em',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {spot.label}
                </span>
              </div>
            );
          })}
        </>
      )}

      {/* Regolith Footprint Decals on Floor */}
      {footprints.map((f) => (
        <div
          key={f.id}
          style={{
            position: 'absolute',
            left: `${f.x}px`,
            top: `${f.y}px`,
            width: '6px',
            height: '10px',
            borderRadius: '3px 3px 2px 2px',
            background: 'rgba(148, 163, 184, 0.35)',
            transform: `translate(-50%, -50%) rotate(${f.angle}rad)`,
            opacity: f.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* RCS Thruster & Dust Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 6px ${p.color}`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── THE MOVABLE CHARACTER ACTOR (ASTRONAUT / ROVER) ── */}
      <div
        style={{
          position: 'absolute',
          left: `${pos.x}px`,
          top: `${pos.y - altitude}px`,
          transform: `translate(-50%, -50%) scaleX(${facingRight ? 1 : -1})`,
          transition: 'transform 0.12s ease-out',
          zIndex: 10,
          pointerEvents: 'none',
          filter: altitude > 0 ? 'drop-shadow(0 20px 24px rgba(0,0,0,0.8))' : 'none',
        }}
      >
        {/* Ground Contact Shadow (scales dynamically with altitude) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${altitude + 44}px`,
            transform: 'translateX(-50%)',
            width: `${Math.max(16, 46 - altitude * 0.45)}px`,
            height: `${Math.max(6, 14 - altitude * 0.15)}px`,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.65)',
            filter: 'blur(3px)',
            opacity: Math.max(0.18, 0.7 - altitude * 0.015),
            pointerEvents: 'none',
          }}
        />

        {/* Character Visual SVG */}
        {vehicle === 'ASTRONAUT' ? (
          /* ── DETAILED REALISTIC NASA xEMU ASTRONAUT ── */
          <svg
            width="64"
            height="76"
            viewBox="0 0 64 76"
            style={{
              overflow: 'visible',
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.7))',
            }}
          >
            <defs>
              {/* Visor 24K Gold Mirror Reflection Gradient */}
              <linearGradient id="visorGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#f59e0b" />
                <stop offset="85%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>

              {/* Visor Curved Glare */}
              <linearGradient id="visorGlare" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              {/* White Suit Multi-Layer Shadow */}
              <linearGradient id="suitWhite" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="40%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>

              {/* Backpack Metal */}
              <linearGradient id="backpackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            {/* PLSS Oxygen Life Support Backpack */}
            <rect x="14" y="22" width="12" height="30" rx="3" fill="url(#backpackGrad)" stroke="#64748b" strokeWidth="1" />
            <rect x="17" y="26" width="6" height="5" rx="1" fill="#0284c7" />

            {/* RCS Thruster Nozzle on Backpack Top */}
            <path d="M17 22 L20 18 L23 22 Z" fill="#94a3b8" />
            {altitude > 0 && (
              <circle cx="20" cy="16" r="3.5" fill="#38bdf8" opacity="0.9" />
            )}

            {/* Legs (Animated with sinusoidal walk cycle) */}
            <g
              transform={`translate(0, ${isMoving && altitude === 0 ? Math.sin(walkPhase * 2) * 1.5 : 0})`}
            >
              {/* Left Leg */}
              <rect
                x="24"
                y="48"
                width="7"
                height="19"
                rx="3.5"
                fill="url(#suitWhite)"
                stroke="#94a3b8"
                strokeWidth="0.8"
                transform={`rotate(${isMoving && altitude === 0 ? Math.sin(walkPhase) * 18 : 0}, 27, 48)`}
              />
              {/* Left Boot */}
              <rect
                x="22"
                y="64"
                width="10"
                height="6"
                rx="2"
                fill="#334155"
                stroke="#64748b"
                strokeWidth="0.8"
                transform={`rotate(${isMoving && altitude === 0 ? Math.sin(walkPhase) * 18 : 0}, 27, 48)`}
              />

              {/* Right Leg */}
              <rect
                x="33"
                y="48"
                width="7"
                height="19"
                rx="3.5"
                fill="url(#suitWhite)"
                stroke="#94a3b8"
                strokeWidth="0.8"
                transform={`rotate(${isMoving && altitude === 0 ? -Math.sin(walkPhase) * 18 : 0}, 36, 48)`}
              />
              {/* Right Boot */}
              <rect
                x="32"
                y="64"
                width="10"
                height="6"
                rx="2"
                fill="#334155"
                stroke="#64748b"
                strokeWidth="0.8"
                transform={`rotate(${isMoving && altitude === 0 ? -Math.sin(walkPhase) * 18 : 0}, 36, 48)`}
              />
            </g>

            {/* Torso / Hard Upper Torso (HUT) */}
            <rect x="22" y="24" width="20" height="26" rx="5" fill="url(#suitWhite)" stroke="#94a3b8" strokeWidth="1" />

            {/* Chest Display and Control Module (DCM) */}
            <rect x="25" y="29" width="14" height="12" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
            <circle cx="28" cy="33" r="1.5" fill="#10b981" />
            <circle cx="32" cy="33" r="1.5" fill="#f59e0b" />
            <rect x="27" y="37" width="10" height="2" rx="0.5" fill="#38bdf8" />

            {/* NASA Meatball Badge Patch */}
            <circle cx="39" cy="28" r="2.2" fill="#1d4ed8" />
            <path d="M37 28 Q39 27 41 28" stroke="#ef4444" strokeWidth="0.8" fill="none" />

            {/* Arms */}
            {/* Left Arm */}
            <rect
              x="18"
              y="26"
              width="6"
              height="18"
              rx="3"
              fill="url(#suitWhite)"
              stroke="#94a3b8"
              strokeWidth="0.8"
              transform={`rotate(${isMoving && altitude === 0 ? -Math.sin(walkPhase) * 20 : 0}, 21, 26)`}
            />
            {/* Right Arm */}
            <rect
              x="40"
              y="26"
              width="6"
              height="18"
              rx="3"
              fill="url(#suitWhite)"
              stroke="#94a3b8"
              strokeWidth="0.8"
              transform={`rotate(${isMoving && altitude === 0 ? Math.sin(walkPhase) * 20 : 0}, 43, 26)`}
            />

            {/* Extravehicular Helmet Dome */}
            <circle cx="32" cy="15" r="13" fill="url(#suitWhite)" stroke="#cbd5e1" strokeWidth="1" />

            {/* Gold Reflective Bubble Visor */}
            <ellipse cx="33" cy="15" rx="9" ry="8" fill="url(#visorGold)" stroke="#b45309" strokeWidth="0.8" />

            {/* Visor Specular Reflection Curve */}
            <path d="M26 12 Q33 9 39 12 Q38 15 27 15 Z" fill="url(#visorGlare)" />
          </svg>
        ) : (
          /* ── DETAILED REALISTIC ARTEMIS LUNAR ROVER ── */
          <svg
            width="82"
            height="56"
            viewBox="0 0 82 56"
            style={{
              overflow: 'visible',
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.8))',
            }}
          >
            <defs>
              <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Headlight Cones (casting forward on lunar ground) */}
            <polygon
              points="68,30 115,18 115,48"
              fill="rgba(254, 240, 138, 0.18)"
              style={{ pointerEvents: 'none' }}
            />

            {/* Main Rover Chassis Frame */}
            <rect x="14" y="24" width="54" height="15" rx="3" fill="url(#chassisGrad)" stroke="#64748b" strokeWidth="1.2" />

            {/* High-Gain Parabolic Comms Antenna */}
            <path d="M22 24 L22 10" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M16 10 Q22 6 28 10" stroke="#f59e0b" strokeWidth="2" fill="none" />
            <circle cx="22" cy="7" r="1.5" fill="#f59e0b" />

            {/* Equipment Cargo & Life Support Pods */}
            <rect x="25" y="16" width="16" height="8" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="0.8" />
            <rect x="43" y="14" width="12" height="10" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />

            {/* Roll Cage Bars */}
            <path d="M38 24 L44 12 L58 12 L62 24" stroke="#94a3b8" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Astronaut Driver in Rover Seat */}
            <circle cx="50" cy="18" r="4.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="51" cy="18" rx="3" ry="2.6" fill="url(#visorGold)" />

            {/* Dual LED Headlights */}
            <circle cx="68" cy="28" r="2.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.8" />
            <circle cx="68" cy="34" r="2.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.8" />

            {/* 4 Titanium Wire-Mesh Airless Wheels */}
            {/* Rear Wheels */}
            <g transform={`rotate(${walkPhase * 40}, 20, 39)`}>
              <circle cx="20" cy="39" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="2.2" strokeDasharray="3,2" />
              <circle cx="20" cy="39" r="3" fill="#64748b" />
              <line x1="20" y1="30" x2="20" y2="48" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="11" y1="39" x2="29" y2="39" stroke="#cbd5e1" strokeWidth="1" />
            </g>

            {/* Front Wheels */}
            <g transform={`rotate(${walkPhase * 40}, 62, 39)`}>
              <circle cx="62" cy="39" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="2.2" strokeDasharray="3,2" />
              <circle cx="62" cy="39" r="3" fill="#64748b" />
              <line x1="62" y1="30" x2="62" y2="48" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="53" y1="39" x2="71" y2="39" stroke="#cbd5e1" strokeWidth="1" />
            </g>
          </svg>
        )}

        {/* Real-time Callsign & Status Pill above Character */}
        <div
          style={{
            position: 'absolute',
            bottom: '76px',
            left: '50%',
            transform: `translateX(-50%) scaleX(${facingRight ? 1 : -1})`, // keep text unmirrored
            background: 'rgba(11, 16, 24, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '12px',
            padding: '2px 8px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: '10px' }}>{astronautData.countryFlag}</span>
          <span
            style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '0.03em',
            }}
          >
            {currentUser?.username ? `@${currentUser.username}` : astronautData.name.toUpperCase()}
          </span>
          {altitude > 0 && (
            <span
              style={{
                fontSize: '8px',
                background: 'rgba(2, 132, 199, 0.25)',
                color: '#38bdf8',
                padding: '0 4px',
                borderRadius: '3px',
                fontWeight: 900,
              }}
            >
              RCS HOVER
            </span>
          )}
        </div>

        {/* Contextual Hotspot Proximity Prompt Pill */}
        {activeNearbyHotspot && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              activeNearbyHotspot.action();
            }}
            style={{
              position: 'absolute',
              bottom: '102px',
              left: '50%',
              transform: `translateX(-50%) scaleX(${facingRight ? 1 : -1})`,
              background: 'linear-gradient(180deg, #d97706 0%, #b45309 100%)',
              border: '1px solid #fef08a',
              borderRadius: '6px',
              padding: '4px 10px',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.7)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'dialogueFadeIn 0.2s ease-out',
            }}
          >
            <span style={{ fontSize: '12px' }}>{activeNearbyHotspot.icon}</span>
            <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-space)' }}>
              PRESS [E] OR TAP: {activeNearbyHotspot.label}
            </span>
          </div>
        )}
      </div>

      {/* Interaction Feedback Toast */}
      {interactFeedback && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {interactFeedback}
        </div>
      )}

      {/* ── TOP HUD BAR (TELEMETRY & CONTROLS) ── */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '10px',
          right: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
          pointerEvents: 'auto',
        }}
      >
        {/* Left: Astronaut Telemetry Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              background: 'rgba(11, 16, 24, 0.92)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>EVA: {vehicle === 'ASTRONAUT' ? 'SPACESUIT' : 'ARTEMIS ROVER'}</span>
          </div>

          <div
            style={{
              background: 'rgba(11, 16, 24, 0.92)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: rcsFuel > 30 ? '#38bdf8' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Jetpack Cold-Gas RCS Thruster Propellant"
          >
            <span>RCS: {rcsFuel}%</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Switch Vehicle Mode (Astronaut <-> Rover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVehicle((v) => (v === 'ASTRONAUT' ? 'ROVER' : 'ASTRONAUT'));
              soundFx.playClick(850);
            }}
            style={{
              background: vehicle === 'ROVER' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.85)',
              border: vehicle === 'ROVER' ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: vehicle === 'ROVER' ? '#fcd34d' : '#cbd5e1',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Switch between EVA Spacesuit (on foot) and Artemis Rover vehicle"
          >
            <span>{vehicle === 'ASTRONAUT' ? '🚜 DRIVE ROVER' : '🧑‍🚀 ON FOOT'}</span>
          </button>

          {/* Arena vs Free Roam Screen Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMode(activeMode === 'ARENA' ? 'FREE_ROAM' : 'ARENA');
              soundFx.playTelemetryChirp();
            }}
            style={{
              background: activeMode === 'FREE_ROAM' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.85)',
              border: activeMode === 'FREE_ROAM' ? '1px solid #10b981' : '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: activeMode === 'FREE_ROAM' ? '#6ee7b7' : '#cbd5e1',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            title="Toggle between Hangar Stage and Full-Screen Free Roam"
          >
            {activeMode === 'ARENA' ? '🌐 ROAM SCREEN' : '🎯 RETURN STAGE'}
          </button>

          {/* Reset position button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetPos();
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '6px',
              padding: '4px 7px',
              color: '#94a3b8',
              fontSize: '10px',
              cursor: 'pointer',
            }}
            title="Reset character to center"
          >
            🎯
          </button>
        </div>
      </div>

      {/* ── BOTTOM ON-SCREEN CONTROLS & D-PAD (TOUCH / MOUSE FRIENDLY) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '10px',
          right: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {/* Left: Virtual D-Pad for Touch/Mouse */}
        {showDPad && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 28px)',
              gridTemplateRows: 'repeat(3, 28px)',
              gap: '3px',
              background: 'rgba(11, 16, 24, 0.85)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              pointerEvents: 'auto',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div />
            <button
              onMouseDown={() => handleVirtualDir(0, -1, true)}
              onMouseUp={() => handleVirtualDir(0, -1, false)}
              onTouchStart={() => handleVirtualDir(0, -1, true)}
              onTouchEnd={() => handleVirtualDir(0, -1, false)}
              style={dpadBtnStyle}
            >
              ▲
            </button>
            <div />
            <button
              onMouseDown={() => handleVirtualDir(-1, 0, true)}
              onMouseUp={() => handleVirtualDir(-1, 0, false)}
              onTouchStart={() => handleVirtualDir(-1, 0, true)}
              onTouchEnd={() => handleVirtualDir(-1, 0, false)}
              style={dpadBtnStyle}
            >
              ◄
            </button>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                color: '#64748b',
                fontFamily: 'var(--font-mono)',
              }}
            >
              MOVE
            </div>
            <button
              onMouseDown={() => handleVirtualDir(1, 0, true)}
              onMouseUp={() => handleVirtualDir(1, 0, false)}
              onTouchStart={() => handleVirtualDir(1, 0, true)}
              onTouchEnd={() => handleVirtualDir(1, 0, false)}
              style={dpadBtnStyle}
            >
              ►
            </button>
            <div />
            <button
              onMouseDown={() => handleVirtualDir(0, 1, true)}
              onMouseUp={() => handleVirtualDir(0, 1, false)}
              onTouchStart={() => handleVirtualDir(0, 1, true)}
              onTouchEnd={() => handleVirtualDir(0, 1, false)}
              style={dpadBtnStyle}
            >
              ▼
            </button>
            <div />
          </div>
        )}

        {/* Center: Controls Hint Bar */}
        {showControlsGuide && (
          <div
            style={{
              background: 'rgba(11, 16, 24, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              color: '#94a3b8',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'auto',
            }}
          >
            <span>⌨️ <strong>WASD / Arrows</strong>: Move</span>
            <span>•</span>
            <span><strong>Space</strong>: Jetpack</span>
            <span>•</span>
            <span><strong>E</strong>: Interact</span>
            <span>•</span>
            <span><strong>Click Floor</strong>: Walk</span>
          </div>
        )}

        {/* Right: Quick Action Jetpack Trigger Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', pointerEvents: 'auto' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerJetpack();
            }}
            style={{
              background: 'linear-gradient(180deg, #ff9e1b 0%, #f59e0b 50%, #b45309 100%)',
              border: '1px solid #fed7aa',
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              padding: '7px 14px',
              color: '#07090e',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 10px rgba(255, 158, 27, 0.45)',
            }}
            title="Trigger Manned Maneuvering Unit (MMU) Jetpack Burst"
          >
            <span>🚀 JETPACK</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const dpadBtnStyle: React.CSSProperties = {
  background: '#161e2e',
  border: '1px solid rgba(0, 210, 255, 0.35)',
  clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
  color: '#e2e8f0',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  padding: 0,
};
