import React, { useState } from 'react';
import { AIRCRAFT_FLEET } from '../data/aircraft';
import { GLOBAL_AIRPORTS } from '../data/airports';
import { AircraftSpecs, AirportData, FlightPhase, WeatherType } from '../types';
import { soundEngine } from '../simulation/audio';

interface FlightPlannerProps {
  currentAirport: AirportData;
  currentAircraft: AircraftSpecs;
  currentWeather: WeatherType;
  onSelectFlight: (
    depAirport: AirportData,
    destAirport: AirportData,
    aircraft: AircraftSpecs,
    weather: WeatherType,
    jumpPhase?: FlightPhase
  ) => void;
  onClose: () => void;
}

export const FlightPlannerModal: React.FC<FlightPlannerProps> = ({
  currentAirport,
  currentAircraft,
  currentWeather,
  onSelectFlight,
  onClose,
}) => {
  const [selectedDepIcao, setSelectedDepIcao] = useState<string>(currentAirport.icao);
  const [selectedDestIcao, setSelectedDestIcao] = useState<string>(
    currentAirport.icao === 'EGLL' ? 'KJFK' : 'EGLL'
  );
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(currentAircraft.id);
  const [selectedWeather, setSelectedWeather] = useState<WeatherType>(currentWeather);
  const [selectedPhase, setSelectedPhase] = useState<FlightPhase>('GATE_PREPARATION');

  const depAirport = GLOBAL_AIRPORTS[selectedDepIcao] || currentAirport;
  const destAirport = GLOBAL_AIRPORTS[selectedDestIcao] || GLOBAL_AIRPORTS['EGLL'];
  const aircraft = AIRCRAFT_FLEET[selectedAircraftId] || currentAircraft;

  // Compute Great Circle distance
  const degToRad = Math.PI / 180;
  const dLat = (destAirport.lat - depAirport.lat) * degToRad;
  const dLon = (destAirport.lon - depAirport.lon) * degToRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(depAirport.lat * degToRad) * Math.cos(destAirport.lat * degToRad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceNm = Math.round(6371 * c * 0.539957);

  const handleStart = () => {
    soundEngine.playClick();
    onSelectFlight(depAirport, destAirport, aircraft, selectedWeather, selectedPhase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <div className="bg-neutral-900 border-2 border-neutral-700 rounded-xl max-w-3xl w-full p-5 shadow-2xl font-mono text-xs flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-base font-bold text-neutral-100 tracking-wider">
              GLOBAL FLIGHT PLANNER & FLEET DISPATCH
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-bold border border-neutral-600 transition-colors"
          >
            CLOSE [X]
          </button>
        </div>

        {/* 1. AIRCRAFT FLEET SELECTION */}
        <div>
          <span className="text-[11px] font-bold text-cyan-400 block mb-2">1. SELECT AIRCRAFT FLEET</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.values(AIRCRAFT_FLEET).map((plane) => (
              <div
                key={plane.id}
                onClick={() => setSelectedAircraftId(plane.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedAircraftId === plane.id
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-950'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm mb-1">
                  <span className={selectedAircraftId === plane.id ? "text-cyan-300" : "text-white"}>
                    {plane.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 px-1.5 py-0.5 bg-neutral-800 rounded">
                    {plane.category.replace('AIRLINER_', '')}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2 mb-2">
                  {plane.description}
                </p>
                <div className="flex justify-between text-[10px] text-neutral-300 border-t border-neutral-800 pt-1.5 font-semibold">
                  <span>CRUISE: {plane.cruiseSpeedKts} KTS</span>
                  <span>CEILING: {plane.serviceCeilingFt} FT</span>
                  <span>PAX: {plane.maxPassengerCapacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. GLOBAL ROUTE: DEPARTURE & DESTINATION */}
        <div>
          <span className="text-[11px] font-bold text-emerald-400 block mb-2">2. GLOBAL AIRPORT ROUTE</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Departure */}
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <span className="text-[10px] text-neutral-400 font-bold block mb-1">ORIGIN DEPARTURE:</span>
              <select
                value={selectedDepIcao}
                onChange={(e) => setSelectedDepIcao(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 text-white p-2 rounded text-xs font-bold focus:outline-none focus:border-cyan-400"
              >
                {Object.values(GLOBAL_AIRPORTS).map((apt) => (
                  <option key={`dep-${apt.icao}`} value={apt.icao}>
                    {apt.icao} - {apt.city}, {apt.country} ({apt.name})
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-neutral-400 mt-1.5">
                Runways: {depAirport.runways.map((r) => r.name).join(', ')} | Elev: {depAirport.elevation} ft
              </div>
            </div>

            {/* Destination */}
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <span className="text-[10px] text-neutral-400 font-bold block mb-1">DESTINATION ARRIVAL:</span>
              <select
                value={selectedDestIcao}
                onChange={(e) => setSelectedDestIcao(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 text-white p-2 rounded text-xs font-bold focus:outline-none focus:border-cyan-400"
              >
                {Object.values(GLOBAL_AIRPORTS).map((apt) => (
                  <option key={`dest-${apt.icao}`} value={apt.icao} disabled={apt.icao === selectedDepIcao}>
                    {apt.icao} - {apt.city}, {apt.country} ({apt.name})
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-neutral-400 mt-1.5">
                Runways: {destAirport.runways.map((r) => r.name).join(', ')} | Elev: {destAirport.elevation} ft
              </div>
            </div>
          </div>

          {/* Route Distance & Specs */}
          <div className="bg-neutral-950/80 px-3 py-2 rounded-lg border border-neutral-800 mt-2 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-neutral-400">
              FLIGHT DISTANCE: <strong className="text-white">{distanceNm} NM</strong>
            </span>
            <span className="text-neutral-400">
              RECOMMENDED CRUISE: <strong className="text-cyan-400">FL340 (34,000 FT)</strong>
            </span>
            <span className="text-neutral-400">
              EST. TIME: <strong className="text-emerald-400">{(distanceNm / aircraft.cruiseSpeedKts).toFixed(1)} HRS</strong>
            </span>
          </div>
        </div>

        {/* 3. WEATHER CONDITIONS */}
        <div>
          <span className="text-[11px] font-bold text-amber-400 block mb-2">3. ATMOSPHERIC WEATHER CONDITIONS</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { type: 'CLEAR', label: 'Clear Sky' },
              { type: 'FEW_CLOUDS', label: 'Scattered' },
              { type: 'OVERCAST', label: 'Overcast' },
              { type: 'RAIN_STORM', label: 'Rain Storm' },
              { type: 'FOG', label: 'Low Fog (CAT III)' },
              { type: 'SUNSET', label: 'Sunset / Dusk' },
            ].map((w) => (
              <button
                key={w.type}
                onClick={() => setSelectedWeather(w.type as WeatherType)}
                className={`p-2 rounded border font-bold text-center transition-all ${
                  selectedWeather === w.type
                    ? 'bg-amber-600 text-white border-amber-400 shadow'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. FLIGHT PHASE TELEPORT (Quick Jump to Practice) */}
        <div>
          <span className="text-[11px] font-bold text-purple-400 block mb-2">4. STARTING FLIGHT PHASE (INSTANT DISPATCH)</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { phase: 'GATE_PREPARATION', label: 'Gate (Cold & Dark)' },
              { phase: 'TAKEOFF_ROLL', label: 'Runway Lineup' },
              { phase: 'CLIMB', label: 'Climb (5,000 FT)' },
              { phase: 'CRUISE', label: 'Enroute Cruise' },
              { phase: 'FINAL_LANDING', label: 'Short Final (3 NM)' },
            ].map((p) => (
              <button
                key={p.phase}
                onClick={() => setSelectedPhase(p.phase as FlightPhase)}
                className={`p-2 rounded border font-bold text-center transition-all ${
                  selectedPhase === p.phase
                    ? 'bg-purple-600 text-white border-purple-400 shadow'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-950 transition-all text-sm"
          >
            DISPATCH FLIGHT & ENTER COCKPIT
          </button>
        </div>
      </div>
    </div>
  );
};
