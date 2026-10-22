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
  ZoomIn,
  ZoomOut,
  Sliders,
  Car,
  ShieldAlert,
} from 'lucide-react';
import { Direction, LightState } from '../../types';
import { SimVehicle, SimVehicleType, SimulationTelemetryState } from '../../types/simulation';
import { TrafficSimulationEngine } from '../../utils/simulationEngine';
import { soundEffects } from '../../utils/soundEffects';

interface ThreeIntersectionViewerProps {
  engine?: TrafficSimulationEngine;
  state?: SimulationTelemetryState;
  telemetry?: any;
  onTriggerGreen?: (direction: Direction) => void;
}

type CameraViewPreset = 'DRONE' | 'CCTV' | 'DRIVER' | 'TOP_DOWN';

interface Vehicle3DRecord {
  id: string;
  group: THREE.Group;
  type: SimVehicleType;
  wheels: THREE.Mesh[];
  beaconMesh?: THREE.Mesh;
  beaconLight?: THREE.PointLight;
  brakeLights: THREE.Mesh[];
  headlights: THREE.SpotLight[];
}

export const ThreeIntersectionViewer: React.FC<ThreeIntersectionViewerProps> = ({
  engine,
  state,
  telemetry,
  onTriggerGreen,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>('DRONE');
  const [isNightMode, setIsNightMode] = useState<boolean>(true);
  const [activeRoad, setActiveRoad] = useState<Direction>(
    state?.activeDirection || telemetry?.activeDirection || 'NORTH'
  );

  // References for live synchronization without triggering useEffect re-runs
  const engineRef = useRef<TrafficSimulationEngine | undefined>(engine);
  engineRef.current = engine;

  const stateRef = useRef<SimulationTelemetryState | undefined>(state);
  stateRef.current = state;

  const isNightModeRef = useRef<boolean>(isNightMode);
  isNightModeRef.current = isNightMode;

  const cameraPresetRef = useRef<CameraViewPreset>(cameraPreset);
  cameraPresetRef.current = cameraPreset;

  // Scene object refs for dynamic theme switching without recreating the scene
  const sceneRef = useRef<THREE.Scene | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const groundMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const sidewalkMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const buildingGlassMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Mutable camera spherical coordinate state
  const cameraStateRef = useRef({
    radius: 72,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    topDownY: 85,
    cctvFov: 45,
    driverFov: 48,
  });

  const updateCameraFnRef = useRef<() => void>(() => {});

  // Sync active road from state or telemetry
  useEffect(() => {
    if (state?.activeDirection) {
      setActiveRoad(state.activeDirection);
    } else if (telemetry?.activeDirection) {
      setActiveRoad(telemetry.activeDirection);
    }
  }, [state?.activeDirection, telemetry?.activeDirection]);

  // Ensure simulation engine is running when 3D tab is opened
  useEffect(() => {
    if (engine && !engine.getState().isRunning) {
      engine.start();
    }
  }, [engine]);

  // Dynamic Theme Switcher: Updates materials, sky, fog, and lights instantaneously!
  useEffect(() => {
    const scene = sceneRef.current;
    const hemi = hemiLightRef.current;
    const sun = sunLightRef.current;
    const ground = groundMatRef.current;
    const sidewalk = sidewalkMatRef.current;
    const glass = buildingGlassMatRef.current;
    if (!scene || !hemi || !sun) return;

    const skyColor = isNightMode ? 0x070b16 : 0xdbeafe;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, isNightMode ? 0.008 : 0.005);

    if (isNightMode) {
      hemi.color.setHex(0x1e293b);
      hemi.groundColor.setHex(0x090e17);
      hemi.intensity = 1.0;

      sun.color.setHex(0x60a5fa);
      sun.intensity = 1.4;

      if (ground) ground.color.setHex(0x090e17);
      if (sidewalk) sidewalk.color.setHex(0x252e3d);
      if (glass) {
        glass.emissive.setHex(0x38bdf8);
        glass.emissiveIntensity = 0.35;
      }
    } else {
      // Day Mode
      hemi.color.setHex(0xffffff);
      hemi.groundColor.setHex(0x94a3b8);
      hemi.intensity = 1.6;

      sun.color.setHex(0xfffaed);
      sun.intensity = 2.4;

      if (ground) ground.color.setHex(0x86efac);
      if (sidewalk) sidewalk.color.setHex(0xe2e8f0);
      if (glass) {
        glass.emissive.setHex(0x000000);
        glass.emissiveIntensity = 0.0;
      }
    }
  }, [isNightMode]);

  // Main Three.js Lifecycle: Mount ONCE and run at 60 FPS
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Atmosphere Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const skyColor = isNightModeRef.current ? 0x070b16 : 0xdbeafe;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, isNightModeRef.current ? 0.008 : 0.005);

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

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
    renderer.toneMappingExposure = 1.15;

    container.replaceChildren(renderer.domElement);

    // 2. Lighting System
    const hemiLight = new THREE.HemisphereLight(
      isNightModeRef.current ? 0x1e293b : 0xffffff,
      isNightModeRef.current ? 0x090e17 : 0x94a3b8,
      isNightModeRef.current ? 1.0 : 1.6
    );
    hemiLightRef.current = hemiLight;
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(
      isNightModeRef.current ? 0x60a5fa : 0xfffaed,
      isNightModeRef.current ? 1.4 : 2.4
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
    sunLightRef.current = sunLight;
    scene.add(sunLight);

    // 3. Ground & Urban Infrastructure
    // Base Grass Ground
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightModeRef.current ? 0x090e17 : 0x86efac,
      roughness: 0.95,
      metalness: 0.05,
    });
    groundMatRef.current = groundMat;
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Crossroads Geometry (18m road width matching 2 lanes in each direction)
    const roadWidth = 18;
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

    // Double Center Yellow Lines
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

    // White Dashed Lane Dividers
    const dashGeo = new THREE.PlaneGeometry(0.25, 3.2);
    for (let pos = -100; pos <= 100; pos += 6) {
      if (Math.abs(pos) > roadWidth / 2 + 6) {
        [-4.5, 4.5].forEach((lx) => {
          const dash = new THREE.Mesh(dashGeo, whiteLineMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(lx, 0.08, pos);
          scene.add(dash);
        });

        [-4.5, 4.5].forEach((lz) => {
          const dash = new THREE.Mesh(dashGeo, whiteLineMat);
          dash.rotation.x = -Math.PI / 2;
          dash.rotation.z = Math.PI / 2;
          dash.position.set(pos, 0.08, lz);
          scene.add(dash);
        });
      }
    }

    // Stop Line Bars
    const stopBarGeo = new THREE.PlaneGeometry(roadWidth / 2 - 0.5, 0.8);
    const stopDist = roadWidth / 2 + 3.5;

    // North
    const stopNorth = new THREE.Mesh(stopBarGeo, whiteLineMat);
    stopNorth.rotation.x = -Math.PI / 2;
    stopNorth.position.set(-roadWidth / 4, 0.08, -stopDist);
    scene.add(stopNorth);

    // South
    const stopSouth = new THREE.Mesh(stopBarGeo, whiteLineMat);
    stopSouth.rotation.x = -Math.PI / 2;
    stopSouth.position.set(roadWidth / 4, 0.08, stopDist);
    scene.add(stopSouth);

    // West
    const stopWest = new THREE.Mesh(stopBarGeo, whiteLineMat);
    stopWest.rotation.x = -Math.PI / 2;
    stopWest.rotation.z = Math.PI / 2;
    stopWest.position.set(-stopDist, 0.08, 4.5);
    scene.add(stopWest);

    // East
    const stopEast = new THREE.Mesh(stopBarGeo, whiteLineMat);
    stopEast.rotation.x = -Math.PI / 2;
    stopEast.rotation.z = Math.PI / 2;
    stopEast.position.set(stopDist, 0.08, -4.5);
    scene.add(stopEast);

    // Zebra Crosswalks
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

    addCrosswalk(-roadWidth / 2 - 1.8, false); // North
    addCrosswalk(roadWidth / 2 + 1.8, false); // South
    addCrosswalk(-roadWidth / 2 - 1.8, true); // West
    addCrosswalk(roadWidth / 2 + 1.8, true); // East

    // Raised Concrete Sidewalks
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: isNightModeRef.current ? 0x252e3d : 0xe2e8f0,
      roughness: 0.7,
      metalness: 0.1,
    });
    sidewalkMatRef.current = sidewalkMat;

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

    // 4. Urban Architecture (4 Modern Corner Towers)
    const buildingMatDark = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
    });
    const buildingGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.9,
      emissive: isNightModeRef.current ? 0x38bdf8 : 0x000000,
      emissiveIntensity: isNightModeRef.current ? 0.35 : 0.0,
    });
    buildingGlassMatRef.current = buildingGlassMat;

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

      const winMesh = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.2, h * 0.75, d + 0.2),
        buildingGlassMat
      );
      winMesh.position.y = h / 2;
      bGroup.add(winMesh);

      const hvac = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 2.5, d * 0.4), buildingMatDark);
      hvac.position.y = h + 1.25;
      bGroup.add(hvac);

      scene.add(bGroup);
    };

    const bDist = roadWidth / 2 + 24;
    createCityBuilding(-bDist, -bDist, 28, 48, 28, 0x1e293b);
    createCityBuilding(bDist, -bDist, 30, 36, 30, 0x334155);
    createCityBuilding(-bDist, bDist, 26, 42, 26, 0x1e293b);
    createCityBuilding(bDist, bDist, 32, 52, 32, 0x0f172a);

    // Sidewalk Trees
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const treeFoliageMat = new THREE.MeshStandardMaterial({
      color: isNightModeRef.current ? 0x064e3b : 0x15803d,
      roughness: 0.8,
    });

    const createTree = (x: number, z: number) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 3.5, 8), treeTrunkMat);
      trunk.position.y = 1.75;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 1), treeFoliageMat);
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

    // 5. Mast-Arm Traffic Signal Gantries
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

      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.25,
      });

      // Post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 9.5, 16), metalMat);
      post.position.y = 4.75;
      post.castShadow = true;
      gGroup.add(post);

      // Arm
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 7.5, 16), metalMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(3.75, 8.8, 0);
      gGroup.add(arm);

      // Housing
      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 3.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 })
      );
      housing.position.set(5.5, 8.8, 0);
      housing.castShadow = true;
      gGroup.add(housing);

      // Lamps
      const lampGeo = new THREE.SphereGeometry(0.35, 16, 16);

      const redLamp = new THREE.Mesh(
        lampGeo,
        new THREE.MeshStandardMaterial({
          color: 0x220505,
          emissive: 0xff1e1e,
          emissiveIntensity: 0.1,
        })
      );
      redLamp.position.set(5.5, 9.8, 0.35);
      gGroup.add(redLamp);

      const yellowLamp = new THREE.Mesh(
        lampGeo,
        new THREE.MeshStandardMaterial({
          color: 0x221a02,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.1,
        })
      );
      yellowLamp.position.set(5.5, 8.8, 0.35);
      gGroup.add(yellowLamp);

      const greenLamp = new THREE.Mesh(
        lampGeo,
        new THREE.MeshStandardMaterial({
          color: 0x022210,
          emissive: 0x10b981,
          emissiveIntensity: 0.1,
        })
      );
      greenLamp.position.set(5.5, 7.8, 0.35);
      gGroup.add(greenLamp);

      // Spotlight projection
      const spotLight = new THREE.SpotLight(0x10b981, 2.5, 24, Math.PI / 4, 0.4);
      spotLight.position.set(5.5, 8.5, 0.5);
      spotLight.target.position.set(5.5, 0, 8);
      gGroup.add(spotLight);
      gGroup.add(spotLight.target);

      scene.add(gGroup);

      mastSignals.push({ dir, redLamp, yellowLamp, greenLamp, spotLight });
    };

    createSignalGantry(roadWidth / 2 + 1.2, -roadWidth / 2 - 4.5, 0, 'NORTH');
    createSignalGantry(-roadWidth / 2 - 1.2, roadWidth / 2 + 4.5, Math.PI, 'SOUTH');
    createSignalGantry(roadWidth / 2 + 4.5, roadWidth / 2 + 1.2, -Math.PI / 2, 'EAST');
    createSignalGantry(-roadWidth / 2 - 4.5, -roadWidth / 2 - 1.2, Math.PI / 2, 'WEST');

    // 6. Dynamic Vehicle Mesh Pool
    const vehiclePool = new Map<string, Vehicle3DRecord>();

    const build3DVehicle = (
      type: SimVehicleType,
      paintColorHex: number,
      isEmergency: boolean
    ): Vehicle3DRecord => {
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

        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.37, 12), rimMat);
        rim.rotation.z = Math.PI / 2;
        wMesh.add(rim);

        group.add(wMesh);
        wheels.push(wMesh);
      };

      let beaconMesh: THREE.Mesh | undefined;
      let beaconLight: THREE.PointLight | undefined;

      if (isEmergency || type === 'AMBULANCE' || type === 'FIRE_TRUCK') {
        // High-Detail Emergency Vehicle
        const ambWidth = 2.4;
        const ambLength = 5.8;
        const ambHeight = 2.6;

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(ambWidth, ambHeight, ambLength),
          new THREE.MeshStandardMaterial({
            color: type === 'FIRE_TRUCK' ? 0xdc2626 : 0xffffff,
            roughness: 0.25,
            metalness: 0.3,
          })
        );
        body.position.y = ambHeight / 2 + 0.45;
        body.castShadow = true;
        group.add(body);

        // Chevrons / Red Cross
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(ambWidth + 0.1, 0.5, ambLength - 0.5),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        stripe.position.set(0, 1.6, 0);
        group.add(stripe);

        // Flashing Dual Emergency Beacon Lightbar
        beaconMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.35, 0.6),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        beaconMesh.position.set(0, ambHeight + 0.65, 0.5);
        group.add(beaconMesh);

        beaconLight = new THREE.PointLight(0xef4444, 4.5, 22);
        beaconLight.position.set(0, ambHeight + 1.2, 0.5);
        group.add(beaconLight);

        [-1.2, 1.2].forEach((wx) => {
          addWheel(wx, 0.55, 1.6);
          addWheel(wx, 0.55, -1.6);
        });
      } else if (type === 'BUS') {
        const busLength = 11.5;
        const busWidth = 2.8;
        const busHeight = 3.2;

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(busWidth, busHeight, busLength),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 })
        );
        body.position.y = busHeight / 2 + 0.4;
        body.castShadow = true;
        group.add(body);

        const win = new THREE.Mesh(
          new THREE.BoxGeometry(busWidth + 0.1, 1.1, busLength - 1.2),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
        );
        win.position.set(0, busHeight * 0.7, 0);
        group.add(win);

        [-1.35, 1.35].forEach((wx) => {
          addWheel(wx, 0.55, busLength * 0.32);
          addWheel(wx, 0.55, -busLength * 0.22);
          addWheel(wx, 0.55, -busLength * 0.36);
        });
      } else if (type === 'TRUCK') {
        const cabLength = 2.5;
        const boxLength = 5.5;
        const truckWidth = 2.6;

        const cab = new THREE.Mesh(
          new THREE.BoxGeometry(truckWidth, 2.6, cabLength),
          new THREE.MeshStandardMaterial({ color: paintColorHex, roughness: 0.3 })
        );
        cab.position.set(0, 1.8, cabLength / 2 + 0.2);
        cab.castShadow = true;
        group.add(cab);

        const cargo = new THREE.Mesh(
          new THREE.BoxGeometry(truckWidth + 0.2, 3.4, boxLength),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
        );
        cargo.position.set(0, 2.3, -boxLength / 2);
        cargo.castShadow = true;
        group.add(cargo);

        [-1.3, 1.3].forEach((wx) => {
          addWheel(wx, 0.55, 1.2);
          addWheel(wx, 0.55, -1.8);
          addWheel(wx, 0.55, -3.2);
        });
      } else {
        // Sedan / SUV / Taxi / VIP
        const carLength = type === 'SUV' ? 4.9 : 4.4;
        const carWidth = type === 'SUV' ? 2.3 : 2.1;
        const carHeight = type === 'SUV' ? 1.7 : 1.35;

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(carWidth, carHeight * 0.65, carLength),
          new THREE.MeshStandardMaterial({
            color: type === 'VIP' ? 0x000000 : paintColorHex,
            metalness: 0.75,
            roughness: 0.2,
          })
        );
        body.position.y = 0.75;
        body.castShadow = true;
        group.add(body);

        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(carWidth * 0.88, carHeight * 0.6, carLength * 0.55),
          new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1, metalness: 0.9 })
        );
        cabin.position.set(0, 1.35, -carLength * 0.08);
        group.add(cabin);

        [-1.05, 1.05].forEach((wx) => {
          addWheel(wx, 0.55, carLength * 0.28);
          addWheel(wx, 0.55, -carLength * 0.28);
        });
      }

      // Front Headlights
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hlLeft = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), hlMat);
      hlLeft.position.set(-0.85, 0.8, 2.3);
      const hlRight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), hlMat);
      hlRight.position.set(0.85, 0.8, 2.3);
      group.add(hlLeft, hlRight);

      // Night Headlight Spotlights
      const spotL = new THREE.SpotLight(0xfffaed, 2.0, 26, Math.PI / 6, 0.4);
      spotL.position.set(-0.85, 0.8, 2.3);
      spotL.target.position.set(-0.85, 0, 18);
      spotL.visible = isNightModeRef.current;
      group.add(spotL);
      group.add(spotL.target);
      headlights.push(spotL);

      const spotR = new THREE.SpotLight(0xfffaed, 2.0, 26, Math.PI / 6, 0.4);
      spotR.position.set(0.85, 0.8, 2.3);
      spotR.target.position.set(0.85, 0, 18);
      spotR.visible = isNightModeRef.current;
      group.add(spotR);
      group.add(spotR.target);
      headlights.push(spotR);

      // Rear Red Brake Taillights
      const brakeMat = new THREE.MeshStandardMaterial({
        color: 0x220505,
        emissive: 0xef4444,
        emissiveIntensity: 0.4,
      });

      const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), brakeMat);
      tlLeft.position.set(-0.85, 0.8, -2.3);
      const tlRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), brakeMat);
      tlRight.position.set(0.85, 0.8, -2.3);
      group.add(tlLeft, tlRight);
      brakeLights.push(tlLeft, tlRight);

      return {
        id: '',
        group,
        type,
        wheels,
        beaconMesh,
        beaconLight,
        brakeLights,
        headlights,
      };
    };

    // 7. Cinematic Camera & Orbit Nav
    let isMouseDown = false;
    let prevMousePos = { x: 0, y: 0 };
    const camState = cameraStateRef.current;

    const applyCameraPosition = () => {
      const preset = cameraPresetRef.current;
      if (preset === 'DRONE') {
        camera.fov = 45;
        camera.updateProjectionMatrix();
        camera.position.x =
          camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta);
        camera.position.y = camState.radius * Math.cos(camState.phi);
        camera.position.z =
          camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta);
        camera.lookAt(0, 1.5, 0);
      } else if (preset === 'CCTV') {
        camera.fov = camState.cctvFov;
        camera.updateProjectionMatrix();
        camera.position.set(-20, 24, -20);
        camera.lookAt(2, 0, 2);
      } else if (preset === 'DRIVER') {
        camera.fov = camState.driverFov;
        camera.updateProjectionMatrix();
        camera.position.set(-4.5, 2.2, -26);
        camera.lookAt(-4.5, 1.8, 15);
      } else {
        // TOP_DOWN
        camera.fov = 45;
        camera.updateProjectionMatrix();
        camera.position.set(0, camState.topDownY, 0.1);
        camera.lookAt(0, 0, 0);
      }
    };

    updateCameraFnRef.current = applyCameraPosition;
    applyCameraPosition();

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || cameraPresetRef.current !== 'DRONE') return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      camState.theta -= deltaX * 0.006;
      camState.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.08, camState.phi - deltaY * 0.006));

      applyCameraPosition();
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (cameraPresetRef.current === 'DRONE') {
        camState.radius = Math.max(20, Math.min(140, camState.radius + e.deltaY * 0.05));
      } else if (cameraPresetRef.current === 'TOP_DOWN') {
        camState.topDownY = Math.max(25, Math.min(180, camState.topDownY + e.deltaY * 0.08));
      } else if (cameraPresetRef.current === 'CCTV') {
        camState.cctvFov = Math.max(25, Math.min(75, camState.cctvFov + e.deltaY * 0.04));
      } else {
        camState.driverFov = Math.max(30, Math.min(85, camState.driverFov + e.deltaY * 0.04));
      }
      applyCameraPosition();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: true });

    // 8. 60 FPS Render & Synchronization Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Read current signals directly from engine or state
      const currentSignals =
        engineRef.current?.getSignals() ||
        stateRef.current?.signals || {
          NORTH: 'RED',
          SOUTH: 'RED',
          EAST: 'RED',
          WEST: 'RED',
        };

      // 1. Update Mast Gantries Lamps
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

      // 2. Synchronize 3D Vehicle Fleet with Engine
      const simVehicles = engineRef.current ? engineRef.current.getVehicles() : [];
      const activeIds = new Set<string>();

      // 2D to 3D coordinate transformation:
      // In 2D: Canvas is 640x640, center is (320, 320), road width is 160px.
      // In 3D: World center is (0, 0, 0), road width is 18 units.
      // scale = 18 / 160 = 0.1125
      const coordScale = 0.1125;

      simVehicles.forEach((sv) => {
        activeIds.add(sv.id);

        let rec = vehiclePool.get(sv.id);
        if (!rec) {
          let colorHex = 0x2563eb;
          if (sv.color && sv.color.startsWith('#')) {
            colorHex = parseInt(sv.color.replace('#', '0x'), 16) || colorHex;
          }

          rec = build3DVehicle(sv.type, colorHex, Boolean(sv.isEmergency));
          rec.id = sv.id;
          scene.add(rec.group);
          vehiclePool.set(sv.id, rec);
        }

        // Compute 3D Position & Heading
        const x3d = (sv.x - 320) * coordScale;
        const z3d = (sv.y - 320) * coordScale;

        rec.group.position.set(x3d, 0, z3d);
        rec.group.rotation.y = -sv.angle + Math.PI / 2;

        // Spin Wheels
        const rotDelta = (sv.speed || 0) * 0.8;
        rec.wheels.forEach((w) => {
          w.rotation.x += rotDelta;
        });

        // Toggle Headlights based on Night Mode
        rec.headlights.forEach((hl) => {
          hl.visible = isNightModeRef.current;
        });

        // Flashing Emergency Beacon Lightbar
        if (
          (sv.isEmergency || sv.type === 'AMBULANCE' || sv.type === 'FIRE_TRUCK') &&
          rec.beaconMesh &&
          rec.beaconLight
        ) {
          const isBlue = Math.sin(time * 16) > 0;
          (rec.beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(
            isBlue ? 0x38bdf8 : 0xef4444
          );
          rec.beaconLight.color.setHex(isBlue ? 0x38bdf8 : 0xef4444);
          rec.beaconLight.intensity = 4.0 + Math.sin(time * 20) * 1.5;
        }

        // Brake Taillights
        const isBraking = sv.speed < 0.25 || sv.state === 'WAITING';
        rec.brakeLights.forEach((bl) => {
          (bl.material as THREE.MeshStandardMaterial).emissiveIntensity = isBraking ? 2.5 : 0.35;
        });
      });

      // Remove vehicles that exited or were removed by Reset
      vehiclePool.forEach((rec, id) => {
        if (!activeIds.has(id)) {
          scene.remove(rec.group);
          vehiclePool.delete(id);
        }
      });

      // Update camera in preset mode
      applyCameraPosition();

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
  }, []); // Run ONCE on mount, animate loop reads from engineRef!

  // Camera preset selector
  const handleSelectPreset = (preset: CameraViewPreset) => {
    soundEffects.playClick();
    setCameraPreset(preset);
    cameraPresetRef.current = preset;
    updateCameraFnRef.current();
  };

  // Zoom In Handler
  const handleZoomIn = () => {
    soundEffects.playClick();
    const camState = cameraStateRef.current;
    if (cameraPreset === 'DRONE') {
      camState.radius = Math.max(18, camState.radius - 12);
    } else if (cameraPreset === 'TOP_DOWN') {
      camState.topDownY = Math.max(25, camState.topDownY - 14);
    } else if (cameraPreset === 'CCTV') {
      camState.cctvFov = Math.max(25, camState.cctvFov - 6);
    } else {
      camState.driverFov = Math.max(30, camState.driverFov - 6);
    }
    updateCameraFnRef.current();
  };

  // Zoom Out Handler
  const handleZoomOut = () => {
    soundEffects.playClick();
    const camState = cameraStateRef.current;
    if (cameraPreset === 'DRONE') {
      camState.radius = Math.min(140, camState.radius + 12);
    } else if (cameraPreset === 'TOP_DOWN') {
      camState.topDownY = Math.min(180, camState.topDownY + 14);
    } else if (cameraPreset === 'CCTV') {
      camState.cctvFov = Math.min(75, camState.cctvFov + 6);
    } else {
      camState.driverFov = Math.min(85, camState.driverFov + 6);
    }
    updateCameraFnRef.current();
  };

  // Reset Camera View
  const handleResetCamera = () => {
    soundEffects.playClick();
    const camState = cameraStateRef.current;
    camState.radius = 72;
    camState.theta = Math.PI / 4;
    camState.phi = Math.PI / 3;
    camState.topDownY = 85;
    camState.cctvFov = 45;
    camState.driverFov = 48;
    setCameraPreset('DRONE');
    cameraPresetRef.current = 'DRONE';
    updateCameraFnRef.current();
  };

  const handleApproachSwitch = (dir: Direction) => {
    soundEffects.playClick();
    setActiveRoad(dir);
    if (onTriggerGreen) onTriggerGreen(dir);
    if (engine) engine.setManualDirection(dir);
  };

  const handleToggleNight = () => {
    soundEffects.playClick();
    setIsNightMode((prev) => !prev);
  };

  const emergencyAlert = state?.activeEmergencyMessage || engine?.getEmergencyMessage();

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl flex flex-col font-mono select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full aspect-[16/10] sm:aspect-[16/9] min-h-[420px] block cursor-grab active:cursor-grabbing"
      />

      {/* Top Refined OSD Control Bar */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none flex-wrap">
        {/* Status OSD Pill */}
        <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-white flex items-center gap-2 pointer-events-auto shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-cyan-300">3D DIGITAL TWIN</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 uppercase">{activeRoad} GREEN ACTIVE</span>
        </div>

        {/* Camera Preset Selector, Zoom Options & Day/Night Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
          {/* Camera Presets */}
          <button
            onClick={() => handleSelectPreset('DRONE')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'DRONE'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Free 360° Drone Orbit Inspection (Click & drag to rotate)"
          >
            Drone 360°
          </button>

          <button
            onClick={() => handleSelectPreset('CCTV')}
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
            onClick={() => handleSelectPreset('DRIVER')}
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
            onClick={() => handleSelectPreset('TOP_DOWN')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'TOP_DOWN'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Top-Down Orthographic Blueprint"
          >
            Top-Down
          </button>

          {/* Vertical Separator */}
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

          {/* Dedicated Zoom Options */}
          <button
            onClick={handleZoomIn}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom Out (−)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Vertical Separator */}
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

          {/* Dynamic Day / Night Theme Toggle */}
          <button
            onClick={handleToggleNight}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isNightMode
                ? 'hover:bg-slate-800 text-amber-400'
                : 'hover:bg-slate-800 text-cyan-300'
            }`}
            title={isNightMode ? 'Switch to Sunny Daylight Mode' : 'Switch to Cyberpunk Night Mode'}
          >
            {isNightMode ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Emergency Active Alert Badge Overlay in 3D */}
      {emergencyAlert && (
        <div className="absolute top-14 left-4 right-4 bg-red-950/90 border border-red-500/80 text-red-200 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold animate-pulse shadow-2xl pointer-events-none">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{emergencyAlert}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] uppercase font-black">
            3D PRE-EMPTION
          </span>
        </div>
      )}

      {/* CCTV Camera HUD Scanline Overlay (Active in CCTV Mode) */}
      {cameraPreset === 'CCTV' && !emergencyAlert && (
        <div className="absolute top-14 left-4 font-mono text-[10px] text-emerald-400 pointer-events-none bg-black/60 px-2.5 py-1.5 rounded-lg border border-emerald-500/30">
          <div>● CAM-04 [JUNCTION NORTH-WEST] • 4K 60FPS • REC</div>
          <div className="text-slate-400 text-[9px] mt-0.5">
            OPTICAL OBJECT DETECTION &amp; RADAR: SYNCHRONIZED
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
            const isCurrent = activeRoad === dir;
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
