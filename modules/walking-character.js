/**
 * WalkingCharacter - Module nhúng nhân vật 3D (.glb) đi lại dưới đáy màn hình cho mọi website.
 *
 * Tính năng:
 * - Nhân vật tự đi qua đi lại dọc theo chân màn hình (tự quay đầu mượt mà khi chạm mép).
 * - Tương tác chuột/chạm: Người dùng có thể bấm kéo (drag) nhân vật lên cao.
 * - Vật lý trọng lực: Khi thả tay, nhân vật rơi tự do xuống sàn, có hiệu ứng nảy (bounce/squash) rồi tiếp tục đi bộ.
 * - Đổ bóng tiếp xúc (contact shadow) mờ dần khi nhấc lên cao.
 * - Canvas trong suốt (transparent), phủ toàn màn hình nhưng `pointer-events: none` nên không chặn click của website.
 * - Tự động phát animation 'walk' (hoặc animation đầu tiên có trong file GLB).
 * - Tự động thích ứng kích thước màn hình (Responsive Resize).
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export class WalkingCharacter {
  /**
   * @param {object} options
   * @param {string} options.modelUrl - Đường dẫn file .glb
   * @param {number} [options.scale=120] - Chiều cao nhân vật trên màn hình (pixels)
   * @param {number} [options.speed=90] - Tốc độ đi bộ (pixels/giây)
   * @param {number} [options.floorOffset=20] - Khoảng cách từ chân nhân vật tới đáy màn hình (pixels)
   * @param {number} [options.gravity=1800] - Gia tốc trọng lực khi rơi (pixels/giây^2)
   * @param {number} [options.bounce=0.3] - Độ nảy khi chạm đất (0 đến 1)
   * @param {number} [options.facingAngle=0] - Bù góc quay ban đầu của model (radian, ví dụ Math.PI/2)
   * @param {function} [options.onLand] - Callback khi nhân vật rơi chạm đất (để phát âm thanh)
   * @param {function} [options.onGrab] - Callback khi người dùng nhấc nhân vật lên
   */
  constructor(options = {}) {
    this.opts = {
      modelUrl: options.modelUrl || '',
      scale: options.scale ?? 120,
      speed: options.speed ?? 90,
      floorOffset: options.floorOffset ?? 20,
      gravity: options.gravity ?? 1800,
      bounce: options.bounce ?? 0.35,
      facingAngle: options.facingAngle ?? 0,
      onLand: options.onLand || null,
      onGrab: options.onGrab || null,
      ...options,
    };

    this.state = 'WALKING'; // 'WALKING' | 'DRAGGING' | 'FALLING'
    this.direction = 1; // 1 = sang phải, -1 = sang trái
    this.targetRotationY = Math.PI / 2 + this.opts.facingAngle;

    // Vị trí (hệ tọa độ pixel: x từ 0 -> window.innerWidth, y từ 0 [đáy] -> window.innerHeight [đỉnh])
    this.pos = {
      x: window.innerWidth * 0.5,
      y: this.opts.floorOffset,
    };
    this.velY = 0; // Vận tốc rơi tự do

    // Chuột / drag
    this.isPointerDown = false;
    this.dragOffset = { x: 0, y: 0 };
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // Three.js instances
    this.mixer = null;
    this.walkAction = null;
    this.modelRoot = null;
    this.charMesh = null;
    this.clock = new THREE.Clock();

    this.initScene();
    this.initShadow();
    this.initEvents();

    if (this.opts.modelUrl) {
      this.loadModel(this.opts.modelUrl);
    }
  }

  /* ------------------------------------------------ Khởi tạo Three.js */
  initScene() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'walking-character-canvas';
    Object.assign(this.canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none', // Không chặn click của website
      zIndex: '99999',
      display: 'block',
    });
    document.body.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();

    // Sử dụng Orthographic Camera đồng bộ 1:1 với kích thước pixel màn hình
    // Gốc tọa độ (0, 0) ở góc dưới - bên trái màn hình
    this.camera = new THREE.OrthographicCamera(
      0, window.innerWidth,
      window.innerHeight, 0,
      -2000, 2000
    );
    this.camera.position.set(0, 0, 500);

    // Ánh sáng
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(100, 300, 200);
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(-100, -100, -100);
    this.scene.add(backLight);
  }

  /* ------------------------------------------------ Đổ bóng tiếp xúc */
  initShadow() {
    // Tạo texture hình elip mờ cho bóng tiếp xúc
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(this.opts.scale * 0.75, this.opts.scale * 0.25);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });

    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.set(this.pos.x, this.opts.floorOffset, -1);
    this.scene.add(this.shadowMesh);
  }

  /* ------------------------------------------------ Nạp mô hình GLB */
  async loadModel(url) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    try {
      const gltf = await loader.loadAsync(url);
      const model = gltf.scene;

      // Đo kích thước ban đầu để chuẩn hóa về chiều cao mong muốn (opts.scale pixels)
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const origHeight = size.y || 1;
      const s = this.opts.scale / origHeight;
      model.scale.set(s, s, s);

      // Đưa chân nhân vật về gốc y = 0
      box.setFromObject(model);
      model.position.y = -box.min.y;

      // Nhóm bọc ngoài (Root Container)
      this.modelRoot = new THREE.Group();
      this.modelRoot.position.set(this.pos.x, this.pos.y, 0);
      this.modelRoot.add(model);
      this.scene.add(this.modelRoot);
      this.charMesh = model;

      // Xử lý Animation
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);

        // Tìm clip walk/run hoặc ưu tiên clip có chu kỳ lặp ngắn (1-3s như Mixamo walk cycle)
        let clip = gltf.animations.find((a) => /walk|run|move|layer0|step/i.test(a.name));
        if (!clip) {
          clip = [...gltf.animations].sort((a, b) => a.duration - b.duration)[0];
        }

        this.walkAction = this.mixer.clipAction(clip);
        this.walkAction.play();
        console.log(`[WalkingCharacter] Đang phát animation: "${clip.name}" (thời lượng: ${clip.duration.toFixed(2)}s)`);
      }

      this.startLoop();
    } catch (err) {
      console.error('[WalkingCharacter] Lỗi nạp mô hình .glb:', err);
    }
  }

  /* ------------------------------------------------ Sự kiện Kéo Thả */
  initEvents() {
    window.addEventListener('resize', () => this.onResize());

    // Bắt sự kiện chuột/chạm toàn màn hình
    window.addEventListener('pointerdown', (e) => this.onPointerDown(e), { passive: false });
    window.addEventListener('pointermove', (e) => this.onPointerMove(e), { passive: false });
    window.addEventListener('pointerup', () => this.onPointerUp());
    window.addEventListener('pointercancel', () => this.onPointerUp());
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.right = w;
    this.camera.top = h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // Chuyển clientX, clientY màn hình sang hệ tọa độ của camera
  screenToWorld(clientX, clientY) {
    return {
      x: clientX,
      y: window.innerHeight - clientY,
    };
  }

  onPointerDown(e) {
    if (!this.charMesh) return;
    const worldPos = this.screenToWorld(e.clientX, e.clientY);

    // Kiểm tra khoảng cách chuột tới nhân vật (Hit-box tròn hoặc hộp)
    const hitRadius = Math.max(50, this.opts.scale * 0.6);
    const charCenterY = this.pos.y + this.opts.scale * 0.45;
    const dist = Math.hypot(worldPos.x - this.pos.x, worldPos.y - charCenterY);

    if (dist <= hitRadius) {
      this.state = 'DRAGGING';
      this.isPointerDown = true;
      this.velY = 0;
      this.dragOffset.x = this.pos.x - worldPos.x;
      this.dragOffset.y = this.pos.y - worldPos.y;

      if (this.opts.onGrab) this.opts.onGrab();
      e.preventDefault();
    }
  }

  onPointerMove(e) {
    if (this.state !== 'DRAGGING' || !this.isPointerDown) return;
    const worldPos = this.screenToWorld(e.clientX, e.clientY);

    // Cập nhật vị trí nhân vật theo con trỏ chuột
    this.pos.x = worldPos.x + this.dragOffset.x;
    this.pos.y = Math.max(this.opts.floorOffset, worldPos.y + this.dragOffset.y);

    e.preventDefault();
  }

  onPointerUp() {
    if (this.state === 'DRAGGING') {
      this.isPointerDown = false;
      if (this.pos.y > this.opts.floorOffset + 5) {
        this.state = 'FALLING';
        this.velY = 0;
      } else {
        this.state = 'WALKING';
        this.pos.y = this.opts.floorOffset;
      }
    }
  }

  /* ------------------------------------------------ Vòng lặp cập nhật */
  startLoop() {
    this.renderer.setAnimationLoop(() => this.update());
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (this.mixer) {
      // Khi đang kéo có thể tua animation bước chân nhanh hơn một chút tạo cảm giác hài hước
      const timeScale = this.state === 'DRAGGING' ? 1.4 : 1.0;
      this.mixer.update(dt * timeScale);
    }

    const padding = this.opts.scale * 0.6;
    const minX = padding;
    const maxX = window.innerWidth - padding;

    // --- State Machine ---
    if (this.state === 'WALKING') {
      // Di chuyển ngang
      this.pos.x += this.direction * this.opts.speed * dt;
      this.pos.y = this.opts.floorOffset;

      // Đổi chiều khi chạm mép màn hình
      if (this.pos.x >= maxX && this.direction > 0) {
        this.direction = -1;
      } else if (this.pos.x <= minX && this.direction < 0) {
        this.direction = 1;
      }

      // Hướng mặt theo chiều đi
      this.targetRotationY = (this.direction > 0 ? Math.PI / 2 : -Math.PI / 2) + this.opts.facingAngle;
    } else if (this.state === 'FALLING') {
      // Trọng lực rơi tự do
      this.velY -= this.opts.gravity * dt;
      this.pos.y += this.velY * dt;

      // Chạm đất
      if (this.pos.y <= this.opts.floorOffset) {
        this.pos.y = this.opts.floorOffset;

        // Nảy nhẹ nếu vận tốc rơi đủ lớn
        if (Math.abs(this.velY) > 250 && this.opts.bounce > 0.05) {
          this.velY = -this.velY * this.opts.bounce;
        } else {
          this.velY = 0;
          this.state = 'WALKING';
        }

        if (this.opts.onLand) this.opts.onLand();
      }
    }

    // Giữ nhân vật không ra khỏi 2 bên mép màn hình
    this.pos.x = Math.max(minX, Math.min(maxX, this.pos.x));

    // Cập nhật vị trí & góc quay Model
    if (this.modelRoot) {
      this.modelRoot.position.x = this.pos.x;
      this.modelRoot.position.y = this.pos.y;

      // Xoay mượt mà quanh trục Y
      let diff = this.targetRotationY - this.modelRoot.rotation.y;
      // Chuẩn hóa góc quay (-PI đến PI)
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.modelRoot.rotation.y += diff * Math.min(1, dt * 10);

      // Hiệu ứng nghiêng nhẹ khi rơi
      if (this.state === 'FALLING') {
        this.modelRoot.rotation.z = THREE.MathUtils.lerp(this.modelRoot.rotation.z, (this.velY / 1500) * 0.2, dt * 8);
      } else {
        this.modelRoot.rotation.z = THREE.MathUtils.lerp(this.modelRoot.rotation.z, 0, dt * 10);
      }
    }

    // Cập nhật đổ bóng tiếp xúc (Contact Shadow)
    if (this.shadowMesh) {
      this.shadowMesh.position.x = this.pos.x;
      this.shadowMesh.position.y = this.opts.floorOffset + 1;

      // Bóng thu nhỏ và mờ dần khi nhấc nhân vật lên cao
      const heightAboveFloor = Math.max(0, this.pos.y - this.opts.floorOffset);
      const shadowFactor = Math.max(0, 1 - heightAboveFloor / (this.opts.scale * 3));
      this.shadowMesh.scale.set(shadowFactor, shadowFactor, 1);
      this.shadowMesh.material.opacity = shadowFactor * 0.6;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Thay đổi file mô hình khác lúc đang chạy
   */
  async setModel(url) {
    if (this.modelRoot) {
      this.scene.remove(this.modelRoot);
      this.modelRoot = null;
      this.charMesh = null;
      this.mixer = null;
    }
    this.opts.modelUrl = url;
    await this.loadModel(url);
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', () => this.onResize());
    this.canvas.remove();
    this.renderer.dispose();
  }
}
