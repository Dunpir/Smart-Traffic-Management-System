import * as THREE from 'three';

export interface UrbanSceneryRecord {
  towersGroup: THREE.Group;
  aviationBeacons: THREE.PointLight[];
  streetlights: THREE.SpotLight[];
  nightEmissives: { material: THREE.MeshStandardMaterial; dayIntensity: number; nightIntensity: number }[];
}

/**
 * Creates high-fidelity modern architectural materials with realistic PBR properties
 */
function createArchitecturalMaterials(isNightMode: boolean) {
  // Sleek Architectural Slate Glass Curtain Wall
  const curtainGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Deep slate obsidian
    metalness: 0.25,
    roughness: 0.35,
    transparent: true,
    opacity: 0.88,
    emissive: 0x0284c7,
    emissiveIntensity: isNightMode ? 0.45 : 0.0,
  });

  // Sophisticated Ground-Floor Lobby Glass
  const lobbyGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.25,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
    emissive: 0x1e293b,
    emissiveIntensity: isNightMode ? 0.35 : 0.0,
  });

  // Anodized Architectural Brushed Titanium / Aluminum
  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.88,
    roughness: 0.22,
  });

  // Dark Matte Architectural Charcoal Composite Panels
  const charcoalPanelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.5,
  });

  // Warm Architectural Terracotta / Bronze Panels
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412,
    roughness: 0.55,
    metalness: 0.25,
  });

  // Light Architectural Concrete / Granite
  const graniteMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Cast Iron Utility Metal
  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.35,
  });

  // ADA Safety Yellow
  const adaYellowMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.6,
  });

  // Roadway White Reflective Marking
  const roadWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.1,
  });

  // Foliage Multi-Tone Materials
  const foliageDeep = new THREE.MeshStandardMaterial({
    color: isNightMode ? 0x064e3b : 0x14532d,
    roughness: 0.85,
  });
  const foliageMid = new THREE.MeshStandardMaterial({
    color: isNightMode ? 0x065f46 : 0x16a34a,
    roughness: 0.82,
  });
  const foliageLight = new THREE.MeshStandardMaterial({
    color: isNightMode ? 0x047857 : 0x22c55e,
    roughness: 0.8,
  });

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.95,
  });

  return {
    curtainGlassMat,
    lobbyGlassMat,
    titaniumMat,
    charcoalPanelMat,
    terracottaMat,
    graniteMat,
    castIronMat,
    adaYellowMat,
    roadWhiteMat,
    foliageDeep,
    foliageMid,
    foliageLight,
    barkMat,
  };
}

/**
 * Builds Tower 1 (North-West): FinTech High-Tech Glass Spire with 3 stepped tiers & antenna beacon
 */
