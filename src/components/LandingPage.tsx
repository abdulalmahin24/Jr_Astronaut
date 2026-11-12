// ============================================================
// LandingPage.tsx — NASA Eyes on the Solar System (eyes.nasa.gov)
// Exact Fullscreen 3D Solar System Orrery, Real-time JPL Ephemeris,
// Spacecraft Fleet Tracker & Jr_AstroCamp Aerospace Command Hub
// Built for NASA Space Apps Challenge 2026
// ============================================================

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import '../nasa-eyes.css';
import {
  Play,
  Pause,
  FastForward,
  Rewind,
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  Search,
  Volume2,
  VolumeX,
  Music,
  Globe,
  Satellite,
  Sun,
  Layers,
  Sparkles,
  Info,
  Clock,
  Zap,
  CheckCircle2,
  Rocket,
  Gamepad2,
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Activity,
  Flame,
  X,
  ChevronRight,
  ExternalLink,
  Crosshair,
  Shield,
  Eye,
  Sliders,
  Menu,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { speechEngine } from '../utils/speechEngine';
import { spaceMusicEngine } from '../utils/spaceMusicEngine';
import { authService } from '../utils/authService';
import { studentActivityService } from '../utils/studentActivityService';
import { ASTRONAUT_CHARACTERS } from '../data/astronautCharacters';
import { ALL_76_NASA_MISSIONS, type PlayableNasaMission } from '../data/allNasaMissions';
import { getCadetProgression } from '../utils/simulationEngine';
import { getRankProgress } from '../data/astronautRanks';
import type { User } from '../types/auth';
import type { DifficultyMode } from '../types/game';
import { DestinationSelectionModal } from './DestinationSelectionModal';

type LearningHubTab = 'NOTEBOOK' | 'AUDIO' | 'VIDEO' | 'COMIC' | 'BRIEFINGS' | 'CATALOG';

export interface LandingPageProps {
  onEnter: () => void;
  onStartMission?: () => void;
  onContinueMission?: () => void;
  onBuildOutpost?: (dest: 'MOON' | 'MARS', difficulty?: DifficultyMode) => void;
  hasSavedGame?: boolean;
  savedGameSol?: number;
  savedGameDest?: string;
  onOpenAcademy?: () => void;
  onOpenRover?: () => void;
  onOpenHowToPlay?: () => void;
  onOpenSettings?: () => void;
  onOpenScienceHub?: () => void;
  onOpenCredits?: () => void;
  onOpenComics?: () => void;
  onOpenLearningHub?: (tab: LearningHubTab) => void;
  onOpenDepot?: () => void;
  onOpenClassroom?: () => void;
  currentUser?: User | null;
  onUserUpdate?: (updatedUser: User) => void;
  onOpenAuth?: () => void;
  onOpenJudgePreview?: () => void;
  onOpenTelemetry?: () => void;
  onOpenCertificate?: () => void;
  isJudgeMode?: boolean;
  onOpenOrrery?: () => void;
  onOpenMarsEDL?: () => void;
  onOpenTeacherGradebook?: () => void;
  onOpenCharacterLocker?: () => void;
  onOpenLiveActivity?: () => void;
  onOpenMultiplayerLobby?: () => void;
  onOpenMoonbaseAlpha?: () => void;
  onOpenBlackHole?: () => void;
  onOpenExpedition?: () => void;
  onOpenCampaign?: () => void;
  onOpenSpaceGamesHub?: () => void;
  mode?: 'background' | 'explore';
}

// ── CELESTIAL DATA TYPES ──────────────────────────────────────────────────
export interface PlanetData {
  id: string;
  name: string;
  color: number;
  emissive: number;
  radius: number;
  orbitRadius: number;
  distanceAU: string;
  actualAU: number;
  diameterKm: string;
  gravityMs2: string;
  surfaceTemp: string;
  atmosphere: string;
  moons: number;
  funFact: string;
  hasRings?: boolean;
  zone: string;
  orbitalPeriod: string;
  dayLength: string;
  discoveredBy: string;
  emoji: string;
  massKg: string;
  axialTilt: string;
  orbitalVelocityKms: string;
  interiorLayers: { name: string; depth: string; desc: string }[];
  atmosphereGases: { name: string; pct: number; color: string }[];
}

export interface SpaceStationData {
  id: string;
  name: string;
  agency: string;
  type: string;
  parentBody: 'earth' | 'moon';
  altitudeKm: number;
  velocityKms: number;
  crewCount: number;
  crewManifest: string;
  launchYear: number;
  status: 'Operational' | 'Active Transit' | 'Planned Construction';
  color: string;
  description: string;
  specs: { label: string; value: string }[];
}

export interface SolarMissionData {
  id: string;
  name: string;
  agency: string;
  type: string;
  trajectoryType: 'eccentric-solar' | 'lagrange-l1' | 'lagrange-l2' | 'interstellar' | 'mars-surface' | 'lunar-orbit';
  distanceFromSunAU: number;
  currentSpeedKms: number;
  lightDelayStr: string;
  color: string;
  missionObjective: string;
  keyAchievement: string;
  instruments: string[];
}

// ── PLANETARY DATA ROSTER (With Interior Structure & Atmosphere breakdown) ──
export const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    color: 0xc4cbd4,
    emissive: 0x64748b,
    radius: 2.2,
    orbitRadius: 20,
    distanceAU: '0.387 AU (57.9M km)',
    actualAU: 0.387,
    diameterKm: '4,879 km',
    gravityMs2: '3.7 m/s²',
    surfaceTemp: '-180°C to 430°C',
    atmosphere: 'Ultra-thin exosphere (Oxygen, Sodium, Hydrogen, Helium)',
    moons: 0,
    funFact: 'A year on Mercury is just 88 Earth days, but one solar day takes 176 Earth days! Its metallic core occupies 85% of its radius.',
    zone: 'Inner Rocky Planets',
    orbitalPeriod: '87.97 Earth Days',
    dayLength: '58.65 Earth Days',
    discoveredBy: 'Known since antiquity (Telescope: Galileo, 1631)',
    emoji: '☿️',
    massKg: '3.30 × 10²³ kg (0.055 Earths)',
    axialTilt: '0.034° (Nearly vertical)',
    orbitalVelocityKms: '47.4 km/s',
    interiorLayers: [
      { name: 'Solid Silicate Crust', depth: '35 km', desc: 'Thick basaltic silicate crust scarred by impact craters and lobate scarps.' },
      { name: 'Silicate Mantle', depth: '600 km', desc: 'Relatively thin silicate mantle surrounding colossal iron core.' },
      { name: 'Molten / Solid Iron Core', depth: '1,800 km', desc: 'Huge iron-nickel core driving an unexpected global magnetic field.' },
    ],
    atmosphereGases: [
      { name: 'Oxygen', pct: 42, color: '#38bdf8' },
      { name: 'Sodium', pct: 29, color: '#f59e0b' },
      { name: 'Hydrogen', pct: 22, color: '#a855f7' },
      { name: 'Helium', pct: 6, color: '#10b981' },
      { name: 'Potassium', pct: 1, color: '#f43f5e' },
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    color: 0xf59e0b,
    emissive: 0xd97706,
    radius: 2.8,
    orbitRadius: 30,
    distanceAU: '0.723 AU (108.2M km)',
    actualAU: 0.723,
    diameterKm: '12,104 km',
    gravityMs2: '8.87 m/s²',
    surfaceTemp: '465°C (Hottest in Solar System)',
    atmosphere: '96.5% Carbon Dioxide, Sulfuric Acid clouds, 92 bar surface pressure',
    moons: 0,
    funFact: 'Venus rotates in retrograde (clockwise) and so slowly that a day is longer than its year! Surface pressure equals 900m underwater on Earth.',
    zone: 'Inner Rocky Planets',
    orbitalPeriod: '224.7 Earth Days',
    dayLength: '243 Earth Days (Retrograde)',
    discoveredBy: 'Known since antiquity (Phases observed by Galileo, 1610)',
    emoji: '♀️',
    massKg: '4.87 × 10²⁴ kg (0.815 Earths)',
    axialTilt: '177.3° (Upside-down)',
    orbitalVelocityKms: '35.0 km/s',
    interiorLayers: [
      { name: 'Silicate Crust', depth: '50 km', desc: 'Basaltic crust dominated by volcanic plains and tessera terrain.' },
      { name: 'Rock Mantle', depth: '3,000 km', desc: 'Convecting silicate mantle; undergoes periodic global resurfacing events.' },
      { name: 'Iron-Nickel Core', depth: '3,000 km', desc: 'Partially molten metallic core without an active dynamo magnetic shield.' },
    ],
    atmosphereGases: [
      { name: 'Carbon Dioxide (CO₂)', pct: 96.5, color: '#ef4444' },
      { name: 'Nitrogen (N₂)', pct: 3.5, color: '#3b82f6' },
      { name: 'Sulfuric Acid / SO₂', pct: 0.1, color: '#eab308' },
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    color: 0x38bdf8,
    emissive: 0x0284c7,
    radius: 3.0,
    orbitRadius: 42,
    distanceAU: '1.000 AU (149.6M km)',
    actualAU: 1.000,
    diameterKm: '12,742 km',
    gravityMs2: '9.81 m/s²',
    surfaceTemp: '15°C Average (-89°C to 56.7°C)',
    atmosphere: '78.08% N₂, 20.95% O₂, 0.93% Ar, 0.04% CO₂ (Water vapor clouds)',
    moons: 1,
    funFact: 'The Goldilocks sanctuary of life. Possesses active plate tectonics, strong geodynamo magnetic shield, and 71% surface liquid oceans.',
    zone: 'Inner Rocky Planets (Habitable Zone)',
    orbitalPeriod: '365.25 Days',
    dayLength: '23 Hours 56 Minutes 4.1 Seconds',
    discoveredBy: 'Home Planet — Humanity',
    emoji: '🌍',
    massKg: '5.97 × 10²⁴ kg',
    axialTilt: '23.44° (Drives Seasons)',
    orbitalVelocityKms: '29.78 km/s',
    interiorLayers: [
      { name: 'Continental & Oceanic Crust', depth: '5–70 km', desc: 'Tectonically active plates carrying life and liquid hydrosphere.' },
      { name: 'Silicate Mantle', depth: '2,900 km', desc: 'Solid rock that flows over millions of years driving continental drift.' },
      { name: 'Liquid Outer Core', depth: '2,200 km', desc: 'Churning liquid iron-nickel generating the geodynamo magnetosphere.' },
      { name: 'Solid Inner Core', depth: '1,220 km', desc: 'Crystalline iron-nickel sphere hotter than the surface of the Sun.' },
    ],
    atmosphereGases: [
      { name: 'Nitrogen (N₂)', pct: 78.08, color: '#3b82f6' },
      { name: 'Oxygen (O₂)', pct: 20.95, color: '#06b6d4' },
      { name: 'Argon (Ar)', pct: 0.93, color: '#8b5cf6' },
      { name: 'Carbon Dioxide & Vapor', pct: 0.04, color: '#10b981' },
    ],
  },
  {
    id: 'moon',
    name: 'Moon',
    color: 0xc4cbd4,
    emissive: 0x475569,
    radius: 1.2,
    orbitRadius: 42,
    distanceAU: '1.000 AU (384,400 km from Earth)',
    actualAU: 1.000,
    diameterKm: '3,474 km',
    gravityMs2: '1.62 m/s² (0.166g)',
    surfaceTemp: '-130°C to 120°C (Polar traps <40 K)',
    atmosphere: 'Hard vacuum (<10⁻¹² Pa)',
    moons: 0,
    funFact: 'Target of the NASA Artemis Program! Shackleton Crater at the lunar South Pole features peaks of eternal light and cold traps containing water ice.',
    zone: 'Earth-Moon System (Artemis Base Camp Target)',
    orbitalPeriod: '27.3 Earth Days',
    dayLength: '29.5 Earth Days (708 Hours diurnal cycle)',
    discoveredBy: 'Humanity — Known since antiquity',
    emoji: '🌙',
    massKg: '7.34 × 10²² kg (0.0123 Earths)',
    axialTilt: '1.54°',
    orbitalVelocityKms: '1.02 km/s',
    interiorLayers: [
      { name: 'Regolith & Anorthosite Crust', depth: '50 km', desc: 'Thick highland anorthosite crust pulverized by billions of years of meteorite impacts.' },
      { name: 'Silicate Mantle', depth: '1,000 km', desc: 'Dense olivine-pyroxene mantle.' },
      { name: 'Metallic Iron Core', depth: '330 km', desc: 'Small partially molten iron-nickel core.' },
    ],
    atmosphereGases: [
      { name: 'Helium / Neon / Argon (Exosphere)', pct: 100, color: '#94a3b8' },
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    color: 0xf43f5e,
    emissive: 0xbe123c,
    radius: 2.4,
    orbitRadius: 56,
    distanceAU: '1.524 AU (227.9M km)',
    actualAU: 1.524,
    diameterKm: '6,779 km',
    gravityMs2: '3.72 m/s²',
    surfaceTemp: '-65°C Average (-140°C to 20°C)',
    atmosphere: '95.3% CO₂, 2.6% N₂, 1.9% Ar, 610 Pa surface pressure',
    moons: 2,
    funFact: 'Houses Olympus Mons (21 km tall, largest volcano) and Valles Marineris (4,000 km grand rift canyon). Target for NASA Artemis human exploration.',
    zone: 'Inner Rocky Planets',
    orbitalPeriod: '687 Earth Days (1.88 Earth Years)',
    dayLength: '24 Hours 37 Minutes 22 Seconds (1 Sol)',
    discoveredBy: 'Known since antiquity',
    emoji: '♂️',
    massKg: '6.42 × 10²³ kg (0.107 Earths)',
    axialTilt: '25.19°',
    orbitalVelocityKms: '24.07 km/s',
    interiorLayers: [
      { name: 'Basaltic Crust', depth: '50 km', desc: 'Rich in iron-oxide rust providing distinctive crimson hue.' },
      { name: 'Silicate Mantle', depth: '1,500 km', desc: 'Dormant mantle; ancient volcanic hotspots produced immense shield volcanoes.' },
      { name: 'Dense Iron-Sulfur Core', depth: '1,830 km', desc: 'Liquid iron core with sulfur; solidified dynamo shutdown allowed atmosphere loss.' },
    ],
    atmosphereGases: [
      { name: 'Carbon Dioxide (CO₂)', pct: 95.3, color: '#ef4444' },
      { name: 'Nitrogen (N₂)', pct: 2.6, color: '#3b82f6' },
      { name: 'Argon (Ar)', pct: 1.9, color: '#8b5cf6' },
      { name: 'Oxygen & Trace', pct: 0.2, color: '#06b6d4' },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    color: 0xfbbf24,
    emissive: 0xb45309,
    radius: 4.8,
    orbitRadius: 82,
    distanceAU: '5.204 AU (778.5M km)',
    actualAU: 5.204,
    diameterKm: '139,820 km',
    gravityMs2: '24.79 m/s²',
    surfaceTemp: '-110°C (Cloud deck)',
    atmosphere: '89.8% H₂, 10.2% He, ammonia cloud belts & lightning storm vortices',
    moons: 95,
    funFact: 'Has more mass than all other solar system planets combined (318 Earth masses). Great Red Spot storm has raged for >350 years.',
    zone: 'Gas Giants',
    orbitalPeriod: '11.86 Earth Years',
    dayLength: '9 Hours 55 Minutes 30 Seconds (Fastest spin)',
    discoveredBy: 'Known since antiquity (Galilean moons discovered 1610)',
    emoji: '♃',
    massKg: '1.90 × 10²⁷ kg (317.8 Earths)',
    axialTilt: '3.13°',
    orbitalVelocityKms: '13.07 km/s',
    interiorLayers: [
      { name: 'Gaseous Hydrogen/Helium Atmosphere', depth: '1,000 km', desc: 'Ammonia cloud decks, violent jet streams and Great Red Spot anticyclone.' },
      { name: 'Liquid Hydrogen Envelope', depth: '20,000 km', desc: 'Supercritical fluid state under thousands of atmospheres of pressure.' },
      { name: 'Metallic Liquid Hydrogen', depth: '40,000 km', desc: 'Electrically conductive liquid metal generating colossal magnetosphere.' },
      { name: 'Diffuse Heavy Element Core', depth: '10,000 km', desc: 'Dilute core of rock, metal, and ice fragments blended into metallic hydrogen.' },
    ],
    atmosphereGases: [
      { name: 'Hydrogen (H₂)', pct: 89.8, color: '#38bdf8' },
      { name: 'Helium (He)', pct: 10.2, color: '#a855f7' },
      { name: 'Methane & Ammonia', pct: 0.1, color: '#f59e0b' },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    color: 0xfde047,
    emissive: 0xa16207,
    radius: 4.2,
    orbitRadius: 110,
    distanceAU: '9.582 AU (1.433B km)',
    actualAU: 9.582,
    diameterKm: '116,460 km',
    gravityMs2: '10.44 m/s²',
    surfaceTemp: '-140°C',
    atmosphere: '96.3% H₂, 3.25% He, methane, ammonia ice haze',
    moons: 146,
    funFact: 'Crown jewel of rings extending 282,000 km across but only ~10 meters thin! Saturn is so light (density 0.687 g/cm³) it would float in water.',
    hasRings: true,
    zone: 'Gas Giants',
    orbitalPeriod: '29.46 Earth Years',
    dayLength: '10 Hours 33 Minutes 38 Seconds',
    discoveredBy: 'Known since antiquity (Galileo 1610, Rings by Huygens 1655)',
    emoji: '♄',
    massKg: '5.68 × 10²⁶ kg (95.2 Earths)',
    axialTilt: '26.73°',
    orbitalVelocityKms: '9.68 km/s',
    interiorLayers: [
      { name: 'Hydrogen Cloud Envelope', depth: '1,000 km', desc: 'Hazy yellow ammonia clouds with polar hexagonal jet stream.' },
      { name: 'Liquid Metallic Hydrogen', depth: '30,000 km', desc: 'Helium rain precipitates downward through metallic hydrogen toward the core.' },
      { name: 'Rock & Ice Dense Core', depth: '15,000 km', desc: 'Dense rocky core equivalent to 9–22 Earth masses.' },
    ],
    atmosphereGases: [
      { name: 'Hydrogen (H₂)', pct: 96.3, color: '#38bdf8' },
      { name: 'Helium (He)', pct: 3.25, color: '#a855f7' },
      { name: 'Methane & Trace', pct: 0.45, color: '#eab308' },
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    color: 0x67e8f9,
    emissive: 0x0e7490,
    radius: 3.2,
    orbitRadius: 136,
    distanceAU: '19.20 AU (2.872B km)',
    actualAU: 19.20,
    diameterKm: '50,724 km',
    gravityMs2: '8.69 m/s²',
    surfaceTemp: '-195°C to -224°C (Coldest atmosphere)',
    atmosphere: '82.5% H₂, 15.2% He, 2.3% Methane (gives brilliant cyan hue)',
    moons: 28,
    funFact: 'Extreme 97.77° axial tilt — effectively rolls on its side along its orbit! One pole gets 42 continuous years of sunlight followed by 42 years of dark.',
    zone: 'Ice Giants',
    orbitalPeriod: '84.01 Earth Years',
    dayLength: '17 Hours 14 Minutes 24 Seconds (Retrograde)',
    discoveredBy: 'William Herschel (March 13, 1781)',
    emoji: '⛢',
    massKg: '8.68 × 10²⁵ kg (14.5 Earths)',
    axialTilt: '97.77° (Horizontal)',
    orbitalVelocityKms: '6.80 km/s',
    interiorLayers: [
      { name: 'Upper Methane-Ammonia Atmosphere', depth: '600 km', desc: 'Cyan haze absorbing red sunlight.' },
      { name: 'Superheated Water-Ammonia Mantle', depth: '10,000 km', desc: 'Dense, hot, high-pressure fluid slush of water, ammonia, and methane.' },
      { name: 'Silicate/Iron-Nickel Rocky Core', depth: '4,000 km', desc: 'Small core with mass roughly 0.55 Earths.' },
    ],
    atmosphereGases: [
      { name: 'Hydrogen (H₂)', pct: 82.5, color: '#38bdf8' },
      { name: 'Helium (He)', pct: 15.2, color: '#a855f7' },
      { name: 'Methane (CH₄)', pct: 2.3, color: '#06b6d4' },
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    color: 0x3b82f6,
    emissive: 0x1d4ed8,
    radius: 3.1,
    orbitRadius: 162,
    distanceAU: '30.05 AU (4.495B km)',
    actualAU: 30.05,
    diameterKm: '49,244 km',
    gravityMs2: '11.15 m/s²',
    surfaceTemp: '-201°C',
    atmosphere: '80% H₂, 19% He, 1.5% Methane, supersonic jet streams >2,100 km/h',
    moons: 16,
    funFact: 'Most distant major planet. Discovered by mathematical prediction before ever being observed visually! Triton moon orbits backwards and erupts nitrogen geysers.',
    zone: 'Ice Giants',
    orbitalPeriod: '164.79 Earth Years',
    dayLength: '16 Hours 6 Minutes 36 Seconds',
    discoveredBy: 'Urbain Le Verrier & Johann Galle (September 23, 1846)',
    emoji: '♆',
    massKg: '1.02 × 10²⁶ kg (17.1 Earths)',
    axialTilt: '28.32°',
    orbitalVelocityKms: '5.43 km/s',
    interiorLayers: [
      { name: 'Upper Atmosphere & Cloud Belts', depth: '800 km', desc: 'Supersonic winds surpassing 2,100 km/h with cirrus methane cloud streaks.' },
      { name: 'Ionic Water-Ammonia Slush Ocean', depth: '12,000 km', desc: 'Superionic water exhibiting electrical conductivity; may form diamond hail.' },
      { name: 'Dense Iron-Silicate Core', depth: '5,000 km', desc: 'Rocky core with mass ~1.2 Earths.' },
    ],
    atmosphereGases: [
      { name: 'Hydrogen (H₂)', pct: 80.0, color: '#38bdf8' },
      { name: 'Helium (He)', pct: 19.0, color: '#a855f7' },
      { name: 'Methane (CH₄)', pct: 1.5, color: '#2563eb' },
    ],
  },
];

// ── SPACE STATIONS ────────────────────────────────────────────────────────
export const SPACE_STATIONS: SpaceStationData[] = [
  {
    id: 'iss',
    name: 'International Space Station (ISS)',
    agency: 'NASA / ESA / JAXA / CSA / Roscosmos',
    type: 'Modular Habitation Space Station',
    parentBody: 'earth',
    altitudeKm: 418.5,
    velocityKms: 7.66,
    crewCount: 7,
    crewManifest: 'Expedition 72 Crew',
    launchYear: 1998,
    status: 'Operational',
    color: '#38bdf8',
    description: 'Largest human-made laboratory in space. Continuous human occupation since Nov 2, 2000. Features 16 pressurized modules, Canadarm2, and 8 massive photovoltaic solar arrays.',
    specs: [
      { label: 'Altitude', value: '418.5 km (LEO)' },
      { label: 'Orbital Speed', value: '27,580 km/h (7.66 km/s)' },
      { label: 'Period', value: '92.68 minutes (~15.5 orbits/day)' },
      { label: 'Mass', value: '444,615 kg (970,000 lbs)' },
      { label: 'Solar Span', value: '109 meters (Full Football Field)' },
    ],
  },
  {
    id: 'tiangong',
    name: 'Tiangong Space Station (CSS)',
    agency: 'CMSA (China Manned Space Agency)',
    type: 'Permanent Multi-Module Orbital Lab',
    parentBody: 'earth',
    altitudeKm: 389.2,
    velocityKms: 7.67,
    crewCount: 3,
    crewManifest: 'Shenzhou Mission Crew (3 Taikonauts)',
    launchYear: 2021,
    status: 'Operational',
    color: '#f59e0b',
    description: 'T-shaped permanent multi-module space station consisting of Tianhe core module, Wentian laboratory, Mengtian science module, and flexible gallium arsenide solar wings.',
    specs: [
      { label: 'Altitude', value: '389.2 km (LEO)' },
      { label: 'Orbital Speed', value: '27,620 km/h (7.67 km/s)' },
      { label: 'Architecture', value: 'T-Shaped 3-Module Cluster' },
      { label: 'Core Module', value: 'Tianhe (16.6m length, 22.5 tonnes)' },
    ],
  },
  {
    id: 'lunar-gateway',
    name: 'Lunar Gateway (Artemis Hub)',
    agency: 'NASA / ESA / JAXA / CSA / MBRSC',
    type: 'Deep Space Cislunar Outpost',
    parentBody: 'moon',
    altitudeKm: 3000,
    velocityKms: 1.50,
    crewCount: 4,
    crewManifest: 'Artemis Astronaut Crew',
    launchYear: 2027,
    status: 'Planned Construction',
    color: '#a855f7',
    description: 'The international deep-space gateway orbiting the Moon in a Near-Rectilinear Halo Orbit (NRHO). Serves as a staging base for astronaut landings at the Lunar South Pole.',
    specs: [
      { label: 'Orbit Type', value: 'Near-Rectilinear Halo Orbit (NRHO)' },
      { label: 'Propulsion', value: 'PPE (50 kW Solar Electric Xenon Thruster)' },
      { label: 'Habitation', value: 'HALO (Habitation & Logistics Outpost)' },
      { label: 'Robotic System', value: 'Canadarm3 AI Autonomous Arm' },
    ],
  },
  {
    id: 'hubble',
    name: 'Hubble Space Telescope (HST)',
    agency: 'NASA / ESA',
    type: 'Great Observatory Satellite',
    parentBody: 'earth',
    altitudeKm: 535.0,
    velocityKms: 7.58,
    crewCount: 0,
    crewManifest: 'Autonomous Robotic Observatory',
    launchYear: 1990,
    status: 'Operational',
    color: '#06b6d4',
    description: 'The revolutionary space observatory operating in Low Earth Orbit since April 1990. Has made over 1.6 million astronomical observations.',
    specs: [
      { label: 'Altitude', value: '535 km' },
      { label: 'Primary Mirror', value: '2.4 meter (7.9 ft)' },
      { label: 'Observations Made', value: '> 1,600,000 Targets' },
    ],
  },
];

// ── SOLAR PROBES & DEEP SPACE FLEET ───────────────────────────────────────
export const SOLAR_MISSIONS: SolarMissionData[] = [
  {
    id: 'parker-solar-probe',
    name: 'Parker Solar Probe (PSP)',
    agency: 'NASA Goddard / JHU-APL',
    type: 'Extreme Heliophysics Probe',
    trajectoryType: 'eccentric-solar',
    distanceFromSunAU: 0.082,
    currentSpeedKms: 176.0,
    lightDelayStr: '41 Seconds',
    color: '#f97316',
    missionObjective: 'Plunge directly through the superheated solar corona to solve why the corona is 300x hotter than the solar surface and trace the supersonic solar wind.',
    keyAchievement: 'First human spacecraft to fly through the Sun’s upper atmosphere (Alfvén critical surface) at over 692,000 km/h.',
    instruments: ['FIELDS (EM Waves)', 'WISPR (Coronal Imager)', 'SWEAP (Solar Wind)', 'ISʘIS (Particles)'],
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope (JWST)',
    agency: 'NASA / ESA / CSA',
    type: 'Flagship Infrared Observatory',
    trajectoryType: 'lagrange-l2',
    distanceFromSunAU: 1.01,
    currentSpeedKms: 0.2,
    lightDelayStr: '5.0 Seconds',
    color: '#eab308',
    missionObjective: 'Unveil the cosmic dawn by observing the first galaxies formed after the Big Bang, study planetary formation, and analyze exoplanet atmospheres.',
    keyAchievement: 'Successfully unfolded 6.5m gold beryllium mirror and 5-layer tennis-court-sized sunshield at Sun-Earth L2 (1.5M km from Earth).',
    instruments: ['NIRCam', 'NIRSpec', 'MIRI', 'FGS/NIRISS'],
  },
  {
    id: 'perseverance',
    name: 'Perseverance Rover & Ingenuity',
    agency: 'NASA JPL',
    type: 'Mars Surface Astrobiology',
    trajectoryType: 'mars-surface',
    distanceFromSunAU: 1.524,
    currentSpeedKms: 24.1,
    lightDelayStr: '12 Minutes 35 Seconds',
    color: '#f43f5e',
    missionObjective: 'Seeking signs of ancient microbial life in Jezero Crater paleolake, caching sealed rock samples for Mars Sample Return, and generating O₂ via MOXIE.',
    keyAchievement: 'Cached 25 geological core samples; Ingenuity helicopter completed 72 powered flights in thin Martian air.',
    instruments: ['Mastcam-Z', 'SuperCam', 'PIXL', 'SHERLOC', 'MOXIE', 'RIMFAX Radar'],
  },
  {
    id: 'voyager-1',
    name: 'Voyager 1',
    agency: 'NASA JPL',
    type: 'Interstellar Cosmic Explorer',
    trajectoryType: 'interstellar',
    distanceFromSunAU: 163.4,
    currentSpeedKms: 17.0,
    lightDelayStr: '22 Hours 38 Minutes',
    color: '#34d399',
    missionObjective: 'First human-made machine to cross the Heliopause into true interstellar space. Currently sampling interstellar plasma and galactic cosmic rays.',
    keyAchievement: 'Farthest human object from Earth (>24.4 billion km). Launched in 1977, still communicating via NASA Deep Space Network.',
    instruments: ['CRS (Cosmic Ray)', 'MAG (Magnetometer)', 'PWS (Plasma Wave)'],
  },
];

// ── CELESTIAL EPHEMERIS ENGINE ────────────────────────────────────────────
function getJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function getPlanetHeliocentricAngle(planetId: string, jd: number): number {
  const d = jd - 2451545.0; // Days from J2000.0 epoch
  const rates: Record<string, { L0: number; n: number }> = {
    mercury: { L0: 252.25, n: 4.0923344 },
    venus: { L0: 181.98, n: 1.6021302 },
    earth: { L0: 100.46, n: 0.9856474 },
    mars: { L0: 355.45, n: 0.5240330 },
    jupiter: { L0: 34.40, n: 0.0830853 },
    saturn: { L0: 49.94, n: 0.0334442 },
    uranus: { L0: 313.23, n: 0.0117283 },
    neptune: { L0: 304.88, n: 0.0059810 },
  };
  const r = rates[planetId] || { L0: 0, n: 1 };
  const deg = (r.L0 + r.n * d) % 360;
  return (deg * Math.PI) / 180;
}

// ── 3D MODEL BUILDERS ─────────────────────────────────────────────────────
function createSaturnRingGeometry(innerRadius: number, outerRadius: number): THREE.BufferGeometry {
  const geo = new THREE.RingGeometry(innerRadius, outerRadius, 128);
  const pos = geo.attributes.position;
  const uvs = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const u = (r - innerRadius) / (outerRadius - innerRadius);
    uvs.setXY(i, u, 0.5);
  }
  uvs.needsUpdate = true;
  return geo;
}

function createTextSprite(
  text: string,
  _color?: string,
  isCompact: boolean = false
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2.5);

  const baseW = 512;
  const baseH = 128;
  canvas.width = Math.round(baseW * dpr);
  canvas.height = Math.round(baseH * dpr);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, baseW, baseH);

  // Bold 30-32px white text with thick dark outline (crisp readable NASA typography)
  ctx.font = 'bold 32px "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Thick dark outline for readability against space, stars, and planetary discs
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeText(text, baseW / 2, baseH / 2);

  // Crisp pure white fill
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, baseW / 2, baseH / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);

  // Base world scale ensuring text appears at least 14px-20px tall on screen
  const baseScaleY = isCompact ? 4.2 : 5.4;
  const baseScaleX = baseScaleY * (baseW / baseH);
  sprite.scale.set(baseScaleX, baseScaleY, 1);
  sprite.userData = { baseScaleX, baseScaleY };
  return sprite;
}

function createRealisticISSMesh(): THREE.Group {
  const group = new THREE.Group();
  const trussGeo = new THREE.BoxGeometry(7.8, 0.22, 0.22);
  const trussMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 });
  group.add(new THREE.Mesh(trussGeo, trussMat));

  const moduleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.65, roughness: 0.3 });
  const centralModuleGeo = new THREE.CylinderGeometry(0.42, 0.42, 2.8, 18);
  const central = new THREE.Mesh(centralModuleGeo, moduleMat);
  central.rotation.x = Math.PI / 2;
  group.add(central);

  const wingGeo = new THREE.BoxGeometry(0.95, 2.1, 0.03);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0x1e3a8a, emissiveIntensity: 0.55 });
  const offsets = [-3.3, -2.3, 2.3, 3.3];
  offsets.forEach((xOff) => {
    const w1 = new THREE.Mesh(wingGeo, wingMat);
    w1.position.set(xOff, 1.25, 0);
    group.add(w1);
    const w2 = new THREE.Mesh(wingGeo, wingMat);
    w2.position.set(xOff, -1.25, 0);
    group.add(w2);
  });

  group.scale.set(0.4, 0.4, 0.4);
  return group;
}

