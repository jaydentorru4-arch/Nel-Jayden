import { AircraftSpecs, AircraftSystemsState, AirportData, AutopilotState, FlightPhase, FlightTelemetry, LandingReport, WeatherType } from '../types';
import { soundEngine } from './audio';

export interface PhysicsStepInput {
  dt: number;
  specs: AircraftSpecs;
  systems: AircraftSystemsState;
  autopilot: AutopilotState;
  telemetry: FlightTelemetry;
  weather: WeatherType;
  terrainElevationM: number;
  onCrash?: (reason: string) => void;
  onLanding?: (touchdownRateFpm: number, gForce: number, centerlineOffsetM: number) => void;
}

export class FlightPhysicsEngine {
  private previousAltitudeFt: number = 0;
  private calloutsMade: Set<number> = new Set();
  private gpwsBankAlerted: boolean = false;
  private gpwsSinkAlerted: boolean = false;
  private groundTime: number = 0;
  private landingTriggered: boolean = false;
  private v1Called: boolean = false;
  private vrCalled: boolean = false;
  private positiveClimbCalled: boolean = false;

  private telemetry: FlightTelemetry;
  private onTouchdownCb?: (report: LandingReport) => void;
  private onCrashCb?: (reason: string) => void;

  constructor(public specs: AircraftSpecs, public airport: AirportData) {
    this.telemetry = this.createInitialTelemetry('GATE_PREPARATION');
  }

  public setAirportAndAircraft(airport: AirportData, specs: AircraftSpecs) {
    this.airport = airport;
    this.specs = specs;
  }

  public setOnTouchdownCallback(cb: (report: LandingReport) => void) {
    this.onTouchdownCb = cb;
  }

  public setOnCrashCallback(cb: (reason: string) => void) {
    this.onCrashCb = cb;
  }

  public getTelemetry(): FlightTelemetry {
    return this.telemetry;
  }

  public setPitchRollInput(pitch: number, roll: number) {
    this.telemetry.controlYokePitch = pitch;
    this.telemetry.controlYokeRoll = roll;
  }

  public setRudderInput(rudder: number) {
    this.telemetry.controlRudder = rudder;
  }

  public setThrottleInput(throttle: number) {
    this.telemetry.throttle = Math.max(0, Math.min(1, throttle));
  }

  public adjustThrottle(delta: number) {
    this.telemetry.throttle = Math.max(0, Math.min(1, this.telemetry.throttle + delta));
  }

  public setBrakeInput(brake: number) {
    this.telemetry.wheelBrake = Math.max(0, Math.min(1, brake));
  }

  public setParkingBrake(park: boolean) {
    // will be handled in systems
  }

  public toggleGear(down: boolean) {
    this.telemetry.gearRatio = down ? 1 : 0;
  }

  public setFlapsIndex(index: number) {
    const totalStages = this.specs?.flapStages?.length || 1;
    this.telemetry.flapsRatio = index / Math.max(1, totalStages - 1);
  }

  public toggleSpoilers(extended: boolean) {
    this.telemetry.spoilersRatio = extended ? 1 : 0;
  }

  public setReverseThrust(reverse: boolean) {
    // handled in update
  }

  public applyPushbackTug(direction: 'STRAIGHT' | 'LEFT' | 'RIGHT', dt: number) {
    const hdgRad = (this.telemetry.headingDeg * Math.PI) / 180;
    // Pushback moves aircraft backwards
    const reverseSpeed = 2.5; // ~5 knots pushback speed
    this.telemetry.velocity.x = Math.sin(hdgRad) * reverseSpeed;
    this.telemetry.velocity.z = Math.cos(hdgRad) * reverseSpeed;

    if (direction === 'LEFT') {
      this.telemetry.headingDeg = (this.telemetry.headingDeg - 8 * dt + 360) % 360;
    } else if (direction === 'RIGHT') {
      this.telemetry.headingDeg = (this.telemetry.headingDeg + 8 * dt) % 360;
    }
  }

  public resetCallouts() {
    this.calloutsMade.clear();
    this.gpwsBankAlerted = false;
    this.gpwsSinkAlerted = false;
    this.landingTriggered = false;
    this.v1Called = false;
    this.vrCalled = false;
    this.positiveClimbCalled = false;
  }

  public resetToPhase(phase: FlightPhase) {
    this.resetCallouts();
    this.telemetry = this.createInitialTelemetry(phase);
  }

