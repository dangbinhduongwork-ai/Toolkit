# 🚀 Vibe Coding Toolkit & Skills for Creative Web Apps

Thư mục này được thiết kế để bạn có thể mang theo vào **bất kỳ dự án web nào khi Vibe Code** (cùng Cursor, Claude Code, Copilot, hoặc Antigravity), giúp AI hiểu ngay các kỹ thuật đồ họa, âm thanh, vật lý và UI cao cấp mà không cần giải thích lại từ đầu.

---

## 📂 Cấu trúc bộ công cụ (`E:\25.Mykey\tools`)

```
tools/
├── README.md                      # Tài liệu tổng quan & Prompt mẫu để Vibe Code
├── modules/                       # Các module JS/CSS độc lập, copy là chạy (Zero-dependency)
│   ├── audio-manager.js           # Quản lý âm thanh Web Audio, chống chặn Autoplay iOS/Android
│   ├── water-ripple.js            # Bộ mô phỏng sóng nước vật lý 2.5D vi phân rời rạc (Laplace 9 điểm)
│   ├── three-app.js               # Khung Three.js r186 chuẩn: responsive, adaptive resolution
│   ├── ui-shell.css               # Giao diện kính mờ (Glassmorphism), tương thích safe-area mobile
│   └── walking-character.js       # Module nhân vật 3D (.glb) đi lại chân màn hình + kéo thả + rơi tự do
├── demo-character.html            # Trang demo test trực tiếp file GLB và tinh chỉnh tốc độ/kích thước
├── 3d-pipeline/                   # Pipeline nén mô hình 3D (.glb) siêu nhẹ cho web
│   ├── package.json               # Thư viện gltf-transform, meshoptimizer, sharp
│   └── optimize-glb.mjs           # Script 1 lệnh nén mô hình từ 50MB -> 1.5MB
└── skills/                        # 12 Skill chuẩn cho AI Coding Assistant (Antigravity/Claude)
    ├── interactive-water-physics/ # Hướng dẫn AI dựng sóng nước & shader tụ quang (caustics)
    ├── web-audio-asmr/            # Hướng dẫn AI làm âm thanh vi tương tác không độ trễ
    ├── threejs-fundamentals/      # Thiết lập Scene, Camera, Renderer chuẩn Three.js r186
    ├── threejs-shaders/           # Shader GLSL tùy biến: Vertex, Fragment, Noise, Caustics
    ├── threejs-animation/         # Vòng lặp Three.Timer, procedural animation, tweening
    ├── threejs-interaction/       # Raycasting, pointer events, kéo thả vật thể 3D
    ├── threejs-loaders/           # Nạp GLB, Meshopt, KHR_mesh_quantization
    ├── threejs-materials/         # PBR Material, Standard, Physical, Custom Shaders
    ├── threejs-lighting/          # Ánh sáng mặt trời, môi trường, shadow optimization
    ├── threejs-textures/          # CanvasTexture, DataTexture, Texture wrapping
    ├── threejs-geometry/          # BufferGeometry, vertex attributes, tính toán pháp tuyến
    └── threejs-postprocessing/    # Bloom, Depth of Field, hiệu ứng hậu kỳ
```

---

## 🎯 Cách sử dụng khi Vibe Code cùng AI

Khi bạn bắt đầu một dự án web mới (Landing Page, Portfolio, Web Game, hoặc Web App), hãy đưa các hướng dẫn sau vào Prompt của bạn:

### 1. Prompt tạo hiệu ứng sóng nước tương tác khi chạm chuột/ngón tay
> *"Hãy áp dụng module `water-ripple.js` trong thư viện `E:\25.Mykey\tools\modules\water-ripple.js` vào dự án này. Khi người dùng click chuột hoặc chạm ngón tay trên màn hình, hãy tạo một vòng sóng nước lan tỏa tự nhiên, đồng thời dập tắt sóng khi chạm mép viền để không bị phản xạ dội lại."*

### 2. Prompt tạo hệ thống âm thanh ASMR / Micro-interactions
> *"Hãy tích hợp `audio-manager.js` từ `E:\25.Mykey\tools\modules\audio-manager.js`. Đảm bảo gọi hàm `audio.unlock()` ngay ở cử chỉ chạm đầu tiên để mở khóa âm thanh trên iOS Safari. Mỗi khi bấm nút hoặc tương tác, phát âm thanh click với độ lệch cao độ ngẫu nhiên ±8% để tạo cảm giác xúc giác chân thực."*

### 3. Prompt thiết lập nền 3D WebGL không làm giật lag máy yếu
> *"Hãy dùng bộ khung `three-app.js` trong `E:\25.Mykey\tools\modules\three-app.js`. Cấu hình canvas phủ kín màn hình dưới dạng Background (`pointer-events: none` cho DOM container). Bật tính năng Adaptive DPR để tự động giảm độ phân giải nếu thiết bị của người dùng tụt dưới 30 FPS."*

### 4. Prompt thiết kế giao diện kính mờ (Glassmorphism Overlay)
> *"Nhúng file `ui-shell.css` từ `E:\25.Mykey\tools\modules\ui-shell.css`. Tạo thanh công cụ nổi góc trên bên phải chứa các nút chức năng (Mute, Fullscreen, Zen Mode). Áp dụng `100lvh` và `env(safe-area-inset-*)` để không bị thanh địa chỉ Safari che khuất trên iPhone."*

