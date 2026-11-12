// ============================================================
// SolarSystemOrreryModal.tsx
// Inspired by NASA Eyes on the Solar System (eyes.nasa.gov)
// Real-time 3D Interactive Solar System Orrery, Space Stations & Solar Probes Tracker
// With LIVE Real-Time NASA JPL Ephemeris Clock & Celestial Mechanics
// Built for NASA Space Apps Challenge 2026
// ============================================================

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  X,
  Compass,
  Play,
  Pause,
  Sparkles,
  Info,
  Radio,
  ExternalLink,
  Clock,
  Zap,
  Layers,
  MousePointerClick,
  Satellite,
  Sun,
  Globe,
  Crosshair,
  ShieldAlert,
  Flame,
  Activity,
  Maximize2,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { disposeThreeScene } from '../utils/threeDisposeHelper';

// ── PLANET DATA (Enhanced scientific parameters & high visual clarity) ──────
export interface PlanetData {
  id: string;
  name: string;
  color: number;
  emissive: number;
  radius: number; // visual scale in orrery units (boosted for inner visibility)
  orbitRadius: number; // scaled AU
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
}

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
    funFact: 'A year on Mercury is just 88 Earth days, but one solar day takes 176 Earth days! Its core is enormous iron-rich metal.',
    zone: 'Inner Rocky Planets',
    orbitalPeriod: '87.97 Earth Days',
    dayLength: '58.65 Earth Days',
    discoveredBy: 'Known since antiquity (Telescope: Galileo, 1631)',
    emoji: '☿️',
    massKg: '3.30 × 10²³ kg (0.055 Earths)',
    axialTilt: '0.034° (Nearly vertical)',
    orbitalVelocityKms: '47.4 km/s',
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
    discoveredBy: 'Known since antiquity (Galileo observed phases in 1610)',
    emoji: '♀️',
    massKg: '4.87 × 10²⁴ kg (0.815 Earths)',
    axialTilt: '177.3° (Upside-down)',
    orbitalVelocityKms: '35.0 km/s',
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
    discoveredBy: 'Known since antiquity',
    emoji: '♃',
    massKg: '1.90 × 10²⁷ kg (317.8 Earths)',
    axialTilt: '3.13°',
    orbitalVelocityKms: '13.07 km/s',
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
    discoveredBy: 'Known since antiquity (Galileo 1610, Huygens 1655)',
    emoji: '♄',
    massKg: '5.68 × 10²⁶ kg (95.2 Earths)',
    axialTilt: '26.73°',
    orbitalVelocityKms: '9.68 km/s',
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
  },
];

// ── SPACE STATIONS (Real-world Low Earth Orbit & Lunar Orbit Stations) ──────
export interface SpaceStationData {
  id: string;
  name: string;
  agency: string;
  type: string;
  parentBody: 'earth' | 'moon';
  altitudeKm: number;
  velocityKmh: number;
  velocityKms: number;
  inclinationDeg: number;
  periodMin: number;
  crewCount: number;
  crewManifest: string;
  massKg: number;
  pressurizedVolumeM3: number;
  solarPowerKw: number;
  launchYear: number;
  status: 'Operational' | 'Active Transit' | 'Planned Construction';
  color: string;
  description: string;
  specs: { label: string; value: string }[];
}

export const SPACE_STATIONS: SpaceStationData[] = [
  {
    id: 'iss',
    name: 'International Space Station (ISS)',
    agency: 'NASA / ESA / JAXA / CSA / Roscosmos',
    type: 'Modular Habitation Space Station',
    parentBody: 'earth',
    altitudeKm: 418.5,
    velocityKmh: 27580,
    velocityKms: 7.66,
    inclinationDeg: 51.64,
    periodMin: 92.68,
    crewCount: 7,
    crewManifest: 'Expedition 72 Crew (NASA, Roscosmos, JAXA)',
    massKg: 444615,
    pressurizedVolumeM3: 916,
    solarPowerKw: 120,
    launchYear: 1998,
    status: 'Operational',
    color: '#38bdf8',
    description: 'Largest human-made laboratory in space. Continuous human occupation since November 2, 2000. Features 16 pressurized modules, Canadarm2, and 8 massive photovoltaic solar arrays.',
    specs: [
      { label: 'Altitude', value: '418.5 km (LEO)' },
      { label: 'Orbital Speed', value: '27,580 km/h (7.66 km/s)' },
      { label: 'Orbital Period', value: '92.68 minutes (~15.5 orbits/day)' },
      { label: 'Orbit Inclination', value: '51.64° to Equator' },
      { label: 'Onboard Crew', value: '7 Astronauts & Cosmonauts' },
      { label: 'Total Station Mass', value: '444,615 kg (970,000 lbs)' },
      { label: 'Habitable Volume', value: '916 m³ (Equivalent to 6-bedroom house)' },
      { label: 'Solar Array Span', value: '109 meters (Full Football Field)' },
    ],
  },
  {
    id: 'tiangong',
    name: 'Tiangong Space Station (CSS)',
    agency: 'CMSA (China Manned Space Agency)',
    type: 'Permanent Multi-Module Orbital Lab',
    parentBody: 'earth',
    altitudeKm: 389.2,
    velocityKmh: 27620,
    velocityKms: 7.67,
    inclinationDeg: 41.47,
    periodMin: 92.20,
    crewCount: 3,
    crewManifest: 'Shenzhou Mission Crew (3 Taikonauts)',
    massKg: 100000,
    pressurizedVolumeM3: 310,
    solarPowerKw: 27,
    launchYear: 2021,
    status: 'Operational',
    color: '#f59e0b',
    description: 'T-shaped permanent multi-module space station consisting of Tianhe core module, Wentian laboratory, Mengtian science module, and flexible gallium arsenide solar wings.',
    specs: [
      { label: 'Altitude', value: '389.2 km (LEO)' },
      { label: 'Orbital Speed', value: '27,620 km/h (7.67 km/s)' },
      { label: 'Orbital Period', value: '92.2 minutes' },
      { label: 'Orbit Inclination', value: '41.47°' },
      { label: 'Active Crew', value: '3 Taikonauts (Shenzhou-19)' },
      { label: 'Station Architecture', value: 'T-Shaped 3-Module Cluster' },
      { label: 'Core Module', value: 'Tianhe (16.6m length, 22.5 tonnes)' },
      { label: 'Robotic Manipulators', value: '10.2m Large Arm + 5m Small Arm' },
    ],
  },
  {
    id: 'lunar-gateway',
    name: 'Lunar Gateway (Artemis Hub)',
    agency: 'NASA / ESA / JAXA / CSA / MBRSC',
    type: 'Deep Space Cislunar Outpost',
    parentBody: 'moon',
    altitudeKm: 3000, // Perilune 3,000 km, Apolune 70,000 km
    velocityKmh: 5400,
    velocityKms: 1.50,
    inclinationDeg: 90.0, // Polar NRHO
    periodMin: 10080, // 7 days
    crewCount: 4,
    crewManifest: 'Artemis Astronaut Crew (Intermittent expeditions)',
    massKg: 40000,
    pressurizedVolumeM3: 125,
    solarPowerKw: 60,
    launchYear: 2027,
    status: 'Planned Construction',
    color: '#a855f7',
    description: 'The international deep-space gateway orbiting the Moon in a Near-Rectilinear Halo Orbit (NRHO). Serves as a staging base for astronaut landings at the Lunar South Pole and deep space Mars transports.',
    specs: [
      { label: 'Orbit Type', value: 'Near-Rectilinear Halo Orbit (NRHO)' },
      { label: 'Orbital Period', value: '7 Earth Days around the Moon' },
      { label: 'Propulsion Element', value: 'PPE (50 kW Solar Electric Xenon Thruster)' },
      { label: 'Habitation Module', value: 'HALO (Habitation and Logistics Outpost)' },
      { label: 'Robotic System', value: 'Canadarm3 AI Autonomous Arm' },
      { label: 'Lunar Lander Docking', value: 'Starship HLS & Blue Origin Blue Moon' },
      { label: 'Scientific Role', value: 'Heliophysics, Deep Space Radiation & Biology' },
    ],
  },
  {
    id: 'hubble',
    name: 'Hubble Space Telescope (HST)',
    agency: 'NASA / ESA',
    type: 'Great Observatory Satellite',
    parentBody: 'earth',
    altitudeKm: 535.0,
    velocityKmh: 27300,
    velocityKms: 7.58,
    inclinationDeg: 28.47,
    periodMin: 95.42,
    crewCount: 0,
    crewManifest: 'Autonomous Robotic Observatory',
    massKg: 11110,
    pressurizedVolumeM3: 0,
    solarPowerKw: 2.8,
    launchYear: 1990,
    status: 'Operational',
    color: '#06b6d4',
    description: 'The revolutionary space observatory operating in Low Earth Orbit since April 1990. Has made over 1.6 million astronomical observations, determining the age of the universe (13.8 Gyr) and accelerating cosmic expansion.',
    specs: [
      { label: 'Altitude', value: '535 km (Above Atmospheric Distortion)' },
      { label: 'Orbital Velocity', value: '27,300 km/h (7.58 km/s)' },
      { label: 'Primary Mirror', value: '2.4 meter (7.9 ft) Ultra-precise' },
      { label: 'Wavelength Range', value: 'Ultraviolet, Optical, Near-Infrared (115–2500 nm)' },
      { label: 'Observations Made', value: '> 1,600,000 Cosmic Targets' },
      { label: 'Data Generated', value: '> 175 Terabytes of Scientific Imagery' },
    ],
  },
];

// ── SOLAR MISSIONS & DEEP SPACE FLEET (With Authentic Trajectories) ────────
export interface SolarMissionData {
  id: string;
  name: string;
  agency: string;
  type: string;
  trajectoryType: 'eccentric-solar' | 'lagrange-l1' | 'lagrange-l2' | 'interstellar' | 'mars-surface' | 'lunar-orbit';
  distanceFromSunAU: number;
  perihelionAU: number;
  aphelionAU: number;
  currentSpeedKms: number;
  solarFluxWm2: number; // Irradiance at current distance
  lightDelaySec: number;
  lightDelayStr: string;
  color: string;
  missionObjective: string;
  instruments: string[];
  keyAchievement: string;
}

