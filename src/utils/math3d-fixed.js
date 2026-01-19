/**
 * FIXED 3D Mathematics for Artist's Toolkit
 * Properly implements perspective projection with real vanishing point convergence
 */

export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v) {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v) {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s) {
    return new Vec3(this.x * s, this.y * s, this.z * s);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    const len = this.length();
    return len > 0 ? this.scale(1 / len) : new Vec3();
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
}

export class Matrix4 {
  constructor() {
    this.m = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static identity() {
    return new Matrix4();
  }

  static translation(x, y, z) {
    const mat = new Matrix4();
    mat.m[12] = x;
    mat.m[13] = y;
    mat.m[14] = z;
    return mat;
  }

  static rotationX(angle) {
    const mat = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    mat.m[5] = c;
    mat.m[6] = s;
    mat.m[9] = -s;
    mat.m[10] = c;
    return mat;
  }

  static rotationY(angle) {
    const mat = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    mat.m[0] = c;
    mat.m[2] = -s;
    mat.m[8] = s;
    mat.m[10] = c;
    return mat;
  }

  static rotationZ(angle) {
    const mat = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    mat.m[0] = c;
    mat.m[1] = s;
    mat.m[4] = -s;
    mat.m[5] = c;
    return mat;
  }

  static scale(sx, sy, sz) {
    const mat = new Matrix4();
    mat.m[0] = sx;
    mat.m[5] = sy;
    mat.m[10] = sz;
    return mat;
  }

  multiply(other) {
    const result = new Matrix4();
    const a = this.m;
    const b = other.m;
    const r = result.m;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        r[i * 4 + j] = 0;
        for (let k = 0; k < 4; k++) {
          r[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
        }
      }
    }
    return result;
  }

  transformPoint(v) {
    const m = this.m;
    const x = v.x * m[0] + v.y * m[4] + v.z * m[8] + m[12];
    const y = v.x * m[1] + v.y * m[5] + v.z * m[9] + m[13];
    const z = v.x * m[2] + v.y * m[6] + v.z * m[10] + m[14];
    const w = v.x * m[3] + v.y * m[7] + v.z * m[11] + m[15];
    return new Vec3(x / w, y / w, z / w);
  }
}

/**
 * FIXED Perspective Projection System
 * Now actually converges to vanishing points!
 */
export class PerspectiveSystem {
  constructor(type, canvasWidth, canvasHeight) {
    this.type = type;
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.vanishingPoints = [];
    this.horizonY = canvasHeight / 2;
    this.stationPoint = { x: canvasWidth / 2, y: canvasHeight / 2 };
    this.fov = 60;
    this.distanceToCanvas = 500;

    // Initialize default vanishing points based on type
    this.initializeDefaultVPs();
  }

  initializeDefaultVPs() {
    // Set sensible defaults so projection works immediately
    switch (this.type) {
      case '1pt':
        this.vanishingPoints = [{ x: this.width / 2, y: this.horizonY, color: '#ff5555' }];
        break;
      case '2pt':
        this.vanishingPoints = [
          { x: this.width * 0.15, y: this.horizonY, color: '#ff5555' },
          { x: this.width * 0.85, y: this.horizonY, color: '#55ff55' }
        ];
        break;
      case '3pt':
        this.vanishingPoints = [
          { x: this.width * 0.15, y: this.horizonY, color: '#ff5555' },
          { x: this.width * 0.85, y: this.horizonY, color: '#55ff55' },
          { x: this.width / 2, y: this.height * 0.1, color: '#5555ff' }
        ];
        break;
      default:
        this.vanishingPoints = [
          { x: this.width * 0.2, y: this.horizonY, color: '#ff5555' },
          { x: this.width * 0.8, y: this.horizonY, color: '#55ff55' }
        ];
    }
  }

  setVanishingPoints(points) {
    if (points && points.length > 0) {
      this.vanishingPoints = points;
    }
  }

  setHorizon(y) {
    this.horizonY = y;
  }

  /**
   * Main projection function - routes to correct perspective type
   */
  project(point3d) {
    switch (this.type) {
      case '1pt':
        return this.project1Point(point3d);
      case '2pt':
        return this.project2Point(point3d);
      case '3pt':
        return this.project3Point(point3d);
      case 'fisheye':
        return this.projectFisheye(point3d);
      default:
        return this.project2Point(point3d);
    }
  }

