import React from 'react';
import type { AppRoute } from '../router/useAppRouter';
import { soundFx } from '../utils/audioEffects';
import type { CadetProfile } from '../components/arcade/CadetEnlistModal';

interface AstronautLockerPageProps {
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  cadetProfile: CadetProfile;
  onOpenEnlistModal: () => void;
  spaceXp: number;
  onOpenCertificateModal: () => void;
}

export const AstronautLockerPage: React.FC<AstronautLockerPageProps> = ({
  onNavigate,
  cadetProfile,
  onOpenEnlistModal,
  spaceXp,
  onOpenCertificateModal,
}) => {
  const handlePrintDiploma = () => {
    soundFx.playVictory();
    onOpenCertificateModal();
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-arcade text-xs mb-1">
            CADET RECORD &amp; ACHIEVEMENTS
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-space text-white">Astronaut Locker &amp; Diploma</h2>
          <p className="text-slate-400 text-sm">
            Inspect your verified flight hours, NASA challenge credentials, and earnable gold astronaut wings.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrintDiploma}
          className="btn-arcade-gold px-6 py-3 rounded-2xl font-arcade text-xs flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <span>📜 Print Official NASA Diploma</span>
        </button>
      </div>

      {/* Main Grid: ID Card + Trophy Badges Wall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Official Cadet ID License */}
        <div className="cockpit-panel rounded-3xl p-6 md:p-8 border-2 border-amber-400/40 space-y-6 relative overflow-hidden shadow-2xl">
          <div className="hazard-stripes h-2 absolute top-0 left-0 right-0"></div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 pt-2">
            <span className="text-xs font-mono-code font-bold text-amber-400">NASA SPACE APPS 2026 LICENSE</span>
            <span className="text-emerald-400 text-xs font-bold">GRADE 1 ASCAN</span>
          </div>

          {/* Avatar & Callsign Card */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl p-0.5 bg-slate-950 relative">
              <img
                src={cadetProfile.avatar || '/cinematic/maya.jpg'}
                alt="Cadet Avatar"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div>
              <h3 className="font-arcade text-2xl text-white">{cadetProfile.callsign || 'MAYA-01'}</h3>
              <p className="text-xs text-slate-400">Junior Flight Specialist • Team Mysterio</p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs border border-amber-400/40">
              <span>⭐</span> Total Flight XP: {spaceXp}
            </div>
          </div>

          {/* Verified Telemetry Specs */}
          <div className="space-y-2 text-xs border-t border-slate-800 pt-4 font-mono-code">
            <div className="flex justify-between py-1 text-slate-400">
              <span>Scientific Data Verified</span>
              <strong className="text-sky-400">NASA BVAD-2015</strong>
            </div>
            <div className="flex justify-between py-1 text-slate-400">
              <span>Lunar Surface Grid</span>
              <strong className="text-emerald-400">LOLA GDR South Pole</strong>
            </div>
            <div className="flex justify-between py-1 text-slate-400">
              <span>Fission Telemetry</span>
              <strong className="text-amber-400">Kilopower KRUSTY</strong>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handlePrintDiploma}
              className="btn-arcade-gold w-full py-4 rounded-2xl font-arcade text-sm cursor-pointer"
            >
              PRINT NASA DIPLOMA 📜
            </button>
            <button
              type="button"
              onClick={onOpenEnlistModal}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              Change Callsign or Suit Avatar ✏️
            </button>
          </div>
        </div>

        {/* Right: Unlocked Badges Trophy Wall */}
        <div className="lg:col-span-2 cockpit-panel rounded-3xl p-6 md:p-8 border-2 border-sky-400/30 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-space font-black text-2xl text-white">Official Mission Wings &amp; Badges</h3>
              <p className="text-xs text-slate-400">Earned through authentic NASA engineering challenges</p>
            </div>
            <span className="bg-sky-500/20 text-sky-300 font-mono-code font-bold text-xs px-3 py-1 rounded-full border border-sky-400/30">
              4 / 8 UNLOCKED
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-slate-950/80 p-5 rounded-2xl border-2 border-emerald-500/50 text-center space-y-2">
              <div className="text-4xl">🚪</div>
              <div className="font-arcade text-xs text-white">DELTA-P ACE</div>
              <div className="text-[10px] text-emerald-400 font-bold">Pre-breathe Master</div>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border-2 border-emerald-500/50 text-center space-y-2">
              <div className="text-4xl">🌱</div>
              <div className="font-arcade text-xs text-white">SABATIER CHEMIST</div>
              <div className="text-[10px] text-emerald-400 font-bold">Oxygen Recycling</div>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border-2 border-emerald-500/50 text-center space-y-2">
              <div className="text-4xl">🚜</div>
              <div className="font-arcade text-xs text-white">POLAR DRILLER</div>
              <div className="text-[10px] text-emerald-400 font-bold">Crater Water Ice</div>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border-2 border-emerald-500/50 text-center space-y-2">
              <div className="text-4xl">🌕</div>
              <div className="font-arcade text-xs text-white">LUNAR TOUCHDOWN</div>
              <div className="text-[10px] text-emerald-400 font-bold">Apollo 11 Lander</div>
            </div>

            <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800 text-center space-y-2 opacity-40">
              <div className="text-4xl">⚛️</div>
              <div className="font-arcade text-xs text-slate-500">KILOPOWER CORE</div>
              <div className="text-[10px] text-slate-600">Locked (Level 3)</div>
            </div>

            <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800 text-center space-y-2 opacity-40">
              <div className="text-4xl">🥗</div>
              <div className="font-arcade text-xs text-slate-500">SALAD BIODOME</div>
              <div className="text-[10px] text-slate-600">Locked (Level 5)</div>
            </div>

            <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800 text-center space-y-2 opacity-40">
              <div className="text-4xl">🛡️</div>
              <div className="font-arcade text-xs text-slate-500">REGOLITH SHIELD</div>
              <div className="text-[10px] text-slate-600">Locked (Level 6)</div>
            </div>

            <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800 text-center space-y-2 opacity-40">
              <div className="text-4xl">🏆</div>
              <div className="font-arcade text-xs text-slate-500">GOLD WINGS</div>
              <div className="text-[10px] text-slate-600">Locked (Level 8)</div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default AstronautLockerPage;
