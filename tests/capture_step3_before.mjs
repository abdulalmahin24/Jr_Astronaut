import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    'about:blank'
  ]);

  let res, targets;
  for (let i = 0; i < 25; i++) {
    try {
      res = await fetch('http://127.0.0.1:9222/json');
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  // 1280x720 Desktop
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise(r => setTimeout(r, 2000));

  // Open wizard
  await send('Runtime.evaluate', {
    expression: `(() => {
      const startBtn = document.querySelector('[data-testid="start-mission-btn"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START MISSION'));
      if (startBtn) startBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Click Next Step (to Step 2)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next') || b.textContent.includes('Difficulty'));
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Click Next Step (to Step 3)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next') || b.textContent.includes('Cargo'));
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot1280 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step3_before_1280x720.png'), Buffer.from(shot1280.data, 'base64'));
  console.log('[BEFORE SCREENSHOT] Saved: wizard_step3_before_1280x720.png');

  // 390x844 Mobile
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 600));
  const shot390 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step3_before_390x844.png'), Buffer.from(shot390.data, 'base64'));
  console.log('[BEFORE SCREENSHOT] Saved: wizard_step3_before_390x844.png');

  chrome.kill();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

