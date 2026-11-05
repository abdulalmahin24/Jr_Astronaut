// ============================================================
// MoonquakeMapModal — NASA Apollo Passive Seismic Experiment (PSE)
// Interactive 3D Lunar Globe & Nakamura (1979) Moonquake Visualizer
// Built for NASA International Space Apps Challenge 2026
// ============================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  X,
  Activity,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface MoonquakeEvent {
  lat: number;
  lng: number;
  magnitude: number;
  date: string;
  label: string;
}

// 5 Apollo Passive Seismic Experiment (PSE) Stations
const APOLLO_PSE_STATIONS = [
  { id: 'S11', name: 'Apollo 11 PSE', lat: 0.67, lng: 23.47, date: '1969-07-20', site: 'Sea of Tranquility', color: '#22c55e' },
  { id: 'S12', name: 'Apollo 12 PSE', lat: -3.01, lng: -23.42, date: '1969-11-19', site: 'Ocean of Storms', color: '#38bdf8' },
  { id: 'S14', name: 'Apollo 14 PSE', lat: -3.65, lng: -17.47, date: '1971-02-05', site: 'Fra Mauro Highlands', color: '#f59e0b' },
  { id: 'S15', name: 'Apollo 15 PSE', lat: 26.13, lng: 3.63, date: '1971-07-30', site: 'Hadley-Apennine', color: '#c084fc' },
  { id: 'S16', name: 'Apollo 16 PSE', lat: -8.60, lng: 15.50, date: '1972-04-21', site: 'Descartes Highlands', color: '#f43f5e' },
];