function buildFinTechSpire(materials: ReturnType<typeof createArchitecturalMaterials>): {
  tower: THREE.Group;
  beaconLight: THREE.PointLight;
} {
  const group = new THREE.Group();
  group.position.set(-35, 0, -35);

  const { curtainGlassMat, lobbyGlassMat, titaniumMat, charcoalPanelMat } = materials;

  // 1. Podium Base (28 x 28 x 16m)
  const baseH = 16;
  const base = new THREE.Mesh(new THREE.BoxGeometry(28, baseH, 28), charcoalPanelMat);
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Ground-floor Double-Height Glass Lobby
  const lobbyH = 6;
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(28.4, lobbyH, 28.4), lobbyGlassMat);
  lobby.position.y = lobbyH / 2;
  group.add(lobby);

  // Entrance Canopy with Brushed Metal Frame
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 4), titaniumMat);
  canopy.position.set(0, 5.8, 14.5);
  canopy.castShadow = true;
  group.add(canopy);

  // Vertical Architectural Mullion Fins across Podium
  for (let x = -13; x <= 13; x += 3.2) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, baseH - 6.5, 0.4), titaniumMat);
    fin.position.set(x, baseH / 2 + 3, 14.2);
    group.add(fin);
  }

  // 2. Mid Tower Tier (21 x 21 x 36m, up to y = 52m)
  const midH = 36;
  const midY = baseH + midH / 2;
  const midCore = new THREE.Mesh(new THREE.BoxGeometry(20, midH, 20), charcoalPanelMat);
  midCore.position.y = midY;
  midCore.castShadow = true;
  group.add(midCore);

  const midGlass = new THREE.Mesh(new THREE.BoxGeometry(21.4, midH - 2, 21.4), curtainGlassMat);
  midGlass.position.y = midY;
  group.add(midGlass);

  // Mid-Tier Vertical Titanium Corner Fins
  [[-10.8, -10.8], [10.8, -10.8], [-10.8, 10.8], [10.8, 10.8]].forEach(([cx, cz]) => {
    const cornerFin = new THREE.Mesh(new THREE.BoxGeometry(0.6, midH + 4, 0.6), titaniumMat);
    cornerFin.position.set(cx, midY + 1, cz);
    cornerFin.castShadow = true;
    group.add(cornerFin);
  });

  // 3. Upper Crown Tier (15 x 15 x 28m, up to y = 80m)
  const crownH = 28;
  const crownY = baseH + midH + crownH / 2;
  const crownCore = new THREE.Mesh(new THREE.BoxGeometry(14, crownH, 14), charcoalPanelMat);
  crownCore.position.y = crownY;
  crownCore.castShadow = true;
  group.add(crownCore);

  const crownGlass = new THREE.Mesh(new THREE.BoxGeometry(15.2, crownH - 2, 15.2), curtainGlassMat);
  crownGlass.position.y = crownY;
  group.add(crownGlass);

  // Rooftop Plant & HVAC Enclosure
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 10), titaniumMat);
  hvac.position.y = baseH + midH + crownH + 2;
  hvac.castShadow = true;
  group.add(hvac);

  // 4. Slender Antenna Spire (Stainless Steel 18m mast reaching y = 100m)
  const spireBaseY = baseH + midH + crownH + 4;
  const spireH = 18;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.45, spireH, 16), titaniumMat);
  spire.position.y = spireBaseY + spireH / 2;
  spire.castShadow = true;
  group.add(spire);

  // Flashing Red FAA Aviation Warning Beacon
  const beaconMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  beaconMesh.position.y = spireBaseY + spireH;
  group.add(beaconMesh);

  const beaconLight = new THREE.PointLight(0xef4444, 2.5, 60);
  beaconLight.position.y = spireBaseY + spireH;
  group.add(beaconLight);

  return { tower: group, beaconLight };
}

/**
 * Builds Tower 2 (North-East): Corporate Smart Mobility Center with Rooftop Helipad
 */
