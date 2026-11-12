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

  console.log('\n--- Checking Step 2 at 1280x720 ---');
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
  await new Promise(r => setTimeout(r, 800));

  // Advance to Step 2
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next') || b.textContent.includes('Difficulty'));
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  // Capture after screenshot 1280x720
  const shot1280 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step2_after_1280x720.png'), Buffer.from(shot1280.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: wizard_step2_after_1280x720.png');

  // Verify elements in Step 2
  const evalResult = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const cadetCard = document.querySelector('[data-testid="wizard-diff-cadet"]');
      const officerCard = document.querySelector('[data-testid="wizard-diff-officer"]');
      const commanderCard = document.querySelector('[data-testid="wizard-diff-commander"]');

      const cadetText = cadetCard ? cadetCard.textContent : '';
      const officerText = officerCard ? officerCard.textContent : '';
      const commanderText = commanderCard ? commanderCard.textContent : '';

      return {
        hasCadet: !!cadetCard,
        hasOfficer: !!officerCard,
        hasCommander: !!commanderCard,
        cadetHasBadge: cadetText.includes('Best for first time'),
        cadetDescMatches: cadetText.includes('Your crew uses less air, water and food. Space storms are rare. Great for beginners!'),
        cadetHazardsChip: cadetText.includes('Hazards:') && cadetText.includes('Few'),
        cadetSuppliesChip: cadetText.includes('Supplies:') && cadetText.includes('+15%'),
        cadetBpChip: cadetText.includes('Build Points:') && cadetText.includes('6 BP/day'),
        cadetSelected: cadetText.includes('Selected'),

        officerDescMatches: officerText.includes('Real NASA-style balance. A fair challenge.'),
        officerHazardsChip: officerText.includes('Hazards:') && officerText.includes('Normal'),
        officerSuppliesChip: officerText.includes('Supplies:') && officerText.includes('Normal'),
        officerBpChip: officerText.includes('Build Points:') && officerText.includes('4 BP/day'),
        officerUnselected: officerText.includes('Tap to select'),

        commanderDescMatches: commanderText.includes('Storms hit often and supplies are tight. Only for experts!'),
        commanderHazardsChip: commanderText.includes('Hazards:') && commanderText.includes('Many'),
        commanderSuppliesChip: commanderText.includes('Supplies:') && commanderText.includes('Tight'),
        commanderBpChip: commanderText.includes('Build Points:') && commanderText.includes('3 BP/day'),
        commanderUnselected: commanderText.includes('Tap to select'),

        cadetTabIndex: cadetCard ? cadetCard.getAttribute('tabindex') : null,
        officerTabIndex: officerCard ? officerCard.getAttribute('tabindex') : null,
        commanderTabIndex: commanderCard ? commanderCard.getAttribute('tabindex') : null,
      };
    })()`
  });
  console.log('Step 2 Validation Result:', JSON.stringify(evalResult.result.value, null, 2));

  // Test switching selection to Officer
  console.log('\n--- Testing Switch to Officer ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const officerCard = document.querySelector('[data-testid="wizard-diff-officer"]');
      if (officerCard) officerCard.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  const switchOfficer = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const officerCard = document.querySelector('[data-testid="wizard-diff-officer"]');
      const cadetCard = document.querySelector('[data-testid="wizard-diff-cadet"]');
      return {
        officerNowSelected: officerCard ? officerCard.textContent.includes('Selected') : false,
        cadetNowUnselected: cadetCard ? cadetCard.textContent.includes('Tap to select') : false,
      };
    })()`
  });
  console.log('Officer Switch Result:', switchOfficer.result.value);

  // Switch back to Cadet with Keyboard (Enter key)
  console.log('\n--- Testing Keyboard Interaction (Enter key on Cadet) ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cadetCard = document.querySelector('[data-testid="wizard-diff-cadet"]');
      if (cadetCard) {
        cadetCard.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  const keyboardSwitch = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const cadetCard = document.querySelector('[data-testid="wizard-diff-cadet"]');
      return {
        cadetSelectedViaKeyboard: cadetCard ? cadetCard.textContent.includes('Selected') : false,
      };
    })()`
  });
  console.log('Keyboard Switch Result:', keyboardSwitch.result.value);

  // Mobile 390x844
  console.log('\n--- Checking Mobile 390x844 ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 800));
  const shot390 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SCREENSHOT_DIR, 'wizard_step2_after_390x844.png'), Buffer.from(shot390.data, 'base64'));
  console.log('[AFTER SCREENSHOT] Saved: wizard_step2_after_390x844.png');

  console.log(`\nConsole Errors Total: ${consoleErrors.length}`);
  chrome.kill();
  process.exit(consoleErrors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
