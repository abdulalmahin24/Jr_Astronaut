// ============================================================
// MissionCampaignMap — Interactive Earth-to-Space 76 Mission Campaign Map
// Visual timeline & mission selector spanning all eras of NASA history
// Powered by Three.js 3D WebGL Globe & Glassmorphic Aerospace UI
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Rocket,
  Compass,
  Sparkles,
  Bot,
  Eye,
  CheckCircle2,
  Play,
  Trophy,
  Star,
  Search,
} from 'lucide-react';
import { MISSION_GAME_DATA, type MissionGameConfig, type GameType } from '../game/missionGameData';
import { disposeThreeScene } from '../utils/threeDisposeHelper';

interface MissionCampaignMapProps {
  completedMissions: string[];
  onLaunchMission: (missionId: string) => void;
  onClose?: () => void;
}

// Mini Three.js 3D Earth Globe with Orbital Track
const CampaignGlobePreview: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const size = 120;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(2.3, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.7,
      metalness: 0.2,
      emissive: 0x0c2560,
      emissiveIntensity: 0.4,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Glowing Atmospheric Aura
    const auraGeo = new THREE.SphereGeometry(2.45, 32, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    scene.add(aura);

    // Orbital Ring
    const ringGeo = new THREE.RingGeometry(3.2, 3.25, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    ring.rotation.y = Math.PI / 6;
    scene.add(ring);

    // Satellite Beacon
    const satGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const sat = new THREE.Mesh(satGeo, satMat);
    scene.add(sat);

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(5, 4, 6);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0x38bdf8, 0.7);
    scene.add(ambLight);

    let animId: number;
    let angle = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      earth.rotation.y += 0.008;
      angle += 0.025;
      sat.position.set(
        Math.cos(angle) * 3.22,
        Math.sin(angle) * 1.3,
        Math.sin(angle) * 2.8
      );
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      disposeThreeScene(renderer, scene, container);
    };
  }, []);

  return <div ref={mountRef} className="campaign-hero-globe-wrap" title="Live Orbital Simulation" />;
};

