import React from 'react';
import { BookOpen, GraduationCap, X, CheckCircle2, HelpCircle, Mail, School, Users, KeyRound } from 'lucide-react';
import type { User } from '../types/auth';
import { authService } from '../utils/authService';

interface TeacherDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  isFullPage?: boolean;
}

export const TeacherDossierModal: React.FC<TeacherDossierModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  isFullPage = false,
}) => {
  if (!isOpen && !isFullPage) return null;

  const isTeacher = currentUser?.role === 'teacher';
  const allUsers = authService.getUsers();
  const enrolledCadets = allUsers.filter((u) => u.role === 'cadet');

  const dossierBody = (
    <div
      className={isFullPage ? "teacher-fullpage-dossier" : "modal-container"}
      style={isFullPage ? { maxWidth: '1100px', width: '100%', margin: '0 auto', background: 'var(--color-paper-2)', border: 'var(--rule-hair)', borderRadius: '4px' } : { maxWidth: '820px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <div className="flex items-center gap-2">
          <GraduationCap size={22} className="text-cyan-400" />
          <span className="modal-title">Teacher &amp; Classroom Curriculum Dossier</span>
        </div>
        {!isFullPage && (
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>

        <div className="curriculum-body">
          {/* Educator Status Bar */}
          {isTeacher ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.2))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
                  <GraduationCap size={15} />
                  <span>VERIFIED TEACHER SECURITY CLEARANCE</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  {currentUser.fullName} ({currentUser.username})
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e9d5ff' }}>
                    <Mail size={12} /> {currentUser.email}
                  </span>
                  {currentUser.schoolOrOrg && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <School size={12} /> {currentUser.schoolOrOrg}
                    </span>
                  )}
                </div>
              </div>

              <div style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#6ee7b7',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700
              }}>
                Classroom Ready ✓
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(100, 116, 139, 0.4)',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Are you an educator? <strong>Sign in with a verified Teacher Email</strong> to unlock classroom rosters and lesson tools.
              </div>
              {onOpenAuth && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '7px',
                    background: 'linear-gradient(90deg, #9333ea, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <KeyRound size={13} />
                  <span>Teacher Login (Requires Email)</span>
                </button>
              )}
            </div>
          )}

          {/* Enrolled Cadets Roster (Visible for Teachers) */}
          {isTeacher && (
            <div className="curriculum-section" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={16} className="text-cyan-400" />
                <h3 style={{ margin: 0 }}>Classroom Junior Astronaut Roster ({enrolledCadets.length} Registered Cadets)</h3>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
                marginTop: '8px'
              }}>
                {enrolledCadets.map((cadet) => (
                  <div
                    key={cadet.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{cadet.avatar || '🚀'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#ffffff' }}>
                        {cadet.fullName || cadet.username}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#38bdf8' }}>
                        @{cadet.username} • {cadet.cadetRank}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="curriculum-callout">
            <BookOpen size={20} className="text-emerald-400 shrink-0" />
            <div>
              <strong>Target Audience:</strong> STEM Classrooms, Science Clubs, and Intergenerational Co-play (Ages 3 to 70+).
              <br />
              <strong>Learning Domain:</strong> Closed-Loop Thermodynamics, Aerospace Engineering Trade-Offs, and Space Weather Preparedness.
            </div>
          </div>

          <div className="curriculum-section">
            <h3>🎯 Core Learning Objectives</h3>
            <ul className="learning-goals-list">
              <li>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span><strong>Systems Thinking:</strong> Understand that energy, water, oxygen, and food are coupled together; a choice in power directly affects breathing air.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span><strong>Planetary Day/Night Realities:</strong> Grasp why a 354-hour lunar night makes solar power unfeasible without massive battery storage or surface fission.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span><strong>Radiation Protection:</strong> Learn how physical mass (lunar regolith soil and water blankets) shields human cells from Coronal Mass Ejection proton storms.</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span><strong>Explainable Failure Analysis:</strong> Conduct root-cause diagnostic autopsies to determine how early decisions cascaded into mission bottlenecks.</span>
              </li>
            </ul>
          </div>

          <div className="curriculum-section">
            <h3>💬 Suggested Post-Game Classroom Discussion Questions</h3>
            <div className="discussion-box">
              <HelpCircle size={16} className="text-amber-400 shrink-0" />
              <span><em>"On Sol 12, when the solar flare warning was broadcast, what did your team sacrifice: science discovery or radiation safety? Why?"</em></span>
            </div>
            <div className="discussion-box">
              <HelpCircle size={16} className="text-amber-400 shrink-0" />
              <span><em>"Why did the greenhouse stop producing food when the power reserves dropped during the lunar night?"</em></span>
            </div>
            <div className="discussion-box">
              <HelpCircle size={16} className="text-amber-400 shrink-0" />
              <span><em>"If launch rockets cost $10,000 per kilogram, why is it better to harvest lunar ice on the Moon than ship bottled water from Earth?"</em></span>
            </div>
          </div>
        </div>
      </div>
  );

  if (isFullPage) {
    return (
      <div className="page-teacher-dossier" style={{ minHeight: 'calc(100vh - 52px)', background: 'var(--color-space-950, #04070e)', padding: '16px 20px 48px' }}>
        {dossierBody}
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {dossierBody}
    </div>
  );
};
