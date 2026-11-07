import {
  resolveDonkiDataSources,
  type DonkiPayload,
  type DonkiSnapshotPayload,
} from './donkiMapper';

const DONKI_API_BASE = 'https://api.nasa.gov/DONKI';
const DONKI_ENDPOINTS = ['CME', 'FLR', 'SEP', 'GST'] as const;
const REQUEST_TIMEOUT_MS = 8_000;

function getApiKey(): string {
  return import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
}

async function fetchDonkiPayload(): Promise<DonkiPayload> {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);
  const commonParams = new URLSearchParams({
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    api_key: getApiKey(),
  });

  const entries = await Promise.all(DONKI_ENDPOINTS.map(async (endpoint) => {
    const url = `${DONKI_API_BASE}/${endpoint}?${commonParams}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
      throw new Error(`NASA DONKI ${endpoint} request failed with HTTP ${response.status}`);
    }
    const json: unknown = await response.json();
    if (!Array.isArray(json)) {
      throw new Error(`NASA DONKI ${endpoint} returned an unexpected response`);
    }
    return [endpoint.toLowerCase(), json] as const;
  }));

  const payload = Object.fromEntries(entries);
  return {
    cme: payload.cme ?? [],
    flr: payload.flr ?? [],
    sep: payload.sep ?? [],
    gst: payload.gst ?? [],
  };
}

async function fetchSnapshot(): Promise<DonkiSnapshotPayload> {
  const response = await fetch('/data/donki_snapshot.json', {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Archived DONKI snapshot request failed with HTTP ${response.status}`);
  }

  const snapshot: unknown = await response.json();
  if (!snapshot || typeof snapshot !== 'object' || !('fetchedAt' in snapshot)) {
    throw new Error('Archived DONKI snapshot has an invalid format');
  }

  return snapshot as DonkiSnapshotPayload;
}

export function loadDonkiSolarWeather() {
  return resolveDonkiDataSources(fetchDonkiPayload, fetchSnapshot);
}
