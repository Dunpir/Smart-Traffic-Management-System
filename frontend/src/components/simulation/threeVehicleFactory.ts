import * as THREE from 'three';
import { SimVehicleType } from '../../types/simulation';

export interface Vehicle3DRecord {
  id: string;
  group: THREE.Group;
  type: SimVehicleType;
  wheels: THREE.Mesh[];
  beaconMesh?: THREE.Mesh;
  beaconLight?: THREE.PointLight;
  brakeLights: THREE.Mesh[];
  headlights: THREE.SpotLight[];
}

// 1. Shared Realistic Automotive PBR Materials
const tireMat = new THREE.MeshStandardMaterial({
  color: 0x18181b,
  roughness: 0.85,
  metalness: 0.15,
});

const alloyRimMat = new THREE.MeshStandardMaterial({
  color: 0xd4d4d8,
  metalness: 0.85,
  roughness: 0.22,
});

const brakeDiscMat = new THREE.MeshStandardMaterial({
  color: 0x71717a,
  metalness: 0.88,
  roughness: 0.3,
});

const brakeCaliperMat = new THREE.MeshStandardMaterial({
  color: 0xdc2626,
  metalness: 0.45,
  roughness: 0.3,
});

const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  metalness: 0.94,
  roughness: 0.1,
});

const darkTrimMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.65,
  metalness: 0.25,
});

const tintedGlassMat = new THREE.MeshStandardMaterial({
  color: 0x090d16,
  roughness: 0.12,
  metalness: 0.35,
  transparent: true,
  opacity: 0.85,
});

const ledHeadlightMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const drlWhiteGlowMat = new THREE.MeshBasicMaterial({
  color: 0xe0f2fe,
});

const ledTaillightMat = new THREE.MeshStandardMaterial({
  color: 0x3f0505,
  emissive: 0xef4444,
  emissiveIntensity: 0.75,
  roughness: 0.3,
});

const amberIndicatorMat = new THREE.MeshStandardMaterial({
  color: 0x78350f,
  emissive: 0xf59e0b,
  emissiveIntensity: 1.2,
  roughness: 0.3,
});

const licensePlateMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.45,
});

const exhaustMat = new THREE.MeshStandardMaterial({
  color: 0x52525b,
  metalness: 0.8,
  roughness: 0.3,
});

/**
 * Creates a high-fidelity multi-part alloy wheel with pre-rotated geometry
 * so w.rotation.x += delta rolls purely around the horizontal axle with ZERO wobble or tilt.
 */
function createHighDetailWheel(
  radius: number,
  width: number,
  isLeft: boolean
): { wheelMesh: THREE.Mesh; group: THREE.Group } {
  const group = new THREE.Group();

  // 1. Outer Rubber Tire (pre-aligned with X axis for pure rotation around axle)
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  tireGeo.rotateZ(Math.PI / 2);

  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  group.add(tire);

  // 2. Alloy Wheel Rim
  const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width * 1.02, 18);
  rimGeo.rotateZ(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, alloyRimMat);
  tire.add(rim);

  const outerX = isLeft ? -width * 0.48 : width * 0.48;
  const innerX = isLeft ? width * 0.24 : -width * 0.24;

  // 3. 5-Spoke Star Rim Face radiating out in the Y-Z plane
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const spokeGeo = new THREE.BoxGeometry(width * 0.08, radius * 0.66, radius * 0.16);
    const spoke = new THREE.Mesh(spokeGeo, alloyRimMat);
    spoke.position.x = outerX;
    spoke.rotation.x = angle;
    tire.add(spoke);
  }

  // 4. Center Chrome Hub Cap
  const hubGeo = new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, width * 0.1, 14);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, chromeMat);
  hub.position.x = outerX + (isLeft ? -0.01 : 0.01);
  tire.add(hub);

  // 5. Disc Brake Rotor (Fixed in group, does NOT spin with tire)
  const discGeo = new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, width * 0.18, 16);
  discGeo.rotateZ(Math.PI / 2);
  const disc = new THREE.Mesh(discGeo, brakeDiscMat);
  disc.position.x = innerX;
  group.add(disc);

  // 6. Red Brembo-Style Caliper (Fixed in group)
  const caliperGeo = new THREE.BoxGeometry(width * 0.3, radius * 0.34, radius * 0.2);
  const caliper = new THREE.Mesh(caliperGeo, brakeCaliperMat);
  caliper.position.set(innerX, radius * 0.36, 0);
  group.add(caliper);

  return { wheelMesh: tire, group };
}

