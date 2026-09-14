import React from 'react';
import { AircraftSpecs, AircraftSystemsState, FlightTelemetry } from '../types';

interface EICASProps {
  telemetry: FlightTelemetry;
  systems: AircraftSystemsState;
  specs: AircraftSpecs;
}

export const GlassCockpitEICAS: React.FC<EICASProps> = ({ telemetry, systems, specs }) => {
  const n1Left = systems.engine1N1;
  const n1Right = systems.engine2N1;
  const egtLeft = systems.engine1EGT;
  const egtRight = systems.engine2EGT;

  // Active flap stage
  const flapStages = specs?.flapStages || [
    { degrees: 0, name: 'UP', maxSpeedKts: 340, liftFactor: 1.0, dragFactor: 1.0 },
  ];
  const currentFlap = flapStages[systems.flapsIndex] || flapStages[0];

  return (
    <div className="relative w-64 h-64 bg-black rounded-lg border border-neutral-700 overflow-hidden shadow-2xl select-none font-mono text-xs flex flex-col justify-between p-2">
      {/* 1. TOP HEADER & FUEL */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1 text-[10px] font-bold">
        <span className="text-cyan-400">ENGINE STATUS</span>
        <span className="text-neutral-400">
          FUEL: <span className="text-emerald-400 font-mono">{Math.round(telemetry.fuelKg)} KG</span>
        </span>
      </div>

      {/* 2. DUAL ENGINE N1 GAUGES */}
      <div className="grid grid-cols-2 gap-2 my-1">
        {/* Engine 1 (Left) */}
        <div className="bg-neutral-950 p-1.5 rounded border border-neutral-800 flex flex-col items-center">
          <span className="text-[9px] text-neutral-400 font-bold">ENG 1 N1 %</span>
          <div className="relative w-14 h-14 flex items-center justify-center my-0.5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={n1Left > 95 ? "text-amber-500" : "text-emerald-400"}
                strokeDasharray={`${Math.min(100, n1Left)}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">
              {n1Left.toFixed(1)}
            </span>
          </div>
          <span className="text-[9px] text-neutral-400">EGT: <span className="text-neutral-200">{Math.round(egtLeft)}°C</span></span>
        </div>

        {/* Engine 2 (Right) */}
        <div className="bg-neutral-950 p-1.5 rounded border border-neutral-800 flex flex-col items-center">
          <span className="text-[9px] text-neutral-400 font-bold">ENG 2 N1 %</span>
          <div className="relative w-14 h-14 flex items-center justify-center my-0.5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={n1Right > 95 ? "text-amber-500" : "text-emerald-400"}
                strokeDasharray={`${Math.min(100, n1Right)}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">
              {n1Right.toFixed(1)}
            </span>
          </div>
          <span className="text-[9px] text-neutral-400">EGT: <span className="text-neutral-200">{Math.round(egtRight)}°C</span></span>
        </div>
      </div>

      {/* 3. AIRCRAFT CONFIGURATION STATUS (Gear, Flaps, Spoilers, Brakes) */}
      <div className="bg-neutral-950 p-1.5 rounded border border-neutral-800 text-[10px] space-y-1">
        {/* Landing Gear indicator lights */}
        <div className="flex items-center justify-between">
          <span className="text-neutral-400">GEAR:</span>
          <div className="flex gap-1.5 font-bold">
            <span className={`px-1 rounded ${systems.gearDown ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-neutral-900 text-neutral-500'}`}>
              NOSE
            </span>
            <span className={`px-1 rounded ${systems.gearDown ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-neutral-900 text-neutral-500'}`}>
              L MAIN
            </span>
            <span className={`px-1 rounded ${systems.gearDown ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-neutral-900 text-neutral-500'}`}>
              R MAIN
            </span>
          </div>
        </div>

        {/* Flaps & Spoilers */}
        <div className="flex items-center justify-between">
          <span className="text-neutral-400">FLAPS:</span>
          <span className="text-cyan-400 font-bold bg-cyan-950/40 px-1 rounded border border-cyan-800">
            {currentFlap.name} ({currentFlap.degrees}°)
          </span>
          <span className="text-neutral-400">SPOILERS:</span>
          <span className={`font-bold ${systems.spoilersExtended ? 'text-amber-400' : systems.spoilersArmed ? 'text-emerald-400' : 'text-neutral-500'}`}>
            {systems.spoilersExtended ? 'EXT' : systems.spoilersArmed ? 'ARMED' : 'RET'}
          </span>
        </div>

        {/* Brakes & Reverse */}
        <div className="flex items-center justify-between">
          <span className="text-neutral-400">BRAKES:</span>
          <span className={`font-bold ${systems.parkingBrake ? 'text-red-400 bg-red-950/50 px-1 rounded border border-red-800' : 'text-neutral-300'}`}>
            {systems.parkingBrake ? 'PARK SET' : `AUTO: ${systems.autobrake}`}
          </span>
          {systems.reverseThrust && (
            <span className="text-amber-400 font-bold bg-amber-950/50 px-1 rounded border border-amber-800 animate-pulse">
              REV THRUST
            </span>
          )}
        </div>
      </div>

      {/* 4. CREW ALERTING SYSTEM (CAS / EICAS Alerts) */}
      <div className="h-6 flex items-center justify-between text-[10px] font-bold">
        {systems.parkingBrake && (
          <span className="text-red-500 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800">
            PARK BRAKE ON
          </span>
        )}
        {!systems.battery && (
          <span className="text-amber-500 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800">
            ELEC BATT OFF
          </span>
        )}
        {telemetry.fuelKg < 2000 && (
          <span className="text-amber-500 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800 animate-pulse">
            LOW FUEL
          </span>
        )}
      </div>
    </div>
  );
};
