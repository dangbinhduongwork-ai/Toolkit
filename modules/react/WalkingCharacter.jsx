import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * WalkingCharacter - React Component:
 * - Nhân vật 3D đi lại qua hai mép chân màn hình.
 * - Hỗ trợ kéo thả (drag & drop) với chuột / cảm ứng.
 * - Rơi tự do theo trọng lực (gravity) và nảy nhẹ khi thả chuột.
 * - Tự động né thanh điều hướng dưới đáy trên mobile (< 900px).
 * - Tách biệt canvas trong suốt (pointer-events: none), không chặn click vào website bên dưới.
 */
export function WalkingCharacter({
  modelUrl = '/models/chibi_bald_business_man_walk.glb',
  scale = 125,
  speed = 85,
  gravity = 1800,
  bounce = 0.35,
  mobileFloorOffset = 74,
  desktopFloorOffset = 16,
}) {
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Khởi tạo Three.js WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();

    // Orthographic Camera (tỷ lệ 1:1 theo pixel màn hình)
    const camera = new THREE.OrthographicCamera(
      0, window.innerWidth,
      window.innerHeight, 0,
      -2000, 2000
    );
    camera.position.set(0, 0, 500);

    // Ánh sáng
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(150, 350, 250);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-150, -100, -100);
    scene.add(fillLight);

    // Độ cao sàn chân màn hình
    const getFloorOffset = () => (window.innerWidth < 900 ? mobileFloorOffset : desktopFloorOffset);
    let floorOffset = getFloorOffset();

    // State nhân vật
    let state = 'WALKING'; // 'WALKING' | 'DRAGGING' | 'FALLING'
    let direction = 1;
    let targetRotationY = Math.PI / 2;
    const pos = {
      x: Math.min(window.innerWidth * 0.75, window.innerWidth - 100),
      y: floorOffset,
    };
    let velY = 0;
    let isPointerDown = false;
    const dragOffset = { x: 0, y: 0 };

    // Đổ bóng tiếp xúc (Contact shadow)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(scale * 0.75, scale * 0.25);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(pos.x, floorOffset + 1, -1);
    scene.add(shadowMesh);

    // Nạp mô hình 3D
    let modelRoot = null;
    let charMesh = null;
    let mixer = null;
    const clock = new THREE.Clock();

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const origHeight = size.y || 1;
        const s = scale / origHeight;
        model.scale.set(s, s, s);

        box.setFromObject(model);
        model.position.y = -box.min.y;

        modelRoot = new THREE.Group();
        modelRoot.position.set(pos.x, pos.y, 0);
        modelRoot.add(model);
        scene.add(modelRoot);
        charMesh = model;

        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);

          let clip = gltf.animations.find((a) => /walk|run|move|layer0/i.test(a.name));
          if (!clip) {
            clip = [...gltf.animations].sort((a, b) => a.duration - b.duration)[0];
          }

          const action = mixer.clipAction(clip);
          action.play();
        }

        setIsLoaded(true);
      },
      undefined,
      (err) => {
        console.error('[WalkingCharacter] Lỗi tải file .glb:', err);
      }
    );

    const screenToWorld = (clientX, clientY) => ({
      x: clientX,
      y: window.innerHeight - clientY,
    });

    const onPointerDown = (e) => {
      if (!charMesh) return;
      const world = screenToWorld(e.clientX, e.clientY);

      const hitRadius = Math.max(50, scale * 0.6);
      const charCenterY = pos.y + scale * 0.45;
      const dist = Math.hypot(world.x - pos.x, world.y - charCenterY);

      if (dist <= hitRadius) {
        state = 'DRAGGING';
        isPointerDown = true;
        velY = 0;
        dragOffset.x = pos.x - world.x;
        dragOffset.y = pos.y - world.y;
      }
    };

    const onPointerMove = (e) => {
      if (state !== 'DRAGGING' || !isPointerDown) return;
      const world = screenToWorld(e.clientX, e.clientY);

      pos.x = world.x + dragOffset.x;
      pos.y = Math.max(floorOffset, world.y + dragOffset.y);
    };

    const onPointerUp = () => {
      if (state === 'DRAGGING') {
        isPointerDown = false;
        if (pos.y > floorOffset + 5) {
          state = 'FALLING';
          velY = 0;
        } else {
          state = 'WALKING';
          pos.y = floorOffset;
        }
      }
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      floorOffset = getFloorOffset();

      camera.right = w;
      camera.top = h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      if (state === 'WALKING') {
        pos.y = floorOffset;
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('resize', onResize);

    let animId = null;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.1);

      if (mixer) {
        const timeScale = state === 'DRAGGING' ? 1.4 : 1.0;
        mixer.update(dt * timeScale);
      }

      const padding = scale * 0.6;
      const minX = padding;
      const maxX = window.innerWidth - padding;

      if (state === 'WALKING') {
        pos.x += direction * speed * dt;
        pos.y = floorOffset;

        if (pos.x >= maxX && direction > 0) {
          direction = -1;
        } else if (pos.x <= minX && direction < 0) {
          direction = 1;
        }

        targetRotationY = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else if (state === 'FALLING') {
        velY -= gravity * dt;
        pos.y += velY * dt;

        if (pos.y <= floorOffset) {
          pos.y = floorOffset;

          if (Math.abs(velY) > 250 && bounce > 0.05) {
            velY = -velY * bounce;
          } else {
            velY = 0;
            state = 'WALKING';
          }
        }
      }

      pos.x = Math.max(minX, Math.min(maxX, pos.x));

      if (modelRoot) {
        modelRoot.position.x = pos.x;
        modelRoot.position.y = pos.y;

        let diff = targetRotationY - modelRoot.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        modelRoot.rotation.y += diff * Math.min(1, dt * 10);

        if (state === 'FALLING') {
          modelRoot.rotation.z = THREE.MathUtils.lerp(modelRoot.rotation.z, (velY / 1500) * 0.2, dt * 8);
        } else {
          modelRoot.rotation.z = THREE.MathUtils.lerp(modelRoot.rotation.z, 0, dt * 10);
        }
      }

      if (shadowMesh) {
        shadowMesh.position.x = pos.x;
        shadowMesh.position.y = floorOffset + 1;

        const heightAboveFloor = Math.max(0, pos.y - floorOffset);
        const shadowFactor = Math.max(0, 1 - heightAboveFloor / (scale * 3));
        shadowMesh.scale.set(shadowFactor, shadowFactor, 1);
        shadowMesh.material.opacity = shadowFactor * 0.6;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);

      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, [modelUrl, scale, speed, gravity, bounce, mobileFloorOffset, desktopFloorOffset]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
      className="fixed inset-0 w-screen h-screen pointer-events-none z-[45] block select-none"
      aria-hidden="true"
    />
  );
}

export default WalkingCharacter;
