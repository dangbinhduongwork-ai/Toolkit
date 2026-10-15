/**
 * ThreeApp - Bộ khung khởi tạo Three.js chuẩn chỉnh cho các dự án Web tương tác cao.
 * - Khởi tạo WebGLRenderer với cấu hình tối ưu pin và hiệu năng.
 * - Tự động thích ứng kích thước (ResizeObserver) không bị méo tỷ lệ.
 * - Giám sát hiệu năng tự động (Adaptive DPR): Nếu máy yếu (< 30 FPS), tự động hạ resolution để không giật lag.
 * - Hỗ trợ vòng lặp animation mượt mà chuẩn Three.js r186 (setAnimationLoop + THREE.Timer).
 */

import * as THREE from 'three';

export class ThreeApp {
  /**
   * @param {HTMLCanvasElement} canvas - Thẻ canvas vẽ WebGL
   * @param {object} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      powerPreference: 'high-performance',
    });

    this.maxPixelRatio = Math.min(window.devicePixelRatio || 1, options.maxDpr ?? 2.0);
    this.currentPixelRatio = Math.min(this.maxPixelRatio, 1.5);
    this.renderer.setPixelRatio(this.currentPixelRatio);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      options.fov ?? 45,
      canvas.clientWidth / canvas.clientHeight,
      options.near ?? 0.1,
      options.far ?? 1000
    );

    // Timing (Three.js r186+)
    this.timer = new THREE.Timer();
    this.timer.connect(document);

    // Performance monitor
    this.perfFrames = 0;
    this.perfTime = 0;
    this.adaptiveDprEnabled = options.adaptiveDpr ?? true;

    this.initResizeObserver();
    this.onUpdate = null; // Callback mỗi frame: (deltaTime, elapsedTime) => {}
  }

  initResizeObserver() {
    const parent = this.canvas.parentElement || document.body;
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(parent);
    this.resize();
  }

  resize() {
    const parent = this.canvas.parentElement || document.body;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  start(onUpdate) {
    this.onUpdate = onUpdate;
    this.renderer.setAnimationLoop((timestamp) => {
      this.timer.update(timestamp);
      const dt = Math.min(this.timer.getDelta(), 0.1);
      const elapsed = this.timer.getElapsed();

      // Gọi callback cập nhật logic dự án
      if (this.onUpdate) {
        this.onUpdate(dt, elapsed);
      }

      this.renderer.render(this.scene, this.camera);
      this.checkPerformance(dt);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  // Tự động hạ pixelRatio nếu FPS quá thấp
  checkPerformance(dt) {
    if (!this.adaptiveDprEnabled) return;
    this.perfFrames++;
    this.perfTime += dt;

    if (this.perfFrames >= 60) {
      const avgFrameTime = this.perfTime / this.perfFrames;
      this.perfFrames = 0;
      this.perfTime = 0;

      // Nếu frame time > 33ms (tức là < 30 FPS) và pixelRatio còn cao hơn 0.8
      if (avgFrameTime > 0.033 && this.currentPixelRatio > 0.8) {
        this.currentPixelRatio = Math.max(0.75, this.currentPixelRatio * 0.8);
        this.renderer.setPixelRatio(this.currentPixelRatio);
        console.warn(`[ThreeApp] Máy yếu (<30 FPS) -> Tự động hạ DPR xuống ${this.currentPixelRatio.toFixed(2)}`);
      }
    }
  }

  dispose() {
    this.stop();
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }
}
