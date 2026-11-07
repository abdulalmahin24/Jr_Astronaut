import React, { useState } from 'react';
import { soundFx } from '../../utils/audioEffects';

export interface CadetProfile {
  callsign: string;
  avatar: string;
  characterName: string;
  rank: string;
}

interface CadetEnlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: CadetProfile;
  onSaveProfile: (profile: CadetProfile) => void;
}

const CHARACTERS = [
  { name: 'Maya', role: 'Flight Cadet Pilot', img: '/cinematic/maya.jpg' },
  { name: 'Dadu', role: 'Expedition Commander', img: '/cinematic/commander.jpg' },
  { name: 'CapCom', role: 'Houston Flight Director', img: '/cinematic/capcom.jpg' },
];

export const CadetEnlistModal: React.FC<CadetEnlistModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
}) => {
  const [selectedChar, setSelectedChar] = useState(currentProfile.characterName || 'Maya');
  const [callsign, setCallsign] = useState(currentProfile.callsign || 'MAYA-01');

  if (!isOpen) return null;

  const handleSave = () => {
    soundFx.playVictory();
    const charObj = CHARACTERS.find((c) => c.name === selectedChar) || CHARACTERS[0];
    onSaveProfile({
      callsign: callsign.trim().toUpperCase() || 'MAYA-01',
      avatar: charObj.img,
      characterName: charObj.name,
      rank: 'ASCAN Grade 1 Pilot',
    });
    onClose();
  };

  const handleSuggest = (name: string) => {
    soundFx.playClick(800);
    setCallsign(name);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="cockpit-panel-amber rounded-3xl p-6 md:p-8 max-w-md w-full relative space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl animate-bounce">🚀</div>
          <h3 className="font-arcade text-2xl text-white">CADET ENLISTMENT</h3>
          <p className="text-xs text-slate-400">Select your official NASA astronaut avatar &amp; flight callsign</p>
        </div>

        {/* Character Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono-code font-bold text-slate-300">SELECT CHARACTER:</label>
          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.map((char) => {
              const isSelected = selectedChar === char.name;
              return (
                <button
                  key={char.name}
                  type="button"
                  onClick={() => {
                    soundFx.playClick(700);
                    setSelectedChar(char.name);
                  }}
                  className={`p-2 rounded-2xl bg-slate-900 text-center transition-all border-2 ${
                    isSelected
                      ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-105'
                      : 'border-slate-800 hover:border-slate-700 opacity-70'
                  }`}
                >
                  <img
                    src={char.img}
                    alt={char.name}
                    className="w-16 h-16 rounded-xl mx-auto object-cover object-top mb-1"
                  />
                  <div className="text-xs font-bold text-white">{char.name}</div>
                  <div className="text-[9px] text-amber-400 leading-tight">{char.role.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Callsign Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono-code font-bold text-slate-300">FLIGHT CALLSIGN:</label>
          <input
            type="text"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-amber-300 font-mono-code font-black text-base outline-none focus:border-amber-400"
            maxLength={14}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[10px] text-slate-400 self-center">Quick Picks:</span>
            {['STAR-MAYA', 'COSMIC-LEO', 'LUNA-RANGER', 'APOLLO-EAGLE'].map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleSuggest(sug)}
                className="text-[10px] text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500/30 px-2 py-0.5 rounded border border-sky-400/20"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="btn-arcade-gold w-full py-4 rounded-2xl font-arcade text-sm flex items-center justify-center gap-2"
          >
            <span>CONFIRM IDENTITY</span> 🚀
          </button>
        </div>

        {/* Close 'X' */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

      </div>
    </div>
  );
};
