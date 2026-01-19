/**
 * Mannequin System - Bridgman/Loomis/Hampton Style Anatomical Forms
 * Professional figure construction with proper 3D volumes
 */

import { Vec3 } from '../utils/math3d.js';

/**
 * Base class for all anatomical forms
 */
export class AnatomicalForm {
  constructor(type, options = {}) {
    this.type = type;
    this.vertices = [];
    this.faces = [];
    this.edges = [];
    this.normals = [];

    // Transform
    this.position = options.position || new Vec3(0, 0, 0);
    this.rotation = options.rotation || new Vec3(0, 0, 0);
    this.scale = options.scale || new Vec3(1, 1, 1);

    // Visual
    this.color = options.color || '#6699cc';
    this.opacity = options.opacity || 0.7;

    // Metadata
    this.name = options.name || type;
    this.landmarks = options.landmarks || [];
  }

  /**
   * Get transformed vertices
   */
  getWorldVertices() {
    const cos = Math.cos;
    const sin = Math.sin;
    const rx = this.rotation.x;
    const ry = this.rotation.y;
    const rz = this.rotation.z;

    return this.vertices.map(v => {
      // Scale
      let x = v.x * this.scale.x;
      let y = v.y * this.scale.y;
      let z = v.z * this.scale.z;

      // Rotate X
      let y1 = y * cos(rx) - z * sin(rx);
      let z1 = y * sin(rx) + z * cos(rx);
      y = y1;
      z = z1;

      // Rotate Y
      let x1 = x * cos(ry) + z * sin(ry);
      z1 = -x * sin(ry) + z * cos(ry);
      x = x1;
      z = z1;

      // Rotate Z
      x1 = x * cos(rz) - y * sin(rz);
      y1 = x * sin(rz) + y * cos(rz);
      x = x1;
      y = y1;

      // Translate
      return new Vec3(
        x + this.position.x,
        y + this.position.y,
        z + this.position.z
      );
    });
  }

  /**
   * Calculate face normals for lighting
   */
  calculateNormals() {
    this.normals = this.faces.map(face => {
      if (face.length < 3) return new Vec3(0, 0, 1);

      const v0 = this.vertices[face[0]];
      const v1 = this.vertices[face[1]];
      const v2 = this.vertices[face[2]];

      const edge1 = new Vec3(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z);
      const edge2 = new Vec3(v2.x - v0.x, v2.y - v0.y, v2.z - v0.z);

      // Cross product
      const normal = new Vec3(
        edge1.y * edge2.z - edge1.z * edge2.y,
        edge1.z * edge2.x - edge1.x * edge2.z,
        edge1.x * edge2.y - edge1.y * edge2.x
      );

      return normal.normalize();
    });
  }
}

/**
 * Box Form - Bridgman's fundamental building block
 * Used for torso, pelvis, head construction
 */
export class BoxForm extends AnatomicalForm {
  constructor(width, height, depth, options = {}) {
    super('box', options);
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.taper = options.taper || { top: 1, bottom: 1 }; // For tapered boxes
    this.generate();
  }

  generate() {
    const w = this.width / 2;
    const h = this.height / 2;
    const d = this.depth / 2;
    const tt = this.taper.top;
    const tb = this.taper.bottom;

    // 8 vertices of a (possibly tapered) box
    this.vertices = [
      // Bottom face (y = -h)
      new Vec3(-w * tb, -h, -d * tb),  // 0: back-left-bottom
      new Vec3(w * tb, -h, -d * tb),   // 1: back-right-bottom
      new Vec3(w * tb, -h, d * tb),    // 2: front-right-bottom
      new Vec3(-w * tb, -h, d * tb),   // 3: front-left-bottom
      // Top face (y = h)
      new Vec3(-w * tt, h, -d * tt),   // 4: back-left-top
      new Vec3(w * tt, h, -d * tt),    // 5: back-right-top
      new Vec3(w * tt, h, d * tt),     // 6: front-right-top
      new Vec3(-w * tt, h, d * tt),    // 7: front-left-top
    ];

    // 6 faces (quads)
    this.faces = [
      [0, 1, 2, 3], // Bottom
      [4, 7, 6, 5], // Top
      [0, 4, 5, 1], // Back
      [2, 6, 7, 3], // Front
      [0, 3, 7, 4], // Left
      [1, 5, 6, 2], // Right
    ];

    // 12 edges
    this.edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bottom
      [4, 5], [5, 6], [6, 7], [7, 4], // Top
      [0, 4], [1, 5], [2, 6], [3, 7], // Verticals
    ];

