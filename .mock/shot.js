const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1780, height: 980 }, deviceScaleFactor: 2 });
await p.goto('file://' + process.cwd() + '/layouts.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
await p.screenshot({ path: process.argv[2], fullPage: true }); await b.close(); })();
