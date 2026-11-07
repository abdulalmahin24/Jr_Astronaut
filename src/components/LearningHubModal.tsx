import React, { useState } from 'react';
import type { TeachingFlashcard } from '../data/teachingFlashcards';
import { MISSION_EVENTS } from '../data/events';
import type { MissionEvent } from '../types/game';
import { NASA_MISSIONS } from '../data/nasaMissions';
import { NASA_MISSIONS_CATALOG, type NasaCatalogMission } from '../data/nasaMissionCatalog';
import { COMIC_BOOK_ISSUES, getMergedComicIssues, type ComicIssue } from '../data/comicBooks';
import { ComicVisualArtwork } from './ComicVisualArtwork';
import { ComicBookModal } from './ComicBookModal';
import { GoogleFlowComicModal } from './GoogleFlowComicModal';
import { soundFx } from '../utils/audioEffects';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Radio, 
  Search, 
  Play, 
  BookOpen, 
  Sparkles, 
  Mic, 
  Video, 
  Rocket, 
  Library, 
  FileText, 
  Box,
  Film,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Zap
} from 'lucide-react';
import { speechEngine } from '../utils/speechEngine';
import { HandwrittenNotebookView } from './HandwrittenNotebookView';
import { AudioLessonPlayerView } from './AudioLessonPlayerView';
import { VideoLessonPlayerView } from './VideoLessonPlayerView';
import { Interactive3DSpacecraftViewer } from './Interactive3DSpacecraftViewer';

interface LearningHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvent: MissionEvent | null;
  collectedFlashcards?: TeachingFlashcard[];
  activeMissionId: string;
  onLaunchMission?: (missionId: string) => void;
  completedMissions?: string[];
  onOpenComicReader?: (issueId?: string) => void;
  initialTab?: HubTab;
  initialIssueId?: string;
  isFullPage?: boolean;
}

type HubTab = 'NOTEBOOK' | 'MODELS_3D' | 'VIDEO' | 'AUDIO' | 'COMIC' | 'BRIEFINGS' | 'CATALOG';

const SPEAKER_META: Record<string, { emoji: string; name: string; color: string }> = {
  CADET_MAYA:      { emoji: '👩‍🚀', name: 'Cadet Maya',        color: '#38bdf8' },
  COMMANDER_DADU:  { emoji: '🧑‍✈️', name: 'Commander Dadu',   color: '#10b981' },
  HOUSTON_CAPCOM:  { emoji: '📡',   name: 'Houston CapCom',   color: '#f59e0b' },
  SYSTEM_AI:       { emoji: '🤖',   name: 'Artemis Core AI',  color: '#ef4444' },
};



