import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audioEffects';
import { speechEngine } from '../../utils/speechEngine';

interface ShackletonSurvivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddXp: (amount: number) => void;
  onUnlockBadge?: (badgeName: string) => void;
}

export const ShackletonSurvivalModal: React.FC<ShackletonSurvivalModalProps> = ({
  isOpen,
  onClose,
  onAddXp,
  onUnlockBadge,
}) => {
  // Survival Game States
  const [gameStatus, setGameStatus] = useState<'DAYLIGHT' | 'SUNSET_WARNING' | 'LUNAR_NIGHT' | 'SURVIVED' | 'FROZEN'>('DAYLIGHT');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30); // 30-sec fast survival challenge
  const [solarOutputKw, setSolarOutputKw] = useState<number>(35);
  const [kilopowerActive, setKilopowerActive] = useState<boolean>(false);
  const [kilopowerOutputKw, setKilopowerOutputKw] = useState<number>(0);
  const [sabatierActive, setSabatierActive] = useState<boolean>(false);
  const [regolithShieldSealed, setRegolithShieldSealed] = useState<boolean>(false);

  // Life Support Gauges (NASA BVAD-2015)
  const [batteryKwh, setBatteryKwh] = useState<number>(180);
  const [oxygenPercent, setOxygenPercent] = useState<number>(98);
  const [habitatTempC, setHabitatTempC] = useState<number>(21);
  const [exteriorTempC, setExteriorTempC] = useState<number>(-50);

  const [capcomCallout, setCapcomCallout] = useState<string>(
    'Houston CapCom: Sunset approaching Shackleton Crater rim! Prepare backup power before solar arrays drop to zero.'
  );

  const speakCapCom = (text: string) => {
    setCapcomCallout(text);
    speechEngine.speak(text, 'HOUSTON_CAPCOM');
  };

  const resetGame = () => {
    setGameStatus('DAYLIGHT');
    setSecondsRemaining(30);
    setSolarOutputKw(35);
    setKilopowerActive(false);
    setKilopowerOutputKw(0);
    setSabatierActive(false);
    setRegolithShieldSealed(false);
    setBatteryKwh(180);
    setOxygenPercent(98);
    setHabitatTempC(21);
    setExteriorTempC(-50);
    soundFx.playPowerUp();
    speakCapCom('Houston CapCom to Flight Cadet: Sun is dipping behind Shackleton rim. You have 30 seconds before 354-hour lunar night falls!');
  };

  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen]);

  // Main Survival Timer & Thermodynamics Loop
  useEffect(() => {
    if (!isOpen || gameStatus === 'SURVIVED' || gameStatus === 'FROZEN') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        const nextSec = prev - 1;

        // Phase transitions
        if (nextSec === 20) {
          setGameStatus('SUNSET_WARNING');
          setSolarOutputKw(15);
          setExteriorTempC(-120);
          soundFx.playWarningAlarm();
          speakCapCom('Solar intensity falling! Arrays at 15 kW. Deploy Kilopower reactor core now!');
        } else if (nextSec === 12) {
          setGameStatus('LUNAR_NIGHT');
          setSolarOutputKw(0);
          setExteriorTempC(-230); // Deep lunar shadow temperature
          soundFx.playAlarm();
          speakCapCom('SUNSET COMPLETE! Solar output is ZERO. Base is running on battery storage! Heat life support or freeze!');
        } else if (nextSec <= 0) {
          // Survived the 354-Hour Lunar Night simulation!
          setGameStatus('SURVIVED');
          soundFx.playVictory();
          confetti({ particleCount: 180, spread: 90 });
          onAddXp(150);
          if (onUnlockBadge) onUnlockBadge('Kilopower Fission Master');
          speakCapCom('Outstanding command, Cadet! Kilopower Stirling core and Sabatier loops maintained nominal crew life support throughout the lunar night!');
          clearInterval(timer);
          return 0;
        }

        return nextSec;
      });

      // Calculate Net Power
      const totalPowerKw = solarOutputKw + (kilopowerActive ? 40 : 0);
      const habitatPowerLoadKw = 22; // heaters + pumps + lights + scrubbers

      // Battery Drainage
      setBatteryKwh((prevBattery) => {
        const delta = totalPowerKw - habitatPowerLoadKw;
        const newBattery = Math.min(200, Math.max(0, prevBattery + delta * 0.3));

        if (newBattery <= 0) {
          setGameStatus('FROZEN');
          soundFx.playExplosion();
          speakCapCom('FATAL TELEMETRY: Battery storage depleted to 0 kWh. Base heaters frozen at -230°C. Mission failed.');
        }
        return Math.round(newBattery);
      });

      // Habitat Temperature
      setHabitatTempC((prevTemp) => {
        if (totalPowerKw >= habitatPowerLoadKw) {
          return 21; // Nominal room temp
        } else {
          // Freezing due to lack of heater power
          const newTemp = prevTemp - 1.5;
          if (newTemp <= -10) {
            setGameStatus('FROZEN');
            soundFx.playExplosion();
            speakCapCom('Habitat temperature breached safety limits! Crew life support offline.');
          }
          return Math.round(newTemp);
        }
      });

      // Oxygen Levels (Sabatier recycling)
      setOxygenPercent((prevO2) => {
        if (sabatierActive) {
          return Math.min(100, prevO2 + 0.2); // Recycled via Sabatier CO2 + 4H2 -> CH4 + 2H2O
        } else {
          return Math.max(0, prevO2 - 0.4); // Depleting human breath
        }
      });

    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, gameStatus, solarOutputKw, kilopowerActive, sabatierActive]);

  if (!isOpen) return null;

  const handleToggleKilopower = () => {
    soundFx.playReactorStart();
    const nextState = !kilopowerActive;
    setKilopowerActive(nextState);
    setKilopowerOutputKw(nextState ? 40 : 0);
    if (nextState) {
      speakCapCom('Kilopower Stirling nuclear reactor online! 40 kW steady electric output engaged.');
    }
  };

  const handleToggleSabatier = () => {
    soundFx.playPowerUp();
    const nextState = !sabatierActive;
    setSabatierActive(nextState);
    if (nextState) {
      speakCapCom('Sabatier catalytic reactor active! Scrubbing CO2 and recycling breath into fresh H2O and O2.');
    }
  };

  const handleToggleShield = () => {
    soundFx.playClick(850);
    setRegolithShieldSealed(!regolithShieldSealed);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="cockpit-panel-amber rounded-3xl max-w-4xl w-full relative overflow-hidden shadow-2xl border-2 border-amber-500/50 space-y-5 p-5 md:p-8 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌑</span>
            <div>
              <div className="text-[10px] font-arcade text-amber-400 tracking-wider">NASA ARTEMIS BASE CAMP · SOUTH POLE</div>
              <h3 className="font-space font-black text-xl md:text-2xl text-white">SHACKLETON BASE: 354-HR LUNAR NIGHT</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Visual Sunset & Status Stage Banner */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${
                gameStatus === 'DAYLIGHT' ? 'bg-emerald-400 animate-ping' :
                gameStatus === 'SUNSET_WARNING' ? 'bg-amber-400 animate-bounce' :
                gameStatus === 'LUNAR_NIGHT' ? 'bg-red-500 animate-pulse' : 'bg-sky-400'
              }`}></span>
              <span className="font-mono-code font-bold text-xs uppercase text-slate-300">
                LUNAR SUNSET CHRONOMETER: <strong className="text-amber-400">{secondsRemaining}s</strong> (SIMULATING 14 EARTH DAYS)
              </span>
            </div>
            
            <h4 className="font-space font-black text-2xl text-white">
              {gameStatus === 'DAYLIGHT' && '☀️ Polar Sunlight (Solar Arrays Nominal)'}
              {gameStatus === 'SUNSET_WARNING' && '🌅 Sunset Imminent Behind Crater Mountain!'}
              {gameStatus === 'LUNAR_NIGHT' && '🌑 354-Hour Lunar Night! Solar at 0 kW!'}
              {gameStatus === 'SURVIVED' && '🎉 Dawn Breaks! Base Survived Polar Night!'}
              {gameStatus === 'FROZEN' && '❄️ Base Freeze Out: Critical Failure!'}
            </h4>
            <p className="text-xs text-slate-400">
              Exterior Shadow Temperature: <strong className="text-sky-300 font-mono-code">{exteriorTempC}°C</strong> · 
              Habitat Interior: <strong className={habitatTempC >= 18 ? 'text-emerald-400 font-mono-code' : 'text-red-400 font-mono-code'}>{habitatTempC}°C</strong>
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center gap-6 font-mono-code text-xs">
            <div>
              <div className="text-[10px] text-slate-400">NET POWER</div>
              <div className={`text-lg font-black ${solarOutputKw + kilopowerOutputKw >= 22 ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                {solarOutputKw + kilopowerOutputKw} kW <span className="text-[10px] text-slate-400">(Load: 22 kW)</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">BATTERY RESERVE</div>
              <div className="text-lg font-black text-amber-400">{batteryKwh} / 200 kWh</div>
            </div>
          </div>
        </div>

        {/* Life Support Telemetry Gauges (NASA BVAD-2015) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Battery Storage Bar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>🔋 BATTERY LIFE</span>
              <span className="text-amber-400 font-mono-code">{batteryKwh} kWh</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${batteryKwh > 50 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-red-500 animate-pulse'}`}
                style={{ width: `${(batteryKwh / 200) * 100}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400">Required for life-support pumps &amp; heaters</div>
          </div>

          {/* Oxygen Reserve (BVAD) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>💨 O2 PURITY (BVAD)</span>
              <span className="text-emerald-400 font-mono-code">{oxygenPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${oxygenPercent}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400">0.84 kg O2 / human / sol metabolic baseline</div>
          </div>

          {/* Habitat Interior Temperature */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>🌡️ HABITAT TEMP</span>
              <span className={habitatTempC >= 18 ? 'text-emerald-400 font-mono-code' : 'text-red-400 font-mono-code'}>
                {habitatTempC}°C
              </span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${habitatTempC >= 18 ? 'bg-emerald-400' : 'bg-red-500'}`}
                style={{ width: `${Math.max(5, (habitatTempC + 10) * 3)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400">Minimum survival threshold: +15°C</div>
          </div>

        </div>

        {/* Houston CapCom Radio Advice */}
        <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-sky-500/30 flex items-center gap-3 text-xs">
          <span className="text-xl">🎙️</span>
          <div>
            <span className="text-[10px] font-mono-code font-bold text-sky-400 uppercase tracking-wider block">
              HOUSTON CAPCOM TACTICAL LIFE-SUPPORT FEED
            </span>
            <p className="text-slate-200 font-medium">{capcomCallout}</p>
          </div>
        </div>

        {/* Interactive Engineering Switchboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Switch 1: Kilopower Reactor */}
          <div className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
            kilopowerActive ? 'bg-emerald-950/40 border-emerald-400/80 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-space font-bold text-white text-sm">⚛️ Kilopower Nuclear Reactor</h5>
                <p className="text-[11px] text-slate-400">KRUSTY Stirling fission core. 40 kW continuous day/night output.</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${kilopowerActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {kilopowerActive ? 'ONLINE (+40 kW)' : 'OFFLINE'}
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleToggleKilopower}
              className={`w-full py-3 rounded-xl font-arcade text-xs transition-all ${
                kilopowerActive ? 'btn-arcade-emerald' : 'btn-arcade-gold'
              }`}
            >
              {kilopowerActive ? 'REACTOR CORE ACTIVE [ONLINE]' : '⚡ DEPLOY KILOPOWER CORE (+40 kW)'}
            </button>
          </div>

          {/* Switch 2: Sabatier Reactor */}
          <div className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
            sabatierActive ? 'bg-sky-950/40 border-sky-400/80 shadow-lg shadow-sky-500/20' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-space font-bold text-white text-sm">🧪 Sabatier CO2 Scrubber</h5>
                <p className="text-[11px] text-slate-400">Recovers O2 and water via CO2 + 4H2 -&gt; CH4 + 2H2O reaction.</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sabatierActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-500'}`}>
                {sabatierActive ? 'RECYCLING (98%)' : 'STANDBY'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleSabatier}
              className={`w-full py-3 rounded-xl font-arcade text-xs transition-all ${
                sabatierActive ? 'btn-arcade-cyan' : 'btn-arcade-gold'
              }`}
            >
              {sabatierActive ? 'SABATIER ACTIVE [RECYCLING]' : '💨 ACTIVATE SABATIER SCRUBBER'}
            </button>
          </div>

          {/* Switch 3: Sintered Regolith Shield */}
          <div className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
            regolithShieldSealed ? 'bg-purple-950/40 border-purple-400/80' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-space font-bold text-white text-sm">🛡️ Regolith Vault Shield</h5>
                <p className="text-[11px] text-slate-400">1.5m sintered lunar soil blocks against cosmic radiation &amp; cold.</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${regolithShieldSealed ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                {regolithShieldSealed ? 'SEALED (100%)' : 'OPEN'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleShield}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-arcade text-xs transition-all"
            >
              {regolithShieldSealed ? 'VAULT SEALED [SAFE]' : '🔒 SEAL REGOLITH SHIELD VAULT'}
            </button>
          </div>

        </div>

        {/* Victory Modal Overlay */}
        {gameStatus === 'SURVIVED' && (
          <div className="bg-emerald-950/90 border border-emerald-500/50 p-6 rounded-2xl text-center space-y-3">
            <div className="text-4xl animate-bounce">🏆</div>
            <h3 className="font-arcade text-2xl text-emerald-400">EXPEDITION SURVIVED THE POLAR NIGHT!</h3>
            <p className="text-xs text-slate-200 max-w-lg mx-auto">
              NASA Science Verified: By engaging Kilopower nuclear Stirling fission, you supplied 40 kW of clean heat and power through 354 hours of freezing -230°C darkness!
            </p>
            <div className="inline-block bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full font-bold text-xs border border-emerald-400/40">
              🏅 Unlocked Badge: Kilopower Fission Master (+150 Space XP)
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-arcade-emerald px-8 py-3 rounded-xl font-arcade text-xs"
              >
                RETURN TO CADET ROSTER ▶
              </button>
            </div>
          </div>
        )}

        {/* Failure Telemetry Overlay */}
        {gameStatus === 'FROZEN' && (
          <div className="bg-red-950/95 border border-red-500/50 p-6 rounded-2xl text-center space-y-3">
            <div className="text-4xl animate-bounce">❄️</div>
            <h3 className="font-space font-black text-xl text-red-400">BASE CRITICAL TELEMETRY: LIFE SUPPORT LOST</h3>
            <p className="text-xs text-slate-200 max-w-lg mx-auto font-mono-code bg-slate-900/90 p-4 rounded-xl border border-red-500/30 text-left">
              NASA Post-Mortem Analysis: The lunar South Pole experiences 14 continuous Earth days of total darkness where solar panels produce 0 kW. Without activating the Kilopower reactor before sundown, base heaters exhausted battery reserves.
            </p>
            <button
              type="button"
              onClick={resetGame}
              className="btn-arcade-gold px-8 py-3 rounded-xl font-arcade text-xs"
            >
              RE-ATTEMPT SURVIVAL PROTOCOL 🔄
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ShackletonSurvivalModal;

