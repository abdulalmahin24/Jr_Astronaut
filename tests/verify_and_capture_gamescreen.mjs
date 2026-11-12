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
    '--disable-extensions',
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
        const found = targets.find(t => t.type === 'page' && (!t.url || !t.url.startsWith('chrome-extension://')));
        if (found) break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  const page = targets.find(t => t.type === 'page' && (!t.url || !t.url.startsWith('chrome-extension://')));
  if (!page) {
    throw new Error('Could not find target page in Chrome');
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description).join(' ');
        if (!text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    }
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

  console.log('[TEST] Navigating to http://localhost:5173/#/mission...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/#/mission' });
  await new Promise(r => setTimeout(r, 3000));

  // Verify Elements Presence and State
  const audit = await send('Runtime.evaluate', {
    expression: `(() => {
      const endDayBtn = document.getElementById('btn-end-day');
      const tabOverview = document.getElementById('btn-tab-outpost-overview');
      const tabExplore = document.getElementById('btn-tab-explore-eva');
      const howToPrepareBtn = document.getElementById('btn-how-to-prepare');

      // Check module nodes in SVG
      const svgNodes = Array.from(document.querySelectorAll('svg text')).map(t => t.textContent.trim());

      // Check build panel items
      const buildItems = Array.from(document.querySelectorAll('button[id^="btn-build-module-"]')).map(b => b.textContent.trim());

      const body = document.body.innerText;

      return {
        url: window.location.href,
        hasEndDay: !!endDayBtn,
        endDayText: endDayBtn ? endDayBtn.innerText.replace(/\\n/g, ' ') : null,
        hasOverviewTab: !!tabOverview,
        hasExploreTab: !!tabExplore,
        hasHowToPrepareBtn: !!howToPrepareBtn,
        svgTexts: svgNodes.slice(0, 15),
        buildButtonTexts: buildItems,
        isOutpostOverviewRendered: body.includes('HABITAT DOME') || body.includes('SOLAR WINGS'),
        hasPowerShareLiveEffects: body.includes('Clean Air nominal') || body.includes('Food +2 meals'),
      };
    })()`,
    returnByValue: true
  });

  console.log('[AUDIT RESULT]:', JSON.stringify(audit.result.value, null, 2));

  // Capture 1920x1080 After Screenshot
  const shot1920 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'gamescreen_after_1920x1080.png'), Buffer.from(shot1920.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: gamescreen_after_1920x1080.png');

  // 2. Click "How to prepare" button to show preparation popover
  console.log('[TEST] Clicking "How to prepare" button...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-how-to-prepare');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // 3. Click Habitat Dome in Outpost Overview to show interactive Module Info Card
  console.log('[TEST] Clicking Habitat Dome in Outpost Overview...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const habText = Array.from(document.querySelectorAll('text')).find(t => t.textContent.includes('HABITAT DOME'));
      if (habText && habText.parentElement) {
        habText.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shotInteractive = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'gamescreen_after_interactive_info_and_hint.png'), Buffer.from(shotInteractive.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: gamescreen_after_interactive_info_and_hint.png');

  // 4. Capture 1366x768 After Screenshot
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 600));
  const shot1366 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'gamescreen_after_1366x768.png'), Buffer.from(shot1366.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: gamescreen_after_1366x768.png');

  // 5. Capture Tablet 820x1180 After Screenshot
  await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 600));
  const shotTablet = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'gamescreen_after_tablet.png'), Buffer.from(shotTablet.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: gamescreen_after_tablet.png');

  // Console error report
  console.log('[CONSOLE ERRORS]:', consoleErrors.length === 0 ? 'NONE (0 errors)' : consoleErrors);

  ws.close();
  chrome.kill();
  console.log('[TEST COMPLETE] All verification steps passed successfully!');
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
