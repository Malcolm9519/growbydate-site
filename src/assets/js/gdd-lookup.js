/* src/assets/js/gdd-lookup.js
   Static-first GDD station lookup for GrowByDate. No backend. No external APIs. */

let _mapPromise = null;
let _mapData = null;
let _mapLoadError = null; // tracks whether map fetch failed (vs key not found)

const _stationCache = new Map(); // stationId -> Promise|data

function _fetchMap() {
  if (_mapData) return Promise.resolve(_mapData);
  if (_mapPromise) return _mapPromise;

  _mapPromise = fetch("/assets/data/gdd-stations.json", { cache: "force-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load GDD station map (${r.status})`);
      return r.json();
    })
    .then((data) => {
      _mapLoadError = null;
      _mapData = data && typeof data === "object" ? data : {};
      return _mapData;
    })
    .catch((err) => {
      _mapLoadError = err || new Error("Failed to load GDD station map");
      _mapData = {};
      return _mapData;
    });

  return _mapPromise;
}

export function normalizeGddKey(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";

  const hasLetters = /[a-z]/i.test(s);
  if (hasLetters) {
    // Canada: normalize to FSA (first 3 chars), uppercase, no spaces
    const up = s.toUpperCase().replace(/\s+/g, "");
    return up.slice(0, 3);
  }

  // US: normalize to ZIP5 digits; callers may also try ZIP3 fallback
  return s.replace(/\D+/g, "").slice(0, 5);
}

/**
 * Detailed lookup helper for better UI messaging:
 * - reason "ok": found a stationId
 * - reason "empty": no usable input
 * - reason "map_load_failed": map couldn't be fetched/published
 * - reason "not_found": map loaded but key not present
 */
export async function lookupStationIdDetailed(rawInput) {
  const key = normalizeGddKey(rawInput);
  if (!key) return { key: "", stationId: "", reason: "empty" };

  const map = await _fetchMap();

  // Candidates: exact (ZIP5/FSA) then ZIP3 fallback
  const candidates = [key];
  if (/^\d{5}$/.test(key)) candidates.push(key.slice(0, 3));

  for (const k of candidates) {
    const hit = map[k];
    if (hit) return { key: k, stationId: String(hit), reason: "ok" };
  }

  if (_mapLoadError) return { key, stationId: "", reason: "map_load_failed" };
  return { key, stationId: "", reason: "not_found" };
}

export async function lookupStationId(rawInput) {
  const { stationId } = await lookupStationIdDetailed(rawInput);
  return stationId;
}

export async function loadStationSeries(stationId) {
  const id = String(stationId || "").trim();
  if (!id) return null;

  if (_stationCache.has(id)) {
    const cached = _stationCache.get(id);
    return typeof cached?.then === "function" ? await cached : cached;
  }

  const p = fetch(`/assets/data/gdd-stations/${encodeURIComponent(id)}.json`, { cache: "force-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`Missing station series (${r.status})`);
      return r.json();
    })
    .then((data) => {
      // Basic structural validation so downstream code doesn't crash
      if (!data || typeof data !== "object") return null;
      if (!data.bases || typeof data.bases !== "object") return null;
      if (!data.bases["40"] && !data.bases["45"] && !data.bases["50"]) return null;
      return data;
    })
    .catch(() => null);

  _stationCache.set(id, p);
  const resolved = await p;
  _stationCache.set(id, resolved);
  return resolved;
}