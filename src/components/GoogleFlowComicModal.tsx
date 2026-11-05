import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  Sparkles,
  Zap,
  BookOpen,
  Film,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Share2,
  ShieldCheck,
  ChevronRight,
  Database,
  Cpu,
  Layers,
  FileCode,
  Radio,
  Search,
  ExternalLink
} from 'lucide-react';
import {
  NASA_HISTORICAL_PRESETS,
  runGoogleFlowComicGenerator,
  type GoogleFlowStep,
  type HistoricalMissionPreset
} from '../utils/googleFlowComicService';
import type { ComicIssue } from '../data/comicBooks';
import { soundFx } from '../utils/audioEffects';
import { ComicVisualArtwork } from './ComicVisualArtwork';

interface GoogleFlowComicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGeneratedComicReader: (issueId: string) => void;
  onOpenGeneratedComicVideo: (issueId: string) => void;
}

export const GoogleFlowComicModal: React.FC<GoogleFlowComicModalProps> = ({
  isOpen,
  onClose,
  onOpenGeneratedComicReader,
  onOpenGeneratedComicVideo
}) => {
  const [selectedPreset, setSelectedPreset] = useState<HistoricalMissionPreset>(NASA_HISTORICAL_PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [useCustomPrompt, setUseCustomPrompt] = useState<boolean>(false);
  const [gradeTier, setGradeTier] = useState<'Cadet (Ages 3-7)' | 'Explorer (Ages 8-13)' | 'Commander (Ages 14-19)'>('Explorer (Ages 8-13)');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [steps, setSteps] = useState<GoogleFlowStep[]>([]);
  const [generatedIssue, setGeneratedIssue] = useState<ComicIssue | null>(null);

  if (!isOpen) return null;

  const handleStartGeneration = async () => {
    soundFx.playClick(850);
    setIsGenerating(true);
    setGeneratedIssue(null);

    try {
      const issue = await runGoogleFlowComicGenerator({
        presetId: useCustomPrompt ? undefined : selectedPreset.id,
        userPrompt: useCustomPrompt ? customPrompt : selectedPreset.suggestedPrompt,
        gradeTier,
        onStepProgress: (step, allSteps) => {
          setSteps(allSteps);
          const activeIdx = allSteps.findIndex((s) => s.status === 'RUNNING');
          if (activeIdx !== -1) setCurrentStepIdx(activeIdx);
        }
      });

      setGeneratedIssue(issue);
      soundFx.playSuccess();
    } catch (err) {
      console.error('Google Flow generation error:', err);
      soundFx.playAlarm();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportJson = () => {
    if (!generatedIssue) return;
    const blob = new Blob([JSON.stringify(generatedIssue, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedIssue.id}-nasa-comic-blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundFx.playClick(900);
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          maxHeight: '92vh',
          background: 'var(--color-paper-card, #090d16)',
          border: '1px solid var(--color-accent, #38bdf8)',
          boxShadow: '0 0 50px rgba(56, 189, 248, 0.25), 0 20px 40px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 0
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.95))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 900,
                fontSize: '18px',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.5)'
              }}
            >
              <Zap size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    color: 'var(--color-ink, #f8fafc)',
                    fontFamily: 'var(--font-mono, monospace)',
                    textTransform: 'uppercase'
                  }}
                >
                  Google Flow: NASA Historical Comic AI Generator
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#38bdf8',
                    padding: '2px 6px',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  NASA SP GROUNDED
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                Multi-agent prompt flow synthesizing fact-checked graphic novels from authentic NASA mission archives, flight director logs &amp; transcripts.
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick(600);
              onClose();
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Google Flow Pipeline Flowchart Nodes */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-accent, #38bdf8)', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.08em' }}>
                GOOGLE GENAI WORKFLOW PIPELINE ARCHITECTURE
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                STATUS: {isGenerating ? 'RUNNING PROMPT FLOW NODES...' : generatedIssue ? 'FLOW COMPLETED (5/5 NODES)' : 'STANDBY READY'}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                position: 'relative'
              }}
            >
              {[
                { label: '1. NASA Grounding', desc: 'SP-4029 & Flight Logs', icon: Database },
                { label: '2. Fact Guardrails', desc: 'Telemetry & Citations', icon: ShieldCheck },
                { label: '3. Panel Scripting', desc: 'Quindar Cues & Dialogue', icon: FileCode },
                { label: '4. SVG Vector Art', desc: 'Spacecraft Schematics', icon: Cpu },
                { label: '5. Archival Video', desc: 'NASA TV & STEM Quiz', icon: Film }
              ].map((node, idx) => {
                const isNodeActive = isGenerating && currentStepIdx === idx;
                const isNodeDone = (!isGenerating && generatedIssue) || (isGenerating && currentStepIdx > idx);

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 8px',
                      background: isNodeActive
                        ? 'rgba(56, 189, 248, 0.2)'
                        : isNodeDone
                        ? 'rgba(67, 255, 160, 0.12)'
                        : 'rgba(2, 6, 23, 0.6)',
                      border: isNodeActive
                        ? '1.5px solid #38bdf8'
                        : isNodeDone
                        ? '1px solid #43ffa0'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                      boxShadow: isNodeActive ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none'
                    }}
                  >
                    <node.icon
                      size={16}
                      style={{
                        color: isNodeActive ? '#38bdf8' : isNodeDone ? '#43ffa0' : '#64748b'
                      }}
                    />
                    <div
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        color: isNodeActive ? '#38bdf8' : isNodeDone ? '#f8fafc' : '#94a3b8'
                      }}
                    >
                      {node.label}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>
                      {node.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* If Generating: Animated Flow Telemetry Console */}
          {isGenerating && (
            <div
              style={{
                padding: '16px',
                background: '#020617',
                border: '1px dashed #38bdf8',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'monospace' }}>
                <Sparkles size={16} className="animate-spin" />
                <span>GOOGLE FLOW EXECUTION ACTIVE: NODE {currentStepIdx + 1} OF 5</span>
              </div>
              {steps.map((st, i) => (
                <div
                  key={st.id}
                  style={{
                    fontSize: '0.74rem',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: st.status === 'COMPLETED' ? '#43ffa0' : st.status === 'RUNNING' ? '#38bdf8' : '#64748b'
                  }}
                >
                  <span>{st.status === 'COMPLETED' ? '✓' : st.status === 'RUNNING' ? '▶' : '○'}</span>
                  <span style={{ fontWeight: 700 }}>{st.name}:</span>
                  <span>{st.detail}</span>
                  {st.timestamp && <span style={{ color: '#475569', marginLeft: 'auto' }}>[{st.timestamp}]</span>}
                </div>
              ))}
            </div>
          )}

          {/* Generated Result Showcase */}
          {generatedIssue && !isGenerating && (
            <div
              style={{
                padding: '18px',
                background: 'rgba(67, 255, 160, 0.05)',
                border: '1.5px solid #43ffa0',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                animation: 'fadeIn 0.25s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} style={{ color: '#43ffa0' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#43ffa0', fontFamily: 'monospace' }}>
                    COMIC GENERATION COMPLETE · VERIFIED AGAINST NASA PRIMARY SOURCES
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  ISSUE #{generatedIssue.issueNumber} · 2 PAGES · 6 FACT-CHECKED PANELS
                </span>
              </div>

              {/* Cover Preview + Meta Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: '16px' }}>
                {/* Visual Artwork Thumbnail */}
                <div style={{ height: '170px', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.12)', overflow: 'hidden', position: 'relative' }}>
                  <ComicVisualArtwork
                    issueNumber={generatedIssue.issueNumber}
                    panelNumber={1}
                    sceneType={generatedIssue.pages[0]?.panels[0]?.sceneType}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.85)',
                      border: '1px solid #43ffa0',
                      color: '#43ffa0',
                      padding: '2px 8px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      fontFamily: 'monospace'
                    }}
                  >
                    {generatedIssue.coverBadge}
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {generatedIssue.nasaMissionTieIn.toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    {generatedIssue.title}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-accent, #38bdf8)', fontWeight: 700 }}>
                    {generatedIssue.subtitle}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45, margin: 0 }}>
                    {generatedIssue.synopsis}
                  </p>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                    <strong>NASA Citation:</strong> {generatedIssue.nasaDocumentCitation}
                  </div>
                </div>
              </div>

              {/* Action Buttons to Read or Watch Video */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  onClick={() => {
                    soundFx.playClick(900);
                    onClose();
                    onOpenGeneratedComicReader(generatedIssue.id);
                  }}
                  style={{
                    padding: '10px 18px',
                    background: 'var(--color-accent, #38bdf8)',
                    color: '#000000',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid #38bdf8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    letterSpacing: '0.04em'
                  }}
                >
                  <BookOpen size={15} /> READ IN COMIC BOOK READER
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick(850);
                    onClose();
                    onOpenGeneratedComicVideo(generatedIssue.id);
                  }}
                  style={{
                    padding: '10px 18px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Film size={15} /> WATCH MOTION COMIC VIDEO &amp; NASA ARCHIVE
                </button>

                <button
                  onClick={handleExportJson}
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> EXPORT BLUEPRINT JSON
                </button>

                <button
                  onClick={() => setGeneratedIssue(null)}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: 'auto'
                  }}
                >
                  <RotateCcw size={14} /> GENERATE ANOTHER
                </button>
              </div>
            </div>
          )}

          {/* Configuration Form (Preset Selection & Custom Prompt) */}
          {!generatedIssue && !isGenerating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Toggle Mode: Presets vs Custom Prompt */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
                <button
                  onClick={() => {
                    setUseCustomPrompt(false);
                    soundFx.playClick(750);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: !useCustomPrompt ? 'var(--color-accent, #38bdf8)' : 'rgba(15, 23, 42, 0.6)',
                    color: !useCustomPrompt ? '#000000' : '#cbd5e1',
                    border: !useCustomPrompt ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ShieldCheck size={14} /> Authentic NASA Historical Presets ({NASA_HISTORICAL_PRESETS.length})
                </button>

                <button
                  onClick={() => {
                    setUseCustomPrompt(true);
                    soundFx.playClick(750);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: useCustomPrompt ? 'var(--color-accent, #38bdf8)' : 'rgba(15, 23, 42, 0.6)',
                    color: useCustomPrompt ? '#000000' : '#cbd5e1',
                    border: useCustomPrompt ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} /> Custom Mission Prompt (Free Input)
                </button>
              </div>

              {/* Mode A: Preset Selection Cards */}
              {!useCustomPrompt && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {NASA_HISTORICAL_PRESETS.map((preset) => {
                    const isSelected = selectedPreset.id === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setSelectedPreset(preset);
                          soundFx.playClick(800);
                        }}
                        style={{
                          padding: '14px',
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.65)',
                          border: isSelected ? '1.5px solid var(--color-accent, #38bdf8)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.65rem', color: preset.coverThemeColor, fontWeight: 800, fontFamily: 'monospace' }}>
                            {preset.year} · {preset.missionName}
                          </span>
                          {isSelected && <span style={{ fontSize: '0.65rem', color: '#43ffa0', fontWeight: 800 }}>SELECTED ✓</span>}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>
                          {preset.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4, flex: 1 }}>
                          {preset.summary}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {preset.tags.map((t, idx) => (
                            <span key={idx} style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mode B: Custom Prompt Input */}
              {useCustomPrompt && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', fontFamily: 'monospace' }}>
                    ENTER HISTORICAL NASA MISSION, ASTRONAUT EVENT, OR FLIGHT CONTROLLER LOG:
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Script an authentic comic about the Apollo 12 Saturn V lightning strike at T+36 seconds, the power failure, and John Aaron call to switch SCE to AUX."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#020617',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#f8fafc',
                      fontSize: '0.84rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Suggestions:</span>
                    {[
                      'Skylab 2 solar parasol thermal shield deployment',
                      'Alan Shepard suborbital Freedom 7 Mercury flight',
                      'Curiosity 7 Minutes of Terror sky crane landing',
                      'Gemini 4 Ed White first American spacewalk'
                    ].map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCustomPrompt(sug);
                          soundFx.playClick(700);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#38bdf8',
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade Level Selector & Launch Button */}
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>
                    STEM GRADE TIER:
                  </span>
                  {(['Cadet (Ages 3-7)', 'Explorer (Ages 8-13)', 'Commander (Ages 14-19)'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => {
                        setGradeTier(tier);
                        soundFx.playClick(700);
                      }}
                      style={{
                        padding: '4px 10px',
                        background: gradeTier === tier ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        border: gradeTier === tier ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: gradeTier === tier ? '#38bdf8' : '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleStartGeneration}
                  disabled={useCustomPrompt && !customPrompt.trim()}
                  style={{
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    color: '#000000',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    border: 'none',
                    cursor: useCustomPrompt && !customPrompt.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                    letterSpacing: '0.05em'
                  }}
                >
                  <Zap size={16} /> GENERATE COMIC VIA GOOGLE FLOW
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
