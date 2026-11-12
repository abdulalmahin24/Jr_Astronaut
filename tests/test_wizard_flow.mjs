import { spawn } from 'node:child_process';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  await sleep(2000);

  const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data.result);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2500);

  const evalCode = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  };

  console.log('1. Click Start Mission Button...');
  await evalCode(`document.querySelector('.game-hero-start-btn')?.click()`);
  await sleep(600);
  console.log('Wizard open? Header:', await evalCode(`document.querySelector('h2')?.innerText`));

  console.log('2. Click Step 1 Next...');
  await evalCode(`document.getElementById('wizard-next-btn')?.click()`);
  await sleep(600);
  console.log('After Click 1 Header:', await evalCode(`document.querySelector('h2')?.innerText`));

  console.log('3. Click Step 2 Next...');
  await evalCode(`document.getElementById('wizard-next-btn')?.click()`);
  await sleep(600);
  console.log('After Click 2 Header:', await evalCode(`document.querySelector('h2')?.innerText`));

  console.log('4. Click Step 3 Launch...');
  await evalCode(`document.getElementById('wizard-next-btn')?.click()`);
  await sleep(600);
  console.log('Launching text:', await evalCode(`document.body.innerText.substring(0, 200)`));

  await sleep(2500);
  console.log('Current Hash after launch:', await evalCode(`window.location.hash`));
  console.log('Page header after launch:', await evalCode(`document.querySelector('header')?.innerText`));
  console.log('Body elements sample:', await evalCode(`Array.from(document.querySelectorAll('h3, strong')).slice(0, 10).map(e => e.innerText)`));

  chromeProc.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

