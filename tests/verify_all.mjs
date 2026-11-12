import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Starting Full Jr_AstroCamp Video Game Transformation Verification ===');
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    'about:blank',
  ]);

  let isKilled = false;
  const cleanup = () => {
    if (!isKilled) {
      isKilled = true;
      try { chromeProc.kill(); } catch {}
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  await sleep(2200);

  const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let msgId = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
        if (!text.includes('THREE.Clock')) {
          consoleErrors.push(text);
        }
      }
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  const capture = async (name, width = 1920, height = 1080) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await sleep(400);
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await writeFile(filePath, Buffer.from(snap.data, 'base64'));
    console.log(`✓ Saved screenshot: ${name}.png (${width}x${height})`);
  };

  const evalCode = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  };

  // 1. HOME SCREEN (1920x1080, 1366x768, 1280x720, 390x844)
  console.log('\n--- 1. Testing Home Screen Resolutions ---');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2500);

  const homeScrollable = await evalCode(`document.documentElement.scrollHeight > window.innerHeight + 5`);
  const homeTitle = await evalCode(`document.querySelector('h1')?.innerText`);
  const hasStartBtn = await evalCode(`!!document.querySelector('.game-hero-start-btn')`);
  const hasGhostJupiter = await evalCode(`Array.from(document.querySelectorAll('*')).some(el => el.textContent === 'JUPITER' && el.offsetParent !== null)`);

  console.log(`Home Title: "${homeTitle?.replace(/\n/g, ' ')}"`);
  console.log(`Big Start Mission Button Present: ${hasStartBtn}`);
  console.log(`Is Home Page scrolling? ${homeScrollable} (Should be false / 100vh lock)`);
  console.log(`Faint "JUPITER" ghost label present? ${hasGhostJupiter} (Should be false)`);

  await capture('01_game_home_1920x1080', 1920, 1080);
  await capture('02_game_home_1366x768', 1366, 768);
  await capture('03_game_home_1280x720', 1280, 720);
  await capture('04_game_home_390x844_mobile', 390, 844);

  // 2. HOW TO PLAY POPUP MODAL
  console.log('\n--- 2. Testing "How to Play" Popup ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('button'));
    const htp = btns.find(b => b.textContent.includes('How to Play'));
    if (htp) htp.click();
  `);
  await sleep(600);
  await capture('05_popup_how_to_play_steps');

  // Switch to 7 Resources tab
  await evalCode(`
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const resTab = tabBtns.find(b => b.textContent.includes('7 Life Support Bars'));
    if (resTab) resTab.click();
  `);
  await sleep(400);
  await capture('06_popup_how_to_play_resources');

  // Switch to Kid Vocab tab
  await evalCode(`
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const vocTab = tabBtns.find(b => b.textContent.includes('Vocabulary'));
    if (vocTab) vocTab.click();
  `);
  await sleep(400);
  await capture('07_popup_how_to_play_vocab');

  // Close How to Play modal by clicking X
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.innerHTML.includes('lucide-x') || b.textContent.includes('Close'));
    if (closeBtn) closeBtn.click();
  `);
  await sleep(500);

  // 3. CREDITS POPUP MODAL
  console.log('\n--- 3. Testing Credits Popup ---');
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('button'));
    const creditsBtn = btns.find(b => b.textContent.includes('Credits'));
    if (creditsBtn) creditsBtn.click();
  `);
  await sleep(600);
  await capture('08_popup_credits');

  // Close Credits
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent.includes('Close') || b.innerHTML.includes('lucide-x'));
    if (closeBtn) closeBtn.click();
  `);
  await sleep(500);

  // 4. WIZARD STEP 1 (Moon vs Mars)
  console.log('\n--- 4. Testing Start Mission Wizard Step 1 ---');
  await evalCode(`document.querySelector('.game-hero-start-btn')?.click()`);
  await sleep(600);
  await capture('09_wizard_step1_destination');

  const step1Text = await evalCode(`document.body.innerText`);
  console.log('Step 1 contains "STEP 1 OF 3"?', step1Text.includes('STEP 1 OF 3'));
  console.log('Step 1 contains Moon South Pole fact?', step1Text.includes('14 Earth days'));

  // 5. WIZARD STEP 2 (Difficulty)
  console.log('\n--- 5. Testing Wizard Step 2: Difficulty Selection ---');
  await evalCode(`document.getElementById('wizard-next-btn')?.click()`);
  await sleep(600);
  await capture('10_wizard_step2_difficulty');
  const step2Text = await evalCode(`document.body.innerText`);
  console.log('Step 2 contains "STEP 2 OF 3"?', step2Text.includes('STEP 2 OF 3'));

  // 6. WIZARD STEP 3 (Crew of 4 & Launch Cargo)
  console.log('\n--- 6. Testing Wizard Step 3: Crew & Cargo ---');
  await evalCode(`document.getElementById('wizard-next-btn')?.click()`);
  await sleep(600);
  await capture('11_wizard_step3_crew_cargo');
  const step3Text = await evalCode(`document.body.innerText`);
  console.log('Step 3 contains "STEP 3 OF 3"?', step3Text.includes('STEP 3 OF 3'));

  // 7. WIZARD STEP 4 (Animated Launching Screen)
  console.log('\n--- 7. Testing Wizard Step 4: Animated Launching Screen ---');
  await evalCode(`document.getElementById('wizard-next-btn')?.click()`);
  await sleep(600);
  await capture('12_wizard_step4_launching');

  // 8. GAME SCREEN (MissionControlPage)
  console.log('\n--- 8. Testing Game Screen (MissionControlPage) ---');
  await sleep(2600); // Wait for animated launch countdown & hash change

  const currentUrl = await evalCode(`window.location.hash`);
  const hasNavbar = await evalCode(`!!document.querySelector('.global-nav-bar')`);
  const hasHudHeader = await evalCode(`!!document.querySelector('header')`);
  const hudText = await evalCode(`document.querySelector('header')?.innerText`);
  const hasBuildPanel = await evalCode(`document.body.innerText.includes('Base Construction')`);
  const hasPowerSliders = await evalCode(`document.body.innerText.includes('Power Share Grid')`);
  const hasEndDayBtn = await evalCode(`!!document.getElementById('btn-end-day')`);

  console.log(`Current URL Hash: "${currentUrl}"`);
  console.log(`Standard website navbar completely hidden in-game: ${!hasNavbar} (Should be true)`);
  console.log(`Top in-game HUD bar present: ${hasHudHeader}`);
  console.log(`HUD Header text: "${hudText?.replace(/\n/g, ' ')}"`);
  console.log(`Left Base Construction Depot present: ${hasBuildPanel}`);
  console.log(`Right Power Share Sliders present: ${hasPowerSliders}`);
  console.log(`Bottom End Day button present: ${hasEndDayBtn}`);

  await capture('13_game_screen_1920x1080', 1920, 1080);
  await capture('14_game_screen_1366x768', 1366, 768);
  await capture('15_game_screen_1280x720', 1280, 720);
  await capture('16_game_screen_390x844_mobile', 390, 844);

  // 9. INTERACTION: BUILD MODULE & ADVANCE SOL
  console.log('\n--- 9. Testing Module Construction & Sol Advancement ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  
  // Click first "Build" button in module list
  const buildResult = await evalCode(`
    const buildBtn = document.querySelector('[id^="btn-build-module"]');
    if (buildBtn) {
      buildBtn.click();
      return true;
    }
    return false;
  `);
  console.log(`Clicked Build Module button: ${buildResult}`);
  await sleep(600);

  // Click End Day Button
  const endDayResult = await evalCode(`
    const endDayBtn = document.getElementById('btn-end-day');
    if (endDayBtn) {
      endDayBtn.click();
      return true;
    }
    return false;
  `);
  console.log(`Clicked End Day button: ${endDayResult}`);
  await sleep(800);
  await capture('17_game_screen_day_advanced', 1920, 1080);

  // 10. AFTER-ACTION REPORT (Mission Autopsy)
  console.log('\n--- 10. Testing Mission Autopsy / Report ---');
  await evalCode(`
    const reportBtn = document.getElementById('btn-open-report');
    if (reportBtn) reportBtn.click();
  `);
  await sleep(600);
  await capture('18_mission_autopsy_overview');

  // Test Decisions Tab
  await evalCode(`
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const decTab = tabBtns.find(b => b.textContent.includes('3 Biggest Decisions'));
    if (decTab) decTab.click();
  `);
  await sleep(400);
  await capture('19_mission_autopsy_decisions');

  // Test Graphs Tab
  await evalCode(`
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const graphTab = tabBtns.find(b => b.textContent.includes('Resource Graphs'));
    if (graphTab) graphTab.click();
  `);
  await sleep(400);
  await capture('20_mission_autopsy_graphs');

  // Test Real Science Tab
  await evalCode(`
    const tabBtns = Array.from(document.querySelectorAll('button'));
    const sciTab = tabBtns.find(b => b.textContent.includes('Real NASA Science'));
    if (sciTab) sciTab.click();
  `);
  await sleep(400);
  await capture('21_mission_autopsy_science');

  console.log('\n========================================');
  console.log(`TOTAL CONSOLE ERRORS: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((err) => console.error('Error:', err));
  } else {
    console.log('✓ ZERO CONSOLE ERRORS CONFIRMED ACROSS ALL SCREENS!');
  }
  console.log('========================================');

  cleanup();
  process.exit(consoleErrors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
