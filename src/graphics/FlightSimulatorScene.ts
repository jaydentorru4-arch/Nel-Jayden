import * as THREE from 'three';
import { AircraftSpecs, AircraftSystemsState, AirportData, CameraMode, FlightTelemetry, WeatherType } from '../types';
import { createAircraftModel, updateAircraftVisuals, Aircraft3DObject } from './aircraftModels';
import { buildAirport3D, updateAirportVisuals, Airport3DScene } from './airportModels';
import { createEnvironment, Environment3D } from './environment';

export class FlightSimulatorScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private aircraftObj: Aircraft3DObject | null = null;
  private airportScene: Airport3DScene | null = null;
  private environment: Environment3D | null = null;

  private currentCameraMode: CameraMode = 'CHASE';
  private orbitAngles: { theta: number; phi: number; distance: number } = {
    theta: 0,
    phi: 0.35,
    distance: 45,
  };

  private flybyCamPos: THREE.Vector3 = new THREE.Vector3();
  private isFlybyInitialized: boolean = false;

  // Touchdown smoke particles
  private smokeParticles: THREE.Points | null = null;
  private smokeCount = 300;
  private smokePositions: Float32Array;
  private smokeOpacities: Float32Array;
  private resizeObserver: ResizeObserver | null = null;
  private isFirstFrame: boolean = true;

  constructor(container: HTMLElement, airportData: AirportData, aircraftSpecs: AircraftSpecs, weather: WeatherType) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.00004);

    const width = container.clientWidth > 0 ? container.clientWidth : (window.innerWidth || 1280);
    const height = container.clientHeight > 0 ? container.clientHeight : (window.innerHeight || 720);
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.5, 90000);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Ensure canvas stretches properly across the full container
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';

    container.appendChild(this.renderer.domElement);

    // Build Environment
    this.environment = createEnvironment(airportData, weather);
    this.scene.add(this.environment.group);

    // Build Airport
    this.airportScene = buildAirport3D(airportData);
    this.scene.add(this.airportScene.group);

    // Build Aircraft
    this.aircraftObj = createAircraftModel(aircraftSpecs);
    this.scene.add(this.aircraftObj.root);

    // Setup Touchdown smoke
    this.smokePositions = new Float32Array(this.smokeCount * 3);
    this.smokeOpacities = new Float32Array(this.smokeCount);
    this.initSmokeParticles();

    // Resize handler via window and ResizeObserver for iframe reliability
    window.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (w > 0 && h > 0) {
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h, false);
          }
        }
      });
      this.resizeObserver.observe(container);
    }

    // Initial camera positioning and immediate render
    this.camera.position.set(0, 20, 60);
    this.camera.lookAt(0, 5, 0);
    this.renderer.render(this.scene, this.camera);
  }

  private initSmokeParticles() {
    const geo = new THREE.BufferGeometry();
    for (let i = 0; i < this.smokeCount; i++) {
      this.smokePositions[i * 3] = 0;
      this.smokePositions[i * 3 + 1] = -100;
      this.smokePositions[i * 3 + 2] = 0;
      this.smokeOpacities[i] = 0;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 4.5,
      transparent: true,
      opacity: 0.7,
    });
    this.smokeParticles = new THREE.Points(geo, mat);
    this.scene.add(this.smokeParticles);
  }

  public triggerTouchdownSmoke(pos: THREE.Vector3) {
    if (!this.smokeParticles) return;
    const positions = this.smokeParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.smokeCount; i++) {
      positions[i * 3] = pos.x + (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = pos.y + 0.3 + Math.random() * 2;
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 12;
    }
    this.smokeParticles.geometry.attributes.position.needsUpdate = true;
  }

  public changeAirport(airportData: AirportData, weather: WeatherType = 'CLEAR') {
    if (this.airportScene) {
      this.scene.remove(this.airportScene.group);
    }
    if (this.environment) {
      this.scene.remove(this.environment.group);
    }
    this.environment = createEnvironment(airportData, weather);
    this.scene.add(this.environment.group);

    this.airportScene = buildAirport3D(airportData);
    this.scene.add(this.airportScene.group);
  }

  public changeAircraft(specs: AircraftSpecs) {
    if (this.aircraftObj) {
      this.scene.remove(this.aircraftObj.root);
    }
    this.aircraftObj = createAircraftModel(specs);
    this.scene.add(this.aircraftObj.root);
  }

  public setCameraMode(mode: CameraMode) {
    this.currentCameraMode = mode;
    this.isFlybyInitialized = false;
  }

  public getCameraMode(): CameraMode {
    return this.currentCameraMode;
  }

  public updateOrbitCam(deltaX: number, deltaY: number) {
    this.orbitAngles.theta -= deltaX * 0.006;
    this.orbitAngles.phi = Math.max(-0.2, Math.min(1.4, this.orbitAngles.phi + deltaY * 0.006));
  }

  public zoomOrbitCam(deltaZoom: number) {
    this.orbitAngles.distance = Math.max(15, Math.min(250, this.orbitAngles.distance + deltaZoom));
  }

  public update(
    telemetry: FlightTelemetry,
    systems: AircraftSystemsState,
    weather: WeatherType,
    jetwayStates: Record<string, boolean>,
    timeMs: number
  ) {
    if (!this.aircraftObj) return;

    // 1. Update 3D Aircraft Transform
    const plane = this.aircraftObj.root;
    plane.position.set(telemetry.position.x, telemetry.position.y, telemetry.position.z);

    // Aircraft Euler rotation (Heading yaw, Pitch, Roll)
    const euler = new THREE.Euler();
    euler.set(
      (telemetry.pitchDeg * Math.PI) / 180,
      (-telemetry.headingDeg * Math.PI) / 180,
      (-telemetry.rollDeg * Math.PI) / 180,
      'YXZ'
    );
    plane.setRotationFromEuler(euler);

    // 2. Update Aircraft Visual Details (flaps, ailerons, gear, fan blades, lights)
    updateAircraftVisuals(this.aircraftObj, systems, telemetry, timeMs);

    // 3. Update Airport Visuals (PAPI lights, radar dish, jetways)
    if (this.airportScene) {
      updateAirportVisuals(this.airportScene, plane.position, telemetry.position.y, jetwayStates, timeMs);
    }

    // 4. Update Environment and Atmosphere
    if (this.environment) {
      this.environment.update(timeMs, weather, plane.position);
    }

    // 5. Update Camera according to Camera Mode
    this.updateCamera(telemetry);

    // 6. Dissipate Touchdown Smoke Particles
    if (this.smokeParticles) {
      const posArr = this.smokeParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < posArr.length; i += 3) {
        if (posArr[i] > -90) {
          posArr[i] += 0.12; // slowly rises
          posArr[i - 1] += (Math.random() - 0.5) * 0.1;
          posArr[i + 1] += 0.3; // drifts with wind
        }
      }
      this.smokeParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(telemetry: FlightTelemetry) {
    if (!this.aircraftObj) return;
    const plane = this.aircraftObj.root;

    switch (this.currentCameraMode) {
      case 'COCKPIT': {
        // Clear pilot cockpit view positioned right at windshield looking out over nose
        const eyeOffset = this.aircraftObj.cockpitPos.clone();
        eyeOffset.z -= 1.8;
        eyeOffset.y += 0.35;
        eyeOffset.applyQuaternion(plane.quaternion);
        this.camera.position.copy(plane.position).add(eyeOffset);

        // Look forward down along runway/horizon
        const lookTarget = new THREE.Vector3(0, -1.2, -400);
        lookTarget.applyQuaternion(plane.quaternion);
        this.camera.lookAt(plane.position.clone().add(lookTarget));
        this.camera.up.set(0, 1, 0).applyQuaternion(plane.quaternion);
        this.camera.fov = 56;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'WING': {
        // Passenger window looking out over the swept wing and jet engine
        const wingOffset = this.aircraftObj.wingCamPos.clone();
        wingOffset.applyQuaternion(plane.quaternion);
        this.camera.position.copy(plane.position).add(wingOffset);

        // Look slightly backward and outward toward wingtip & engine
        const lookDir = new THREE.Vector3(-25, -2, 12);
        lookDir.applyQuaternion(plane.quaternion);
        this.camera.lookAt(this.camera.position.clone().add(lookDir));
        this.camera.up.set(0, 1, 0).applyQuaternion(plane.quaternion);
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'TOWER': {
        // View from Airport Control Tower cab
        this.camera.position.set(-300, 88, -250);
        this.camera.lookAt(plane.position);
        this.camera.up.set(0, 1, 0);
        // Dynamic zoom lens based on distance
        const dist = this.camera.position.distanceTo(plane.position);
        this.camera.fov = Math.max(10, Math.min(65, 8000 / dist));
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'FLYBY': {
        // Cinematic stationary flyby
        if (!this.isFlybyInitialized) {
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion);
          this.flybyCamPos.copy(plane.position)
            .add(forward.clone().multiplyScalar(400))
            .add(new THREE.Vector3(80, 25, 60));
          this.isFlybyInitialized = true;
        }
        this.camera.position.copy(this.flybyCamPos);
        this.camera.lookAt(plane.position);
        this.camera.up.set(0, 1, 0);
        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();

        // Reset flyby if aircraft has flown far past
        if (this.camera.position.distanceTo(plane.position) > 1200) {
          this.isFlybyInitialized = false;
        }
        break;
      }

      case 'ORBIT': {
        // Orbit camera around plane center with mouse / touch control
        const r = this.orbitAngles.distance;
        const phi = this.orbitAngles.phi;
        const theta = this.orbitAngles.theta;

        const ox = r * Math.cos(phi) * Math.sin(theta);
        const oy = r * Math.sin(phi);
        const oz = r * Math.cos(phi) * Math.cos(theta);

        this.camera.position.set(
          plane.position.x + ox,
          plane.position.y + oy,
          plane.position.z + oz
        );
        this.camera.lookAt(plane.position);
        this.camera.up.set(0, 1, 0);
        this.camera.fov = 55;
        this.camera.updateProjectionMatrix();
        break;
      }

      case 'CHASE':
      default: {
        // Smooth cinematic chase camera following tail
        const camDistance = 48 + (telemetry.indicatedAirspeedKts / 20);
        const camHeight = 14 + (telemetry.indicatedAirspeedKts / 45);

        // Vector behind aircraft
        const backDir = new THREE.Vector3(0, camHeight, camDistance);
        backDir.applyQuaternion(plane.quaternion);

        const targetCamPos = plane.position.clone().add(backDir);
        if (this.isFirstFrame) {
          this.camera.position.copy(targetCamPos);
          this.isFirstFrame = false;
        } else {
          this.camera.position.lerp(targetCamPos, 0.14);
        }

        // Look at point slightly in front of nose
        const lookAhead = new THREE.Vector3(0, 3, -15).applyQuaternion(plane.quaternion);
        this.camera.lookAt(plane.position.clone().add(lookAhead));
        this.camera.up.set(0, 1, 0);

        // Dynamic FOV speed compression
        this.camera.fov = 55 + Math.min(22, (telemetry.indicatedAirspeedKts / 350) * 15);
        this.camera.updateProjectionMatrix();
        break;
      }
    }
  }

  private onResize = () => {
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    const width = parent.clientWidth || window.innerWidth;
    const height = parent.clientHeight || window.innerHeight;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    }
  };

  public destroy() {
    window.removeEventListener('resize', this.onResize);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
