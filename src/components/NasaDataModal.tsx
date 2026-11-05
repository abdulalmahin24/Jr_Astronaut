import React, { useState } from 'react';
import { NASA_DATASETS } from '../data/nasaDatasets';
import { Database, ExternalLink, X } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface NasaDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NasaDataModal: React.FC<NasaDataModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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
          maxHeight: '90dvh',
          backgroundColor: 'var(--color-paper-2)',
          border: 'var(--rule-hair) solid var(--color-rule)',
          borderRadius: '0px',
          overflowY: 'auto',
        }}
      >
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: 'var(--rule-hair) solid var(--color-rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} color="var(--color-accent-2)" />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-accent-2)', fontFamily: 'var(--font-outlier)' }}>
                NASA Space Apps Challenge 2026 · Scientific Grounding
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                Verified NASA Datasets, Sources &amp; Technical Reports
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '13.5px', color: 'var(--color-ink-2)', lineHeight: 1.5, marginBottom: '16px' }}>
            In strict compliance with NASA Space Apps Challenge judging criteria, all simulation constants, physical models, and environmental hazards in <strong>Jr_AstroCamp: Beyond Earth</strong> are mathematically grounded in the following peer-reviewed NASA technical publications and open scientific repositories.
          </p>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  soundFx.playClick(850);
                }}
                className={selectedCategory === c.id ? 'hm-btn-primary' : 'hm-btn-secondary'}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-outlier)',
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
                  backgroundColor: 'var(--color-paper-card)',
                  border: 'var(--rule-hair) solid var(--color-rule)',
                  borderRadius: '0px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-paper-3)',
                          color: 'var(--color-accent-green)',
                          border: 'var(--rule-hair) solid var(--color-rule)',
                          fontFamily: 'var(--font-outlier)',
                        }}
                      >
                        REAL NASA DATA
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'var(--font-outlier)' }}>Verified: {ds.accessDate}</span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>{ds.name}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--color-accent-2)', fontFamily: 'var(--font-outlier)', marginTop: '2px' }}>
                      {ds.citationDoc} · <span style={{ color: 'var(--color-muted)' }}>{ds.agencyOrPublisher}</span>
                    </div>
                  </div>

                  <a
                    href={ds.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hm-btn-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-outlier)',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Official NASA Source</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--color-ink-2)', lineHeight: 1.45 }}>
                    <strong style={{ color: 'var(--color-ink)' }}>Relevant Scientific Fact / Value: </strong>
                    {ds.relevantFactOrData}
                  </div>

                  <div style={{ color: 'var(--color-muted)' }}>
                    <strong style={{ color: 'var(--color-accent-2)' }}>Scientific Units: </strong>
                    <span style={{ fontFamily: 'var(--font-outlier)' }}>{ds.units}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-paper-3)', padding: '10px 12px', borderLeft: '2px solid var(--color-accent-2)' }}>
                    <strong style={{ color: 'var(--color-accent-2)' }}>How Applied in Jr_AstroCamp: </strong>
                    <span style={{ color: 'var(--color-ink-2)' }}>{ds.howUsedInGame}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-paper-3)', padding: '10px 12px', borderLeft: '2px solid var(--color-accent)' }}>
                    <strong style={{ color: 'var(--color-accent)' }}>Game Simulation Simplification: </strong>
                    <span style={{ color: 'var(--color-muted)' }}>{ds.limitationsOrSimplifications}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
