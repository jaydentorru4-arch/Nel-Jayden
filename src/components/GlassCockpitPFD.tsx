import React from 'react';
import { AircraftSpecs, AutopilotState, FlightTelemetry } from '../types';

interface PFDProps {
  telemetry: FlightTelemetry;
  autopilot: AutopilotState;
  specs: AircraftSpecs;
}

export const GlassCockpitPFD: React.FC<PFDProps> = ({ telemetry, autopilot, specs }) => {
  const pitch = Number.isFinite(telemetry.pitchDeg) ? telemetry.pitchDeg : 0;
  const roll = Number.isFinite(telemetry.rollDeg) ? telemetry.rollDeg : 0;
  const speed = Number.isFinite(telemetry.indicatedAirspeedKts) ? telemetry.indicatedAirspeedKts : 0;
  const altitude = Number.isFinite(telemetry.altitudeFt) ? telemetry.altitudeFt : 0;
  const vs = Number.isFinite(telemetry.verticalSpeedFpm) ? telemetry.verticalSpeedFpm : 0;
  const radioAlt = Number.isFinite(telemetry.radioAltitudeFt) ? telemetry.radioAltitudeFt : 0;

  // Horizon translation: 1 degree pitch = 4 pixels
  const pitchPx = pitch * 4;

  // Speed tape: 1 knot = 3.5 pixels
  const speedPx = speed * 3.5;

  // Altitude tape: 1 foot = 0.35 pixels
  const altPx = altitude * 0.35;

  // VSI needle: clamp between -3000 and +3000 fpm
  const vsiPx = Math.max(-75, Math.min(75, (vs / 3000) * 75));

  return (
    <div className="relative w-64 h-64 bg-black rounded-lg border border-neutral-700 overflow-hidden shadow-2xl select-none font-mono text-xs">
      {/* 1. ARTIFICIAL HORIZON (Pitch & Roll) */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
        style={{
          transform: `rotate(${-roll}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="relative w-[380px] h-[700px] transition-transform duration-75"
          style={{
            transform: `translateY(${pitchPx}px)`,
          }}
        >
          {/* Sky (Blue) */}
          <div className="w-full h-[350px] bg-sky-600 relative overflow-hidden">
            {/* Pitch ladder positive lines */}
            {[5, 10, 15, 20, 25, 30].map((deg) => (
              <div
                key={`pitch-pos-${deg}`}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold text-white"
                style={{ bottom: `${deg * 4}px` }}
              >
                <span>{deg}</span>
                <div className="w-14 h-[2px] bg-white"></div>
                <span>{deg}</span>
              </div>
            ))}
          </div>

          {/* Horizon Line (White) */}
          <div className="w-full h-[2px] bg-white shadow-sm"></div>

          {/* Ground (Brown/Tan) */}
          <div className="w-full h-[350px] bg-amber-900 relative overflow-hidden">
            {/* Pitch ladder negative lines */}
            {[-5, -10, -15, -20, -25, -30].map((deg) => (
              <div
                key={`pitch-neg-${deg}`}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold text-amber-200"
                style={{ top: `${Math.abs(deg) * 4}px` }}
              >
                <span>{Math.abs(deg)}</span>
                <div className="w-14 h-[2px] border-b-2 border-dashed border-amber-200"></div>
                <span>{Math.abs(deg)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. FIXED AIRCRAFT SYMBOL (Miniature wings in center) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="relative flex items-center">
          {/* Left wing reticle */}
          <div className="w-7 h-2 bg-yellow-400 border border-black shadow"></div>
          {/* Center dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black mx-4"></div>
          {/* Right wing reticle */}
          <div className="w-7 h-2 bg-yellow-400 border border-black shadow"></div>
        </div>

        {/* Flight Director Crosshair (Magenta) */}
        {autopilot.flightDirector && (
          <div className="absolute flex items-center justify-center">
            <div className="w-24 h-[2px] bg-fuchsia-500 shadow-sm"></div>
            <div className="absolute w-[2px] h-20 bg-fuchsia-500 shadow-sm"></div>
          </div>
        )}
      </div>

      {/* 3. ROLL SCALE ARC & POINTER */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        {/* Roll triangle indicator */}
        <div
          className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[9px] border-b-yellow-400 transition-transform duration-75"
          style={{ transform: `rotate(${roll}deg)`, transformOrigin: 'center 32px' }}
        ></div>
      </div>

      {/* 4. SPEED TAPE (Left) */}
      <div className="absolute left-0 top-6 bottom-6 w-14 bg-neutral-900/90 border-r border-neutral-700 z-30 overflow-hidden flex flex-col justify-center">
        <div
          className="relative h-full transition-transform duration-75"
          style={{ transform: `translateY(${speedPx % 35}px)` }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const baseSpd = Math.max(0, Math.round(speed / 10) * 10 - 40 + i * 10);
            return (
              <div
                key={`spd-idx-${i}-${baseSpd}`}
                className="absolute right-1 flex items-center gap-1.5 text-[11px] font-semibold text-neutral-300"
                style={{ top: `${(i * 35)}px` }}
              >
                <span>{baseSpd}</span>
                <div className="w-2.5 h-[1px] bg-neutral-400"></div>
              </div>
            );
          })}
        </div>

        {/* Current Speed Black/Cyan Box */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-7 bg-neutral-950 border-y-2 border-r-2 border-cyan-400 flex items-center justify-end px-1.5 shadow-md">
          <span className="text-sm font-bold text-cyan-400 tracking-wider">
            {Math.round(speed)}
          </span>
        </div>

        {/* Target Speed Bug (Magenta) */}
        {autopilot.autoThrottle && (
          <div
            className="absolute right-0 w-3 h-3 bg-fuchsia-500 border border-black transition-all"
            style={{
              top: `${Math.max(10, Math.min(180, 100 - (autopilot.targetSpeedKts - speed) * 3.5))}px`,
            }}
          ></div>
        )}
      </div>

      {/* 5. ALTITUDE TAPE (Right) */}
      <div className="absolute right-7 top-6 bottom-6 w-16 bg-neutral-900/90 border-l border-neutral-700 z-30 overflow-hidden flex flex-col justify-center">
        <div
          className="relative h-full transition-transform duration-75"
          style={{ transform: `translateY(${altPx % 35}px)` }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const baseAlt = Math.max(0, Math.round(altitude / 100) * 100 - 400 + i * 100);
            return (
              <div
                key={`alt-idx-${i}-${baseAlt}`}
                className="absolute left-1 flex items-center gap-1.5 text-[10px] font-semibold text-neutral-300"
                style={{ top: `${(i * 35)}px` }}
              >
                <div className="w-2.5 h-[1px] bg-neutral-400"></div>
                <span>{baseAlt}</span>
              </div>
            );
          })}
        </div>

        {/* Current Altitude Box */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-7 bg-neutral-950 border-y-2 border-l-2 border-emerald-400 flex items-center px-1 shadow-md">
          <span className="text-xs font-bold text-emerald-400 tracking-wider">
            {Math.round(altitude)}
          </span>
        </div>
      </div>

      {/* 6. VERTICAL SPEED INDICATOR (Far Right Bar) */}
      <div className="absolute right-0 top-6 bottom-6 w-7 bg-neutral-950/95 border-l border-neutral-800 z-30 flex items-center justify-center">
        <div className="relative h-44 w-full flex items-center justify-center">
          {/* Center 0 mark */}
          <div className="w-full h-[1px] bg-neutral-500"></div>
          {/* +1, +2, -1, -2 ticks */}
          <div className="absolute top-6 right-1 text-[8px] text-neutral-400">2</div>
          <div className="absolute top-14 right-1 text-[8px] text-neutral-400">1</div>
          <div className="absolute bottom-14 right-1 text-[8px] text-neutral-400">1</div>
          <div className="absolute bottom-6 right-1 text-[8px] text-neutral-400">2</div>

          {/* Moving VSI needle */}
          <div
            className="absolute left-0 w-4 h-[2px] bg-white transition-transform duration-75"
            style={{ transform: `translateY(${-vsiPx}px)` }}
          ></div>
        </div>
      </div>

      {/* 7. TOP FMA (Flight Mode Annunciator) */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-neutral-950/95 border-b border-neutral-800 px-2 flex items-center justify-between text-[10px] font-bold z-40">
        <span className={autopilot.autoThrottle ? "text-emerald-400" : "text-neutral-500"}>
          {autopilot.autoThrottle ? 'SPD' : 'MAN THR'}
        </span>
        <span className={autopilot.headingHold ? "text-emerald-400" : "text-neutral-500"}>
          {autopilot.headingHold ? 'HDG SEL' : 'ROLL'}
        </span>
        <span className={autopilot.altitudeHold ? "text-emerald-400" : "text-neutral-500"}>
          {autopilot.altitudeHold ? 'ALT HLD' : (autopilot.verticalSpeedHold ? 'V/S' : 'PITCH')}
        </span>
        <span className={autopilot.engaged ? "text-emerald-400 border border-emerald-500 px-1 rounded" : "text-neutral-600"}>
          {autopilot.engaged ? 'AP 1' : 'FD'}
        </span>
      </div>

      {/* 8. BOTTOM RADIO ALTIMETER & BARO */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-neutral-950/95 border-t border-neutral-800 px-2 flex items-center justify-between text-[10px] font-semibold text-neutral-400 z-40">
        <span>BARO 1013 HPA</span>
        {radioAlt < 2500 && (
          <span className="text-amber-400 font-bold bg-amber-950/50 px-1.5 rounded border border-amber-800">
            RA {Math.round(radioAlt)} FT
          </span>
        )}
      </div>
    </div>
  );
};
