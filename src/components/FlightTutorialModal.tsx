import React, { useState } from 'react';
import { AircraftSpecs, FlightPhase } from '../types';

interface FlightTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: AircraftSpecs;
  onSelectPhase: (phase: FlightPhase) => void;
  onQuickTakeoffAssist: () => void;
  onLevelFlight: () => void;
}

export const FlightTutorialModal: React.FC<FlightTutorialModalProps> = ({
  isOpen,
  onClose,
  specs,
  onSelectPhase,
  onQuickTakeoffAssist,
  onLevelFlight,
}) => {
  const [activeTab, setActiveTab] = useState<'TAKEOFF' | 'MANEUVERS' | 'LANDING' | 'CONTROLS' | 'AUTOPILOT'>('TAKEOFF');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 font-mono text-xs select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-base">
              🎓
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-wide">FLIGHT SCHOOL & PILOT TUTORIAL</h2>
              <p className="text-[11px] text-neutral-400">Master takeoff, level flight, banking, and landing ({specs.name})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Quick Help Banner for Instant Flying */}
        <div className="bg-cyan-950/50 border-b border-cyan-800/60 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-cyan-200">
            <span className="text-sm">⚡</span>
            <span><strong>Want to fly right now?</strong> Use these instant practice actions:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onQuickTakeoffAssist();
                onClose();
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded shadow transition-transform active:scale-95 text-[11px] flex items-center gap-1"
            >
              <span>🚀</span>
              <span>AUTO TAKEOFF ASSIST</span>
            </button>
            <button
              onClick={() => {
                onSelectPhase('CLIMB');
                onClose();
              }}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow transition-transform active:scale-95 text-[11px] flex items-center gap-1"
            >
              <span>✈️</span>
              <span>SPAWN IN AIR (3,000 FT)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-5 gap-1 overflow-x-auto">
          {[
            { id: 'TAKEOFF', label: '🛫 1. TAKEOFF' },
            { id: 'MANEUVERS', label: '🧭 2. FLYING & TURNS' },
            { id: 'LANDING', label: '🛬 3. APPROACH & LANDING' },
            { id: 'AUTOPILOT', label: '🤖 4. AUTOPILOT & HUD' },
            { id: 'CONTROLS', label: '🎮 5. KEYBOARD & CONTROLS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2.5 px-3 font-bold text-[11px] border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-neutral-900/60'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: TAKEOFF */}
          {activeTab === 'TAKEOFF' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
                <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🛫</span>
                  <span>How to Take Off Successfully (Step-by-Step)</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2.5 text-[11px] text-neutral-300">
                  <li className="leading-relaxed">
                    <strong className="text-white">Check Parking Brake:</strong> Ensure the red <code>PARK</code> indicator is OFF. If engaged, press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">P</kbd> or click the <code>PARK</code> button in the HUD.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Set Takeoff Flaps:</strong> Set flaps to Position 1 or 2 (press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">F</kbd>). This increases wing lift for a shorter, safer takeoff run.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Advance Throttle to 100% TOGA:</strong> Click the <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">TOGA 100%</span> button beside the throttle slider, or hold <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">Shift</kbd> (or press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">Space</kbd>). Listen as the turbofan engines spool up and the aircraft starts rolling down the runway.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Maintain Centerline:</strong> Use rudder <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">Q</kbd> (left) and <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">E</kbd> (right) or <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">A / D</kbd> to keep the aircraft tracking straight along the runway centerline markings.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Rotate at Vr ({specs.vrSpeedKts} Knots):</strong> When your airspeed indicator reaches <strong>{specs.vrSpeedKts} kts</strong> (you will hear the audio callout <em>"ROTATE"</em>), <strong>pull back gently on the yoke</strong> by pressing and holding <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300 font-bold">S</kbd> or <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300 font-bold">Down Arrow</kbd> (or drag the virtual joystick DOWN). Raise the nose pitch to approximately 10°–12°.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Liftoff & Positive Climb:</strong> The wings generate lift and the wheels leave the tarmac. When you hear <em>"POSITIVE CLIMB"</em>, press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">G</kbd> to retract the landing gear to reduce aerodynamic drag!
                  </li>
                </ol>
              </div>

              {/* Speeds Card */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-neutral-400">V1 (DECISION SPEED)</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">{specs.v1SpeedKts} KTS</div>
                  <div className="text-[9px] text-neutral-500 mt-1">Commit to takeoff past this speed</div>
                </div>
                <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-neutral-400">Vr (ROTATION SPEED)</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">{specs.vrSpeedKts} KTS</div>
                  <div className="text-[9px] text-neutral-500 mt-1">Pull S / Down to lift nose off tarmac</div>
                </div>
                <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-neutral-400">V2 (CLIMB SAFETY SPEED)</div>
                  <div className="text-lg font-bold text-cyan-400 mt-0.5">{specs.v2SpeedKts} KTS</div>
                  <div className="text-[9px] text-neutral-500 mt-1">Target initial climb speed</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    onSelectPhase('TAKEOFF_ROLL');
                    onClose();
                  }}
                  className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg border border-neutral-700 flex items-center justify-center gap-2"
                >
                  <span>🛫</span>
                  <span>Position on Runway 31L for Takeoff</span>
                </button>
                <button
                  onClick={() => {
                    onQuickTakeoffAssist();
                    onClose();
                  }}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>🚀</span>
                  <span>Launch Auto Takeoff Now</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MANEUVERS & FLYING */}
          {activeTab === 'MANEUVERS' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
                <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider mb-2">
                  🧭 How Airplanes Fly & Turn in the Air
                </h3>
                <div className="space-y-3 text-[11px] text-neutral-300">
                  <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                    <strong className="text-white flex items-center gap-1.5 mb-1">
                      <span>↕️</span> Pitch (Climb vs. Dive)
                    </strong>
                    <p className="text-neutral-400">
                      Press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300 font-bold">S</kbd> or <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300 font-bold">Down Arrow</kbd> to pull the yoke back, raising elevators to pitch the nose UP (climb). Press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300 font-bold">W</kbd> or <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300 font-bold">Up Arrow</kbd> to push the nose DOWN (descend). Releasing the keys returns the control stick to neutral!
                    </p>
                  </div>

                  <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                    <strong className="text-white flex items-center gap-1.5 mb-1">
                      <span>↔️</span> Roll & Banking (Turning)
                    </strong>
                    <p className="text-neutral-400">
                      Airplanes turn by banking their wings! Tap <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">A</kbd> to bank left, or <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">D</kbd> to bank right. Keep bank angle between 15° and 25° (do not exceed 35° or the GPWS will call <em>"BANK ANGLE"</em>). When turning, apply a slight touch of <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">S</kbd> to maintain altitude.
                    </p>
                  </div>

                  <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                    <strong className="text-white flex items-center gap-1.5 mb-1">
                      <span>⚠️</span> Stall Warning & Airspeed Safety
                    </strong>
                    <p className="text-neutral-400">
                      If you pitch up too steeply without enough engine power, airspeed drops below stall speed ({specs.stallSpeedCleanKts} kts) and the wings lose lift! If you hear <em>"STALL"</em>, immediately push the nose down (<kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">W</kbd>) and apply full throttle (<span className="text-amber-400 font-bold">TOGA</span>) to recover airspeed!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSelectPhase('CLIMB');
                    onClose();
                  }}
                  className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg border border-cyan-600 flex items-center justify-center gap-2"
                >
                  <span>✈️</span>
                  <span>Spawn in Mid-Air (3,000 FT Climb)</span>
                </button>
                <button
                  onClick={() => {
                    onSelectPhase('CRUISE');
                    onClose();
                  }}
                  className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg border border-neutral-700 flex items-center justify-center gap-2"
                >
                  <span>☁️</span>
                  <span>Spawn at High Cruise (34,000 FT)</span>
                </button>
                <button
                  onClick={() => {
                    onLevelFlight();
                    onClose();
                  }}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                  title="Instantly level wings and trim attitude"
                >
                  Level Wings
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: APPROACH & LANDING */}
          {activeTab === 'LANDING' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
                <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-2">
                  🛬 Step-by-Step Approach & Landing Guide
                </h3>
                <ol className="list-decimal list-inside space-y-2.5 text-[11px] text-neutral-300">
                  <li className="leading-relaxed">
                    <strong className="text-white">Align with Runway on 3° Glideslope:</strong> Fly towards the runway threshold. Keep descent rate around <strong>-700 ft/min</strong>. Watch the PAPI lights beside the runway: aim for 2 White and 2 Red lights!
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Lower Landing Gear (<kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">G</kbd>):</strong> At 2,000 feet radio altitude, extend landing gear. Verify green indicator lights in HUD.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Extend Full Landing Flaps (<kbd className="bg-neutral-800 px-1 py-0.5 rounded text-cyan-300">F</kbd>):</strong> Step flaps down to FULL (30°–40°) to slow approach speed to ~<strong>{specs.landingSpeedKts} kts</strong>.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">The Flare (At 30 Feet):</strong> As the radio altimeter calls <em>"40... 30... 20..."</em>, smoothly pull back slightly on <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">S</kbd> to raise the nose 2°–3°, and reduce throttle to <strong>IDLE (0%)</strong>. Let the main gear kiss the pavement!
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Reverse Thrust & Brakes:</strong> As tires touch the tarmac, press <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">R</kbd> to deploy thrust reversers and hold <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-red-400">B</kbd> for wheel brakes!
                  </li>
                </ol>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSelectPhase('FINAL_LANDING');
                    onClose();
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>🛬</span>
                  <span>Spawn on 5-Mile Final Runway Approach (Practice Landing)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AUTOPILOT */}
          {activeTab === 'AUTOPILOT' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
                <h3 className="font-bold text-purple-400 text-xs uppercase tracking-wider mb-2">
                  🤖 Modern Flight Deck: Glass Cockpit & Autopilot
                </h3>
                <p className="text-[11px] text-neutral-300 mb-3">
                  The airplane features a state-of-the-art Electronic Flight Instrument System (EFIS):
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                    <strong className="text-cyan-300 block mb-1">Primary Flight Display (PFD)</strong>
                    <ul className="text-neutral-400 space-y-1">
                      <li>• <strong>Left Tape:</strong> Indicated Airspeed (knots)</li>
                      <li>• <strong>Center:</strong> Artificial Horizon attitude indicator</li>
                      <li>• <strong>Right Tape:</strong> Altitude (feet MSL) & Vertical Speed</li>
                      <li>• <strong>Bottom:</strong> Heading rose & directional compass</li>
                    </ul>
                  </div>
                  <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                    <strong className="text-purple-300 block mb-1">Autopilot Modes</strong>
                    <ul className="text-neutral-400 space-y-1">
                      <li>• <strong>AP Master:</strong> Holds current aircraft state</li>
                      <li>• <strong>A/THR:</strong> Automatically controls engine throttle to maintain target speed</li>
                      <li>• <strong>ALT HOLD:</strong> Climbs or descends smoothly to target altitude</li>
                      <li>• <strong>HDG HOLD:</strong> Banks airplane to maintain dialed heading</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONTROLS & SHORTCUTS */}
          {activeTab === 'CONTROLS' && (
            <div className="space-y-4">
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
                  🎮 Complete Control Bindings & Keyboard Reference
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Pitch Nose UP (Climb)</span>
                    <kbd className="bg-neutral-800 text-amber-300 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">S / ↓</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Pitch Nose DOWN (Dive)</span>
                    <kbd className="bg-neutral-800 text-cyan-300 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">W / ↑</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Roll Wings (Bank)</span>
                    <kbd className="bg-neutral-800 text-white px-1.5 py-0.5 rounded border border-neutral-700 font-bold">A / D (← / →)</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Rudder Pedals (Yaw)</span>
                    <kbd className="bg-neutral-800 text-white px-1.5 py-0.5 rounded border border-neutral-700 font-bold">Q / E</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Throttle Increase</span>
                    <kbd className="bg-neutral-800 text-amber-300 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">Shift / PgUp / +</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Throttle Decrease</span>
                    <kbd className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">Ctrl / PgDn / -</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Landing Gear Toggle</span>
                    <kbd className="bg-neutral-800 text-emerald-400 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">G</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Flaps Extend / Retract</span>
                    <kbd className="bg-neutral-800 text-cyan-300 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">F / V</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Hold Wheel Brakes</span>
                    <kbd className="bg-neutral-800 text-red-400 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">B</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Parking Brake Toggle</span>
                    <kbd className="bg-neutral-800 text-amber-400 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">P</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Cycle Camera View</span>
                    <kbd className="bg-neutral-800 text-white px-1.5 py-0.5 rounded border border-neutral-700 font-bold">C (or 1-5)</kbd>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-300">Reverse Thrust Toggle</span>
                    <kbd className="bg-neutral-800 text-amber-300 px-1.5 py-0.5 rounded border border-neutral-700 font-bold">R</kbd>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 text-[11px] text-neutral-400">
                  <strong className="text-white block mb-1">📱 Mouse & Touch Screen Support:</strong>
                  Use the <strong>Virtual Flight Yoke</strong> in the bottom right corner: drag UP to push nose down, drag DOWN to pull nose up, drag LEFT/RIGHT to roll wings. Use the vertical throttle slider in the bottom left or click the <span className="text-amber-300 font-bold">[TOGA 100%]</span> button.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            Tip: You can re-open this flight tutorial anytime by clicking <strong>🎓 TUTORIAL</strong> in the top bar.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 hover:bg-white text-black font-bold rounded-lg transition-colors text-xs"
          >
            Close & Fly
          </button>
        </div>
      </div>
    </div>
  );
};