  /**
   * FIXED 1-Point Perspective - All parallel lines converge to center VP
   */
  project1Point(point3d) {
    const vp = this.vanishingPoints[0] || { x: this.width / 2, y: this.horizonY };

    // Depth ratio (0 = at viewer, 1 = at infinity)
    const depthRatio = 1 - (this.distanceToCanvas / (this.distanceToCanvas + point3d.z));

    // Converge toward vanishing point based on depth
    const x = this.stationPoint.x + point3d.x + (vp.x - (this.stationPoint.x + point3d.x)) * depthRatio;
    const y = this.stationPoint.y - point3d.y + (vp.y - (this.stationPoint.y - point3d.y)) * depthRatio;

    return {
      x: x,
      y: y,
      scale: 1 - depthRatio,
      visible: point3d.z > -this.distanceToCanvas
    };
  }

  /**
   * FIXED 2-Point Perspective - Horizontal lines converge to left/right VPs
   */
  project2Point(point3d) {
    const vp1 = this.vanishingPoints[0] || { x: this.width * 0.2, y: this.horizonY };
    const vp2 = this.vanishingPoints[1] || { x: this.width * 0.8, y: this.horizonY };

    // Depth ratio
    const depthRatio = 1 - (this.distanceToCanvas / (this.distanceToCanvas + point3d.z));

    // Determine which VP to converge toward based on X position relative to center
    const centerX = this.stationPoint.x + point3d.x;
    const t = (centerX - vp1.x) / (vp2.x - vp1.x);

    // Choose primary VP (left for negative X, right for positive X)
    const targetVP = point3d.x < 0 ? vp1 : vp2;

    // Converge toward chosen VP
    const x = centerX + (targetVP.x - centerX) * depthRatio;

    // Y converges toward horizon
    const y = this.stationPoint.y - point3d.y + (this.horizonY - (this.stationPoint.y - point3d.y)) * depthRatio;

    return {
      x: x,
      y: y,
      scale: 1 - depthRatio,
      visible: point3d.z > -this.distanceToCanvas
    };
  }

  /**
   * FIXED 3-Point Perspective - Adds vertical VP for looking up/down
   */
  project3Point(point3d) {
    const vp1 = this.vanishingPoints[0] || { x: this.width * 0.2, y: this.horizonY };
    const vp2 = this.vanishingPoints[1] || { x: this.width * 0.8, y: this.horizonY };
    const vp3 = this.vanishingPoints[2] || { x: this.width / 2, y: this.height * 0.1 };

    // Depth ratio
    const depthRatio = 1 - (this.distanceToCanvas / (this.distanceToCanvas + point3d.z));

    // Horizontal convergence (like 2-point)
    const centerX = this.stationPoint.x + point3d.x;
    const targetVPH = point3d.x < 0 ? vp1 : vp2;
    const x = centerX + (targetVPH.x - centerX) * depthRatio;

    // Vertical convergence toward 3rd VP
    const centerY = this.stationPoint.y - point3d.y;
    const y = centerY + (vp3.y - centerY) * depthRatio;

    return {
      x: x,
      y: y,
      scale: 1 - depthRatio,
      visible: point3d.z > -this.distanceToCanvas
    };
  }

  /**
   * Fisheye/Curvilinear Perspective
   */
  projectFisheye(point3d) {
    const d = this.distanceToCanvas;
    const r = Math.sqrt(point3d.x * point3d.x + point3d.y * point3d.y);
    const theta = Math.atan2(point3d.y, point3d.x);

    // Apply barrel distortion
    const distortion = 1.3;
    const rDistorted = r * (1 + (r * r) / (d * d) * distortion);

    return {
      x: this.stationPoint.x + rDistorted * Math.cos(theta),
      y: this.stationPoint.y + rDistorted * Math.sin(theta),
      scale: d / (d + point3d.z),
      visible: point3d.z > -d
    };
  }

  /**
   * Generate perspective grid
   */
  generateGrid(spacing = 100, depth = 1500) {
    const lines = [];
    const gridSize = 8;

    for (let i = -gridSize; i <= gridSize; i++) {
      // Lines going into depth (Z direction)
      const lineZ = [];
      for (let z = 0; z < depth; z += spacing / 2) {
        const p = this.project(new Vec3(i * spacing, 0, z));
        if (p.visible) lineZ.push(p);
      }
      if (lineZ.length > 1) lines.push({ points: lineZ, type: 'depth' });

      // Lines going across (X direction) - floor grid
      const lineX = [];
      for (let x = -gridSize * spacing; x <= gridSize * spacing; x += spacing) {
        const p = this.project(new Vec3(x, 0, i * spacing));
        if (p.visible && i * spacing >= 0) lineX.push(p);
      }
      if (lineX.length > 1) lines.push({ points: lineX, type: 'across' });
    }

    return lines;
  }
}

