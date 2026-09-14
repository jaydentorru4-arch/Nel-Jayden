import { AircraftSpecs } from '../types';

export const AIRCRAFT_FLEET: Record<string, AircraftSpecs> = {
  B737_800: {
    id: 'B737_800',
    name: 'Boeing 737-800 NextGen',
    manufacturer: 'Boeing',
    category: 'AIRLINER_NARROW',
    description: 'The world\'s most popular short-to-medium range twin-engine commercial narrow-body jetliner, powered by dual CFM56-7B engines with blended winglets.',
    wingspan: 35.8,
    length: 39.5,
    emptyWeight: 41413,
    maxTakeoffWeight: 79010,
    maxFuel: 20894,
    maxThrustPerEngine: 121400, // 27,300 lbf
    engineCount: 2,
    engineType: 'TURBOFAN',
    maxPassengerCapacity: 189,
    cargoCapacityKg: 5800,
    cruiseSpeedKts: 450,
    maxSpeedMach: 0.82,
    stallSpeedCleanKts: 135,
    stallSpeedLandingKts: 118,
    serviceCeilingFt: 41000,
    v1SpeedKts: 142,
    vrSpeedKts: 148,
    v2SpeedKts: 154,
    landingSpeedKts: 138,
    flapStages: [
      { degrees: 0, name: 'UP', maxSpeedKts: 340, liftFactor: 1.0, dragFactor: 1.0 },
      { degrees: 1, name: '1', maxSpeedKts: 250, liftFactor: 1.15, dragFactor: 1.05 },
      { degrees: 5, name: '5', maxSpeedKts: 250, liftFactor: 1.30, dragFactor: 1.12 },
      { degrees: 15, name: '15', maxSpeedKts: 230, liftFactor: 1.55, dragFactor: 1.25 },
      { degrees: 30, name: '30', maxSpeedKts: 185, liftFactor: 1.85, dragFactor: 1.65 },
      { degrees: 40, name: '40', maxSpeedKts: 162, liftFactor: 2.05, dragFactor: 2.10 },
    ],
  },

  A350_900: {
    id: 'A350_900',
    name: 'Airbus A350-900 XWB',
    manufacturer: 'Airbus',
    category: 'AIRLINER_WIDE',
    description: 'State-of-the-art ultra-long range wide-body airliner featuring carbon-fiber composites, fly-by-wire flight envelope protection, and quiet Rolls-Royce Trent XWB turbofans.',
    wingspan: 64.75,
    length: 66.8,
    emptyWeight: 142400,
    maxTakeoffWeight: 280000,
    maxFuel: 110523,
    maxThrustPerEngine: 374500, // 84,200 lbf
    engineCount: 2,
    engineType: 'TURBOFAN',
    maxPassengerCapacity: 325,
    cargoCapacityKg: 18000,
    cruiseSpeedKts: 488,
    maxSpeedMach: 0.89,
    stallSpeedCleanKts: 142,
    stallSpeedLandingKts: 125,
    serviceCeilingFt: 43100,
    v1SpeedKts: 150,
    vrSpeedKts: 156,
    v2SpeedKts: 162,
    landingSpeedKts: 142,
    flapStages: [
      { degrees: 0, name: '0', maxSpeedKts: 360, liftFactor: 1.0, dragFactor: 1.0 },
      { degrees: 1, name: '1+F', maxSpeedKts: 255, liftFactor: 1.22, dragFactor: 1.08 },
      { degrees: 2, name: '2', maxSpeedKts: 220, liftFactor: 1.48, dragFactor: 1.22 },
      { degrees: 3, name: '3', maxSpeedKts: 195, liftFactor: 1.78, dragFactor: 1.55 },
      { degrees: 4, name: 'FULL', maxSpeedKts: 180, liftFactor: 2.15, dragFactor: 2.20 },
    ],
  },

  B777_300ER: {
    id: 'B777_300ER',
    name: 'Boeing 777-300ER',
    manufacturer: 'Boeing',
    category: 'AIRLINER_HEAVY',
    description: 'The heavyweight flagship of long-haul global aviation, equipped with the world\'s most powerful jet engines (GE90-115B) producing 115,300 lbf each, with raked wingtips.',
    wingspan: 64.8,
    length: 73.9,
    emptyWeight: 167800,
    maxTakeoffWeight: 351534,
    maxFuel: 145538,
    maxThrustPerEngine: 512900, // 115,300 lbf
    engineCount: 2,
    engineType: 'TURBOFAN',
    maxPassengerCapacity: 396,
    cargoCapacityKg: 24500,
    cruiseSpeedKts: 482,
    maxSpeedMach: 0.87,
    stallSpeedCleanKts: 148,
    stallSpeedLandingKts: 130,
    serviceCeilingFt: 43100,
    v1SpeedKts: 156,
    vrSpeedKts: 163,
    v2SpeedKts: 170,
    landingSpeedKts: 146,
    flapStages: [
      { degrees: 0, name: 'UP', maxSpeedKts: 350, liftFactor: 1.0, dragFactor: 1.0 },
      { degrees: 1, name: '1', maxSpeedKts: 255, liftFactor: 1.18, dragFactor: 1.06 },
      { degrees: 5, name: '5', maxSpeedKts: 245, liftFactor: 1.35, dragFactor: 1.14 },
      { degrees: 15, name: '15', maxSpeedKts: 230, liftFactor: 1.62, dragFactor: 1.30 },
      { degrees: 20, name: '20', maxSpeedKts: 215, liftFactor: 1.82, dragFactor: 1.55 },
      { degrees: 30, name: '30', maxSpeedKts: 180, liftFactor: 2.20, dragFactor: 2.30 },
    ],
  },

  C172_SKYHAWK: {
    id: 'C172_SKYHAWK',
    name: 'Cessna 172 Skyhawk',
    manufacturer: 'Cessna',
    category: 'GENERAL_AVIATION',
    description: 'The premier single-engine general aviation aircraft. High-wing design, Lycoming IO-360-L2A engine, gentle stall characteristics, and quintessential flight training dynamics.',
    wingspan: 11.0,
    length: 8.28,
    emptyWeight: 767,
    maxTakeoffWeight: 1157,
    maxFuel: 144,
    maxThrustPerEngine: 3200, // ~180 hp equivalent static thrust
    engineCount: 1,
    engineType: 'PISTON',
    maxPassengerCapacity: 3,
    cargoCapacityKg: 54,
    cruiseSpeedKts: 122,
    maxSpeedMach: 0.22,
    stallSpeedCleanKts: 48,
    stallSpeedLandingKts: 40,
    serviceCeilingFt: 14000,
    v1SpeedKts: 50,
    vrSpeedKts: 55,
    v2SpeedKts: 62,
    landingSpeedKts: 60,
    flapStages: [
      { degrees: 0, name: '0°', maxSpeedKts: 140, liftFactor: 1.0, dragFactor: 1.0 },
      { degrees: 10, name: '10°', maxSpeedKts: 110, liftFactor: 1.25, dragFactor: 1.10 },
      { degrees: 20, name: '20°', maxSpeedKts: 85, liftFactor: 1.55, dragFactor: 1.40 },
      { degrees: 30, name: '30°', maxSpeedKts: 85, liftFactor: 1.85, dragFactor: 1.80 },
    ],
  }
};

// Aliases for lowercase / case-insensitive lookups
AIRCRAFT_FLEET['b737_800'] = AIRCRAFT_FLEET.B737_800;
AIRCRAFT_FLEET['a350_900'] = AIRCRAFT_FLEET.A350_900;
AIRCRAFT_FLEET['b777_300er'] = AIRCRAFT_FLEET.B777_300ER;
AIRCRAFT_FLEET['c172_skyhawk'] = AIRCRAFT_FLEET.C172_SKYHAWK;

export function getAircraft(id?: string): AircraftSpecs {
  if (!id) return AIRCRAFT_FLEET.B737_800;
  return (
    AIRCRAFT_FLEET[id] ||
    AIRCRAFT_FLEET[id.toUpperCase()] ||
    AIRCRAFT_FLEET[id.toLowerCase()] ||
    AIRCRAFT_FLEET.B737_800
  );
}
