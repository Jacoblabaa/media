/**
 * Form Intersection Detection and Visualization
 *
 * Detects when 3D forms intersect and visualizes the intersection
 */

import { Vec3 } from './math3d.js';

export class IntersectionDetector {
  /**
   * Check if two forms intersect using bounding sphere collision
   */
  static detectIntersection(form1, form2) {
    const center1 = form1.position;
    const center2 = form2.position;

    // Calculate bounding sphere radii
    const radius1 = this.getBoundingRadius(form1);
    const radius2 = this.getBoundingRadius(form2);

    // Check distance between centers
    const distance = center1.subtract(center2).length();

    return distance < (radius1 + radius2);
  }

  /**
   * Get bounding sphere radius for a form
   */
  static getBoundingRadius(form) {
    const vertices = form.getTransformedVertices();
    let maxDist = 0;

    for (const v of vertices) {
      const dist = v.subtract(form.position).length();
      if (dist > maxDist) maxDist = dist;
    }

    return maxDist;
  }

  /**
   * Calculate intersection visualization data
   */
  static getIntersectionVisualization(form1, form2, perspectiveSystem) {
    const center1 = form1.position;
    const center2 = form2.position;

    // Calculate midpoint
    const mid = new Vec3(
      (center1.x + center2.x) / 2,
      (center1.y + center2.y) / 2,
      (center1.z + center2.z) / 2
    );

    // Calculate intersection plane normal (vector between centers)
    const normal = center2.subtract(center1).normalize();

    // Generate intersection circle
    const radius = Math.min(this.getBoundingRadius(form1), this.getBoundingRadius(form2)) * 0.5;
    const circlePoints = [];
    const segments = 32;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      // Create perpendicular vectors to normal
      const perpVector1 = normal.cross(new Vec3(0, 1, 0)).normalize();
      const perpVector2 = normal.cross(perpVector1).normalize();

      const point = mid.add(
        perpVector1.scale(Math.cos(angle) * radius)
      ).add(
        perpVector2.scale(Math.sin(angle) * radius)
      );

      const projected = perspectiveSystem.project(point);
      if (projected.visible) {
        circlePoints.push(projected);
      }
    }

    return { circlePoints, midpoint: perspectiveSystem.project(mid) };
  }

  /**
   * Get all intersecting form pairs
   */
  static getAllIntersections(forms) {
    const intersections = [];

    for (let i = 0; i < forms.length; i++) {
      for (let j = i + 1; j < forms.length; j++) {
        if (this.detectIntersection(forms[i], forms[j])) {
          intersections.push({ form1Index: i, form2Index: j });
        }
      }
    }

    return intersections;
  }
}

/**
 * Boolean Operations on 3D Forms
 */
export class BooleanOperations {
  /**
   * Perform union operation (combines two forms)
   */
  static union(form1, form2) {
    // For now, return a composite form that renders both
    return {
      type: 'boolean-union',
      forms: [form1, form2],
      operation: 'union'
    };
  }

  /**
   * Perform subtraction operation (form1 - form2)
   */
  static subtract(form1, form2) {
    return {
      type: 'boolean-subtract',
      forms: [form1, form2],
      operation: 'subtract'
    };
  }

  /**
   * Perform intersection operation (overlapping volume only)
   */
  static intersect(form1, form2) {
    return {
      type: 'boolean-intersect',
      forms: [form1, form2],
      operation: 'intersect'
    };
  }

  /**
   * Visualize boolean operation result
   */
  static visualizeOperation(booleanForm, ctx, perspectiveSystem) {
    const [form1, form2] = booleanForm.forms;

    if (booleanForm.operation === 'union') {
      // Draw both forms with blend
      this.drawFormWithAlpha(form1, ctx, perspectiveSystem, 0.6, '#4499ff');
      this.drawFormWithAlpha(form2, ctx, perspectiveSystem, 0.6, '#ff9944');
    } else if (booleanForm.operation === 'subtract') {
      // Draw form1 solid, form2 as cutout
      this.drawFormWithAlpha(form1, ctx, perspectiveSystem, 0.8, '#4499ff');
      this.drawFormWithAlpha(form2, ctx, perspectiveSystem, 0.3, '#ff4444');

      // Draw "cutting" lines
      const intersections = IntersectionDetector.getIntersectionVisualization(form1, form2, perspectiveSystem);
      if (intersections.circlePoints.length > 0) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(intersections.circlePoints[0].x, intersections.circlePoints[0].y);
        intersections.circlePoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (booleanForm.operation === 'intersect') {
      // Only draw intersection volume
      this.drawFormWithAlpha(form1, ctx, perspectiveSystem, 0.3, '#4499ff');
      this.drawFormWithAlpha(form2, ctx, perspectiveSystem, 0.3, '#ff9944');

      const intersections = IntersectionDetector.getIntersectionVisualization(form1, form2, perspectiveSystem);
      if (intersections.circlePoints.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(intersections.circlePoints[0].x, intersections.circlePoints[0].y);
        intersections.circlePoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  static drawFormWithAlpha(form, ctx, perspectiveSystem, alpha, color) {
    const transformed = form.getTransformedVertices();
    const projected = transformed.map(v => perspectiveSystem.project(v));

    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.lineWidth = 2;

    form.edges.forEach(([i1, i2]) => {
      const p1 = projected[i1];
      const p2 = projected[i2];
      if (p1.visible && p2.visible) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });
  }
}

/**
 * Form depth sorting for proper stacking
 */
export class DepthSorter {
  /**
   * Sort forms by depth (furthest to nearest)
   */
  static sortByDepth(forms, cameraPosition) {
    return forms.map((form, index) => ({ form, index }))
      .sort((a, b) => {
        const distA = a.form.position.subtract(cameraPosition).length();
        const distB = b.form.position.subtract(cameraPosition).length();
        return distB - distA; // Furthest first
      });
  }

  /**
   * Calculate occlusion (which forms are behind others)
   */
  static calculateOcclusion(forms) {
    const occlusions = [];

    for (let i = 0; i < forms.length; i++) {
      for (let j = 0; j < forms.length; j++) {
        if (i === j) continue;

        // Check if form i is behind form j from camera perspective
        if (forms[i].position.z > forms[j].position.z) {
          occlusions.push({ behind: i, inFront: j });
        }
      }
    }

    return occlusions;
  }
}
