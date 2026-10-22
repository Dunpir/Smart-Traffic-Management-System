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
  User,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Radio,
  Gamepad2,
  Volume2,
} from 'lucide-react';
import { Direction, LightState } from '../../types';
import { SimVehicle, SimVehicleType, SimulationTelemetryState } from '../../types/simulation';
import { TrafficSimulationEngine } from '../../utils/simulationEngine';
import { soundEffects } from '../../utils/soundEffects';
import {
  playPedestrianWalkChirp,
  playPedestrianButtonChime,
  playCarHorn,
} from '../../utils/audioBeep';

interface ThreeIntersectionViewerProps {
  engine?: TrafficSimulationEngine;
  state?: SimulationTelemetryState;
  telemetry?: any;
  onTriggerGreen?: (direction: Direction) => void;
}

type CameraViewPreset = 'DRONE' | 'CCTV' | 'DRIVER' | 'TOP_DOWN' | 'PEDESTRIAN';

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

  // Pedestrian Mode Interactive States
  const [isThirdPerson, setIsThirdPerson] = useState<boolean>(false);
  const isThirdPersonRef = useRef<boolean>(isThirdPerson);
  isThirdPersonRef.current = isThirdPerson;

  const [isNearButton, setIsNearButton] = useState<boolean>(false);
  const isNearButtonRef = useRef<boolean>(false);

  const [pedestrianSafetyStatus, setPedestrianSafetyStatus] = useState<
    'SIDEWALK' | 'SAFE_CROSSING' | 'JAYWALK' | 'DANGER'
  >('SIDEWALK');

  const [complianceScore, setComplianceScore] = useState<number>(100);
  const [crossingsCompleted, setCrossingsCompleted] = useState<number>(0);
  const [nearMissAlert, setNearMissAlert] = useState<string | null>(null);
  const [pedSuccessToast, setPedSuccessToast] = useState<string | null>(null);

  // Pedestrian Position & Kinematics Refs (starts at North-West sidewalk curb)
  const pedPosRef = useRef(new THREE.Vector3(-11.5, 0.35, -11.5));
  const pedYawRef = useRef<number>(Math.PI / 4);
  const pedPitchRef = useRef<number>(0);
  const pedWalkCycleRef = useRef<number>(0);
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const lastHonkTimeRef = useRef<number>(0);
  const lastChirpTimeRef = useRef<number>(0);
  const crossingInProgressRef = useRef<boolean>(false);


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

    // 5.5. Interactive Pelican Push-Button Call Boxes (PAB) on 4 Crosswalk Corners
    interface PelicanPoleRecord {
      pos: THREE.Vector3;
      lampMat: THREE.MeshStandardMaterial;
      pLight: THREE.PointLight;
    }
    const pelicanPoles: PelicanPoleRecord[] = [];

    const createPelicanPole = (x: number, z: number, rotationY: number): PelicanPoleRecord => {
      const bGroup = new THREE.Group();
      bGroup.position.set(x, 0, z);
      bGroup.rotation.y = rotationY;

      // Dark metallic pole
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.7,
        roughness: 0.3,
      });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 1.45, 12), poleMat);
      pole.position.y = 0.725;
      pole.castShadow = true;
      bGroup.add(pole);

      // Pelican Yellow Housing Box
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.4,
        metalness: 0.2,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.22), boxMat);
      box.position.set(0, 1.1, 0.08);
      box.castShadow = true;
      bGroup.add(box);

      // Front dark plate
      const faceMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const face = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 0.02), faceMat);
      face.position.set(0, 1.1, 0.195);
      bGroup.add(face);

      // Push Button
      const btnMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.1,
      });
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), btnMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 0.98, 0.215);
      bGroup.add(btn);

      // Walk/Wait Signal Indicator Lens
      const lampMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 1.2,
      });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.03), lampMat);
      lamp.position.set(0, 1.22, 0.21);
      bGroup.add(lamp);

      // Pulsing illumination light
      const pLight = new THREE.PointLight(0xef4444, 1.5, 5);
      pLight.position.set(0, 1.25, 0.35);
      bGroup.add(pLight);

      scene.add(bGroup);

      const rec: PelicanPoleRecord = {
        pos: new THREE.Vector3(x, 0, z),
        lampMat,
        pLight,
      };
      pelicanPoles.push(rec);
      return rec;
    };

    createPelicanPole(-10.2, -10.2, Math.PI / 4);
    createPelicanPole(10.2, -10.2, -Math.PI / 4);
    createPelicanPole(-10.2, 10.2, (3 * Math.PI) / 4);
    createPelicanPole(10.2, 10.2, -(3 * Math.PI) / 4);

    // 5.6. Animated 3D Pedestrian Character Model
    const buildPedestrianCharacter = () => {
      const group = new THREE.Group();

      const hipGroup = new THREE.Group();
      hipGroup.position.y = 0.85;
      group.add(hipGroup);

      // Torso
      const torsoMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Cool cyan jacket
        roughness: 0.4,
        metalness: 0.1,
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), torsoMat);
      torso.position.y = 0.32;
      torso.castShadow = true;
      hipGroup.add(torso);

      // Head
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.6 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
      head.position.y = 0.8;
      head.castShadow = true;
      hipGroup.add(head);

      // Cap
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.3), hairMat);
      cap.position.set(0, 0.92, 0.04);
      hipGroup.add(cap);

      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
      const legGeo = new THREE.BoxGeometry(0.18, 0.75, 0.2);

      const leftLegPivot = new THREE.Group();
      leftLegPivot.position.set(-0.14, 0, 0);
      const leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.y = -0.375;
      leftLeg.castShadow = true;
      leftLegPivot.add(leftLeg);
      hipGroup.add(leftLegPivot);

      const rightLegPivot = new THREE.Group();
      rightLegPivot.position.set(0.14, 0, 0);
      const rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.y = -0.375;
      rightLeg.castShadow = true;
      rightLegPivot.add(rightLeg);
      hipGroup.add(rightLegPivot);

      // Arms
      const armMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.5 });
      const armGeo = new THREE.BoxGeometry(0.14, 0.6, 0.16);

      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.35, 0.58, 0);
      const leftArm = new THREE.Mesh(armGeo, armMat);
      leftArm.position.y = -0.3;
      leftArm.castShadow = true;
      leftArmPivot.add(leftArm);
      hipGroup.add(leftArmPivot);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.35, 0.58, 0);
      const rightArm = new THREE.Mesh(armGeo, armMat);
      rightArm.position.y = -0.3;
      rightArm.castShadow = true;
      rightArmPivot.add(rightArm);
      hipGroup.add(rightArmPivot);

      return {
        group,
        leftLegPivot,
        rightLegPivot,
        leftArmPivot,
        rightArmPivot,
      };
    };

    const pedChar = buildPedestrianCharacter();
    pedChar.group.position.copy(pedPosRef.current);
    scene.add(pedChar.group);

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
      } else if (preset === 'PEDESTRIAN') {
        const px = pedPosRef.current.x;
        const py = pedPosRef.current.y;
        const pz = pedPosRef.current.z;
        const yaw = pedYawRef.current;
        const pitch = pedPitchRef.current;

        if (!isThirdPersonRef.current) {
          // First-Person Perspective (FPP): Eye level ~ 1.65m with subtle walking head bob
          const headBob = Math.sin(pedWalkCycleRef.current * 2) * 0.035;
          const eyeY = py + 1.65 + headBob;
          camera.fov = 68;
          camera.updateProjectionMatrix();
          camera.position.set(px, eyeY, pz);

          const lookDist = 15;
          const targetX = px + Math.sin(yaw) * Math.cos(pitch) * lookDist;
          const targetY = eyeY + Math.sin(pitch) * lookDist;
          const targetZ = pz + Math.cos(yaw) * Math.cos(pitch) * lookDist;
          camera.lookAt(targetX, targetY, targetZ);
        } else {
          // Third-Person Perspective (TPP): Over-The-Shoulder Camera
          camera.fov = 60;
          camera.updateProjectionMatrix();
          const dist = 3.2;
          const shoulder = 0.55;
          const camX = px - Math.sin(yaw) * dist + Math.cos(yaw) * shoulder;
          const camY = py + 2.0;
          const camZ = pz - Math.cos(yaw) * dist - Math.sin(yaw) * shoulder;
          camera.position.set(camX, camY, camZ);

          const lookTarget = new THREE.Vector3(
            px + Math.sin(yaw) * 2,
            py + 1.45,
            pz + Math.cos(yaw) * 2
          );
          camera.lookAt(lookTarget);
        }
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
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      if (cameraPresetRef.current === 'DRONE') {
        camState.theta -= deltaX * 0.006;
        camState.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.08, camState.phi - deltaY * 0.006));
        applyCameraPosition();
      } else if (cameraPresetRef.current === 'PEDESTRIAN') {
        pedYawRef.current -= deltaX * 0.006;
        pedPitchRef.current = Math.max(-0.6, Math.min(0.6, pedPitchRef.current - deltaY * 0.005));
        applyCameraPosition();
      }

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

    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressedRef.current[e.code] = true;

      if (cameraPresetRef.current === 'PEDESTRIAN') {
        if (e.code === 'KeyV') {
          soundEffects.playClick();
          setIsThirdPerson((prev) => !prev);
        } else if (e.code === 'KeyE' || e.code === 'Space') {
          if (isNearButtonRef.current) {
            soundEffects.playClick();
            playPedestrianButtonChime();
            engineRef.current?.triggerPedestrianCall();
          }
        } else if (e.code === 'KeyR') {
          soundEffects.playClick();
          pedPosRef.current.set(-11.5, 0.35, -11.5);
          pedYawRef.current = Math.PI / 4;
          pedPitchRef.current = 0;
          applyCameraPosition();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

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

      // 3. Synchronize Pedestrian Kinematics & Interactive Safety
      const keys = keysPressedRef.current;
      const isPedMode = cameraPresetRef.current === 'PEDESTRIAN';

      if (isPedMode) {
        if (keys['KeyQ'] || keys['ArrowLeft']) pedYawRef.current += 2.2 * delta;
        if (keys['ArrowRight']) pedYawRef.current -= 2.2 * delta;
      }

      let moveX = 0;
      let moveZ = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveZ += 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveZ -= 1;
      if (keys['KeyD']) moveX += 1;
      if (keys['KeyA']) moveX -= 1;

      const isWalking = moveX !== 0 || moveZ !== 0;
      if (isWalking && isPedMode) {
        const isSprint = Boolean(keys['ShiftLeft'] || keys['ShiftRight']);
        const walkSpeed = (isSprint ? 7.8 : 4.4) * delta;

        const forwardX = Math.sin(pedYawRef.current);
        const forwardZ = Math.cos(pedYawRef.current);
        const rightX = Math.cos(pedYawRef.current);
        const rightZ = -Math.sin(pedYawRef.current);

        const dirX = forwardX * moveZ + rightX * moveX;
        const dirZ = forwardZ * moveZ + rightZ * moveX;
        const len = Math.hypot(dirX, dirZ);

        if (len > 0.001) {
          pedPosRef.current.x += (dirX / len) * walkSpeed;
          pedPosRef.current.z += (dirZ / len) * walkSpeed;
        }

        // Clamp to city sidewalk boundaries
        pedPosRef.current.x = Math.max(-36, Math.min(36, pedPosRef.current.x));
        pedPosRef.current.z = Math.max(-36, Math.min(36, pedPosRef.current.z));

        pedWalkCycleRef.current += (isSprint ? 14 : 9) * delta;
      }

      // Smooth elevation transition (sidewalk vs road)
      const px = pedPosRef.current.x;
      const pz = pedPosRef.current.z;
      const onSidewalk = Math.abs(px) >= 9.2 && Math.abs(pz) >= 9.2;
      const targetY = onSidewalk ? 0.35 : 0.06;
      pedPosRef.current.y += (targetY - pedPosRef.current.y) * 0.2;

      // Update character mesh transform
      pedChar.group.position.set(px, pedPosRef.current.y, pz);
      pedChar.group.rotation.y = pedYawRef.current;

      // Character limb animation
      if (isWalking && isPedMode) {
        const legAngle = Math.sin(pedWalkCycleRef.current) * 0.55;
        const armAngle = Math.sin(pedWalkCycleRef.current) * 0.45;
        pedChar.leftLegPivot.rotation.x = legAngle;
        pedChar.rightLegPivot.rotation.x = -legAngle;
        pedChar.leftArmPivot.rotation.x = -armAngle;
        pedChar.rightArmPivot.rotation.x = armAngle;
      } else {
        pedChar.leftLegPivot.rotation.x *= 0.85;
        pedChar.rightLegPivot.rotation.x *= 0.85;
        pedChar.leftArmPivot.rotation.x *= 0.85;
        pedChar.rightArmPivot.rotation.x *= 0.85;
      }

      // Toggle character mesh visibility in FPP vs TPP / presets
      if (isPedMode && !isThirdPersonRef.current) {
        pedChar.group.visible = false;
      } else {
        pedChar.group.visible = true;
      }

      // Proximity check to Pelican push-button poles
      let minBtnDist = 999;
      pelicanPoles.forEach((pole) => {
        const d = pedPosRef.current.distanceTo(pole.pos);
        if (d < minBtnDist) minBtnDist = d;
      });
      const nearButton = minBtnDist < 3.2;
      if (nearButton !== isNearButtonRef.current) {
        isNearButtonRef.current = nearButton;
        setIsNearButton(nearButton);
      }

      // Update Pelican pole light indicators
      const isPedActive = engineRef.current ? engineRef.current.isPedestrianActive() : false;
      pelicanPoles.forEach((pole) => {
        if (isPedActive) {
          pole.lampMat.emissive.setHex(0x10b981);
          pole.lampMat.emissiveIntensity = 2.8;
          pole.pLight.color.setHex(0x10b981);
          pole.pLight.intensity = 2.5;
        } else {
          pole.lampMat.emissive.setHex(0xef4444);
          pole.lampMat.emissiveIntensity = 1.2;
          pole.pLight.color.setHex(0xef4444);
          pole.pLight.intensity = 1.0;
        }
      });

      // Acoustic Chirps during active pedestrian walk phase
      if (isPedActive && isPedMode) {
        if (time - lastChirpTimeRef.current > 0.85) {
          lastChirpTimeRef.current = time;
          playPedestrianWalkChirp();
        }
      }

      // Crosswalk Safety & Jaywalking Assessment
      const onRoadway = Math.abs(px) < 9.0 || Math.abs(pz) < 9.0;
      if (onSidewalk) {
        setPedestrianSafetyStatus('SIDEWALK');
        setNearMissAlert(null);
        if (crossingInProgressRef.current) {
          crossingInProgressRef.current = false;
          setCrossingsCompleted((c) => c + 1);
          setComplianceScore((s) => Math.min(100, Math.round(s + 10)));
          soundEffects.playSuccess();
          setPedSuccessToast('Safe Crosswalk Traversal Completed! (+10 Compliance)');
          setTimeout(() => setPedSuccessToast(null), 3500);
        }
      } else if (onRoadway) {
        if (!crossingInProgressRef.current) {
          crossingInProgressRef.current = true;
        }

        if (isPedActive) {
          setPedestrianSafetyStatus('SAFE_CROSSING');
          setNearMissAlert(null);
        } else {
          let closestDist = 999;
          simVehicles.forEach((sv) => {
            const vx = (sv.x - 320) * coordScale;
            const vz = (sv.y - 320) * coordScale;
            const dist = Math.hypot(px - vx, pz - vz);
            if (dist < closestDist) closestDist = dist;
          });

          if (closestDist < 14) {
            setPedestrianSafetyStatus('DANGER');
            setNearMissAlert(`⚠️ CRITICAL HAZARD: ONCOMING VEHICLE AT ${(closestDist * 1.8).toFixed(1)}m!`);
            if (time - lastHonkTimeRef.current > 2.2) {
              lastHonkTimeRef.current = time;
              playCarHorn();
            }
            setComplianceScore((s) => Math.max(30, s - 0.05));
          } else {
            setPedestrianSafetyStatus('JAYWALK');
            setNearMissAlert('⚠️ JAYWALKING WARNING: TRAFFIC SIGNAL NOT ACTUATED');
          }
        }
      }

      // Update camera in preset mode
      applyCameraPosition();

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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

    if (cameraPreset === 'PEDESTRIAN') {
      pedPosRef.current.set(-11.5, 0.35, -11.5);
      pedYawRef.current = Math.PI / 4;
      pedPitchRef.current = 0;
    } else {
      setCameraPreset('DRONE');
      cameraPresetRef.current = 'DRONE';
    }
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

  const handleTriggerPedestrianCall = () => {
    soundEffects.playClick();
    playPedestrianButtonChime();
    if (engineRef.current) {
      engineRef.current.triggerPedestrianCall();
    }
  };

  const handleTogglePerspective = () => {
    soundEffects.playClick();
    setIsThirdPerson((prev) => !prev);
  };

  const handleResetPedestrian = () => {
    soundEffects.playClick();
    pedPosRef.current.set(-11.5, 0.35, -11.5);
    pedYawRef.current = Math.PI / 4;
    pedPitchRef.current = 0;
    updateCameraFnRef.current();
  };

  const handleVirtualMovement = (code: string, isDown: boolean) => {
    keysPressedRef.current[code] = isDown;
  };

  const emergencyAlert = state?.activeEmergencyMessage || engine?.getEmergencyMessage();
  const pedTimerDisplay = Math.ceil(
    engine?.getPedestrianTimer() || state?.pedestrianTimeRemaining || 0
  );

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl flex flex-col font-mono select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full aspect-[16/10] sm:aspect-[16/9] min-h-[420px] block cursor-grab active:cursor-grabbing"
      />

      {/* Top Refined OSD Control Bar */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none flex-wrap z-10">
        {/* Status OSD Pill */}
        <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-white flex items-center gap-2 pointer-events-auto shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-cyan-300">
            {cameraPreset === 'PEDESTRIAN'
              ? isThirdPerson
                ? 'PEDESTRIAN TPP'
                : 'PEDESTRIAN FPP'
              : '3D DIGITAL TWIN'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 uppercase">
            {cameraPreset === 'PEDESTRIAN'
              ? pedestrianSafetyStatus === 'SAFE_CROSSING'
                ? `WALK SIGN ACTIVE (${pedTimerDisplay}s)`
                : activeRoad + ' GREEN'
              : `${activeRoad} GREEN ACTIVE`}
          </span>
        </div>

        {/* Camera Preset Selector, Zoom Options & Day/Night Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl flex-wrap">
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

          {/* Pedestrian FPP Preset */}
          <button
            onClick={() => handleSelectPreset('PEDESTRIAN')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
              cameraPreset === 'PEDESTRIAN'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-cyan-400 hover:text-white bg-cyan-950/40 border border-cyan-800/40'
            }`}
            title="First-Person Pedestrian View (WASD Walk, Interactive Crosswalk Pelican Button)"
          >
            <User className="w-3.5 h-3.5" />
            <span>Pedestrian FPP</span>
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
            title="Reset Camera View / Reset Pedestrian"
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

      {/* FPP Eye Crosshair Overlay */}
      {cameraPreset === 'PEDESTRIAN' && !isThirdPerson && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400/80 bg-cyan-400/40 shadow-[0_0_10px_#38bdf8]" />
        </div>
      )}

      {/* Floating Interactive Pelican Call Button Banner */}
      {cameraPreset === 'PEDESTRIAN' && isNearButton && (
        <div
          onClick={handleTriggerPedestrianCall}
          className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-2.5 cursor-pointer border-2 border-white animate-bounce pointer-events-auto transition-transform z-20"
          title="Push to request protected pedestrian walk phase"
        >
          <Radio className="w-4 h-4 animate-spin text-amber-950" />
          <span>[PRESS E OR CLICK] PUSH BUTTON TO REQUEST CROSSING</span>
        </div>
      )}

      {/* Pedestrian Live Safety HUD Status Overlay */}
      {cameraPreset === 'PEDESTRIAN' && (
        <div className="absolute top-14 left-3.5 flex flex-col gap-1.5 pointer-events-none z-10">
          {pedestrianSafetyStatus === 'SAFE_CROSSING' && (
            <div className="bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-xl flex items-center gap-2 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>
                🚶 PROTECTED CROSSWALK ACTIVE • SAFE TO CROSS ({pedTimerDisplay}s)
              </span>
            </div>
          )}

          {pedestrianSafetyStatus === 'SIDEWALK' && (
            <div className="bg-slate-900/90 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-md flex items-center gap-2 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>ON SIDEWALK • SAFE PEDESTRIAN ZONE</span>
            </div>
          )}

          {pedestrianSafetyStatus === 'JAYWALK' && (
            <div className="bg-amber-950/95 border border-amber-500/80 text-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-xl flex items-center gap-2 backdrop-blur-md animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>⚠️ JAYWALKING WARNING • CROSSING WITHOUT WALK SIGNAL</span>
            </div>
          )}

          {pedestrianSafetyStatus === 'DANGER' && (
            <div className="bg-red-950/95 border border-red-500 text-red-100 px-3 py-1.5 rounded-xl text-[11px] font-black shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{nearMissAlert || '🚨 DANGER: ONCOMING TRAFFIC HAZARD!'}</span>
            </div>
          )}
        </div>
      )}

      {/* Safe Crossing Completed Success Banner */}
      {pedSuccessToast && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-emerald-600 border border-emerald-300 text-white px-4 py-2 rounded-xl text-xs font-black shadow-2xl animate-fadeIn flex items-center gap-2 pointer-events-none z-20">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{pedSuccessToast}</span>
        </div>
      )}

      {/* Emergency Active Alert Badge Overlay in 3D */}
      {emergencyAlert && (
        <div className="absolute top-14 left-4 right-4 bg-red-950/90 border border-red-500/80 text-red-200 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold animate-pulse shadow-2xl pointer-events-none z-10">
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

      {/* Dynamic Bottom Deck: Pedestrian Mode Controls vs Traffic Approach Phases */}
      {cameraPreset === 'PEDESTRIAN' ? (
        <div className="p-2.5 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Left: Pedestrian Safety Stats & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">Safety:</span>
              <span
                className={`font-bold ${
                  complianceScore >= 80
                    ? 'text-emerald-400'
                    : complianceScore >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {Math.round(complianceScore)}%
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Crossings:</span>
              <span className="text-cyan-300 font-bold">{crossingsCompleted}</span>
            </div>

            <button
              onClick={handleTogglePerspective}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer text-[11px] transition"
              title="Toggle between First-Person (FPP) and Third-Person (TPP) over-the-shoulder view"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isThirdPerson ? '3rd-Person' : '1st-Person'} [V]</span>
            </button>

            <button
              onClick={handleResetPedestrian}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold border border-slate-700 flex items-center gap-1 cursor-pointer text-[11px] transition"
              title="Reset pedestrian back to sidewalk curb"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset [R]</span>
            </button>

            <button
              onClick={handleTriggerPedestrianCall}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50 flex items-center gap-1.5 cursor-pointer text-[11px] transition"
              title="Push the Pelican crosswalk button to request green walk signal"
            >
              <Radio className="w-3 h-3 text-amber-400" />
              <span>Call Button [E]</span>
            </button>
          </div>

          {/* Center: Controls Keyboard Guide */}
          <div className="hidden xl:flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-bold">W,A,S,D:</span>
            <span>Walk</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-bold">Shift:</span>
            <span>Sprint</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-bold">Mouse Drag:</span>
            <span>Look</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-bold">E / Space:</span>
            <span>Push Button</span>
          </div>

          {/* Right: Virtual D-Pad for Mouse / Touch interaction */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
            <button
              onMouseDown={() => handleVirtualMovement('KeyA', true)}
              onMouseUp={() => handleVirtualMovement('KeyA', false)}
              onMouseLeave={() => handleVirtualMovement('KeyA', false)}
              onTouchStart={() => handleVirtualMovement('KeyA', true)}
              onTouchEnd={() => handleVirtualMovement('KeyA', false)}
              className="w-6 h-6 rounded bg-slate-800 active:bg-cyan-500 active:text-black text-slate-300 font-bold flex items-center justify-center text-[10px] cursor-pointer"
              title="Move Left (A)"
            >
              A
            </button>
            <div className="flex flex-col gap-0.5">
              <button
                onMouseDown={() => handleVirtualMovement('KeyW', true)}
                onMouseUp={() => handleVirtualMovement('KeyW', false)}
                onMouseLeave={() => handleVirtualMovement('KeyW', false)}
                onTouchStart={() => handleVirtualMovement('KeyW', true)}
                onTouchEnd={() => handleVirtualMovement('KeyW', false)}
                className="w-6 h-5 rounded bg-slate-800 active:bg-cyan-500 active:text-black text-slate-300 font-bold flex items-center justify-center text-[10px] cursor-pointer"
                title="Move Forward (W)"
              >
                W
              </button>
              <button
                onMouseDown={() => handleVirtualMovement('KeyS', true)}
                onMouseUp={() => handleVirtualMovement('KeyS', false)}
                onMouseLeave={() => handleVirtualMovement('KeyS', false)}
                onTouchStart={() => handleVirtualMovement('KeyS', true)}
                onTouchEnd={() => handleVirtualMovement('KeyS', false)}
                className="w-6 h-5 rounded bg-slate-800 active:bg-cyan-500 active:text-black text-slate-300 font-bold flex items-center justify-center text-[10px] cursor-pointer"
                title="Move Backward (S)"
              >
                S
              </button>
            </div>
            <button
              onMouseDown={() => handleVirtualMovement('KeyD', true)}
              onMouseUp={() => handleVirtualMovement('KeyD', false)}
              onMouseLeave={() => handleVirtualMovement('KeyD', false)}
              onTouchStart={() => handleVirtualMovement('KeyD', true)}
              onTouchEnd={() => handleVirtualMovement('KeyD', false)}
              className="w-6 h-6 rounded bg-slate-800 active:bg-cyan-500 active:text-black text-slate-300 font-bold flex items-center justify-center text-[10px] cursor-pointer"
              title="Move Right (D)"
            >
              D
            </button>
          </div>
        </div>
      ) : (
        /* Standard Approach Phase Selection Bar */
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
      )}
    </div>
  );
};

