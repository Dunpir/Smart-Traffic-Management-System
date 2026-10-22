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

// Shared Realistic Automotive Materials
const tireMat = new THREE.MeshStandardMaterial({
  color: 0x18181b,
  roughness: 0.85,
  metalness: 0.15,
});

const alloyRimMat = new THREE.MeshStandardMaterial({
  color: 0xd4d4d8,
  metalness: 0.8,
  roughness: 0.25,
});

const brakeDiscMat = new THREE.MeshStandardMaterial({
  color: 0x71717a,
  metalness: 0.88,
  roughness: 0.3,
});

const brakeCaliperMat = new THREE.MeshStandardMaterial({
  color: 0xdc2626,
  metalness: 0.4,
  roughness: 0.35,
});

const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  metalness: 0.92,
  roughness: 0.12,
});

const darkTrimMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.6,
  metalness: 0.2,
});

const tintedGlassMat = new THREE.MeshStandardMaterial({
  color: 0x090d16,
  roughness: 0.15,
  metalness: 0.3,
  transparent: true,
  opacity: 0.82,
});

const ledHeadlightMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const ledTaillightMat = new THREE.MeshStandardMaterial({
  color: 0x3f0505,
  emissive: 0xef4444,
  emissiveIntensity: 0.7,
  roughness: 0.3,
});

const licensePlateMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.5,
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

  // 1. Outer Rubber Tire (cylinder symmetry pre-aligned with X axis)
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

  // Outer and inner coordinate offsets along X
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

  const addWheelInstance = (x: number, y: number, z: number, radius = 0.54, width = 0.34) => {
    const isLeft = x < 0;
    const { wheelMesh, group: wGroup } = createHighDetailWheel(radius, width, isLeft);
    wGroup.position.set(x, y, z);
    // Keep rotation at (0, 0, 0) for both sides to guarantee roll around axle
    group.add(wGroup);
    wheels.push(wheelMesh);

    // Recessed dark wheel arch liner inside car body
    const arch = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.15, radius * 1.15, width * 1.15, 12, 1, false, 0, Math.PI),
      darkTrimMat
    );
    arch.rotateZ(Math.PI / 2);
    arch.position.set(x, y + 0.05, z);
    group.add(arch);
  };

  // Dimensions & Specific Geometry per Vehicle Category
  if (isEmergency || type === 'AMBULANCE' || type === 'FIRE_TRUCK') {
    if (type === 'FIRE_TRUCK') {
      // HEAVY URBAN PUMPER FIRE ENGINE
      const truckL = 7.6;
      const truckW = 2.5;
      const truckH = 2.8;

      const firePaintMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        metalness: 0.5,
        roughness: 0.25,
      });

      // 1. Crew Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(truckW, 2.1, 2.8), firePaintMat);
      cab.position.set(0, 1.65, 1.8);
      cab.castShadow = true;
      group.add(cab);

      // Cab Windshield & Windows
      const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.04, 0.85, 2.2), tintedGlassMat);
      cabGlass.position.set(0, 1.95, 1.85);
      group.add(cabGlass);

      // Chrome Front Bumper & Siren Grille
      const fgrille = new THREE.Mesh(new THREE.BoxGeometry(truckW * 0.92, 0.75, 0.35), chromeMat);
      fgrille.position.set(0, 1.05, 3.25);
      group.add(fgrille);

      // 2. Equipment Rear Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(truckW, 2.3, 4.4), firePaintMat);
      body.position.set(0, 1.75, -1.8);
      body.castShadow = true;
      group.add(body);

      // Diamond-Plate Silver Decking & Shutter Doors
      [-truckW / 2 - 0.02, truckW / 2 + 0.02].forEach((sx) => {
        const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 3.8), alloyRimMat);
        shutter.position.set(sx, 1.7, -1.8);
        group.add(shutter);
      });

      // Rooftop Ladders
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.18, 4.8), alloyRimMat);
      ladder.position.set(-0.6, truckH + 0.65, -1.6);
      group.add(ladder);

      // Rooftop Water Cannon Monitor
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.6, 12), chromeMat);
      cannon.position.set(0.6, truckH + 0.7, -0.6);
      group.add(cannon);

      // Dual Rooftop Emergency Beacons
      beaconMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.32, 0.55), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      beaconMesh.position.set(0, 2.9, 1.8);
      group.add(beaconMesh);

      beaconLight = new THREE.PointLight(0xef4444, 4.5, 24);
      beaconLight.position.set(0, 3.3, 1.8);
      group.add(beaconLight);

      // Heavy 6-Wheel Setup
      [-1.25, 1.25].forEach((wx) => {
        addWheelInstance(wx, 0.58, 2.0, 0.58, 0.38);
        addWheelInstance(wx, 0.58, -1.6, 0.58, 0.38);
        addWheelInstance(wx, 0.58, -3.1, 0.58, 0.38);
      });
    } else {
      // PARAMEDIC RESCUE AMBULANCE (Type III Modular)
      const ambW = 2.4;
      const ambL = 6.0;
      const ambH = 2.6;

      const ambWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.3,
        roughness: 0.3,
      });

      // 1. Driver Cab with Aerodynamic Wind Deflector
      const cab = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.94, 1.8, 2.2), ambWhiteMat);
      cab.position.set(0, 1.45, 1.85);
      cab.castShadow = true;
      group.add(cab);

      // Windshield & Side Windows
      const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.96, 0.8, 1.6), tintedGlassMat);
      cabGlass.position.set(0, 1.72, 1.8);
      group.add(cabGlass);

      // Cab Wind Deflector Transition to Box
      const deflector = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.95, 0.55, 0.8), ambWhiteMat);
      deflector.position.set(0, 2.55, 1.0);
      group.add(deflector);

      // 2. Medical Treatment Box Body
      const box = new THREE.Mesh(new THREE.BoxGeometry(ambW, ambH, 3.8), ambWhiteMat);
      box.position.set(0, 1.8, -1.0);
      box.castShadow = true;
      group.add(box);

      // Hi-Vis Reflective Safety Stripe (Red)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(ambW + 0.04, 0.4, 3.75), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      stripe.position.set(0, 1.55, -1.0);
      group.add(stripe);

      // Blue Paramedic Star of Life Badges on Flanks
      const starGeo = new THREE.BoxGeometry(0.04, 0.55, 0.55);
      const starMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      [-ambW / 2 - 0.03, ambW / 2 + 0.03].forEach((sx) => {
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(sx, 2.15, -1.0);
        group.add(star);
      });

      // Dual Rooftop Strobing Emergency Lightbar
      beaconMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.48), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      beaconMesh.position.set(0, ambH + 0.6, 1.4);
      group.add(beaconMesh);

      beaconLight = new THREE.PointLight(0x38bdf8, 4.0, 22);
      beaconLight.position.set(0, ambH + 1.1, 1.4);
      group.add(beaconLight);

      // Wheels
      [-1.15, 1.15].forEach((wx) => {
        addWheelInstance(wx, 0.55, 1.9, 0.55, 0.34);
        addWheelInstance(wx, 0.55, -1.5, 0.55, 0.34);
      });
    }
  } else if (type === 'BUS') {
    // STREAMLINED ELECTRIC TRANSIT CITY BUS
    const busL = 8.8;
    const busW = 2.5;
    const busH = 2.95;

    const busPaintMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Deep transit blue
      metalness: 0.4,
      roughness: 0.3,
    });

    const busWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.25,
      roughness: 0.35,
    });

    // 1. Lower Body with Sculpted Wheel Arches
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(busW, 1.25, busL), busPaintMat);
    lowerBody.position.set(0, 1.05, 0);
    lowerBody.castShadow = true;
    group.add(lowerBody);

    // Two-Tone White Upper Beltline
    const upperBelt = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.02, 0.35, busL), busWhiteMat);
    upperBelt.position.set(0, 1.75, 0);
    group.add(upperBelt);

    // Dark Lower Skirt / Rocker Panels
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.04, 0.3, busL), darkTrimMat);
    skirt.position.set(0, 0.42, 0);
    group.add(skirt);

    // 2. Individual Passenger Windows with Thin Structural Pillars
    const glassRibbon = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.04, 0.95, busL - 0.5), tintedGlassMat);
    glassRibbon.position.set(0, 2.3, 0);
    group.add(glassRibbon);

    // Vertical Window Posts every 1.5m along both flanks
    for (let z = -busL / 2 + 1.2; z <= busL / 2 - 1.2; z += 1.5) {
      [-busW / 2 - 0.03, busW / 2 + 0.03].forEach((wx) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.98, 0.1), darkTrimMat);
        pillar.position.set(wx, 2.3, z);
        group.add(pillar);
      });
    }

    // 3. Sloped Aerodynamic Front Windshield
    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.92, 1.1, 0.08), tintedGlassMat);
    frontWindshield.rotation.x = -0.15;
    frontWindshield.position.set(0, 2.2, busL / 2 - 0.1);
    group.add(frontWindshield);

    // Windshield Wipers
    const wiperMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    [-0.45, 0.45].forEach((wx) => {
      const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.04), wiperMat);
      wiper.rotation.z = 0.3;
      wiper.rotation.x = -0.15;
      wiper.position.set(wx, 1.85, busL / 2 + 0.02);
      group.add(wiper);
    });

    // 4. Aerodynamic Side Mirrors
    [-busW / 2 - 0.28, busW / 2 + 0.28].forEach((mx) => {
      const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), darkTrimMat);
      mirrorArm.position.set(mx > 0 ? mx - 0.12 : mx + 0.12, 2.3, busL / 2 - 0.4);
      group.add(mirrorArm);

      const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.08), darkTrimMat);
      mirrorHead.position.set(mx, 2.25, busL / 2 - 0.35);
      group.add(mirrorHead);
    });

    // 5. Roof Cap with Aerodynamic AC & Battery Enclosure
    const roof = new THREE.Mesh(new THREE.BoxGeometry(busW, 0.35, busL), busWhiteMat);
    roof.position.set(0, busH, 0);
    roof.castShadow = true;
    group.add(roof);

    const acPod = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.72, 0.4, 3.2), darkTrimMat);
    acPod.position.set(0, busH + 0.32, -0.6);
    group.add(acPod);

    // 6. Digital LED Destination Matrix Sign above Windshield
    const destSignMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const destSign = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.7, 0.25, 0.05), destSignMat);
    destSign.position.set(0, busH - 0.15, busL / 2 + 0.02);
    group.add(destSign);

    // Front Bumper with Fog Lamps & Air Grille
    const fGrille = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.65, 0.3, 0.08), darkTrimMat);
    fGrille.position.set(0, 0.6, busL / 2 + 0.02);
    group.add(fGrille);

    // Wheels: Front Steer Axle + Rear Twin Dual Setup
    [-1.2, 1.2].forEach((wx) => {
      addWheelInstance(wx, 0.55, busL * 0.32, 0.55, 0.34);
      addWheelInstance(wx, 0.55, -busL * 0.28, 0.55, 0.34);
    });
  } else if (type === 'TRUCK') {
    // COMMERCIAL CARGO FREIGHT TRUCK
    const truckW = 2.45;
    const cabL = 2.0;
    const boxL = 5.2;

    // 1. Cab-Over Tractor
    const cab = new THREE.Mesh(new THREE.BoxGeometry(truckW, 2.2, cabL), carPaintMat);
    cab.position.set(0, 1.55, 1.4);
    cab.castShadow = true;
    group.add(cab);

    // Windshield & Sun Visor
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.04, 0.85, 1.3), tintedGlassMat);
    windshield.position.set(0, 1.85, 1.5);
    group.add(windshield);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.08, 0.1, 0.35), darkTrimMat);
    visor.position.set(0, 2.38, 2.1);
    group.add(visor);

    // Vertical Chrome Exhaust Stack
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 12), chromeMat);
    exhaust.position.set(truckW / 2 + 0.08, 2.1, 0.5);
    group.add(exhaust);

    // 2. Corrugated Cargo Box Trailer
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5, metalness: 0.2 });
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.08, 2.7, boxL), boxMat);
    cargo.position.set(0, 1.95, -2.1);
    cargo.castShadow = true;
    group.add(cargo);

    // Cylindrical Aluminum Fuel Tanks
    [-truckW / 2 - 0.02, truckW / 2 + 0.02].forEach((fx) => {
      const tankGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.4, 14);
      tankGeo.rotateZ(Math.PI / 2);
      const tank = new THREE.Mesh(tankGeo, alloyRimMat);
      tank.position.set(fx, 0.65, 0.3);
      group.add(tank);
    });

    [-1.2, 1.2].forEach((wx) => {
      addWheelInstance(wx, 0.55, 1.4, 0.55, 0.36);
      addWheelInstance(wx, 0.55, -1.8, 0.55, 0.36);
      addWheelInstance(wx, 0.55, -3.4, 0.55, 0.36);
    });
  } else {
    // PASSENGER CARS: SEDAN, SUV, TAXI, VIP
    const isSuv = type === 'SUV';
    const carL = isSuv ? 4.7 : 4.4;
    const carW = isSuv ? 2.1 : 1.95;
    const carH = isSuv ? 1.6 : 1.38;
    const wheelR = isSuv ? 0.52 : 0.46;
    const wheelY = isSuv ? 0.52 : 0.46;

    // 1. Lower Body with Front & Rear Bumpers
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(carW, carH * 0.55, carL), carPaintMat);
    lowerBody.position.set(0, 0.72, 0);
    lowerBody.castShadow = true;
    group.add(lowerBody);

    // 2. Aerodynamic Greenhouse Cabin with A/B/C Pillars
    const cabinL = carL * 0.56;
    const cabinW = carW * 0.88;
    const cabinH = carH * 0.56;
    const cabinZ = -carL * 0.06;

    const cabinGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, cabinL), tintedGlassMat);
    cabinGlass.position.set(0, 1.32, cabinZ);
    group.add(cabinGlass);

    // Roof Panel
    const roof = new THREE.Mesh(new THREE.BoxGeometry(cabinW + 0.02, 0.1, cabinL), carPaintMat);
    roof.position.set(0, 1.32 + cabinH / 2 + 0.05, cabinZ);
    group.add(roof);

    // Front Sloping Hood
    const hoodL = carL * 0.28;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.94, 0.14, hoodL), carPaintMat);
    hood.position.set(0, 0.98, carL * 0.34);
    group.add(hood);

    // Honeycomb Front Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.65, 0.24, 0.06), darkTrimMat);
    grille.position.set(0, 0.72, carL / 2 + 0.02);
    group.add(grille);

    // Side Rearview Mirrors
    [-carW / 2 - 0.14, carW / 2 + 0.14].forEach((mx) => {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.22), carPaintMat);
      mirror.position.set(mx, 1.05, carL * 0.18);
      group.add(mirror);
    });

    // SUV-Specific Upgrades: Roof Rails & Skid Plate
    if (isSuv) {
      [-cabinW / 2 + 0.08, cabinW / 2 - 0.08].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, cabinL * 0.88), alloyRimMat);
        rail.position.set(rx, 1.32 + cabinH / 2 + 0.1, cabinZ);
        group.add(rail);
      });

      const skid = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.6, 0.12, 0.18), alloyRimMat);
      skid.position.set(0, 0.38, carL / 2 + 0.02);
      group.add(skid);
    }

    // Taxi-Specific Upgrade: Illuminated Roof Dome
    if (isTaxi) {
      const taxiSignMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.18, 0.24), taxiSignMat);
      taxiSign.position.set(0, 1.32 + cabinH / 2 + 0.14, cabinZ);
      group.add(taxiSign);
    }

    // 4 Wheels
    [-carW / 2 + 0.08, carW / 2 - 0.08].forEach((wx) => {
      addWheelInstance(wx, wheelY, carL * 0.29, wheelR, 0.32);
      addWheelInstance(wx, wheelY, -carL * 0.29, wheelR, 0.32);
    });
  }

  // Common Automotive Lighting & License Plates
  let frontZ = 2.25;
  let backZ = -2.25;
  let lightOffsetX = 0.82;
  let lightY = 0.74;

  if (type === 'BUS') {
    frontZ = 4.42;
    backZ = -4.42;
    lightOffsetX = 1.05;
    lightY = 0.95;
  } else if (type === 'TRUCK') {
    frontZ = 2.42;
    backZ = -4.72;
    lightOffsetX = 1.02;
    lightY = 0.85;
  } else if (type === 'AMBULANCE') {
    frontZ = 3.05;
    backZ = -2.92;
    lightOffsetX = 0.98;
    lightY = 0.85;
  } else if (type === 'FIRE_TRUCK') {
    frontZ = 3.82;
    backZ = -4.02;
    lightOffsetX = 1.08;
    lightY = 0.95;
  } else if (type === 'SUV') {
    frontZ = 2.38;
    backZ = -2.38;
    lightOffsetX = 0.92;
    lightY = 0.82;
  }

  // 1. Crystal LED Headlight Units
  const hlGeo = new THREE.BoxGeometry(0.32, 0.14, 0.1);
  [-lightOffsetX, lightOffsetX].forEach((lx) => {
    const hl = new THREE.Mesh(hlGeo, ledHeadlightMat);
    hl.position.set(lx, lightY, frontZ);
    group.add(hl);
  });

  // 2. High-Performance Night Headlight Spotlights
  [-lightOffsetX, lightOffsetX].forEach((lx) => {
    const spot = new THREE.SpotLight(0xfffaed, 2.4, 28, Math.PI / 5.5, 0.35);
    spot.position.set(lx, lightY, frontZ);
    spot.target.position.set(lx, 0.1, frontZ + 18);
    spot.visible = isNightMode;
    group.add(spot);
    group.add(spot.target);
    headlights.push(spot);
  });

  // 3. Full-Width Rear Red LED Taillights
  const tlGeo = new THREE.BoxGeometry(0.36, 0.14, 0.08);
  [-lightOffsetX, lightOffsetX].forEach((lx) => {
    const tl = new THREE.Mesh(tlGeo, ledTaillightMat);
    tl.position.set(lx, lightY, backZ);
    group.add(tl);
    brakeLights.push(tl);
  });

  // 4. White & Yellow DOT License Plates
  const plateFront = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.03), licensePlateMat);
  plateFront.position.set(0, 0.52, frontZ + 0.02);
  group.add(plateFront);

  const plateRear = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.03), licensePlateMat);
  plateRear.position.set(0, 0.55, backZ - 0.02);
  group.add(plateRear);

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
