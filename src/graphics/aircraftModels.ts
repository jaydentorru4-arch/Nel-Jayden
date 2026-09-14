import * as THREE from 'three';
import { AircraftSpecs, AircraftSystemsState, FlightTelemetry } from '../types';

export interface Aircraft3DObject {
  root: THREE.Group;
  cockpitPos: THREE.Vector3;
  wingCamPos: THREE.Vector3;
  tailCamPos: THREE.Vector3;
  leftAileron?: THREE.Mesh;
  rightAileron?: THREE.Mesh;
  leftFlap?: THREE.Mesh;
  rightFlap?: THREE.Mesh;
  leftSpoiler?: THREE.Mesh;
  rightSpoiler?: THREE.Mesh;
  elevators?: THREE.Mesh;
  rudder?: THREE.Mesh;
  gearGroup?: THREE.Group;
  noseGearGroup?: THREE.Group;
  leftEngFan?: THREE.Mesh;
  rightEngFan?: THREE.Mesh;
  leftReverserSleeve?: THREE.Mesh;
  rightReverserSleeve?: THREE.Mesh;
  navLightRed?: THREE.PointLight;
  navLightGreen?: THREE.PointLight;
  beaconLightTop?: THREE.PointLight;
  beaconLightBottom?: THREE.PointLight;
  strobeLightLeft?: THREE.PointLight;
  strobeLightRight?: THREE.PointLight;
  landingLightLeft?: THREE.SpotLight;
  landingLightRight?: THREE.SpotLight;
  landingLightTarget?: THREE.Object3D;
  propeller?: THREE.Mesh;
}

