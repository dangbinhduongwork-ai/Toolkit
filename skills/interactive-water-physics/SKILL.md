---
name: interactive-water-physics
description: 2.5D wave grid physics simulation, caustics, refraction, and water shaders for interactive web experiences. Use when creating interactive liquid surfaces, water ripples, rain drops on ponds, or underwater viewports.
---

# Interactive Water Physics & Shaders

This skill guides you through implementing high-performance interactive water ripples and optical effects on the web.

## Architecture

1. **CPU Simulation Layer**: 2D discrete wave grid using a 9-point Laplacian operator.
2. **GPU Rendering Layer**: Transfer the height map to a `THREE.DataTexture` (HalfFloat, RedFormat).
3. **Shader Layer**: Compute caustics (Laplace curvature), refraction (normal gradient), and total internal reflection (TIR).

## 1. Minimal 2.5D Wave Simulation Engine

```javascript
export class WaterWaveSim {
  constructor(cols, rows, { damp = 0.985, speed = 0.5 } = {}) {
    this.cols = cols;
    this.rows = rows;
    this.damp = damp;
    this.C = speed; // (speed * dt / cell)^2, keep < 0.7 for stability
    const n = cols * rows;
    this.cur = new Float32Array(n);
    this.prev = new Float32Array(n);
  }

  // 9-point discrete Laplacian wave equation for isotropic circular ripples
  step() {
    const { cols, rows, cur, prev, C, damp } = this;
    for (let y = 1; y < rows - 1; y++) {
      let i = y * cols + 1;
      for (let x = 1; x < cols - 1; x++, i++) {
        const c = cur[i];
        const s4 = cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols];
        const sd = cur[i - cols - 1] + cur[i - cols + 1] + cur[i + cols - 1] + cur[i + cols + 1];
        prev[i] = (2 * c - prev[i] + C * ((4 * s4 + sd - 20 * c) / 6)) * damp;
      }
    }
    this.cur = prev;
    this.prev = cur;
  }

  // Add a ripple disturbance at grid position (gx, gy)
  disturb(gx, gy, radius, amount) {
    const { cols, rows, cur } = this;
    const r2 = radius * radius;
    const x0 = Math.max(1, Math.floor(gx - radius));
    const x1 = Math.min(cols - 2, Math.ceil(gx + radius));
    const y0 = Math.max(1, Math.floor(gy - radius));
    const y1 = Math.min(rows - 2, Math.ceil(gy + radius));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d2 = (x - gx) ** 2 + (y - gy) ** 2;
        if (d2 < r2) {
          cur[y * cols + x] += amount * Math.exp(-d2 / (radius * 0.5));
        }
      }
    }
  }
}
```

## 2. GLSL Water Shader Principles

### Caustics (Light Focusing)
Under water looking up, convex ripples disperse light (dark spots), while concave ripples focus light into sharp caustic bands.
In GLSL:
```glsl
// laplace = curvature of water surface
float lap = (left + right + top + bottom - 4.0 * center);
float caustic = clamp(-lap * uFocusGain, -0.5, 1.5);
color *= (1.0 + caustic);
color += vec3(0.8, 0.95, 1.0) * max(0.0, caustic - 0.3); // Bright caustic fringe
```

### Refraction (Gradient Distortion)
```glsl
vec2 grad = vec2(right - left, bottom - top) * uRefractStrength;
vec2 distortedUV = screenUV - grad;
vec3 sceneColor = texture2D(uBackgroundTexture, distortedUV).rgb;
```
