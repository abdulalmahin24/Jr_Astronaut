# 🔬 Jr_AstroCamp: Beyond Earth — Science & NASA Data Sources

**NASA Space Apps Challenge 2026: Build a Junior Astronaut Mission Trainer**  
*Project: Jr_AstroCamp: Beyond Earth — "Train. Build. Survive. Explore."*

---

## 1. Overview & Scientific Philosophy

Jr_AstroCamp bridges educational game mechanics with genuine aerospace engineering principles and authentic datasets published by NASA and international space agencies.

To ensure transparent pedagogy and scientific integrity, every simulation variable in Jr_AstroCamp is categorized into one of two explicit classifications:
1. `[REAL NASA DATA]`: Direct measurements, physical constants, or stoichiometric specifications derived from published NASA technical reports, mission instrumentation, and planetary science archives.
2. `[GAME SIMULATION VALUE]`: Calibrated, time-accelerated parameters designed to make multi-year or multi-week space missions playable and engaging for students within a 15–30 minute game session.

Core gameplay functions 100% offline without requiring paid APIs, external accounts, or proprietary telemetry keys.

---

## 2. Verified NASA Data Sources

| Domain | Source Document / Dataset | Agency / Publisher | Direct Verified URL | Access Date | Real NASA Baseline | Game Implementation & Mechanics | Limitations & Simplifications |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Human Life Support (ECLSS)** | *Baseline Values and Assumptions Document (BVAD)* (NASA/TP-2015-218570) | NASA Johnson Space Center (ECLSS Branch) | [https://ntrs.nasa.gov/citations/20150002905](https://ntrs.nasa.gov/citations/20150002905) | October 2026 | `0.84 kg O2/crew-day`, `2.50 kg potable water/crew-day`, `0.62 kg dry nutrition/crew-day`. | Outpost daily loop consumes 2.5% O2 and 3.0% water per turn under standard ECLSS; reduced to 0.8% O2 and 0.5% water with Sabatier and thermoelectric closed-loop recycling. | Multi-crew metabolic variations and body-mass indexes are normalized to a standard 4-person expedition crew. |
| **Lunar Surface Topography & Lighting** | *Lunar Reconnaissance Orbiter (LRO) LOLA Science Team Data* | NASA Goddard Space Flight Center | [https://lola.gsfc.nasa.gov/](https://lola.gsfc.nasa.gov/) | October 2026 | Malapert Mountain & Shackleton Crater rim receive `>86% annual illumination`; crater floors remain in permanent cryogenic shadow (<40 K). | Polar Vertical Solar Towers maintain 8 kW baseline generation on ridge rims during lunar night, contrasting with 0 kW for standard equatorial PV arrays. | Topographical slope maps are smoothed into 2D terrain grids and 3D heightmaps for low-end device performance. |
| **Surface Fission Nuclear Power** | *Kilopower Reactor Using Stirling Technology (KRUSTY)* (NASA Glenn / Los Alamos) | NASA Glenn Research Center & LANL | [https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/](https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/) | October 2026 | `10 kWe` continuous electrical output, `43 kWth` thermal core output, enriched U-235 molybdenum core, sodium heat pipes, dual Stirling convertors. | Installing the Kilopower reactor (+8,500 kg cargo mass) yields continuous 25 kW baseline power immune to lunar night darkness or Martian dust storms. | Mass and thermal shielding are streamlined to a single modular plug-and-play cargo option. |
| **Space Weather & Radiation** | *Cosmic Ray Telescope for the Effects of Radiation (CRaTER)* | NASA LRO & Boston University | [https://crater.unh.edu/](https://crater.unh.edu/) | October 2026 | Galactic Cosmic Rays (GCR) deliver `0.4 to 0.5 mSv/day` quiescent; Solar Particle Events (SPE) can exceed `1,000 mSv/event` unshielded. | Cumulative exposure meter tracks astronaut dose; 1.5m sintered regolith shielding reduces base GCR accumulation from +0.5 mSv/sol to +0.1 mSv/sol; storm vaults provide SPE protection. | Multi-spectrum particle physics (HZE ions vs protons) are combined into a single equivalent Sievert (mSv) biological impact score. |
| **Martian Atmospheric Environment** | *Curiosity Rover Rover Environmental Monitoring Station (REMS)* | NASA JPL / Centro de Astrobiología | [https://mars.nasa.gov/msl/spacecraft/instruments/rems/](https://mars.nasa.gov/msl/spacecraft/instruments/rems/) | October 2026 | Surface atmospheric pressure `~610 Pa` (0.006 atm), CO2 95.3%, temperature range `-125°C to +20°C`, diurnal thermal swings. | Mars outpost expedition features variable dust opacity (tau), reduced solar efficiency during dust storms, and higher life-support thermal heating loads. | Transient micro-vortex dust devils are abstracted as randomized Sol event cards. |
| **Historical NASA Flight Catalog** | *NASA Master Catalog & National Space Science Data Center (NSSDC)* | NASA NSSDC / Space Science Data Coordinated Archive | [https://nssdc.gsfc.nasa.gov/](https://nssdc.gsfc.nasa.gov/) | October 2026 | 76 historical missions spanning Mercury-Redstone 3 (1961) through Artemis III and Mars 2020. | Pygame flight simulator and web briefing cards reproduce authentic launch vehicles, orbital inclinations, crew rosters, and primary science targets. | Complex multi-stage orbital burns are streamlined into 6 real-time simulator disciplines (Launch, Dock, Land, Rover, Scope, Deep Space). |

---

## 3. Explicit Data Attribution Tags

All in-game statistics, telemetry displays, and tooltips display one of these two visual tags:

- **`[REAL NASA DATA]`**:
  - Lunar day/night cycle period (354 hours / 14.75 Earth days per phase)
  - ECLSS human respiratory consumption rates (0.84 kg O2 / 2.50 kg H2O daily)
  - Kilopower KRUSTY reactor continuous electrical generation (10 kWe nominal)
  - Lunar regolith density (~1.5 g/cm³) and radiation half-value attenuation layer thickness
  - LRO LOLA south polar ridge illumination peaks (>80% solar capture)

- **`[GAME SIMULATION VALUE]`**:
  - Cargo mass budget cap (45,000 kg lunar expedition, 60,000 kg Martian expedition)
  - Turn duration (1 Sol / day shift per turn click)
  - Science Research Point accumulation rate (+10 to +35 pts per research activity, 300 pts target)
  - Rover battery discharge curve (0.05% per meter traveled)
  - Base structural integrity percentage (0–100%)

---

## 4. Educational Standards Alignment

The Jr_AstroCamp curriculum and gameplay systems align with:
- **Next Generation Science Standards (NGSS)**:
  - `MS-ESS1-1`: Earth's place in the universe & lunar diurnal cycles.
  - `MS-PS3-3`: Energy transfer, conservation, and photovoltaic vs thermal conversion.
  - `MS-LS2-5`: Closed-loop ecosystems, bio-regenerative life support, and nutrient cycling.
  - `MS-ETS1-2`: Engineering design trade-offs, constraints, and cargo mass optimization.

---

*(c) 2026 Team Mysterio · Jr_AstroCamp: Beyond Earth · NASA Space Apps Challenge 2026*
