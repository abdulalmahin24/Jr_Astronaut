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
        m.gameType === 'rover' || m.programName.includes('Mars'),
    },
    {
      id: 'commercial-artemis',
      title: 'Next Generation & Artemis Return',
      subtitle: 'Commercial Crew, Moon to Mars (2020–Present)',
      filter: (m: MissionGameConfig) =>
        m.programName.includes('Artemis') ||
        m.programName.includes('Commercial') ||
        parseInt(m.year) >= 2020,
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
              <span className="campaign-hero-tag">NASA HISTORICAL CAMPAIGN • 76 PLAYABLE MISSIONS</span>
              <span className="campaign-hero-pill">1961 — PRESENT</span>
            </div>
            <h2 className="campaign-hero-title">Earth to Deep Space Flight Simulator</h2>
            <p className="campaign-hero-desc">
              Experience the full trajectory of American space exploration with high-fidelity 3D WebGL physics,
              realistic ascent dynamics, orbital docking corridors, lunar touchdowns, and rover navigation.
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
                  <span className="campaign-progress-count">{completedMissions.length}</span>
                  <span className="campaign-progress-total">/ 76 COMPLETED</span>
                </div>
                <div className="campaign-progress-status">
                  {completionPct}% CAMPAIGN READINESS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="campaign-progress-bar-track">
          <div
            className="campaign-progress-bar-fill"
            style={{ width: `${Math.max(2, completionPct)}%` }}
          />
        </div>

        {/* Filter Controls & Search */}
        <div className="campaign-toolbar">
          <div className="campaign-filter-tabs">
            {[
              { id: 'all', label: 'All (76)' },
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
              placeholder="Search 76 missions by name, year, or program..."
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
              <div className="campaign-era-header">
                <span className="campaign-era-dot" />
                <h3 className="campaign-era-title">{era.title}</h3>
                <span className="campaign-era-sub">({era.subtitle})</span>
                <span className="campaign-era-count">{eraMissions.length} Missions</span>
              </div>

              <div className="campaign-grid">
                {eraMissions.map((mission) => {
                  const isDone = completedMissions.includes(mission.id);

                  return (
                    <div
                      key={mission.id}
                      className={`campaign-card ${isDone ? 'completed' : ''}`}
                    >
                      <div>
                        <div className="campaign-card-top">
                          <span className="campaign-type-pill">
                            {getGameTypeIcon(mission.gameType)}
                            <span>{mission.gameType.replace('_', ' ')}</span>
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '1px 5px', borderRadius: '4px' }}>
                              🎬 3D TRAILER
                            </span>
                            <span className="campaign-year-tag">
                              {mission.year}
                              {isDone && <CheckCircle2 size={13} color="#34d399" />}
                            </span>
                          </div>
                        </div>

                        <h4 className="campaign-card-title">{mission.missionName}</h4>
                        <p className="campaign-card-program">{mission.programName}</p>
                        <p className="campaign-card-desc">{mission.objective}</p>
                      </div>

                      <div className="campaign-card-bottom">
                        <div className="campaign-star-row" title={`Difficulty: ${mission.difficulty}/5`}>
                          {[...Array(5)].map((_, starIdx) => (
                            <Star
                              key={starIdx}
                              size={12}
                              fill={starIdx < mission.difficulty ? '#fbbf24' : 'none'}
                              color={starIdx < mission.difficulty ? '#fbbf24' : '#475569'}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => onLaunchMission(mission.id)}
                          className="campaign-play-btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                            border: '1px solid #38bdf8',
                            color: '#ffffff',
                          }}
                        >
                          <Play size={12} fill="currentColor" />
                          <span>{isDone ? '🎬 REPLAY TRAILER & 3D' : '🎬 LAUNCH (TRAILER ➔ 3D)'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
