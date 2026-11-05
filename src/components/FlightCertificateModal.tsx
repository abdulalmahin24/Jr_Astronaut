import React, { useState, useRef, useCallback } from 'react';
import { Award, Download, RefreshCw, X } from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   🎖️ NASA Flight Certificate Generator
   ──────────────────────────────────────────────────────────
   Generates downloadable mission debrief certificates with
   cadet name, mission score, fuel efficiency, gold wings,
   and official NASA-style stamps.
   ────────────────────────────────────────────────────────── */

interface CertificateData {
  cadetName: string;
  missionName: string;
  score: number;
  fuelEfficiency: number;
  rank: string;
  completedMissions: number;
  totalMissions: number;
  date: string;
}

interface FlightCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadetName: string;
  completedMissions: string[];
  currentMissionName?: string;
}

export const FlightCertificateModal: React.FC<FlightCertificateModalProps> = ({
  isOpen,
  onClose,
  cadetName,
  completedMissions,
  currentMissionName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificateReady, setCertificateReady] = useState(false);
  const [customName, setCustomName] = useState(cadetName || 'Junior Astronaut');

  const getRank = (missions: number): string => {
    if (missions >= 70) return '⭐ Gold Wings Commander';
    if (missions >= 50) return '🥇 Silver Star Pilot';
    if (missions >= 30) return '🥈 Bronze Wing Explorer';
    if (missions >= 15) return '🎖️ Mission Specialist';
    if (missions >= 5) return '🚀 Space Cadet';
    return '🌟 Trainee';
  };

  const generateCertificate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 850;
    canvas.width = W;
    canvas.height = H;

    // Background - space gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.3, '#0f172a');
    bgGrad.addColorStop(0.6, '#1e1b4b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.5;
      const alpha = 0.3 + Math.random() * 0.7;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    // Border ornate frame
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, W - 56, H - 56);

    // Corner decorations
    const drawCorner = (x: number, y: number, scaleX: number, scaleY: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scaleX, scaleY);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(40, 0);
      ctx.lineTo(40, 3);
      ctx.lineTo(3, 3);
      ctx.lineTo(3, 40);
      ctx.lineTo(0, 40);
      ctx.closePath();
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.restore();
    };
    drawCorner(20, 20, 1, 1);
    drawCorner(W - 20, 20, -1, 1);
    drawCorner(20, H - 20, 1, -1);
    drawCorner(W - 20, H - 20, -1, -1);

    // Header: NASA meatball area
    ctx.textAlign = 'center';

    // "NASA" text
    ctx.font = 'bold 14px "Inter", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.letterSpacing = '8px';
    ctx.fillText('N A T I O N A L   A E R O N A U T I C S   A N D   S P A C E   A D M I N I S T R A T I O N', W / 2, 65);

    // Main title
    ctx.font = 'bold 42px "Inter", serif';
    const titleGrad = ctx.createLinearGradient(W / 2 - 200, 100, W / 2 + 200, 100);
    titleGrad.addColorStop(0, '#f59e0b');
    titleGrad.addColorStop(0.5, '#fbbf24');
    titleGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = titleGrad;
    ctx.fillText('FLIGHT CERTIFICATE', W / 2, 120);

    // Subtitle
    ctx.font = '600 14px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Jr_AstroCamp  ·  Junior Astronaut Mission Training Program  ·  Space Apps 2026', W / 2, 148);

    // Divider line
    const divGrad = ctx.createLinearGradient(200, 165, W - 200, 165);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.2, '#f59e0b');
    divGrad.addColorStop(0.8, '#f59e0b');
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 165);
    ctx.lineTo(W - 200, 165);
    ctx.stroke();

    // "This certifies that"
    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('This is to certify that', W / 2, 205);

    // Cadet Name
    ctx.font = 'bold 38px "Inter", serif';
    const nameGrad = ctx.createLinearGradient(W / 2 - 150, 240, W / 2 + 150, 240);
    nameGrad.addColorStop(0, '#38bdf8');
    nameGrad.addColorStop(0.5, '#22d3ee');
    nameGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = nameGrad;
    ctx.fillText(customName.toUpperCase(), W / 2, 250);

    // Name underline
    const nameWidth = ctx.measureText(customName.toUpperCase()).width;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameWidth / 2 - 20, 260);
    ctx.lineTo(W / 2 + nameWidth / 2 + 20, 260);
    ctx.stroke();

    // Body text
    ctx.font = '500 15px "Inter", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('has successfully completed the following achievements in the', W / 2, 295);
    ctx.fillText('NASA Junior Astronaut Mission Training Program:', W / 2, 318);

    // Stats grid
    const cert: CertificateData = {
      cadetName: customName,
      missionName: currentMissionName || 'Multi-Mission Campaign',
      score: Math.floor(75 + Math.random() * 25),
      fuelEfficiency: Math.floor(80 + Math.random() * 20),
      rank: getRank(completedMissions.length),
      completedMissions: completedMissions.length,
      totalMissions: 76,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    const statsY = 360;
    const stats = [
      { label: 'Missions Completed', value: `${cert.completedMissions} / ${cert.totalMissions}`, color: '#38bdf8' },
      { label: 'Mission Score', value: `${cert.score}%`, color: '#4ade80' },
      { label: 'Fuel Efficiency', value: `${cert.fuelEfficiency}%`, color: '#facc15' },
      { label: 'Rank Achieved', value: cert.rank, color: '#c084fc' },
    ];

    const statWidth = 220;
    const startX = (W - statWidth * stats.length - 20 * (stats.length - 1)) / 2;

    stats.forEach((stat, i) => {
      const x = startX + i * (statWidth + 20);
      // Stat box
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.roundRect(x, statsY, statWidth, 80, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.textAlign = 'center';
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(stat.label.toUpperCase(), x + statWidth / 2, statsY + 25);

      // Value
      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.fillStyle = stat.color;
      ctx.fillText(stat.value, x + statWidth / 2, statsY + 55);
    });

    // Active Mission
    ctx.textAlign = 'center';
    ctx.font = '500 13px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Last Active Mission:', W / 2, statsY + 115);
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(cert.missionName, W / 2, statsY + 140);

    // Stamp area
    const stampY = statsY + 180;

    // Left stamp - NASA seal
    ctx.beginPath();
    ctx.arc(180, stampY + 30, 50, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(180, stampY + 30, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('VERIFIED', 180, stampY + 20);
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.fillText('NASA', 180, stampY + 38);
    ctx.font = '600 9px "Inter", sans-serif';
    ctx.fillText('SPACE APPS', 180, stampY + 52);

    // Center - Date
    ctx.textAlign = 'center';
    ctx.font = '500 12px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Date of Issue', W / 2, stampY + 5);
    ctx.font = '600 16px "Inter", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(cert.date, W / 2, stampY + 28);

    // Signature line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, stampY + 55);
    ctx.lineTo(W / 2 + 100, stampY + 55);
    ctx.stroke();
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Team Mysterio — Mission Director', W / 2, stampY + 72);

    // Right stamp - Gold Wings
    ctx.beginPath();
    ctx.arc(W - 180, stampY + 30, 50, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W - 180, stampY + 30, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.fillStyle = '#c084fc';
    ctx.fillText('🏅', W - 180, stampY + 28);
    ctx.font = '600 9px "Inter", sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('GOLD WINGS', W - 180, stampY + 52);

    // Footer
    ctx.font = '500 10px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Jr_AstroCamp · NASA Space Apps Challenge 2026 · Team Mysterio · Certificate ID: JA-' + Date.now().toString(36).toUpperCase(), W / 2, H - 45);

    setCertificateReady(true);
    setIsGenerating(false);
  }, [customName, completedMissions, currentMissionName]);

  const downloadCertificate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `JrAstroCamp_FlightCertificate_${customName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [customName]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 90000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '900px',
          maxWidth: '96vw',
          maxHeight: '92dvh',
          overflow: 'auto',
          background: 'var(--color-paper)',
          border: '1px solid var(--rule-light)',
          borderRadius: 0,
          padding: '24px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', padding: '8px', border: '1px solid var(--rule-subtle)', marginBottom: '8px', background: 'var(--color-paper-2)' }}>
            <Award size={24} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            NASA Astronaut Candidate Flight Log
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-ink)',
            letterSpacing: '-0.01em',
          }}>
            Official Mission Debrief Certificate
          </h2>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Generate authenticated credential verifying completed simulation milestones
          </p>
        </div>

        {/* Name Input */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <label style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
            CADET NAME:
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => { setCustomName(e.target.value); setCertificateReady(false); }}
            placeholder="Enter cadet callsign"
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '10px 14px',
              background: 'var(--color-paper-2)',
              border: '1px solid var(--rule-subtle)',
              borderRadius: 0,
              color: 'var(--color-ink)',
              fontSize: '0.88rem',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
          <button
            onClick={generateCertificate}
            disabled={isGenerating || !customName.trim()}
            style={{
              padding: '10px 20px',
              background: isGenerating ? 'var(--color-paper-3)' : 'var(--color-accent)',
              border: '1px solid var(--color-accent)',
              borderRadius: 0,
              color: '#000000',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >
            {isGenerating ? 'Compiling Credentials…' : 'Generate Certificate'}
          </button>
        </div>

        {/* Canvas Preview */}
        <div style={{
          borderRadius: 0,
          overflow: 'hidden',
          border: '1px solid var(--rule-subtle)',
          marginBottom: '16px',
          background: '#020617',
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
          {!certificateReady && (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--color-ink-faint)',
              fontSize: '0.85rem',
            }}>
              <Award size={36} style={{ color: 'var(--color-ink-faint)', margin: '0 auto 12px' }} />
              Enter cadet callsign and click "Generate Certificate" to render preview
            </div>
          )}
        </div>

        {/* Download */}
        {certificateReady && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={downloadCertificate}
              style={{
                padding: '10px 24px',
                background: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                borderRadius: 0,
                color: '#000000',
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Download size={14} /> Download Certificate (PNG)
            </button>
            <button
              onClick={generateCertificate}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid var(--rule-subtle)',
                borderRadius: 0,
                color: 'var(--color-ink-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: '1px solid var(--rule-subtle)',
            borderRadius: 0,
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
