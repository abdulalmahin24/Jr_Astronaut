import React, { useState, useEffect } from 'react';
import { CURRICULUM_MODULES, type CurriculumModulePackage, type VideoLessonStep } from '../data/curriculumNotesAudioVideo';
import { NASA_ARCHIVAL_VIDEOS } from './ComicVideoPlayer';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  Subtitles, 
  Award, 
  Sparkles, 
  HelpCircle,
  Film,
  Box,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Tv
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { ThreeAerospaceStage } from './ThreeAerospaceStage';

interface VideoLessonPlayerViewProps {
  initialModuleId?: number;
  onLaunchMission?: (missionId: string) => void;
}

export const VideoLessonPlayerView: React.FC<VideoLessonPlayerViewProps> = ({
  initialModuleId = 1,
  onLaunchMission,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(initialModuleId);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(true);
  const [userDecision, setUserDecision] = useState<string | null>(null);
  const [stageMode, setStageMode] = useState<'VIDEO' | '3D'>('VIDEO');

  const currentModule: CurriculumModulePackage =
    CURRICULUM_MODULES.find((m) => m.id === selectedModuleId) || CURRICULUM_MODULES[0];
  const { video } = currentModule;
  const currentStep: VideoLessonStep = video.steps[currentStepIdx] || video.steps[0];
  const archivalVideo = NASA_ARCHIVAL_VIDEOS[selectedModuleId] || NASA_ARCHIVAL_VIDEOS[1];

  // Auto-advance through video steps if playing in 3D mode
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying && stageMode === '3D') {
      timer = setTimeout(() => {
        if (currentStepIdx < video.steps.length - 1) {
          setCurrentStepIdx((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          soundFx.playFlagPlant();
        }
      }, 7000); // 7 seconds per video concept step
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, stageMode, currentStepIdx, video.steps.length]);

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

  return (
    <div className="video-lesson-wrapper">
      {/* ── TOP MODULE SELECTOR PILLS (ALL 8 MODULES) ────────────────────── */}
      <div className="video-module-pills">
        {CURRICULUM_MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => {
              setSelectedModuleId(mod.id);
              setCurrentStepIdx(0);
              setUserDecision(null);
            }}
            className={`video-pill-btn ${mod.id === selectedModuleId ? 'active' : ''}`}
            style={{
              borderColor: mod.id === selectedModuleId ? mod.themeColor : 'rgba(255,255,255,0.1)'
            }}
          >
            <span>Mod {mod.id}</span>
            <strong>{mod.name.split(':')[1]?.split('—')[0]?.trim() || mod.name}</strong>
          </button>
        ))}
      </div>

      {/* ── STAGE MODE SWITCHER HUD ────────────────────────────────────────── */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '10px',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '8px 14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              setStageMode('VIDEO');
              soundFx.playClick(700);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              border: stageMode === 'VIDEO' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: stageMode === 'VIDEO' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: stageMode === 'VIDEO' ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Film size={14} /> Official NASA Video Module
          </button>

          <button
            onClick={() => {
              setStageMode('3D');
              soundFx.playClick(750);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              border: stageMode === '3D' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
              background: stageMode === '3D' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: stageMode === '3D' ? '#f59e0b' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Box size={14} /> 3D Telemetry Flight Stage
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
            NASA PUBLIC DOMAIN ARCHIVES
          </span>
          <button
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`video-cc-btn ${captionsEnabled ? 'active' : ''}`}
            title="Toggle Closed Captions Subtitles"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <Subtitles size={12} /> CC
          </button>
        </div>
      </div>

      {/* ── MAIN CINEMATIC VIDEO DECK ──────────────────────────────────────── */}
      <div className="video-player-deck">
        {stageMode === 'VIDEO' ? (
          /* 📹 AUTHENTIC NASA ARCHIVAL VIDEO STREAM */
          <div style={{ background: '#020617', padding: '16px' }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '52%', borderRadius: '8px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe
                key={archivalVideo.youtubeId}
                src={`https://www.youtube-nocookie.com/embed/${archivalVideo.youtubeId}?rel=0&modestbranding=1`}
                title={archivalVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>

            {/* Official NASA Archival Metadata Card */}
            <div 
              style={{ 
                marginTop: '14px', 
                padding: '14px 18px', 
                background: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(56, 189, 248, 0.25)', 
                borderRadius: '8px' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8', letterSpacing: '0.06em' }}>
                    {archivalVideo.title.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    YEAR {archivalVideo.year}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                    ⏱️ {archivalVideo.duration}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    📍 {archivalVideo.keyTimestamp}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                {archivalVideo.summary}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  🏛️ <strong>Curator:</strong> {archivalVideo.nasaCredit}
                </div>
                <a
                  href={archivalVideo.nasaGovUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600
                  }}
                >
                  <span>Official NASA Mission Primary Archives</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* 🛰️ 3D INTERACTIVE AEROSPACE FLIGHT STAGE */
          <div className="video-stage-container">
            <ThreeAerospaceStage
              moduleId={selectedModuleId}
              stepIndex={currentStepIdx}
              stepType={currentStep.type}
            />

            {/* Top Video Header HUD */}
            <div className="video-top-hud">
              <span className="video-step-badge" style={{ background: currentModule.themeColor }}>
                STEP {currentStep.stepNumber} / {video.steps.length}: {currentStep.type}
              </span>
              <div className="video-hud-meta">
                <span className="video-hud-time">⏱️ {video.duration}</span>
              </div>
            </div>

            {/* Interactive Decision Point for Apollo 11 (Step 3) */}
            {selectedModuleId === 3 && currentStep.stepNumber === 3 && (
              <div className="video-decision-overlay">
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
            {captionsEnabled && (
              <div className="video-captions-overlay">
                <div className="video-caption-inner">
                  <strong>{currentStep.title}: </strong>
                  <span>{currentStep.caption}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Step Progress Bar & Controls */}
        <div className="video-timeline-controls">
          <button 
            onClick={() => {
              if (stageMode !== '3D') setStageMode('3D');
              setIsPlaying(!isPlaying);
            }} 
            className="video-play-btn"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'Pause 3D Tour' : 'Play 3D Tour'}</span>
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
              >
                <span>{st.stepNumber}</span>
                <small>{st.type}</small>
              </button>
            ))}
          </div>

          <div className="video-nav-arrows">
            <button onClick={handlePrevStep} disabled={currentStepIdx === 0} className="video-nav-arrow-btn">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNextStep} disabled={currentStepIdx === video.steps.length - 1} className="video-nav-arrow-btn">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Video Footer Credits & One-Line Challenge */}
        <div className="video-footer-meta">
          <div className="video-challenge-card" style={{ borderLeft: `4px solid ${currentModule.themeColor}` }}>
            <Sparkles size={16} style={{ color: currentModule.themeColor }} />
            <div>
              <strong>MISSION CHALLENGE: </strong>
              <span>{video.oneLineChallenge}</span>
            </div>
            {onLaunchMission && (
              <button
                onClick={() => onLaunchMission(`NASA-M00${selectedModuleId}`)}
                className="video-launch-btn"
                style={{ background: currentModule.themeColor }}
              >
                Test in Sim
              </button>
            )}
          </div>

          <div className="video-nasa-credit">
            <Award size={12} />
            <span>NASA Primary Media: {archivalVideo.nasaCredit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

