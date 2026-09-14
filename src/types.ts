export type FlightPhase = 
  | 'GATE_PREPARATION'
  | 'PUSHBACK'
  | 'TAXI'
  | 'TAKEOFF_ROLL'
  | 'CLIMB'
  | 'CRUISE'
  | 'DESCENT'
  | 'APPROACH'
  | 'FINAL_LANDING'
  | 'ROLLOUT'
  | 'TAXI_TO_GATE'
  | 'PARKED'
  | 'CRASHED';

export type CameraMode = 'COCKPIT' | 'CHASE' | 'ORBIT' | 'WING' | 'FLYBY' | 'TOWER';

export type WeatherType = 'CLEAR' | 'FEW_CLOUDS' | 'OVERCAST' | 'RAIN_STORM' | 'FOG' | 'SUNSET';

export interface AirportRunway {
  id: string;
  name: string; // e.g. "31L"
  length: number; // meters
  width: number; // meters
  heading: number; // degrees true
  elevation: number; // feet MSL
  thresholdX: number; // local coordinates in meters relative to airport center
  thresholdZ: number;
  endX: number;
  endZ: number;
  ilsFrequency?: string; // e.g. "110.90"
  hasIls: boolean;
  papiAngle: number; // standard 3.0 degrees
}

export interface TaxiwayNode {
  id: string;
  name: string;
  x: number;
  z: number;
  type: 'GATE' | 'INTERSECTION' | 'HOLD_SHORT' | 'RUNWAY_ENTRY';
}

export interface AirportData {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  elevation: number; // feet
  runways: AirportRunway[];
  gates: { id: string; name: string; x: number; z: number; heading: number }[];
  taxiwayPaths: [string, string][]; // node connections
  taxiwayNodes: Record<string, TaxiwayNode>;
  terrainBiome: 'COASTAL' | 'DESERT' | 'ALPINE' | 'TEMPERATE' | 'TROPICAL';
  skylineLandmarks?: { name: string; x: number; z: number; height: number; type: 'TOWER' | 'SKYSCRAPER' | 'BRIDGE' | 'MOUNTAIN' }[];
}

export interface AircraftSpecs {
  id: string;
  name: string;
  manufacturer: string;
  category: 'AIRLINER_NARROW' | 'AIRLINER_WIDE' | 'AIRLINER_HEAVY' | 'GENERAL_AVIATION';
  description: string;
  wingspan: number; // meters
  length: number; // meters
  emptyWeight: number; // kg
  maxTakeoffWeight: number; // kg
  maxFuel: number; // kg
  maxThrustPerEngine: number; // Newtons
  engineCount: number;
  engineType: 'TURBOFAN' | 'PISTON';
  maxPassengerCapacity: number;
  cargoCapacityKg: number;
  cruiseSpeedKts: number;
  maxSpeedMach: number;
  stallSpeedCleanKts: number;
  stallSpeedLandingKts: number;
  serviceCeilingFt: number;
  v1SpeedKts: number;
  vrSpeedKts: number;
  v2SpeedKts: number;
  landingSpeedKts: number;
  flapStages: { degrees: number; name: string; maxSpeedKts: number; liftFactor: number; dragFactor: number }[];
}

export interface AircraftSystemsState {
  battery: boolean;
  apuMaster: boolean;
  apuRunning: boolean;
  apuBleed: boolean;
  fuelPumps: boolean;
  hydraulics: boolean;
  avionics: boolean;
  engine1Running: boolean;
  engine2Running: boolean;
  engine1N1: number; // 0 - 100%
  engine2N1: number;
  engine1EGT: number; // °C
  engine2EGT: number;
  navLights: boolean;
  beaconLights: boolean;
  strobeLights: boolean;
  taxiLights: boolean;
  landingLights: boolean;
  cabinLights: boolean;
  seatbeltSigns: boolean;
  deIce: boolean;
  pitotHeat: boolean;
  parkingBrake: boolean;
  autobrake: 'OFF' | '1' | '2' | '3' | 'MAX' | 'RTO';
  spoilersArmed: boolean;
  spoilersExtended: boolean; // 0 to 1
  gearDown: boolean;
  gearTransitProgress: number; // 0 = fully up, 1 = fully down
  flapsIndex: number; // index into flapStages
  flapsTransitProgress: number;
  reverseThrust: boolean;
  elevatorTrim: number; // -1 to +1 (units -10 to +10)
}

