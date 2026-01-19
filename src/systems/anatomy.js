/**
 * Anatomical Systems for Artist's Toolkit
 * Implements human and animal anatomy with proper proportions
 * Based on classical anatomy (Bridgman, Loomis, Goldfinger)
 */

import { Vec3 } from '../utils/math3d.js';

/**
 * Human Anatomy System
 */
export const HumanLandmarks = [
  // Head
  { key: 'crown', name: 'Crown', group: 'head', color: '#ff6b6b', ideal: 0 },
  { key: 'chin', name: 'Chin', group: 'head', color: '#ff6b6b', ideal: 1 },
  { key: 'eyeL', name: 'Eye L', group: 'head', color: '#ff9999' },
  { key: 'eyeR', name: 'Eye R', group: 'head', color: '#ff9999' },
  { key: 'nose', name: 'Nose', group: 'head', color: '#ff9999' },
  { key: 'mouth', name: 'Mouth', group: 'head', color: '#ff9999' },
  { key: 'ear', name: 'Ear', group: 'head', color: '#ff9999' },

  // Torso
  { key: 'c7', name: 'C7 (Neck)', group: 'torso', color: '#4ecdc4', ideal: 1 },
  { key: 'shoulderL', name: 'Shoulder L', group: 'torso', color: '#4ecdc4', ideal: 1.5 },
  { key: 'shoulderR', name: 'Shoulder R', group: 'torso', color: '#4ecdc4', ideal: 1.5 },
  { key: 'sternumTop', name: 'Sternum Top', group: 'torso', color: '#4ecdc4', ideal: 1.5 },
  { key: 'nippleL', name: 'Nipple L', group: 'torso', color: '#66d9d9', ideal: 2 },
  { key: 'nippleR', name: 'Nipple R', group: 'torso', color: '#66d9d9', ideal: 2 },
  { key: 'sternumBottom', name: 'Sternum Base', group: 'torso', color: '#4ecdc4', ideal: 2.5 },
  { key: 'navel', name: 'Navel', group: 'torso', color: '#4ecdc4', ideal: 3 },
  { key: 'hipL', name: 'Hip L', group: 'torso', color: '#fd79a8', ideal: 4 },
  { key: 'hipR', name: 'Hip R', group: 'torso', color: '#fd79a8', ideal: 4 },
  { key: 'crotch', name: 'Crotch', group: 'torso', color: '#fd79a8', ideal: 4 },

  // Arms
  { key: 'elbowL', name: 'Elbow L', group: 'armL', color: '#45b7d1', ideal: 3 },
  { key: 'elbowR', name: 'Elbow R', group: 'armR', color: '#45b7d1', ideal: 3 },
  { key: 'wristL', name: 'Wrist L', group: 'armL', color: '#a29bfe', ideal: 4 },
  { key: 'wristR', name: 'Wrist R', group: 'armR', color: '#a29bfe', ideal: 4 },
  { key: 'handL', name: 'Hand L', group: 'armL', color: '#a29bfe', ideal: 4.75 },
  { key: 'handR', name: 'Hand R', group: 'armR', color: '#a29bfe', ideal: 4.75 },

  // Legs
  { key: 'kneeL', name: 'Knee L', group: 'legL', color: '#00b894', ideal: 6 },
  { key: 'kneeR', name: 'Knee R', group: 'legR', color: '#00b894', ideal: 6 },
  { key: 'ankleL', name: 'Ankle L', group: 'legL', color: '#0984e3', ideal: 7.5 },
  { key: 'ankleR', name: 'Ankle R', group: 'legR', color: '#0984e3', ideal: 7.5 },
  { key: 'footL', name: 'Foot L', group: 'legL', color: '#6c5ce7', ideal: 8 },
  { key: 'footR', name: 'Foot R', group: 'legR', color: '#6c5ce7', ideal: 8 },
];

