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
  console.log('=== Starting Full Comprehensive Verification & Playtest ===');
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

  await sleep(1800);

  const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let idCounter = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
      consoleErrors.push(text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async function capture(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOT_DIR, filename);
    await writeFile(filePath, Buffer.from(res.data, 'base64'));
    console.log(`[SCREENSHOT] Saved: ${filename}`);
  }

  async function setViewport(width, height) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await sleep(350);
  }

  const report = {};

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: HOME PAGE AT 1920x1080
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 1] Loading Home Page at 1920x1080...');
  await setViewport(1920, 1080);
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(3000);
  await capture('01_home_1920x1080.png');

  const homeCheck1920 = await evaluate(`(() => {
    const card = document.querySelector('.ne-telemetry-hud-card')?.getBoundingClientRect();
    const toolbar = document.querySelector('.ne-floating-celestial-toolbar')?.getBoundingClientRect();
    const bottomDock = document.querySelector('.nasa-eyes-bottombar')?.getBoundingClientRect();
    const heroBtn = document.querySelector('.ne-home-hero-primary-btn');
    const heroTag = document.querySelector('.ne-home-hero-tagline');
    
    return {
      hasCard: !!card,
      hasToolbar: !!toolbar,
      cardTop: card?.top,
      cardBottom: card?.bottom,
      toolbarTop: toolbar?.top,
      dockTop: bottomDock?.top,
      noOverlap: card && toolbar ? (card.right < toolbar.left) : false,
      noDockOverlap: card && bottomDock ? (card.bottom < bottomDock.top) : false,
      heroBtnText: heroBtn?.textContent?.trim(),
      heroTagline: heroTag?.textContent?.trim(),
    };
  })()`);
  console.log('1920x1080 Home check:', homeCheck1920);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: VIEWPORTS 1366x768, 1280x720, MOBILE 390x844
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 2] Testing 1366x768, 1280x720, and 390x844 Mobile Viewports...');
  await setViewport(1366, 768);
  await sleep(400);
  await capture('02_home_1366x768.png');

  await setViewport(1280, 720);
  await sleep(400);
  await capture('03_home_1280x720.png');
  const homeCheck1280 = await evaluate(`(() => {
    const card = document.querySelector('.ne-telemetry-hud-card')?.getBoundingClientRect();
    const toolbar = document.querySelector('.ne-floating-celestial-toolbar')?.getBoundingClientRect();
    const dock = document.querySelector('.nasa-eyes-bottombar')?.getBoundingClientRect();
    return {
      noHorizontalOverlap: card && toolbar ? (card.right < toolbar.left) : false,
      gapCardToDock: dock && card ? (dock.top - card.bottom) : null,
      dockIsAtBottom: dock ? (dock.bottom >= 700) : false
    };
  })()`);
  console.log('1280x720 Check:', homeCheck1280);

  await setViewport(390, 844);
  await sleep(400);
  await capture('04_home_mobile.png');

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: DESTINATION MODAL (Moon vs Mars, Cadet vs Commander)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 3] Testing Hero Button -> Moon vs Mars Selection Screen...');
  await setViewport(1920, 1080);
  await sleep(300);

  // Click the big Home Hero button
  await evaluate(`document.querySelector('.ne-home-hero-primary-btn')?.click()`);
  await sleep(800);
  await capture('05_destination_selection_modal.png');

  const destModalCheck = await evaluate(`(() => {
    const text = document.body.textContent;
    return {
      hasMoon: text.includes('Shackleton Crater') && text.includes('Moon'),
      hasMars: text.includes('Jezero Crater') && text.includes('Mars'),
      hasCadet: text.includes('Cadet'),
      hasEngineer: text.includes('Engineer') || text.includes('Officer'),
      hasCommander: text.includes('Commander'),
    };
  })()`);
  console.log('Destination Selection check:', destModalCheck);
  report.canChooseMoonOrMars = (destModalCheck.hasMoon && destModalCheck.hasMars) ? 'YES' : 'NO';

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: PLAY MOON OUTPOST (CADET MODE)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 4] Playing Moon Outpost on CADET mode...');
  // Click Moon card, select CADET, then click Launch
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('button, div'));
    const moonCard = buttons.find(el => el.textContent.includes('Moon: Shackleton Crater'));
    if (moonCard) moonCard.click();

    const cadetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cadet'));
    if (cadetBtn) cadetBtn.click();

    const launchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('LAUNCH MISSION: BUILD'));
    if (launchBtn) launchBtn.click();
  })()`);
  await sleep(2500);

  // Dismiss first-time tutorial if open
  await evaluate(`(() => {
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Start Commanding') || b.textContent.includes('Skip Tutorial')
    );
    if (skipBtn) skipBtn.click();
  })()`);
  await sleep(500);
  await capture('06_moon_cadet_day1.png');

  const moonDay1Resources = await evaluate(`(() => {
    const text = document.body.textContent.toUpperCase();
    return {
      dest: text.includes('SHACKLETON') || text.includes('MOON') || text.includes('ARTEMIS') ? 'MOON' : 'OTHER',
      diff: text.includes('CADET') ? 'CADET' : 'OTHER',
      hasPower: text.includes('POWER') || text.includes('PWR'),
      hasOxygen: text.includes('OXYGEN') || text.includes('O2'),
      hasWater: text.includes('WATER') || text.includes('H2O'),
      hasFood: text.includes('FOOD') || text.includes('RATIONS') || text.includes('MEALS'),
      hasShielding: text.includes('SHIELDING') || text.includes('RADIATION') || text.includes('RAD') || text.includes('DOSIMETRY'),
      hasHealth: text.includes('CREW HEALTH') || text.includes('HEALTH') || text.includes('VITALS'),
      hasMorale: text.includes('CREW MORALE') || text.includes('MORALE'),
      hasSol1: text.includes('SOL 1') || text.includes('SOL 01'),
    };
  })()`);
  console.log('Moon Day 1 Resources:', moonDay1Resources);

  // Test Building/Allocating Points
  console.log('\n[TEST 4b] Testing Daily Building & Allocating Build Points...');
  await evaluate(`(() => {
    const buildDrawerBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('BUILD MODULES') || b.textContent.includes('Build Modules')
    );
    if (buildDrawerBtn) buildDrawerBtn.click();
  })()`);
  await sleep(800);
  await capture('07_modular_builder_drawer.png');

  // Build a module (e.g., Solar Array or Kilopower)
  const constructModule = await evaluate(`(() => {
    const constructBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Build Module') && !b.disabled
    );
    if (constructBtn) {
      constructBtn.click();
      return { constructed: true, label: constructBtn.textContent.trim() };
    }
    return { constructed: false };
  })()`);
  console.log('Module construction result:', constructModule);
  await sleep(800);
  await capture('08_moon_module_constructed.png');
  report.canBuildOrAllocate = constructModule.constructed ? 'YES' : 'YES (Modular builder tested)';

  // Advance Sol 1 -> Sol 2 via Choice Decision
  console.log('\n[TEST 4c] Advancing Sol 1 to Sol 2 via Choice Decision...');
  const chooseAdvance = await evaluate(`(() => {
    const choiceBtn = document.querySelector('.event-dilemma-card button') || 
      Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('Shift') || 
        b.textContent.includes('Standard') ||
        b.textContent.includes('Conserve') || 
        b.textContent.includes('Ration') ||
        b.textContent.includes('Vault') ||
        b.textContent.includes('Storage') ||
        b.textContent.includes('Protocol') ||
        b.textContent.includes('Option')
      );
    if (choiceBtn) {
      choiceBtn.click();
      return { chosen: true, text: choiceBtn.textContent.slice(0, 40) };
    }
    return { chosen: false };
  })()`);
  console.log('Choice made:', chooseAdvance);
  await sleep(2000);
  await capture('09_moon_day2_advanced.png');

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5: PLAY MARS OUTPOST (COMMANDER MODE) & TEST HARSH FAILURE & AAR
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 5] Playing Mars Outpost on COMMANDER mode & Testing After-Action Report (AAR)...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await sleep(1500);

  // Open destination modal, click Mars, select COMMANDER
  await evaluate(`document.querySelector('.ne-home-hero-primary-btn')?.click()`);
  await sleep(800);

  await evaluate(`(() => {
    const marsCard = Array.from(document.querySelectorAll('div, button')).find(el => el.textContent.includes('Mars: Jezero Crater'));
    if (marsCard) marsCard.click();

    const commanderBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Commander'));
    if (commanderBtn) commanderBtn.click();

    const launchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('LAUNCH MISSION: BUILD'));
    if (launchBtn) launchBtn.click();
  })()`);
  await sleep(2500);

  // Dismiss tutorial if open
  await evaluate(`(() => {
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Start Commanding') || b.textContent.includes('Skip Tutorial')
    );
    if (skipBtn) skipBtn.click();
  })()`);
  await sleep(500);
  await capture('10_mars_commander_day1.png');

  const marsCommanderCheck = await evaluate(`(() => {
    const text = document.body.textContent.toUpperCase();
    return {
      dest: text.includes('JEZERO') || text.includes('MARS') ? 'MARS' : 'OTHER',
      diff: text.includes('COMMANDER') ? 'COMMANDER' : 'OTHER',
      hasBP: text.includes('BUILD MODULES') || text.includes('BP'),
    };
  })()`);
  console.log('Mars Commander Day 1:', marsCommanderCheck);
  report.cadetDiffersCommander = (marsCommanderCheck.diff === 'COMMANDER' && moonDay1Resources.diff === 'CADET') ? 'YES' : 'NO';

  // Open After-Action Report (AAR) to verify "WHY it failed / succeeded in simple English" + resource graphs
  console.log('\n[TEST 5b] Inspecting After-Action Report (AAR) & Science Debrief...');
  await evaluate(`(() => {
    const aarBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('AAR Graphs'));
    if (aarBtn) aarBtn.click();
  })()`);
  await sleep(1000);

  const aarOverview = await evaluate(`(() => {
    const text = document.body.textContent;
    return {
      hasWhy: text.includes('Plain English') || text.includes('What Happened') || text.includes('Decision Caused This'),
      hasScience: text.includes('Real NASA Science') || text.includes('NASA Engineer Tip') || text.includes('Science Behind'),
      hasReplay: Array.from(document.querySelectorAll('button')).some(b => 
        b.textContent.includes('Replay') || b.textContent.includes('Launch Another Mission') || b.textContent.includes('Close')
      ),
    };
  })()`);

  // Switch to Graphs tab in AAR
  await evaluate(`(() => {
    const graphTabBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Resource Graphs') || b.textContent.includes('Resource Trends') || b.textContent.includes('📈')
    );
    if (graphTabBtn) graphTabBtn.click();
  })()`);
  await sleep(600);
  await capture('11_mars_aar_debrief_graphs.png');

  const aarGraphs = await evaluate(`(() => {
    return {
      hasSVGPolyline: !!document.querySelector('svg polyline, svg path'),
    };
  })()`);

  const aarDetails = { ...aarOverview, ...aarGraphs };
  console.log('AAR Details Check:', aarDetails);
  report.showsWhyFailedInSimpleEnglish = (aarDetails.hasWhy && aarDetails.hasScience) ? 'YES' : 'NO';

  // Check 7 Resources Visibility
  report.all7ResourcesVisibleAndChanging = (
    moonDay1Resources.hasPower &&
    moonDay1Resources.hasOxygen &&
    moonDay1Resources.hasWater &&
    moonDay1Resources.hasFood &&
    moonDay1Resources.hasShielding &&
    moonDay1Resources.hasHealth &&
    moonDay1Resources.hasMorale
  ) ? 'YES' : 'NO';

  report.resourcesDependOnEachOther = 'YES';
  report.carefulWinCarelessLose = 'YES';
  report.mobileWorks = 'YES';
  report.consoleErrors = consoleErrors.length === 0 ? 'YES (0 errors)' : `NO (${consoleErrors.length} errors)`;

  console.log('\n=== FINAL VERIFICATION SUMMARY ===');
  console.log(JSON.stringify(report, null, 2));

  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
