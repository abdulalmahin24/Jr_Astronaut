# 🚀 NASA Space Apps Challenge 2026: Official Project Page Submission Dossier
**Project Name:** Jr_AstroCamp: Beyond Earth  
**Official Challenge:** [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/build-a-junior-astronaut-mission-trainer/)  
**Team Name:** Team Mysterio  
**Location:** Bangladesh Local Event (Dhaka / National Division) & Global Judging Pipeline

---

## 1. High-Level Summary

### Project Title
**Jr_AstroCamp: Beyond Earth — The Dual-Engine Junior Astronaut Mission Trainer**

### One-Sentence Elevator Pitch
*A high-stakes, dual-engine aerospace mission trainer fusing a 76-mission 60 FPS flight simulator and turn-based planetary base builder with an authentic multi-format learning layer—grounded in real NASA BVAD, LOLA, and Kilopower open data.*

### What We Built
Jr_AstroCamp is an ed-tech aerospace simulation platform built for students aged 10–14 (Grades 5–8) and citizen scientists. Unlike conventional educational space software that either reduces rocket science to decorative cartoons with no stakes or overwhelms learners with dense encyclopedias, Jr_AstroCamp places cadets in the flight boots of an Astronaut Candidate (ASCAN). Cadets budget limited rocket cargo, manage human life-support stoichiometry (ECLSS), dodge lunar night power crises, and fly 76 real NASA missions across 6 flight disciplines (Launch, Docking, Lunar Landing, Rover Traverse, Space Telescope, and Deep Space Slingshot).

### Who It Helps
- **Students & Young Learners:** Provides 4 entry doors to every scientific concept (playable flight simulator, illustrated comics, radio audio flashcards, and handwritten-style prediction notebooks) so no student is left behind due to learning format mismatch.
- **Educators & STEM Teachers:** Aligns directly with Next Generation Science Standards (NGSS MS-ESS1-1, MS-PS3-3, MS-LS2-5, MS-ETS1-2) with printable lesson plans, debate prompts, and telemetry analytics.
- **Underserved Classrooms:** 100% offline-ready, requiring zero paid APIs, proprietary accounts, or high-bandwidth connectivity.

### How It Works
1. **Astronaut Academy:** 8 interactive ASCAN modules covering airlock delta-P, Sabatier reactions, photovoltaics vs Kilopower fission, vacuum water recycling, radiation shielding, and polar cryogenic water-ice coring.
2. **Rocket Cargo Allocation:** Strict launch mass budget (45,000 kg Moon / 60,000 kg Mars). Selecting heavy high-tech gear locks the launch button until students make pragmatic engineering trade-offs.
3. **Mission Control Simulation:** Turn-based 30-Sol expedition at Shackleton Lunar Base with diurnal day/night cycles, unscripted space weather emergencies, and 2D canvas rover exploration.
4. **Desktop 60 FPS Flight Sim:** Pygame physics engine running 76 historical NASA missions from Mercury-Redstone 3 through Artemis III.
5. **Explainable AI Mission Autopsy:** Visual root-cause causal chain showing how early trade-offs cascaded into victory or failure.

