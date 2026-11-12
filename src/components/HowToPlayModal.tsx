import React, { useState } from 'react';
import {
  X,
  BookOpen,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONSTRUCTION' | 'SURVIVAL' | 'ROVER' | 'SCORING'>('OVERVIEW');

  if (!isOpen) return null;

  const handleTabChange = (tab: any) => {
    soundFx.playClick(800);
    setActiveTab(tab);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          maxHeight: '90vh',
          backgroundColor: '#070b13',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={22} className="text-cyan-400" />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Junior Astronaut Survival Operations Manual
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                How to Play Jr_AstroCamp: Beyond Earth
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: '4px 16px',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'OVERVIEW', label: '1. Mission Objective' },
            { id: 'CONSTRUCTION', label: '2. Outpost Build' },
            { id: 'SURVIVAL', label: '3. Life Support & Night' },
            { id: 'ROVER', label: '4. Rover Science' },
            { id: 'SCORING', label: '5. Scoring & Debrief' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                padding: '10px 14px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === t.id ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === t.id ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'OVERVIEW' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px' }}>
                Welcome to NASA Flight Operations, Astronaut Trainee!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '16px' }}>
                In <strong>Jr_AstroCamp: Beyond Earth</strong>, you enter as a flight cadet alongside Commander Dadu and Cadet Maya. You are tasked with establishing and commanding humanity’s first permanent deep-space outpost at the <strong>Lunar South Pole (Shackleton Crater)</strong> or on <strong>Mars (Jezero Crater)</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>⏳</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>30 Sols Duration</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Manage shifts daily, advancing time and reacting to real NASA-modeled hazards.</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(67, 255, 160, 0.25)' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>⚖️</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#43ffa0' }}>No Easy Choices</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Every decision carries trade-offs. Emergency power protects battery, but cuts down research.</div>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>🔬</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>Real NASA Data</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Grounded in NASA BVAD life support standards, LRO topographic models, and Kilopower specs.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CONSTRUCTION' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
                Stage 1: Outpost Construction &amp; Cargo Mass Budget
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '14px' }}>
                Before launch, you are assigned a strict cargo budget (<strong>45,000 kg</strong> for Lunar Artemis Base Camp; <strong>60,000 kg</strong> for Mars). You must equip 10 essential base subsystems:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
                <div>• <strong>Habitat:</strong> Inflatable TransHab (8,000 kg) vs Heavy Regolith Dome (14,000 kg).</div>
                <div>• <strong>Power:</strong> Deployable PV Array (4,000 kg) vs Kilopower Fission Reactor (8,500 kg).</div>
                <div>• <strong>Life Support:</strong> Standard ECLSS (4,500 kg) vs Closed-Loop Sabatier (8,000 kg).</div>
                <div>• <strong>Greenhouse:</strong> Salad Pod (4,000 kg) vs Full-Scale Crop Biome (7,500 kg).</div>
                <div>• <strong>Rover:</strong> Light Buggy (3,000 kg) vs Pressurized Science Rover (6,500 kg).</div>
              </div>

              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                ⚠️ <strong>Over-budget penalty:</strong> If total payload mass exceeds the rocket capacity, the launch computer will lock and prevent mission deployment.
              </div>
            </div>
          )}

          {activeTab === 'SURVIVAL' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#43ffa0', marginBottom: '10px' }}>
                Stage 2: Resource Survival &amp; The 354-Hour Lunar Night
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '14px' }}>
                The core simulation tracks 6 life-critical resource vectors on every single Sol:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', fontSize: '0.82rem' }}>
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700 }}>⚡ Power (0–100%)</div>
                  <div>Power runs base heating and oxygen scrubbers. If battery reaches 0%, thermal systems freeze and the mission fails!</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700 }}>💨 Oxygen (0–100%)</div>
                  <div>ECLSS produces O2. Sabatier loop recycles CO2. If O2 reaches 0%, crew suffocates.</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                  <div style={{ color: '#06b6d4', fontWeight: 700 }}>💧 Water (0–100%)</div>
                  <div>Urine distillation and condensate recovery sustain the water loop. Must stay above 0%.</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                  <div style={{ color: '#a78bfa', fontWeight: 700 }}>☢️ Radiation (&lt; 100 mSv)</div>
                  <div>Cosmic rays and solar flares accumulate. Above 100 mSv, acute radiation sickness incapacitates crew.</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '12px', borderRadius: '8px', color: '#38bdf8', fontSize: '0.85rem' }}>
                🌑 <strong>The Lunar Night Freeze:</strong> On Sols 16 through 27, the Moon enters 354 continuous hours of complete darkness (-130°C). Solar panels produce 0 kW! You must conserve battery and rely on stored reserves or a Kilopower nuclear reactor.
              </div>
            </div>
          )}

          {activeTab === 'ROVER' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', marginBottom: '10px' }}>
                Stage 3: Rover Tele-Robotic Science Missions
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '14px' }}>
                From Mission Control, click <strong>"Deploy Rover EVA"</strong> to take active manual control of the Lunar Terrain Vehicle (LTV):
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
                <div>• <strong>Controls:</strong> Arrow Keys or WASD to accelerate, reverse, and steer. (On-screen touch arrows also available).</div>
                <div>• <strong>Hazards:</strong> Avoid impact with deep crater rims and sharp boulders to protect wheel suspension.</div>
                <div>• <strong>Waypoints:</strong> Follow the radar bearing arrow to drill into Permanently Shadowed Regions (PSRs) to harvest volatile water ice cores!</div>
                <div>• <strong>Drilling:</strong> Stop in target zone and hold <strong>Space</strong> to drill and collect core samples.</div>
                <div>• <strong>Rewards:</strong> Samples collected directly transfer +35 to +80 Science Points and Cadet XP to your base!</div>
              </div>
            </div>
          )}

          {activeTab === 'SCORING' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa', marginBottom: '10px' }}>
                Stage 4: Mission Debrief &amp; Transparent Scoring
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '14px' }}>
                At the conclusion of your 30 Sols (or upon fatal emergency), the <strong>Accident Investigation Board (AIB)</strong> and NASA Flight Evaluation Council deliver your comprehensive debrief:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
                <div>• <strong>Victory:</strong> Survived all 30 Sols, achieved primary science benchmarks, and maintained crew health above 50%.</div>
                <div>• <strong>Partial Success:</strong> Base survived, but secondary scientific milestones or critical resource buffers were compromised.</div>
                <div>• <strong>Critical Failure:</strong> Any vital system collapsed (O2 = 0, Battery = 0, Water = 0, Radiation &ge; 100 mSv).</div>
                <div>• <strong>Root-Cause Chain Reaction:</strong> Review the explainable causal tree showing how earlier trade-offs influenced the final outcome!</div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
