import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Send,
  Printer,
  Sparkles,
  Search,
  Filter,
  PlusCircle,
  Clock,
  ShieldAlert,
  Droplet,
  Zap,
} from 'lucide-react';
import type { User } from '../types/auth';
import {
  studentScoreService,
  type StudentScoreRecord,
  type ClassroomDirective,
} from '../data/studentScores';
import {
  studentActivityService,
  type StudentActivityLog,
} from '../utils/studentActivityService';
import { soundFx } from '../utils/audioEffects';

interface TeacherGradebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  isFullPage?: boolean;
}

export const TeacherGradebookModal: React.FC<TeacherGradebookModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isFullPage = false,
}) => {
  if (!isOpen && !isFullPage) return null;
  const [activeTab, setActiveTab] = useState<'GRADEBOOK' | 'ANALYTICS' | 'DIRECTIVES' | 'REPORT_CARD' | 'REALTIME_LOGS'>('GRADEBOOK');
  const [students, setStudents] = useState<StudentScoreRecord[]>(() => studentScoreService.getStudents());
  const [realtimeLogs, setRealtimeLogs] = useState<StudentActivityLog[]>(() => studentActivityService.getLogs());
  const [directives, setDirectives] = useState<ClassroomDirective[]>(() => studentScoreService.getDirectives());
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentScoreRecord>(students[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<'ALL' | 'A+' | 'A' | 'B+' | 'B' | 'IN_TRAINING'>('ALL');
  
  // New directive form
  const [newDirTitle, setNewDirTitle] = useState('');
  const [newDirDesc, setNewDirDesc] = useState('');
  const [newDirSol, setNewDirSol] = useState(10);
  const [newDirXp, setNewDirXp] = useState(300);

  // Edit Note State
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  if (!isOpen) return null;

  const handleBonusXp = (studentId: string, amount: number) => {
    soundFx.playLootPickup();
    const updated = studentScoreService.awardBonusXp(studentId, amount);
    setStudents(updated);
  };

  const handleSaveNote = (studentId: string) => {
    soundFx.playClick(800);
    const updated = studentScoreService.updateStudentNote(studentId, tempNoteText);
    setStudents(updated);
    setEditingNoteStudentId(null);
  };

  const handleAddDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirTitle.trim()) return;
    soundFx.playRadioChirp();
    const updated = studentScoreService.addDirective(newDirTitle, newDirDesc, newDirSol, newDirXp);
    setDirectives(updated);
    setNewDirTitle('');
    setNewDirDesc('');
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterGrade === 'ALL' || s.grade === filterGrade;
    return matchesSearch && matchesFilter;
  });

  const avgXp = Math.round(students.reduce((acc, s) => acc + s.totalXp, 0) / (students.length || 1));
  const examPassedCount = students.filter((s) => s.earthExamPassed).length;
  const passRate = Math.round((examPassedCount / (students.length || 1)) * 100);

  const modalContent = (
    <div
      className={isFullPage ? "teacher-fullpage-panel" : "modal-container"}
      onClick={(e) => e.stopPropagation()}
      style={isFullPage ? {
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'var(--color-paper-2)',
        border: 'var(--rule-hair)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      } : {
        maxWidth: '1180px',
        width: '96vw',
        maxHeight: '94vh',
        backgroundColor: 'var(--color-paper-2)',
        border: 'var(--rule-hair)',
        borderRadius: 0,
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--color-paper-2)',
            borderBottom: 'var(--rule-hair)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 0,
                background: 'var(--color-paper-3)',
                border: 'var(--rule-hair)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              👩‍🏫
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                  NASA STEM Educator Flight Control &amp; Student Gradebook
                </span>
                <span style={{ fontSize: '9px', background: 'var(--color-paper-3)', color: 'var(--color-accent)', border: 'var(--rule-hair)', padding: '1px 6px', borderRadius: 0, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  TEACHER CLEARANCE
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Instructor: <strong style={{ color: 'var(--color-ink)' }}>{currentUser?.fullName || 'Prof. Sarah Jenkins'}</strong> ({currentUser?.email || 'sarah.stem@school.edu'}) / {currentUser?.schoolOrOrg || 'NASA STEM Academy / Central High'}
              </div>
            </div>
          </div>

        {!isFullPage && (
          <button onClick={onClose} className="modal-close-btn" style={{ borderRadius: 0, border: 'var(--rule-hair)' }} aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0a0f1d',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 16px',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => { setActiveTab('GRADEBOOK'); soundFx.playClick(700); }}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'GRADEBOOK' ? '1px solid #a855f7' : '1px solid transparent',
              backgroundColor: activeTab === 'GRADEBOOK' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: activeTab === 'GRADEBOOK' ? '#e9d5ff' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span>📊 Student Score Gradebook ({students.length} Cadets)</span>
          </button>

          <button
            onClick={() => { setActiveTab('ANALYTICS'); soundFx.playClick(750); }}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'ANALYTICS' ? '1px solid #38bdf8' : '1px solid transparent',
              backgroundColor: activeTab === 'ANALYTICS' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'ANALYTICS' ? '#7dd3fc' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span>📈 Classroom Analytics &amp; Safety</span>
          </button>

          <button
            onClick={() => { setActiveTab('DIRECTIVES'); soundFx.playClick(800); }}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'DIRECTIVES' ? '1px solid #f59e0b' : '1px solid transparent',
              backgroundColor: activeTab === 'DIRECTIVES' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: activeTab === 'DIRECTIVES' ? '#fde047' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span>📝 Mission Directives &amp; Homework ({directives.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('REPORT_CARD'); soundFx.playClick(850); }}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'REPORT_CARD' ? '1px solid #10b981' : '1px solid transparent',
              backgroundColor: activeTab === 'REPORT_CARD' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'REPORT_CARD' ? '#6ee7b7' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span>🖨️ Printable Student Transcript</span>
          </button>

          <button
            onClick={() => { setActiveTab('REALTIME_LOGS'); soundFx.playClick(900); }}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: activeTab === 'REALTIME_LOGS' ? '1px solid #4ade80' : '1px solid transparent',
              backgroundColor: activeTab === 'REALTIME_LOGS' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
              color: activeTab === 'REALTIME_LOGS' ? '#86efac' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span>📡 Real-Time Mission Timestamps ({realtimeLogs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* ── TAB 1: GRADEBOOK TABLE ── */}
          {activeTab === 'GRADEBOOK' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filter and Search Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search cadet name or callsign..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(['ALL', 'A+', 'A', 'B+', 'B', 'IN_TRAINING'] as const).map((grade) => (
                    <button
                      key={grade}
                      onClick={() => setFilterGrade(grade)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: filterGrade === grade ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: filterGrade === grade ? 'rgba(168, 85, 247, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                        color: filterGrade === grade ? '#e9d5ff' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {grade === 'ALL' ? 'ALL GRADES' : grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Table */}
              <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', color: '#94a3b8', background: 'rgba(8, 14, 26, 0.8)' }}>
                      <th style={{ padding: '12px 16px' }}>Cadet Callsign &amp; Name</th>
                      <th style={{ padding: '12px 10px' }}>Rank &amp; Level</th>
                      <th style={{ padding: '12px 10px' }}>Total XP &amp; Grade</th>
                      <th style={{ padding: '12px 10px' }}>Earth Exam</th>
                      <th style={{ padding: '12px 10px' }}>Sols Survived</th>
                      <th style={{ padding: '12px 10px' }}>Polar Ice</th>
                      <th style={{ padding: '12px 10px' }}>Safety Index</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Teacher Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Cadet Name */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>{s.avatar}</span>
                            <div>
                              <div style={{ fontWeight: 800, color: '#ffffff' }}>{s.name}</div>
                              <div style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>@{s.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Rank */}
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, color: '#7dd3fc', fontSize: '11px' }}>
                            LV.{s.rankLevel} {s.rankTitle}
                          </span>
                        </td>

                        {/* Total XP & Grade */}
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 900, color: '#f1f5f9' }}>{s.totalXp} XP</span>
                            <span
                              style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 900,
                                background: s.grade === 'A+' ? '#10b981' : s.grade === 'A' ? '#06b6d4' : s.grade.startsWith('B') ? '#f59e0b' : '#64748b',
                                color: '#000',
                              }}
                            >
                              {s.grade}
                            </span>
                          </div>
                        </td>

                        {/* Earth Exam */}
                        <td style={{ padding: '12px 10px' }}>
                          {s.earthExamPassed ? (
                            <span style={{ color: '#43ffa0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ✓ {s.earthExamScore}
                            </span>
                          ) : (
                            <span style={{ color: '#fbbf24', fontSize: '11px' }}>
                              ⏳ {s.earthExamScore}
                            </span>
                          )}
                        </td>

                        {/* Sols Survived */}
                        <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>
                          <strong>{s.solsCompleted} / 30</strong> ({s.missionsCompleted} Missions)
                        </td>

                        {/* Polar Ice */}
                        <td style={{ padding: '12px 10px', color: '#38bdf8', fontWeight: 700 }}>
                          🧊 {s.iceHarvestedKg} kg
                        </td>

                        {/* Safety Index */}
                        <td style={{ padding: '12px 10px' }}>
                          {s.casualtiesCount === 0 ? (
                            <span style={{ color: '#43ffa0', fontSize: '11px', fontWeight: 800 }}>
                              100% (0 Losses)
                            </span>
                          ) : (
                            <span style={{ color: '#f87171', fontSize: '11px', fontWeight: 800 }}>
                              ⚠️ {s.casualtiesCount} Loss
                            </span>
                          )}
                        </td>

                        {/* Teacher Actions */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => handleBonusXp(s.id, 50)}
                              style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#43ffa0',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                              title="Award +50 XP Commendation"
                            >
                              +50 XP
                            </button>

                            <button
                              onClick={() => {
                                setEditingNoteStudentId(s.id);
                                setTempNoteText(s.teacherNote || '');
                              }}
                              style={{
                                background: 'rgba(168, 85, 247, 0.2)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                color: '#d8b4fe',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                              title="Write Feedback Note"
                            >
                              Note
                            </button>

                            <button
                              onClick={() => {
                                setSelectedStudentForReport(s);
                                setActiveTab('REPORT_CARD');
                                soundFx.playClick(800);
                              }}
                              style={{
                                background: 'rgba(56, 189, 248, 0.2)',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                color: '#38bdf8',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                              title="View and Print Student Report"
                            >
                              Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Note Edit Modal Dialog if clicked */}
              {editingNoteStudentId && (
                <div style={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid #a855f7', borderRadius: '12px', padding: '16px', marginTop: '10px' }}>
                  <div style={{ fontWeight: 800, color: '#e9d5ff', marginBottom: '8px', fontSize: '0.9rem' }}>
                    ✍️ Teacher Evaluation &amp; Feedback for Cadet
                  </div>
                  <textarea
                    rows={3}
                    value={tempNoteText}
                    onChange={(e) => setTempNoteText(e.target.value)}
                    placeholder="Enter classroom feedback on mission survival, rover driving, or life support physics..."
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => setEditingNoteStudentId(null)}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveNote(editingNoteStudentId)}
                      style={{ background: '#9333ea', border: 'none', color: '#ffffff', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}
                    >
                      Save Evaluation Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: CLASSROOM ANALYTICS ── */}
          {activeTab === 'ANALYTICS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 4 Big Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '18px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 800 }}>Classroom Average XP</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: '6px 0' }}>{avgXp} XP</div>
                  <div style={{ fontSize: '0.75rem', color: '#43ffa0' }}>↑ +18% Higher than NASA baseline</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '18px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 800 }}>Earth Exam Certification</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#43ffa0', margin: '6px 0' }}>{passRate}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{examPassedCount} of {students.length} Cadets Certified</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '18px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#7dd3fc', textTransform: 'uppercase', fontWeight: 800 }}>Total Cryo-Ice Harvested</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', margin: '6px 0' }}>
                    {students.reduce((acc, s) => acc + s.iceHarvestedKg, 0)} kg
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Shackleton Crater Volatiles</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '18px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#fde047', textTransform: 'uppercase', fontWeight: 800 }}>Safety Index (Zero Casualties)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', margin: '6px 0' }}>96.5%</div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Only 1 decompression casualty recorded</div>
                </div>
              </div>

              {/* Classroom Teaching Insights */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '20px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
                  🧠 Pedagogical Observations &amp; Common Misconceptions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.08)', borderLeft: '4px solid #38bdf8' }}>
                    <strong style={{ color: '#38bdf8' }}>Lunar Night Power Management:</strong> Cadets successfully pivoted to Kilopower nuclear generation during the 354-hour lunar night, achieving a 92% power grid survival rate.
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '4px solid #f59e0b' }}>
                    <strong style={{ color: '#fbbf24' }}>Sabatier Reaction Balancing:</strong> 2 cadets initially forgot that Sabatier requires continuous Hydrogen ($H_2$) to scrub $CO_2$. Remind students in class about stoichiometry ($CO_2 + 4H_2 \to CH_4 + 2H_2O$).
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid #10b981' }}>
                    <strong style={{ color: '#43ffa0' }}>Terrain-Relative Navigation (TRN):</strong> Over 85% of cadets passed the Mars 2020 EDL 7-Minutes of Terror challenge by following terrain-relative navigation prompts.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: DIRECTIVES / HOMEWORK ── */}
          {activeTab === 'DIRECTIVES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Add Directive Form */}
              <form onSubmit={handleAddDirective} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '14px', padding: '18px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fde047', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📢</span>
                  <span>Broadcast Mission Directive / Homework to Cadets</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Directive Title (e.g. Complete Sol 10 Lunar Night)"
                    value={newDirTitle}
                    onChange={(e) => setNewDirTitle(e.target.value)}
                    required
                    style={{ background: 'rgba(8, 14, 26, 0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <input
                    type="number"
                    placeholder="Target Sol (e.g. 10)"
                    value={newDirSol}
                    onChange={(e) => setNewDirSol(parseInt(e.target.value, 10))}
                    style={{ background: 'rgba(8, 14, 26, 0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <input
                    type="number"
                    placeholder="XP Reward (e.g. 350)"
                    value={newDirXp}
                    onChange={(e) => setNewDirXp(parseInt(e.target.value, 10))}
                    style={{ background: 'rgba(8, 14, 26, 0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Directive Instructions & Requirements (e.g. Harvest 50kg polar ice and pass the Earth exam)..."
                  value={newDirDesc}
                  onChange={(e) => setNewDirDesc(e.target.value)}
                  style={{ width: '100%', background: 'rgba(8, 14, 26, 0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', marginBottom: '10px' }}
                />
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  🚀 Broadcast Assignment to All Students
                </button>
              </form>

              {/* List of Directives */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Active Classroom Directives</h4>
                {directives.map((dir) => (
                  <div key={dir.id} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>{dir.title}</span>
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#43ffa0', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>ACTIVE</span>
                        <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>+{dir.xpReward} XP</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px' }}>{dir.description}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>Target: Sol {dir.targetSol} · Assigned: {dir.assignedDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 4: PRINTABLE NASA STUDENT REPORT CARD ── */}
          {activeTab === 'REPORT_CARD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Select Cadet:</span>
                  <select
                    value={selectedStudentForReport.id}
                    onChange={(e) => {
                      const found = students.find((s) => s.id === e.target.value);
                      if (found) setSelectedStudentForReport(found);
                    }}
                    style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#ffffff', border: '1px solid #38bdf8', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (@{s.username}) — Grade: {s.grade}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => window.print()}
                  style={{
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Printer size={16} />
                  <span>Print Official NASA Grade Report</span>
                </button>
              </div>

              {/* Printable Certificate Sheet */}
              <div
                style={{
                  background: 'linear-gradient(180deg, #0f172a 0%, #080d1a 100%)',
                  border: '3px double rgba(168, 85, 247, 0.6)',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
                  color: '#ffffff',
                }}
              >
                {/* Certificate Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid rgba(168, 85, 247, 0.3)', paddingBottom: '18px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}>🚀 🎖️ 🪐</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    NASA International Space Apps Challenge
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: '#c084fc', fontWeight: 800 }}>
                    Official Junior Astronaut Mission Flight Competency Transcript
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    School: {currentUser?.schoolOrOrg || 'NASA STEM Academy / Central High'} · Verified Educator: {currentUser?.fullName || 'Prof. Sarah Jenkins'}
                  </div>
                </div>

                {/* Cadet Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px', background: 'rgba(2, 6, 23, 0.5)', padding: '16px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>CADET CANDIDATE</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>{selectedStudentForReport.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>@{selectedStudentForReport.username}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ASTRONAUT RANK</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#43ffa0' }}>Level {selectedStudentForReport.rankLevel}: {selectedStudentForReport.rankTitle}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>OVERALL GRADE &amp; SCORE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b' }}>
                      {selectedStudentForReport.grade} ({selectedStudentForReport.totalXp} XP)
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>EARTH ACADEMY EXAM</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: selectedStudentForReport.earthExamPassed ? '#43ffa0' : '#fbbf24' }}>
                      {selectedStudentForReport.earthExamScore} {selectedStudentForReport.earthExamPassed ? '✓ PASSED' : ''}
                    </div>
                  </div>
                </div>

                {/* Subject Competencies */}
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '10px', textTransform: 'uppercase' }}>
                  Evaluated Aerospace Competencies
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>Closed-Loop ECLSS Thermodynamics</div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Sabatier $CO_2$ conversion &amp; water distillation efficiency: <strong>94% (Mastery)</strong></div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>Lunar Day/Night Power Balancing</div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>354-hour freeze survival &amp; Kilopower nuclear grid: <strong>Pass (Certified)</strong></div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>Polar Ice Core Robotics</div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Harvested <strong>{selectedStudentForReport.iceHarvestedKg} kg</strong> cryo-ice in permanently shadowed craters.</div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc' }}>Radiation Mass Shielding</div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Regolith storm vault usage during solar particle events: <strong>100% Zero Casualties</strong></div>
                  </div>
                </div>

                {/* Teacher Commendation Note */}
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#e9d5ff', textTransform: 'uppercase' }}>
                    Instructor's Formal Recommendation &amp; Notes
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#ffffff', fontStyle: 'italic', marginTop: '4px' }}>
                    "{selectedStudentForReport.teacherNote || 'Student demonstrated excellent discipline and systems thinking under simulated deep-space constraints.'}"
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#e9d5ff', fontFamily: 'var(--font-mono)' }}>
                      Prof. Sarah Jenkins
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Certified NASA Flight Instructor</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#43ffa0', fontFamily: 'var(--font-mono)' }}>
                      NASA Space Apps 2026
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Global Education Accreditation</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: REAL-TIME MISSION TIMESTAMPS FEED ── */}
          {activeTab === 'REALTIME_LOGS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                      CLASSROOM REAL-TIME MISSION COMPLETION RADAR
                    </h3>
                    <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.4)', fontWeight: 800 }}>
                      LIVE TELEMETRY
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Every mission completed by enrolled cadets with exact UTC/Local timestamps, duration, and score results
                  </p>
                </div>

                <button
                  onClick={() => {
                    setRealtimeLogs(studentActivityService.getLogs());
                    soundFx.playTelemetryChirp();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span>🔄 Refresh Live Feeds</span>
                </button>
              </div>

              {/* Log List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {realtimeLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                        }}
                      >
                        {log.studentAvatar}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f8fafc' }}>
                            {log.studentFullName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                            @{log.studentUsername}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                            Astronaut: {log.characterName}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>
                          {log.missionTitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      {/* Exact Timestamp */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                          ⏱️ {log.formattedTime} ({log.timeAgo})
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          Duration: <strong style={{ color: '#fff' }}>{log.durationFormatted || 'Instant'}</strong>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4ade80' }}>
                          +{log.scoreXp} XP
                        </span>
                        {log.coinsEarned > 0 && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#facc15' }}>
                            🪙 +{log.coinsEarned} Coins
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (isFullPage) {
    return (
      <div className="page-teacher-gradebook" style={{ minHeight: 'calc(100vh - 52px)', background: 'var(--color-space-950, #04070e)', padding: '16px 20px 48px' }}>
        {modalContent}
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      {modalContent}
    </div>
  );
};