    this.calculateNormals();
  }
}

/**
 * Cylinder Form - For limbs
 * Can be tapered and have cross-section variations
 */
export class CylinderForm extends AnatomicalForm {
  constructor(radiusTop, radiusBottom, height, options = {}) {
    super('cylinder', options);
    this.radiusTop = radiusTop;
    this.radiusBottom = radiusBottom;
    this.height = height;
    this.segments = options.segments || 12;
    this.crossSection = options.crossSection || 'circle'; // 'circle', 'oval', 'rectangle'
    this.ovalRatio = options.ovalRatio || 0.7; // For oval cross-section
    this.generate();
  }

  generate() {
    const h = this.height / 2;
    const segs = this.segments;

    this.vertices = [];
    this.faces = [];
    this.edges = [];

    // Generate vertices for top and bottom circles
    for (let i = 0; i <= segs; i++) {
      const angle = (i / segs) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Apply cross-section shape
      let xMod = 1, zMod = 1;
      if (this.crossSection === 'oval') {
        zMod = this.ovalRatio;
      }

      // Bottom vertex
      this.vertices.push(new Vec3(
        cos * this.radiusBottom * xMod,
        -h,
        sin * this.radiusBottom * zMod
      ));

      // Top vertex
      this.vertices.push(new Vec3(
        cos * this.radiusTop * xMod,
        h,
        sin * this.radiusTop * zMod
      ));
    }

    // Generate faces and edges
    for (let i = 0; i < segs; i++) {
      const b1 = i * 2;
      const t1 = i * 2 + 1;
      const b2 = (i + 1) * 2;
      const t2 = (i + 1) * 2 + 1;

      // Side face (quad)
      this.faces.push([b1, b2, t2, t1]);

      // Edges
      this.edges.push([b1, b2]); // Bottom ring
      this.edges.push([t1, t2]); // Top ring
      this.edges.push([b1, t1]); // Vertical
    }

    this.calculateNormals();
  }
}

/**
 * Egg/Ovoid Form - For ribcage, head
 * Bridgman's egg shape with variable proportions
 */
export class EggForm extends AnatomicalForm {
  constructor(width, height, depth, options = {}) {
    super('egg', options);
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.pointiness = options.pointiness || 0.3; // How pointed the narrow end is
    this.narrowEnd = options.narrowEnd || 'bottom'; // 'top' or 'bottom'
    this.segments = options.segments || 12;
    this.rings = options.rings || 8;
    this.generate();
  }

  generate() {
    this.vertices = [];
    this.faces = [];
    this.edges = [];

    const segs = this.segments;
    const rings = this.rings;

    // Generate vertices
    for (let ring = 0; ring <= rings; ring++) {
      const v = ring / rings; // 0 to 1
      const phi = v * Math.PI; // 0 to PI

      // Modify radius based on egg shape
      let radiusMod = Math.sin(phi);

      // Apply pointiness to narrow end
      if (this.narrowEnd === 'bottom' && v > 0.5) {
        radiusMod *= 1 - (v - 0.5) * 2 * this.pointiness;
      } else if (this.narrowEnd === 'top' && v < 0.5) {
        radiusMod *= 1 - (0.5 - v) * 2 * this.pointiness;
      }

      const y = Math.cos(phi) * this.height / 2;

      for (let seg = 0; seg <= segs; seg++) {
        const u = seg / segs;
        const theta = u * Math.PI * 2;

        const x = Math.cos(theta) * this.width / 2 * radiusMod;
        const z = Math.sin(theta) * this.depth / 2 * radiusMod;

        this.vertices.push(new Vec3(x, y, z));
      }
    }

    // Generate faces
    for (let ring = 0; ring < rings; ring++) {
      for (let seg = 0; seg < segs; seg++) {
        const current = ring * (segs + 1) + seg;
        const next = current + segs + 1;

        this.faces.push([current, next, next + 1, current + 1]);
        this.edges.push([current, current + 1]);
        this.edges.push([current, next]);
      }
    }

    this.calculateNormals();
  }
}

/**
 * Wedge Form - For foot, simplified head planes
 */
export class WedgeForm extends AnatomicalForm {
  constructor(width, height, depth, options = {}) {
    super('wedge', options);
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.generate();
  }

