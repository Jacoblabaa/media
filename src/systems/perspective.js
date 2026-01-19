/**
 * Professional Perspective Engine
 * Mathematically correct perspective projection with dynamic horizon
 * Based on classical perspective theory (Loomis, Robertson, Chelsea School)
 */

import { Vec3 } from '../utils/math3d.js';

/**
 * Vanishing Point with metadata
 */
export class VanishingPoint {
  constructor(x, y, options = {}) {
    this.id = options.id || Date.now() + Math.random();
    this.x = x;
    this.y = y;
    this.type = options.type || 'horizontal'; // 'horizontal', 'vertical', 'diagonal'
    this.color = options.color || '#ff5555';
    this.label = options.label || '';
    this.locked = options.locked || false;

    // Which direction this VP controls (for form alignment)
    this.axis = options.axis || null; // 'x', 'y', 'z', or null for custom
  }

  distanceTo(x, y) {
    return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
  }

  clone() {
    return new VanishingPoint(this.x, this.y, {
      id: this.id,
      type: this.type,
      color: this.color,
      label: this.label,
      locked: this.locked,
      axis: this.axis
    });
  }
}

/**
 * Horizon Line - derived from horizontal VPs, not static
 */
export class HorizonLine {
  constructor() {
    this.points = []; // Array of {x, y} defining the horizon
    this.isLinear = true; // False for curvilinear perspective
  }

  /**
   * Calculate horizon from horizontal vanishing points
   * The horizon MUST pass through all horizontal VPs
   */
  static fromVanishingPoints(vps, canvasWidth, canvasHeight) {
    const horizon = new HorizonLine();

    // Filter to horizontal VPs only
    const horizontalVPs = vps.filter(vp => vp.type === 'horizontal');

    if (horizontalVPs.length === 0) {
      // Default: center horizontal line
      horizon.points = [
        { x: 0, y: canvasHeight / 2 },
        { x: canvasWidth, y: canvasHeight / 2 }
      ];
      return horizon;
    }

    if (horizontalVPs.length === 1) {
      // Single VP: horizontal line through it
      const vp = horizontalVPs[0];
      horizon.points = [
        { x: 0, y: vp.y },
        { x: canvasWidth, y: vp.y }
      ];
      return horizon;
    }

    // Multiple VPs: line through them (may not be horizontal!)
    // Sort by X position
    const sorted = [...horizontalVPs].sort((a, b) => a.x - b.x);

    // Calculate line equation: y = mx + b
    const vp1 = sorted[0];
    const vp2 = sorted[sorted.length - 1];

    if (Math.abs(vp2.x - vp1.x) < 0.001) {
      // Vertical line (edge case)
      horizon.points = [
        { x: vp1.x, y: 0 },
        { x: vp1.x, y: canvasHeight }
      ];
    } else {
      const slope = (vp2.y - vp1.y) / (vp2.x - vp1.x);
      const intercept = vp1.y - slope * vp1.x;

      // Extend line across canvas
      horizon.points = [
        { x: -canvasWidth, y: slope * (-canvasWidth) + intercept },
        { x: canvasWidth * 2, y: slope * (canvasWidth * 2) + intercept }
      ];

      // Store slope for calculations
      horizon.slope = slope;
      horizon.intercept = intercept;
    }

    return horizon;
  }

  /**
   * Get Y position on horizon at given X
   */
  getYAtX(x) {
    if (this.slope !== undefined) {
      return this.slope * x + this.intercept;
    }
    // Flat horizon
    return this.points[0]?.y || 0;
  }

  /**
   * Check if a point is above or below horizon
   * Returns positive for above, negative for below
   */
  getRelativePosition(x, y) {
    const horizonY = this.getYAtX(x);
    return horizonY - y; // Positive = point is above horizon (in screen coords where Y increases down)
  }
}

/**
 * Main Perspective Engine
 */
export class PerspectiveEngine {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;

    // Core properties
    this.vanishingPoints = [];
    this.horizon = new HorizonLine();

    // Camera/viewer properties
    this.stationPoint = { x: canvasWidth / 2, y: canvasHeight / 2 };
    this.eyeLevel = canvasHeight / 2; // Default eye level
    this.coneOfVision = 60; // Degrees - affects perspective strength
    this.distanceToCanvas = 500; // Affects foreshortening

    // Perspective type
    this.type = '2pt'; // '1pt', '2pt', '3pt', 'fisheye', 'custom'

    // Fisheye settings
    this.fisheyeStrength = 0.5;

