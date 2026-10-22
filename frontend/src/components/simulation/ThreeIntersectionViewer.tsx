import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Camera,
  Sun,
  Moon,
  Video,
  Layers,
  Sparkles,
  Maximize2,
  RotateCcw,
  Sliders,
  Car,
  ShieldAlert,
} from 'lucide-react';
import { Direction, LightState } from '../../types';
import { SimulationTelemetryState } from '../../types/simulation';
import { TrafficSimulationEngine } from '../../utils/simulationEngine';
import { soundEffects } from '../../utils/soundEffects';

interface ThreeIntersectionViewerProps {
  engine?: TrafficSimulationEngine;
  state?: SimulationTelemetryState;
  telemetry?: any;
  onTriggerGreen?: (direction: Direction) => void;
}

type CameraViewPreset = 'DRONE' | 'CCTV' | 'DRIVER' | 'TOP_DOWN';

export const ThreeIntersectionViewer: React.FC<ThreeIntersectionViewerProps> = ({
  engine,
  state,
  telemetry,
  onTriggerGreen,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>('DRONE');
  const [isNightMode, setIsNightMode] = useState<boolean>(true);
  const [activeApproach, setActiveApproach] = useState<Direction>(
    state?.activeDirection || telemetry?.activeDirection || 'NORTH'
  );

  // Sync with external state changes
  useEffect(() => {
    if (state?.activeDirection) {
      setActiveApproach(state.activeDirection);
    } else if (telemetry?.activeDirection) {
      setActiveApproach(telemetry.activeDirection);
    }
  }, [state?.activeDirection, telemetry?.activeDirection]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Atmosphere Setup
    const scene = new THREE.Scene();
    const skyColor = isNightMode ? 0x070b16 : 0xdbeafe;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, isNightMode ? 0.008 : 0.005);

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isNightMode ? 1.15 : 1.05;

    container.replaceChildren(renderer.domElement);

    // 2. Lighting System
    const hemiLight = new THREE.HemisphereLight(
      isNightMode ? 0x1e293b : 0xffffff,
      isNightMode ? 0x090e17 : 0x94a3b8,
      isNightMode ? 1.0 : 1.6
    );
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(
      isNightMode ? 0x60a5fa : 0xfffaed,
      isNightMode ? 1.4 : 2.4
    );
    sunLight.position.set(45, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    const shadowDist = 65;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // 3. Ground & Urban Infrastructure
    // Base Ground Grass / Earth
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x090e17 : 0x86efac,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Multi-Lane Crossroads Geometry
    const roadWidth = 18; // 2 lanes each direction (4.5m per lane)
    const roadLength = 220;

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x131722,
      roughness: 0.85,
      metalness: 0.15,
    });

    // North-South Road
    const nsRoadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const nsRoad = new THREE.Mesh(nsRoadGeo, roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.05;
    nsRoad.receiveShadow = true;
    scene.add(nsRoad);

    // East-West Road
    const ewRoadGeo = new THREE.PlaneGeometry(roadLength, roadWidth);
    const ewRoad = new THREE.Mesh(ewRoadGeo, roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.05;
    ewRoad.receiveShadow = true;
    scene.add(ewRoad);

    // Asphalt Markings
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    // Double Center Yellow Lines (Dividing opposing traffic)
    const drawDoubleYellow = (len: number, isVertical: boolean) => {
      const geo = new THREE.PlaneGeometry(0.2, len);
      [-0.25, 0.25].forEach((offset) => {
        const line = new THREE.Mesh(geo, yellowLineMat);
        line.rotation.x = -Math.PI / 2;
        if (isVertical) {
          line.position.set(offset, 0.08, 0);
        } else {
          line.rotation.z = Math.PI / 2;
          line.position.set(0, 0.08, offset);
        }
        scene.add(line);
      });
    };

    drawDoubleYellow(roadLength, true);
    drawDoubleYellow(roadLength, false);

    // White Dashed Lane Separators
    const dashGeo = new THREE.PlaneGeometry(0.25, 3.2);
    for (let pos = -100; pos <= 100; pos += 6) {
      if (Math.abs(pos) > roadWidth / 2 + 6) {
        // North-South Dashed Lanes
        [-4.5, 4.5].forEach((lx) => {
          const dash = new THREE.Mesh(dashGeo, whiteLineMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(lx, 0.08, pos);
          scene.add(dash);
        });

        // East-West Dashed Lanes
        [-4.5, 4.5].forEach((lz) => {
          const dash = new THREE.Mesh(dashGeo, whiteLineMat);
          dash.rotation.x = -Math.PI / 2;
          dash.rotation.z = Math.PI / 2;
          dash.position.set(pos, 0.08, lz);
          scene.add(dash);
        });
      }
    }

    // Stop Lines (Solid White Bars at approach entrances)
    const stopBarGeo = new THREE.PlaneGeometry(roadWidth / 2 - 0.5, 0.8);
    const stopDistance = roadWidth / 2 + 3.5;

    // North Approach Stop Line
    const stopNorth = new THREE.Mesh(stopBarGeo, whiteLineMat);
    stopNorth.rotation.x = -Math.PI / 2;
    stopNorth.position.set(-roadWidth / 4, 0.08, -stopDistance);
    scene.add(stopNorth);

    // South Approach Stop Line
    const stopSouth = new THREE.Mesh(stopBarGeo, whiteLineMat);
    stopSouth.rotation.x = -Math.PI / 2;
    stopSouth.position.set(roadWidth / 4, 0.08, stopDistance);
    scene.add(stopSouth);

    // West Approach Stop Line
    const stopWest = new THREE.Mesh(stopBarGeo, whiteLineMat);
    stopWest.rotation.x = -Math.PI / 2;
    stopWest.rotation.z = Math.PI / 2;
    stopWest.position.set(-stopDistance, 0.08, stopWidth(1) * 4.5);
    scene.add(stopWest);

    function stopWidth(dummy: number) {
      return 1;
    }

    // East Approach Stop Line
    const stopEast = new THREE.Mesh(stopBarGeo, whiteLineMat);
    stopEast.rotation.x = -Math.PI / 2;
    stopEast.rotation.z = Math.PI / 2;
    stopEast.position.set(stopDistance, 0.08, -4.5);
    scene.add(stopEast);

    // Zebra Crosswalks (High-Contrast Pedestrian Crossings)
    const zebraStripeGeo = new THREE.PlaneGeometry(0.9, 4.5);
    const addCrosswalk = (centerZ: number, isVertical: boolean) => {
      for (let offset = -roadWidth / 2 + 1; offset <= roadWidth / 2 - 1; offset += 1.6) {
        const stripe = new THREE.Mesh(zebraStripeGeo, whiteLineMat);
        stripe.rotation.x = -Math.PI / 2;
        if (isVertical) {
          stripe.rotation.z = Math.PI / 2;
          stripe.position.set(centerZ, 0.09, offset);
        } else {
          stripe.position.set(offset, 0.09, centerZ);
        }
        scene.add(stripe);
      }
    };

    addCrosswalk(-roadWidth / 2 - 1.8, false); // North Zebra
    addCrosswalk(roadWidth / 2 + 1.8, false); // South Zebra
    addCrosswalk(-roadWidth / 2 - 1.8, true); // West Zebra
    addCrosswalk(roadWidth / 2 + 1.8, true); // East Zebra

    // Raised Concrete Sidewalks & Curbs
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x252e3d : 0xe2e8f0,
      roughness: 0.7,
      metalness: 0.1,
    });

    const createSidewalkQuadrant = (x: number, z: number) => {
      const plazaGeo = new THREE.BoxGeometry(100, 0.35, 100);
      const plaza = new THREE.Mesh(plazaGeo, sidewalkMat);
      plaza.position.set(x > 0 ? x + 50 : x - 50, 0.18, z > 0 ? z + 50 : z - 50);
      plaza.receiveShadow = true;
      plaza.castShadow = true;
      scene.add(plaza);
    };

    const curbOffset = roadWidth / 2 + 0.4;
    createSidewalkQuadrant(curbOffset, curbOffset);
    createSidewalkQuadrant(-curbOffset, curbOffset);
    createSidewalkQuadrant(curbOffset, -curbOffset);
    createSidewalkQuadrant(-curbOffset, -curbOffset);

    // 4. Urban Architecture (4 Modern Corner Buildings)
    const buildingMatDark = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
    });
    const buildingGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.9,
      emissive: isNightMode ? 0x38bdf8 : 0x000000,
      emissiveIntensity: isNightMode ? 0.3 : 0.0,
    });

    const createCityBuilding = (
      x: number,
      z: number,
      w: number,
      h: number,
      d: number,
      colorHex: number
    ) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(x, 0, z);

      // Main Tower
      const towerGeo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.6,
      });
      const tower = new THREE.Mesh(towerGeo, mat);
      tower.position.y = h / 2;
      tower.castShadow = true;
      tower.receiveShadow = true;
      bGroup.add(tower);

      // Window Glass Grid Bands
      const windowGeo = new THREE.BoxGeometry(w + 0.2, h * 0.75, d + 0.2);
      const winMesh = new THREE.Mesh(windowGeo, buildingGlassMat);
      winMesh.position.y = h / 2;
      bGroup.add(winMesh);

      // Rooftop HVAC & Antenna
      const hvacGeo = new THREE.BoxGeometry(w * 0.4, 2.5, d * 0.4);
      const hvac = new THREE.Mesh(hvacGeo, buildingMatDark);
      hvac.position.y = h + 1.25;
      bGroup.add(hvac);

      scene.add(bGroup);
    };

    const bDist = roadWidth / 2 + 24;
    createCityBuilding(-bDist, -bDist, 28, 48, 28, 0x1e293b); // NW High-Rise
    createCityBuilding(bDist, -bDist, 30, 36, 30, 0x334155); // NE Commercial
    createCityBuilding(-bDist, bDist, 26, 42, 26, 0x1e293b); // SW Tech Plaza
    createCityBuilding(bDist, bDist, 32, 52, 32, 0x0f172a); // SE Corporate

    // Sidewalk Trees
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const treeFoliageMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x064e3b : 0x15803d,
      roughness: 0.8,
    });

    const createTree = (x: number, z: number) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 3.5, 8);
      const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
      trunk.position.y = 1.75;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Foliage Clump
      const foliageGeo = new THREE.DodecahedronGeometry(2.2, 1);
      const foliage = new THREE.Mesh(foliageGeo, treeFoliageMat);
      foliage.position.y = 4.5;
      foliage.castShadow = true;
      treeGroup.add(foliage);

      scene.add(treeGroup);
    };

    [-18, 18].forEach((tx) => {
      [-25, -45, 25, 45].forEach((tz) => {
        createTree(tx, tz);
        createTree(tz, tx);
      });
    });

    // 5. Heavy-Duty Mast-Arm Traffic Signal Gantries
    interface MastSignal {
      dir: Direction;
      redLamp: THREE.Mesh;
      yellowLamp: THREE.Mesh;
      greenLamp: THREE.Mesh;
      spotLight: THREE.SpotLight;
    }

    const mastSignals: MastSignal[] = [];

    const createSignalGantry = (x: number, z: number, rotationY: number, dir: Direction) => {
      const gGroup = new THREE.Group();
      gGroup.position.set(x, 0, z);
      gGroup.rotation.y = rotationY;

      // Heavy Vertical Post
      const postGeo = new THREE.CylinderGeometry(0.3, 0.4, 9.5, 16);
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.25,
      });
      const post = new THREE.Mesh(postGeo, metalMat);
      post.position.y = 4.75;
      post.castShadow = true;
      gGroup.add(post);

      // Cantilever Horizontal Mast Arm reaching over lane
      const armGeo = new THREE.CylinderGeometry(0.2, 0.25, 7.5, 16);
      const arm = new THREE.Mesh(armGeo, metalMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(3.75, 8.8, 0);
      gGroup.add(arm);

      // Signal Head Housing with Hooded Backplate (MUTCD standard)
      const housingGeo = new THREE.BoxGeometry(1.2, 3.2, 0.8);
      const housingMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 });
      const housing = new THREE.Mesh(housingGeo, housingMat);
      housing.position.set(5.5, 8.8, 0);
      housing.castShadow = true;
      gGroup.add(housing);

      // Signal Lamps
      const lampGeo = new THREE.SphereGeometry(0.35, 16, 16);

      const redMat = new THREE.MeshStandardMaterial({
        color: 0x220505,
        emissive: 0xff1e1e,
        emissiveIntensity: 0.1,
      });
      const redLamp = new THREE.Mesh(lampGeo, redMat);
      redLamp.position.set(5.5, 9.8, 0.35);
      gGroup.add(redLamp);

      const yellowMat = new THREE.MeshStandardMaterial({
        color: 0x221a02,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.1,
      });
      const yellowLamp = new THREE.Mesh(lampGeo, yellowMat);
      yellowLamp.position.set(5.5, 8.8, 0.35);
      gGroup.add(yellowLamp);

      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x022210,
        emissive: 0x10b981,
        emissiveIntensity: 0.1,
      });
      const greenLamp = new THREE.Mesh(lampGeo, greenMat);
      greenLamp.position.set(5.5, 7.8, 0.35);
      gGroup.add(greenLamp);

      // Downward Street Projection Spotlight
      const spotLight = new THREE.SpotLight(0x10b981, 2.5, 24, Math.PI / 4, 0.4);
      spotLight.position.set(5.5, 8.5, 0.5);
      spotLight.target.position.set(5.5, 0, 8);
      gGroup.add(spotLight);
      gGroup.add(spotLight.target);

      scene.add(gGroup);

      mastSignals.push({ dir, redLamp, yellowLamp, greenLamp, spotLight });
    };

    // Position 4 Mast Gantries at Approach Entrances
    createSignalGantry(roadWidth / 2 + 1.2, -roadWidth / 2 - 4.5, 0, 'NORTH');
    createSignalGantry(-roadWidth / 2 - 1.2, roadWidth / 2 + 4.5, Math.PI, 'SOUTH');
    createSignalGantry(roadWidth / 2 + 4.5, roadWidth / 2 + 1.2, -Math.PI / 2, 'EAST');
    createSignalGantry(-roadWidth / 2 - 4.5, -roadWidth / 2 - 1.2, Math.PI / 2, 'WEST');

    // 6. Realistic Procedural 3D Vehicles Fleet
    interface Vehicle3D {
      mesh: THREE.Group;
      wheels: THREE.Mesh[];
      headlights: THREE.SpotLight[];
      road: Direction;
      laneIndex: number; // 0: inner (straight/left), 1: outer (straight/right)
      targetManeuver: 'STRAIGHT' | 'LEFT' | 'RIGHT';
      t: number; // 0 to 1 progress along approach
      speed: number;
      targetSpeed: number;
      isEmergency: boolean;
      beaconMesh?: THREE.Mesh;
      beaconLight?: THREE.PointLight;
      brakeLights: THREE.Mesh[];
    }

    const vehicles: Vehicle3D[] = [];

    // Helper to build realistic vehicles with rotating wheels and glowing lights
    const build3DVehicle = (
      type: 'SEDAN' | 'SUV' | 'BUS' | 'TRUCK' | 'AMBULANCE',
      paintColorHex: number
    ) => {
      const group = new THREE.Group();
      const wheels: THREE.Mesh[] = [];
      const headlights: THREE.SpotLight[] = [];
      const brakeLights: THREE.Mesh[] = [];

      const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 16);
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.9,
      });
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.8,
        roughness: 0.2,
      });

      const addWheel = (x: number, y: number, z: number) => {
        const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
        wMesh.rotation.z = Math.PI / 2;
        wMesh.position.set(x, y, z);
        wMesh.castShadow = true;

        // Hub Rim
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.37, 12), rimMat);
        rim.rotation.z = Math.PI / 2;
        wMesh.add(rim);

        group.add(wMesh);
        wheels.push(wMesh);
      };

      let beaconMesh: THREE.Mesh | undefined;
      let beaconLight: THREE.PointLight | undefined;

      if (type === 'BUS') {
        // City Transit Bus (12m scale)
        const busLength = 11.5;
        const busWidth = 2.8;
        const busHeight = 3.2;

        const bodyGeo = new THREE.BoxGeometry(busWidth, busHeight, busLength);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7, // Sky Blue City Transit
          roughness: 0.3,
          metalness: 0.4,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = busHeight / 2 + 0.4;
        body.castShadow = true;
        group.add(body);

        // Windows Strip
        const winGeo = new THREE.BoxGeometry(busWidth + 0.1, 1.1, busLength - 1.2);
        const winMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.1,
          metalness: 0.9,
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(0, busHeight * 0.7, 0);
        group.add(win);

        // Wheels (6 wheels for bus)
        [-1.35, 1.35].forEach((wx) => {
          addWheel(wx, 0.55, busLength * 0.32);
          addWheel(wx, 0.55, -busLength * 0.22);
          addWheel(wx, 0.55, -busLength * 0.36);
        });
      } else if (type === 'TRUCK') {
        // Delivery Box Truck
        const cabLength = 2.5;
        const boxLength = 5.5;
        const truckWidth = 2.6;

        // Cab
        const cabGeo = new THREE.BoxGeometry(truckWidth, 2.6, cabLength);
        const cabMat = new THREE.MeshStandardMaterial({ color: paintColorHex, roughness: 0.3 });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(0, 1.8, cabLength / 2 + 0.2);
        cab.castShadow = true;
        group.add(cab);

        // Cargo Box
        const boxGeo = new THREE.BoxGeometry(truckWidth + 0.2, 3.4, boxLength);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
        const cargo = new THREE.Mesh(boxGeo, boxMat);
        cargo.position.set(0, 2.3, -boxLength / 2);
        cargo.castShadow = true;
        group.add(cargo);

        // Wheels
        [-1.3, 1.3].forEach((wx) => {
          addWheel(wx, 0.55, 1.2);
          addWheel(wx, 0.55, -1.8);
          addWheel(wx, 0.55, -3.2);
        });
      } else if (type === 'AMBULANCE') {
        // Emergency Ambulance
        const ambWidth = 2.4;
        const ambLength = 5.8;
        const ambHeight = 2.6;

        const bodyGeo = new THREE.BoxGeometry(ambWidth, ambHeight, ambLength);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.25,
          metalness: 0.3,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = ambHeight / 2 + 0.45;
        body.castShadow = true;
        group.add(body);

        // Red Cross Insignia / Stripes
        const stripeGeo = new THREE.BoxGeometry(ambWidth + 0.1, 0.5, ambLength - 0.5);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, 1.6, 0);
        group.add(stripe);

        // Flashing Dual Emergency Beacon Lightbar
        const beaconGeo = new THREE.BoxGeometry(1.6, 0.3, 0.6);
        const bMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        beaconMesh = new THREE.Mesh(beaconGeo, bMat);
        beaconMesh.position.set(0, ambHeight + 0.6, 0.5);
        group.add(beaconMesh);

        beaconLight = new THREE.PointLight(0xef4444, 4.0, 18);
        beaconLight.position.set(0, ambHeight + 1.2, 0.5);
        group.add(beaconLight);

        // Wheels
        [-1.2, 1.2].forEach((wx) => {
          addWheel(wx, 0.55, 1.6);
          addWheel(wx, 0.55, -1.6);
        });
      } else {
        // Sedan / SUV
        const carLength = type === 'SUV' ? 4.9 : 4.4;
        const carWidth = type === 'SUV' ? 2.3 : 2.1;
        const carHeight = type === 'SUV' ? 1.7 : 1.35;

        // Chassis Lower Body
        const bodyGeo = new THREE.BoxGeometry(carWidth, carHeight * 0.65, carLength);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: paintColorHex,
          metalness: 0.7,
          roughness: 0.25,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.75;
        body.castShadow = true;
        group.add(body);

        // Cabin Glass Top
        const cabinGeo = new THREE.BoxGeometry(carWidth * 0.88, carHeight * 0.6, carLength * 0.55);
        const cabinMat = new THREE.MeshStandardMaterial({
          color: 0x090d16,
          roughness: 0.1,
          metalness: 0.9,
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.35, -carLength * 0.08);
        group.add(cabin);

        // Wheels
        [-1.05, 1.05].forEach((wx) => {
          addWheel(wx, 0.55, carLength * 0.28);
          addWheel(wx, 0.55, -carLength * 0.28);
        });
      }

      // Front Headlights with Projected Light Cones
      const hlGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const hlLeft = new THREE.Mesh(hlGeo, hlMat);
      hlLeft.position.set(-0.85, 0.8, 2.3);
      const hlRight = new THREE.Mesh(hlGeo, hlMat);
      hlRight.position.set(0.85, 0.8, 2.3);
      group.add(hlLeft, hlRight);

      // Forward Street Spotlight (Headlight Cones)
      if (isNightMode) {
        const spotL = new THREE.SpotLight(0xfffaed, 2.2, 28, Math.PI / 6, 0.4);
        spotL.position.set(-0.85, 0.8, 2.3);
        spotL.target.position.set(-0.85, 0, 18);
        group.add(spotL);
        group.add(spotL.target);
        headlights.push(spotL);

        const spotR = new THREE.SpotLight(0xfffaed, 2.2, 28, Math.PI / 6, 0.4);
        spotR.position.set(0.85, 0.8, 2.3);
        spotR.target.position.set(0.85, 0, 18);
        group.add(spotR);
        group.add(spotR.target);
        headlights.push(spotR);
      }

      // Rear Red Brake Taillights
      const brakeGeo = new THREE.BoxGeometry(0.35, 0.18, 0.08);
      const brakeMat = new THREE.MeshStandardMaterial({
        color: 0x220505,
        emissive: 0xef4444,
        emissiveIntensity: 0.4,
      });

      const tlLeft = new THREE.Mesh(brakeGeo, brakeMat);
      tlLeft.position.set(-0.85, 0.8, -2.3);
      const tlRight = new THREE.Mesh(brakeGeo, brakeMat);
      tlRight.position.set(0.85, 0.8, -2.3);
      group.add(tlLeft, tlRight);
      brakeLights.push(tlLeft, tlRight);

      return { group, wheels, headlights, beaconMesh, beaconLight, brakeLights };
    };

    // Fleet Spawner: populates multi-class vehicles across all approaches
    const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
    const paintPalettes = [0xe11d48, 0x2563eb, 0x059669, 0xd97706, 0x475569, 0xffffff, 0x0f172a];

    // Spawn 16 vehicles distributed across lanes with varying speeds
    for (let i = 0; i < 16; i++) {
      const road = directions[i % 4];
      const isEmergency = i === 0 && Boolean(state?.activeEmergencyMessage);
      const type = isEmergency
        ? 'AMBULANCE'
        : i % 5 === 0
        ? 'BUS'
        : i % 4 === 0
        ? 'TRUCK'
        : i % 2 === 0
        ? 'SUV'
        : 'SEDAN';

      const color = paintPalettes[i % paintPalettes.length];
      const { group, wheels, headlights, beaconMesh, beaconLight, brakeLights } = build3DVehicle(
        type,
        color
      );

      scene.add(group);

      vehicles.push({
        mesh: group,
        wheels,
        headlights,
        road,
        laneIndex: i % 2,
        targetManeuver: i % 3 === 0 ? 'LEFT' : i % 2 === 0 ? 'RIGHT' : 'STRAIGHT',
        t: 0.05 + ((i * 0.18) % 0.85),
        speed: 0,
        targetSpeed: isEmergency ? 0.0075 : 0.0035 + (i % 3) * 0.0008,
        isEmergency,
        beaconMesh,
        beaconLight,
        brakeLights,
      });
    }

    // 7. Cinematic Camera Positioning & Orbit Navigation
    let isMouseDown = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 72, theta: Math.PI / 4, phi: Math.PI / 3 };

    const updateCamera = () => {
      if (cameraPreset === 'DRONE') {
        camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        camera.position.y = spherical.radius * Math.cos(spherical.phi);
        camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
        camera.lookAt(0, 1.5, 0);
      } else if (cameraPreset === 'CCTV') {
        // High Mast Corner Cam (NW corner facing SE)
        camera.position.set(-18, 22, -18);
        camera.lookAt(2, 0, 2);
      } else if (cameraPreset === 'DRIVER') {
        // Driver perspective of lead vehicle on active road
        camera.position.set(-4.5, 2.2, -26);
        camera.lookAt(-4.5, 1.8, 15);
      } else {
        // Top-Down Orthographic Architecture
        camera.position.set(0, 85, 0.1);
        camera.lookAt(0, 0, 0);
      }
    };

    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || cameraPreset !== 'DRONE') return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      spherical.theta -= deltaX * 0.006;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.08, spherical.phi - deltaY * 0.006));

      updateCamera();
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (cameraPreset !== 'DRONE') return;
      spherical.radius = Math.max(28, Math.min(130, spherical.radius + e.deltaY * 0.05));
      updateCamera();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: true });

    // 8. Animation & Kinematics Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Read live signals from engine or activeApproach
      const currentSignals = state?.signals || {
        NORTH: activeApproach === 'NORTH' ? 'GREEN' : 'RED',
        SOUTH: activeApproach === 'SOUTH' ? 'GREEN' : 'RED',
        EAST: activeApproach === 'EAST' ? 'GREEN' : 'RED',
        WEST: activeApproach === 'WEST' ? 'GREEN' : 'RED',
      };

      // Update Mast Signal Head Lamps
      mastSignals.forEach((ms) => {
        const sig = currentSignals[ms.dir] || 'RED';
        const isGreen = sig === 'GREEN';
        const isYellow = sig === 'YELLOW';
        const isRed = sig === 'RED';

        const redMat = ms.redLamp.material as THREE.MeshStandardMaterial;
        const yellowMat = ms.yellowLamp.material as THREE.MeshStandardMaterial;
        const greenMat = ms.greenLamp.material as THREE.MeshStandardMaterial;

        redMat.emissiveIntensity = isRed ? 2.8 : 0.05;
        yellowMat.emissiveIntensity = isYellow ? 2.8 : 0.05;
        greenMat.emissiveIntensity = isGreen ? 2.8 : 0.05;

        if (isGreen) {
          ms.spotLight.color.setHex(0x10b981);
          ms.spotLight.intensity = 2.4;
        } else if (isYellow) {
          ms.spotLight.color.setHex(0xf59e0b);
          ms.spotLight.intensity = 2.2;
        } else {
          ms.spotLight.color.setHex(0xef4444);
          ms.spotLight.intensity = 1.8;
        }
      });

      // Update 3D Vehicle Kinematics with Intelligent Driver Model (IDM)
      const stopDistanceT = 0.44; // Intersection stop line parameter

      vehicles.forEach((v, idx) => {
        const sig = currentSignals[v.road] || 'RED';
        const isGreenSignal = sig === 'GREEN' || v.isEmergency;

        // Check distance to car in front on the same approach & lane
        let distanceToLead = 999;
        vehicles.forEach((other, oIdx) => {
          if (
            idx !== oIdx &&
            other.road === v.road &&
            other.laneIndex === v.laneIndex &&
            other.t > v.t
          ) {
            const gap = other.t - v.t;
            if (gap < distanceToLead) distanceToLead = gap;
          }
        });

        // Stopping condition: Red signal and approaching stop line, or stopped lead vehicle ahead
        const approachingStopLine = v.t < stopDistanceT && stopDistanceT - v.t < 0.16;
        const mustStopForSignal = !isGreenSignal && approachingStopLine;
        const mustStopForLeadCar = distanceToLead < 0.11;

        if (mustStopForSignal || mustStopForLeadCar) {
          // Decelerate smoothly
          v.speed = Math.max(0, v.speed - delta * 0.015);
          // Bright red brake lights
          v.brakeLights.forEach((bl) => {
            (bl.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.4;
          });
        } else {
          // Accelerate to target cruising speed
          v.speed = Math.min(v.targetSpeed, v.speed + delta * 0.008);
          // Dim normal taillights
          v.brakeLights.forEach((bl) => {
            (bl.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4;
          });
        }

        v.t += v.speed;
        if (v.t > 1) {
          v.t = 0;
          v.speed = v.targetSpeed * 0.5;
        }

        // Rotate wheels based on displacement speed
        const wheelRotSpeed = v.speed * 60;
        v.wheels.forEach((w) => {
          w.rotation.x += wheelRotSpeed;
        });

        // Map parameter t to 3D intersection coordinates
        const laneOffset = v.laneIndex === 0 ? -2.25 : -6.75;
        const totalApproachLength = 160;
        const rawPos = -totalApproachLength / 2 + v.t * totalApproachLength;

        // Transform road approach into 3D World space
        if (v.road === 'NORTH') {
          v.mesh.position.set(laneOffset, 0, rawPos);
          v.mesh.rotation.y = 0;
        } else if (v.road === 'SOUTH') {
          v.mesh.position.set(-laneOffset, 0, -rawPos);
          v.mesh.rotation.y = Math.PI;
        } else if (v.road === 'EAST') {
          v.mesh.position.set(-rawPos, 0, laneOffset);
          v.mesh.rotation.y = Math.PI / 2;
        } else {
          v.mesh.position.set(rawPos, 0, -laneOffset);
          v.mesh.rotation.y = -Math.PI / 2;
        }

        // Flashing Emergency Beacon Lightbar
        if (v.isEmergency && v.beaconMesh && v.beaconLight) {
          const isBlue = Math.sin(time * 16) > 0;
          (v.beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(
            isBlue ? 0x38bdf8 : 0xef4444
          );
          v.beaconLight.color.setHex(isBlue ? 0x38bdf8 : 0xef4444);
          v.beaconLight.intensity = 3.5 + Math.sin(time * 20) * 1.5;
        }
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [cameraPreset, isNightMode, activeApproach, state?.signals, state?.activeEmergencyMessage]);

  const handleApproachSwitch = (dir: Direction) => {
    soundEffects.playClick();
    setActiveApproach(dir);
    if (onTriggerGreen) onTriggerGreen(dir);
    if (engine) engine.setManualDirection(dir);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl flex flex-col font-mono select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full aspect-[16/10] sm:aspect-[16/9] min-h-[420px] block cursor-grab active:cursor-grabbing"
      />

      {/* Top Refined OSD Control Bar */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
        {/* Status OSD Pill */}
        <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-white flex items-center gap-2 pointer-events-auto shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-cyan-300">3D DIGITAL TWIN</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 uppercase">{activeApproach} GREEN ACTIVE</span>
        </div>

        {/* Camera Preset Selector & Day/Night Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
          <button
            onClick={() => {
              soundEffects.playClick();
              setCameraPreset('DRONE');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'DRONE'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Free 360° Drone Orbit Inspection"
          >
            Drone 360°
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setCameraPreset('CCTV');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'CCTV'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="High Mast Security CCTV Perspective"
          >
            CCTV Mast
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setCameraPreset('DRIVER');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'DRIVER'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Driver Dashboard Point of View"
          >
            Driver POV
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setCameraPreset('TOP_DOWN');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'TOP_DOWN'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Top-Down Orthographic Blueprint"
          >
            Top-Down
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setIsNightMode(!isNightMode);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition ml-0.5 cursor-pointer"
            title="Toggle Day/Cyberpunk Night Lighting"
          >
            {isNightMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-cyan-300" />
            )}
          </button>
        </div>
      </div>

      {/* CCTV Camera HUD Scanline Overlay (Active in CCTV Mode) */}
      {cameraPreset === 'CCTV' && (
        <div className="absolute top-14 left-4 font-mono text-[10px] text-emerald-400 pointer-events-none bg-black/60 px-2 py-1 rounded border border-emerald-500/30">
          <div>● CAM-04 [JUNCTION NORTH-WEST] • 4K 60FPS</div>
          <div className="text-slate-400 text-[9px] mt-0.5">
            OPTICAL OBJECT DETECTION: ACTIVE
          </div>
        </div>
      )}

      {/* Bottom Road Approach Phase Bar */}
      <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <span className="text-slate-400 text-[11px] hidden sm:inline">
          Click approach to assign Green phase:
        </span>

        <div className="flex items-center gap-1.5">
          {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => {
            const isCurrent = activeApproach === dir;
            return (
              <button
                key={dir}
                onClick={() => handleApproachSwitch(dir)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCurrent ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'
                  }`}
                />
                <span>{dir}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
