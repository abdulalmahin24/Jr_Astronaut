# NASA Jr_AstroCamp — Game Engine, Handwritten Notebook & 3D Curriculum Video Package 🚀📓🎬

A comprehensive, standalone, and modular package containing:
1. **Complete Space Gaming Engine** (2D Phaser arcade + 3D Three.js flight physics + Sol 1–30 survival outpost simulation + real-time multiplayer co-op).
2. **Authentic Handwritten STEM Notebook** (realistic lined binder paper, vector SVG pencil sketches, interactive fill-in prompts, and print stylesheet).
3. **3D Curriculum Video Engine & NASA Video Player** (dual-mode 3D WebGL animation stage + official NASA YouTube archive integration, interactive scrub bar, and Houston CapCom speech synthesis).

---

## 📁 Directory Structure

```text
NASA_GAME_AND_HANDNOTE_PACKAGE/
├── index.ts                                # Master barrel export for all modules
├── README.md                               # Architecture & usage documentation
│
├── gaming_engine/                          # Complete Space Gaming Engine
│   ├── game_core/                          # 2D Phaser Engine & Level Data
│   │   ├── PhaserGameManager.ts            # Dynamic Phaser canvas lifecycle manager
│   │   ├── missionGameData.ts              # 76 NASA playable mission configurations
│   │   └── scenes/                         # 6 Custom interactive Phaser scenes
│   │       ├── LaunchScene.ts              # Atmospheric ascent & staging
│   │       ├── DockingScene.ts             # ISS/Lunar Gateway RCS docking alignment
│   │       ├── LunarLandingScene.ts        # Lunar descent & touchdown physics
│   │       ├── RoverScene.ts               # Surface traverse & sample collection
│   │       ├── TelescopeScene.ts           # Deep space mirror alignment & sensor focus
│   │       └── DeepSpaceScene.ts           # Trajectory correction & gravity slingshots
│   │
│   ├── components/                         # Playable 3D Simulators & Game Modals
│   │   ├── MissionGameModal.tsx            # Main unified 2D/3D mission player modal
│   │   ├── ThreeMissionSimulator.tsx       # 3D WebGL Three.js flight mechanics simulator
│   │   ├── SpaceGamesHubModal.tsx          # 3-Tier Space Arcade Hub (Cadet/Officer/Commander)
│   │   ├── MoonbaseAlphaSimulator.tsx      # Lunar base construction & life-support simulator
│   │   ├── BlackHoleSimulator.tsx          # General relativity gravitational lensing simulator
│   │   ├── MoonquakeMapModal.tsx           # Apollo passive seismic experiment 3D globe
│   │   ├── AuthenticCockpitOverlay.tsx     # Authentic HUD overlays (Mercury, Apollo, Shuttle, Orion)
│   │   └── MissionCinematicIntro.tsx       # Pre-flight 3D cinematic camera choreography
│   │
│   ├── simulation_outpost/                 # Survival Outpost Life-Support Engine
│   │   ├── simulationEngine.ts             # Sols 1–30 life-support, power, O2, water & food
│   │   └── gearBonusHelper.ts              # Equipment modifiers and thermal/radiation buffs
│   │
│   ├── multiplayer/                        # Real-Time Crew Co-Op Subsystem
│   │   └── multiplayerMissionService.ts    # BroadcastChannel zero-latency multi-crew station
│   │
│   ├── utils/                              # Standalone Gaming Engine Utilities
│   │   ├── audioEffects.ts                 # Procedural Web Audio space sound synthesizer
│   │   ├── speechEngine.ts                 # Web Speech synthesis with Quindar beeps
│   │   ├── threeDisposeHelper.ts           # Zero-leak WebGL memory & geometry cleanup
│   │   └── modelLoader.ts                  # Shared DRACO/GLTF 3D model asset loader
│   │
│   └── data/                               # Gaming Datasets & Tiers
│       ├── astronautTiers.ts               # Cadet, Specialist, Commander age tier parameters
│       └── nasaInteractiveMissions.ts      # 30 Curated level blueprints & vehicle configurations
│
├── handwritten_notebook/                   # Authentic STEM Handwritten Notebook
│   ├── HandwrittenNotebookView.tsx         # Interactive lined paper notebook component
│   ├── HandwrittenNotebookView.css         # Authentic paper lines, binder holes & margins
│   └── curriculumNotesAudioVideo.ts        # 6 Curated curriculum modules with SVG sketches & prompts
│
└── video_curriculum/                       # 3D Video Curriculum Engine & NASA Archives
    ├── ThreeCurriculumVideoStage.tsx       # 3D WebGL flight animation engine (4 camera angles)
    ├── VideoLessonPlayerView.tsx           # Dual-mode interactive video player (3D + YouTube)
    ├── VideoLessonPlayerView.css           # Video player deck styles, scrub timeline & badges
    ├── curriculumNasaVideoSources.ts       # Curated NASA YouTube IDs, timestamps & transcripts
    ├── CadetAnimationVideoStage.tsx        # Astronaut training pillar video stage
    └── speechEngine.ts                     # Houston CapCom voice narration & radio comms
```

