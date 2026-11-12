import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe2,
  Radio,
  Activity,
  Gauge,
  Zap,
  Wind,
  Droplets,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Users,
  ExternalLink,
  RotateCcw,
  Compass,
  Flame,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface IssTelemetryData {
  latitude: number;
  longitude: number;
  velocity: number;
  altitude: number;
  visibility: string;
  footprint: number;
  solar_lat?: number;
  solar_lon?: number;
  timestamp: number;
}

export interface SpaceWeatherData {
  kp: number;
  timeTag: string;
  stormScale: string;
  protonFlux: string;
  status: 'QUIET' | 'UNSETTLED' | 'STORM';
}

export interface NasaMissionControlProps {
  issData: IssTelemetryData;
  spaceWeather: SpaceWeatherData;
  crewCount: number;
  isLive: boolean;
  onRefresh: () => void;
}

export type MissionControlView = 
  | 'GROUND_TRACK'
  | 'ECLSS_SCHEMATIC'
  | 'SPACE_WEATHER'
  | 'STRIP_CHARTS'
  | 'CREW_MANIFEST';

// World continent polygon approximations (lon, lat in degrees)
const CONTINENT_POLYGONS: [number, number][][] = [
  // North America
  [[-168, 65], [-160, 71], [-140, 70], [-125, 72], [-115, 69], [-95, 70], [-80, 62], [-65, 58], [-55, 50], [-60, 46], [-70, 42], [-75, 38], [-76, 35], [-81, 25], [-81, 30], [-89, 30], [-97, 26], [-97, 20], [-88, 16], [-83, 10], [-77, 8], [-80, 9], [-85, 14], [-96, 16], [-105, 23], [-115, 30], [-124, 38], [-124, 48], [-130, 54], [-145, 60], [-165, 60], [-168, 65]],
  // Greenland
  [[-45, 60], [-35, 66], [-20, 70], [-20, 78], [-35, 83], [-55, 82], [-60, 76], [-50, 68], [-45, 60]],
  // South America
  [[-77, 8], [-72, 12], [-60, 9], [-50, 1], [-35, -5], [-35, -10], [-40, -22], [-48, -28], [-53, -33], [-65, -42], [-65, -55], [-72, -55], [-75, -45], [-73, -30], [-80, -18], [-81, -5], [-77, 8]],
  // Europe
  [[-10, 36], [0, 43], [-4, 48], [2, 51], [8, 54], [10, 58], [20, 64], [28, 71], [40, 68], [55, 65], [60, 55], [45, 47], [35, 45], [28, 41], [23, 38], [15, 38], [10, 44], [0, 40], [-9, 38], [-10, 36]],
  // British Isles
  [[-10, 51], [-5, 58], [-2, 58], [1, 52], [-5, 50], [-10, 51]],
  // Africa
  [[-10, 36], [10, 37], [25, 32], [32, 31], [35, 28], [43, 12], [51, 10], [42, 0], [40, -10], [35, -24], [28, -33], [18, -34], [12, -20], [10, -5], [2, 5], [-15, 12], [-17, 21], [-13, 28], [-10, 36]],
  // Madagascar
  [[44, -12], [50, -15], [47, -25], [43, -25], [44, -12]],
  // Asia
  [[60, 55], [60, 68], [90, 74], [130, 73], [170, 67], [180, 65], [160, 55], [140, 50], [130, 42], [122, 38], [120, 32], [110, 20], [105, 10], [100, 5], [98, 15], [90, 22], [80, 15], [78, 8], [72, 20], [60, 25], [55, 27], [50, 30], [40, 38], [35, 42], [45, 47], [60, 55]],
  // Japan
  [[130, 32], [138, 35], [142, 40], [145, 44], [140, 42], [132, 33], [130, 32]],
  // Australia
  [[115, -22], [125, -15], [135, -12], [142, -10], [148, -20], [153, -28], [150, -36], [140, -38], [130, -32], [115, -34], [113, -25], [115, -22]],
  // Antarctica
  [[-180, -75], [-120, -72], [-65, -65], [-40, -75], [20, -70], [80, -67], [140, -66], [170, -72], [180, -75], [180, -88], [-180, -88], [-180, -75]]
];

// NASA Ground Tracking Stations & Deep Space Network (DSN)
const NASA_GROUND_STATIONS = [
  { id: 'MCC-H', name: 'Houston (MCC-H)', lat: 29.56, lon: -95.09, type: 'PRIMARY_MCC', role: 'Mission Control Center Houston' },
  { id: 'WSC', name: 'White Sands (WSC)', lat: 32.50, lon: -106.61, type: 'TDRS_RELAY', role: 'Tracking & Data Relay Satellite Ground Station' },
  { id: 'KSC', name: 'Kennedy (KSC)', lat: 28.57, lon: -80.65, type: 'LAUNCH_SITE', role: 'Launch Control & Recovery' },
  { id: 'GDS', name: 'Goldstone DSN', lat: 35.43, lon: -116.89, type: 'DSN', role: 'NASA Deep Space Communications Complex' },
  { id: 'MDS', name: 'Madrid DSN', lat: 40.43, lon: -4.25, type: 'DSN', role: 'NASA Deep Space Network (Spain)' },
  { id: 'CDS', name: 'Canberra DSN', lat: -35.40, lon: 148.98, type: 'DSN', role: 'NASA Deep Space Network (Australia)' },
  { id: 'SGS', name: 'Svalbard (SGS)', lat: 78.23, lon: 15.41, type: 'POLAR_LEO', role: 'Polar Orbit Satellite Ground Station' },
  { id: 'WFF', name: 'Wallops (WFF)', lat: 37.94, lon: -75.46, type: 'FLIGHT_FACILITY', role: 'NASA Sounding Rocket & Telemetry Facility' }
];