### Links
- **Public GitHub Repository:** [https://github.com/TeamMysterio/Jr_AstroCamp](https://github.com/TeamMysterio/Jr_AstroCamp)
- **240-Second Local Judging Video ("240 Seconds of Glory"):** `[YouTube Link to be inserted by Team Lead]`
- **30-Second Global Judging Video ("30 Seconds of Glory"):** `[YouTube/Vimeo Link to be inserted by Team Lead]`

---

## 2. Project Demo
- **30-Second Global Video Link:** `[Insert 30-Second Video URL]`
- **7-Slide Deck Presentation (NASA Accepted Alternative):** Available in repository root as `SLIDE_DECK_BLUEPRINT.md`.

---

## 3. Final Project Assets & Repository Access
- **Source Code Repository:** Fully public, open-source under MIT License with zero authentication or paywalls.
- **Architecture & Roadmap:** Documented in `PRODUCT_ROADMAP.md` and `README.md`.
- **Automated Verification:** 8/8 simulation assertion tests runnable with `node tests/test_simulation.mjs`.

---

## 4. Project Details (The Three Core Blocks)

### Block A: The Why, The What, and The How
- **The Why:** Space education currently faces a critical pedagogy dilemma. When space science is oversimplified into passive cartoons, children fail to grasp genuine engineering constraints. When it is delivered as jargon-heavy text, young minds disengage. Furthermore, traditional education rarely offers safe environments for failure. Real NASA flight directors and astronaut crews iterate through catastrophic simulation failures to achieve mission success. Jr_AstroCamp embraces this exact loop: *Train, Fail, Analyze, Adapt, Succeed.*
- **The What:** We built two synchronized simulation engines:
  1. *Web Expedition Outpost Simulator (React 19 + TypeScript + Three.js + HTML5 Canvas):* A full turn-based planetary base builder, cargo allocator, rover simulation, and 8-lesson Astronaut Academy.
  2. *Desktop 60 FPS Flight Simulator (Python 3 + Pygame-ce):* High-performance flight dynamics engine simulating 76 cataloged NASA flights with orbital mechanics, RCS docking, landing thrust vectors, and science payload targeting.
- **The How:** Data-driven architecture loading from `nasa_missions_catalog.csv`. Telemetry calculations follow published NASA stoichiometry without arbitrary game mechanics.

### Block B: Community Involvement & Impact
- **Educational Impact:** Bridges the gap between classroom science and experiential space flight. Tested against middle school curriculum modules.
- **Universal Accessibility:** Multi-format content accommodates diverse learning styles:
  - *Kinesthetic learners* master thruster control in the 60 FPS simulator.
  - *Visual learners* engage with comic storyboards and 3D base views.
  - *Auditory learners* listen to 60–90 second procedural radio syntheses.
  - *Read/Write learners* complete handwritten-style digital field notebooks.
- **Global Reach:** Runs seamlessly on low-cost school hardware, Chromebooks, and low-spec PCs.

### Block C: Tools & Technologies
- **Frontend & Web Core:** React 19, TypeScript, Vite 8, Three.js, HTML5 Canvas, Tailwind-free Vanilla CSS tokens, Lucide Icons, Canvas Confetti.
- **Flight Simulation Core:** Python 3, Pygame-ce, NumPy, Matplotlib.
- **Testing & Verification:** Node.js native test runner, Oxlint AST static analysis, Headless Pygame CI harness.
- **Design & Multimedia:** Blender 3D (NASA GLB/STL models), Audacity, Inkscape, Python DOCX parsing pipelines.

---

## 5. Use of Artificial Intelligence (Mandatory Space Apps Disclosure)
In accordance with NASA Space Apps Challenge regulations, all AI tools and their applications are disclosed below:
1. **Code Assistance & Refactoring (Antigravity IDE / Claude 3.5 Sonnet / Gemini 3.8):** Used for TypeScript type-guard generation, Three.js shader optimization, and lint refactoring.
2. **Procedural Radio Audio Synthesis:** Web Audio API algorithms generating procedural radio static, NASA Quindar bleeps (2475 Hz / 250 ms), and telemetry chimes.
3. **Explainable AI Root-Cause Autopsy Engine:** Deterministic rule-based causal tree generator that traces back telemetry state histories (e.g. `Low Battery -> ECLSS Heater Disabled -> Habitat Freezes -> Mission Lost`) to provide plain-language debrief recommendations.
*Note: All core aerospace physics formulas, BVAD stoichiometric equations, orbital flight dynamics, and catalog entries were manually derived and verified from official NASA publications.*

---

## 6. NASA Open Data Sources Used

| Dataset / Document | Agency / Source | Specific Parameter Utilized | Direct NASA URL |
| :--- | :--- | :--- | :--- |
| **Baseline Values and Assumptions Document (BVAD)** (NASA/TP-2015-218570) | NASA Johnson Space Center | Human respiratory consumption rates: `0.84 kg O2/day`, `2.50 kg H2O/day`, `0.62 kg food/day`. | [https://ntrs.nasa.gov/citations/20150002905](https://ntrs.nasa.gov/citations/20150002905) |
| **LOLA Surface Topography & Lighting** | NASA LRO / Goddard Space Flight Center | South Pole illumination peaks (>86% annual sunlight on Shackleton rim; permanent shadow in crater base). | [https://lola.gsfc.nasa.gov/](https://lola.gsfc.nasa.gov/) |
| **Kilopower KRUSTY Nuclear Reactor** | NASA Glenn Research Center / Los Alamos | 10 kWe continuous Stirling electrical output, enriched U-235 core mass, sodium heat pipes. | [https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/](https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/) |
| **CRaTER Radiation Dosimetry** | NASA LRO / Boston University | Galactic Cosmic Ray dose rate (0.4–0.5 mSv/day quiescent; >1,000 mSv for unshielded SPE). | [https://crater.unh.edu/](https://crater.unh.edu/) |
| **Curiosity Rover REMS Instrument** | NASA JPL / Centro de Astrobiología | Martian atmospheric pressure baseline (~610 Pa), diurnal surface thermal ranges (-125°C to +20°C). | [https://mars.nasa.gov/msl/spacecraft/instruments/rems/](https://mars.nasa.gov/msl/spacecraft/instruments/rems/) |
| **NSSDC Master Flight Catalog** | NASA Goddard / NSSDC | 76 historical mission launch vehicle masses, target orbital inclinations, and instrument payloads. | [https://nssdc.gsfc.nasa.gov/](https://nssdc.gsfc.nasa.gov/) |
| **NASA 3D Resources Catalog** | NASA Glenn / JPL | Authentic 3D meshes (Astronaut EMU, Apollo Lunar Module, Perseverance Rover, Gateway Core). | [https://nasa3d.arc.nasa.gov/](https://nasa3d.arc.nasa.gov/) |

---

## 7. Complete References & Bibliography
1. Anderson, M. S., et al. (2015). *Human Exploration of Mars: Design Reference Architecture 5.0 (DRA 5.0)*. NASA-SP-2009-566.
2. Lange, K. E., et al. (2015). *Baseline Values and Assumptions Document (BVAD)*. NASA/TP-2015-218570.
3. McClure, P. R., et al. (2020). *Design of the Kilopower Reactor Using Stirling Technology (KRUSTY)*. Nuclear Technology, 206(sup1), S3-S12.
4. Smith, D. E., et al. (2010). *The Lunar Orbiter Laser Altimeter Investigation on the Lunar Reconnaissance Orbiter Mission*. Space Science Reviews, 150(1), 209-241.
5. Spence, H. E., et al. (2010). *CRaTER: The Cosmic Ray Telescope for the Effects of Radiation Experiment on the Lunar Reconnaissance Orbiter Mission*. Space Science Reviews, 150(1), 243-284.
6. Gómez-Elvira, J., et al. (2012). *REMS: The Rover Environmental Monitoring Station for Curiosity*. Space Science Reviews, 170(1), 583-640.
