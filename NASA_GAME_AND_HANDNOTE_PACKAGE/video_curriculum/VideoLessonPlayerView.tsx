// ============================================================================
// VideoLessonPlayerView.tsx — NASA Junior Astronaut Video & Animation Center
// High-Fidelity 3D WebGL Flight Animations + Official NASA YouTube Video Archives
// Modeled After Real NASA Flight Dynamics & Ellipse Simulator Heritage (qXYpltxSTK0)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  CURRICULUM_MODULES,
  type CurriculumModulePackage,
  type VideoLessonStep,
} from '../handwritten_notebook/curriculumNotesAudioVideo';
import { CURRICULUM_NASA_VIDEO_SOURCES } from './curriculumNasaVideoSources';
import { ThreeCurriculumVideoStage } from './ThreeCurriculumVideoStage';
import { CadetAnimationVideoStage } from './CadetAnimationVideoStage';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Subtitles,
  Award,
  Sparkles,
  HelpCircle,
  Video,
  Box,
  Volume2,
  VolumeX,
  ExternalLink,
  Zap,
  RotateCcw,
  Maximize2,
  Gauge,
  Radio,
} from 'lucide-react';
import { soundFx } from '../gaming_engine/utils/audioEffects';
import { speechEngine } from './speechEngine';
import './VideoLessonPlayerView.css';

interface VideoLessonPlayerViewProps {
  initialModuleId?: number;
  onLaunchMission?: (missionId: string) => void;
}

export type VideoDisplayMode = 'THREE_3D_ANIMATION' | 'CADET_2D_ANIMATION' | 'NASA_YOUTUBE_DOCUMENTARY';