  generate() {
    const w = this.width / 2;
    const h = this.height / 2;
    const d = this.depth / 2;

    // Wedge: triangle from the side
    this.vertices = [
      // Bottom rectangle
      new Vec3(-w, -h, -d),  // 0
      new Vec3(w, -h, -d),   // 1
      new Vec3(w, -h, d),    // 2
      new Vec3(-w, -h, d),   // 3
      // Top edge (wedge apex)
      new Vec3(-w, h, 0),    // 4
      new Vec3(w, h, 0),     // 5
    ];

    this.faces = [
      [0, 1, 2, 3], // Bottom
      [0, 4, 5, 1], // Back slope
      [2, 5, 4, 3], // Front slope
      [0, 3, 4],    // Left triangle
      [1, 5, 2],    // Right triangle
    ];

    this.edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bottom
      [4, 5],                          // Top
      [0, 4], [1, 5], [2, 5], [3, 4], // Slopes
    ];

    this.calculateNormals();
  }
}

/**
 * Sphere Form - For joints, Loomis head construction
 */
export class SphereForm extends AnatomicalForm {
  constructor(radius, options = {}) {
    super('sphere', options);
    this.radius = radius;
    this.segments = options.segments || 12;
    this.rings = options.rings || 8;
    this.generate();
  }

  generate() {
    this.vertices = [];
    this.faces = [];
    this.edges = [];

    const segs = this.segments;
    const rings = this.rings;

    for (let ring = 0; ring <= rings; ring++) {
      const phi = (ring / rings) * Math.PI;
      const y = Math.cos(phi) * this.radius;
      const ringRadius = Math.sin(phi) * this.radius;

      for (let seg = 0; seg <= segs; seg++) {
        const theta = (seg / segs) * Math.PI * 2;
        const x = Math.cos(theta) * ringRadius;
        const z = Math.sin(theta) * ringRadius;

        this.vertices.push(new Vec3(x, y, z));
      }
    }

    for (let ring = 0; ring < rings; ring++) {
      for (let seg = 0; seg < segs; seg++) {
        const current = ring * (segs + 1) + seg;
        const next = current + segs + 1;

        this.faces.push([current, next, next + 1, current + 1]);
        this.edges.push([current, current + 1]);
        this.edges.push([current, next]);
      }
    }

    this.calculateNormals();
  }
}

/**
 * Loomis Head Construction
 * Sphere + face plane + jaw
 */
export class LoomisHead extends AnatomicalForm {
  constructor(size = 50, options = {}) {
    super('loomis-head', options);
    this.size = size;
    this.generate();
  }

  generate() {
    // Cranium sphere
    const cranium = new SphereForm(this.size * 0.5, { segments: 8, rings: 6 });

    // Face plane wedge
    const facePlane = new WedgeForm(
      this.size * 0.35,
      this.size * 0.4,
      this.size * 0.25
    );
    facePlane.position = new Vec3(0, -this.size * 0.15, this.size * 0.35);

    // Combine geometries
    this.vertices = [
      ...cranium.vertices,
      ...facePlane.getWorldVertices()
    ];

    const offset = cranium.vertices.length;
    this.faces = [
      ...cranium.faces,
      ...facePlane.faces.map(face => face.map(i => i + offset))
    ];

    this.edges = [
      ...cranium.edges,
      ...facePlane.edges.map(edge => edge.map(i => i + offset))
    ];

    this.calculateNormals();
  }
}

/**
 * Ribcage Form - Bridgman's egg-shaped thorax
 */
export class RibcageForm extends AnatomicalForm {
  constructor(width = 80, height = 100, depth = 60, options = {}) {
    super('ribcage', options);

    // Create tapered egg shape (wider at top)
    const egg = new EggForm(width, height, depth, {
      pointiness: 0.2,
      narrowEnd: 'bottom',
      segments: 10,
      rings: 8
    });

    this.vertices = egg.vertices;
    this.faces = egg.faces;
    this.edges = egg.edges;
    this.normals = egg.normals;

    // Define landmark attachment points
    this.landmarks = {
      c7: new Vec3(0, height * 0.45, -depth * 0.3),
      sternumTop: new Vec3(0, height * 0.4, depth * 0.35),
      sternumBottom: new Vec3(0, -height * 0.3, depth * 0.3),
      shoulderL: new Vec3(-width * 0.5, height * 0.35, 0),
      shoulderR: new Vec3(width * 0.5, height * 0.35, 0)
    };
  }
}

/**
 * Pelvis Form - Bridgman's bucket/basin shape
 */
