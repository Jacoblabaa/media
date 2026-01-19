/**
 * Professional 3D Renderer for Artist's Toolkit
 * Renders anatomical forms with lighting, cross-contours, and proper depth
 */

import { Vec3 } from '../utils/math3d.js';

/**
 * Simple lighting model for form rendering
 */
export class Lighting {
  constructor() {
    this.direction = new Vec3(-0.5, 0.8, -0.6).normalize();
    this.ambient = 0.3;
    this.diffuse = 0.7;
    this.specular = 0.2;
  }

  /**
   * Calculate light intensity for a surface normal
   */
  calculateIntensity(normal) {
    // Ensure normal is normalized
    const len = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
    if (len < 0.001) return this.ambient;

    const nx = normal.x / len;
    const ny = normal.y / len;
    const nz = normal.z / len;

    // Dot product with light direction
    const dot = nx * this.direction.x + ny * this.direction.y + nz * this.direction.z;

    // Clamp and apply lighting model
    const diffuse = Math.max(0, dot) * this.diffuse;
    const intensity = this.ambient + diffuse;

    return Math.min(1, Math.max(0, intensity));
  }

  /**
   * Apply lighting to a base color
   */
  applyToColor(baseColor, intensity) {
    // Parse hex color
    let r, g, b;
    if (baseColor.startsWith('#')) {
      const hex = baseColor.slice(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else {
      r = g = b = 150;
    }

    // Apply intensity
    r = Math.round(r * intensity);
    g = Math.round(g * intensity);
    b = Math.round(b * intensity);

    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Main Renderer class
 */
export class FormRenderer {
  constructor(perspectiveEngine) {
    this.perspective = perspectiveEngine;
    this.lighting = new Lighting();

    // Rendering options
    this.showEdges = true;
    this.showFaces = true;
    this.showCrossContours = false;
    this.showConstruction = false;
    this.wireframeOnly = false;
    this.edgeColor = '#333333';
    this.edgeWidth = 1.5;
  }

  /**
   * Render an anatomical form to canvas
   */
  renderForm(ctx, form, options = {}) {
    if (!this.perspective) return;

    const worldVerts = form.getWorldVertices();
    const projectedVerts = worldVerts.map(v => this.perspective.project(v));

    // Check if any vertices are visible
    if (!projectedVerts.some(p => p.visible)) return;

    // Depth sort faces
    const sortedFaces = this.depthSortFaces(form, worldVerts, projectedVerts);

    // Render faces (back to front)
    if (this.showFaces && !this.wireframeOnly) {
      sortedFaces.forEach(({ face, faceIndex, avgDepth }) => {
        this.renderFace(ctx, face, faceIndex, projectedVerts, form, options);
      });
    }

    // Render edges
    if (this.showEdges || this.wireframeOnly) {
      this.renderEdges(ctx, form.edges, projectedVerts, options);
    }

    // Render cross-contours
    if (this.showCrossContours) {
      this.renderCrossContours(ctx, form, worldVerts, projectedVerts);
    }

    // Render construction lines
    if (this.showConstruction) {
      this.renderConstruction(ctx, form, projectedVerts);
    }
  }

  /**
   * Depth sort faces for proper occlusion
   */
  depthSortFaces(form, worldVerts, projectedVerts) {
    const facesWithDepth = form.faces.map((face, faceIndex) => {
      // Calculate average depth of face
      let avgDepth = 0;
      face.forEach(vertIndex => {
        avgDepth += projectedVerts[vertIndex]?.depth || 0;
      });
      avgDepth /= face.length;

      return { face, faceIndex, avgDepth };
    });

    // Sort back to front (larger depth = further away = render first)
    return facesWithDepth.sort((a, b) => b.avgDepth - a.avgDepth);
  }

  /**
   * Render a single face with lighting
   */
  renderFace(ctx, face, faceIndex, projectedVerts, form, options) {
    // Check all vertices are visible
    const faceVerts = face.map(i => projectedVerts[i]);
    if (faceVerts.some(v => !v || !v.visible)) return;

    // Get face normal for lighting
    const normal = form.normals?.[faceIndex] || new Vec3(0, 0, 1);

    // Transform normal by form rotation (simplified)
    const cos = Math.cos;
    const sin = Math.sin;
    const rx = form.rotation?.x || 0;
    const ry = form.rotation?.y || 0;
    let nx = normal.x, ny = normal.y, nz = normal.z;

    // Rotate Y
    let nx2 = nx * cos(ry) + nz * sin(ry);
    let nz2 = -nx * sin(ry) + nz * cos(ry);
    nx = nx2; nz = nz2;

    // Rotate X
    let ny2 = ny * cos(rx) - nz * sin(rx);
    nz2 = ny * sin(rx) + nz * cos(rx);
    ny = ny2; nz = nz2;

    const transformedNormal = new Vec3(nx, ny, nz);

    // Calculate lighting
    const intensity = this.lighting.calculateIntensity(transformedNormal);
    const baseColor = options.color || form.color || '#6699cc';
    const litColor = this.lighting.applyToColor(baseColor, intensity);

    // Draw filled face
    ctx.fillStyle = litColor;
    ctx.globalAlpha = options.opacity || form.opacity || 0.85;

    ctx.beginPath();
    ctx.moveTo(faceVerts[0].x, faceVerts[0].y);
    for (let i = 1; i < faceVerts.length; i++) {
      ctx.lineTo(faceVerts[i].x, faceVerts[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  /**
   * Render edges
   */
  renderEdges(ctx, edges, projectedVerts, options) {
    ctx.strokeStyle = options.edgeColor || this.edgeColor;
    ctx.lineWidth = options.edgeWidth || this.edgeWidth;
    ctx.lineCap = 'round';

    edges.forEach(([i1, i2]) => {
      const p1 = projectedVerts[i1];
      const p2 = projectedVerts[i2];

      if (!p1?.visible || !p2?.visible) return;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
  }

  /**
   * Render cross-contour lines for form understanding
   */
  renderCrossContours(ctx, form, worldVerts, projectedVerts) {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // For cylinder-like forms, draw horizontal cross-sections
    if (form.type === 'cylinder' || form.type === 'limb') {
      const numContours = 5;
      const segs = form.segments || 12;

      for (let c = 1; c < numContours; c++) {
        const t = c / numContours;
        const startIndex = Math.floor(t * (worldVerts.length / 2)) * 2;

        ctx.beginPath();
        let first = true;

        for (let i = 0; i < segs; i++) {
          const idx = startIndex + i * 2;
          if (idx < projectedVerts.length) {
            const p = projectedVerts[idx];
            if (p?.visible) {
              if (first) {
                ctx.moveTo(p.x, p.y);
                first = false;
              } else {
                ctx.lineTo(p.x, p.y);
              }
            }
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.setLineDash([]);
  }

  /**
   * Render construction lines (center lines, axes)
   */
  renderConstruction(ctx, form, projectedVerts) {
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);

    // Draw center axis for limbs
    if (form.type === 'cylinder' || form.type === 'limb') {
      // Find top and bottom center points
      const h = form.height || form.length || 100;
      const topCenter = this.perspective.project({
        x: form.position.x,
        y: form.position.y + h / 2,
        z: form.position.z
      });
      const bottomCenter = this.perspective.project({
        x: form.position.x,
        y: form.position.y - h / 2,
        z: form.position.z
      });

      if (topCenter.visible && bottomCenter.visible) {
        ctx.beginPath();
        ctx.moveTo(topCenter.x, topCenter.y);
        ctx.lineTo(bottomCenter.x, bottomCenter.y);
        ctx.stroke();
      }
    }

    ctx.setLineDash([]);
  }

  /**
   * Render a complete mannequin
   */
  renderMannequin(ctx, mannequin, options = {}) {
    // Get all parts and sort by depth
    const parts = mannequin.getAllParts();

    const partsWithDepth = parts.map(part => {
      const proj = this.perspective.project(part.position);
      return { part, depth: proj.depth };
    });

    // Sort back to front
    partsWithDepth.sort((a, b) => b.depth - a.depth);

    // Render each part
    partsWithDepth.forEach(({ part }) => {
      this.renderForm(ctx, part, {
        color: part.color,
        opacity: options.opacity || 0.8,
        ...options
      });
    });
  }

  /**
   * Render a limb segment between two landmarks
   */
  renderLimbSegment(ctx, startLandmark, endLandmark, options = {}) {
    const thickness = options.thickness || 20;
    const taperRatio = options.taperRatio || 0.85;
    const color = options.color || '#88aadd';

    // Project both endpoints
    const p1 = this.perspective.project({
      x: startLandmark.x,
      y: startLandmark.y,
      z: startLandmark.z || 300
    });
    const p2 = this.perspective.project({
      x: endLandmark.x,
      y: endLandmark.y,
      z: endLandmark.z || 300
    });

    if (!p1.visible || !p2.visible) return;

    // Calculate direction and perpendicular
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const perpX = -dy / len;
    const perpY = dx / len;

    // Scale thickness by perspective
    const t1 = thickness * (p1.scale || 1);
    const t2 = thickness * taperRatio * (p2.scale || 1);

    // Calculate 3D-ish normal for lighting
    const midZ = ((startLandmark.z || 300) + (endLandmark.z || 300)) / 2;
    const normal = new Vec3(perpX, perpY, -0.5).normalize();
    const intensity = this.lighting.calculateIntensity(normal);

    // Draw tapered form with gradient
    ctx.beginPath();

    // Left edge (from p1 to p2)
    ctx.moveTo(p1.x + perpX * t1, p1.y + perpY * t1);
    ctx.lineTo(p2.x + perpX * t2, p2.y + perpY * t2);

    // Right edge (from p2 back to p1)
    ctx.lineTo(p2.x - perpX * t2, p2.y - perpY * t2);
    ctx.lineTo(p1.x - perpX * t1, p1.y - perpY * t1);

    ctx.closePath();

    // Create gradient for 3D effect
    const gradientAngle = Math.atan2(perpY, perpX);
    const gradX1 = p1.x + perpX * t1;
    const gradY1 = p1.y + perpY * t1;
    const gradX2 = p1.x - perpX * t1;
    const gradY2 = p1.y - perpY * t1;

    const gradient = ctx.createLinearGradient(gradX1, gradY1, gradX2, gradY2);

    // Apply lighting to gradient
    const litColor = this.lighting.applyToColor(color, intensity);
    const darkColor = this.lighting.applyToColor(color, intensity * 0.5);
    const highlightColor = this.lighting.applyToColor(color, Math.min(1, intensity * 1.3));

    gradient.addColorStop(0, darkColor);
    gradient.addColorStop(0.3, litColor);
    gradient.addColorStop(0.5, highlightColor);
    gradient.addColorStop(0.7, litColor);
    gradient.addColorStop(1, darkColor);

    ctx.fillStyle = gradient;
    ctx.globalAlpha = options.opacity || 0.85;
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = 'rgba(50, 80, 120, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw end caps (ellipses)
    if (options.showEndCaps !== false) {
      this.drawEndCap(ctx, p1.x, p1.y, t1, perpX, perpY, color, intensity);
      this.drawEndCap(ctx, p2.x, p2.y, t2, perpX, perpY, color, intensity * 0.9);
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Draw elliptical end cap for limb
   */
  drawEndCap(ctx, cx, cy, radius, perpX, perpY, color, intensity) {
    const angle = Math.atan2(perpY, perpX);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.35, 0, 0, Math.PI * 2);

    const capColor = this.lighting.applyToColor(color, intensity * 1.1);
    ctx.fillStyle = capColor;
    ctx.globalAlpha = 0.9;
    ctx.fill();

    ctx.strokeStyle = 'rgba(50, 80, 120, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render all anatomy forms from landmarks
   */
  renderAnatomyFromLandmarks(ctx, landmarks, segments, options = {}) {
    // Sort segments by depth for proper rendering order
    const segmentsWithDepth = segments.map(seg => {
      const p1 = landmarks[seg.from];
      const p2 = landmarks[seg.to];
      if (!p1 || !p2) return null;

      const avgZ = ((p1.z || 300) + (p2.z || 300)) / 2;
      return { seg, p1, p2, depth: avgZ };
    }).filter(s => s !== null);

    // Sort back to front
    segmentsWithDepth.sort((a, b) => b.depth - a.depth);

    // Render each segment
    segmentsWithDepth.forEach(({ seg, p1, p2 }) => {
      this.renderLimbSegment(ctx, p1, p2, {
        thickness: (seg.thickness || 0.2) * 120,
        taperRatio: 0.85,
        color: seg.color || options.color || '#7799cc',
        opacity: options.opacity || 0.8,
        showEndCaps: options.showEndCaps !== false
      });
    });
  }

  /**
   * Update perspective engine reference
   */
  setPerspective(perspectiveEngine) {
    this.perspective = perspectiveEngine;
  }

  /**
   * Update lighting direction
   */
  setLightDirection(x, y, z) {
    this.lighting.direction = new Vec3(x, y, z).normalize();
  }
}

/**
 * Utility: Render perspective grid with proper convergence
 */
export function renderPerspectiveGrid(ctx, perspectiveEngine, options = {}) {
  const spacing = options.spacing || 100;
  const gridSize = options.gridSize || 10;
  const maxDepth = options.maxDepth || 2000;
  const gridColor = options.gridColor || 'rgba(100, 150, 200, 0.3)';
  const horizonColor = options.horizonColor || 'rgba(255, 100, 100, 0.5)';

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  // Generate and render grid
  const grid = perspectiveEngine.generateGroundGrid(spacing, gridSize, maxDepth);

  grid.forEach(line => {
    if (line.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);

    for (let i = 1; i < line.points.length; i++) {
      ctx.lineTo(line.points[i].x, line.points[i].y);
    }
    ctx.stroke();
  });

  // Draw horizon line
  ctx.strokeStyle = horizonColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);

  const horizon = perspectiveEngine.horizon;
  if (horizon.points.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(horizon.points[0].x, horizon.points[0].y);
    ctx.lineTo(horizon.points[1].x, horizon.points[1].y);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Draw vanishing points
  perspectiveEngine.vanishingPoints.forEach(vp => {
    // VP marker
    ctx.fillStyle = vp.color || '#ff5555';
    ctx.beginPath();
    ctx.arc(vp.x, vp.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // VP crosshair
    ctx.strokeStyle = vp.color || '#ff5555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vp.x - 15, vp.y);
    ctx.lineTo(vp.x + 15, vp.y);
    ctx.moveTo(vp.x, vp.y - 15);
    ctx.lineTo(vp.x, vp.y + 15);
    ctx.stroke();

    // VP label
    if (vp.label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(vp.label, vp.x + 12, vp.y - 12);
    }

    // Convergence lines from VP
    if (options.showConvergenceLines) {
      ctx.strokeStyle = vp.color + '30';
      ctx.lineWidth = 1;

      const numLines = options.convergenceLineCount || 12;
      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2;
        const len = Math.max(ctx.canvas.width, ctx.canvas.height) * 2;

        ctx.beginPath();
        ctx.moveTo(vp.x, vp.y);
        ctx.lineTo(
          vp.x + Math.cos(angle) * len,
          vp.y + Math.sin(angle) * len
        );
        ctx.stroke();
      }
    }
  });
}

export default FormRenderer;