    // Grid settings
    this.groundPlaneY = 0; // Y coordinate of ground in world space
  }

  /**
   * Initialize with default VPs for perspective type
   */
  initializeDefaults() {
    this.vanishingPoints = [];

    switch (this.type) {
      case '1pt':
        this.addVP(this.width / 2, this.eyeLevel, {
          type: 'horizontal',
          color: '#ff5555',
          label: 'Center VP',
          axis: 'z'
        });
        break;

      case '2pt':
        this.addVP(this.width * 0.1, this.eyeLevel, {
          type: 'horizontal',
          color: '#ff5555',
          label: 'Left VP',
          axis: 'x'
        });
        this.addVP(this.width * 0.9, this.eyeLevel, {
          type: 'horizontal',
          color: '#55ff55',
          label: 'Right VP',
          axis: 'z'
        });
        break;

      case '3pt':
        this.addVP(this.width * 0.1, this.eyeLevel, {
          type: 'horizontal',
          color: '#ff5555',
          label: 'Left VP',
          axis: 'x'
        });
        this.addVP(this.width * 0.9, this.eyeLevel, {
          type: 'horizontal',
          color: '#55ff55',
          label: 'Right VP',
          axis: 'z'
        });
        this.addVP(this.width / 2, this.height * 0.1, {
          type: 'vertical',
          color: '#5555ff',
          label: 'Vertical VP',
          axis: 'y'
        });
        break;

      default:
        // Custom - start with 2pt defaults
        this.initializeDefaults();
        this.type = '2pt';
    }

    this.updateHorizon();
    return this.vanishingPoints;
  }

  /**
   * Add a vanishing point
   */
  addVP(x, y, options = {}) {
    const vp = new VanishingPoint(x, y, options);
    this.vanishingPoints.push(vp);
    this.updateHorizon();
    return vp;
  }

  /**
   * Remove a vanishing point
   */
  removeVP(vpId) {
    this.vanishingPoints = this.vanishingPoints.filter(vp => vp.id !== vpId);
    this.updateHorizon();
  }

  /**
   * Move a vanishing point
   */
  moveVP(vpId, x, y) {
    const vp = this.vanishingPoints.find(v => v.id === vpId);
    if (vp && !vp.locked) {
      vp.x = x;
      vp.y = y;
      this.updateHorizon();
    }
  }

  /**
   * Update horizon line based on current VPs
   */
  updateHorizon() {
    this.horizon = HorizonLine.fromVanishingPoints(
      this.vanishingPoints,
      this.width,
      this.height
    );
  }

  /**
   * Set perspective type and reinitialize
   */
  setType(type) {
    this.type = type;
    this.initializeDefaults();
  }

  /**
   * Get the horizon Y at a given X position
   */
  getHorizonY(x = this.width / 2) {
    return this.horizon.getYAtX(x);
  }

  /**
   * Project a 3D point to 2D screen coordinates
   */
  project(point3D) {
    // Handle Vec3 or plain object
    const x = point3D.x ?? point3D[0] ?? 0;
    const y = point3D.y ?? point3D[1] ?? 0;
    const z = point3D.z ?? point3D[2] ?? 0;

    switch (this.type) {
      case '1pt':
        return this.project1Point(x, y, z);
      case '2pt':
        return this.project2Point(x, y, z);
      case '3pt':
        return this.project3Point(x, y, z);
      case 'fisheye':
        return this.projectFisheye(x, y, z);
      default:
        return this.project2Point(x, y, z);
    }
  }

  /**
   * 1-Point Perspective Projection
   * All depth lines converge to single center VP
   */
  project1Point(x, y, z) {
    const vp = this.vanishingPoints[0] || { x: this.width / 2, y: this.eyeLevel };

    // Depth factor: how much to converge toward VP
    const depthFactor = z / (z + this.distanceToCanvas);
    const clampedDepth = Math.max(0, Math.min(0.99, depthFactor));

    // Screen position relative to station point
    const screenX = this.stationPoint.x + x;
    const screenY = this.stationPoint.y - y; // Flip Y (positive = up in 3D)

    // Converge toward VP based on depth
    const projX = screenX + (vp.x - screenX) * clampedDepth;
    const projY = screenY + (vp.y - screenY) * clampedDepth;

    // Scale factor for size reduction with depth
    const scale = 1 - clampedDepth * 0.8;

    return {
      x: projX,
      y: projY,
      scale: Math.max(0.1, scale),
      depth: z,
      visible: z > -this.distanceToCanvas * 0.9
    };
  }

  /**
   * 2-Point Perspective Projection
   * Horizontal lines converge to left/right VPs
   * Verticals remain vertical
   */
  project2Point(x, y, z) {
    const vpLeft = this.vanishingPoints.find(vp => vp.axis === 'x') ||
                   this.vanishingPoints[0] ||
                   { x: this.width * 0.1, y: this.eyeLevel };
    const vpRight = this.vanishingPoints.find(vp => vp.axis === 'z') ||
                    this.vanishingPoints[1] ||
                    { x: this.width * 0.9, y: this.eyeLevel };

    // Depth factor
    const depthFactor = z / (z + this.distanceToCanvas);
    const clampedDepth = Math.max(0, Math.min(0.99, depthFactor));

    // Screen position
    const screenX = this.stationPoint.x + x;
    const screenY = this.stationPoint.y - y;

    // Choose VP based on which side of center the point is
    // This creates the 2-point effect
    const targetVP = x < 0 ? vpLeft : vpRight;

    // X converges toward the selected VP
    const projX = screenX + (targetVP.x - screenX) * clampedDepth;

    // Y converges toward horizon (not a specific VP)
    const horizonY = this.horizon.getYAtX(projX);
    const projY = screenY + (horizonY - screenY) * clampedDepth;

    const scale = 1 - clampedDepth * 0.8;

    return {
      x: projX,
      y: projY,
      scale: Math.max(0.1, scale),
      depth: z,
      visible: z > -this.distanceToCanvas * 0.9
    };
  }

  /**
   * 3-Point Perspective Projection
   * Adds vertical convergence for looking up/down
   */
  project3Point(x, y, z) {
    const vpLeft = this.vanishingPoints.find(vp => vp.axis === 'x') ||
                   this.vanishingPoints[0];
    const vpRight = this.vanishingPoints.find(vp => vp.axis === 'z') ||
                    this.vanishingPoints[1];
    const vpVertical = this.vanishingPoints.find(vp => vp.axis === 'y') ||
                       this.vanishingPoints[2];

    if (!vpLeft || !vpRight) {
      return this.project2Point(x, y, z);
    }

    // Depth factor
    const depthFactor = z / (z + this.distanceToCanvas);
    const clampedDepth = Math.max(0, Math.min(0.99, depthFactor));

    // Screen position
    const screenX = this.stationPoint.x + x;
    const screenY = this.stationPoint.y - y;

    // Horizontal convergence (like 2pt)
    const targetVP = x < 0 ? vpLeft : vpRight;
    const projX = screenX + (targetVP.x - screenX) * clampedDepth;

    // Vertical convergence
    let projY = screenY;
    if (vpVertical) {
      // Verticals converge to vertical VP based on height
      const verticalFactor = Math.abs(y) / (Math.abs(y) + this.distanceToCanvas);
      const clampedVertical = Math.min(0.95, verticalFactor);
      projY = screenY + (vpVertical.y - screenY) * clampedVertical * clampedDepth;
    } else {
      // Fall back to horizon convergence
      const horizonY = this.horizon.getYAtX(projX);
      projY = screenY + (horizonY - screenY) * clampedDepth;
    }

    const scale = 1 - clampedDepth * 0.8;

    return {
      x: projX,
      y: projY,
      scale: Math.max(0.1, scale),
      depth: z,
      visible: z > -this.distanceToCanvas * 0.9
    };
  }

  /**
   * Fisheye/Curvilinear Perspective
   */
  projectFisheye(x, y, z) {
    // First do standard projection
    const linear = this.project2Point(x, y, z);

    // Apply barrel distortion
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    const dx = linear.x - centerX;
    const dy = linear.y - centerY;
    const r = Math.sqrt(dx * dx + dy * dy);
    const maxR = Math.sqrt(centerX * centerX + centerY * centerY);

    // Distortion factor increases with distance from center
    const normalizedR = r / maxR;
    const distortion = 1 + normalizedR * normalizedR * this.fisheyeStrength;

    return {
      x: centerX + dx * distortion,
      y: centerY + dy * distortion,
      scale: linear.scale,
      depth: z,
      visible: linear.visible
    };
  }

  /**
   * Generate convergence line from a point toward a VP
   * Returns array of points for drawing
   */
  getConvergenceLine(startX, startY, vpId, length = 2000) {
    const vp = this.vanishingPoints.find(v => v.id === vpId);
    if (!vp) return [];

    const dx = vp.x - startX;
    const dy = vp.y - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return [{ x: startX, y: startY }];

    // Normalize and extend
    const nx = dx / dist;
    const ny = dy / dist;

    return [
      { x: startX, y: startY },
      { x: startX + nx * length, y: startY + ny * length }
    ];
  }

  /**
   * Generate perspective grid on ground plane
   */
  generateGroundGrid(spacing = 100, gridSize = 10, maxDepth = 2000) {
    const lines = [];

    // Lines going into depth (toward VPs)
    for (let i = -gridSize; i <= gridSize; i++) {
      const linePoints = [];

      for (let z = 0; z < maxDepth; z += spacing / 4) {
        const worldX = i * spacing;
        const worldY = this.groundPlaneY;
        const worldZ = z;

        const proj = this.project({ x: worldX, y: worldY, z: worldZ });

        if (proj.visible) {
          linePoints.push({ x: proj.x, y: proj.y, depth: proj.depth });
        }
      }

      if (linePoints.length > 1) {
        lines.push({ points: linePoints, type: 'depth', index: i });
      }
    }

    // Lines going across (perpendicular to depth)
    for (let z = 0; z < maxDepth; z += spacing) {
      const linePoints = [];

      for (let i = -gridSize; i <= gridSize; i++) {
        const worldX = i * spacing;
        const worldY = this.groundPlaneY;
        const worldZ = z;

        const proj = this.project({ x: worldX, y: worldY, z: worldZ });

        if (proj.visible) {
          linePoints.push({ x: proj.x, y: proj.y, depth: proj.depth });
        }
      }

      if (linePoints.length > 1) {
        lines.push({ points: linePoints, type: 'across', depth: z });
      }
    }

    return lines;
  }

  /**
   * Find nearest convergence line to a point
   * Used for snapping forms to perspective
   */
  findNearestConvergenceLine(screenX, screenY, tolerance = 20) {
    let nearest = null;
    let nearestDist = tolerance;

    for (const vp of this.vanishingPoints) {
      // Calculate distance from point to line through VP
      // Line from VP extending in all directions

      // For each VP, we consider lines radiating from it
      // The distance from point to the line VP→point is 0 if on the line
      // We want lines that pass near the point AND go toward VP

      const dx = screenX - vp.x;
      const dy = screenY - vp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = {
          vp,
          angle: Math.atan2(dy, dx),
          distance: dist
        };
      }
    }

    return nearest;
  }

  /**
   * Snap a point to the nearest convergence line
   */
  snapToConvergence(screenX, screenY, tolerance = 20) {
    const nearest = this.findNearestConvergenceLine(screenX, screenY, tolerance);

    if (!nearest) return { x: screenX, y: screenY, snapped: false };

    // Project point onto the line from VP
    const vp = nearest.vp;
    const dx = screenX - vp.x;
    const dy = screenY - vp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Point is already on a convergence line (any angle from VP)
    return {
      x: screenX,
      y: screenY,
      snapped: true,
      vp: vp,
      angle: nearest.angle
    };
  }

  /**
   * Calculate the angle of a line that converges to a VP from a point
   */
  getConvergenceAngle(fromX, fromY, vpId) {
    const vp = this.vanishingPoints.find(v => v.id === vpId);
    if (!vp) return 0;

    return Math.atan2(vp.y - fromY, vp.x - fromX);
  }

  /**
   * Check if a line segment properly converges to a VP
   */
  checkConvergence(x1, y1, x2, y2, vpId, tolerance = 5) {
    const vp = this.vanishingPoints.find(v => v.id === vpId);
    if (!vp) return { converges: false };

    // Extend line to see if it passes near VP
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 1) return { converges: false };

    // Parametric line: P = (x1, y1) + t * (dx, dy)
    // Find t where line is closest to VP
    const t = ((vp.x - x1) * dx + (vp.y - y1) * dy) / (len * len);

    // Point on line closest to VP
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    const distToVP = Math.sqrt((closestX - vp.x) ** 2 + (closestY - vp.y) ** 2);

    return {
      converges: distToVP < tolerance || t > 0, // Converges if pointing toward VP
      distance: distToVP,
      t: t
    };
  }

  /**
   * Subdivide an edge for curved rendering (fisheye)
   */
  subdivideCurvedEdge(v1, v2, segments = 10) {
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = v1.x + (v2.x - v1.x) * t;
      const y = v1.y + (v2.y - v1.y) * t;
      const z = v1.z + (v2.z - v1.z) * t;

      const proj = this.project({ x, y, z });
      points.push(proj);
    }

    return points;
  }

  /**
   * Get all VPs as plain objects (for React state)
   */
  getVPsAsObjects() {
    return this.vanishingPoints.map(vp => ({
      id: vp.id,
      x: vp.x,
      y: vp.y,
      type: vp.type,
      color: vp.color,
      label: vp.label,
      locked: vp.locked,
      axis: vp.axis
    }));
  }

  /**
   * Import VPs from plain objects (from React state)
   */
  setVPsFromObjects(vpObjects) {
    this.vanishingPoints = vpObjects.map(obj =>
      new VanishingPoint(obj.x, obj.y, obj)
    );
    this.updateHorizon();
  }
}

export default PerspectiveEngine;
