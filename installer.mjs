#!/usr/bin/env node
/**
 * installer.mjs - Script tự động tích hợp các tính năng Vibe Coding vào bất kỳ dự án nào!
 *
 * Cách sử dụng:
 *   node installer.mjs <tính_năng> <đường_dẫn_project>
 *
 * Ví dụ:
 *   node installer.mjs character C:\Users\Admin\my-project
 *   node installer.mjs audio C:\Users\Admin\my-project
 *   node installer.mjs ripple C:\Users\Admin\my-project
 *   node installer.mjs skills C:\Users\Admin\my-project
 *   node installer.mjs all C:\Users\Admin\my-project
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const feature = args[0]?.toLowerCase();
const targetDir = args[1] ? path.resolve(args[1]) : null;

function printUsage() {
  console.log(`
  \x1b[36m========================================================\x1b[0m
  \x1b[1m\x1b[35m🚀 VIBE CODING AUTOMATED INSTALLER\x1b[0m
  \x1b[36m========================================================\x1b[0m

  \x1b[33mCách sử dụng:\x1b[0m
    node installer.mjs <tính_năng> <thư_mục_project>

  \x1b[33mDanh sách tính năng:\x1b[0m
    \x1b[32mcharacter\x1b[0m : Nhân vật 3D đi bộ dưới chân màn hình + kéo thả + rơi tự do
    \x1b[32mripple\x1b[0m    : Hiệu ứng sóng nước tương tác khi chạm/click chuột
    \x1b[32maudio\x1b[0m     : Bộ quản lý âm thanh Web Audio API (chống chặn Autoplay iOS)
    \x1b[32mskills\x1b[0m    : 12 Kỹ năng AI Coding (dành cho Cursor, Claude Code, Antigravity)
    \x1b[32mall\x1b[0m       : Cài đặt toàn bộ bộ công cụ vào dự án

  \x1b[33mVí dụ:\x1b[0m
    node installer.mjs character E:\\MyWebProject
    node installer.mjs all E:\\25.Mykey\\Profile
  `);
}

if (!feature || !targetDir) {
  printUsage();
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  console.error(`\x1b[31m[Lỗi] Thư mục dự án không tồn tại: ${targetDir}\x1b[0m`);
  process.exit(1);
}

// Nhận diện loại dự án (React, Next.js, Vite, HTML)
const pkgPath = path.join(targetDir, 'package.json');
let isReact = false;
let isVite = false;
let isNext = false;

if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    isReact = !!allDeps['react'];
    isNext = !!allDeps['next'];
    isVite = !!allDeps['vite'];
  } catch (err) {}
}

const isModernWeb = isReact || isNext || isVite;
console.log(`\n\x1b[34m[Dự án]\x1b[0m ${targetDir} (${isReact ? 'React' : isNext ? 'Next.js' : isVite ? 'Vite' : 'Web thuần HTML/JS'})\n`);

function copyFileSafe(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log(`  \x1b[32m✓\x1b[0m Đã tạo: ${path.relative(targetDir, dst)}`);
}

function copyDirRecursive(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dst, item);
    if (fs.statSync(s).isDirectory()) {
      copyDirRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// 1. Cài đặt Nhân vật 3D (Character)
function installCharacter() {
  console.log(`\x1b[36m--- Cài đặt Nhân vật 3D Walking Character ---\x1b[0m`);

  // Copy model .glb vào thư mục public hoặc models
  const modelSrc = path.join(__dirname, 'models', 'chibi_bald_business_man_walk.glb');
  const publicDir = fs.existsSync(path.join(targetDir, 'public'))
    ? path.join(targetDir, 'public', 'models')
    : path.join(targetDir, 'models');

  copyFileSafe(modelSrc, path.join(publicDir, 'chibi_bald_business_man_walk.glb'));

  if (isReact) {
    // Copy React component
    const reactSrc = path.join(__dirname, 'modules', 'react', 'WalkingCharacter.jsx');
    const compDir = fs.existsSync(path.join(targetDir, 'src', 'components', 'ui'))
      ? path.join(targetDir, 'src', 'components', 'ui')
      : fs.existsSync(path.join(targetDir, 'src', 'components'))
      ? path.join(targetDir, 'src', 'components')
      : path.join(targetDir, 'src');

    copyFileSafe(reactSrc, path.join(compDir, 'WalkingCharacter.jsx'));

    console.log(`
  \x1b[33mHướng dẫn nhúng vào React / Next.js:\x1b[0m
  1. Đảm bảo đã cài \x1b[32mnpm install three\x1b[0m
  2. Mở file App.jsx (hoặc page.jsx) và thêm:
     \x1b[36mimport { WalkingCharacter } from './components/ui/WalkingCharacter';\x1b[0m
     Trong hàm render:
     \x1b[36m<WalkingCharacter modelUrl="/models/chibi_bald_business_man_walk.glb" scale={125} speed={85} />\x1b[0m
    `);
  } else {
    // Copy Vanilla JS module
    const jsSrc = path.join(__dirname, 'modules', 'walking-character.js');
    const jsDir = fs.existsSync(path.join(targetDir, 'js'))
      ? path.join(targetDir, 'js')
      : targetDir;

    copyFileSafe(jsSrc, path.join(jsDir, 'walking-character.js'));

    console.log(`
  \x1b[33mHướng dẫn nhúng vào HTML thuần:\x1b[0m
  Thêm đoạn code sau vào trước thẻ </body> trong index.html:
  \x1b[36m<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/"
    }
  }
  </script>
  <script type="module">
    import { WalkingCharacter } from './js/walking-character.js';
    new WalkingCharacter({ modelUrl: './models/chibi_bald_business_man_walk.glb' });
  </script>\x1b[0m
    `);
  }
}

// 2. Cài đặt Sóng nước (Ripple)
function installRipple() {
  console.log(`\x1b[36m--- Cài đặt Mô phỏng Sóng nước Vật lý (Water Ripple) ---\x1b[0m`);
  const rippleSrc = path.join(__dirname, 'modules', 'water-ripple.js');
  const targetJsDir = fs.existsSync(path.join(targetDir, 'src', 'utils'))
    ? path.join(targetDir, 'src', 'utils')
    : fs.existsSync(path.join(targetDir, 'js'))
    ? path.join(targetDir, 'js')
    : targetDir;

  copyFileSafe(rippleSrc, path.join(targetJsDir, 'water-ripple.js'));

  if (isReact) {
    const hookSrc = path.join(__dirname, 'modules', 'react', 'useWaterRipple.js');
    const hookDir = fs.existsSync(path.join(targetDir, 'src', 'hooks'))
      ? path.join(targetDir, 'src', 'hooks')
      : targetJsDir;
    copyFileSafe(hookSrc, path.join(hookDir, 'useWaterRipple.js'));
  }
}

// 3. Cài đặt Âm thanh (Audio)
function installAudio() {
  console.log(`\x1b[36m--- Cài đặt Bộ Âm thanh Web Audio ASMR ---\x1b[0m`);
  const audioSrc = path.join(__dirname, 'modules', 'audio-manager.js');
  const targetJsDir = fs.existsSync(path.join(targetDir, 'src', 'utils'))
    ? path.join(targetDir, 'src', 'utils')
    : fs.existsSync(path.join(targetDir, 'js'))
    ? path.join(targetDir, 'js')
    : targetDir;

  copyFileSafe(audioSrc, path.join(targetJsDir, 'audio-manager.js'));

  if (isReact) {
    const hookSrc = path.join(__dirname, 'modules', 'react', 'useAudio.js');
    const hookDir = fs.existsSync(path.join(targetDir, 'src', 'hooks'))
      ? path.join(targetDir, 'src', 'hooks')
      : targetJsDir;
    copyFileSafe(hookSrc, path.join(hookDir, 'useAudio.js'));
  }
}

// 4. Cài đặt Kỹ năng AI (Skills)
function installSkills() {
  console.log(`\x1b[36m--- Cài đặt 12 Kỹ năng AI Coding (Skills) ---\x1b[0m`);
  const skillsSrc = path.join(__dirname, 'skills');
  const claudeSkillsDst = path.join(targetDir, '.claude', 'skills');
  const geminiSkillsDst = path.join(targetDir, '.gemini', 'skills');

  copyDirRecursive(skillsSrc, claudeSkillsDst);
  copyDirRecursive(skillsSrc, geminiSkillsDst);

  console.log(`  \x1b[32m✓\x1b[0m Đã sao chép 12 Skills vào: .claude/skills/ và .gemini/skills/`);
  console.log(`  -> AI (Cursor / Claude Code / Antigravity) sẽ tự động kích hoạt kiến thức này khi bạn code!`);
}

// Điều phối thực thi
if (feature === 'character') {
  installCharacter();
} else if (feature === 'ripple') {
  installRipple();
} else if (feature === 'audio') {
  installAudio();
} else if (feature === 'skills') {
  installSkills();
} else if (feature === 'all') {
  installCharacter();
  installRipple();
  installAudio();
  installSkills();
} else {
  console.error(`\x1b[31m[Lỗi] Tính năng không hợp lệ: "${feature}"\x1b[0m`);
  printUsage();
}
