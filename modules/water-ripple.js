/**
 * WaterRippleSim - Mô phỏng sóng nước vật lý 2.5D rời rạc trên lưới (CPU Grid Simulation).
 * - Sử dụng phương trình truyền sóng với toán tử vi phân Laplace 9 điểm: sóng tròn đều, không bị răng cưa.
 * - Có cơ chế dải biên hút sóng (Damping Boundary / Sponge) giúp sóng không bị dội tường khó chịu.
 * - Tương thích trực tiếp với HTML5 2D Canvas hoặc đẩy lên Three.js DataTexture để làm shader WebGL.
 */

export class WaterRippleSim {
  /**
   * @param {number} width - Chiều rộng vùng mô phỏng (pixels)
   * @param {number} height - Chiều cao vùng mô phỏng (pixels)
   * @param {number} cellSize - Kích thước mỗi ô lưới (càng nhỏ càng nét, thường 4 đến 8px)
   * @param {object} options
   */
  constructor(width, height, cellSize = 6, options = {}) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;

    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    const total = this.cols * this.rows;

    this.cur = new Float32Array(total);
    this.prev = new Float32Array(total);
    this.damping = new Float32Array(total);

    // Hệ số sóng C = (v * dt / cell)^2 (giữ < 0.7 để thuật toán ổn định)
    this.waveSpeed = options.speed ?? 0.45;
    this.baseDamp = options.damp ?? 0.985;
    this.edgeDamp = options.edgeDamp ?? 0.85;
    this.spongeBand = options.spongeBand ?? 8; // Số ô viền dùng để hút sóng

    this.initDamping();
  }

  /**
   * Khởi tạo mảng suy hao: Càng gần biên ngoài cùng thì sóng càng bị dập tắt nhanh
   * nhằm loại bỏ hoàn toàn hiện tượng dội sóng vào giữa màn hình.
   */
  initDamping() {
    const { cols, rows, spongeBand, baseDamp, edgeDamp } = this;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const distToEdge = Math.min(x, y, cols - 1 - x, rows - 1 - y);
        if (distToEdge < spongeBand) {
          const t = distToEdge / spongeBand;
          // Smoothstep lerp giữa edgeDamp và baseDamp
          const k = t * t * (3 - 2 * t);
          this.damping[y * cols + x] = edgeDamp + (baseDamp - edgeDamp) * k;
        } else {
          this.damping[y * cols + x] = baseDamp;
        }
      }
    }
  }

  /**
   * Cập nhật 1 bước thời gian vật lý (Step wave propagation)
   */
  step() {
    const { cols, rows, cur, prev, damping, waveSpeed } = this;
    const C = waveSpeed;

    for (let y = 1; y < rows - 1; y++) {
      let idx = y * cols + 1;
      for (let x = 1; x < cols - 1; x++, idx++) {
        const c = cur[idx];

        // 4 ô lân cận trực giao (trên, dưới, trái, phải)
        const s4 = cur[idx - 1] + cur[idx + 1] + cur[idx - cols] + cur[idx + cols];

        // 4 ô lân cận đường chéo
        const sd = cur[idx - cols - 1] + cur[idx - cols + 1] + cur[idx + cols - 1] + cur[idx + cols + 1];

        // Toán tử Laplacian 9 điểm: (4 * s4 + sd - 20 * c) / 6
        const laplacian = (4 * s4 + sd - 20 * c) * 0.16666667;

        prev[idx] = (2 * c - prev[idx] + C * laplacian) * damping[idx];
      }
    }

    // Hoán đổi buffer
    this.cur = prev;
    this.prev = cur;
  }

  /**
   * Tạo một điểm sóng/gợn nước tại tọa độ pixel (x, y)
   * @param {number} x - Tọa độ X trên màn hình
   * @param {number} y - Tọa độ Y trên màn hình
   * @param {number} radiusPx - Bán kính gợn nước (pixels)
   * @param {number} amount - Độ sâu/cao của sóng (-10 đến +10)
   */
  disturb(x, y, radiusPx = 20, amount = -6) {
    const { cols, rows, cellSize, cur } = this;
    const gx = x / cellSize;
    const gy = y / cellSize;
    const rGrid = radiusPx / cellSize;
    const rGrid2 = rGrid * rGrid;

    const x0 = Math.max(1, Math.floor(gx - rGrid * 1.5));
    const x1 = Math.min(cols - 2, Math.ceil(gx + rGrid * 1.5));
    const y0 = Math.max(1, Math.floor(gy - rGrid * 1.5));
    const y1 = Math.min(rows - 2, Math.ceil(gy + rGrid * 1.5));

    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const d2 = (cx - gx) ** 2 + (cy - gy) ** 2;
        if (d2 < rGrid2 * 2.25) {
          cur[cy * cols + cx] += amount * Math.exp(-d2 / (rGrid2 * 0.5));
        }
      }
    }
  }

  /**
   * Lấy chiều cao sóng và độ dốc (gradient) tại tọa độ pixel (dùng để làm hiệu ứng khúc xạ ảnh)
   */
  sample(x, y) {
    const gx = Math.min(this.cols - 2, Math.max(1, x / this.cellSize));
    const gy = Math.min(this.rows - 2, Math.max(1, y / this.cellSize));

    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const tx = gx - x0, ty = gy - y0;
    const idx = y0 * this.cols + x0;

    const h = (this.cur[idx] * (1 - tx) + this.cur[idx + 1] * tx) * (1 - ty) +
              (this.cur[idx + this.cols] * (1 - tx) + this.cur[idx + this.cols + 1] * tx) * ty;

    const gX = (this.cur[idx + 1] - this.cur[idx - 1]) / (2 * this.cellSize);
    const gY = (this.cur[idx + this.cols] - this.cur[idx - this.cols]) / (2 * this.cellSize);

    return { height: h, gradX: gX, gradY: gY };
  }
}