/**
 * 3D Primitive Shapes - Same as before
 */
export class Primitive3D {
  constructor(type, position = new Vec3(), rotation = new Vec3(), scale = new Vec3(1, 1, 1)) {
    this.type = type;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.vertices = [];
    this.edges = [];
    this.faces = [];
    this.generate();
  }

  generate() {
    switch (this.type) {
      case 'cube':
        this.generateCube();
        break;
      case 'sphere':
        this.generateSphere();
        break;
      case 'cylinder':
        this.generateCylinder();
        break;
      case 'cone':
        this.generateCone();
        break;
      case 'pyramid':
        this.generatePyramid();
        break;
    }
  }

  generateCube() {
    const s = 50;
    this.vertices = [
      new Vec3(-s, -s, -s), new Vec3(s, -s, -s), new Vec3(s, s, -s), new Vec3(-s, s, -s),
      new Vec3(-s, -s, s), new Vec3(s, -s, s), new Vec3(s, s, s), new Vec3(-s, s, s)
    ];
    this.edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    this.faces = [
      [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
      [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
    ];
  }

  generateSphere(segments = 12) {
    this.vertices = [];
    this.edges = [];

    for (let lat = 0; lat <= segments; lat++) {
      const theta = (lat * Math.PI) / segments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= segments; lon++) {
        const phi = (lon * 2 * Math.PI) / segments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;

        this.vertices.push(new Vec3(x * 50, y * 50, z * 50));
      }
    }

    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const first = lat * (segments + 1) + lon;
        const second = first + segments + 1;

        this.edges.push([first, first + 1]);
        this.edges.push([first, second]);
      }
    }
  }

  generateCylinder(segments = 16) {
    this.vertices = [];
    this.edges = [];
    const height = 100;
    const radius = 40;

    for (let i = 0; i <= segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      this.vertices.push(new Vec3(
        Math.cos(angle) * radius,
        height / 2,
        Math.sin(angle) * radius
      ));
    }

    for (let i = 0; i <= segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      this.vertices.push(new Vec3(
        Math.cos(angle) * radius,
        -height / 2,
        Math.sin(angle) * radius
      ));
    }

    for (let i = 0; i < segments; i++) {
      this.edges.push([i, i + 1]);
      this.edges.push([i + segments + 1, i + segments + 2]);
      this.edges.push([i, i + segments + 1]);
    }
  }

  generateCone(segments = 16) {
    this.vertices = [];
    this.edges = [];
    const height = 100;
    const radius = 50;

    this.vertices.push(new Vec3(0, height / 2, 0));

    for (let i = 0; i <= segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      this.vertices.push(new Vec3(
        Math.cos(angle) * radius,
        -height / 2,
        Math.sin(angle) * radius
      ));
    }

    for (let i = 1; i <= segments; i++) {
      this.edges.push([0, i]);
      this.edges.push([i, i + 1]);
    }
  }

  generatePyramid() {
    const s = 50;
    const h = 70;
    this.vertices = [
      new Vec3(0, h, 0),
      new Vec3(-s, -h, -s), new Vec3(s, -h, -s),
      new Vec3(s, -h, s), new Vec3(-s, -h, s)
    ];
    this.edges = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 2], [2, 3], [3, 4], [4, 1]
    ];
    this.faces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [1, 2, 3, 4]
    ];
  }

  getTransformMatrix() {
    return Matrix4.translation(this.position.x, this.position.y, this.position.z)
      .multiply(Matrix4.rotationX(this.rotation.x))
      .multiply(Matrix4.rotationY(this.rotation.y))
      .multiply(Matrix4.rotationZ(this.rotation.z))
      .multiply(Matrix4.scale(this.scale.x, this.scale.y, this.scale.z));
  }

  getTransformedVertices() {
    const mat = this.getTransformMatrix();
    return this.vertices.map(v => mat.transformPoint(v));
  }
}

/**
 * Utility functions
 */
export const MathUtils = {
  degToRad: (deg) => (deg * Math.PI) / 180,
  radToDeg: (rad) => (rad * 180) / Math.PI,
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  lerp: (a, b, t) => a + (b - a) * t,
  distance2D: (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2),
  angle2D: (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x),
};
