import {db} from './db.ts';

export interface DriverStandingItem {
  position: number;
  points: number;
  wins: number;
  driverName: string;
  driverCode: string;
  nationality: string;
  constructorName: string;
}

export interface ConstructorStandingItem {
  position: number;
  points: number;
  wins: number;
  constructorName: string;
  nationality: string;
}

export interface RaceCalendarItem {
  round: number;
  raceName: string;
  circuitName: string;
  locality: string;
  country: string;
  date: string;
  time: string;
  status: 'COMPLETED' | 'UPCOMING' | 'LIVE';
  sessions: {
    fp1?: string;
    qualifying?: string;
    sprint?: string;
    race: string;
  };
}

export interface RaceResultItem {
  round: number;
  raceName: string;
  circuitName: string;
  date: string;
  podium: Array<{
    position: number;
    driverName: string;
    driverCode: string;
    constructorName: string;
    timeOrStatus: string;
    points: number;
  }>;
  qualifyingTop3: Array<{
    position: number;
    driverName: string;
    constructorName: string;
    q3: string;
  }>;
}

export interface RacingOverviewPayload {
  season: string;
  provider: string;
  syncStatus: 'LIVE' | 'CACHED' | 'ERROR';
  lastSyncedAt: string;
  errorMessage: string;
  reigningDriverChampion: DriverStandingItem | null;
  reigningConstructorChampion: ConstructorStandingItem | null;
  driverStandings: DriverStandingItem[];
  constructorStandings: ConstructorStandingItem[];
  calendar: RaceCalendarItem[];
  nextRace: RaceCalendarItem | null;
  latestResult: RaceResultItem | null;
}

const DEFAULT_API_BASE = process.env.F1_API_BASE_URL || 'https://api.jolpi.ca/ergast/f1';

