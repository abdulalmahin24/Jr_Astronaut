import React, { useEffect, useRef, useState } from 'react';

export interface HomeBackgroundProps {
  activeHover?: 'MOON' | 'MARS' | null;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: 1 | 2 | 3;
}

interface SoftDustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  isMars: boolean;
  phase: number;
}

export const HomeBackground: React.FC<HomeBackgroundProps> = ({ activeHover = null }) => {
  const skyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [photoError, setPhotoError] = useState(false);
  const [earthError, setEarthError] = useState(false);

  // Parallax offsets (max 16px for foreground)
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // 60-Second Day/Night Cycle Factor (0 = midnight, 1 = noon)
  const [dayFactor, setDayFactor] = useState(0.85);

  // Mars Dust Storm Active (every ~40s for ~6s)
  const [dustStormIntensity, setDustStormIntensity] = useState(0);

  useEffect(() => {
    const skyCanvas = skyCanvasRef.current;
    const dustCanvas = dustCanvasRef.current;
    if (!skyCanvas || !dustCanvas) return;

    const skyCtx = skyCanvas.getContext('2d');
    const dustCtx = dustCanvas.getContext('2d');
    if (!skyCtx || !dustCtx) return;

    let animId: number;
    let width = (skyCanvas.width = dustCanvas.width = window.innerWidth);
    let height = (skyCanvas.height = dustCanvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // ── 1. SKY STARS: 190 Twinkling Stars in 3 Depth Tiers ──
    const stars: Star[] = [];
    const TOTAL_STARS = 190;
    for (let i = 0; i < TOTAL_STARS; i++) {
      const rand = Math.random();
      const layer: 1 | 2 | 3 = rand < 0.6 ? 1 : rand < 0.88 ? 2 : 3;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.68,
        radius:
          layer === 3
            ? Math.random() * 0.8 + 1.8 // Bright foreground stars (1.8 - 2.6px)
            : layer === 2
            ? Math.random() * 0.5 + 1.0 // Medium stars (1.0 - 1.5px)
            : Math.random() * 0.4 + 0.5, // Small background stars (0.5 - 0.9px)
        baseAlpha:
          layer === 3
            ? Math.random() * 0.25 + 0.75
            : layer === 2
            ? Math.random() * 0.25 + 0.45
            : Math.random() * 0.2 + 0.25,
        twinkleSpeed: Math.random() * 1.8 + 0.6,
        twinklePhase: Math.random() * Math.PI * 2,
        layer,
      });
    }

    // ── 2. DUST PARTICLES: 52 SOFT ROUND particles (Strictly Round radial gradient) ──
    const TOTAL_DUST = 52;
    const dustParticles: SoftDustParticle[] = [];
    for (let i = 0; i < TOTAL_DUST; i++) {
      const isMars = Math.random() < 0.65;
      const x = isMars
        ? width * 0.42 + Math.random() * (width * 0.58)
        : Math.random() * (width * 0.45);
      const y = height * 0.52 + Math.random() * (height * 0.48);

      dustParticles.push({
        x,
        y,
        vx: isMars ? (Math.random() * 0.35 + 0.08) : (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.18 - 0.04,
        radius: Math.random() * 2.2 + 2.0, // 2px to 4.2px soft round circles
        baseAlpha: Math.random() * 0.32 + 0.18, // 0.18 to 0.50 opacity
        isMars,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // ── 3. PARALLAX MOUSE TRACKING (max 16px) ──
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;
    let lastMouseMoveTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      lastMouseMoveTime = performance.now();
      targetParallaxX = (e.clientX / width - 0.5) * 2;
      targetParallaxY = (e.clientY / height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      width = skyCanvas.width = dustCanvas.width = window.innerWidth;
      height = skyCanvas.height = dustCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !prefersReducedMotion) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();
    const startTime = performance.now();

    const render = (time: number) => {
      if (!isVisible) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      const elapsedSec = (time - startTime) / 1000;

      // ── A. 60-Second Day/Night Cycle (0 = night, 1 = noon) ──
      // Sine wave between 0.0 (night) and 1.0 (day)
      const currentDayFactor = Math.sin((elapsedSec / 60) * Math.PI * 2) * 0.5 + 0.5;
      setDayFactor(currentDayFactor);

      // ── B. Mars Dust Storm Pulse (Every ~40s for ~6s) ──
      const stormCycle = elapsedSec % 40;
      let stormInt = 0;
      if (stormCycle < 6) {
        // Smooth bell curve 0 -> 1 -> 0
        stormInt = Math.sin((stormCycle / 6) * Math.PI);
      }
      setDustStormIntensity(stormInt);

      // ── C. Parallax Smoothing / Gentle Auto-Drift on Idle & Mobile ──
      if (!prefersReducedMotion) {
        const isIdle = time - lastMouseMoveTime > 2200;
        if (isIdle) {
          const autoX = Math.sin(elapsedSec * 0.45) * 0.45;
          const autoY = Math.cos(elapsedSec * 0.35) * 0.30;
          currentParallaxX += (autoX - currentParallaxX) * 0.035;
          currentParallaxY += (autoY - currentParallaxY) * 0.035;
        } else {
          currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05;
          currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05;
        }
        setParallax({ x: currentParallaxX, y: currentParallaxY });
      }

      // ── D. Render Sky Canvas (Stars, Milky Way, Sun Glare) ──
      skyCtx.clearRect(0, 0, width, height);

      // 1. Deep Space Gradient (#02030A -> #080F2A -> #0C183E)
      const skyGrad = skyCtx.createLinearGradient(0, 0, 0, height * 0.68);
      skyGrad.addColorStop(0, '#02030A');    // Deep cosmic black
      skyGrad.addColorStop(0.55, '#060B20'); // Mid twilight void
      skyGrad.addColorStop(1, '#0B1538');    // Sapphire horizon
      skyCtx.fillStyle = skyGrad;
      skyCtx.fillRect(0, 0, width, height * 0.70);

      // 2. Faint Diagonal Milky Way Band
      skyCtx.save();
      skyCtx.translate(width * 0.5, height * 0.28);
      skyCtx.rotate(-0.32);
      const mwGrad = skyCtx.createLinearGradient(0, -height * 0.35, 0, height * 0.35);
      mwGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      mwGrad.addColorStop(0.35, 'rgba(88, 28, 135, 0.05)');
      mwGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.07)');
      mwGrad.addColorStop(0.65, 'rgba(126, 34, 206, 0.045)');
      mwGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      skyCtx.fillStyle = mwGrad;
      skyCtx.fillRect(-width * 0.8, -height * 0.3, width * 1.6, height * 0.6);
      skyCtx.restore();

      // 3. Sun Lens Glare (Top-Right Corner Only, never behind central text)
      const sunCenterX = width * 0.98;
      const sunCenterY = height * 0.02;
      const sunRadius = Math.min(width, height) * 0.44;
      const sunGlare = skyCtx.createRadialGradient(
        sunCenterX,
        sunCenterY,
        sunRadius * 0.04,
        sunCenterX,
        sunCenterY,
        sunRadius
      );
      // Sun dims slightly at night or during dust storm
      const sunAlphaMod = (0.5 + currentDayFactor * 0.5) * (1 - stormInt * 0.45);
      sunGlare.addColorStop(0, `rgba(255, 237, 213, ${0.22 * sunAlphaMod})`);
      sunGlare.addColorStop(0.25, `rgba(251, 146, 60, ${0.10 * sunAlphaMod})`);
      sunGlare.addColorStop(0.6, `rgba(234, 88, 12, ${0.03 * sunAlphaMod})`);
      sunGlare.addColorStop(1, 'rgba(0, 0, 0, 0)');
      skyCtx.fillStyle = sunGlare;
      skyCtx.beginPath();
      skyCtx.arc(sunCenterX, sunCenterY, sunRadius, 0, Math.PI * 2);
      skyCtx.fill();

      // 4. Parallax Twinkling Stars (3 Depth Layers)
      // Stars are slightly crisper at night
      const starNightBoost = (1 - currentDayFactor) * 0.25;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // Sky parallax: layer 1 = 2px, layer 2 = 4.5px, layer 3 = 8px
        const pFactor = s.layer === 3 ? 8 : s.layer === 2 ? 4.5 : 2;
        const sx = s.x + currentParallaxX * pFactor;
        const sy = s.y + currentParallaxY * pFactor;

        const twinkle = Math.sin(time * 0.001 * s.twinkleSpeed + s.twinklePhase);
        const alpha = Math.max(0.12, Math.min(1, s.baseAlpha + twinkle * 0.28 + starNightBoost));

        skyCtx.fillStyle =
          s.layer === 3
            ? `rgba(240, 249, 255, ${alpha})`
            : s.layer === 2
            ? `rgba(186, 230, 253, ${alpha})`
            : `rgba(148, 163, 184, ${alpha})`;

        skyCtx.beginPath();
        skyCtx.arc(sx, sy, s.radius, 0, Math.PI * 2);
        skyCtx.fill();

        // 4-Point Cross Diffraction Spike on brightest foreground stars
        if (s.layer === 3 && alpha > 0.85) {
          skyCtx.strokeStyle = `rgba(186, 230, 253, ${alpha * 0.45})`;
          skyCtx.lineWidth = 0.75;
          skyCtx.beginPath();
          skyCtx.moveTo(sx - 4.5, sy);
          skyCtx.lineTo(sx + 4.5, sy);
          skyCtx.moveTo(sx, sy - 4.5);
          skyCtx.lineTo(sx, sy + 4.5);
          skyCtx.stroke();
        }
      }

      // ── E. Render Foreground Soft Round Dust Particles ──
      dustCtx.clearRect(0, 0, width, height);
      dustCtx.globalCompositeOperation = 'screen'; // Additive blending for soft glowing dust

      const stormWindMultiplier = 1 + stormInt * 1.8;

      for (let i = 0; i < dustParticles.length; i++) {
        const d = dustParticles[i];
        if (!prefersReducedMotion) {
          d.x += d.vx * 60 * dt * stormWindMultiplier;
          d.y += d.vy * 60 * dt;

          // Wrap horizontally and vertically
          if (d.x < 0) d.x = width;
          if (d.x > width) d.x = 0;
          if (d.y < height * 0.50) d.y = height * 0.98;
          if (d.y > height) d.y = height * 0.52;
        }

        // Parallax for dust (foreground tier = 14px)
        const dx = d.x + currentParallaxX * 14;
        const dy = d.y + currentParallaxY * 14;

        // Subtle breathing opacity
        const pulse = Math.sin(elapsedSec * 1.5 + d.phase) * 0.1;
        const alpha = Math.max(0.12, Math.min(0.55, d.baseAlpha + pulse + (d.isMars ? stormInt * 0.2 : 0)));

        // Create SOFT ROUND radial gradient circle (Zero square pixels)
        const radGrad = dustCtx.createRadialGradient(dx, dy, 0, dx, dy, d.radius);
        if (d.isMars) {
          // Warm amber / terracotta Martian dust
          radGrad.addColorStop(0, `rgba(251, 146, 60, ${alpha * 1.2})`);
          radGrad.addColorStop(0.55, `rgba(249, 115, 22, ${alpha * 0.6})`);
          radGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        } else {
          // Silvery pearlescent lunar regolith dust
          radGrad.addColorStop(0, `rgba(241, 245, 249, ${alpha * 1.1})`);
          radGrad.addColorStop(0.55, `rgba(203, 213, 225, ${alpha * 0.5})`);
          radGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
        }

        dustCtx.fillStyle = radGrad;
        dustCtx.beginPath();
        dustCtx.arc(dx, dy, d.radius, 0, Math.PI * 2);
        dustCtx.fill();
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(performance.now());
    } else {
      animId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [photoError]);

  // ── LAYER PARALLAX PIXEL OFFSETS (Max 16px for foreground) ──
  const pX1 = parallax.x * 2.5;  // Layer 1: Sky & Stars (0.15x)
  const pY1 = parallax.y * 2.5;

  const pX2 = parallax.x * 5.5;  // Layer 2: Earth & Far Mountain Silhouette (0.35x)
  const pY2 = parallax.y * 4.5;

  const pX3 = parallax.x * 9.5;  // Layer 3: Photo Planetary Surfaces (0.6x)
  const pY3 = parallax.y * 7.5;

  const pX4 = parallax.x * 13.0; // Layer 4: Habitats, Bases & Active Rover (0.85x)
  const pY4 = parallax.y * 9.5;

  const pX5 = parallax.x * 16.0; // Layer 5: Foreground Rocks & Silhouette (1.0x)
  const pY5 = parallax.y * 12.0;

  // ── 60-Second Day/Night Brightness Modulation (STRICTLY >= 55% at all times) ──
  // Day = 1.08 brightness, Night = 0.72 brightness (well above 0.55 minimum limit)
  const sceneBrightness = 0.72 + dayFactor * 0.36;

  return (
    <div
      data-testid="space-background-canvas"
      className="cinematic-scene-zoom"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        background: '#02030A',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          DEPTH LAYER 1: SKY CANVAS (Void gradient, 3 star layers, Milky Way, Sun glare)
          ───────────────────────────────────────────────────────────── */}
      <canvas
        ref={skyCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 1,
          transform: `translate(${pX1}px, ${pY1}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          DEPTH LAYER 2: EARTH IN UPPER-LEFT (Soft blue atmosphere rim & slow rotation)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '11%',
          left: '8%',
          width: '126px',
          height: '126px',
          borderRadius: '50%',
          zIndex: 2,
          transform: `translate(${pX2}px, ${pY2}px)`,
          transition: 'transform 0.12s ease-out',
          boxShadow: '0 0 50px rgba(56, 189, 248, 0.65), 0 0 20px rgba(14, 165, 233, 0.45)',
        }}
      >
        {!earthError ? (
          <img
            src="/assets/bg/earth_from_moon.webp"
            alt="NASA Earth from Space"
            onError={() => setEarthError(true)}
            loading="lazy"
            decoding="async"
            className="earth-orbit-spin"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              filter: `contrast(1.15) brightness(${1.02 + dayFactor * 0.1})`,
              boxShadow: 'inset -18px -18px 40px rgba(1, 4, 14, 0.92)',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 40%, #0369a1 75%, #082f49 100%)',
              boxShadow: 'inset -14px -14px 30px rgba(0, 0, 0, 0.9)',
            }}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DEPTH LAYER 2 (Cont.): FAR MOUNTAIN & CRATER RIDGE SILHOUETTES
          Spans the middle horizon behind photo surfaces
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '43%',
          left: 0,
          width: '100%',
          height: '65px',
          zIndex: 2,
          transform: `translate(${pX2}px, ${pY2 * 0.5}px)`,
          transition: 'transform 0.12s ease-out',
          opacity: 0.88,
          pointerEvents: 'none',
        }}
      >
        <svg
          viewBox="0 0 1920 65"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left: Moon Jagged Crater Rim Peaks */}
          <path
            d="M 0 65 L 0 35 Q 80 18 160 30 Q 260 8 380 25 Q 520 12 680 32 Q 820 22 960 40 L 960 65 Z"
            fill="#1c202a"
            opacity="0.95"
          />
          <path
            d="M 0 35 Q 80 18 160 30 Q 260 8 380 25 Q 520 12 680 32 Q 820 22 960 40"
            stroke="#3a4150"
            strokeWidth="1.2"
          />

          {/* Right: Mars Ancient Eroded Mountain Ridge */}
          <path
            d="M 960 65 L 960 40 Q 1120 15 1280 28 Q 1440 6 1600 24 Q 1760 14 1920 38 L 1920 65 Z"
            fill="#32130c"
            opacity="0.95"
          />
          <path
            d="M 960 40 Q 1120 15 1280 28 Q 1440 6 1600 24 Q 1760 14 1920 38"
            stroke="#5c2417"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DEPTH LAYER 3: REAL NASA PHOTO SURFACE LAYER (Moon on Left, Mars on Right)
          Bottom 45% of screen, vibrant, crisp, clearly visible
          ───────────────────────────────────────────────────────────── */}
      {!photoError && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '45%',
            zIndex: 3,
            overflow: 'hidden',
            transform: `translate(${pX3}px, ${pY3 * 0.3}px)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* ── Left Half: Moon Shackleton Crater Panorama ── */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '56%',
              height: '100%',
              overflow: 'hidden',
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)',
              transform: activeHover === 'MOON' ? 'scale(1.035)' : 'scale(1)',
              transformOrigin: 'bottom left',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease',
              filter: activeHover === 'MOON'
                ? 'brightness(1.36) contrast(1.15) saturate(1.1)'
                : activeHover === 'MARS'
                ? `brightness(${sceneBrightness * 0.82}) contrast(0.95)`
                : `brightness(${sceneBrightness}) contrast(1.10)`,
            }}
          >
            <img
              src="/assets/bg/lunar_surface.webp"
              alt="NASA Lunar Surface Shackleton Crater"
              onError={() => setPhotoError(true)}
              loading="lazy"
              decoding="async"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '1920px',
                objectFit: 'cover',
                objectPosition: 'bottom center',
                display: 'block',
              }}
            />
          </div>

          {/* ── Right Half: Mars Jezero Crater Panorama ── */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '56%',
              height: '100%',
              overflow: 'hidden',
              maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)',
              transform: activeHover === 'MARS' ? 'scale(1.035)' : 'scale(1)',
              transformOrigin: 'bottom right',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease',
              filter: activeHover === 'MARS'
                ? 'brightness(1.38) contrast(1.18) saturate(1.22)'
                : activeHover === 'MOON'
                ? `brightness(${sceneBrightness * 0.82}) contrast(0.95)`
                : `brightness(${sceneBrightness * 1.04}) contrast(1.14) saturate(1.16)`,
            }}
          >
            <img
              src="/assets/bg/mars_jezero.webp"
              alt="NASA Mars Jezero Crater Panorama"
              onError={() => setPhotoError(true)}
              loading="lazy"
              decoding="async"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '1920px',
                objectFit: 'cover',
                objectPosition: 'bottom center',
                display: 'block',
              }}
            />
          </div>

          {/* ── Dust Storm Orange Tint Pulse on Mars Side (~40s cycle) ── */}
          {dustStormIntensity > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '56%',
                height: '100%',
                background: `radial-gradient(ellipse at 85% 60%, rgba(234, 88, 12, ${0.32 * dustStormIntensity}) 0%, rgba(194, 65, 12, ${0.18 * dustStormIntensity}) 60%, rgba(0,0,0,0) 100%)`,
                pointerEvents: 'none',
                mixBlendMode: 'color-dodge',
                transition: 'opacity 0.3s ease',
              }}
            />
          )}

          {/* ── Surface Overlay Darkness: Lightweight (max 22%) for bright, vibrant terrain ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.22) 0%, rgba(2, 6, 23, 0.10) 60%, rgba(2, 6, 23, 0.20) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DEPTH LAYER 4: BASES, HAB MODULES, SOLAR ARRAYS & ROVER
          ───────────────────────────────────────────────────────────── */}
      {/* ── 4A. MOON OUTPOST BASE (Left side, ~21% from left on lunar horizon) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(45% - 24px)',
          left: '20%',
          width: '176px',
          height: '80px',
          zIndex: 4,
          transform: `translate(${pX4}px, ${pY4 * 0.2}px)`,
          transition: 'transform 0.15s ease-out',
          pointerEvents: 'none',
        }}
      >
        {/* Soft Ambient Halo Behind Moon Outpost */}
        <div
          style={{
            position: 'absolute',
            inset: '-12px -24px',
            background: 'radial-gradient(ellipse at 50% 65%, rgba(56, 189, 248, 0.38) 0%, rgba(245, 158, 11, 0.20) 45%, rgba(0, 0, 0, 0) 75%)',
            pointerEvents: 'none',
          }}
        />

        <svg
          viewBox="0 0 176 80"
          width="176"
          height="80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.50))' }}
        >
          {/* Sintered Regolith Radiation Shield Berm (Curved Protective Wall) */}
          <path
            d="M 38 60 Q 88 34 138 60"
            stroke="#475569"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Left Solar Panel Array with Shimmer Sheen */}
          <g transform="translate(10, 26) rotate(-8)">
            <line x1="16" y1="18" x2="16" y2="36" stroke="#94a3b8" strokeWidth="2.4" />
            <rect x="0" y="4" width="32" height="15" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
            <line x1="8" y1="4" x2="8" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
            <line x1="16" y1="4" x2="16" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
            <line x1="24" y1="4" x2="24" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
            <line x1="0" y1="11.5" x2="32" y2="11.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
            {dayFactor > 0.3 && <rect x="2" y="5" width="28" height="13" fill="url(#shimmerGrad)" className="solar-shimmer-sheen" opacity="0.4" />}
          </g>

          {/* Right Solar Panel Array with Shimmer Sheen */}
          <g transform="translate(112, 28) rotate(6)">
            <line x1="16" y1="18" x2="16" y2="36" stroke="#94a3b8" strokeWidth="2.4" />
            <rect x="0" y="4" width="32" height="15" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
            <line x1="8" y1="4" x2="8" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
            <line x1="16" y1="4" x2="16" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
            <line x1="24" y1="4" x2="24" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
            <line x1="0" y1="11.5" x2="32" y2="11.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
            {dayFactor > 0.3 && <rect x="2" y="5" width="28" height="13" fill="url(#shimmerGrad)" className="solar-shimmer-sheen" opacity="0.4" />}
          </g>

          {/* Central Geodesic Dome Habitat */}
          <path
            d="M 52 58 A 25 25 0 0 1 102 58 Z"
            fill="#09142e"
            stroke="#38bdf8"
            strokeWidth="2.4"
          />
          {/* Secondary Airlock Tunnel */}
          <rect x="44" y="52" width="10" height="6" rx="1.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
          {/* Secondary Habitat Module */}
          <path
            d="M 96 58 A 15 15 0 0 1 126 58 Z"
            fill="#09142e"
            stroke="#0284c7"
            strokeWidth="1.8"
          />

          {/* Warm Glowing Windows (Brighten at night) */}
          <circle cx="68" cy="47" r="3.0" fill="#fef08a" className="window-warm-glow" style={{ opacity: 0.8 + (1 - dayFactor) * 0.2 }} />
          <circle cx="77" cy="44" r="3.4" fill="#fef08a" className="window-warm-glow" style={{ opacity: 0.8 + (1 - dayFactor) * 0.2 }} />
          <circle cx="86" cy="47" r="3.0" fill="#fef08a" className="window-warm-glow" style={{ opacity: 0.8 + (1 - dayFactor) * 0.2 }} />
          <circle cx="111" cy="51" r="2.4" fill="#fef08a" className="window-warm-glow" style={{ opacity: 0.8 + (1 - dayFactor) * 0.2 }} />

          {/* Kilopower Fission Radiator Tower */}
          <line x1="148" y1="58" x2="148" y2="34" stroke="#94a3b8" strokeWidth="1.8" />
          <rect x="144" y="32" width="8" height="10" rx="1" fill="#334155" stroke="#f59e0b" strokeWidth="1" />
          <circle cx="148" cy="30" r="1.6" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 4px #f59e0b)' }} />

          {/* Gradient definitions for SVG sheen */}
          <defs>
            <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.75)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── 4B. MARS OUTPOST BASE & GREENHOUSE (Right side, ~72% from left on Martian horizon) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(45% - 22px)',
          left: '70%',
          width: '184px',
          height: '80px',
          zIndex: 4,
          transform: `translate(${pX4}px, ${pY4 * 0.2}px)`,
          transition: 'transform 0.15s ease-out',
          pointerEvents: 'none',
        }}
      >
        {/* Soft Ambient Halo Behind Mars Outpost */}
        <div
          style={{
            position: 'absolute',
            inset: '-12px -24px',
            background: 'radial-gradient(ellipse at 50% 65%, rgba(249, 115, 22, 0.35) 0%, rgba(34, 197, 94, 0.20) 45%, rgba(0, 0, 0, 0) 75%)',
            pointerEvents: 'none',
          }}
        />

        <svg
          viewBox="0 0 184 80"
          width="184"
          height="80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.45))' }}
        >
          {/* Agricultural Greenhouse Module (Translucent Emerald Bio-Glow) */}
          <path
            d="M 14 58 A 16 16 0 0 1 46 58 Z"
            fill="rgba(34, 197, 94, 0.25)"
            stroke="#22c55e"
            strokeWidth="1.8"
            className="greenhouse-bio-glow"
          />
          {/* Inner Plant Silhouettes */}
          <path d="M 24 58 Q 26 50 30 54 Q 34 49 36 58" stroke="#4ade80" strokeWidth="1.2" fill="none" />
          <circle cx="30" cy="51" r="1.5" fill="#86efac" />

          {/* Habitat Dome Module */}
          <path
            d="M 42 58 A 26 26 0 0 1 94 58 Z"
            fill="#1c100c"
            stroke="#fb923c"
            strokeWidth="2.4"
          />

          {/* Warm Emissive Windows */}
          <circle cx="60" cy="46" r="3.2" fill="#fef08a" className="window-warm-glow" style={{ opacity: 0.8 + (1 - dayFactor) * 0.2 }} />
          <circle cx="70" cy="43" r="3.5" fill="#fef08a" className="window-warm-glow" style={{ opacity: 0.8 + (1 - dayFactor) * 0.2 }} />
          <circle cx="80" cy="46" r="3.2" fill="#fef08a" className="window-warm-glow" style={{ opacity: 0.8 + (1 - dayFactor) * 0.2 }} />

          {/* Comms Antenna Mast with Dish */}
          <line x1="68" y1="32" x2="68" y2="8" stroke="#94a3b8" strokeWidth="1.8" />
          <path d="M 62 15 Q 68 20 74 15" stroke="#e2e8f0" strokeWidth="1.8" fill="none" />

          {/* Blinking Red Beacon Light (Flashes every 1.0s) */}
          <circle cx="68" cy="7" r="3.2" fill="#ef4444" className="antenna-beacon-glow" />

          {/* Mars Solar Array */}
          <g transform="translate(100, 26) rotate(6)">
            <line x1="16" y1="18" x2="16" y2="36" stroke="#94a3b8" strokeWidth="2.4" />
            <rect x="0" y="4" width="32" height="15" rx="2" fill="#c2410c" stroke="#fb923c" strokeWidth="1.2" />
            <line x1="8" y1="4" x2="8" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            <line x1="16" y1="4" x2="16" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            <line x1="24" y1="4" x2="24" y2="19" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            <line x1="0" y1="11.5" x2="32" y2="11.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
          </g>

          {/* Active Surface Rover Trundling Across Surface */}
          <g transform="translate(142, 48)" className="rover-trundle">
            {/* Rover Chassis */}
            <rect x="0" y="2" width="22" height="7" rx="1.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.2" />
            {/* Rover Mast & Headlight */}
            <line x1="16" y1="2" x2="17" y2="-5" stroke="#cbd5e1" strokeWidth="1.4" />
            <circle cx="17" cy="-5" r="2.2" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 5px #38bdf8)' }} />
            {/* Headlight beam */}
            <path d="M 19 -5 L 34 -2 L 32 -8 Z" fill="rgba(56, 189, 248, 0.25)" />
            {/* 6 Wheels */}
            <circle cx="2" cy="10" r="2.8" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="6" cy="10" r="2.8" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="11" cy="10" r="2.8" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="15" cy="10" r="2.8" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
            <circle cx="19" cy="10" r="2.8" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
          </g>
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DEPTH LAYER 5: FOREGROUND ROCK SILHOUETTES & SOFT ROUND DUST
          ───────────────────────────────────────────────────────────── */}
      {/* 5A. Foreground Rocks Silhouette (Moon Boulders Left, Mars Boulders Right) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '42px',
          zIndex: 5,
          transform: `translate(${pX5}px, ${pY5 * 0.2}px)`,
          transition: 'transform 0.15s ease-out',
          pointerEvents: 'none',
        }}
      >
        <svg
          viewBox="0 0 1920 42"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Lunar Boulders */}
          <path
            d="M 0 42 L 0 20 Q 25 8 50 16 Q 80 24 110 12 Q 140 30 180 18 Q 220 28 260 42 Z"
            fill="#12161f"
          />
          <path
            d="M 0 20 Q 25 8 50 16 Q 80 24 110 12 Q 140 30 180 18 Q 220 28 260 42"
            stroke="#2d3748"
            strokeWidth="1.5"
          />

          {/* Right Martian Outcrops */}
          <path
            d="M 1660 42 Q 1700 24 1740 14 Q 1780 26 1820 10 Q 1860 22 1920 15 L 1920 42 Z"
            fill="#230c07"
          />
          <path
            d="M 1660 42 Q 1700 24 1740 14 Q 1780 26 1820 10 Q 1860 22 1920 15"
            stroke="#4a1a0f"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* 5B. Soft Round Floating Dust Particles Canvas (Additive screen blending) */}
      <canvas
        ref={dustCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          DEPTH LAYER 6: READABILITY DARK VIGNETTE
          Central dark radial vignette behind text (~0.55 opacity)
          Ensures WCAG AA readability for title, subtitle, buttons & resource icons
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(92vw, 840px)',
          height: 'min(70vh, 520px)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(2, 6, 23, 0.58) 0%, rgba(2, 6, 23, 0.42) 55%, rgba(2, 6, 23, 0) 80%)',
          pointerEvents: 'none',
          zIndex: 6,
        }}
      />
    </div>
  );
};

export default HomeBackground;