export function createAircraftModel(specs: AircraftSpecs): Aircraft3DObject {
  const root = new THREE.Group();
  root.name = specs.id;

  const isGA = specs.category === 'GENERAL_AVIATION';
  const scale = specs.length / 40; // Normalized scale factor based on 737 baseline

  // Materials with PBR realistic finish
  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.28,
    metalness: 0.15,
  });

  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Airline navy blue belly livery
    roughness: 0.35,
    metalness: 0.25,
  });

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db, // Boeing/Airbus light aircraft gray
    roughness: 0.45,
    metalness: 0.2,
  });

  const engineMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.3,
    metalness: 0.4,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x111827,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85,
    reflectivity: 0.95,
    clearcoat: 1.0,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.15,
    metalness: 0.85,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.8,
    metalness: 0.05,
  });

  // 1. FUSELAGE
  const fuseRadius = isGA ? 0.9 : (specs.category === 'AIRLINER_HEAVY' ? 3.1 : (specs.category === 'AIRLINER_WIDE' ? 2.9 : 1.9));
  const fuseLen = specs.length * 0.82;

  const fuselageGeo = new THREE.CylinderGeometry(fuseRadius * 0.98, fuseRadius, fuseLen, 24, 8);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
  fuselage.position.set(0, fuseRadius + 0.3, 0);
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  root.add(fuselage);

  // Nose cone
  const noseGeo = new THREE.ConeGeometry(fuseRadius * 0.98, fuseRadius * 2.8, 24);
  noseGeo.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, fuselageMat);
  nose.position.set(0, fuseRadius + 0.3, -fuseLen / 2 - (fuseRadius * 1.4));
  nose.castShadow = true;
  root.add(nose);

  // Cockpit windshield
  const windshieldGeo = new THREE.BoxGeometry(fuseRadius * 1.2, fuseRadius * 0.65, fuseRadius * 1.1);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, fuseRadius + 0.8, -fuseLen / 2 - (fuseRadius * 0.5));
  windshield.rotation.x = -0.35;
  root.add(windshield);

  // Cabin passenger windows (rows of small dark panels)
  const windowRowLen = fuseLen * 0.65;
  const windowCount = Math.floor(windowRowLen / 1.6);
  const winGeo = new THREE.BoxGeometry(0.12, 0.35, 0.45);
  for (let i = 0; i < windowCount; i++) {
    const zPos = -windowRowLen / 2 + i * 1.6;
    // Left side
    const winL = new THREE.Mesh(winGeo, glassMat);
    winL.position.set(-fuseRadius - 0.02, fuseRadius + 0.5, zPos);
    root.add(winL);
    // Right side
    const winR = new THREE.Mesh(winGeo, glassMat);
    winR.position.set(fuseRadius + 0.02, fuseRadius + 0.5, zPos);
    root.add(winR);
  }

  // Tail cone
  const tailConeGeo = new THREE.ConeGeometry(fuseRadius * 0.98, fuseLen * 0.38, 24);
  tailConeGeo.rotateX(Math.PI / 2);
  const tailCone = new THREE.Mesh(tailConeGeo, bellyMat);
  tailCone.position.set(0, fuseRadius + 0.5, fuseLen / 2 + (fuseLen * 0.19));
  tailCone.castShadow = true;
  root.add(tailCone);

  // APU exhaust port
  const apuExhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.5, 12), chromeMat);
  apuExhaust.rotateX(Math.PI / 2);
  apuExhaust.position.set(0, fuseRadius + 0.7, fuseLen / 2 + fuseLen * 0.38);
  root.add(apuExhaust);

  // 2. MAIN WINGS & AERO SURFACES
  const halfSpan = specs.wingspan / 2;
  const wingChordRoot = isGA ? 1.6 : specs.length * 0.2;
  const wingChordTip = isGA ? 1.1 : wingChordRoot * 0.3;
  const sweepBack = isGA ? 0.3 : halfSpan * 0.42;
  const dihedralY = isGA ? 0.2 : halfSpan * 0.08;

  const leftWingGroup = new THREE.Group();
  const rightWingGroup = new THREE.Group();

  // Create Wing Shape using ExtrudeGeometry
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(0, -wingChordRoot);
  wingShape.lineTo(halfSpan, -sweepBack - wingChordTip);
  wingShape.lineTo(halfSpan, -sweepBack);
  wingShape.closePath();

  const wingExtrudeSettings = { depth: 0.35 * scale, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 3 };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
  wingGeo.rotateX(Math.PI / 2);

  // Left wing
  const leftWingMesh = new THREE.Mesh(wingGeo, wingMat);
  leftWingMesh.rotation.z = -Math.atan2(dihedralY, halfSpan);
  leftWingMesh.scale.set(-1, 1, 1);
  leftWingMesh.castShadow = true;
  leftWingGroup.position.set(0, fuseRadius * 0.3, 0);
  leftWingGroup.add(leftWingMesh);
  root.add(leftWingGroup);

  // Right wing
  const rightWingMesh = new THREE.Mesh(wingGeo, wingMat);
  rightWingMesh.rotation.z = Math.atan2(dihedralY, halfSpan);
  rightWingMesh.castShadow = true;
  rightWingGroup.position.set(0, fuseRadius * 0.3, 0);
  rightWingGroup.add(rightWingMesh);
  root.add(rightWingGroup);

  // Winglets (blended or sharklet)
  if (!isGA) {
    const wingletGeo = new THREE.BoxGeometry(0.15, 2.2 * scale, 1.2 * scale);
    const leftWinglet = new THREE.Mesh(wingletGeo, bellyMat);
    leftWinglet.position.set(-halfSpan - 0.1, dihedralY + 1.1 * scale, sweepBack + 0.5);
    leftWinglet.rotation.z = -0.25;
    leftWingGroup.add(leftWinglet);

    const rightWinglet = new THREE.Mesh(wingletGeo, bellyMat);
    rightWinglet.position.set(halfSpan + 0.1, dihedralY + 1.1 * scale, sweepBack + 0.5);
    rightWinglet.rotation.z = 0.25;
    rightWingGroup.add(rightWinglet);
  }

  // Ailerons (movable)
  const aileronGeo = new THREE.BoxGeometry(halfSpan * 0.3, 0.12, 0.8 * scale);
  const leftAileron = new THREE.Mesh(aileronGeo, bellyMat);
  leftAileron.position.set(-halfSpan * 0.78, dihedralY * 0.8, sweepBack * 0.95 + wingChordTip);
  leftWingGroup.add(leftAileron);

  const rightAileron = new THREE.Mesh(aileronGeo, bellyMat);
  rightAileron.position.set(halfSpan * 0.78, dihedralY * 0.8, sweepBack * 0.95 + wingChordTip);
  rightWingGroup.add(rightAileron);

  // Flaps (movable multi-stage)
  const flapGeo = new THREE.BoxGeometry(halfSpan * 0.45, 0.16, 1.3 * scale);
  const leftFlap = new THREE.Mesh(flapGeo, wingMat);
  leftFlap.position.set(-halfSpan * 0.35, dihedralY * 0.35, sweepBack * 0.5 + wingChordRoot * 0.85);
  leftWingGroup.add(leftFlap);

  const rightFlap = new THREE.Mesh(flapGeo, wingMat);
  rightFlap.position.set(halfSpan * 0.35, dihedralY * 0.35, sweepBack * 0.5 + wingChordRoot * 0.85);
  rightWingGroup.add(rightFlap);

  // Spoilers / Flight Brakes
  const spoilerGeo = new THREE.BoxGeometry(halfSpan * 0.35, 0.08, 0.75 * scale);
  const leftSpoiler = new THREE.Mesh(spoilerGeo, bellyMat);
  leftSpoiler.position.set(-halfSpan * 0.35, dihedralY * 0.35 + 0.18, sweepBack * 0.45 + wingChordRoot * 0.5);
  leftWingGroup.add(leftSpoiler);

  const rightSpoiler = new THREE.Mesh(spoilerGeo, bellyMat);
  rightSpoiler.position.set(halfSpan * 0.35, dihedralY * 0.35 + 0.18, sweepBack * 0.45 + wingChordRoot * 0.5);
  rightWingGroup.add(rightSpoiler);

  // 3. HORIZONTAL & VERTICAL TAIL
  const horizSpan = specs.wingspan * 0.36;
  const horizGeo = new THREE.BoxGeometry(horizSpan, 0.18 * scale, 2.8 * scale);
  const horizStab = new THREE.Mesh(horizGeo, wingMat);
  horizStab.position.set(0, fuseRadius + 0.8, fuseLen * 0.45);
  root.add(horizStab);

  // Elevators (movable)
  const elevGeo = new THREE.BoxGeometry(horizSpan * 0.95, 0.12 * scale, 0.85 * scale);
  const elevators = new THREE.Mesh(elevGeo, bellyMat);
  elevators.position.set(0, fuseRadius + 0.8, fuseLen * 0.45 + 1.4 * scale);
  root.add(elevators);

  // Vertical fin
  const finHeight = specs.length * 0.22;
  const finGeo = new THREE.BoxGeometry(0.25 * scale, finHeight, 3.8 * scale);
  finGeo.translate(0, finHeight / 2, 0);
  const fin = new THREE.Mesh(finGeo, bellyMat);
  fin.position.set(0, fuseRadius + 0.5, fuseLen * 0.4);
  fin.rotation.x = -0.32;
  root.add(fin);

  // Rudder (movable)
  const rudderGeo = new THREE.BoxGeometry(0.18 * scale, finHeight * 0.85, 1.2 * scale);
  rudderGeo.translate(0, finHeight * 0.45, 0);
  const rudder = new THREE.Mesh(rudderGeo, fuselageMat);
  rudder.position.set(0, fuseRadius + 0.5, fuseLen * 0.4 + 2.2 * scale);
  rudder.rotation.x = -0.32;
  root.add(rudder);

  // 4. JET ENGINES OR PROPELLER
  let leftEngFan: THREE.Mesh | undefined;
  let rightEngFan: THREE.Mesh | undefined;
  let leftReverserSleeve: THREE.Mesh | undefined;
  let rightReverserSleeve: THREE.Mesh | undefined;
  let propeller: THREE.Mesh | undefined;

  if (isGA) {
    // Single nose propeller for Cessna
    const propHub = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 12), chromeMat);
    propHub.rotateX(-Math.PI / 2);
    const propBladeGeo = new THREE.BoxGeometry(2.0, 0.1, 0.05);
    propeller = new THREE.Mesh(propBladeGeo, bellyMat);
    propeller.add(propHub);
    propeller.position.set(0, fuseRadius + 0.2, -fuseLen / 2 - 1.2);
    root.add(propeller);
  } else {
    // Dual turbofan nacelles under wings
    const nacelleRadius = specs.category === 'AIRLINER_HEAVY' ? 1.9 : (specs.category === 'AIRLINER_WIDE' ? 1.7 : 1.1);
    const nacelleLen = nacelleRadius * 3.4;
    const nacelleOffsetSpan = halfSpan * 0.32;

    const nacelleGeo = new THREE.CylinderGeometry(nacelleRadius, nacelleRadius * 0.9, nacelleLen, 24, 4, true);
    nacelleGeo.rotateX(Math.PI / 2);

    // Fan blades disk
    const fanGeo = new THREE.CylinderGeometry(nacelleRadius * 0.94, nacelleRadius * 0.94, 0.15, 16);
    fanGeo.rotateX(Math.PI / 2);
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

    // Spinner cone
    const spinnerGeo = new THREE.ConeGeometry(nacelleRadius * 0.28, nacelleRadius * 0.7, 16);
    spinnerGeo.rotateX(-Math.PI / 2);

    // Left engine
    const leftNacelle = new THREE.Mesh(nacelleGeo, engineMat);
    leftNacelle.position.set(-nacelleOffsetSpan, -nacelleRadius * 0.3, sweepBack * 0.25);
    leftEngFan = new THREE.Mesh(fanGeo, fanMat);
    leftEngFan.add(new THREE.Mesh(spinnerGeo, chromeMat));
    leftEngFan.position.set(0, 0, -nacelleLen * 0.42);
    leftNacelle.add(leftEngFan);

    // Thrust reverser sleeve (slides backwards on reverse)
    const sleeveGeo = new THREE.CylinderGeometry(nacelleRadius * 1.02, nacelleRadius * 1.02, nacelleLen * 0.35, 20);
    sleeveGeo.rotateX(Math.PI / 2);
    leftReverserSleeve = new THREE.Mesh(sleeveGeo, chromeMat);
    leftReverserSleeve.position.set(0, 0, nacelleLen * 0.15);
    leftNacelle.add(leftReverserSleeve);

    // Pylon attaching engine to wing
    const pylonGeo = new THREE.BoxGeometry(0.2, nacelleRadius * 1.1, nacelleLen * 0.7);
    const leftPylon = new THREE.Mesh(pylonGeo, wingMat);
    leftPylon.position.set(0, nacelleRadius * 0.8, 0);
    leftNacelle.add(leftPylon);
    leftWingGroup.add(leftNacelle);

    // Right engine
    const rightNacelle = new THREE.Mesh(nacelleGeo, engineMat);
    rightNacelle.position.set(nacelleOffsetSpan, -nacelleRadius * 0.3, sweepBack * 0.25);
    rightEngFan = new THREE.Mesh(fanGeo, fanMat);
    rightEngFan.add(new THREE.Mesh(spinnerGeo, chromeMat));
    rightEngFan.position.set(0, 0, -nacelleLen * 0.42);
    rightNacelle.add(rightEngFan);

    rightReverserSleeve = new THREE.Mesh(sleeveGeo, chromeMat);
    rightReverserSleeve.position.set(0, 0, nacelleLen * 0.15);
    rightNacelle.add(rightReverserSleeve);

    const rightPylon = new THREE.Mesh(pylonGeo, wingMat);
    rightPylon.position.set(0, nacelleRadius * 0.8, 0);
    rightNacelle.add(rightPylon);
    rightWingGroup.add(rightNacelle);
  }

  // 5. LANDING GEAR SYSTEM
  const gearGroup = new THREE.Group();
  gearGroup.name = 'LANDING_GEAR';
  const noseGearGroup = new THREE.Group();
  noseGearGroup.name = 'NOSE_GEAR';

  const strutRadius = 0.08 * scale;
  const mainGearHeight = (fuseRadius + 0.8) * 1.1;
  const tireRadius = 0.45 * scale;
  const tireWidth = 0.25 * scale;
  const wheelGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  // Nose gear assembly
  const noseStrutGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, mainGearHeight, 12);
  const noseStrut = new THREE.Mesh(noseStrutGeo, chromeMat);
  noseStrut.position.y = -mainGearHeight / 2;
  noseGearGroup.add(noseStrut);

  const noseWheelL = new THREE.Mesh(wheelGeo, tireMat);
  noseWheelL.position.set(-0.25 * scale, -mainGearHeight, 0);
  const noseWheelR = new THREE.Mesh(wheelGeo, tireMat);
  noseWheelR.position.set(0.25 * scale, -mainGearHeight, 0);
  noseGearGroup.add(noseWheelL);
  noseGearGroup.add(noseWheelR);
  noseGearGroup.position.set(0, fuseRadius, -fuseLen * 0.42);
  gearGroup.add(noseGearGroup);

  // Main gear left & right
  const mainSpanOffset = halfSpan * 0.22;
  const mainStrutGeo = new THREE.CylinderGeometry(strutRadius * 1.3, strutRadius * 1.3, mainGearHeight, 12);

  // Left Main Gear
  const leftMainGear = new THREE.Group();
  const leftStrut = new THREE.Mesh(mainStrutGeo, chromeMat);
  leftStrut.position.y = -mainGearHeight / 2;
  leftMainGear.add(leftStrut);
  const leftMainWheelL = new THREE.Mesh(wheelGeo, tireMat);
  leftMainWheelL.position.set(-0.35 * scale, -mainGearHeight, 0);
  const leftMainWheelR = new THREE.Mesh(wheelGeo, tireMat);
  leftMainWheelR.position.set(0.35 * scale, -mainGearHeight, 0);
  leftMainGear.add(leftMainWheelL);
  leftMainGear.add(leftMainWheelR);
  leftMainGear.position.set(-mainSpanOffset, fuseRadius * 0.5, sweepBack * 0.35);
  gearGroup.add(leftMainGear);

  // Right Main Gear
  const rightMainGear = new THREE.Group();
  const rightStrut = new THREE.Mesh(mainStrutGeo, chromeMat);
  rightStrut.position.y = -mainGearHeight / 2;
  rightMainGear.add(rightStrut);
  const rightMainWheelL = new THREE.Mesh(wheelGeo, tireMat);
  rightMainWheelL.position.set(-0.35 * scale, -mainGearHeight, 0);
  const rightMainWheelR = new THREE.Mesh(wheelGeo, tireMat);
  rightMainWheelR.position.set(0.35 * scale, -mainGearHeight, 0);
  rightMainGear.add(rightMainWheelL);
  rightMainGear.add(rightMainWheelR);
  rightMainGear.position.set(mainSpanOffset, fuseRadius * 0.5, sweepBack * 0.35);
  gearGroup.add(rightMainGear);

  root.add(gearGroup);

  // 6. EXTERIOR LIGHTING SYSTEM
  // Red Navigation Light (Port / Left Wingtip)
  const navLightRed = new THREE.PointLight(0xff0000, 3.5, 25);
  navLightRed.position.set(-halfSpan, dihedralY, sweepBack);
  const redBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  navLightRed.add(redBulb);
  leftWingGroup.add(navLightRed);

  // Green Navigation Light (Starboard / Right Wingtip)
  const navLightGreen = new THREE.PointLight(0x00ff00, 3.5, 25);
  navLightGreen.position.set(halfSpan, dihedralY, sweepBack);
  const greenBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
  navLightGreen.add(greenBulb);
  rightWingGroup.add(navLightGreen);

  // Red Beacons (Flashing top & bottom)
  const beaconLightTop = new THREE.PointLight(0xff1100, 4.0, 35);
  beaconLightTop.position.set(0, fuseRadius * 2 + 0.35, 0);
  root.add(beaconLightTop);

  const beaconLightBottom = new THREE.PointLight(0xff1100, 4.0, 35);
  beaconLightBottom.position.set(0, 0.2, 0);
  root.add(beaconLightBottom);

  // Strobes (High intensity white flashes on wingtips)
  const strobeLightLeft = new THREE.PointLight(0xffffff, 8.0, 50);
  strobeLightLeft.position.set(-halfSpan - 0.1, dihedralY, sweepBack + 0.2);
  leftWingGroup.add(strobeLightLeft);

  const strobeLightRight = new THREE.PointLight(0xffffff, 8.0, 50);
  strobeLightRight.position.set(halfSpan + 0.1, dihedralY, sweepBack + 0.2);
  rightWingGroup.add(strobeLightRight);

  // Landing Lights (High-powered forward illuminating spotlights)
  const landingLightTarget = new THREE.Object3D();
  landingLightTarget.position.set(0, 0, -350);
  root.add(landingLightTarget);

  const landingLightLeft = new THREE.SpotLight(0xfffaed, 8.0, 400, Math.PI / 9, 0.45, 1.2);
  landingLightLeft.position.set(-mainSpanOffset * 0.8, fuseRadius * 0.2, sweepBack * 0.2);
  landingLightLeft.target = landingLightTarget;
  root.add(landingLightLeft);

  const landingLightRight = new THREE.SpotLight(0xfffaed, 8.0, 400, Math.PI / 9, 0.45, 1.2);
  landingLightRight.position.set(mainSpanOffset * 0.8, fuseRadius * 0.2, sweepBack * 0.2);
  landingLightRight.target = landingLightTarget;
  root.add(landingLightRight);

  // Camera Anchor Positions
  const cockpitPos = new THREE.Vector3(0, fuseRadius + 0.85, -fuseLen * 0.46);
  const wingCamPos = new THREE.Vector3(-fuseRadius - 0.6, fuseRadius + 0.4, 2.5);
  const tailCamPos = new THREE.Vector3(0, finHeight * 0.95 + fuseRadius, fuseLen * 0.48);

  return {
    root,
    cockpitPos,
    wingCamPos,
    tailCamPos,
    leftAileron,
    rightAileron,
    leftFlap,
    rightFlap,
    leftSpoiler,
    rightSpoiler,
    elevators,
    rudder,
    gearGroup,
    noseGearGroup,
    leftEngFan,
    rightEngFan,
    leftReverserSleeve,
    rightReverserSleeve,
    navLightRed,
    navLightGreen,
    beaconLightTop,
    beaconLightBottom,
    strobeLightLeft,
    strobeLightRight,
    landingLightLeft,
    landingLightRight,
    landingLightTarget,
    propeller,
  };
}

