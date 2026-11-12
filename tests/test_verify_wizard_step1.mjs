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
  for (let i = 0; i < 20; i++) {
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
  const consoleErrors = [];
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const { type, args } = msg.params;
      const text = args.map(a => a.value || a.description || '').join(' ');
      if (type === 'error') {
        consoleErrors.push(text);
        console.error('[BROWSER ERROR]', text);
      }
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  // 1. Desktop 1280x720
  console.log('\n--- Checking 1280x720 ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  
  // Wait for page
  for (let i = 0; i < 30; i++) {
    const ready = await send('Runtime.evaluate', {
      expression: '!!document.querySelector("[data-testid=\\"start-mission-btn\\"]")',
      returnByValue: true
    });
    if (ready.result?.value) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 500));

  // Open wizard
  await send('Runtime.evaluate', {
    expression: 'document.querySelector("[data-testid=\\"start-mission-btn\\"]").click()'
  });
  await new Promise(r => setTimeout(r, 700));

  // Capture after screenshot 1280x720
  const snap1280 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step1_after_1280x720.png'), Buffer.from(snap1280.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: wizard_step1_after_1280x720.png');

  // Validate Step 1 Elements in 1280x720
  const evalStep1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('[data-testid="wizard-modal"]');
      const closeBtn = document.querySelector('[data-testid="wizard-close-btn"]');
      const backBtn = document.querySelector('#wizard-back-btn');
      const nextBtn = document.querySelector('#wizard-next-btn');
      const moonCard = document.querySelector('[data-testid="wizard-dest-moon"]');
      const marsCard = document.querySelector('[data-testid="wizard-dest-mars"]');

      const moonRect = moonCard?.getBoundingClientRect();
      const marsRect = marsCard?.getBoundingClientRect();

      const moonSvg = moonCard?.querySelector('svg');
      const marsSvg = marsCard?.querySelector('svg');

      return {
        hasModal: !!modal,
        hasCloseBtn: !!closeBtn,
        hasBackBtnInStep1: !!backBtn, // should be false (no Cancel/Back on Step 1)
        nextBtnText: nextBtn?.textContent?.trim(),
        moonHeight: moonRect?.height,
        marsHeight: marsRect?.height,
        isSameHeight: Math.abs((moonRect?.height || 0) - (marsRect?.height || 0)) <= 3,
        hasMoonSvg: !!moonSvg,
        hasMarsSvg: !!marsSvg,
        moonSelectedText: moonCard?.textContent?.includes('Selected'),
        marsUnselectedText: marsCard?.textContent?.includes('Tap to select'),
        marsFactText: marsCard?.textContent?.includes("43% of Earth's sunlight because it is farther from the Sun"),
        hasMoonSource: moonCard?.textContent?.includes('Source: NASA Lunar Reconnaissance Orbiter'),
        hasMarsSource: marsCard?.textContent?.includes('Source: NASA Perseverance Mars 2020'),
      };
    })()`,
    returnByValue: true
  });
  console.log('Step 1 Validation Result:', JSON.stringify(evalStep1.result?.value, null, 2));

  // Test Selection switch to Mars
  console.log('\n--- Testing Switch to Mars ---');
  await send('Runtime.evaluate', {
    expression: 'document.querySelector("[data-testid=\\"wizard-dest-mars\\"]").click()'
  });
  await new Promise(r => setTimeout(r, 400));

  const evalMarsSelected = await send('Runtime.evaluate', {
    expression: `(() => {
      const moonCard = document.querySelector('[data-testid="wizard-dest-moon"]');
      const marsCard = document.querySelector('[data-testid="wizard-dest-mars"]');
      return {
        moonNowUnselected: moonCard?.textContent?.includes('Tap to select'),
        marsNowSelected: marsCard?.textContent?.includes('Selected'),
      };
    })()`,
    returnByValue: true
  });
  console.log('Mars Selection Switch Result:', evalMarsSelected.result?.value);

  // 2. Mobile 390x844
  console.log('\n--- Checking Mobile 390x844 ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise(r => setTimeout(r, 500));

  const snap390 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step1_after_390x844.png'), Buffer.from(snap390.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: wizard_step1_after_390x844.png');

  console.log('\nConsole Errors Total:', consoleErrors.length);
  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
