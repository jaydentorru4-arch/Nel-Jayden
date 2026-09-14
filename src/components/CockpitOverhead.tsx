import React from 'react';
import { AircraftSystemsState } from '../types';
import { soundEngine } from '../simulation/audio';

interface OverheadProps {
  systems: AircraftSystemsState;
  setSystems: React.Dispatch<React.SetStateAction<AircraftSystemsState>>;
  onClose: () => void;
}

export const CockpitOverhead: React.FC<OverheadProps> = ({ systems, setSystems, onClose }) => {
  const toggleSwitch = (key: keyof AircraftSystemsState) => {
    soundEngine.playClick();
    setSystems((prev) => {
      const nextVal = !prev[key];
      if (key === 'seatbeltSigns') {
        soundEngine.playChime('SEATBELT');
      }
      return {
        ...prev,
        [key]: nextVal,
      };
    });
  };

  const startEngine = (engNum: 1 | 2) => {
    soundEngine.playClick();
    setSystems((prev) => {
      const is1 = engNum === 1;
      const key = is1 ? 'engine1Running' : 'engine2Running';
      return {
        ...prev,
        [key]: !prev[key],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-neutral-900 border-2 border-neutral-700 rounded-xl max-w-2xl w-full p-4 shadow-2xl font-mono text-xs flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-neutral-100 tracking-wider">AIRCRAFT OVERHEAD SYSTEMS PANEL</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-bold border border-neutral-600 transition-colors"
          >
            CLOSE [X]
          </button>
        </div>

        {/* PANELS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. ELECTRICAL & APU */}
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-3">
            <span className="text-[11px] font-bold text-cyan-400 block border-b border-neutral-800 pb-1">
              ELECTRICAL & APU
            </span>
            {/* Battery */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">MASTER BATTERY</span>
              <button
                onClick={() => toggleSwitch('battery')}
                className={`px-3 py-1 rounded font-bold border transition-colors ${
                  systems.battery ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {systems.battery ? 'ON' : 'OFF'}
              </button>
            </div>
            {/* APU Master */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">APU MASTER</span>
              <button
                onClick={() => toggleSwitch('apuMaster')}
                className={`px-3 py-1 rounded font-bold border transition-colors ${
                  systems.apuMaster ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {systems.apuMaster ? 'RUN' : 'OFF'}
              </button>
            </div>
            {/* APU Bleed Air */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">APU BLEED AIR</span>
              <button
                onClick={() => toggleSwitch('apuBleed')}
                className={`px-3 py-1 rounded font-bold border transition-colors ${
                  systems.apuBleed ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {systems.apuBleed ? 'ON' : 'OFF'}
              </button>
            </div>
            {/* Avionics */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">AVIONICS POWER</span>
              <button
                onClick={() => toggleSwitch('avionics')}
                className={`px-3 py-1 rounded font-bold border transition-colors ${
                  systems.avionics ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {systems.avionics ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 2. ENGINES & HYDRAULICS */}
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-3">
            <span className="text-[11px] font-bold text-amber-400 block border-b border-neutral-800 pb-1">
              ENGINES & FUEL
            </span>
            {/* Engine 1 Start */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">ENG 1 START</span>
              <button
                onClick={() => startEngine(1)}
                className={`px-3 py-1 rounded font-bold border transition-colors ${
                  systems.engine1Running ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {systems.engine1Running ? 'RUNNING' : 'START'}
              </button>
            </div>
            {/* Engine 2 Start */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">ENG 2 START</span>
              <button
                onClick={() => startEngine(2)}
                className={`px-3 py-1 rounded font-bold border transition-colors ${
                  systems.engine2Running ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {systems.engine2Running ? 'RUNNING' : 'START'}
              </button>
            </div>
            {/* Fuel Pumps */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">FUEL PUMPS</span>
              <button
                onClick={() => toggleSwitch('fuelPumps')}
                className={`px-3 py-1 rounded font-bold border transition-colors ${
                  systems.fuelPumps ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {systems.fuelPumps ? 'ON' : 'OFF'}
              </button>
            </div>
            {/* Hydraulic Pumps */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">HYD PUMPS</span>
              <button
                onClick={() => toggleSwitch('hydraulics')}
                className={`px-3 py-1 rounded font-bold border transition-colors ${
                  systems.hydraulics ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {systems.hydraulics ? 'AUTO' : 'OFF'}
              </button>
            </div>
          </div>

          {/* 3. EXTERIOR LIGHTING & CABIN */}
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-3">
            <span className="text-[11px] font-bold text-emerald-400 block border-b border-neutral-800 pb-1">
              LIGHTING & CABIN
            </span>
            {/* Nav Lights */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">NAV LIGHTS</span>
              <button
                onClick={() => toggleSwitch('navLights')}
                className={`px-3 py-1 rounded font-bold border ${systems.navLights ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {systems.navLights ? 'ON' : 'OFF'}
              </button>
            </div>
            {/* Beacon */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">BEACON LIGHTS</span>
              <button
                onClick={() => toggleSwitch('beaconLights')}
                className={`px-3 py-1 rounded font-bold border ${systems.beaconLights ? 'bg-red-600 text-white border-red-400 animate-pulse' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {systems.beaconLights ? 'ON' : 'OFF'}
              </button>
            </div>
            {/* Strobes */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">STROBE LIGHTS</span>
              <button
                onClick={() => toggleSwitch('strobeLights')}
                className={`px-3 py-1 rounded font-bold border ${systems.strobeLights ? 'bg-white text-black font-extrabold border-neutral-300' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {systems.strobeLights ? 'ON' : 'OFF'}
              </button>
            </div>
            {/* Landing Lights */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">LANDING LIGHTS</span>
              <button
                onClick={() => toggleSwitch('landingLights')}
                className={`px-3 py-1 rounded font-bold border ${systems.landingLights ? 'bg-amber-400 text-black font-extrabold border-amber-300' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {systems.landingLights ? 'ON' : 'OFF'}
              </button>
            </div>
            {/* Seatbelt Sign */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">SEATBELT SIGN</span>
              <button
                onClick={() => toggleSwitch('seatbeltSigns')}
                className={`px-3 py-1 rounded font-bold border ${systems.seatbeltSigns ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {systems.seatbeltSigns ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Start Helper Button */}
        <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
          <span className="text-neutral-400">Want to get flying immediately?</span>
          <button
            onClick={() => {
              soundEngine.playClick();
              setSystems((prev) => ({
                ...prev,
                battery: true,
                apuMaster: true,
                apuRunning: true,
                apuBleed: true,
                fuelPumps: true,
                hydraulics: true,
                avionics: true,
                engine1Running: true,
                engine2Running: true,
                navLights: true,
                beaconLights: true,
                strobeLights: true,
                taxiLights: true,
                landingLights: true,
                seatbeltSigns: true,
                parkingBrake: false,
              }));
              onClose();
            }}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow transition-colors"
          >
            AUTO-START ALL SYSTEMS
          </button>
        </div>
      </div>
    </div>
  );
};
