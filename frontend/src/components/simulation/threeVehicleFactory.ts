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
  roughness: 0.9,
  metalness: 0.1,
});

const alloyRimMat = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0,
  metalness: 0.85,
  roughness: 0.2,
});

const brakeDiscMat = new THREE.MeshStandardMaterial({
  color: 0x71717a,
  metalness: 0.9,
  roughness: 0.25,
});

const brakeCaliperMat = new THREE.MeshStandardMaterial({
  color: 0xdc2626,
  metalness: 0.5,
  roughness: 0.35,
});

const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.95,
  roughness: 0.08,
});

const darkTrimMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.65,
  metalness: 0.2,
});

const tintedGlassMat = new THREE.MeshStandardMaterial({
  color: 0x070b14,
  roughness: 0.08,
  metalness: 0.95,
  transparent: true,
  opacity: 0.88,
});

const ledHeadlightMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const ledTaillightMat = new THREE.MeshStandardMaterial({
  color: 0x3f0505,
  emissive: 0xef4444,
  emissiveIntensity: 0.65,
  roughness: 0.3,
});

const licensePlateMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.5,
});

/**
 * Creates a high-fidelity multi-part alloy wheel with tire, 5-spoke rim, brake disc, and red caliper
 */
function createHighDetailWheel(radius: number, width: number): { wheelMesh: THREE.Mesh; group: THREE.Group } {
  const group = new THREE.Group();

  // 1. Outer Rubber Tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  group.add(tire);

  // 2. Alloy Wheel Rim
  const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width * 1.04, 18);
  const rim = new THREE.Mesh(rimGeo, alloyRimMat);
  rim.rotation.z = Math.PI / 2;
  tire.add(rim);

  // 3. 5-Spoke Star Rim Face
  const spokeGeo = new THREE.BoxGeometry(radius * 0.16, width * 1.06, radius * 0.62);
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const spoke = new THREE.Mesh(spokeGeo, alloyRimMat);
    spoke.rotation.y = angle;
    tire.add(spoke);
  }

  // 4. Center Hub
  const hubGeo = new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, width * 1.1, 14);
  const hub = new THREE.Mesh(hubGeo, chromeMat);
  hub.rotation.z = Math.PI / 2;
  tire.add(hub);

  // 5. Disc Brake Rotor (Fixed behind wheel)
  const discGeo = new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, width * 0.25, 16);
  const disc = new THREE.Mesh(discGeo, brakeDiscMat);
  disc.rotation.z = Math.PI / 2;
  group.add(disc);

  // 6. Red Brembo-Style Caliper
  const caliperGeo = new THREE.BoxGeometry(radius * 0.22, radius * 0.42, width * 0.4);
  const caliper = new THREE.Mesh(caliperGeo, brakeCaliperMat);
  caliper.position.set(0, radius * 0.4, 0);
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
  const actualPaintColor = isVip ? 0x050505 : isTaxi ? 0xf59e0b : paintColorHex;

  const carPaintMat = new THREE.MeshStandardMaterial({
    color: actualPaintColor,
    metalness: isVip ? 0.95 : 0.82,
    roughness: isVip ? 0.08 : 0.16,
  });

  const addWheelInstance = (x: number, y: number, z: number, radius = 0.54, width = 0.35) => {
    const { wheelMesh, group: wGroup } = createHighDetailWheel(radius, width);
    wGroup.position.set(x, y, z);
    // Face outward based on side
    if (x < 0) {
      wGroup.rotation.y = Math.PI;
    }
    group.add(wGroup);
    wheels.push(wheelMesh);
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
        metalness: 0.7,
        roughness: 0.2,
      });

      // 1. Crew Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(truckW, 2.2, 2.8), firePaintMat);
      cab.position.set(0, 1.7, 1.8);
      cab.castShadow = true;
      group.add(cab);

      // Cab Windshield & Windows
      const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.04, 0.9, 2.4), tintedGlassMat);
      cabGlass.position.set(0, 2.0, 1.85);
      group.add(cabGlass);

      // Chrome Front Bumper & Siren
      const fgrille = new THREE.Mesh(new THREE.BoxGeometry(truckW * 0.9, 0.8, 0.3), chromeMat);
      fgrille.position.set(0, 1.1, 3.25);
      group.add(fgrille);

      // 2. Equipment Rear Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(truckW, 2.4, 4.4), firePaintMat);
      body.position.set(0, 1.8, -1.8);
      body.castShadow = true;
      group.add(body);

      // Diamond-Plate Silver Decking & Shutter Doors
      [-truckW / 2 - 0.02, truckW / 2 + 0.02].forEach((sx) => {
        const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 3.8), alloyRimMat);
        shutter.position.set(sx, 1.75, -1.8);
        group.add(shutter);
      });

      // Rooftop Ladders
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 4.8), alloyRimMat);
      ladder.position.set(-0.6, truckH + 0.7, -1.6);
      group.add(ladder);

      // Rooftop Water Cannon Monitor
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.6, 12), chromeMat);
      cannon.position.set(0.6, truckH + 0.75, -0.6);
      group.add(cannon);

      // Dual Rooftop Emergency Beacons
      beaconMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      beaconMesh.position.set(0, 3.0, 1.8);
      group.add(beaconMesh);

      beaconLight = new THREE.PointLight(0xef4444, 4.5, 24);
      beaconLight.position.set(0, 3.4, 1.8);
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
        color: 0xffffff,
        metalness: 0.4,
        roughness: 0.2,
      });

      // 1. Driver Cab with Aerodynamic Wind Deflector
      const cab = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.94, 1.85, 2.2), ambWhiteMat);
      cab.position.set(0, 1.5, 1.85);
      cab.castShadow = true;
      group.add(cab);

      // Windshield & Side Windows
      const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.96, 0.8, 1.6), tintedGlassMat);
      cabGlass.position.set(0, 1.75, 1.8);
      group.add(cabGlass);

      // Cab Wind Deflector Transition to Box
      const deflector = new THREE.Mesh(new THREE.BoxGeometry(ambW * 0.95, 0.6, 0.8), ambWhiteMat);
      deflector.position.set(0, 2.6, 1.0);
      group.add(deflector);

      // 2. Medical Treatment Box Body
      const box = new THREE.Mesh(new THREE.BoxGeometry(ambW, ambH, 3.8), ambWhiteMat);
      box.position.set(0, 1.85, -1.0);
      box.castShadow = true;
      group.add(box);

      // Hi-Vis Reflective Safety Stripe (Red)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(ambW + 0.04, 0.45, 3.75), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      stripe.position.set(0, 1.6, -1.0);
      group.add(stripe);

      // Blue Paramedic Star of Life Badges on Flanks
      const starGeo = new THREE.BoxGeometry(0.04, 0.6, 0.6);
      const starMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      [-ambW / 2 - 0.03, ambW / 2 + 0.03].forEach((sx) => {
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(sx, 2.2, -1.0);
        group.add(star);
      });

      // Dual Rooftop Strobing Emergency Lightbar
      beaconMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.32, 0.5), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      beaconMesh.position.set(0, ambH + 0.65, 1.4);
      group.add(beaconMesh);

      beaconLight = new THREE.PointLight(0x38bdf8, 4.0, 22);
      beaconLight.position.set(0, ambH + 1.2, 1.4);
      group.add(beaconLight);

      // Wheels
      [-1.15, 1.15].forEach((wx) => {
        addWheelInstance(wx, 0.55, 1.9, 0.55, 0.34);
        addWheelInstance(wx, 0.55, -1.5, 0.55, 0.34);
      });
    }
  } else if (type === 'BUS') {
    // STREAMLINED ELECTRIC TRANSIT CITY BUS
    const busL = 8.6;
    const busW = 2.5;
    const busH = 2.9;

    const busPaintMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.25,
    });

    // 1. Aerodynamic Lower Body & Front Cap
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(busW, 1.4, busL), busPaintMat);
    lowerBody.position.set(0, 1.1, 0);
    lowerBody.castShadow = true;
    group.add(lowerBody);

    // Dark Lower Skirt / Rocker Panels
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.02, 0.35, busL), darkTrimMat);
    skirt.position.set(0, 0.45, 0);
    group.add(skirt);

    // 2. Panoramic Continuous Tinted Glass Ribbon
    const glassRibbon = new THREE.Mesh(new THREE.BoxGeometry(busW + 0.04, 1.1, busL - 0.4), tintedGlassMat);
    glassRibbon.position.set(0, 2.15, 0.1);
    group.add(glassRibbon);

    // Roof Cap
    const roof = new THREE.Mesh(new THREE.BoxGeometry(busW, 0.4, busL), busPaintMat);
    roof.position.set(0, busH + 0.1, 0);
    roof.castShadow = true;
    group.add(roof);

    // Digital LED Destination Matrix Sign above Windshield
    const destSignMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const destSign = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.75, 0.28, 0.05), destSignMat);
    destSign.position.set(0, busH - 0.12, busL / 2 + 0.02);
    group.add(destSign);

    // Rooftop Aerodynamic AC & Battery Pack Pods
    const acPod = new THREE.Mesh(new THREE.BoxGeometry(busW * 0.75, 0.45, 2.8), darkTrimMat);
    acPod.position.set(0, busH + 0.45, -0.6);
    group.add(acPod);

    // Front Steer Axle + Rear Twin Dual Axle Setup
    [-1.2, 1.2].forEach((wx) => {
      addWheelInstance(wx, 0.55, busL * 0.32, 0.55, 0.35);
      // Twin wheels on rear axle for authentic bus stance
      addWheelInstance(wx, 0.55, -busL * 0.28, 0.55, 0.35);
    });
  } else if (type === 'TRUCK') {
    // COMMERCIAL CARGO FREIGHT TRUCK
    const truckW = 2.45;
    const cabL = 2.0;
    const boxL = 5.2;

    // 1. Cab-Over Tractor
    const cab = new THREE.Mesh(new THREE.BoxGeometry(truckW, 2.3, cabL), carPaintMat);
    cab.position.set(0, 1.6, 1.4);
    cab.castShadow = true;
    group.add(cab);

    // Windshield & Sun Visor
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.04, 0.9, 1.4), tintedGlassMat);
    windshield.position.set(0, 1.9, 1.5);
    group.add(windshield);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.08, 0.12, 0.4), darkTrimMat);
    visor.position.set(0, 2.45, 2.15);
    group.add(visor);

    // Vertical Chrome Exhaust Stack
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 12), chromeMat);
    exhaust.position.set(truckW / 2 + 0.06, 2.2, 0.5);
    group.add(exhaust);

    // 2. Corrugated Cargo Box Trailer
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5, metalness: 0.2 });
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(truckW + 0.08, 2.8, boxL), boxMat);
    cargo.position.set(0, 2.0, -2.1);
    cargo.castShadow = true;
    group.add(cargo);

    // Steel Side Under-run Barrier Rails
    [-truckW / 2 - 0.04, truckW / 2 + 0.04].forEach((sx) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 2.2), alloyRimMat);
      rail.position.set(sx, 0.65, -0.4);
      group.add(rail);
    });

    // Wheels (Front Axle + Tandem Dual Rear Axles)
    [-1.2, 1.2].forEach((wx) => {
      addWheelInstance(wx, 0.56, 1.4, 0.56, 0.36);
      addWheelInstance(wx, 0.56, -1.8, 0.56, 0.36);
      addWheelInstance(wx, 0.56, -3.2, 0.56, 0.36);
    });
  } else {
    // SEDAN / SUV / VIP / TAXI PASSENGER AUTOMOBILES
    const isSuv = type === 'SUV';
    const carL = isSuv ? 4.8 : 4.4;
    const carW = isSuv ? 2.15 : 1.98;
    const carH = isSuv ? 1.62 : 1.38;
    const wheelY = isSuv ? 0.56 : 0.52;
    const wheelR = isSuv ? 0.56 : 0.52;

    // 1. Lower Sculpted Aerodynamic Body
    const bodyGeo = new THREE.BoxGeometry(carW, carH * 0.52, carL);
    const body = new THREE.Mesh(bodyGeo, carPaintMat);
    body.position.y = 0.72;
    body.castShadow = true;
    group.add(body);

    // 2. Sloping Front Hood Panel
    const hood = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.92, carH * 0.15, carL * 0.36), carPaintMat);
    hood.position.set(0, 0.88, carL * 0.26);
    hood.rotation.x = 0.05;
    group.add(hood);

    // Front Air Intake Grille
    const grilleMat = isVip ? chromeMat : darkTrimMat;
    const grille = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.65, carH * 0.26, 0.15), grilleMat);
    grille.position.set(0, 0.68, carL / 2 + 0.01);
    group.add(grille);

    // Front Bumper Splitter / Skid Plate
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(carW * 0.94, 0.08, 0.22), isSuv ? alloyRimMat : darkTrimMat);
    splitter.position.set(0, 0.42, carL / 2 + 0.02);
    group.add(splitter);

    // 3. Greenhouse Cabin (Windshield, Roof, Windows)
    const cabinW = carW * 0.86;
    const cabinL = carL * (isSuv ? 0.64 : 0.54);
    const cabinH = carH * 0.56;
    const cabinZ = isSuv ? -0.1 : -0.22;

    const cabinGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, cabinL), tintedGlassMat);
    cabinGlass.position.set(0, 1.34, cabinZ);
    group.add(cabinGlass);

    // Body-Colored Roof Shell
    const roof = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.92, 0.08, cabinL * 0.82), carPaintMat);
    roof.position.set(0, 1.34 + cabinH / 2, cabinZ);
    roof.castShadow = true;
    group.add(roof);

    // Side Mirrors on Doors
    [-carW / 2 - 0.12, carW / 2 + 0.12].forEach((mx) => {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.22), carPaintMat);
      mirror.position.set(mx, 1.05, carL * 0.12);
      group.add(mirror);
    });

    // SUV-Specific Upgrades: Roof Luggage Rails & Rugged Overfenders
    if (isSuv) {
      [-cabinW / 2 + 0.08, cabinW / 2 - 0.08].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, cabinL * 0.88), alloyRimMat);
        rail.position.set(rx, 1.34 + cabinH / 2 + 0.08, cabinZ);
        group.add(rail);
      });
    }

    // Taxi-Specific Upgrade: Illuminated Roof Dome
    if (isTaxi) {
      const taxiSignMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.25), taxiSignMat);
      taxiSign.position.set(0, 1.34 + cabinH / 2 + 0.14, cabinZ);
      group.add(taxiSign);
    }

    // 4 Wheels
    [-carW / 2 + 0.08, carW / 2 - 0.08].forEach((wx) => {
      addWheelInstance(wx, wheelY, carL * 0.29, wheelR, 0.33);
      addWheelInstance(wx, wheelY, -carL * 0.29, wheelR, 0.33);
    });
  }

  // Common Automotive Lighting & License Plates
  let frontZ = 2.25;
  let backZ = -2.25;
  let lightOffsetX = 0.82;
  let lightY = 0.78;

  if (type === 'BUS') {
    frontZ = 4.32;
    backZ = -4.32;
    lightOffsetX = 1.05;
    lightY = 0.95;
  } else if (type === 'TRUCK') {
    frontZ = 2.45;
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
    frontZ = 2.42;
    backZ = -2.42;
    lightOffsetX = 0.92;
    lightY = 0.85;
  }

  // 1. Crystal LED Headlight Units
  const hlGeo = new THREE.BoxGeometry(0.32, 0.15, 0.12);
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