---

## 🚀 Key Features

### 1. 2D Phaser & 3D Three.js Gaming Engine
- **Phaser 2D Arcade Engine**:
  - Zero-asset procedural graphics using high-performance HTML5 Canvas rendering.
  - Multi-stage rocketry: engine ignition, staging separation, atmospheric drag, and orbital insertion.
  - RCS thruster docking mechanics with 6-DOF crosshair alignment.
  - Surface rover traverse with procedural terrain bumps, rock obstacles, and sample caching.
- **Three.js 3D WebGL Photorealistic Simulators**:
  - Multiple visual tones (`REALISTIC_NASA`, `CINEMATIC_GRADE`, `TACTICAL_HUD`).
  - Era-accurate cockpits (`MERCURY_GEMINI`, `APOLLO DSKY`, `SPACE_SHUTTLE CRT`, `ARTEMIS GLASS COCKPIT`).
  - True-to-life physics for lunar descent, orbital rendezvous, and gravity assist slingshots.
- **Multiplayer Crew Stations**:
  - Real-time station synchronization across browser windows or tabs using `BroadcastChannel`.
  - Defined crew roles: **CDR** (Commander/Pilot), **FDO** (Flight Dynamics Officer), **EECOM** (Life Support/Power), and **CAPCOM** (Communications/Audio).

### 2. Authentic Handwritten Notebook View
- **Realistic Binder Paper Aesthetics**:
  - Yellow-ruled binder paper styling with red left margin, punched binder holes, and washi-tape labels.
  - 100% vector SVG hand-drawn diagrams (orbits, rocket staging, water cycle, Kepler ellipses).
- **Active STEM Learning Loop**:
  - Interactive underline fill-in-the-blank questions with instant feedback and hints.
  - Pre-flight prediction and post-flight debrief reflection text areas that persist in `localStorage`.
  - One-click clean print stylesheet (`@media print`) for offline physical classroom worksheets.

### 3. 3D Curriculum Video Engine & NASA Archive Player
- **Dual-Mode Video Switching**:
  - **3D Animation Stage (`ThreeCurriculumVideoStage`)**: Interactive Three.js WebGL simulation with dynamic orbital rendering, staging particles, Mars EDL heat shields, and 4 camera modes (`CINEMATIC`, `CHASE`, `COCKPIT`, `GROUND`).
  - **NASA YouTube Documentary Mode**: Direct integration with verified NASA video archives (Apollo, Artemis, Perseverance, JWST) with precise chapter timestamps.
- **Interactive Quizzes & Mission Decisions**:
  - In-video checkpoints where students must calculate orbital burns or make critical mission decisions before continuing.
- **Houston Voice Narration**:
  - Automated voice guidance via `speechEngine.ts` featuring Apollo Quindar radio comms chirps.

---

## 💻 Quickstart & Integration

### A. Rendering the Video Lesson Player
```tsx
import React from 'react';
import { VideoLessonPlayerView } from './NASA_GAME_AND_HANDNOTE_PACKAGE';

export const VideoLessonDemo: React.FC = () => {
  return (
    <div style={{ padding: '24px', background: '#070c18', minHeight: '100vh' }}>
      <VideoLessonPlayerView
        initialModuleId={1}
        onLaunchMission={(missionId) => console.log('Launch mission clicked:', missionId)}
      />
    </div>
  );
};
```

### B. Rendering the Handwritten Notebook
```tsx
import React from 'react';
import { HandwrittenNotebookView } from './NASA_GAME_AND_HANDNOTE_PACKAGE';

export const NotebookPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', background: '#090d16', minHeight: '100vh' }}>
      <HandwrittenNotebookView
        initialModuleId={1}
        onLaunchMission={(missionId) => console.log('Launch mission clicked:', missionId)}
      />
    </div>
  );
};
```

### C. Launching the 3D Space Flight Simulator
```tsx
import React, { useState } from 'react';
import { ThreeMissionSimulator, MISSION_GAME_DATA } from './NASA_GAME_AND_HANDNOTE_PACKAGE';

export const SimulatorView: React.FC = () => {
  const [missionComplete, setMissionComplete] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ThreeMissionSimulator
        config={MISSION_GAME_DATA['artemis-2-flight']}
        tier="COMMANDER"
        visualTone="REALISTIC_NASA"
        onComplete={(score) => {
          console.log('Mission finished! Score:', score);
          setMissionComplete(true);
        }}
        onAbort={() => console.log('Mission aborted')}
      />
    </div>
  );
};
```

---

## 🛠️ Dependencies
The package is designed to operate on standard React + Three.js stacks:
- `react`, `react-dom` (>= 18)
- `three` (>= 0.160)
- `phaser` (>= 3.60)
- `lucide-react`
- `canvas-confetti` (for victory celebrations)

*Crafted for NASA Space Apps & Jr_AstroCamp.*
