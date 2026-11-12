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
  console.log('=== Starting Jr_AstroCamp Game Landing Home Redesign Verification ===');
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
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const { type, args } = msg.params;
      const text = args.map((a) => a.value || a.description || '').join(' ');
      if (type === 'error') {
        consoleErrors.push(text);
        console.error('[BROWSER ERROR]', text);
      }
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

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
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

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: HOME PAGE AT 1920x1080 (Hero, Cards, Top Bar, Clean Screen)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 1] Testing Redesigned Game Landing Home Page at 1920x1080...');
  await setViewport(1920, 1080);
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await sleep(3000);

  // Dismiss tutorial if open
  await evaluate(`(() => {
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Skip Tutorial') || b.textContent.includes('Start Commanding')
    );
    if (skipBtn) skipBtn.click();
  })()`);
  await sleep(500);

  await capture('home_redesign_1920x1080.png');

  const homeElementsCheck = await evaluate(`(() => {
    const text = document.body.textContent;
    const heroBtn = document.querySelector('.game-hero-cta-btn');
    const moonCard = document.querySelector('.game-mission-card:not(.mars-card)');
    const marsCard = document.querySelector('.game-mission-card.mars-card');
    
    // Check items that MUST NOT be on Home:
    const hasTimelineBar = !!document.querySelector('.nasa-eyes-bottombar');
    const hasDossierCard = !!document.querySelector('.ne-telemetry-hud-card');
    const hasLayerToggles = !!document.querySelector('.ne-toggles-cluster');
    const has76MissionsCounter = text.includes('/76') || text.includes('0/76');
    const hasCoopBtn = text.includes('CO-OP');

    // Check items that MUST be on Home:
    const hasTitle = text.includes('Jr.') && text.includes('AstroCamp');
    const hasSubtitle = text.includes('Keep your crew alive on the Moon or Mars!');
    const hasStartBtn = heroBtn && heroBtn.textContent.includes('Start Mission');
    const hasMoonCard = !!moonCard && text.includes('Shackleton Crater') && text.includes('14 Earth days of continuous night');
    const hasMarsCard = !!marsCard && text.includes('Jezero Crater') && text.includes('Global dust storms');
    const hasCadetDiff = text.includes('Cadet') && text.includes('Gentle resource consumption');
    const hasOfficerDiff = text.includes('Officer') && text.includes('Realistic NASA Baseline Values');
    const hasCommanderDiff = text.includes('Commander') && text.includes('Hardcore survival');
    const has3Steps = text.includes('Build Your Outpost') && text.includes('Balance Life Support') && text.includes('Keep Crew Alive');
    const has7Resources = ['Power', 'Oxygen', 'Water', 'Food', 'Radiation', 'Health', 'Morale'].every(r => text.includes(r));
    const hasDidYouKnow = text.includes('DID YOU KNOW?') || text.includes('Did you know?');
    const hasFooter = text.includes('Built with real NASA engineering data') && text.includes('NASA Baseline Values');

    // Check Top Bar:
    const topBar = document.querySelector('.global-aerospace-nav');
    const hasPlay = Array.from(topBar?.querySelectorAll('button') || []).some(b => b.textContent.trim() === 'Play');
    const hasLearn = Array.from(topBar?.querySelectorAll('button') || []).some(b => b.textContent.trim() === 'Learn');
    const hasExplore = Array.from(topBar?.querySelectorAll('button') || []).some(b => b.textContent.trim() === 'Explore Space');
    const hasMore = Array.from(topBar?.querySelectorAll('button') || []).some(b => b.textContent.trim().startsWith('More'));
    const hasSound = Array.from(topBar?.querySelectorAll('button') || []).some(b => b.textContent.includes('Sound') || b.textContent.includes('Muted'));

    return {
      hasTitle,
      hasSubtitle,
      hasStartBtn: !!hasStartBtn,
      hasMoonCard: !!hasMoonCard,
      hasMarsCard: !!hasMarsCard,
      hasCadetDiff,
      hasOfficerDiff,
      hasCommanderDiff,
      has3Steps,
      has7Resources,
      hasDidYouKnow,
      hasFooter,
      // Removed items check:
      hasTimelineBar,
      hasDossierCard,
      hasLayerToggles,
      has76MissionsCounter,
      hasCoopBtn,
      // Top bar check:
      topBar: {
        hasPlay,
        hasLearn,
        hasExplore,
        hasMore,
        hasSound
      }
    };
  })()`);

  console.log('1920x1080 Home Elements Check:', JSON.stringify(homeElementsCheck, null, 2));

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: TEST TOP BAR MORE DROPDOWN
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 2] Testing Top Bar "More" Dropdown...');
  await evaluate(`(() => {
    const moreBtn = Array.from(document.querySelectorAll('.global-aerospace-nav button')).find(b => b.textContent.includes('More'));
    if (moreBtn) moreBtn.click();
  })()`);
  await sleep(600);
  await capture('top_bar_more_dropdown.png');

  const dropdownCheck = await evaluate(`(() => {
    const text = document.body.textContent;
    return {
      hasCadetAcademy: text.includes('Cadet Academy'),
      hasSimulators: text.includes('Simulators'),
      hasHubComics: text.includes('Hub & Comics'),
      hasEducators: text.includes('Educators'),
      hasSettings: text.includes('Settings'),
      hasCertificate: text.includes('Certificate'),
      hasGuide: text.includes('Guide'),
      hasCadetLogin: text.includes('Cadet Login'),
    };
  })()`);
  console.log('Top Bar More Dropdown Check:', dropdownCheck);

  // Close dropdown
  await evaluate(`(() => {
    const moreBtn = Array.from(document.querySelectorAll('.global-aerospace-nav button')).find(b => b.textContent.includes('More'));
    if (moreBtn) moreBtn.click();
  })()`);
  await sleep(400);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: TEST DIFFICULTY SELECTOR INTERACTION
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 3] Testing Difficulty Selector Interactions...');
  await evaluate(`(() => {
    const commanderCard = Array.from(document.querySelectorAll('.game-diff-card')).find(c => c.textContent.includes('Commander'));
    if (commanderCard) commanderCard.click();
  })()`);
  await sleep(500);
  await capture('difficulty_selector_interaction.png');

  const diffActiveCheck = await evaluate(`(() => {
    const text = document.body.textContent;
    return {
      activeIsCommander: text.includes('ACTIVE: COMMANDER'),
    };
  })()`);
  console.log('Difficulty active check:', diffActiveCheck);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: VIEWPORT RESPONSIVENESS (1366x768, 1280x720, Mobile 390x844)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 4] Testing 1366x768, 1280x720, and 390x844 Viewports...');
  await setViewport(1366, 768);
  await sleep(400);
  await capture('home_redesign_1366x768.png');

  await setViewport(1280, 720);
  await sleep(400);
  await capture('home_redesign_1280x720.png');

  await setViewport(390, 844);
  await sleep(400);
  await capture('home_redesign_mobile_390x844.png');

  const mobileCheck = await evaluate(`(() => {
    const root = document.querySelector('.game-landing-root');
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    return {
      noHorizontalScroll: scrollW <= clientW + 1,
      clientWidth: clientW,
      scrollWidth: scrollW,
    };
  })()`);
  console.log('Mobile 390x844 Check:', mobileCheck);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: EXPLORE SPACE DEDICATED ORRERY PAGE (#/explore)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 5] Testing Dedicated "Explore Space" Orrery Page (#/explore)...');
  await setViewport(1920, 1080);
  await send('Page.navigate', { url: 'http://localhost:5173/#/explore' });
  await sleep(2500);
  await capture('explore_space_orrery_1920x1080.png');

  const exploreCheck = await evaluate(`(() => {
    const hasBottombar = !!document.querySelector('.nasa-eyes-bottombar');
    const hasTargetCard = !!document.querySelector('.ne-telemetry-hud-card');
    const hasToggles = !!document.querySelector('.ne-toggles-cluster');
    const hasTimeSpeed = !!document.querySelector('.ne-speed-button');
    return {
      hasBottombar,
      hasTargetCard,
      hasToggles,
      hasTimeSpeed,
    };
  })()`);
  console.log('Explore Space Page Check:', exploreCheck);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: "BUILD OUTPOST ON MOON" BUTTON DIRECT LAUNCH
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[TEST 6] Testing "Build Outpost on Moon" Button Direct Launch...');
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  await sleep(1500);

  await evaluate(`(() => {
    const moonBtn = document.querySelector('.game-card-action-btn.moon-btn');
    if (moonBtn) moonBtn.click();
  })()`);
  await sleep(2000);
  await capture('moon_outpost_launched_from_home.png');

  const outpostLaunchCheck = await evaluate(`(() => {
    const text = document.body.textContent.toUpperCase();
    return {
      destMoon: text.includes('SHACKLETON') || text.includes('MOON'),
      hasECLSS: text.includes('POWER') && text.includes('OXYGEN') && text.includes('WATER'),
      hasSol1: text.includes('SOL 1') || text.includes('SOL 01'),
    };
  })()`);
  console.log('Moon Outpost Launch Check:', outpostLaunchCheck);

  console.log('\n=== SUMMARY ===');
  console.log('Console Errors:', consoleErrors.length === 0 ? '0 (Clean)' : consoleErrors);
  console.log('Home Elements Check Passed:', 
    homeElementsCheck.hasTitle && 
    homeElementsCheck.hasSubtitle && 
    homeElementsCheck.hasStartBtn && 
    homeElementsCheck.hasMoonCard && 
    homeElementsCheck.hasMarsCard && 
    !homeElementsCheck.hasTimelineBar &&
    !homeElementsCheck.hasDossierCard &&
    !homeElementsCheck.hasLayerToggles
  );
  console.log('Explore Space Orrery Preserved:', exploreCheck.hasBottombar && exploreCheck.hasTargetCard);

  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

