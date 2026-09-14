import React from 'react';
import { AutopilotState } from '../types';
import { soundEngine } from '../simulation/audio';

interface MCPProps {
  autopilot: AutopilotState;
  setAutopilot: React.Dispatch<React.SetStateAction<AutopilotState>>;
}

export const AutopilotPanel: React.FC<MCPProps> = ({ autopilot, setAutopilot }) => {
  const toggleAP = () => {
    soundEngine.playClick();
    if (autopilot.engaged) {
      soundEngine.playChime('WARNING'); // Disconnect cavalry charge
    } else {
      soundEngine.playChime('ALTITUDE');
    }
    setAutopilot((prev) => ({
      ...prev,
      engaged: !prev.engaged,
      headingHold: !prev.engaged ? true : prev.headingHold,
      altitudeHold: !prev.engaged ? true : prev.altitudeHold,
    }));
  };

  const toggleAT = () => {
    soundEngine.playClick();
    setAutopilot((prev) => ({ ...prev, autoThrottle: !prev.autoThrottle }));
  };

  const toggleFD = () => {
    soundEngine.playClick();
    setAutopilot((prev) => ({ ...prev, flightDirector: !prev.flightDirector }));
  };

  const toggleHDG = () => {
    soundEngine.playClick();
    setAutopilot((prev) => ({ ...prev, headingHold: !prev.headingHold }));
  };

  const toggleALT = () => {
    soundEngine.playClick();
    setAutopilot((prev) => ({ ...prev, altitudeHold: !prev.altitudeHold, verticalSpeedHold: false }));
  };

  const toggleVS = () => {
    soundEngine.playClick();
    setAutopilot((prev) => ({ ...prev, verticalSpeedHold: !prev.verticalSpeedHold, altitudeHold: true }));
  };

  const toggleAPP = () => {
    soundEngine.playClick();
    setAutopilot((prev) => ({
      ...prev,
      approachMode: !prev.approachMode,
      glideslopeCaptured: !prev.approachMode,
      localizerCaptured: !prev.approachMode,
    }));
  };

  return (
    <div className="bg-neutral-900/95 border border-neutral-700 rounded-lg p-2.5 shadow-2xl select-none font-mono text-xs backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-2">
        <span className="text-[11px] font-bold text-neutral-300 tracking-wider">AFDS / MODE CONTROL PANEL</span>
        <div className="flex gap-2">
          {/* Flight Director */}
          <button
            onClick={toggleFD}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              autopilot.flightDirector ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-600'
            }`}
          >
            F/D
          </button>
          {/* Autopilot Master */}
          <button
            onClick={toggleAP}
            className={`px-3 py-0.5 rounded text-[11px] font-bold border transition-colors ${
              autopilot.engaged ? 'bg-emerald-500 text-black border-emerald-300 shadow-lg shadow-emerald-900/50' : 'bg-neutral-800 text-neutral-300 border-neutral-600'
            }`}
          >
            CMD AP 1
          </button>
        </div>
      </div>

      {/* CONTROL DIALS & BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. SPEED / AUTO-THROTTLE */}
        <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] text-neutral-400 font-bold">IAS / MACH</span>
            <button
              onClick={toggleAT}
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                autopilot.autoThrottle ? 'bg-amber-600 text-white border-amber-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              A/T
            </button>
          </div>
          <div className="text-base font-bold text-cyan-400 my-0.5">
            {autopilot.targetSpeedKts} <span className="text-[10px] text-neutral-400">KTS</span>
          </div>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => setAutopilot((p) => ({ ...p, targetSpeedKts: Math.max(120, p.targetSpeedKts - 5) }))}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] border border-neutral-700"
            >
              -5
            </button>
            <button
              onClick={() => setAutopilot((p) => ({ ...p, targetSpeedKts: Math.min(350, p.targetSpeedKts + 5) }))}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] border border-neutral-700"
            >
              +5
            </button>
          </div>
        </div>

        {/* 2. HEADING */}
        <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] text-neutral-400 font-bold">HEADING</span>
            <button
              onClick={toggleHDG}
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                autopilot.headingHold ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              HDG SEL
            </button>
          </div>
          <div className="text-base font-bold text-white my-0.5">
            {autopilot.targetHeadingDeg.toString().padStart(3, '0')}°
          </div>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => setAutopilot((p) => ({ ...p, targetHeadingDeg: (p.targetHeadingDeg - 10 + 360) % 360 }))}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] border border-neutral-700"
            >
              -10°
            </button>
            <button
              onClick={() => setAutopilot((p) => ({ ...p, targetHeadingDeg: (p.targetHeadingDeg + 10) % 360 }))}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] border border-neutral-700"
            >
              +10°
            </button>
          </div>
        </div>

        {/* 3. ALTITUDE */}
        <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] text-neutral-400 font-bold">ALTITUDE</span>
            <button
              onClick={toggleALT}
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                autopilot.altitudeHold ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              ALT HLD
            </button>
          </div>
          <div className="text-base font-bold text-emerald-400 my-0.5">
            {autopilot.targetAltitudeFt} <span className="text-[10px] text-neutral-400">FT</span>
          </div>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => setAutopilot((p) => ({ ...p, targetAltitudeFt: Math.max(1000, p.targetAltitudeFt - 1000) }))}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] border border-neutral-700"
            >
              -1K
            </button>
            <button
              onClick={() => setAutopilot((p) => ({ ...p, targetAltitudeFt: Math.min(41000, p.targetAltitudeFt + 1000) }))}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] border border-neutral-700"
            >
              +1K
            </button>
          </div>
        </div>

        {/* 4. VERTICAL SPEED & APPROACH */}
        <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] text-neutral-400 font-bold">V/S & APP</span>
            <button
              onClick={toggleAPP}
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                autopilot.approachMode ? 'bg-fuchsia-600 text-white border-fuchsia-400 animate-pulse' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              APP ILS
            </button>
          </div>
          <div className="text-base font-bold text-white my-0.5">
            {autopilot.targetVerticalSpeedFpm > 0 ? `+${autopilot.targetVerticalSpeedFpm}` : autopilot.targetVerticalSpeedFpm} <span className="text-[10px] text-neutral-400">FPM</span>
          </div>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => setAutopilot((p) => ({ ...p, verticalSpeedHold: true, targetVerticalSpeedFpm: p.targetVerticalSpeedFpm - 200 }))}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] border border-neutral-700"
            >
              -200
            </button>
            <button
              onClick={() => setAutopilot((p) => ({ ...p, verticalSpeedHold: true, targetVerticalSpeedFpm: p.targetVerticalSpeedFpm + 200 }))}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[10px] border border-neutral-700"
            >
              +200
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