  private createInitialTelemetry(phase: FlightPhase): FlightTelemetry {
    const rwy = this.airport.runways[0];
    const rwyHdgRad = (rwy.heading * Math.PI) / 180;

    switch (phase) {
      case 'TAKEOFF_ROLL':
        return {
          position: { x: rwy.thresholdX, y: 3.5, z: rwy.thresholdZ },
          velocity: { x: 0, y: 0, z: 0 },
          pitchDeg: 0,
          rollDeg: 0,
          headingDeg: rwy.heading,
          yawRate: 0,
          pitchRate: 0,
          rollRate: 0,
          indicatedAirspeedKts: 0,
          trueAirspeedKts: 0,
          groundSpeedKts: 0,
          altitudeFt: this.airport.elevation + 10,
          radioAltitudeFt: 0,
          verticalSpeedFpm: 0,
          mach: 0,
          gForce: 1.0,
          angleAttackDeg: 0,
          sideSlipDeg: 0,
          throttle: 0,
          controlYokePitch: 0,
          controlYokeRoll: 0,
          controlRudder: 0,
          wheelBrake: 0,
          onGround: true,
          isGrounded: true,
          weightKg: this.specs.emptyWeight + 12000,
          fuelKg: 14000,
          passengerCount: 160,
          cargoWeightKg: 3500,
          windSpeedKts: 8,
          windHeadingDeg: (rwy.heading + 180) % 360,
          turbulenceIntensity: 0.1,
          outsideAirTempC: 15,
          baroPressureHpa: 1013,
          flapsRatio: 0.25,
          gearRatio: 1,
          spoilersRatio: 0,
          hasCrashed: false,
        };

      case 'CLIMB':
        return {
          position: {
            x: rwy.thresholdX - Math.sin(rwyHdgRad) * 4500,
            y: 900,
            z: rwy.thresholdZ - Math.cos(rwyHdgRad) * 4500,
          },
          velocity: {
            x: -Math.sin(rwyHdgRad) * 110,
            y: 12,
            z: -Math.cos(rwyHdgRad) * 110,
          },
          pitchDeg: 12,
          rollDeg: 0,
          headingDeg: rwy.heading,
          yawRate: 0,
          pitchRate: 0,
          rollRate: 0,
          indicatedAirspeedKts: 220,
          trueAirspeedKts: 235,
          groundSpeedKts: 230,
          altitudeFt: this.airport.elevation + 3000,
          radioAltitudeFt: 3000,
          verticalSpeedFpm: 2400,
          mach: 0.35,
          gForce: 1.0,
          angleAttackDeg: 4.5,
          sideSlipDeg: 0,
          throttle: 0.85,
          controlYokePitch: 0,
          controlYokeRoll: 0,
          controlRudder: 0,
          wheelBrake: 0,
          onGround: false,
          isGrounded: false,
          weightKg: this.specs.emptyWeight + 12000,
          fuelKg: 14000,
          passengerCount: 160,
          cargoWeightKg: 3500,
          windSpeedKts: 12,
          windHeadingDeg: (rwy.heading + 150) % 360,
          turbulenceIntensity: 0.1,
          outsideAirTempC: 10,
          baroPressureHpa: 910,
          flapsRatio: 0,
          gearRatio: 0,
          spoilersRatio: 0,
          hasCrashed: false,
        };

      case 'CRUISE':
        return {
          position: { x: 0, y: 10500, z: -15000 },
          velocity: { x: 0, y: 0, z: -230 },
          pitchDeg: 2.2,
          rollDeg: 0,
          headingDeg: 360,
          yawRate: 0,
          pitchRate: 0,
          rollRate: 0,
          indicatedAirspeedKts: 280,
          trueAirspeedKts: 460,
          groundSpeedKts: 470,
          altitudeFt: 34000,
          radioAltitudeFt: 34000,
          verticalSpeedFpm: 0,
          mach: 0.78,
          gForce: 1.0,
          angleAttackDeg: 2.4,
          sideSlipDeg: 0,
          throttle: 0.74,
          controlYokePitch: 0,
          controlYokeRoll: 0,
          controlRudder: 0,
          wheelBrake: 0,
          onGround: false,
          isGrounded: false,
          weightKg: this.specs.emptyWeight + 10000,
          fuelKg: 10000,
          passengerCount: 160,
          cargoWeightKg: 3500,
          windSpeedKts: 45,
          windHeadingDeg: 290,
          turbulenceIntensity: 0.15,
          outsideAirTempC: -52,
          baroPressureHpa: 250,
          flapsRatio: 0,
          gearRatio: 0,
          spoilersRatio: 0,
          hasCrashed: false,
        };

      case 'FINAL_LANDING':
        return {
          position: {
            x: rwy.thresholdX + Math.sin(rwyHdgRad) * 4500,
            y: 240,
            z: rwy.thresholdZ + Math.cos(rwyHdgRad) * 4500,
          },
          velocity: {
            x: -Math.sin(rwyHdgRad) * 72,
            y: -3.8,
            z: -Math.cos(rwyHdgRad) * 72,
          },
          pitchDeg: 3.5,
          rollDeg: 0,
          headingDeg: rwy.heading,
          yawRate: 0,
          pitchRate: 0,
          rollRate: 0,
          indicatedAirspeedKts: 142,
          trueAirspeedKts: 145,
          groundSpeedKts: 140,
          altitudeFt: this.airport.elevation + 800,
          radioAltitudeFt: 800,
          verticalSpeedFpm: -750,
          mach: 0.22,
          gForce: 1.0,
          angleAttackDeg: 4.8,
          sideSlipDeg: 0,
          throttle: 0.52,
          controlYokePitch: 0,
          controlYokeRoll: 0,
          controlRudder: 0,
          wheelBrake: 0,
          onGround: false,
          isGrounded: false,
          weightKg: this.specs.emptyWeight + 8000,
          fuelKg: 7500,
          passengerCount: 160,
          cargoWeightKg: 3500,
          windSpeedKts: 6,
          windHeadingDeg: rwy.heading,
          turbulenceIntensity: 0.05,
          outsideAirTempC: 15,
          baroPressureHpa: 1013,
          flapsRatio: 0.8,
          gearRatio: 1,
          spoilersRatio: 0,
          hasCrashed: false,
        };

      case 'GATE_PREPARATION':
      default:
        return {
          position: { x: -140, y: 3.5, z: -160 },
          velocity: { x: 0, y: 0, z: 0 },
          pitchDeg: 0,
          rollDeg: 0,
          headingDeg: 134,
          yawRate: 0,
          pitchRate: 0,
          rollRate: 0,
          indicatedAirspeedKts: 0,
          trueAirspeedKts: 0,
          groundSpeedKts: 0,
          altitudeFt: this.airport.elevation + 10,
          radioAltitudeFt: 0,
          verticalSpeedFpm: 0,
          mach: 0,
          gForce: 1.0,
          angleAttackDeg: 0,
          sideSlipDeg: 0,
          throttle: 0,
          controlYokePitch: 0,
          controlYokeRoll: 0,
          controlRudder: 0,
          wheelBrake: 0,
          onGround: true,
          isGrounded: true,
          weightKg: this.specs.emptyWeight + 16000,
          fuelKg: 16500,
          passengerCount: 162,
          cargoWeightKg: 4200,
          windSpeedKts: 4,
          windHeadingDeg: 270,
          turbulenceIntensity: 0.02,
          outsideAirTempC: 18,
          baroPressureHpa: 1013,
          flapsRatio: 0,
          gearRatio: 1,
          spoilersRatio: 0,
          hasCrashed: false,
        };
    }
  }