export const VideoLessonPlayerView: React.FC<VideoLessonPlayerViewProps> = ({
  initialModuleId = 1,
  onLaunchMission,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(initialModuleId);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(true);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [displayMode, setDisplayMode] = useState<VideoDisplayMode>('THREE_3D_ANIMATION');
  const [userDecision, setUserDecision] = useState<string | null>(null);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  const currentModule: CurriculumModulePackage =
    CURRICULUM_MODULES.find((m) => m.id === selectedModuleId) || CURRICULUM_MODULES[0];
  const { video } = currentModule;
  const currentStep: VideoLessonStep = video.steps[currentStepIdx] || video.steps[0];
  const nasaVideoSource = CURRICULUM_NASA_VIDEO_SOURCES[selectedModuleId] || CURRICULUM_NASA_VIDEO_SOURCES[1];

  // Auto-advance through video steps if playing in 3D animation mode
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying && displayMode === 'THREE_3D_ANIMATION') {
      const stepDurationMs = Math.round(8000 / playbackSpeed);
      timer = setTimeout(() => {
        if (currentStepIdx < video.steps.length - 1) {
          setCurrentStepIdx((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          soundFx.playVictory();
        }
      }, stepDurationMs);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIdx, video.steps.length, playbackSpeed, displayMode]);

  // Voiceover speech synthesis when step changes (if enabled)
  useEffect(() => {
    if (voiceoverEnabled && isPlaying && displayMode === 'THREE_3D_ANIMATION') {
      speechEngine.speak(`${currentStep.title}. ${currentStep.caption}`, 'HOUSTON_CAPCOM');
    }
    return () => {
      speechEngine.stop();
    };
  }, [currentStepIdx, voiceoverEnabled, isPlaying, displayMode]);

  const handleNextStep = () => {
    if (currentStepIdx < video.steps.length - 1) {
      setCurrentStepIdx((s) => s + 1);
      soundFx.playClick(700);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((s) => s - 1);
      soundFx.playClick(600);
    }
  };

  const handleActionTriggered = (msg: string) => {
    setActionNotification(msg);
    setTimeout(() => setActionNotification(null), 3500);
  };

  return (
    <div className="video-lesson-wrapper" style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
      {/* ── TOP MODULE SELECTOR PILLS ──────────────────────────────────────── */}
      <div className="video-module-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {CURRICULUM_MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => {
              setSelectedModuleId(mod.id);
              setCurrentStepIdx(0);
              setUserDecision(null);
              speechEngine.stop();
              soundFx.playClick(850);
            }}
            className={`video-pill-btn ${mod.id === selectedModuleId ? 'active' : ''}`}
            style={{
              borderColor: mod.id === selectedModuleId ? mod.themeColor : 'rgba(255,255,255,0.1)',
              background: mod.id === selectedModuleId ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.5)',
              boxShadow: mod.id === selectedModuleId ? `0 0 14px ${mod.themeColor}50` : 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ color: mod.themeColor, fontWeight: 900 }}>Mod {mod.id}</span>
            <strong style={{ color: '#ffffff' }}>{mod.name.split(':')[1]?.split('—')[0]?.trim()}</strong>
          </button>
        ))}
      </div>

      {/* ── MODE SWITCHER: 3D REAL-TIME ANIMATION vs OFFICIAL NASA YOUTUBE ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setDisplayMode('THREE_3D_ANIMATION');
              soundFx.playClick(900);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background:
                displayMode === 'THREE_3D_ANIMATION'
                  ? `linear-gradient(135deg, ${currentModule.themeColor}, #0284c7)`
                  : 'rgba(255, 255, 255, 0.05)',
              border: `1.5px solid ${displayMode === 'THREE_3D_ANIMATION' ? currentModule.themeColor : 'rgba(255,255,255,0.1)'}`,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: displayMode === 'THREE_3D_ANIMATION' ? `0 0 14px ${currentModule.themeColor}50` : 'none',
            }}
          >
            <Box size={14} />
            <span>🚀 3D FLIGHT ANIMATION VIDEO</span>
          </button>

          <button
            onClick={() => {
              setDisplayMode('CADET_2D_ANIMATION');
              soundFx.playClick(900);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background:
                displayMode === 'CADET_2D_ANIMATION'
                  ? 'linear-gradient(135deg, #10b981, #047857)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: `1.5px solid ${displayMode === 'CADET_2D_ANIMATION' ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: displayMode === 'CADET_2D_ANIMATION' ? '0 0 14px rgba(16, 185, 129, 0.45)' : 'none',
            }}
          >
            <Sparkles size={14} />
            <span>👨‍🚀 2D CADET DRILL ANIMATION</span>
          </button>

          <button
            onClick={() => {
              setDisplayMode('NASA_YOUTUBE_DOCUMENTARY');
              speechEngine.stop();
              soundFx.playClick(900);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background:
                displayMode === 'NASA_YOUTUBE_DOCUMENTARY'
                  ? 'linear-gradient(135deg, #ef4444, #991b1b)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: `1.5px solid ${displayMode === 'NASA_YOUTUBE_DOCUMENTARY' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: displayMode === 'NASA_YOUTUBE_DOCUMENTARY' ? '0 0 14px rgba(239, 68, 68, 0.4)' : 'none',
            }}
          >
            <Video size={14} />
            <span>OFFICIAL NASA ARCHIVE</span>
          </button>
        </div>

        {/* Speed & Voiceover Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {displayMode === 'THREE_3D_ANIMATION' && (
            <>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '2px', borderRadius: '6px' }}>
                {[0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      setPlaybackSpeed(spd);
                      soundFx.playClick(750);
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: playbackSpeed === spd ? currentModule.themeColor : 'transparent',
                      color: playbackSpeed === spd ? '#ffffff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setVoiceoverEnabled(!voiceoverEnabled);
                  if (voiceoverEnabled) speechEngine.stop();
                  soundFx.playClick(800);
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: voiceoverEnabled ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${voiceoverEnabled ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  color: voiceoverEnabled ? '#38bdf8' : '#94a3b8',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Toggle Automated Houston Capcom Voiceover"
              >
                {voiceoverEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                <span>VOICEOVER</span>
              </button>
            </>
          )}

          <a
            href={nasaVideoSource.officialNasaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#cbd5e1',
              fontSize: '10px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>NASA Source</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* ── MAIN CINEMATIC VIDEO DECK ──────────────────────────────────────── */}
      <div className="video-player-deck" style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.12)' }}>
        <div
          className="video-stage-container"
          style={{ height: '420px', position: 'relative', backgroundColor: '#020617' }}
        >
          {displayMode === 'THREE_3D_ANIMATION' ? (
            /* ── MODE 1: HIGH-FIDELITY 3D THREE.JS SIMULATION STAGE ── */
            <ThreeCurriculumVideoStage
              moduleId={selectedModuleId}
              stepNumber={currentStep.stepNumber}
              stepType={currentStep.type}
              themeColor={currentModule.themeColor}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onActionTriggered={handleActionTriggered}
            />
          ) : displayMode === 'CADET_2D_ANIMATION' ? (
            /* ── MODE 2: GENERATED 2D CADET DRILL ANIMATION LESSON ── */
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <CadetAnimationVideoStage
                pillarId={
                  selectedModuleId === 1
                    ? 'EMERGENCY_DRILLS'
                    : selectedModuleId === 2
                    ? 'SPACESUIT_ECLSS'
                    : selectedModuleId === 3
                    ? 'SURFACE_REGOLITH'
                    : selectedModuleId === 4
                    ? 'HABITAT_NUTRITION'
                    : 'FITNESS_NBL'
                }
              />
            </div>
          ) : (
            /* ── MODE 3: CURATED OFFICIAL NASA YOUTUBE VIDEO ARCHIVE ── */
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <iframe
                title={nasaVideoSource.documentaryTitle}
                src={`https://www.youtube-nocookie.com/embed/${nasaVideoSource.youtubeId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* Interactive Action Notification Banner */}
          {actionNotification && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1.5px solid #4ade80',
                boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#4ade80',
                fontWeight: 900,
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 25,
                pointerEvents: 'none',
              }}
            >
              <Zap size={14} />
              <span>{actionNotification}</span>
            </div>
          )}

          {/* Top Video Header HUD (in 3D Mode) */}
          {displayMode === 'THREE_3D_ANIMATION' && (
            <div className="video-top-hud">
              <span className="video-step-badge" style={{ background: currentModule.themeColor }}>
                STEP {currentStep.stepNumber} / {video.steps.length}: {currentStep.type}
              </span>
              <div className="video-hud-meta">
                <span className="video-hud-time">⏱️ {video.duration}</span>
                <button
                  onClick={() => setCaptionsEnabled(!captionsEnabled)}
                  className={`video-cc-btn ${captionsEnabled ? 'active' : ''}`}
                  title="Toggle Closed Captions Subtitles"
                >
                  <Subtitles size={14} /> CC
                </button>
              </div>
            </div>
          )}

          {/* Interactive Decision Point for Apollo 11 (Step 3) */}
          {selectedModuleId === 3 && currentStep.stepNumber === 3 && displayMode === 'THREE_3D_ANIMATION' && (
            <div className="video-decision-overlay" style={{ zIndex: 20 }}>
              <div className="video-decision-box">
                <HelpCircle size={22} style={{ color: '#fbbf24' }} />
                <h4>Decision Point: 30 Seconds of Fuel Left!</h4>
                <p>Do you touch down immediately in the West Crater boulder field, or fly over into unknown flat ground?</p>
                <div className="video-decision-options">
                  <button
                    onClick={() => setUserDecision('boulders')}
                    className={`decision-btn ${userDecision === 'boulders' ? 'selected error' : ''}`}
                  >
                    Land Now in Boulders (High Crash Risk)
                  </button>
                  <button
                    onClick={() => {
                      setUserDecision('flyover');
                      soundFx.playFlagPlant();
                    }}
                    className={`decision-btn ${userDecision === 'flyover' ? 'selected success' : ''}`}
                  >
                    Pitch Forward & Fly Past (Armstrong Choice!)
                  </button>
                </div>
                {userDecision === 'flyover' && (
                  <div className="decision-feedback success">
                    ✅ Historic Choice! Neil Armstrong flew past West Crater to find a smooth spot with under 40 seconds of fuel remaining.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Closed Captions Subtitles Box */}
          {captionsEnabled && displayMode === 'THREE_3D_ANIMATION' && (
            <div className="video-captions-overlay" style={{ zIndex: 15 }}>
              <div className="video-caption-inner">
                <strong style={{ color: currentModule.themeColor }}>{currentStep.title}: </strong>
                <span>{currentStep.caption}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── VIDEO TIMELINE CONTROLS & STEP SCRUBBER ── */}
        <div className="video-timeline-controls">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              soundFx.playClick(750);
            }}
            className="video-play-btn"
            style={{ minWidth: '85px' }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <div className="video-steps-timeline">
            {video.steps.map((st, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentStepIdx(i);
                  soundFx.playClick(650);
                }}
                className={`video-timeline-step-btn ${currentStepIdx === i ? 'active' : ''} ${i < currentStepIdx ? 'completed' : ''}`}
                style={{
                  borderColor: currentStepIdx === i ? currentModule.themeColor : 'rgba(255,255,255,0.1)',
                }}
              >
                <span>{st.stepNumber}</span>
                <small>{st.type}</small>
              </button>
            ))}
          </div>

          <div className="video-nav-arrows">
            <button onClick={handlePrevStep} disabled={currentStepIdx === 0} className="video-nav-arrow-btn" title="Previous Step">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNextStep} disabled={currentStepIdx === video.steps.length - 1} className="video-nav-arrow-btn" title="Next Step">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ── FOOTER CREDITS & SIMULATOR ACTION CARD ── */}
        <div className="video-footer-meta" style={{ padding: '16px 20px', background: 'rgba(15, 23, 42, 0.95)' }}>
          <div
            className="video-challenge-card"
            style={{
              borderLeft: `4px solid ${currentModule.themeColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <Sparkles size={18} style={{ color: currentModule.themeColor }} />
              <div>
                <strong style={{ color: '#ffffff' }}>NASA MISSION DIRECTIVE: </strong>
                <span style={{ color: '#cbd5e1' }}>{video.oneLineChallenge}</span>
              </div>
            </div>

            {onLaunchMission && (
              <button
                onClick={() => {
                  soundFx.playClick(900);
                  onLaunchMission(`NASA-M00${selectedModuleId}`);
                }}
                className="video-launch-btn"
                style={{
                  background: `linear-gradient(135deg, ${currentModule.themeColor}, #0284c7)`,
                  border: 'none',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: `0 0 16px ${currentModule.themeColor}50`,
                }}
              >
                <span>LAUNCH IN 3D SIMULATOR</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
              fontSize: '11px',
              color: '#94a3b8',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={13} color="#f59e0b" />
              <span>NASA Media Credit: <strong style={{ color: '#cbd5e1' }}>{currentStep.nasaMediaCredit}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Curated Video: <strong style={{ color: '#38bdf8' }}>{nasaVideoSource.documentaryTitle}</strong></span>
              <a
                href={nasaVideoSource.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ef4444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800 }}
              >
                <span>YouTube</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