async function fetchJsonWithTimeout(url: string, timeoutMs = 6500): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {Accept: 'application/json', 'User-Agent': 'PITLANE-RacingCentre/1.0'},
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function syncF1DataFromProvider(): Promise<RacingOverviewPayload> {
  const nowIso = new Date().toISOString();
  try {
    const [driversRes, constructorsRes, scheduleRes, lastResultRes, lastQualiRes] = await Promise.all([
      fetchJsonWithTimeout(`${DEFAULT_API_BASE}/current/driverStandings.json`),
      fetchJsonWithTimeout(`${DEFAULT_API_BASE}/current/constructorStandings.json`),
      fetchJsonWithTimeout(`${DEFAULT_API_BASE}/current.json`),
      fetchJsonWithTimeout(`${DEFAULT_API_BASE}/current/last/results.json`),
      fetchJsonWithTimeout(`${DEFAULT_API_BASE}/current/last/qualifying.json`).catch(() => null),
    ]);

    const driverLists = driversRes?.MRData?.StandingsTable?.StandingsLists?.[0];
    const constructorLists = constructorsRes?.MRData?.StandingsTable?.StandingsLists?.[0];
    const racesRaw: any[] = scheduleRes?.MRData?.RaceTable?.Races || [];
    const lastRaceRaw = lastResultRes?.MRData?.RaceTable?.Races?.[0];
    const lastQualiRaw = lastQualiRes?.MRData?.RaceTable?.Races?.[0];

    const season = String(
      driverLists?.season || scheduleRes?.MRData?.RaceTable?.season || new Date().getFullYear()
    );

    const driverStandings: DriverStandingItem[] = (driverLists?.DriverStandings || [])
      .slice(0, 12)
      .map((item: any) => ({
        position: Number(item.position || 0),
        points: Number(item.points || 0),
        wins: Number(item.wins || 0),
        driverName: `${item.Driver?.givenName || ''} ${item.Driver?.familyName || ''}`.trim(),
        driverCode: item.Driver?.code || item.Driver?.familyName?.slice(0, 3).toUpperCase() || 'DRV',
        nationality: item.Driver?.nationality || '',
        constructorName: item.Constructors?.[0]?.name || '',
      }));

    const constructorStandings: ConstructorStandingItem[] = (
      constructorLists?.ConstructorStandings || []
    )
      .slice(0, 10)
      .map((item: any) => ({
        position: Number(item.position || 0),
        points: Number(item.points || 0),
        wins: Number(item.wins || 0),
        constructorName: item.Constructor?.name || '',
        nationality: item.Constructor?.nationality || '',
      }));

    const nowMs = Date.now();
    const calendar: RaceCalendarItem[] = racesRaw.map((r: any) => {
      const isoStart = `${r.date}T${r.time || '14:00:00Z'}`;
      const startMs = Date.parse(isoStart);
      const endMs = startMs + 3 * 3600 * 1000;
      let status: 'COMPLETED' | 'UPCOMING' | 'LIVE' = 'UPCOMING';
      if (!Number.isNaN(startMs)) {
        if (nowMs >= startMs && nowMs <= endMs) status = 'LIVE';
        else if (nowMs > endMs) status = 'COMPLETED';
      }
      return {
        round: Number(r.round || 0),
        raceName: r.raceName || '',
        circuitName: r.Circuit?.circuitName || '',
        locality: r.Circuit?.Location?.locality || '',
        country: r.Circuit?.Location?.country || '',
        date: r.date || '',
        time: r.time || '14:00:00Z',
        status,
        sessions: {
          fp1: r.FirstPractice ? `${r.FirstPractice.date}T${r.FirstPractice.time || '10:00:00Z'}` : undefined,
          qualifying: r.Qualifying ? `${r.Qualifying.date}T${r.Qualifying.time || '14:00:00Z'}` : undefined,
          sprint: r.Sprint ? `${r.Sprint.date}T${r.Sprint.time || '11:00:00Z'}` : undefined,
          race: isoStart,
        },
      };
    });

    const nextRace =
      calendar.find((c) => c.status === 'LIVE') ||
      calendar.find((c) => c.status === 'UPCOMING') ||
      null;

    const latestResult: RaceResultItem | null = lastRaceRaw
      ? {
          round: Number(lastRaceRaw.round || 0),
          raceName: lastRaceRaw.raceName || '',
          circuitName: lastRaceRaw.Circuit?.circuitName || '',
          date: lastRaceRaw.date || '',
          podium: (lastRaceRaw.Results || []).slice(0, 10).map((res: any) => ({
            position: Number(res.position || 0),
            driverName: `${res.Driver?.givenName || ''} ${res.Driver?.familyName || ''}`.trim(),
            driverCode: res.Driver?.code || '',
            constructorName: res.Constructor?.name || '',
            timeOrStatus: res.Time?.time || res.status || '',
            points: Number(res.points || 0),
          })),
          qualifyingTop3: (lastQualiRaw?.QualifyingResults || []).slice(0, 3).map((q: any) => ({
            position: Number(q.position || 0),
            driverName: `${q.Driver?.givenName || ''} ${q.Driver?.familyName || ''}`.trim(),
            constructorName: q.Constructor?.name || '',
            q3: q.Q3 || q.Q2 || q.Q1 || 'N/A',
          })),
        }
      : null;

    const payload: RacingOverviewPayload = {
      season,
      provider: 'Jolpica F1 Data Feed (Ergast Compatible)',
      syncStatus: 'LIVE',
      lastSyncedAt: nowIso,
      errorMessage: '',
      reigningDriverChampion: driverStandings[0] || null,
      reigningConstructorChampion: constructorStandings[0] || null,
      driverStandings,
      constructorStandings,
      calendar,
      nextRace,
      latestResult,
    };

    db.prepare(
      `INSERT INTO f1_cache (cache_key, payload_json, source_provider, last_synced_at, status, error_message)
       VALUES ('overview', ?, ?, ?, 'LIVE', '')
       ON CONFLICT(cache_key) DO UPDATE SET
         payload_json = excluded.payload_json,
         source_provider = excluded.source_provider,
         last_synced_at = excluded.last_synced_at,
         status = 'LIVE',
         error_message = ''`
    ).run(JSON.stringify(payload), payload.provider, nowIso);

    db.prepare(
      `INSERT INTO data_sync_logs (provider, sync_type, status, details)
       VALUES (?, 'F1_OVERVIEW', 'SUCCESS', ?)`
    ).run(payload.provider, `Season ${season}: ${calendar.length} races, ${driverStandings.length} drivers synced.`);

    return payload;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unable to reach motorsport data feed';
    db.prepare(
      `INSERT INTO data_sync_logs (provider, sync_type, status, details)
       VALUES ('Jolpica F1 Data Feed', 'F1_OVERVIEW', 'FAILED', ?)`
    ).run(errMsg);

    const cached = db.prepare(`SELECT * FROM f1_cache WHERE cache_key = 'overview'`).get() as
      | {payload_json: string; last_synced_at: string; source_provider: string}
      | undefined;

    if (cached) {
      const parsed = JSON.parse(cached.payload_json) as RacingOverviewPayload;
      return {
        ...parsed,
        syncStatus: 'CACHED',
        lastSyncedAt: cached.last_synced_at,
        errorMessage: `Live feed unreachable (${errMsg}). Serving last verified cache.`,
      };
    }

    return {
      season: String(new Date().getFullYear()),
      provider: 'Jolpica F1 Data Feed (Ergast Compatible)',
      syncStatus: 'ERROR',
      lastSyncedAt: '',
      errorMessage: `Motorsport data feed offline (${errMsg}) and no cached data exists yet. Trigger manual sync when online.`,
      reigningDriverChampion: null,
      reigningConstructorChampion: null,
      driverStandings: [],
      constructorStandings: [],
      calendar: [],
      nextRace: null,
      latestResult: null,
    };
  }
}

export async function getRacingOverview(maxAgeMinutes = 30): Promise<RacingOverviewPayload> {
  const cached = db.prepare(`SELECT * FROM f1_cache WHERE cache_key = 'overview'`).get() as
    | {payload_json: string; last_synced_at: string; status: string; error_message: string}
    | undefined;

  if (cached) {
    const ageMs = Date.now() - Date.parse(cached.last_synced_at);
    if (!Number.isNaN(ageMs) && ageMs < maxAgeMinutes * 60 * 1000) {
      const parsed = JSON.parse(cached.payload_json) as RacingOverviewPayload;
      return {
        ...parsed,
        syncStatus: 'CACHED',
        lastSyncedAt: cached.last_synced_at,
      };
    }
  }

  return await syncF1DataFromProvider();
}
