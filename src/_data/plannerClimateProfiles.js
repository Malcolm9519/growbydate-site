const frostDates = require("./frostDates.json");
const cities = require("./cities.json");
const cityStationOverrides = require("./_lib/cityStationOverrides");
const stationSeriesAliases = require("./_lib/stationSeriesAliases");
const plannerClimateCoverageGroups = require("./_lib/plannerClimateCoverageGroups");
const buildPlannerGddStations = require("./plannerGddStations");

const CANADIAN_POSTAL_SUFFIX_LETTERS = "ABCEGHJKLMNPRSTVWXYZ";

function normalizeKey(rawKey) {
  const compact = String(rawKey || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return "";

  // Full Canadian postal code -> FSA.
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)) return compact.slice(0, 3);

  // Canadian FSA.
  if (/^[A-Z]\d[A-Z]$/.test(compact)) return compact;

  // US ZIP / ZIP+4 -> ZIP5. Existing ZIP3 fallback is handled separately.
  if (/^\d/.test(compact)) return compact.replace(/\D+/g, "").slice(0, 5);

  return compact;
}

function lookupCandidates(rawKey) {
  const key = normalizeKey(rawKey);
  if (!key) return [];
  const out = [key];
  if (/^\d{5}$/.test(key)) out.push(key.slice(0, 3));
  return [...new Set(out)];
}

function normalizeCityKey(rawKey) {
  return String(rawKey || "").trim().toLowerCase();
}

function expandFsaRange(prefix) {
  const compact = String(prefix || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]\d$/.test(compact)) return [];
  return CANADIAN_POSTAL_SUFFIX_LETTERS.split("").map((suffix) => `${compact}${suffix}`);
}

function expandCoverageGroupKeys(group) {
  const keys = [];

  for (const key of group.keys || []) {
    keys.push(...lookupCandidates(key));
  }

  for (const range of group.fsaRanges || []) {
    keys.push(...expandFsaRange(range));
  }

  return [...new Set(keys)];
}

function buildCityIndex(citiesList) {
  const byKey = new Map();
  for (const city of citiesList || []) {
    if (!city || !city.key) continue;
    byKey.set(normalizeCityKey(city.key), city);
  }
  return byKey;
}

function buildFrostIndex(rows) {
  const byKey = new Map();
  for (const row of rows || []) {
    const key = normalizeKey(row && row.key);
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, row);
  }
  return byKey;
}

function getCityStation(city) {
  if (!city) return "";
  const cityKey = String(city.key || "");
  const stationId =
    cityStationOverrides[cityKey] ||
    cityStationOverrides[cityKey.toLowerCase()] ||
    city.gddStationId ||
    "";

  return stationId ? (stationSeriesAliases[stationId] || stationId) : "";
}

function getGroupStation(group, cityIndex) {
  if (group.stationId) return stationSeriesAliases[group.stationId] || group.stationId;
  if (!group.cityKey) return "";
  return getCityStation(cityIndex.get(normalizeCityKey(group.cityKey)));
}

function getGroupAnchorFrost(group, cityIndex, frostIndex) {
  const city = group.cityKey ? cityIndex.get(normalizeCityKey(group.cityKey)) : null;
  const frostKey = group.frostKey || city?.lookupKey || "";

  for (const key of lookupCandidates(frostKey)) {
    const row = frostIndex.get(key);
    if (row) return row;
  }

  return null;
}

function countryCodeForCity(city) {
  const country = String(city?.country || "").trim().toLowerCase();
  if (country === "canada") return "CA";
  if (country === "united-states" || country === "united states" || country === "usa") return "US";
  return String(city?.country || "").trim().toUpperCase();
}

function getGroupIdentity(group, cityIndex) {
  const city = group.cityKey ? cityIndex.get(normalizeCityKey(group.cityKey)) : null;
  return {
    name: group.name || city?.name || "",
    region: group.region || city?.regionAbbr || city?.region || "",
    country: group.country || countryCodeForCity(city) || ""
  };
}

function buildProfile(key, frostRow, stationId, source, confidence, matchedFrostKey, identity = {}) {
  if (!key || !frostRow || !stationId) return null;

  return {
    key,
    name: identity.name || frostRow.name || "",
    region: identity.region || frostRow.region || "",
    country: identity.country || frostRow.country || "",
    lastFrost: frostRow.lastFrost || "",
    firstFrost: frostRow.firstFrost || "",
    sourceLabel: frostRow.sourceLabel || "",
    gddStationId: stationId,
    stationId,
    matchedFrostKey: matchedFrostKey || normalizeKey(frostRow.key) || key,
    climateProfileSource: source || "base",
    confidence: confidence || "mapped"
  };
}

module.exports = function plannerClimateProfiles() {
  const plannerGddStations = buildPlannerGddStations();
  const cityIndex = buildCityIndex(cities);
  const frostIndex = buildFrostIndex(frostDates);
  const profiles = {};

  // Layer 1: all existing frost keys get a unified profile using the planner's
  // corrected GDD station map. This keeps random user input on one lookup path.
  for (const row of frostDates || []) {
    const key = normalizeKey(row && row.key);
    if (!key) continue;

    let stationId = "";
    for (const candidate of lookupCandidates(key)) {
      if (plannerGddStations[candidate]) {
        stationId = String(plannerGddStations[candidate]);
        break;
      }
    }

    if (!stationId) continue;
    profiles[key] = buildProfile(key, row, stationId, "base-frost-plus-planner-gdd", "mapped", key);
  }

  // Layer 2: exact crop-city lookup keys use the same curated city station as
  // crop-city pages. This is mostly redundant with plannerGddStations, but keeps
  // the profile file explicit and easier to QA.
  for (const city of cities || []) {
    if (!city || !city.lookupKey) continue;
    const stationId = getCityStation(city);
    if (!stationId) continue;

    const anchorFrost = getGroupAnchorFrost({ frostKey: city.lookupKey }, cityIndex, frostIndex);
    if (!anchorFrost) continue;

    for (const key of lookupCandidates(city.lookupKey)) {
      profiles[key] = buildProfile(key, anchorFrost, stationId, "city-lookup-key", "high", normalizeKey(anchorFrost.key));
    }
  }

  // Layer 3: curated coverage groups. These groups intentionally override the
  // whole displayed climate profile, not just the GDD station. That keeps the
  // planner from creating a partial mix such as "Abbotsford frost identity +
  // Chilliwack GDD station" when a base FSA frost row is too broad.
  for (const group of plannerClimateCoverageGroups || []) {
    const stationId = getGroupStation(group, cityIndex);
    if (!stationId) continue;

    const anchorFrost = getGroupAnchorFrost(group, cityIndex, frostIndex);
    if (!anchorFrost) continue;

    const identity = getGroupIdentity(group, cityIndex);
    const matchedFrostKey = normalizeKey(anchorFrost.key);

    for (const key of expandCoverageGroupKeys(group)) {
      profiles[key] = buildProfile(
        key,
        anchorFrost,
        stationId,
        "coverage-group",
        group.confidence || "curated",
        matchedFrostKey,
        identity
      );
    }
  }

  return profiles;
};
