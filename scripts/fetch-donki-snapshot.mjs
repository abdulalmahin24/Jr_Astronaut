import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(projectRoot, 'public/data/donki_snapshot.json');
const endpoints = ['CME', 'FLR', 'SEP', 'GST'];
const timeoutMs = 15_000;
const apiKey = process.env.NASA_API_KEY || process.env.VITE_NASA_API_KEY || 'DEMO_KEY';

const endDate = new Date();
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - 30);
const params = new URLSearchParams({
  startDate: startDate.toISOString().slice(0, 10),
  endDate: endDate.toISOString().slice(0, 10),
  api_key: apiKey,
});

const records = await Promise.all(endpoints.map(async (endpoint) => {
  const response = await fetch(`https://api.nasa.gov/DONKI/${endpoint}?${params}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`NASA DONKI ${endpoint} request failed with HTTP ${response.status}`);
  }
  const json = await response.json();
  if (!Array.isArray(json)) {
    throw new Error(`NASA DONKI ${endpoint} returned an unexpected response`);
  }
  return [endpoint.toLowerCase(), json];
}));

const snapshot = {
  fetchedAt: new Date().toISOString(),
  range: {
    startDate: params.get('startDate'),
    endDate: params.get('endDate'),
  },
  source: 'NASA DONKI API',
  ...Object.fromEntries(records),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(`Saved NASA DONKI snapshot to ${outputPath}`);
