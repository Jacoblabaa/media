/**
 * 3D Gizmo System for Interactive Form Manipulation
 */

import { Vec3 } from './math3d.js';

export class Gizmo3D {
  constructor() {
    this.mode = 'move'; // 'move', 'rotate', 'scale'
    this.hoveredAxis = null;
    this.axisLength = 80;
    this.handleSize = 12;
  }

  /**
   * Draw the gizmo at the given position
   */
  draw(ctx, position, projected, perspectiveSystem, scale = 1) {
    const len = this.axisLength * scale;
    const handleSize = this.handleSize * scale;

    if (this.mode === 'move') {
      this.drawMoveGizmo(ctx, position, projected, perspectiveSystem, len, handleSize);
    } else if (this.mode === 'rotate') {
      this.drawRotateGizmo(ctx, position, projected, perspectiveSystem, len);
    } else if (this.mode === 'scale') {
      this.drawScaleGizmo(ctx, position, projected, perspectiveSystem, len, handleSize);
    }
  }

  drawMoveGizmo(ctx, position, projected, perspectiveSystem, len, handleSize) {
    const axes = [
      { axis: new Vec3(len, 0, 0), color: '#ff4444', label: 'X' },
      { axis: new Vec3(0, len, 0), color: '#44ff44', label: 'Y' },
      { axis: new Vec3(0, 0, len), color: '#4444ff', label: 'Z' }
    ];

    axes.forEach(({ axis, color, label }) => {
      const endPos = position.add(axis);
      const endProj = perspectiveSystem.project(endPos);

      if (!projected.visible || !endProj.visible) return;

      // Highlight if hovered
      const isHovered = this.hoveredAxis === label;
      ctx.strokeStyle = isHovered ? '#ffff00' : color;
      ctx.fillStyle = isHovered ? '#ffff00' : color;
      ctx.lineWidth = isHovered ? 4 : 3;

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(projected.x, projected.y);
      ctx.lineTo(endProj.x, endProj.y);
      ctx.stroke();

      // Draw arrow head
      ctx.beginPath();
      ctx.arc(endProj.x, endProj.y, handleSize, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, endProj.x + 10, endProj.y - 10);
    });

    // Draw center handle for all-axis movement
    ctx.fillStyle = this.hoveredAxis === 'center' ? '#ffff00' : '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, handleSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawRotateGizmo(ctx, position, projected, perspectiveSystem, radius) {
    const segments = 32;
    const axes = [
      { normal: new Vec3(1, 0, 0), color: '#ff4444', label: 'X' },
      { normal: new Vec3(0, 1, 0), color: '#44ff44', label: 'Y' },
      { normal: new Vec3(0, 0, 1), color: '#4444ff', label: 'Z' }
    ];

    axes.forEach(({ normal, color, label }) => {
      const isHovered = this.hoveredAxis === label;
      ctx.strokeStyle = isHovered ? '#ffff00' : color;
      ctx.lineWidth = isHovered ? 4 : 2;

      ctx.beginPath();
      let firstPoint = true;

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        let circlePoint;

        // Generate circle perpendicular to normal
        if (normal.x !== 0) {
          circlePoint = new Vec3(
            0,
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
          );
        } else if (normal.y !== 0) {
          circlePoint = new Vec3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          );
        } else {
          circlePoint = new Vec3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          );
        }

        const worldPoint = position.add(circlePoint);
        const proj = perspectiveSystem.project(worldPoint);

        if (proj.visible) {
          if (firstPoint) {
            ctx.moveTo(proj.x, proj.y);
            firstPoint = false;
          } else {
            ctx.lineTo(proj.x, proj.y);
          }
        }
      }

