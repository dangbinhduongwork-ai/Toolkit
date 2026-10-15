import { useEffect } from 'react';
import { WaterRippleSim } from '../water-ripple.js';

/**
 * useWaterRipple - React Hook tạo hiệu ứng sóng nước vật lý tương tác:
 * - Tự động gắn bộ mô phỏng vi phân Laplace 9 điểm lên thẻ <canvas>.
 * - Bấm hoặc rê chuột/vuốt màn hình tạo sóng nước phản chiếu ánh sáng.
 * - Tự động cập nhật kích thước theo màn hình và dọn dẹp khi unmount.
 *
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - Ref của thẻ canvas
 * @param {object} [options]
 * @param {number} [options.cellSize=6] - Kích thước ô lưới (px)
 * @param {number} [options.rippleRadius=20] - Bán kính gợn nước khi click
 * @param {string} [options.waveColor='rgba(56, 189, 248, 0.25)'] - Màu ánh sáng phản chiếu của sóng
 */
export function useWaterRipple(canvasRef, options = {}) {
  const {
    cellSize = 6,
    rippleRadius = 22,
    waveColor = 'rgba(56, 189, 248, 0.25)',
  } = options;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let sim = new WaterRippleSim(width, height, cellSize);

    // Kích hoạt sóng khi bấm
    const onPointerDown = (e) => {
      sim.disturb(e.clientX, e.clientY, rippleRadius, -8);
    };

    // Khuấy nước khi rê chuột
    let lastX = 0, lastY = 0;
    const onPointerMove = (e) => {
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist > 15) {
        sim.disturb(e.clientX, e.clientY, rippleRadius * 0.7, -3);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      sim = new WaterRippleSim(width, height, cellSize);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);

    let animId = null;
    const render = () => {
      animId = requestAnimationFrame(render);
      sim.step();

      ctx.clearRect(0, 0, width, height);

      // Vẽ các vệt sáng gợn sóng dựa trên độ dốc gradient
      const { cols, rows, cur } = sim;
      ctx.fillStyle = waveColor;

      for (let y = 1; y < rows - 1; y += 2) {
        for (let x = 1; x < cols - 1; x += 2) {
          const idx = y * cols + x;
          const h = cur[idx];
          if (Math.abs(h) > 0.4) {
            const alpha = Math.min(0.8, Math.abs(h) * 0.12);
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize * 2, cellSize * 2);
          }
        }
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
    };
  }, [cellSize, rippleRadius, waveColor]);
}

export default useWaterRipple;
