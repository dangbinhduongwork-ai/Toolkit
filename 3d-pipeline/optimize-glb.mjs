#!/usr/bin/env node
/**
 * optimize-glb.mjs - Script CLI tối ưu hóa mô hình 3D (.glb) cho Web:
 * 1. Làm phẳng cấu trúc node thừa (flatten & clearNodeTransform).
 * 2. Rút gọn số lượng tam giác (mesh decimation via meshoptimizer).
 * 3. Nén texture sang JPEG/WebP độ phân giải phù hợp cho Web (Sharp).
 * 4. Lượng tử hóa tọa độ (quantize 14-bit position, 10-bit normal, 12-bit uv).
 * 5. Hàn các đỉnh trùng lặp (weld) và loại bỏ tam giác suy biến (prune, dedup).
 * 6. Nén luồng hình học Meshopt (giúp file tải nhẹ gấp 10-20 lần).
 *
 * Cách chạy:
 *   cd E:\25.Mykey\tools\3d-pipeline
 *   npm install
 *   node optimize-glb.mjs input.glb output.glb [--ratio 0.1] [--error 0.01]
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  weld,
  simplify,
  dedup,
  prune,
  quantize,
  meshopt,
  flatten,
  clearNodeTransform,
  textureCompress,
} from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? parseFloat(args[i + 1]) : def;
};

const [src, dst] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

if (!src || !dst) {
  console.log(`
  \x1b[36m=== 3D GLB Web Optimizer ===\x1b[0m
  Cách dùng:
    node optimize-glb.mjs <file_nguon.glb> <file_dich.glb> [tuy_chon]

  Tùy chọn:
    --ratio <so>   Tỉ lệ tam giác giữ lại (mặc định: 0.1 tức 10%)
    --error <so>   Sai số hình học tối đa cho phép (mặc định: 0.01)
    --tex <so>     Độ phân giải texture tối đa (mặc định: 1024)
  `);
  process.exit(1);
}

const RATIO = flag('--ratio', 0.1);
const ERROR = flag('--error', 0.01);
const TEX_SIZE = flag('--tex', 1024);

async function run() {
  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'meshopt.encoder': MeshoptEncoder,
      'meshopt.decoder': MeshoptDecoder,
    });

  console.log(`\x1b[34m[1/5] Đang đọc file:\x1b[0m ${src}`);
  const doc = await io.read(src);

  const getTris = (d) =>
    d.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((s, p) => s + (p.getIndices() ? p.getIndices().getCount() / 3 : 0), 0);

  const beforeTris = getTris(doc);
  const beforeSize = fs.statSync(src).size;
  console.log(`  -> Số tam giác ban đầu: ${beforeTris.toLocaleString()} | Kích thước: ${(beforeSize / 1024 / 1024).toFixed(2)} MB`);

  // Bước 1: Làm phẳng transform
  await doc.transform(flatten());
  for (const node of doc.getRoot().listNodes()) {
    if (node.getMesh()) clearNodeTransform(node);
  }

  // Bước 2: Rút gọn lưới
  console.log(`\x1b[34m[2/5] Đang rút gọn lưới (target ratio: ${(RATIO * 100).toFixed(0)}%)...\x1b[0m`);
  await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR }));

  // Bước 3: Nén texture
  console.log(`\x1b[34m[3/5] Đang tối ưu hóa texture (max ${TEX_SIZE}x${TEX_SIZE})...\x1b[0m`);
  try {
    await doc.transform(
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        resize: [TEX_SIZE, TEX_SIZE],
        quality: 85,
      })
    );
  } catch (err) {
    console.warn('  (Bỏ qua nén texture hoặc texture đã tối ưu)');
  }

  // Bước 4: Lượng tử hóa và dọn rác
  console.log(`\x1b[34m[4/5] Đang lượng tử hóa thuộc tính đỉnh (Quantization)...\x1b[0m`);
  await doc.transform(
    dedup(),
    prune(),
    quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }),
    weld(),
    prune()
  );

  // Bước 5: Nén Meshopt
  console.log(`\x1b[34m[5/5] Đang nén Meshopt...\x1b[0m`);
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));

  await io.write(dst, doc);

  const afterTris = getTris(doc);
  const afterSize = fs.statSync(dst).size;

  console.log(`
  \x1b[32m=== HOÀN TẤT TỐI ƯU HÓA ===\x1b[0m
  * File xuất: \x1b[36m${dst}\x1b[0m
  * Số tam giác: \x1b[33m${beforeTris.toLocaleString()}\x1b[0m -> \x1b[32m${afterTris.toLocaleString()}\x1b[0m (giảm ${(((beforeTris - afterTris) / beforeTris) * 100).toFixed(1)}%)
  * Dung lượng: \x1b[33m${(beforeSize / 1024 / 1024).toFixed(2)} MB\x1b[0m -> \x1b[32m${(afterSize / 1024 / 1024).toFixed(2)} MB\x1b[0m (giảm ${(((beforeSize - afterSize) / beforeSize) * 100).toFixed(1)}%)
  `);
}

run().catch((err) => {
  console.error('\x1b[31mLỗi khi tối ưu hóa:\x1b[0m', err);
  process.exit(1);
});
