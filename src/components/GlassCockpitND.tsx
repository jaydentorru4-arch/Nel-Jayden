import React, { useState } from 'react';
import { AirportRunway, AutopilotState, FlightPlan, FlightTelemetry } from '../types';

interface NDProps {
  telemetry: FlightTelemetry;
  autopilot: AutopilotState;
  flightPlan?: FlightPlan;
  activeRunway?: AirportRunway;
}

export const GlassCockpitND: React.FC<NDProps> = ({ telemetry, autopilot, flightPlan, activeRunway }) => {
  const [rangeNm, setRangeNm] = useState<number>(20);
  const heading = telemetry.headingDeg;
  const targetHdg = autopilot.targetHeadingDeg;

  // Next waypoint info
  const nextWp = flightPlan?.waypoints[flightPlan.currentWaypointIndex] || { name: 'DEST', x: 0, z: 0, altFt: 0 };
  const dx = nextWp.x - telemetry.position.x;
  const dz = nextWp.z - telemetry.position.z;
  const distMeters = Math.sqrt(dx * dx + dz * dz);
  const distNm = (distMeters / 1852).toFixed(1);

  // Compass tick marks
  const cardinals = [
    { deg: 0, label: 'N' },
    { deg: 30, label: '03' },
    { deg: 60, label: '06' },
    { deg: 90, label: 'E' },
    { deg: 120, label: '12' },
    { deg: 150, label: '15' },
    { deg: 180, label: 'S' },
    { deg: 210, label: '21' },
    { deg: 240, label: '24' },
    { deg: 270, label: 'W' },
    { deg: 300, label: '30' },
    { deg: 330, label: '33' },
  ];

  return (
    <div className="relative w-64 h-64 bg-black rounded-lg border border-neutral-700 overflow-hidden shadow-2xl select-none font-mono text-xs flex flex-col justify-between">
      {/* 1. TOP STATUS BAR */}
      <div className="h-7 bg-neutral-950/95 border-b border-neutral-800 px-2 flex items-center justify-between text-[11px] font-bold z-30">
        <div className="flex gap-2">
          <span className="text-neutral-400">GS <span className="text-white">{Math.round(telemetry.groundSpeedKts)}</span></span>
          <span className="text-neutral-400">TAS <span className="text-white">{Math.round(telemetry.trueAirspeedKts)}</span></span>
        </div>
        <div className="flex items-center gap-1 text-cyan-400">
          <span>{nextWp.name}</span>
          <span className="text-white">{distNm}NM</span>
        </div>
        {/* Range button */}
        <button
          onClick={() => setRangeNm((prev) => (prev === 10 ? 20 : prev === 20 ? 40 : 10))}
          className="text-[10px] px-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-600"
        >
          {rangeNm}NM
        </button>
      </div>

      {/* 2. ROTATING NAVIGATION COMPASS ARC */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Radar range distance rings */}
        <div className="absolute w-44 h-44 rounded-full border border-dashed border-neutral-800 pointer-events-none"></div>
        <div className="absolute w-28 h-28 rounded-full border border-dashed border-neutral-800 pointer-events-none"></div>

        {/* Center Aircraft Symbol */}
        <div className="absolute z-20 flex flex-col items-center pointer-events-none">
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-yellow-400"></div>
          <div className="w-3 h-0.5 bg-yellow-400 mt-0.5"></div>
        </div>

        {/* Rotating Compass Circle */}
        <div
          className="relative w-52 h-52 rounded-full border-2 border-neutral-600 flex items-center justify-center transition-transform duration-75"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* Degree ticks and labels */}
          {cardinals.map((c) => (
            <div
              key={`cardinal-${c.deg}`}
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col justify-between items-center pointer-events-none py-1"
              style={{ transform: `rotate(${c.deg}deg)` }}
            >
              <span
                className={`text-[9px] font-bold ${c.label === 'N' ? 'text-red-500' : 'text-neutral-300'}`}
                style={{ transform: `rotate(${-c.deg}deg)` }}
              >
                {c.label}
              </span>
              <div className="w-[1px] h-2 bg-neutral-500"></div>
            </div>
          ))}

          {/* Autopilot Heading Bug (Magenta triangle) */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col justify-start items-center pointer-events-none"
            style={{ transform: `rotate(${targetHdg}deg)` }}
          >
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-fuchsia-500 -mt-1"></div>
          </div>

          {/* Runway Symbol alignment line */}
          {activeRunway && (
            <div
              className="absolute w-1.5 h-16 bg-white/70 border border-neutral-900 rounded-sm"
              style={{
                transform: `rotate(${activeRunway.heading}deg) translateY(-24px)`,
              }}
            ></div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM CURRENT HEADING READOUT */}
      <div className="h-6 bg-neutral-950/95 border-t border-neutral-800 px-2 flex items-center justify-between text-[10px] z-30 font-semibold">
        <span className="text-neutral-400">TRK <span className="text-emerald-400 font-bold">{Math.round(heading).toString().padStart(3, '0')}°</span></span>
        <span className="text-neutral-400">MAG</span>
        <span className="text-neutral-400">HDG BUG <span className="text-fuchsia-400 font-bold">{Math.round(targetHdg).toString().padStart(3, '0')}°</span></span>
      </div>
    </div>
  );
};