export const HumanLimbSegments = [
  // Head
  { id: 'head', from: 'crown', to: 'chin', name: 'Head', idealHeads: 1, thickness: 0.35 },

  // Neck and Shoulders
  { id: 'neck', from: 'chin', to: 'c7', name: 'Neck', idealHeads: 0.3, thickness: 0.18 },
  { id: 'clavicleL', from: 'c7', to: 'shoulderL', name: 'Clavicle L', idealHeads: 0.5, thickness: 0.12 },
  { id: 'clavicleR', from: 'c7', to: 'shoulderR', name: 'Clavicle R', idealHeads: 0.5, thickness: 0.12 },

  // Arms
  { id: 'upperArmL', from: 'shoulderL', to: 'elbowL', name: 'Upper Arm L', idealHeads: 1.3, thickness: 0.22 },
  { id: 'upperArmR', from: 'shoulderR', to: 'elbowR', name: 'Upper Arm R', idealHeads: 1.3, thickness: 0.22 },
  { id: 'forearmL', from: 'elbowL', to: 'wristL', name: 'Forearm L', idealHeads: 1.2, thickness: 0.18 },
  { id: 'forearmR', from: 'elbowR', to: 'wristR', name: 'Forearm R', idealHeads: 1.2, thickness: 0.18 },
  { id: 'handL', from: 'wristL', to: 'handL', name: 'Hand L', idealHeads: 0.75, thickness: 0.12 },
  { id: 'handR', from: 'wristR', to: 'handR', name: 'Hand R', idealHeads: 0.75, thickness: 0.12 },

  // Torso - Rib cage and Pelvis
  { id: 'torsoUpper', from: 'c7', to: 'sternumBottom', name: 'Rib Cage', idealHeads: 1.2, thickness: 0.45 },
  { id: 'torsoLower', from: 'sternumBottom', to: 'crotch', name: 'Abdomen', idealHeads: 1.5, thickness: 0.38 },

  // Pelvis connections
  { id: 'pelvisL', from: 'crotch', to: 'hipL', name: 'Pelvis L', idealHeads: 0.3, thickness: 0.25 },
  { id: 'pelvisR', from: 'crotch', to: 'hipR', name: 'Pelvis R', idealHeads: 0.3, thickness: 0.25 },

  // Legs
  { id: 'thighL', from: 'hipL', to: 'kneeL', name: 'Thigh L', idealHeads: 2, thickness: 0.28 },
  { id: 'thighR', from: 'hipR', to: 'kneeR', name: 'Thigh R', idealHeads: 2, thickness: 0.28 },
  { id: 'shinL', from: 'kneeL', to: 'ankleL', name: 'Shin L', idealHeads: 1.8, thickness: 0.20 },
  { id: 'shinR', from: 'kneeR', to: 'ankleR', name: 'Shin R', idealHeads: 1.8, thickness: 0.20 },
  { id: 'footL', from: 'ankleL', to: 'footL', name: 'Foot L', idealHeads: 0.5, thickness: 0.14 },
  { id: 'footR', from: 'ankleR', to: 'footR', name: 'Foot R', idealHeads: 0.5, thickness: 0.14 },
];

/**
 * Animal Anatomy - Quadruped System
 */
export const QuadrupedTypes = {
  HORSE: 'horse',
  DOG: 'dog',
  CAT: 'cat',
  DEER: 'deer',
  LION: 'lion'
};

