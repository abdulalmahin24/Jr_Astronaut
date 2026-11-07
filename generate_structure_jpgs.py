import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR_1 = r"e:\nasa by nehal\NASA_Projct\structure_diagrams"
OUT_DIR_2 = r"e:\nasa by nehal\structure_diagrams"

os.makedirs(OUT_DIR_1, exist_ok=True)
os.makedirs(OUT_DIR_2, exist_ok=True)

# Common styling helper
DARK_BG = "#070b14"
CARD_BG = "#0f172a"
CYAN = "#38bdf8"
GOLD = "#f59e0b"
EMERALD = "#10b981"
PURPLE = "#a855f7"
RED = "#ef4444"
WHITE = "#f8fafc"
GRAY = "#94a3b8"

def draw_card(ax, x, y, w, h, title, subtitle="", border_color=CYAN, bg_color=CARD_BG, text_color=WHITE, rx=0.015):
    fancy_box = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0.012,rounding_size={rx}",
        facecolor=bg_color,
        edgecolor=border_color,
        linewidth=1.8,
        zorder=2
    )
    ax.add_patch(fancy_box)
    
    if title:
        ax.text(x + w * 0.5, y + h * 0.82, title, color=border_color, fontsize=11, fontweight="bold", ha="center", va="center", zorder=3)
    if subtitle:
        ax.text(x + w * 0.5, y + h * 0.38, subtitle, color=text_color, fontsize=8.5, ha="center", va="center", multialignment="center", zorder=3)

