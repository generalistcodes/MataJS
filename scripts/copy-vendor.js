const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'dist');
const dest = path.join(__dirname, '..', 'public', 'vendor');

if (!fs.existsSync(dist)) {
  console.error('Run: npm install onnxruntime-web@1.18.0');
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });

const files = [
  'ort.min.js',
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.jsep.mjs',
];

for (const f of files) {
  const src = path.join(dist, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dest, f));
    console.log('  copied', f);
  }
}

console.log('Vendor files ready in public/vendor/');