function buildCorporateHelipadTower(materials: ReturnType<typeof createArchitecturalMaterials>): {
  tower: THREE.Group;
  beaconLight: THREE.PointLight;
} {
  const group = new THREE.Group();
  group.position.set(35, 0, -35);

  const { curtainGlassMat, lobbyGlassMat, titaniumMat, charcoalPanelMat, graniteMat, adaYellowMat } = materials;

  const towerH = 56;
  const towerW = 26;

  // 1. Granite Podium Base (Height: 8m)
  const podiumH = 8;
  const podium = new THREE.Mesh(new THREE.BoxGeometry(towerW, podiumH, towerW), graniteMat);
  podium.position.y = podiumH / 2;
  podium.castShadow = true;
  podium.receiveShadow = true;
  group.add(podium);

  // Recessed Glass Entrance Bay
  const entrance = new THREE.Mesh(new THREE.BoxGeometry(14, 5.5, 2.0), lobbyGlassMat);
  entrance.position.set(0, 2.75, towerW / 2 + 0.1);
  group.add(entrance);

  // Entrance Metal Canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 3.5), titaniumMat);
  canopy.position.set(0, 5.8, towerW / 2 + 1.2);
  canopy.castShadow = true;
  group.add(canopy);

  // 2. Main Tower Body (Height: 48m, reaching y = 56m)
  const towerBodyH = towerH - podiumH;
  const towerBody = new THREE.Mesh(
    new THREE.BoxGeometry(towerW - 1.2, towerBodyH, towerW - 1.2),
    curtainGlassMat
  );
  towerBody.position.y = podiumH + towerBodyH / 2;
  towerBody.castShadow = true;
  group.add(towerBody);

  // Core Column
  const innerCore = new THREE.Mesh(
    new THREE.BoxGeometry(towerW - 3.0, towerBodyH, towerW - 3.0),
    charcoalPanelMat
  );
  innerCore.position.y = podiumH + towerBodyH / 2;
  group.add(innerCore);

  // Vertical Architectural Titanium Mullions along all 4 faces
  for (let offset = -towerW / 2 + 2.5; offset <= towerW / 2 - 2.5; offset += 3.2) {
    [-towerW / 2 + 0.5, towerW / 2 - 0.5].forEach((fz) => {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, towerBodyH, 0.45),
        titaniumMat
      );
      mullion.position.set(offset, podiumH + towerBodyH / 2, fz);
      group.add(mullion);
    });
    [-towerW / 2 + 0.5, towerW / 2 - 0.5].forEach((fx) => {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, towerBodyH, 0.25),
        titaniumMat
      );
      mullion.position.set(fx, podiumH + towerBodyH / 2, offset);
      group.add(mullion);
    });
  }

  // Horizontal Floor Slabs every 4.0m
  for (let y = podiumH + 4; y < towerH; y += 4) {
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(towerW - 1.0, 0.35, towerW - 1.0),
      charcoalPanelMat
    );
    slab.position.y = y;
    group.add(slab);
  }

  // Mid-Height Cantilevered Sky Terrace (y = 28m)
  const terrace = new THREE.Mesh(new THREE.BoxGeometry(towerW + 2.5, 0.8, 6), graniteMat);
  terrace.position.set(0, 28, towerW / 2 + 1.2);
  terrace.castShadow = true;
  group.add(terrace);

  // Rooftop Helipad Deck (y = 56m)
  const heliDeck = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 10.5, 1.2, 24), graniteMat);
  heliDeck.position.y = towerH + 0.6;
  heliDeck.castShadow = true;
  group.add(heliDeck);

  // Helipad Yellow Target Circle
  const heliCircle = new THREE.Mesh(new THREE.RingGeometry(5.8, 6.4, 32), adaYellowMat);
  heliCircle.rotation.x = -Math.PI / 2;
  heliCircle.position.y = towerH + 1.22;
  group.add(heliCircle);

  // Helipad Yellow 'H' Cross
  const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 5.0), adaYellowMat);
  hBar1.rotation.x = -Math.PI / 2;
  hBar1.position.set(-1.6, towerH + 1.22, 0);
  group.add(hBar1);

  const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 5.0), adaYellowMat);
  hBar2.rotation.x = -Math.PI / 2;
  hBar2.position.set(1.6, towerH + 1.22, 0);
  group.add(hBar2);

  const hCross = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8), adaYellowMat);
  hCross.rotation.x = -Math.PI / 2;
  hCross.position.set(0, towerH + 1.22, 0);
  group.add(hCross);

  // Perimeter Helipad Blue Safety Lights
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const px = Math.cos(angle) * 8.8;
    const pz = Math.sin(angle) * 8.8;
    const pLight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    pLight.position.set(px, towerH + 1.35, pz);
    group.add(pLight);
  }

  // Communications Mast with Red Warning Light
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 9, 12), titaniumMat);
  mast.position.set(8.5, towerH + 4.5, -8.5);
  group.add(mast);

  const beaconLight = new THREE.PointLight(0xef4444, 2.0, 50);
  beaconLight.position.set(8.5, towerH + 9, -8.5);
  group.add(beaconLight);

  return { tower: group, beaconLight };
}

/**
 * Builds Tower 3 (South-West): Contemporary Mixed-Use Lofts with Balconies & Sidewalk Bistro
 */