interface MoonquakeMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoonquakeMapModal: React.FC<MoonquakeMapModalProps> = ({ isOpen, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const seismoCanvasRef = useRef<HTMLCanvasElement>(null);

  const [moonquakes, setMoonquakes] = useState<MoonquakeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MoonquakeEvent | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(1972);
  const [soundActive, setSoundActive] = useState<boolean>(true);

  // Load Nakamura Moonquakes Dataset
  useEffect(() => {
    fetch('/data/nakamura_moonquakes.json')
      .then((res) => res.json())
      .then((data: MoonquakeEvent[]) => {
        setMoonquakes(data);
        if (data.length > 0) {
          setSelectedEvent(data[0]);
        }
      })
      .catch(() => {
        // Fallback core Nakamura 1979 events
        const fallback: MoonquakeEvent[] = [
          { lat: 48.0, lng: 35.0, magnitude: 2.8, date: '1971-04-17 07:00:55', label: 'Nakamura (1979)' },
          { lat: 42.0, lng: -24.0, magnitude: 2.0, date: '1971-05-20 17:25:10', label: 'Nakamura (1979)' },
          { lat: 43.0, lng: -47.0, magnitude: 1.9, date: '1971-07-11 13:24:45', label: 'Nakamura (1979)' },
          { lat: 54.0, lng: 101.0, magnitude: 1.9, date: '1972-01-02 22:29:40', label: 'Nakamura (1979)' },
          { lat: -21.0, lng: -12.0, magnitude: 1.9, date: '1972-09-17 14:35:55', label: 'Nakamura (1979)' },
          { lat: 33.0, lng: 37.0, magnitude: 2.7, date: '1972-12-06 23:08:20', label: 'Nakamura (1979)' },
          { lat: -37.0, lng: -42.0, magnitude: 2.5, date: '1972-12-09 03:50:40', label: 'Nakamura (1979)' },
          { lat: 37.0, lng: -29.0, magnitude: 3.2, date: '1973-03-13 07:56:30', label: 'Nakamura (1979)' },
        ];
        setMoonquakes(fallback);
        setSelectedEvent(fallback[0]);
      });
  }, []);

  // Filter events by selected year
  const filteredEvents = useMemo(() => {
    return moonquakes.filter((q) => {
      const yr = parseInt(q.date.slice(0, 4), 10);
      return yr === selectedYear;
    });
  }, [moonquakes, selectedYear]);

  // Seismograph Waveform Simulator
  useEffect(() => {
    const canvas = seismoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const mag = selectedEvent?.magnitude || 2.0;

    const renderWave = () => {
      animId = requestAnimationFrame(renderWave);
      t += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      ctx.fillStyle = 'rgba(7, 11, 20, 0.25)';
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 10; y < h; y += 15) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Seismic Waveform (P-wave, S-wave, Coda decay)
      ctx.strokeStyle = mag > 2.5 ? '#f43f5e' : '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();

      for (let x = 0; x < w; x++) {
        const pWave = Math.sin((x * 0.1) - t * 4) * Math.sin(x * 0.02) * (mag * 6);
        const sWave = Math.sin((x * 0.25) - t * 6) * Math.cos(x * 0.05) * (mag * 4);
        const noise = (Math.random() - 0.5) * 2;
        const y = mid + pWave + sWave + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [selectedEvent]);

  // ─────────────────────────────────────────────────────────────
  // 3D THREE.JS MOON GLOBE & SEISMIC RIPPLES
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Multi-source lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(15, 10, 20);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.8);
    scene.add(ambientLight);

    // Moon Sphere
    const moonRadius = 10;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 64, 64);

    const textureLoader = new THREE.TextureLoader();
    const moonTex = textureLoader.load('/assets/moon_texture.jpg');
    moonTex.wrapS = THREE.RepeatWrapping;
    moonTex.wrapT = THREE.ClampToEdgeWrapping;

    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      roughness: 0.92,
      metalness: 0.08,
      color: 0xe2e8f0,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);

    // Helper: Lat/Lng to Vector3 on sphere
    const latLngToVector3 = (lat: number, lng: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };

    // Plot Apollo Seismic Stations
    const stationGroup = new THREE.Group();
    APOLLO_PSE_STATIONS.forEach((st) => {
      const pos = latLngToVector3(st.lat, st.lng, moonRadius + 0.15);
      const pinGeo = new THREE.CylinderGeometry(0.12, 0.02, 0.6, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: st.color });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      stationGroup.add(pin);

      const beaconGeo = new THREE.SphereGeometry(0.22, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: st.color });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(pos.clone().add(pos.clone().normalize().multiplyScalar(0.4)));
      stationGroup.add(beacon);
    });
    moonMesh.add(stationGroup);

    // Dynamic Moonquake Epicenter Ripples
    const rippleGroup = new THREE.Group();
    moonMesh.add(rippleGroup);

    const rippleMeshes: { mesh: THREE.Mesh; maxR: number; curR: number; speed: number }[] = [];

    const rebuildQuakeMarkers = () => {
      while (rippleGroup.children.length > 0) {
        rippleGroup.remove(rippleGroup.children[0]);
      }
      rippleMeshes.length = 0;

      filteredEvents.forEach((q) => {
        const pos = latLngToVector3(q.lat, q.lng, moonRadius + 0.05);

        // Epicenter red core
        const coreGeo = new THREE.SphereGeometry(0.24, 12, 12);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.copy(pos);
        rippleGroup.add(core);

        // Shockwave Ring
        const ringGeo = new THREE.RingGeometry(0.1, 0.25, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf87171,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
        rippleGroup.add(ringMesh);

        rippleMeshes.push({
          mesh: ringMesh,
          maxR: 1.2 + q.magnitude * 0.9,
          curR: 0.2,
          speed: 0.02 + q.magnitude * 0.015,
        });
      });
    };

    rebuildQuakeMarkers();

    // Mouse Drag Rotation Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;
      moonMesh.rotation.y += dx * 0.008;
      moonMesh.rotation.x += dy * 0.008;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.max(16, Math.min(48, camera.position.z + e.deltaY * 0.02));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Auto gentle moon rotation when not dragging
      if (!isDragging) {
        moonMesh.rotation.y += 0.0018;
      }

      // Animate seismic shockwave rings
      rippleMeshes.forEach((r) => {
        r.curR += r.speed;
        if (r.curR > r.maxR) {
          r.curR = 0.2;
        }
        const s = r.curR;
        r.mesh.scale.set(s, s, 1);
        const mat = r.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 1.0 - r.curR / r.maxR);
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, filteredEvents]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1080px',
          maxHeight: '92vh',
          backgroundColor: '#050811',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #090e1a, #0d1527)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={22} className="text-cyan-400" />
            <div>
              <div style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.08em' }}>
                NASA SPACE APPS CHALLENGE · APOLLO PASSIVE SEISMIC EXPERIMENT (PSE)
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Interactive 3D Moonquake Seismic Map &amp; Nakamura (1979) Catalog
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setSoundActive(!soundActive);
                soundFx.playClick(800);
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: soundActive ? '#38bdf8' : '#64748b',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              {soundActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Grid: 3D Globe View + Telemetry Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', flex: 1, minHeight: '520px' }}>
          {/* Left: 3D Interactive Moon Globe */}
          <div style={{ position: 'relative', background: '#020409', overflow: 'hidden' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

            {/* Globe Overlay Legend */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '14px',
                background: 'rgba(8, 14, 24, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                padding: '8px 12px',
                backdropFilter: 'blur(10px)',
                fontSize: '10px',
                color: '#e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontWeight: 800, color: '#38bdf8' }}>APOLLO PSE STATIONS</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {APOLLO_PSE_STATIONS.map((st) => (
                  <span key={st.id} style={{ color: st.color, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: st.color }} />
                    {st.id}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '8.5px', color: '#94a3b8', marginTop: '2px' }}>
                🔴 Red Ripples = Shallow Moonquake Epicenters (Nakamura 1979)
              </span>
            </div>

            {/* Instruction tooltip */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '14px',
                fontSize: '9.5px',
                color: '#64748b',
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              🖱️ Drag to rotate 3D Moon · Scroll wheel to zoom in/out
            </div>
          </div>

          {/* Right: Data Controls, Seismograph Waveform, Timeline */}
          <div
            style={{
              padding: '16px',
              background: '#070c18',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
            }}
          >
            {/* Timeline Year Scrubbing Slider (1969 - 1977) */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>
                  TIMELINE YEAR: <strong style={{ color: '#38bdf8', fontSize: '13px' }}>{selectedYear}</strong>
                </span>
                <span style={{ fontSize: '9.5px', color: '#22c55e' }}>
                  {filteredEvents.length} MOONQUAKES DETECTED
                </span>
              </div>

              <input
                type="range"
                min={1969}
                max={1977}
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value, 10));
                  soundFx.playClick(950);
                }}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
                <span>1969 (Apollo 11)</span>
                <span>1972 (Apollo 16)</span>
                <span>1977 (PSE Terminated)</span>
              </div>
            </div>

            {/* Live Seismograph Waveform Canvas */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: 800 }}>
                  <Activity size={14} />
                  <span>APOLLO MID-PERIOD SEISMOMETER OSCILLOGRAM</span>
                </div>
                <span style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 800 }}>
                  MAG {selectedEvent?.magnitude.toFixed(1) || '2.0'}
                </span>
              </div>

              <canvas
                ref={seismoCanvasRef}
                width={380}
                height={85}
                style={{
                  width: '100%',
                  height: '85px',
                  borderRadius: '6px',
                  background: '#040711',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  display: 'block',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#94a3b8', marginTop: '4px' }}>
                <span>P-WAVE ARRIVAL</span>
                <span>S-WAVE CODA (~10-60 MINS ON MOON)</span>
                <span>STATION LOCK: S11 / S12 / S14</span>
              </div>
            </div>

            {/* Event List in Selected Year */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>
                RECORDED SHALLOW MOONQUAKES ({selectedYear})
              </span>

              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((ev, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedEvent(ev);
                        soundFx.playClick(1000);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: selectedEvent === ev ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        border: `1px solid ${selectedEvent === ev ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#f8fafc' }}>{ev.date.slice(0, 10)}</strong>
                        <span style={{ color: '#94a3b8', marginLeft: '6px' }}>{ev.date.slice(11)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#94a3b8' }}>
                          [{ev.lat.toFixed(1)}°, {ev.lng.toFixed(1)}°]
                        </span>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: ev.magnitude >= 2.5 ? '#ef4444' : '#f59e0b',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '9px',
                          }}
                        >
                          M {ev.magnitude.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b', fontSize: '10px', fontStyle: 'italic', padding: '10px' }}>
                    No shallow moonquakes recorded in Nakamura (1979) for {selectedYear}. Try scrub to 1971, 1972, or 1973.
                  </div>
                )}
              </div>
            </div>

            {/* Scientific Grounding Citation Callout */}
            <div
              style={{
                background: 'rgba(8, 14, 24, 0.85)',
                borderLeft: '3px solid #38bdf8',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '9px',
                color: '#cbd5e1',
                lineHeight: 1.35,
              }}
            >
              <strong style={{ color: '#38bdf8' }}>NASA PDS SCIENCE GROUNDING: </strong>
              Shallow moonquakes occur at depths of 20–30 km, lasting up to 10 minutes because the dry lunar crust lacks moisture to attenuate seismic vibrations. Data sourced from Nakamura et al. (1979) &amp; Apollo PSE SEED Collection.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