      ctx.stroke();
    });
  }

  drawScaleGizmo(ctx, position, projected, perspectiveSystem, len, handleSize) {
    const axes = [
      { axis: new Vec3(len, 0, 0), color: '#ff4444', label: 'X' },
      { axis: new Vec3(0, len, 0), color: '#44ff44', label: 'Y' },
      { axis: new Vec3(0, 0, len), color: '#4444ff', label: 'Z' }
    ];

    axes.forEach(({ axis, color, label }) => {
      const endPos = position.add(axis);
      const endProj = perspectiveSystem.project(endPos);

      if (!projected.visible || !endProj.visible) return;

      const isHovered = this.hoveredAxis === label;
      ctx.strokeStyle = isHovered ? '#ffff00' : color;
      ctx.fillStyle = isHovered ? '#ffff00' : color;
      ctx.lineWidth = isHovered ? 4 : 3;

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(projected.x, projected.y);
      ctx.lineTo(endProj.x, endProj.y);
      ctx.stroke();

      // Draw cube handle
      const cubeSize = handleSize * 1.5;
      ctx.fillRect(endProj.x - cubeSize / 2, endProj.y - cubeSize / 2, cubeSize, cubeSize);
    });

    // Draw center handle for uniform scale
    const size = handleSize * 1.2;
    ctx.fillStyle = this.hoveredAxis === 'uniform' ? '#ffff00' : '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(projected.x - size / 2, projected.y - size / 2, size, size);
    ctx.strokeRect(projected.x - size / 2, projected.y - size / 2, size, size);
  }

  /**
   * Test if mouse is over any gizmo handle
   */
  hitTest(mousePos, position, perspectiveSystem) {
    const projected = perspectiveSystem.project(position);
    if (!projected.visible) return null;

    const len = this.axisLength;
    const handleSize = this.handleSize;

    // Test center handle
    const centerDist = Math.sqrt(
      (mousePos.x - projected.x) ** 2 + (mousePos.y - projected.y) ** 2
    );
    if (centerDist < handleSize * 1.5) {
      return this.mode === 'scale' ? 'uniform' : 'center';
    }

    // Test axis handles
    const axes = [
      { axis: new Vec3(len, 0, 0), label: 'X' },
      { axis: new Vec3(0, len, 0), label: 'Y' },
      { axis: new Vec3(0, 0, len), label: 'Z' }
    ];

    for (const { axis, label } of axes) {
      const endPos = position.add(axis);
      const endProj = perspectiveSystem.project(endPos);

      if (!endProj.visible) continue;

      const dist = Math.sqrt(
        (mousePos.x - endProj.x) ** 2 + (mousePos.y - endProj.y) ** 2
      );

      if (dist < handleSize * 2) {
        return label;
      }
    }

    return null;
  }

  /**
   * Calculate drag transformation
   */
  calculateDrag(dragStart, dragCurrent, axis, position, perspectiveSystem, mode) {
    const delta = {
      x: dragCurrent.x - dragStart.x,
      y: dragCurrent.y - dragStart.y
    };

    if (mode === 'move') {
      return this.calculateMoveDelta(delta, axis, position, perspectiveSystem);
    } else if (mode === 'rotate') {
      return this.calculateRotateDelta(delta, axis);
    } else if (mode === 'scale') {
      return this.calculateScaleDelta(delta, axis);
    }

    return null;
  }

  calculateMoveDelta(delta, axis, position, perspectiveSystem) {
    const moveSensitivity = 0.5;

    if (axis === 'center') {
      // Move in XZ plane (horizontal movement)
      return new Vec3(delta.x * moveSensitivity, 0, delta.y * moveSensitivity);
    }

    // Project movement along specific axis
    const axisVectors = {
      'X': new Vec3(1, 0, 0),
      'Y': new Vec3(0, 1, 0),
      'Z': new Vec3(0, 0, 1)
    };

    const axisVec = axisVectors[axis];
    if (!axisVec) return new Vec3();

    // Use screen delta magnitude as movement amount
    const magnitude = Math.sqrt(delta.x ** 2 + delta.y ** 2);
    const direction = delta.x + delta.y > 0 ? 1 : -1;

    return axisVec.scale(magnitude * direction * moveSensitivity);
  }

  calculateRotateDelta(delta, axis) {
    const rotateSensitivity = 0.01;
    const magnitude = (delta.x + delta.y) * rotateSensitivity;

    const rotationDelta = new Vec3();
    if (axis === 'X') rotationDelta.x = magnitude;
    if (axis === 'Y') rotationDelta.y = magnitude;
    if (axis === 'Z') rotationDelta.z = magnitude;

    return rotationDelta;
  }

  calculateScaleDelta(delta, axis) {
    const scaleSensitivity = 0.005;
    const magnitude = (delta.x + delta.y) * scaleSensitivity;

    if (axis === 'uniform') {
      return new Vec3(1 + magnitude, 1 + magnitude, 1 + magnitude);
    }

    const scaleDelta = new Vec3(1, 1, 1);
    if (axis === 'X') scaleDelta.x = 1 + magnitude;
    if (axis === 'Y') scaleDelta.y = 1 + magnitude;
    if (axis === 'Z') scaleDelta.z = 1 + magnitude;

    return scaleDelta;
  }
}
