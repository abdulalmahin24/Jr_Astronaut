# 🔬 Jr_AstroCamp: Beyond Earth — Science & NASA Data Sources

**NASA Space Apps Challenge 2026: Build a Junior Astronaut Mission Trainer**  
*Project: Jr_AstroCamp: Beyond Earth — "Train. Build. Survive. Explore."*

---

## 1. Overview & Scientific Philosophy

Jr_AstroCamp bridges educational game mechanics with genuine aerospace engineering principles and authentic datasets published by NASA and international space agencies.

To ensure transparent pedagogy and scientific integrity, data panels identify values using one of two classifications:
1. `[REAL NASA DATA]`: Direct measurements, physical constants, or stoichiometric specifications derived from published NASA technical reports, mission instrumentation, and planetary science archives.
2. `[GAME SIMULATION VALUE]`: Calibrated, time-accelerated parameters designed to make multi-year or multi-week space missions playable and engaging for students within a 15–30 minute game session.

Core gameplay functions 100% offline without requiring paid APIs, external accounts, or proprietary telemetry keys.

### Space weather data and labels

The solar-storm training event reads NASA DONKI CME and linked flare records when available. It displays the CME and flare record IDs and labels runtime results **LIVE** or snapshot results **ARCHIVED**. An archived snapshot is created with `npm run fetch:donki`; it records its fetch date and does not become live merely because it is bundled with the app. The NASA API key is read from `NASA_API_KEY` (build script) or `VITE_NASA_API_KEY` (browser runtime), with NASA's rate-limited `DEMO_KEY` used only as a public fallback. Never commit a personal key.

The current checked-in snapshot intentionally has no records because NASA DONKI could not be reached when this change was prepared. Until a successful fetch populates it, the event is explicitly labelled **GAME SIMULATION**. The app does not claim that simulated values are live NASA data.

For playability, the game estimates Sun–Earth travel time as 1 AU divided by the reported CME speed. This is a rough calculation: it ignores CME acceleration, direction, width, and interaction with the solar wind. Flare class is displayed as an observed classification and used only as a rough event-size cue; it does not predict particle flux or astronaut dose. All effects on game resources remain simulated.

### Radiation meter

The outpost radiation meter is a **simulated percentage of the mission dose budget**. Reaching 100% triggers a game limit, not a medical diagnosis or a claim about a real biological threshold. NASA radiation measurements and limits cited elsewhere retain their published units and are not converted into this meter.

### Archived astronaut research

The debrief includes a static, clearly labelled NASA Twins Study finding sourced to the NASA Open Science Data Repository and the 2019 *Science* publication (DOI: [10.1126/science.aau8650](https://doi.org/10.1126/science.aau8650)). It is a historical study summary, not live telemetry or a prediction for every astronaut.

---

## 2. Verified NASA Data Sources

| Domain | Source Document / Dataset | Agency / Publisher | Direct Verified URL | Access Date | Real NASA Baseline | Game Implementation & Mechanics | Limitations & Simplifications |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Human Life Support (ECLSS)** | *Baseline Values and Assumptions Document (BVAD)* (NASA/TP-2015-218570) | NASA Johnson Space Center (ECLSS Branch) | [https://ntrs.nasa.gov/citations/20150002905](https://ntrs.nasa.gov/citations/20150002905) | October 2026 | `0.84 kg O2/crew-day`, `2.50 kg potable water/crew-day`, `0.62 kg dry nutrition/crew-day`. | Outpost daily loop consumes 2.5% O2 and 3.0% water per turn under standard ECLSS; reduced to 0.8% O2 and 0.5% water with Sabatier and thermoelectric closed-loop recycling. | Multi-crew metabolic variations and body-mass indexes are normalized to a standard 4-person expedition crew. |
| **Lunar Surface Topography & Lighting** | *Lunar Reconnaissance Orbiter (LRO) LOLA Science Team Data* | NASA Goddard Space Flight Center | [https://lola.gsfc.nasa.gov/](https://lola.gsfc.nasa.gov/) | October 2026 | Malapert Mountain & Shackleton Crater rim receive `>86% annual illumination`; crater floors remain in permanent cryogenic shadow (<40 K). | LOLA provides lunar polar context; Shackleton Ice Run currently uses a generated practice surface. | The rover prototype's slope values are GAME SIMULATION VALUES, not samples from a LOLA DEM. |
| **Surface Fission Nuclear Power** | *Kilopower Reactor Using Stirling Technology (KRUSTY)* (NASA Glenn / Los Alamos) | NASA Glenn Research Center & LANL | [https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/](https://www.nasa.gov/directorates/stmd/game-changing-development-program/kilopower/) | October 2026 | `10 kWe` continuous electrical output, `43 kWth` thermal core output, enriched U-235 molybdenum core, sodium heat pipes, dual Stirling convertors. | Installing the Kilopower reactor (+8,500 kg cargo mass) yields continuous 25 kW baseline power immune to lunar night darkness or Martian dust storms. | Mass and thermal shielding are streamlined to a single modular plug-and-play cargo option. |
| **Space Weather & Radiation** | *Cosmic Ray Telescope for the Effects of Radiation (CRaTER)* | NASA LRO & Boston University | [https://crater.unh.edu/](https://crater.unh.edu/) | October 2026 | CRaTER measures lunar radiation environment; absorbed dose (mGy) and equivalent/effective dose (mSv) are different quantities and must not be interchanged. | Radiation resource is a simulated **percentage of a game mission dose budget**, not a physical dose measurement. | The game does not estimate mGy, mSv, astronaut exposure, acute radiation syndrome, or medical risk. Shielding/resource changes are gameplay values only. |
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