export interface AutopilotState {
  engaged: boolean;
  flightDirector: boolean;
  autoThrottle: boolean;
  targetSpeedKts: number;
  targetAltitudeFt: number;
  targetVerticalSpeedFpm: number;
  targetHeadingDeg: number;
  headingHold: boolean;
  altitudeHold: boolean;
  verticalSpeedHold: boolean;
  navMode: boolean; // follow route
  approachMode: boolean; // ILS capture
  glideslopeCaptured: boolean;
  localizerCaptured: boolean;
}

export interface FlightTelemetry {
  position: { x: number; y: number; z: number }; // meters in world coordinates
  velocity: { x: number; y: number; z: number }; // m/s
  pitchDeg: number; // positive = nose up
  rollDeg: number; // positive = right bank
  headingDeg: number; // 0-360 degrees
  yawRate: number;
  pitchRate: number;
  rollRate: number;
  indicatedAirspeedKts: number;
  trueAirspeedKts: number;
  groundSpeedKts: number;
  altitudeFt: number; // MSL
  radioAltitudeFt: number; // AGL (Above Ground Level)
  verticalSpeedFpm: number;
  mach: number;
  gForce: number;
  angleAttackDeg: number;
  sideSlipDeg: number;
  throttle: number; // 0.0 to 1.0
  controlYokePitch: number; // -1 (push) to +1 (pull)
  controlYokeRoll: number; // -1 (left) to +1 (right)
  controlRudder: number; // -1 (left) to +1 (right)
  wheelBrake: number; // 0 to 1
  onGround: boolean;
  weightKg: number;
  fuelKg: number;
  passengerCount: number;
  cargoWeightKg: number;
  windSpeedKts: number;
  windHeadingDeg: number;
  turbulenceIntensity: number;
  outsideAirTempC: number;
  baroPressureHpa: number;
  flapsRatio?: number;
  gearRatio?: number;
  spoilersRatio?: number;
  isGrounded?: boolean;
  isStalling?: boolean;
  hasCrashed?: boolean;
}

export interface AirportOperations {
  jetwayConnected: boolean;
  passengersBoarded: number;
  maxPassengers: number;
  cargoLoadedKg: number;
  maxCargoKg: number;
  boardingInProgress: boolean;
  deboardingInProgress: boolean;
  pushbackRequested: boolean;
  pushbackActive: boolean;
  pushbackDirection: 'STRAIGHT' | 'LEFT' | 'RIGHT';
  assignedGateId: string;
  assignedRunwayId: string;
  taxiGuidanceActive: boolean;
  currentTaxiTargetNode?: string;
}

export interface ATCMessage {
  id: string;
  sender: 'TOWER' | 'GROUND' | 'DEPARTURE' | 'APPROACH' | 'PILOT';
  frequency: string;
  text: string;
  timestamp: number;
  requiresAck?: boolean;
  isInstruction?: boolean;
}

export interface FlightPlan {
  departure: AirportData;
  destination: AirportData;
  distanceNm: number;
  plannedAltitudeFt: number;
  departureRunway: AirportRunway;
  arrivalRunway: AirportRunway;
  waypoints: { name: string; x: number; z: number; altFt: number }[];
  currentWaypointIndex: number;
}

export interface LandingReport {
  timestamp: number;
  airport: string;
  runway: string;
  touchdownRateFpm: number;
  gForceMax: number;
  centerlineOffsetM: number;
  approachSpeedKts: number;
  rating: 'BUTTER' | 'EXCELLENT' | 'GOOD' | 'FIRM' | 'HARD' | 'CRASH';
  comments: string;
  flightTimeMinutes: number;
  fuelUsedKg: number;
}