function createRealisticTiangongMesh(): THREE.Group {
  const group = new THREE.Group();
  const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.6, 18);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6, roughness: 0.28 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = Math.PI / 2;
  group.add(core);

  const labGeo = new THREE.CylinderGeometry(0.44, 0.44, 2.1, 16);
  const lab1 = new THREE.Mesh(labGeo, coreMat);
  lab1.rotation.z = Math.PI / 2;
  lab1.position.set(-1.25, 0, 0.35);
  const lab2 = new THREE.Mesh(labGeo, coreMat);
  lab2.rotation.z = Math.PI / 2;
  lab2.position.set(1.25, 0, 0.35);
  group.add(lab1);
  group.add(lab2);

  const solarGeo = new THREE.BoxGeometry(0.75, 2.4, 0.03);
  const solarMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x92400e, emissiveIntensity: 0.45 });
  const sWing1 = new THREE.Mesh(solarGeo, solarMat);
  sWing1.position.set(-2.65, 0, 0.35);
  const sWing2 = new THREE.Mesh(solarGeo, solarMat);
  sWing2.position.set(2.65, 0, 0.35);
  group.add(sWing1);
  group.add(sWing2);

  group.scale.set(0.38, 0.38, 0.38);
  return group;
}

function createRealisticProbeMesh(colorHex: number): THREE.Group {
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1.2, 1.2, 1.6);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  const dishGeo = new THREE.ConeGeometry(1.4, 0.4, 24, 1, true);
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.4, roughness: 0.3 });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.rotation.x = Math.PI;
  dish.position.z = 1.1;
  group.add(dish);

  const solarGeo = new THREE.BoxGeometry(3.2, 0.8, 0.04);
  const solarMat = new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.3 });
  const s1 = new THREE.Mesh(solarGeo, solarMat);
  s1.position.x = 2.4;
  const s2 = new THREE.Mesh(solarGeo, solarMat);
  s2.position.x = -2.4;
  group.add(s1);
  group.add(s2);

  group.scale.set(0.32, 0.32, 0.32);
  return group;
}

