import React, { useRef, useEffect, useState } from 'react';
import { CameraMode, FlightTelemetry, AircraftSystemsState, AircraftSpecs, FlightPhase, WeatherType } from '../types';
import { soundEngine } from '../simulation/audio';

interface HUDProps {
  telemetry: FlightTelemetry;
  systems: AircraftSystemsState;
  specs: AircraftSpecs;
  flightPhase: FlightPhase;
  cameraMode: CameraMode;
  weather?: WeatherType;
  onCycleWeather?: () => void;
  onOpenTutorial?: () => void;
  onSetCameraMode: (mode: CameraMode) => void;
  onSetYoke: (pitch: number, roll: number) => void;
  onSetRudder: (rudder: number) => void;
  onSetThrottle: (throttle: number) => void;
  onSetBrake: (brake: number) => void;
  onToggleGear: () => void;
  onToggleFlaps: (increment: boolean) => void;
  onToggleSpoilers: () => void;
  onToggleParkingBrake: () => void;
  onToggleReverseThrust: () => void;
  onOpenOverhead: () => void;
  onOpenATC: () => void;
  onOpenGroundOps: () => void;
  onOpenFlightPlanner: () => void;
  showInstruments: boolean;
  onToggleInstruments: () => void;
  isCleanView: boolean;
  onToggleCleanView: () => void;
}

