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
  Minimize2,
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
  Compass,
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

import { buildHighDetail3DVehicle, Vehicle3DRecord } from './threeVehicleFactory';
import {
  buildArchitecturalSkyscrapers,
  buildRealisticTrees,
  buildRoadwayMarkingsAndHardware,
  buildStreetFurniture,
} from './urbanSceneryFactory';

type CameraViewPreset = 'DRONE' | 'CCTV' | 'DRIVER' | 'TOP_DOWN' | 'PEDESTRIAN';

export const ThreeIntersectionViewer: React.FC<ThreeIntersectionViewerProps> = ({
  engine,
  state,
  telemetry,
  onTriggerGreen,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const isFullscreenRef = useRef<boolean>(false);
  const toggleFullscreenFnRef = useRef<() => void>(() => {});
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>('PEDESTRIAN');
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
  const [currentHeading, setCurrentHeading] = useState<{ label: string; arrow: string; deg: number }>({
    label: 'NORTH-EAST',
    arrow: '↗',
    deg: 45,
  });

  // Pedestrian Position & Kinematics Refs (starts at North-West sidewalk curb)
  const pedPosRef = useRef(new THREE.Vector3(-11.5, 0.35, -11.5));
  const pedYawRef = useRef<number>(Math.PI / 4);
  const pedPitchRef = useRef<number>(0);
  const pedWalkCycleRef = useRef<number>(0);
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const lastHonkTimeRef = useRef<number>(0);
  const lastChirpTimeRef = useRef<number>(0);
  const crossingInProgressRef = useRef<boolean>(false);
  const pedSafetyStatusRef = useRef<'SIDEWALK' | 'SAFE_CROSSING' | 'JAYWALK' | 'DANGER'>('SIDEWALK');
  const nearMissAlertRef = useRef<string | null>(null);


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
  const streetlightsRef = useRef<THREE.SpotLight[]>([]);
  const aviationBeaconsRef = useRef<THREE.PointLight[]>([]);
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
    if (engine) {
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

    streetlightsRef.current.forEach((sl) => {
      sl.intensity = isNightMode ? 3.5 : 0.0;
    });

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

    // Dynamic Viewport ResizeObserver (adapts smoothly to Fullscreen toggles & window resizes)
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

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

    // Stop Line Bars (Placed safely ahead of crosswalks at 14.0m)
    const stopBarGeo = new THREE.PlaneGeometry(roadWidth / 2 - 0.5, 0.8);
    const stopDist = 14.0;

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

    // Zebra Crosswalks (Centered at 11.5m, safely 2.5m behind the stop line)
    const zebraStripeGeo = new THREE.PlaneGeometry(0.85, 2.8);
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

    addCrosswalk(-11.5, false); // North
    addCrosswalk(11.5, false); // South
    addCrosswalk(-11.5, true); // West
    addCrosswalk(11.5, true); // East

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

    // 4. Modern Architectural Skyscrapers (4 Distinct High-Detail Towers)
    const { aviationBeacons } = buildArchitecturalSkyscrapers(scene, isNightModeRef.current);
    aviationBeaconsRef.current = aviationBeacons;

    // 5. Realistic Botanical Trees & Sidewalk Landscaping
    buildRealisticTrees(scene, isNightModeRef.current);

    // 5.2. MUTCD Pavement Markings (Turn Arrows, ADA Tactile Pads, Utility Covers)
    buildRoadwayMarkingsAndHardware(scene, roadWidth, roadLength);

    // 5.3. Street Furniture (Curved LED Streetlights, Fire Hydrants, Bus Shelters, Bollards)
    const { streetlights } = buildStreetFurniture(scene, roadWidth, isNightModeRef.current);
    streetlightsRef.current = streetlights;

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

      // MUTCD High-Contrast Yellow-Border Backplate
      const backplateBorder = new THREE.Mesh(
        new THREE.BoxGeometry(1.68, 3.68, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
      );
      backplateBorder.position.set(5.5, 8.8, 0.32);
      gGroup.add(backplateBorder);

      const backplateFace = new THREE.Mesh(
        new THREE.BoxGeometry(1.52, 3.52, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 })
      );
      backplateFace.position.set(5.5, 8.8, 0.33);
      gGroup.add(backplateFace);

      // Lamp Visor Cowls (Eyebrows)
      [9.8, 8.8, 7.8].forEach((ly) => {
        const visor = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12, 1, true, 0, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.6 })
        );
        visor.rotation.x = Math.PI / 2;
        visor.position.set(5.5, ly + 0.12, 0.42);
        gGroup.add(visor);
      });

      // Overhead Highway Street Name Sign (Green & White border)
      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.8, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 })
      );
      signBoard.position.set(2.4, 8.8, 0.02);
      gGroup.add(signBoard);

      const signBorder = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 0.9, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      signBorder.position.set(2.4, 8.8, 0);
      gGroup.add(signBorder);

      // Mast-Arm AI Traffic Sensor / CCTV Camera Pod
      const sensorCam = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.3, 0.55),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.7, roughness: 0.2 })
      );
      sensorCam.position.set(7.4, 8.8, 0.2);
      gGroup.add(sensorCam);

      const camLens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16),
        new THREE.MeshBasicMaterial({ color: 0x0284c7 })
      );
      camLens.rotation.x = Math.PI / 2;
      camLens.position.set(7.4, 8.8, 0.5);
      gGroup.add(camLens);

      // Upright Post Pedestrian Countdown Head
      const pedHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.9, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
      );
      pedHead.position.set(0.65, 3.2, 0);
      gGroup.add(pedHead);

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

      // Torso & Technical Urban Jacket
      const torsoMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Obsidian technical coat
        roughness: 0.4,
        metalness: 0.1,
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.28), torsoMat);
      torso.position.y = 0.31;
      torso.castShadow = true;
      hipGroup.add(torso);

      // Contrast Hi-Vis Chest Stripe
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.08, 0.285), stripeMat);
      stripe.position.set(0, 0.42, 0);
      hipGroup.add(stripe);

      // Head & Neck
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.6 });
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 10), skinMat);
      neck.position.y = 0.68;
      hipGroup.add(neck);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), skinMat);
      head.position.y = 0.82;
      head.castShadow = true;
      hipGroup.add(head);

      // Beanie Cap
      const beanieMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
      const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), beanieMat);
      beanie.position.y = 0.84;
      hipGroup.add(beanie);

      // Wireless Headphones
      const hpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
      [-0.19, 0.19].forEach((hx) => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), hpMat);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(hx, 0.82, 0);
        hipGroup.add(cup);
      });

      // Legs & Sneakers
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
      const soleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

      const legGeo = new THREE.BoxGeometry(0.16, 0.72, 0.18);
      const shoeGeo = new THREE.BoxGeometry(0.17, 0.12, 0.28);
      const soleGeo = new THREE.BoxGeometry(0.175, 0.04, 0.29);

      const createLeg = (posX: number) => {
        const pivot = new THREE.Group();
        pivot.position.set(posX, 0, 0);

        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.y = -0.36;
        leg.castShadow = true;
        pivot.add(leg);

        const shoe = new THREE.Mesh(shoeGeo, shoeMat);
        shoe.position.set(0, -0.72, 0.04);
        shoe.castShadow = true;
        pivot.add(shoe);

        const sole = new THREE.Mesh(soleGeo, soleMat);
        sole.position.set(0, -0.78, 0.04);
        pivot.add(sole);

        return pivot;
      };

      const leftLegPivot = createLeg(-0.13);
      hipGroup.add(leftLegPivot);

      const rightLegPivot = createLeg(0.13);
      hipGroup.add(rightLegPivot);

      // Arms
      const armMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
      const armGeo = new THREE.BoxGeometry(0.13, 0.58, 0.15);

      const createArm = (posX: number) => {
        const pivot = new THREE.Group();
        pivot.position.set(posX, 0.58, 0);

        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.y = -0.28;
        arm.castShadow = true;
        pivot.add(arm);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
        hand.position.set(0, -0.58, 0);
        pivot.add(hand);

        return pivot;
      };

      const leftArmPivot = createArm(-0.33);
      hipGroup.add(leftArmPivot);

      const rightArmPivot = createArm(0.33);
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

    scene.add(camera);

    // 6. Dynamic High-Detail Vehicle Mesh Pool
    const vehiclePool = new Map<string, Vehicle3DRecord>();

    const build3DVehicle = (
      type: SimVehicleType,
      paintColorHex: number,
      isEmergency: boolean
    ): Vehicle3DRecord => {
      return buildHighDetail3DVehicle(type, paintColorHex, isEmergency, isNightModeRef.current);
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

      // Fullscreen shortcut: 'F' key toggles, 'Escape' exits
      if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreenFnRef.current();
        return;
      }
      if (e.code === 'Escape' && isFullscreenRef.current) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
        isFullscreenRef.current = false;
        return;
      }

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

      // Watchdog: Ensure engine simulation loop is always actively stepping
      if (engineRef.current && !engineRef.current.isLoopRunning()) {
        engineRef.current.start();
      }

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

        // Periodic heading calculation for navigation HUD guidance
        if (Math.floor(time * 8) !== Math.floor((time - delta) * 8)) {
          const norm = ((pedYawRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const deg = Math.round((norm * 180) / Math.PI);
          let label = 'SOUTH';
          let arrow = '↓';
          if (deg >= 338 || deg < 23) { label = 'SOUTH'; arrow = '↓'; }
          else if (deg >= 23 && deg < 68) { label = 'SOUTH-EAST'; arrow = '↘'; }
          else if (deg >= 68 && deg < 113) { label = 'EAST'; arrow = '→'; }
          else if (deg >= 113 && deg < 158) { label = 'NORTH-EAST'; arrow = '↗'; }
          else if (deg >= 158 && deg < 203) { label = 'NORTH'; arrow = '↑'; }
          else if (deg >= 203 && deg < 248) { label = 'NORTH-WEST'; arrow = '↖'; }
          else if (deg >= 248 && deg < 293) { label = 'WEST'; arrow = '←'; }
          else { label = 'SOUTH-WEST'; arrow = '↙'; }
          setCurrentHeading({ label, arrow, deg });
        }
      }

      let moveX = 0;
      let moveZ = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveZ += 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveZ -= 1;
      if (keys['KeyD']) moveX -= 1;
      if (keys['KeyA']) moveX += 1;

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

      // Skyscraper Aviation Warning Beacons Pulsing (FAA Obstruction Safety)
      aviationBeaconsRef.current.forEach((beacon, idx) => {
        const pulse = Math.sin(time * 3.2 + idx * 0.8) > 0.4 ? 2.8 : 0.2;
        beacon.intensity = isNightModeRef.current ? pulse : 0.0;
      });

      // Crosswalk Safety & Jaywalking Assessment (with state change de-duplication)
      const onRoadway = Math.abs(px) < 9.0 || Math.abs(pz) < 9.0;
      if (onSidewalk) {
        if (pedSafetyStatusRef.current !== 'SIDEWALK') {
          pedSafetyStatusRef.current = 'SIDEWALK';
          setPedestrianSafetyStatus('SIDEWALK');
        }
        if (nearMissAlertRef.current !== null) {
          nearMissAlertRef.current = null;
          setNearMissAlert(null);
        }
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
          if (pedSafetyStatusRef.current !== 'SAFE_CROSSING') {
            pedSafetyStatusRef.current = 'SAFE_CROSSING';
            setPedestrianSafetyStatus('SAFE_CROSSING');
          }
          if (nearMissAlertRef.current !== null) {
            nearMissAlertRef.current = null;
            setNearMissAlert(null);
          }
        } else {
          let closestDist = 999;
          simVehicles.forEach((sv) => {
            const vx = (sv.x - 320) * coordScale;
            const vz = (sv.y - 320) * coordScale;
            const dist = Math.hypot(px - vx, pz - vz);
            if (dist < closestDist) closestDist = dist;
          });

          if (closestDist < 14) {
            const alertMsg = `⚠️ CRITICAL HAZARD: ONCOMING VEHICLE AT ${(closestDist * 1.8).toFixed(1)}m!`;
            if (pedSafetyStatusRef.current !== 'DANGER') {
              pedSafetyStatusRef.current = 'DANGER';
              setPedestrianSafetyStatus('DANGER');
            }
            if (nearMissAlertRef.current !== alertMsg) {
              nearMissAlertRef.current = alertMsg;
              setNearMissAlert(alertMsg);
            }
            if (time - lastHonkTimeRef.current > 2.2) {
              lastHonkTimeRef.current = time;
              playCarHorn();
            }
          } else {
            const warnMsg = '⚠️ JAYWALKING WARNING: TRAFFIC SIGNAL NOT ACTUATED';
            if (pedSafetyStatusRef.current !== 'JAYWALK') {
              pedSafetyStatusRef.current = 'JAYWALK';
              setPedestrianSafetyStatus('JAYWALK');
            }
            if (nearMissAlertRef.current !== warnMsg) {
              nearMissAlertRef.current = warnMsg;
              setNearMissAlert(warnMsg);
            }
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
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
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
    if (preset === 'PEDESTRIAN') {
      setIsThirdPerson(false);
      isThirdPersonRef.current = false;
    }
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

  // Fullscreen Management with native API and fallback
  const handleToggleFullscreen = () => {
    soundEffects.playClick();
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!document.fullscreenElement && !isFullscreen) {
      setIsFullscreen(true);
      isFullscreenRef.current = true;
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => {
          // Native fullscreen failed/restricted, CSS fallback is active
        });
      }
    } else {
      setIsFullscreen(false);
      isFullscreenRef.current = false;
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  toggleFullscreenFnRef.current = handleToggleFullscreen;

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      isFullscreenRef.current = isFs;
    };

    const handleExternalToggle = () => {
      handleToggleFullscreen();
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('trafix:sim:toggle-fullscreen', handleExternalToggle);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('trafix:sim:toggle-fullscreen', handleExternalToggle);
    };
  }, [isFullscreen]);

  const handleVirtualMovement = (code: string, isDown: boolean) => {
    keysPressedRef.current[code] = isDown;
  };

  const emergencyAlert = state?.activeEmergencyMessage || engine?.getEmergencyMessage();
  const pedTimerDisplay = Math.ceil(
    engine?.getPedestrianTimer() || state?.pedestrianTimeRemaining || 0
  );

  return (
    <div
      ref={wrapperRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-[99999] bg-slate-950 w-screen h-screen rounded-none'
          : 'relative w-full rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl'
      } overflow-hidden font-mono select-none flex flex-col`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999999,
            }
          : undefined
      }
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full block cursor-grab active:cursor-grabbing ${
          isFullscreen
            ? 'w-full h-full min-h-0 flex-1'
            : 'aspect-[16/10] sm:aspect-[16/9] min-h-[420px]'
        }`}
      />

      {/* Top Refined OSD Control Bar */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none z-10">
        {/* Status OSD Pill */}
        <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-white flex items-center gap-2 pointer-events-auto shadow-xl shrink-0">
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
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl overflow-x-auto no-scrollbar">
          {/* Camera Presets */}
          <button
            onClick={() => handleSelectPreset('DRONE')}
            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'DRONE'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Free 360° Drone Orbit Inspection (Click & drag to rotate)"
          >
            Drone
          </button>

          <button
            onClick={() => handleSelectPreset('CCTV')}
            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'CCTV'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="High Mast Security CCTV Perspective"
          >
            CCTV
          </button>

          <button
            onClick={() => handleSelectPreset('DRIVER')}
            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'DRIVER'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Driver Dashboard Point of View"
          >
            Driver
          </button>

          {/* Pedestrian FPP Preset */}
          <button
            onClick={() => handleSelectPreset('PEDESTRIAN')}
            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              cameraPreset === 'PEDESTRIAN'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-cyan-400 hover:text-white bg-cyan-950/40 border border-cyan-800/40'
            }`}
            title="First-Person Pedestrian View (WASD Walk, Interactive Crosswalk Pelican Button)"
          >
            <User className="w-3 h-3" />
            <span>FPP Walk</span>
          </button>

          <button
            onClick={() => handleSelectPreset('TOP_DOWN')}
            className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'TOP_DOWN'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Top-Down Orthographic Blueprint"
          >
            2D Top
          </button>

          {/* Vertical Separator */}
          <div className="w-[1px] h-3.5 bg-slate-800 mx-0.5" />

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
          <div className="w-[1px] h-3.5 bg-slate-800 mx-0.5" />

          {/* Dynamic Day / Night Theme Toggle */}
          <button
            onClick={handleToggleNight}
            className={`p-1 rounded-lg transition cursor-pointer ${
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

          {/* Integrated Exit Fullscreen Button in Toolbar */}
          {isFullscreen && (
            <>
              <div className="w-[1px] h-3.5 bg-neutral-800 mx-0.5" />
              <button
                onClick={handleToggleFullscreen}
                className="px-2.5 py-1 rounded-lg bg-black hover:bg-neutral-900 text-white border border-neutral-800 transition flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-[11px] font-mono font-medium shadow-xs"
                title="Exit Full Screen (ESC)"
              >
                <Minimize2 className="w-3 h-3 text-neutral-300" />
                <span>Exit Full Screen</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* FPP Clean Center Reticle */}
      {cameraPreset === 'PEDESTRIAN' && !isThirdPerson && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-1.5 h-1.5 rounded-full border border-white/60 bg-white/20" />
        </div>
      )}

      {/* Interactive Pelican Call Button Banner - Floats cleanly above bottom bar */}
      {cameraPreset === 'PEDESTRIAN' && isNearButton && (
        <div
          onClick={handleTriggerPedestrianCall}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 px-3.5 py-1.5 rounded-full font-black text-xs shadow-2xl flex items-center gap-2 cursor-pointer border border-amber-200 pointer-events-auto transition-transform z-20 animate-pulse"
          title="Push to request protected pedestrian walk phase"
        >
          <Radio className="w-3.5 h-3.5 text-amber-950 animate-spin" />
          <span>[PRESS E] PUSH BUTTON TO REQUEST CROSSING</span>
        </div>
      )}

      {/* Pedestrian Live Safety HUD Status Overlay - Docked neatly below top status bar */}
      {cameraPreset === 'PEDESTRIAN' && (
        <div className="absolute top-12 left-3 flex flex-col gap-1 pointer-events-none z-10">
          {pedestrianSafetyStatus === 'SAFE_CROSSING' && (
            <div className="bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                🚶 WALK PHASE ACTIVE • SAFE TO CROSS ({pedTimerDisplay}s)
              </span>
            </div>
          )}

          {pedestrianSafetyStatus === 'SIDEWALK' && (
            <div className="bg-slate-900/85 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1.5 backdrop-blur-md">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span>ON SIDEWALK • SAFE PEDESTRIAN ZONE</span>
            </div>
          )}

          {pedestrianSafetyStatus === 'JAYWALK' && (
            <div className="bg-amber-950/90 border border-amber-500/80 text-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>⚠️ JAYWALKING WARNING • CROSSING WITHOUT WALK SIGNAL</span>
            </div>
          )}

          {pedestrianSafetyStatus === 'DANGER' && (
            <div className="bg-red-950/95 border border-red-500 text-red-100 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-xl flex items-center gap-1.5 backdrop-blur-md animate-bounce">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>{nearMissAlert || '🚨 DANGER: ONCOMING TRAFFIC HAZARD!'}</span>
            </div>
          )}

          {/* FPP Dynamic Heading & Trajectory Compass */}
          {!isThirdPerson && (
            <div className="bg-slate-950/90 border border-cyan-800/60 text-cyan-200 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1.5 backdrop-blur-md">
              <Compass className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>
                HEADING: <span className="text-white">{currentHeading.label}</span> ({currentHeading.deg}°) {currentHeading.arrow}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 text-[9px] font-normal">A / D to steer</span>
            </div>
          )}
        </div>
      )}

      {/* Safe Crossing Completed Success Banner - Docked neatly in top right */}
      {pedSuccessToast && (
        <div className="absolute top-12 right-3 bg-emerald-600 border border-emerald-300 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-2xl animate-fadeIn flex items-center gap-1.5 pointer-events-none z-20">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          <span>{pedSuccessToast}</span>
        </div>
      )}

      {/* Emergency Active Alert Badge Overlay in 3D */}
      {emergencyAlert && (
        <div className="absolute top-12 inset-x-3 bg-red-950/90 border border-red-500/80 text-red-200 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs font-mono font-bold animate-pulse shadow-2xl pointer-events-none z-10">
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
              className={`px-3 py-1 rounded-lg font-bold border flex items-center gap-1.5 cursor-pointer text-[11px] transition ${
                isNearButton
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_#f59e0b] animate-pulse font-black'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
              }`}
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