export const SOLAR_MISSIONS: SolarMissionData[] = [
  {
    id: 'parker-solar-probe',
    name: 'Parker Solar Probe (PSP)',
    agency: 'NASA Goddard / JHU-APL',
    type: 'Extreme Heliophysics Probe',
    trajectoryType: 'eccentric-solar',
    distanceFromSunAU: 0.082, // Closest human-made object to Sun!
    perihelionAU: 0.046, // 6.9 Million km (Inside Corona!)
    aphelionAU: 1.02,
    currentSpeedKms: 176.0, // Peaks up to 192 km/s (692,000 km/h)
    solarFluxWm2: 202400, // ~150x Earth's sunlight intensity!
    lightDelaySec: 41,
    lightDelayStr: '41 Seconds',
    color: '#f97316',
    missionObjective: 'Plunge directly through the superheated solar corona to solve why the corona is 300x hotter than the solar surface and trace the origin of the supersonic solar wind.',
    instruments: ['FIELDS (EM Waves & Magnetic)', 'WISPR (Coronal Imager)', 'SWEAP (Solar Wind Electrons & Alphas)', 'ISʘIS (Energetic Particles)'],
    keyAchievement: 'First human spacecraft to fly through the Sun’s upper atmosphere (Alfvén critical surface) at over 692,000 km/h.',
  },
  {
    id: 'solar-orbiter',
    name: 'Solar Orbiter (SolO)',
    agency: 'ESA / NASA',
    type: 'Polar Solar Observatory',
    trajectoryType: 'eccentric-solar',
    distanceFromSunAU: 0.284,
    perihelionAU: 0.280,
    aphelionAU: 0.910,
    currentSpeedKms: 58.5,
    solarFluxWm2: 16870,
    lightDelaySec: 142,
    lightDelayStr: '2 Minutes 22 Seconds',
    color: '#eab308',
    missionObjective: 'First spacecraft to capture direct, high-resolution imagery of the Sun’s unexplored polar regions using gravitational assists from Venus to tilt its orbital inclination up to 33°.',
    instruments: ['PHI (Polarimetric & Helioseismic)', 'EUI (Extreme Ultraviolet Imager)', 'STIX (X-ray Spectrometer)', 'Metis (Coronagraph)'],
    keyAchievement: 'Discovered miniature solar flares termed "campfires" dotting the solar corona, likely fueling coronal heating.',
  },
  {
    id: 'soho',
    name: 'SOHO (Solar & Heliospheric Observatory)',
    agency: 'ESA / NASA',
    type: 'Sun-Earth L1 Halo Sentry',
    trajectoryType: 'lagrange-l1',
    distanceFromSunAU: 0.990,
    perihelionAU: 0.985,
    aphelionAU: 1.015,
    currentSpeedKms: 29.8,
    solarFluxWm2: 1388,
    lightDelaySec: 494,
    lightDelayStr: '8 Minutes 14 Seconds',
    color: '#10b981',
    missionObjective: 'Uninterrupted 24/7 vigil of the Sun from the Sun-Earth L1 Lagrange point (1.5M km sunward of Earth). Provides primary early warning for coronal mass ejections (CMEs) heading toward Earth.',
    instruments: ['LASCO (Large Angle Spectrometric Coronagraph)', 'MDI (Michelson Doppler Imager)', 'EIT (EUV Imaging Telescope)', 'CELIAS'],
    keyAchievement: 'Continuously active for 30 years; discovered >5,000 comets and protects Earth’s power grids from catastrophic space weather.',
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope (JWST)',
    agency: 'NASA / ESA / CSA',
    type: 'Sun-Earth L2 Infrared Flagship',
    trajectoryType: 'lagrange-l2',
    distanceFromSunAU: 1.010,
    perihelionAU: 1.008,
    aphelionAU: 1.012,
    currentSpeedKms: 29.6,
    solarFluxWm2: 1334,
    lightDelaySec: 504,
    lightDelayStr: '8 Minutes 24 Seconds (5s from Earth)',
    color: '#fbbf24',
    missionObjective: 'Peer back over 13.5 billion years to witness the first luminous galaxies formed after the Big Bang and characterize atmospheres of potentially habitable exoplanets.',
    instruments: ['NIRCam (Near-Infrared Camera)', 'NIRSpec (Spectrograph)', 'MIRI (Mid-Infrared Instrument)', 'FGS/NIRISS'],
    keyAchievement: 'Discovered JADES-GS-z14-0 (galaxy just 290 Myr after Big Bang) and detected atmospheric carbon compounds on exoplanets.',
  },
  {
    id: 'voyager-1',
    name: 'Voyager 1',
    agency: 'NASA JPL',
    type: 'Interstellar Cosmic Explorer',
    trajectoryType: 'interstellar',
    distanceFromSunAU: 163.4,
    perihelionAU: 1.0,
    aphelionAU: 9999, // Hyperbolic escape
    currentSpeedKms: 17.0,
    solarFluxWm2: 0.051, // Barely detectable cosmic starlight
    lightDelaySec: 81500,
    lightDelayStr: '22 Hours 38 Minutes 20 Seconds',
    color: '#34d399',
    missionObjective: 'First human-made machine to cross the Heliopause into true interstellar space. Currently sampling interstellar plasma, galactic cosmic rays, and magnetic fields.',
    instruments: ['CRS (Cosmic Ray Subsystem)', 'MAG (Magnetometer)', 'PWS (Plasma Wave Subsystem)', 'LRS'],
    keyAchievement: 'Farthest human object from Earth (>24.4 billion km). Launched in 1977, still transmitting telemetry via NASA Deep Space Network.',
  },
  {
    id: 'perseverance',
    name: 'Perseverance Rover & Ingenuity',
    agency: 'NASA JPL',
    type: 'Mars Surface Astrobiology',
    trajectoryType: 'mars-surface',
    distanceFromSunAU: 1.524,
    perihelionAU: 1.38,
    aphelionAU: 1.66,
    currentSpeedKms: 24.1,
    solarFluxWm2: 586,
    lightDelaySec: 755,
    lightDelayStr: '12 Minutes 35 Seconds',
    color: '#f43f5e',
    missionObjective: 'Seeking signs of ancient microbial life in Jezero Crater paleolake, caching sealed core rock samples for Mars Sample Return, and extracted oxygen with MOXIE.',
    instruments: ['Mastcam-Z', 'SuperCam', 'PIXL', 'SHERLOC & WATSON', 'MOXIE', 'MEDA', 'RIMFAX Radar'],
    keyAchievement: 'Cached 25 geological core samples; Ingenuity helicopter completed 72 powered flights in thin Martian atmosphere.',
  },
  {
    id: 'artemis-orion',
    name: 'Artemis Orion Spacecraft',
    agency: 'NASA / ESA',
    type: 'Deep Space Crew Transport',
    trajectoryType: 'lunar-orbit',
    distanceFromSunAU: 1.002,
    perihelionAU: 0.998,
    aphelionAU: 1.006,
    currentSpeedKms: 30.1,
    solarFluxWm2: 1358,
    lightDelaySec: 1.28,
    lightDelayStr: '1.28 Seconds (Lunar distance)',
    color: '#38bdf8',
    missionObjective: 'Transport next-generation human astronauts from Earth to Lunar Gateway and lunar orbit, surviving re-entry speeds exceeding 40,000 km/h with 2,800°C heat shield.',
    instruments: ['European Service Module (ESM)', 'Deep Space Navigation Optical Guidance', 'Autonomous Docking System'],
    keyAchievement: 'Artemis I successfully executed 2.25-million km flawless circumlunar mission, breaking Apollo 13 deep-space distance record.',
  },
];

// ── ORBITAL ZONES ──────────────────────────────────────────────────────────
export interface OrbitalZone {
  id: string;
  name: string;
  innerRadius: number;
  outerRadius: number;
  color: string;
  opacity: number;
  description: string;
  bodies: string[];
}

export const ORBITAL_ZONES: OrbitalZone[] = [
  {
    id: 'inner-rocky',
    name: 'Inner Rocky Planets & Habitable Zone',
    innerRadius: 12,
    outerRadius: 64,
    color: '#ef4444',
    opacity: 0.07,
    description: 'The terrestrial realm of solid surfaces: Mercury, Venus, Earth, and Mars. Contains the circumstellar Habitable (Goldilocks) Zone where liquid water can exist.',
    bodies: ['Mercury', 'Venus', 'Earth & Moon', 'Mars', 'ISS', 'Tiangong', 'Lunar Gateway', 'Parker Solar Probe'],
  },
  {
    id: 'asteroid-belt',
    name: 'Main Asteroid Belt',
    innerRadius: 65,
    outerRadius: 78,
    color: '#a8a29e',
    opacity: 0.12,
    description: 'A torus of primordial rocky and metallic planetesimals between Mars and Jupiter. Prevented from coalescing into a planet by Jupiter’s disruptive gravitational resonances.',
    bodies: ['Ceres (Dwarf Planet, 940 km)', 'Vesta', 'Pallas', 'Hygiea', 'Psyche Probe', '~1.9 Million Asteroids (>1 km)'],
  },
  {
    id: 'gas-giants',
    name: 'Gas Giant Zone',
    innerRadius: 78,
    outerRadius: 124,
    color: '#f59e0b',
    opacity: 0.06,
    description: 'The realm of massive planets with hydrogen/helium envelopes, colossal magnetospheres, ring systems, and dozens of ocean moons.',
    bodies: ['Jupiter (95 Moons)', 'Saturn (146 Moons)', 'Europa Clipper', 'Juno Probe'],
  },
  {
    id: 'ice-giants',
    name: 'Ice Giant Zone',
    innerRadius: 128,
    outerRadius: 175,
    color: '#06b6d4',
    opacity: 0.06,
    description: 'Distant, frigid worlds dominated by deep superheated water-ammonia-methane mantle oceans under extreme pressures above small rocky cores.',
    bodies: ['Uranus (28 Moons)', 'Neptune (16 Moons)', 'Triton Geysers'],
  },
  {
    id: 'kuiper-belt',
    name: 'Kuiper Belt & Interstellar Frontier',
    innerRadius: 178,
    outerRadius: 215,
    color: '#8b5cf6',
    opacity: 0.08,
    description: 'A vast circumstellar debris disc extending past Neptune, populated by hundreds of thousands of icy bodies and dwarf planets.',
    bodies: ['Pluto & Charon', 'Eris', 'Makemake', 'Haumea', 'Arrokoth', 'Voyager 1 & 2', 'New Horizons'],
  },
];

// ── REAL-TIME CELESTIAL MECHANICS & JULIAN EPHEMERIS ────────────────────────
export function getJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