export const FlightHUD: React.FC<HUDProps> = ({
  telemetry,
  systems,
  specs,
  flightPhase,
  cameraMode,
  weather = 'CLEAR',
  onCycleWeather,
  onSetCameraMode,
  onSetYoke,
  onSetRudder,
  onSetThrottle,
  onSetBrake,
  onToggleGear,
  onToggleFlaps,
  onToggleSpoilers,
  onToggleParkingBrake,
  onToggleReverseThrust,
  onOpenOverhead,
  onOpenATC,
  onOpenGroundOps,
  onOpenFlightPlanner,
  showInstruments,
  onToggleInstruments,
  isCleanView,
  onToggleCleanView,
  onOpenTutorial,
}) => {
  const [showKeyHelp, setShowKeyHelp] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Virtual touch stick state
  const stickRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingStick = useRef<boolean>(false);

  // Handle touch / drag virtual yoke
  const handleStickMove = (clientX: number, clientY: number) => {
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    const dx = Math.max(-radius, Math.min(radius, clientX - centerX));
    const dy = Math.max(-radius, Math.min(radius, clientY - centerY));

    setStickPos({ x: dx, y: dy });

    // Normalized roll (-1 to 1) and pitch:
    // Drag down (dy > 0) = pull yoke back -> Pitch UP (+1 climb/rotate)
    // Drag up (dy < 0) = push yoke forward -> Pitch DOWN (-1 dive)
    const normRoll = dx / radius;
    const normPitch = dy / radius;
    onSetYoke(normPitch, normRoll);
  };

  const handleStickEnd = () => {
    isDraggingStick.current = false;
    setStickPos({ x: 0, y: 0 });
    onSetYoke(0, 0);
  };

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const flapStages = specs?.flapStages || [
    { degrees: 0, name: 'UP', maxSpeedKts: 340, liftFactor: 1.0, dragFactor: 1.0 },
  ];
  const currentFlap = flapStages[systems.flapsIndex] || flapStages[0];

  if (isCleanView) {
    return (
      <div className="absolute inset-0 pointer-events-none select-none p-3 z-30 font-mono text-xs flex flex-col justify-between">
        {/* Top clean view minimal pill */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="bg-neutral-950/70 border border-neutral-800 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-white text-[11px]">{specs.name}</span>
            <span className="text-neutral-500">|</span>
            <span className="text-[11px] text-cyan-400">{Math.round(telemetry.indicatedAirspeedKts)} KTS</span>
            <span className="text-neutral-500">|</span>
            <span className="text-[11px] text-amber-400">{Math.round(telemetry.altitudeFt)} FT</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Camera switcher in clean view */}
            <div className="flex bg-neutral-950/75 border border-neutral-800 rounded-lg overflow-hidden backdrop-blur-md">
              {(['CHASE', 'COCKPIT', 'WING', 'TOWER', 'ORBIT'] as CameraMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onSetCameraMode(mode)}
                  className={`px-2 py-1 font-bold text-[10px] transition-colors ${
                    cameraMode === mode ? 'bg-neutral-200 text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Restore Full Controls Button */}
            <button
              onClick={onToggleCleanView}
              className="px-3 py-1 bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold rounded-lg border border-cyan-400 shadow-xl backdrop-blur-md transition-colors flex items-center gap-1.5"
            >
              <span>👁️</span>
              <span>SHOW CONTROLS</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 z-30 font-mono text-xs">
      {/* 1. TOP HEADER APP BAR */}
      <div className="flex items-center justify-between pointer-events-auto bg-neutral-950/80 border border-neutral-800 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-white tracking-wider text-sm">AIRPLANE SIMULATOR</span>
          </div>
          <span className="text-[11px] text-neutral-400 border-l border-neutral-700 pl-3">
            {specs.name}
          </span>
          <span className="text-[10px] bg-cyan-950/60 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold hidden sm:inline-block">
            PHASE: {flightPhase.replace('_', ' ')}
          </span>
        </div>

        {/* Action Menu Buttons */}
        <div className="flex items-center gap-2">
          {/* Glass Cockpit Avionics Toggle */}
          <button
            onClick={onToggleInstruments}
            className={`px-2.5 py-1 font-bold rounded border transition-colors flex items-center gap-1 ${
              showInstruments
                ? 'bg-cyan-600 text-white border-cyan-400'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-600'
            }`}
            title="Toggle PFD / Navigation / Engine Instruments"
          >
            <span>🖥️</span>
            <span>AVIONICS</span>
          </button>

          {/* Flight Tutorial Button */}
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded border border-amber-400 transition-colors flex items-center gap-1.5 shadow-md animate-pulse"
              title="Interactive Flight Tutorial & Flight School"
            >
              <span>🎓</span>
              <span>TUTORIAL</span>
            </button>
          )}

          {/* Clean View Toggle */}
          <button
            onClick={onToggleCleanView}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded border border-neutral-600 transition-colors flex items-center gap-1"
            title="Hide HUD for pure 3D scenery"
          >
            <span>👁️</span>
            <span className="hidden sm:inline">CLEAN VIEW</span>
          </button>

          {/* Ground Ops */}
          <button
            onClick={onOpenGroundOps}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold rounded border border-neutral-600 transition-colors"
          >
            GATE OPS
          </button>

          {/* ATC Radio */}
          <button
            onClick={onOpenATC}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-bold rounded border border-neutral-600 transition-colors"
          >
            ATC RADIO
          </button>

          {/* Overhead Systems */}
          <button
            onClick={onOpenOverhead}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 font-bold rounded border border-neutral-600 transition-colors"
          >
            OVERHEAD
          </button>

          {/* Flight Planner */}
          <button
            onClick={onOpenFlightPlanner}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-purple-300 font-bold rounded border border-neutral-600 transition-colors"
          >
            DISPATCH
          </button>

          {/* Camera View Switcher */}
          <div className="flex bg-neutral-900 border border-neutral-700 rounded overflow-hidden">
            {(['CHASE', 'COCKPIT', 'WING', 'TOWER', 'ORBIT'] as CameraMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSetCameraMode(mode)}
                className={`px-2 py-1 font-bold text-[10px] transition-colors ${
                  cameraMode === mode ? 'bg-neutral-200 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Quick Weather Toggle */}
          {onCycleWeather && (
            <button
              onClick={onCycleWeather}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-[10px] rounded border border-neutral-600 transition-colors flex items-center gap-1"
              title="Cycle Atmospheric Weather & Clouds"
            >
              <span>⛅</span>
              <span className="hidden md:inline">{weather.replace('_', ' ')}</span>
            </button>
          )}

          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded border border-neutral-600"
            title="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Keyboard Controls Legend */}
          <button
            onClick={() => setShowKeyHelp(!showKeyHelp)}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded border border-neutral-600"
            title="Keyboard Controls"
          >
            ⌨️
          </button>
        </div>
      </div>

      {/* DYNAMIC COPILOT FLIGHT INSTRUCTOR GUIDANCE BAR */}
      {!isCleanView && (
        <div className="pointer-events-auto self-center bg-neutral-950/90 border border-neutral-700/80 px-4 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-2xl text-[11px] animate-fadeIn">
          <span className="text-amber-400 font-bold flex items-center gap-1 shrink-0">
            <span>✈️</span>
            <span>INSTRUCTOR:</span>
          </span>
          <span className="text-neutral-200">
            {telemetry.onGround ? (
              telemetry.indicatedAirspeedKts < 20 ? (
                <>
                  <strong className="text-white">Takeoff Ready:</strong> Click <button onClick={() => onSetThrottle(1.0)} className="bg-amber-600 hover:bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold mx-1">TOGA 100%</button> or hold <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300 font-bold">Shift</kbd> to begin acceleration roll!
                </>
              ) : telemetry.indicatedAirspeedKts < specs.vrSpeedKts ? (
                <>
                  <strong className="text-white">Accelerating ({Math.round(telemetry.indicatedAirspeedKts)} kts):</strong> Steer runway centerline with <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">A/D</kbd> or <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">Q/E</kbd> until Vr ({specs.vrSpeedKts} kts).
                </>
              ) : (
                <>
                  <strong className="text-amber-400 font-bold animate-pulse">ROTATE NOW!</strong> Pull back on stick (<kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-amber-300 font-bold">S</kbd> or <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-amber-300 font-bold">Down Arrow</kbd>, or drag Yoke Down) to lift off!
                </>
              )
            ) : telemetry.radioAltitudeFt < 400 && telemetry.verticalSpeedFpm > 100 ? (
              <>
                <strong className="text-emerald-400 font-bold">Positive Climb!</strong> Press <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-emerald-300 font-bold">G</kbd> to retract landing gear and climb out.
              </>
            ) : telemetry.indicatedAirspeedKts < specs.stallSpeedCleanKts ? (
              <>
                <strong className="text-red-400 font-bold animate-pulse">LOW AIRSPEED!</strong> Push nose down (<kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300 font-bold">W</kbd>) and advance throttle to TOGA!
              </>
            ) : (
              <>
                <strong className="text-white">Airborne ({Math.round(telemetry.altitudeFt)} FT):</strong> Use <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">W/S</kbd> for pitch, <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">A/D</kbd> to bank. Click <strong className="text-amber-300">🎓 TUTORIAL</strong> for in-flight maneuvers.
              </>
            )}
          </span>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS DIALOG */}
      {showKeyHelp && (
        <div className="pointer-events-auto self-center bg-neutral-950/90 border border-neutral-700 rounded-xl p-4 shadow-2xl backdrop-blur-md max-w-md w-full my-auto text-neutral-300">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-2">
            <span className="font-bold text-white text-sm">FLIGHT CONTROLS & SHORTCUTS</span>
            <button onClick={() => setShowKeyHelp(false)} className="text-neutral-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">W / S</kbd> Pitch Down / Up</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">A / D</kbd> Roll Left / Right</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">Q / E</kbd> Rudder Left / Right</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">Shift / Ctrl</kbd> Throttle Up / Down</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">G</kbd> Landing Gear Toggle</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">F / V</kbd> Flaps Extend / Retract</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">/</kbd> Spoilers / Airbrakes</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">B</kbd> Wheel Brakes</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">C</kbd> Cycle Camera View</div>
            <div><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">R</kbd> Reverse Thrust Toggle</div>
          </div>
        </div>
      )}

      {/* 2. BOTTOM FLIGHT CONTROLS AND TOUCH YOKE */}
      <div className="flex items-end justify-between w-full pointer-events-none gap-4">
        {/* LEFT: THROTTLE QUADRANT & FLAPS/SPOILERS */}
        <div className="pointer-events-auto bg-neutral-950/85 border border-neutral-800 rounded-xl p-3 backdrop-blur-md flex flex-col gap-2 shadow-2xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
            <span>THROTTLE: {Math.round(telemetry.throttle * 100)}%</span>
            <button
              onClick={onToggleReverseThrust}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                systems.reverseThrust ? 'bg-amber-600 text-white border-amber-400 animate-pulse' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              REV
            </button>
          </div>

          {/* Vertical Throttle Slider & Presets */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={telemetry.throttle}
                onChange={(e) => onSetThrottle(parseFloat(e.target.value))}
                className="h-28 w-6 accent-cyan-400 cursor-pointer"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              />
            </div>

            {/* Quick Throttle Presets */}
            <div className="flex flex-col gap-1 justify-between h-28 py-0.5">
              <button
                onClick={() => onSetThrottle(1.0)}
                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded border border-amber-400 text-[9px] shadow active:scale-95"
                title="100% Full Takeoff Power"
              >
                TOGA
              </button>
              <button
                onClick={() => onSetThrottle(0.85)}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-bold rounded border border-neutral-700 text-[9px] active:scale-95"
                title="85% Climb Power"
              >
                CLB
              </button>
              <button
                onClick={() => onSetThrottle(0.65)}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded border border-neutral-700 text-[9px] active:scale-95"
                title="65% Cruise Power"
              >
                CRZ
              </button>
              <button
                onClick={() => onSetThrottle(0)}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-bold rounded border border-neutral-700 text-[9px] active:scale-95"
                title="Idle Power"
              >
                IDLE
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col gap-1.5">
              {/* Flaps */}
              <div className="flex gap-1">
                <button
                  onClick={() => onToggleFlaps(false)}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded border border-neutral-700 text-[10px]"
                >
                  FLAP -
                </button>
                <button
                  onClick={() => onToggleFlaps(true)}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-bold rounded border border-neutral-700 text-[10px]"
                >
                  FLAP + ({currentFlap.name})
                </button>
              </div>

              {/* Spoilers & Gear */}
              <div className="flex gap-1">
                <button
                  onClick={onToggleSpoilers}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                    systems.spoilersExtended ? 'bg-amber-600 text-white border-amber-400' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  SPOILERS
                </button>
                <button
                  onClick={onToggleGear}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                    systems.gearDown ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  GEAR {systems.gearDown ? 'DN' : 'UP'}
                </button>
              </div>

              {/* Brakes */}
              <div className="flex gap-1">
                <button
                  onMouseDown={() => onSetBrake(1)}
                  onMouseUp={() => onSetBrake(0)}
                  onTouchStart={() => onSetBrake(1)}
                  onTouchEnd={() => onSetBrake(0)}
                  className="flex-1 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 font-bold rounded border border-red-700 text-[10px] text-center active:bg-red-600 active:text-white"
                >
                  HOLD BRAKE (B)
                </button>
                <button
                  onClick={onToggleParkingBrake}
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${
                    systems.parkingBrake ? 'bg-red-600 text-white border-red-400' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  PARK
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: TOUCH FLIGHT YOKE / JOYSTICK */}
        <div className="pointer-events-auto bg-neutral-950/85 border border-neutral-800 rounded-xl p-3 backdrop-blur-md flex flex-col items-center gap-2 shadow-2xl">
          <div className="flex items-center justify-between w-full text-[11px] font-bold text-neutral-300">
            <span>FLIGHT YOKE</span>
            <span className="text-[10px] text-neutral-400">PULL/ROLL</span>
          </div>

          {/* Virtual Joystick Ring */}
          <div
            ref={stickRef}
            onMouseDown={(e) => {
              isDraggingStick.current = true;
              handleStickMove(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => {
              if (isDraggingStick.current) handleStickMove(e.clientX, e.clientY);
            }}
            onMouseUp={handleStickEnd}
            onMouseLeave={handleStickEnd}
            onTouchStart={(e) => {
              isDraggingStick.current = true;
              const touch = e.touches[0];
              handleStickMove(touch.clientX, touch.clientY);
            }}
            onTouchMove={(e) => {
              if (isDraggingStick.current && e.touches[0]) {
                handleStickMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={handleStickEnd}
            className="relative w-32 h-32 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center cursor-pointer shadow-inner touch-none"
          >
            {/* Crosshair guide lines */}
            <div className="absolute w-full h-[1px] bg-neutral-800 pointer-events-none"></div>
            <div className="absolute h-full w-[1px] bg-neutral-800 pointer-events-none"></div>

            {/* Draggable Knob */}
            <div
              className="absolute w-12 h-12 rounded-full bg-cyan-500 border-2 border-white shadow-lg pointer-events-none transition-transform duration-75 flex items-center justify-center text-[9px] font-bold text-black"
              style={{
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              }}
            >
              YOKE
            </div>
          </div>

          {/* Rudder Buttons */}
          <div className="flex gap-2 w-full pt-1">
            <button
              onMouseDown={() => onSetRudder(-1)}
              onMouseUp={() => onSetRudder(0)}
              onTouchStart={() => onSetRudder(-1)}
              onTouchEnd={() => onSetRudder(0)}
              className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 active:bg-cyan-600 active:text-black text-neutral-300 font-bold rounded border border-neutral-700 text-[10px]"
            >
              RUDDER L
            </button>
            <button
              onMouseDown={() => onSetRudder(1)}
              onMouseUp={() => onSetRudder(0)}
              onTouchStart={() => onSetRudder(1)}
              onTouchEnd={() => onSetRudder(0)}
              className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 active:bg-cyan-600 active:text-black text-neutral-300 font-bold rounded border border-neutral-700 text-[10px]"
            >
              RUDDER R
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