// Active In-Orbit Human Crew Roster (Expedition 72 & Shenzhou-19)
const ACTIVE_CREW_ROSTER = [
  { name: 'Suni Williams', agency: 'NASA', craft: 'ISS (Expedition 72)', role: 'Commander', country: '🇺🇸' },
  { name: 'Butch Wilmore', agency: 'NASA', craft: 'ISS (Expedition 72)', role: 'Flight Engineer', country: '🇺🇸' },
  { name: 'Nick Hague', agency: 'NASA', craft: 'ISS (Crew-9)', role: 'Flight Engineer', country: '🇺🇸' },
  { name: 'Aleksandr Gorbunov', agency: 'Roscosmos', craft: 'ISS (Crew-9)', role: 'Flight Engineer', country: '🇷🇺' },
  { name: 'Donald Pettit', agency: 'NASA', craft: 'ISS (Soyuz MS-26)', role: 'Science Officer', country: '🇺🇸' },
  { name: 'Alexey Ovchinin', agency: 'Roscosmos', craft: 'ISS (Soyuz MS-26)', role: 'Commander', country: '🇷🇺' },
  { name: 'Ivan Vagner', agency: 'Roscosmos', craft: 'ISS (Soyuz MS-26)', role: 'Flight Engineer', country: '🇷🇺' },
  { name: 'Cai Xuzhe', agency: 'CMSA', craft: 'Tiangong (Shenzhou-19)', role: 'Commander', country: '🇨🇳' },
  { name: 'Song Lingdong', agency: 'CMSA', craft: 'Tiangong (Shenzhou-19)', role: 'Pilot', country: '🇨🇳' },
  { name: 'Wang Haoze', agency: 'CMSA', craft: 'Tiangong (Shenzhou-19)', role: 'Payload Specialist', country: '🇨🇳' },
  { name: 'Zena Cardman', agency: 'NASA', craft: 'ISS Standby', role: 'Suborbital Support', country: '🇺🇸' },
  { name: 'Jonny Kim', agency: 'NASA', craft: 'ISS Standby', role: 'Medical Flight Surgeon', country: '🇺🇸' },
];