function buildMixedUseLofts(materials: ReturnType<typeof createArchitecturalMaterials>): {
  tower: THREE.Group;
  beaconLight: THREE.PointLight;
} {
  const group = new THREE.Group();
  group.position.set(-35, 0, 35);

  const { terracottaMat, charcoalPanelMat, curtainGlassMat, graniteMat, lobbyGlassMat, titaniumMat } = materials;

  const towerH = 46;
  const towerW = 24;

  // Main Architectural Structure in Terracotta / Charcoal Composite
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), terracottaMat);
  mainBody.position.y = towerH / 2;
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  group.add(mainBody);

  // Recessed Dark Accent Insets
  const darkSpandrel = new THREE.Mesh(new THREE.BoxGeometry(towerW * 0.7, towerH + 0.1, towerW + 0.2), charcoalPanelMat);
  darkSpandrel.position.y = towerH / 2;
  group.add(darkSpandrel);

  // Floor Windows
  for (let y = 8; y < towerH - 3; y += 4.2) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.3, 2.2, towerW * 0.65), curtainGlassMat);
    win.position.y = y;
    group.add(win);

    // Staggered Cantilever Balconies with Glass Railings
    const isEven = Math.floor(y / 4.2) % 2 === 0;
    const balX = isEven ? -4 : 4;

    const slab = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.35, 2.4), graniteMat);
    slab.position.set(balX, y - 0.9, towerW / 2 + 1.2);
    slab.castShadow = true;
    group.add(slab);

    const glassRail = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.95, 0.1), curtainGlassMat);
    glassRail.position.set(balX, y - 0.35, towerW / 2 + 2.35);
    group.add(glassRail);
  }

  // Ground Floor Upscale Sidewalk Bistro
  const bistro = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.4, 5.5, towerW + 0.4), lobbyGlassMat);
  bistro.position.y = 2.75;
  group.add(bistro);

  // Bistro Fabric Awning (Midnight Navy / Charcoal)
  const awningMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 3.2), awningMat);
  awning.rotation.x = 0.12;
  awning.position.set(0, 4.6, towerW / 2 + 1.5);
  awning.castShadow = true;
  group.add(awning);

  // Sidewalk Café Patio Furniture
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
  [-4.5, 0, 4.5].forEach((tx) => {
    // Bistro Table
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 16), tableMat);
    tableTop.position.set(tx, 0.9, towerW / 2 + 2.2);
    group.add(tableTop);

    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8), tableMat);
    tableLeg.position.set(tx, 0.45, towerW / 2 + 2.2);
    group.add(tableLeg);

    // Two Chairs per Table
    [-0.6, 0.6].forEach((cz) => {
      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.45), tableMat);
      chairSeat.position.set(tx, 0.5, towerW / 2 + 2.2 + cz);
      group.add(chairSeat);

      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.04), tableMat);
      chairBack.position.set(tx, 0.72, towerW / 2 + 2.2 + cz + (cz > 0 ? 0.2 : -0.2));
      group.add(chairBack);
    });
  });

  // Rooftop Garden Pergola Frame
  const pergolaMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
  for (let px = -5; px <= 5; px += 2.5) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 8), pergolaMat);
    beam.position.set(px, towerH + 2.8, 0);
    group.add(beam);
  }

  const beaconLight = new THREE.PointLight(0xef4444, 1.8, 40);
  beaconLight.position.set(0, towerH + 4.5, 0);
  group.add(beaconLight);

  return { tower: group, beaconLight };
}

/**
 * Builds Tower 4 (South-East): Metro Operations Command Center with Diagrid & LED Marquee
 */
function buildOperationsCommandTower(materials: ReturnType<typeof createArchitecturalMaterials>): {
  tower: THREE.Group;
  beaconLight: THREE.PointLight;
} {
  const group = new THREE.Group();
  group.position.set(35, 0, 35);

  const { curtainGlassMat, titaniumMat, charcoalPanelMat, lobbyGlassMat } = materials;

  const towerH = 68;
  const towerW = 26;

  // Angular Core Geometry with Slanted Modern Crown
  const core = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), charcoalPanelMat);
  core.position.y = towerH / 2;
  core.castShadow = true;
  core.receiveShadow = true;
  group.add(core);

  // Full-Height Curtain Glass Facade
  const glass = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.3, towerH - 8, towerW + 0.3), curtainGlassMat);
  glass.position.y = towerH / 2 + 2;
  group.add(glass);

  // Exterior Structural Diagrid / Bracing Framework
  const braceMat = titaniumMat;
  for (let floor = 10; floor < towerH - 8; floor += 12) {
    // X-bracing truss on front facade
    const brace1 = new THREE.Mesh(new THREE.BoxGeometry(towerW * 1.35, 0.4, 0.4), braceMat);
    brace1.rotation.z = Math.atan2(12, towerW);
    brace1.position.set(0, floor + 6, towerW / 2 + 0.3);
    group.add(brace1);

    const brace2 = new THREE.Mesh(new THREE.BoxGeometry(towerW * 1.35, 0.4, 0.4), braceMat);
    brace2.rotation.z = -Math.atan2(12, towerW);
    brace2.position.set(0, floor + 6, towerW / 2 + 0.3);
    group.add(brace2);
  }

  // Glowing Digital Operations Marquee Ticker Band (Podium level)
  const tickerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const ticker = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.6, 2.2, towerW + 0.6), tickerMat);
  ticker.position.y = 8;
  group.add(ticker);

  // Ground Operations Lobby
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.4, 6.5, towerW + 0.4), lobbyGlassMat);
  lobby.position.y = 3.25;
  group.add(lobby);

  // Rooftop Telecom & Radar Array
  const roofH = towerH + 2;
  const radarDome = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  radarDome.position.set(-5, roofH, -5);
  group.add(radarDome);

  // Parabolic Satellite Dish
  const dish = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 0.2, 0.8, 16, 1, true),
    titaniumMat
  );
  dish.rotation.x = 0.5;
  dish.rotation.y = 0.7;
  dish.position.set(5, roofH + 2.4, 4);
  dish.castShadow = true;
  group.add(dish);

  // Communications Antenna Mast with Red Beacon
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 14, 12), titaniumMat);
  antenna.position.set(0, roofH + 7, 0);
  antenna.castShadow = true;
  group.add(antenna);

  const beaconLight = new THREE.PointLight(0xef4444, 2.4, 55);
  beaconLight.position.set(0, roofH + 14, 0);
  group.add(beaconLight);

  return { tower: group, beaconLight };
}

