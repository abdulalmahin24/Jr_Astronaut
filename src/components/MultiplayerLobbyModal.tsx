// ============================================================
// MultiplayerLobbyModal.tsx
// NASA Mission Control Briefing & Multi-Crew Ready Room
// Designed for Jr_AstroCamp Multi-Station Co-Op Flight
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Play,
  Radio,
  Sparkles,
  Compass,
  Activity,
  Send,
  ExternalLink,
} from 'lucide-react';
import {
  multiplayerMissionService,
  CREW_ROLES,
  type CrewRole,
  type MultiplayerRoomState,
} from '../utils/multiplayerMissionService';
import { soundFx } from '../utils/audioEffects';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchMission: (missionId: string, role: CrewRole) => void;
  initialRoomCode?: string;
}

const FEATURED_COOP_MISSIONS = [
  {
    id: 'operation-shackleton',
    name: 'Operation Shackleton: Polar Cryo-Drill',
    type: 'rover',
    icon: '🧊',
    difficulty: 'Tier 1 (Extreme Cold 40 K)',
    summary: 'Extract pristine volatile water-ice from Shackleton Crater PSR within strict 45-min battery limits.',
    stemFocus: 'Cryogenic ISRU & VIPER Neutron Spectroscopy',
  },
  {
    id: 'operation-malapert',
    name: 'Operation Malapert: Solar Storm Crisis',
    type: 'lunar_landing',
    icon: '☀️',
    difficulty: 'Priority Alpha (High Risk)',
    summary: 'Deploy South Pole Optical Array and evacuate EVA crew to regolith shelter before Class X Solar Flare hits.',
    stemFocus: 'Coronal Mass Ejections & Hydrogen Radiation Shielding',
  },
  {
    id: 'operation-jezero',
    name: 'Operation Jezero: Biosignature Core Drill',
    type: 'rover',
    icon: '🔴',
    difficulty: 'Planetary Protection',
    summary: 'Perseverance-style sedimentary core sampling and hermetic containment during atmospheric dust gale.',
    stemFocus: 'Astrobiology, Raman Spectroscopy & MOXIE O2 Synthesis',
  },
  {
    id: 'operation-lava-tube',
    name: 'Operation Lava Tube: Subsurface Habitat',
    type: 'lunar_landing',
    icon: '🌋',
    difficulty: 'Tactical Subterranean',
    summary: 'Rappel into Marius Hills skylight, deploy comms relay, and assess natural basalt cave structural integrity.',
    stemFocus: 'LiDAR SLAM Mapping & Moonquake Structural Mechanics',
  },
  {
    id: 'operation-gateway',
    name: 'Operation Gateway: Orbital Hull Breach',
    type: 'docking',
    icon: '🛰️',
    difficulty: 'Extreme Orbital Ops',
    summary: 'Maneuver Canadarm3 and SAFER jetpack to seal a hypervelocity micrometeoroid puncture in Gateway HALO.',
    stemFocus: 'Near-Rectilinear Halo Orbits & Decompression Thermodynamics',
  },
  {
    id: 'artemis-2',
    name: 'Artemis II — Trans-Lunar SLS Ascent',
    type: 'launch',
    icon: '🚀',
    difficulty: 'Commander (Advanced)',
    summary: '4-Crew Orion spacecraft heavy launch via SLS Core Stage & ICPS into lunar free-return trajectory.',
    stemFocus: 'Gravity Turn Trajectory & Staging Kinetics',
  },
  {
    id: 'apollo-11',
    name: 'Apollo 11 — Eagle Lunar Module Touchdown',
    type: 'lunar_landing',
    icon: '🌕',
    difficulty: 'Tactical (High Precision)',
    summary: 'Commander & LM Pilot coordinate manual descent thrusters to avoid boulders in Mare Tranquillitatis.',
    stemFocus: 'Low-Gravity Inverted Vector Descent & Fuel Margins',
  },
  {
    id: 'gemini-8',
    name: 'Gemini VIII / ISS — Proximity Rendezvous & Docking',
    type: 'docking',
    icon: '🛸',
    difficulty: 'Navigation Critical',
    summary: 'FDO & Pilot use 6-DOF RCS translation to align crosshairs and dock with the target adapter.',
    stemFocus: 'Clohessy-Wiltshire Relative Velocity Physics',
  },
];

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
  onLaunchMission,
  initialRoomCode,
}) => {
  const [room, setRoom] = useState<MultiplayerRoomState | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<CrewRole>('CDR');
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const localId = multiplayerMissionService.getLocalPlayerId();

  const lastStatusRef = useRef<string>('lobby');

  // Subscribe to multiplayer service
  useEffect(() => {
    const unsubscribe = multiplayerMissionService.subscribe((updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom) {
        const localP = updatedRoom.players.find((p) => p.id === localId);
        if (localP) {
          setSelectedRole(localP.role);
        }
        if (updatedRoom.status === 'countdown') {
          setIsCountingDown(true);
        } else if (updatedRoom.status === 'in_mission') {
          if (isOpen && (isCountingDown || lastStatusRef.current === 'countdown')) {
            setIsCountingDown(false);
            const currentP = updatedRoom.players.find((p) => p.id === localId);
            onLaunchMission(updatedRoom.missionId, currentP ? currentP.role : 'CDR');
          }
        } else if (updatedRoom.status === 'lobby') {
          setIsCountingDown(false);
        }
        lastStatusRef.current = updatedRoom.status;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [localId, onLaunchMission, isOpen, isCountingDown]);

  // Initial auto-join or create room if open
  useEffect(() => {
    if (isOpen) {
      const existing = multiplayerMissionService.getCurrentRoom();
      if (!existing) {
        if (initialRoomCode) {
          multiplayerMissionService.joinRoom(initialRoomCode);
        } else {
          multiplayerMissionService.createRoom('artemis-2');
        }
      }
    }
  }, [isOpen, initialRoomCode]);

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => {
        soundFx.playRadioChirp();
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      soundFx.playVictory();
      multiplayerMissionService.launchMission();
    }
    return () => clearTimeout(timer);
  }, [isCountingDown, countdown]);

  if (!isOpen) return null;

  const currentLocalPlayer = room?.players.find((p) => p.id === localId);
  const isHost = currentLocalPlayer?.isHost ?? false;

  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    soundFx.playClick(900);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenSecondWindow = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.roomId}`;
    window.open(url, '_blank', 'width=1100,height=750');
    soundFx.playClick(1000);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    multiplayerMissionService.joinRoom(inputRoomCode.trim());
    setInputRoomCode('');
    soundFx.playClick(850);
  };

  const handleRoleSelect = (role: CrewRole) => {
    multiplayerMissionService.selectRole(role);
    setSelectedRole(role);
    soundFx.playClick(950);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    multiplayerMissionService.sendChat(chatInput);
    setChatInput('');
    soundFx.playRadioChirp();
  };

  const handleQuickRadioCallout = (callout: string) => {
    multiplayerMissionService.sendChat(callout);
    soundFx.playRadioChirp();
  };

  const handleInitiateLaunch = () => {
    soundFx.playRadioChirp();
    setCountdown(2);
    setIsCountingDown(true);
    multiplayerMissionService.startLaunchCountdown();
  };

  return (
    <div className="flight-modal-backdrop" onClick={onClose} style={{ zIndex: 12000 }}>
      <div
        className="flight-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1080px',
          maxHeight: '92vh',
          border: 'var(--rule-hair)',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-paper-2)',
          fontFamily: 'var(--font-space), -apple-system, sans-serif',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            background: 'var(--color-paper-2)',
            borderBottom: 'var(--rule-hair)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: 'var(--rule-hair)',
                background: 'var(--color-paper-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent-green)',
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '1px 6px',
                    background: 'var(--color-paper-3)',
                    color: 'var(--color-accent-green)',
                    border: 'var(--rule-hair)',
                  }}
                >
                  CO-OP FLIGHT DECK
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  Room: <strong style={{ color: 'var(--color-accent-green)' }}>{room?.roomId || 'STANDBY'}</strong>
                </span>
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', margin: '3px 0 0 0' }}>
                NASA Multi-Crew Mission Briefing Room
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Share Link */}
            <button
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: 0,
                background: 'var(--color-paper)',
                border: 'var(--rule-hair)',
                color: 'var(--color-ink)',
                cursor: 'pointer',
              }}
              title="Copy link to invite a copilot"
            >
              {copiedLink ? <Check size={14} style={{ color: 'var(--color-accent-green)' }} /> : <Copy size={14} />}
              <span>{copiedLink ? 'COPIED LINK' : 'SHARE LINK'}</span>
            </button>

            {/* Test 2nd Window */}
            <button
              onClick={handleOpenSecondWindow}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: 0,
                background: 'var(--color-paper-3)',
                border: 'var(--rule-hair)',
                color: 'var(--color-accent-green)',
                cursor: 'pointer',
              }}
              title="Open a 2nd player window to test co-op on this machine"
            >
              <ExternalLink size={14} />
              <span>TEST 2ND WINDOW</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 0,
                background: 'var(--color-paper)',
                border: 'var(--rule-hair)',
                color: 'var(--color-muted)',
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

        {/* Countdown Banner if Active */}
        {isCountingDown && (
          <div
            style={{
              background: 'var(--color-accent-amber)',
              padding: '10px 20px',
              textAlign: 'center',
              color: 'var(--color-paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.05em',
            }}
          >
            <Radio size={16} />
            <span>IGNITION SEQUENCE START / ALL STATIONS READY / T-MINUS {countdown} SECONDS</span>
            <button
              onClick={() => {
                soundFx.playVictory();
                multiplayerMissionService.launchMission();
              }}
              style={{
                marginLeft: '12px',
                padding: '3px 8px',
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                border: 'none',
                fontWeight: 800,
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              LAUNCH NOW 🚀
            </button>
          </div>
        )}

        {/* Main Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {/* LEFT SECTION: Mission Select & 4-Station Bridge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Mission Selection Card */}
            <div
              style={{
                padding: '14px',
                borderRadius: 0,
                background: 'var(--color-paper)',
                border: 'var(--rule-hair)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-green)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={14} /> Target Flight Mission
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  {isHost ? 'Host controls active flight' : 'Selected by Host'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {FEATURED_COOP_MISSIONS.map((m) => {
                  const isSelected = room?.missionId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (isHost) {
                          multiplayerMissionService.setMissionId(m.id);
                          soundFx.playClick(880);
                        }
                      }}
                      disabled={!isHost}
                      style={{
                        textAlign: 'left',
                        padding: '10px',
                        borderRadius: 0,
                        border: isSelected ? '1px solid var(--color-accent-green)' : 'var(--rule-hair)',
                        background: isSelected ? 'var(--color-paper-3)' : 'var(--color-paper-2)',
                        cursor: isHost ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>{m.icon}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)' }}>{m.name}</span>
                      </div>
                      <p style={{ fontSize: '10.5px', color: 'var(--color-muted)', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                        {m.summary}
                      </p>
                      <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-green)', background: 'var(--color-paper)', padding: '2px 6px', border: 'var(--rule-hair)', alignSelf: 'flex-start' }}>
                        {m.stemFocus}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Interactive 4-Station Crew Console */}
            <div
              style={{
                padding: '14px',
                borderRadius: 0,
                background: 'var(--color-paper)',
                border: 'var(--rule-hair)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} style={{ color: 'var(--color-accent-green)' }} /> Spacecraft Bridge Stations (Choose Seat)
                </span>
                
                {/* Couch Co-Op Split Screen Mode Toggle */}
                <button
                  onClick={() => {
                    multiplayerMissionService.setSplitScreen(!room?.isSplitScreen);
                    soundFx.playClick(1000);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    borderRadius: 0,
                    background: room?.isSplitScreen ? 'var(--color-accent-green)' : 'var(--color-paper-2)',
                    color: room?.isSplitScreen ? 'var(--color-paper)' : 'var(--color-ink)',
                    border: 'var(--rule-hair)',
                    cursor: 'pointer',
                  }}
                  title="2 Players on one screen & keyboard: P1 Pilot (WASD) + P2 Systems (Arrows/Keypad)"
                >
                  <span>⚡</span>
                  <span>COUCH CO-OP (SPLIT-SCREEN): {room?.isSplitScreen ? 'ON [2-PLAYER]' : 'OFF'}</span>
                </button>
              </div>

              {/* Split Screen Explanation if Active */}
              {room?.isSplitScreen && (
                <div
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'var(--color-paper-3)',
                    border: '1px solid var(--color-accent-green)',
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong>🎮 2-PLAYER LOCAL CO-OP READY:</strong> Left Pane = <strong>Commander (WASD + Space)</strong> · Right Pane = <strong>Systems Engineer (Arrow Keys + Keypad / Enter)</strong>
                  </div>
                  <span style={{ fontSize: '9.5px', color: 'var(--color-accent-green)', fontWeight: 700 }}>ZERO NETWORK LATENCY</span>
                </div>
              )}

              {/* Co-Op Diagnostics & Invariants Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'var(--color-paper-2)',
                  border: 'var(--rule-hair)',
                  marginBottom: '10px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-muted)',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <span>🌐 SYNC: <strong>P2P BROADCAST MESH</strong></span>
                <span>EPOCH: <strong>#{room?.epoch || 1}</strong></span>
                <span>DESYNC: <strong style={{ color: 'var(--color-accent-green)' }}>0.00% [LOCKED]</strong></span>
                <span>TICK: <strong>60 HZ</strong></span>
                <span style={{ color: 'var(--color-accent-green)', fontWeight: 700 }}>✓ 4 SUBSYSTEMS AUTHORITATIVE</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {(Object.keys(CREW_ROLES) as CrewRole[]).map((rKey) => {
                  const roleData = CREW_ROLES[rKey];
                  const assignedPlayer = room?.players.find((p) => p.role === rKey);
                  const isCurrentLocal = assignedPlayer?.id === localId;

                  return (
                    <div
                      key={rKey}
                      style={{
                        padding: '12px',
                        borderRadius: 0,
                        background: isCurrentLocal ? 'var(--color-paper-3)' : 'var(--color-paper-2)',
                        border: isCurrentLocal ? '1px solid var(--color-accent-green)' : 'var(--rule-hair)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{roleData.icon}</span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  background: 'var(--color-paper)',
                                  border: 'var(--rule-hair)',
                                  color: 'var(--color-accent-green)',
                                }}
                              >
                                {roleData.code}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)' }}>{roleData.title}</span>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--color-muted)', display: 'block', marginTop: '2px' }}>
                              {roleData.subsystem}
                            </span>
                          </div>
                        </div>

                        {!isCurrentLocal && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleRoleSelect(rKey)}
                              style={{
                                padding: '3px 8px',
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                borderRadius: 0,
                                background: 'var(--color-paper)',
                                border: 'var(--rule-hair)',
                                color: 'var(--color-ink)',
                                cursor: 'pointer',
                              }}
                            >
                              TAKE SEAT
                            </button>
                            <button
                              onClick={() => {
                                multiplayerMissionService.toggleSlotAi(rKey);
                                soundFx.playClick(900);
                              }}
                              style={{
                                padding: '3px 6px',
                                fontSize: '9px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                borderRadius: 0,
                                background: assignedPlayer?.isAi ? 'var(--color-paper-3)' : 'var(--color-paper)',
                                border: 'var(--rule-hair)',
                                color: assignedPlayer?.isAi ? 'var(--color-accent-green)' : 'var(--color-muted)',
                                cursor: 'pointer',
                              }}
                              title="Toggle between NASA Autonomous AI Copilot and Open Human Cadet slot"
                            >
                              {assignedPlayer?.isAi ? '🤖 BOT' : '👤 OPEN'}
                            </button>
                          </div>
                        )}
                        {isCurrentLocal && (
                          <span style={{ padding: '2px 6px', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, borderRadius: 0, background: 'var(--color-paper)', color: 'var(--color-accent-green)', border: '1px solid var(--color-accent-green)' }}>
                            YOUR SEAT
                          </span>
                        )}
                      </div>

                      {/* Operator info */}
                      <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: 'var(--rule-hair)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{assignedPlayer?.avatar || '🤖'}</span>
                          <span style={{ color: isCurrentLocal ? 'var(--color-accent-green)' : 'var(--color-muted)', fontWeight: 600 }}>
                            {assignedPlayer ? assignedPlayer.name : 'Autonomous Copilot AI'}
                          </span>
                        </div>
                        <span style={{ fontSize: '9.5px', fontWeight: 700, color: assignedPlayer?.isReady ? 'var(--color-accent-green)' : 'var(--color-accent-amber)' }}>
                          {assignedPlayer?.isReady ? '● GO' : '○ NO-GO'}
                        </span>
                      </div>

                      <div style={{ marginTop: '6px', fontSize: '9.5px', color: 'var(--color-muted)', background: 'var(--color-paper)', padding: '4px 6px', border: 'var(--rule-hair)' }}>
                        <strong style={{ color: 'var(--color-ink)' }}>Controls: </strong>
                        {roleData.controls.join(' / ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Launch Action Bar */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 0,
                background: 'var(--color-paper)',
                border: 'var(--rule-hair)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>MISSION READINESS</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-accent-green)' }} />
                  READY FOR T-0 COUNTDOWN
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => multiplayerMissionService.toggleReady()}
                  style={{
                    padding: '8px 14px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    borderRadius: 0,
                    background: 'var(--color-paper-2)',
                    border: 'var(--rule-hair)',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  {currentLocalPlayer?.isReady ? 'TOGGLE STANDBY' : 'REPORT GO'}
                </button>

                <button
                  onClick={handleInitiateLaunch}
                  disabled={isCountingDown}
                  style={{
                    padding: '10px 20px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    borderRadius: 0,
                    background: 'var(--color-accent-green)',
                    border: 'none',
                    color: 'var(--color-paper)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Play size={14} fill="currentColor" />
                  INITIATE CO-OP MISSION
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: Bridge Comms & Tactical Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Join by Room Code form */}
            <form
              onSubmit={handleJoinByCode}
              style={{
                padding: '10px',
                borderRadius: 0,
                background: 'var(--color-paper)',
                border: 'var(--rule-hair)',
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                type="text"
                placeholder="ENTER ROOM CODE (e.g. ARTEMIS-3)..."
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  background: 'var(--color-paper-2)',
                  border: 'var(--rule-hair)',
                  borderRadius: 0,
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-ink)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '6px 12px',
                  background: 'var(--color-paper-3)',
                  border: 'var(--rule-hair)',
                  color: 'var(--color-accent-green)',
                  borderRadius: 0,
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                JOIN
              </button>
            </form>

            {/* Tactical Comms Box */}
            <div
              style={{
                padding: '14px',
                borderRadius: 0,
                background: 'var(--color-paper)',
                border: 'var(--rule-hair)',
                height: '380px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: 'var(--rule-hair)' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-green)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Radio size={14} /> Bridge Comms &amp; Radio Audio
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
                  DSN 100% Locked
                </span>
              </div>

              {/* Chat messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '8px 0',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {room?.chat.map((msg) => {
                  return (
                    <div
                      key={msg.id}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 0,
                        background: msg.isSystem ? 'var(--color-paper-3)' : 'var(--color-paper-2)',
                        border: 'var(--rule-hair)',
                        lineHeight: 1.35,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span>{msg.avatar}</span>
                        <strong style={{ color: 'var(--color-accent-green)' }}>[{msg.role}] {msg.sender}</strong>
                        <span style={{ fontSize: '9px', color: 'var(--color-muted)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ paddingLeft: '20px', color: 'var(--color-muted)' }}>{msg.text}</div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Callout Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {['Go for Throttle Up', 'Guidance Nominal', 'Checking RCS Pressure', 'Target In Sight', 'Ready for Staging'].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => handleQuickRadioCallout(txt)}
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      padding: '3px 6px',
                      borderRadius: 0,
                      background: 'var(--color-paper-2)',
                      border: 'var(--rule-hair)',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="TRANSMIT RADIO CALLOUT..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--color-paper-2)',
                    border: 'var(--rule-hair)',
                    borderRadius: 0,
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '6px 12px',
                    background: 'var(--color-accent-green)',
                    border: 'none',
                    borderRadius: 0,
                    color: 'var(--color-paper)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
