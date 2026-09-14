import React, { useEffect } from 'react';
import { AirportOperations, AircraftSpecs } from '../types';
import { soundEngine } from '../simulation/audio';

interface GroundOpsProps {
  ops: AirportOperations;
  specs: AircraftSpecs;
  setOps: React.Dispatch<React.SetStateAction<AirportOperations>>;
  onClose: () => void;
}

export const GroundOpsModal: React.FC<GroundOpsProps> = ({ ops, specs, setOps, onClose }) => {
  // Simulate continuous passenger boarding when in progress
  useEffect(() => {
    if (!ops.boardingInProgress && !ops.deboardingInProgress) return;

    const interval = setInterval(() => {
      setOps((prev) => {
        if (prev.boardingInProgress) {
          const nextPax = Math.min(prev.maxPassengers, prev.passengersBoarded + 8);
          const nextCargo = Math.min(prev.maxCargoKg, prev.cargoLoadedKg + 450);
          const finished = nextPax >= prev.maxPassengers;
          if (finished) soundEngine.playChime('SEATBELT');
          return {
            ...prev,
            passengersBoarded: nextPax,
            cargoLoadedKg: nextCargo,
            boardingInProgress: !finished,
          };
        } else if (prev.deboardingInProgress) {
          const nextPax = Math.max(0, prev.passengersBoarded - 8);
          const finished = nextPax <= 0;
          return {
            ...prev,
            passengersBoarded: nextPax,
            deboardingInProgress: !finished,
          };
        }
        return prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [ops.boardingInProgress, ops.deboardingInProgress, setOps]);

  const toggleJetway = () => {
    soundEngine.playClick();
    setOps((prev) => ({ ...prev, jetwayConnected: !prev.jetwayConnected }));
  };

  const startBoarding = () => {
    soundEngine.playClick();
    setOps((prev) => ({
      ...prev,
      boardingInProgress: true,
      deboardingInProgress: false,
      jetwayConnected: true,
    }));
  };

  const startDeboarding = () => {
    soundEngine.playClick();
    setOps((prev) => ({
      ...prev,
      deboardingInProgress: true,
      boardingInProgress: false,
      jetwayConnected: true,
    }));
  };

  const togglePushback = () => {
    soundEngine.playClick();
    setOps((prev) => ({
      ...prev,
      pushbackActive: !prev.pushbackActive,
      pushbackRequested: !prev.pushbackActive,
      jetwayConnected: false, // disconnect jetway before pushback!
    }));
  };

  const paxPercent = Math.round((ops.passengersBoarded / ops.maxPassengers) * 100);
  const cargoPercent = Math.round((ops.cargoLoadedKg / ops.maxCargoKg) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-neutral-900 border-2 border-neutral-700 rounded-xl max-w-lg w-full p-4 shadow-2xl font-mono text-xs flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-sm font-bold text-neutral-100">AIRPORT GATE & GROUND OPERATIONS</span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-bold border border-neutral-600 transition-colors"
          >
            CLOSE [X]
          </button>
        </div>

        {/* 1. JETWAY & BOARDING BRIDGE */}
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="font-bold text-neutral-200">PASSENGER JETWAY BRIDGE</div>
            <div className="text-[11px] text-neutral-400">
              Status: <strong className={ops.jetwayConnected ? "text-emerald-400" : "text-neutral-500"}>
                {ops.jetwayConnected ? "CONNECTED TO DOOR 1L" : "RETRACTED AT TERMINAL"}
              </strong>
            </div>
          </div>
          <button
            onClick={toggleJetway}
            className={`px-3 py-1.5 rounded font-bold border transition-colors ${
              ops.jetwayConnected ? 'bg-amber-600 text-white border-amber-400' : 'bg-neutral-800 text-neutral-300 border-neutral-600'
            }`}
          >
            {ops.jetwayConnected ? 'DISCONNECT JETWAY' : 'CONNECT JETWAY'}
          </button>
        </div>

        {/* 2. PASSENGER BOARDING & CARGO PROGRESS */}
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-3">
          {/* Passenger progress */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-neutral-300 font-semibold">PASSENGERS ONBOARD:</span>
              <span className="text-cyan-400 font-bold">{ops.passengersBoarded} / {ops.maxPassengers} ({paxPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300 rounded-full"
                style={{ width: `${paxPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Cargo progress */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-neutral-300 font-semibold">CARGO & BAGGAGE LOADED:</span>
              <span className="text-emerald-400 font-bold">{ops.cargoLoadedKg} / {ops.maxCargoKg} KG ({cargoPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${cargoPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Boarding buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={startBoarding}
              disabled={ops.boardingInProgress || ops.passengersBoarded >= ops.maxPassengers}
              className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded border border-emerald-500 transition-colors"
            >
              {ops.boardingInProgress ? 'BOARDING IN PROGRESS...' : 'START BOARDING'}
            </button>
            <button
              onClick={startDeboarding}
              disabled={ops.deboardingInProgress || ops.passengersBoarded <= 0}
              className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 font-bold rounded border border-neutral-600 transition-colors"
            >
              {ops.deboardingInProgress ? 'DISEMBARKING...' : 'DEBOARD PASSENGERS'}
            </button>
          </div>
        </div>

        {/* 3. PUSHBACK TUG TRACTOR */}
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-neutral-200">PUSHBACK TUG TRACTOR</div>
              <div className="text-[11px] text-neutral-400">
                Tug Status: <strong className={ops.pushbackActive ? "text-emerald-400" : "text-neutral-500"}>
                  {ops.pushbackActive ? "ACTIVE - REVERSING AIRCRAFT" : "STANDBY"}
                </strong>
              </div>
            </div>
            <button
              onClick={togglePushback}
              className={`px-3 py-1.5 rounded font-bold border transition-colors ${
                ops.pushbackActive ? 'bg-red-600 text-white border-red-400' : 'bg-emerald-600 text-white border-emerald-400'
              }`}
            >
              {ops.pushbackActive ? 'STOP PUSHBACK' : 'START PUSHBACK'}
            </button>
          </div>

          {/* Pushback direction */}
          {ops.pushbackActive && (
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[11px]">
              <span className="text-neutral-400">TURN NOSE:</span>
              <div className="flex gap-1.5">
                {(['LEFT', 'STRAIGHT', 'RIGHT'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setOps((p) => ({ ...p, pushbackDirection: dir }))}
                    className={`px-2.5 py-1 rounded font-bold border ${
                      ops.pushbackDirection === dir ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
