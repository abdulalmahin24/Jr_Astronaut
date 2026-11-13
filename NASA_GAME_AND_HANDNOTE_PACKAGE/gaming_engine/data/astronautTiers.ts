export type AstronautAgeTier = 'cadet' | 'officer' | 'commander';

export interface TierConfig {
  id: AstronautAgeTier;
  label: string;
  ageRange: string;
  badge: string;
  tagline: string;
  description: string;
  nasaMissionContext: string;
  assistLevel: string;
  landingSpeedMax: number;
}

export const ASTRONAUT_TIERS: Record<AstronautAgeTier, TierConfig> = {
  cadet: {
    id: 'cadet',
    label: 'JUNIOR CADET',
    ageRange: 'Ages 6–10',
    badge: '🐣',
    tagline: 'NASA Artemis Discovery, Surface Exploration & Safe Guidance',
    description: 'Auto-Stabilized Flight Assist · Safe Fuel Reserve · Visual Trajectory Gates · Scientific Mineral Core Discovery',
    nasaMissionContext: 'NASA Artemis Lunar Base & xEMU Surface EVA',
    assistLevel: 'HIGH_ASSIST',
    landingSpeedMax: 8.5,
  },
  officer: {
    id: 'officer',
    label: 'FLIGHT OFFICER',
    ageRange: 'Ages 11–15',
    badge: '🚀',
    tagline: 'NASA SLS Multi-Stage Orbital Mechanics & Systems Integration',
    description: 'Tsiolkovsky Delta-V & Staging · Orion Power Bus & ECLSS O2 · Lunar Orbital Insertion Radar · Mineralogy',
    nasaMissionContext: 'NASA Space Launch System (SLS) & Orion Orbital Ascent',
    assistLevel: 'BALANCED_REALISM',
    landingSpeedMax: 5.0,
  },
  commander: {
    id: 'commander',
    label: 'MASTER COMMANDER',
    ageRange: 'Ages 16+ / STEM',
    badge: '⭐',
    tagline: 'Hardcore Newtonian Aerospace Physics & Planetary Defense',
    description: '6-DOF Newtonian Flight (Decoupled FA-OFF) · Atmospheric Thermal Ablation Corridor · AGC P66 Codes · Deep Space Anomaly Radar',
    nasaMissionContext: 'NASA Apollo Guidance Computer (AGC P66) & Interplanetary Orbital Injection',
    assistLevel: 'FULL_PHYSICS_NO_ASSIST',
    landingSpeedMax: 2.2,
  },
};