---

## 🛠️ Hướng dẫn sử dụng các Module độc lập

### 1. `audio-manager.js` (Web Audio API)
Chỉ cần import và gọi, không cần cài đặt thêm thư viện ngoài:

```javascript
import { AudioManager } from './modules/audio-manager.js';

const audio = new AudioManager();

// Tải trước file âm thanh
await audio.load('pop', 'audio/pop.mp3');
await audio.load('bg', 'audio/bg.mp3');

// Bắt buộc gọi unlock ở tương tác đầu tiên của người dùng
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });

// Phát hiệu ứng bấm nút (tự ngẫu nhiên cao độ, không chói tai khi bấm nhanh)
document.getElementById('my-btn').addEventListener('click', () => {
  audio.play('pop', { volume: 0.8, pitchVariance: 0.1 });
});

// Bật nhạc nền lặp vô tận, fade-in mượt mà trong 2 giây
audio.playMusic('bg', { fadeInSeconds: 2.0, volume: 0.4 });
```

---

### 2. `water-ripple.js` (Mô phỏng sóng nước)
Tích hợp trực tiếp với Canvas 2D hoặc Three.js:

```javascript
import { WaterRippleSim } from './modules/water-ripple.js';

const sim = new WaterRippleSim(window.innerWidth, window.innerHeight, 6);

// Khi người dùng click chuột
window.addEventListener('pointerdown', (e) => {
  sim.disturb(e.clientX, e.clientY, 24, -8);
});

// Trong vòng lặp render
function animate() {
  requestAnimationFrame(animate);
  sim.step(); // Cập nhật bước sóng vật lý
  
  // Lấy dữ liệu chiều cao tại điểm bất kỳ để làm biến dạng ảnh
  const { height, gradX, gradY } = sim.sample(mouseX, mouseY);
}
animate();
```

---

### 3. `three-app.js` (Bộ khung Three.js r186)
Khởi tạo cảnh 3D chỉ với vài dòng code:

```javascript
import { ThreeApp } from './modules/three-app.js';
import * as THREE from 'three';

const canvas = document.getElementById('webgl-canvas');
const app = new ThreeApp(canvas, { antialias: true, adaptiveDpr: true });

// Thêm vật thể
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
);
app.scene.add(box);

const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(2, 4, 3);
app.scene.add(light, new THREE.AmbientLight(0xffffff, 0.4));

app.camera.position.z = 4;

// Bắt đầu vòng lặp với dt và elapsed time
app.start((dt, elapsed) => {
  box.rotation.x += dt * 0.5;
  box.rotation.y += dt * 0.8;
});
```

---

### 4. `3d-pipeline` (Tối ưu hóa mô hình 3D từ AI / Blender)
Khi bạn tạo mô hình 3D từ các công cụ AI như **Tripo**, **Meshy** hoặc tải từ **Sketchfab**, dung lượng thường rất nặng (30MB – 100MB) và hàng triệu tam giác.

Cách nén siêu tốc:
```powershell
cd E:\25.Mykey\tools\3d-pipeline
npm install
node optimize-glb.mjs "C:\duong\dan\file_nang.glb" "models/output_nhe.glb" --ratio 0.05
```
* Kết quả: Giảm từ **50MB xuống dưới 1.5MB**, sẵn sàng nhúng thẳng vào web tải ngay tức thì!

---

### 5. `walking-character.js` (Nhân vật 3D đi lại chân màn hình + kéo thả + rơi tự do)
Nhúng nhân vật 3D vào bất kỳ website nào với animation bước đi (`walk`), hỗ trợ kéo thả chuột và rơi tự do theo trọng lực:

```javascript
import { WalkingCharacter } from './modules/walking-character.js';

const char = new WalkingCharacter({
  modelUrl: './models/my-character.glb', // File .glb của bạn
  scale: 120,      // Chiều cao hiển thị trên màn hình (px)
  speed: 90,       // Tốc độ bước đi (px/giây)
  floorOffset: 20, // Cách mép đáy màn hình (px)
  gravity: 1800,   // Trọng lực rơi
  bounce: 0.35,    // Độ nảy khi chạm đất
  onLand: () => console.log('Chạm đất!'),
  onGrab: () => console.log('Bị nhấc lên!')
});
```
> 💡 Bạn có thể mở file [`demo-character.html`](file:///E:/25.Mykey/tools/demo-character.html) để thử kéo thả trực tiếp file `.glb` của bạn và kéo các thanh trượt chỉnh tốc độ, độ nảy theo ý muốn!

---

## 💡 Mẹo Vibe Code với Antigravity / Claude Code
Nếu bạn mở dự án mới trong IDE (như Antigravity hoặc Claude Code):
- Chỉ cần copy thư mục `skills/` trong đây vào thư mục `.claude/skills` hoặc `.gemini/skills` của dự án mới.
- AI sẽ tự động đọc toàn bộ các nguyên lý kiến trúc, cú pháp shader, cách setup Three.js và kỹ thuật audio để hỗ trợ bạn lập trình với chất lượng cao nhất!