export const NasaMissionControlVisualizer: React.FC<NasaMissionControlProps> = ({
  issData,
  spaceWeather,
  crewCount,
  isLive,
  onRefresh,
}) => {
  const [activeView, setActiveView] = useState<MissionControlView>('GROUND_TRACK');
  const [selectedStation, setSelectedStation] = useState<typeof NASA_GROUND_STATIONS[0] | null>(NASA_GROUND_STATIONS[0]);
  const [gmtClock, setGmtClock] = useState<string>('');
  const [metClock, setMetClock] = useState<string>('');
  const [animTime, setAnimTime] = useState<number>(0);

  // Strip chart historical telemetry buffers
  const [historyVelocity, setHistoryVelocity] = useState<number[]>([27560, 27561, 27562, 27561, 27560]);
  const [historyAltitude, setHistoryAltitude] = useState<number[]>([424.0, 424.1, 424.2, 424.1, 424.0]);
  const [historyPressure, setHistoryPressure] = useState<number[]>([14.70, 14.71, 14.69, 14.70, 14.70]);

  // Canvas ref for strip charts
  const stripChartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update real-time GMT and MET clocks
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setGmtClock(now.toUTCString().slice(17, 25) + ' UTC');
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setMetClock(`MET +${now.getFullYear()}:${String(dayOfYear).padStart(3, '0')}:${hours}:${mins}:${secs}`);
      setAnimTime((t) => (t + 1) % 3600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Record incoming telemetry into strip chart buffer
  useEffect(() => {
    if (issData.velocity) {
      setHistoryVelocity(prev => [...prev.slice(-30), issData.velocity]);
      setHistoryAltitude(prev => [...prev.slice(-30), issData.altitude]);
      setHistoryPressure(prev => [...prev.slice(-30), 14.70 + (Math.sin(Date.now() / 3000) * 0.03)]);
    }
  }, [issData.velocity, issData.altitude]);

  // Coordinate projection helper: (lon, lat) => (x, y) on 1000x500 map
  const MAP_W = 1000;
  const MAP_H = 500;
  const projX = (lon: number) => ((lon + 180) / 360) * MAP_W;
  const projY = (lat: number) => ((90 - lat) / 180) * MAP_H;

  // Compute nearest NASA ground station to current ISS sub-satellite position
  const activeLinkStation = useMemo(() => {
    let nearest = NASA_GROUND_STATIONS[0];
    let minDistance = Infinity;
    NASA_GROUND_STATIONS.forEach(st => {
      const dLat = (st.lat - issData.latitude) * 111;
      const dLon = (st.lon - issData.longitude) * 111 * Math.cos((issData.latitude * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = st;
      }
    });
    return { station: nearest, distanceKm: Math.round(minDistance) };
  }, [issData.latitude, issData.longitude]);

  // Generate Keplerian orbital ground track path (sine wave at 51.64° inclination)
  const orbitPaths = useMemo(() => {
    const inclination = 51.64;
    const currentLon = issData.longitude;
    const currentLat = issData.latitude;

    // Phase offset so that the sine wave hits the exact current position
    // sin(lat / inc) = sin(lon + phase) => phase = asin(lat / inc) - lon
    const clampedRatio = Math.max(-1, Math.min(1, currentLat / inclination));
    const phaseDeg = (Math.asin(clampedRatio) * 180) / Math.PI - currentLon;

    const generateSinePoints = (lonStart: number, lonEnd: number, step: number) => {
      const pts: [number, number][] = [];
      for (let lon = lonStart; lon <= lonEnd; lon += step) {
        const rad = ((lon + phaseDeg) * Math.PI) / 180;
        const lat = inclination * Math.sin(rad);
        pts.push([projX(lon), projY(lat)]);
      }
      return pts;
    };

    // Past orbit (past 90 min = lon - 180 to currentLon)
    const pastPts = generateSinePoints(Math.max(-180, currentLon - 140), currentLon, 4);
    // Future orbit (next 90 min = currentLon to currentLon + 180)
    const futurePts = generateSinePoints(currentLon, Math.min(180, currentLon + 140), 4);

    const makeSvgPath = (pts: [number, number][]) => {
      if (pts.length === 0) return '';
      return pts.reduce((acc, p, idx) => (idx === 0 ? `M ${p[0]} ${p[1]}` : `${acc} L ${p[0]} ${p[1]}`), '');
    };

    return {
      pastPath: makeSvgPath(pastPts),
      futurePath: makeSvgPath(futurePts),
    };
  }, [issData.latitude, issData.longitude]);

  // Render Open MCT Oscilloscope Canvas Charts
  useEffect(() => {
    if (activeView !== 'STRIP_CHARTS' || !stripChartCanvasRef.current) return;
    const canvas = stripChartCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark grid background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Phosphor grid lines
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Velocity Chart (Top Half)
    const drawTrace = (data: number[], yOffset: number, chartH: number, color: string, label: string, unit: string) => {
      if (data.length < 2) return;
      const min = Math.min(...data) * 0.999;
      const max = Math.max(...data) * 1.001;
      const range = max - min || 1;

      // Label & Current Value
      ctx.fillStyle = color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${label}: ${data[data.length - 1].toLocaleString()} ${unit}`, 16, yOffset + 24);

      // Baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, yOffset + chartH / 2);
      ctx.lineTo(width, yOffset + chartH / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Data Trace
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const stepX = width / Math.max(data.length - 1, 1);
      data.forEach((val, i) => {
        const x = i * stepX;
        const normY = (val - min) / range;
        const y = yOffset + chartH - (normY * (chartH - 40) + 20);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawTrace(historyVelocity, 10, height / 3 - 20, '#00d2ff', 'ORBITAL VELOCITY (NORAD #25544)', 'km/h');
    drawTrace(historyAltitude, height / 3 + 10, height / 3 - 20, '#10b981', 'ORBITAL ALTITUDE (LEO WGS-84)', 'km');
    drawTrace(historyPressure, (2 * height) / 3 + 10, height / 3 - 20, '#facc15', 'CABIN ATMOSPHERIC PRESSURE (NASA BVAD)', 'psi');
  }, [activeView, historyVelocity, historyAltitude, historyPressure]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#040711',
        color: '#f8fafc',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 210, 255, 0.4)',
        boxShadow: '0 0 40px rgba(0, 210, 255, 0.15)',
        fontFamily: 'monospace, system-ui, sans-serif',
      }}
    >
      {/* ── TOP MISSION CONTROL CONSOLE HEADER ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, #091122 0%, #0d1b33 50%, #091122 100%)',
          borderBottom: '1px solid rgba(0, 210, 255, 0.3)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: Station Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.5)',
            }}
          >
            🛰️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.08em' }}>
                NASA MISSION CONTROL CENTER · FLIGHT OPERATIONS CONSOLE
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: isLive ? '#4ade80' : '#fef08a',
                  border: isLive ? '1px solid #10b981' : '1px solid #f59e0b',
                }}
              >
                {isLive ? '● LIVE TDRS DOWNLINK' : '● CACHED SIM'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '12px', marginTop: '2px' }}>
              <span>MCC: <strong style={{ color: '#38bdf8' }}>HOUSTON / JOHNSON SPACE CENTER</strong></span>
              <span>CRAFT: <strong style={{ color: '#4ade80' }}>ISS (NORAD #25544)</strong></span>
              <span>AOS LINK: <strong style={{ color: '#facc15' }}>{activeLinkStation.station.name} ({activeLinkStation.distanceKm} km)</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Master Flight Clocks & Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#00d2ff', letterSpacing: '0.05em' }}>
              ⏱️ {gmtClock || '17:20:00 UTC'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
              {metClock || 'MET +2026:310:17:20:00'}
            </div>
          </div>

          <button
            onClick={() => {
              onRefresh();
              soundFx.playTelemetryChirp();
            }}
            style={{
              background: 'rgba(0, 210, 255, 0.15)',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              borderRadius: '6px',
              color: '#00d2ff',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
            title="Force Real-time NASA Telemetry Sync"
          >
            <RotateCcw size={12} />
            <span>FORCE SYNC</span>
          </button>
        </div>
      </div>

      {/* ── NASA FLIGHT DIRECTOR VIEW SELECTOR TABS ── */}
      <div
        style={{
          background: '#070c18',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '6px 16px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'GROUND_TRACK' as const, icon: '🌍', label: 'ORBITAL GROUND TRACK', tag: 'CENTER SCREEN' },
          { id: 'ECLSS_SCHEMATIC' as const, icon: '🫁', label: 'ECLSS LIFE SUPPORT', tag: 'EECOM CONSOLE' },
          { id: 'SPACE_WEATHER' as const, icon: '☀️', label: 'SPACE WEATHER & KP', tag: 'SWPC RADAR' },
          { id: 'STRIP_CHARTS' as const, icon: '📈', label: 'TELEMETRY STRIP CHARTS', tag: 'OPEN MCT' },
          { id: 'CREW_MANIFEST' as const, icon: '🧑‍🚀', label: `CREW IN SPACE (${crewCount})`, tag: 'EXPEDITION 72' },
        ].map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveView(tab.id);
                soundFx.playClick(800);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(0, 210, 255, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)'
                  : 'rgba(15, 23, 42, 0.5)',
                border: isActive ? '1px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '8.5px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: isActive ? 'rgba(0, 210, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#38bdf8' : '#64748b',
                }}
              >
                {tab.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN VISUALIZER STAGE ── */}
      <div style={{ flex: 1, position: 'relative', overflowY: 'auto', padding: '16px', background: '#050914' }}>

        {/* ══════════════════════════════════════════════════════════════
            VIEW 1: NASA ORBITAL GROUND TRACK (CENTER SCREEN MAP)
            ══════════════════════════════════════════════════════════════ */}
        {activeView === 'GROUND_TRACK' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
            {/* Real World Map Ground Track Canvas/SVG Stage */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 210, 255, 0.35)',
                background: 'linear-gradient(180deg, #020611 0%, #060e20 100%)',
                boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 210, 255, 0.1)',
              }}
            >
              <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '520px' }}
              >
                <defs>
                  {/* Grid pattern */}
                  <pattern id="mccGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0, 210, 255, 0.08)" strokeWidth="0.75" />
                  </pattern>

                  {/* Pulsing beacon glow */}
                  <radialGradient id="issPulseGlow">
                    <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#00d2ff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
                  </radialGradient>

                  {/* Night Terminator Shadow Gradient */}
                  <linearGradient id="nightTerminator" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                    <stop offset="45%" stopColor="#000000" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#000000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Ocean Background */}
                <rect width={MAP_W} height={MAP_H} fill="#050e1f" />
                <rect width={MAP_W} height={MAP_H} fill="url(#mccGrid)" />

                {/* Continental Landmasses */}
                {CONTINENT_POLYGONS.map((poly, idx) => {
                  const pathStr = poly.reduce((acc, [lon, lat], i) => {
                    const x = projX(lon);
                    const y = projY(lat);
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '') + ' Z';
                  return (
                    <path
                      key={idx}
                      d={pathStr}
                      fill="#0c233c"
                      stroke="#00d2ff"
                      strokeWidth="1.2"
                      strokeOpacity="0.45"
                    />
                  );
                })}

                {/* Latitude & Longitude Reference Lines */}
                {/* Equator */}
                <line x1="0" y1={projY(0)} x2={MAP_W} y2={projY(0)} stroke="rgba(0, 210, 255, 0.25)" strokeDasharray="3 3" />
                <text x="8" y={projY(0) - 4} fill="rgba(0, 210, 255, 0.5)" fontSize="9" fontWeight="bold">EQUATOR 0°</text>

                {/* Tropic of Cancer (+23.5°) */}
                <line x1="0" y1={projY(23.5)} x2={MAP_W} y2={projY(23.5)} stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="2 4" />
                {/* Tropic of Capricorn (-23.5°) */}
                <line x1="0" y1={projY(-23.5)} x2={MAP_W} y2={projY(-23.5)} stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="2 4" />

                {/* ISS Orbital Ground Track Sine Waves */}
                {/* Past Track */}
                <path
                  d={orbitPaths.pastPath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeOpacity="0.4"
                  strokeDasharray="4 2"
                />

                {/* Future Track */}
                <path
                  d={orbitPaths.futurePath}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="2.2"
                  strokeOpacity="0.7"
                  strokeDasharray="6 3"
                />

                {/* NASA Ground Stations */}
                {NASA_GROUND_STATIONS.map((st) => {
                  const sx = projX(st.lon);
                  const sy = projY(st.lat);
                  const isSelected = selectedStation?.id === st.id;
                  const isLinked = activeLinkStation.station.id === st.id;

                  return (
                    <g
                      key={st.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedStation(st);
                        soundFx.playClick(900);
                      }}
                    >
                      {/* Station radio range circle */}
                      <circle
                        cx={sx}
                        cy={sy}
                        r="24"
                        fill="none"
                        stroke={isLinked ? '#10b981' : isSelected ? '#00d2ff' : 'rgba(255,255,255,0.1)'}
                        strokeWidth="1"
                        strokeDasharray={isLinked ? '2 2' : 'none'}
                        opacity={isLinked ? 0.8 : 0.4}
                      />
                      {/* Station center pin */}
                      <circle
                        cx={sx}
                        cy={sy}
                        r={isSelected || isLinked ? 4.5 : 3}
                        fill={isLinked ? '#10b981' : isSelected ? '#00d2ff' : '#f59e0b'}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />
                      {/* Station label */}
                      <text
                        x={sx + 6}
                        y={sy + 3}
                        fill={isLinked ? '#4ade80' : isSelected ? '#38bdf8' : '#94a3b8'}
                        fontSize="8.5"
                        fontWeight="900"
                        letterSpacing="0.05em"
                      >
                        {st.id}
                      </text>
                    </g>
                  );
                })}

                {/* Active Link Beam connecting ISS to Nearest Ground Station */}
                {(() => {
                  const ix = projX(issData.longitude);
                  const iy = projY(issData.latitude);
                  const sx = projX(activeLinkStation.station.lon);
                  const sy = projY(activeLinkStation.station.lat);

                  return (
                    <g>
                      <line
                        x1={ix}
                        y1={iy}
                        x2={sx}
                        y2={sy}
                        stroke="#10b981"
                        strokeWidth="1.8"
                        strokeDasharray="4 4"
                        opacity="0.8"
                      />
                      {/* Distance callout tag */}
                      <rect
                        x={(ix + sx) / 2 - 32}
                        y={(iy + sy) / 2 - 10}
                        width="64"
                        height="16"
                        rx="3"
                        fill="#06121e"
                        stroke="#10b981"
                        strokeWidth="1"
                      />
                      <text
                        x={(ix + sx) / 2}
                        y={(iy + sy) / 2 + 1}
                        fill="#4ade80"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {activeLinkStation.distanceKm} km AOS
                      </text>
                    </g>
                  );
                })()}

                {/* ── CURRENT ISS LOCATION MARKER (NORAD #25544) ── */}
                {(() => {
                  const ix = projX(issData.longitude);
                  const iy = projY(issData.latitude);

                  return (
                    <g transform={`translate(${ix}, ${iy})`}>
                      {/* Outer animated radio footprint cone */}
                      <circle
                        r="36"
                        fill="url(#issPulseGlow)"
                        stroke="#00d2ff"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.6"
                      >
                        <animate attributeName="r" values="24;42;24" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite" />
                      </circle>

                      {/* Crosshair reticle */}
                      <line x1="-12" y1="0" x2="12" y2="0" stroke="#00d2ff" strokeWidth="1" />
                      <line x1="0" y1="-12" x2="0" y2="12" stroke="#00d2ff" strokeWidth="1" />

                      {/* ISS Satellite Graphic Representation */}
                      {/* Main Truss Bar */}
                      <line x1="-14" y1="0" x2="14" y2="0" stroke="#f8fafc" strokeWidth="2.5" />
                      {/* Solar Arrays Left & Right */}
                      <rect x="-18" y="-7" width="5" height="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />
                      <rect x="13" y="-7" width="5" height="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />
                      {/* Core Modules (Destiny / Zarya / Unity) */}
                      <rect x="-4" y="-3" width="8" height="6" rx="1.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="1" />

                      {/* Live HUD Floating Label */}
                      <g transform="translate(18, -18)">
                        <rect width="118" height="32" rx="4" fill="#030712" stroke="#00d2ff" strokeWidth="1" opacity="0.9" />
                        <text x="6" y="12" fill="#38bdf8" fontSize="9" fontWeight="900">
                          ISS (ALPHA / 25544)
                        </text>
                        <text x="6" y="24" fill="#f8fafc" fontSize="8" fontWeight="bold">
                          {issData.latitude.toFixed(2)}°N, {issData.longitude.toFixed(2)}°W
                        </text>
                      </g>
                    </g>
                  );
                })()}

                {/* Map Legend */}
                <g transform="translate(16, 440)">
                  <rect width="260" height="48" rx="4" fill="rgba(3, 7, 18, 0.85)" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1" />
                  <circle cx="16" cy="16" r="4" fill="#10b981" />
                  <text x="26" y="19" fill="#f8fafc" fontSize="8.5" fontWeight="bold">Active NASA Ground Station</text>
                  <line x1="12" y1="34" x2="28" y2="34" stroke="#facc15" strokeWidth="2" strokeDasharray="3 2" />
                  <text x="34" y="37" fill="#facc15" fontSize="8.5" fontWeight="bold">Orbital Path (92.8 min period)</text>
                  <circle cx="160" cy="16" r="4" fill="#00d2ff" />
                  <text x="170" y="19" fill="#38bdf8" fontSize="8.5" fontWeight="bold">ISS Sub-Satellite Point</text>
                </g>
              </svg>
            </div>

            {/* Bottom HUD Telemetry Strip Gauges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '10px',
              }}
            >
              {/* Gauge 1: Speedometer */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '26px' }}>🚀</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>ORBITAL VELOCITY</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#00d2ff', fontFamily: 'monospace' }}>
                    {Math.round(issData.velocity).toLocaleString()} <span style={{ fontSize: '11px', color: '#94a3b8' }}>km/h</span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Mach 22.5 · 7.66 km/s</div>
                </div>
              </div>

              {/* Gauge 2: Altitude */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '26px' }}>🌍</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>ORBITAL ALTITUDE</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>
                    {issData.altitude.toFixed(1)} <span style={{ fontSize: '11px', color: '#94a3b8' }}>km</span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Low Earth Orbit (LEO) Circular</div>
                </div>
              </div>

              {/* Gauge 3: Solar Illumination */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '26px' }}>☀️</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>SOLAR ILLUMINATION</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#facc15', textTransform: 'uppercase' }}>
                    {issData.visibility || 'DAYLIGHT'}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Solar Array Generation: 120 kW</div>
                </div>
              </div>

              {/* Gauge 4: Selected Ground Station */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '26px' }}>📡</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>TARGET DSN STATION</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#c084fc' }}>
                    {selectedStation?.name || 'Houston (MCC-H)'}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                    {selectedStation?.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            VIEW 2: NASA ECLSS LIFE SUPPORT SYSTEM SCHEMATIC (EECOM)
            ══════════════════════════════════════════════════════════════ */}
        {activeView === 'ECLSS_SCHEMATIC' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(0, 210, 255, 0.25)',
                borderRadius: '8px',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 900 }}>
                  NASA ECLSS (Environmental Control and Life Support System) Engineering Schematic
                </h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Stoichiometric Mass Balance Baseline: <strong>NASA/TP-2015-218570 (BVAD-2025)</strong> · Scaled for {crewCount} Active Astronauts
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 900, border: '1px solid #10b981', padding: '4px 10px', borderRadius: '4px' }}>
                STATUS: CLOSED LOOP NOMINAL
              </div>
            </div>

            {/* Visual Schematic Diagram (SVG Stage) */}
            <div
              style={{
                background: '#070f1e',
                borderRadius: '10px',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                padding: '16px',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
              }}
            >
              <svg viewBox="0 0 960 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  {/* Glowing gas arrows */}
                  <marker id="arrowO2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
                  </marker>
                  <marker id="arrowCO2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#f87171" />
                  </marker>
                  <marker id="arrowH2O" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#22d3ee" />
                  </marker>
                </defs>

                {/* 1. OGS (Oxygen Generation Assembly) */}
                <g transform="translate(40, 20)">
                  <rect width="240" height="135" rx="8" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />
                  <rect width="240" height="28" rx="8" fill="#0369a1" />
                  <text x="14" y="19" fill="#f8fafc" fontSize="12" fontWeight="900">1. OGS (Water Electrolysis)</text>
                  <text x="14" y="50" fill="#94a3b8" fontSize="10">Reaction: 2H₂O → 2H₂ + O₂</text>
                  <text x="14" y="70" fill="#38bdf8" fontSize="14" fontWeight="900">
                    +{(0.84 * crewCount).toFixed(2)} kg O₂ / day
                  </text>
                  <text x="14" y="88" fill="#64748b" fontSize="9.5">Current Stack Voltage: 32.4 V</text>
                  <text x="14" y="103" fill="#64748b" fontSize="9.5">Efficiency: 99.1% Nom</text>
                  <rect x="14" y="112" width="210" height="10" rx="3" fill="#1e293b" />
                  <rect x="14" y="112" width="200" height="10" rx="3" fill="#0284c7" />
                </g>

                {/* 2. CREW HABITAT CABIN (Center Hub) */}
                <g transform="translate(350, 10)">
                  <rect width="260" height="205" rx="12" fill="#0c192c" stroke="#00d2ff" strokeWidth="2.5" />
                  <rect width="260" height="34" rx="12" fill="#0369a1" />
                  <text x="16" y="23" fill="#ffffff" fontSize="13" fontWeight="900">🧑‍🚀 CREW CABIN (Destiny Hub)</text>

                  {/* Atmosphere Gauges */}
                  <text x="16" y="58" fill="#94a3b8" fontSize="10.5">Cabin Total Pressure:</text>
                  <text x="160" y="58" fill="#4ade80" fontSize="12" fontWeight="900">14.7 psi (101.3 kPa)</text>

                  <text x="16" y="80" fill="#94a3b8" fontSize="10.5">Atmospheric Mix:</text>
                  <text x="16" y="100" fill="#38bdf8" fontSize="11" fontWeight="bold">78.1% N₂  ·  20.9% O₂</text>
                  <text x="16" y="118" fill="#f87171" fontSize="10">CO₂: 0.38% (3,850 ppm)</text>

                  <text x="16" y="146" fill="#94a3b8" fontSize="10.5">Active Crew Onboard:</text>
                  <text x="16" y="170" fill="#facc15" fontSize="16" fontWeight="900">{crewCount} Astronauts</text>

                  <text x="16" y="194" fill="#64748b" fontSize="10">Temp: 21.5°C · Humidity: 45%</text>
                </g>

                {/* 3. CDRA (Carbon Dioxide Removal Assembly) */}
                <g transform="translate(680, 20)">
                  <rect width="240" height="135" rx="8" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />
                  <rect width="240" height="28" rx="8" fill="#be123c" />
                  <text x="14" y="19" fill="#f8fafc" fontSize="12" fontWeight="900">2. CDRA (CO₂ Scrubber)</text>
                  <text x="14" y="50" fill="#94a3b8" fontSize="10">Zeolite 13X Molecular Bed</text>
                  <text x="14" y="70" fill="#f87171" fontSize="14" fontWeight="900">
                    -{(1.00 * crewCount).toFixed(2)} kg CO₂ / day
                  </text>
                  <text x="14" y="88" fill="#64748b" fontSize="9.5">Desorption Cycle: Nominal</text>
                  <text x="14" y="103" fill="#64748b" fontSize="9.5">Sabatier Feed: ACTIVE</text>
                  <rect x="14" y="112" width="210" height="10" rx="3" fill="#1e293b" />
                  <rect x="14" y="112" width="200" height="10" rx="3" fill="#e11d48" />
                </g>

                {/* 4. WRS (Water Recovery System - Distillation & Filtration) */}
                <g transform="translate(80, 235)">
                  <rect width="380" height="150" rx="8" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                  <rect width="380" height="28" rx="8" fill="#0891b2" />
                  <text x="14" y="19" fill="#f8fafc" fontSize="12" fontWeight="900">3. WRS (Water Recovery & Recycling)</text>
                  <text x="14" y="50" fill="#94a3b8" fontSize="10">Vapor Compression Distillation Loop</text>
                  <text x="14" y="72" fill="#22d3ee" fontSize="14" fontWeight="900">
                    {(2.50 * crewCount).toFixed(1)} kg / day Potable Water
                  </text>
                  <text x="14" y="95" fill="#4ade80" fontSize="11" fontWeight="bold">
                    RECOVERY EFFICIENCY: 98.2%
                  </text>
                  <text x="14" y="118" fill="#64748b" fontSize="9.5">Recycles Urine & Cabin Sweat into Pure Drinkable Water</text>
                  <rect x="14" y="128" width="350" height="10" rx="3" fill="#1e293b" />
                  <rect x="14" y="128" width="343" height="10" rx="3" fill="#06b6d4" />
                </g>

                {/* 5. KILOPOWER / FSP POWER SYSTEM */}
                <g transform="translate(500, 235)">
                  <rect width="380" height="150" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  <rect width="380" height="28" rx="8" fill="#d97706" />
                  <text x="14" y="19" fill="#f8fafc" fontSize="12" fontWeight="900">4. FSP / Kilopower Nuclear Stirling Core</text>
                  <text x="14" y="50" fill="#94a3b8" fontSize="10">NASA/TM-2018-219890 Engineering Spec</text>
                  <text x="14" y="72" fill="#facc15" fontSize="14" fontWeight="900">
                    10.00 kWe Net Electrical Power
                  </text>
                  <text x="14" y="95" fill="#94a3b8" fontSize="10">
                    Core Thermal: 40 kW_th · η: 25% Stirling Convertor
                  </text>
                  <text x="14" y="118" fill="#64748b" fontSize="9.5">Powers all Life Support Pumps, Scrubbers & Heaters</text>
                  <rect x="14" y="128" width="350" height="10" rx="3" fill="#1e293b" />
                  <rect x="14" y="128" width="350" height="10" rx="3" fill="#f59e0b" />
                </g>

                {/* Animated Gas Flow Lines */}
                {/* O2 to Cabin */}
                <path d="M 280 85 L 350 85" fill="none" stroke="#38bdf8" strokeWidth="3" markerEnd="url(#arrowO2)" strokeDasharray="5 3" />
                {/* CO2 to Scrubber */}
                <path d="M 610 85 L 680 85" fill="none" stroke="#f87171" strokeWidth="3" markerEnd="url(#arrowCO2)" strokeDasharray="5 3" />
                {/* Water loop to Cabin */}
                <path d="M 270 235 L 270 170 L 350 170" fill="none" stroke="#22d3ee" strokeWidth="2.5" markerEnd="url(#arrowH2O)" strokeDasharray="4 2" />
                {/* Power lines to Cabin */}
                <path d="M 690 235 L 690 170 L 610 170" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            VIEW 3: NOAA SPACE WEATHER & GEOMAGNETIC KP GAUGE (SWPC)
            ══════════════════════════════════════════════════════════════ */}
        {activeView === 'SPACE_WEATHER' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                borderRadius: '8px',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 900 }}>
                  NOAA Space Weather Prediction Center (SWPC) · Planetary Geomagnetic Monitor
                </h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Live Satellite Feed: <strong>GOES-16 & ACE Solar Wind Orbiters</strong> · 1-Minute Update Cadence
                </div>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: spaceWeather.kp < 4 ? '#4ade80' : '#f87171',
                  fontWeight: 900,
                  border: `1px solid ${spaceWeather.kp < 4 ? '#4ade80' : '#f87171'}`,
                  padding: '4px 10px',
                  borderRadius: '4px',
                }}
              >
                CLASS: {spaceWeather.status} (Kp {spaceWeather.kp.toFixed(2)})
              </div>
            </div>

            {/* Radar Scope & Semicircular Gauge Stage */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Semicircular Kp Index Gauge */}
              <div
                style={{
                  background: '#070f1e',
                  borderRadius: '10px',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#facc15', marginBottom: '10px' }}>
                  PLANETARY Kp DISTURBANCE GAUGE (0 to 9)
                </div>

                <svg viewBox="0 0 300 170" style={{ width: '280px', height: 'auto' }}>
                  {/* Gauge Arc: Green (0-3), Yellow (4), Orange (5), Red (6-9) */}
                  <path d="M 30 150 A 120 120 0 0 1 110 45" fill="none" stroke="#10b981" strokeWidth="18" />
                  <path d="M 110 45 A 120 120 0 0 1 150 30" fill="none" stroke="#facc15" strokeWidth="18" />
                  <path d="M 150 30 A 120 120 0 0 1 190 45" fill="none" stroke="#f97316" strokeWidth="18" />
                  <path d="M 190 45 A 120 120 0 0 1 270 150" fill="none" stroke="#ef4444" strokeWidth="18" />

                  {/* Tick labels */}
                  <text x="35" y="165" fill="#10b981" fontSize="10" fontWeight="bold">0 (Quiet)</text>
                  <text x="135" y="20" fill="#facc15" fontSize="10" fontWeight="bold">Kp 4</text>
                  <text x="240" y="165" fill="#ef4444" fontSize="10" fontWeight="bold">9 (Extreme)</text>

                  {/* Needle */}
                  {(() => {
                    const angleRad = Math.PI - (Math.min(9, Math.max(0, spaceWeather.kp)) / 9) * Math.PI;
                    const nx = 150 + 95 * Math.cos(angleRad);
                    const ny = 150 - 95 * Math.sin(angleRad);
                    return (
                      <g>
                        <line x1="150" y1="150" x2={nx} y2={ny} stroke="#ffffff" strokeWidth="3.5" />
                        <circle cx="150" cy="150" r="10" fill="#facc15" stroke="#ffffff" strokeWidth="2" />
                      </g>
                    );
                  })()}
                </svg>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#facc15', fontFamily: 'monospace' }}>
                    {spaceWeather.kp.toFixed(2)} <span style={{ fontSize: '14px', color: '#94a3b8' }}>Kp</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 800 }}>
                    {spaceWeather.kp < 4 ? 'SAFE FOR EXTRAVEHICULAR ACTIVITY (EVA)' : 'RADIATION ALERT — SHELTER IN PLACE'}
                  </div>
                </div>
              </div>

              {/* Magnetosphere Bow Shock Visualizer */}
              <div
                style={{
                  background: '#070f1e',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#00d2ff' }}>
                  EARTH MAGNETOSPHERE & SOLAR WIND DEFLECTION
                </div>

                <svg viewBox="0 0 320 160" style={{ width: '100%', height: 'auto' }}>
                  {/* Sun stream lines from left */}
                  <line x1="10" y1="30" x2="140" y2="30" stroke="#facc15" strokeWidth="1.5" strokeDasharray="5 3" />
                  <line x1="10" y1="80" x2="140" y2="80" stroke="#facc15" strokeWidth="2" strokeDasharray="5 3" />
                  <line x1="10" y1="130" x2="140" y2="130" stroke="#facc15" strokeWidth="1.5" strokeDasharray="5 3" />
                  <text x="14" y="22" fill="#facc15" fontSize="9" fontWeight="bold">Solar Wind 420 km/s</text>

                  {/* Bow Shock Parabola */}
                  <path d="M 150 10 Q 180 80 150 150" fill="none" stroke="#00d2ff" strokeWidth="3" opacity="0.8" />
                  <text x="110" y="100" fill="#38bdf8" fontSize="8" transform="rotate(-90 120 100)">BOW SHOCK</text>

                  {/* Earth */}
                  <circle cx="230" cy="80" r="24" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  {/* Dipole magnetic field lines */}
                  <ellipse cx="230" cy="80" rx="40" ry="60" fill="none" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
                  <circle cx="230" cy="80" r="4" fill="#ffffff" />
                  <text x="230" y="84" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Earth</text>

                  {/* Auroral Oval Glow */}
                  <ellipse cx="230" cy="60" rx="8" ry="4" fill="#10b981" opacity="0.8" />
                  <ellipse cx="230" cy="100" rx="8" ry="4" fill="#10b981" opacity="0.8" />
                </svg>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#0b162c', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>SOLAR PROTON STORM</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#4ade80' }}>{spaceWeather.stormScale || 'S0 (None)'}</div>
                  </div>
                  <div style={{ background: '#0b162c', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>AURORA VISIBILITY</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#38bdf8' }}>Lat &gt; 65° N/S</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            VIEW 4: NASA OPEN MCT REAL-TIME TELEMETRY STRIP CHARTS
            ══════════════════════════════════════════════════════════════ */}
        {activeView === 'STRIP_CHARTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                borderRadius: '8px',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 900 }}>
                  NASA Open MCT (Mission Control Technologies) Telemetry Oscilloscope
                </h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Real-Time Scrolling Strip Charts · NASA Ames Research Center Architecture
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800 }}>
                SAMPLING CADENCE: 1.0 SECONDS
              </div>
            </div>

            {/* Strip Chart Canvas */}
            <div
              style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 210, 255, 0.4)',
                boxShadow: '0 0 30px rgba(0, 210, 255, 0.15)',
              }}
            >
              <canvas
                ref={stripChartCanvasRef}
                width={940}
                height={460}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            VIEW 5: ACTIVE ASTRONAUT MANIFEST (CREW IN SPACE)
            ══════════════════════════════════════════════════════════════ */}
        {activeView === 'CREW_MANIFEST' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 900 }}>
                  Active International Human Spaceflight Manifest
                </h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Live Roster from <strong>api.open-notify.org & NASA Flight Operations</strong> · {crewCount} Humans in Orbit Right Now
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#c084fc', fontWeight: 900, border: '1px solid #c084fc', padding: '4px 10px', borderRadius: '4px' }}>
                ORBITAL STATIONS: ISS & TIANGONG
              </div>
            </div>

            {/* Crew Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {ACTIVE_CREW_ROSTER.slice(0, crewCount).map((member, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '20px' }}>{member.country}</span>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      {member.agency}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc', marginTop: '4px' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#a855f7', fontWeight: 700 }}>
                    {member.role}
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                    Craft: {member.craft}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
