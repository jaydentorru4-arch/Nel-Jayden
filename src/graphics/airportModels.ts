import * as THREE from 'three';
import { AirportData } from '../types';

export interface Airport3DScene {
  group: THREE.Group;
  runwayMeshes: THREE.Mesh[];
  papiLights: {
    runwayId: string;
    lights: THREE.Mesh[];
    materials: THREE.MeshBasicMaterial[];
    position: THREE.Vector3;
    heading: number;
  }[];
  jetways: Record<string, { mesh: THREE.Group; connected: boolean }>;
  radarDish?: THREE.Mesh;
}

export function buildAirport3D(data: AirportData): Airport3DScene {
  const group = new THREE.Group();
  group.name = `AIRPORT_${data.icao}`;

  const runwayMeshes: THREE.Mesh[] = [];
  const papiLights: Airport3DScene['papiLights'] = [];
  const jetways: Record<string, { mesh: THREE.Group; connected: boolean }> = {};

  // Materials
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x27272a, // dark asphalt
    roughness: 0.9,
    metalness: 0.1,
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x52525b,
    roughness: 0.85,
    metalness: 0.05,
  });

  const markingWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const markingYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const markingRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.85,
    transparent: true,
    opacity: 0.7,
  });

  // Apron ground base
  const apronGeo = new THREE.PlaneGeometry(3500, 3500);
  apronGeo.rotateX(-Math.PI / 2);
  const apron = new THREE.Mesh(apronGeo, concreteMat);
  apron.position.set(0, 0.02, 0);
  apron.receiveShadow = true;
  group.add(apron);

  // 1. RUNWAYS BUILDER
  data.runways.forEach((rwy) => {
    const rwyGroup = new THREE.Group();
    rwyGroup.name = `RUNWAY_${rwy.id}`;

    const length = rwy.length;
    const width = rwy.width;

    // Runway surface
    const rwyGeo = new THREE.PlaneGeometry(width, length);
    rwyGeo.rotateX(-Math.PI / 2);
    const rwyMesh = new THREE.Mesh(rwyGeo, asphaltMat);
    rwyMesh.receiveShadow = true;

    // Center position halfway between threshold and end
    const midX = (rwy.thresholdX + rwy.endX) / 2;
    const midZ = (rwy.thresholdZ + rwy.endZ) / 2;
    rwyGroup.position.set(midX, 0.06, midZ);

    // Orientation
    const headingRad = (rwy.heading * Math.PI) / 180;
    rwyGroup.rotation.y = -headingRad;

    // Runway markings:
    // A. Centerline dashed stripes
    const dashLength = 30;
    const dashGap = 20;
    const dashCount = Math.floor(length / (dashLength + dashGap));
    const dashGeo = new THREE.PlaneGeometry(1.2, dashLength);
    dashGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < dashCount; i++) {
      const zOffset = -length / 2 + 80 + i * (dashLength + dashGap);
      if (Math.abs(zOffset) < length / 2 - 80) {
        const dash = new THREE.Mesh(dashGeo, markingWhiteMat);
        dash.position.set(0, 0.01, zOffset);
        rwyGroup.add(dash);
      }
    }

    // B. Threshold Piano Keys (8 to 12 stripes across)
    const stripeWidth = 2.0;
    const stripeLen = 35;
    const numStripes = 10;
    const pianoGeo = new THREE.PlaneGeometry(stripeWidth, stripeLen);
    pianoGeo.rotateX(-Math.PI / 2);

    for (let side = -1; side <= 1; side += 2) {
      const zPos = (side * length) / 2 - side * (stripeLen / 2 + 15);
      for (let s = 0; s < numStripes; s++) {
        const xOffset = -width / 2 + 5 + s * ((width - 10) / numStripes);
        const stripe = new THREE.Mesh(pianoGeo, markingWhiteMat);
        stripe.position.set(xOffset, 0.01, zPos);
        rwyGroup.add(stripe);
      }
    }

    // C. Touchdown zone aiming point markers (Large solid white blocks)
    const aimGeo = new THREE.PlaneGeometry(8, 45);
    aimGeo.rotateX(-Math.PI / 2);
    for (let side = -1; side <= 1; side += 2) {
      const aimZ = (side * length) / 2 - side * 300; // 1,000 ft (300m) from threshold
      const aimL = new THREE.Mesh(aimGeo, markingWhiteMat);
      aimL.position.set(-width * 0.25, 0.01, aimZ);
      rwyGroup.add(aimL);

      const aimR = new THREE.Mesh(aimGeo, markingWhiteMat);
      aimR.position.set(width * 0.25, 0.01, aimZ);
      rwyGroup.add(aimR);
    }

    // D. Rubber skid marks (darker strips along touchdown zones)
    const skidGeo = new THREE.PlaneGeometry(16, 280);
    skidGeo.rotateX(-Math.PI / 2);
    const skidMat = new THREE.MeshBasicMaterial({ color: 0x18181b, transparent: true, opacity: 0.65 });
    for (let side = -1; side <= 1; side += 2) {
      const skidMesh = new THREE.Mesh(skidGeo, skidMat);
      skidMesh.position.set(0, 0.008, (side * length) / 2 - side * 350);
      rwyGroup.add(skidMesh);
    }

    // E. Runway Edge and Centerline Lights
    const edgeLightGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 6);
    const edgeLightWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const edgeLightRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const edgeLightGreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const lightSpacing = 60;
    const numEdgeLights = Math.floor(length / lightSpacing);

    for (let i = 0; i <= numEdgeLights; i++) {
      const zPos = -length / 2 + i * lightSpacing;
      // Left side edge light
      const lLight = new THREE.Mesh(edgeLightGeo, edgeLightWhiteMat);
      lLight.position.set(-width / 2 - 0.8, 0.2, zPos);
      rwyGroup.add(lLight);

      // Right side edge light
      const rLight = new THREE.Mesh(edgeLightGeo, edgeLightWhiteMat);
      rLight.position.set(width / 2 + 0.8, 0.2, zPos);
      rwyGroup.add(rLight);
    }

    // Threshold Green Lights & End Red Lights
    for (let w = -width / 2; w <= width / 2; w += 4) {
      // Threshold
      const threshLight = new THREE.Mesh(edgeLightGeo, edgeLightGreenMat);
      threshLight.position.set(w, 0.2, length / 2);
      rwyGroup.add(threshLight);

      // End
      const endLight = new THREE.Mesh(edgeLightGeo, edgeLightRedMat);
      endLight.position.set(w, 0.2, -length / 2);
      rwyGroup.add(endLight);
    }

    // F. Approach Light System (ALS) extending out from threshold
    const alsLength = 700;
    const alsSpacing = 50;
    const alsBarGeo = new THREE.BoxGeometry(4.0, 0.15, 0.4);
    for (let a = alsSpacing; a <= alsLength; a += alsSpacing) {
      const alsBar = new THREE.Mesh(alsBarGeo, edgeLightWhiteMat);
      alsBar.position.set(0, 0.4, length / 2 + a);
      rwyGroup.add(alsBar);
    }

    // G. PAPI (Precision Approach Path Indicator) 4-light array
    const papiBoxGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    const papiBoxMat = new THREE.MeshStandardMaterial({ color: 0x71717a });
    const papiUnitLights: THREE.Mesh[] = [];
    const papiUnitMats: THREE.MeshBasicMaterial[] = [];

    const papiGroup = new THREE.Group();
    papiGroup.position.set(-width / 2 - 18, 0.3, length / 2 - 300); // 300m from threshold on left

    for (let p = 0; p < 4; p++) {
      const box = new THREE.Mesh(papiBoxGeo, papiBoxMat);
      box.position.set(p * 3.5, 0, 0);

      const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lampMat);
      lamp.position.set(0, 0.1, 0.4);
      box.add(lamp);

      papiGroup.add(box);
      papiUnitLights.push(lamp);
      papiUnitMats.push(lampMat);
    }
    rwyGroup.add(papiGroup);

    // Save PAPI data for dynamic update based on plane glideslope angle!
    const papiWorldPos = new THREE.Vector3();
    papiGroup.getWorldPosition(papiWorldPos);
    papiLights.push({
      runwayId: rwy.id,
      lights: papiUnitLights,
      materials: papiUnitMats,
      position: new THREE.Vector3(rwy.thresholdX, 0, rwy.thresholdZ),
      heading: rwy.heading,
    });

    rwyGroup.add(rwyMesh);
    runwayMeshes.push(rwyMesh);
    group.add(rwyGroup);
  });

  // 2. TAXIWAYS & SIGNS
  // Taxiway lines between nodes
  data.taxiwayPaths.forEach(([fromId, toId]) => {
    const fromNode = data.taxiwayNodes[fromId];
    const toNode = data.taxiwayNodes[toId];
    if (!fromNode || !toNode) return;

    const dx = toNode.x - fromNode.x;
    const dz = toNode.z - fromNode.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const taxiGeo = new THREE.PlaneGeometry(24, dist);
    taxiGeo.rotateX(-Math.PI / 2);
    const taxiMesh = new THREE.Mesh(taxiGeo, asphaltMat);
    taxiMesh.position.set((fromNode.x + toNode.x) / 2, 0.03, (fromNode.z + toNode.z) / 2);
    taxiMesh.rotation.y = angle;
    group.add(taxiMesh);

    // Yellow centerline
    const lineGeo = new THREE.PlaneGeometry(0.6, dist);
    lineGeo.rotateX(-Math.PI / 2);
    const lineMesh = new THREE.Mesh(lineGeo, markingYellowMat);
    lineMesh.position.set((fromNode.x + toNode.x) / 2, 0.04, (fromNode.z + toNode.z) / 2);
    lineMesh.rotation.y = angle;
    group.add(lineMesh);
  });

  // 3. AIRPORT TERMINAL BUILDINGS
  const terminalGroup = new THREE.Group();
  terminalGroup.name = 'TERMINAL_BUILDINGS';

  // Main Terminal Concourse (Curved architectural structure)
  const termGeo = new THREE.BoxGeometry(450, 24, 110);
  const termBuilding = new THREE.Mesh(termGeo, concreteMat);
  termBuilding.position.set(0, 12, 100);
  termBuilding.castShadow = true;
  terminalGroup.add(termBuilding);

  // Large Panoramic Glass Curtain Wall
  const glassGeo = new THREE.PlaneGeometry(430, 18);
  const glassWall = new THREE.Mesh(glassGeo, glassMat);
  glassWall.position.set(0, 12, 44);
  terminalGroup.add(glassWall);

  // Terminal roof canopy
  const roofGeo = new THREE.BoxGeometry(470, 2, 130);
  const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
  roof.position.set(0, 24.5, 100);
  terminalGroup.add(roof);

  // 4. GATES AND RETRACTABLE JETWAYS
  data.gates.forEach((gate) => {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(gate.x, 0, gate.z);
    gateGroup.rotation.y = (gate.heading * Math.PI) / 180;

    // Boarding Bridge (Jetway) assembly
    const jetwayMesh = new THREE.Group();
    const bridgeGeo = new THREE.BoxGeometry(3.5, 3.8, 16);
    bridgeGeo.translate(0, 1.9, 8);
    const bridge = new THREE.Mesh(bridgeGeo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    jetwayMesh.add(bridge);

    // Rotunda pivot
    const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5, 16), concreteMat);
    rotunda.position.set(0, 2.5, 0);
    jetwayMesh.add(rotunda);

    // Cabin head that attaches to airplane door
    const headGeo = new THREE.BoxGeometry(4.0, 3.6, 3.2);
    headGeo.translate(0, 1.8, 16.5);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: 0x334155 }));
    jetwayMesh.add(head);

    gateGroup.add(jetwayMesh);
    group.add(gateGroup);

    jetways[gate.id] = {
      mesh: jetwayMesh,
      connected: true,
    };
  });

  terminalGroup.position.set(0, 0, 0);
  group.add(terminalGroup);

  // 5. AIR TRAFFIC CONTROL TOWER
  const towerGroup = new THREE.Group();
  towerGroup.position.set(-300, 0, -250);

  // Tower shaft
  const shaftGeo = new THREE.CylinderGeometry(6, 9, 85, 16);
  const shaft = new THREE.Mesh(shaftGeo, concreteMat);
  shaft.position.y = 42.5;
  shaft.castShadow = true;
  towerGroup.add(shaft);

  // Tower glass observation cab
  const cabGeo = new THREE.CylinderGeometry(14, 11, 12, 16);
  const cab = new THREE.Mesh(cabGeo, glassMat);
  cab.position.y = 88;
  towerGroup.add(cab);

  // Roof and rotating search radar
  const cabRoof = new THREE.Mesh(new THREE.CylinderGeometry(15, 14, 2, 16), concreteMat);
  cabRoof.position.y = 94.5;
  towerGroup.add(cabRoof);

  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 6, 8), concreteMat);
  radarMast.position.y = 97.5;
  towerGroup.add(radarMast);

  const radarDishGeo = new THREE.BoxGeometry(7, 1.8, 0.4);
  const radarDish = new THREE.Mesh(radarDishGeo, new THREE.MeshStandardMaterial({ color: 0xf97316 }));
  radarDish.position.y = 100.5;
  towerGroup.add(radarDish);

  // Red beacon on top of tower
  const towerBeacon = new THREE.PointLight(0xff0000, 6.0, 80);
  towerBeacon.position.set(0, 102, 0);
  towerGroup.add(towerBeacon);

  group.add(towerGroup);

  // 6. HIGH-MAST APRON FLOODLIGHTS
  const mastPositions = [
    [-200, 0, 20],
    [0, 0, 20],
    [200, 0, 20],
    [-100, 0, 180],
    [100, 0, 180],
  ];
  const mastGeo = new THREE.CylinderGeometry(0.6, 1.2, 35, 8);
  mastGeo.translate(0, 17.5, 0);

  mastPositions.forEach(([mx, my, mz]) => {
    const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({ color: 0x64748b }));
    mast.position.set(mx, my, mz);

    // Floodlight lamp
    const flood = new THREE.SpotLight(0xfffae6, 3.5, 180, Math.PI / 4, 0.5, 1.5);
    flood.position.set(mx, 35, mz);
    flood.target.position.set(mx, 0, mz - 50);
    group.add(flood.target);
    group.add(flood);
    group.add(mast);
  });

  return {
    group,
    runwayMeshes,
    papiLights,
    jetways,
    radarDish,
  };
}

