const baseGddStations = require("./gddStations.json");
const cities = require("./cities.json");
const cityStationOverrides = require("./_lib/cityStationOverrides");
const stationSeriesAliases = require("./_lib/stationSeriesAliases");
const plannerStationCoverageGroups = require("./_lib/plannerStationCoverageGroups");

// Canadian postal codes do not use D, F, I, O, Q, or U. W and Z can appear in
// later positions, so include them for compact FSA range expansion such as T5*.
const CANADIAN_POSTAL_SUFFIX_LETTERS = "ABCEGHJKLMNPRSTVWXYZ";

function normalizePlannerKeys(rawKey) {
  const compact = String(rawKey || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return [];

  const keys = [compact];

  // Canadian postal code -> FSA, or FSA stays as-is.
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)) {
    keys.push(compact.slice(0, 3));
  } else if (/^[A-Z]\d[A-Z]$/.test(compact)) {
    keys.push(compact);
  }

  // US ZIP -> ZIP3 fallback remains available in the base map.
  if (/^\d{5}$/.test(compact)) {
    keys.push(compact.slice(0, 3));
  }

  return [...new Set(keys)];
}

function normalizeCityKey(rawKey) {
  return String(rawKey || "").trim().toLowerCase();
}

function getCityOverrideStation(city) {
  if (!city) return null;
  const cityKey = String(city.key || "");
  const override =
    cityStationOverrides[cityKey] ||
    cityStationOverrides[cityKey.toLowerCase()] ||
    city.gddStationId ||
    null;

  if (!override) return null;
  return stationSeriesAliases[override] || override;
}

function buildCityIndex(citiesList) {
  const byKey = new Map();
  for (const city of citiesList || []) {
    if (!city || !city.key) continue;
    byKey.set(normalizeCityKey(city.key), city);
  }
  return byKey;
}

function expandFsaRange(prefix) {
  const compact = String(prefix || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]\d$/.test(compact)) return [];
  return CANADIAN_POSTAL_SUFFIX_LETTERS.split("").map((suffix) => `${compact}${suffix}`);
}

function expandCoverageGroupKeys(group) {
  const keys = [];

  for (const key of group.keys || []) {
    keys.push(...normalizePlannerKeys(key));
  }

  for (const range of group.fsaRanges || []) {
    keys.push(...expandFsaRange(range));
  }

  return [...new Set(keys)];
}

function getCoverageGroupStation(group, cityIndex) {
  if (group.stationId) {
    return stationSeriesAliases[group.stationId] || group.stationId;
  }

  if (!group.cityKey) return null;
  const city = cityIndex.get(normalizeCityKey(group.cityKey));
  return getCityOverrideStation(city);
}

module.exports = function plannerGddStations() {
  const map = { ...baseGddStations };
  const cityIndex = buildCityIndex(cities);

  // Layer 1: publish exact crop-city lookup keys into the planner map. This
  // fixes known city keys such as V2T -> Abbotsford A.
  for (const city of cities) {
    if (!city || !city.lookupKey) continue;

    const stationId = getCityOverrideStation(city);
    if (!stationId) continue;

    for (const key of normalizePlannerKeys(city.lookupKey)) {
      map[key] = stationId;
    }
  }

  // Layer 2: apply compact planner-only coverage groups. These are intentionally
  // last so they can correct nearby postal prefixes that are not exact city page
  // lookup keys, such as Edmonton T5*/T6* or Abbotsford V2S/V3G.
  for (const group of plannerStationCoverageGroups || []) {
    const stationId = getCoverageGroupStation(group, cityIndex);
    if (!stationId) continue;

    for (const key of expandCoverageGroupKeys(group)) {
      map[key] = stationId;
    }
  }

  return map;
};
