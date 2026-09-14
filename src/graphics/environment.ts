import * as THREE from 'three';
import { AirportData, WeatherType } from '../types';

export interface Environment3D {
  group: THREE.Group;
  skyMesh: THREE.Mesh;
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  hemiLight: THREE.HemisphereLight;
  cloudGroup: THREE.Group;
  birdsGroup?: THREE.Group;
  rainSystem?: THREE.Points;
  terrainMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  cityGroup: THREE.Group;
  update: (timeMs: number, weather: WeatherType, aircraftPos: THREE.Vector3) => void;
}

export function createEnvironment(airportData: AirportData, initialWeather: WeatherType): Environment3D {
  const group = new THREE.Group();
  group.name = 'ENVIRONMENT';

  // 1. SKY DOME
  const skyGeo = new THREE.SphereGeometry(75000, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // sky blue
    side: THREE.BackSide,
    fog: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyMesh);

  // 2. LIGHTING (Sun, Ambient, Hemisphere)
  const sunLight = new THREE.DirectionalLight(0xfffaed, 2.8);
  sunLight.position.set(20000, 35000, 20000);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 100;
  sunLight.shadow.camera.far = 80000;
  sunLight.shadow.camera.left = -2500;
  sunLight.shadow.camera.right = 2500;
  sunLight.shadow.camera.top = 2500;
  sunLight.shadow.camera.bottom = -2500;
  group.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.7);
  group.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.6);
  group.add(hemiLight);

  // 3. LARGE-SCALE TERRAIN (40km x 40km with mountains and coastline)
  const terrainSize = 75000;
  const terrainSegments = 128;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
  terrainGeo.rotateX(-Math.PI / 2);

  // Displace terrain vertices based on biome
  const posAttr = terrainGeo.attributes.position;
  const vertex = new THREE.Vector3();
  const biome = airportData.terrainBiome;

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    const distFromCenter = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);

    // Keep airport flat within 3.5km
    if (distFromCenter > 3200) {
      let elevation = 0;
      const nx = vertex.x * 0.00012;
      const nz = vertex.z * 0.00012;

      if (biome === 'ALPINE') {
        // High jagged Alpine mountain peaks (up to 3,400m)
        const ridge = Math.abs(Math.sin(nx * 3 + nz * 2) * Math.cos(nx * 2 - nz * 3));
        elevation = Math.pow(ridge, 1.6) * 3200 + Math.sin(nx * 8) * 400;
      } else if (biome === 'COASTAL') {
        // Flat coast transitioning to distant hills & ocean
        if (vertex.z > 2500) {
          elevation = -12; // Ocean bay water
        } else {
          elevation = Math.max(0, Math.sin(nx * 4) * Math.cos(nz * 4) * 450);
        }
      } else if (biome === 'DESERT') {
        // Rolling dunes and rocky outcrops
        elevation = Math.sin(nx * 2 + nz) * 180 + Math.cos(nx * 5) * 80;
      } else if (biome === 'TROPICAL') {
        // Lush volcanic island peaks surrounded by ocean
        const peakDist = Math.sqrt(Math.pow(vertex.x - 4000, 2) + Math.pow(vertex.z - 6000, 2));
        elevation = Math.max(0, 950 * Math.exp(-Math.pow(peakDist / 4000, 2)));
      } else {
        // Temperate rolling hills and river valleys
        elevation = Math.max(0, Math.sin(nx * 2) * Math.cos(nz * 2) * 350);
      }

      posAttr.setY(i, Math.max(-10, elevation));
    } else {
      posAttr.setY(i, 0);
    }
  }
  terrainGeo.computeVertexNormals();

  // Terrain Material with realistic Earth ground palette
  const terrainColor = biome === 'DESERT' ? 0xd4a373 : (biome === 'ALPINE' ? 0x3f6212 : 0x15803d);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: terrainColor,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 4. WATER BODY (Ocean / Bay / Lakes)
  const waterGeo = new THREE.PlaneGeometry(80000, 80000);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0369a1,
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.85,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -0.5;
  group.add(waterMesh);

  // 5. SURROUNDING METROPOLITAN CITY & LANDMARKS
  const cityGroup = new THREE.Group();
  cityGroup.name = 'METRO_CITY';

  // Procedural skyline cluster (placed near landmarks or 8km out)
  const bldgMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.4,
    metalness: 0.6,
  });
  const bldgGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.2,
    metalness: 0.8,
  });

  const cityDist = 8000;
  for (let b = 0; b < 65; b++) {
    const angle = (b / 65) * Math.PI * 0.7 + 0.4;
    const r = cityDist + (b % 7) * 450;
    const bx = Math.cos(angle) * r;
    const bz = -Math.sin(angle) * r;
    const bWidth = 45 + (b % 4) * 25;
    const bHeight = 80 + (b % 9) * 45;

    const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bWidth);
    const bMesh = new THREE.Mesh(bGeo, (b % 3 === 0) ? bldgGlassMat : bldgMat);
    bMesh.position.set(bx, bHeight / 2, bz);
    bMesh.castShadow = true;
    cityGroup.add(bMesh);
  }

  // Major unique iconic landmarks
  if (airportData.skylineLandmarks) {
    airportData.skylineLandmarks.forEach((lm) => {
      const lmGroup = new THREE.Group();
      lmGroup.position.set(lm.x, 0, lm.z);

      if (lm.type === 'SKYSCRAPER' || lm.type === 'TOWER') {
        // High spire building
        const towerShaft = new THREE.Mesh(
          new THREE.CylinderGeometry(lm.height * 0.03, lm.height * 0.08, lm.height, 8),
          bldgGlassMat
        );
        towerShaft.position.y = lm.height / 2;
        lmGroup.add(towerShaft);

        // Spire beacon
        const spire = new THREE.Mesh(
          new THREE.ConeGeometry(3, lm.height * 0.15, 6),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 })
        );
        spire.position.y = lm.height + (lm.height * 0.075);
        lmGroup.add(spire);

        const beacon = new THREE.PointLight(0xff0000, 4.0, 120);
        beacon.position.y = lm.height + 5;
        lmGroup.add(beacon);
      } else if (lm.type === 'BRIDGE') {
        // Suspension bridge towers and span
        const pylonGeo = new THREE.BoxGeometry(18, lm.height, 14);
        const pylonL = new THREE.Mesh(pylonGeo, bldgMat);
        pylonL.position.set(-180, lm.height / 2, 0);
        const pylonR = new THREE.Mesh(pylonGeo, bldgMat);
        pylonR.position.set(180, lm.height / 2, 0);
        lmGroup.add(pylonL);
        lmGroup.add(pylonR);

        const deckGeo = new THREE.BoxGeometry(700, 8, 30);
        const deck = new THREE.Mesh(deckGeo, bldgMat);
        deck.position.y = lm.height * 0.35;
        lmGroup.add(deck);
      } else if (lm.type === 'MOUNTAIN') {
        // Massive conical volcano/peak (e.g. Mt Fuji)
        const mtnGeo = new THREE.ConeGeometry(lm.height * 2.2, lm.height, 24);
        const mtnMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.9,
          flatShading: true,
        });
        const mtn = new THREE.Mesh(mtnGeo, mtnMat);
        mtn.position.y = lm.height / 2;
        lmGroup.add(mtn);

        // Snowcap
        const snowGeo = new THREE.ConeGeometry(lm.height * 0.75, lm.height * 0.35, 24);
        const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
        const snow = new THREE.Mesh(snowGeo, snowMat);
        snow.position.y = lm.height * 0.825;
        lmGroup.add(snow);
      }

      cityGroup.add(lmGroup);
    });
  }

  group.add(cityGroup);

  // 6. LAYERED 3D VOLUMETRIC CLOUDS (Low, Mid, and High layers)
  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'CLOUDS';

  const cloudPuffGeo = new THREE.DodecahedronGeometry(220, 1);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
    flatShading: true,
  });

  // Create 60 cloud clusters spanning low (600m - 1200m), mid (1200m - 2200m), and high (2200m - 3500m)
  for (let c = 0; c < 60; c++) {
    const cluster = new THREE.Group();
    const cx = (Math.random() - 0.5) * 45000;
    const cz = (Math.random() - 0.5) * 45000;
    // Layered cloud heights so some are visible near runways and mid-altitude
    const cy = 600 + Math.random() * 2600;
    cluster.position.set(cx, cy, cz);

    const puffs = 4 + Math.floor(Math.random() * 6);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(cloudPuffGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 140,
        (Math.random() - 0.5) * 500
      );
      const s = 0.6 + Math.random() * 0.9;
      puff.scale.set(s * 1.5, s * 0.7, s * 1.3);
      cluster.add(puff);
    }
    cloudGroup.add(cluster);
  }
  group.add(cloudGroup);

  // 6.5. FLOCKING BIRDS FLYING SYSTEM
  const birdsGroup = new THREE.Group();
  birdsGroup.name = 'BIRDS';

  interface BirdItem {
    mesh: THREE.Group;
    leftWing: THREE.Mesh;
    rightWing: THREE.Mesh;
    basePos: THREE.Vector3;
    speed: number;
    angle: number;
    radius: number;
    altitudeOffset: number;
    flapSpeed: number;
  }

  const birds: BirdItem[] = [];
  const birdWingGeo = new THREE.BufferGeometry();
  // Simple triangle wing geometry: vertex at root, tip, and trailing edge
  const wingVertices = new Float32Array([
    0, 0, 0,
    -1.4, 0.2, 0.4,
    -0.4, 0, 0.7,
  ]);
  birdWingGeo.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
  birdWingGeo.computeVertexNormals();

  const birdWingGeoRight = new THREE.BufferGeometry();
  const wingVerticesRight = new Float32Array([
    0, 0, 0,
    1.4, 0.2, 0.4,
    0.4, 0, 0.7,
  ]);
  birdWingGeoRight.setAttribute('position', new THREE.BufferAttribute(wingVerticesRight, 3));
  birdWingGeoRight.computeVertexNormals();

  const birdBodyGeo = new THREE.ConeGeometry(0.3, 1.8, 4);
  birdBodyGeo.rotateX(Math.PI / 2);

  const birdMat = new THREE.MeshStandardMaterial({
    color: 0x27272a, // dark slate / charcoal silhouette
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  // Spawn 4 flocks around airport and runway approach paths
  const flockCenters = [
    { x: 1800, z: 2600, count: 12, alt: 45 },
    { x: 1400, z: 1200, count: 14, alt: 70 },
    { x: 2400, z: 3400, count: 10, alt: 95 },
    { x: -500, z: -400, count: 15, alt: 60 },
  ];

  flockCenters.forEach((flock) => {
    for (let i = 0; i < flock.count; i++) {
      const birdMesh = new THREE.Group();

      const body = new THREE.Mesh(birdBodyGeo, birdMat);
      birdMesh.add(body);

      const leftWing = new THREE.Mesh(birdWingGeo, birdMat);
      leftWing.position.set(-0.2, 0.1, 0);
      birdMesh.add(leftWing);

      const rightWing = new THREE.Mesh(birdWingGeoRight, birdMat);
      rightWing.position.set(0.2, 0.1, 0);
      birdMesh.add(rightWing);

      const dist = 30 + Math.random() * 90;
      const angle = Math.random() * Math.PI * 2;
      const birdItem: BirdItem = {
        mesh: birdMesh,
        leftWing,
        rightWing,
        basePos: new THREE.Vector3(flock.x, flock.alt, flock.z),
        speed: 0.008 + Math.random() * 0.006,
        angle,
        radius: dist,
        altitudeOffset: (Math.random() - 0.5) * 20,
        flapSpeed: 10 + Math.random() * 6,
      };

      birdMesh.position.set(
        flock.x + Math.cos(angle) * dist,
        flock.alt + birdItem.altitudeOffset,
        flock.z + Math.sin(angle) * dist
      );

      birdsGroup.add(birdMesh);
      birds.push(birdItem);
    }
  });
  group.add(birdsGroup);

  // 7. PRECIPITATION / RAIN PARTICLES SYSTEM
  const rainCount = 4500;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);
  for (let r = 0; r < rainCount; r++) {
    rainPositions[r * 3] = (Math.random() - 0.5) * 800;
    rainPositions[r * 3 + 1] = Math.random() * 500;
    rainPositions[r * 3 + 2] = (Math.random() - 0.5) * 800;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0xa5b4fc,
    size: 1.8,
    transparent: true,
    opacity: 0.6,
  });
  const rainSystem = new THREE.Points(rainGeo, rainMat);
  rainSystem.visible = initialWeather === 'RAIN_STORM';
  group.add(rainSystem);

  // UPDATE LOOP FOR ENVIRONMENT
  const update = (timeMs: number, weather: WeatherType, aircraftPos: THREE.Vector3) => {
    // Cloud drift
    cloudGroup.children.forEach((cluster) => {
      cluster.position.x += 0.8;
      if (cluster.position.x > 30000) {
        cluster.position.x = -30000;
      }
    });

    // Birds flight & wing flapping animation
    const seconds = timeMs * 0.001;
    birds.forEach((bird) => {
      bird.angle += bird.speed * 0.04;
      const targetX = bird.basePos.x + Math.cos(bird.angle) * bird.radius;
      const targetZ = bird.basePos.z + Math.sin(bird.angle) * bird.radius;
      const targetY = bird.basePos.y + bird.altitudeOffset + Math.sin(bird.angle * 2 + seconds) * 4;

      // Heading orientation towards flight trajectory
      const dirX = -Math.sin(bird.angle);
      const dirZ = Math.cos(bird.angle);
      const heading = Math.atan2(dirX, dirZ);

      bird.mesh.position.set(targetX, targetY, targetZ);
      bird.mesh.rotation.y = heading;
      // Gentle bank into turns
      bird.mesh.rotation.z = Math.sin(bird.angle) * 0.2;

      // Wing flapping
      const flap = Math.sin(seconds * bird.flapSpeed) * 0.55;
      bird.leftWing.rotation.z = flap;
      bird.rightWing.rotation.z = -flap;
    });

    // Rain system follows aircraft
    if (rainSystem) {
      rainSystem.visible = weather === 'RAIN_STORM';
      if (rainSystem.visible) {
        rainSystem.position.set(aircraftPos.x, aircraftPos.y, aircraftPos.z);
        const positions = rainSystem.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 22; // fall speed
          if (positions[i] < -50) {
            positions[i] = 450;
          }
        }
        rainSystem.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Weather atmosphere settings
    switch (weather) {
      case 'CLEAR':
        skyMat.color.setHex(0x38bdf8);
        sunLight.color.setHex(0xfffaed);
        sunLight.intensity = 2.8;
        ambientLight.color.setHex(0xdbeafe);
        ambientLight.intensity = 0.7;
        cloudGroup.visible = true;
        cloudMat.opacity = 0.45; // Soft wisps visible in clear sky
        break;

      case 'FEW_CLOUDS':
        skyMat.color.setHex(0x60a5fa);
        sunLight.intensity = 2.6;
        ambientLight.intensity = 0.7;
        cloudGroup.visible = true;
        cloudMat.opacity = 0.8;
        break;

      case 'OVERCAST':
        skyMat.color.setHex(0x94a3b8);
        sunLight.intensity = 0.9;
        ambientLight.color.setHex(0xcbd5e1);
        ambientLight.intensity = 0.55;
        cloudGroup.visible = true;
        cloudMat.opacity = 0.95;
        break;

      case 'RAIN_STORM':
        skyMat.color.setHex(0x334155);
        sunLight.intensity = 0.4;
        ambientLight.color.setHex(0x64748b);
        ambientLight.intensity = 0.4;
        cloudGroup.visible = true;
        cloudMat.opacity = 0.98;
        break;

      case 'FOG':
        skyMat.color.setHex(0xe2e8f0);
        sunLight.intensity = 0.6;
        ambientLight.intensity = 0.8;
        cloudGroup.visible = true;
        cloudMat.opacity = 0.35;
        break;

      case 'SUNSET':
        skyMat.color.setHex(0xf97316); // Amber / orange horizon
        sunLight.color.setHex(0xfdba74);
        sunLight.intensity = 1.8;
        ambientLight.color.setHex(0x9a3412);
        ambientLight.intensity = 0.45;
        cloudGroup.visible = true;
        cloudMat.opacity = 0.75;
        break;
    }
  };

  return {
    group,
    skyMesh,
    sunLight,
    ambientLight,
    hemiLight,
    cloudGroup,
    birdsGroup,
    rainSystem,
    terrainMesh,
    waterMesh,
    cityGroup,
    update,
  };
}