// NASA JPL Planetary Ephemeris Parameters (Epoch J2000.0 / DE440 Model)
export const KEPLER_PLANETS: Record<string, { a: number; e: number; L0: number; n: number; w0: number; dw: number }> = {
  mercury: { a: 0.387098, e: 0.205630, L0: 252.250845, n: 4.0923344368, w0: 77.45645, dw: 0.000044 },
  venus:   { a: 0.723332, e: 0.006773, L0: 181.979730, n: 1.6021302244, w0: 131.57294, dw: 0.000014 },
  earth:   { a: 1.000000, e: 0.016709, L0: 100.464350, n: 0.9856091030, w0: 102.93768, dw: 0.000009 },
  mars:    { a: 1.523679, e: 0.093405, L0: 355.453320, n: 0.5240330350, w0: 336.04084, dw: 0.000048 },
  jupiter: { a: 5.204267, e: 0.048498, L0: 34.404380,  n: 0.0830853001, w0: 14.75385,  dw: 0.000022 },
  saturn:  { a: 9.582017, e: 0.055546, L0: 49.944240,  n: 0.0334442282, w0: 92.43194,  dw: 0.000054 },
  uranus:  { a: 19.22941, e: 0.047318, L0: 313.232180, n: 0.0117283451, w0: 170.96424, dw: 0.000038 },
  neptune: { a: 30.06992, e: 0.008606, L0: 304.880030, n: 0.0059810301, w0: 44.97135,  dw: 0.000008 }
};

export function getKeplerianCoords(id: string, jd: number) {
  const p = KEPLER_PLANETS[id] || KEPLER_PLANETS.earth;
  const d = jd - 2451545.0; // Days from J2000.0 epoch
  const L = (p.L0 + p.n * d) % 360;
  const w = (p.w0 + p.dw * d) % 360;
  let M = (L - w) % 360;
  if (M < 0) M += 360;
  const Mrad = (M * Math.PI) / 180;
  // Kepler's Equation of Center (elliptical correction)
  const eqCenter = (2 * p.e - 0.25 * Math.pow(p.e, 3)) * Math.sin(Mrad) + 1.25 * Math.pow(p.e, 2) * Math.sin(2 * Mrad);
  const trueLonDeg = (L + (eqCenter * 180) / Math.PI) % 360;
  const trueLonRad = (trueLonDeg * Math.PI) / 180;
  const r = (p.a * (1 - p.e * p.e)) / (1 + p.e * Math.cos(eqCenter));
  return {
    angleRad: trueLonRad,
    distAU: r,
    xAU: r * Math.cos(trueLonRad),
    zAU: r * Math.sin(trueLonRad)
  };
}

export function getPlanetHeliocentricAngle(planetId: string, jd: number): number {
  return getKeplerianCoords(planetId, jd).angleRad;
}

// ── Helper: Canvas text sprite for labels ───────────────────────────────────
function createTextSprite(text: string, color: string, subtext?: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 384;
  canvas.height = 96;
  ctx.clearRect(0, 0, 384, 96);

  // Background pill tag
  ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const radius = 14;
  const x = 16, y = 12, w = 352, h = 72;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Text title
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, 192, subtext ? 42 : 54);

  // Optional subtitle
  if (subtext) {
    ctx.font = '600 20px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subtext, 192, 70);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(15, 3.8, 1);
  return sprite;
}

// ── 3D MODEL BUILDERS (Realistic, non-game, scientific representations) ─────
function createRealisticISSMesh(): THREE.Group {
  const group = new THREE.Group();

  // Central Integrated Truss Structure (long silver bar)
  const trussGeo = new THREE.BoxGeometry(7.0, 0.25, 0.25);
  const trussMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.3 });
  const truss = new THREE.Mesh(trussGeo, trussMat);
  group.add(truss);

  // Pressurized Habitation Modules (Cylinders at center)
  const modGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.2, 16);
  const modMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.6, roughness: 0.4 });
  const modules = new THREE.Mesh(modGeo, modMat);
  modules.rotation.x = Math.PI / 2;
  group.add(modules);

  // Cross module (Node / Kibo)
  const crossGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16);
  const crossMesh = new THREE.Mesh(crossGeo, modMat);
  crossMesh.rotation.z = Math.PI / 2;
  group.add(crossMesh);

  // 8 Solar Array Wings (4 Port, 4 Starboard)
  const wingGeo = new THREE.BoxGeometry(0.9, 1.8, 0.04);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.4,
    metalness: 0.5,
    roughness: 0.2,
  });

  const offsets = [-3.1, -2.2, 2.2, 3.1];
  offsets.forEach((xOff) => {
    // Upper wing
    const wingUpper = new THREE.Mesh(wingGeo, wingMat);
    wingUpper.position.set(xOff, 1.1, 0);
    group.add(wingUpper);

    // Lower wing
    const wingLower = new THREE.Mesh(wingGeo, wingMat);
    wingLower.position.set(xOff, -1.1, 0);
    group.add(wingLower);
  });

  // Radiator Panels (White rectangular heat rejection fins)
  const radGeo = new THREE.BoxGeometry(0.5, 0.8, 0.02);
  const radMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const rad1 = new THREE.Mesh(radGeo, radMat);
  rad1.position.set(-1.0, 0, 0.7);
  const rad2 = new THREE.Mesh(radGeo, radMat);
  rad2.position.set(1.0, 0, 0.7);
  group.add(rad1);
  group.add(rad2);

  // Navigation strobe beacon (pulsing red/green)
  const strobeGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const strobeMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const strobe = new THREE.Mesh(strobeGeo, strobeMat);
  strobe.position.set(3.4, 0, 0);
  group.add(strobe);

  group.scale.set(0.4, 0.4, 0.4);
  return group;
}

function createRealisticTiangongMesh(): THREE.Group {
  const group = new THREE.Group();

  // Tianhe Core Module
  const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 16);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5, roughness: 0.3 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = Math.PI / 2;
  group.add(core);

  // Wentian & Mengtian Lab Modules (T-shape lateral wings)
  const labGeo = new THREE.CylinderGeometry(0.42, 0.42, 2.0, 16);
  const lab1 = new THREE.Mesh(labGeo, coreMat);
  lab1.rotation.z = Math.PI / 2;
  lab1.position.set(-1.2, 0, 0.3);
  const lab2 = new THREE.Mesh(labGeo, coreMat);
  lab2.rotation.z = Math.PI / 2;
  lab2.position.set(1.2, 0, 0.3);
  group.add(lab1);
  group.add(lab2);

  // Flexible Solar Wings
  const solarGeo = new THREE.BoxGeometry(0.7, 2.2, 0.03);
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0x92400e,
    emissiveIntensity: 0.4,
    metalness: 0.4,
    roughness: 0.3,
  });
  const sWing1 = new THREE.Mesh(solarGeo, solarMat);
  sWing1.position.set(-2.5, 0, 0.3);
  const sWing2 = new THREE.Mesh(solarGeo, solarMat);
  sWing2.position.set(2.5, 0, 0.3);
  group.add(sWing1);
  group.add(sWing2);

  group.scale.set(0.38, 0.38, 0.38);
  return group;
}

function createRealisticGatewayMesh(): THREE.Group {
  const group = new THREE.Group();

  // HALO Module
  const haloGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.8, 16);
  const haloMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3 });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  group.add(halo);

  // PPE (Power & Propulsion Element with Xenon glow ring)
  const ppeGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.2, 16);
  const ppe = new THREE.Mesh(ppeGeo, haloMat);
  ppe.position.y = -1.5;
  group.add(ppe);

  // Xenon thruster ion plume
  const plumeGeo = new THREE.ConeGeometry(0.35, 0.8, 16);
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 });
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.position.y = -2.3;
  plume.rotation.x = Math.PI;
  group.add(plume);

  // Giant high-power solar wings
  const wingGeo = new THREE.BoxGeometry(3.2, 0.8, 0.03);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.5 });
  const w1 = new THREE.Mesh(wingGeo, wingMat);
  w1.position.set(2.0, -1.5, 0);
  const w2 = new THREE.Mesh(wingGeo, wingMat);
  w2.position.set(-2.0, -1.5, 0);
  group.add(w1);
  group.add(w2);

  group.scale.set(0.35, 0.35, 0.35);
  return group;
}

function createRealisticParkerMesh(): THREE.Group {
  const group = new THREE.Group();

  // Carbon-composite Thermal Protection Shield (facing sun)
  const shieldGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 6);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 0.3,
    roughness: 0.2,
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.rotation.x = Math.PI / 2;
  group.add(shield);

  // Spacecraft bus behind shield
  const busGeo = new THREE.BoxGeometry(0.8, 0.8, 1.2);
  const busMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 }); // Gold foil
  const bus = new THREE.Mesh(busGeo, busMat);
  bus.position.z = 0.7;
  group.add(bus);

  // Folded solar arrays (tilted back to avoid melting)
  const panelGeo = new THREE.BoxGeometry(1.4, 0.5, 0.03);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, emissive: 0x1e40af, emissiveIntensity: 0.3 });
  const p1 = new THREE.Mesh(panelGeo, panelMat);
  p1.position.set(1.1, 0, 0.7);
  p1.rotation.y = -0.4;
  const p2 = new THREE.Mesh(panelGeo, panelMat);
  p2.position.set(-1.1, 0, 0.7);
  p2.rotation.y = 0.4;
  group.add(p1);
  group.add(p2);

  // High gain antenna dish
  const dishGeo = new THREE.CylinderGeometry(0.3, 0.05, 0.2, 16);
  const dish = new THREE.Mesh(dishGeo, shieldMat);
  dish.position.set(0, 0.6, 1.1);
  dish.rotation.x = Math.PI / 4;
  group.add(dish);

  group.scale.set(0.45, 0.45, 0.45);
  return group;
}

function createRealisticJWSTMesh(): THREE.Group {
  const group = new THREE.Group();

  // 5-Layer Kite-Shaped Kapton Sunshield
  const shieldGeo = new THREE.BoxGeometry(3.6, 0.05, 2.2);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0xe0e7ff,
    metalness: 0.8,
    roughness: 0.2,
  });
  const sunshield = new THREE.Mesh(shieldGeo, shieldMat);
  group.add(sunshield);

  // Spacecraft bus (warm side below sunshield)
  const busGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
  const busMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const bus = new THREE.Mesh(busGeo, busMat);
  bus.position.y = -0.3;
  group.add(bus);

  // 18-Segment Gold Primary Mirror
  const mirrorGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.06, 6);
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.5,
    metalness: 0.95,
    roughness: 0.1,
  });
  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.position.set(0, 0.6, 0);
  mirror.rotation.x = Math.PI / 2.3;
  group.add(mirror);

  // Secondary mirror tripod
  const tripodGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
  const tripodMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const leg = new THREE.Mesh(tripodGeo, tripodMat);
  leg.position.set(0, 1.1, 0.5);
  leg.rotation.x = -Math.PI / 4;
  group.add(leg);

  group.scale.set(0.45, 0.45, 0.45);
  return group;
}