export class PelvisForm extends AnatomicalForm {
  constructor(width = 70, height = 50, depth = 50, options = {}) {
    super('pelvis', options);

    // Pelvis is like an inverted tapered box
    const box = new BoxForm(width, height, depth, {
      taper: { top: 1.1, bottom: 0.8 }
    });

    this.vertices = box.vertices;
    this.faces = box.faces;
    this.edges = box.edges;

    // Natural forward tilt
    this.rotation.x = -0.26; // About -15 degrees

    this.landmarks = {
      hipL: new Vec3(-width * 0.45, height * 0.2, 0),
      hipR: new Vec3(width * 0.45, height * 0.2, 0),
      crotch: new Vec3(0, -height * 0.4, depth * 0.2),
      sacrum: new Vec3(0, 0, -depth * 0.4)
    };

    this.calculateNormals();
  }
}

/**
 * Limb Segment - Tapered cylinder with cross-section variation
 * Based on Hampton's approach
 */
export class LimbSegment extends AnatomicalForm {
  constructor(length, radiusProximal, radiusDistal, options = {}) {
    super('limb', options);
    this.length = length;
    this.radiusProximal = radiusProximal;
    this.radiusDistal = radiusDistal;

    const cylinder = new CylinderForm(
      radiusDistal,
      radiusProximal,
      length,
      {
        segments: options.segments || 8,
        crossSection: options.crossSection || 'oval',
        ovalRatio: options.ovalRatio || 0.75
      }
    );

    this.vertices = cylinder.vertices;
    this.faces = cylinder.faces;
    this.edges = cylinder.edges;
    this.calculateNormals();
  }
}

/**
 * Complete Mannequin - Full figure with all body parts
 */
export class Mannequin {
  constructor(headUnits = 8, options = {}) {
    this.headUnits = headUnits;
    this.headSize = options.headSize || 50;
    this.unitSize = this.headSize; // One head unit

    this.parts = {};
    this.buildMannequin();
  }

