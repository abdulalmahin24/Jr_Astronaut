import React, { useState } from 'react';
import {
  X,
  Rocket,
  Shield,
  Zap,
  Droplets,
  Wind,
  Apple,
  Radio,
  Wrench,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Scale
} from 'lucide-react';
import type { OutpostConfiguration, Destination } from '../types/game';
import { OUTPOST_BUILD_CATALOG, DEFAULT_LUNAR_OUTPOST, DEFAULT_MARS_OUTPOST } from '../utils/simulationEngine';
import { soundFx } from '../utils/audioEffects';

interface OutpostConstructionModalProps {
  isOpen: boolean;
  destination: Destination;
  initialConfig?: OutpostConfiguration;
  onConfirm: (config: OutpostConfiguration) => void;
  onCancel: () => void;
}

export const OutpostConstructionModal: React.FC<OutpostConstructionModalProps> = ({
  isOpen,
  destination,
  initialConfig,
  onConfirm,
  onCancel,
}) => {
  const isMars = destination === 'MARS';
  const defaultBase = isMars ? DEFAULT_MARS_OUTPOST : DEFAULT_LUNAR_OUTPOST;

  const [config, setConfig] = useState<OutpostConfiguration>(initialConfig || defaultBase);

  if (!isOpen) return null;

  // Calculate total allocated mass
  const totalMass =
    (OUTPOST_BUILD_CATALOG.habitat.find((m) => m.id === config.habitatType)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.powerGeneration.find((m) => m.id === config.powerGeneration)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.energyStorage.find((m) => m.id === config.energyStorage)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.lifeSupport.find((m) => m.id === config.lifeSupport)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.waterRecycling.find((m) => m.id === config.waterRecycling)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.greenhouse.find((m) => m.id === config.greenhouse)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.radiationShielding.find((m) => m.id === config.radiationShielding)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.communications.find((m) => m.id === config.communications)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.maintenanceEquipment.find((m) => m.id === config.maintenanceEquipment)?.massKg || 0) +
    (OUTPOST_BUILD_CATALOG.surfaceRover.find((m) => m.id === config.surfaceRover)?.massKg || 0);

  const maxBudget = defaultBase.maxCargoBudgetKg;
  const isOverBudget = totalMass > maxBudget;
  const remainingBudget = maxBudget - totalMass;
  const massPct = Math.min(100, Math.round((totalMass / maxBudget) * 100));

  const handleSelectOption = (category: keyof OutpostConfiguration, id: any) => {
    soundFx.playClick(850);
    setConfig((prev) => ({
      ...prev,
      [category]: id,
      allocatedCargoKg: totalMass,
    }));
  };

  const handleLaunch = () => {
    if (isOverBudget) return;
    soundFx.playReactorStart();
    onConfirm({
      ...config,
      allocatedCargoKg: totalMass,
      maxCargoBudgetKg: maxBudget,
    });
  };

  const categories = [
    { key: 'habitat', label: '1. Primary Habitat Module', icon: <Shield size={16} className="text-sky-400" />, options: OUTPOST_BUILD_CATALOG.habitat },
    { key: 'powerGeneration', label: '2. Solar Generation Array', icon: <Zap size={16} className="text-amber-400" />, options: OUTPOST_BUILD_CATALOG.powerGeneration },
    { key: 'energyStorage', label: '3. Energy Storage & Surface Power', icon: <Zap size={16} className="text-orange-400" />, options: OUTPOST_BUILD_CATALOG.energyStorage },
    { key: 'lifeSupport', label: '4. ECLSS Life Support', icon: <Wind size={16} className="text-emerald-400" />, options: OUTPOST_BUILD_CATALOG.lifeSupport },
    { key: 'waterRecycling', label: '5. Water Recovery & Loop', icon: <Droplets size={16} className="text-cyan-400" />, options: OUTPOST_BUILD_CATALOG.waterRecycling },
    { key: 'greenhouse', label: '6. Controlled Environment Greenhouse', icon: <Apple size={16} className="text-green-400" />, options: OUTPOST_BUILD_CATALOG.greenhouse },
    { key: 'radiationShielding', label: '7. Radiation Defense & Storm Vault', icon: <Shield size={16} className="text-violet-400" />, options: OUTPOST_BUILD_CATALOG.radiationShielding },
    { key: 'communications', label: '8. Deep Space Communications', icon: <Radio size={16} className="text-blue-400" />, options: OUTPOST_BUILD_CATALOG.communications },
    { key: 'maintenanceEquipment', label: '9. Workshop & Repair Systems', icon: <Wrench size={16} className="text-yellow-400" />, options: OUTPOST_BUILD_CATALOG.maintenanceEquipment },
    { key: 'surfaceRover', label: '10. Surface Exploration Vehicle', icon: <Compass size={16} className="text-rose-400" />, options: OUTPOST_BUILD_CATALOG.surfaceRover },
  ];

  return (
    <div className="modal-backdrop" onClick={onCancel} style={{ zIndex: 1200 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '940px', maxHeight: '92vh', overflowY: 'auto', backgroundColor: '#090e17', border: '1px solid rgba(56, 189, 248, 0.4)' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.2)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <Scale size={24} className="text-cyan-400" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                NASA Flight Phase 2 · Engineering Outpost Manifest
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                {isMars ? 'Ares Base Alpha — Martian Outpost Construction' : 'Artemis Base Camp — Lunar Outpost Construction'}
              </h2>
            </div>
          </div>
          <button onClick={onCancel} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Cargo Mass Budget HUD */}
          <div
            style={{
              background: isOverBudget ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.85)',
              border: `1.5px solid ${isOverBudget ? '#ef4444' : 'rgba(56, 189, 248, 0.3)'}`,
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Starship / SLS Trans-Lunar Cargo Payload Limit
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'monospace', color: isOverBudget ? '#ef4444' : '#38bdf8' }}>
                  {totalMass.toLocaleString()} kg / {maxBudget.toLocaleString()} kg
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Payload Mass Margin
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'monospace', color: isOverBudget ? '#ef4444' : '#43ffa0' }}>
                  {isOverBudget ? `EXCEEDED BY +${(totalMass - maxBudget).toLocaleString()} kg` : `${remainingBudget.toLocaleString()} kg Available`}
                </div>
              </div>
            </div>

            {/* Mass Meter Bar */}
            <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', marginTop: '12px' }}>
              <div
                style={{
                  width: `${massPct}%`,
                  height: '100%',
                  background: isOverBudget ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #43ffa0)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {isOverBudget && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginTop: '10px' }}>
                <AlertTriangle size={16} />
                <span>Payload exceeds maximum rocket payload fairing capacity. Remove or downgrade modules before launch!</span>
              </div>
            )}
          </div>

          {/* Module Selector Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {categories.map((cat) => {
              const currentSelectedId = (config as any)[cat.key];
              return (
                <div
                  key={cat.key}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    {cat.icon}
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>{cat.label}</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {cat.options.map((opt) => {
                      const isSelected = currentSelectedId === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(cat.key as any, opt.id)}
                          style={{
                            padding: '14px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                                {opt.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontFamily: 'monospace',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  color: '#cbd5e1',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {opt.massKg.toLocaleString()} kg
                              </span>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '8px' }}>
                              {opt.description}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.72rem' }}>
                              {opt.benefits.map((b, i) => (
                                <div key={i} style={{ color: '#43ffa0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>✓</span>
                                  <span>{b}</span>
                                </div>
                              ))}
                              {opt.tradeOffs.map((t, i) => (
                                <div key={i} style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>⚠</span>
                                  <span>{t}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: isSelected ? '#38bdf8' : '#64748b',
                              }}
                            >
                              {isSelected ? <CheckCircle2 size={14} className="text-cyan-400" /> : null}
                              <span>{isSelected ? 'Allocated to Cargo' : 'Select System'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <button
              onClick={onCancel}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel Manifest
            </button>

            <button
              onClick={handleLaunch}
              disabled={isOverBudget}
              style={{
                padding: '12px 28px',
                borderRadius: '10px',
                border: 'none',
                background: isOverBudget
                  ? 'rgba(71, 85, 105, 0.5)'
                  : 'linear-gradient(135deg, #0284c7, #10b981)',
                color: isOverBudget ? '#94a3b8' : '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: isOverBudget ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isOverBudget ? 'none' : '0 0 25px rgba(56, 189, 248, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <Rocket size={18} />
              <span>Confirm Cargo &amp; Deploy Outpost</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
