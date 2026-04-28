/* src/assets/js/planner-climate-lookup.js
   Unified climate-profile lookup for the GDD planner.

   A climate profile keeps frost dates and GDD station selection together. This
   prevents the planner from pairing one location's frost dates with another
   location's heat accumulation station.
*/

import { lookupFrost } from "./frost-lookup.js";
import { lookupStationId } from "./gdd-lookup.js";

let _profilePromise = null;
let _profileData = null;
let _profileLoadError = null;

function normalizePlannerClimateKey(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";

  const hasLetters = /[a-z]/i.test(s);
  if (hasLetters) {
    const up = s.toUpperCase().replace(/\s+/g, "");
    return up.slice(0, 3);
  }

  return s.replace(/\D+/g, "").slice(0, 5);
}

function lookupCandidates(raw) {
  const key = normalizePlannerClimateKey(raw);
  if (!key) return [];

  const out = [key];
  if (/^\d{5}$/.test(key)) out.push(key.slice(0, 3));
  return [...new Set(out)];
}

function fetchProfiles() {
  if (_profileData) return Promise.resolve(_profileData);
  if (_profilePromise) return _profilePromise;

  _profilePromise = fetch("/assets/data/planner-climate-profiles.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load planner climate profiles (${r.status})`);
      return r.json();
    })
    .then((data) => {
      _profileLoadError = null;
      _profileData = data && typeof data === "object" && !Array.isArray(data) ? data : {};
      return _profileData;
    })
    .catch((err) => {
      _profileLoadError = err || new Error("Failed to load planner climate profiles");
      _profileData = {};
      return _profileData;
    });

  return _profilePromise;
}

function normalizeProfile(hit, matchedKey) {
  if (!hit || typeof hit !== "object") return null;

  const stationId = String(hit.stationId || hit.gddStationId || "").trim();
  if (!stationId) return null;

  return {
    key: String(hit.key || matchedKey || ""),
    inputMatchKey: matchedKey || String(hit.key || ""),
    lastFrost: hit.lastFrost,
    firstFrost: hit.firstFrost,
    name: hit.name,
    region: hit.region,
    country: hit.country,
    sourceLabel: hit.sourceLabel,
    stationId,
    gddStationId: stationId,
    matchedFrostKey: hit.matchedFrostKey || hit.key || matchedKey,
    climateProfileSource: hit.climateProfileSource || "profile",
    confidence: hit.confidence || "mapped"
  };
}

export async function lookupPlannerClimate(rawInput) {
  const candidates = lookupCandidates(rawInput);
  if (!candidates.length) return null;

  const profiles = await fetchProfiles();
  for (const key of candidates) {
    const profile = normalizeProfile(profiles[key], key);
    if (profile) return profile;
  }

  // Backward-compatible fallback while coverage is expanded. This still uses the
  // older separate frost/GDD maps, so profile coverage should be expanded for
  // important locations instead of relying on this path long term.
  const frost = await lookupFrost(rawInput);
  if (!frost) return null;

  const stationId = await lookupStationId(rawInput);
  return {
    ...frost,
    stationId,
    gddStationId: stationId,
    climateProfileSource: _profileLoadError ? "fallback-profile-load-failed" : "fallback-separate-maps",
    confidence: stationId ? "fallback" : "missing-gdd-station"
  };
}
