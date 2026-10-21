import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Camera,
  RotateCw,
  Sun,
  Moon,
  Video,
  Eye,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Radio,
  Sliders,
} from 'lucide-react';
import { Direction, LightState, JunctionLiveTelemetry } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface ThreeIntersectionViewerProps {
  telemetry?: JunctionLiveTelemetry | null;
  onTriggerGreen?: (direction: Direction) => void;
}

type CameraViewPreset = 'DRONE' | 'TOP_DOWN' | 'CCTV' | 'DRIVER';

export const ThreeIntersectionViewer: React.FC<ThreeIntersectionViewerProps> = ({
  telemetry,
  onTriggerGreen,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>('DRONE');
  const [isNightMode, setIsNightMode] = useState<boolean>(true);
  const [activeRoad, setActiveRoad] = useState<Direction>(telemetry?.activeDirection || 'NORTH');

  useEffect(() => {
    if (telemetry?.activeDirection) {
      setActiveRoad(telemetry.activeDirection);
    }
  }, [telemetry?.activeDirection]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x05070e : 0xdbeafe);
    scene.fog = new THREE.FogExp2(isNightMode ? 0x05070e : 0xdbeafe, 0.012);

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 42, 48);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(isNightMode ? 0x1e293b : 0xffffff, isNightMode ? 1.2 : 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(isNightMode ? 0x38bdf8 : 0xffffff, isNightMode ? 1.5 : 2.2);
    sunLight.position.set(30, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 3. Ground & Roads Geometry
    // Grass/Plaza Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x0a101d : 0x94a3b8,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Asphalt Crossroad (+ Shape)
    const roadWidth = 14;
    const roadLength = 160;

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.7,
      metalness: 0.1,
    });

    // N-S Road
    const nsRoadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const nsRoad = new THREE.Mesh(nsRoadGeo, roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.05;
    nsRoad.receiveShadow = true;
    scene.add(nsRoad);

    // E-W Road
    const ewRoadGeo = new THREE.PlaneGeometry(roadLength, roadWidth);
    const ewRoad = new THREE.Mesh(ewRoadGeo, roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.05;
    ewRoad.receiveShadow = true;
    scene.add(ewRoad);

    // Yellow Dashed Lane Dividers
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const lineGeo = new THREE.PlaneGeometry(0.3, 2.5);

    for (let z = -70; z <= 70; z += 5) {
      if (Math.abs(z) > roadWidth / 2) {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.08, z);
        scene.add(line);
      }
    }

    for (let x = -70; x <= 70; x += 5) {
      if (Math.abs(x) > roadWidth / 2) {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.rotation.z = Math.PI / 2;
        line.position.set(x, 0.08, 0);
        scene.add(line);
      }
    }

    // Zebra Crosswalk Stripes (White)
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const zebraGeo = new THREE.PlaneGeometry(0.8, 4);

    const addZebraCrossing = (centerZ: number, isVertical: boolean) => {
      for (let i = -5; i <= 5; i += 1.3) {
        const stripe = new THREE.Mesh(zebraGeo, zebraMat);
        stripe.rotation.x = -Math.PI / 2;
        if (isVertical) {
          stripe.rotation.z = Math.PI / 2;
          stripe.position.set(centerZ, 0.09, i);
        } else {
          stripe.position.set(i, 0.09, centerZ);
        }
        scene.add(stripe);
      }
    };

    addZebraCrossing(-roadWidth / 2 - 2, false); // North crosswalk
    addZebraCrossing(roadWidth / 2 + 2, false); // South crosswalk
    addZebraCrossing(-roadWidth / 2 - 2, true); // West crosswalk
    addZebraCrossing(roadWidth / 2 + 2, true); // East crosswalk

    // 4. Traffic Signal Poles & 3D Lamps
    interface SignalPole {
      dir: Direction;
      poleGroup: THREE.Group;
      redLamp: THREE.Mesh;
      yellowLamp: THREE.Mesh;
      greenLamp: THREE.Mesh;
      pointLight: THREE.PointLight;
    }

    const signalPoles: SignalPole[] = [];

    const createSignalPole = (x: number, z: number, rotationY: number, dir: Direction) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(x, 0, z);
      poleGroup.rotation.y = rotationY;

      // Vertical Pole
      const poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 8, 16);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 4;
      pole.castShadow = true;
      poleGroup.add(pole);

      // Horizontal Arm
      const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 16);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(1.5, 7.5, 0);
      poleGroup.add(arm);

      // Signal Casing Box
      const boxGeo = new THREE.BoxGeometry(0.9, 2.6, 0.7);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const casing = new THREE.Mesh(boxGeo, boxMat);
      casing.position.set(3, 7.5, 0);
      poleGroup.add(casing);

      // Lamps
      const lampGeo = new THREE.SphereGeometry(0.28, 16, 16);

      const redMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: 0xf43f5e,
        emissiveIntensity: 0.2,
      });
      const redLamp = new THREE.Mesh(lampGeo, redMat);
      redLamp.position.set(3, 8.3, 0.3);
      poleGroup.add(redLamp);

      const yellowMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.2,
      });
      const yellowLamp = new THREE.Mesh(lampGeo, yellowMat);
      yellowLamp.position.set(3, 7.5, 0.3);
      poleGroup.add(yellowLamp);

      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: 0x10b981,
        emissiveIntensity: 0.2,
      });
      const greenLamp = new THREE.Mesh(lampGeo, greenMat);
      greenLamp.position.set(3, 6.7, 0.3);
      poleGroup.add(greenLamp);

      // Point Light for Street Illumination
      const pointLight = new THREE.PointLight(0x10b981, 1.5, 12);
      pointLight.position.set(3, 7.5, 1);
      poleGroup.add(pointLight);

      scene.add(poleGroup);

      signalPoles.push({ dir, poleGroup, redLamp, yellowLamp, greenLamp, pointLight });
    };

    // Position 4 poles around the junction
    createSignalPole(roadWidth / 2 + 1, -roadWidth / 2 - 4, 0, 'NORTH');
    createSignalPole(-roadWidth / 2 - 1, roadWidth / 2 + 4, Math.PI, 'SOUTH');
    createSignalPole(roadWidth / 2 + 4, roadWidth / 2 + 1, -Math.PI / 2, 'EAST');
    createSignalPole(-roadWidth / 2 - 4, -roadWidth / 2 - 1, Math.PI / 2, 'WEST');

    // 5. Animated 3D Vehicles
    interface ThreeVehicle {
      mesh: THREE.Group;
      road: Direction;
      progress: number;
      speed: number;
      isEmergency: boolean;
      beaconMesh?: THREE.Mesh;
    }

    const vehicles: ThreeVehicle[] = [];
    const carColors = [0x38bdf8, 0x34d399, 0xf59e0b, 0xa78bfa, 0xef4444, 0xffffff];

    const create3DCar = (isEmergency: boolean = false, colorHex: number = 0x38bdf8) => {
      const carGroup = new THREE.Group();

      // Body
      const bodyGeo = new THREE.BoxGeometry(2.2, 1.1, 4.4);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isEmergency ? 0xf43f5e : colorHex,
        metalness: 0.4,
        roughness: 0.3,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.8;
      body.castShadow = true;
      carGroup.add(body);

      // Cabin / Roof
      const cabinGeo = new THREE.BoxGeometry(1.9, 0.9, 2.4);
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.6, -0.2);
      carGroup.add(cabin);

      // Headlights
      const lightGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const hlLeft = new THREE.Mesh(lightGeo, lightMat);
      hlLeft.position.set(-0.8, 0.8, -2.2);
      const hlRight = new THREE.Mesh(lightGeo, lightMat);
      hlRight.position.set(0.8, 0.8, -2.2);
      carGroup.add(hlLeft, hlRight);

      // Emergency Flashing Beacon
      let beaconMesh: THREE.Mesh | undefined;
      if (isEmergency) {
        const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.set(0, 2.2, -0.2);
        carGroup.add(beaconMesh);
      }

      return { carGroup, beaconMesh };
    };

    // Spawn initial vehicle fleet
    const spawnFleet = () => {
      const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
      for (let i = 0; i < 14; i++) {
        const road = directions[i % 4];
        const isEmg = i === 0 && Boolean(telemetry?.activeEmergency);
        const { carGroup, beaconMesh } = create3DCar(isEmg, carColors[i % carColors.length]);

        scene.add(carGroup);
        vehicles.push({
          mesh: carGroup,
          road,
          progress: (i * 0.15) % 1,
          speed: isEmg ? 0.006 : 0.0022 + Math.random() * 0.0015,
          isEmergency: isEmg,
          beaconMesh,
        });
      }
    };

    spawnFleet();

    // 6. Camera Presets Handling
    const updateCameraPosition = () => {
      if (cameraPreset === 'DRONE') {
        camera.position.set(0, 42, 48);
        camera.lookAt(0, 0, 0);
      } else if (cameraPreset === 'TOP_DOWN') {
        camera.position.set(0, 75, 0.1);
        camera.lookAt(0, 0, 0);
      } else if (cameraPreset === 'CCTV') {
        camera.position.set(16, 14, 16);
        camera.lookAt(0, 2, 0);
      } else {
        // DRIVER POV
        camera.position.set(-3.2, 2.5, 28);
        camera.lookAt(-3.2, 2.0, -10);
      }
    };

    updateCameraPosition();

    // 7. Interactive Mouse Orbit Controls
    let isMouseDown = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 65, theta: Math.PI / 4, phi: Math.PI / 3 };

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || cameraPreset !== 'DRONE') return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      spherical.theta -= deltaX * 0.006;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.006));

      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (cameraPreset !== 'DRONE') return;
      spherical.radius = Math.max(25, Math.min(120, spherical.radius + e.deltaY * 0.05));
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: true });

    // 8. Animation & Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update Signal Lights according to activeRoad
      signalPoles.forEach((sp) => {
        const isGreen = sp.dir === activeRoad;
        const redMat = sp.redLamp.material as THREE.MeshStandardMaterial;
        const yellowMat = sp.yellowLamp.material as THREE.MeshStandardMaterial;
        const greenMat = sp.greenLamp.material as THREE.MeshStandardMaterial;

        if (isGreen) {
          greenMat.emissiveIntensity = 2.5;
          redMat.emissiveIntensity = 0.1;
          yellowMat.emissiveIntensity = 0.1;
          sp.pointLight.color.setHex(0x10b981);
          sp.pointLight.intensity = 2.0;
        } else {
          greenMat.emissiveIntensity = 0.1;
          redMat.emissiveIntensity = 2.5;
          yellowMat.emissiveIntensity = 0.1;
          sp.pointLight.color.setHex(0xf43f5e);
          sp.pointLight.intensity = 1.5;
        }
      });

      // Update Vehicles Position
      vehicles.forEach((v) => {
        const isGreen = v.road === activeRoad || v.isEmergency;
        const stopZ = roadWidth / 2 + 4;

        // Stopping logic near intersection stop-line
        const currentDistance = 70 - v.progress * 140;
        const isNearStopLine = currentDistance > stopZ - 3 && currentDistance < stopZ + 8;

        if (!isGreen && isNearStopLine) {
          // Slow down or hold before zebra
        } else {
          v.progress += v.speed;
        }

        if (v.progress > 1) {
          v.progress = 0;
        }

        // Map progress to 3D road trajectory
        const tPos = -70 + v.progress * 140;
        const laneX = 3.2;

        if (v.road === 'NORTH') {
          v.mesh.position.set(-laneX, 0, -tPos);
          v.mesh.rotation.y = 0;
        } else if (v.road === 'SOUTH') {
          v.mesh.position.set(laneX, 0, tPos);
          v.mesh.rotation.y = Math.PI;
        } else if (v.road === 'EAST') {
          v.mesh.position.set(tPos, 0, -laneX);
          v.mesh.rotation.y = Math.PI / 2;
        } else {
          v.mesh.position.set(-tPos, 0, laneX);
          v.mesh.rotation.y = -Math.PI / 2;
        }

        // Flash emergency beacon
        if (v.isEmergency && v.beaconMesh) {
          const isBlue = Math.sin(time * 15) > 0;
          (v.beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(isBlue ? 0x38bdf8 : 0xf43f5e);
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
  }, [cameraPreset, isNightMode, activeRoad, telemetry?.activeEmergency]);

  const handleSwitchApproach = (dir: Direction) => {
    soundEffects.playClick();
    setActiveRoad(dir);
    if (onTriggerGreen) onTriggerGreen(dir);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-cyan-500/40 bg-[#05070e] shadow-2xl flex flex-col font-mono select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full aspect-[16/10] sm:aspect-[16/9] min-h-[380px] block cursor-grab active:cursor-grabbing" />

      {/* Top Controls Overlay */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
        {/* Active Digital Twin OSD Badge */}
        <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/50 text-xs text-white flex items-center gap-2 pointer-events-auto shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-cyan-400">3D DIGITAL TWIN WEBGL</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">{activeRoad} GREEN ACTIVE</span>
        </div>

        {/* Camera Preset Switcher & Day/Night Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-black/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
          <button
            onClick={() => {
              soundEffects.playClick();
              setCameraPreset('DRONE');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'DRONE'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
            title="45° Drone Orbit View"
          >
            🚁 Drone
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setCameraPreset('TOP_DOWN');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'TOP_DOWN'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Top-Down Orthographic View"
          >
            📐 2D Top
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setCameraPreset('CCTV');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'CCTV'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
            title="CCTV Pole Angle"
          >
            📹 CCTV
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setCameraPreset('DRIVER');
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              cameraPreset === 'DRIVER'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Driver Dashboard POV"
          >
            🏎️ Driver
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setIsNightMode(!isNightMode);
            }}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition ml-1 cursor-pointer"
            title="Toggle Day/Night Environment"
          >
            {isNightMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-300" />}
          </button>
        </div>
      </div>

      {/* Bottom Interactive Phase Trigger Ribbon */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Switch Signal Approach:</span>
        </div>

        <div className="flex items-center gap-1.5">
          {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((dir) => (
            <button
              key={dir}
              onClick={() => handleSwitchApproach(dir)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                activeRoad === dir
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {dir} {activeRoad === dir ? '🟢' : '🔴'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
