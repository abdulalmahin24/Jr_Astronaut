// ============================================================
// AstronautCharacterModal — Historic Astronaut Locker & Character Selector
// Allows students to choose & unlock real-life astronauts using earned Coins
// ============================================================

import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Coins,
  Shield,
  Award,
  Globe2,
  Rocket,
  UserCheck,
  Zap,
} from 'lucide-react';
import { ASTRONAUT_CHARACTERS, type AstronautCharacter } from '../data/astronautCharacters';
import type { User } from '../types/auth';
import { authService } from '../utils/authService';
import { studentActivityService } from '../utils/studentActivityService';
import { soundFx } from '../utils/audioEffects';

interface AstronautCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdate: (updatedUser: User) => void;
}

export const AstronautCharacterModal: React.FC<AstronautCharacterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(
    currentUser?.selectedCharacterId || 'neil_armstrong'
  );
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const userCoins = currentUser?.coins ?? 500;
  const unlockedIds = currentUser?.unlockedCharacterIds || ['neil_armstrong', 'kalpana_chawla'];
  const activeCharId = currentUser?.selectedCharacterId || 'neil_armstrong';

  const selectedChar = ASTRONAUT_CHARACTERS.find((c) => c.id === selectedCharId) || ASTRONAUT_CHARACTERS[0];
  const isSelectedUnlocked = unlockedIds.includes(selectedChar.id);
  const isSelectedActive = activeCharId === selectedChar.id;

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Handle character unlock with coins
  const handleUnlock = (character: AstronautCharacter) => {
    if (!currentUser) return;

    if (userCoins < character.costCoins) {
      soundFx.playAlarm();
      showFeedback(`Insufficient Coins! Need ${character.costCoins - userCoins} more Coins. Complete missions to earn!`, 'error');
      return;
    }

    const res = authService.unlockCharacter(currentUser.id, character.id, character.costCoins);
    if (res.success && res.user) {
      soundFx.playVictory();
      onUserUpdate(res.user);

      // Log real-time activity
      studentActivityService.logActivity({
        studentUsername: res.user.username,
        studentFullName: res.user.fullName || res.user.username,
        studentAvatar: character.avatar,
        characterName: character.name,
        actionType: 'CHARACTER_UNLOCKED',
        missionTitle: `Unlocked Historic Astronaut: ${character.name}`,
        destination: 'CAMPUS',
        durationSeconds: 0,
        scoreXp: 50,
        coinsEarned: 0,
        outcomeStatus: 'UNLOCKED',
        notes: `Equipped ${character.specialPerk.name} (${character.specialPerk.statBonus}).`,
      });

      showFeedback(`🎉 Successfully unlocked ${character.name}! Perk active: ${character.specialPerk.statBonus}`, 'success');
    } else {
      showFeedback(res.error || 'Failed to unlock character.', 'error');
    }
  };

  // Handle equipping an unlocked character
  const handleEquip = (character: AstronautCharacter) => {
    if (!currentUser) return;

    const res = authService.selectCharacter(currentUser.id, character.id, character.avatar);
    if (res.success && res.user) {
      soundFx.playClick(900);
      onUserUpdate(res.user);
      showFeedback(`🧑‍🚀 ${character.name} is now your Active Flight Astronaut!`, 'success');
    }
  };

  return (
    <div className="flight-modal-backdrop" onClick={onClose} style={{ zIndex: 12000 }}>
      <div
        className="flight-modal-window"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          background: 'linear-gradient(145deg, #070d18 0%, #0d1627 50%, #07101e 100%)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
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
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)',
              }}
            >
              🧑‍🚀
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', margin: 0 }}>
                  HISTORIC ASTRONAUT HANGAR & CHARACTER LOCKER
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontWeight: 700,
                  }}
                >
                  NASA REAL CREW
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Choose legendary real-life space explorers or unlock new heroes using your mission coins
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Cadet Coin Balance Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
              }}
            >
              <Coins size={18} style={{ color: '#eab308' }} />
              <div>
                <span style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', lineHeight: 1 }}>YOUR CADET COINS</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#facc15' }}>{userCoins.toLocaleString()}</span>
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

        {/* Action feedback toast */}
        {feedbackMsg && (
          <div
            style={{
              padding: '10px 20px',
              background: feedbackMsg.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              borderBottom: `1px solid ${feedbackMsg.type === 'success' ? '#22c55e' : '#ef4444'}`,
              color: feedbackMsg.type === 'success' ? '#86efac' : '#fca5a5',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <Zap size={16} />}
            {feedbackMsg.text}
          </div>
        )}

        {/* Modal Main Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Character Grid Roster */}
          <div
            style={{
              borderRight: '1px solid rgba(56, 189, 248, 0.2)',
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'rgba(11, 19, 35, 0.7)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Select Cadet Pilot ({ASTRONAUT_CHARACTERS.length} Astronauts)
            </div>

            {ASTRONAUT_CHARACTERS.map((char) => {
              const isUnlocked = unlockedIds.includes(char.id);
              const isActive = activeCharId === char.id;
              const isSelected = selectedCharId === char.id;

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    setSelectedCharId(char.id);
                    soundFx.playClick(750);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.2), rgba(15, 23, 42, 0.8))'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected
                      ? '1px solid #38bdf8'
                      : isActive
                      ? '1px solid #22c55e'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none',
                  }}
                >
                  {/* Portrait badge */}
                  <div
                    style={{
                      position: 'relative',
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: `1px solid ${isUnlocked ? 'rgba(56, 189, 248, 0.4)' : 'rgba(100, 116, 139, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                    }}
                  >
                    <span>{char.avatar}</span>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        fontSize: '11px',
                      }}
                    >
                      {char.countryFlag.split(' ')[0]}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {char.name}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#4ade80', background: 'rgba(34, 197, 94, 0.15)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {char.historicFlight}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      {isUnlocked ? (
                        <span style={{ fontSize: '10px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <Unlock size={11} /> Unlocked
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#facc15', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                          <Coins size={11} /> {char.costCoins} Coins
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Character Dossier & Actions */}
          <div
            style={{
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              background: 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.08) 0%, transparent 60%)',
            }}
          >
            {/* Hero Profile Header */}
            <div
              style={{
                display: 'flex',
                gap: '20px',
                padding: '20px',
                borderRadius: '14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(15, 23, 42, 0.9))',
                  border: '2px solid rgba(56, 189, 248, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '44px',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
                }}
              >
                {selectedChar.avatar}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {selectedChar.name}
                  </h3>
                  <span style={{ fontSize: '16px' }}>{selectedChar.countryFlag}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }}>
                    {selectedChar.agency}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600, marginTop: '4px' }}>
                  {selectedChar.historicalTitle}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Flight: <strong style={{ color: '#e2e8f0' }}>{selectedChar.historicFlight}</strong>
                  </div>
                  {selectedChar.totalTimeInSpace && (
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Time in Space: <strong style={{ color: '#e2e8f0' }}>{selectedChar.totalTimeInSpace}</strong>
                    </div>
                  )}
                  {selectedChar.spacewalkCount !== undefined && (
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Spacewalks: <strong style={{ color: '#e2e8f0' }}>{selectedChar.spacewalkCount} EVAs</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Special Flight Perk Box */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.1), rgba(15, 23, 42, 0.7))',
                border: '1px solid rgba(234, 179, 8, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={18} style={{ color: '#facc15' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  MISSION TACTICAL PERK: {selectedChar.specialPerk.name}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(234, 179, 8, 0.2)',
                    color: '#fef08a',
                  }}
                >
                  {selectedChar.specialPerk.statBonus}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                {selectedChar.specialPerk.description}
              </p>
            </div>

            {/* Biography & Famous Quote */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Historical Flight Record & Open Science Dossier
              </div>

              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  fontSize: '12px',
                  color: '#94a3b8',
                  lineHeight: 1.6,
                }}
              >
                {selectedChar.biography}
              </div>

              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.05)',
                  borderLeft: '4px solid #38bdf8',
                  fontStyle: 'italic',
                  fontSize: '12px',
                  color: '#bae6fd',
                }}
              >
                "{selectedChar.famousQuote}"
              </div>
            </div>

            {/* Action Buttons: Unlock / Equip */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '16px',
                borderTop: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>CHARACTER STATUS</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: isSelectedUnlocked ? '#4ade80' : '#facc15' }}>
                  {isSelectedActive ? '⭐ ACTIVE PILOT' : isSelectedUnlocked ? '✅ UNLOCKED' : `🔒 LOCKED (${selectedChar.costCoins} COINS)`}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {!isSelectedUnlocked ? (
                  <button
                    onClick={() => handleUnlock(selectedChar)}
                    disabled={userCoins < selectedChar.costCoins}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      background: userCoins >= selectedChar.costCoins
                        ? 'linear-gradient(135deg, #eab308, #ca8a04)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: userCoins >= selectedChar.costCoins ? '#000' : '#64748b',
                      fontWeight: 800,
                      fontSize: '13px',
                      border: 'none',
                      cursor: userCoins >= selectedChar.costCoins ? 'pointer' : 'not-allowed',
                      boxShadow: userCoins >= selectedChar.costCoins ? '0 0 20px rgba(234, 179, 8, 0.3)' : 'none',
                    }}
                  >
                    <Coins size={16} />
                    UNLOCK FOR {selectedChar.costCoins} COINS
                  </button>
                ) : isSelectedActive ? (
                  <button
                    disabled
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'default',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    CURRENTLY EQUIPPED
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquip(selectedChar)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(2, 132, 199, 0.35)',
                    }}
                  >
                    <UserCheck size={16} />
                    EQUIP AS ACTIVE ASTRONAUT
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
