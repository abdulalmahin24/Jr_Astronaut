# 🧪 Jr_AstroCamp: Beyond Earth — Verification & Testing Protocol

**NASA Space Apps Challenge 2026: Build a Junior Astronaut Mission Trainer**  
*Project: Jr_AstroCamp: Beyond Earth*

---

## 1. Testing Summary & Quality Standards

Jr_AstroCamp maintains a dual-verification strategy covering both the interactive web expedition platform (React 19 / TypeScript / Vite / Three.js) and the desktop 60 FPS flight simulator (Python 3 / Pygame-ce):
1. **Automated Simulation and Data Tests (`npm test`):** Validates deterministic simulation math, cargo mass validation, BVAD consumption formulas, Kilopower night generation, shift actions, boundary clamping, game-over triggers, DONKI mapping/source selection, and the simulated radiation budget limit.
2. **Automated Pygame Engine Headless Tests (`python tests/test_game.py`):** Validates 76 cataloged missions, procedural audio synthesis, 6 flight disciplines, and save file persistence.
3. **TypeScript & Static Linting Verification (`npm run build`):** Enforces strict types (`tsc -b`) and fast modern linting (`oxlint`).
4. **End-to-End Browser & Usability Verification:** A mobile Playwright smoke test is still pending; the current automated suites do not claim browser-flow coverage.

---

## 2. Test Execution & Verified Results

### Test Suite 1: Web Simulation and Data Engine (`npm test`)
- **Command:** `npm test`
- **Latest result:** Pass (exit code `0`)
- **Verified checks:**
  1. `[PASS]` Initial Game State initialization (Sol 1, baseline resources, nominal modules).
  2. `[PASS]` Outpost Cargo Mass budget calculation (Default lunar outpost: 39,500 kg ≤ 45,000 kg; heavy configuration: 73,000 kg > 45,000 kg blocked).
  3. `[PASS]` Day/Night transition & solar generation (Day: 35 kW, Lunar Night: 0 kW).
  4. `[PASS]` Kilopower Fission Reactor night resilience (25 kW continuous 24/7 power during lunar night).
  5. `[PASS]` Shift Action trade-offs (Power conservation cuts load to 11 kW; science intensive yields +10 pts at 29 kW load).
  6. `[PASS]` Critical failure detection (Battery depletion to 0% during lunar night triggers freeze game over).
  7. `[PASS]` Victory outcome certification at Sol 30.
  8. `[PASS]` Resource boundary capping (Strict clamping to 0% min and 100% max).
  9. `[PASS]` NASA DONKI mapper derives flare strength and approximate warning time from linked records.
  10. `[PASS]` Live/archive/unavailable source selection and the 100% simulated mission-dose-budget boundary.
  11. `[PASS]` A linked DONKI record generates an event carrying its record ID and honest source label; unavailable data stays a game scenario.

### Refreshing archived NASA DONKI data

Run `npm run fetch:donki` to fetch the latest 30 days of CME, FLR, SEP, and GST records into `public/data/donki_snapshot.json`. The script reads `NASA_API_KEY` or `VITE_NASA_API_KEY` from the environment, falling back to NASA's rate-limited `DEMO_KEY`. A failed request exits with an error and does not replace the existing snapshot. Do not commit a personal API key.

### Test Suite 2: Python / Pygame Headless Flight Tests (`python tests/test_game.py`)
- **Command:** `$env:PYTHONIOENCODING="utf-8"; python tests/test_game.py`
- **Latest result:** Pass (exit code `0`) with pygame-ce 2.5.8.
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
- **Latest result:** Pass (exit code `0`), with zero TypeScript errors; Vite transformed 1,996 modules.

---

## 3. How to Run the Automated Tests

### Web Simulation Test Suite:
```bash
# In project root
npm test
# Or directly with Node.js
node tests/test_simulation.mjs
node tests/test_donki.mjs
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
