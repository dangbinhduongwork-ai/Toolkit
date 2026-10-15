# 📖 Sổ Tay Quy Trình Vibe Coding (Quick Start Guide)

Chào mừng bạn đến với **Vibe Coding Toolkit**! Tài liệu này cung cấp các **quy trình chuẩn (SOP)** để bạn đưa các hiệu ứng đồ họa, âm thanh, 3D vào bất kỳ website cá nhân nào một cách nhanh nhất (chỉ trong 1–2 phút).

---

## ⚡ Lệnh cài đặt tự động (Khuyên dùng nhất)

Bạn không cần tự copy file! Hãy mở Terminal và dùng công cụ [`installer.mjs`](file:///E:/25.Mykey/tools/installer.mjs):

```powershell
# 1. Cài đặt nhân vật 3D đi lại chân màn hình vào dự án của bạn:
node E:\25.Mykey\tools\installer.mjs character "C:\duong_dan\du_an_cua_ban"

# 2. Cài đặt hiệu ứng sóng nước tương tác khi chạm chuột:
node E:\25.Mykey\tools\installer.mjs ripple "C:\duong_dan\du_an_cua_ban"

# 3. Cài đặt hệ thống âm thanh Web Audio ASMR:
node E:\25.Mykey\tools\installer.mjs audio "C:\duong_dan\du_an_cua_ban"

# 4. Cài đặt 12 Kỹ năng AI Coding (dành cho Cursor / Claude / Antigravity):
node E:\25.Mykey\tools\installer.mjs skills "C:\duong_dan\du_an_cua_ban"

# 5. Cài đặt TẤT CẢ các tính năng trên cùng một lúc:
node E:\25.Mykey\tools\installer.mjs all "C:\duong_dan\du_an_cua_ban"
```

---

## 📋 5 Quy Trình Thực Hiện Thủ Công (Theo từng trường hợp)

---

### Quy trình 1: Thêm Nhân Vật 3D Đi Lại Dưới Đáy Màn Hình

#### Với dự án React / Next.js / Vite:
1. Đảm bảo đã cài Three.js: `npm install three`
2. Copy component [`WalkingCharacter.jsx`](file:///E:/25.Mykey/tools/modules/react/WalkingCharacter.jsx) vào thư mục `src/components/ui/` của bạn.
3. Copy file `.glb` vào thư mục `public/models/`.
4. Trong `App.jsx` (hoặc trang chính):
   ```jsx
   import { WalkingCharacter } from './components/ui/WalkingCharacter';

   export default function App() {
     return (
       <div>
         {/* Nội dung website của bạn */}
         
         <WalkingCharacter 
           modelUrl="/models/chibi_bald_business_man_walk.glb"
           scale={125}   // Chiều cao pixel
           speed={85}    // Tốc độ di chuyển
         />
       </div>
     );
   }
   ```

#### Với dự án HTML thuần:
Thêm vào trước thẻ `</body>`:
```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/"
  }
}
</script>
<script type="module">
  import { WalkingCharacter } from './js/walking-character.js';
  new WalkingCharacter({
    modelUrl: './models/chibi_bald_business_man_walk.glb',
    scale: 125,
    speed: 85
  });
</script>
```

---

### Quy trình 2: Thêm Hiệu Ứng Sóng Nước Vật Lý Khi Chạm Chuột

#### Với dự án React:
1. Copy [`useWaterRipple.js`](file:///E:/25.Mykey/tools/modules/react/useWaterRipple.js) và [`water-ripple.js`](file:///E:/25.Mykey/tools/modules/water-ripple.js) vào dự án.
2. Dùng hook trong component:
   ```jsx
   import { useRef } from 'react';
   import { useWaterRipple } from './hooks/useWaterRipple';

   export function WaterCanvas() {
     const canvasRef = useRef(null);
     useWaterRipple(canvasRef, { rippleRadius: 24 });

     return (
       <canvas 
         ref={canvasRef} 
         className="fixed inset-0 w-screen h-screen pointer-events-none z-10" 
       />
     );
   }
   ```

---

### Quy trình 3: Thêm Âm Thanh ASMR & Nhạc Nền Không Bị Chặn

#### Với dự án React:
1. Copy [`useAudio.js`](file:///E:/25.Mykey/tools/modules/react/useAudio.js) và [`audio-manager.js`](file:///E:/25.Mykey/tools/modules/audio-manager.js) vào dự án.
2. Khai báo âm thanh:
   ```jsx
   import { useAudio } from './hooks/useAudio';

   export function Button() {
     const { play, playMusic } = useAudio({
       click: '/audio/click.mp3',
       bg: '/audio/bg.mp3'
     });

     return (
       <button onClick={() => play('click', { pitchVariance: 0.1 })}>
         Bấm nút (Tự đổi cao độ)
       </button>
     );
   }
   ```

---

### Quy trình 4: Nén & Tối Ưu Mô Hình 3D Từ AI (Tripo / Meshy)

Nếu bạn gen mô hình từ AI hoặc tải trên mạng về nặng 30–60MB:
1. Mở Terminal tại `E:\25.Mykey\tools\3d-pipeline`.
2. Chạy lệnh:
   ```powershell
   node optimize-glb.mjs "C:\duong_dan\model_nang.glb" "C:\duong_dan\model_nhe.glb" --ratio 0.08
   ```
3. Mô hình sẽ được rút gọn tam giác, nén texture và lượng tử hóa tọa độ, giảm xuống dưới **1.5MB** để tải trên web ngay lập tức.

---

### Quy trình 5: Cung Cấp Siêu Năng Lực Cho AI IDE (Cursor / Claude / Antigravity)

Khi bạn mở một dự án mới trong IDE AI:
* Chạy lệnh:
  ```powershell
  node E:\25.Mykey\tools\installer.mjs skills "C:\duong_dan\du_an_moi"
  ```
* Lệnh này sẽ copy 12 file kỹ năng vào thư mục `.claude/skills` và `.gemini/skills`.
* Khi bạn ra lệnh: *"Hãy tạo shader nước"*, *"Hãy thêm ánh sáng Three.js"*, AI sẽ tự động đọc tài liệu chuẩn từ các kỹ năng này và tạo code chuẩn mực 100%!
