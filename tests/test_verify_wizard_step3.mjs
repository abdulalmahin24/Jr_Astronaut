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

  console.log('\n--- Checking Step 3 (Moon Destination) at 1280x720 ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await new Promise(r => setTimeout(r, 2500));

  // Wait for start button to exist
  for (let i = 0; i < 20; i++) {
    const hasBtn = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `!!(document.querySelector('[data-testid="start-mission-btn"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START MISSION')))`
    });
    if (hasBtn.result.value) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Open wizard
  await send('Runtime.evaluate', {
    expression: `(() => {
      const startBtn = document.querySelector('[data-testid="start-mission-btn"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START MISSION'));
      if (startBtn) startBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  // Step 1 -> Step 2
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = document.querySelector('[data-testid="wizard-next-btn"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'));
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  // Step 2 -> Step 3
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = document.querySelector('[data-testid="wizard-next-btn"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'));
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Save 1280x720 After Screenshot
  const shot1280 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step3_after_1280x720.png'), Buffer.from(shot1280.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: wizard_step3_after_1280x720.png');

  // Validate Moon Step 3 Elements
  const moonEval = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const shieldCard = document.querySelector('[data-testid="cargo-shield"]');
      const batteryCard = document.querySelector('[data-testid="cargo-battery"]');
      const waterCard = document.querySelector('[data-testid="cargo-water"]');
      const foodCard = document.querySelector('[data-testid="cargo-food"]');
      const previewLine = document.querySelector('[data-testid="cargo-preview-line"]');
      const launchBtn = document.querySelector('[data-testid="wizard-next-btn"]');

      const commanderCard = document.querySelector('[data-testid="crew-card-commander"]');
      const engineerCard = document.querySelector('[data-testid="crew-card-engineer"]');
      const doctorCard = document.querySelector('[data-testid="crew-card-doctor"]');
      const farmerCard = document.querySelector('[data-testid="crew-card-farmer"]');

      const renameBtns = Array.from(document.querySelectorAll('[data-testid^="rename-crew-"]'));

      return {
        hasMoonShieldTitle: shieldCard ? shieldCard.textContent.includes('Moon Dust Shield') : false,
        hasShieldEffect: shieldCard ? shieldCard.textContent.includes('+15% Radiation Shield') : false,
        hasBattery: !!batteryCard,
        hasWater: !!waterCard,
        hasFood: !!foodCard,
        hasPreviewLine: !!previewLine,
        previewText: previewLine ? previewLine.textContent : '',
        launchBtnText: launchBtn ? launchBtn.textContent.trim() : '',
        hasRocketSvg: launchBtn ? !!launchBtn.querySelector('svg') : false,
        hasNoEmojiInLaunchBtn: launchBtn ? !launchBtn.textContent.includes('🚀') : false,
        crewCount: [commanderCard, engineerCard, doctorCard, farmerCard].filter(Boolean).length,
        renameButtonCount: renameBtns.length,
      };
    })()`
  });
  console.log('Moon Step 3 Validation:', JSON.stringify(moonEval.result.value, null, 2));

  // Test Cargo Selection & Dynamic Preview Update
  console.log('\n--- Testing Cargo Selection Preview Switch ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const shieldCard = document.querySelector('[data-testid="cargo-shield"]');
      if (shieldCard) shieldCard.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const shieldPreviewEval = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const previewLine = document.querySelector('[data-testid="cargo-preview-line"]');
      return {
        text: previewLine ? previewLine.textContent : '',
        containsRadiationShield: previewLine ? previewLine.textContent.includes('Radiation Shield') : false,
      };
    })()`
  });
  console.log('Shield Preview Result:', shieldPreviewEval.result.value);

  // Test Crew Renaming (Rename Commander to 'Neil A.')
  console.log('\n--- Testing Crew Rename ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const renameBtn = document.querySelector('[data-testid="rename-crew-commander"]');
      if (renameBtn) renameBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('[data-testid="input-rename-commander"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'Neil Armstrong');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const saveBtn = document.querySelector('[data-testid="save-rename-commander"]');
      if (saveBtn) saveBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const renameEval = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const commanderCard = document.querySelector('[data-testid="crew-card-commander"]');
      return {
        renamedSuccessfully: commanderCard ? commanderCard.textContent.includes('Neil Armstrong') : false,
        storedInLocalStorage: localStorage.getItem('jr_astrocamp_crew') ? localStorage.getItem('jr_astrocamp_crew').includes('Neil Armstrong') : false,
      };
    })()`
  });
  console.log('Rename Test Result:', renameEval.result.value);

  // Test Mars Destination Cargo Option
  console.log('\n--- Testing Mars Destination Cargo Option ---');
  // Back to Step 1
  await send('Runtime.evaluate', {
    expression: `(() => {
      const backBtn = document.getElementById('wizard-back-btn');
      if (backBtn) backBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `(() => {
      const backBtn = document.getElementById('wizard-back-btn');
      if (backBtn) backBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  // Select Mars in Step 1
  await send('Runtime.evaluate', {
    expression: `(() => {
      const marsCard = document.querySelector('[data-testid="wizard-dest-mars"]');
      if (marsCard) marsCard.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  // Forward to Step 3
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = document.getElementById('wizard-next-btn');
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = document.getElementById('wizard-next-btn');
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const marsEval = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const shieldCard = document.querySelector('[data-testid="cargo-shield"]');
      return {
        hasMarsShieldTitle: shieldCard ? shieldCard.textContent.includes('Mars Soil Shield') : false,
        hasShieldEffect: shieldCard ? shieldCard.textContent.includes('+15% Radiation Shield') : false,
      };
    })()`
  });
  console.log('Mars Step 3 Validation:', JSON.stringify(marsEval.result.value, null, 2));

  // Mobile 390x844
  console.log('\n--- Checking Mobile 390x844 ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 800));
  const shot390 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step3_after_390x844.png'), Buffer.from(shot390.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: wizard_step3_after_390x844.png');

  console.log(`\nConsole Errors Total: ${consoleErrors.length}`);
  chrome.kill();
  process.exit(consoleErrors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