export const LearningHubModal: React.FC<LearningHubModalProps> = ({
  isOpen,
  onClose,
  activeEvent,
  activeMissionId,
  onLaunchMission,
  completedMissions,
  onOpenComicReader,
  initialTab,
  initialIssueId,
  isFullPage = false,
}) => {
  if (!isOpen && !isFullPage) return null;

  const [activeTab, setActiveTab] = useState<HubTab>(initialTab || 'NOTEBOOK');
  const [comicMode, setComicMode] = useState<'ISSUES' | 'DILEMMAS'>('ISSUES');
  const [isComicModalOpen, setIsComicModalOpen] = useState<boolean>(false);
  const [isGoogleFlowModalOpen, setIsGoogleFlowModalOpen] = useState<boolean>(false);
  const [allComicIssues, setAllComicIssues] = useState<ComicIssue[]>(() => getMergedComicIssues());
  const [activeComicIssueId, setActiveComicIssueId] = useState<string>(initialIssueId || 'issue-01-friendship-7');
  const [comicModalMode, setComicModalMode] = useState<'reader' | 'video'>('reader');

  React.useEffect(() => {
    setAllComicIssues(getMergedComicIssues());
  }, [isOpen, isGoogleFlowModalOpen]);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  React.useEffect(() => {
    if (initialIssueId) {
      setActiveComicIssueId(initialIssueId);
      setIsComicModalOpen(true);
    }
  }, [initialIssueId]);

  const [selectedComicIdx, setSelectedComicIdx] = useState<number>(0);

  const [speakingMissionId, setSpeakingMissionId] = useState<string | null>(null);
  const [speakingCatalogId, setSpeakingCatalogId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');


  if (!isOpen) return null;

  const stopSpeech = () => {
    speechEngine.stop();
    setSpeakingMissionId(null);
    setSpeakingCatalogId(null);
  };

  const handleClose = () => {
    stopSpeech();
    onClose();
  };



  const handlePlayBriefing = (missionId: string, audio: string) => {
    if (speakingMissionId === missionId) {
      stopSpeech();
      return;
    }
    stopSpeech();
    setSpeakingMissionId(missionId);
    speechEngine.speak(audio, 'COMMANDER_DADU', () => setSpeakingMissionId(null), () => setSpeakingMissionId(null));
  };

  const handlePlayCatalog = (m: NasaCatalogMission) => {
    if (speakingCatalogId === m.id) {
      stopSpeech();
      return;
    }
    stopSpeech();
    setSpeakingCatalogId(m.id);
    const speechText = `${m.name}, launched in ${m.launchYear}. ${m.objective} Operational guide: ${m.operationalGuide}`;
    speechEngine.speak(speechText, 'COMMANDER_DADU', () => setSpeakingCatalogId(null), () => setSpeakingCatalogId(null));
  };

  const catalogPrograms = ['ALL', ...Array.from(new Set(NASA_MISSIONS_CATALOG.map((m) => m.program)))];

  const filteredCatalogMissions = NASA_MISSIONS_CATALOG.filter((m) => {
    const q = catalogSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.program.toLowerCase().includes(q) ||
      m.objective.toLowerCase().includes(q) ||
      m.operationalGuide.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q);
    const matchesProgram = selectedProgram === 'ALL' || m.program === selectedProgram;
    const matchesStatus =
      selectedStatus === 'ALL' || m.status.toLowerCase().includes(selectedStatus.toLowerCase());
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const TABS: { id: HubTab; label: string; icon: React.ElementType }[] = [
    { id: 'NOTEBOOK',  label: 'Student Notebook',          icon: FileText },
    { id: 'MODELS_3D', label: '3D Spacecraft Models',      icon: Box },
    { id: 'VIDEO',     label: 'NASA Video Modules & 3D',   icon: Video },
    { id: 'AUDIO',     label: 'Audio Lessons',             icon: Mic },
    { id: 'COMIC',     label: 'Comic Reader',              icon: BookOpen },
    { id: 'BRIEFINGS', label: 'Outpost Briefs',       icon: Radio },
    { id: 'CATALOG',   label: 'NASA Missions (76)',   icon: Rocket },
  ];

  const hubBody = (
    <div
      className={isFullPage ? "hub-fullpage-container" : "hub-modal-container"}
      onClick={(e) => e.stopPropagation()}
      style={isFullPage ? { maxWidth: '1360px', width: '100%', margin: '0 auto', background: 'var(--color-paper-2)', border: 'var(--rule-hair)', borderRadius: '4px' } : undefined}
    >
      {/* Header */}
      <div className="hub-modal-header">
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <Library size={18} style={{ color: 'var(--color-accent)' }} />
          <span className="hub-modal-title">Astro Camp / Learning Archive</span>
        </div>
        {!isFullPage && (
          <button
            onClick={handleClose}
            style={{ background:'transparent', border:'1px solid var(--rule-subtle)', color:'var(--color-ink-muted)', cursor:'pointer', padding:'6px', borderRadius:0, display:'flex', alignItems:'center' }}
            aria-label="Close Learning Hub"
          >
            <X size={16} />
          </button>
        )}
      </div>

        {/* Tabs */}
        <div className="hub-tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`hub-tab-btn ${activeTab === t.id ? 'hub-tab-active' : ''}`}
                onClick={() => { setActiveTab(t.id); stopSpeech(); }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="hub-tab-content">

          {/* ── COMIC READER ─────────────────────────────────────────────── */}
          {activeTab === 'COMIC' && (() => {
            const selectedEvent = MISSION_EVENTS[selectedComicIdx];
            const currentEvent = activeEvent?.id === selectedEvent?.id
              ? activeEvent
              : selectedEvent || activeEvent || MISSION_EVENTS[0];
            return (
              <div>
                {/* Comic Mode Switcher: 8 Graphic Novels vs Mars Sol Strips */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setComicMode('ISSUES')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: 0,
                        background: comicMode === 'ISSUES' ? 'var(--color-accent)' : 'rgba(15, 23, 42, 0.6)',
                        color: comicMode === 'ISSUES' ? '#000000' : 'var(--color-ink)',
                        border: comicMode === 'ISSUES' ? '1px solid var(--color-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}
                    >
                      <BookOpen size={14} /> 8 NASA STEM Graphic Novels (Primary Curriculum)
                    </button>
                    <button
                      onClick={() => setComicMode('DILEMMAS')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: 0,
                        background: comicMode === 'DILEMMAS' ? 'var(--color-accent)' : 'rgba(15, 23, 42, 0.6)',
                        color: comicMode === 'DILEMMAS' ? '#000000' : 'var(--color-ink)',
                        border: comicMode === 'DILEMMAS' ? '1px solid var(--color-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}
                    >
                      <Sparkles size={14} /> Sol-by-Sol Mission Log Strips ({MISSION_EVENTS.length} Sols)
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    AUTHENTIC NASA PRIMARY SOURCES & TECHNICAL ARCHIVES
                  </div>
                </div>

                {comicMode === 'ISSUES' ? (
                  /* ── 8 NASA STEM GRAPHIC NOVELS CATALOG ──────────────────────── */
                  <div>
                    {/* Header Mission Banner */}
                    <div style={{ 
                      padding: '16px 20px', 
                      background: 'rgba(15, 23, 42, 0.85)', 
                      border: '1px solid var(--color-accent)', 
                      borderRadius: 0,
                      marginBottom: '20px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ShieldCheck size={18} style={{ color: 'var(--color-accent)' }} />
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                            THE CHRONICLES OF JR_ASTROCAMP: {allComicIssues.length} NASA STEM GRAPHIC NOVELS
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => {
                              soundFx.playClick(850);
                              setIsGoogleFlowModalOpen(true);
                            }}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                              color: '#000000',
                              fontWeight: 900,
                              fontSize: '0.78rem',
                              fontFamily: 'var(--font-mono)',
                              border: '1px solid #38bdf8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}
                          >
                            <Zap size={14} /> ⚡ Generate with Google Flow
                          </button>
                          <span style={{ fontSize: '0.72rem', padding: '5px 8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                            SERIES CATALOG ({allComicIssues.length})
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', lineHeight: 1.55, margin: 0 }}>
                        Authentic multi-panel graphic novels chronicling pivotal NASA exploration milestones. Fact-checked against verified flight director logs, Mercury transcripts, Apollo descent audio, JPL archives, and NASA Technical Reports (NASA SP-350, NASA/SP-20205009602, STScI-JWST-TM-001). Featuring visual panel artwork, crew voiceovers, interactive STEM fact hotspots, hands-on experiments, and comprehension quizzes. Use <strong>Google Flow</strong> to dynamically synthesize new authentic historical issues on demand!
                      </p>
                    </div>

                    {/* All Graphic Novels Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      {allComicIssues.map((issue) => (
                        <div 
                          key={issue.id}
                          style={{
                            background: 'var(--color-paper-card, #090d16)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Top Visual Artwork Cover Preview */}
                          <div style={{ position: 'relative', width: '100%', height: '150px', background: '#020617', borderBottom: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <ComicVisualArtwork 
                              issueNumber={issue.issueNumber} 
                              panelNumber={1} 
                              sceneType={issue.pages[0]?.panels[0]?.sceneType} 
                            />
                            {/* Overlay Badge */}
                            <div style={{ 
                              position: 'absolute', 
                              top: '8px', 
                              left: '8px', 
                              background: 'rgba(0, 0, 0, 0.85)', 
                              border: '1px solid var(--color-accent)', 
                              padding: '2px 8px', 
                              fontSize: '0.68rem', 
                              fontWeight: 800, 
                              fontFamily: 'var(--font-mono)', 
                              color: 'var(--color-accent)' 
                            }}>
                              ISSUE {issue.issueNumber < 10 ? `0${issue.issueNumber}` : issue.issueNumber}
                            </div>
                            {(issue.issueNumber > 8 || issue.id.includes('flow-generated')) && (
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                background: 'linear-gradient(135deg, #38bdf8, #0284c7)', 
                                color: '#000000', 
                                padding: '2px 7px', 
                                fontSize: '0.62rem', 
                                fontWeight: 900, 
                                fontFamily: 'var(--font-mono)', 
                                boxShadow: '0 0 10px rgba(56, 189, 248, 0.6)',
                                letterSpacing: '0.04em'
                              }}>
                                ⚡ GOOGLE FLOW AI
                              </div>
                            )}
                            <div style={{ 
                              position: 'absolute', 
                              bottom: '8px', 
                              right: '8px', 
                              background: 'rgba(2, 6, 23, 0.9)', 
                              border: '1px solid rgba(56, 189, 248, 0.4)', 
                              padding: '2px 8px', 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              fontFamily: 'var(--font-mono)', 
                              color: '#38bdf8' 
                            }}>
                              {issue.coverBadge}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                              {issue.nasaMissionTieIn.toUpperCase()}
                            </div>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-ink, #f8fafc)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                              {issue.title}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '8px' }}>
                              {issue.subtitle}
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted, #94a3b8)', lineHeight: 1.45, margin: '0 0 12px 0', flexGrow: 1 }}>
                              {issue.synopsis}
                            </p>

                            <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px', fontSize: '0.7rem', color: '#cbd5e1' }}>
                              <div><strong>Standards:</strong> {issue.curriculumStandards.join(', ')}</div>
                              <div style={{ marginTop: '2px', color: '#64748b', fontSize: '0.68rem' }}>
                                <strong>NASA Citation:</strong> {issue.nasaDocumentCitation}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setActiveComicIssueId(issue.id);
                                  setComicModalMode('reader');
                                  setIsComicModalOpen(true);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: 0,
                                  background: 'var(--color-accent)',
                                  color: '#000000',
                                  border: '1px solid var(--color-accent)',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  fontFamily: 'var(--font-mono)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase'
                                }}
                              >
                                <BookOpen size={13} /> Read Issue
                              </button>

                              <button
                                onClick={() => {
                                  setActiveComicIssueId(issue.id);
                                  setComicModalMode('video');
                                  setIsComicModalOpen(true);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 0,
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38bdf8',
                                  border: '1px solid rgba(56, 189, 248, 0.4)',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  fontFamily: 'var(--font-mono)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                                title="Watch Archival NASA Documentary Video"
                              >
                                <Film size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ── SOL-BY-SOL MISSION LOG STRIPS ────────────────────────── */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} style={{ color: 'var(--color-accent)' }} />
                        <span><strong>Mission Dilemma Comic Strips:</strong> Sol by Sol Mission Log</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                        SOL EVENT {selectedComicIdx + 1} OF {MISSION_EVENTS.length}
                      </div>
                    </div>

                    {/* Episode Selector Pills */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px' }}>
                      {MISSION_EVENTS.map((ev, idx) => (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedComicIdx(idx)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            background: selectedComicIdx === idx ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                            border: selectedComicIdx === idx ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: selectedComicIdx === idx ? '#38bdf8' : '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Sol {ev.sol}: {ev.title.length > 24 ? ev.title.slice(0, 24) + '...' : ev.title}
                        </button>
                      ))}
                    </div>

                    <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(167,139,250,0.08)', borderRadius: '10px', border: '1px solid rgba(167,139,250,0.15)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                        Sol {currentEvent.sol} — {currentEvent.urgency} Event
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{currentEvent.title}</div>
                      {currentEvent.weatherNotice && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>
                          Telemetry: {currentEvent.weatherNotice}
                        </div>
                      )}
                    </div>

                    <div className="hub-comic-strip">
                      {currentEvent.comicPanels.map((panel, idx) => {
                        const meta = SPEAKER_META[panel.speaker] ?? { emoji: '👤', name: panel.speaker, color: '#94a3b8' };
                        return (
                          <div key={idx} className="hub-comic-panel">
                            <div
                              className="hub-comic-speaker-badge"
                              style={{ borderColor: meta.color, background: `${meta.color}18` }}
                            >
                              {meta.emoji}
                            </div>
                            <div className="hub-comic-dialogue">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="hub-comic-speaker-name" style={{ color: meta.color }}>
                                  {meta.name}
                                </div>
                                <button
                                  onClick={() => {
                                    if ('speechSynthesis' in window) {
                                      window.speechSynthesis.cancel();
                                      const utterance = new SpeechSynthesisUtterance(panel.dialogue);
                                      utterance.pitch = panel.speaker === 'CADET_MAYA' ? 1.3 : 0.85;
                                      window.speechSynthesis.speak(utterance);
                                    }
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Listen to dialogue"
                                >
                                  <Volume2 size={14} className="hover:text-amber-400" />
                                </button>
                              </div>
                              <div>"{panel.dialogue}"</div>
                              {panel.mood && (
                                <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>
                                  Mood: {panel.mood}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── HANDWRITTEN STUDENT NOTEBOOK (6 CURRICULUM MODULES) ────────── */}
          {activeTab === 'NOTEBOOK' && (
            <HandwrittenNotebookView onLaunchMission={onLaunchMission} />
          )}

          {/* ── 3D SPACECRAFT & FLIGHT MODELS (9 AUTHENTIC NASA GLB ASSETS) ─── */}
          {activeTab === 'MODELS_3D' && (
            <Interactive3DSpacecraftViewer onLaunchMission={onLaunchMission} />
          )}

          {/* ── INTERACTIVE 3D LAB & VIDEO MODULES ──────────────────────────── */}
          {activeTab === 'VIDEO' && (
            <VideoLessonPlayerView onLaunchMission={onLaunchMission} />
          )}

          {/* ── AUDIO LESSONS & PODCAST (6 CURRICULUM MODULES) ────────────── */}
          {activeTab === 'AUDIO' && (
            <AudioLessonPlayerView onLaunchMission={onLaunchMission} />
          )}

          {/* ── MISSION BRIEFINGS ────────────────────────────────────────── */}
          {activeTab === 'BRIEFINGS' && (
            <div>
              <div style={{ marginBottom:'16px', fontSize:'0.8rem', color:'#64748b' }}>
                Audio briefings for all {NASA_MISSIONS.length} NASA mission destinations.
              </div>
              <div className="hub-briefing-grid">
                {NASA_MISSIONS.map((mission) => {
                  const isActive = mission.id === activeMissionId;
                  const isPlaying = speakingMissionId === mission.id;
                  return (
                    <div key={mission.id} className={`hub-briefing-card ${isActive ? 'hub-briefing-active' : ''}`}>
                      <div className="hub-briefing-header">
                        <span className="hub-briefing-patch">{mission.missionPatchEmoji}</span>
                        <div>
                          <div className="hub-briefing-name">{mission.name}</div>
                          <div className="hub-briefing-dest">{mission.destination} · {mission.launchYear}</div>
                        </div>
                      </div>
                      <p className="hub-briefing-summary">{mission.scientificProblem.summary}</p>
                      <button
                        className="hub-briefing-play-btn"
                        onClick={() => handlePlayBriefing(mission.id, mission.scientificProblem.briefingAudio)}
                      >
                        {isPlaying
                          ? <><VolumeX size={12} /> Stop Briefing</>
                          : <><Radio size={12} /> Play Commander Briefing</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── NASA MISSIONS CATALOG (76 MISSIONS) ────────────────────────── */}
          {activeTab === 'CATALOG' && (
            <div>
              <div style={{ marginBottom:'14px' }}>
                <div style={{ fontSize:'1rem', fontWeight:700, color:'#f8fafc', marginBottom:'4px' }}>
                  NASA Mission Historical Catalog & Operational Protocols
                </div>
                <div style={{ fontSize:'0.8rem', color:'#94a3b8', lineHeight:1.5 }}>
                  Curated catalog of 76 seminal missions from Project Mercury (1961) to Artemis III & Europa Clipper (2026–2027+). Includes flight manual protocols, launch dates, and primary objectives.
                </div>
              </div>

              {/* Toolbar */}
              <div className="hub-catalog-toolbar">
                <div className="hub-catalog-search-wrap">
                  <Search size={14} className="hub-catalog-search-icon" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search 76 missions by name, objective, protocol..."
                    className="hub-catalog-search-input"
                  />
                </div>

                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="hub-catalog-select"
                >
                  {catalogPrograms.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog === 'ALL' ? 'All NASA Programs' : prog}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="hub-catalog-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Planned">Planned</option>
                  <option value="Failure">Tragic Failure</option>
                </select>

                <div className="hub-catalog-count">
                  Showing <strong>{filteredCatalogMissions.length}</strong> of {NASA_MISSIONS_CATALOG.length} missions
                </div>
              </div>

              {/* Grid of missions */}
              {filteredCatalogMissions.length === 0 ? (
                <div className="hub-empty">
                  <span className="hub-empty-icon">🔍</span>
                  <div className="hub-empty-msg">No NASA missions matched your filters. Try clearing your search query.</div>
                </div>
              ) : (
                <div className="hub-catalog-grid">
                  {filteredCatalogMissions.map((m) => {
                    const isPlaying = speakingCatalogId === m.id;
                    const statusLower = m.status.toLowerCase();
                    const statusClass = statusLower.includes('active')
                      ? 'hub-catalog-status-active'
                      : statusLower.includes('planned')
                      ? 'hub-catalog-status-planned'
                      : statusLower.includes('failure')
                      ? 'hub-catalog-status-failure'
                      : 'hub-catalog-status-completed';

                    return (
                      <div key={m.id} className="hub-catalog-card">
                        <div className="hub-catalog-card-header">
                          <span className="hub-catalog-id-badge">{m.id}</span>
                          <span className={`hub-catalog-status-badge ${statusClass}`}>{m.status}</span>
                        </div>

                        <div className="hub-catalog-title">{m.name}</div>
                        <div className="hub-catalog-submeta">
                          <span>{m.program}</span> · <span>{m.launchYear}</span> · <span style={{ color: '#93c5fd' }}>{m.type}</span>
                        </div>

                        <div className="hub-catalog-objective">
                          {m.objective}
                        </div>

                        <div className="hub-catalog-protocol">
                          <div className="hub-catalog-protocol-title">Flight Manual Protocol</div>
                          {m.operationalGuide}
                        </div>

                        <button
                          className="hub-catalog-play-btn"
                          onClick={() => handlePlayCatalog(m)}
                        >
                          {isPlaying ? (
                            <>
                              <VolumeX size={12} />
                              <span>Stop Protocol Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={12} />
                              <span>Listen to Commander Dadu</span>
                            </>
                          )}
                        </button>

                        {onLaunchMission && (
                          <button
                            className="hub-catalog-play-game-btn"
                            onClick={() => {
                              onLaunchMission(m.id);
                              handleClose();
                            }}
                            style={{
                              marginTop: '8px',
                              width: '100%',
                              padding: '7px 12px',
                              background: completedMissions?.includes(m.id)
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                              border: completedMissions?.includes(m.id)
                                ? '1px solid rgba(16, 185, 129, 0.4)'
                                : 'none',
                              borderRadius: '6px',
                              color: completedMissions?.includes(m.id) ? '#34d399' : '#020617',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Play size={12} fill={completedMissions?.includes(m.id) ? 'none' : 'currentColor'} />
                            <span>
                              {completedMissions?.includes(m.id)
                                ? 'Replay Mission Simulation ★'
                                : 'Play Mission Simulator 🚀'}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
  );

  return (
    <>
      {isFullPage ? (
        <div className="page-learning-hub" style={{ minHeight: 'calc(100vh - 52px)', background: 'var(--color-space-950, #04070e)', padding: '16px 20px 48px' }}>
          {hubBody}
        </div>
      ) : (
        <div className="hub-modal-backdrop" onClick={handleClose}>
          {hubBody}
        </div>
      )}

      {/* Embedded High-Fidelity Comic Book Reader & Archival Video Player */}
      <ComicBookModal
        isOpen={isComicModalOpen}
        onClose={() => setIsComicModalOpen(false)}
        initialIssueId={activeComicIssueId}
        initialMode={comicModalMode}
      />

      {/* Google Flow NASA Historical Comic AI Generator Modal */}
      <GoogleFlowComicModal
        isOpen={isGoogleFlowModalOpen}
        onClose={() => {
          setIsGoogleFlowModalOpen(false);
          setAllComicIssues(getMergedComicIssues());
        }}
        onOpenGeneratedComicReader={(issueId) => {
          setActiveComicIssueId(issueId);
          setComicModalMode('reader');
          setIsComicModalOpen(true);
        }}
        onOpenGeneratedComicVideo={(issueId) => {
          setActiveComicIssueId(issueId);
          setComicModalMode('video');
          setIsComicModalOpen(true);
        }}
      />
    </>
  );
};
