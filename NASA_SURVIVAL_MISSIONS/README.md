# 🛡️ NASA Survival Missions — Standalone Scientific Package
**Built for the NASA International Space Apps Challenge 2026**  
**Team Mysterio** · Grounded in official NASA Open Science repositories (`data.nasa.gov`, `api.nasa.gov`, `earthdata.nasa.gov`, `jpl.nasa.gov`).

---

## 📁 Package Directory Structure

```text
NASA_SURVIVAL_MISSIONS/
├── index.ts                            # Unified module barrel export
├── README.md                           # Package documentation & usage guide
│
├── data/                               # Physics engines, Keplerian solvers & telemetry
│   ├── nasaSurvivalDataPlan.ts         # 4 Real NASA missions (2 Moon + 2 Mars) with math formulas
│   ├── survivalMissions.ts             # Newtonian gravity, Keplerian solver, suicide burn & debris
│   └── fullMissionLifecycle.ts         # VAB rocket builder, Pad weather, 8-phase mission lifecycle
│
├── components/                         # Standalone 3D flight & mission UI components
│   ├── NasaSurvivalPlanViewer.tsx      # Standalone card viewer for the 4 survival missions
│   ├── HardcoreSurvivalSimulator.tsx   # 3D Three.js orbital rocket simulator with telemetry HUD
│   └── FullMissionLifecycleModal.tsx   # 8-phase full simulator with VAB & walkable Moon EVA
│
└── docs/                               # Scientific reports & judging rubric verification
    └── NASA_SURVIVAL_MISSIONS_REAL_DATA_PLAN.md # Deep-dive formulas, KaTeX math & citations
```

---

## 🚀 The 4 Real NASA Survival Missions (2 Moon + 2 Mars)

| # | Mission | Destination | Real NASA Phenomenon | Mathematical Model | NASA Platform & Citation |
|---|---|---|---|---|---|
| **1** | **Apollo PSE Station S11** | 🌕 Moon (Mare Tranquillitatis) | Shallow Moonquakes & High-$Q$ Regolith Resonance | $A(t) = A_0 \cdot e^{-\frac{\omega t}{2Q}} \cdot \sin(\omega t + \phi)$ ($Q = 3,500$) | `data.nasa.gov` · Apollo PSE Catalog (Nakamura 1979) |
| **2** | **Malapert Mountain Solar Storm** | 🌕 Moon (Lunar South Pole) | Class X7.2 Coronal Mass Ejection Proton Flux ($> 12,000\text{ pfu}$) | $I(x) = I_0 \cdot e^{-\mu_{\text{regolith}} \cdot x}$ (2.0m regolith shield) | `api.nasa.gov` · NASA DONKI CME & SPE Service |
| **3** | **Gale Crater Planet Dust Storm** | 🔴 Mars (Gale / Aeolis Palus) | Planet-Encircling Dust Storm, $\tau = 4.2$, Sub-Zero Drop ($-85^\circ\text{C}$) | $I_{\text{surface}} = I_{\text{top}} \cdot e^{-\frac{\tau}{\cos(\theta_z)}}$ (MMRTG switch) | `jpl.nasa.gov` · Curiosity REMS & MEDA PDS Archive |
| **4** | **Coprates Chasma Canyon Entry** | 🔴 Mars (Valles Marineris) | $-6,800\text{m}$ Depth, $1,150\text{ Pa}$ Air, $45\text{ m/s}$ Katabatic Wind Shear | $F_{\text{katabatic}} = -\rho \cdot \theta_{\text{anom}} \cdot g \cdot \sin(\alpha) - \frac{1}{2} C_d \rho v^2$ | `earthdata.nasa.gov` · MOLA 128 ppd Topography |

---

## 🛠️ How to Import and Use

### 1. In Any React Application:
```tsx
import {
  NasaSurvivalPlanViewer,
  HardcoreSurvivalSimulator,
  NASA_SURVIVAL_DATA_PLAN
} from './NASA_SURVIVAL_MISSIONS';

export const App = () => {
  return (
    <div>
      {/* 1. Standalone Survival Plan Viewer */}
      <NasaSurvivalPlanViewer
        onLaunchMission={(missionId) => console.log('Launching', missionId)}
        onClose={() => console.log('Closed')}
      />

      {/* 2. 3D Hardcore Spaceflight & Orbital Mechanics Simulator */}
      <HardcoreSurvivalSimulator
        initialMissionId="lunar-voyager"
        onClose={() => console.log('Exit')}
      />
    </div>
  );
};
```

### 2. Using Physics Calculations Directly:
```ts
import {
  computeKeplerianElements,
  calculateSuicideBurnAltitude,
  CELESTIAL_BODIES
} from './NASA_SURVIVAL_MISSIONS';

// Calculate exact Suicide Burn altitude on the Moon:
const burn = calculateSuicideBurnAltitude(
  -220, // 220 m/s downward vertical speed
  28.5, // 28.5 m/s^2 descent engine thrust
  CELESTIAL_BODIES.MOON.surfaceGravityMs2 // 1.622 m/s^2
);
console.log(`Ignite suicide burn at ${burn.suicideBurnDistanceM} meters altitude!`);
```

---

## 🌐 Official NASA Open Data Access Links
- **NASA Open Data Portal**: [https://data.nasa.gov](https://data.nasa.gov)
- **NASA API Portal (Free Key)**: [https://api.nasa.gov](https://api.nasa.gov)
- **NASA Earthdata**: [https://earthdata.nasa.gov](https://earthdata.nasa.gov)
- **NASA JPL Scientific Resources**: [https://www.jpl.nasa.gov](https://www.jpl.nasa.gov)