export function updateAircraftVisuals(
  obj: Aircraft3DObject,
  systems: AircraftSystemsState,
  telemetry: FlightTelemetry,
  timeMs: number
) {
  // 1. Control Surfaces deflection
  if (obj.leftAileron && obj.rightAileron) {
    const rollDeflection = telemetry.controlYokeRoll * 0.35;
    obj.leftAileron.rotation.x = -rollDeflection;
    obj.rightAileron.rotation.x = rollDeflection;
  }

  if (obj.elevators) {
    const pitchDeflection = telemetry.controlYokePitch * 0.38;
    obj.elevators.rotation.x = -pitchDeflection;
  }

  if (obj.rudder) {
    const yawDeflection = telemetry.controlRudder * 0.42;
    obj.rudder.rotation.y = -yawDeflection;
  }

  // 2. Flaps deployment
  const flapTargetAngle = (systems.flapsIndex / 5) * 0.62; // up to ~35 degrees down
  if (obj.leftFlap && obj.rightFlap) {
    obj.leftFlap.rotation.x = flapTargetAngle;
    obj.rightFlap.rotation.x = flapTargetAngle;
  }

  // 3. Spoilers
  if (obj.leftSpoiler && obj.rightSpoiler) {
    const spoilerAngle = systems.spoilersExtended ? 0.75 : 0;
    obj.leftSpoiler.rotation.x = -spoilerAngle;
    obj.rightSpoiler.rotation.x = -spoilerAngle;
  }

  // 4. Landing gear retraction animation
  if (obj.gearGroup) {
    const targetGearProgress = systems.gearDown ? 1.0 : 0.0;
    systems.gearTransitProgress += (targetGearProgress - systems.gearTransitProgress) * 0.05;
    // Scale or rotate gear into wheel wells
    obj.gearGroup.scale.set(
      1.0,
      Math.max(0.001, systems.gearTransitProgress),
      Math.max(0.001, systems.gearTransitProgress)
    );
    obj.gearGroup.visible = systems.gearTransitProgress > 0.05;
  }

  // 5. Nosewheel steering
  if (obj.noseGearGroup) {
    const steerAngle = telemetry.onGround ? -telemetry.controlRudder * 0.55 : 0;
    obj.noseGearGroup.rotation.y = steerAngle;
  }

  // 6. Engines fan rotation
  const fanSpinRate = (systems.engine1N1 / 100) * 0.85;
  if (obj.leftEngFan) obj.leftEngFan.rotation.z += fanSpinRate;
  if (obj.rightEngFan) obj.rightEngFan.rotation.z += fanSpinRate;
  if (obj.propeller) obj.propeller.rotation.z += fanSpinRate * 1.5;

  // 7. Thrust reverser blocker sleeves
  const reverserOffset = systems.reverseThrust ? 0.45 : 0;
  if (obj.leftReverserSleeve) obj.leftReverserSleeve.position.z = 0.5 + reverserOffset;
  if (obj.rightReverserSleeve) obj.rightReverserSleeve.position.z = 0.5 + reverserOffset;

  // 8. Lights synchronization
  // Nav lights
  if (obj.navLightRed) obj.navLightRed.intensity = systems.navLights ? 3.5 : 0;
  if (obj.navLightGreen) obj.navLightGreen.intensity = systems.navLights ? 3.5 : 0;

  // Flashing Beacon (1 second period pulse)
  const beaconOn = systems.beaconLights && (Math.floor(timeMs / 600) % 2 === 0);
  if (obj.beaconLightTop) obj.beaconLightTop.intensity = beaconOn ? 5.0 : 0;
  if (obj.beaconLightBottom) obj.beaconLightBottom.intensity = beaconOn ? 5.0 : 0;

  // Wingtip Strobes (Double pulse flash every 1.2s)
  const strobeCycle = timeMs % 1200;
  const strobeFlash = systems.strobeLights && (strobeCycle < 60 || (strobeCycle > 140 && strobeCycle < 200));
  if (obj.strobeLightLeft) obj.strobeLightLeft.intensity = strobeFlash ? 12.0 : 0;
  if (obj.strobeLightRight) obj.strobeLightRight.intensity = strobeFlash ? 12.0 : 0;

  // Landing Lights
  const landingIntensity = systems.landingLights ? 9.0 : 0;
  if (obj.landingLightLeft) obj.landingLightLeft.intensity = landingIntensity;
  if (obj.landingLightRight) obj.landingLightRight.intensity = landingIntensity;
}