export const QuadrupedLandmarks = [
  // Head
  { key: 'muzzle', name: 'Muzzle', group: 'head', color: '#ff6b6b' },
  { key: 'skull', name: 'Skull', group: 'head', color: '#ff6b6b' },
  { key: 'eye', name: 'Eye', group: 'head', color: '#ff9999' },
  { key: 'ear', name: 'Ear', group: 'head', color: '#ff9999' },

  // Spine/Torso
  { key: 'c1', name: 'C1 (Atlas)', group: 'spine', color: '#4ecdc4' },
  { key: 'withers', name: 'Withers', group: 'spine', color: '#4ecdc4' },
  { key: 'midBack', name: 'Mid Back', group: 'spine', color: '#4ecdc4' },
  { key: 'croup', name: 'Croup/Rump', group: 'spine', color: '#4ecdc4' },
  { key: 'tailBase', name: 'Tail Base', group: 'spine', color: '#fd79a8' },
  { key: 'chestBottom', name: 'Chest Bottom', group: 'torso', color: '#66d9d9' },
  { key: 'bellyLowest', name: 'Belly Lowest', group: 'torso', color: '#66d9d9' },

  // Front Legs (Left)
  { key: 'shoulderFL', name: 'Shoulder FL', group: 'legFL', color: '#45b7d1' },
  { key: 'elbowFL', name: 'Elbow FL', group: 'legFL', color: '#45b7d1' },
  { key: 'kneeFL', name: 'Knee/Carpus FL', group: 'legFL', color: '#45b7d1' },
  { key: 'fetlockFL', name: 'Fetlock FL', group: 'legFL', color: '#a29bfe' },
  { key: 'hoofFL', name: 'Hoof/Paw FL', group: 'legFL', color: '#a29bfe' },

  // Front Legs (Right)
  { key: 'shoulderFR', name: 'Shoulder FR', group: 'legFR', color: '#45b7d1' },
  { key: 'elbowFR', name: 'Elbow FR', group: 'legFR', color: '#45b7d1' },
  { key: 'kneeFR', name: 'Knee/Carpus FR', group: 'legFR', color: '#45b7d1' },
  { key: 'fetlockFR', name: 'Fetlock FR', group: 'legFR', color: '#a29bfe' },
  { key: 'hoofFR', name: 'Hoof/Paw FR', group: 'legFR', color: '#a29bfe' },

  // Hind Legs (Left)
  { key: 'hipHL', name: 'Hip HL', group: 'legHL', color: '#00b894' },
  { key: 'stifleHL', name: 'Stifle/Knee HL', group: 'legHL', color: '#00b894' },
  { key: 'hockHL', name: 'Hock HL', group: 'legHL', color: '#0984e3' },
  { key: 'fetlockHL', name: 'Fetlock HL', group: 'legHL', color: '#6c5ce7' },
  { key: 'hoofHL', name: 'Hoof/Paw HL', group: 'legHL', color: '#6c5ce7' },

  // Hind Legs (Right)
  { key: 'hipHR', name: 'Hip HR', group: 'legHR', color: '#00b894' },
  { key: 'stifleHR', name: 'Stifle/Knee HR', group: 'legHR', color: '#00b894' },
  { key: 'hockHR', name: 'Hock HR', group: 'legHR', color: '#0984e3' },
  { key: 'fetlockHR', name: 'Fetlock HR', group: 'legHR', color: '#6c5ce7' },
  { key: 'hoofHR', name: 'Hoof/Paw HR', group: 'legHR', color: '#6c5ce7' },
];

