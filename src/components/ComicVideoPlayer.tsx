import React, { useState, useEffect, useRef } from 'react';
import type { ComicIssue, ComicPanelScene } from '../data/comicBooks';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  BookOpen, 
  Sparkles, 
  Subtitles, 
  Film, 
  Layers, 
  ChevronLeft,
  Flame,
  Radio,
  Share2,
  Tv,
  CheckCircle2
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { ComicVisualArtwork } from './ComicVisualArtwork';
import { GOOGLE_FLOW_ARCHIVAL_VIDEOS } from '../utils/googleFlowComicService';

// Curated official NASA archival video resources for each STEM mission issue
export const NASA_ARCHIVAL_VIDEOS: Record<number, {
  title: string;
  year: string;
  youtubeId: string;
  nasaGovUrl: string;
  duration: string;
  summary: string;
  keyTimestamp: string;
  nasaCredit: string;
}> = {
  1: {
    title: 'NASA Archival: Friendship 7 Mercury-Atlas 6 Launch',
    year: '1962',
    youtubeId: 'Pr2IsapvdaY',
    nasaGovUrl: 'https://www.nasa.gov/missions/mercury/mercury-atlas-6/',
    duration: '4:32',
    summary: 'Original NASA 16mm footage of John Glenn strapping into Friendship 7, Atlas booster ignition, orbital sunrise, and recovery in the Atlantic Ocean.',
    keyTimestamp: 'T-00:00:00 Atlas Liftoff',
    nasaCredit: 'NASA Kennedy Space Center / NASA History Division'
  },
  2: {
    title: 'NASA Documentary: Gemini 8 First Space Docking',
    year: '1966',
    youtubeId: 'Qqw-_-tfthg',
    nasaGovUrl: 'https://www.nasa.gov/feature/gemini-viii/',
    duration: '3:45',
    summary: 'Neil Armstrong and David Scott perform humanity’s first successful spacecraft rendezvous and docking with the Agena target vehicle in Low Earth Orbit.',
    keyTimestamp: 'Rendezvous at 17,500 mph',
    nasaCredit: 'NASA Johnson Space Center'
  },
  3: {
    title: 'NASA Restored: Apollo 11 Lunar Landing "The Eagle Has Landed"',
    year: '1969',
    youtubeId: 'cwZb2mqId0A',
    nasaGovUrl: 'https://www.nasa.gov/mission/apollo-11/',
    duration: '3:10',
    summary: 'Historic 16mm onboard descent camera and Houston CapCom audio as Neil Armstrong steers past boulder-strewn craters to touch down on the Sea of Tranquility.',
    keyTimestamp: '1202 Alarm & Touchdown',
    nasaCredit: 'NASA Headquarters / Apollo Archives'
  },
  4: {
    title: 'NASA JPL: Mars Pathfinder Airbag Landing & Sojourner Deployment',
    year: '1997',
    youtubeId: 'YywBMm8IvzI',
    nasaGovUrl: 'https://mars.nasa.gov/mars-exploration/missions/pathfinder/',
    duration: '3:25',
    summary: 'Innovative giant airbag bounce touchdown on the Martian surface, followed by the deployment of Sojourner, humanity’s first interplanetary surface rover.',
    keyTimestamp: 'First Rover Wheels on Mars',
    nasaCredit: 'NASA Jet Propulsion Laboratory (JPL-Caltech)'
  },
  5: {
    title: 'NASA STS-61 Spacewalk: Repairing Hubble with COSTAR Optics',
    year: '1993',
    youtubeId: 'YoLGwggKuec',
    nasaGovUrl: 'https://www.nasa.gov/mission/sts-61/',
    duration: '4:15',
    summary: 'Space Shuttle Endeavour astronauts execute five intense spacewalks to install COSTAR corrective mirrors, transforming Hubble into humanity’s premier cosmic eye.',
    keyTimestamp: 'Endeavour Robotic Arm & EVA',
    nasaCredit: 'NASA Goddard Space Flight Center'
  },
  6: {
    title: 'NASA JPL: Voyager 1 & 2 Planetary Grand Tour & Interstellar Journey',
    year: '1977-Present',
    youtubeId: 'LIAZWb9_si4',
    nasaGovUrl: 'https://voyager.jpl.nasa.gov/',
    duration: '5:00',
    summary: 'Voyager’s historic planetary flybys of Jupiter, Saturn, Uranus, and Neptune, carrying humanity’s Golden Record across the heliopause into interstellar space.',
    keyTimestamp: 'Pale Blue Dot & Golden Record',
    nasaCredit: 'NASA JPL / Smithsonian National Air and Space Museum'
  },
  7: {
    title: 'NASA Official: Artemis II Crew Mission & Orion Lunar Trajectory',
    year: '2025-2026',
    youtubeId: 'W3bJ9dflmP8',
    nasaGovUrl: 'https://www.nasa.gov/mission/artemis-ii/',
    duration: '3:50',
    summary: 'NASA introduces the Artemis II crew—Reid Wiseman, Victor Glover, Christina Koch, and Jeremy Hansen—as they prepare for the first crewed deep-space journey to the Moon in over 50 years aboard Orion and the Space Launch System.',
    keyTimestamp: 'Trans-Lunar Injection & Lunar Flyby',
    nasaCredit: 'NASA Johnson Space Center / Exploration Ground Systems'
  },
  8: {
    title: 'NASA Goddard: 29 Days on the Edge — Deploying James Webb Space Telescope',
    year: '2021-Present',
    youtubeId: '1C_nu35GcAQ',
    nasaGovUrl: 'https://webb.nasa.gov/',
    duration: '4:45',
    summary: 'The thrilling engineering saga of deploying Webb’s tennis-court-sized 5-layer sunshield, secondary mirror, and 18 gold-beryllium hexagonal primary mirrors at Sun-Earth L2 Lagrange Point.',
    keyTimestamp: '344 Single-Point Failures Overcome',
    nasaCredit: 'NASA Goddard Space Flight Center / Space Telescope Science Institute'
  }
};

