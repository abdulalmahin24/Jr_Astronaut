export interface DonkiCmeRecord {
  activityID?: string;
  startTime?: string;
  link?: string;
  cmeAnalyses?: Array<{
    speed?: number;
    isMostAccurate?: boolean;
  }>;
  linkedEvents?: Array<{
    activityID?: string;
    catalog?: string;
  }>;
}

export interface DonkiFlareRecord {
  flrID?: string;
  classType?: string;
  beginTime?: string;
  link?: string;
}

export interface DonkiPayload {
  cme: DonkiCmeRecord[];
  flr: DonkiFlareRecord[];
  sep: Array<Record<string, unknown>>;
  gst: Array<Record<string, unknown>>;
}

export interface DonkiStormSummary {
  recordId: string;
  flareRecordId: string;
  eventTime: string;
  flareClass: string;
  stormStrength: 'LOW' | 'MODERATE' | 'STRONG' | 'EXTREME';
  cmeSpeedKmPerSecond: number;
  warningHours: number;
  sourceUrl: string;
}

export type DonkiDataSource = 'LIVE' | 'ARCHIVED' | 'UNAVAILABLE';

export interface DonkiDataResult {
  source: DonkiDataSource;
  fetchedAt?: string;
  summary?: DonkiStormSummary;
  error?: string;
}

export interface DonkiSnapshotPayload extends DonkiPayload {
  fetchedAt: string | null;
}

const ASTRONOMICAL_UNIT_KM = 149_597_870.7;

function getFlareStrength(classType: string): DonkiStormSummary['stormStrength'] {
  const classLetter = classType.trim().toUpperCase()[0];
  if (classLetter === 'X') return 'EXTREME';
  if (classLetter === 'M') return 'STRONG';
  if (classLetter === 'C') return 'MODERATE';
  return 'LOW';
}

export function mapDonkiPayloadToStorm(payload: DonkiPayload): DonkiStormSummary | undefined {
  const flaresById = new Map(
    payload.flr
      .flatMap((flare) => flare.flrID && flare.classType
        ? [[flare.flrID, flare] as const]
        : [])
  );

  const candidates = payload.cme
    .map((cme) => {
      const linkedFlareId = cme.linkedEvents?.find(
        (event) => event.catalog?.toUpperCase() === 'FLR' && event.activityID
      )?.activityID;
      const flare = linkedFlareId ? flaresById.get(linkedFlareId) : undefined;
      const analysis = cme.cmeAnalyses?.find((item) => item.isMostAccurate && Number.isFinite(item.speed))
        ?? cme.cmeAnalyses?.find((item) => Number.isFinite(item.speed));

      if (!cme.activityID || !cme.startTime || !flare?.flrID || !flare.classType || !analysis?.speed || analysis.speed <= 0) {
        return undefined;
      }

      return {
        recordId: cme.activityID,
        flareRecordId: flare.flrID,
        eventTime: flare.beginTime || cme.startTime,
        flareClass: flare.classType,
        stormStrength: getFlareStrength(flare.classType),
        cmeSpeedKmPerSecond: analysis.speed,
        warningHours: Math.max(1, Math.round((ASTRONOMICAL_UNIT_KM / analysis.speed) / 3600)),
        sourceUrl: cme.link || flare.link || 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
      } satisfies DonkiStormSummary;
    })
    .filter((summary): summary is DonkiStormSummary => summary !== undefined)
    .sort((left, right) => Date.parse(right.eventTime) - Date.parse(left.eventTime));

  return candidates[0];
}

export function selectDonkiSource(
  liveSummary: DonkiStormSummary | undefined,
  archivedSummary: DonkiStormSummary | undefined,
  archivedFetchedAt?: string
): DonkiDataResult {
  if (liveSummary) {
    return { source: 'LIVE', summary: liveSummary };
  }
  if (archivedSummary) {
    return { source: 'ARCHIVED', summary: archivedSummary, fetchedAt: archivedFetchedAt };
  }
  return { source: 'UNAVAILABLE' };
}

export async function resolveDonkiDataSources(
  loadLive: () => Promise<DonkiPayload>,
  loadSnapshot: () => Promise<DonkiSnapshotPayload>
): Promise<DonkiDataResult> {
  let liveError = 'NASA DONKI data is unavailable.';
  try {
    const liveSummary = mapDonkiPayloadToStorm(await loadLive());
    if (liveSummary) return selectDonkiSource(liveSummary, undefined);
    liveError = 'NASA DONKI returned no CME record linked to a classified flare.';
  } catch (error) {
    liveError = error instanceof Error ? error.message : 'NASA DONKI request failed unexpectedly.';
  }

  try {
    const snapshot = await loadSnapshot();
    const result = selectDonkiSource(
      undefined,
      mapDonkiPayloadToStorm(snapshot),
      snapshot.fetchedAt || undefined
    );
    if (result.summary) return result;
    return { source: 'UNAVAILABLE', error: `${liveError} The archived snapshot contains no usable record.` };
  } catch (error) {
    const snapshotError = error instanceof Error ? error.message : 'Archived DONKI snapshot failed unexpectedly.';
    return { source: 'UNAVAILABLE', error: `${liveError} ${snapshotError}` };
  }
}
