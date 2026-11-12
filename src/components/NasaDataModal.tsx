import React, { useState, useEffect } from 'react';
import { NASA_DATASETS } from '../data/nasaDatasets';
import { NASA_SURVIVAL_DATA_PLAN } from '../data/nasaSurvivalDataPlan';
import { Database, ExternalLink, X, Globe, Key, ShieldCheck, Flame, Moon, Compass } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface NasaDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NasaDataModal: React.FC<NasaDataModalProps> = ({ isOpen, onClose }) => {
  const [activeView, setActiveView] = useState<'SURVIVAL_PLAN' | 'CATALOG'>('SURVIVAL_PLAN');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'All Sources (6)' },
    { id: 'LUNAR_SURFACE', label: 'Lunar Surface & Ice' },
    { id: 'SPACE_WEATHER', label: 'Space Weather' },
    { id: 'LIFE_SUPPORT', label: 'ECLSS Life Support' },
    { id: 'RADIATION', label: 'Radiation Shielding' },
    { id: 'SURFACE_OPS', label: 'Surface Operations' },
    { id: 'POWER_ENERGY', label: 'Kilopower & Energy' },
  ];

  const filteredDatasets = selectedCategory === 'ALL'
    ? NASA_DATASETS
    : NASA_DATASETS.filter((d) => d.category === selectedCategory);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '880px',
          maxHeight: '90vh',
          backgroundColor: '#070b13',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          overflowY: 'auto',
        }}
      >
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={22} className="text-cyan-400" />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                NASA Space Apps Challenge 2026 · Scientific Grounding
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Verified NASA Datasets, Sources &amp; Technical Reports
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* NASA 4-PLATFORM OPEN DATA & API GATEWAY */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(15, 23, 42, 0.95))',
              border: '1.5px solid #0284c7',
              borderRadius: '14px',
              padding: '16px 18px',
              marginBottom: '22px',
              boxShadow: '0 8px 30px rgba(2, 132, 199, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="#38bdf8" />
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.04em' }}>
                  NASA OFFICIAL OPEN DATA & API PLATFORMS
                </span>
              </div>
              <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                PUBLIC ACCESS · NO SPECIAL KEY REQUIRED
              </span>
            </div>

            <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
              NASA’s data and APIs are already publicly available without requiring a special NASA Space Apps API key. Jr_AstroCamp grounds all flight dynamics, Moonquake seismic records, and Martian environmental hazards in these four core NASA platforms:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              {/* 1. NASA Open Data */}
              <a href="https://data.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '12px', height: '100%', transition: 'all 0.15s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>data.nasa.gov</strong>
                    <ExternalLink size={12} color="#94a3b8" />
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>NASA Open Data</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                    Publicly available datasets: Apollo Moonquake catalog (Nakamura 1979), Kessler orbital debris, launch vehicle guidance.
                  </div>
                </div>
              </a>

              {/* 2. NASA API Portal */}
              <a href="https://api.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '12px', height: '100%', transition: 'all 0.15s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace' }}>api.nasa.gov</strong>
                    <ExternalLink size={12} color="#94a3b8" />
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>NASA API Portal</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                    REST APIs for Near-Earth Asteroids (NeoWs), Mars Rover Photos, APOD, and DONKI space weather solar flare events.
                  </div>
                </div>
              </a>

              {/* 3. NASA Earthdata */}
              <a href="https://earthdata.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '12px', height: '100%', transition: 'all 0.15s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '11px', color: '#4ade80', fontFamily: 'monospace' }}>earthdata.nasa.gov</strong>
                    <ExternalLink size={12} color="#94a3b8" />
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>NASA Earthdata</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                    Earth observation, climate, and satellite telemetry: Atmospheric density gradients, tropospheric wind shear, and launchpad weather rules.
                  </div>
                </div>
              </a>

              {/* 4. NASA JPL */}
              <a href="https://www.jpl.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '12px', height: '100%', transition: 'all 0.15s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '11px', color: '#c084fc', fontFamily: 'monospace' }}>jpl.nasa.gov</strong>
                    <ExternalLink size={12} color="#94a3b8" />
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>NASA JPL Science</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                    Planetary exploration missions: JPL Horizons celestial ephemerides, Mars 2020 Perseverance EDL telemetry, and MOLA topographic elevation models.
                  </div>
                </div>
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '10px 14px', borderRadius: '8px', fontSize: '10.5px' }}>
              <span style={{ color: '#94a3b8' }}>
                Need a personal API key for high-volume querying? Registration is 100% free:
              </span>
              <a
                href="https://api.nasa.gov"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000000',
                  fontWeight: 900,
                  fontSize: '11px',
                  textDecoration: 'none',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
                }}
              >
                <Key size={13} /> GENERATE FREE API KEY <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* VIEW SWITCHER: SURVIVAL DATA PLAN (2 MOON + 2 MARS) vs TECHNICAL CATALOG */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <button
              onClick={() => { setActiveView('SURVIVAL_PLAN'); soundFx.playClick(850); }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                background: activeView === 'SURVIVAL_PLAN' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.7)',
                border: `1.5px solid ${activeView === 'SURVIVAL_PLAN' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeView === 'SURVIVAL_PLAN' ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none',
              }}
            >
              <ShieldCheck size={16} />
              NASA SURVIVAL DATA PLAN (2 MOON + 2 MARS)
            </button>

            <button
              onClick={() => { setActiveView('CATALOG'); soundFx.playClick(850); }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                background: activeView === 'CATALOG' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.7)',
                border: `1.5px solid ${activeView === 'CATALOG' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeView === 'CATALOG' ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none',
              }}
            >
              <Database size={16} />
              PEER-REVIEWED TECHNICAL CITATIONS (6)
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* VIEW 1: NASA SURVIVAL DATA PLAN (2 MOON + 2 MARS)            */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeView === 'SURVIVAL_PLAN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                <strong style={{ color: '#38bdf8' }}>Scientific Data Grounding Statement: </strong>
                Because NASA does not publish pre-packaged "survival game missions," Jr_AstroCamp bridges the gap by translating documented, real-world planetary hazards (Apollo high-Q regolith moonquakes, DONKI Class X solar proton events, REMS global planet-encircling dust storms, and MOLA deep canyon katabatic wind shear) into four rigorous scientific survival simulations.
              </div>

              {NASA_SURVIVAL_DATA_PLAN.map((plan) => {
                const isMoon = plan.targetBody === 'MOON';
                return (
                  <div
                    key={plan.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: `1.5px solid ${isMoon ? '#38bdf8' : '#ef4444'}`,
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: `0 6px 24px ${isMoon ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                    }}
                  >
                    {/* Header: Target Badge, Portal, Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 900,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isMoon ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: isMoon ? '#38bdf8' : '#f87171',
                              border: `1px solid ${isMoon ? '#38bdf8' : '#ef4444'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isMoon ? '🌕 MOON SURVIVAL' : '🔴 MARS SURVIVAL'} #{plan.missionNumber}
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                            PORTAL: {plan.nasaPortal}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', margin: '2px 0' }}>
                          {plan.title}
                        </h3>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {plan.subtitle}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#38bdf8', fontFamily: 'monospace', marginTop: '4px' }}>
                          Target Site: {plan.targetSite} ({plan.coordinates}, {plan.elevationM >= 0 ? `+${plan.elevationM}m` : `${plan.elevationM}m`})
                        </div>
                      </div>

                      <a
                        href={plan.datasetDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          fontSize: '11px',
                          fontWeight: 800,
                          textDecoration: 'none',
                        }}
                      >
                        NASA PDS / Archive <ExternalLink size={12} />
                      </a>
                    </div>

                    {/* Scientific Phenomenon & Math Formula */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
                      <strong style={{ color: '#e2e8f0' }}>Documented Scientific Hazard: </strong>
                      {plan.scientificPhenomenon}
                      <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', fontFamily: 'monospace', color: '#38bdf8', fontSize: '11px' }}>
                        Physical Equation: {plan.physicsFormula}
                      </div>
                    </div>

                    {/* Environmental Telemetry Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', fontSize: '10px' }}>
                      <div>
                        <div style={{ color: '#94a3b8' }}>ATMOSPHERIC PRESSURE</div>
                        <div style={{ fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                          {plan.environmentalTelemetry.atmosphericPressurePa === 0
                            ? 'Hard Vacuum (0 Pa)'
                            : `${plan.environmentalTelemetry.atmosphericPressurePa} Pa`}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8' }}>AMBIENT TEMPERATURE</div>
                        <div style={{ fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                          {plan.environmentalTelemetry.ambientTemperatureC.min}°C to {plan.environmentalTelemetry.ambientTemperatureC.max}°C
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8' }}>SURFACE GRAVITY</div>
                        <div style={{ fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                          {plan.environmentalTelemetry.surfaceGravityMs2} m/s²
                        </div>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ color: '#94a3b8' }}>PRIMARY HAZARD VALUE</div>
                        <div style={{ fontWeight: 800, color: isMoon ? '#38bdf8' : '#f87171' }}>
                          {plan.environmentalTelemetry.primaryHazardValue}
                        </div>
                      </div>
                    </div>

                    {/* Commander Protocols */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e', marginBottom: '6px' }}>
                        COMMANDER SURVIVAL PROTOCOLS:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {plan.commanderProtocols.map((p) => (
                          <div key={p.step} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '10.5px' }}>
                            <strong style={{ color: '#ffffff' }}>Step {p.step}: {p.action} — </strong>
                            <span style={{ color: '#94a3b8' }}>{p.scientificRationale}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Citation & Verification */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '9.5px', color: '#94a3b8' }}>
                      <div><strong>NASA Citation: </strong>{plan.datasetCitationDoc}</div>
                      <div><strong>How to Verify: </strong>{plan.verificationGuide}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* VIEW 2: ORIGINAL PEER-REVIEWED CITATION CATALOG               */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeView === 'CATALOG' && (
            <>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '16px' }}>
                In strict compliance with NASA Space Apps Challenge judging criteria, all simulation constants, physical models, and environmental hazards in <strong>Jr_AstroCamp: Beyond Earth</strong> are mathematically grounded in the following peer-reviewed NASA technical publications and open scientific repositories.
              </p>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      soundFx.playClick(850);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: selectedCategory === c.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: selectedCategory === c.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      color: selectedCategory === c.id ? '#38bdf8' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredDatasets.map((ds) => (
                  <div
                    key={ds.id}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '18px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#43ffa0',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            [REAL NASA DATA]
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Verified: {ds.accessDate}</span>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>{ds.name}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
                          {ds.citationDoc} · <span style={{ color: '#94a3b8' }}>{ds.agencyOrPublisher}</span>
                        </div>
                      </div>

                      <a
                        href={ds.directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <span>Official NASA Source</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                      <div style={{ color: '#cbd5e1', lineHeight: 1.45 }}>
                        <strong style={{ color: '#e2e8f0' }}>Relevant Scientific Fact / Value: </strong>
                        {ds.relevantFactOrData}
                      </div>

                      <div style={{ color: '#94a3b8' }}>
                        <strong style={{ color: '#a78bfa' }}>Scientific Units: </strong>
                        <span style={{ fontFamily: 'monospace' }}>{ds.units}</span>
                      </div>

                      <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.05)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                        <strong style={{ color: '#38bdf8' }}>How Applied in Jr_AstroCamp: </strong>
                        <span style={{ color: '#cbd5e1' }}>{ds.howUsedInGame}</span>
                      </div>

                      <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                        <strong style={{ color: '#fbbf24' }}>Game Simulation Simplification: </strong>
                        <span style={{ color: '#94a3b8' }}>{ds.limitationsOrSimplifications}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
