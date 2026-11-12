# 🧪 Jr_AstroCamp: Beyond Earth — Verification & Testing Protocol

**NASA Space Apps Challenge 2026: Build a Junior Astronaut Mission Trainer**  
*Project: Jr_AstroCamp: Beyond Earth*

---

## 1. Testing Summary & Quality Standards

Jr_AstroCamp maintains a dual-verification strategy covering both the interactive web expedition platform (React 19 / TypeScript / Vite / Three.js) and the desktop 60 FPS flight simulator (Python 3 / Pygame-ce):
1. **Automated Simulation Unit Tests (`node tests/test_simulation.mjs`):** Validates deterministic math, cargo mass validation, BVAD consumption formulas, Kilopower night generation, shift actions, boundary clamping, and game-over triggers.
2. **Automated Pygame Engine Headless Tests (`python tests/test_game.py`):** Validates 76 cataloged missions, procedural audio synthesis, 6 flight disciplines, and save file persistence.
3. **TypeScript & Static Linting Verification (`npm run build`):** Enforces strict types (`tsc -b`) and fast modern linting (`oxlint`).
4. **End-to-End Browser & Usability Verification:** Real headless/subagent browser interaction testing UI navigation, modal opening/closing, budget meters, rover driving, and debriefing.

---

## 2. Test Execution & Verified Results

### Test Suite 1: Web Simulation Engine (`npm test` / `node tests/test_simulation.mjs`)
- **Command:** `npm test`
- **Exit Code:** `0` (Clean pass)
- **Verified Assertions (8/8):**
  1. `[PASS]` Initial Game State initialization (Sol 1, baseline resources, nominal modules).
  2. `[PASS]` Outpost Cargo Mass budget calculation (Default lunar outpost: 39,500 kg ≤ 45,000 kg; heavy configuration: 73,000 kg > 45,000 kg blocked).
  3. `[PASS]` Day/Night transition & solar generation (Day: 35 kW, Lunar Night: 0 kW).
  4. `[PASS]` Kilopower Fission Reactor night resilience (25 kW continuous 24/7 power during lunar night).
  5. `[PASS]` Shift Action trade-offs (Power conservation cuts load to 11 kW; science intensive yields +10 pts at 29 kW load).
  6. `[PASS]` Critical failure detection (Battery depletion to 0% during lunar night triggers freeze game over).
  7. `[PASS]` Victory outcome certification at Sol 30.
  8. `[PASS]` Resource boundary capping (Strict clamping to 0% min and 100% max).

### Test Suite 2: Python / Pygame Headless Flight Tests (`python tests/test_game.py`)
- **Command:** `$env:PYTHONIOENCODING="utf-8"; python tests/test_game.py`
- **Exit Code:** `0` (Clean pass)
- **Verified Components:**
  - `[PASS]` 76 historical NASA missions loaded from `nasa_missions_catalog.csv`.
  - `[PASS]` Procedural square/sine wave audio synthesizer.
  - `[PASS]` Launch simulator scene (Mercury-Redstone 3).
  - `[PASS]` Docking simulator scene (Gemini 5).
  - `[PASS]` Deep space navigation scene (Apollo 4, 5, 6).
  - `[PASS]` Lunar lander scene (Apollo 11).
  - `[PASS]` Space telescope guidance scene (Skylab 1-4).
  - `[PASS]` Planetary rover navigation scene (Viking 1 & 2).
  - `[PASS]` Campaign, briefing, and debriefing UI state persistence (`saves/profile.json`).

### Test Suite 3: Production Web Bundle Build (`npm run build`)
- **Command:** `npm run build` (`tsc -b && vite build`)
- **Exit Code:** `0` (Zero compiler errors, zero unresolved imports)
- **Output Artifacts:**
  - `dist/index.html` (1.96 kB)
  - `dist/assets/index-b40epNH5.css` (82.76 kB)
  - `dist/assets/index-CbT_HBWC.js` (3,060.63 kB)
  - Build Duration: 2.34s (1935 modules transformed)

---

## 3. How to Run the Automated Tests

### Web Simulation Test Suite:
```bash
# In project root
npm test
# Or directly with Node.js
node tests/test_simulation.mjs
```

### Production Build:
```bash
npm run build
```

### Python Flight Engine Test Suite:
```bash
# Ensure Python 3.10+ and pygame-ce are installed
pip install -r requirements.txt

# Run headless verification (Windows PowerShell)
$env:PYTHONIOENCODING="utf-8"; python tests/test_game.py

# Run headless verification (Linux / macOS)
python3 tests/test_game.py
```

---

*(c) 2026 Team Mysterio · Jr_AstroCamp: Beyond Earth · NASA Space Apps Challenge 2026*