/**
 * Builds high-fidelity procedural 3D vehicles with authentic styling, proportions, and lighting
 */
export function buildHighDetail3DVehicle(
  type: SimVehicleType,
  paintColorHex: number,
  isEmergency: boolean,
  isNightMode: boolean
): Vehicle3DRecord {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const headlights: THREE.SpotLight[] = [];
  const brakeLights: THREE.Mesh[] = [];

  let beaconMesh: THREE.Mesh | undefined;
  let beaconLight: THREE.PointLight | undefined;

  // Custom Automotive Paint Material
  const isVip = type === 'VIP';
  const isTaxi = type === 'TAXI';
  const actualPaintColor = isVip ? 0x090d16 : isTaxi ? 0xf59e0b : paintColorHex;

  const carPaintMat = new THREE.MeshStandardMaterial({
    color: actualPaintColor,
    metalness: isVip ? 0.85 : 0.55,
    roughness: isVip ? 0.15 : 0.28,
  });

  const addWheelInstance = (x: number, y: number, z: number, radius = 0.52, width = 0.32) => {
    const isLeft = x < 0;
    const { wheelMesh, group: wGroup } = createHighDetailWheel(radius, width, isLeft);
    wGroup.position.set(x, y, z);
    group.add(wGroup);
    wheels.push(wheelMesh);

    // Inner dark wheel-well arch liner inside fender
    const archGeo = new THREE.CylinderGeometry(radius * 1.18, radius * 1.18, width * 1.12, 14, 1, false, 0, Math.PI);
    archGeo.rotateZ(Math.PI / 2);
    const arch = new THREE.Mesh(archGeo, darkTrimMat);
    arch.position.set(x > 0 ? x - 0.02 : x + 0.02, y + 0.04, z);
    group.add(arch);
  };

  // -------------------------------------------------------------
  // 1. MOTORCYCLE / COMMUTER SCOOTER (Dedicated 2-Wheeled Model)
  // -------------------------------------------------------------
  if (type === 'BIKE') {
    const bikeL = 2.4;
    const bikeW = 0.85;
    const wheelR = 0.44;
    const wheelW = 0.16;

    // Front & Rear In-Line Wheels
    const frontWheel = createHighDetailWheel(wheelR, wheelW, true);
    frontWheel.group.position.set(0, wheelR, 0.95);
    group.add(frontWheel.group);
    wheels.push(frontWheel.wheelMesh);

    const rearWheel = createHighDetailWheel(wheelR, wheelW, false);
    rearWheel.group.position.set(0, wheelR, -0.95);
    group.add(rearWheel.group);
    wheels.push(rearWheel.wheelMesh);

    // Tubular Motorcycle Frame & Swingarm
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const swingarm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 1.1), frameMat);
    swingarm.position.set(0, wheelR + 0.06, -0.45);
    group.add(swingarm);

    // Engine Crankcase & Air Cooling Fins
    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.55), alloyRimMat);
    engineBlock.position.set(0, 0.48, -0.05);
    group.add(engineBlock);

    // Angled Chrome Exhaust Pipe & Muffler
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.2, 12), chromeMat);
    exhaust.rotation.x = -Math.PI / 2 + 0.18;
    exhaust.position.set(0.24, 0.42, -0.65);
    group.add(exhaust);

    // Sculpted Teardrop Fuel Tank (in vehicle paint color)
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.72), carPaintMat);
    tank.position.set(0, 0.86, 0.25);
    tank.castShadow = true;
    group.add(tank);

    // Ergonomic Stepped Leather Seat
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.78), seatMat);
    seat.position.set(0, 0.84, -0.42);
    group.add(seat);

    // Front Steering Fork & Fender
    const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8), chromeMat);
    forkL.rotation.x = 0.28;
    forkL.position.set(-0.14, 0.75, 0.78);
    group.add(forkL);

    const forkR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8), chromeMat);
    forkR.rotation.x = 0.28;
    forkR.position.set(0.14, 0.75, 0.78);
    group.add(forkR);

    // Front Mudguard Fender
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.52), carPaintMat);
    fender.position.set(0, wheelR + 0.16, 0.92);
    group.add(fender);

    // Chrome Handlebars & Grips
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, bikeW * 0.88, 8), chromeMat);
    handlebar.rotateZ(Math.PI / 2);
    handlebar.position.set(0, 1.12, 0.65);
    group.add(handlebar);

    // Dual Rearview Mirrors
    [-0.32, 0.32].forEach((mx) => {
      const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), darkTrimMat);
      mirror.rotateX(Math.PI / 2);
      mirror.position.set(mx, 1.25, 0.62);
      group.add(mirror);
    });

    // Circular Projector LED Headlamp
    const headlamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), chromeMat);
    headlamp.rotateX(Math.PI / 2);
    headlamp.position.set(0, 0.94, 1.05);
    group.add(headlamp);

    const headlampLens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), ledHeadlightMat);
    headlampLens.position.set(0, 0.94, 1.12);
    group.add(headlampLens);

    // Taillight on rear fender
    const tailLens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.04), ledTaillightMat);
    tailLens.position.set(0, 0.72, -1.05);
    group.add(tailLens);
    brakeLights.push(tailLens);

    // Tiny license plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.02), licensePlateMat);
    plate.position.set(0, 0.58, -1.06);
    group.add(plate);

    // Headlight SpotLight
    const spot = new THREE.SpotLight(0xffffff, isNightMode ? 4.5 : 0.0, 36, Math.PI / 6, 0.4, 1.2);
    spot.position.set(0, 0.95, 1.15);
    spot.target.position.set(0, 0.2, 14);
    group.add(spot);
    group.add(spot.target);
    headlights.push(spot);

    return { id: '', group, type, wheels, brakeLights, headlights };
  }

  // -------------------------------------------------------------
  // 2. EMERGENCY VEHICLES: AMBULANCE & HEAVY FIRE PUMPER ENGINE
  // -------------------------------------------------------------
  if (isEmergency || type === 'AMBULANCE' || type === 'FIRE_TRUCK') {
    if (type === 'FIRE_TRUCK') {
      const truckL = 8.2;
      const truckW = 2.55;
      const truckH = 2.85;

      const firePaintMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        metalness: 0.5,
        roughness: 0.24,
      });

      // Cab Chassis with Raked Windshield
      const cab = new THREE.Mesh(new THREE.BoxGeometry(truckW, 1.85, 2.6), firePaintMat);
      cab.position.set(0, 1.55, 2.2);
      cab.castShadow = true;
      group.add(cab);

      // Angled Windshield
      const cabWindshield = new THREE.Mesh(new THREE.BoxGeometry(truckW * 0.94, 0.9, 0.08), tintedGlassMat);
      cabWindshield.rotation.x = -0.16;
      cabWindshield.position.set(0, 1.95, 3.25);
      group.add(cabWindshield);

      // Massive Chrome Front Grille & Siren Horns
      const fgrille = new THREE.Mesh(new THREE.BoxGeometry(truckW * 0.88, 0.75, 0.35), chromeMat);
      fgrille.position.set(0, 1.05, 3.52);
      group.add(fgrille);

      // Diamond-Plate Heavy Equipment Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(truckW, 2.35, 4.8), firePaintMat);
      body.position.set(0, 1.78, -1.6);
      body.castShadow = true;
      group.add(body);

      // Aluminum Roll-Up Equipment Compartment Shutters
      [-truckW / 2 - 0.02, truckW / 2 + 0.02].forEach((sx) => {
        for (let sz = -3.2; sz <= 0.2; sz += 1.4) {
          const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 1.15), alloyRimMat);
          shutter.position.set(sx, 1.65, sz);
          group.add(shutter);
        }
      });

      // Dual Rooftop Ladders
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 5.2), alloyRimMat);
      ladder.position.set(-0.65, truckH + 0.62, -1.5);
      group.add(ladder);

      // High-Pressure Water Cannon (Deck Gun)
      const monitor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.7, 12), chromeMat);
      monitor.position.set(0.65, truckH + 0.7, -0.5);
      group.add(monitor);

      // Dual High-Intensity Emergency Lightbars
      beaconMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.32, 0.55), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      beaconMesh.position.set(0, 2.95, 2.2);
      group.add(beaconMesh);

      beaconLight = new THREE.PointLight(0xef4444, 4.8, 26);
      beaconLight.position.set(0, 3.4, 2.2);
      group.add(beaconLight);

      // Heavy 6-Wheel Axle Configuration
      [-1.25, 1.25].forEach((wx) => {
        addWheelInstance(wx, 0.6, 2.2, 0.6, 0.38);
        addWheelInstance(wx, 0.6, -1.5, 0.6, 0.38);
        addWheelInstance(wx, 0.6, -3.1, 0.6, 0.38);
      });
    } else {
      // PARAMEDIC RESCUE AMBULANCE (Type III Modular)
      const ambW = 2.45;
      const ambH = 2.65;

      const ambWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.25,
        roughness: 0.28,
      });

      // 1. Aerodynamic Driver Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.94, 1.85, 2.3), ambWhiteMat);
      cab.position.set(0, 1.48, 1.95);
      cab.castShadow = true;
      group.add(cab);

      // Sloped Cab Windshield
      const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.92, 0.82, 0.08), tintedGlassMat);
      cabGlass.rotation.x = -0.22;
      cabGlass.position.set(0, 1.85, 2.85);
      group.add(cabGlass);

      // Cab-to-Box Aerodynamic Transition Fairing
      const fairing = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.95, 0.55, 0.8), ambWhiteMat);
      fairing.position.set(0, 2.6, 1.05);
      group.add(fairing);

      // 2. Paramedic Module Treatment Box
      const box = new THREE.Mesh(new THREE.BoxGeometry(ambW, ambH, 4.0), ambWhiteMat);
      box.position.set(0, 1.82, -1.05);
      box.castShadow = true;
      group.add(box);

      // High-Visibility Reflective Safety Stripe (Red)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(ambW + 0.04, 0.45, 3.95), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      stripe.position.set(0, 1.58, -1.05);
      group.add(stripe);

      // Blue Paramedic Star of Life Badges
      const starGeo = new THREE.BoxGeometry(0.04, 0.55, 0.55);
      const starMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      [-ambW / 2 - 0.03, ambW / 2 + 0.03].forEach((sx) => {
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(sx, 2.2, -1.05);
        group.add(star);
      });

      // Dual Rooftop Emergency Strobes
      beaconMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 0.48), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      beaconMesh.position.set(0, ambH + 0.65, 1.5);
      group.add(beaconMesh);

      beaconLight = new THREE.PointLight(0x38bdf8, 4.2, 24);
      beaconLight.position.set(0, ambH + 1.15, 1.5);
      group.add(beaconLight);

      // Wheels
      [-1.18, 1.18].forEach((wx) => {
        addWheelInstance(wx, 0.56, 2.0, 0.56, 0.35);
        addWheelInstance(wx, 0.56, -1.5, 0.56, 0.35);
      });
    }
  }

  // -------------------------------------------------------------
  // 3. ELECTRIC TRANSIT CITY BUS
  // -------------------------------------------------------------
  else if (type === 'BUS') {
    const busL = 9.2;
    const busW = 2.55;
    const busH = 3.05;

    const busPaintMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Transit blue
      metalness: 0.4,
      roughness: 0.28,
    });

    const busWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.25,
      roughness: 0.35,
    });

    // 1. Lower Body with Molded Skirts
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(busW, 1.3, busL), busPaintMat);
    lowerBody.position.set(0, 1.1, 0);
    lowerBody.castShadow = true;
    group.add(lowerBody);

    const upperBelt = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.02, 0.35, busL), busWhiteMat);
    upperBelt.position.set(0, 1.85, 0);
    group.add(upperBelt);

    const skirt = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.04, 0.3, busL), darkTrimMat);
    skirt.position.set(0, 0.42, 0);
    group.add(skirt);

    // 2. Panoramic Side Window Ribbons
    const glassRibbon = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.04, 0.95, busL - 0.5), tintedGlassMat);
    glassRibbon.position.set(0, 2.38, 0);
    group.add(glassRibbon);

    // Vertical Window Mullions
    for (let z = -busL / 2 + 1.2; z <= busL / 2 - 1.2; z += 1.5) {
      [-busW / 2 - 0.03, busW / 2 + 0.03].forEach((wx) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.98, 0.1), darkTrimMat);
        pillar.position.set(wx, 2.38, z);
        group.add(pillar);
      });
    }

    // 3. Curved Panoramic Front Windshield
    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.94, 1.15, 0.08), tintedGlassMat);
    frontWindshield.rotation.x = -0.15;
    frontWindshield.position.set(0, 2.28, busL / 2 - 0.1);
    group.add(frontWindshield);

    // Dual Windshield Wipers
    [-0.45, 0.45].forEach((wx) => {
      const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.44, 0.04), darkTrimMat);
      wiper.rotation.z = 0.32;
      wiper.rotation.x = -0.15;
      wiper.position.set(wx, 1.9, busL / 2 + 0.02);
      group.add(wiper);
    });

    // 4. Aerodynamic Side Mirrors
    [-busW / 2 - 0.28, busW / 2 + 0.28].forEach((mx) => {
      const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), darkTrimMat);
      mirrorArm.position.set(mx > 0 ? mx - 0.12 : mx + 0.12, 2.38, busL / 2 - 0.4);
      group.add(mirrorArm);

      const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.08), darkTrimMat);
      mirrorHead.position.set(mx, 2.32, busL / 2 - 0.35);
      group.add(mirrorHead);
    });

    // 5. Crowned Roof with Battery & AC Fairing
    const roof = new THREE.Mesh(new THREE.BoxGeometry(busW, 0.35, busL), busWhiteMat);
    roof.position.set(0, busH, 0);
    roof.castShadow = true;
    group.add(roof);

    const acPod = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.72, 0.4, 3.4), darkTrimMat);
    acPod.position.set(0, busH + 0.32, -0.6);
    group.add(acPod);

    // LED Amber Destination Board
    const destSignMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const destSign = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.72, 0.26, 0.05), destSignMat);
    destSign.position.set(0, busH - 0.15, busL / 2 + 0.02);
    group.add(destSign);

    // Wheels
    [-1.22, 1.22].forEach((wx) => {
      addWheelInstance(wx, 0.58, busL * 0.32, 0.58, 0.36);
      addWheelInstance(wx, 0.58, -busL * 0.28, 0.58, 0.36);
    });
  }

  // -------------------------------------------------------------
  // 4. COMMERCIAL FREIGHT CARGO TRUCK
  // -------------------------------------------------------------
  else if (type === 'TRUCK') {
    const truckW = 2.45;
    const cabL = 2.1;
    const boxL = 5.4;

    // 1. Cab-Over Tractor
    const cab = new THREE.Mesh(new THREE.BoxGeometry(truckW, 2.2, cabL), carPaintMat);
    cab.position.set(0, 1.6, 1.45);
    cab.castShadow = true;
    group.add(cab);

    // Windshield & Sun Visor
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(truckW * 0.94, 0.88, 0.08), tintedGlassMat);
    windshield.rotation.x = -0.12;
    windshield.position.set(0, 1.9, 2.4);
    group.add(windshield);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.06, 0.12, 0.38), darkTrimMat);
    visor.position.set(0, 2.42, 2.2);
    group.add(visor);

    // Vertical Chrome Exhaust Stack
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 12), chromeMat);
    exhaust.position.set(truckW / 2 + 0.08, 2.15, 0.5);
    group.add(exhaust);

    // 2. Corrugated Cargo Box
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5, metalness: 0.2 });
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.08, 2.75, boxL), boxMat);
    cargo.position.set(0, 2.0, -2.15);
    cargo.castShadow = true;
    group.add(cargo);

    // Cylindrical Aluminum Fuel Tanks
    [-truckW / 2 - 0.02, truckW / 2 + 0.02].forEach((fx) => {
      const tankGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.4, 14);
      tankGeo.rotateZ(Math.PI / 2);
      const tank = new THREE.Mesh(tankGeo, alloyRimMat);
      tank.position.set(fx, 0.68, 0.3);
      group.add(tank);
    });

    [-1.2, 1.2].forEach((wx) => {
      addWheelInstance(wx, 0.58, 1.45, 0.58, 0.36);
      addWheelInstance(wx, 0.58, -1.8, 0.58, 0.36);
      addWheelInstance(wx, 0.58, -3.4, 0.58, 0.36);
    });
  }

  // -------------------------------------------------------------
  // 5. PASSENGER CARS: SEDAN, SUV, TAXI, VIP LIMOUSINE
  // -------------------------------------------------------------
  else {
    const isSuv = type === 'SUV';
    const carL = isSuv ? 4.8 : 4.45;
    const carW = isSuv ? 2.15 : 1.96;
    const carH = isSuv ? 1.68 : 1.36;
    const wheelR = isSuv ? 0.52 : 0.45;
    const wheelY = isSuv ? 0.52 : 0.45;

    // --- A. Lower Chassis Tub & Side Rockers ---
    const chassisH = carH * 0.38;
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(carW, chassisH, carL * 0.74), carPaintMat);
    lowerBody.position.set(0, wheelY + chassisH / 2 - 0.02, -0.05);
    lowerBody.castShadow = true;
    group.add(lowerBody);

    // Dark Underbody Rocker Skirts (prevents toy-box look, adds grounding shadow)
    const rocker = new THREE.Mesh(new THREE.BoxGeometry(carW + 0.04, 0.12, carL * 0.78), darkTrimMat);
    rocker.position.set(0, 0.36, -0.05);
    group.add(rocker);

    // --- B. Sculpted Aerodynamic Sloping Front Hood ---
    const hoodL = carL * 0.28;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.94, 0.14, hoodL), carPaintMat);
    hood.rotation.x = isSuv ? -0.08 : -0.15; // Slopes forward naturally toward nose!
    hood.position.set(0, wheelY + chassisH + (isSuv ? 0.04 : 0.02), carL * 0.28);
    hood.castShadow = true;
    group.add(hood);

    // Twin Sculpted Hood Character Creases
    [-carW * 0.32, carW * 0.32].forEach((hx) => {
      const crease = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, hoodL * 0.9), carPaintMat);
      crease.rotation.x = isSuv ? -0.08 : -0.15;
      crease.position.set(hx, wheelY + chassisH + 0.08, carL * 0.28);
      group.add(crease);
    });

    // --- C. Sculpted Aerodynamic Front Bumper & Nose ---
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.98, chassisH * 0.95, 0.45), carPaintMat);
    frontBumper.position.set(0, wheelY + chassisH / 2 - 0.04, carL / 2 - 0.12);
    frontBumper.castShadow = true;
    group.add(frontBumper);

    // Lower Air Dam / Honeycomb Grille
    const fGrille = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.72, 0.22, 0.08), darkTrimMat);
    fGrille.position.set(0, 0.45, carL / 2 + 0.12);
    group.add(fGrille);

    // Front License Plate
    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.04), licensePlateMat);
    frontPlate.position.set(0, 0.45, carL / 2 + 0.16);
    group.add(frontPlate);

    // --- D. Aerodynamic Greenhouse (Windshield, Roof, Windows & Rear Glass) ---
    const cabinW = carW * 0.88;
    const cabinH = carH * 0.48;
    const cabinZ = -carL * 0.05;

    // 1. Raked Front Windshield (Angled dynamically backward)
    const windshieldW = cabinW * 0.96;
    const windshieldH = isSuv ? 0.82 : 0.92;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(windshieldW, windshieldH, 0.06), tintedGlassMat);
    windshield.rotation.x = isSuv ? -0.42 : -0.58;
    windshield.position.set(0, wheelY + chassisH + cabinH * 0.48, carL * 0.14);
    group.add(windshield);

    // Black Structural A-Pillars flanking windshield
    [-windshieldW / 2 + 0.02, windshieldW / 2 - 0.02].forEach((px) => {
      const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.06, windshieldH * 1.02, 0.08), darkTrimMat);
      aPillar.rotation.x = isSuv ? -0.42 : -0.58;
      aPillar.position.set(px, wheelY + chassisH + cabinH * 0.48, carL * 0.14);
      group.add(aPillar);
    });

    // 2. Crowned Aerodynamic Roof Panel
    const roofL = isSuv ? carL * 0.54 : carL * 0.38;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(cabinW, 0.08, roofL), carPaintMat);
    roof.position.set(0, carH + 0.04, cabinZ + (isSuv ? -carL * 0.03 : 0));
    roof.castShadow = true;
    group.add(roof);

    // 3. Raked Rear Backlight Glass (Angled down to meet trunk deck)
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.92, isSuv ? 0.72 : 0.88, 0.06), tintedGlassMat);
    rearGlass.rotation.x = isSuv ? 0.22 : 0.54;
    rearGlass.position.set(0, wheelY + chassisH + cabinH * 0.46, cabinZ - roofL / 2 - (isSuv ? 0.2 : 0.32));
    group.add(rearGlass);

    // 4. Tinted Side Windows with Structural B-Pillars
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW + 0.02, cabinH * 0.84, roofL * 1.1), tintedGlassMat);
    sideGlass.position.set(0, wheelY + chassisH + cabinH * 0.45, cabinZ);
    group.add(sideGlass);

    // Gloss Black B-Pillar Dividing Front and Rear Door Glass
    [-cabinW / 2 - 0.02, cabinW / 2 + 0.02].forEach((bx) => {
      const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.04, cabinH * 0.86, 0.12), darkTrimMat);
      bPillar.position.set(bx, wheelY + chassisH + cabinH * 0.45, cabinZ);
      group.add(bPillar);
    });

    // --- E. Rear Trunk Deck & Aerodynamic Rear Fascia ---
    if (!isSuv) {
      // Sedan Flat Trunk Deck extending to tail
      const trunkL = carL * 0.22;
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.92, 0.12, trunkL), carPaintMat);
      trunk.position.set(0, wheelY + chassisH * 0.92, -carL * 0.36);
      trunk.castShadow = true;
      group.add(trunk);
    }

    // Sculpted Rear Bumper
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.98, chassisH * 0.95, 0.45), carPaintMat);
    rearBumper.position.set(0, wheelY + chassisH / 2 - 0.04, -carL / 2 + 0.12);
    rearBumper.castShadow = true;
    group.add(rearBumper);

    // Rear Aero Diffuser & Dual Exhaust Tips
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.75, 0.16, 0.12), darkTrimMat);
    diffuser.position.set(0, 0.42, -carL / 2 - 0.1);
    group.add(diffuser);

    [-carW * 0.28, carW * 0.28].forEach((ex) => {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12), chromeMat);
      tip.rotateX(Math.PI / 2);
      tip.position.set(ex, 0.42, -carL / 2 - 0.14);
      group.add(tip);
    });

    // Rear License Plate
    const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.04), licensePlateMat);
    rearPlate.position.set(0, 0.62, -carL / 2 - 0.12);
    group.add(rearPlate);

    // --- F. Aerodynamic Side Rearview Mirrors ---
    [-carW / 2 - 0.14, carW / 2 + 0.14].forEach((mx) => {
      const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), darkTrimMat);
      mirrorArm.position.set(mx > 0 ? mx - 0.07 : mx + 0.07, wheelY + chassisH + 0.04, carL * 0.14);
      group.add(mirrorArm);

      const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.22), carPaintMat);
      mirrorHousing.position.set(mx, wheelY + chassisH + 0.05, carL * 0.14);
      group.add(mirrorHousing);

      // Glass face
      const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.18), chromeMat);
      mirrorGlass.position.set(mx > 0 ? mx - 0.06 : mx + 0.06, wheelY + chassisH + 0.05, carL * 0.14);
      group.add(mirrorGlass);
    });

    // --- G. Special Upgrades for SUV, Taxi, and VIP ---
    if (isSuv) {
      // Rugged Satin Silver Roof Rails
      [-cabinW / 2 + 0.06, cabinW / 2 - 0.06].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, roofL * 0.94), alloyRimMat);
        rail.position.set(rx, carH + 0.1, cabinZ - carL * 0.03);
        group.add(rail);
      });

      // Front & Rear Silver Skid Plates
      const frontSkid = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.62, 0.14, 0.22), alloyRimMat);
      frontSkid.position.set(0, 0.38, carL / 2 + 0.14);
      group.add(frontSkid);

      const rearSkid = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.62, 0.14, 0.22), alloyRimMat);
      rearSkid.position.set(0, 0.38, -carL / 2 - 0.12);
      group.add(rearSkid);
    }

    if (isTaxi) {
      // Streamlined Glowing Taxi Dome Sign
      const taxiSignMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.18, 0.26), taxiSignMat);
      taxiSign.position.set(0, carH + 0.16, cabinZ);
      group.add(taxiSign);
    }

    if (isVip) {
      // Chrome Window Beltline Trim
      [-cabinW / 2 - 0.03, cabinW / 2 + 0.03].forEach((cx) => {
        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, roofL * 1.15), chromeMat);
        trim.position.set(cx, wheelY + chassisH + 0.02, cabinZ);
        group.add(trim);
      });
    }

    // 4 Wheels
    [-carW / 2 + 0.06, carW / 2 - 0.06].forEach((wx) => {
      addWheelInstance(wx, wheelY, carL * 0.29, wheelR, 0.32);
      addWheelInstance(wx, wheelY, -carL * 0.29, wheelR, 0.32);
    });
  }

  // -------------------------------------------------------------
  // 6. COMMON AUTOMOTIVE LIGHTING & LIGHTBAR SYSTEMS
  // -------------------------------------------------------------
  let frontZ = 2.28;
  let backZ = -2.28;
  let lightOffsetX = 0.82;
  let lightY = 0.72;

  if (type === 'BUS') {
    frontZ = 4.62;
    backZ = -4.62;
    lightOffsetX = 1.08;
    lightY = 0.95;
  } else if (type === 'TRUCK') {
    frontZ = 2.52;
    backZ = -4.88;
    lightOffsetX = 1.05;
    lightY = 0.88;
  } else if (type === 'AMBULANCE') {
    frontZ = 3.12;
    backZ = -3.08;
    lightOffsetX = 1.02;
    lightY = 0.88;
  } else if (type === 'FIRE_TRUCK') {
    frontZ = 4.12;
    backZ = -4.02;
    lightOffsetX = 1.12;
    lightY = 0.98;
  } else if (type === 'SUV') {
    frontZ = 2.45;
    backZ = -2.45;
    lightOffsetX = 0.94;
    lightY = 0.82;
  }

  // Left & Right Front LED Headlights with Daytime Running Light Blades
  [-lightOffsetX, lightOffsetX].forEach((lx) => {
    // Projector lens
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.06), ledHeadlightMat);
    lens.position.set(lx, lightY, frontZ + 0.02);
    group.add(lens);

    // Glowing White DRL Eyebrow Blade
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.07), drlWhiteGlowMat);
    drl.position.set(lx, lightY + 0.09, frontZ + 0.03);
    group.add(drl);

    // Amber Turn Indicator
    const amber = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), amberIndicatorMat);
    amber.position.set(lx > 0 ? lx + 0.18 : lx - 0.18, lightY, frontZ + 0.02);
    group.add(amber);

    // Forward SpotLight Beam (illuminates road during Night mode)
    const spot = new THREE.SpotLight(0xffffff, isNightMode ? 4.8 : 0.0, 42, Math.PI / 5, 0.35, 1.2);
    spot.position.set(lx, lightY, frontZ + 0.1);
    spot.target.position.set(lx, 0.1, frontZ + 18);
    group.add(spot);
    group.add(spot.target);
    headlights.push(spot);
  });

  // Modern Continuous LED Rear Taillight Lightbar & Brake Lamps
  const lightbar = new THREE.Mesh(new THREE.BoxGeometry(lightOffsetX * 2 + 0.4, 0.12, 0.06), ledTaillightMat);
  lightbar.position.set(0, lightY, backZ - 0.02);
  group.add(lightbar);
  brakeLights.push(lightbar);

  // Outer High-Intensity Brake Pods
  [-lightOffsetX, lightOffsetX].forEach((bx) => {
    const brakePod = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.07), ledTaillightMat);
    brakePod.position.set(bx, lightY, backZ - 0.03);
    group.add(brakePod);
    brakeLights.push(brakePod);
  });

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
}
