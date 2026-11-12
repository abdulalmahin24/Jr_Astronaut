import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: 1 | 2 | 3;
}

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export const CinematicSpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Generate Stars (Layer 1: distant, Layer 2: mid, Layer 3: foreground)
    const stars: Star[] = [];
    const STAR_COUNT = 180;
    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1) as 1 | 2 | 3;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.85,
        radius: layer === 3 ? Math.random() * 1.4 + 0.8 : layer === 2 ? Math.random() * 0.9 + 0.6 : Math.random() * 0.6 + 0.3,
        baseAlpha: layer === 3 ? 0.85 : layer === 2 ? 0.65 : 0.4,
        twinkleSpeed: Math.random() * 1.5 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        layer,
      });
    }

    // Generate Dust Motes
    const DUST_COUNT = 24;
    const dustMotes: DustMote[] = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      dustMotes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -Math.random() * 0.2 - 0.05,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.35 + 0.15,
      });
    }

    // Parallax mouse tracking
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const nx = (e.clientX / width - 0.5) * 2;
      const ny = (e.clientY / height - 0.5) * 2;
      targetParallaxX = nx;
      targetParallaxY = ny;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
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

    const render = (time: number) => {
      if (!isVisible) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth lerp parallax
      if (!prefersReducedMotion) {
        currentParallaxX += (targetParallaxX - currentParallaxX) * 0.04;
        currentParallaxY += (targetParallaxY - currentParallaxY) * 0.04;
      }

      ctx.clearRect(0, 0, width, height);

      // ── 1. DEEP SPACE NEBULA GRADIENT ──
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        width * 0.05,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      bgGrad.addColorStop(0, '#0a142e');
      bgGrad.addColorStop(0.4, '#050c1f');
      bgGrad.addColorStop(0.75, '#020612');
      bgGrad.addColorStop(1, '#010206');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. MULTI-LAYER PARALLAX STARFIELD ──
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const parallaxFactor = star.layer === 3 ? 16 : star.layer === 2 ? 8 : 3;
        const sx = star.x + currentParallaxX * parallaxFactor;
        const sy = star.y + currentParallaxY * parallaxFactor;

        // Twinkle
        const twinkle = Math.sin(time * 0.001 * star.twinkleSpeed + star.twinklePhase);
        const alpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle * 0.3));

        ctx.fillStyle = star.layer === 3
          ? `rgba(224, 242, 254, ${alpha})`
          : star.layer === 2
          ? `rgba(186, 230, 253, ${alpha})`
          : `rgba(148, 163, 184, ${alpha})`;

        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Extra 4-point glow spike for bright foreground stars
        if (star.layer === 3 && alpha > 0.85) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(sx - 3, sy);
          ctx.lineTo(sx + 3, sy);
          ctx.moveTo(sx, sy - 3);
          ctx.lineTo(sx, sy + 3);
          ctx.stroke();
        }
      }

      // ── 3. SMALL EARTH ABOVE THE HORIZON ──
      // Position Earth elegantly in the upper-right sky
      const earthCenterX = width * 0.78 + currentParallaxX * 12;
      const earthCenterY = height * 0.28 + currentParallaxY * 12;
      const earthRadius = Math.min(width, height) * 0.038 + 18;

      // Earth Atmosphere Outer Blue Glow
      const earthGlow = ctx.createRadialGradient(
        earthCenterX,
        earthCenterY,
        earthRadius * 0.8,
        earthCenterX,
        earthCenterY,
        earthRadius * 1.55
      );
      earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      earthGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
      earthGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = earthGlow;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // Earth Globe Body
      const earthBody = ctx.createRadialGradient(
        earthCenterX - earthRadius * 0.35,
        earthCenterY - earthRadius * 0.35,
        earthRadius * 0.1,
        earthCenterX,
        earthCenterY,
        earthRadius
      );
      earthBody.addColorStop(0, '#38bdf8');
      earthBody.addColorStop(0.3, '#0284c7');
      earthBody.addColorStop(0.7, '#0369a1');
      earthBody.addColorStop(1, '#071838');
      ctx.fillStyle = earthBody;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
      ctx.fill();

      // Continents / Swirl Silhouettes (subtle vector patches)
      ctx.save();
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)'; // Continent green
      ctx.beginPath();
      ctx.ellipse(earthCenterX - earthRadius * 0.2, earthCenterY - earthRadius * 0.1, earthRadius * 0.35, earthRadius * 0.45, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(234, 179, 8, 0.3)'; // Desert gold
      ctx.beginPath();
      ctx.ellipse(earthCenterX + earthRadius * 0.15, earthCenterY + earthRadius * 0.2, earthRadius * 0.25, earthRadius * 0.3, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Cloud swirls
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.ellipse(earthCenterX - earthRadius * 0.1, earthCenterY - earthRadius * 0.35, earthRadius * 0.4, earthRadius * 0.12, 0.1, 0, Math.PI * 2);
      ctx.ellipse(earthCenterX + earthRadius * 0.1, earthCenterY + earthRadius * 0.05, earthRadius * 0.45, earthRadius * 0.15, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Shadow Crescent (Day/Night terminator on Earth)
      const shadowGrad = ctx.createLinearGradient(
        earthCenterX - earthRadius,
        earthCenterY - earthRadius,
        earthCenterX + earthRadius,
        earthCenterY + earthRadius
      );
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.15)');
      shadowGrad.addColorStop(0.85, 'rgba(2, 6, 23, 0.85)');
      shadowGrad.addColorStop(1, 'rgba(1, 4, 14, 0.95)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── 4. CURVED LUNAR / MARTIAN HORIZON ──
      // Horizon curve height
      const horizonY = height * 0.82;
      const horizonArcDrop = height * 0.06;
      const horizonParallax = currentParallaxX * 6;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-50, height);
      ctx.lineTo(-50, horizonY + horizonArcDrop);
      // Sweeping planetary curve across the bottom
      ctx.quadraticCurveTo(
        width * 0.5 + horizonParallax,
        horizonY - horizonArcDrop,
        width + 50,
        horizonY + horizonArcDrop * 0.8
      );
      ctx.lineTo(width + 50, height);
      ctx.closePath();

      // Horizon Planetary Gradient: Grey regolith on left blending into rusty red on right!
      const horizonGrad = ctx.createLinearGradient(0, horizonY, width, horizonY);
      horizonGrad.addColorStop(0, '#1e293b'); // Lunar deep grey
      horizonGrad.addColorStop(0.25, '#334155'); // Lunar regolith dust
      horizonGrad.addColorStop(0.48, '#475569'); // Transition mid-tone
      horizonGrad.addColorStop(0.65, '#7f1d1d'); // Martian rusty transition
      horizonGrad.addColorStop(0.85, '#991b1b'); // Martian terracotta red
      horizonGrad.addColorStop(1, '#b91c1c'); // Mars red dust
      ctx.fillStyle = horizonGrad;
      ctx.fill();

      // Top edge rim glow of the horizon
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Subtle craters and terrain bumps on the horizon silhouette
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.beginPath();
      ctx.ellipse(width * 0.18 + horizonParallax, horizonY + 6, 24, 7, 0.05, 0, Math.PI * 2);
      ctx.ellipse(width * 0.72 + horizonParallax, horizonY + 8, 32, 9, -0.05, 0, Math.PI * 2);
      ctx.ellipse(width * 0.88 + horizonParallax, horizonY + 12, 18, 5, 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // ── 5. SMALL GLOWING HABITAT OUTPOST SILHOUETTE ──
      // Positioned on the curved ridge (~34% across the screen)
      const outpostX = width * 0.34 + horizonParallax;
      const outpostY = horizonY - 14;

      // Outpost Ground Floodlight Glow
      const groundGlow = ctx.createRadialGradient(
        outpostX,
        outpostY + 6,
        4,
        outpostX,
        outpostY + 6,
        60
      );
      groundGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      groundGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.2)');
      groundGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = groundGlow;
      ctx.beginPath();
      ctx.arc(outpostX, outpostY + 6, 60, 0, Math.PI * 2);
      ctx.fill();

      // Geodesic Habitat Dome
      const domeRadius = 14;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(outpostX, outpostY + 4, domeRadius, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Dome Glowing Interior Observation Window
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(outpostX, outpostY - 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Secondary Smaller Inflatable Hab Pod
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(outpostX + 20, outpostY + 6, 9, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Solar Panels flanking the dome (Left Array & Right Array)
      const drawSolarArray = (ax: number, ay: number, angle: number) => {
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.8;
        ctx.fillRect(-12, -4, 24, 8);
        ctx.strokeRect(-12, -4, 24, 8);
        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 4);
        ctx.moveTo(-6, -4);
        ctx.lineTo(-6, 4);
        ctx.moveTo(6, -4);
        ctx.lineTo(6, 4);
        ctx.stroke();
        // Stand
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(0, 10);
        ctx.stroke();
        ctx.restore();
      };

      drawSolarArray(outpostX - 26, outpostY - 2, -0.15);
      drawSolarArray(outpostX + 38, outpostY + 2, 0.12);

      // Communication Antenna Tower with Blinking Red Beacon
      const antennaTopX = outpostX - 8;
      const antennaTopY = outpostY - 28;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(outpostX - 8, outpostY);
      ctx.lineTo(antennaTopX, antennaTopY);
      ctx.stroke();

      // Antenna Dish
      ctx.beginPath();
      ctx.arc(antennaTopX + 2, antennaTopY + 8, 4, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      // Blinking Red Beacon Light (Flashes every 1.2s)
      const blinkPhase = (time * 0.001) % 1.2;
      const isBeaconOn = blinkPhase < 0.6;
      if (isBeaconOn) {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(antennaTopX, antennaTopY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── 6. SUBTLE DRIFTING COSMIC DUST MOTES ──
      for (let i = 0; i < dustMotes.length; i++) {
        const d = dustMotes[i];
        if (!prefersReducedMotion) {
          d.x += d.vx * 60 * dt;
          d.y += d.vy * 60 * dt;

          if (d.y < 0) d.y = height;
          if (d.x < 0) d.x = width;
          if (d.x > width) d.x = 0;
        }

        ctx.fillStyle = `rgba(186, 230, 253, ${d.alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="space-background-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default CinematicSpaceBackground;