  public update(dt: number, systems: AircraftSystemsState, autopilot: AutopilotState) {
    this.telemetry = this.step({
      dt,
      specs: this.specs,
      systems,
      autopilot,
      telemetry: this.telemetry,
      weather: 'CLEAR',
      terrainElevationM: this.airport.elevation * 0.3048,
      onCrash: (reason) => {
        this.telemetry.hasCrashed = true;
        if (this.onCrashCb) this.onCrashCb(reason);
      },
      onLanding: (touchdownRateFpm, gForce, centerlineOffsetM) => {
        if (this.onTouchdownCb) {
          const rating =
            Math.abs(touchdownRateFpm) < 150
              ? 'BUTTER'
              : Math.abs(touchdownRateFpm) < 240
              ? 'EXCELLENT'
              : Math.abs(touchdownRateFpm) < 400
              ? 'GOOD'
              : Math.abs(touchdownRateFpm) < 650
              ? 'FIRM'
              : Math.abs(touchdownRateFpm) < 1100
              ? 'HARD'
              : 'CRASH';

          this.onTouchdownCb({
            timestamp: Date.now(),
            touchdownRateFpm,
            gForceMax: gForce,
            centerlineOffsetM,
            approachSpeedKts: Math.round(this.telemetry.indicatedAirspeedKts || 140),
            rating,
            comments:
              rating === 'BUTTER'
                ? 'Flawless touchdown! Silky smooth flare and centerline tracking.'
                : rating === 'EXCELLENT'
                ? 'Outstanding landing, well within airline passenger comfort parameters.'
                : rating === 'GOOD'
                ? 'Standard airline touchdown. Firm positive contact on touchdown markers.'
                : rating === 'FIRM'
                ? 'Noticeable firm bump on landing. Passenger seatbelts held.'
                : rating === 'HARD'
                ? 'Heavy impact on landing gears. Runway inspection required.'
                : 'Catastrophic gear structural collapse on touchdown.',
            flightTimeMinutes: 6,
            fuelUsedKg: 420,
            airport: this.airport.icao,
            runway: this.airport.runways[0].name,
          });
        }
      },
    });
    this.telemetry.isGrounded = this.telemetry.onGround;
  }

