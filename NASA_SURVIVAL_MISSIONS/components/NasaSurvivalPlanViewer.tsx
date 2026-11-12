// ============================================================================
// NasaSurvivalPlanViewer.tsx — Standalone 4-Mission Survival Plan Viewer
// Grounded in Real NASA Open Data (2 Moon Missions + 2 Mars Missions)
// NASA International Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

import React, { useState } from 'react';
import { NASA_SURVIVAL_DATA_PLAN, type NasaSurvivalDataPlanMission } from '../data/nasaSurvivalDataPlan';
import {
  ShieldCheck,
  Globe,
  ExternalLink,
  Flame,
  Moon,
  Compass,
  AlertTriangle,
  Award,
  Database,
  Layers,
} from 'lucide-react';

interface NasaSurvivalPlanViewerProps {
  onLaunchMission?: (missionId: string) => void;
  onClose?: () => void;
}

export const NasaSurvivalPlanViewer: React.FC<NasaSurvivalPlanViewerProps> = ({
  onLaunchMission,
  onClose,
}) => {
  const [selectedDestination, setSelectedDestination] = useState<'ALL' | 'MOON' | 'MARS'>('ALL');
  const [selectedMissionId, setSelectedMissionId] = useState<string>(NASA_SURVIVAL_DATA_PLAN[0].id);

  const filteredMissions = NASA_SURVIVAL_DATA_PLAN.filter((m) => {
    if (selectedDestination === 'ALL') return true;
    return m.destination === selectedDestination;
  });

  const activeMission =
    NASA_SURVIVAL_DATA_PLAN.find((m) => m.id === selectedMissionId) || filteredMissions[0];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#0a0f1d',
        borderRadius: '16px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ─── HEADER ─── */}
      <header
        style={{
          padding: '20px 28px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.35))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(56, 189, 248, 0.4)',
            }}
          >
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(56, 189, 248, 0.18)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                NASA Space Apps Challenge 2026
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Scientific Grounding</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 0', color: '#ffffff' }}>
              Real NASA Survival Mission Data Plan
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
              4 Scientific Planetary Survival Scenarios Grounded in Official Open Datasets (2 Moon + 2 Mars)
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ✕ Close
          </button>
        )}
      </header>

      {/* ─── NASA 4-PLATFORM OPEN GATEWAY STRIP ─── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '12px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
          <Globe size={14} color="#38bdf8" />
          <strong style={{ color: '#e2e8f0' }}>Official NASA Open Data Portals Used:</strong>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="https://data.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            data.nasa.gov <ExternalLink size={10} />
          </a>
          <a
            href="https://api.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            api.nasa.gov <ExternalLink size={10} />
          </a>
          <a
            href="https://earthdata.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(74, 222, 128, 0.12)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              color: '#4ade80',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            earthdata.nasa.gov <ExternalLink size={10} />
          </a>
          <a
            href="https://www.jpl.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(192, 132, 252, 0.12)',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              color: '#c084fc',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            jpl.nasa.gov <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* ─── DESTINATION FILTER PILLS ─── */}
      <div
        style={{
          padding: '14px 28px 0',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
          Destination Filter:
        </span>
        <button
          onClick={() => setSelectedDestination('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            background: selectedDestination === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${selectedDestination === 'ALL' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
            color: selectedDestination === 'ALL' ? '#38bdf8' : '#94a3b8',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          All 4 Missions
        </button>
        <button
          onClick={() => setSelectedDestination('MOON')}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            background: selectedDestination === 'MOON' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${selectedDestination === 'MOON' ? '#94a3b8' : 'rgba(255,255,255,0.1)'}`,
            color: selectedDestination === 'MOON' ? '#f1f5f9' : '#94a3b8',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Moon size={12} /> Moon (2 Missions)
        </button>
        <button
          onClick={() => setSelectedDestination('MARS')}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            background: selectedDestination === 'MARS' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${selectedDestination === 'MARS' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            color: selectedDestination === 'MARS' ? '#fca5a5' : '#94a3b8',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Flame size={12} /> Mars (2 Missions)
        </button>
      </div>

      {/* ─── 4 MISSION SELECTOR CARDS (HORIZONTAL GRID) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          padding: '16px 28px',
        }}
      >
        {filteredMissions.map((m) => {
          const isSelected = m.id === activeMission.id;
          const isMoon = m.destination === 'MOON';
          const accentColor = isMoon ? '#38bdf8' : '#ef4444';

          return (
            <div
              key={m.id}
              onClick={() => setSelectedMissionId(m.id)}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: isSelected
                  ? `linear-gradient(135deg, rgba(15, 23, 42, 0.95), ${isMoon ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)'})`
                  : 'rgba(15, 23, 42, 0.55)',
                border: `1.5px solid ${isSelected ? accentColor : 'rgba(255, 255, 255, 0.08)'}`,
                boxShadow: isSelected ? `0 0 16px ${accentColor}40` : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isMoon ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: accentColor,
                  }}
                >
                  {m.destination} · MISSION {m.missionNumber}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                  {m.nasaDataset.portal}
                </span>
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: '4px 0 2px', lineHeight: 1.3 }}>
                {m.title}
              </h4>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                {m.hazardCategory}
              </p>
            </div>
          );
        })}
      </div>

      {/* ─── ACTIVE MISSION DEEP-DIVE CARD ─── */}
      <div
        style={{
          margin: '0 28px 28px',
          padding: '24px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Title & Tagline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  color: activeMission.destination === 'MOON' ? '#38bdf8' : '#ef4444',
                }}
              >
                ● MISSION {activeMission.missionNumber} OF 4
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>·</span>
              <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Location: <strong>{activeMission.location}</strong></span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              {activeMission.title}
            </h3>
            <p style={{ fontSize: '13px', color: '#38bdf8', margin: '4px 0 0', fontWeight: 600 }}>
              {activeMission.tagline}
            </p>
          </div>

          {onLaunchMission && (
            <button
              onClick={() => onLaunchMission(activeMission.id)}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                border: 'none',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              }}
            >
              🚀 LAUNCH THIS MISSION
            </button>
          )}
        </div>

        {/* Phenomenon & Scenario */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Real NASA Physical Phenomenon
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
              {activeMission.realPhysicalPhenomenon}
            </p>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Simulator Survival Scenario
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
              {activeMission.survivalScenario}
            </p>
          </div>
        </div>

        {/* Mathematical Formula Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25), rgba(15, 23, 42, 0.6))',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1.5px solid rgba(56, 189, 248, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📐 Exact Physics & Mathematical Formula: {activeMission.mathematicalModel.name}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {activeMission.mathematicalModel.variables}
            </span>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '15px',
              color: '#4ade80',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          >
            {activeMission.mathematicalModel.formula}
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '10px 0 0', lineHeight: 1.5 }}>
            {activeMission.mathematicalModel.explanation}
          </p>
        </div>

        {/* Telemetry Parameters Grid */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
            Numerical Telemetry Thresholds & Limits
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
            }}
          >
            {activeMission.telemetryParameters.map((tp, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>{tp.name}</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', margin: '2px 0' }}>
                  {tp.nominalValue} <span style={{ fontSize: '10px', color: '#38bdf8' }}>{tp.unit}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>
                  Critical Limit: {tp.criticalThreshold} {tp.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commander Action Protocol */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            padding: '16px',
            borderRadius: '10px',
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>
            🛡️ Commander Survival Protocol
          </div>
          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
            {activeMission.commanderActionProtocol}
          </p>
        </div>

        {/* NASA Official Citation & Direct Link */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>NASA PEER-REVIEWED CITATION:</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>
              {activeMission.nasaDataset.catalogId} — {activeMission.nasaDataset.missionHeritage}
            </div>
          </div>

          <a
            href={activeMission.nasaDataset.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '11px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Open {activeMission.nasaDataset.portal} Source</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
