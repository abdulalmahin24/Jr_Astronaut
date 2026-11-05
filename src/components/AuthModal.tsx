// ============================================================
// AuthModal — NASA Flight Credential Gateway
// Supports Junior Astronaut (Username + Password) & Teacher (Email + Username + Password)
// ============================================================

import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Lock,
  Mail,
  School,
  GraduationCap,
  Rocket,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import type { User, UserRole } from '../types/auth';
import { authService } from '../utils/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthChange: (user: User | null) => void;
  onOpenTeacherDossier?: () => void;
  onOpenCharacterLocker?: () => void;
  onOpenLiveActivity?: () => void;
}

const AVATAR_OPTIONS = ['🚀', '👨‍🚀', '👩‍🚀', '🛰️', '🛸', '🌟', '🤖', '🪐'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
  onOpenTeacherDossier,
  onOpenCharacterLocker,
  onOpenLiveActivity,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('cadet');

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolOrOrg, setSchoolOrOrg] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🚀');

  // Status & Error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setErrorMessage(null);
    if (newRole === 'teacher' && selectedAvatar === '🚀') {
      setSelectedAvatar('👩‍🏫');
    } else if (newRole === 'cadet' && selectedAvatar === '👩‍🏫') {
      setSelectedAvatar('🚀');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = authService.login({
      identifier: username,
      password: password,
    });

    if (res.success && res.user) {
      setSuccessMessage(`Welcome back, ${res.user.role === 'teacher' ? 'Instructor' : 'Cadet'} ${res.user.username}!`);
      onAuthChange(res.user);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } else {
      setErrorMessage(res.error || 'Authentication failed.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = authService.register({
      username,
      password,
      role,
      email: role === 'teacher' ? email : undefined,
      fullName,
      schoolOrOrg: role === 'teacher' ? schoolOrOrg : undefined,
      avatar: selectedAvatar,
    });

    if (res.success && res.user) {
      setSuccessMessage(`Security clearance approved! Logged in as ${res.user.username}.`);
      onAuthChange(res.user);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  const handleQuickDemoUser = (identifier: string, pass: string, label: string) => {
    setErrorMessage(null);
    setUsername(identifier);
    setPassword(pass);
    const res = authService.login({ identifier, password: pass });
    if (res.success && res.user) {
      onAuthChange(res.user);
      setSuccessMessage(`Logged in as ${label} (@${res.user.username})`);
      setTimeout(() => { setSuccessMessage(null); onClose(); }, 900);
    } else {
      setErrorMessage(res.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    authService.logout();
    onAuthChange(null);
    setSuccessMessage('Signed out of flight terminal.');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 1200);
  };

  return (
    <div className="flight-modal-backdrop" onClick={onClose}>
      <div
        className="flight-modal-container"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flight-modal-header">
          <div className="flight-header-left">
            <div
              className="flight-type-badge-icon"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <div className="flight-header-meta">
                <span>NASA FLIGHT TERMINAL</span>
                <span className="flight-program-pill">SECURITY CLEARANCE</span>
              </div>
              <h2 className="flight-mission-title" style={{ fontSize: '18px' }}>
                Astronaut & Educator Gateway
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="flight-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Notification Alerts */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '12.5px',
              marginBottom: '16px',
              fontFamily: 'var(--font-mono)'
            }}>
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              fontSize: '12.5px',
              marginBottom: '16px',
              fontFamily: 'var(--font-mono)'
            }}>
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ═══ VIEW 1: ALREADY LOGGED IN ═══ */}
          {currentUser ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* ID Badge Card */}
              <div style={{
                position: 'relative',
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.6))',
                border: currentUser.role === 'teacher'
                  ? '1px solid rgba(168, 85, 247, 0.45)'
                  : '1px solid rgba(6, 182, 212, 0.45)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    color: currentUser.role === 'teacher' ? '#c084fc' : '#38bdf8',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <ShieldCheck size={14} /> NASA IDENTIFICATION BADGE
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    background: currentUser.role === 'teacher' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                    color: currentUser.role === 'teacher' ? '#e9d5ff' : '#67e8f9',
                    border: currentUser.role === 'teacher' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(6, 182, 212, 0.4)',
                  }}>
                    {currentUser.role === 'teacher' ? '👩‍🏫 FLIGHT INSTRUCTOR' : '🚀 JUNIOR ASTRONAUT'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '14px',
                    background: 'rgba(3, 7, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    flexShrink: 0
                  }}>
                    {currentUser.avatar || '👨‍🚀'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                      {currentUser.fullName || currentUser.username}
                    </h3>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      Callsign: <strong style={{ color: '#38bdf8' }}>@{currentUser.username}</strong>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
                      Rank: {currentUser.cadetRank}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#facc15', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🪙 Balance: <strong>{(currentUser.coins ?? 500).toLocaleString()} Coins</strong></span>
                    </div>

                    {/* Teacher specific fields */}
                    {currentUser.role === 'teacher' && currentUser.email && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} className="text-purple-400" />
                        <span>{currentUser.email}</span>
                      </div>
                    )}
                    {currentUser.role === 'teacher' && currentUser.schoolOrOrg && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <School size={12} />
                        <span>{currentUser.schoolOrOrg}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {onOpenCharacterLocker && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCharacterLocker();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px',
                      borderRadius: '10px',
                      background: 'linear-gradient(90deg, #0284c7, #0369a1)',
                      color: '#ffffff',
                      border: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    <span>🧑‍🚀 CHOOSE / UNLOCK HISTORIC ASTRONAUT</span>
                  </button>
                )}

                {onOpenLiveActivity && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenLiveActivity();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#6ee7b7',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <span>📡 VIEW LIVE REAL-TIME MISSION RADAR</span>
                  </button>
                )}

                {currentUser.role === 'teacher' && onOpenTeacherDossier && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTeacherDossier();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(90deg, #7c3aed, #6366f1)',
                      color: '#ffffff',
                      border: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
                    }}
                  >
                    <GraduationCap size={16} />
                    <span>OPEN TEACHER CURRICULUM & GRADEBOOK</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={15} />
                  <span>DISCONNECT / LOG OUT</span>
                </button>
              </div>
            </div>
          ) : (
            /* ═══ VIEW 2: LOGIN / REGISTER FORMS ═══ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Tab Selector (Login vs Register) */}
              <div style={{
                display: 'flex',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid rgba(51, 65, 85, 0.5)',
              }}>
                <button
                  onClick={() => { setTab('login'); setErrorMessage(null); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: tab === 'login' ? '#06b6d4' : 'transparent',
                    color: tab === 'login' ? '#020617' : '#94a3b8',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Sign In (Login)
                </button>
                <button
                  onClick={() => { setTab('register'); setErrorMessage(null); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: tab === 'register' ? '#06b6d4' : 'transparent',
                    color: tab === 'register' ? '#020617' : '#94a3b8',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Register New Account
                </button>
              </div>

              {/* Role Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                  SELECT ACCOUNT CLEARANCE TYPE:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Cadet Role */}
                  <div
                    onClick={() => handleRoleChange('cadet')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: role === 'cadet'
                        ? '1.5px solid #06b6d4'
                        : '1px solid rgba(51, 65, 85, 0.5)',
                      background: role === 'cadet'
                        ? 'rgba(6, 182, 212, 0.12)'
                        : 'rgba(15, 23, 42, 0.6)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: role === 'cadet' ? '#38bdf8' : '#cbd5e1', fontWeight: 700, fontSize: '13px' }}>
                      <Rocket size={16} />
                      <span>Junior Astronaut</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      Username & Password only (No email needed!)
                    </span>
                  </div>

                  {/* Teacher Role */}
                  <div
                    onClick={() => handleRoleChange('teacher')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: role === 'teacher'
                        ? '1.5px solid #a855f7'
                        : '1px solid rgba(51, 65, 85, 0.5)',
                      background: role === 'teacher'
                        ? 'rgba(168, 85, 247, 0.12)'
                        : 'rgba(15, 23, 42, 0.6)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: role === 'teacher' ? '#c084fc' : '#cbd5e1', fontWeight: 700, fontSize: '13px' }}>
                      <GraduationCap size={16} />
                      <span>Educator / Teacher</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      <strong>Email required</strong> for teacher access
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={tab === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Email (Shown for Teachers) */}
                {role === 'teacher' && (
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#c084fc', marginBottom: '6px' }}>
                      <Mail size={13} />
                      <span>TEACHER EMAIL ADDRESS * (REQUIRED FOR TEACHERS)</span>
                    </label>
                    <input
                      type="email"
                      required={role === 'teacher' && tab === 'register'}
                      placeholder="e.g. teacher@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#f8fafc',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* Username */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38bdf8', marginBottom: '6px' }}>
                    <UserIcon size={13} />
                    <span>{role === 'teacher' ? 'TEACHER USERNAME / CALLSIGN *' : 'ASTRONAUT CALLSIGN / USERNAME *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'teacher' ? 'e.g. TeacherSarah' : 'e.g. CadetApollo'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#f8fafc',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '6px' }}>
                    <Lock size={13} />
                    <span>SECURITY PASSWORD * (MIN 4 CHARACTERS)</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(51, 65, 85, 0.6)',
                      color: '#f8fafc',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Extra fields for Registration */}
                {tab === 'register' && (
                  <>
                    {/* Full Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '6px' }}>
                        FULL NAME (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        placeholder={role === 'teacher' ? 'Prof. Sarah Jenkins' : 'Neil Armstrong Jr.'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(51, 65, 85, 0.6)',
                          color: '#f8fafc',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* School / Institution (for teacher) */}
                    {role === 'teacher' && (
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '6px' }}>
                          <School size={13} />
                          <span>SCHOOL / ORGANIZATION (OPTIONAL)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Kennedy High STEM Club / NASA AstroCamp"
                          value={schoolOrOrg}
                          onChange={(e) => setSchoolOrOrg(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(51, 65, 85, 0.6)',
                            color: '#f8fafc',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12.5px',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    )}

                    {/* Avatar Picker */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '6px' }}>
                        CHOOSE YOUR FLIGHT AVATAR:
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {AVATAR_OPTIONS.map((av) => (
                          <button
                            type="button"
                            key={av}
                            onClick={() => setSelectedAvatar(av)}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: selectedAvatar === av ? 'rgba(6, 182, 212, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                              border: selectedAvatar === av ? '2px solid #06b6d4' : '1px solid rgba(51, 65, 85, 0.5)',
                              fontSize: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {av}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: role === 'teacher'
                      ? 'linear-gradient(90deg, #9333ea, #6366f1)'
                      : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: role === 'teacher'
                      ? '0 4px 18px rgba(147, 51, 234, 0.4)'
                      : '0 4px 18px rgba(6, 182, 212, 0.4)',
                    marginTop: '8px',
                  }}
                >
                  {tab === 'login'
                    ? (role === 'teacher' ? 'ENTER TEACHER COMMAND' : 'ENTER CADET TERMINAL')
                    : (role === 'teacher' ? 'CREATE VERIFIED TEACHER ACCOUNT' : 'CREATE JUNIOR ASTRONAUT ACCOUNT')}
                </button>
              </form>

              {/* Quick Demo Logins */}
              <div style={{
                marginTop: '10px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(51, 65, 85, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#64748b', textAlign: 'center' }}>
                  QUICK DEMO TESTING LOGINS:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoUser('CadetArtemis', 'space2026', 'Cadet Artemis')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#38bdf8',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span>🚀 <strong>Cadet Artemis</strong></span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>User: CadetArtemis · pass: space2026</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoUser('LeoVance', 'space2026', 'Leo Vance')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#38bdf8',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span>🚜 <strong>Leo Vance</strong></span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>User: LeoVance · pass: space2026</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoUser('MayaLin', 'space2026', 'Maya Lin')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#38bdf8',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span>🛠️ <strong>Maya Lin</strong></span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>User: MayaLin · pass: space2026</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoUser('TeacherSarah', 'teacher2026', 'Prof. Sarah (Teacher)')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#c084fc',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span>👩‍🏫 <strong>Prof. Sarah Jenkins</strong></span>
                    <span style={{ fontSize: '9px', color: '#cbd5e1' }}>User: TeacherSarah · pass: teacher2026</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