  public step(input: PhysicsStepInput): FlightTelemetry {
    const { dt, specs, systems, autopilot, telemetry, onCrash, onLanding } = input;
    const clampedDt = Math.min(0.1, Math.max(0.001, dt));

    // Copy telemetry to update
    const t = { ...telemetry };

    // Atmospheric calculations (ISA Model)
    const altM = Math.max(0, t.altitudeFt * 0.3048);
    // Air density rho (kg/m^3)
    const T0 = 288.15; // Sea level standard temperature Kelvin
    const L = 0.0065; // Temperature lapse rate K/m
    const tempK = Math.max(216.65, T0 - L * altM);
    const pressurePa = 101325 * Math.pow(tempK / T0, 5.25588);
    const rho = pressurePa / (287.05 * tempK);
    const speedOfSound = Math.sqrt(1.4 * 287.05 * tempK); // m/s

    t.outsideAirTempC = Math.round(tempK - 273.15);
    t.baroPressureHpa = Math.round(pressurePa / 100);

    // Current Aircraft Weight
    const totalWeightKg = specs.emptyWeight + t.fuelKg + (t.passengerCount * 80) + t.cargoWeightKg;
    t.weightKg = totalWeightKg;
    const weightForceN = totalWeightKg * 9.80665;

    // Wing geometry
    const wingAreaS = (specs.wingspan * specs.length) * 0.18; // approximate wing planform area
    const aspectratio = (specs.wingspan * specs.wingspan) / wingAreaS;
    const oswaldEfficiency = 0.82;

    // Speeds: Velocity vector magnitude (TAS in m/s)
    const vx = t.velocity.x;
    const vy = t.velocity.y;
    const vz = t.velocity.z;
    const currentSpeedMs = Math.sqrt(vx * vx + vy * vy + vz * vz);
    t.trueAirspeedKts = currentSpeedMs * 1.94384;
    t.indicatedAirspeedKts = t.trueAirspeedKts * Math.sqrt(rho / 1.225);
    t.groundSpeedKts = Math.sqrt(vx * vx + vz * vz) * 1.94384;
    t.mach = currentSpeedMs / speedOfSound;

    // Radio altitude (height above ground level)
    const groundLevelFt = input.terrainElevationM * 3.28084;
    t.radioAltitudeFt = Math.max(0, t.altitudeFt - groundLevelFt);

    // Flap properties
    const defaultFlapStage = { degrees: 0, name: 'UP', maxSpeedKts: 340, liftFactor: 1.0, dragFactor: 1.0 };
    const flapStages = specs?.flapStages || [defaultFlapStage];
    const activeFlap = flapStages[systems.flapsIndex] || flapStages[0] || defaultFlapStage;

    // Engine thrust computation
    let totalThrustN = 0;
    const isEngineActive = systems.engine1Running || systems.engine2Running;
    const avgN1 = ((systems.engine1N1 + systems.engine2N1) / 2) / 100;

    if (isEngineActive) {
      const maxThrust = specs.maxThrustPerEngine * specs.engineCount;
      const densityThrustFactor = Math.pow(rho / 1.225, 0.7); // turbine thrust decreases at altitude
      const thrustAvailable = maxThrust * densityThrustFactor;

      if (systems.reverseThrust && t.onGround) {
        totalThrustN = -thrustAvailable * 0.45 * avgN1;
      } else {
        totalThrustN = thrustAvailable * Math.pow(avgN1, 1.8);
      }
    }

    // Engine spooling update
    let targetN1 = 4; // idle
    if (systems.engine1Running || systems.engine2Running) {
      targetN1 = systems.reverseThrust ? 75 : 18 + t.throttle * 82;
    }
    const spoolRate = 22 * clampedDt; // ~4 seconds idle to full thrust
    systems.engine1N1 += (targetN1 - systems.engine1N1) * Math.min(1.0, spoolRate * 0.1);
    systems.engine2N1 += (targetN1 - systems.engine2N1) * Math.min(1.0, spoolRate * 0.1);
    systems.engine1EGT = 400 + (systems.engine1N1 * 4.2);
    systems.engine2EGT = 400 + (systems.engine2N1 * 4.2);

    // Update audio engine with engine RPM and airspeed
    soundEngine.updateEngineSound(avgN1 * 100, t.indicatedAirspeedKts, systems.reverseThrust, systems.avionics);

    // AUTOPILOT CONTROLLERS
    if (autopilot.engaged) {
      // Auto-throttle
      if (autopilot.autoThrottle) {
        const speedErr = autopilot.targetSpeedKts - t.indicatedAirspeedKts;
        t.throttle = Math.max(0, Math.min(1.0, t.throttle + speedErr * 0.008 * clampedDt));
      }

      // Altitude / Vertical Speed Hold
      if (autopilot.altitudeHold) {
        const altErr = autopilot.targetAltitudeFt - t.altitudeFt;
        let commandedVS = Math.max(-2500, Math.min(3000, altErr * 1.5));
        if (autopilot.verticalSpeedHold) {
          commandedVS = autopilot.targetVerticalSpeedFpm;
        }
        const vsErr = commandedVS - t.verticalSpeedFpm;
        t.controlYokePitch = Math.max(-0.6, Math.min(0.7, vsErr * 0.0015));
      }

      // Heading Hold
      if (autopilot.headingHold) {
        let hdgErr = (autopilot.targetHeadingDeg - t.headingDeg) % 360;
        if (hdgErr > 180) hdgErr -= 360;
        if (hdgErr < -180) hdgErr += 360;
        const targetRoll = Math.max(-28, Math.min(28, hdgErr * 1.8));
        const rollErr = targetRoll - t.rollDeg;
        t.controlYokeRoll = Math.max(-0.7, Math.min(0.7, rollErr * 0.04));
      }
    }

    // Aerodynamic Angles
    // Convert heading & pitch to forward unit vector
    const hdgRad = (t.headingDeg * Math.PI) / 180;
    const pitchRad = (t.pitchDeg * Math.PI) / 180;
    const rollRad = (t.rollDeg * Math.PI) / 180;

    const fwdX = -Math.sin(hdgRad) * Math.cos(pitchRad);
    const fwdY = Math.sin(pitchRad);
    const fwdZ = -Math.cos(hdgRad) * Math.cos(pitchRad);

    // Angle of attack alpha (angle between aircraft longitudinal axis and velocity vector)
    const flightPathAngleRad = currentSpeedMs > 5 ? Math.asin(Math.max(-1, Math.min(1, vy / currentSpeedMs))) : 0;
    t.angleAttackDeg = t.pitchDeg - (flightPathAngleRad * 180 / Math.PI);

    // Dynamic Pressure q = 0.5 * rho * v^2
    const dynamicPressure = 0.5 * rho * currentSpeedMs * currentSpeedMs;

    // Lift Coefficient Cl calculation with stall modeling
    const alphaRad = (t.angleAttackDeg * Math.PI) / 180;
    let cl = 2 * Math.PI * alphaRad * activeFlap.liftFactor + 0.28;

    // Stall cutoff (~15 to 18 deg)
    const stallAngleDeg = 15 + (activeFlap.degrees > 0 ? 3 : 0);
    const isStalled = Math.abs(t.angleAttackDeg) > stallAngleDeg && !t.onGround;
    if (isStalled) {
      // Post-stall lift breakdown
      cl *= Math.max(0.2, 1.0 - (Math.abs(t.angleAttackDeg) - stallAngleDeg) * 0.08);
      // Stall buffeting
      t.controlYokePitch -= 0.15 * clampedDt; // natural nose-down pitching moment in stall
      if (Math.random() < 0.3) {
        soundEngine.speakCallout("STALL");
      }
    }

    // Ground effect cushion (within 1 wingspan above ground)
    let groundEffectFactor = 1.0;
    const heightOverWingspan = t.radioAltitudeFt / (specs.wingspan * 3.28084);
    if (heightOverWingspan < 1.0) {
      const hRatio = Math.max(0.1, heightOverWingspan);
      groundEffectFactor = 1.0 + (1.0 - hRatio) * 0.18; // up to 18% lift boost near runway!
    }

    const liftForceN = dynamicPressure * wingAreaS * cl * groundEffectFactor;

    // Drag Coefficient Cd calculation
    const cd0 = 0.021; // parasite drag
    let inducedDragFactor = (cl * cl) / (Math.PI * aspectratio * oswaldEfficiency);
    if (heightOverWingspan < 1.0) {
      // Ground effect reduces induced drag significantly!
      const k = 16 * heightOverWingspan * heightOverWingspan / (1 + 16 * heightOverWingspan * heightOverWingspan);
      inducedDragFactor *= Math.max(0.4, k);
    }

    let flapDrag = (activeFlap.dragFactor - 1.0) * 0.035;
    let gearDrag = systems.gearDown ? 0.018 : 0.0;
    let spoilerDrag = systems.spoilersExtended ? 0.065 : 0.0;
    const cd = cd0 + inducedDragFactor + flapDrag + gearDrag + spoilerDrag;
    const dragForceN = dynamicPressure * wingAreaS * cd;

    // PITCH, ROLL, YAW ROTATIONAL DYNAMICS
    const controlEffectiveness = Math.min(1.0, t.indicatedAirspeedKts / 90);
    const pitchAuthority = (specs.category === 'GENERAL_AVIATION' ? 45 : 24) * controlEffectiveness;
    const rollAuthority = (specs.category === 'GENERAL_AVIATION' ? 65 : 32) * controlEffectiveness;
    const yawAuthority = (specs.category === 'GENERAL_AVIATION' ? 25 : 14) * controlEffectiveness;

    if (!t.onGround) {
      // In-flight rotational moments with aerodynamic damping
      const trimValue = systems.elevatorTrim || 0;
      const targetPitchRate = t.controlYokePitch * pitchAuthority + (trimValue * 2);
      const targetRollRate = t.controlYokeRoll * rollAuthority;
      const targetYawRate = t.controlRudder * yawAuthority;

      t.pitchRate += (targetPitchRate - t.pitchRate) * Math.min(1.0, 5.0 * clampedDt);
      t.rollRate += (targetRollRate - t.rollRate) * Math.min(1.0, 6.0 * clampedDt);
      t.yawRate += (targetYawRate - t.yawRate) * Math.min(1.0, 4.0 * clampedDt);

      t.pitchDeg += t.pitchRate * clampedDt;
      t.rollDeg += t.rollRate * clampedDt;
      t.headingDeg = (t.headingDeg + t.yawRate * clampedDt + 360) % 360;

      // Coordinate flight bank-to-turn yaw
      const turnRateDeg = (9.80665 * Math.tan(rollRad) / Math.max(15, currentSpeedMs)) * (180 / Math.PI);
      t.headingDeg = (t.headingDeg + turnRateDeg * clampedDt + 360) % 360;

      // Pitch limits
      t.pitchDeg = Math.max(-85, Math.min(85, t.pitchDeg));
      // Roll wrap
      if (t.rollDeg > 180) t.rollDeg -= 360;
      if (t.rollDeg < -180) t.rollDeg += 360;
    } else {
      // On-ground physics
      // Nosewheel steering with rudder at taxi speeds
      const steeringRate = t.controlRudder * (t.groundSpeedKts < 35 ? 35 : 12);
      t.headingDeg = (t.headingDeg + steeringRate * clampedDt + 360) % 360;

      // Pitch rotation on takeoff roll (Vr)
      if (t.indicatedAirspeedKts > specs.vrSpeedKts * 0.75) {
        const rotateCommand = Math.max(0, t.controlYokePitch) * 16 * (t.indicatedAirspeedKts / specs.vrSpeedKts);
        t.pitchDeg = Math.max(0, Math.min(14, t.pitchDeg + (rotateCommand - t.pitchDeg) * 3 * clampedDt));
      } else {
        // Flat on tricycle gear
        t.pitchDeg += (0 - t.pitchDeg) * 5 * clampedDt;
      }
      // Wings level on ground
      t.rollDeg += (0 - t.rollDeg) * 8 * clampedDt;

      // Takeoff speed callouts
      if (t.indicatedAirspeedKts >= specs.v1SpeedKts && !this.v1Called) {
        this.v1Called = true;
        soundEngine.speakCallout("V1");
      }
      if (t.indicatedAirspeedKts >= specs.vrSpeedKts && !this.vrCalled) {
        this.vrCalled = true;
        soundEngine.speakCallout("ROTATE");
      }
    }

    // ACCELERATION AND FORCES (6-DOF Translation)
    // Thrust vector in world space
    const thrustX = fwdX * totalThrustN;
    const thrustY = fwdY * totalThrustN;
    const thrustZ = fwdZ * totalThrustN;

    // Drag vector opposes velocity vector
    const dragRatio = currentSpeedMs > 0.1 ? dragForceN / currentSpeedMs : 0;
    const dragX = -vx * dragRatio;
    const dragY = -vy * dragRatio;
    const dragZ = -vz * dragRatio;

    // Lift vector acts perpendicular to flight path and wings
    // Up vector in aircraft body frame
    const upX = Math.sin(rollRad) * Math.sin(hdgRad) + Math.sin(pitchRad) * Math.cos(rollRad) * -Math.sin(hdgRad);
    const upY = Math.cos(pitchRad) * Math.cos(rollRad);
    const upZ = -Math.sin(rollRad) * Math.cos(hdgRad) + Math.sin(pitchRad) * Math.cos(rollRad) * -Math.cos(hdgRad);

    const liftX = upX * liftForceN;
    const liftY = upY * liftForceN;
    const liftZ = upZ * liftForceN;

    // Total aerodynamic + gravity forces
    let netForceX = thrustX + dragX + liftX;
    let netForceY = thrustY + dragY + liftY - weightForceN;
    let netForceZ = thrustZ + dragZ + liftZ;

    // Ground normal force and friction
    const gearHeightM = specs.category === 'GENERAL_AVIATION' ? 1.8 : 3.5;
    const isTouchingGround = t.position.y <= gearHeightM + 0.1;
    if (isTouchingGround) {
      if (!t.onGround) {
        // TOUCHDOWN MOMENT!
        t.onGround = true;
        const touchdownVS = t.verticalSpeedFpm;
        soundEngine.playTouchdownSqueal(touchdownVS);

        // Landing quality calculation
        if (onLanding && !this.landingTriggered) {
          this.landingTriggered = true;
          const g = Math.max(1.0, 1.0 + Math.abs(touchdownVS) / 400);
          onLanding(touchdownVS, g, Math.abs(t.position.x % 100));
        }

        // Crash conditions on touchdown
        if (!systems.gearDown) {
          onCrash?.("Belly landing! Landing gear was not extended.");
        } else if (Math.abs(touchdownVS) > 1400) {
          onCrash?.(`Catastrophic hard landing (${Math.round(touchdownVS)} ft/min). Landing gear collapsed.`);
        } else if (Math.abs(t.rollDeg) > 14) {
          onCrash?.("Wingtip strike on runway during crosswind landing.");
        } else if (t.pitchDeg > 13) {
          onCrash?.("Tailstrike! Pitch attitude exceeded tail clearance limit.");
        }
      }

      // Support force from runway
      if (netForceY < 0) {
        netForceY = 0;
      }
      t.velocity.y = Math.max(0, t.velocity.y);
      t.position.y = gearHeightM;

      // Rolling friction + Brakes
      let frictionCoeff = 0.025; // standard tarmac rolling friction
      if (systems.parkingBrake) {
        frictionCoeff = 0.85;
      } else if (t.wheelBrake > 0) {
        frictionCoeff = 0.025 + t.wheelBrake * 0.45;
      } else if (systems.autobrake !== 'OFF' && systems.autobrake !== 'RTO') {
        // Landing autobrakes: only apply when throttle is pulled low on rollout
        if (t.throttle < 0.25) {
          const brakeLevels: Record<string, number> = { '1': 0.18, '2': 0.28, '3': 0.40, 'MAX': 0.60 };
          frictionCoeff = 0.025 + (brakeLevels[systems.autobrake] || 0.25);
        }
      } else if (systems.autobrake === 'RTO') {
        // RTO is armed on takeoff: only triggers if pilot rejects takeoff (cuts throttle at high speed)
        if (t.throttle < 0.1 && t.groundSpeedKts > 50 && (systems.reverseThrust || systems.spoilersExtended)) {
          frictionCoeff = 0.85;
        }
      }

      const groundSpeed = Math.sqrt(vx * vx + vz * vz);
      if (groundSpeed > 0.1) {
        const brakeForce = weightForceN * frictionCoeff;
        const brakeDecel = brakeForce / totalWeightKg;
        const decelRatio = Math.min(groundSpeed, brakeDecel * clampedDt) / groundSpeed;
        t.velocity.x -= vx * decelRatio;
        t.velocity.z -= vz * decelRatio;
      }
    } else {
      t.onGround = false;
      this.landingTriggered = false;

      // Positive climb callout once safely airborne
      if (t.radioAltitudeFt > 30 && t.verticalSpeedFpm > 200 && !this.positiveClimbCalled) {
        this.positiveClimbCalled = true;
        soundEngine.speakCallout("POSITIVE CLIMB");
      }
    }

    // Accelerations (F = m * a)
    const ax = netForceX / totalWeightKg;
    const ay = netForceY / totalWeightKg;
    const az = netForceZ / totalWeightKg;

    // Integrate velocity
    t.velocity.x += ax * clampedDt;
    t.velocity.y += ay * clampedDt;
    t.velocity.z += az * clampedDt;

    // G-Force
    t.gForce = 1.0 + (ay / 9.80665);

    // Integrate position
    t.position.x += t.velocity.x * clampedDt;
    t.position.y += t.velocity.y * clampedDt;
    t.position.z += t.velocity.z * clampedDt;

    // Altitude in feet
    t.radioAltitudeFt = Math.max(0, (t.position.y - gearHeightM) * 3.28084);
    t.altitudeFt = groundLevelFt + (t.position.y * 3.28084);
    t.verticalSpeedFpm = (t.velocity.y * 3.28084) * 60;

    // Fuel consumption: burns fuel based on thrust and time
    if (isEngineActive) {
      const burnRateKgSec = (totalThrustN / 120000) * 0.65;
      t.fuelKg = Math.max(0, t.fuelKg - burnRateKgSec * clampedDt);
    }

    // CRASH DETECTION IN FLIGHT
    if (!t.onGround) {
      // CFIT (Controlled Flight into Terrain)
      if (t.radioAltitudeFt <= 1.0 && currentSpeedMs > 30) {
        onCrash?.("Terrain collision! Aircraft impacted ground at high speed.");
      }
      // Overspeed structural failure
      if (t.indicatedAirspeedKts > specs.maxSpeedMach * 450) {
        onCrash?.("Structural overspeed! Aircraft exceeded maximum operating limit.");
      }
      // Overstress G-force
      if (t.gForce > 3.8 || t.gForce < -1.8) {
        onCrash?.(`Airframe overstressed (${t.gForce.toFixed(1)}G). Exceeded structural design limits.`);
      }
    }

    // GPWS AND RADIO ALTIMETER CALLOUTS
    if (!t.onGround && t.radioAltitudeFt < 600 && t.verticalSpeedFpm < -100) {
      const callouts = [500, 100, 50, 40, 30, 20, 10];
      for (const callout of callouts) {
        if (t.radioAltitudeFt <= callout && this.previousAltitudeFt > callout && !this.calloutsMade.has(callout)) {
          this.calloutsMade.add(callout);
          soundEngine.speakCallout(callout.toString());
          break;
        }
      }
    }

    // Bank angle warning (> 35 degrees)
    if (Math.abs(t.rollDeg) > 35 && !this.gpwsBankAlerted && !t.onGround) {
      this.gpwsBankAlerted = true;
      soundEngine.speakCallout("BANK ANGLE");
      setTimeout(() => { this.gpwsBankAlerted = false; }, 3500);
    }

    // Excessive sink rate
    if (t.verticalSpeedFpm < -2200 && t.radioAltitudeFt < 1500 && !this.gpwsSinkAlerted && !t.onGround) {
      this.gpwsSinkAlerted = true;
      soundEngine.speakCallout("SINK RATE");
      setTimeout(() => { this.gpwsSinkAlerted = false; }, 4000);
    }

    this.previousAltitudeFt = t.radioAltitudeFt;
    return t;
  }
}
