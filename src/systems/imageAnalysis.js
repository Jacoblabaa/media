/**
 * Found Perspective System
 * Click on parallel lines to detect vanishing points automatically
 * Essential for analyzing existing artwork and photos
 */

export class FoundPerspective {
  constructor() {
    this.lines = [];
    this.detectedVPs = [];
  }

  /**
   * Add a line defined by two points
   */
  addLine(p1, p2) {
    this.lines.push({ p1, p2, id: Date.now() });
  }

  /**
   * Find intersection of two lines
   */
  static lineIntersection(line1, line2) {
    const x1 = line1.p1.x, y1 = line1.p1.y;
    const x2 = line1.p2.x, y2 = line1.p2.y;
    const x3 = line2.p1.x, y3 = line2.p1.y;
    const x4 = line2.p2.x, y4 = line2.p2.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denom) < 0.001) {
      return null; // Parallel lines
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
      t, u
    };
  }

  /**
   * Detect vanishing points from collected lines
   */
  detectVanishingPoints(threshold = 50) {
    const vps = [];
    const processedPairs = new Set();

    // Compare all pairs of lines
    for (let i = 0; i < this.lines.length; i++) {
      for (let j = i + 1; j < this.lines.length; j++) {
        const pairKey = `${i}-${j}`;
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const intersection = FoundPerspective.lineIntersection(
          this.lines[i],
          this.lines[j]
        );

        if (!intersection) continue;

        // Check if this VP is similar to existing ones
        let merged = false;
        for (const vp of vps) {
          const dist = Math.sqrt(
            (vp.x - intersection.x) ** 2 + (vp.y - intersection.y) ** 2
          );

          if (dist < threshold) {
            // Merge - average position
            vp.x = (vp.x * vp.count + intersection.x) / (vp.count + 1);
            vp.y = (vp.y * vp.count + intersection.y) / (vp.count + 1);
            vp.count++;
            vp.lines.push(i, j);
            merged = true;
            break;
          }
        }

        if (!merged) {
          vps.push({
            x: intersection.x,
            y: intersection.y,
            count: 1,
            lines: [i, j],
            confidence: 1
          });
        }
      }
    }

    // Calculate confidence based on how many lines converge
    vps.forEach(vp => {
      vp.confidence = Math.min(vp.count / 3, 1); // 3+ lines = high confidence
    });

    this.detectedVPs = vps.sort((a, b) => b.confidence - a.confidence);
    return this.detectedVPs;
  }

  /**
   * Clear all lines
   */
  clear() {
    this.lines = [];
    this.detectedVPs = [];
  }

  /**
   * Remove last line
   */
  undo() {
    this.lines.pop();
    if (this.lines.length > 1) {
      this.detectVanishingPoints();
    } else {
      this.detectedVPs = [];
    }
  }
}

/**
 * Color Palette Extraction
 * Analyze images for dominant colors
 */
export class ColorExtractor {
  /**
   * Extract dominant colors from image data
   */
  static extractPalette(imageData, numColors = 6) {
    const pixels = [];
    const data = imageData.data;

    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2]
      });
    }

    // Simple k-means clustering
    const palette = this.kMeansClustering(pixels, numColors);

    // Sort by luminance
    return palette.sort((a, b) => {
      const lumA = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
      const lumB = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
      return lumB - lumA;
    });
  }

  static kMeansClustering(pixels, k, maxIterations = 10) {
    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(Math.random() * pixels.length);
      centroids.push({ ...pixels[idx] });
    }

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign pixels to nearest centroid
      const clusters = Array(k).fill().map(() => []);

      pixels.forEach(pixel => {
        let minDist = Infinity;
        let nearestIdx = 0;

        centroids.forEach((centroid, idx) => {
          const dist = Math.sqrt(
            (pixel.r - centroid.r) ** 2 +
            (pixel.g - centroid.g) ** 2 +
            (pixel.b - centroid.b) ** 2
          );

          if (dist < minDist) {
            minDist = dist;
            nearestIdx = idx;
          }
        });

        clusters[nearestIdx].push(pixel);
      });

      // Update centroids
      centroids = clusters.map(cluster => {
        if (cluster.length === 0) return centroids[0];

        const sum = cluster.reduce((acc, p) => ({
          r: acc.r + p.r,
          g: acc.g + p.g,
          b: acc.b + p.b
        }), { r: 0, g: 0, b: 0 });

        return {
          r: Math.round(sum.r / cluster.length),
          g: Math.round(sum.g / cluster.length),
          b: Math.round(sum.b / cluster.length)
        };
      });
    }

    return centroids;
  }

  /**
   * Convert RGB to hex
   */
  static rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * Analyze value distribution (light/dark areas)
   */
  static analyzeValues(imageData) {
    const data = imageData.data;
    const values = [];

    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      values.push(lum);
    }

    values.sort((a, b) => a - b);

    return {
      darkest: values[0],
      lightest: values[values.length - 1],
      median: values[Math.floor(values.length / 2)],
      average: values.reduce((a, b) => a + b, 0) / values.length,
      contrast: values[values.length - 1] - values[0]
    };
  }

  /**
   * Detect potential light source direction
   */
  static detectLightSource(imageData, width, height) {
    const data = imageData.data;
    let brightestX = 0;
    let brightestY = 0;
    let maxBrightness = 0;

    // Sample grid for brightest area
    const gridSize = 20;
    for (let y = 0; y < height; y += gridSize) {
      for (let x = 0; x < width; x += gridSize) {
        const idx = (y * width + x) * 4;
        const brightness = data[idx] + data[idx + 1] + data[idx + 2];

        if (brightness > maxBrightness) {
          maxBrightness = brightness;
          brightestX = x;
          brightestY = y;
        }
      }
    }

    // Estimate direction from center
    const centerX = width / 2;
    const centerY = height / 2;
    const angle = Math.atan2(brightestY - centerY, brightestX - centerX);

    return {
      x: brightestX,
      y: brightestY,
      angle: angle,
      direction: {
        x: Math.cos(angle),
        y: Math.sin(angle)
      }
    };
  }
}

