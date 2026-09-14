import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AIRCRAFT_FLEET } from './data/aircraft';
import { GLOBAL_AIRPORTS } from './data/airports';
import { FlightPhysicsEngine } from './simulation/physics';
import { FlightSimulatorScene } from './graphics/FlightSimulatorScene';
import { soundEngine } from './simulation/audio';
import {
  AircraftSpecs,
  AircraftSystemsState,
  AirportData,
  AirportOperations,
  ATCMessage,
  AutopilotState,
  CameraMode,
  FlightPhase,
  FlightTelemetry,
  LandingReport,
  WeatherType,
} from './types';
import { GlassCockpitPFD } from './components/GlassCockpitPFD';
import { GlassCockpitND } from './components/GlassCockpitND';
import { GlassCockpitEICAS } from './components/GlassCockpitEICAS';
import { AutopilotPanel } from './components/AutopilotPanel';
import { CockpitOverhead } from './components/CockpitOverhead';
import { ATCCommPanel } from './components/ATCCommPanel';
import { GroundOpsModal } from './components/GroundOpsModal';
import { FlightPlannerModal } from './components/FlightPlannerModal';
import { FlightReportModal } from './components/FlightReportModal';
import { FlightHUD } from './components/FlightHUD';
import { FlightTutorialModal } from './components/FlightTutorialModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const simSceneRef = useRef<FlightSimulatorScene | null>(null);
  const physicsRef = useRef<FlightPhysicsEngine | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Active Aircraft, Airport & Weather
  const [activeAirport, setActiveAirport] = useState<AirportData>(GLOBAL_AIRPORTS['KJFK'] || Object.values(GLOBAL_AIRPORTS)[0]);
  const [activeAircraft, setActiveAircraft] = useState<AircraftSpecs>(AIRCRAFT_FLEET['B737_800'] || Object.values(AIRCRAFT_FLEET)[0]);
  const [weather, setWeather] = useState<WeatherType>('CLEAR');
  const [cameraMode, setCameraMode] = useState<CameraMode>('CHASE');
  const [flightPhase, setFlightPhase] = useState<FlightPhase>('TAKEOFF_ROLL');

  // Modals & Panel Visibility
  const [showOverhead, setShowOverhead] = useState<boolean>(false);
  const [showATC, setShowATC] = useState<boolean>(false);
  const [showGroundOps, setShowGroundOps] = useState<boolean>(false);
  const [showFlightPlanner, setShowFlightPlanner] = useState<boolean>(false);
  const [landingReport, setLandingReport] = useState<LandingReport | null>(null);
  const [showInstruments, setShowInstruments] = useState<boolean>(false);
  const [isCleanView, setIsCleanView] = useState<boolean>(false);
  const [showAutopilot, setShowAutopilot] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Telemetry & Systems State (Positioned on Runway 31L of KJFK ready for takeoff)
  const [telemetry, setTelemetry] = useState<FlightTelemetry>({
    position: { x: 2000, y: 3.5, z: 2200 },
    velocity: { x: 0, y: 0, z: 0 },
    pitchDeg: 0,
    rollDeg: 0,
    headingDeg: 314,
    indicatedAirspeedKts: 0,
    trueAirspeedKts: 0,
    groundSpeedKts: 0,
    altitudeFt: 13,
    radioAltitudeFt: 0,
    verticalSpeedFpm: 0,
    angleAttackDeg: 0,
    gForce: 1.0,
    throttle: 0,
    flapsRatio: 0.15,
    gearRatio: 1,
    spoilersRatio: 0,
    fuelKg: 16500,
    isGrounded: true,
    isStalling: false,
    hasCrashed: false,
  });

  const [systems, setSystems] = useState<AircraftSystemsState>({
    battery: true,
    apuMaster: true,
    apuRunning: true,
    apuBleed: true,
    fuelPumps: true,
    hydraulics: true,
    avionics: true,
    engine1Running: true,
    engine2Running: true,
    engine1N1: 22.0,
    engine2N1: 22.0,
    engine1EGT: 420,
    engine2EGT: 420,
    parkingBrake: false,
    autobrake: 'RTO',
    flapsIndex: 1,
    flapsTransitProgress: 0.2,
    gearDown: true,
    gearTransitProgress: 1.0,
    spoilersArmed: true,
    spoilersExtended: false,
    reverseThrust: false,
    elevatorTrim: 0,
    navLights: true,
    beaconLights: true,
    strobeLights: true,
    taxiLights: false,
    landingLights: true,
    cabinLights: true,
    seatbeltSigns: true,
    deIce: false,
    pitotHeat: true,
  });

  const [autopilot, setAutopilot] = useState<AutopilotState>({
    engaged: false,
    flightDirector: true,
    autoThrottle: false,
    targetSpeedKts: 250,
    targetAltitudeFt: 10000,
    targetVerticalSpeedFpm: 1500,
    targetHeadingDeg: 134,
    headingHold: false,
    altitudeHold: false,
    verticalSpeedHold: false,
    navMode: false,
    approachMode: false,
    glideslopeCaptured: false,
    localizerCaptured: false,
  });

  const [groundOps, setGroundOps] = useState<AirportOperations>({
    jetwayConnected: true,
    pushbackRequested: false,
    pushbackActive: false,
    pushbackDirection: 'STRAIGHT',
    passengersBoarded: 162,
    maxPassengers: 189,
    boardingInProgress: false,
    deboardingInProgress: false,
    cargoLoadedKg: 4200,
    maxCargoKg: 5800,
  });

  const [atcMessages, setAtcMessages] = useState<ATCMessage[]>([
    {
      id: 'atc-1',
      sender: 'TOWER',
      frequency: '119.10 MHz',
      text: 'Skyline 428, Cleared to London Heathrow via MERIT departure, flight planned route, maintain 5000, expect FL340 10 minutes after departure. Squawk 4215.',
      timestamp: Date.now() - 30000,
    },
  ]);

  // Keyboard active keys map
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Keep refs synchronized for the continuous 60fps animation loop
  const systemsRef = useRef(systems);
  systemsRef.current = systems;
  const autopilotRef = useRef(autopilot);
  autopilotRef.current = autopilot;
  const groundOpsRef = useRef(groundOps);
  groundOpsRef.current = groundOps;
  const weatherRef = useRef(weather);
  weatherRef.current = weather;
  const activeAirportRef = useRef(activeAirport);
  activeAirportRef.current = activeAirport;
  const landingReportRef = useRef(landingReport);
  landingReportRef.current = landingReport;
  const lastTelemetryUpdateRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  // 1. Initialize Scene & Physics
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    // Physics Engine
    const physics = new FlightPhysicsEngine(activeAircraft, activeAirport);
    physics.resetToPhase('TAKEOFF_ROLL');
    physicsRef.current = physics;

    // Graphics Scene
    const scene = new FlightSimulatorScene(
      containerRef.current,
      activeAirport,
      activeAircraft,
      weather
    );
    simSceneRef.current = scene;

    // Setup touchdown smoke & report callback
    physics.setOnTouchdownCallback((report) => {
      if (simSceneRef.current && physicsRef.current) {
        const t = physicsRef.current.getTelemetry();
        simSceneRef.current.triggerTouchdownSmoke(
          new THREE.Vector3(t.position.x, t.position.y, t.position.z)
        );
      }
      setLandingReport(report);
    });

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      scene.destroy();
      soundEngine.stopAll();
    };
  }, []); // Run once on mount

  // 2. Controls & Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      keysPressed.current[e.key.toLowerCase()] = true;

      // Single trigger actions
      switch (e.key.toLowerCase()) {
        case 'g':
          handleToggleGear();
          break;
        case 'f':
          handleToggleFlaps(true);
          break;
        case 'v':
          handleToggleFlaps(false);
          break;
        case '/':
          handleToggleSpoilers();
          break;
        case 'p':
          handleToggleParkingBrake();
          break;
        case 'r':
          handleToggleReverseThrust();
          break;
        case 'c':
          cycleCamera();
          break;
        case 'm':
          soundEngine.toggleMute();
          break;
        case 'h':
          setShowTutorial((prev) => !prev);
          break;
        case 't':
        case ' ':
          physicsRef.current?.setThrottleInput(1.0);
          break;
        case '0':
          physicsRef.current?.setThrottleInput(0);
          break;
        case '9':
          physicsRef.current?.setThrottleInput(1.0);
          break;
        case '8':
          physicsRef.current?.setThrottleInput(0.85);
          break;
        case '7':
          physicsRef.current?.setThrottleInput(0.65);
          break;
        case '1':
          handleSetCameraMode('COCKPIT');
          break;
        case '2':
          handleSetCameraMode('CHASE');
          break;
        case '3':
          handleSetCameraMode('WING');
          break;
        case '4':
          handleSetCameraMode('TOWER');
          break;
        case '5':
          handleSetCameraMode('ORBIT');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
      if (e.key.toLowerCase() === 'b') {
        physicsRef.current?.setBrakeInput(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [systems, cameraMode, showToast]);

  // Helper toggle functions
  const handleToggleGear = () => {
    soundEngine.playClick();
    const nextGear = !systems.gearDown;
    setSystems((p) => ({ ...p, gearDown: nextGear }));
    physicsRef.current?.toggleGear(nextGear);
    soundEngine.playChime('GEAR');
    showToast(nextGear ? 'LANDING GEAR DOWN & LOCKED' : 'LANDING GEAR RETRACTED');
  };

  const handleToggleFlaps = (increment: boolean) => {
    soundEngine.playClick();
    const stages = activeAircraft?.flapStages || [
      { degrees: 0, name: 'UP', maxSpeedKts: 340, liftFactor: 1.0, dragFactor: 1.0 },
    ];
    let nextIdx = systems.flapsIndex + (increment ? 1 : -1);
    nextIdx = Math.max(0, Math.min(stages.length - 1, nextIdx));
    setSystems((p) => ({ ...p, flapsIndex: nextIdx }));
    physicsRef.current?.setFlapsIndex(nextIdx);
    const stage = stages[nextIdx] || stages[0];
    showToast(`FLAPS: ${stage.name} (${stage.degrees}°)`);
  };

  const handleToggleSpoilers = () => {
    soundEngine.playClick();
    const nextExt = !systems.spoilersExtended;
    setSystems((p) => ({ ...p, spoilersExtended: nextExt }));
    physicsRef.current?.toggleSpoilers(nextExt);
    showToast(nextExt ? 'SPEEDBRAKES / SPOILERS EXTENDED' : 'SPOILERS RETRACTED');
  };

  const handleToggleParkingBrake = () => {
    soundEngine.playClick();
    const nextPark = !systems.parkingBrake;
    setSystems((p) => ({ ...p, parkingBrake: nextPark }));
    physicsRef.current?.setParkingBrake(nextPark);
    showToast(nextPark ? 'PARKING BRAKE SET' : 'PARKING BRAKE RELEASED');
  };

  const handleToggleReverseThrust = () => {
    soundEngine.playClick();
    const nextRev = !systems.reverseThrust;
    setSystems((p) => ({ ...p, reverseThrust: nextRev }));
    physicsRef.current?.setReverseThrust(nextRev);
    showToast(nextRev ? 'REVERSE THRUST ARMED & DEPLOYED' : 'FORWARD THRUST');
  };

  const cycleCamera = () => {
    const modes: CameraMode[] = ['CHASE', 'COCKPIT', 'WING', 'TOWER', 'ORBIT'];
    const currIdx = modes.indexOf(cameraMode);
    const nextMode = modes[(currIdx + 1) % modes.length];
    handleSetCameraMode(nextMode);
  };

  const handleSetCameraMode = (mode: CameraMode) => {
    soundEngine.playClick();
    setCameraMode(mode);
    simSceneRef.current?.setCameraMode(mode);
    showToast(`CAMERA: ${mode} VIEW`);
  };

  const handleQuickTakeoffAssist = () => {
    if (!physicsRef.current) return;
    setFlightPhase('TAKEOFF_ROLL');
    physicsRef.current.resetToPhase('TAKEOFF_ROLL');
    physicsRef.current.setParkingBrake(false);
    physicsRef.current.setBrakeInput(0);
    physicsRef.current.setThrottleInput(1.0);
    setSystems((p) => ({
      ...p,
      parkingBrake: false,
      flapsIndex: 1,
      engine1Running: true,
      engine2Running: true,
      gearDown: true,
      spoilersExtended: false,
      reverseThrust: false,
    }));
    soundEngine.playClick();
    showToast('🚀 TOGA 100% THRUST SET - PULL S / DOWN TO ROTATE AT 140 KTS!');
  };

  const handleLevelFlight = () => {
    if (!physicsRef.current) return;
    const t = physicsRef.current.getTelemetry();
    t.rollDeg = 0;
    t.rollRate = 0;
    t.pitchRate = 0;
    t.yawRate = 0;
    t.pitchDeg = 3.0;
    t.velocity.y = 0;
    physicsRef.current.setPitchRollInput(0, 0);
    physicsRef.current.setRudderInput(0);
    showToast('WINGS LEVELED & ATTITUDE TRIMMED');
  };

  // 3. MAIN REALTIME SIMULATION & ANIMATION LOOP
  useEffect(() => {
    let prevTime = performance.now();

    const loop = (time: number) => {
      try {
        const dt = Math.min(0.05, (time - prevTime) / 1000);
        prevTime = time;

        const physics = physicsRef.current;
        const scene = simSceneRef.current;

        if (physics && scene) {
          const currSystems = systemsRef.current;
          const currAutopilot = autopilotRef.current;
          const currGroundOps = groundOpsRef.current;
          const currWeather = weatherRef.current;
          const currAirport = activeAirportRef.current;

          // Handle keyboard continuous inputs
          const keys = keysPressed.current;
          let yokePitch = 0;
          let yokeRoll = 0;
          let rudder = 0;

          // Standard Flight Controls:
          // S / Down Arrow: Pull yoke BACK -> Raise elevators -> Nose UP / Climb / Rotate (+1)
          // W / Up Arrow: Push yoke FORWARD -> Lower elevators -> Nose DOWN / Dive (-1)
          if (keys['s'] || keys['arrowdown']) yokePitch += 1;
          if (keys['w'] || keys['arrowup']) yokePitch -= 1;
          if (keys['a'] || keys['arrowleft']) yokeRoll -= 1;
          if (keys['d'] || keys['arrowright']) yokeRoll += 1;
          if (keys['q']) rudder -= 1;
          if (keys['e']) rudder += 1;

          // Always pass inputs so yoke and rudder auto-center to 0 when keys are released
          physics.setPitchRollInput(yokePitch, yokeRoll);
          physics.setRudderInput(rudder);

          // Throttle increase / decrease
          if (keys['shift'] || keys['pageup'] || keys['='] || keys['+']) {
            physics.adjustThrottle(0.45 * dt);
          }
          if (keys['control'] || keys['pagedown'] || keys['-']) {
            physics.adjustThrottle(-0.45 * dt);
          }

          // Hold brakes
          if (keys['b']) {
            physics.setBrakeInput(1);
          }

          // Apply ground pushback if active
          if (currGroundOps.pushbackActive) {
            physics.setParkingBrake(false);
            physics.applyPushbackTug(currGroundOps.pushbackDirection, dt);
          }

          // Step Physics Engine
          physics.update(dt, currSystems, currAutopilot);
          const telem = physics.getTelemetry();

          // Throttled UI telemetry update (~30Hz) to prevent React Virtual DOM bottlenecks
          if (time - lastTelemetryUpdateRef.current > 33) {
            lastTelemetryUpdateRef.current = time;
            setTelemetry({ ...telem });
          }

          // Update Sound Engine based on physical state
          const avgN1 = (currSystems.engine1Running || currSystems.engine2Running) ? 20 + telem.throttle * 80 : 0;
          soundEngine.updateEngineSound(
            avgN1,
            telem.indicatedAirspeedKts,
            currSystems.reverseThrust,
            currSystems.avionics
          );

          // Check crash / landing triggers
          if (telem.hasCrashed && !landingReportRef.current) {
            soundEngine.playCrashSound();
            const rep: LandingReport = {
              timestamp: Date.now(),
              airport: currAirport.icao,
              runway: currAirport.runways[0].name,
              touchdownRateFpm: telem.verticalSpeedFpm,
              gForceMax: telem.gForce,
              centerlineOffsetM: 25,
              approachSpeedKts: telem.indicatedAirspeedKts,
              rating: 'CRASH',
              comments: 'Catastrophic terrain impact or excessive sink rate resulting in hull damage.',
              flightTimeMinutes: 2,
              fuelUsedKg: 350,
            };
            setLandingReport(rep);
          }

          // Update 3D Visuals & Camera
          const jetwayStates: Record<string, boolean> = {
            'gate-1': currGroundOps.jetwayConnected,
            'gate-2': false,
            'gate-3': false,
            'gate-4': false,
          };
          scene.update(telem, currSystems, currWeather, jetwayStates, time);
        }
      } catch (err) {
        console.error("Simulation loop error:", err);
      } finally {
        animFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  // Dispatch / Flight Planner Handler
  const handleSelectFlight = (
    dep: AirportData,
    dest: AirportData,
    aircraft: AircraftSpecs,
    newWeather: WeatherType,
    jumpPhase: FlightPhase = 'GATE_PREPARATION'
  ) => {
    setActiveAirport(dep);
    setActiveAircraft(aircraft);
    setWeather(newWeather);
    setFlightPhase(jumpPhase);
    setLandingReport(null);

    // Rebuild 3D graphics & scene
    if (simSceneRef.current) {
      simSceneRef.current.changeAirport(dep, newWeather);
      simSceneRef.current.changeAircraft(aircraft);
    }

    // Reset physics & teleport to phase position
    if (physicsRef.current) {
      physicsRef.current.setAirportAndAircraft(dep, aircraft);
      physicsRef.current.resetToPhase(jumpPhase);
      const telem = physicsRef.current.getTelemetry();
      setTelemetry({ ...telem });
    }

    // Configure initial systems for phase
    if (jumpPhase === 'GATE_PREPARATION') {
      setSystems((p) => ({
        ...p,
        parkingBrake: true,
        gearDown: true,
        engine1Running: false,
        engine2Running: false,
      }));
      setGroundOps((p) => ({
        ...p,
        jetwayConnected: true,
        pushbackActive: false,
      }));
    } else {
      setSystems((p) => ({
        ...p,
        battery: true,
        engine1Running: true,
        engine2Running: true,
        parkingBrake: false,
        gearDown: jumpPhase === 'FINAL_LANDING' || jumpPhase === 'TAKEOFF_ROLL',
      }));
      setGroundOps((p) => ({
        ...p,
        jetwayConnected: false,
        pushbackActive: false,
      }));
    }

    showToast(`DISPATCHED: ${aircraft.name} at ${dep.icao}`);
  };

  // Restart Current Flight
  const handleRestartFlight = () => {
    setLandingReport(null);
    if (physicsRef.current) {
      physicsRef.current.resetToPhase(flightPhase);
    }
    showToast('FLIGHT RESET');
  };

  const handleJumpToPhase = (phase: FlightPhase) => {
    setFlightPhase(phase);
    if (physicsRef.current) {
      physicsRef.current.resetToPhase(phase);
      const telem = physicsRef.current.getTelemetry();
      setTelemetry({ ...telem });
    }
    if (phase === 'GATE_PREPARATION') {
      setSystems((p) => ({
        ...p,
        parkingBrake: true,
        gearDown: true,
        engine1Running: false,
        engine2Running: false,
      }));
    } else {
      setSystems((p) => ({
        ...p,
        battery: true,
        engine1Running: true,
        engine2Running: true,
        parkingBrake: false,
        gearDown: phase === 'FINAL_LANDING' || phase === 'TAKEOFF_ROLL',
        flapsIndex: phase === 'FINAL_LANDING' ? 3 : phase === 'TAKEOFF_ROLL' ? 1 : 0,
      }));
    }
    showToast(`PHASE SET: ${phase.replace(/_/g, ' ')}`);
  };

  // ATC message sender
  const handleSendATC = (text: string, isPilot: boolean, nextPhase?: FlightPhase) => {
    const newMsg: ATCMessage = {
      id: `atc-${Date.now()}`,
      sender: isPilot ? 'PILOT' : 'TOWER',
      frequency: '119.10 MHz',
      text,
      timestamp: Date.now(),
    };
    setAtcMessages((prev) => [...prev, newMsg]);
    if (nextPhase) {
      setFlightPhase(nextPhase);
    }
  };

  const handleCycleWeather = () => {
    const list: WeatherType[] = ['CLEAR', 'FEW_CLOUDS', 'OVERCAST', 'RAIN_STORM', 'SUNSET', 'FOG'];
    const nextIdx = (list.indexOf(weather) + 1) % list.length;
    const nextW = list[nextIdx];
    setWeather(nextW);
    showToast(`WEATHER: ${nextW.replace('_', ' ')}`);
  };

  // Orbit camera drag handling on canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    if (cameraMode !== 'ORBIT') return;
    const startX = e.clientX;
    const startY = e.clientY;

    const handlePointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      simSceneRef.current?.updateOrbitCam(dx * 0.4, dy * 0.4);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (cameraMode === 'ORBIT') {
      simSceneRef.current?.zoomOrbitCam(e.deltaY * 0.05);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-sans text-white">
      {/* 1. 3D WEBGL CANVAS CONTAINER */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      {/* 2. NOTIFICATION BANNER / TOAST */}
      {notification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/90 border border-neutral-700 text-cyan-400 px-4 py-1.5 rounded-full font-mono text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* 3. FLIGHT HEADS-UP DISPLAY & TOUCH CONTROLS */}
      <FlightHUD
        telemetry={telemetry}
        systems={systems}
        specs={activeAircraft}
        flightPhase={flightPhase}
        cameraMode={cameraMode}
        weather={weather}
        onCycleWeather={handleCycleWeather}
        onSetCameraMode={handleSetCameraMode}
        onSetYoke={(pitch, roll) => physicsRef.current?.setPitchRollInput(pitch, roll)}
        onSetRudder={(rudder) => physicsRef.current?.setRudderInput(rudder)}
        onSetThrottle={(thr) => physicsRef.current?.setThrottleInput(thr)}
        onSetBrake={(brk) => physicsRef.current?.setBrakeInput(brk)}
        onToggleGear={handleToggleGear}
        onToggleFlaps={handleToggleFlaps}
        onToggleSpoilers={handleToggleSpoilers}
        onToggleParkingBrake={handleToggleParkingBrake}
        onToggleReverseThrust={handleToggleReverseThrust}
        onOpenOverhead={() => setShowOverhead(true)}
        onOpenATC={() => setShowATC(true)}
        onOpenGroundOps={() => setShowGroundOps(true)}
        onOpenFlightPlanner={() => setShowFlightPlanner(true)}
        showInstruments={showInstruments}
        onToggleInstruments={() => setShowInstruments((p) => !p)}
        isCleanView={isCleanView}
        onToggleCleanView={() => setIsCleanView((p) => !p)}
        onOpenTutorial={() => setShowTutorial(true)}
      />

      {/* 4. GLASS COCKPIT INSTRUMENTS & AUTOPILOT MCP */}
      {showInstruments && !isCleanView && (
        <div className="absolute bottom-36 left-4 right-4 z-20 pointer-events-none flex flex-col items-center gap-2">
          {/* Autopilot MCP (collapsible) */}
          {showAutopilot && (
            <div className="pointer-events-auto max-w-4xl w-full">
              <AutopilotPanel autopilot={autopilot} setAutopilot={setAutopilot} />
            </div>
          )}

          {/* Dual Glass Cockpit Screens */}
          <div className="pointer-events-auto flex flex-wrap justify-center gap-2.5 max-h-[40vh] overflow-y-auto p-1">
            <GlassCockpitPFD telemetry={telemetry} autopilot={autopilot} specs={activeAircraft} />
            <GlassCockpitND telemetry={telemetry} autopilot={autopilot} activeRunway={activeAirport.runways[0]} />
            <GlassCockpitEICAS telemetry={telemetry} systems={systems} specs={activeAircraft} />
          </div>

          {/* Autopilot and hide controls */}
          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={() => setShowAutopilot(!showAutopilot)}
              className="px-3 py-1 bg-neutral-950/80 hover:bg-neutral-900 text-neutral-300 font-mono text-[10px] font-bold rounded border border-neutral-700 backdrop-blur-sm transition-colors"
            >
              {showAutopilot ? 'HIDE MCP AUTOPILOT' : 'SHOW MCP AUTOPILOT'}
            </button>
            <button
              onClick={() => setShowInstruments(false)}
              className="px-3 py-1 bg-neutral-950/80 hover:bg-neutral-900 text-cyan-300 font-mono text-[10px] font-bold rounded border border-neutral-700 backdrop-blur-sm transition-colors"
            >
              ✕ HIDE AVIONICS
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL DIALOGS */}
      {showOverhead && (
        <CockpitOverhead
          systems={systems}
          setSystems={setSystems}
          onClose={() => setShowOverhead(false)}
        />
      )}

      {showATC && (
        <ATCCommPanel
          airport={activeAirport}
          flightPhase={flightPhase}
          messages={atcMessages}
          onSendMessage={handleSendATC}
          onClose={() => setShowATC(false)}
        />
      )}

      {showGroundOps && (
        <GroundOpsModal
          ops={groundOps}
          specs={activeAircraft}
          setOps={setGroundOps}
          onClose={() => setShowGroundOps(false)}
        />
      )}

      {showFlightPlanner && (
        <FlightPlannerModal
          currentAirport={activeAirport}
          currentAircraft={activeAircraft}
          currentWeather={weather}
          onSelectFlight={handleSelectFlight}
          onClose={() => setShowFlightPlanner(false)}
        />
      )}

      {landingReport && (
        <FlightReportModal
          report={landingReport}
          onRestart={handleRestartFlight}
          onNewFlight={() => {
            setLandingReport(null);
            setShowFlightPlanner(true);
          }}
        />
      )}

      {/* Flight School & Interactive Tutorial Modal */}
      <FlightTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        specs={activeAircraft}
        onSelectPhase={(phase) => {
          handleJumpToPhase(phase);
        }}
        onQuickTakeoffAssist={handleQuickTakeoffAssist}
        onLevelFlight={handleLevelFlight}
      />
    </div>
  );
}