/**
 * Builds all 4 high-end architectural skyscrapers
 */
export function buildArchitecturalSkyscrapers(
  scene: THREE.Scene,
  isNightMode: boolean
): { towersGroup: THREE.Group; aviationBeacons: THREE.PointLight[] } {
  const towersGroup = new THREE.Group();
  const aviationBeacons: THREE.PointLight[] = [];

  const materials = createArchitecturalMaterials(isNightMode);

  const t1 = buildFinTechSpire(materials);
  towersGroup.add(t1.tower);
  aviationBeacons.push(t1.beaconLight);

  const t2 = buildCorporateHelipadTower(materials);
  towersGroup.add(t2.tower);
  aviationBeacons.push(t2.beaconLight);

  const t3 = buildMixedUseLofts(materials);
  towersGroup.add(t3.tower);
  aviationBeacons.push(t3.beaconLight);

  const t4 = buildOperationsCommandTower(materials);
  towersGroup.add(t4.tower);
  aviationBeacons.push(t4.beaconLight);

  scene.add(towersGroup);
  return { towersGroup, aviationBeacons };
}

/**
 * Creates multi-layered realistic botanical trees with tapered trunks, secondary boughs, and sidewalk tree grates
 */
export function buildRealisticTrees(scene: THREE.Scene, isNightMode: boolean): THREE.Group {
  const treesGroup = new THREE.Group();
  const materials = createArchitecturalMaterials(isNightMode);
  const { barkMat, foliageDeep, foliageMid, foliageLight, castIronMat, graniteMat } = materials;

  const createRealisticTree = (x: number, z: number, scale = 1.0, seed = 0) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, 0, z);
    tGroup.scale.setScalar(scale);

    // 1. Cast-Iron Sidewalk Tree Grate (1.8m x 1.8m flush with sidewalk)
    const grate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.8), castIronMat);
    grate.position.y = 0.36; // Just above sidewalk surface
    grate.receiveShadow = true;
    tGroup.add(grate);

    // Tree Grate Opening
    const opening = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 16), castIronMat);
    opening.position.y = 0.37;
    tGroup.add(opening);

    // 2. Tapered Trunk
    const trunkH = 3.6;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, trunkH, 10), barkMat);
    trunk.position.y = trunkH / 2 + 0.35;
    trunk.castShadow = true;
    tGroup.add(trunk);

    // 3. Secondary Branches
    [-0.3, 0.3].forEach((bx, idx) => {
      const branchH = 1.6;
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, branchH, 8), barkMat);
      branch.rotation.z = (idx === 0 ? -1 : 1) * 0.42;
      branch.position.set(bx, trunkH - 0.2, (seed % 2 === 0 ? 0.2 : -0.2));
      branch.castShadow = true;
      tGroup.add(branch);
    });

    // 4. Volumetric Organic Canopy (7 interlocking foliage clusters)
    const folMats = [foliageDeep, foliageMid, foliageLight];
    const clusters = [
      { x: 0, y: trunkH + 1.2, z: 0, r: 2.1, matIdx: 1 },
      { x: -0.9, y: trunkH + 0.9, z: 0.6, r: 1.6, matIdx: 0 },
      { x: 0.9, y: trunkH + 1.0, z: -0.5, r: 1.5, matIdx: 2 },
      { x: 0.6, y: trunkH + 1.8, z: 0.7, r: 1.4, matIdx: 1 },
      { x: -0.7, y: trunkH + 1.7, z: -0.6, r: 1.4, matIdx: 0 },
      { x: 0, y: trunkH + 2.5, z: 0, r: 1.3, matIdx: 2 },
      { x: 0.2, y: trunkH + 0.5, z: -1.0, r: 1.2, matIdx: 1 },
    ];

    clusters.forEach((cl, idx) => {
      const geo = idx % 2 === 0 ? new THREE.DodecahedronGeometry(cl.r, 1) : new THREE.IcosahedronGeometry(cl.r, 1);
      const folMesh = new THREE.Mesh(geo, folMats[cl.matIdx]);
      folMesh.position.set(cl.x, cl.y, cl.z);
      folMesh.castShadow = true;
      folMesh.receiveShadow = true;
      tGroup.add(folMesh);
    });

    treesGroup.add(tGroup);
  };

  // Place trees along sidewalks with varied natural scales
  [-17.5, 17.5].forEach((tx, i) => {
    [-24, -38, 24, 38].forEach((tz, j) => {
      createRealisticTree(tx, tz, 0.95 + ((i + j) % 3) * 0.1, i + j);
      createRealisticTree(tz, tx, 0.92 + ((i * 2 + j) % 3) * 0.12, i * 2 + j);
    });
  });

  // Corner Granite Planter Boxes with Low Boxwood Hedges
  const planterMat = graniteMat;
  const hedgeMat = foliageDeep;

  [[-13.5, -13.5], [13.5, -13.5], [-13.5, 13.5], [13.5, 13.5]].forEach(([px, pz]) => {
    // Raised L-shaped granite planter box
    const planter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 4.2), planterMat);
    planter.position.set(px > 0 ? px + 2 : px - 2, 0.5, pz > 0 ? pz + 2 : pz - 2);
    planter.castShadow = true;
    planter.receiveShadow = true;
    treesGroup.add(planter);

    // Manicured Boxwood Topiary Hedge inside
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.8, 3.6), hedgeMat);
    hedge.position.set(px > 0 ? px + 2 : px - 2, 0.95, pz > 0 ? pz + 2 : pz - 2);
    hedge.castShadow = true;
    treesGroup.add(hedge);
  });

  scene.add(treesGroup);
  return treesGroup;
}

