import React from 'react';
import type { GameState, ChoiceOption, DifficultyMode } from '../types/game';
import type { NasaMission } from '../data/nasaMissions';
import { ResourceHUD } from '../components/ResourceHUD';
import { ViewportToggle } from '../components/ViewportToggle';
import { OutpostMap } from '../components/OutpostMap';
import { Outpost3DView } from '../components/Outpost3DView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CinematicScene } from '../components/CinematicScene';
import { MissionAutopsy } from '../components/MissionAutopsy';
import type { AppRoute } from '../router/useAppRouter';
import { soundFx } from '../utils/audioEffects';
import {
  Rocket,
  Activity,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ChevronRight,
  Compass,
  Sliders,
  RotateCcw,
  Gamepad2,
} from 'lucide-react';

export interface MissionControlPageProps {
  gameState: GameState;
  currentMission: NasaMission;
  lastConsequence: {
    narrative: string;
    insight: string;
    choiceTitle: string;
    choiceOption?: ChoiceOption;
  } | null;
  is3DView: boolean;
  onToggle3DView: (val: boolean) => void;
  isTheaterMode: boolean;
  onToggleTheaterMode: (val: boolean) => void;
  isShieldActive: boolean;
  isShaking: boolean;
  onSelectChoice: (choice: ChoiceOption) => void;
  onSelectDifficulty: (mode: DifficultyMode) => void;
  onRestart: () => void;
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  onOpenRoverEVA: () => void;
  onOpenPlanetaryMap: () => void;
  onOpenOutpostConstruction?: () => void;
  onSwitchDestination?: (dest: 'MOON' | 'MARS') => void;
  onOpenAutopsyHelp?: () => void;
}

