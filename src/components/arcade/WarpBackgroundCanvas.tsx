import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  color: string;
}

export const WarpBackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let stars: Star[] = [];
    let warpSpeed = 1.2;
    const numStars = 380;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: (Math.random() - 0.5) * canvas.width * 2,
          y: (Math.random() - 0.5) * canvas.height * 2,
          z: Math.random() * canvas.width,
          color: Math.random() > 0.85 ? '#38bdf8' : (Math.random() > 0.9 ? '#fbbf24' : '#ffffff'),
        });
      }
    };

    window.addEventListener('resize', resize);
    resize();

    // Listen for custom trigger-warp events
    const handleWarp = () => {
      warpSpeed = 16.0;
      setTimeout(() => {
        warpSpeed = 1.2;
      }, 1000);
    };
    window.addEventListener('trigger-warp', handleWarp);

    const render = () => {
      ctx.fillStyle = 'rgba(4, 7, 17, 0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      for (let s of stars) {
        s.z -= warpSpeed;
        if (s.z <= 0) {
          s.z = canvas.width;
          s.x = (Math.random() - 0.5) * canvas.width * 2;
          s.y = (Math.random() - 0.5) * canvas.height * 2;
        }

        const k = 250 / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          const size = Math.max(0.6, (1 - s.z / canvas.width) * 3);
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();

          if (warpSpeed > 5) {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = size * 0.8;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - (px - cx) * 0.15, py - (py - cy) * 0.15);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('trigger-warp', handleWarp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export const triggerWarpDrive = () => {
  window.dispatchEvent(new CustomEvent('trigger-warp'));
};