/**
 * Builds realistic MUTCD Roadway Markings (Turn Arrows, ADA tactile pads, manhole covers, storm drains)
 */
export function buildRoadwayMarkingsAndHardware(
  scene: THREE.Scene,
  roadWidth: number,
  roadLength: number
): THREE.Group {
  const group = new THREE.Group();
  const materials = createArchitecturalMaterials(false);
  const { roadWhiteMat, adaYellowMat, castIronMat } = materials;

  // 1. Procedural High-Visibility Pavement Turn Arrows
  const createTurnArrow = (x: number, z: number, rotationY: number, isLeftTurn: boolean) => {
    const arrowGroup = new THREE.Group();
    arrowGroup.position.set(x, 0.082, z);
    arrowGroup.rotation.y = rotationY;

    // Arrow Stem
    const stem = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 2.6), roadWhiteMat);
    stem.rotation.x = -Math.PI / 2;
    arrowGroup.add(stem);

    if (isLeftTurn) {
      // Curved Left Turn Head
      const arm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.32), roadWhiteMat);
      arm.rotation.x = -Math.PI / 2;
      arm.position.set(-0.55, 0, 1.15);
      arrowGroup.add(arm);

      // Left-pointing flat arrowhead flush with pavement
      const headShape = new THREE.Shape();
      headShape.moveTo(0, 0.52);
      headShape.lineTo(-0.85, 0);
      headShape.lineTo(0, -0.52);
      headShape.closePath();
      const head = new THREE.Mesh(new THREE.ShapeGeometry(headShape), roadWhiteMat);
      head.rotation.x = -Math.PI / 2;
      head.position.set(-1.05, 0, 1.15);
      arrowGroup.add(head);
    } else {
      // Straight Ahead flat arrowhead flush with pavement
      const headShape = new THREE.Shape();
      headShape.moveTo(-0.48, 0);
      headShape.lineTo(0, 0.88);
      headShape.lineTo(0.48, 0);
      headShape.closePath();
      const head = new THREE.Mesh(new THREE.ShapeGeometry(headShape), roadWhiteMat);
      head.rotation.x = -Math.PI / 2;
      head.position.set(0, 0, 1.3);
      arrowGroup.add(head);
    }

    group.add(arrowGroup);
  };

  // Approach Lane Turn Arrows on all 4 approaches
  // North approach (traveling South toward center)
  createTurnArrow(-2.25, -26, 0, true);   // Left Turn Lane
  createTurnArrow(-6.75, -26, 0, false);  // Straight Lane
  createTurnArrow(-6.75, -42, 0, false);  // Straight Advance

  // South approach (traveling North toward center)
  createTurnArrow(2.25, 26, Math.PI, true);   // Left Turn Lane
  createTurnArrow(6.75, 26, Math.PI, false);  // Straight Lane
  createTurnArrow(6.75, 42, Math.PI, false);  // Straight Advance

  // East approach (traveling West toward center)
  createTurnArrow(26, -2.25, Math.PI / 2, true);   // Left Turn Lane
  createTurnArrow(26, -6.75, Math.PI / 2, false);  // Straight Lane

  // West approach (traveling East toward center)
  createTurnArrow(-26, 2.25, -Math.PI / 2, true);   // Left Turn Lane
  createTurnArrow(-26, 6.75, -Math.PI / 2, false);  // Straight Lane

  // 2. ADA Yellow Truncated Dome Detectable Warning Pads at Curb Ramps
  const padGeo = new THREE.PlaneGeometry(2.4, 1.2);
  const addAdaPad = (x: number, z: number, rotationY = 0) => {
    const pad = new THREE.Mesh(padGeo, adaYellowMat);
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = rotationY;
    pad.position.set(x, 0.36, z);
    group.add(pad);
  };

  addAdaPad(-4.5, -9.8, 0);
  addAdaPad(4.5, -9.8, 0);
  addAdaPad(-4.5, 9.8, 0);
  addAdaPad(4.5, 9.8, 0);
  addAdaPad(-9.8, -4.5, Math.PI / 2);
  addAdaPad(-9.8, 4.5, Math.PI / 2);
  addAdaPad(9.8, -4.5, Math.PI / 2);
  addAdaPad(9.8, 4.5, Math.PI / 2);

  // 3. Cast Iron Sewer Manhole Covers in Roadway
  const manholeGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.04, 24);
  const manholes = [
    { x: -5.5, z: -18.5 },
    { x: 5.5, z: 18.5 },
    { x: 18.5, z: -5.5 },
    { x: -18.5, z: 5.5 },
  ];
  manholes.forEach((mh) => {
    const cover = new THREE.Mesh(manholeGeo, castIronMat);
    cover.position.set(mh.x, 0.081, mh.z);
    cover.receiveShadow = true;
    group.add(cover);
  });

  // 4. Curbside Storm Sewer Catch Basin Grates
  const drainGeo = new THREE.BoxGeometry(0.85, 0.04, 1.4);
  const stormDrains = [
    { x: -9.2, z: -13.0, rot: 0 },
    { x: 9.2, z: 13.0, rot: 0 },
    { x: -13.0, z: 9.2, rot: Math.PI / 2 },
    { x: 13.0, z: -9.2, rot: Math.PI / 2 },
  ];
  stormDrains.forEach((sd) => {
    const drain = new THREE.Mesh(drainGeo, castIronMat);
    drain.rotation.y = sd.rot;
    drain.position.set(sd.x, 0.081, sd.z);
    drain.receiveShadow = true;
    group.add(drain);
  });

  scene.add(group);
  return group;
}