export const QuadrupedLimbSegments = [
  // Front legs
  { id: 'upperArmFL', from: 'shoulderFL', to: 'elbowFL', name: 'Upper Arm FL', thickness: 0.25 },
  { id: 'forearmFL', from: 'elbowFL', to: 'kneeFL', name: 'Forearm FL', thickness: 0.2 },
  { id: 'cannonFL', from: 'kneeFL', to: 'fetlockFL', name: 'Cannon FL', thickness: 0.12 },
  { id: 'pasternFL', from: 'fetlockFL', to: 'hoofFL', name: 'Pastern FL', thickness: 0.1 },

  { id: 'upperArmFR', from: 'shoulderFR', to: 'elbowFR', name: 'Upper Arm FR', thickness: 0.25 },
  { id: 'forearmFR', from: 'elbowFR', to: 'kneeFR', name: 'Forearm FR', thickness: 0.2 },
  { id: 'cannonFR', from: 'kneeFR', to: 'fetlockFR', name: 'Cannon FR', thickness: 0.12 },
  { id: 'pasternFR', from: 'fetlockFR', to: 'hoofFR', name: 'Pastern FR', thickness: 0.1 },

  // Hind legs
  { id: 'thighHL', from: 'hipHL', to: 'stifleHL', name: 'Thigh HL', thickness: 0.3 },
  { id: 'gaskinHL', from: 'stifleHL', to: 'hockHL', name: 'Gaskin HL', thickness: 0.22 },
  { id: 'cannonHL', from: 'hockHL', to: 'fetlockHL', name: 'Cannon HL', thickness: 0.13 },
  { id: 'pasternHL', from: 'fetlockHL', to: 'hoofHL', name: 'Pastern HL', thickness: 0.1 },

  { id: 'thighHR', from: 'hipHR', to: 'stifleHR', name: 'Thigh HR', thickness: 0.3 },
  { id: 'gaskinHR', from: 'stifleHR', to: 'hockHR', name: 'Gaskin HR', thickness: 0.22 },
  { id: 'cannonHR', from: 'hockHR', to: 'fetlockHR', name: 'Cannon HR', thickness: 0.13 },
  { id: 'pasternHR', from: 'fetlockHR', to: 'hoofHR', name: 'Pastern HR', thickness: 0.1 },

  // Spine/torso
  { id: 'neck', from: 'skull', to: 'withers', name: 'Neck', thickness: 0.3 },
  { id: 'thorax', from: 'withers', to: 'midBack', name: 'Thorax', thickness: 0.4 },
  { id: 'lumbar', from: 'midBack', to: 'croup', name: 'Lumbar', thickness: 0.35 },
  { id: 'pelvis', from: 'croup', to: 'tailBase', name: 'Pelvis', thickness: 0.3 },
];

/**
 * Anatomical Proportions Database
 */
export const AnatomyProportions = {
  human: {
    '8-head-heroic': {
      name: '8 Head Heroic',
      description: 'Idealized heroic proportions',
      headRatio: 8,
      shoulderWidth: 2.5,
      hipWidth: 1.8,
      measurements: {
        chin: 1, nipples: 2, navel: 3, crotch: 4, midThigh: 5, knee: 6, midCalf: 7, feet: 8
      }
    },
    '7.5-head-ideal': {
      name: '7.5 Head Ideal',
      description: 'Standard ideal proportions',
      headRatio: 7.5,
      shoulderWidth: 2.3,
      hipWidth: 1.7,
    },
    '7-head-normal': {
      name: '7 Head Normal',
      description: 'Average human proportions',
      headRatio: 7,
      shoulderWidth: 2,
      hipWidth: 1.6,
    },
    '6-head-stylized': {
      name: '6 Head Stylized',
      description: 'Stylized/cartoon proportions',
      headRatio: 6,
      shoulderWidth: 1.8,
      hipWidth: 1.5,
    }
  },

  quadruped: {
    horse: {
      name: 'Horse',
      headLength: 1,
      bodyLength: 2.5,
      shoulderHeight: 4,
      legProportion: 0.55, // Legs are ~55% of height
      neckLength: 1.2,
    },
    dog: {
      name: 'Dog (Medium)',
      headLength: 1,
      bodyLength: 2.2,
      shoulderHeight: 2.5,
      legProportion: 0.5,
      neckLength: 0.6,
    },
    cat: {
      name: 'Cat',
      headLength: 1,
      bodyLength: 2,
      shoulderHeight: 2,
      legProportion: 0.45,
      neckLength: 0.4,
    }
  }
};

/**
 * Muscle Groups for Mass Rendering
 */
