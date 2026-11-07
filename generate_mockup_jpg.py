import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR_1 = r"e:\nasa by nehal\NASA_Projct\structure_diagrams"
OUT_DIR_2 = r"e:\nasa by nehal\structure_diagrams"
BRAIN_DIR = r"C:\Users\User\.gemini\antigravity\brain\0814f2f2-296b-4e7c-a952-ac70601081b6"

DARK_BG = "#060913"
NAV_BG = "#0b1222"
CARD_BG = "#0f172a"
CYAN = "#38bdf8"
GOLD = "#f59e0b"
EMERALD = "#10b981"
PURPLE = "#a855f7"
RED = "#ef4444"
WHITE = "#f8fafc"
GRAY = "#94a3b8"

def draw_card(ax, x, y, w, h, title="", subtitle="", border_color=CYAN, bg_color=CARD_BG, text_color=WHITE, rx=0.012, lw=1.5):
    fancy_box = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0.008,rounding_size={rx}",
        facecolor=bg_color,
        edgecolor=border_color,
        linewidth=lw,
        zorder=2
    )
    ax.add_patch(fancy_box)
    
    if title:
        ax.text(x + 0.015, y + h - 0.035, title, color=border_color, fontsize=10, fontweight="bold", ha="left", va="center", zorder=3)
    if subtitle:
        ax.text(x + w * 0.5, y + h * 0.45, subtitle, color=text_color, fontsize=8, ha="center", va="center", multialignment="center", zorder=3)

def create_mockup():
    fig, ax = plt.subplots(figsize=(18, 10.5), facecolor=DARK_BG)
    ax.set_facecolor(DARK_BG)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    
    # 1. TOP NAVBAR
    draw_card(ax, 0.02, 0.90, 0.96, 0.08, "", "", border_color=CYAN, bg_color=NAV_BG, lw=1.2)
    ax.text(0.04, 0.94, "Jr_AstroCamp", color=WHITE, fontsize=13, fontweight="bold", va="center")
    ax.text(0.12, 0.94, "[CADET V2]", color=CYAN, fontsize=8, fontweight="bold", va="center")
    ax.text(0.17, 0.94, "Callsign: Star-Maya", color=GOLD, fontsize=9, va="center")
    
    # Nav Buttons
    ax.text(0.35, 0.94, "[ 1. Launchpad ]", color=CYAN, fontsize=10, fontweight="bold", va="center")
    ax.text(0.48, 0.94, "[ 2. Academy ]", color=WHITE, fontsize=10, fontweight="bold", va="center")
    ax.text(0.59, 0.94, "[ 3. Simulators ]", color=WHITE, fontsize=10, fontweight="bold", va="center")
    ax.text(0.70, 0.94, "[ 4. Locker ]", color=WHITE, fontsize=10, fontweight="bold", va="center")
    
    # Right tools
    ax.text(0.83, 0.94, "XP: 450", color=GOLD, fontsize=10, fontweight="bold", va="center")
    ax.text(0.89, 0.94, "[SOUND: ON]", color=GRAY, fontsize=8.5, va="center")
    ax.text(0.95, 0.94, "[JUDGE]", color=PURPLE, fontsize=8.5, fontweight="bold", va="center")

    # 2. HERO MISSION BANNER (LAUNCHPAD)
    draw_card(ax, 0.02, 0.52, 0.64, 0.35, "ACTIVE MISSION: ARTEMIS LUNAR BASE", 
              "Survive the 354-Hour Lunar Night at Shackleton Polar Base\n\n"
              "Solar arrays will generate 0 kW as darkness settles over the South Pole.\n"
              "Can you balance battery reserves and deploy the Kilopower reactor?\n\n"
              "[ >>> LAUNCH SOL 4 MISSION (PLAY) <<< ]", 
              border_color=GOLD, bg_color="#0d1829", text_color=WHITE, rx=0.018, lw=2.2)
              
    # Cadet Status Card
    draw_card(ax, 0.68, 0.52, 0.30, 0.35, "CADET ASTRONAUT PROFILE",
              "Cadet Callsign: Star-Maya\n"
              "Rank: Flight Cadet Grade 1\n"
              "Progress: 4 of 8 Badges Unlocked [========----]\n\n"
              "O2 Stoichiometry: 98.4% Nominal (BVAD-2015)\n"
              "Base Power Reserves: 142 kWh\n\n"
              "[ EDIT SUIT AVATAR ]",
              border_color=CYAN, bg_color="#0b1326")

    # 3. 60-SEC DAILY SPACE MYSTERY QUIZ
    draw_card(ax, 0.02, 0.40, 0.96, 0.09, "DAILY SPACE MYSTERY: MARTIAN DUST STORM ALERT (+50 XP)",
              "A sudden Martian storm drops sunlight by 80%. What do you do?\n"
              "[ Option A: Switch to Kilopower Nuclear Reactor ]    |    [ Option B: Drive Rover Outside at Max Speed ]",
              border_color=GOLD, bg_color="#181308", text_color=WHITE)

    # 4. LOWER ROW: 3 FEATURED PLAYABLE SIMULATORS
    draw_card(ax, 0.02, 0.04, 0.30, 0.33, "SIM 1: APOLLO MOON LANDING",
              "Interactive 60 FPS Physics Mini-Game\n\n"
              "• Real Lunar Gravity (1.62 m/s²)\n"
              "• Active Main Descent Thruster [Space / Fire]\n"
              "• Soft Touchdown Target: < 2.5 m/s speed\n"
              "• Fuel Budgeting Mechanics\n\n"
              "[ PLAY IN BROWSER NOW ]",
              border_color=CYAN, bg_color="#091524")

    draw_card(ax, 0.35, 0.04, 0.30, 0.33, "SIM 2: MARS ROVER ICE HUNT",
              "Surface EVA Terramechanics\n\n"
              "• Drive Jezero Crater Dunes\n"
              "• Regolith Wheel-Slip Physics\n"
              "• Drill Raman Spectroscopy Core Samples\n"
              "• Return to Hab Before Battery Depletes\n\n"
              "[ DEPLOY SURFACE ROVER ]",
              border_color=RED, bg_color="#1c0e12")

    draw_card(ax, 0.68, 0.04, 0.30, 0.33, "SIM 3: ISS 6-DOF DOCKING",
              "Microgravity Reaction Control\n\n"
              "• Gemini & Apollo Spacecraft Alignment\n"
              "• Inertial Drift (No air resistance to brake)\n"
              "• Crosshair Docking Port Capture\n"
              "• NASA Telemetry Validation\n\n"
              "[ BEGIN ORBITAL DOCKING ]",
              border_color=PURPLE, bg_color="#150d24")

    filename = "05_visual_redesigned_ui_mockup.jpg"
    p1 = os.path.join(OUT_DIR_1, filename)
    p2 = os.path.join(OUT_DIR_2, filename)
    p3 = os.path.join(BRAIN_DIR, filename)
    
    fig.savefig(p1, format="jpg", dpi=200, facecolor=DARK_BG, bbox_inches="tight")
    fig.savefig(p2, format="jpg", dpi=200, facecolor=DARK_BG, bbox_inches="tight")
    fig.savefig(p3, format="jpg", dpi=200, facecolor=DARK_BG, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved: {filename}")

if __name__ == "__main__":
    create_mockup()