// ── COMPONENT IMPLEMENTATION ──────────────────────────────────────────────
export const LandingPage: React.FC<LandingPageProps> = ({
  onEnter,
  onStartMission,
  onContinueMission,
  onBuildOutpost,
  hasSavedGame = false,
  savedGameSol = 1,
  savedGameDest = 'Moon',
  onOpenAcademy,
  onOpenRover,
  onOpenHowToPlay: _onOpenHowToPlay,
  onOpenSettings: _onOpenSettings,
  onOpenScienceHub: _onOpenScienceHub,
  onOpenCredits,
  onOpenComics,
  onOpenLearningHub,
  onOpenDepot,
  onOpenClassroom,
  currentUser,
  onUserUpdate,
  onOpenAuth,
  onOpenJudgePreview,
  onOpenTelemetry,
  onOpenCertificate,
  isJudgeMode: _isJudgeMode = false,
  onOpenOrrery: _onOpenOrrery,
  onOpenMarsEDL,
  onOpenTeacherGradebook: _onOpenTeacherGradebook,
  onOpenCharacterLocker,
  onOpenLiveActivity: _onOpenLiveActivity,
  onOpenMultiplayerLobby,
  onOpenMoonbaseAlpha,
  onOpenBlackHole,
  onOpenExpedition,
  onOpenCampaign,
  onOpenSpaceGamesHub,
  mode = 'explore',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Simulation Ephemeris & Time
  const [simDate, setSimDate] = useState<Date>(() => new Date());
  const [currentJD, setCurrentJD] = useState<number>(() => getJulianDate(new Date()));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1 = Real-time, 10, 100, 1000, 10000
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(true);

  // Visual Display Toggles
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showAsteroids, setShowAsteroids] = useState<boolean>(true);
  const [showSpacecraft, setShowSpacecraft] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<'sun' | 'flood'>('sun');
  const [is2DMode, setIs2DMode] = useState<boolean>(false);
  const [isCommandDeckExpanded, setIsCommandDeckExpanded] = useState<boolean>(true);

  // Selection & Sidebar
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'planet' | 'station' | 'mission';
    data: PlanetData | SpaceStationData | SolarMissionData;
  } | null>({ type: 'planet', data: PLANETS[2] }); // Default to Earth
  const [drawerTab, setDrawerTab] = useState<'overview' | 'indepth' | 'numbers' | 'missions' | 'compare'>('overview');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [cameraTarget, setCameraTarget] = useState<string>('sun');
  const [isTargetLocked, setIsTargetLocked] = useState<boolean>(false);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDestModalOpen, setIsDestModalOpen] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'inner' | 'outer' | 'fleet' | 'tours'>('all');
  const [isSimulatorsDropdownOpen, setIsSimulatorsDropdownOpen] = useState<boolean>(false);
  const [isStoriesModalOpen, setIsStoriesModalOpen] = useState<boolean>(false);
  const [isHeroDismissed, setIsHeroDismissed] = useState<boolean>(false);

  // Hover Tooltip
  const [hoverEntity, setHoverEntity] = useState<{ name: string; subtitle: string; x: number; y: number } | null>(null);

  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => spaceMusicEngine.getIsMuted());

  // Size Comparison Slider
  const [compareScale, setCompareScale] = useState<number>(1);

  // Cadet Progression
  const [cadetProg] = useState(() => getCadetProgression());
  const rankInfo = getRankProgress(cadetProg.xp);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; label: THREE.Sprite; clouds?: THREE.Mesh; moons?: { mesh: THREE.Mesh; label?: THREE.Sprite; angle: number; speed: number; orbitRadius: number }[]; orbitRadius: number; angle: number }>>(new Map());
  const stationMeshesRef = useRef<Map<string, { group: THREE.Group; label: THREE.Sprite; parentId: string; orbitRadius: number; angle: number; orbitSpeed: number }>>(new Map());
  const probeMeshesRef = useRef<Map<string, { group: THREE.Group; label: THREE.Sprite; distanceAU: number }>>(new Map());
  const orbitLinesRef = useRef<THREE.Line[]>([]);
  const asteroidPointsRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const sunLabelRef = useRef<THREE.Sprite | null>(null);

  // Refs for animation loop
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const simSpeedRef = useRef(simSpeed);
  simSpeedRef.current = simSpeed;
  const simDateRef = useRef(simDate);
  simDateRef.current = simDate;
  const lastUiUpdateRef = useRef<number>(Date.now());
  const cameraTargetRef = useRef(cameraTarget);
  cameraTargetRef.current = cameraTarget;
  const isTargetLockedRef = useRef(isTargetLocked);
  isTargetLockedRef.current = isTargetLocked;

  // Camera Orbit Interaction Variables
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const camThetaRef = useRef(0.45);
  const camPhiRef = useRef(1.12);
  const camDistanceRef = useRef(135);
  const camTargetPosRef = useRef(new THREE.Vector3(0, 0, 0));

  // ── SPEECH SYNTHESIS HELPER ───────────────────────────────────────────────
  const handleReadAloud = (text: string) => {
    soundFx.playTelemetryChirp();
    speechEngine.speak(text, 'HOUSTON_CAPCOM');
  };

  // ── FILTERED SEARCH SUGGESTIONS ──────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { id: string; name: string; type: string; category: 'planet' | 'station' | 'mission' | 'game' | 'simulator'; icon: string }[] = [];

    PLANETS.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q)) {
        results.push({ id: p.id, name: p.name, type: p.zone, category: 'planet', icon: '🪐' });
      }
    });

    SPACE_STATIONS.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.agency.toLowerCase().includes(q)) {
        results.push({ id: s.id, name: s.name, type: s.agency, category: 'station', icon: '🛰️' });
      }
    });

    SOLAR_MISSIONS.forEach((m) => {
      if (m.name.toLowerCase().includes(q) || m.missionObjective.toLowerCase().includes(q)) {
        results.push({ id: m.id, name: m.name, type: m.type, category: 'mission', icon: '🚀' });
      }
    });

    ALL_76_NASA_MISSIONS.slice(0, 30).forEach((gm) => {
      if (gm.name.toLowerCase().includes(q) || gm.destinationName.toLowerCase().includes(q)) {
        results.push({ id: gm.id, name: gm.name, type: `${gm.destinationName} Flight`, category: 'game', icon: '🎮' });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery]);

  // ── TARGET FOCUS HANDLER ──────────────────────────────────────────────────
  const flyToTarget = useCallback((targetId: string) => {
    setCameraTarget(targetId);
    setIsTargetLocked(true);
    soundFx.playClick(850);

    const planet = PLANETS.find((p) => p.id === targetId);
    if (planet) {
      setSelectedEntity({ type: 'planet', data: planet });
      setIsDrawerOpen(true);
      camDistanceRef.current = Math.max(planet.radius * 6, 24);
      return;
    }

    const station = SPACE_STATIONS.find((s) => s.id === targetId);
    if (station) {
      setSelectedEntity({ type: 'station', data: station });
      setIsDrawerOpen(true);
      camDistanceRef.current = 14;
      return;
    }

    const mission = SOLAR_MISSIONS.find((m) => m.id === targetId);
    if (mission) {
      setSelectedEntity({ type: 'mission', data: mission });
      setIsDrawerOpen(true);
      camDistanceRef.current = 16;
      return;
    }

    if (targetId === 'sun') {
      camDistanceRef.current = 140;
    }
  }, []);

  // ── RESET CAMERA VIEW ────────────────────────────────────────────────────
  const handleResetCamera = () => {
    setCameraTarget('sun');
    setIsTargetLocked(false);
    camThetaRef.current = 0.4;
    camPhiRef.current = 1.1;
    camDistanceRef.current = 180;
    camTargetPosRef.current.set(0, 0, 0);
    soundFx.playTelemetryChirp();
  };

  // ── LIVE EPHEMERIS SYNC ──────────────────────────────────────────────────
  const syncToNow = () => {
    const now = new Date();
    setSimDate(now);
    setCurrentJD(getJulianDate(now));
    setIsLiveSynced(true);
    soundFx.playClick(900);
  };

  // ── THREE.JS SCENE INITIALIZATION ────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 4000);
    camera.position.set(0, 110, 180);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. High-Fidelity Scientific Lighting
    const ambientLight = new THREE.AmbientLight(0x94a3b8, lightingMode === 'flood' ? 1.8 : 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfffbeb, 4.2, 1200, 0.35);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // 3. Texture Loading
    const texLoader = new THREE.TextureLoader();
    const textures = {
      sun: texLoader.load('/assets/planets/2k_sun.jpg'),
      stars: texLoader.load('/assets/planets/2k_stars_milky_way.jpg'),
      mercury: texLoader.load('/assets/planets/2k_mercury.jpg'),
      venusAtm: texLoader.load('/assets/planets/2k_venus_atmosphere.jpg'),
      earthDay: texLoader.load('/assets/planets/2k_earth_daymap.jpg'),
      earthNight: texLoader.load('/assets/planets/2k_earth_nightmap.jpg'),
      earthClouds: texLoader.load('/assets/planets/2k_earth_clouds.jpg'),
      moon: texLoader.load('/assets/planets/2k_moon.jpg'),
      mars: texLoader.load('/assets/planets/2k_mars.jpg'),
      jupiter: texLoader.load('/assets/planets/2k_jupiter.jpg'),
      saturn: texLoader.load('/assets/planets/2k_saturn.jpg'),
      saturnRing: texLoader.load('/assets/planets/2k_saturn_ring_alpha.png'),
      uranus: texLoader.load('/assets/planets/2k_uranus.jpg'),
      neptune: texLoader.load('/assets/planets/2k_neptune.jpg'),
    };

    Object.values(textures).forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    });

    // 4. Milky Way Celestial Sky Sphere & Starfield
    const skyGeo = new THREE.SphereGeometry(2200, 48, 48);
    const skyMat = new THREE.MeshBasicMaterial({ map: textures.stars, side: THREE.BackSide, depthWrite: false });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Twinkling Starfield Points
    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 2000;
      starPos[i + 1] = (Math.random() - 0.5) * 2000;
      starPos[i + 2] = (Math.random() - 0.5) * 2000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ size: 1.5, color: 0xffffff, transparent: true, opacity: 0.85 });
    scene.add(new THREE.Points(starGeo, starMat));

    // 5. Blazing Sun Mesh & Corona Layers
    const sunGeo = new THREE.SphereGeometry(7.2, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ map: textures.sun });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    const coronaGeo = new THREE.SphereGeometry(10.5, 48, 48);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    scene.add(coronaMesh);

    // Sun Name Label (Visible by default)
    const sunLabel = createTextSprite('SUN', '#f59e0b', false);
    sunLabel.position.set(0, 11.4, 0);
    sunLabel.visible = showLabels;
    scene.add(sunLabel);
    sunLabelRef.current = sunLabel;

    // 6. Build Planets & Orbits
    const initialJD = getJulianDate(new Date());
    const orbitLines: THREE.Line[] = [];

    PLANETS.forEach((planet) => {
      // Orbit Line Ellipse
      const orbitCurve = new THREE.EllipseCurve(0, 0, planet.orbitRadius, planet.orbitRadius, 0, 2 * Math.PI, false, 0);
      const points = orbitCurve.getPoints(140);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x, 0, p.y)));
      const orbitMat = new THREE.LineBasicMaterial({
        color: planet.color,
        transparent: true,
        opacity: 0.24,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.visible = showOrbits;
      scene.add(orbitLine);
      orbitLines.push(orbitLine);

      // Planet Mesh
      const pGeo = new THREE.SphereGeometry(planet.radius, 48, 48);
      let pMat: THREE.Material;

      if (planet.id === 'earth') {
        pMat = new THREE.MeshStandardMaterial({ map: textures.earthDay, roughness: 0.45, metalness: 0.1 });
      } else if (planet.id === 'jupiter') {
        pMat = new THREE.MeshStandardMaterial({ map: textures.jupiter, roughness: 0.6 });
      } else if (planet.id === 'saturn') {
        pMat = new THREE.MeshStandardMaterial({ map: textures.saturn, roughness: 0.6 });
      } else if (planet.id === 'mars') {
        pMat = new THREE.MeshStandardMaterial({ map: textures.mars, roughness: 0.7 });
      } else if (planet.id === 'venus') {
        pMat = new THREE.MeshStandardMaterial({ map: textures.venusAtm, roughness: 0.5 });
      } else if (planet.id === 'mercury') {
        pMat = new THREE.MeshStandardMaterial({ map: textures.mercury, roughness: 0.8 });
      } else if (planet.id === 'uranus') {
        pMat = new THREE.MeshStandardMaterial({ map: textures.uranus, roughness: 0.5 });
      } else if (planet.id === 'neptune') {
        pMat = new THREE.MeshStandardMaterial({ map: textures.neptune, roughness: 0.5 });
      } else {
        pMat = new THREE.MeshStandardMaterial({ color: planet.color, roughness: 0.5 });
      }

      const pMesh = new THREE.Mesh(pGeo, pMat);
      const angle = getPlanetHeliocentricAngle(planet.id, initialJD);
      pMesh.position.set(Math.cos(angle) * planet.orbitRadius, 0, Math.sin(angle) * planet.orbitRadius);
      pMesh.name = planet.id;
      scene.add(pMesh);

      // Clouds for Earth
      let cloudsMesh: THREE.Mesh | undefined;
      if (planet.id === 'earth') {
        const cGeo = new THREE.SphereGeometry(planet.radius * 1.025, 48, 48);
        const cMat = new THREE.MeshStandardMaterial({
          map: textures.earthClouds,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
        });
        cloudsMesh = new THREE.Mesh(cGeo, cMat);
        pMesh.add(cloudsMesh);

      }

      // Rings for Saturn
      if (planet.hasRings) {
        const ringGeo = createSaturnRingGeometry(planet.radius * 1.35, planet.radius * 2.5);
        const ringMat = new THREE.MeshStandardMaterial({
          map: textures.saturnRing,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          roughness: 0.4,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2 + 0.45;
        pMesh.add(ringMesh);
      }

      // Billboard Text Label (Clean bold white text with dark outline)
      const label = createTextSprite(planet.name.toUpperCase(), `#${planet.color.toString(16).padStart(6, '0')}`, false);
      label.position.copy(pMesh.position);
      label.position.y += planet.radius + 3.8;
      label.visible = showLabels;
      scene.add(label);

      // Moons (Earth Moon & Galilean Moons)
      const moonsList: { mesh: THREE.Mesh; label?: THREE.Sprite; angle: number; speed: number; orbitRadius: number }[] = [];
      if (planet.id === 'earth') {
        const mGeo = new THREE.SphereGeometry(0.82, 24, 24);
        const mMat = new THREE.MeshStandardMaterial({ map: textures.moon, roughness: 0.8 });
        const moonMesh = new THREE.Mesh(mGeo, mMat);
        moonMesh.name = 'moon';
        scene.add(moonMesh);

        // Dedicated Moon label
        const moonLabel = createTextSprite('MOON', '#cbd5e1', true);
        moonLabel.visible = showLabels;
        scene.add(moonLabel);

        moonsList.push({ mesh: moonMesh, label: moonLabel, angle: 0, speed: 2.2, orbitRadius: 6.2 });
      }

      planetMeshesRef.current.set(planet.id, {
        mesh: pMesh,
        label,
        clouds: cloudsMesh,
        moons: moonsList,
        orbitRadius: planet.orbitRadius,
        angle,
      });
    });
    orbitLinesRef.current = orbitLines;

    // 7. Space Stations (ISS, Tiangong around Earth; Gateway around Moon)
    SPACE_STATIONS.forEach((station) => {
      let stationGroup: THREE.Group;
      if (station.id === 'iss') {
        stationGroup = createRealisticISSMesh();
      } else if (station.id === 'tiangong') {
        stationGroup = createRealisticTiangongMesh();
      } else {
        stationGroup = createRealisticProbeMesh(0xa855f7);
      }

      stationGroup.name = station.id;
      scene.add(stationGroup);

      const label = createTextSprite(station.name, station.color, true);
      label.visible = false;
      scene.add(label);

      stationMeshesRef.current.set(station.id, {
        group: stationGroup,
        label,
        parentId: station.parentBody,
        orbitRadius: station.id === 'iss' ? 4.5 : station.id === 'tiangong' ? 5.2 : 2.8,
        angle: Math.random() * Math.PI * 2,
        orbitSpeed: station.id === 'iss' ? 3.5 : 3.8,
      });
    });

    // 8. Solar Missions & Interstellar Probes
    SOLAR_MISSIONS.forEach((probe) => {
      const probeGroup = createRealisticProbeMesh(parseInt(probe.color.replace('#', '0x')));
      probeGroup.name = probe.id;
      scene.add(probeGroup);

      const label = createTextSprite(probe.name, probe.color, true);
      label.visible = false;
      scene.add(label);

      let rad = probe.distanceFromSunAU * 38;
      if (probe.id === 'parker-solar-probe') rad = 11.5;
      if (probe.id === 'jwst') rad = 46.5;
      if (probe.id === 'perseverance') rad = 56.2;
      if (probe.id === 'voyager-1') rad = 195.0;

      const angle = (probe.distanceFromSunAU * 1.5) % (Math.PI * 2);
      probeGroup.position.set(Math.cos(angle) * rad, 1.2, Math.sin(angle) * rad);
      label.position.set(probeGroup.position.x, probeGroup.position.y + 3.2, probeGroup.position.z);

      probeMeshesRef.current.set(probe.id, {
        group: probeGroup,
        label,
        distanceAU: probe.distanceFromSunAU,
      });
    });

    // 9. Asteroid Belt Particles
    const astCount = 450;
    const astGeo = new THREE.BufferGeometry();
    const astPos = new Float32Array(astCount * 3);
    for (let i = 0; i < astCount * 3; i += 3) {
      const r = 67 + Math.random() * 11;
      const th = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4.5;
      astPos[i] = Math.cos(th) * r;
      astPos[i + 1] = y;
      astPos[i + 2] = Math.sin(th) * r;
    }
    astGeo.setAttribute('position', new THREE.BufferAttribute(astPos, 3));
    const astMat = new THREE.PointsMaterial({ size: 1.1, color: 0xc4cbd4, transparent: true, opacity: 0.55 });
    const astMesh = new THREE.Points(astGeo, astMat);
    scene.add(astMesh);
    asteroidPointsRef.current = astMesh;

    // 10. Pointer & Mouse Event Listeners for Free Orbit & Click
    const dom = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      // Raycaster for Hover Reticle
      const rect = dom.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes: THREE.Object3D[] = [];
      planetMeshesRef.current.forEach((val) => meshes.push(val.mesh));
      stationMeshesRef.current.forEach((val) => meshes.push(val.group));
      probeMeshesRef.current.forEach((val) => meshes.push(val.group));

      const hits = raycasterRef.current.intersectObjects(meshes, true);
      if (hits.length > 0) {
        let hitObj: THREE.Object3D | null = hits[0].object;
        while (hitObj && !hitObj.name && hitObj.parent && hitObj.parent !== scene) {
          hitObj = hitObj.parent;
        }
        const nameId = hitObj?.name;
        const matchedPlanet = PLANETS.find((p) => p.id === nameId);
        const matchedStation = SPACE_STATIONS.find((s) => s.id === nameId);
        const matchedProbe = SOLAR_MISSIONS.find((m) => m.id === nameId);

        if (matchedPlanet) {
          setHoverEntity({ name: matchedPlanet.name, subtitle: `${matchedPlanet.distanceAU} · ${matchedPlanet.zone}`, x: e.clientX, y: e.clientY });
        } else if (matchedStation) {
          setHoverEntity({ name: matchedStation.name, subtitle: `${matchedStation.altitudeKm} km · ${matchedStation.agency}`, x: e.clientX, y: e.clientY });
        } else if (matchedProbe) {
          setHoverEntity({ name: matchedProbe.name, subtitle: `${matchedProbe.distanceFromSunAU} AU · ${matchedProbe.agency}`, x: e.clientX, y: e.clientY });
        }
      } else {
        setHoverEntity(null);
      }

      if (!isDraggingRef.current) return;
      const dx = e.clientX - previousMousePositionRef.current.x;
      const dy = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      camThetaRef.current -= dx * 0.005;
      camPhiRef.current = Math.max(0.12, Math.min(Math.PI - 0.12, camPhiRef.current - dy * 0.005));
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camDistanceRef.current = Math.max(12, Math.min(800, camDistanceRef.current + e.deltaY * 0.15));
    };

    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycasterRef.current.setFromCamera(clickMouse, camera);

      const checkList: THREE.Object3D[] = [];
      planetMeshesRef.current.forEach((val) => {
        checkList.push(val.mesh);
        if (val.moons) {
          val.moons.forEach((m) => checkList.push(m.mesh));
        }
      });
      stationMeshesRef.current.forEach((val) => checkList.push(val.group));
      probeMeshesRef.current.forEach((val) => checkList.push(val.group));

      const hits = raycasterRef.current.intersectObjects(checkList, true);
      if (hits.length > 0) {
        let hitObj: THREE.Object3D | null = hits[0].object;
        while (hitObj && !hitObj.name && hitObj.parent && hitObj.parent !== scene) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.name) {
          flyToTarget(hitObj.name);
        }
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);

    // 11. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Rotate Sun
      sunMesh.rotation.y += 0.002;
      coronaMesh.rotation.y -= 0.001;

      // Advance Simulation Ephemeris
      const isPlayingCur = isPlayingRef.current;
      const speedCur = simSpeedRef.current;

      if (isPlayingCur) {
        // At 1x speed, advance time in real-time seconds (delta * 1000 ms) so today's date remains accurate
        // Only scale to days/hours when user clicks 10x, 100x, or 1k speed buttons
        const msAdvance = speedCur === 1
          ? delta * 1000
          : speedCur === 10
          ? delta * 3600000 // 1 hour per sec
          : speedCur === 100
          ? delta * 86400000 // 1 day per sec
          : delta * 864000000; // 10 days per sec

        simDateRef.current = new Date(simDateRef.current.getTime() + msAdvance);
        const newJD = getJulianDate(simDateRef.current);
        setCurrentJD(newJD);

        const nowMs = Date.now();
        if (nowMs - lastUiUpdateRef.current >= 350) {
          lastUiUpdateRef.current = nowMs;
          setSimDate(new Date(simDateRef.current));
        }

        const targetIdCur = cameraTargetRef.current;
        const isZoomedIn = camDistanceRef.current <= 85;
        const innerPlanets = ['mercury', 'venus', 'earth', 'moon', 'mars'];
        const dist = camDistanceRef.current;
        const scaleFactor = Math.max(0.85, Math.min(2.5, dist / 80));

        // Update Sun Name Label (Hidden in background mode)
        if (sunLabelRef.current) {
          const sunBaseX = sunLabelRef.current.userData.baseScaleX || 21.6;
          const sunBaseY = sunLabelRef.current.userData.baseScaleY || 5.4;
          sunLabelRef.current.scale.set(sunBaseX * scaleFactor, sunBaseY * scaleFactor, 1);
          sunLabelRef.current.visible = mode === 'background' ? false : Boolean(showLabels && targetIdCur !== 'sun');
        }

        // Update Heliocentric Planet Positions
        planetMeshesRef.current.forEach((val, id) => {
          const angle = getPlanetHeliocentricAngle(id, newJD);
          val.angle = angle;
          val.mesh.position.x = Math.cos(angle) * val.orbitRadius;
          val.mesh.position.z = Math.sin(angle) * val.orbitRadius;
          val.mesh.rotation.y += 0.015;

          if (val.clouds) val.clouds.rotation.y += 0.003;

          // Moons orbit planet
          if (val.moons) {
            val.moons.forEach((m) => {
              m.angle += delta * m.speed;
              m.mesh.position.x = val.mesh.position.x + Math.cos(m.angle) * m.orbitRadius;
              m.mesh.position.y = val.mesh.position.y;
              m.mesh.position.z = val.mesh.position.z + Math.sin(m.angle) * m.orbitRadius;
              m.mesh.rotation.y += 0.02;

              if (m.label) {
                const mScale = Math.max(0.75, Math.min(2.2, dist / 85));
                m.label.scale.set(
                  (m.label.userData.baseScaleX || 16.8) * mScale,
                  (m.label.userData.baseScaleY || 4.2) * mScale,
                  1
                );
                // Staggered below Moon to prevent stacking collision with Earth label above
                m.label.position.set(m.mesh.position.x, m.mesh.position.y - 3.0, m.mesh.position.z);
                const isMoonSelectedOrHovered = targetIdCur === 'moon' || Boolean(hoverEntity && hoverEntity.name.toLowerCase().includes('moon'));
                m.label.visible = mode === 'background' ? false : Boolean(showLabels && (isZoomedIn || isMoonSelectedOrHovered));
              }
            });
          }

          // Scale sprite so text appears at least 14px-22px tall on screen
          const pBaseX = val.label.userData.baseScaleX || 21.6;
          const pBaseY = val.label.userData.baseScaleY || 5.4;
          val.label.scale.set(pBaseX * scaleFactor, pBaseY * scaleFactor, 1);

          // Sync label with staggered collision avoidance offsets
          val.label.position.copy(val.mesh.position);
          let yOffset = 3.6;
          if (id === 'mercury') yOffset = 2.4;
          else if (id === 'venus') yOffset = 4.2;
          else if (id === 'earth') yOffset = 3.4;
          else if (id === 'mars') yOffset = 3.8;
          else if (id === 'jupiter') yOffset = 5.5;
          else if (id === 'saturn') yOffset = 4.8;
          else if (id === 'uranus') yOffset = 4.0;
          else if (id === 'neptune') yOffset = 3.8;

          val.label.position.y += (val.mesh.geometry as THREE.SphereGeometry).parameters.radius + yOffset;
          const isInspectingThisPlanet = targetIdCur === id && camDistanceRef.current < 28;
          const isSelectedOrHovered = targetIdCur === id || Boolean(hoverEntity && hoverEntity.name.toLowerCase() === id);

          // In background mode, hide all 3D planet labels to avoid ghost text behind game menus
          if (mode === 'background') {
            val.label.visible = false;
          } else if (innerPlanets.includes(id)) {
            val.label.visible = Boolean(showLabels && !isInspectingThisPlanet && (isZoomedIn || isSelectedOrHovered));
          } else {
            val.label.visible = Boolean(showLabels && !isInspectingThisPlanet);
          }
        });

        // Space Stations Orbit Earth / Moon with Adaptive Label Visibility
        const earthData = planetMeshesRef.current.get('earth');
        const isFocusingStation = targetIdCur === 'iss' || targetIdCur === 'tiangong' || targetIdCur === 'lunar-gateway';
        const isCloseToEarth = (targetIdCur === 'earth' && camDistanceRef.current < 20);

        stationMeshesRef.current.forEach((st, id) => {
          st.angle += delta * st.orbitSpeed;
          if (earthData) {
            st.group.position.x = earthData.mesh.position.x + Math.cos(st.angle) * st.orbitRadius;
            st.group.position.y = earthData.mesh.position.y + 0.3;
            st.group.position.z = earthData.mesh.position.z + Math.sin(st.angle) * st.orbitRadius;
            st.group.rotation.y += 0.02;

            st.label.position.set(st.group.position.x, st.group.position.y + 1.2, st.group.position.z);
            st.label.visible = showLabels && showSpacecraft && (targetIdCur === id || (isCloseToEarth && isFocusingStation));
          }
        });

        // Probe Labels: Show only when probe is targeted or zoomed near it, keeping overview clean
        probeMeshesRef.current.forEach((pr, id) => {
          const isProbeTargeted = targetIdCur === id;
          const isNearProbe = camDistanceRef.current < 50;
          pr.label.visible = showLabels && showSpacecraft && (isProbeTargeted || isNearProbe);
        });

        // Rotate Asteroid Belt
        if (asteroidPointsRef.current) {
          asteroidPointsRef.current.rotation.y += 0.0004;
        }
      }

      // Smooth Camera Positioning & Lerp
      const targetId = cameraTargetRef.current;
      let targetCenter = new THREE.Vector3(0, 0, 0);

      if (targetId !== 'sun') {
        const pObj = planetMeshesRef.current.get(targetId);
        const sObj = stationMeshesRef.current.get(targetId);
        const mObj = probeMeshesRef.current.get(targetId);

        if (pObj) {
          targetCenter = pObj.mesh.position.clone();
        } else if (sObj) {
          targetCenter = sObj.group.position.clone();
        } else if (mObj) {
          targetCenter = mObj.group.position.clone();
        }
      }

      camTargetPosRef.current.lerp(targetCenter, 0.08);

      const theta = camThetaRef.current;
      const phi = camPhiRef.current;
      const dist = camDistanceRef.current;

      const cx = camTargetPosRef.current.x + dist * Math.sin(phi) * Math.sin(theta);
      const cy = camTargetPosRef.current.y + dist * Math.cos(phi);
      const cz = camTargetPosRef.current.z + dist * Math.sin(phi) * Math.cos(theta);

      camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.08);
      camera.lookAt(camTargetPosRef.current);

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      if (dom.parentElement) dom.parentElement.removeChild(dom);
      renderer.dispose();
    };
  }, [lightingMode, flyToTarget]);

  // ── VISIBILITY SYNCHRONIZATION ──────────────────────────────────────────
  useEffect(() => {
    orbitLinesRef.current.forEach((l) => { l.visible = showOrbits; });
  }, [showOrbits]);

  useEffect(() => {
    planetMeshesRef.current.forEach((p) => {
      p.label.visible = showLabels;
      if (p.moons) {
        p.moons.forEach((m) => {
          if (m.label) m.label.visible = showLabels;
        });
      }
    });
    if (sunLabelRef.current) sunLabelRef.current.visible = showLabels;
    stationMeshesRef.current.forEach((s) => { s.label.visible = showLabels && showSpacecraft; });
    probeMeshesRef.current.forEach((m) => { m.label.visible = showLabels && showSpacecraft; });
  }, [showLabels, showSpacecraft]);

  useEffect(() => {
    stationMeshesRef.current.forEach((s) => { s.group.visible = showSpacecraft; });
    probeMeshesRef.current.forEach((m) => { m.group.visible = showSpacecraft; });
  }, [showSpacecraft]);

  useEffect(() => {
    if (asteroidPointsRef.current) asteroidPointsRef.current.visible = showAsteroids;
  }, [showAsteroids]);

  // Keyboard Shortcuts: / to search, Space for play/pause, Esc to close, H to reset camera
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          setIsSearchFocused(false);
        }
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
        soundFx.playClick(650);
      } else if (e.key === 'Escape') {
        setIsStoriesModalOpen(false);
        setIsSimulatorsDropdownOpen(false);
        setIsDrawerOpen(false);
      } else if (e.key === 'h' || e.key === 'H') {
        handleResetCamera();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── SPEED & SCRUBBER HANDLERS ───────────────────────────────────────────
  const handleSetSpeed = (multiplier: number) => {
    setSimSpeed(multiplier);
    setIsPlaying(true);
    setIsLiveSynced(false);
    soundFx.playClick(multiplier > 1 ? 900 : 700);
  };

  const handleStepDay = (days: number) => {
    const next = new Date(simDate.getTime() + days * 86400000);
    setSimDate(next);
    setCurrentJD(getJulianDate(next));
    setIsLiveSynced(false);
    soundFx.playClick(750);
  };

  const handleTimelineScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value); // Year float, e.g. 2026.8
    const baseYear = Math.floor(val);
    const dayOfYear = (val - baseYear) * 365.25;
    const date = new Date(Date.UTC(baseYear, 0, 1 + dayOfYear));
    setSimDate(date);
    setCurrentJD(getJulianDate(date));
    setIsLiveSynced(false);
  };

  const currentYearFloat = simDate.getUTCFullYear() + (simDate.getUTCMonth() * 30.5 + simDate.getUTCDate()) / 365.25;

  return (
    <div className={`nasa-eyes-root ${mode === 'background' ? 'nasa-eyes-background-mode' : ''}`}>
      {/* 1. Fullscreen 3D WebGL Canvas Layer */}
      <div
        ref={mountRef}
        className="nasa-eyes-canvas-container"
        role="img"
        aria-label="Interactive 3D Solar System Orrery with real-time JPL planetary ephemeris and NASA spacecraft trajectories"
      />

      {/* 2. Interactive Hover Reticle */}
      {mode !== 'background' && hoverEntity && (
        <div className="ne-hover-reticle" style={{ left: hoverEntity.x, top: hoverEntity.y }}>
          <div className="ne-reticle-box">
            <div className="ne-reticle-title">{hoverEntity.name}</div>
            <div className="ne-reticle-subtitle">{hoverEntity.subtitle}</div>
          </div>
          <div className="ne-reticle-arrow" />
        </div>
      )}

      {/* 3. HUD Overlay Layer */}
      {mode !== 'background' && (
        <div className="nasa-eyes-hud">
        {/* ═══ UNIFIED TOP HUD (Left: Telemetry, Center: Orrery Toolbar, Right: Flagship Action) ═══ */}
        <div className="nasa-eyes-top-hud">
          {/* Top-Left Telemetry Status Card (Non-blocking aerospace telemetry) */}
          <div className="ne-telemetry-hud-card nasa-eyes-interactive">
            <div className="ne-telemetry-hud-header">
              <span className="ne-live-pulse-dot" />
              <span className="ne-telemetry-label">JPL EPHEMERIS DE440</span>
              <span className="ne-telemetry-status">{isLiveSynced ? 'LIVE' : 'SIM'}</span>
            </div>
            <div className="ne-telemetry-body">
              <div style={{ color: '#94a3b8', fontSize: '9px', letterSpacing: '0.04em' }}>CURRENT TARGET</div>
              <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 900 }}>
                {selectedEntity?.data.name.toUpperCase() || 'EARTH'}
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '10px' }}>
                DIST: {selectedEntity && 'distanceAU' in selectedEntity.data ? selectedEntity.data.distanceAU : '1.000 AU (149.6M km)'}
              </div>
            </div>
            <button
              className="ne-telemetry-drawer-btn"
              onClick={() => { setIsDrawerOpen(!isDrawerOpen); soundFx.playClick(850); }}
              title="Inspect Celestial Telemetry & Physics Dossier"
            >
              <Info size={12} />
              <span>{isDrawerOpen ? 'Close Telemetry Dossier' : 'Inspect Dossier'}</span>
            </button>

            {/* Quick Outpost Build Action if Target is Moon or Mars */}
            {selectedEntity && (selectedEntity.data.name.toLowerCase().includes('moon') || selectedEntity.data.name.toLowerCase().includes('mars')) && (
              <button
                onClick={() => {
                  const isM = selectedEntity.data.name.toLowerCase().includes('mars');
                  const dest = isM ? 'MARS' : 'MOON';
                  if (onBuildOutpost) onBuildOutpost(dest);
                  else if (onStartMission) onStartMission();
                  soundFx.playReactorStart();
                }}
                style={{
                  marginTop: '6px',
                  background: selectedEntity.data.name.toLowerCase().includes('mars')
                    ? 'linear-gradient(135deg, #ea580c, #c2410c)'
                    : 'linear-gradient(135deg, #0284c7, #0369a1)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '11px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
                title={`Launch Outpost Simulator directly on ${selectedEntity.data.name}`}
              >
                <Rocket size={13} />
                <span>Build Outpost Here ({selectedEntity.data.name.toLowerCase().includes('mars') ? 'Mars' : 'Moon'})</span>
              </button>
            )}
          </div>

          {/* ═══ FLOATING CELESTIAL CONTROLS TOOLBAR (Directly over 3D Canvas) ═══ */}
          <div className="ne-floating-celestial-toolbar nasa-eyes-interactive" role="toolbar" aria-label="Orrery Navigation Controls">
            {/* Category Filter Chips */}
            <nav className="ne-category-bar" aria-label="Celestial Filters">
              <button
                className={`ne-category-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => { setActiveCategory('all'); handleResetCamera(); }}
                title="View Complete Solar System"
              >
                <Sun size={13} />
                <span>Solar System</span>
              </button>
              <button
                className={`ne-category-tab ${activeCategory === 'inner' ? 'active' : ''}`}
                onClick={() => { setActiveCategory('inner'); flyToTarget('earth'); }}
                title="Focus on Terrestrial Inner Worlds"
              >
                <Globe size={13} />
                <span>Inner Worlds</span>
              </button>
              <button
                className={`ne-category-tab ${selectedEntity?.data.id === 'moon' ? 'active' : ''}`}
                onClick={() => flyToTarget('moon')}
                title="Focus on the Moon (Target for Artemis Base Camp)"
              >
                <span>🌙 Moon</span>
              </button>
              <button
                className={`ne-category-tab ${selectedEntity?.data.id === 'mars' ? 'active' : ''}`}
                onClick={() => flyToTarget('mars')}
                title="Focus on Mars (Target for Jezero Crater Outpost)"
              >
                <span>🔴 Mars</span>
              </button>
              <button
                className={`ne-category-tab ${activeCategory === 'outer' ? 'active' : ''}`}
                onClick={() => { setActiveCategory('outer'); flyToTarget('jupiter'); }}
                title="Focus on Outer Gas & Ice Giants"
              >
                <Sparkles size={13} />
                <span>Gas Giants</span>
              </button>
              <button
                className={`ne-category-tab ${activeCategory === 'fleet' ? 'active' : ''}`}
                onClick={() => { setActiveCategory('fleet'); flyToTarget('iss'); }}
                title="Track Active Spacecraft Fleet & Probes"
              >
                <Satellite size={13} />
                <span>Fleet</span>
              </button>
              <button
                className={`ne-category-tab ${isStoriesModalOpen ? 'active' : ''}`}
                onClick={() => { setIsStoriesModalOpen(!isStoriesModalOpen); soundFx.playClick(800); }}
                title="Curated NASA Guided Expeditions"
              >
                <Rocket size={13} />
                <span>Tours</span>
              </button>
            </nav>

            {/* Central Search Bar */}
            <div className="ne-search-wrapper">
              <div className="ne-search-input-box">
                <Search size={14} style={{ color: '#38bdf8' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search celestial bodies, probes, missions... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                />
                <span className="ne-search-key-badge">/</span>
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="ne-search-dropdown">
                  {searchResults.map((res) => (
                    <div
                      key={res.id}
                      className="ne-search-result-item"
                      onClick={() => {
                        flyToTarget(res.id);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                    >
                      <div className="ne-search-item-left">
                        <span>{res.icon}</span>
                        <strong style={{ fontSize: '12px' }}>{res.name}</strong>
                      </div>
                      <span className="ne-search-item-badge">{res.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Camera Reset & Fullscreen Controls */}
            <div className="ne-toolbar-quick-tools">
              <button
                className="ne-btn-icon"
                onClick={handleResetCamera}
                title="Reset Camera to Solar System Overview"
              >
                <RotateCcw size={14} />
              </button>
              <button
                className="ne-btn-icon"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                title="Toggle Fullscreen Canvas"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Right: Flagship Quick Trigger Button */}
          <div className="ne-flagship-cta-bar nasa-eyes-interactive">
            <button
              onClick={() => {
                setIsDestModalOpen(true);
                soundFx.playReactorStart();
              }}
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.65)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 16px rgba(249, 115, 22, 0.6), 0 4px 12px rgba(0,0,0,0.5)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              title="Start Outpost Mission (No login required - 100% Guest Mode)"
            >
              <Rocket size={15} />
              <span>START MISSION</span>
            </button>
          </div>
        </div>

        {/* ═══ FLAGSHIP HOME HERO OVERLAY (Visible on first load, dismissible) ═══ */}
        {!isHeroDismissed && (
          <div className="ne-home-hero-overlay nasa-eyes-interactive">
            <div className="ne-home-hero-card">
              <button
                className="ne-home-hero-close"
                onClick={() => {
                  setIsHeroDismissed(true);
                  soundFx.playClick(700);
                }}
                title="Dismiss hero banner and explore 3D Solar System"
              >
                <X size={16} />
              </button>

              <div className="ne-home-hero-badge">
                <Sparkles size={13} style={{ color: '#fbbf24' }} />
                <span>NASA SPACE APPS 2026 • FLAGSHIP TRAINER</span>
              </div>

              <h1 className="ne-home-hero-title">
                Junior Astronaut Mission Trainer
              </h1>

              <p className="ne-home-hero-tagline">
                Keep your crew alive on the Moon or Mars!
              </p>

              <p className="ne-home-hero-desc">
                Command Artemis Base Camp or Jezero Crater Outpost. Balance Power, Oxygen, Water, Food, Radiation Shielding, and Crew Morale against solar flares, dust storms, and lunar nights.
              </p>

              <div className="ne-home-hero-actions">
                <button
                  className="ne-home-hero-primary-btn"
                  onClick={() => {
                    setIsDestModalOpen(true);
                    soundFx.playReactorStart();
                  }}
                  title="Start your Lunar or Martian outpost mission (Guest Mode enabled - zero login required)"
                >
                  <Rocket size={18} />
                  <span>START MISSION: BUILD YOUR OUTPOST</span>
                </button>

                <button
                  className="ne-home-hero-secondary-btn"
                  onClick={() => {
                    setIsHeroDismissed(true);
                    soundFx.playClick(800);
                  }}
                >
                  Explore Solar System First
                </button>
              </div>

              <div className="ne-home-hero-footer">
                <span>⚡ 100% Free Guest Mode</span>
                <span>•</span>
                <span>🔬 NASA Bioastronautics Data</span>
                <span>•</span>
                <span>🏆 Ages 10–16</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FLOATING OUTPOST PILL WHEN MOON OR MARS IS TARGETED ═══ */}
        {selectedEntity && (selectedEntity.data.name.toLowerCase().includes('moon') || selectedEntity.data.name.toLowerCase().includes('mars')) && (
          <div className="ne-selected-body-outpost-pill nasa-eyes-interactive">
            <button
              onClick={() => {
                const isM = selectedEntity.data.name.toLowerCase().includes('mars');
                const dest = isM ? 'MARS' : 'MOON';
                if (onBuildOutpost) onBuildOutpost(dest);
                else if (onStartMission) onStartMission();
                soundFx.playReactorStart();
              }}
              className="ne-selected-body-outpost-btn"
              title={`Establish outpost on ${selectedEntity.data.name}`}
            >
              <Rocket size={15} />
              <span>{selectedEntity.data.name.toUpperCase()} DETECTED — BUILD OUTPOST HERE</span>
            </button>
          </div>
        )}

        {/* ═══ FEATURED STORIES & TOURS MODAL (NASA Eyes Scrollytelling) ═══ */}
        {isStoriesModalOpen && (
          <div className="ne-stories-modal nasa-eyes-interactive">
            <div className="ne-stories-header">
              <div className="ne-stories-title">
                <Rocket size={16} style={{ color: '#38bdf8' }} />
                <span>Featured NASA Tours</span>
              </div>
              <button
                className="ne-drawer-close-btn"
                onClick={() => setIsStoriesModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ne-stories-list">
              <div
                className="ne-story-item"
                onClick={() => {
                  flyToTarget('earth');
                  setIsStoriesModalOpen(false);
                  handleReadAloud('Artemis program returns humanity to the Lunar South Pole to establish permanent Shackleton Base.');
                }}
              >
                <div className="ne-story-item-title">
                  <span>1. Artemis Lunar Return</span>
                  <span style={{ color: '#38bdf8', fontSize: '11px' }}>Moonbase</span>
                </div>
                <div className="ne-story-item-desc">
                  Track the human expedition from Earth orbit to Lunar Gateway and the Shackleton Crater south polar base.
                </div>
              </div>

              <div
                className="ne-story-item"
                onClick={() => {
                  flyToTarget('mars');
                  setIsStoriesModalOpen(false);
                  handleReadAloud('Perseverance Rover explores ancient lakebeds in Jezero crater seeking signs of ancient microbial life.');
                }}
              >
                <div className="ne-story-item-title">
                  <span>2. Mars Jezero Astrobiology</span>
                  <span style={{ color: '#f43f5e', fontSize: '11px' }}>Perseverance</span>
                </div>
                <div className="ne-story-item-desc">
                  Inspect the Mars 2020 landing site, MOXIE oxygen generation, and rock sample caching.
                </div>
              </div>

              <div
                className="ne-story-item"
                onClick={() => {
                  flyToTarget('parker-solar-probe');
                  setIsStoriesModalOpen(false);
                  handleReadAloud('Parker Solar Probe dives directly into the Sun’s fiery corona at 692,000 kilometers per hour.');
                }}
              >
                <div className="ne-story-item-title">
                  <span>3. Touching the Sun</span>
                  <span style={{ color: '#f97316', fontSize: '11px' }}>Parker Probe</span>
                </div>
                <div className="ne-story-item-desc">
                  Experience extreme heliophysics inside the solar corona protected by a carbon-composite heat shield.
                </div>
              </div>

              <div
                className="ne-story-item"
                onClick={() => {
                  flyToTarget('voyager-1');
                  setIsStoriesModalOpen(false);
                  handleReadAloud('Voyager 1 has traversed over 24 billion kilometers into interstellar space beyond the solar bubble.');
                }}
              >
                <div className="ne-story-item-title">
                  <span>4. Interstellar Voyage</span>
                  <span style={{ color: '#34d399', fontSize: '11px' }}>Voyager 1</span>
                </div>
                <div className="ne-story-item-desc">
                  Travel 24.4 billion kilometers beyond the heliopause into the cosmic void carrying the Golden Record.
                </div>
              </div>

              <div
                className="ne-story-item"
                onClick={() => {
                  flyToTarget('jwst');
                  setIsStoriesModalOpen(false);
                  handleReadAloud('James Webb Space Telescope observes the cosmic dawn from Lagrange Point 2.');
                }}
              >
                <div className="ne-story-item-title">
                  <span>5. Cosmic Dawn at L2</span>
                  <span style={{ color: '#eab308', fontSize: '11px' }}>JWST</span>
                </div>
                <div className="ne-story-item-desc">
                  Peer 13.5 billion years into the past with gold hexagonal mirrors observing first-light galaxies.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CONTEXTUAL INSPECTION DRAWER (Authentic NASA Eyes Panel) ═══ */}
        {isDrawerOpen && selectedEntity && (
          <aside className="ne-side-drawer nasa-eyes-interactive" aria-label="Target Inspector">
            <div className="ne-sheet-handle" />
            {/* Drawer Header */}
            <div className="ne-drawer-header">
              <div className="ne-drawer-title-row">
                <div className="ne-drawer-target-title">
                  <span>{'emoji' in selectedEntity.data ? selectedEntity.data.emoji : '🛰️'}</span>
                  <span>{selectedEntity.data.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className={`ne-btn-icon ${isTargetLocked ? 'active' : ''}`}
                    onClick={() => setIsTargetLocked(!isTargetLocked)}
                    title={isTargetLocked ? 'Target Camera Locked' : 'Lock Camera on Target'}
                  >
                    <Crosshair size={14} />
                  </button>
                  <button
                    className="ne-drawer-close-btn"
                    onClick={() => setIsDrawerOpen(false)}
                    title="Close Inspector"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Real-time Telemetry Strip */}
              <div className="ne-telemetry-strip">
                <div className="ne-telemetry-cell">
                  <span className="ne-telemetry-label">Sun Distance</span>
                  <span className="ne-telemetry-value">
                    {'actualAU' in selectedEntity.data ? `${selectedEntity.data.actualAU} AU` : '1.00 AU'}
                  </span>
                </div>
                <div className="ne-telemetry-cell">
                  <span className="ne-telemetry-label">Orbital Velocity</span>
                  <span className="ne-telemetry-value">
                    {'orbitalVelocityKms' in selectedEntity.data
                      ? selectedEntity.data.orbitalVelocityKms
                      : 'velocityKms' in selectedEntity.data
                      ? `${selectedEntity.data.velocityKms} km/s`
                      : '30.0 km/s'}
                  </span>
                </div>
                <div className="ne-telemetry-cell">
                  <span className="ne-telemetry-label">Light Delay</span>
                  <span className="ne-telemetry-value">
                    {'actualAU' in selectedEntity.data
                      ? `${(selectedEntity.data.actualAU * 8.3).toFixed(1)} Min`
                      : '1.2 Sec'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="ne-drawer-tabs">
              <button
                className={`ne-drawer-tab ${drawerTab === 'overview' ? 'active' : ''}`}
                onClick={() => setDrawerTab('overview')}
              >
                Overview
              </button>
              <button
                className={`ne-drawer-tab ${drawerTab === 'indepth' ? 'active' : ''}`}
                onClick={() => setDrawerTab('indepth')}
              >
                In Depth
              </button>
              <button
                className={`ne-drawer-tab ${drawerTab === 'numbers' ? 'active' : ''}`}
                onClick={() => setDrawerTab('numbers')}
              >
                By Numbers
              </button>
              <button
                className={`ne-drawer-tab ${drawerTab === 'missions' ? 'active' : ''}`}
                onClick={() => setDrawerTab('missions')}
              >
                Missions
              </button>
              <button
                className={`ne-drawer-tab ${drawerTab === 'compare' ? 'active' : ''}`}
                onClick={() => setDrawerTab('compare')}
              >
                Compare
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="ne-drawer-content">
              {/* TAB 1: OVERVIEW */}
              {drawerTab === 'overview' && (
                <>
                  <div className="ne-drawer-hero-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                        {'zone' in selectedEntity.data ? selectedEntity.data.zone : 'Earth Orbital Laboratory'}
                      </span>
                      <button
                        className="ne-btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '10.5px' }}
                        onClick={() => handleReadAloud('funFact' in selectedEntity.data ? selectedEntity.data.funFact : ('description' in selectedEntity.data ? selectedEntity.data.description : selectedEntity.data.missionObjective))}
                        title="Read Aloud with Houston Capcom Voice"
                      >
                        <Volume2 size={12} />
                        <span>Listen</span>
                      </button>
                    </div>

                    <p className="ne-narrative-text">
                      {'funFact' in selectedEntity.data ? selectedEntity.data.funFact : ('description' in selectedEntity.data ? selectedEntity.data.description : selectedEntity.data.missionObjective)}
                    </p>
                  </div>

                  {/* Contextual Website Elements Actions */}
                  <div className="ne-website-actions-card">
                    <div className="ne-website-actions-title">
                      <Zap size={13} />
                      <span>Jr_AstroCamp Integrated Experiences</span>
                    </div>

                    {(selectedEntity.data.id === 'moon' || selectedEntity.data.id === 'mars') && (
                      <button
                        className="ne-action-link-btn"
                        style={{
                          background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,88,12,0.15))',
                          border: '1.5px solid rgba(249,115,22,0.6)',
                          color: '#fed7aa',
                          fontWeight: 700,
                          padding: '10px 14px',
                          marginBottom: '6px',
                        }}
                        onClick={() => {
                          if (onBuildOutpost) {
                            onBuildOutpost(selectedEntity.data.id === 'moon' ? 'MOON' : 'MARS');
                          } else if (onStartMission) {
                            onStartMission();
                          }
                        }}
                      >
                        <span>🏗️ Start Mission: Build Outpost on {selectedEntity.data.name} [FLAGSHIP]</span>
                        <ChevronRight size={14} />
                      </button>
                    )}

                    {selectedEntity.data.id === 'mars' && (
                      <>
                        {onOpenMarsEDL && (
                          <button className="ne-action-link-btn" onClick={onOpenMarsEDL}>
                            <span>🔴 Launch Mars Entry, Descent & Landing Simulator</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                        {onOpenRover && (
                          <button className="ne-action-link-btn" onClick={onOpenRover}>
                            <span>🚜 Deploy Surface Rover Sortie (Jezero Crater)</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </>
                    )}

                    {selectedEntity.data.id === 'earth' && (
                      <>
                        {onOpenExpedition && (
                          <button className="ne-action-link-btn" onClick={onOpenExpedition}>
                            <span>🚀 Launch Earth-to-Moon Apollo/Artemis Flight</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                        {onOpenMultiplayerLobby && (
                          <button className="ne-action-link-btn" onClick={onOpenMultiplayerLobby}>
                            <span>👥 Multiplayer Flight Crew Command Room</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </>
                    )}

                    {selectedEntity.data.id === 'iss' && onOpenTelemetry && (
                      <button className="ne-action-link-btn" onClick={onOpenTelemetry}>
                        <span>📊 Open Live NASA Deep Space Network Telemetry</span>
                        <ChevronRight size={14} />
                      </button>
                    )}

                    {onOpenLearningHub && (
                      <button className="ne-action-link-btn" onClick={() => onOpenLearningHub('NOTEBOOK')}>
                        <span>📖 Open Handwritten AstroCamp Field Notebook</span>
                        <ChevronRight size={14} />
                      </button>
                    )}

                    {onOpenCampaign && (
                      <button className="ne-action-link-btn" onClick={onOpenCampaign}>
                        <span>🎮 View 76 Real NASA Flight Missions</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: IN DEPTH (Geology & Atmosphere) */}
              {drawerTab === 'indepth' && (
                <>
                  {'interiorLayers' in selectedEntity.data && (
                    <div className="ne-drawer-hero-card">
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#ffffff' }}>Internal Structure &amp; Core</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedEntity.data.interiorLayers.map((layer, idx) => (
                          <div key={idx} style={{ padding: '8px', background: 'rgba(2, 6, 23, 0.6)', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                              <span>{layer.name}</span>
                              <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{layer.depth}</span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '3px' }}>{layer.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {'atmosphereGases' in selectedEntity.data && (
                    <div className="ne-drawer-hero-card">
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#ffffff' }}>Atmosphere Composition</h4>
                      <div className="ne-atmosphere-bar-container">
                        <div className="ne-bar-track">
                          {selectedEntity.data.atmosphereGases.map((gas, idx) => (
                            <div key={idx} className="ne-bar-seg" style={{ width: `${gas.pct}%`, background: gas.color }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                          {selectedEntity.data.atmosphereGases.map((gas, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#cbd5e1' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: gas.color }} />
                              <span>{gas.name}: <strong>{gas.pct}%</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {'specs' in selectedEntity.data && (
                    <div className="ne-drawer-hero-card">
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#ffffff' }}>Technical Specifications</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {selectedEntity.data.specs.map((s, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', borderBottom: '1px solid rgba(56, 189, 248, 0.1)', paddingBottom: '4px' }}>
                            <span style={{ color: '#94a3b8' }}>{s.label}</span>
                            <strong style={{ color: '#ffffff' }}>{s.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 3: BY THE NUMBERS */}
              {drawerTab === 'numbers' && 'diameterKm' in selectedEntity.data && (
                <div className="ne-drawer-hero-card">
                  <table className="ne-numbers-table">
                    <tbody>
                      <tr>
                        <td className="ne-numbers-label">Equatorial Diameter</td>
                        <td className="ne-numbers-value">{selectedEntity.data.diameterKm}</td>
                      </tr>
                      <tr>
                        <td className="ne-numbers-label">Surface Gravity</td>
                        <td className="ne-numbers-value">{selectedEntity.data.gravityMs2}</td>
                      </tr>
                      <tr>
                        <td className="ne-numbers-label">Orbital Period (Year)</td>
                        <td className="ne-numbers-value">{selectedEntity.data.orbitalPeriod}</td>
                      </tr>
                      <tr>
                        <td className="ne-numbers-label">Solar Day Length</td>
                        <td className="ne-numbers-value">{selectedEntity.data.dayLength}</td>
                      </tr>
                      <tr>
                        <td className="ne-numbers-label">Surface Temperature</td>
                        <td className="ne-numbers-value">{selectedEntity.data.surfaceTemp}</td>
                      </tr>
                      <tr>
                        <td className="ne-numbers-label">Known Moons</td>
                        <td className="ne-numbers-value">{selectedEntity.data.moons}</td>
                      </tr>
                      <tr>
                        <td className="ne-numbers-label">Total Mass</td>
                        <td className="ne-numbers-value">{selectedEntity.data.massKg}</td>
                      </tr>
                      <tr>
                        <td className="ne-numbers-label">Axial Tilt</td>
                        <td className="ne-numbers-value">{selectedEntity.data.axialTilt}</td>
                      </tr>
                      <tr>
                        <td className="ne-numbers-label">Orbital Velocity</td>
                        <td className="ne-numbers-value">{selectedEntity.data.orbitalVelocityKms}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: MISSIONS TO TARGET */}
              {drawerTab === 'missions' && (
                <div className="ne-missions-grid">
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                    NASA Flight Missions to {selectedEntity.data.name}
                  </div>
                  {ALL_76_NASA_MISSIONS.filter((m) => {
                    const tid = selectedEntity.data.id.toLowerCase();
                    const tname = selectedEntity.data.name.toLowerCase();
                    if (tid === 'mars') return m.destination === 'MARS' || m.era === 'MARS_FLEET' || m.destinationName.toLowerCase().includes('martian');
                    if (tid === 'earth' || tid === 'iss' || tid === 'tiangong' || tid === 'hubble') return m.destination === 'EARTH_ORBIT' || m.era === 'SHUTTLE_ISS' || m.era === 'PIONEERS';
                    if (tid === 'moon' || tid === 'lunar-gateway') return m.destination === 'MOON' || m.era === 'LUNAR_APOLLO' || m.era === 'ARTEMIS_ERA';
                    if (tid === 'jupiter' || tid === 'saturn' || tid === 'uranus' || tid === 'neptune') return m.era === 'DEEP_WORLDS' || m.name.toLowerCase().includes(tid) || m.destinationName.toLowerCase().includes(tid);
                    if (tid === 'sun' || tid === 'parker-solar-probe') return m.era === 'COSMIC_SENTINELS' || m.name.toLowerCase().includes('solar') || m.name.toLowerCase().includes('parker');
                    return m.destinationName.toLowerCase().includes(tname) || m.name.toLowerCase().includes(tname);
                  }).slice(0, 8).map((mission) => (
                    <div key={mission.id} className="ne-mission-card">
                      <div className="ne-mission-info">
                        <span className="ne-mission-name">{mission.name} ({mission.launchYear})</span>
                        <span className="ne-mission-meta">{mission.tagline}</span>
                      </div>
                      {onOpenCampaign && (
                        <button
                          className="ne-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={onOpenCampaign}
                        >
                          Play
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: COMPARE SIZE */}
              {drawerTab === 'compare' && 'diameterKm' in selectedEntity.data && (
                <div className="ne-drawer-hero-card" style={{ alignItems: 'center', textAlign: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>Scale Comparison vs Earth</h4>
                  <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '4px 0 16px 0' }}>
                    Visual scale comparison against Earth (12,742 km).
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', minHeight: '160px' }}>
                    {/* Target Body */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          width: `${Math.max(28, Math.min(140, selectedEntity.data.radius * 16 * compareScale))}px`,
                          height: `${Math.max(28, Math.min(140, selectedEntity.data.radius * 16 * compareScale))}px`,
                          borderRadius: '50%',
                          background: `#${selectedEntity.data.color.toString(16).padStart(6, '0')}`,
                          boxShadow: `0 0 20px #${selectedEntity.data.color.toString(16).padStart(6, '0')}66`,
                          transition: 'all 0.2s ease',
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>{selectedEntity.data.name}</span>
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace' }}>{selectedEntity.data.diameterKm}</span>
                    </div>

                    <span style={{ fontSize: '18px', color: '#64748b' }}>vs</span>

                    {/* Earth Reference */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          width: `${48 * compareScale}px`,
                          height: `${48 * compareScale}px`,
                          borderRadius: '50%',
                          background: '#38bdf8',
                          boxShadow: '0 0 20px #38bdf866',
                          transition: 'all 0.2s ease',
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>Earth</span>
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace' }}>12,742 km</span>
                    </div>
                  </div>

                  {/* Zoom scale slider */}
                  <div style={{ width: '100%', marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                      <span>Visual Scale</span>
                      <span>{compareScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={compareScale}
                      onChange={(e) => setCompareScale(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#38bdf8' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ═══ BOTTOM PLAYBACK & TIMELINE DOCK (Exact NASA Eyes Controls) ═══ */}
        <footer className="nasa-eyes-bottombar nasa-eyes-interactive">
          {/* Left Time & Ephemeris Controls */}
          <div className="ne-time-cluster">
            <div className="ne-time-display-box">
              <span className="ne-clock-utc">{simDate.toUTCString()}</span>
              <span className="ne-clock-jd">JD {currentJD.toFixed(4)}</span>
            </div>

            <button
              className="ne-now-btn"
              onClick={syncToNow}
              title="Return to real-world present time"
            >
              Now
            </button>

            {/* Transport Speed Buttons */}
            <div className="ne-time-transport">
              <button
                className="ne-transport-btn"
                onClick={() => handleStepDay(-1)}
                title="Step backward 1 Earth Day"
              >
                -1D
              </button>
              <button
                className={`ne-transport-btn ${!isPlaying ? 'active' : ''}`}
                onClick={() => { setIsPlaying(!isPlaying); soundFx.playClick(600); }}
                title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                className="ne-transport-btn"
                onClick={() => handleStepDay(1)}
                title="Step forward 1 Earth Day"
              >
                +1D
              </button>
              <button
                className={`ne-transport-btn ${simSpeed === 10 ? 'active' : ''}`}
                onClick={() => handleSetSpeed(10)}
                title="10x Speed"
              >
                10x
              </button>
              <button
                className={`ne-transport-btn ${simSpeed === 100 ? 'active' : ''}`}
                onClick={() => handleSetSpeed(100)}
                title="100x Speed"
              >
                100x
              </button>
              <button
                className={`ne-transport-btn ${simSpeed === 1000 ? 'active' : ''}`}
                onClick={() => handleSetSpeed(1000)}
                title="1,000x Speed"
              >
                1k
              </button>
            </div>
          </div>

          {/* Center Space-Time Scrubber */}
          <div className="ne-scrubber-container">
            <div className="ne-scrubber-track-box">
              <input
                type="range"
                min="1975"
                max="2045"
                step="0.05"
                value={currentYearFloat}
                onChange={handleTimelineScrub}
                className="ne-slider-range"
              />
            </div>
            <div className="ne-scrubber-labels">
              <span>1975 (Viking / Apollo)</span>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>{simDate.getUTCFullYear()}</span>
              <span>2045 (Interstellar Era)</span>
            </div>
          </div>

          {/* Right Display Layer Toggles */}
          <div className="ne-toggles-cluster" title="Solar System View Options">
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, padding: '0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              View options:
            </span>
            <button
              className={`ne-toggle-btn ${showOrbits ? 'active' : ''}`}
              onClick={() => { setShowOrbits(!showOrbits); soundFx.playClick(750); }}
              title="Show or hide planetary orbital paths around the Sun"
            >
              <span className="ne-toggle-led" />
              <span>Orbits</span>
            </button>

            <button
              className={`ne-toggle-btn ${showLabels ? 'active' : ''}`}
              onClick={() => { setShowLabels(!showLabels); soundFx.playClick(750); }}
              title="Show or hide high-contrast readable planet names and distance tags"
            >
              <span className="ne-toggle-led" />
              <span>Labels</span>
            </button>

            <button
              className={`ne-toggle-btn ${showSpacecraft ? 'active' : ''}`}
              onClick={() => { setShowSpacecraft(!showSpacecraft); soundFx.playClick(750); }}
              title="Show or hide human spacecraft fleet (ISS, Tiangong, Voyager, Parker Solar Probe)"
            >
              <span className="ne-toggle-led" />
              <span>Fleet</span>
            </button>

            <button
              className={`ne-toggle-btn ${showAsteroids ? 'active' : ''}`}
              onClick={() => { setShowAsteroids(!showAsteroids); soundFx.playClick(750); }}
              title="Show or hide Main Asteroid Belt rocks between Mars and Jupiter"
            >
              <span className="ne-toggle-led" />
              <span>Asteroids</span>
            </button>

            <button
              className={`ne-toggle-btn ${lightingMode === 'flood' ? 'active' : ''}`}
              onClick={() => { setLightingMode(lightingMode === 'sun' ? 'flood' : 'sun'); soundFx.playClick(800); }}
              title="Switch between realistic Solar Shadow Lighting and full Studio Floodlight"
            >
              <Sun size={12} />
              <span>{lightingMode === 'sun' ? 'Sunlight' : 'Flood'}</span>
            </button>
          </div>
        </footer>
      </div>
      )}

      {/* Flagship Clean Moon vs Mars Destination Selection Modal */}
      {mode !== 'background' && (
        <DestinationSelectionModal
          isOpen={isDestModalOpen}
          onClose={() => setIsDestModalOpen(false)}
          onSelectDestination={(dest, diff) => {
            if (onBuildOutpost) {
              onBuildOutpost(dest, diff);
            } else if (onStartMission) {
              onStartMission();
            }
          }}
        />
      )}
    </div>
  );
};

export default LandingPage;
