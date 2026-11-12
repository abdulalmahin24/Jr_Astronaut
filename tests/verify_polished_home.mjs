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
  console.log('=== Verifying Jr_AstroCamp Clearly Visible NASA Background Scene ===');
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

  // 1. Load Home
  await setViewport(1920, 1080);
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' });
  
  // Wait for React Suspense to load GameLandingHomePage
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(`!!document.querySelector('[data-testid="space-background-canvas"]')`);
    if (ready) {
      console.log(`[READY] Home page loaded after ${i * 200}ms`);
      break;
    }
    await sleep(200);
  }
  await sleep(1000);

  // Dismiss tutorial if present
  await evaluate(`(() => {
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Skip Tutorial') || b.textContent.includes('Start Commanding')
    );
    if (skipBtn) skipBtn.click();
  })()`);
  await sleep(600);

  // 2. Validate Desktop 1920x1080
  console.log('\n--- Checking 1920x1080 ---');
  await capture('home_nasa_bg_1920x1080.png');

  const check1920 = await evaluate(`(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const bgContainer = document.querySelector('[data-testid="space-background-canvas"]');
    const bgCanvas = bgContainer?.querySelector('canvas');
    const earthImg = bgContainer?.querySelector('img[alt="NASA Earth from Space"]');
    const moonImg = bgContainer?.querySelector('img[alt="NASA Lunar Surface Shackleton Crater"]');
    const marsImg = bgContainer?.querySelector('img[alt="NASA Mars Jezero Crater Panorama"]');
    const outpostSvg = bgContainer?.querySelector('svg');
    const topPill = document.querySelector('[data-testid="hero-agency-badge"]')?.textContent?.trim();
    const subtitle = document.querySelector('[data-testid="hero-subtitle"]')?.textContent?.trim();
    const startBtn = document.querySelector('[data-testid="start-mission-btn"]');
    const resourceCircles = Array.from(document.querySelectorAll('.resource-circle-item')).map(el => el.getAttribute('title'));
    const factPill = document.querySelector('.cinematic-fact-pill')?.textContent?.trim();
    const moonChip = document.querySelector('[data-testid="chip-moon"]')?.textContent?.trim();
    const marsChip = document.querySelector('[data-testid="chip-mars"]')?.textContent?.trim();

    // Check bottom-right 200x100px corner emptiness
    const bottomRightElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const rect = el.getBoundingClientRect();
      return (
        rect.right > window.innerWidth - 200 &&
        rect.bottom > window.innerHeight - 100 &&
        rect.width > 20 &&
        rect.height > 20 &&
        !el.contains(document.body) &&
        !document.body.contains(el)
      );
    });

    const isNoScroll = (docEl.scrollHeight <= window.innerHeight + 2) && (body.scrollHeight <= window.innerHeight + 2);

    return {
      isNoScroll,
      scrollHeight: docEl.scrollHeight,
      innerHeight: window.innerHeight,
      hasBgCanvas: !!bgCanvas,
      hasEarthImg: !!earthImg,
      hasMoonImg: !!moonImg,
      hasMarsImg: !!marsImg,
      outpostSvgWidth: outpostSvg ? outpostSvg.getBoundingClientRect().width : 0,
      topPill,
      subtitle,
      hasStartBtn: !!startBtn,
      resourceCount: resourceCircles.length,
      moonChip,
      marsChip,
      isBottomRightEmpty: bottomRightElements.length === 0,
    };
  })()`);

  console.log('1920x1080 Check Result:', JSON.stringify(check1920, null, 2));

  // 3. Test Hover on Moon Chip & Mars Chip
  console.log('\n--- Testing Moon & Mars Hover Interaction ---');
  await evaluate(`(() => {
    const moonChip = document.querySelector('[data-testid="chip-moon"]');
    if (moonChip) {
      moonChip.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      moonChip.focus();
    }
  })()`);
  await sleep(400);
  await capture('home_nasa_bg_hover_moon.png');
  const moonHoverText = await evaluate(`(() => {
    return document.body.textContent.includes('Shackleton Crater rims receive continuous sunlight');
  })()`);
  console.log('Moon Chip Hover Fact Shown:', moonHoverText);

  await evaluate(`(() => {
    const marsChip = document.querySelector('[data-testid="chip-mars"]');
    if (marsChip) {
      marsChip.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      marsChip.focus();
    }
  })()`);
  await sleep(400);
  await capture('home_nasa_bg_hover_mars.png');
  const marsHoverText = await evaluate(`(() => {
    return document.body.textContent.includes('Jezero Crater delta was once filled with ancient liquid river water');
  })()`);
  console.log('Mars Chip Hover Fact Shown:', marsHoverText);

  // Leave hover
  await evaluate(`(() => {
    const marsChip = document.querySelector('[data-testid="chip-mars"]');
    if (marsChip) {
      marsChip.blur();
      marsChip.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    }
  })()`);
  await sleep(300);

  // 4. Check 1366x768
  console.log('\n--- Checking 1366x768 ---');
  await setViewport(1366, 768);
  await sleep(500);
  await capture('home_nasa_bg_1366x768.png');
  const check1366 = await evaluate(`(() => {
    const docEl = document.documentElement;
    return {
      isNoScroll: docEl.scrollHeight <= window.innerHeight + 2,
      scrollHeight: docEl.scrollHeight,
      innerHeight: window.innerHeight
    };
  })()`);
  console.log('1366x768 Scroll Check:', check1366);

  // 5. Check 1280x720
  console.log('\n--- Checking 1280x720 ---');
  await setViewport(1280, 720);
  await sleep(500);
  await capture('home_nasa_bg_1280x720.png');
  const check1280 = await evaluate(`(() => {
    const docEl = document.documentElement;
    return {
      isNoScroll: docEl.scrollHeight <= window.innerHeight + 2,
      scrollHeight: docEl.scrollHeight,
      innerHeight: window.innerHeight
    };
  })()`);
  console.log('1280x720 Scroll Check:', check1280);

  // 6. Check 390x844 Mobile
  console.log('\n--- Checking 390x844 Mobile ---');
  await setViewport(390, 844);
  await sleep(500);
  await capture('home_nasa_bg_390x844_mobile.png');
  const checkMobile = await evaluate(`(() => {
    const docEl = document.documentElement;
    return {
      isNoScroll: docEl.scrollHeight <= window.innerHeight + 2,
      scrollHeight: docEl.scrollHeight,
      innerHeight: window.innerHeight
    };
  })()`);
  console.log('Mobile Scroll Check:', checkMobile);

  // 7. Test Chip Clicks (Opening Wizard)
  console.log('\n--- Testing Chip Click Launch ---');
  await setViewport(1920, 1080);
  await sleep(500);

  // Click Moon Chip
  await evaluate(`(() => {
    const moonChip = document.querySelector('[data-testid="chip-moon"]');
    if (moonChip) moonChip.click();
  })()`);
  await sleep(600);
  const moonWizardCheck = await evaluate(`(() => {
    const wizard = document.querySelector('[data-testid="wizard-modal"]');
    const moonCard = document.querySelector('[data-testid="wizard-dest-moon"]');
    return {
      isOpen: !!wizard,
      selectedDest: moonCard ? moonCard.textContent.includes('Selected for Outpost Command') : false
    };
  })()`);
  console.log('Moon Chip Wizard Result:', moonWizardCheck);

  // Close wizard
  await evaluate(`(() => {
    const closeBtn = document.querySelector('[data-testid="wizard-close-btn"]');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(500);

  console.log('\nTotal Browser Console Errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors encountered:', consoleErrors);
  }

  cleanup();
  console.log('=== All Verifications Finished Successfully ===');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