/**
 * Pose Templates
 * Pre-made anatomical poses for quick construction
 */
export const PoseTemplates = {
  human: {
    tPose: {
      name: 'T-Pose (Neutral)',
      landmarks: {
        crown: { x: 0, y: -200, z: 300 },
        chin: { x: 0, y: -140, z: 300 },
        c7: { x: 0, y: -120, z: 300 },
        shoulderL: { x: -80, y: -100, z: 300 },
        shoulderR: { x: 80, y: -100, z: 300 },
        elbowL: { x: -180, y: -100, z: 300 },
        elbowR: { x: 180, y: -100, z: 300 },
        wristL: { x: -260, y: -100, z: 300 },
        wristR: { x: 260, y: -100, z: 300 },
        hipL: { x: -40, y: 40, z: 300 },
        hipR: { x: 40, y: 40, z: 300 },
        kneeL: { x: -40, y: 160, z: 300 },
        kneeR: { x: 40, y: 160, z: 300 },
        ankleL: { x: -40, y: 280, z: 300 },
        ankleR: { x: 40, y: 280, z: 300 }
      }
    },
    actionPose: {
      name: 'Action (Running)',
      landmarks: {
        crown: { x: 20, y: -180, z: 300 },
        chin: { x: 20, y: -120, z: 300 },
        c7: { x: 15, y: -100, z: 300 },
        shoulderL: { x: -50, y: -90, z: 320 },
        shoulderR: { x: 80, y: -85, z: 280 },
        elbowL: { x: -90, y: -40, z: 340 },
        elbowR: { x: 140, y: -120, z: 260 },
        wristL: { x: -100, y: 10, z: 350 },
        wristR: { x: 180, y: -160, z: 240 },
        hipL: { x: -30, y: 50, z: 310 },
        hipR: { x: 50, y: 45, z: 290 },
        kneeL: { x: -20, y: 120, z: 340 },
        kneeR: { x: 80, y: 180, z: 260 },
        ankleL: { x: -10, y: 200, z: 360 },
        ankleR: { x: 90, y: 290, z: 250 }
      }
    },
    contrapposto: {
      name: 'Contrapposto (Classical)',
      landmarks: {
        crown: { x: 0, y: -200, z: 300 },
        chin: { x: 5, y: -140, z: 300 },
        c7: { x: 0, y: -120, z: 300 },
        shoulderL: { x: -70, y: -105, z: 300 },
        shoulderR: { x: 75, y: -95, z: 300 },
        elbowL: { x: -90, y: -20, z: 310 },
        elbowR: { x: 120, y: -10, z: 290 },
        wristL: { x: -70, y: 60, z: 320 },
        wristR: { x: 150, y: 70, z: 280 },
        hipL: { x: -50, y: 40, z: 300 },
        hipR: { x: 35, y: 50, z: 300 },
        kneeL: { x: -45, y: 170, z: 300 },
        kneeR: { x: 25, y: 160, z: 300 },
        ankleL: { x: -40, y: 290, z: 300 },
        ankleR: { x: 30, y: 280, z: 300 }
      }
    }
  }
};
