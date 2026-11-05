// ============================================================
// LiveMissionActivityModal — Real-Time Cadet Mission Radar & Activity Feed
// Displays real-time mission completions with exact timestamps, time taken, XP & Coins
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Clock,
  Timer,
  CheckCircle2,
  Sparkles,
  Coins,
  Search,
  Filter,
  User,
  Zap,
  Globe2,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import {
  studentActivityService,
  type StudentActivityLog,
  type ActionCategory,
} from '../utils/studentActivityService';
import { soundFx } from '../utils/audioEffects';

interface LiveMissionActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
}

export const LiveMissionActivityModal: React.FC<LiveMissionActivityModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
}) => {
  const [logs, setLogs] = useState<StudentActivityLog[]>(() => studentActivityService.getLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'ALL'>('ALL');
  const [liveClock, setLiveClock] = useState<string>('');

  // Subscribe to real-time logs and live seconds clock
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = studentActivityService.subscribe((updated) => {
      setLogs(updated);
    });

    const updateClock = () => {
      const now = new Date();
      setLiveClock(now.toTimeString().split(' ')[0]);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedStudent !== 'ALL' && log.studentUsername.toLowerCase() !== selectedStudent.toLowerCase()) {
      return false;
    }
    if (selectedCategory !== 'ALL' && log.actionType !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = log.missionTitle.toLowerCase().includes(q);
      const matchCadet = log.studentFullName.toLowerCase().includes(q) || log.studentUsername.toLowerCase().includes(q);
      const matchChar = log.characterName.toLowerCase().includes(q);
      if (!matchTitle && !matchCadet && !matchChar) return false;
    }
    return true;
  });

  // Extract unique students
  const uniqueStudents = Array.from(new Set(logs.map((l) => l.studentUsername)));

  // Destination color tag
  const getDestBadge = (dest: string) => {
    switch (dest) {
      case 'MOON':
        return { label: '🌕 MOON LUNAR BASE', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'MARS':
        return { label: '🔴 MARS EDL & SURFACE', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'EARTH':
        return { label: '🌍 EARTH ACADEMY EXAM', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' };
      default:
        return { label: '🛰️ CAMPUS DEPOT', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
    }
  };

  return (
    <div className="flight-modal-backdrop" onClick={onClose} style={{ zIndex: 12000 }}>
      <div
        className="flight-modal-window"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          background: 'linear-gradient(145deg, #070d19 0%, #0c1527 50%, #07101f 100%)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              📡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', margin: 0 }}>
                  LIVE CADET MISSION RADAR & REAL-TIME ACTIVITY
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 1.5s infinite' }} />
                  LIVE RADAR ACTIVE
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Real-time synchronized telemetry feed tracking which student completed which mission with exact timestamps and durations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live Clock */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <Clock size={16} style={{ color: '#38bdf8' }} />
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', lineHeight: 1 }}>MISSION UTC CLOCK</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>{liveClock || '20:45:00'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '6px',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter & Control Bar */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(11, 19, 35, 0.85)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              minWidth: '240px',
            }}
          >
            <Search size={15} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by mission or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '12px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Student Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Cadet:</span>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Students ({logs.length} completions)</option>
              {uniqueStudents.map((usr) => (
                <option key={usr} value={usr}>
                  Cadet: @{usr}
                </option>
              ))}
            </select>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'MISSION_COMPLETED', label: '🚀 Missions' },
              { id: 'SOL_SURVIVED', label: '🌕 Sol Survival' },
              { id: 'EXAM_PASSED', label: '📝 Exams' },
              { id: 'CHARACTER_UNLOCKED', label: '🧑‍🚀 Astronauts' },
            ].map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id as any);
                    soundFx.playClick(800);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: active ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: active ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: active ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Logs List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {filteredLogs.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#64748b',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '12px',
              }}
            >
              No real-time mission activities matching the selected filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const destBadge = getDestBadge(log.destination);
              const isCurrentUser = currentUsername && log.studentUsername.toLowerCase() === currentUsername.toLowerCase();

              return (
                <div
                  key={log.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: isCurrentUser
                      ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.85))'
                      : 'rgba(15, 23, 42, 0.7)',
                    border: isCurrentUser
                      ? '1px solid rgba(56, 189, 248, 0.45)'
                      : '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {/* Student Avatar + Hero Character */}
                  <div
                    style={{
                      position: 'relative',
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0,
                    }}
                  >
                    <span>{log.studentAvatar}</span>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        background: '#0284c7',
                        borderRadius: '4px',
                        fontSize: '9px',
                        padding: '1px 3px',
                        color: '#fff',
                        fontWeight: 800,
                      }}
                    >
                      LIVE
                    </span>
                  </div>

                  {/* Cadet Details & Mission Title */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#f8fafc' }}>
                        {log.studentFullName}
                      </span>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                        @{log.studentUsername}
                      </span>
                      <span style={{ fontSize: '10px', color: '#cbd5e1', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                        Astronaut: {log.characterName}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: destBadge.bg,
                          color: destBadge.color,
                          border: `1px solid ${destBadge.border}`,
                          fontWeight: 700,
                        }}
                      >
                        {destBadge.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginTop: '4px' }}>
                      {log.missionTitle}
                    </div>

                    {log.notes && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontStyle: 'italic' }}>
                        "{log.notes}"
                      </div>
                    )}
                  </div>

                  {/* Exact Timestamp & Duration */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                      flexShrink: 0,
                    }}
                  >
                    {/* Timestamp Pill */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      <Clock size={12} />
                      <strong>{log.formattedTime}</strong>
                      <span style={{ color: '#64748b' }}>({log.timeAgo})</span>
                    </div>

                    {/* Duration Pill */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        color: '#cbd5e1',
                      }}
                    >
                      <Timer size={12} style={{ color: '#a855f7' }} />
                      <span>Duration: <strong style={{ color: '#f8fafc' }}>{log.durationFormatted || 'Instant'}</strong></span>
                    </div>

                    {/* Reward & XP Pill */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#4ade80' }}>
                        +{log.scoreXp} XP
                      </span>
                      {log.coinsEarned > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#facc15', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Coins size={11} /> +{log.coinsEarned}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