  buildMannequin() {
    const u = this.unitSize; // Shorthand for head unit

    // HEAD - Loomis construction
    this.parts.head = new LoomisHead(u, {
      name: 'Head',
      color: '#ffccaa'
    });
    this.parts.head.position = new Vec3(0, u * 3.5, 0);

    // RIBCAGE - Bridgman egg
    this.parts.ribcage = new RibcageForm(u * 1.2, u * 1.4, u * 0.8, {
      name: 'Ribcage',
      color: '#aaccff'
    });
    this.parts.ribcage.position = new Vec3(0, u * 2, 0);

    // PELVIS - Bridgman bucket
    this.parts.pelvis = new PelvisForm(u * 1.0, u * 0.8, u * 0.6, {
      name: 'Pelvis',
      color: '#aaccff'
    });
    this.parts.pelvis.position = new Vec3(0, u * 0.4, 0);

    // UPPER ARMS
    this.parts.upperArmL = new LimbSegment(u * 1.3, u * 0.22, u * 0.18, {
      name: 'Upper Arm L',
      color: '#ffddcc',
      crossSection: 'oval'
    });
    this.parts.upperArmL.position = new Vec3(-u * 0.7, u * 2.5, 0);
    this.parts.upperArmL.rotation = new Vec3(0, 0, Math.PI / 2);

    this.parts.upperArmR = new LimbSegment(u * 1.3, u * 0.22, u * 0.18, {
      name: 'Upper Arm R',
      color: '#ffddcc',
      crossSection: 'oval'
    });
    this.parts.upperArmR.position = new Vec3(u * 0.7, u * 2.5, 0);
    this.parts.upperArmR.rotation = new Vec3(0, 0, -Math.PI / 2);

    // FOREARMS
    this.parts.forearmL = new LimbSegment(u * 1.2, u * 0.18, u * 0.12, {
      name: 'Forearm L',
      color: '#ffddcc',
      crossSection: 'oval',
      ovalRatio: 0.65
    });
    this.parts.forearmL.position = new Vec3(-u * 2.0, u * 2.5, 0);
    this.parts.forearmL.rotation = new Vec3(0, 0, Math.PI / 2);

    this.parts.forearmR = new LimbSegment(u * 1.2, u * 0.18, u * 0.12, {
      name: 'Forearm R',
      color: '#ffddcc',
      crossSection: 'oval',
      ovalRatio: 0.65
    });
    this.parts.forearmR.position = new Vec3(u * 2.0, u * 2.5, 0);
    this.parts.forearmR.rotation = new Vec3(0, 0, -Math.PI / 2);

    // THIGHS
    this.parts.thighL = new LimbSegment(u * 1.8, u * 0.28, u * 0.22, {
      name: 'Thigh L',
      color: '#ffddcc',
      crossSection: 'oval',
      ovalRatio: 0.8
    });
    this.parts.thighL.position = new Vec3(-u * 0.35, -u * 0.5, 0);

    this.parts.thighR = new LimbSegment(u * 1.8, u * 0.28, u * 0.22, {
      name: 'Thigh R',
      color: '#ffddcc',
      crossSection: 'oval',
      ovalRatio: 0.8
    });
    this.parts.thighR.position = new Vec3(u * 0.35, -u * 0.5, 0);

    // LOWER LEGS
    this.parts.lowerLegL = new LimbSegment(u * 1.6, u * 0.20, u * 0.12, {
      name: 'Lower Leg L',
      color: '#ffddcc',
      crossSection: 'oval',
      ovalRatio: 0.7
    });
    this.parts.lowerLegL.position = new Vec3(-u * 0.35, -u * 2.4, 0);

    this.parts.lowerLegR = new LimbSegment(u * 1.6, u * 0.20, u * 0.12, {
      name: 'Lower Leg R',
      color: '#ffddcc',
      crossSection: 'oval',
      ovalRatio: 0.7
    });
    this.parts.lowerLegR.position = new Vec3(u * 0.35, -u * 2.4, 0);

    // FEET
    this.parts.footL = new WedgeForm(u * 0.3, u * 0.15, u * 0.5, {
      name: 'Foot L',
      color: '#ffddcc'
    });
    this.parts.footL.position = new Vec3(-u * 0.35, -u * 3.9, u * 0.15);
    this.parts.footL.rotation = new Vec3(-Math.PI / 2, 0, 0);

    this.parts.footR = new WedgeForm(u * 0.3, u * 0.15, u * 0.5, {
      name: 'Foot R',
      color: '#ffddcc'
    });
    this.parts.footR.position = new Vec3(u * 0.35, -u * 3.9, u * 0.15);
    this.parts.footR.rotation = new Vec3(-Math.PI / 2, 0, 0);

    // HANDS (simplified boxes)
    this.parts.handL = new BoxForm(u * 0.25, u * 0.35, u * 0.1, {
      name: 'Hand L',
      color: '#ffddcc'
    });
    this.parts.handL.position = new Vec3(-u * 2.8, u * 2.5, 0);

    this.parts.handR = new BoxForm(u * 0.25, u * 0.35, u * 0.1, {
      name: 'Hand R',
      color: '#ffddcc'
    });
    this.parts.handR.position = new Vec3(u * 2.8, u * 2.5, 0);
  }

  /**
   * Get all parts for rendering
   */
  getAllParts() {
    return Object.values(this.parts);
  }

  /**
   * Update mannequin pose from landmarks
   */
  updateFromLandmarks(landmarks) {
    // Position head between crown and chin
    if (landmarks.crown && landmarks.chin) {
      const headCenter = {
        x: (landmarks.crown.x + landmarks.chin.x) / 2,
        y: (landmarks.crown.y + landmarks.chin.y) / 2,
        z: (landmarks.crown.z + landmarks.chin.z) / 2
      };
      this.parts.head.position = new Vec3(headCenter.x, headCenter.y, headCenter.z);

      // Calculate head rotation from crown-chin line
      const dx = landmarks.chin.x - landmarks.crown.x;
      const dy = landmarks.chin.y - landmarks.crown.y;
      const dz = landmarks.chin.z - landmarks.crown.z;
      this.parts.head.rotation = new Vec3(
        Math.atan2(dz, dy),
        Math.atan2(dx, dy),
        0
      );
    }

    // Position ribcage
    if (landmarks.c7 && landmarks.sternumBottom) {
      const ribCenter = {
        x: (landmarks.c7.x + landmarks.sternumBottom.x) / 2,
        y: (landmarks.c7.y + landmarks.sternumBottom.y) / 2,
        z: (landmarks.c7.z + landmarks.sternumBottom.z) / 2
      };
      this.parts.ribcage.position = new Vec3(ribCenter.x, ribCenter.y, ribCenter.z);
    }

    // Position pelvis
    if (landmarks.crotch && landmarks.hipL && landmarks.hipR) {
      const pelvisCenter = {
        x: landmarks.crotch.x,
        y: (landmarks.crotch.y + landmarks.hipL.y + landmarks.hipR.y) / 3,
        z: landmarks.crotch.z
      };
      this.parts.pelvis.position = new Vec3(pelvisCenter.x, pelvisCenter.y, pelvisCenter.z);
    }

    // Continue for limbs...
    this.updateLimbs(landmarks);
  }