interface ComicVideoPlayerProps {
  issue: ComicIssue;
  onClose: () => void;
  onSwitchToReader: () => void;
  autoPlay?: boolean;
}

export const ComicVideoPlayer: React.FC<ComicVideoPlayerProps> = ({
  issue,
  onClose,
  onSwitchToReader,
  autoPlay = true
}) => {
  // Flatten all panels from all pages into a chronological scene sequence
  const allScenes: (ComicPanelScene & { pageNumber: number; pageTitle: string })[] = React.useMemo(() => {
    return issue.pages.flatMap((page) =>
      page.panels.map((panel) => ({
        ...panel,
        pageNumber: page.pageNumber,
        pageTitle: page.pageTitle
      }))
    );
  }, [issue]);

  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [videoMode, setVideoMode] = useState<'MOTION_COMIC' | 'NASA_ARCHIVE'>('MOTION_COMIC');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [cameraZoom, setCameraZoom] = useState<'PAN_LEFT' | 'PAN_RIGHT' | 'ZOOM_IN' | 'STATIC'>('ZOOM_IN');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentScene = allScenes[currentSceneIdx] || allScenes[0];
  const nasaVideo = GOOGLE_FLOW_ARCHIVAL_VIDEOS[issue.issueNumber] || NASA_ARCHIVAL_VIDEOS[issue.issueNumber] || NASA_ARCHIVAL_VIDEOS[1];
  const totalEstimatedDurationSec = allScenes.length * 9; // ~9s per panel dialogue

  // Voiceover audio speech synthesis
  const speakCurrentScene = (scene: ComicPanelScene) => {
    if (!isAudioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const textToSpeak = `${scene.caption ? scene.caption + ' ' : ''}${scene.dialogue}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = playbackSpeed;

    switch (scene.speaker) {
      case 'CADET_MAYA':
        utterance.pitch = 1.35;
        utterance.rate = 1.05 * playbackSpeed;
        break;
      case 'COMMANDER_DADU':
        utterance.pitch = 0.82;
        utterance.rate = 0.95 * playbackSpeed;
        break;
      case 'ASTRO_BOT':
        utterance.pitch = 1.6;
        utterance.rate = 1.2 * playbackSpeed;
        break;
      case 'HOUSTON_CAPCOM':
        utterance.pitch = 1.0;
        break;
      case 'DR_ELENA':
      default:
        utterance.pitch = 1.15;
        break;
    }

    utterance.onend = () => {
      // When audio finishes, if playing, advance to next scene after short dramatic pause
      if (isPlaying) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          if (currentSceneIdx < allScenes.length - 1) {
            setCurrentSceneIdx((idx) => idx + 1);
          } else {
            setIsPlaying(false);
            setIsCompleted(true);
            soundFx.playVictory();
          }
        }, 1200 / playbackSpeed);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Change camera movement on scene change
  useEffect(() => {
    const moves: ('PAN_LEFT' | 'PAN_RIGHT' | 'ZOOM_IN' | 'STATIC')[] = ['ZOOM_IN', 'PAN_LEFT', 'PAN_RIGHT'];
    setCameraZoom(moves[currentSceneIdx % moves.length]);

    // Play scene sound effects
    if (currentScene.sfx) {
      soundFx.playClick(900);
    } else if (currentScene.speechType === 'RADIO') {
      soundFx.playTelemetryChirp();
    }

    if (isPlaying && videoMode === 'MOTION_COMIC') {
      speakCurrentScene(currentScene);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentSceneIdx, isPlaying, videoMode, isAudioEnabled, playbackSpeed]);

  // Elapsed time incrementer
  useEffect(() => {
    if (isPlaying && !isCompleted) {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isPlaying, isCompleted, playbackSpeed]);

  // Particle Canvas Animation (Thruster fire, floating sparks, orbital stars)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: { x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number }[] = [];
    const particleColors = ['#f59e0b', '#38bdf8', '#ef4444', '#fbbf24', '#ffffff'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.8) * 2.2,
        radius: Math.random() * 2 + 1,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx * playbackSpeed;
        p.y += p.vy * playbackSpeed;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [playbackSpeed]);

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (!nextState && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      speakCurrentScene(currentScene);
    }
    soundFx.playClick(800);
  };

  const handleNextScene = () => {
    if (currentSceneIdx < allScenes.length - 1) {
      setCurrentSceneIdx((prev) => prev + 1);
      soundFx.playClick(750);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIdx > 0) {
      setCurrentSceneIdx((prev) => prev - 1);
      soundFx.playClick(650);
    }
  };

  const handleRestartVideo = () => {
    setCurrentSceneIdx(0);
    setElapsedSeconds(0);
    setIsCompleted(false);
    setIsPlaying(true);
    soundFx.playClick(900);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSpeakerStyle = (speaker: ComicPanelScene['speaker']) => {
    switch (speaker) {
      case 'CADET_MAYA':
        return { name: 'Cadet Maya (Age 6)', color: '#38bdf8', badge: '🧒', role: 'Junior Astronaut' };
      case 'COMMANDER_DADU':
        return { name: 'Commander Dadu (Age 70)', color: '#43ffa0', badge: '👨‍🚀', role: 'Chief Engineer' };
      case 'ASTRO_BOT':
        return { name: 'AstroBot OS', color: '#f59e0b', badge: '🤖', role: 'Autonomous Telemetry AI' };
      case 'HOUSTON_CAPCOM':
        return { name: 'Houston CapCom', color: '#ec4899', badge: '📡', role: 'Mission Control' };
      case 'DR_ELENA':
      default:
        return { name: 'Dr. Elena Vance', color: '#a78bfa', badge: '🔬', role: 'Astrobiologist' };
    }
  };

  const speaker = getSpeakerStyle(currentScene.speaker);
  const progressPercent = Math.min(100, ((currentSceneIdx + 1) / allScenes.length) * 100);

  // Camera animation CSS transform
  const getCameraStyle = (): React.CSSProperties => {
    switch (cameraZoom) {
      case 'PAN_LEFT':
        return { transform: 'scale(1.12) translate(-20px, 0)', transition: 'transform 8s ease-in-out' };
      case 'PAN_RIGHT':
        return { transform: 'scale(1.12) translate(20px, 0)', transition: 'transform 8s ease-in-out' };
      case 'ZOOM_IN':
        return { transform: 'scale(1.16)', transition: 'transform 8s ease-out' };
      default:
        return { transform: 'scale(1.0)', transition: 'transform 0.5s ease' };
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      background: '#040711',
      color: '#f8fafc',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ── TOP VIDEO CONTROLLER SUB-NAV ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        background: 'rgba(10, 16, 28, 0.95)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
        flexWrap: 'wrap',
        gap: '10px',
        zIndex: 20
      }}>
        {/* Left: Back to Shelf & Switch to Comic Book Reader */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#1e293b',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ChevronLeft size={14} /> Comic Shelf
          </button>

          <button
            onClick={onSwitchToReader}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.25))',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 800,
              border: '1px solid rgba(245, 158, 11, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Read comic in traditional illustrated page-by-page view"
          >
            <BookOpen size={14} />
            <span>📖 Read as Comic Book</span>
          </button>
        </div>

        {/* Center: Video Mode Switcher (Motion Comic vs NASA Archival Footage) */}
        <div style={{
          display: 'flex',
          background: 'rgba(2, 6, 23, 0.9)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}>
          <button
            onClick={() => { setVideoMode('MOTION_COMIC'); soundFx.playClick(800); }}
            style={{
              padding: '5px 14px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 800,
              background: videoMode === 'MOTION_COMIC' ? 'linear-gradient(90deg, #0284c7, #38bdf8)' : 'transparent',
              color: videoMode === 'MOTION_COMIC' ? '#040711' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={13} />
            <span>🎬 Animated Motion Comic Video</span>
          </button>

          <button
            onClick={() => { setVideoMode('NASA_ARCHIVE'); setIsPlaying(false); soundFx.playClick(850); }}
            style={{
              padding: '5px 14px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 800,
              background: videoMode === 'NASA_ARCHIVE' ? 'linear-gradient(90deg, #ea580c, #f97316)' : 'transparent',
              color: videoMode === 'NASA_ARCHIVE' ? '#ffffff' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Tv size={13} />
            <span>🎥 Official NASA Archival Video</span>
          </button>
        </div>

        {/* Right: Audio Narration & Subtitle Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: showCaptions ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
              color: showCaptions ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Toggle Subtitles / Captions"
          >
            <Subtitles size={14} />
            <span>CC</span>
          </button>

          <button
            onClick={() => {
              const next = !isAudioEnabled;
              setIsAudioEnabled(next);
              if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              soundFx.playClick(700);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: isAudioEnabled ? 'rgba(67, 255, 160, 0.18)' : '#1e293b',
              color: isAudioEnabled ? '#43ffa0' : '#94a3b8',
              border: isAudioEnabled ? '1px solid rgba(67, 255, 160, 0.4)' : '1px solid #334155',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Toggle Audio Voice Narration"
          >
            {isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{isAudioEnabled ? 'Voiceover ON' : 'Mute'}</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CINEMA VIDEO VIEWPORT ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 20px',
        position: 'relative',
        minHeight: 0
      }}>
        {videoMode === 'MOTION_COMIC' ? (
          /* CASE 1: ANIMATED MOTION COMIC CINEMA SCREEN */
          <div style={{
            width: '100%',
            maxWidth: '960px',
            aspectRatio: '16/9',
            background: '#020617',
            borderRadius: '16px',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.25), 0 20px 50px rgba(0, 0, 0, 0.95)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Dynamic Animated Canvas Artwork with Ken Burns Effect */}
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...getCameraStyle()
            }}>
              <ComicVisualArtwork
                issueNumber={issue.issueNumber}
                panelNumber={currentScene.panelNumber}
                sceneType={currentScene.sceneType}
                speaker={currentScene.speaker}
                mood={currentScene.mood}
                viewMode="comic"
                sfxText={currentScene.sfx?.text}
              />
            </div>

            {/* Thruster particle sparks and starry canvas overlay */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 4,
                width: '100%',
                height: '100%'
              }}
            />

            {/* Top Cine Letterbox Bar with Title & Scene Pill */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '42px',
              background: 'linear-gradient(180deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0) 100%)',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
              pointerEvents: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  background: 'rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #f59e0b'
                }}>
                  SCENE {currentSceneIdx + 1} OF {allScenes.length}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                  {issue.title}: {currentScene.pageTitle}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                {currentScene.sceneType.replace(/_/g, ' ')}
              </div>
            </div>

            {/* Sound Effect Graphic Explosion Burst on Screen */}
            {currentScene.sfx && (
              <div style={{
                position: 'absolute',
                top: '18%',
                right: '12%',
                zIndex: 12,
                transform: 'rotate(8deg) scale(1.1)',
                animation: 'pulse 1.5s infinite',
                pointerEvents: 'none'
              }}>
                <div style={{
                  background: 'radial-gradient(circle, #f59e0b 0%, #b45309 80%)',
                  padding: '8px 20px',
                  borderRadius: '12px',
                  border: '3px solid #fef08a',
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.8), 0 4px 14px rgba(0,0,0,0.8)',
                  color: '#020617',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '22px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}>
                  💥 {currentScene.sfx.text}
                </div>
              </div>
            )}

            {/* Bottom Subtitles & Dialogue Speech Box */}
            {showCaptions && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                zIndex: 15,
                background: 'rgba(9, 14, 26, 0.88)',
                backdropFilter: 'blur(12px)',
                borderRadius: '14px',
                border: `1.5px solid ${speaker.color}60`,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85)'
              }}>
                {/* Speaker Avatar & Live Waveform Indicator */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: `${speaker.color}25`,
                  border: `2px solid ${speaker.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  boxShadow: `0 0 15px ${speaker.color}40`
                }}>
                  {speaker.badge}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: speaker.color }}>
                      {speaker.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      [{speaker.role}]
                    </span>
                    {isPlaying && isAudioEnabled && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '6px' }}>
                        <span style={{ width: '3px', height: '10px', background: speaker.color, borderRadius: '2px', animation: 'bounce 0.6s infinite' }} />
                        <span style={{ width: '3px', height: '16px', background: speaker.color, borderRadius: '2px', animation: 'bounce 0.8s infinite 0.1s' }} />
                        <span style={{ width: '3px', height: '8px', background: speaker.color, borderRadius: '2px', animation: 'bounce 0.7s infinite 0.2s' }} />
                      </span>
                    )}
                  </div>

                  {currentScene.caption && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '3px' }}>
                      🎙️ {currentScene.caption}
                    </div>
                  )}

                  <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 600, lineHeight: 1.4 }}>
                    "{currentScene.dialogue}"
                  </div>
                </div>
              </div>
            )}

            {/* Video Completion Celebration Banner */}
            {isCompleted && (
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 25,
                background: 'rgba(2, 6, 23, 0.94)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '42px', marginBottom: '10px' }}>🏆</div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', margin: 0 }}>
                  Mission Video Complete!
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', maxWidth: '480px', marginTop: '8px', lineHeight: 1.6 }}>
                  You have experienced the full story of <strong>{issue.title}</strong> ({issue.nasaMissionTieIn}).
                  Ready to test your knowledge or read the full comic issue?
                </p>

                <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                  <button
                    onClick={handleRestartVideo}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: '#1e293b',
                      color: '#38bdf8',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      border: '1px solid #38bdf8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <RotateCcw size={15} /> Replay Video
                  </button>

                  <button
                    onClick={onSwitchToReader}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '10px',
                      background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                      color: '#020617',
                      fontWeight: 900,
                      fontSize: '12.5px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    <BookOpen size={15} /> Read Comic & Take Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CASE 2: OFFICIAL NASA ARCHIVAL HISTORICAL VIDEO EMBED */
          <div style={{
            width: '100%',
            maxWidth: '960px',
            aspectRatio: '16/9',
            background: '#020617',
            borderRadius: '16px',
            border: '2px solid rgba(249, 115, 22, 0.5)',
            boxShadow: '0 0 40px rgba(249, 115, 22, 0.25), 0 20px 50px rgba(0, 0, 0, 0.95)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Embedded YouTube / NASA Archival Video Player */}
            <iframe
              src={`https://www.youtube.com/embed/${nasaVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={nasaVideo.title}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#000'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />

            {/* Official Archival Action Ribbon */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(180deg, transparent 0%, rgba(2, 6, 23, 0.95) 40%, #020617 100%)',
              padding: '16px 20px 12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              pointerEvents: 'none'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#fb923c', fontWeight: 800, textTransform: 'uppercase' }}>
                  🏛️ {nasaVideo.nasaCredit} · {nasaVideo.year}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                  {nasaVideo.title}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
                <a
                  href={nasaVideo.nasaGovUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '11px',
                    color: '#43ffa0',
                    background: 'rgba(6, 78, 59, 0.65)',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(67, 255, 160, 0.45)',
                    textDecoration: 'none',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Open Official NASA Mission History Archive"
                >
                  <span>🏛️ NASA.gov Mission Page ↗</span>
                </a>

                <a
                  href={`https://www.youtube.com/watch?v=${nasaVideo.youtubeId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '11px',
                    color: '#ffffff',
                    background: '#dc2626',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ef4444',
                    textDecoration: 'none',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 10px rgba(220, 38, 38, 0.5)'
                  }}
                  title="Watch Video on YouTube"
                >
                  <span>▶️ Watch on YouTube ↗</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM VIDEO PLAYBACK TIMELINE & CONTROLS BAR ── */}
      <div style={{
        padding: '12px 24px',
        background: 'rgba(10, 16, 28, 0.98)',
        borderTop: '1px solid rgba(56, 189, 248, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 20
      }}>
        {/* Interactive Progress Bar with Scene Checkpoints */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', width: '42px', textAlign: 'right' }}>
            {formatTime(elapsedSeconds)}
          </span>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const targetIdx = Math.floor(ratio * allScenes.length);
              setCurrentSceneIdx(Math.min(allScenes.length - 1, targetIdx));
              soundFx.playClick(700);
            }}
            style={{
              flex: 1,
              height: '8px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            title="Click along the timeline to jump to a scene"
          >
            {/* Progress Fill */}
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0284c7, #38bdf8, #f59e0b)',
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', width: '42px' }}>
            {formatTime(totalEstimatedDurationSec)}
          </span>
        </div>

        {/* Control Buttons Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Left: Previous, Play/Pause, Next Scene buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrevScene}
              disabled={currentSceneIdx === 0}
              style={{
                background: '#1e293b',
                border: 'none',
                color: currentSceneIdx === 0 ? '#475569' : '#f8fafc',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: currentSceneIdx === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Previous Scene (Skip back)"
            >
              <SkipBack size={16} />
            </button>

            {/* Big Primary Play/Pause Button */}
            <button
              onClick={togglePlay}
              style={{
                background: isPlaying
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                border: 'none',
                color: '#020617',
                padding: '8px 20px',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isPlaying
                  ? '0 0 20px rgba(245, 158, 11, 0.5)'
                  : '0 0 20px rgba(56, 189, 248, 0.5)',
                transition: 'all 0.2s'
              }}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY VIDEO'}</span>
            </button>

            <button
              onClick={handleNextScene}
              disabled={currentSceneIdx === allScenes.length - 1}
              style={{
                background: '#1e293b',
                border: 'none',
                color: currentSceneIdx === allScenes.length - 1 ? '#475569' : '#f8fafc',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: currentSceneIdx === allScenes.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Next Scene (Skip forward)"
            >
              <SkipForward size={16} />
            </button>

            <button
              onClick={handleRestartVideo}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#94a3b8',
                padding: '7px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}
              title="Restart from Beginning"
            >
              <RotateCcw size={13} />
              <span>Restart</span>
            </button>
          </div>

          {/* Center: Chapter / Scene Thumbnails Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            maxWidth: '420px',
            paddingBottom: '2px'
          }}>
            {allScenes.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => {
                  setCurrentSceneIdx(idx);
                  soundFx.playClick(750);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: currentSceneIdx === idx ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: currentSceneIdx === idx ? 'rgba(56, 189, 248, 0.25)' : '#0f172a',
                  color: currentSceneIdx === idx ? '#38bdf8' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace'
                }}
                title={`Jump to Scene ${idx + 1}: ${sc.sceneType}`}
              >
                #{idx + 1}
              </button>
            ))}
          </div>

          {/* Right: Playback Speed Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  setPlaybackSpeed(spd);
                  soundFx.playClick(600);
                }}
                style={{
                  padding: '3px 7px',
                  borderRadius: '5px',
                  border: 'none',
                  background: playbackSpeed === spd ? '#0284c7' : '#1e293b',
                  color: playbackSpeed === spd ? '#ffffff' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