/**
 * Builds high-fidelity Street Furniture:
 * - Curved Modern LED Cantilever Streetlights with downlights
 * - Municipal Fire Hydrants
 * - Modern Glass Transit Bus Stop Shelter
 * - Pedestrian Safety Bollards
 */
export function buildStreetFurniture(
  scene: THREE.Scene,
  roadWidth: number,
  isNightMode: boolean
): { furnitureGroup: THREE.Group; streetlights: THREE.SpotLight[] } {
  const furnitureGroup = new THREE.Group();
  const streetlights: THREE.SpotLight[] = [];

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
  });

  const luminaireMat = new THREE.MeshBasicMaterial({
    color: 0xfffaed,
  });

  const hydrantRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.5,
    roughness: 0.35,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
  });

  // 1. Modern Curved LED Streetlights
  const createStreetlight = (x: number, z: number, rotationY: number) => {
    const slGroup = new THREE.Group();
    slGroup.position.set(x, 0.35, z);
    slGroup.rotation.y = rotationY;

    // Upright Pole (7.8m)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 7.8, 12), poleMat);
    pole.position.y = 3.9;
    pole.castShadow = true;
    slGroup.add(pole);

    // Cantilever Overhang Arm extending toward roadway
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.8, 10), poleMat);
    arm.rotation.z = Math.PI / 3;
    arm.position.set(1.5, 8.2, 0);
    arm.castShadow = true;
    slGroup.add(arm);

    // Modern Flat LED Luminaire Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.45), poleMat);
    head.position.set(3.0, 9.1, 0);
    slGroup.add(head);

    // Glowing LED Diffuser
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.32), luminaireMat);
    led.position.set(3.0, 9.0, 0);
    slGroup.add(led);

    // Realistic Downward Roadway Spotlight
    const spot = new THREE.SpotLight(0xfffaed, isNightMode ? 3.5 : 0.0, 28, Math.PI / 3.8, 0.45);
    spot.position.set(3.0, 9.0, 0);
    spot.target.position.set(3.0, 0, 0);
    slGroup.add(spot);
    slGroup.add(spot.target);
    streetlights.push(spot);

    furnitureGroup.add(slGroup);
  };

  const poleOffset = roadWidth / 2 + 1.8;
  createStreetlight(-poleOffset, -22, Math.PI / 2);
  createStreetlight(-poleOffset, 22, Math.PI / 2);
  createStreetlight(poleOffset, -22, -Math.PI / 2);
  createStreetlight(poleOffset, 22, -Math.PI / 2);

  createStreetlight(-22, -poleOffset, 0);
  createStreetlight(22, -poleOffset, 0);
  createStreetlight(-22, poleOffset, Math.PI);
  createStreetlight(22, poleOffset, Math.PI);

  // 2. High-Detail Municipal Fire Hydrants (Realistic 0.65m height)
  const createFireHydrant = (x: number, z: number) => {
    const hGroup = new THREE.Group();
    hGroup.position.set(x, 0.35, z);

    // Flanged Base Ring
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.08, 14), hydrantRedMat);
    base.position.y = 0.04;
    hGroup.add(base);

    // Main Hydrant Body Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.52, 14), hydrantRedMat);
    barrel.position.y = 0.34;
    barrel.castShadow = true;
    hGroup.add(barrel);

    // Top Operating Cap Bonnet & Pentagonal Nut
    const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), hydrantRedMat);
    topCap.position.y = 0.60;
    hGroup.add(topCap);

    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 5), brassMat);
    nut.position.y = 0.74;
    hGroup.add(nut);

    // Dual Brass Pumper Side Outlet Nozzles
    [-0.16, 0.16].forEach((nx) => {
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.12, 12), brassMat);
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(nx, 0.42, 0);
      hGroup.add(nozzle);
    });

    furnitureGroup.add(hGroup);
  };

  // Positioned back on corner plaza, away from pedestrian crosswalk path
  createFireHydrant(-14.5, -14.5);
  createFireHydrant(14.5, 14.5);

  // 3. Modern Glass Transit Bus Stop Shelter
  const createBusShelter = (x: number, z: number, rotationY: number) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, 0.35, z);
    bGroup.rotation.y = rotationY;

    // Steel Structural Uprights
    const frameMat = poleMat;
    [-2.2, 2.2].forEach((fx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 12), frameMat);
      col.position.set(fx, 1.6, -1.0);
      col.castShadow = true;
      bGroup.add(col);
    });

    // Cantilever Roof Canopy
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.15, 2.6), frameMat);
    roof.position.set(0, 3.2, 0);
    roof.castShadow = true;
    bGroup.add(roof);

    // Tempered Glass Rear Windscreen
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.5, 0.08), glassMat);
    rearGlass.position.set(0, 1.5, -1.0);
    bGroup.add(rearGlass);

    // Tempered Glass Side Screen
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 2.0), glassMat);
    sideGlass.position.set(-2.2, 1.5, 0);
    bGroup.add(sideGlass);

    // Interior Wood Bench
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.8 });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.55), woodMat);
    bench.position.set(0, 0.55, -0.6);
    bench.castShadow = true;
    bGroup.add(bench);

    // Illuminated Transit Schedule Kiosk Panel
    const kioskMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const kiosk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.06), kioskMat);
    kiosk.position.set(2.2, 1.6, 0);
    bGroup.add(kiosk);

    furnitureGroup.add(bGroup);
  };

  createBusShelter(-roadWidth / 2 - 3.8, -32, Math.PI / 2);
  createBusShelter(roadWidth / 2 + 3.8, 32, -Math.PI / 2);

  // 4. Stainless Steel Corner Pedestrian Bollards
  const bollardGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 14);
  const bollardMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });

  [
    [-10.2, -12.5], [-12.5, -10.2],
    [10.2, -12.5], [12.5, -10.2],
    [-10.2, 12.5], [-12.5, 10.2],
    [10.2, 12.5], [12.5, 10.2],
  ].forEach(([bx, bz]) => {
    const bollard = new THREE.Mesh(bollardGeo, bollardMat);
    bollard.position.set(bx, 0.85, bz);
    bollard.castShadow = true;
    furnitureGroup.add(bollard);
  });

  scene.add(furnitureGroup);
  return { furnitureGroup, streetlights };
}
