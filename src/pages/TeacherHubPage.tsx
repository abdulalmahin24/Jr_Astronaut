import React, { useState } from 'react';
import type { AppRoute } from '../router/useAppRouter';
import type { User } from '../types/auth';
import { TeacherGradebookModal } from '../components/TeacherGradebookModal';
import { TeacherDossierModal } from '../components/TeacherDossierModal';
import { GraduationCap, Users, BookOpen, ShieldCheck } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface TeacherHubPageProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
}

export const TeacherHubPage: React.FC<TeacherHubPageProps> = ({
  currentUser,
  onOpenAuth,
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'GRADEBOOK' | 'DOSSIER'>('GRADEBOOK');
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <div className="page-teacher-hub" style={{
      minHeight: 'calc(100dvh - 52px)',
      background: 'var(--color-paper)',
      color: 'var(--color-ink)',
      padding: '20px 24px 60px',
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Bar */}
        <div style={{
          background: 'var(--color-paper-2)',
          border: 'var(--rule-hair) solid var(--color-rule)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              letterSpacing: 'normal',
              color: 'var(--color-accent)',
            }}>
              NASA STEM Educator Corps • Flight Director &amp; Classroom Portal
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 0', color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
              Flight Director &amp; Classroom Teacher Command Center
            </h1>
          </div>

          {/* Sub-tab Switcher: Gradebook vs Curriculum Dossier */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--color-paper-card)',
            padding: '3px',
            borderRadius: 'var(--radius-card)',
            border: 'var(--rule-hair) solid var(--color-rule)',
          }}>
            <button
              onClick={() => { setActiveSubTab('GRADEBOOK'); soundFx.playClick(750); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-card)',
                fontSize: '11.5px',
                fontWeight: activeSubTab === 'GRADEBOOK' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                background: activeSubTab === 'GRADEBOOK' ? 'var(--color-accent)' : 'transparent',
                color: activeSubTab === 'GRADEBOOK' ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                transition: 'opacity 0.15s ease, background-color 0.15s ease',
              }}
            >
              <Users size={14} />
              <span>Live Class Gradebook &amp; Directives</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('DOSSIER'); soundFx.playClick(750); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-card)',
                fontSize: '11.5px',
                fontWeight: activeSubTab === 'DOSSIER' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                background: activeSubTab === 'DOSSIER' ? 'var(--color-accent)' : 'transparent',
                color: activeSubTab === 'DOSSIER' ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                transition: 'opacity 0.15s ease, background-color 0.15s ease',
              }}
            >
              <BookOpen size={14} />
              <span>NASA Curriculum Dossier</span>
            </button>
          </div>
        </div>

        {/* Educator Role Reminder if cadet */}
        {!isTeacher && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-card)',
            background: 'var(--color-paper-card)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} style={{ color: '#c084fc' }} />
              <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                You are currently viewing Educator Mode with sample NASA Academy classroom telemetry. Sign in with a Teacher account to manage your custom school roster.
              </div>
            </div>
            <button
              onClick={onOpenAuth}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                background: '#7c3aed',
                border: 'none',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Teacher Sign In
            </button>
          </div>
        )}

        {/* Tab View */}
        {activeSubTab === 'GRADEBOOK' ? (
          <TeacherGradebookModal
            isOpen={true}
            isFullPage={true}
            onClose={() => {}}
            currentUser={currentUser}
          />
        ) : (
          <TeacherDossierModal
            isOpen={true}
            isFullPage={true}
            onClose={() => {}}
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
          />
        )}
      </div>
    </div>
  );
};

export default TeacherHubPage;
