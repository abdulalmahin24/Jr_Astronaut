import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');

async function test() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    'about:blank'
  ]);

  let wsUrl;
  chrome.stderr.on('data', d => {
    const text = d.toString();
    const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) wsUrl = match[1];
  });

  for (let i = 0; i < 20; i++) {
    if (wsUrl) break;
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('WS URL:', wsUrl);

  const ws = new WebSocket(wsUrl);
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

  // Create new page target
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  const sendSession = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, sessionId, method, params }));
  });

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');
  await sendSession('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await sendSession('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise(r => setTimeout(r, 2000));

  // Open wizard
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-testid="start-mission-btn"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START MISSION'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  // Advance to Step 2
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next Step') || b.textContent.includes('Choose Difficulty'));
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step2_before_1280x720.png'), Buffer.from(shot.data, 'base64'));
  console.log('Successfully saved wizard_step2_before_1280x720.png');

  // Mobile 390x844
  await sendSession('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 800));
  const shotMobile = await sendSession('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step2_before_390x844.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log('Successfully saved wizard_step2_before_390x844.png');

  chrome.kill();
  process.exit(0);
}

test().catch(e => { console.error('Error in test:', e); process.exit(1); });
