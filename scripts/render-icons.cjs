// One-off: render public/icon.svg to PNG app icons. Run: node scripts/render-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const svg = fs.readFileSync('public/icon.svg', 'utf8');
  const b = await chromium.launch();
  for (const size of [192, 512, 180]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    const name = size === 180 ? 'apple-touch-icon.png' : `pwa-${size}.png`;
    await p.screenshot({ path: `public/${name}` });
  }
  await b.close();
})();
