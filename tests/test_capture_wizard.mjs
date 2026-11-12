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
  await new Promise(r => setTimeout(r, 1800));

  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  // Set 1280x720
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise(r => setTimeout(r, 2200));

  // Open wizard
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-testid="start-mission-btn"]');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  // Capture before screenshot 1280x720
  const snap1280 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step1_before_1280x720.png'), Buffer.from(snap1280.data, 'base64'));
  console.log('[BEFORE SCREENSHOT] Saved: wizard_step1_before_1280x720.png');

  // Mobile 390x844
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise(r => setTimeout(r, 500));
  const snap390 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step1_before_390x844.png'), Buffer.from(snap390.data, 'base64'));
  console.log('[BEFORE SCREENSHOT] Saved: wizard_step1_before_390x844.png');

  chrome.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

