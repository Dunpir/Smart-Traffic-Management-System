import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Eye, RefreshCw, Layers, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface ThreeIntersection3DProps {
  activeDirection: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  currentPhase: 'GREEN' | 'YELLOW' | 'RED' | 'ALL_RED';
  phaseTimeRemaining: number;
  totalVehicles: number;
  hasEmergency?: boolean;
}

interface Vehicle3D {
  mesh: THREE.Group;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  speed: number;
  isStopped: boolean;
  type: 'CAR' | 'BUS' | 'AMBULANCE';
}

export const ThreeIntersection3D: React.FC<ThreeIntersection3DProps> = ({
  activeDirection,
  currentPhase,
  phaseTimeRemaining,
  totalVehicles,
  hasEmergency,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraView, setCameraView] = useState<'ISOMETRIC' | 'TOP_DOWN' | 'DRIVER' | 'ORBIT'>('ISOMETRIC');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);

  // References for render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const signalLampsRef = useRef<
    Record<
      string,
      {
        red: THREE.Mesh;
        yellow: THREE.Mesh;
        green: THREE.Mesh;
        timerMesh?: THREE.Mesh;
        timerCanvas?: HTMLCanvasElement;
        timerTexture?: THREE.CanvasTexture;
      }
    >
  >({});
  const vehiclesRef = useRef<Vehicle3D[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1122);
    scene.fog = new THREE.FogExp2(0x0a1122, 0.015);

    // 2. Camera Setup
    const width = container.clientWidth;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(45, 45, 45);
    camera.lookAt(0, 0, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff0dd, 1.4);
    sunLight.position.set(30, 60, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Subtle blue accent rim light
    const rimLight = new THREE.DirectionalLight(0x3b82f6, 0.6);
    rimLight.position.set(-30, 20, -30);
    scene.add(rimLight);

    // 5. Environment & Roads
    // Ground Grass / Terrain
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f1b29, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Asphalt Roads (North-South & East-West)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(16, 160), roadMat);
    roadNS.rotation.x = -Math.PI / 2;
    roadNS.position.y = 0.05;
    roadNS.receiveShadow = true;
    scene.add(roadNS);

    const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(160, 16), roadMat);
    roadEW.rotation.x = -Math.PI / 2;
    roadEW.position.y = 0.06;
    roadEW.receiveShadow = true;
    scene.add(roadEW);

    // Center Junction Box
    const junctionCenter = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), roadMat);
    junctionCenter.rotation.x = -Math.PI / 2;
    junctionCenter.position.y = 0.07;
    scene.add(junctionCenter);

    // Road Markings (Yellow Divider & White Zebra Crossings)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Zebra Crossings at 4 approaches
    const createCrosswalk = (x: number, z: number, isVertical: boolean) => {
      const group = new THREE.Group();
      for (let i = -7; i <= 7; i += 1.8) {
        const stripe = new THREE.Mesh(
          isVertical ? new THREE.PlaneGeometry(0.8, 2.5) : new THREE.PlaneGeometry(2.5, 0.8),
          lineMat
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(isVertical ? i : 0, 0.08, isVertical ? 0 : i);
        group.add(stripe);
      }
      group.position.set(x, 0, z);
      scene.add(group);
    };

    createCrosswalk(0, 10, true); // North approach crosswalk
    createCrosswalk(0, -10, true); // South approach crosswalk
    createCrosswalk(10, 0, false); // East approach crosswalk
    createCrosswalk(-10, 0, false); // West approach crosswalk

    // 6. Traffic Light Gantries at 4 corners with Digital Countdown Displays
    const lamps: Record<string, { red: THREE.Mesh; yellow: THREE.Mesh; green: THREE.Mesh; timerMesh?: THREE.Mesh; timerCanvas?: HTMLCanvasElement; timerTexture?: THREE.CanvasTexture }> = {};

    const createTimerTexture = (text: string, color: string, borderColor: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dark translucent background with border
        ctx.fillStyle = 'rgba(5, 5, 8, 0.9)';
        ctx.fillRect(0, 0, 256, 128);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 248, 120);

        // Digital countdown text
        ctx.font = 'bold 64px monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return { canvas, texture };
    };

    const createTrafficSignalPost = (dir: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST', posX: number, posZ: number, rotY: number) => {
      const postGroup = new THREE.Group();

      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 7, 16),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
      );
      pole.position.y = 3.5;
      pole.castShadow = true;
      postGroup.add(pole);

      // Signal Head Box
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 2.6, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
      );
      box.position.set(0, 6.2, 0.4);
      postGroup.add(box);

      // Digital Countdown Timer Display Box ON TOP of signal head
      const timerHousing = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.0, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.3 })
      );
      timerHousing.position.set(0, 8.1, 0.4);
      postGroup.add(timerHousing);

      // Digital Timer Screen Plane
      const { canvas: timerCanvas, texture: timerTexture } = createTimerTexture('20s', '#10b981', '#10b981');
      const timerScreenMat = new THREE.MeshBasicMaterial({ map: timerTexture, transparent: true });
      const timerScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), timerScreenMat);
      timerScreen.position.set(0, 8.1, 0.66);
      postGroup.add(timerScreen);

      // Lenses: Red, Yellow, Green
      const lensGeo = new THREE.SphereGeometry(0.28, 16, 16);

      const redLens = new THREE.Mesh(
        lensGeo,
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x000000, roughness: 0.2 })
      );
      redLens.position.set(0, 7.0, 0.8);
      postGroup.add(redLens);

      const yellowLens = new THREE.Mesh(
        lensGeo,
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x000000, roughness: 0.2 })
      );
      yellowLens.position.set(0, 6.2, 0.8);
      postGroup.add(yellowLens);

      const greenLens = new THREE.Mesh(
        lensGeo,
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x000000, roughness: 0.2 })
      );
      greenLens.position.set(0, 5.4, 0.8);
      postGroup.add(greenLens);

      postGroup.position.set(posX, 0, posZ);
      postGroup.rotation.y = rotY;
      scene.add(postGroup);

      lamps[dir] = { red: redLens, yellow: yellowLens, green: greenLens, timerMesh: timerScreen, timerCanvas, timerTexture };
    };

    createTrafficSignalPost('NORTH', -9, 10, Math.PI);
    createTrafficSignalPost('SOUTH', 9, -10, 0);
    createTrafficSignalPost('EAST', 10, 9, Math.PI / 2);
    createTrafficSignalPost('WEST', -10, -9, -Math.PI / 2);
    signalLampsRef.current = lamps;

    // 7. Spawn Dynamic 3D Vehicles
    const vehicles: Vehicle3D[] = [];
    const carColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xe2e8f0, 0x0f172a];

    const createVehicle = (dir: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST', startDist: number, type: 'CAR' | 'BUS' | 'AMBULANCE'): Vehicle3D => {
      const carGroup = new THREE.Group();

      const width = type === 'BUS' ? 3.0 : 2.2;
      const length = type === 'BUS' ? 7.5 : 4.4;
      const height = type === 'BUS' ? 3.2 : 1.5;

      const bodyColor = type === 'AMBULANCE' ? 0xffffff : type === 'BUS' ? 0x0284c7 : carColors[Math.floor(Math.random() * carColors.length)];

      // Car Body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, length),
        new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.3, roughness: 0.4 })
      );
      body.position.y = height / 2 + 0.3;
      body.castShadow = true;
      carGroup.add(body);

      // Cabin / Roof
      if (type === 'CAR') {
        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.85, height * 0.8, length * 0.55),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
        );
        cabin.position.set(0, height + 0.3, -0.2);
        carGroup.add(cabin);
      }

      // Ambulance Siren Light
      if (type === 'AMBULANCE') {
        const siren = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.4, 0.8),
          new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 2 })
        );
        siren.position.set(0, height + 0.4, 0);
        carGroup.add(siren);
      }

      // Position along lane
      let posX = 0;
      let posZ = 0;
      let rotY = 0;

      if (dir === 'NORTH') {
        posX = -4.0;
        posZ = startDist;
        rotY = Math.PI;
      } else if (dir === 'SOUTH') {
        posX = 4.0;
        posZ = -startDist;
        rotY = 0;
      } else if (dir === 'EAST') {
        posX = startDist;
        posZ = 4.0;
        rotY = Math.PI / 2;
      } else if (dir === 'WEST') {
        posX = -startDist;
        posZ = -4.0;
        rotY = -Math.PI / 2;
      }

      carGroup.position.set(posX, 0, posZ);
      carGroup.rotation.y = rotY;
      scene.add(carGroup);

      return {
        mesh: carGroup,
        direction: dir,
        speed: 0.25 + Math.random() * 0.15,
        isStopped: false,
        type,
      };
    };

    // Initial vehicle platoon
    vehicles.push(createVehicle('NORTH', 22, 'CAR'));
    vehicles.push(createVehicle('NORTH', 35, 'BUS'));
    vehicles.push(createVehicle('SOUTH', 20, 'CAR'));
    vehicles.push(createVehicle('SOUTH', 32, 'AMBULANCE'));
    vehicles.push(createVehicle('EAST', 25, 'CAR'));
    vehicles.push(createVehicle('EAST', 40, 'CAR'));
    vehicles.push(createVehicle('WEST', 18, 'CAR'));
    vehicles.push(createVehicle('WEST', 36, 'BUS'));

    vehiclesRef.current = vehicles;

    // 8. Animation & Render Loop
    let angle = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Camera auto-rotation if active
      if (isAutoRotate) {
        angle += 0.005;
        camera.position.x = Math.cos(angle) * 55;
        camera.position.z = Math.sin(angle) * 55;
        camera.lookAt(0, 0, 0);
      }

      // Update vehicle positions based on active green phase
      for (const veh of vehiclesRef.current) {
        const isCurrentRoadGreen = activeDirection === veh.direction && currentPhase === 'GREEN';

        // Check distance to stop line (stop line is at distance ~12)
        const currentDist =
          veh.direction === 'NORTH'
            ? veh.mesh.position.z
            : veh.direction === 'SOUTH'
              ? -veh.mesh.position.z
              : veh.direction === 'EAST'
                ? veh.mesh.position.x
                : -veh.mesh.position.x;

        const isApproachingStopLine = currentDist > 11 && currentDist < 16;

        if (!isCurrentRoadGreen && isApproachingStopLine) {
          // Stop at red light
          veh.isStopped = true;
        } else {
          veh.isStopped = false;
          // Move vehicle forward
          if (veh.direction === 'NORTH') {
            veh.mesh.position.z -= veh.speed;
            if (veh.mesh.position.z < -70) veh.mesh.position.z = 70;
          } else if (veh.direction === 'SOUTH') {
            veh.mesh.position.z += veh.speed;
            if (veh.mesh.position.z > 70) veh.mesh.position.z = -70;
          } else if (veh.direction === 'EAST') {
            veh.mesh.position.x -= veh.speed;
            if (veh.mesh.position.x < -70) veh.mesh.position.x = 70;
          } else if (veh.direction === 'WEST') {
            veh.mesh.position.x += veh.speed;
            if (veh.mesh.position.x > 70) veh.mesh.position.x = -70;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Synchronize 3D Signal Lamps and Digital Countdown Timers with Live Phase
  useEffect(() => {
    const lamps = signalLampsRef.current;
    if (!lamps) return;

    const remainingSec = Math.max(1, Math.round(phaseTimeRemaining));

    (['NORTH', 'SOUTH', 'EAST', 'WEST'] as const).forEach((dir) => {
      const lamp = lamps[dir];
      if (!lamp) return;

      const isThisDirActive = activeDirection === dir;

      // Update Red Lamp
      const redMat = lamp.red.material as THREE.MeshStandardMaterial;
      if (!isThisDirActive) {
        redMat.emissive.setHex(0xff0000);
        redMat.emissiveIntensity = 2.5;
      } else {
        redMat.emissive.setHex(0x000000);
        redMat.emissiveIntensity = 0;
      }

      // Update Yellow Lamp
      const yellowMat = lamp.yellow.material as THREE.MeshStandardMaterial;
      if (isThisDirActive && currentPhase === 'YELLOW') {
        yellowMat.emissive.setHex(0xf59e0b);
        yellowMat.emissiveIntensity = 2.5;
      } else {
        yellowMat.emissive.setHex(0x000000);
        yellowMat.emissiveIntensity = 0;
      }

      // Update Green Lamp
      const greenMat = lamp.green.material as THREE.MeshStandardMaterial;
      if (isThisDirActive && currentPhase === 'GREEN') {
        greenMat.emissive.setHex(0x00ff88);
        greenMat.emissiveIntensity = 3.0;
      } else {
        greenMat.emissive.setHex(0x000000);
        greenMat.emissiveIntensity = 0;
      }

      // Update 3D Digital Countdown Timer Billboard
      if (lamp.timerCanvas && lamp.timerTexture) {
        const ctx = lamp.timerCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 256, 128);
          ctx.fillStyle = 'rgba(5, 5, 8, 0.95)';
          ctx.fillRect(0, 0, 256, 128);

          let timerText = '';
          let timerColor = '';

          if (isThisDirActive) {
            if (currentPhase === 'GREEN') {
              timerText = `${remainingSec}s`;
              timerColor = '#00ff88';
            } else if (currentPhase === 'YELLOW') {
              timerText = `${remainingSec}s`;
              timerColor = '#f59e0b';
            } else {
              timerText = '01s';
              timerColor = '#ef4444';
            }
          } else {
            // Calculated wait countdown for red approaches
            const redWait = remainingSec + (dir === 'SOUTH' ? 4 : dir === 'EAST' ? 12 : 18);
            timerText = `${Math.min(99, redWait)}s`;
            timerColor = '#ef4444';
          }

          // Draw Glowing Digital Border
          ctx.strokeStyle = timerColor;
          ctx.lineWidth = 6;
          ctx.strokeRect(4, 4, 248, 120);

          // Draw Monospace Countdown Text
          ctx.font = 'bold 64px monospace';
          ctx.fillStyle = timerColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(timerText, 128, 64);
        }
        lamp.timerTexture.needsUpdate = true;
      }
    });
  }, [activeDirection, currentPhase, phaseTimeRemaining]);

  // Camera preset switcher
  const setCameraPreset = (preset: 'ISOMETRIC' | 'TOP_DOWN' | 'DRIVER' | 'ORBIT') => {
    soundEffects.playClick();
    setCameraView(preset);
    const camera = cameraRef.current;
    if (!camera) return;

    setIsAutoRotate(preset === 'ORBIT');

    if (preset === 'ISOMETRIC') {
      camera.position.set(45, 45, 45);
      camera.lookAt(0, 0, 0);
    } else if (preset === 'TOP_DOWN') {
      camera.position.set(0, 75, 0.1);
      camera.lookAt(0, 0, 0);
    } else if (preset === 'DRIVER') {
      camera.position.set(-4, 3, 30);
      camera.lookAt(0, 3, -20);
    }
  };

  return (
    <div className="card-modern rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 relative shadow-xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-[460px] bg-[#0a1122]" />

      {/* Top Floating Telemetry Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#080e1a]/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-white shadow-lg pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold">
            3D WEBGL STUDIO • {activeDirection} {currentPhase} ({phaseTimeRemaining}s)
          </span>
        </div>

        {/* Camera Preset Switches */}
        <div className="flex items-center gap-1.5 bg-[#080e1a]/85 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-lg pointer-events-auto">
          <button
            onClick={() => setCameraPreset('ISOMETRIC')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${cameraView === 'ISOMETRIC' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
          >
            Isometric
          </button>
          <button
            onClick={() => setCameraPreset('TOP_DOWN')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${cameraView === 'TOP_DOWN' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => setCameraPreset('DRIVER')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${cameraView === 'DRIVER' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
          >
            Driver
          </button>
          <button
            onClick={() => setCameraPreset('ORBIT')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${cameraView === 'ORBIT' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
          >
            Orbit 360°
          </button>
        </div>
      </div>

      {/* Bottom Floating Stats */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white text-xs font-mono">
        <div className="bg-[#080e1a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 pointer-events-auto">
          <span>Active Vehicles in Scene: <strong>{totalVehicles}</strong></span>
        </div>
        <div className="bg-[#080e1a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-emerald-400 font-bold pointer-events-auto">
          <span>WebGL 60 FPS • Real-Time Physics</span>
        </div>
      </div>
    </div>
  );
};