export const HumanMuscleGroups = {
  head: {
    skull: { shape: 'ellipsoid', size: [0.35, 0.5, 0.4] },
    jaw: { shape: 'box', size: [0.25, 0.15, 0.2] }
  },
  torso: {
    ribCage: { shape: 'egg', size: [0.9, 1.4, 0.6] },
    abdomen: { shape: 'tapered-box', size: [0.8, 1.2, 0.5] },
    pelvis: { shape: 'box', size: [1.1, 0.8, 0.7] }
  },
  shoulder: {
    deltoid: { shape: 'cap', attachment: 'shoulder' },
    trapezius: { shape: 'kite', attachment: 'neck-to-shoulder' }
  },
  arm: {
    bicep: { shape: 'ellipsoid', position: 'upperArm-front' },
    tricep: { shape: 'horseshoe', position: 'upperArm-back' },
    forearmExtensor: { shape: 'tapered-cylinder', position: 'forearm-top' },
    forearmFlexor: { shape: 'tapered-cylinder', position: 'forearm-bottom' }
  },
  leg: {
    quadriceps: { shape: 'teardrop', position: 'thigh-front' },
    hamstring: { shape: 'dual-bundle', position: 'thigh-back' },
    calf: { shape: 'diamond', position: 'shin-back' },
    tibialisAnterior: { shape: 'thin-teardrop', position: 'shin-front' }
  }
};

/**
 * Anatomy Helper Functions
 */
export const AnatomyUtils = {
  /**
   * Calculate head unit from crown and chin landmarks
   */
  getHeadUnit(landmarks) {
    if (!landmarks.crown || !landmarks.chin) return null;
    const dx = landmarks.chin.x - landmarks.crown.x;
    const dy = landmarks.chin.y - landmarks.crown.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Get ideal position for a landmark based on 8-head canon
   */
  getIdealPosition(crownPos, chinPos, landmarkKey) {
    const landmark = HumanLandmarks.find(l => l.key === landmarkKey);
    if (!landmark || landmark.ideal === undefined) return null;

    const headUnit = this.getHeadUnit({ crown: crownPos, chin: chinPos });
    const angle = Math.atan2(chinPos.y - crownPos.y, chinPos.x - crownPos.x);

    return {
      x: crownPos.x + Math.cos(angle) * headUnit * landmark.ideal,
      y: crownPos.y + Math.sin(angle) * headUnit * landmark.ideal
    };
  },

  /**
   * Analyze proportions and return notes
   */
  analyzeProportions(landmarks, type = 'human') {
    const notes = [];

    if (type === 'human') {
      const headUnit = this.getHeadUnit(landmarks);
      if (!headUnit) return notes;

      // Check shoulder width
      if (landmarks.shoulderL && landmarks.shoulderR) {
        const sw = this.distance(landmarks.shoulderL, landmarks.shoulderR) / headUnit;
        notes.push({ type: 'measurement', text: `Shoulders: ${sw.toFixed(2)} heads`, ideal: 2.0, actual: sw });
      }

      // Check hip width
      if (landmarks.hipL && landmarks.hipR) {
        const hw = this.distance(landmarks.hipL, landmarks.hipR) / headUnit;
        notes.push({ type: 'measurement', text: `Hips: ${hw.toFixed(2)} heads`, ideal: 1.7, actual: hw });
      }

      // Check contrapposto
      if (landmarks.shoulderL && landmarks.shoulderR && landmarks.hipL && landmarks.hipR) {
        const sTilt = this.angle(landmarks.shoulderL, landmarks.shoulderR);
        const hTilt = this.angle(landmarks.hipL, landmarks.hipR);
        const diff = Math.abs((sTilt - hTilt) * 180 / Math.PI);
        if (diff > 3) {
          notes.push({ type: 'observation', text: `✓ Contrapposto: ${diff.toFixed(1)}°` });
        }
      }

      // Check total height
      if (landmarks.crown && landmarks.footL) {
        const totalHeight = this.distance(landmarks.crown, landmarks.footL) / headUnit;
        notes.push({ type: 'proportion', text: `Total: ${totalHeight.toFixed(1)} heads`, ideal: 8, actual: totalHeight });
      }
    }

    return notes;
  },

  distance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  },

  angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  },

  midpoint(p1, p2) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }
};