function createRealisticSatelliteMesh(color: number): THREE.Group {
  const group = new THREE.Group();

  // Central cylindrical body
  const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.4, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Dual solar panels
  const panelGeo = new THREE.BoxGeometry(1.6, 0.6, 0.02);
  const panelMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
  const p1 = new THREE.Mesh(panelGeo, panelMat);
  p1.position.set(1.1, 0, 0);
  const p2 = new THREE.Mesh(panelGeo, panelMat);
  p2.position.set(-1.1, 0, 0);
  group.add(p1);
  group.add(p2);

  // Dish Antenna
  const dishGeo = new THREE.CylinderGeometry(0.35, 0.05, 0.15, 16);
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.3 });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(0, 0.8, 0);
  group.add(dish);

  group.scale.set(0.4, 0.4, 0.4);
  return group;
}

// ── PROPS ──────────────────────────────────────────────────────────────────
interface SolarSystemOrreryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SolarSystemOrreryModal: React.FC<SolarSystemOrreryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Selection states
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData>(PLANETS[2]); // Earth default
  const [selectedStation, setSelectedStation] = useState<SpaceStationData | null>(null);
  const [selectedSolarMission, setSelectedSolarMission] = useState<SolarMissionData | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'planet' | 'stations' | 'solar' | 'zones'>('planet');

  // Simulation controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [cameraTarget, setCameraTarget] = useState<string>('sun');
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(true);

  // Layer Visibility Toggles
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showSolarFleet, setShowSolarFleet] = useState<boolean>(true);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);

  // Ephemeris Clock
  const [simDate, setSimDate] = useState<Date>(new Date());
  const [currentJD, setCurrentJD] = useState<number>(() => getJulianDate(new Date()));

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Entity References for Real-time update & raycasting
  const planetMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; orbitRadius: number; angle: number; label: THREE.Sprite; glow: THREE.Mesh }>>(new Map());
  const stationMeshesRef = useRef<Map<string, { group: THREE.Group; parent: 'earth' | 'moon'; orbitRadius: number; angle: number; orbitSpeed: number; label: THREE.Sprite }>>(new Map());
  const solarMissionMeshesRef = useRef<Map<string, { group: THREE.Group; mission: SolarMissionData; label: THREE.Sprite }>>(new Map());

  const orbitLinesRef = useRef<THREE.Line[]>([]);
  const zoneMeshesRef = useRef<THREE.Mesh[]>([]);
  const labelSpritesRef = useRef<THREE.Sprite[]>([]);

  const simDateRef = useRef<Date>(new Date());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // ── REAL-TIME LIVE ISS TELEMETRY FEED (NORAD #25544) ──
  const [liveIssState, setLiveIssState] = useState<{
    velocity: number;
    altitude: number;
    latitude: number;
    longitude: number;
    visibility: string;
    isLive: boolean;
  }>({
    velocity: 27580,
    altitude: 418.5,
    latitude: 5.98,
    longitude: -176.07,
    visibility: 'DAYLIGHT',
    isLive: false,
  });

  // Poll Real-Time ISS Telemetry
  useEffect(() => {
    if (!isOpen) return;
    const fetchIss = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (res.ok) {
          const data = await res.json();
          setLiveIssState({
            velocity: Math.round(data.velocity),
            altitude: Number(data.altitude.toFixed(1)),
            latitude: Number(data.latitude.toFixed(2)),
            longitude: Number(data.longitude.toFixed(2)),
            visibility: String(data.visibility || 'DAYLIGHT').toUpperCase(),
            isLive: true,
          });
        }
      } catch {}
    };
    fetchIss();
    const timer = setInterval(fetchIss, 5000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Real-time Clock Ticker
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      if (isLiveSynced && isPlaying && simSpeed === 1) {
        const now = new Date();
        simDateRef.current = now;
        setSimDate(now);
        setCurrentJD(getJulianDate(now));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen, isLiveSynced, isPlaying, simSpeed]);

  // Sync back to Real-Time Now
  const syncToLiveNow = () => {
    const now = new Date();
    simDateRef.current = now;
    setSimDate(now);
    setCurrentJD(getJulianDate(now));
    setIsLiveSynced(true);
    setSimSpeed(1);
    soundFx.playTelemetryChirp();

    const jd = getJulianDate(now);
    planetMeshesRef.current.forEach((val, id) => {
      const kepler = getKeplerianCoords(id, jd);
      val.angle = kepler.angleRad;
      val.mesh.position.x = Math.cos(kepler.angleRad) * val.orbitRadius;
      val.mesh.position.z = Math.sin(kepler.angleRad) * val.orbitRadius;
    });
  };

  // Fly Camera to Target
  const focusOnTarget = (targetId: string) => {
    setCameraTarget(targetId);
    soundFx.playClick(850);
  };

  // ── 3D RAYCAST CLICK INTERACTION ─────────────────────────────────────────
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    const canvas = rendererRef.current.domElement;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // 1. Check Space Stations
    const stationObjects: THREE.Object3D[] = [];
    const stationIds: string[] = [];
    stationMeshesRef.current.forEach((val, id) => {
      stationObjects.push(val.group);
      stationIds.push(id);
    });

    const stationHits = raycasterRef.current.intersectObjects(stationObjects, true);
    if (stationHits.length > 0) {
      // Find top root group
      let hitRoot = stationHits[0].object;
      while (hitRoot.parent && !stationObjects.includes(hitRoot)) {
        hitRoot = hitRoot.parent;
      }
      const idx = stationObjects.indexOf(hitRoot);
      if (idx >= 0) {
        const sId = stationIds[idx];
        const station = SPACE_STATIONS.find((s) => s.id === sId);
        if (station) {
          setSelectedStation(station);
          setSelectedSolarMission(null);
          setSidebarTab('stations');
          setCameraTarget(station.parentBody === 'earth' ? 'earth' : 'moon');
          soundFx.playTelemetryChirp();
          return;
        }
      }
    }

    // 2. Check Solar Missions
    const solarObjects: THREE.Object3D[] = [];
    const solarIds: string[] = [];
    solarMissionMeshesRef.current.forEach((val, id) => {
      solarObjects.push(val.group);
      solarIds.push(id);
    });

    const solarHits = raycasterRef.current.intersectObjects(solarObjects, true);
    if (solarHits.length > 0) {
      let hitRoot = solarHits[0].object;
      while (hitRoot.parent && !solarObjects.includes(hitRoot)) {
        hitRoot = hitRoot.parent;
      }
      const idx = solarObjects.indexOf(hitRoot);
      if (idx >= 0) {
        const mId = solarIds[idx];
        const mission = SOLAR_MISSIONS.find((m) => m.id === mId);
        if (mission) {
          setSelectedSolarMission(mission);
          setSelectedStation(null);
          setSidebarTab('solar');
          setCameraTarget(mission.id);
          soundFx.playTelemetryChirp();
          return;
        }
      }
    }

    // 3. Check Planets
    const planetMeshes: THREE.Mesh[] = [];
    const planetIds: string[] = [];
    planetMeshesRef.current.forEach((val, id) => {
      planetMeshes.push(val.mesh);
      planetIds.push(id);
    });

    const planetHits = raycasterRef.current.intersectObjects(planetMeshes, false);
    if (planetHits.length > 0) {
      const hitMesh = planetHits[0].object as THREE.Mesh;
      const idx = planetMeshes.indexOf(hitMesh);
      if (idx >= 0) {
        const planetId = planetIds[idx];
        const planet = PLANETS.find((p) => p.id === planetId);
        if (planet) {
          setSelectedPlanet(planet);
          setSelectedStation(null);
          setSelectedSolarMission(null);
          setCameraTarget(planet.id);
          setSidebarTab('planet');
          soundFx.playClick(750);
        }
      }
    }
  }, []);

  // ── THREE.JS SCENE INITIALIZATION ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 580;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Deep NASA midnight space
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 3000);
    camera.position.set(0, 110, 190);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. High-Fidelity Scientific Lighting
    // Strong ambient so inner planets are never pitch black on night sides
    const ambientLight = new THREE.AmbientLight(0x7da4be, 1.2);
    scene.add(ambientLight);

    // Powerful solar pointlight at origin
    const sunLight = new THREE.PointLight(0xfff7ed, 4.0, 1000, 0.35);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Hemisphere light for cosmic bounce illumination
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x1e293b, 0.6);
    scene.add(hemiLight);

    // 3. Central Sun Mesh & Multi-layered Photosphere Corona
    const textureLoader = new THREE.TextureLoader();
    const sunTex = textureLoader.load('/assets/planets/sun.jpg');
    sunTex.colorSpace = THREE.SRGBColorSpace;

    const sunGeo = new THREE.SphereGeometry(6.5, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    // Chromosphere layer (pulsating fiery solar edge)
    const chromoGeo = new THREE.SphereGeometry(7.2, 48, 48);
    const chromoMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.38,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(chromoGeo, chromoMat));

    // Outer Coronal streamer glow
    const coronaGeo = new THREE.SphereGeometry(9.8, 48, 48);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const coronaOuterMesh = new THREE.Mesh(coronaGeo, coronaMat);
    scene.add(coronaOuterMesh);

    // 4. Starfield & Deep Space Skybox
    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1600;
      starPositions[i + 1] = (Math.random() - 0.5) * 1600;
      starPositions[i + 2] = (Math.random() - 0.5) * 1600;
      const t = Math.random();
      starColors[i] = 0.85 + t * 0.15;
      starColors[i + 1] = 0.85 + t * 0.15;
      starColors[i + 2] = 0.9 + t * 0.1;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ size: 1.4, transparent: true, opacity: 0.85, vertexColors: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // 5. ORBITAL ZONES
    const zonesMeshes: THREE.Mesh[] = [];
    ORBITAL_ZONES.forEach((zone) => {
      const ringGeo = new THREE.RingGeometry(zone.innerRadius, zone.outerRadius, 128);
      const color = new THREE.Color(zone.color);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: zone.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = -0.4;
      ringMesh.visible = showZones;
      scene.add(ringMesh);
      zonesMeshes.push(ringMesh);
    });
    zoneMeshesRef.current = zonesMeshes;

    // Asteroid belt particles
    const asteroidCount = 500;
    const asteroidGeo = new THREE.BufferGeometry();
    const asteroidPositions = new Float32Array(asteroidCount * 3);
    for (let i = 0; i < asteroidCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 65 + Math.random() * 13;
      const y = (Math.random() - 0.5) * 4;
      asteroidPositions[i * 3] = Math.cos(angle) * r;
      asteroidPositions[i * 3 + 1] = y;
      asteroidPositions[i * 3 + 2] = Math.sin(angle) * r;
    }
    asteroidGeo.setAttribute('position', new THREE.BufferAttribute(asteroidPositions, 3));
    const asteroidMat = new THREE.PointsMaterial({ color: 0xa8a29e, size: 0.8, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(asteroidGeo, asteroidMat));

    // Kuiper Belt particles
    const kuiperCount = 450;
    const kuiperGeo = new THREE.BufferGeometry();
    const kuiperPositions = new Float32Array(kuiperCount * 3);
    for (let i = 0; i < kuiperCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 178 + Math.random() * 37;
      const y = (Math.random() - 0.5) * 6;
      kuiperPositions[i * 3] = Math.cos(angle) * r;
      kuiperPositions[i * 3 + 1] = y;
      kuiperPositions[i * 3 + 2] = Math.sin(angle) * r;
    }
    kuiperGeo.setAttribute('position', new THREE.BufferAttribute(kuiperPositions, 3));
    const kuiperMat = new THREE.PointsMaterial({ color: 0x8b5cf6, size: 0.9, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(kuiperGeo, kuiperMat));

    // 6. BUILD CELESTIAL PLANETS (With distinct textures, materials, and Earth-Moon system)
    const initialJD = getJulianDate(simDateRef.current);
    const planetMap = new Map<string, { mesh: THREE.Mesh; orbitRadius: number; angle: number; label: THREE.Sprite; glow: THREE.Mesh }>();
    const allLabels: THREE.Sprite[] = [];
    const allOrbitLines: THREE.Line[] = [];

    // Store Earth mesh reference so space stations and Moon can attach or orbit
    let earthMeshRef: THREE.Mesh | null = null;
    let moonMeshRef: THREE.Mesh | null = null;

    PLANETS.forEach((p) => {
      // Orbit Ring Line
      const orbitGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 160;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * p.orbitRadius, 0, Math.sin(theta) * p.orbitRadius));
      }
      orbitGeo.setFromPoints(points);
      const orbitMat = new THREE.LineBasicMaterial({
        color: p.color,
        transparent: true,
        opacity: p.id === 'earth' ? 0.45 : 0.30,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      scene.add(orbitLine);
      allOrbitLines.push(orbitLine);

      // Planet Sphere Geometry with smooth high-poly subdivision
      const pGeo = new THREE.SphereGeometry(p.radius, 64, 64);

      // Authentic NASA photorealistic surface textures
      let mapTex: THREE.Texture | null = null;
      let roughness = 0.7;
      let metalness = 0.05;

      if (p.id === 'mercury') {
        mapTex = textureLoader.load('/assets/planets/mercury.jpg');
        roughness = 0.92;
        metalness = 0.1;
      } else if (p.id === 'venus') {
        mapTex = textureLoader.load('/assets/planets/venus.jpg');
        roughness = 0.38;
        metalness = 0.02;
      } else if (p.id === 'earth') {
        mapTex = textureLoader.load('/assets/earth_orbit.jpg');
        roughness = 0.55;
        metalness = 0.12;
      } else if (p.id === 'mars') {
        mapTex = textureLoader.load('/assets/mars_texture.jpg');
        roughness = 0.88;
        metalness = 0.08;
      } else if (p.id === 'jupiter') {
        mapTex = textureLoader.load('/assets/planets/jupiter.jpg');
        roughness = 0.52;
        metalness = 0.02;
      } else if (p.id === 'saturn') {
        mapTex = textureLoader.load('/assets/planets/saturn.jpg');
        roughness = 0.58;
        metalness = 0.02;
      } else if (p.id === 'uranus') {
        mapTex = textureLoader.load('/assets/planets/uranus.jpg');
        roughness = 0.45;
        metalness = 0.02;
      } else if (p.id === 'neptune') {
        mapTex = textureLoader.load('/assets/planets/neptune.jpg');
        roughness = 0.45;
        metalness = 0.02;
      }

      if (mapTex) {
        mapTex.colorSpace = THREE.SRGBColorSpace;
      }

      const pMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: mapTex,
        roughness,
        metalness,
        emissive: p.color,
        emissiveIntensity: 0.08,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);

      // Authentic Astronomical Axial Tilt (Euler ZYX)
      const AXIAL_TILTS: Record<string, number> = {
        mercury: 0.0006,
        venus: 3.09,
        earth: 0.409,
        mars: 0.440,
        jupiter: 0.055,
        saturn: 0.466,
        uranus: 1.706,
        neptune: 0.494,
      };
      pMesh.rotation.order = 'ZYX';
      pMesh.rotation.z = AXIAL_TILTS[p.id] || 0;

      // Real astronomical initial angle
      const initialAngle = getPlanetHeliocentricAngle(p.id, initialJD);
      pMesh.position.set(Math.cos(initialAngle) * p.orbitRadius, 0, Math.sin(initialAngle) * p.orbitRadius);
      scene.add(pMesh);

      // Atmospheric Glow Halo (tight authentic limb glow)
      const hasAtmosphere = p.id !== 'mercury';
      const atmoScale = p.id === 'earth' ? 1.06 : p.id === 'venus' ? 1.08 : p.id === 'mars' ? 1.03 : 1.06;
      const atmoOpacity = p.id === 'venus' ? 0.30 : p.id === 'earth' ? 0.22 : p.id === 'mars' ? 0.08 : 0.20;
      const atmoColor = p.id === 'earth' ? 0x38bdf8 : p.id === 'venus' ? 0xfef08a : p.id === 'mars' ? 0xf87171 : p.color;

      const glowGeo = new THREE.SphereGeometry(p.radius * atmoScale, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: atmoColor,
        transparent: true,
        opacity: hasAtmosphere ? atmoOpacity : 0.0,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.raycast = () => {};
      pMesh.add(glowMesh);

      // Custom Planet Features
      if (p.id === 'earth') {
        earthMeshRef = pMesh;

        // Photorealistic Dynamic Cloud Layer
        const cloudTex = textureLoader.load('/assets/planets/earth_clouds.png');
        cloudTex.colorSpace = THREE.SRGBColorSpace;
        const cloudGeo = new THREE.SphereGeometry(p.radius * 1.025, 64, 64);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          roughness: 1.0,
          depthWrite: false,
        });
        const clouds = new THREE.Mesh(cloudGeo, cloudMat);
        clouds.raycast = () => {};
        pMesh.add(clouds);
        pMesh.userData.clouds = clouds;

        // Earth's Moon with Authentic NASA LRO Surface Map
        const moonTex = textureLoader.load('/assets/moon_texture.jpg');
        moonTex.colorSpace = THREE.SRGBColorSpace;
        const moonGeo = new THREE.SphereGeometry(0.82, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonTex,
          roughness: 0.95,
          metalness: 0.05,
          emissive: 0x94a3b8,
          emissiveIntensity: 0.06,
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.position.set(6.5, 0.5, 0);
        moon.raycast = () => {};
        pMesh.add(moon);
        pMesh.userData.moon = moon;
        moonMeshRef = moon;

        // Moon Orbit Line around Earth
        const mOrbitGeo = new THREE.BufferGeometry();
        const mPoints: THREE.Vector3[] = [];
        for (let s = 0; s <= 64; s++) {
          const t = (s / 64) * Math.PI * 2;
          mPoints.push(new THREE.Vector3(Math.cos(t) * 6.5, 0, Math.sin(t) * 6.5));
        }
        mOrbitGeo.setFromPoints(mPoints);
        const mOrbitMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.25 });
        const mOrbit = new THREE.Line(mOrbitGeo, mOrbitMat);
        pMesh.add(mOrbit);
      }

      if (p.id === 'saturn') {
        // Authentic Saturn Ring System with Radial UV Texture & Cassini Division
        const ringTex = textureLoader.load('/assets/planets/saturn_ring.png');
        ringTex.colorSpace = THREE.SRGBColorSpace;
        const innerR = p.radius * 1.30;
        const outerR = p.radius * 2.70;
        const ringGeo = new THREE.RingGeometry(innerR, outerR, 96, 4);

        const pos = ringGeo.attributes.position;
        const uvs = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const r = Math.sqrt(x * x + y * y);
          const u = (r - innerR) / (outerR - innerR);
          uvs.setXY(i, u, 0.5);
        }
        uvs.needsUpdate = true;

        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92,
          roughness: 0.6,
          metalness: 0.08,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.35;
        ringMesh.rotation.y = 0.08;
        ringMesh.raycast = () => {};
        pMesh.add(ringMesh);
      }

      if (p.id === 'uranus') {
        // Delicate Uranus Ring System
        const uRingGeo = new THREE.RingGeometry(p.radius * 1.35, p.radius * 1.85, 64);
        const uRingMat = new THREE.MeshBasicMaterial({
          color: 0x93c5fd,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.28,
        });
        const uRingMesh = new THREE.Mesh(uRingGeo, uRingMat);
        uRingMesh.rotation.x = Math.PI / 1.15;
        uRingMesh.raycast = () => {};
        pMesh.add(uRingMesh);
      }

      // Floating Billboard Label
      const colorHex = '#' + new THREE.Color(p.color).getHexString();
      const label = createTextSprite(p.name, colorHex, p.distanceAU.split(' ')[0]);
      label.position.copy(pMesh.position);
      label.position.y = p.radius + 4.2;
      label.visible = showLabels;
      scene.add(label);
      allLabels.push(label);

      planetMap.set(p.id, {
        mesh: pMesh,
        orbitRadius: p.orbitRadius,
        angle: initialAngle,
        label,
        glow: glowMesh,
      });
    });
    planetMeshesRef.current = planetMap;

    // 7. BUILD SPACE STATIONS (In dynamic orbit around Earth & Moon)
    const stationMap = new Map<string, { group: THREE.Group; parent: 'earth' | 'moon'; orbitRadius: number; angle: number; orbitSpeed: number; label: THREE.Sprite }>();

    SPACE_STATIONS.forEach((station, idx) => {
      let stationGroup: THREE.Group;
      let orbitRadius = 4.2;
      let orbitSpeed = 1.8 + idx * 0.4;

      if (station.id === 'iss') {
        stationGroup = createRealisticISSMesh();
        orbitRadius = 4.0;
        orbitSpeed = 2.2;
      } else if (station.id === 'tiangong') {
        stationGroup = createRealisticTiangongMesh();
        orbitRadius = 4.8;
        orbitSpeed = 1.9;
      } else if (station.id === 'lunar-gateway') {
        stationGroup = createRealisticGatewayMesh();
        orbitRadius = 1.8; // Around the Moon
        orbitSpeed = 1.2;
      } else {
        stationGroup = createRealisticSatelliteMesh(0x06b6d4); // Hubble
        orbitRadius = 3.6;
        orbitSpeed = 2.4;
      }

      // Orbital Path Ring around Earth or Moon
      const stOrbitGeo = new THREE.BufferGeometry();
      const stPoints: THREE.Vector3[] = [];
      for (let s = 0; s <= 64; s++) {
        const t = (s / 64) * Math.PI * 2;
        stPoints.push(new THREE.Vector3(Math.cos(t) * orbitRadius, 0, Math.sin(t) * orbitRadius));
      }
      stOrbitGeo.setFromPoints(stPoints);
      const stOrbitMat = new THREE.LineBasicMaterial({
        color: station.color,
        transparent: true,
        opacity: 0.4,
      });
      const stOrbitLine = new THREE.Line(stOrbitGeo, stOrbitMat);
      if (station.parentBody === 'earth' && earthMeshRef) {
        earthMeshRef.add(stOrbitLine);
      } else if (station.parentBody === 'moon' && moonMeshRef) {
        moonMeshRef.add(stOrbitLine);
      }
      allOrbitLines.push(stOrbitLine);

      // Station Label
      const label = createTextSprite(station.name, station.color, `${station.altitudeKm} km LEO`);
      label.scale.set(12, 3.0, 1);
      label.visible = showLabels && showStations;
      scene.add(label);
      allLabels.push(label);

      // Attach station to parent or scene
      if (station.parentBody === 'earth' && earthMeshRef) {
        earthMeshRef.add(stationGroup);
      } else if (station.parentBody === 'moon' && moonMeshRef) {
        moonMeshRef.add(stationGroup);
      } else {
        scene.add(stationGroup);
      }

      stationMap.set(station.id, {
        group: stationGroup,
        parent: station.parentBody,
        orbitRadius,
        angle: (idx * Math.PI) / 2,
        orbitSpeed,
        label,
      });
    });
    stationMeshesRef.current = stationMap;

    // 8. BUILD SOLAR MISSIONS & DEEP SPACE FLEET (Authentic Trajectories)
    const solarMissionMap = new Map<string, { group: THREE.Group; mission: SolarMissionData; label: THREE.Sprite }>();

    SOLAR_MISSIONS.forEach((mission) => {
      let group: THREE.Group;

      if (mission.id === 'parker-solar-probe') {
        group = createRealisticParkerMesh();

        // High eccentric elliptical orbit trajectory around Sun!
        const pspGeo = new THREE.BufferGeometry();
        const pspPoints: THREE.Vector3[] = [];
        // Ellipse: a = 24, e = 0.65
        const a = 24, b = 15;
        for (let s = 0; s <= 128; s++) {
          const t = (s / 128) * Math.PI * 2;
          pspPoints.push(new THREE.Vector3(Math.cos(t) * a - 10, 0, Math.sin(t) * b));
        }
        pspGeo.setFromPoints(pspPoints);
        const pspMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.65 });
        const pspOrbit = new THREE.Line(pspGeo, pspMat);
        scene.add(pspOrbit);
        allOrbitLines.push(pspOrbit);
        group.position.set(10.5, 0, 0); // Close to Sun!
      } else if (mission.id === 'jwst') {
        group = createRealisticJWSTMesh();
        // Positioned 1.5M km anti-sunward from Earth (Sun-Earth L2)
        group.position.set(45.5, 0, 1.2);
      } else if (mission.id === 'soho') {
        group = createRealisticSatelliteMesh(0x10b981);
        // Sun-Earth L1 (between Earth and Sun)
        group.position.set(38.0, 0, -0.8);
      } else if (mission.id === 'solar-orbiter') {
        group = createRealisticSatelliteMesh(0xeab308);
        group.position.set(22.0, 3.5, 12.0); // Inclined orbit
      } else if (mission.id === 'voyager-1') {
        group = createRealisticSatelliteMesh(0x34d399);
        group.position.set(185, 25, -180); // Escaping solar system!
      } else if (mission.id === 'perseverance') {
        group = createRealisticSatelliteMesh(0xf43f5e);
        group.position.set(56.0, 0.5, 1.0);
      } else {
        group = createRealisticSatelliteMesh(0x38bdf8);
        group.position.set(43.0, 0, 2.5);
      }

      scene.add(group);

      const label = createTextSprite(mission.name, mission.color, mission.type);
      label.scale.set(13, 3.2, 1);
      label.position.copy(group.position);
      label.position.y += 3.2;
      label.visible = showLabels && showSolarFleet;
      scene.add(label);
      allLabels.push(label);

      solarMissionMap.set(mission.id, {
        group,
        mission,
        label,
      });
    });
    solarMissionMeshesRef.current = solarMissionMap;

    orbitLinesRef.current = allOrbitLines;
    labelSpritesRef.current = allLabels;

    // 9. Interactive Mouse Orbit Controls
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let camPhi = Math.PI / 3.8;
    let camTheta = 0;
    let camDistance = 210;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      camTheta -= dx * 0.0055;
      camPhi = Math.max(0.08, Math.min(Math.PI / 2 - 0.04, camPhi + dy * 0.0055));
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      camDistance = Math.max(10, Math.min(650, camDistance + e.deltaY * 0.22));
    };
    const onClick = (e: MouseEvent) => {
      if (isDragging) return;
      handleCanvasClick(e);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.addEventListener('click', onClick);

    // 10. Animation Render Loop
    let animId: number;
    const clock = new THREE.Clock();
    let pulseTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      pulseTime += delta;

      // Sun rotation & corona pulse
      sun.rotation.y += 0.003;
      coronaOuterMesh.scale.setScalar(1.0 + Math.sin(pulseTime * 1.6) * 0.05);

      // Simulation Time Advance
      if (isPlaying) {
        let currentJDToUse: number;
        if (isLiveSynced || simSpeed === 1) {
          // ── 100% PURE REAL-TIME LIVE CELESTIAL MECHANICS ──
          const now = new Date();
          simDateRef.current = now;
          currentJDToUse = getJulianDate(now);
        } else {
          // ── ACCELERATED TIME MACHINE (7D/s, 30D/s, etc.) ──
          const advanceDays = delta * simSpeed;
          simDateRef.current = new Date(simDateRef.current.getTime() + advanceDays * 86400000);
          currentJDToUse = getJulianDate(simDateRef.current);
          setSimDate(new Date(simDateRef.current));
          setCurrentJD(currentJDToUse);
        }

        // Continually position planets along true Keplerian orbits
        planetMeshesRef.current.forEach((val, id) => {
          const kepler = getKeplerianCoords(id, currentJDToUse);
          val.angle = kepler.angleRad;
          val.mesh.position.x = Math.cos(kepler.angleRad) * val.orbitRadius;
          val.mesh.position.z = Math.sin(kepler.angleRad) * val.orbitRadius;

          // Authentic axial rotation speeds (Jupiter/Saturn ~10 hrs, Venus slow retrograde)
          const spinRate = id === 'jupiter' || id === 'saturn' ? 0.018 : id === 'venus' ? -0.002 : 0.009;
          val.mesh.rotation.y += (simSpeed > 1 ? 0.025 : 1) * spinRate;

          // Atmospheric cloud layer rotation (drifts over Earth continents)
          if (val.mesh.userData.clouds) {
            (val.mesh.userData.clouds as THREE.Mesh).rotation.y += 0.002;
          }

          // Moon orbital movement around Earth
          if (val.mesh.userData.moon) {
            const moon = val.mesh.userData.moon as THREE.Mesh;
            const mAngle = pulseTime * 0.45;
            moon.position.x = Math.cos(mAngle) * 6.5;
            moon.position.z = Math.sin(mAngle) * 6.5;
            moon.rotation.y += 0.008;
          }

          // Sync billboard label position
          val.label.position.copy(val.mesh.position);
          val.label.position.y = (val.mesh.geometry as THREE.SphereGeometry).parameters.radius + 4.2;
        });

        // Animate Space Station Orbits around Earth / Moon
        stationMeshesRef.current.forEach((val, sId) => {
          // If ISS and live telemetry is active, use authentic orbital rate
          const speedMultiplier = (sId === 'iss' && liveIssState.isLive) ? 2.5 : val.orbitSpeed;
          val.angle += delta * speedMultiplier;
          val.group.position.x = Math.cos(val.angle) * val.orbitRadius;
          val.group.position.z = Math.sin(val.angle) * val.orbitRadius;
          val.group.rotation.y += 0.02;

          // Update station world label
          const worldPos = new THREE.Vector3();
          val.group.getWorldPosition(worldPos);
          val.label.position.set(worldPos.x, worldPos.y + 1.8, worldPos.z);
        });

        // Rotate Solar probes slowly
        solarMissionMeshesRef.current.forEach((val) => {
          val.group.rotation.y += 0.01;
        });
      }

      // Planetary glow pulse
      planetMeshesRef.current.forEach((val) => {
        const glowMat = val.glow.material as THREE.MeshBasicMaterial;
        glowMat.opacity = 0.14 + Math.sin(pulseTime * 2.5) * 0.05;
      });

      // Camera Target Lerp Tracking
      let targetCenter = new THREE.Vector3(0, 0, 0);
      let targetZoomDist = camDistance;

      if (cameraTarget !== 'sun') {
        if (planetMeshesRef.current.has(cameraTarget)) {
          const targetMesh = planetMeshesRef.current.get(cameraTarget)!.mesh;
          targetCenter = targetMesh.position.clone();
          const pRad = (targetMesh.geometry as THREE.SphereGeometry).parameters.radius || 3;
          targetZoomDist = Math.min(camDistance, Math.max(13, pRad * 4.2)); // Dynamic close inspection zoom
        } else if (cameraTarget === 'inner') {
          targetCenter = new THREE.Vector3(0, 0, 0);
          targetZoomDist = 90;
        } else if (cameraTarget === 'earth-system' && earthMeshRef) {
          targetCenter = earthMeshRef.position.clone();
          targetZoomDist = 28; // Close zoom on Earth, Moon & ISS!
        }
      }

      const cx = targetCenter.x + targetZoomDist * Math.sin(camPhi) * Math.sin(camTheta);
      const cy = targetCenter.y + targetZoomDist * Math.cos(camPhi);
      const cz = targetCenter.z + targetZoomDist * Math.sin(camPhi) * Math.cos(camTheta);
      camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.08);
      camera.lookAt(targetCenter);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('click', onClick);
      disposeThreeScene(renderer, scene, container);
    };
  }, [isOpen, isPlaying, simSpeed, cameraTarget, handleCanvasClick]);

  // ── SYNC TOGGLES TO 3D VISIBILITY ────────────────────────────────────────
  useEffect(() => {
    zoneMeshesRef.current.forEach((mesh) => { mesh.visible = showZones; });
  }, [showZones]);

  useEffect(() => {
    labelSpritesRef.current.forEach((sprite) => { sprite.visible = showLabels; });
  }, [showLabels]);

  useEffect(() => {
    stationMeshesRef.current.forEach((val) => {
      val.group.visible = showStations;
      val.label.visible = showStations && showLabels;
    });
  }, [showStations, showLabels]);

  useEffect(() => {
    solarMissionMeshesRef.current.forEach((val) => {
      val.group.visible = showSolarFleet;
      val.label.visible = showSolarFleet && showLabels;
    });
  }, [showSolarFleet, showLabels]);

  useEffect(() => {
    orbitLinesRef.current.forEach((line) => { line.visible = showOrbits; });
  }, [showOrbits]);

  // Computed Real-Time Planetary Ephemeris & Distance Telemetry from Earth
  const solarTelemetry = useMemo(() => {
    const jd = getJulianDate(simDate);
    const eCoords = getKeplerianCoords('earth', jd);
    const pCoords = getKeplerianCoords(selectedPlanet.id, jd);

    // Real-time distance between Earth and selected planet
    const earthDistAU = selectedPlanet.id === 'earth' 
      ? 0 
      : Math.sqrt(Math.pow(pCoords.xAU - eCoords.xAU, 2) + Math.pow(pCoords.zAU - eCoords.zAU, 2));
    const earthDistKm = earthDistAU * 149597870.7;
    const earthLightDelayMin = (earthDistKm / 299792.458 / 60);

    // Distance to Sun
    const currentDistAU = pCoords.distAU;
    // Inverse Square Law: S = S0 / r^2 (S0 = 1361 W/m^2 at 1 AU)
    const fluxWm2 = (1361 / (currentDistAU * currentDistAU)).toFixed(1);
    const lightDelayMinutes = ((currentDistAU * 149597870.7) / 299792.458 / 60).toFixed(2);
    const solarTimeHours = ((simDate.getUTCHours() + 12) % 24).toString().padStart(2, '0');
    const solarTimeMins = simDate.getUTCMinutes().toString().padStart(2, '0');

    return {
      fluxWm2,
      lightDelayMinutes,
      earthDistAU: earthDistAU.toFixed(3),
      earthDistKm: (earthDistKm / 1e6).toFixed(1),
      earthLightDelayMin: earthLightDelayMin.toFixed(2),
      localSolarTime: `${solarTimeHours}:${solarTimeMins} LTST`,
      carringtonRotation: Math.floor(2285 + (currentJD - 2460000) / 27.2753),
      heliocentricLongitude: ((pCoords.angleRad * 180) / Math.PI).toFixed(1),
    };
  }, [selectedPlanet, currentJD, simDate]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      backdropFilter: 'blur(16px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1440px',
        height: '95vh',
        backgroundColor: '#090d16',
        borderRadius: '20px',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 50px rgba(56, 189, 248, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* ═══ TOP NASA COMMAND BAR ═══ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98), rgba(9, 14, 26, 0.98))',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          {/* Title & Real-time JPL Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)',
            }}>
              <Compass size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                  NASA Eyes: 3D Solar System Orrery & Space Fleet
                </h2>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  background: isLiveSynced ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  border: isLiveSynced ? '1px solid #22c55e' : '1px solid rgba(56, 189, 248, 0.5)',
                  color: isLiveSynced ? '#4ade80' : '#38bdf8',
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isLiveSynced ? '#22c55e' : '#38bdf8',
                    animation: isLiveSynced ? 'pulse 1.2s infinite' : 'none',
                  }} />
                  {isLiveSynced ? '● 100% REAL-TIME LIVE NOW' : 'SIMULATION MODE'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} color="#38bdf8" />
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {simDate.toUTCString()}
                  </span>
                </div>
                <span style={{ color: '#475569' }}>·</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  JD {currentJD.toFixed(4)}
                </span>
                <span style={{ color: '#475569' }}>·</span>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  CR {solarTelemetry.carringtonRotation}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Time Sync, Speeds, Layers, Views */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Sync to Live */}
            <button
              onClick={syncToLiveNow}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 11px', borderRadius: '8px',
                background: isLiveSynced ? 'rgba(52, 211, 153, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: isLiveSynced ? '1px solid #34d399' : '1px solid rgba(148, 163, 184, 0.3)',
                color: isLiveSynced ? '#34d399' : '#e2e8f0', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
              }}
              title="Snap planetary positions to real-time current date"
            >
              <Zap size={14} />
              <span>{isLiveSynced ? '● Live Ephemeris' : 'Sync Live'}</span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => { setIsPlaying(!isPlaying); soundFx.playClick(600); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 11px', borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#e2e8f0', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px',
              }}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>

            {/* Sim Speed */}
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.85)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.25)', padding: '2px' }}>
              {[
                { label: 'Real', val: 1 },
                { label: '7D/s', val: 7 },
                { label: '30D/s', val: 30 },
                { label: '90D/s', val: 90 },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => { setSimSpeed(s.val); setIsLiveSynced(s.val === 1); soundFx.playClick(800); }}
                  style={{
                    padding: '5px 8px', borderRadius: '6px', border: 'none',
                    background: simSpeed === s.val ? '#0284c7' : 'transparent',
                    color: simSpeed === s.val ? '#fff' : '#94a3b8',
                    cursor: 'pointer', fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  }}
                >{s.label}</button>
              ))}
            </div>

            {/* Layer Toggles */}
            <button
              onClick={() => { setShowStations(!showStations); soundFx.playClick(600); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 9px', borderRadius: '8px',
                background: showStations ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: showStations ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                color: showStations ? '#38bdf8' : '#94a3b8', cursor: 'pointer',
                fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700,
              }}
              title="Toggle ISS, Tiangong & Lunar Gateway"
            >
              <Satellite size={13} />
              <span>Stations</span>
            </button>

            <button
              onClick={() => { setShowSolarFleet(!showSolarFleet); soundFx.playClick(600); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 9px', borderRadius: '8px',
                background: showSolarFleet ? 'rgba(249, 115, 22, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: showSolarFleet ? '1px solid #f97316' : '1px solid rgba(148, 163, 184, 0.3)',
                color: showSolarFleet ? '#f97316' : '#94a3b8', cursor: 'pointer',
                fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700,
              }}
              title="Toggle Parker Solar Probe, JWST & Fleet"
            >
              <Flame size={13} />
              <span>Solar Fleet</span>
            </button>

            <button
              onClick={() => { setShowOrbits(!showOrbits); soundFx.playClick(600); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 9px', borderRadius: '8px',
                background: showOrbits ? 'rgba(168, 85, 247, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: showOrbits ? '1px solid #a855f7' : '1px solid rgba(148, 163, 184, 0.3)',
                color: showOrbits ? '#c084fc' : '#94a3b8', cursor: 'pointer',
                fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700,
              }}
              title="Toggle orbital lines"
            >
              <Activity size={13} />
              <span>Orbits</span>
            </button>

            <button
              onClick={() => { setShowLabels(!showLabels); soundFx.playClick(600); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 9px', borderRadius: '8px',
                background: showLabels ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: showLabels ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                color: showLabels ? '#38bdf8' : '#94a3b8', cursor: 'pointer',
                fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700,
              }}
              title="Toggle entity name labels"
            >
              <Info size={13} />
              <span>Labels</span>
            </button>

            {/* Close */}
            <button
              onClick={() => { onClose(); soundFx.playClick(500); }}
              style={{
                background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px', padding: '7px', color: '#94a3b8', cursor: 'pointer', marginLeft: '6px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ═══ MAIN 3D VIEWPORT & SIDEBAR ═══ */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          {/* 3D Canvas Container */}
          <div ref={mountRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative', cursor: 'crosshair' }}>
            {/* Camera Quick-Jump HUD Floating Bar */}
            <div style={{
              position: 'absolute', top: '14px', left: '14px', zIndex: 10,
              display: 'flex', gap: '6px', background: 'rgba(9, 14, 26, 0.88)',
              padding: '6px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)',
              backdropFilter: 'blur(10px)', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, alignSelf: 'center', padding: '0 6px', fontFamily: 'var(--font-mono)' }}>
                FLY-TO VIEW:
              </span>
              {[
                { id: 'sun', label: '☀️ Solar Overview', icon: <Sun size={12} /> },
                { id: 'inner', label: '🪨 Inner Planets', icon: <Crosshair size={12} /> },
                { id: 'earth-system', label: '🌍 Earth & Stations (ISS)', icon: <Globe size={12} /> },
                { id: 'parker-solar-probe', label: '🔥 Parker Solar Probe', icon: <Flame size={12} /> },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => focusOnTarget(view.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 10px', borderRadius: '8px', border: 'none',
                    background: cameraTarget === view.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                    color: cameraTarget === view.id ? '#38bdf8' : '#cbd5e1',
                    borderBottom: cameraTarget === view.id ? '2px solid #38bdf8' : '2px solid transparent',
                    cursor: 'pointer', fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  }}
                >
                  {view.icon}
                  <span>{view.label}</span>
                </button>
              ))}
            </div>

            {/* Bottom HUD Helper */}
            <div style={{
              position: 'absolute', bottom: '14px', left: '14px', padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(9, 14, 26, 0.90)', border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '11px',
              backdropFilter: 'blur(10px)', pointerEvents: 'none', display: 'flex', gap: '14px',
            }}>
              <span>🖱️ Drag: Orbit Angle</span>
              <span>🔍 Scroll: Zoom In/Out</span>
              <span><MousePointerClick size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Click Planet / Station / Probe to Inspect</span>
            </div>
          </div>

          {/* ═══ RIGHT SCIENTIFIC DOSSIER SIDEBAR ═══ */}
          <div style={{
            width: '420px',
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            borderLeft: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
            {/* Top Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(56, 189, 248, 0.15)' }}>
              {[
                { id: 'planet' as const, label: 'Planets', icon: <Sparkles size={13} /> },
                { id: 'stations' as const, label: 'Space Stations', icon: <Satellite size={13} /> },
                { id: 'solar' as const, label: 'Solar Fleet', icon: <Flame size={13} /> },
                { id: 'zones' as const, label: 'Orbital Zones', icon: <Layers size={13} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setSidebarTab(tab.id); soundFx.playClick(700); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    padding: '12px 6px', border: 'none', cursor: 'pointer',
                    background: sidebarTab === tab.id ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    borderBottom: sidebarTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                    color: sidebarTab === tab.id ? '#38bdf8' : '#64748b',
                    fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>

              {/* ─── TAB 1: PLANET DETAILS ─── */}
              {sidebarTab === 'planet' && (
                <>
                  {/* Planet Selector Grid */}
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Target Planet Selector
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
                      {PLANETS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPlanet(p);
                            setSelectedStation(null);
                            setSelectedSolarMission(null);
                            setCameraTarget(p.id);
                            soundFx.playClick(750);
                          }}
                          style={{
                            padding: '8px 4px', borderRadius: '8px',
                            background: selectedPlanet.id === p.id && cameraTarget === p.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.55)',
                            border: selectedPlanet.id === p.id && cameraTarget === p.id ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.15)',
                            color: selectedPlanet.id === p.id && cameraTarget === p.id ? '#38bdf8' : '#e2e8f0',
                            cursor: 'pointer', fontSize: '10.5px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '14px' }}>{p.emoji}</div>
                          <div style={{ marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Planet Dossier */}
                  <div style={{
                    background: 'rgba(9, 14, 26, 0.85)', borderRadius: '14px',
                    border: '1px solid rgba(56, 189, 248, 0.3)', padding: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                          {selectedPlanet.emoji} {selectedPlanet.name}
                        </h3>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                          Heliocentric Distance: {selectedPlanet.distanceAU}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '10px', color: '#020617', fontFamily: 'var(--font-mono)', fontWeight: 800,
                        background: `${selectedPlanet.zone.includes('Habitable') ? '#22c55e' : '#38bdf8'}`,
                        padding: '3px 9px', borderRadius: '9999px',
                      }}>
                        {selectedPlanet.zone}
                      </span>
                    </div>

                    {/* Solar Ephemeris Telemetry Box */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px',
                      background: 'rgba(15, 23, 42, 0.7)', padding: '10px', borderRadius: '10px',
                      border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '12px',
                    }}>
                      <div>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Live Distance to Earth</span>
                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                          {selectedPlanet.id === 'earth' ? '0.00 AU (Origin)' : `${solarTelemetry.earthDistAU} AU (${solarTelemetry.earthDistKm}M km)`}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Live Earth Radio Delay</span>
                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                          {selectedPlanet.id === 'earth' ? '0.00 s' : `${solarTelemetry.earthLightDelayMin} mins`}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Solar Irradiance</span>
                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                          {solarTelemetry.fluxWm2} W/m²
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Heliocentric Longitude</span>
                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                          {solarTelemetry.heliocentricLongitude}°
                        </div>
                      </div>
                    </div>

                    {/* Detailed Metric Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: '#cbd5e1' }}>
                      {[
                        { label: 'Mean Diameter', value: selectedPlanet.diameterKm },
                        { label: 'Mass', value: selectedPlanet.massKg },
                        { label: 'Surface Gravity', value: selectedPlanet.gravityMs2 },
                        { label: 'Surface Temperature', value: selectedPlanet.surfaceTemp },
                        { label: 'Orbital Period (Year)', value: selectedPlanet.orbitalPeriod },
                        { label: 'Rotation Period (Day)', value: selectedPlanet.dayLength },
                        { label: 'Axial Tilt (Obliquity)', value: selectedPlanet.axialTilt },
                        { label: 'Confirmed Moons', value: String(selectedPlanet.moons) },
                        { label: 'Discovered By', value: selectedPlanet.discoveredBy },
                      ].map((row, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>{row.label}:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textAlign: 'right', maxWidth: '58%' }}>{row.value}</strong>
                        </div>
                      ))}
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '10.5px', marginBottom: '2px' }}>Atmospheric Composition:</span>
                        <span style={{ color: '#67e8f9', fontSize: '11px', fontStyle: 'italic' }}>{selectedPlanet.atmosphere}</span>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '12px', background: 'rgba(30, 41, 59, 0.6)', padding: '10px 12px',
                      borderRadius: '8px', borderLeft: '3px solid #38bdf8',
                    }}>
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '3px' }}>
                        🔬 NASA SCIENCE DOSSIER
                      </span>
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.45 }}>
                        {selectedPlanet.funFact}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ─── TAB 2: SPACE STATIONS (ISS, TIANGONG, GATEWAY, HUBBLE) ─── */}
              {sidebarTab === 'stations' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Satellite size={16} color="#38bdf8" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Orbital Space Stations & Habitats
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                    Real-time tracking of permanent crewed research stations orbiting Earth and the Moon. Click any station to focus camera and inspect live telemetry.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    {SPACE_STATIONS.map((station) => (
                      <div
                        key={station.id}
                        onClick={() => {
                          setSelectedStation(station);
                          setCameraTarget(station.parentBody === 'earth' ? 'earth-system' : 'moon');
                          soundFx.playTelemetryChirp();
                        }}
                        style={{
                          background: selectedStation?.id === station.id ? 'rgba(56, 189, 248, 0.18)' : 'rgba(9, 14, 26, 0.75)',
                          border: selectedStation?.id === station.id ? `2px solid ${station.color}` : '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{station.name}</span>
                          <span style={{
                            fontSize: '9.5px', color: '#020617', fontFamily: 'var(--font-mono)', fontWeight: 800,
                            background: station.color, padding: '2px 8px', borderRadius: '9999px',
                          }}>
                            {station.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                          🏛️ Agency: {station.agency}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: '#38bdf8' }}>
                            🛰️ {station.id === 'iss' && liveIssState.isLive ? `${liveIssState.altitude} km (LIVE)` : `${station.altitudeKm} km`}
                          </span>
                          <span style={{ color: '#f59e0b' }}>
                            ⚡ {station.id === 'iss' && liveIssState.isLive ? `${liveIssState.velocity.toLocaleString()} km/h (LIVE)` : `${station.velocityKmh.toLocaleString()} km/h`}
                          </span>
                          <span style={{ color: '#34d399' }}>👨‍🚀 {station.crewCount} Crew</span>
                        </div>

                        {selectedStation?.id === station.id && (
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.45 }}>
                              {station.description}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '8px', borderRadius: '8px' }}>
                              {(station.id === 'iss' && liveIssState.isLive
                                ? [
                                    { label: 'Altitude', value: `${liveIssState.altitude} km (LIVE LEO)` },
                                    { label: 'Orbital Speed', value: `${liveIssState.velocity.toLocaleString()} km/h (${(liveIssState.velocity / 3600).toFixed(2)} km/s)` },
                                    { label: 'Sub-Satellite Point', value: `${liveIssState.latitude}°N, ${liveIssState.longitude}°W` },
                                    { label: 'Solar Shadow Phase', value: liveIssState.visibility },
                                    ...station.specs.slice(4)
                                  ]
                                : station.specs
                              ).map((sp, i) => (
                                <div key={i} style={{ fontSize: '10.5px' }}>
                                  <span style={{ color: '#94a3b8', display: 'block' }}>{sp.label}:</span>
                                  <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{sp.value}</strong>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                ● Telemetry Stream: DOWNLINK ACTIVE
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  focusOnTarget(station.parentBody === 'earth' ? 'earth-system' : 'moon');
                                }}
                                style={{
                                  padding: '4px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)',
                                  border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '10px',
                                  fontFamily: 'var(--font-mono)', cursor: 'pointer', fontWeight: 700,
                                }}
                              >
                                Fly Camera Up Close
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ─── TAB 3: SOLAR PROBES & DEEP SPACE MISSIONS ─── */}
              {sidebarTab === 'solar' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Flame size={16} color="#f97316" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f97316', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Active NASA & ESA Heliophysics Fleet
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                    Track scientific spacecraft braving the Sun’s scorching corona and Lagrangian points. Real trajectory curves shown in the 3D scene.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    {SOLAR_MISSIONS.map((mission) => (
                      <div
                        key={mission.id}
                        onClick={() => {
                          setSelectedSolarMission(mission);
                          setCameraTarget(mission.id);
                          soundFx.playTelemetryChirp();
                        }}
                        style={{
                          background: selectedSolarMission?.id === mission.id ? 'rgba(249, 115, 22, 0.18)' : 'rgba(9, 14, 26, 0.75)',
                          border: selectedSolarMission?.id === mission.id ? `2px solid ${mission.color}` : '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{mission.name}</span>
                          <span style={{ fontSize: '9.5px', color: mission.color, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                            {mission.agency}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                          🎯 {mission.type}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: '#f59e0b' }}>☀️ {mission.distanceFromSunAU} AU to Sun</span>
                          <span style={{ color: '#38bdf8' }}>⚡ {mission.currentSpeedKms} km/s</span>
                          <span style={{ color: '#34d399' }}>📡 {mission.lightDelayStr}</span>
                        </div>

                        {selectedSolarMission?.id === mission.id && (
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.45 }}>
                              {mission.missionObjective}
                            </p>
                            <div style={{
                              background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)',
                              borderRadius: '8px', padding: '8px 10px', marginBottom: '8px',
                            }}>
                              <span style={{ fontSize: '10px', color: '#f97316', fontWeight: 800, display: 'block' }}>
                                🏆 HISTORIC MILESTONE:
                              </span>
                              <span style={{ fontSize: '11px', color: '#ffedd5' }}>{mission.keyAchievement}</span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                              <strong>Science Payload:</strong> {mission.instruments.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ─── TAB 4: ORBITAL ZONES ─── */}
              {sidebarTab === 'zones' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Layers size={16} color="#a78bfa" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#a78bfa', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Solar System Structural Architecture
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                    The solar system is organized into concentric zones defined by accretion temperature, gravitational equilibrium, and the frost/snow line.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    {ORBITAL_ZONES.map((zone) => (
                      <div
                        key={zone.id}
                        style={{
                          background: 'rgba(9, 14, 26, 0.8)', borderRadius: '12px',
                          border: `1px solid ${zone.color}44`, padding: '12px 14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: zone.color, boxShadow: `0 0 10px ${zone.color}90`,
                          }} />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{zone.name}</span>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                          {zone.description}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {zone.bodies.map((body, i) => (
                            <span
                              key={i}
                              style={{
                                padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                background: `${zone.color}18`, border: `1px solid ${zone.color}33`,
                                color: zone.color,
                              }}
                            >
                              {body}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Official Link at bottom */}
              <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                <a
                  href="https://eyes.nasa.gov/apps/solar-system/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px', borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8', fontSize: '11px', fontWeight: 800,
                    fontFamily: 'var(--font-mono)', textDecoration: 'none',
                  }}
                >
                  <span>Launch Official NASA Eyes Observatory</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