export const MissionControlPage: React.FC<MissionControlPageProps> = ({
  gameState,
  currentMission,
  lastConsequence,
  is3DView,
  onToggle3DView,
  isTheaterMode,
  onToggleTheaterMode,
  isShieldActive,
  isShaking,
  onSelectChoice,
  onSelectDifficulty,
  onRestart,
  onNavigate,
  onOpenRoverEVA,
  onOpenPlanetaryMap,
  onOpenOutpostConstruction,
  onSwitchDestination,
  onOpenAutopsyHelp,
}) => {
  const isMars = gameState.destination === 'MARS';
  const outpostName = isMars ? 'AstroCamp Mars Outpost' : 'Artemis Base Camp Expedition';
  const outpostLocation = isMars ? 'Jezero Crater Delta (18.38°N, 77.58°E)' : 'Shackleton Crater Rim (89.9°S, 0.0°E)';
  const outpostTelemetry = isMars
    ? 'Gravity: 0.379g · Atm: CO₂ 610 Pa · 40-Sol Campaign'
    : 'Gravity: 0.166g · Hard Vacuum (<10⁻¹² Pa) · 30-Sol Campaign';

  const renderOutpostViewport = (title = 'Outpost Viewport') => (
    <div className="panel-box">
      <div className="panel-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Rocket size={14} className={isMars ? 'text-orange-400' : 'text-cyan-400'} />
          <span className="panel-box-title">{title}</span>
          <span className="text-xs text-slate-400 font-mono">{outpostLocation}</span>
        </div>

        <ViewportToggle is3DView={is3DView} onSetView={onToggle3DView} />
      </div>

      {is3DView ? (
        <ErrorBoundary fallbackTitle="3D Outpost Viewport" onFallback2D={() => onToggle3DView(false)}>
          <Outpost3DView
            currentSol={gameState.currentSol}
            modules={gameState.modules}
            resources={gameState.resources}
            activeEventId={gameState.activeEvent?.id}
            isShieldActive={isShieldActive}
            mission={currentMission}
            taskChoices={gameState.activeEvent?.options}
            onSelectChoice={onSelectChoice}
            activeEventTitle={gameState.activeEvent?.title}
          />
        </ErrorBoundary>
      ) : (
        <OutpostMap
          currentSol={gameState.currentSol}
          modules={gameState.modules}
          resources={gameState.resources}
        />
      )}
    </div>
  );

  return (
    <div className={`page-mission-control ${isShaking ? 'screen-shake' : ''}`} style={{
      minHeight: 'calc(100dvh - 52px)',
      background: 'var(--color-paper)',
      padding: '16px 20px 48px',
      color: 'var(--color-ink)',
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Resource Telemetry HUD */}
        <ResourceHUD
          sol={gameState.currentSol}
          totalSols={gameState.totalSols}
          resources={gameState.resources}
          difficultyMode={gameState.difficultyMode}
          destination={gameState.destination}
          onSelectDifficulty={onSelectDifficulty}
        />

        {/* Tactical Mission Operations Bar */}
        <div
          className="mission-banner-bar"
          style={{
            background: 'var(--color-paper-2)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            borderRadius: 'var(--radius-card)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div className="mission-banner-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isMars ? '#f97316' : '#38bdf8',
                boxShadow: isMars ? '0 0 10px #f97316' : '0 0 10px #38bdf8',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: isMars ? '#f97316' : '#38bdf8',
              }}
            >
              BASE COMMAND:
            </span>
            <span style={{ color: 'var(--color-ink)', fontWeight: 800, fontSize: '13.5px' }}>
              {outpostName}
            </span>
            <span style={{ color: 'var(--color-rule)' }}>/</span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11.5px',
                color: 'var(--color-muted)',
              }}
            >
              Target: <strong style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-outlier)' }}>{outpostLocation}</strong>
              <span style={{ marginLeft: '8px', opacity: 0.8, fontSize: '11px' }}>({outpostTelemetry})</span>
            </span>
          </div>

          <div className="mission-banner-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Outpost Destination Toggle */}
            {onSwitchDestination && (
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  background: 'var(--color-paper-card)',
                  padding: '2px',
                  borderRadius: 'var(--radius-card)',
                  border: 'var(--rule-hair) solid var(--color-rule)',
                }}
              >
                <button
                  onClick={() => {
                    onSwitchDestination('MOON');
                    soundFx.playClick(900);
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: !isMars ? 700 : 500,
                    fontFamily: 'var(--font-body)',
                    borderRadius: 'var(--radius-card)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: !isMars ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                    color: !isMars ? '#38bdf8' : 'var(--color-muted)',
                  }}
                  title="Command Artemis Lunar Base Camp at Shackleton Crater Rim"
                >
                  🌙 Moon Base
                </button>
                <button
                  onClick={() => {
                    onSwitchDestination('MARS');
                    soundFx.playClick(900);
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: isMars ? 700 : 500,
                    fontFamily: 'var(--font-body)',
                    borderRadius: 'var(--radius-card)',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isMars ? 'rgba(249, 115, 22, 0.22)' : 'transparent',
                    color: isMars ? '#fb923c' : 'var(--color-muted)',
                  }}
                  title="Command AstroCamp Mars Outpost at Jezero Crater Delta"
                >
                  🔴 Mars Base
                </button>
              </div>
            )}

            {/* Viewport Mode Segmented Pill */}
            <div
              style={{
                display: 'flex',
                gap: '2px',
                background: 'var(--color-paper-card)',
                padding: '2px',
                borderRadius: 'var(--radius-card)',
                border: 'var(--rule-hair) solid var(--color-rule)',
              }}
            >
              <button
                onClick={() => {
                  onToggleTheaterMode(true);
                  soundFx.playClick(900);
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: isTheaterMode ? 700 : 500,
                  fontFamily: 'var(--font-body)',
                  letterSpacing: 'normal',
                  borderRadius: 'var(--radius-card)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isTheaterMode ? 'var(--color-accent)' : 'transparent',
                  color: isTheaterMode ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                  transition: 'opacity 0.15s ease, background-color 0.15s ease',
                }}
              >
                Theater View
              </button>
              <button
                onClick={() => {
                  onToggleTheaterMode(false);
                  soundFx.playClick(800);
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: !isTheaterMode ? 700 : 500,
                  fontFamily: 'var(--font-body)',
                  letterSpacing: 'normal',
                  borderRadius: 'var(--radius-card)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: !isTheaterMode ? 'var(--color-accent)' : 'transparent',
                  color: !isTheaterMode ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                  transition: 'opacity 0.15s ease, background-color 0.15s ease',
                }}
              >
                Tactical Bridge
              </button>
            </div>

            {onOpenOutpostConstruction && (
              <button
                onClick={() => {
                  onOpenOutpostConstruction();
                  soundFx.playClick(800);
                }}
                style={{
                  padding: '5px 12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: '6px',
                  color: '#a7f3d0',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Construct and upgrade habitat life support modules"
              >
                <Sliders size={13} className="text-emerald-400" />
                <span>EXPAND BASE</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenRoverEVA();
                soundFx.playClick(800);
              }}
              style={{
                padding: '5px 12px',
                background: 'rgba(234, 88, 12, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.45)',
                borderRadius: '6px',
                color: '#fed7aa',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Deploy Surface Rover Expedition"
            >
              <Compass size={13} className="text-orange-400" />
              <span>ROVER EVA</span>
            </button>

            <button
              onClick={() => {
                onNavigate('learning', { tab: 'COMIC' });
                soundFx.playClick(750);
              }}
              style={{
                padding: '5px 12px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '6px',
                color: '#fde047',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Read Mission Graphic Novel"
            >
              <BookOpen size={13} className="text-yellow-400" />
              <span>GRAPHIC NOVEL</span>
            </button>

            <button
              onClick={() => {
                onNavigate('campaign');
                soundFx.playClick(850);
              }}
              style={{
                padding: '5px 12px',
                background: 'rgba(124, 58, 237, 0.18)',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                borderRadius: '6px',
                color: '#ddd6fe',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 800,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Fly 76 authentic NASA historical flight missions"
            >
              <Rocket size={13} className="text-purple-400" />
              <span>76 FLIGHT MISSIONS</span>
            </button>
          </div>
        </div>

        {/* ── CINEMA THEATER MODE ── */}
        {isTheaterMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Cinematic Stage */}
            {gameState.activeEvent && (
              <div className="event-dilemma-card" style={{ padding: '18px 22px' }}>
                <div className="event-headline-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div className="event-badge">SOL {gameState.activeEvent.sol} MISSION BRIEFING</div>
                    <h2 className="event-title">{gameState.activeEvent.title}</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onNavigate('learning', { tab: 'COMIC' })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        background: 'rgba(245, 158, 11, 0.18)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        borderRadius: '6px',
                        color: '#fbbf24',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Read NASA STEM Graphic Novel"
                    >
                      <BookOpen size={13} className="text-amber-400" />
                      <span>STEM Graphic Novel</span>
                    </button>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Narrative Stage
                    </span>
                  </div>
                </div>

                {/* Cinematic Scene */}
                <CinematicScene
                  panels={gameState.activeEvent.comicPanels}
                  urgency={gameState.activeEvent.urgency}
                  destination={gameState.destination}
                  isTheaterMode={true}
                  onToggleTheaterMode={() => onToggleTheaterMode(false)}
                />

                {/* Tactical Strategic Command Actions Grid */}
                <div className="choices-block" style={{ marginTop: '16px' }}>
                  <div className="choices-instruction" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} className="text-cyan-400" />
                    <span>Select tactical command protocol:</span>
                  </div>
                  <div
                    className="choices-list"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                      gap: '12px',
                    }}
                  >
                    {gameState.activeEvent.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => onSelectChoice(opt)}
                        className="choice-card-btn"
                        style={{
                          padding: '16px 18px',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          background: 'rgba(15, 23, 42, 0.85)',
                        }}
                      >
                        <div className="choice-header-row">
                          <span className="choice-title" style={{ fontSize: '14px', color: '#38bdf8' }}>{opt.title}</span>
                          <ChevronRight size={18} className="text-cyan-400 choice-arrow" />
                        </div>
                        <p className="choice-desc" style={{ fontSize: '12.5px', color: '#cbd5e1' }}>{opt.description}</p>
                        <div className="choice-tradeoff" style={{ marginTop: '6px' }}>
                          <span className="tradeoff-label" style={{ color: '#fbbf24', fontWeight: 700 }}>Telemetry Trade-off: </span>
                          <span style={{ color: '#94a3b8' }}>{opt.tradeOffText}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Tactical Sensor Deck & Scientific Citation Array */}
            <div className="theater-bottom-grid">
              {renderOutpostViewport('Outpost Sensor Viewport')}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {gameState.activeEvent && (
                  <div className="nasa-context-card" style={{ flex: 1 }}>
                    <div className="context-header">
                      <span className="context-tag">NASA Data Citation</span>
                      <span className="context-doc font-mono">{gameState.activeEvent.nasaCitation.docNumber}</span>
                    </div>
                    <div className="context-title">{gameState.activeEvent.nasaCitation.title}</div>
                    <p className="context-desc">{gameState.activeEvent.nasaCitation.description}</p>
                    {gameState.activeEvent.dataAttribution && (
                      <div className="context-desc">
                        <strong>{gameState.activeEvent.dataAttribution.label}</strong>
                        {gameState.activeEvent.dataAttribution.recordId && ` · Record ${gameState.activeEvent.dataAttribution.recordId}`}
                        {gameState.activeEvent.dataAttribution.fetchedAt && ` · Snapshot fetched ${gameState.activeEvent.dataAttribution.fetchedAt}`}
                        {gameState.activeEvent.dataAttribution.sourceUrl && (
                          <> · <a href={gameState.activeEvent.dataAttribution.sourceUrl} target="_blank" rel="noreferrer">Source record</a></>
                        )}
                      </div>
                    )}
                    {gameState.activeEvent.weatherNotice && (
                      <div className="weather-alert-strip">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                        <span>{gameState.activeEvent.weatherNotice}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Previous Consequence Feed */}
                {lastConsequence && (
                  <div className="consequence-feed-card">
                    <div className="feed-header">
                      <Sparkles size={16} className="text-cyan-400" />
                      <span>Previous Decision Result: {lastConsequence.choiceTitle}</span>
                    </div>
                    <p className="feed-narrative">{lastConsequence.narrative}</p>
                    <div className="feed-insight">
                      <strong>Physics Insight: </strong>
                      {lastConsequence.insight}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── TACTICAL BRIDGE (Split 2-Column View) ── */
          <div className="game-columns-grid">
            <div className="left-panel-col">
              {renderOutpostViewport('Outpost Viewport')}

              {gameState.activeEvent && (
                <div className="nasa-context-card">
                  <div className="context-header">
                    <span className="context-tag">NASA Data Citation</span>
                    <span className="context-doc font-mono">{gameState.activeEvent.nasaCitation.docNumber}</span>
                  </div>
                  <div className="context-title">{gameState.activeEvent.nasaCitation.title}</div>
                  <p className="context-desc">{gameState.activeEvent.nasaCitation.description}</p>
                  {gameState.activeEvent.dataAttribution && (
                    <div className="context-desc">
                      <strong>{gameState.activeEvent.dataAttribution.label}</strong>
                      {gameState.activeEvent.dataAttribution.recordId && ` · Record ${gameState.activeEvent.dataAttribution.recordId}`}
                      {gameState.activeEvent.dataAttribution.fetchedAt && ` · Snapshot fetched ${gameState.activeEvent.dataAttribution.fetchedAt}`}
                      {gameState.activeEvent.dataAttribution.sourceUrl && (
                        <> · <a href={gameState.activeEvent.dataAttribution.sourceUrl} target="_blank" rel="noreferrer">Source record</a></>
                      )}
                    </div>
                  )}
                  {gameState.activeEvent.weatherNotice && (
                    <div className="weather-alert-strip">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                      <span>{gameState.activeEvent.weatherNotice}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="right-panel-col">
              {gameState.activeEvent ? (
                <div className="event-dilemma-card">
                  <div className="event-headline-row">
                    <div className="event-badge">SOL {gameState.activeEvent.sol} MISSION BRIEFING</div>
                    <h2 className="event-title">{gameState.activeEvent.title}</h2>
                  </div>

                  <CinematicScene
                    panels={gameState.activeEvent.comicPanels}
                    urgency={gameState.activeEvent.urgency}
                    destination={gameState.destination}
                    isTheaterMode={false}
                    onToggleTheaterMode={() => onToggleTheaterMode(true)}
                  />

                  <div className="choices-block">
                    <div className="choices-instruction">
                      <span>Select Tactical Command Action:</span>
                    </div>
                    <div className="choices-list">
                      {gameState.activeEvent.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => onSelectChoice(opt)}
                          className="choice-card-btn"
                        >
                          <div className="choice-header-row">
                            <span className="choice-title">{opt.title}</span>
                            <ChevronRight size={18} className="text-emerald-400 choice-arrow" />
                          </div>
                          <p className="choice-desc">{opt.description}</p>
                          <div className="choice-tradeoff">
                            <span className="tradeoff-label">Trade-off: </span>
                            <span>{opt.tradeOffText}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {lastConsequence && (
                <div className="consequence-feed-card">
                  <div className="feed-header">
                    <Sparkles size={16} className="text-cyan-400" />
                    <span>Previous Decision Result: {lastConsequence.choiceTitle}</span>
                  </div>
                  <p className="feed-narrative">{lastConsequence.narrative}</p>
                  <div className="feed-insight">
                    <strong>Physics Insight: </strong>
                    {lastConsequence.insight}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Over / Mission Autopsy Overlay */}
      {gameState.isGameOver && (
        <MissionAutopsy
          gameState={gameState}
          onRestartMission={onRestart}
          currentMission={currentMission}
        />
      )}
    </div>
  );
};

export default MissionControlPage;
