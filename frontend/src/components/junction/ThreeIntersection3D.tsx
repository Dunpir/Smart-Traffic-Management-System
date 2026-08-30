import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Eye, RefreshCw, Layers, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import { EmergencyEvent } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface ThreeIntersection3DProps {
  activeDirection: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  currentPhase: 'GREEN' | 'YELLOW' | 'RED' | 'ALL_RED';
  phaseTimeRemaining: number;
  totalVehicles: number;
  hasEmergency?: boolean;
  activeEmergency?: EmergencyEvent | null;
}

interface Vehicle3D {
  mesh: THREE.Group;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  speed: number;
  isStopped: boolean;
  type: 'CAR' | 'BUS' | 'AMBULANCE' | 'VIP' | 'POLICE' | 'FIRE_TRUCK' | 'TRUCK' | 'BIKE';
  isEmergency?: boolean;
  sirenMeshes?: THREE.Mesh[];
}

export const ThreeIntersection3D: React.FC<ThreeIntersection3DProps> = ({
  activeDirection,
  currentPhase,
  phaseTimeRemaining,
  totalVehicles,
  hasEmergency,
  activeEmergency,
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
  const spawnFunctionRef = useRef<((dir: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST', vType: string) => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1122);
    scene.fog = new THREE.FogExp2(0x0a1122, 0.015);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / (container.clientHeight || 460),
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.set(45, 45, 45);
    camera.lookAt(0, 0, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight || 460);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(40, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    blueRimLight.position.set(-40, 20, -40);
    scene.add(blueRimLight);

    // 5. Ground and Roads
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

    // North-South Road
    const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(18, 160), roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.y = 0.02;
    nsRoad.receiveShadow = true;
    scene.add(nsRoad);

    // East-West Road
    const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(160, 18), roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.y = 0.02;
    ewRoad.receiveShadow = true;
    scene.add(ewRoad);

    // Road Markings: Yellow Divider & White Dashes
    const lineMatYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const lineMatWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Center dividers
    const nsDivider = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 160), lineMatYellow);
    nsDivider.rotation.x = -Math.PI / 2;
    nsDivider.position.y = 0.04;
    scene.add(nsDivider);

    const ewDivider = new THREE.Mesh(new THREE.PlaneGeometry(160, 0.35), lineMatYellow);
    ewDivider.rotation.x = -Math.PI / 2;
    ewDivider.position.y = 0.04;
    scene.add(ewDivider);

    // Stop Lines at 4 Approaches
    const createStopLine = (posX: number, posZ: number, rotY: number) => {
      const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.6), lineMatWhite);
      stopLine.rotation.x = -Math.PI / 2;
      stopLine.rotation.z = rotY;
      stopLine.position.set(posX, 0.05, posZ);
      scene.add(stopLine);
    };

    createStopLine(0, 11, 0); // North Stop Line
    createStopLine(0, -11, 0); // South Stop Line
    createStopLine(11, 0, Math.PI / 2); // East Stop Line
    createStopLine(-11, 0, Math.PI / 2); // West Stop Line

    // Zebra Crosswalks
    const createZebra = (startX: number, startZ: number, isVertical: boolean) => {
      for (let i = -7; i <= 7; i += 2) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(isVertical ? 0.8 : 3.5, isVertical ? 3.5 : 0.8),
          lineMatWhite
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(
          isVertical ? startX + i : startX,
          0.045,
          isVertical ? startZ : startZ + i
        );
        scene.add(stripe);
      }
    };

    createZebra(0, 13.5, true);
    createZebra(0, -13.5, true);
    createZebra(13.5, 0, false);
    createZebra(-13.5, 0, false);

    // 6. Traffic Light Gantries at 4 corners with Digital Countdown Displays
    const lamps: Record<
      string,
      {
        red: THREE.Mesh;
        yellow: THREE.Mesh;
        green: THREE.Mesh;
        timerMesh?: THREE.Mesh;
        timerCanvas?: HTMLCanvasElement;
        timerTexture?: THREE.CanvasTexture;
      }
    > = {};

    const createTimerTexture = (text: string, color: string, borderColor: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(5, 5, 8, 0.9)';
        ctx.fillRect(0, 0, 256, 128);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 248, 120);

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

    const createTrafficSignalPost = (
      dir: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST',
      posX: number,
      posZ: number,
      rotY: number
    ) => {
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

      lamps[dir] = {
        red: redLens,
        yellow: yellowLens,
        green: greenLens,
        timerMesh: timerScreen,
        timerCanvas,
        timerTexture,
      };
    };

    createTrafficSignalPost('NORTH', -9, 10, Math.PI);
    createTrafficSignalPost('SOUTH', 9, -10, 0);
    createTrafficSignalPost('EAST', 10, 9, Math.PI / 2);
    createTrafficSignalPost('WEST', -10, -9, -Math.PI / 2);
    signalLampsRef.current = lamps;

    // 7. Spawn Dynamic 3D Vehicles (VIP, Police, Ambulance, Bus, Car, Truck)
    const vehicles: Vehicle3D[] = [];
    const carColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xe2e8f0, 0x0f172a];

    const createVehicle = (
      dir: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST',
      startDist: number,
      type: 'CAR' | 'BUS' | 'AMBULANCE' | 'VIP' | 'POLICE' | 'FIRE_TRUCK' | 'TRUCK' | 'BIKE' = 'CAR'
    ): Vehicle3D => {
      const carGroup = new THREE.Group();
      const sirenMeshes: THREE.Mesh[] = [];

      let width = 2.2;
      let length = 4.4;
      let height = 1.5;
      let bodyColor = carColors[Math.floor(Math.random() * carColors.length)];
      let speed = 0.28 + Math.random() * 0.1;
      const isEmergency = type === 'AMBULANCE' || type === 'POLICE' || type === 'VIP' || type === 'FIRE_TRUCK';

      if (type === 'BUS') {
        width = 3.0;
        length = 7.5;
        height = 3.2;
        bodyColor = 0x0284c7;
        speed = 0.22;
      } else if (type === 'TRUCK') {
        width = 3.2;
        length = 8.0;
        height = 3.4;
        bodyColor = 0xb45309;
        speed = 0.20;
      } else if (type === 'AMBULANCE') {
        width = 2.7;
        length = 6.0;
        height = 2.6;
        bodyColor = 0xffffff;
        speed = 0.48;
      } else if (type === 'VIP') {
        // Obsidian Black Armored Executive Limousine
        width = 2.5;
        length = 6.0;
        height = 1.65;
        bodyColor = 0x050508;
        speed = 0.50;
      } else if (type === 'POLICE') {
        width = 2.3;
        length = 4.8;
        height = 1.6;
        bodyColor = 0x0f172a;
        speed = 0.46;
      } else if (type === 'FIRE_TRUCK') {
        width = 3.2;
        length = 8.2;
        height = 3.2;
        bodyColor = 0xdc2626;
        speed = 0.40;
      }

      // Car Body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, length),
        new THREE.MeshStandardMaterial({
          color: bodyColor,
          metalness: type === 'VIP' ? 0.95 : 0.3,
          roughness: type === 'VIP' ? 0.1 : 0.4,
        })
      );
      body.position.y = height / 2 + 0.3;
      body.castShadow = true;
      carGroup.add(body);

      // Cabin / Roof
      if (type === 'CAR' || type === 'VIP' || type === 'POLICE') {
        const cabinMat = new THREE.MeshStandardMaterial({
          color: type === 'VIP' ? 0x020204 : type === 'POLICE' ? 0xffffff : 0x0f172a,
          roughness: 0.1,
        });
        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.85, height * 0.75, length * 0.52),
          cabinMat
        );
        cabin.position.set(0, height + 0.28, -0.2);
        carGroup.add(cabin);
      }

      // Special VIP Gold Emblem & Strobes
      if (type === 'VIP') {
        // Gold Grille
        const grille = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.75, 0.45, 0.2),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
        );
        grille.position.set(0, 0.8, length / 2 + 0.05);
        carGroup.add(grille);

        // Flashing Dual Red/Blue Strobes
        const strobeRed = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.25, 0.35),
          new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 4.0 })
        );
        strobeRed.position.set(-0.4, height + 0.7, 0);
        carGroup.add(strobeRed);
        sirenMeshes.push(strobeRed);

        const strobeBlue = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.25, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x0066ff, emissiveIntensity: 4.0 })
        );
        strobeBlue.position.set(0.4, height + 0.7, 0);
        carGroup.add(strobeBlue);
        sirenMeshes.push(strobeBlue);
      }

      // Police Lightbar (Red + Blue)
      if (type === 'POLICE') {
        const barRed = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.25, 0.45),
          new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 3.5 })
        );
        barRed.position.set(-0.4, height + 0.7, 0);
        carGroup.add(barRed);
        sirenMeshes.push(barRed);

        const barBlue = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.25, 0.45),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x0066ff, emissiveIntensity: 3.5 })
        );
        barBlue.position.set(0.4, height + 0.7, 0);
        carGroup.add(barBlue);
        sirenMeshes.push(barBlue);
      }

      // Ambulance Siren Light
      if (type === 'AMBULANCE') {
        const siren = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.4, 0.8),
          new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 4.0 })
        );
        siren.position.set(0, height + 0.45, 0);
        carGroup.add(siren);
        sirenMeshes.push(siren);
      }

      // Fire Truck Siren
      if (type === 'FIRE_TRUCK') {
        const fireSiren = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.4, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 4.0 })
        );
        fireSiren.position.set(0, height + 0.45, 0.5);
        carGroup.add(fireSiren);
        sirenMeshes.push(fireSiren);
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
        speed,
        isStopped: false,
        type,
        isEmergency,
        sirenMeshes,
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

    // Helper Spawner function for immediate foreground entrance
    const spawnSpecialPlatoon = (
      road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST',
      vehicleType: string
    ) => {
      if (vehicleType === 'VIP') {
        // Spawn full VIP Motorcade convoy right in immediate foreground view
        const policeLead = createVehicle(road, 24, 'POLICE');
        const vipLimo = createVehicle(road, 16, 'VIP');
        const escortSUV = createVehicle(road, 8, 'POLICE');
        vehiclesRef.current.push(policeLead, vipLimo, escortSUV);
      } else if (vehicleType === 'AMBULANCE') {
        const amb = createVehicle(road, 18, 'AMBULANCE');
        vehiclesRef.current.push(amb);
      } else if (vehicleType === 'POLICE') {
        const pol = createVehicle(road, 18, 'POLICE');
        vehiclesRef.current.push(pol);
      } else if (vehicleType === 'FIRE_TRUCK') {
        const fire = createVehicle(road, 18, 'FIRE_TRUCK');
        vehiclesRef.current.push(fire);
      } else {
        const veh = createVehicle(road, 18, vehicleType as any);
        vehiclesRef.current.push(veh);
      }
    };

    spawnFunctionRef.current = spawnSpecialPlatoon;

    // Listen for Emergency / VIP Dynamic Spawning Events
    const handleSpawnEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      const road = (detail.road || 'SOUTH') as 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
      const vehicleType = (detail.vehicleType || detail.emergencyType || 'VIP') as string;
      spawnSpecialPlatoon(road, vehicleType);
    };

    window.addEventListener('trafix:emergency:spawn', handleSpawnEvent);
    window.addEventListener('trafix:simulation:command', handleSpawnEvent);

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

      // Animate Siren Strobes (Alternating Red/Blue Flashing)
      const sirenTime = Date.now() * 0.012;
      const strobeActive = Math.sin(sirenTime) > 0;

      for (const veh of vehiclesRef.current) {
        if (veh.sirenMeshes && veh.sirenMeshes.length > 0) {
          veh.sirenMeshes.forEach((mesh, idx) => {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
              mat.emissiveIntensity = (idx % 2 === 0 ? strobeActive : !strobeActive) ? 4.0 : 0.2;
            }
          });
        }

        const isCurrentRoadGreen = activeDirection === veh.direction && currentPhase === 'GREEN';

        // Check distance to stop line (stop line is at distance ~11)
        const currentDist =
          veh.direction === 'NORTH'
            ? veh.mesh.position.z
            : veh.direction === 'SOUTH'
              ? -veh.mesh.position.z
              : veh.direction === 'EAST'
                ? veh.mesh.position.x
                : -veh.mesh.position.x;

        const isApproachingStopLine = currentDist > 10 && currentDist < 16;

        // Emergency vehicles with priority pre-emption bypass red stops if road is green or cleared
        if (!isCurrentRoadGreen && isApproachingStopLine && !veh.isEmergency) {
          veh.isStopped = true;
        } else {
          veh.isStopped = false;
          // Move vehicle forward
          if (veh.direction === 'NORTH') {
            veh.mesh.position.z -= veh.speed;
            if (veh.mesh.position.z < -75) veh.mesh.position.z = 75;
          } else if (veh.direction === 'SOUTH') {
            veh.mesh.position.z += veh.speed;
            if (veh.mesh.position.z > 75) veh.mesh.position.z = -75;
          } else if (veh.direction === 'EAST') {
            veh.mesh.position.x -= veh.speed;
            if (veh.mesh.position.x < -75) veh.mesh.position.x = 75;
          } else if (veh.direction === 'WEST') {
            veh.mesh.position.x += veh.speed;
            if (veh.mesh.position.x > 75) veh.mesh.position.x = -75;
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
      window.removeEventListener('trafix:emergency:spawn', handleSpawnEvent);
      window.removeEventListener('trafix:simulation:command', handleSpawnEvent);
      renderer.dispose();
    };
  }, []);

  // Guarantee Emergency / VIP Spawning whenever activeEmergency prop is present
  useEffect(() => {
    if (activeEmergency && spawnFunctionRef.current) {
      const road = (activeEmergency.direction || 'SOUTH') as 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
      const vType = activeEmergency.vehicleType || 'VIP';
      spawnFunctionRef.current(road, vType);
    }
  }, [activeEmergency]);

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
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
              cameraView === 'ISOMETRIC' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Isometric
          </button>
          <button
            onClick={() => setCameraPreset('TOP_DOWN')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
              cameraView === 'TOP_DOWN' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => setCameraPreset('DRIVER')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
              cameraView === 'DRIVER' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Driver
          </button>
          <button
            onClick={() => setCameraPreset('ORBIT')}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
              cameraView === 'ORBIT' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Orbit 360°
          </button>
        </div>
      </div>

      {/* Bottom Floating Stats */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none text-white text-xs font-mono">
        <div className="bg-[#080e1a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 pointer-events-auto">
          <span>
            Active Vehicles in Scene: <strong>{totalVehicles}</strong>
          </span>
        </div>
        <div className="bg-[#080e1a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-emerald-400 font-bold pointer-events-auto">
          <span>WebGL 60 FPS • Real-Time Physics</span>
        </div>
      </div>
    </div>
  );
};