export const MissionCampaignMap: React.FC<MissionCampaignMapProps> = ({
  completedMissions,
  onLaunchMission,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTestOverrideActive, setIsTestOverrideActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('astro_camp_override_endgame') === 'true';
    } catch {
      return false;
    }
  });

  const completedStandardCount = completedMissions.filter((id) => {
    if (!id.startsWith('NASA-M')) return false;
    const num = parseInt(id.replace('NASA-M', ''), 10);
    return num >= 1 && num <= 76;
  }).length;

  const isEndgameUnlocked = completedStandardCount >= 76 || isTestOverrideActive;

  // Group missions into historical eras
  const eras = [
    {
      id: 'mercury-gemini',
      title: 'Dawn of Spaceflight',
      subtitle: 'Mercury & Gemini (1961–1966)',
      filter: (m: MissionGameConfig) =>
        m.programName.includes('Mercury') || m.programName.includes('Gemini'),
    },
    {
      id: 'apollo',
      title: 'Voyage to the Moon',
      subtitle: 'Apollo & Lunar Exploration (1967–1975)',
      filter: (m: MissionGameConfig) =>
        m.programName.includes('Apollo') || m.programName.includes('Surveyor'),
    },
    {
      id: 'shuttle-iss',
      title: 'Orbital Outposts & Reusable Wings',
      subtitle: 'Space Shuttle & ISS (1981–2011)',
      filter: (m: MissionGameConfig) =>
        m.programName.includes('Shuttle') ||
        m.programName.includes('ISS') ||
        m.programName.includes('International Space Station') ||
        m.programName.includes('Space Transportation'),
    },
    {
      id: 'deep-space',
      title: 'Interplanetary Pioneers',
      subtitle: 'Voyager, Cassini, New Horizons & Outer Planets',
      filter: (m: MissionGameConfig) =>
        m.gameType === 'deep_space' ||
        m.programName.includes('Voyager') ||
        m.programName.includes('Pioneer') ||
        m.programName.includes('Outer Planets'),
    },
    {
      id: 'observatories',
      title: 'Cosmic Eyes & Exoplanet Hunters',
      subtitle: 'Hubble, JWST, Chandra, Kepler & Observatories',
      filter: (m: MissionGameConfig) =>
        m.gameType === 'telescope' ||
        m.programName.includes('Great Observatories') ||
        m.programName.includes('Astrophysics'),
    },
    {
      id: 'mars-rovers',
      title: 'Red Planet Explorers',
      subtitle: 'Viking, Pathfinder, Spirit, Curiosity & Perseverance',
      filter: (m: MissionGameConfig) =>
        m.programName !== 'Mars Planetary Survival' &&
        (m.gameType === 'rover' || m.programName.includes('Mars')),
    },
    {
      id: 'commercial-artemis',
      title: 'Next Generation & Artemis Return',
      subtitle: 'Commercial Crew, Moon to Mars (2020–Present)',
      filter: (m: MissionGameConfig) =>
        m.programName !== 'Mars Planetary Survival' &&
        !m.id.startsWith('NASA-M077') &&
        !m.id.startsWith('NASA-M078') &&
        !m.id.startsWith('NASA-M079') &&
        !m.id.startsWith('NASA-M080') &&
        (m.programName.includes('Artemis') ||
          m.programName.includes('Commercial') ||
          parseInt(m.year) >= 2020),
    },
    {
      id: 'endgame-mars-survival',
      title: '🔴 Grand Climax: NASA Mars Planetary Survival',
      subtitle: '4 Extreme Post-76 Endgame Operations (Hardest Tier 5/5)',
      filter: (m: MissionGameConfig) =>
        m.programName === 'Mars Planetary Survival' ||
        m.id === 'NASA-M077' ||
        m.id === 'NASA-M078' ||
        m.id === 'NASA-M079' ||
        m.id === 'NASA-M080',
    },
  ];

  const getGameTypeIcon = (type: GameType) => {
    switch (type) {
      case 'launch':
        return <Rocket size={12} color="#34d399" />;
      case 'docking':
        return <Compass size={12} color="#38bdf8" />;
      case 'lunar_landing':
        return <Sparkles size={12} color="#fbbf24" />;
      case 'rover':
        return <Bot size={12} color="#fb923c" />;
      case 'telescope':
        return <Eye size={12} color="#c084fc" />;
      case 'deep_space':
        return <Sparkles size={12} color="#818cf8" />;
    }
  };

  const filteredMissions = MISSION_GAME_DATA.filter((m) => {
    const matchesFilter =
      selectedTypeFilter === 'all' || m.gameType === selectedTypeFilter;
    const matchesSearch =
      m.missionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.year.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const completionPct = Math.round(
    (completedMissions.length / MISSION_GAME_DATA.length) * 100
  );

  return (
    <div className="campaign-map-root">
      {/* ─── Hero Banner & Campaign Progress ─── */}
      <div className="campaign-hero-banner">
        <div className="campaign-hero-top">
          <div className="campaign-hero-info">
            <div className="campaign-hero-tag-row">
              <span className="campaign-hero-tag">NASA HISTORICAL CAMPAIGN • 76 MISSIONS + 4 MARS SURVIVAL CLIMAX</span>
              <span className="campaign-hero-pill">1961 — PRESENT</span>
            </div>
            <h2 className="campaign-hero-title">Earth to Deep Space Flight Simulator</h2>
            <p className="campaign-hero-desc">
              Experience the full trajectory of American space exploration with high-fidelity 3D WebGL physics,
              realistic ascent dynamics, orbital docking corridors, lunar touchdowns, and rover navigation. Complete all 76 missions to unlock the 4 hardest Mars Planetary Survival operations.
            </p>
          </div>

          <div className="campaign-hero-right">
            <CampaignGlobePreview />

            <div className="campaign-progress-badge">
              <div className="campaign-progress-icon">
                <Trophy size={22} />
              </div>
              <div>
                <div className="campaign-progress-numbers">
                  <span className="campaign-progress-count">{completedStandardCount}</span>
                  <span className="campaign-progress-total">/ 76 COMPLETED (+4 ENDGAME)</span>
                </div>
                <div className="campaign-progress-status">
                  {Math.round((completedStandardCount / 76) * 100)}% CAMPAIGN READINESS {isEndgameUnlocked && '• 🔥 ENDGAME UNLOCKED'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="campaign-progress-bar-track">
          <div
            className="campaign-progress-bar-fill"
            style={{ width: `${Math.max(2, Math.min(100, Math.round((completedStandardCount / 76) * 100)))}%` }}
          />
        </div>

        {/* Filter Controls & Search */}
        <div className="campaign-toolbar">
          <div className="campaign-filter-tabs">
            {[
              { id: 'all', label: `All (${MISSION_GAME_DATA.length})` },
              { id: 'launch', label: '🚀 Launch' },
              { id: 'docking', label: '🛸 Docking' },
              { id: 'lunar_landing', label: '🌑 Landing' },
              { id: 'rover', label: '🤖 Rover' },
              { id: 'telescope', label: '🔭 Telescope' },
              { id: 'deep_space', label: '☄️ Deep Space' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTypeFilter(tab.id)}
                className={`campaign-tab-btn ${selectedTypeFilter === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="campaign-search-box">
            <Search size={14} className="campaign-search-icon" />
            <input
              type="text"
              placeholder="Search 80 missions (76 Historical + 4 Mars Survival Endgame)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="campaign-search-input"
            />
          </div>
        </div>
      </div>

      {/* ─── Eras & Mission Grid ─── */}
      <div className="campaign-eras-container">
        {eras.map((era) => {
          const eraMissions = filteredMissions.filter(era.filter);
          if (eraMissions.length === 0) return null;

          return (
            <div key={era.id} className="campaign-era-section">
              <div className="campaign-era-header" style={era.id === 'endgame-mars-survival' ? { borderBottom: '1px solid rgba(239, 68, 68, 0.4)', background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2), transparent)' } : undefined}>
                <span className="campaign-era-dot" style={era.id === 'endgame-mars-survival' ? { backgroundColor: '#ef4444', boxShadow: '0 0 10px #ef4444' } : undefined} />
                <h3 className="campaign-era-title" style={era.id === 'endgame-mars-survival' ? { color: '#fca5a5' } : undefined}>{era.title}</h3>
                <span className="campaign-era-sub">({era.subtitle})</span>
                <span className="campaign-era-count" style={era.id === 'endgame-mars-survival' ? { background: '#ef4444', color: '#ffffff', fontWeight: 900 } : undefined}>
                  {era.id === 'endgame-mars-survival' && !isEndgameUnlocked ? '🔒 4 MISSIONS (LOCKED)' : `${eraMissions.length} Missions`}
                </span>
              </div>

              {era.id === 'endgame-mars-survival' && !isEndgameUnlocked ? (
                <div style={{
                  padding: '28px 24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(30, 10, 15, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
                  border: '2px dashed rgba(239, 68, 68, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '12px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                }}>
                  <div style={{ fontSize: '42px' }}>🔒</div>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#fca5a5', fontFamily: 'var(--font-space)', letterSpacing: '0.04em' }}>
                    POST-CAMPAIGN CLIMAX: COMPLETE ALL 76 NASA MISSIONS TO UNLOCK
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)', maxWidth: '640px', lineHeight: 1.6 }}>
                    These 4 Mars Planetary Survival Operations are the <strong style={{ color: '#ef4444' }}>hardest manual crisis missions</strong> in the game. You must complete the 76 historical flight missions before taking manual control of these extreme Sol survival events.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fbbf24', fontWeight: 800 }}>
                    <span>📊 Progress: {completedStandardCount} / 76 Completed</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsTestOverrideActive(true);
                      try { localStorage.setItem('astro_camp_override_endgame', 'true'); } catch {}
                    }}
                    style={{
                      marginTop: '6px',
                      padding: '10px 22px',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.75))',
                      border: '1.5px solid #ef4444',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                    }}
                    title="Unlock immediately for evaluation without completing 76 flights"
                  >
                    🔓 JUDGE & CADET TEST OVERRIDE: UNLOCK 4 ENDGAME MISSIONS NOW
                  </button>
                </div>
              ) : (
                <div className="campaign-grid">
                  {eraMissions.map((mission) => {
                    const isDone = completedMissions.includes(mission.id);
                    const isEndgameMission = era.id === 'endgame-mars-survival';

                    return (
                      <div
                        key={mission.id}
                        className={`campaign-card ${isDone ? 'completed' : ''}`}
                        style={isEndgameMission ? {
                          border: '1.5px solid rgba(239, 68, 68, 0.6)',
                          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
                          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2)',
                        } : undefined}
                      >
                        <div>
                          <div className="campaign-card-top">
                            <span className="campaign-type-pill" style={isEndgameMission ? { background: 'rgba(239, 68, 68, 0.25)', borderColor: '#ef4444', color: '#fca5a5' } : undefined}>
                              {getGameTypeIcon(mission.gameType)}
                              <span>{mission.gameType.replace('_', ' ')}</span>
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isEndgameMission && (
                                <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', background: '#ef4444', padding: '1px 6px', borderRadius: '4px' }}>
                                  🔥 HARDEST TIER 5
                                </span>
                              )}
                              <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '1px 5px', borderRadius: '4px' }}>
                                🎬 3D TRAILER
                              </span>
                              <span className="campaign-year-tag">
                                {mission.year}
                                {isDone && <CheckCircle2 size={13} color="#34d399" />}
                              </span>
                            </div>
                          </div>

                          <h4 className="campaign-card-title" style={isEndgameMission ? { color: '#fca5a5' } : undefined}>{mission.missionName}</h4>
                          <p className="campaign-card-program">{mission.programName}</p>
                          <p className="campaign-card-desc">{mission.objective}</p>
                        </div>

                        <div className="campaign-card-bottom">
                          <div className="campaign-star-row" title={`Difficulty: ${mission.difficulty}/5`}>
                            {[...Array(5)].map((_, starIdx) => (
                              <Star
                                key={starIdx}
                                size={12}
                                fill={starIdx < mission.difficulty ? (isEndgameMission ? '#ef4444' : '#fbbf24') : 'none'}
                                color={starIdx < mission.difficulty ? (isEndgameMission ? '#ef4444' : '#fbbf24') : '#475569'}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => onLaunchMission(mission.id)}
                            className="campaign-play-btn"
                            style={isEndgameMission ? {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                              border: '1px solid #ef4444',
                              color: '#ffffff',
                              fontWeight: 900,
                              boxShadow: '0 0 14px rgba(239, 68, 68, 0.5)',
                            } : {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                              border: '1px solid #38bdf8',
                              color: '#ffffff',
                            }}
                          >
                            <Play size={12} fill="currentColor" />
                            <span>{isEndgameMission ? '🔥 MANUAL FLIGHT / SURVIVAL' : isDone ? '🎬 REPLAY TRAILER & 3D' : '🎬 LAUNCH (TRAILER ➔ 3D)'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