def save_fig(fig, filename):
    p1 = os.path.join(OUT_DIR_1, filename)
    p2 = os.path.join(OUT_DIR_2, filename)
    fig.savefig(p1, format="jpg", dpi=200, facecolor=DARK_BG, bbox_inches="tight")
    fig.savefig(p2, format="jpg", dpi=200, facecolor=DARK_BG, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved: {filename}")

# ==============================================================
# DIAGRAM 1: FULL PROJECT STRUCTURE OVERVIEW
# ==============================================================
def create_diagram_1():
    fig, ax = plt.subplots(figsize=(16, 9), facecolor=DARK_BG)
    ax.set_facecolor(DARK_BG)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    
    # Title
    ax.text(0.5, 0.94, "Jr_AstroCamp: Beyond Earth - Full Project Architecture", color=GOLD, fontsize=18, fontweight="bold", ha="center")
    ax.text(0.5, 0.90, "Dual-Engine Aerospace Mission Trainer & Multi-Format Learning Platform (NASA Space Apps 2026)", color=GRAY, fontsize=11, ha="center")
    
    # Column 1: Web App Core (React 19 + TypeScript + Vite)
    draw_card(ax, 0.04, 0.05, 0.28, 0.80, "WEB PLATFORM CORE", 
              "src/App.tsx & src/router/\n\n"
              "- React 19 + TypeScript + Vite 8\n"
              "- Lightweight Hash Router\n"
              "- Audio Synthesis (Web Audio API)\n"
              "- Speech Engine (CapCom TTS)\n"
              "- LocalStorage Cadet Auth & XP\n"
              "- Student Activity Tracking", CYAN)
    
    # Sub-boxes in Col 1
    draw_card(ax, 0.06, 0.10, 0.24, 0.18, "4-Pillar Page Structure", "Launchpad | Academy\nSimulators | Astronaut Locker", CYAN, bg_color="#1e293b")
    
    # Column 2: Dual Simulation Engines
    draw_card(ax, 0.36, 0.48, 0.28, 0.37, "3D SIMULATION LAYER", 
              "src/components/ (Three.js WebGL)\n\n"
              "- 3D Solar System Orrery (JPL Ephemeris)\n"
              "- Mars EDL 7-Minutes of Terror\n"
              "- Spacesuit 3D Inspector (ACES & EMU)\n"
              "- Black Hole Raytracing Lens", PURPLE)
              
    draw_card(ax, 0.36, 0.05, 0.28, 0.38, "2D ARCADE ENGINE", 
              "src/game/ (Phaser 4 Engine)\n\n"
              "- LaunchScene (Max-Q & Staging)\n"
              "- DockingScene (6-DOF RCS)\n"
              "- LunarLandingScene (Gravity Turn)\n"
              "- RoverScene (Surface Hazard EVA)", EMERALD)
    
    # Column 3: Desktop Engine & NASA Science Pipeline
    draw_card(ax, 0.68, 0.48, 0.28, 0.37, "DESKTOP 60 FPS FLIGHT SIM", 
              "nasa_game/ & main.py (Pygame-ce)\n\n"
              "- 76 Real Cataloged NASA Flights\n"
              "- 6 Historical Flight Disciplines\n"
              "- Sub-pixel Vector Spacecraft\n"
              "- Orbital Dynamics & Telemetry", GOLD)
              
    draw_card(ax, 0.68, 0.05, 0.28, 0.38, "REAL NASA SCIENCE PIPELINE", 
              "src/data/ & src/utils/\n\n"
              "- NASA BVAD-2015 Life Support Stoichiometry\n"
              "- LOLA Moon Topography & CRaTER Radiation\n"
              "- Kilopower KRUSTY Fission & Solar Diurnal\n"
              "- Explainable AI Mission Autopsy Tree", RED)

    save_fig(fig, "01_project_structure_overview.jpg")

# ==============================================================
# DIAGRAM 2: LEARN WHILE PLAYING GAME LOOP
# ==============================================================
def create_diagram_2():
    fig, ax = plt.subplots(figsize=(16, 9), facecolor=DARK_BG)
    ax.set_facecolor(DARK_BG)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    
    # Title
    ax.text(0.5, 0.94, "The 'Learn-Through-Gameplay' Stealth Learning Loop", color=GOLD, fontsize=18, fontweight="bold", ha="center")
    ax.text(0.5, 0.90, "How Jr_AstroCamp transforms real aerospace science into satisfying, playable video game mechanics", color=GRAY, fontsize=11, ha="center")

    steps = [
        ("1. CADET GAMEPLAY ACTION", "Cadet operates active controls:\n- Throttles rocket engines\n- Steers lunar lander descent\n- Drives Mars rover around rocks\n- Balances base power & oxygen", CYAN, 0.05, 0.45),
        ("2. REAL NASA CONSEQUENCE", "Authentic physics & limits react:\n- High speed creates Max-Q aero drag\n- Moon gravity pulls hard without air\n- Wheels slip in soft Martian sand\n- 354-hour lunar night drains batteries", RED, 0.29, 0.45),
        ("3. 'AHA!' DISCOVERY POPUP", "Satisfying instant revelation:\n- 'Did you feel the pull? Lunar gravity!'\n- 'Power died? 14 Earth days of darkness!'\n- CapCom voice explains the trade-off\n- Interactive comic reveals solution", GOLD, 0.53, 0.45),
        ("4. MASTERY & CELEBRATION", "Gamified progress & rewards:\n- Mission Complete victory chime!\n- Confetti explosion on screen\n- Unlock new NASA Mission Patch\n- Level up Cadet Rank to Flight Officer", EMERALD, 0.77, 0.45),
    ]

    for title, desc, color, x, y in steps:
        draw_card(ax, x, y, 0.19, 0.38, title, desc, border_color=color)

    # Arrows between cards
    for i in range(3):
        x_start = steps[i][3] + 0.195
        x_end = steps[i+1][3] - 0.005
        ax.annotate('', xy=(x_end, 0.64), xytext=(x_start, 0.64),
                    arrowprops=dict(arrowstyle="->", color=WHITE, lw=2.5, mutation_scale=20))
                    
    # Bottom Loopback Arrow
    ax.annotate('Mastered Science Concept Applied to Next Tougher Mission ->', 
                xy=(0.14, 0.43), xytext=(0.86, 0.43),
                arrowprops=dict(arrowstyle="->", color=GOLD, lw=2, linestyle="--", connectionstyle="arc3,rad=-0.2"),
                fontsize=11, color=GOLD, ha="center", va="top", fontweight="bold")

    # Bottom cards: 3 pillars of satisfaction
    draw_card(ax, 0.08, 0.08, 0.24, 0.22, "JUICY GAME FEEL", "Punchy audio sfx, particle thrusters,\nsmooth 60fps canvas controls,\nand zero lag on inputs.", CYAN, bg_color="#1e293b")
    draw_card(ax, 0.38, 0.08, 0.24, 0.22, "VISUAL STORY COMICS", "Episodes starring Cadet Maya & Dadu\nshow the human stakes behind\nevery rocket equation.", PURPLE, bg_color="#1e293b")
    draw_card(ax, 0.68, 0.08, 0.24, 0.22, "TANGIBLE REWARDS", "Earnable astronaut wings, printable\nNASA flight diplomas, and\ncustomizable cadet spacesuits.", GOLD, bg_color="#1e293b")

    save_fig(fig, "02_learn_through_gameplay_loop.jpg")

# ==============================================================
# DIAGRAM 3: JUNIOR CADET UI FLOW & 4 PILLARS
# ==============================================================
def create_diagram_3():
    fig, ax = plt.subplots(figsize=(16, 9), facecolor=DARK_BG)
    ax.set_facecolor(DARK_BG)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    
    # Title
    ax.text(0.5, 0.94, "Redesigned Junior Cadet UI Navigation Architecture", color=GOLD, fontsize=18, fontweight="bold", ha="center")
    ax.text(0.5, 0.90, "From 30+ confusing modals into 4 clear, joyful, child-friendly pillars", color=GRAY, fontsize=11, ha="center")

    # Top Navbar Mockup
    draw_card(ax, 0.05, 0.77, 0.90, 0.09, "", "", border_color=CYAN, bg_color="#0f172a")
    ax.text(0.08, 0.815, "Jr_AstroCamp", color=WHITE, fontsize=12, fontweight="bold", va="center")
    
    pillars = [
        ("1. LAUNCHPAD", 0.26, CYAN),
        ("2. ACADEMY", 0.42, GOLD),
        ("3. SIMULATORS", 0.58, EMERALD),
        ("4. LOCKER", 0.73, PURPLE),
    ]
    for name, px, col in pillars:
        ax.text(px, 0.815, name, color=col, fontsize=10.5, fontweight="bold", va="center")

    ax.text(0.88, 0.815, "Judge | Teacher", color=GRAY, fontsize=9.5, va="center")

    # The 4 Pillars Content Columns
    # Pillar 1
    draw_card(ax, 0.05, 0.08, 0.21, 0.64, "1. LAUNCHPAD (HOME)",
              "Cadet Command Center\n\n"
              "- Hero Mission Card\n  ('Continue Sol 4 on Moon')\n\n"
              "- Daily Space Mystery\n  (60-sec interactive quiz)\n\n"
              "- Quick Sim Carousel\n  (Instant 1-click play)\n\n"
              "- Friendly Avatar Greeting", CYAN)
              
    # Pillar 2
    draw_card(ax, 0.28, 0.08, 0.21, 0.64, "2. CADET ACADEMY",
              "Mario/Duolingo Map Trail\n\n"
              "- 8 Progressive Levels\n  (Airlock -> Polar Ice)\n\n"
              "- 3-Step Level Modal:\n  1. Read Comic Story\n  2. Play Mini-Challenge\n  3. Win Cadet Badge\n\n"
              "- Optional 'Science Deep Dive'", GOLD)

    # Pillar 3
    draw_card(ax, 0.51, 0.08, 0.21, 0.64, "3. SPACE SIMULATORS",
              "Game Arcade for Kids\n\n"
              "- Moon Landing (Physics)\n- Mars Rover (Ice Hunt)\n- ISS Docking (6-DOF RCS)\n- Rocket Ascent (Max-Q)\n- Kids 3D Planetarium\n- Black Hole Lens\n\n"
              "Big Cards & 3-Min Quick Play", EMERALD)

    # Pillar 4
    draw_card(ax, 0.74, 0.08, 0.21, 0.64, "4. ASTRONAUT LOCKER",
              "Rewards & Achievements\n\n"
              "- Astronaut ID License Card\n  (Custom avatar & rank)\n\n"
              "- 8 Collectible Badges\n\n"
              "- Printable NASA Diploma\n  (With vector gold wings)\n\n"
              "- Handwritten Field Notes", PURPLE)

    save_fig(fig, "03_junior_cadet_ui_flow.jpg")

# ==============================================================
# DIAGRAM 4: GAMEPLAY MECHANICS VS NASA SCIENCE
# ==============================================================
def create_diagram_4():
    fig, ax = plt.subplots(figsize=(16, 9), facecolor=DARK_BG)
    ax.set_facecolor(DARK_BG)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    
    # Title
    ax.text(0.5, 0.94, "Matrix: Playable Game Mechanics vs What Kids Learn", color=GOLD, fontsize=18, fontweight="bold", ha="center")
    ax.text(0.5, 0.90, "Every game action is an authentic NASA science lesson in disguise", color=GRAY, fontsize=11, ha="center")

    matrix = [
        ("Rocket Launch to Orbit", "Throttling engines & steering\nthrough atmospheric layers", "Newton's 3rd Law, Aerodynamic Drag,\nMax-Q Dynamic Pressure & Staging", CYAN, 0.04, 0.48),
        ("ISS Space Station Docking", "Gentle RCS thruster bursts\nto align crosshairs", "Inertia, Microgravity, Zero-Air Braking,\nand 6-DOF Orbital Mechanics", PURPLE, 0.36, 0.48),
        ("Apollo Lunar Landing", "Balancing descent speed vs\nlimited fuel tank", "Lunar Gravity (1/6th g), Thrust-to-Weight,\nGravity Turn & Braking Gate", GOLD, 0.68, 0.48),
        ("Mars Rover Ice Prospecting", "Driving over red rocks and\ndrilling crater ice cores", "Regolith Terramechanics, Wheel Slip,\nPolar Cold Traps & Water Discovery", EMERALD, 0.04, 0.08),
        ("Outpost Base Builder", "Allocating solar panels,\nbatteries and food biodomes", "NASA BVAD Stoichiometry, ECLSS,\nSabatier Reaction & 354h Lunar Night", RED, 0.36, 0.08),
        ("Kids 3D Solar System", "Clicking & zooming into planets\nwith gravity scale slider", "Astronomical Units (AU), Orbital Speeds,\nSurface Gravities & Light Delays", CYAN, 0.68, 0.08),
    ]

    for game, action, science, col, x, y in matrix:
        draw_card(ax, x, y, 0.28, 0.36, game,
                  f"WHAT THE CADET PLAYS:\n{action}\n\nWHAT THEY SECRETLY LEARN:\n{science}",
                  border_color=col)

    save_fig(fig, "04_gameplay_mechanics_vs_nasa_science.jpg")

if __name__ == "__main__":
    create_diagram_1()
    create_diagram_2()
    create_diagram_3()
    create_diagram_4()
    print("All 4 diagrams successfully generated with clean text rendering!")
