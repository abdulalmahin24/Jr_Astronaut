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

  // Direct navigation to mission page
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/#/mission' });
  await new Promise(r => setTimeout(r, 3000));

  // Check if we are on mission control page
  const pageCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        url: window.location.href,
        hasEndDay: !!document.getElementById('btn-end-day'),
        bodyText: document.body.innerText.slice(0, 300),
      };
    })()`,
    returnByValue: true
  });
  console.log('Page check:', pageCheck.result.value);

  // If redirected or not on mission, launch through wizard
  if (!pageCheck.result.value.hasEndDay) {
    console.log('Navigating via wizard...');
    await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
    await new Promise(r => setTimeout(r, 2000));
    await send('Runtime.evaluate', {
      expression: `(() => {
        const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START MISSION'));
        if (startBtn) startBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    // Step 2
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next') || b.textContent.includes('Difficulty'));
        if (nextBtn) nextBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    // Step 3
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next') || b.textContent.includes('Cargo'));
        if (nextBtn) nextBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    // Launch
    await send('Runtime.evaluate', {
      expression: `(() => {
        const launchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('LAUNCH') || b.textContent.includes('TOUCHDOWN'));
        if (launchBtn) launchBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));
  }

  // 1920x1080 screenshot
  const shot1920 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'gamescreen_before_1920x1080.png'), Buffer.from(shot1920.data, 'base64'));
  console.log('[BEFORE SCREENSHOT] Saved: gamescreen_before_1920x1080.png');

  // 1366x768 screenshot
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 600));
  const shot1366 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'gamescreen_before_1366x768.png'), Buffer.from(shot1366.data, 'base64'));
  console.log('[BEFORE SCREENSHOT] Saved: gamescreen_before_1366x768.png');

  // Tablet 820x1180
  await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 600));
  const shotTablet = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'gamescreen_before_tablet.png'), Buffer.from(shotTablet.data, 'base64'));
  console.log('[BEFORE SCREENSHOT] Saved: gamescreen_before_tablet.png');

  ws.close();
  chrome.kill();
  console.log('All before screenshots captured successfully.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

