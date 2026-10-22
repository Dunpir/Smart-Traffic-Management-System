import * as THREE from 'three';

export interface FirstPersonHandsController {
  handsGroup: THREE.Group;
  update: (
    time: number,
    delta: number,
    isWalking: boolean,
    isSprint: boolean,
    walkCycle: number,
    moveX: number,
    isNearButton: boolean,
    isPushingButton: boolean,
    isWalkPhaseActive: boolean,
    isVisible: boolean
  ) => void;
  dispose: () => void;
}

/**
 * Builds an authentic AAA-grade First-Person Pedestrian hands and arms rig
 * that attaches to the Three.js camera.
 */
export function buildFirstPersonHandsRig(camera: THREE.PerspectiveCamera): FirstPersonHandsController {
  const handsGroup = new THREE.Group();
  handsGroup.visible = false;

  // Dedicated soft fill lights attached to camera so hands are always illuminated naturally
  const fppFillLight = new THREE.PointLight(0xffffff, 2.2, 2.5);
  fppFillLight.position.set(0, 0.1, -0.2);
  camera.add(fppFillLight);

  const fppAmbient = new THREE.AmbientLight(0xffffff, 1.2);
  camera.add(fppAmbient);

  // Materials with depthTest: false & depthWrite: false and renderOrder 9999
  // so hands never clip through buildings, ground, or vehicles.
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Modern dark technical charcoal jacket
    roughness: 0.5,
    metalness: 0.2,
    depthTest: false,
    depthWrite: false,
  });

  const hiVisStripeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    depthTest: false,
    depthWrite: false,
  });

  const cuffMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    depthTest: false,
    depthWrite: false,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf3c5a5, // Natural skin tone
    roughness: 0.65,
    metalness: 0.05,
    depthTest: false,
    depthWrite: false,
  });

  const watchCaseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.2,
    depthTest: false,
    depthWrite: false,
  });

  const watchScreenMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b,
    emissive: 0x10b981,
    emissiveIntensity: 2.2,
    roughness: 0.1,
    depthTest: false,
    depthWrite: false,
  });

  // ==========================================
  // LEFT ARM (Enters bottom-left, holds smartwatch)
  // ==========================================
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.24, -0.21, -0.38);
  leftArm.rotation.set(0.18, 0.28, -0.10);

  // Sleeve
  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.095, 0.26), sleeveMat);
  leftSleeve.position.set(0, 0, 0.07);
  leftArm.add(leftSleeve);

  // Hi-Vis Stripe
  const leftStripe = new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.015, 0.264), hiVisStripeMat);
  leftStripe.position.set(0, 0.045, 0.07);
  leftArm.add(leftStripe);

  // Cuff
  const leftCuff = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.09, 0.04), cuffMat);
  leftCuff.position.set(0, 0, -0.065);
  leftArm.add(leftCuff);

  // Smartwatch on wrist
  const watch = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.02, 0.065), watchCaseMat);
  watch.position.set(0, 0.048, -0.075);
  const watchScreen = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.005, 0.052), watchScreenMat);
  watchScreen.position.set(0, 0.011, 0);
  watch.add(watchScreen);
  leftArm.add(watch);

  // Left Palm
  const leftPalm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.038, 0.10), skinMat);
  leftPalm.position.set(0, 0, -0.135);
  leftArm.add(leftPalm);

  // Left Thumb
  const leftThumb = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.024, 0.05), skinMat);
  leftThumb.position.set(0.048, 0.01, -0.12);
  leftThumb.rotation.y = -0.35;
  leftArm.add(leftThumb);

  // Left Fingers
  const leftFingers = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.028, 0.07), skinMat);
  leftFingers.position.set(0, -0.006, -0.205);
  leftFingers.rotation.x = -0.15;
  leftArm.add(leftFingers);

  handsGroup.add(leftArm);

  // ==========================================
  // RIGHT ARM (Enters bottom-right, pointer finger for push button)
  // ==========================================
  const rightArm = new THREE.Group();
  rightArm.position.set(0.24, -0.21, -0.38);
  rightArm.rotation.set(0.18, -0.28, 0.10);

  // Sleeve
  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.095, 0.26), sleeveMat);
  rightSleeve.position.set(0, 0, 0.07);
  rightArm.add(rightSleeve);

  // Hi-Vis Stripe
  const rightStripe = new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.015, 0.264), hiVisStripeMat);
  rightStripe.position.set(0, 0.045, 0.07);
  rightArm.add(rightStripe);

  // Cuff
  const rightCuff = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.09, 0.04), cuffMat);
  rightCuff.position.set(0, 0, -0.065);
  rightArm.add(rightCuff);

  // Right Palm
  const rightPalm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.038, 0.10), skinMat);
  rightPalm.position.set(0, 0, -0.135);
  rightArm.add(rightPalm);

  // Right Thumb
  const rightThumb = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.024, 0.05), skinMat);
  rightThumb.position.set(-0.048, 0.01, -0.12);
  rightThumb.rotation.y = 0.35;
  rightArm.add(rightThumb);

  // Right Lower Fingers
  const rightFingers = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.028, 0.065), skinMat);
  rightFingers.position.set(0.015, -0.006, -0.205);
  rightFingers.rotation.x = -0.18;
  rightArm.add(rightFingers);

  // Right Index Pointer Finger (Points forward / reaches to push button)
  const pointerFinger = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.022, 0.08), skinMat);
  pointerFinger.position.set(-0.026, 0.008, -0.225);
  rightArm.add(pointerFinger);

  handsGroup.add(rightArm);

  // Ensure top render order and zero frustum culling
  handsGroup.traverse((obj) => {
    obj.frustumCulled = false;
    obj.renderOrder = 9999;
  });

  camera.add(handsGroup);

  // Animation & Kinematics State
  let currentRoll = 0;
  let currentYawOffset = 0;

  const update = (
    time: number,
    delta: number,
    isWalking: boolean,
    isSprint: boolean,
    walkCycle: number,
    moveX: number,
    isNearButton: boolean,
    isPushingButton: boolean,
    isWalkPhaseActive: boolean,
    isVisible: boolean
  ) => {
    if (!isVisible) {
      if (handsGroup.visible) handsGroup.visible = false;
      return;
    }

    if (!handsGroup.visible) handsGroup.visible = true;

    // 1. Natural idle breathing oscillation
    const breath = Math.sin(time * 2.2) * 0.004;

    // 2. Walking / Sprint bobbing
    const bobY = isWalking ? Math.sin(walkCycle * 2) * (isSprint ? 0.022 : 0.014) : breath;
    const bobX = isWalking ? Math.cos(walkCycle) * (isSprint ? 0.016 : 0.009) : 0;

    // 3. Natural arm swing cadence
    const swingAmp = isWalking ? (isSprint ? 0.065 : 0.038) : 0;
    const leftSwing = Math.sin(walkCycle) * swingAmp;
    const rightSwing = -Math.sin(walkCycle) * swingAmp;

    // 4. Banking / Turn Lean
    let targetRoll = 0;
    let targetYawOffset = 0;
    let steerOffset = 0;

    if (moveX > 0) {
      targetRoll = 0.18;
      targetYawOffset = 0.14;
      steerOffset = 0.04;
    } else if (moveX < 0) {
      targetRoll = -0.18;
      targetYawOffset = -0.14;
      steerOffset = -0.04;
    }

    currentRoll += (targetRoll - currentRoll) * Math.min(1.0, 10 * delta);
    currentYawOffset += (targetYawOffset - currentYawOffset) * Math.min(1.0, 10 * delta);

    handsGroup.position.set(bobX, bobY, 0);
    handsGroup.rotation.z = currentRoll;
    handsGroup.rotation.y = currentYawOffset;

    // 5. Interactive Button Push Animation
    const buttonReach = isPushingButton ? 0.12 : (isNearButton ? 0.06 : 0);

    leftArm.position.set(
      -0.24,
      -0.21,
      -0.38 + leftSwing - steerOffset
    );

    rightArm.position.set(
      0.24,
      -0.21 + (isNearButton ? 0.04 : 0),
      -0.38 + rightSwing + steerOffset - buttonReach
    );

    pointerFinger.position.z = -0.225 - (isPushingButton ? 0.06 : (isNearButton ? 0.025 : 0));

    // 6. Smartwatch display status
    if (isWalkPhaseActive) {
      watchScreenMat.emissive.setHex(0x10b981); // Bright green safe walk
      watchScreenMat.emissiveIntensity = 2.8;
    } else if (isNearButton) {
      watchScreenMat.emissive.setHex(0xf59e0b); // Amber call prompt
      watchScreenMat.emissiveIntensity = 2.4;
    } else {
      watchScreenMat.emissive.setHex(0x0284c7); // Cool cyan idle
      watchScreenMat.emissiveIntensity = 1.6;
    }
  };

  const dispose = () => {
    camera.remove(handsGroup);
    camera.remove(fppFillLight);
    camera.remove(fppAmbient);
  };

  return { handsGroup, update, dispose };
}