export function updateAirportVisuals(
  airportScene: Airport3DScene,
  aircraftPos: THREE.Vector3,
  aircraftAltitudeM: number,
  jetwayStates: Record<string, boolean>,
  timeMs: number
) {
  // Rotate radar dish
  if (airportScene.radarDish) {
    airportScene.radarDish.rotation.y = timeMs * 0.003;
  }

  // Update jetway positions (extend to plane or retract to terminal)
  Object.entries(jetwayStates).forEach(([gateId, connected]) => {
    const jw = airportScene.jetways[gateId];
    if (jw) {
      const targetRot = connected ? 0.0 : 0.45;
      jw.mesh.rotation.y += (targetRot - jw.mesh.rotation.y) * 0.04;
    }
  });

  // Update PAPI Lights dynamic glideslope indications!
  airportScene.papiLights.forEach((papi) => {
    const dx = aircraftPos.x - papi.position.x;
    const dz = aircraftPos.z - papi.position.z;
    const distM = Math.sqrt(dx * dx + dz * dz);

    if (distM > 50 && distM < 22000) {
      // Calculate approach angle in degrees
      const angleDeg = (Math.atan2(aircraftAltitudeM, distM) * 180) / Math.PI;

      // Realistic 4-box PAPI thresholds:
      // > 3.3° = 4 White
      // 3.1° - 3.3° = 3 White, 1 Red
      // 2.9° - 3.1° = 2 White, 2 Red (ON GLIDEPATH!)
      // 2.7° - 2.9° = 1 White, 3 Red
      // < 2.7° = 4 Red (TOO LOW!)
      let whiteCount = 2;
      if (angleDeg > 3.4) whiteCount = 4;
      else if (angleDeg > 3.15) whiteCount = 3;
      else if (angleDeg > 2.85) whiteCount = 2;
      else if (angleDeg > 2.6) whiteCount = 1;
      else whiteCount = 0;

      for (let i = 0; i < 4; i++) {
        if (i < whiteCount) {
          papi.materials[i].color.setHex(0xffffff); // White
        } else {
          papi.materials[i].color.setHex(0xef4444); // Red
        }
      }
    }
  });
}
