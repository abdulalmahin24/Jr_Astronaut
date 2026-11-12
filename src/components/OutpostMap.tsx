import React, { useState } from 'react';
import type { OutpostModules, ResourceState } from '../types/game';
import { Sun, Moon, AlertTriangle, CheckCircle, Info, Zap, Shield, Heart, Wind, Sparkles } from 'lucide-react';

export interface OutpostMapProps {
  currentSol: number;
  modules: OutpostModules;
  resources: ResourceState;
  destination?: 'MOON' | 'MARS';
  builtModules?: string[];
  equipmentCondition?: number;
}

type OutpostModuleKey =
  | 'habitat'
  | 'solar'
  | 'battery'
  | 'greenhouse'
  | 'o2unit'
  | 'water'
  | 'shieldwall'
  | 'kilopower'
  | 'rover';

interface ModuleDetail {
  id: OutpostModuleKey;
  name: string;
  simpleWhat: string;
  outputNow: string;
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  statusColor: string;
  nasaFact: string;
}

export const OutpostMap: React.FC<OutpostMapProps> = ({
  currentSol,
  modules,
  resources,
  destination = 'MOON',
  builtModules = [],
}) => {
  const [selectedModule, setSelectedModule] = useState<OutpostModuleKey | null>(null);

  const isMars = destination === 'MARS';
  const isLunarNight = !isMars && currentSol >= 16 && currentSol <= 27;

  // Track purchased/built expansions
  const hasExtraSolar = builtModules.includes('SOLAR_ARRAY');
  const hasExtraBattery = builtModules.includes('BATTERY_STORAGE');
  const hasKilopower = builtModules.includes('KILOPOWER_REACTOR');
  const hasSabatierO2 = builtModules.includes('O2_SABATIER');
  const hasWaterRecycler = builtModules.includes('WATER_RECYCLER');
  const hasExtraGreenhouse = builtModules.includes('GREENHOUSE_POD');
  const hasReinforcedShield = builtModules.includes('REGOLITH_VAULT');
  const hasExpandedHab = builtModules.includes('HABITAT_EXPANSION') || builtModules.includes('REC_HABITAT');

  // Resource threshold flags for red glows
  const isPowerLow = resources.power < 30;
  const isOxygenLow = resources.oxygen < 30;
  const isWaterLow = resources.water < 30;
  const isFoodLow = resources.food < 10;
  const isShieldLow = (resources.shielding ?? 75) < 30;

  const getModuleDetails = (key: OutpostModuleKey): ModuleDetail => {
    switch (key) {
      case 'habitat':
        return {
          id: 'habitat',
          name: isMars ? 'Jezero Pressurized Habitat Dome' : 'Artemis Inflatable Habitat Dome',
          simpleWhat: 'Safe pressurized living quarters where astronauts sleep, eat, and monitor missions.',
          outputNow: `Cabin pressure: 101.3 kPa · Oxygen: ${resources.oxygen}% · Health: ${resources.crewHealth}%`,
          status: isOxygenLow ? 'CRITICAL' : resources.crewHealth < 60 ? 'WARNING' : 'NOMINAL',
          statusColor: isOxygenLow ? '#ef4444' : resources.crewHealth < 60 ? '#f59e0b' : '#10b981',
          nasaFact: 'NASA Langley developed expandable trans-hab technology with multi-layer Kevlar and Nextel micrometeorite shielding.',
        };
      case 'solar':
        return {
          id: 'solar',
          name: hasExtraSolar ? 'Twin Deployable Solar PV Wings' : 'Deployable Solar PV Wing',
          simpleWhat: 'Converts bright solar rays into clean electrical power for all base modules.',
          outputNow: isLunarNight
            ? '0 kW (Lunar Night Freeze)'
            : isMars
            ? `Generating ${hasExtraSolar ? '35' : '22'} kW (43% solar irradiance at Mars)`
            : `Generating ${hasExtraSolar ? '45' : '28'} kW (Peak polar ridge sunlight)`,
          status: isLunarNight ? 'WARNING' : isPowerLow ? 'CRITICAL' : 'NOMINAL',
          statusColor: isPowerLow ? '#ef4444' : isLunarNight ? '#f59e0b' : '#10b981',
          nasaFact: 'Artemis Vertical Solar Array Technology (VSAT) masts elevate panels 10 meters high to catch low-angle polar light.',
        };
      case 'battery':
        return {
          id: 'battery',
          name: hasExtraBattery ? 'Heavy Lithium-Ion Energy Bank' : 'Modular Battery Storage Rack',
          simpleWhat: 'Stores daytime solar electricity so life support stays running during night and dust storms.',
          outputNow: `Storage Charge: ${resources.power}% · ${hasExtraBattery ? '+25% extra capacity installed' : 'Standard 100 kWh storage'}`,
          status: isPowerLow ? 'CRITICAL' : resources.power < 60 ? 'WARNING' : 'NOMINAL',
          statusColor: isPowerLow ? '#ef4444' : resources.power < 60 ? '#f59e0b' : '#10b981',
          nasaFact: 'Space-rated Li-Ion batteries use automated thermal jackets to prevent electrolyte freezing down to -130°C.',
        };
      case 'greenhouse':
        return {
          id: 'greenhouse',
          name: hasExtraGreenhouse ? 'Bioregenerative Hydroponic Salad Machine' : 'Space Crop Greenhouse Pod',
          simpleWhat: 'Grows crisp lettuce, dwarf wheat, and sweet potatoes under LED grow lights.',
          outputNow: `Producing +${hasExtraGreenhouse ? '8' : '4'} meals/sol · Rations available: ${resources.food} meals`,
          status: isFoodLow ? 'CRITICAL' : isPowerLow ? 'WARNING' : 'NOMINAL',
          statusColor: isFoodLow ? '#ef4444' : isPowerLow ? '#f59e0b' : '#10b981',
          nasaFact: 'NASA Veggie & Advanced Plant Habitat (APH) aboard the ISS demonstrated fresh crops improve astronaut mental wellbeing.',
        };
      case 'o2unit':
        return {
          id: 'o2unit',
          name: hasSabatierO2 ? 'Sabatier O₂ Generator & Scrubber' : 'ECLSS Oxygen Generator',
          simpleWhat: 'Cleans carbon dioxide from astronaut breath and produces fresh breathable oxygen.',
          outputNow: `Air Purity: ${resources.oxygen}% · ${hasSabatierO2 ? 'Sabatier catalyst online' : 'Standard oxygen loop'}`,
          status: isOxygenLow ? 'CRITICAL' : resources.oxygen < 60 ? 'WARNING' : 'NOMINAL',
          statusColor: isOxygenLow ? '#ef4444' : resources.oxygen < 60 ? '#f59e0b' : '#10b981',
          nasaFact: 'The Sabatier chemical reaction (CO₂ + 4H₂ → CH₄ + 2H₂O) recovers over 50% of oxygen from exhaled crew carbon dioxide.',
        };
      case 'water':
        return {
          id: 'water',
          name: hasWaterRecycler ? 'Closed-Loop Water Recovery System' : 'Moisture Recovery Loop',
          simpleWhat: 'Recycles 98% of humidity, breath condensation, and wash water into pure drinking water.',
          outputNow: `Water Reserves: ${resources.water}% · Recovery efficiency: 98%`,
          status: isWaterLow ? 'CRITICAL' : resources.water < 60 ? 'WARNING' : 'NOMINAL',
          statusColor: isWaterLow ? '#ef4444' : resources.water < 60 ? '#f59e0b' : '#10b981',
          nasaFact: 'The ISS Water Recovery System (WRS) cleans sweat and cabin humidity so well it is purer than municipal tap water on Earth.',
        };
      case 'shieldwall':
        return {
          id: 'shieldwall',
          name: hasReinforcedShield ? 'Reinforced Sintered Regolith Shield Berm' : 'Radiation Shield Berm',
          simpleWhat: 'Thick protective wall built from laser-melted space dirt to block cosmic rays and space storms.',
          outputNow: `Shielding: ${resources.shielding ?? 75}% · Absorbs ${hasReinforcedShield ? '85%' : '70%'} of cosmic radiation`,
          status: isShieldLow ? 'CRITICAL' : (resources.shielding ?? 75) < 60 ? 'WARNING' : 'NOMINAL',
          statusColor: isShieldLow ? '#ef4444' : (resources.shielding ?? 75) < 60 ? '#f59e0b' : '#10b981',
          nasaFact: 'Lunar and Martian soil (regolith) is rich in basalt, aluminum, and iron, providing radiation absorption comparable to water.',
        };
      case 'kilopower':
        return {
          id: 'kilopower',
          name: 'Kilopower 10 kWe Stirling Fission Reactor',
          simpleWhat: 'Compact safe nuclear reactor delivering nonstop electricity 24/7, immune to dust storms and darkness.',
          outputNow: hasKilopower ? 'Output: +35 kW constant continuous power' : 'Not yet constructed (Build in left panel)',
          status: hasKilopower ? 'NOMINAL' : 'WARNING',
          statusColor: hasKilopower ? '#10b981' : '#94a3b8',
          nasaFact: 'NASA KRUSTY project tested a 1 kWe reactor with a U-235 cast core and Stirling engines (NASA TM-2019-220311).',
        };
      case 'rover':
        return {
          id: 'rover',
          name: isMars ? 'Perseverance-Class Science Rover' : 'Artemis Lunar Terrain Rover (LTV)',
          simpleWhat: '6-wheel autonomous robotic rover that scouts terrain, collects mineral samples, and supports EVA.',
          outputNow: 'Status: Parked on outpost apron · Sensors active · Battery 100%',
          status: 'NOMINAL',
          statusColor: '#10b981',
          nasaFact: 'NASA rovers use rocker-bogie mobility suspension, allowing them to climb over obstacles larger than their wheels without tipping.',
        };
    }
  };

  const selectedDetail = selectedModule ? getModuleDetails(selectedModule) : null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '360px',
        background: isMars
          ? 'linear-gradient(180deg, #18090a 0%, #30140c 55%, #180b08 100%)'
          : 'linear-gradient(180deg, #050814 0%, #0c152a 55%, #050a16 100%)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #1e3a8a',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* ── TOP STATUS BANNER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'rgba(7, 14, 34, 0.88)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          backdropFilter: 'blur(8px)',
          fontSize: '12px',
          fontWeight: 800,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px' }}>{isMars ? '🔴' : '🌙'}</span>
          <span style={{ color: '#fff', letterSpacing: '0.04em' }}>
            {isMars ? 'AstroCamp Mars Outpost · Jezero Crater' : 'Artemis Base Camp · Shackleton Crater'}
          </span>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              padding: '1px 8px',
              borderRadius: '9999px',
              fontSize: '10px',
            }}
          >
            OVERVIEW
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#cbd5e1' }}>
          {isLunarNight ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8' }}>
              <Moon size={14} className="animate-pulse" />
              <span>Lunar Night Freeze (-130°C) · Solar: 0 kW</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fbbf24' }}>
              <Sun size={14} />
              <span>{isMars ? 'Martian Daylight · 43% Sun' : 'Shackleton Peak of Eternal Light · Solar Nominal'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── BRIGHT INTERACTIVE SVG OUTPOST OVERVIEW ── */}
      <div style={{ position: 'relative', width: '100%', height: '320px' }}>
        <svg
          viewBox="0 0 900 420"
          style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
        >
          <defs>
            {/* Terrain Gradients */}
            <linearGradient id="lunarGround" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#252d3d" />
              <stop offset="60%" stopColor="#1a202c" />
              <stop offset="100%" stopColor="#0f141f" />
            </linearGradient>
            <linearGradient id="marsGround" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c2d12" />
              <stop offset="50%" stopColor="#5a200c" />
              <stop offset="100%" stopColor="#2e1008" />
            </linearGradient>

            {/* Habitat Dome Material */}
            <linearGradient id="habDomeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(240, 249, 255, 0.95)" />
              <stop offset="45%" stopColor="rgba(186, 230, 253, 0.85)" />
              <stop offset="100%" stopColor="rgba(14, 116, 144, 0.75)" />
            </linearGradient>

            {/* Greenhouse Dome Glass */}
            <linearGradient id="greenhouseGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(110, 231, 183, 0.75)" />
              <stop offset="60%" stopColor="rgba(16, 185, 129, 0.45)" />
              <stop offset="100%" stopColor="rgba(6, 78, 59, 0.6)" />
            </linearGradient>

            {/* Solar Cell Texture */}
            <linearGradient id="solarCell" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            {/* Radiation Shield Wall */}
            <linearGradient id="bermGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="alertGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. SKY & DISTANT RIDGES */}
          {/* Distant Hills / Crater Rim */}
          <path
            d={
              isMars
                ? 'M 0 170 Q 180 120 400 150 T 900 140 L 900 240 L 0 240 Z'
                : 'M 0 160 Q 220 110 460 140 T 900 130 L 900 240 L 0 240 Z'
            }
            fill={isMars ? '#431407' : '#141c2e'}
            opacity="0.8"
          />

          {/* Earth in Moon Sky / Phobos in Mars Sky */}
          {!isMars ? (
            <g transform="translate(70, 45)">
              <circle cx="20" cy="20" r="18" fill="#0284c7" />
              <circle cx="16" cy="16" r="14" fill="#38bdf8" opacity="0.6" />
              <path d="M 12 12 Q 22 18 24 28 Q 18 24 14 26 Z" fill="#22c55e" opacity="0.8" />
              <circle cx="20" cy="20" r="18" stroke="rgba(186, 230, 253, 0.45)" strokeWidth="2" fill="none" filter="url(#softGlow)" />
            </g>
          ) : (
            <g transform="translate(80, 50)">
              <ellipse cx="14" cy="14" rx="10" ry="8" fill="#a8a29e" opacity="0.85" />
              <circle cx="12" cy="12" r="2" fill="#78716c" />
              <circle cx="17" cy="15" r="1.5" fill="#78716c" />
            </g>
          )}

          {/* Stars / Dust in sky */}
          <circle cx="180" cy="40" r="1.5" fill="#ffffff" opacity="0.7" />
          <circle cx="340" cy="60" r="1" fill="#ffffff" opacity="0.6" />
          <circle cx="560" cy="35" r="1.5" fill="#ffffff" opacity="0.75" />
          <circle cx="780" cy="55" r="1" fill="#ffffff" opacity="0.5" />

          {/* 2. BASE GROUND PLATFORM */}
          <ellipse
            cx="450"
            cy="270"
            rx="430"
            ry="130"
            fill={isMars ? 'url(#marsGround)' : 'url(#lunarGround)'}
            stroke={isMars ? '#9a3412' : '#334155'}
            strokeWidth="2"
          />

          {/* Craters / Surface Rocks */}
          <ellipse cx="220" cy="330" rx="40" ry="14" fill={isMars ? '#451a03' : '#0f172a'} opacity="0.6" />
          <ellipse cx="710" cy="310" rx="35" ry="12" fill={isMars ? '#451a03' : '#0f172a'} opacity="0.5" />
          <ellipse cx="480" cy="370" rx="25" ry="8" fill={isMars ? '#451a03' : '#0f172a'} opacity="0.4" />

          {/* 3. SHIELD WALL (REGOLITH BERM) - Surrounding perimeter */}
          <g
            onClick={() => setSelectedModule('shieldwall')}
            style={{ cursor: 'pointer' }}
            filter={isShieldLow ? 'url(#alertGlow)' : undefined}
          >
            {/* Back arc of berm */}
            <path
              d="M 120 220 Q 450 160 780 220"
              fill="none"
              stroke={isShieldLow ? '#ef4444' : hasReinforcedShield ? '#64748b' : '#475569'}
              strokeWidth={hasReinforcedShield ? '14' : '8'}
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Front left berm corner */}
            <path
              d="M 120 220 Q 90 260 140 290"
              fill="none"
              stroke={isShieldLow ? '#ef4444' : hasReinforcedShield ? '#64748b' : '#475569'}
              strokeWidth={hasReinforcedShield ? '12' : '7'}
              strokeLinecap="round"
            />
            {/* Berm label chip */}
            <rect x="100" y="295" width="85" height="18" rx="4" fill="#0f172a" stroke={isShieldLow ? '#ef4444' : '#64748b'} strokeWidth="1" />
            <text x="142" y="308" textAnchor="middle" fill={isShieldLow ? '#ef4444' : '#94a3b8'} fontSize="9" fontWeight="800">
              🛡️ SHIELD WALL
            </text>
          </g>

          {/* 4. POWER CONDUITS (Glowing lines connecting to modules) */}
          <path
            d="M 230 230 L 410 245"
            stroke={isPowerLow ? '#ef4444' : '#f59e0b'}
            strokeWidth="2.5"
            strokeDasharray="4 4"
            opacity="0.85"
          />
          <path
            d="M 450 250 L 640 240"
            stroke={isFoodLow ? '#ef4444' : '#10b981'}
            strokeWidth="2.5"
            strokeDasharray="4 4"
            opacity="0.85"
          />
          <path
            d="M 440 250 L 520 205"
            stroke={isOxygenLow ? '#ef4444' : '#38bdf8'}
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.75"
          />

          {/* 5. SOLAR PANELS (Left) */}
          <g
            onClick={() => setSelectedModule('solar')}
            style={{ cursor: 'pointer' }}
            filter={isPowerLow ? 'url(#alertGlow)' : undefined}
          >
            {/* Solar Mast 1 */}
            <line x1="200" y1="230" x2="200" y2="135" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            {/* Crossbeam */}
            <line x1="175" y1="145" x2="225" y2="145" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Primary PV Wings */}
            <rect
              x="160"
              y="125"
              width="80"
              height="34"
              rx="3"
              fill={isLunarNight ? '#1e293b' : 'url(#solarCell)'}
              stroke={isPowerLow ? '#ef4444' : '#38bdf8'}
              strokeWidth="1.5"
              transform="rotate(-10 200 142)"
            />
            {/* Grid lines on solar panel */}
            <line x1="175" y1="127" x2="175" y2="157" stroke="rgba(255,255,255,0.3)" strokeWidth="1" transform="rotate(-10 200 142)" />
            <line x1="195" y1="127" x2="195" y2="157" stroke="rgba(255,255,255,0.3)" strokeWidth="1" transform="rotate(-10 200 142)" />
            <line x1="215" y1="127" x2="215" y2="157" stroke="rgba(255,255,255,0.3)" strokeWidth="1" transform="rotate(-10 200 142)" />

            {/* Extra Solar Wing (if purchased) */}
            {hasExtraSolar && (
              <g transform="translate(-45, 15)">
                <line x1="200" y1="220" x2="200" y2="145" stroke="#94a3b8" strokeWidth="3" />
                <rect
                  x="165"
                  y="135"
                  width="70"
                  height="28"
                  rx="3"
                  fill="url(#solarCell)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  transform="rotate(-12 200 149)"
                />
              </g>
            )}

            <rect x="155" y="235" width="90" height="18" rx="4" fill="#0f172a" stroke={isPowerLow ? '#ef4444' : '#f59e0b'} strokeWidth="1" />
            <text x="200" y="248" textAnchor="middle" fill={isPowerLow ? '#ef4444' : '#f59e0b'} fontSize="9" fontWeight="800">
              ⚡ SOLAR WINGS
            </text>
          </g>

          {/* 6. BATTERY BANK (Beside Solar Panels) */}
          <g
            onClick={() => setSelectedModule('battery')}
            style={{ cursor: 'pointer' }}
            filter={isPowerLow ? 'url(#alertGlow)' : undefined}
          >
            {/* Battery Cabinet */}
            <rect
              x="260"
              y="220"
              width="36"
              height="38"
              rx="4"
              fill="#1e293b"
              stroke={isPowerLow ? '#ef4444' : '#38bdf8'}
              strokeWidth="1.5"
            />
            {/* LED Charge Bars */}
            <rect x="266" y="226" width="24" height="4" rx="1" fill={resources.power >= 75 ? '#10b981' : '#334155'} />
            <rect x="266" y="233" width="24" height="4" rx="1" fill={resources.power >= 50 ? '#10b981' : '#334155'} />
            <rect x="266" y="240" width="24" height="4" rx="1" fill={resources.power >= 25 ? '#f59e0b' : '#334155'} />
            <rect x="266" y="247" width="24" height="4" rx="1" fill={resources.power > 0 ? (isPowerLow ? '#ef4444' : '#10b981') : '#334155'} />

            {/* Extra Battery Storage expansion marker */}
            {hasExtraBattery && (
              <rect x="298" y="228" width="20" height="30" rx="3" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
            )}

            <rect x="245" y="262" width="66" height="16" rx="3" fill="#0f172a" stroke={isPowerLow ? '#ef4444' : '#38bdf8'} strokeWidth="1" />
            <text x="278" y="274" textAnchor="middle" fill={isPowerLow ? '#ef4444' : '#38bdf8'} fontSize="8.5" fontWeight="800">
              🔋 BATTERY
            </text>
          </g>

          {/* 7. KILOPOWER NUCLEAR REACTOR (Rendered if built) */}
          {hasKilopower && (
            <g onClick={() => setSelectedModule('kilopower')} style={{ cursor: 'pointer' }}>
              <rect x="130" y="180" width="24" height="30" rx="4" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="142" y1="180" x2="142" y2="160" stroke="#ef4444" strokeWidth="2.5" />
              <circle cx="142" cy="158" r="4" fill="#f87171" filter="url(#softGlow)" />
              <rect x="115" y="212" width="54" height="15" rx="3" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
              <text x="142" y="223" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontWeight="800">
                ⚛️ KILOPOWER
              </text>
            </g>
          )}

          {/* 8. AIR MAKER (SABATIER O2 UNIT) (Behind Hab) */}
          <g
            onClick={() => setSelectedModule('o2unit')}
            style={{ cursor: 'pointer' }}
            filter={isOxygenLow ? 'url(#alertGlow)' : undefined}
          >
            {/* Chemical Reactor Tank */}
            <rect
              x="500"
              y="180"
              width="34"
              height="40"
              rx="6"
              fill="#0f172a"
              stroke={isOxygenLow ? '#ef4444' : '#38bdf8'}
              strokeWidth="1.5"
            />
            {/* Oxygen Gas Pressure Tank */}
            <circle cx="517" cy="195" r="7" fill={isOxygenLow ? '#ef4444' : '#0284c7'} opacity="0.8" />
            {/* Vapor exhaust conduit */}
            <line x1="517" y1="180" x2="517" y2="168" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="517" cy="165" r="3" fill="#e0f2fe" opacity="0.75" />

            <rect x="480" y="222" width="74" height="16" rx="3" fill="#0f172a" stroke={isOxygenLow ? '#ef4444' : '#38bdf8'} strokeWidth="1" />
            <text x="517" y="234" textAnchor="middle" fill={isOxygenLow ? '#ef4444' : '#38bdf8'} fontSize="8" fontWeight="800">
              💨 AIR MAKER
            </text>
          </g>

          {/* 9. WATER RECYCLER (Near Hab & Greenhouse) */}
          <g
            onClick={() => setSelectedModule('water')}
            style={{ cursor: 'pointer' }}
            filter={isWaterLow ? 'url(#alertGlow)' : undefined}
          >
            {/* Distillation Cylinder */}
            <rect
              x="550"
              y="225"
              width="26"
              height="36"
              rx="4"
              fill="#082f49"
              stroke={isWaterLow ? '#ef4444' : '#06b6d4'}
              strokeWidth="1.5"
            />
            <circle cx="563" cy="238" r="5" fill="#38bdf8" opacity="0.8" />
            <line x1="563" y1="244" x2="563" y2="255" stroke="#0284c7" strokeWidth="2" />
          </g>

          {/* 10. CENTRAL HABITAT DOME (Centerpiece) */}
          <g
            onClick={() => setSelectedModule('habitat')}
            style={{ cursor: 'pointer' }}
            filter={isOxygenLow ? 'url(#alertGlow)' : undefined}
          >
            {/* Habitat base ring */}
            <ellipse cx="440" cy="255" rx="85" ry="32" fill="#0b1329" stroke={isOxygenLow ? '#ef4444' : '#38bdf8'} strokeWidth="2" />

            {/* Expanded Hab module pod (if built) */}
            {hasExpandedHab && (
              <g transform="translate(-48, 12)">
                <ellipse cx="410" cy="245" rx="35" ry="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 375 245 Q 410 185 445 245 Z" fill="url(#habDomeGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="410" cy="215" r="4" fill="#38bdf8" />
              </g>
            )}

            {/* Inflatable Pressurized Dome Shell */}
            <path
              d="M 360 250 Q 440 135 520 250 Z"
              fill="url(#habDomeGrad)"
              stroke={isOxygenLow ? '#ef4444' : '#38bdf8'}
              strokeWidth="2.5"
            />

            {/* Observation Porch / Windows with warm light */}
            <circle cx="415" cy="205" r="6" fill="#38bdf8" filter="url(#softGlow)" opacity="0.9" />
            <circle cx="465" cy="205" r="6" fill="#38bdf8" filter="url(#softGlow)" opacity="0.9" />
            <circle cx="440" cy="190" r="5" fill="#fbbf24" filter="url(#softGlow)" opacity="0.95" />

            {/* Airlock Vestibule Portal */}
            <rect x="425" y="248" width="30" height="22" rx="4" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="440" cy="259" r="3" fill={isOxygenLow ? '#ef4444' : '#10b981'} />

            {/* Habitat Label */}
            <rect x="385" y="278" width="110" height="20" rx="4" fill="#0f172a" stroke={isOxygenLow ? '#ef4444' : '#38bdf8'} strokeWidth="1" />
            <text x="440" y="292" textAnchor="middle" fill={isOxygenLow ? '#ef4444' : '#38bdf8'} fontSize="9.5" fontWeight="900">
              🏠 HABITAT DOME
            </text>
          </g>

          {/* 11. SPACE GREENHOUSE (Right) */}
          <g
            onClick={() => setSelectedModule('greenhouse')}
            style={{ cursor: 'pointer' }}
            filter={isFoodLow ? 'url(#alertGlow)' : undefined}
          >
            {/* Greenhouse Base Ring */}
            <ellipse cx="670" cy="245" rx="72" ry="28" fill="#064e3b" stroke={isFoodLow ? '#ef4444' : '#10b981'} strokeWidth="2" />

            {/* Geodesic Glass Dome */}
            <path
              d="M 605 245 Q 670 145 735 245 Z"
              fill="url(#greenhouseGlass)"
              stroke={isFoodLow ? '#ef4444' : '#43ffa0'}
              strokeWidth="2"
            />

            {/* Hydroponic Grow Trays (Interior plants) */}
            <ellipse cx="670" cy="238" rx="42" ry="12" fill="#047857" />
            <circle cx="650" cy="225" r="5" fill="#86efac" />
            <circle cx="670" cy="220" r="6" fill="#4ade80" />
            <circle cx="690" cy="224" r="5" fill="#86efac" />
            {hasExtraGreenhouse && (
              <>
                <circle cx="660" cy="212" r="4" fill="#facc15" />
                <circle cx="680" cy="212" r="4" fill="#facc15" />
              </>
            )}

            {/* Grow Light Ribbon (Warm Pink / White LED) */}
            <line x1="640" y1="180" x2="700" y2="180" stroke="rgba(244, 114, 182, 0.75)" strokeWidth="2" filter="url(#softGlow)" />

            {/* Greenhouse Label */}
            <rect x="620" y="278" width="100" height="20" rx="4" fill="#0f172a" stroke={isFoodLow ? '#ef4444' : '#10b981'} strokeWidth="1" />
            <text x="670" y="292" textAnchor="middle" fill={isFoodLow ? '#ef4444' : '#43ffa0'} fontSize="9.5" fontWeight="900">
              🌱 GREENHOUSE
            </text>
          </g>

          {/* 12. SURFACE ROVER (Foreground) */}
          <g
            onClick={() => setSelectedModule('rover')}
            style={{ cursor: 'pointer' }}
          >
            {/* Rover Chassis */}
            <rect x="330" y="325" width="46" height="18" rx="4" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
            {/* Camera Mast & High-Gain Antenna */}
            <line x1="365" y1="325" x2="365" y2="305" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="365" cy="303" r="3" fill="#0284c7" />
            <line x1="338" y1="325" x2="333" y2="312" stroke="#64748b" strokeWidth="1.5" />

            {/* 6 Wheels (Rocker-Bogie Suspension) */}
            <circle cx="334" cy="347" r="5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="352" cy="347" r="5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="370" cy="347" r="5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Rover Label */}
            <rect x="320" y="356" width="66" height="16" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <text x="353" y="367" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="800">
              🚜 ROVER
            </text>
          </g>

          {/* Subtle Instruction Chip */}
          <g transform="translate(450, 395)">
            <rect x="-110" y="0" width="220" height="20" rx="10" fill="rgba(3, 7, 18, 0.75)" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" />
            <text x="0" y="13" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">
              💡 Click any module to inspect output
            </text>
          </g>
        </svg>
      </div>

      {/* ── INTERACTIVE MODULE INFO CARD (Drawer/Card) ── */}
      {selectedDetail && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            background: 'rgba(7, 15, 38, 0.96)',
            border: `1.5px solid ${selectedDetail.statusColor}`,
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>
                {selectedDetail.name}
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: selectedDetail.statusColor === '#ef4444' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: selectedDetail.statusColor,
                  border: `1px solid ${selectedDetail.statusColor}`,
                }}
              >
                {selectedDetail.status}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, margin: '0 0 4px 0' }}>
              {selectedDetail.simpleWhat}
            </p>

            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
              📊 <strong>Current Output: </strong>{selectedDetail.outputNow}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
              NASA Fact: {selectedDetail.nasaFact}
            </div>
          </div>

          <button
            onClick={() => setSelectedModule(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid #334155',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Close ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default OutpostMap;