  updateLimbs(landmarks) {
    // Upper arm L
    if (landmarks.shoulderL && landmarks.elbowL) {
      this.positionLimb('upperArmL', landmarks.shoulderL, landmarks.elbowL);
    }

    // Upper arm R
    if (landmarks.shoulderR && landmarks.elbowR) {
      this.positionLimb('upperArmR', landmarks.shoulderR, landmarks.elbowR);
    }

    // Forearm L
    if (landmarks.elbowL && landmarks.wristL) {
      this.positionLimb('forearmL', landmarks.elbowL, landmarks.wristL);
    }

    // Forearm R
    if (landmarks.elbowR && landmarks.wristR) {
      this.positionLimb('forearmR', landmarks.elbowR, landmarks.wristR);
    }

    // Thigh L
    if (landmarks.hipL && landmarks.kneeL) {
      this.positionLimb('thighL', landmarks.hipL, landmarks.kneeL);
    }

    // Thigh R
    if (landmarks.hipR && landmarks.kneeR) {
      this.positionLimb('thighR', landmarks.hipR, landmarks.kneeR);
    }

    // Lower leg L
    if (landmarks.kneeL && landmarks.ankleL) {
      this.positionLimb('lowerLegL', landmarks.kneeL, landmarks.ankleL);
    }

    // Lower leg R
    if (landmarks.kneeR && landmarks.ankleR) {
      this.positionLimb('lowerLegR', landmarks.kneeR, landmarks.ankleR);
    }
  }

  positionLimb(partName, startLandmark, endLandmark) {
    const part = this.parts[partName];
    if (!part) return;

    // Center position
    part.position = new Vec3(
      (startLandmark.x + endLandmark.x) / 2,
      (startLandmark.y + endLandmark.y) / 2,
      ((startLandmark.z || 300) + (endLandmark.z || 300)) / 2
    );

    // Calculate rotation to align with landmarks
    const dx = endLandmark.x - startLandmark.x;
    const dy = endLandmark.y - startLandmark.y;
    const dz = (endLandmark.z || 300) - (startLandmark.z || 300);

    // Rotation to point from start to end
    const angleY = Math.atan2(dx, dz);
    const angleX = Math.atan2(-dy, Math.sqrt(dx * dx + dz * dz));

    part.rotation = new Vec3(angleX, angleY, 0);

    // Scale to match landmark distance
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const originalLength = part.length || part.height || 50;
    const scaleFactor = length / originalLength;

    part.scale = new Vec3(1, scaleFactor, 1);
  }
}

/**
 * Body part definitions for form generation
 */
export const BodyPartForms = {
  head: {
    formType: 'loomis-head',
    defaultSize: 50,
    landmarks: ['crown', 'chin']
  },
  neck: {
    formType: 'cylinder',
    defaultRadius: 15,
    defaultHeight: 25,
    landmarks: ['chin', 'c7']
  },
  ribcage: {
    formType: 'ribcage',
    defaultSize: { width: 80, height: 100, depth: 60 },
    landmarks: ['c7', 'sternumBottom', 'shoulderL', 'shoulderR']
  },
  pelvis: {
    formType: 'pelvis',
    defaultSize: { width: 70, height: 50, depth: 50 },
    landmarks: ['crotch', 'hipL', 'hipR']
  },
  upperArm: {
    formType: 'limb',
    defaultRadius: { proximal: 18, distal: 14 },
    defaultLength: 65,
    crossSection: 'oval'
  },
  forearm: {
    formType: 'limb',
    defaultRadius: { proximal: 14, distal: 10 },
    defaultLength: 60,
    crossSection: 'oval'
  },
  thigh: {
    formType: 'limb',
    defaultRadius: { proximal: 24, distal: 18 },
    defaultLength: 90,
    crossSection: 'oval'
  },
  lowerLeg: {
    formType: 'limb',
    defaultRadius: { proximal: 16, distal: 10 },
    defaultLength: 80,
    crossSection: 'oval'
  },
  foot: {
    formType: 'wedge',
    defaultSize: { width: 25, height: 12, depth: 40 }
  },
  hand: {
    formType: 'box',
    defaultSize: { width: 20, height: 28, depth: 8 }
  }
};

export default Mannequin;
