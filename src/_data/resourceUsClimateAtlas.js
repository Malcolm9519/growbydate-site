const cities = require("./cities.json");
const frostDateReference = require("./frostDateReference");
const gddReference = require("./gddReference");

const UPDATED = "2026-06-05";

const EXCLUDED_MAP_STATE_KEYS = new Set(["alaska"]);

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function median(values) {
  const clean = values
    .map(numberOrNull)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!clean.length) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : Math.round((clean[mid - 1] + clean[mid]) / 2);
}

function frostSeasonBand(days) {
  const value = numberOrNull(days);
  if (value == null) return { label: "Unknown", className: "unknown" };
  if (value < 100) return { label: "Very short", className: "very-short" };
  if (value < 130) return { label: "Short", className: "short" };
  if (value < 160) return { label: "Moderate", className: "moderate" };
  if (value < 190) return { label: "Long", className: "long" };
  return { label: "Very long", className: "very-long" };
}

function gddBand(gdd) {
  const value = numberOrNull(gdd);
  if (value == null) return { label: "Unknown", className: "unknown" };
  if (value < 1000) return { label: "Very cool", className: "very-cool" };
  if (value < 1500) return { label: "Cool", className: "cool" };
  if (value < 2000) return { label: "Moderate heat", className: "moderate" };
  if (value < 2500) return { label: "Warm", className: "warm" };
  return { label: "High heat", className: "high-heat" };
}

function quadrant(row, frostMedian, gddMedian) {
  const days = numberOrNull(row.frostFreeDays);
  const gdd = numberOrNull(row.gddBase50);
  if (days == null || gdd == null) return "Incomplete data";
  const longSeason = days >= frostMedian;
  const warmSeason = gdd >= gddMedian;
  if (longSeason && warmSeason) return "Long + warm";
  if (longSeason && !warmSeason) return "Long + cool";
  if (!longSeason && warmSeason) return "Short + warm";
  return "Short + cool";
}

function cityPointUrl(city) {
  return `/planting-dates/${city.country === "canada" ? "canada/" : ""}${city.regionKey}/${city.key}/`;
}

function pct(value, min, max, invert = false) {
  const n = numberOrNull(value);
  if (n == null || !Number.isFinite(min) || !Number.isFinite(max) || max === min) return 50;
  const raw = ((n - min) / (max - min)) * 100;
  const clamped = Math.max(0, Math.min(100, raw));
  return Math.round((invert ? 100 - clamped : clamped) * 10) / 10;
}

function chartedRows(rows) {
  const latValues = rows.map((row) => row.lat).filter(Number.isFinite);
  const lonValues = rows.map((row) => row.lon).filter(Number.isFinite);
  const frostValues = rows.map((row) => row.frostFreeDays).filter(Number.isFinite);
  const gddValues = rows.map((row) => row.gddBase50).filter(Number.isFinite);
  const latMin = Math.min(...latValues);
  const latMax = Math.max(...latValues);
  const lonMin = Math.min(...lonValues);
  const lonMax = Math.max(...lonValues);
  const frostMin = Math.min(...frostValues);
  const frostMax = Math.max(...frostValues);
  const gddMin = Math.min(...gddValues);
  const gddMax = Math.max(...gddValues);
  const mapLeft = 7;
  const mapRight = 97;
  const mapTop = 18;
  const mapBottom = 88;

  return rows.map((row) => ({
    ...row,
    mapX: mapLeft + (pct(row.lon, lonMin, lonMax) / 100) * (mapRight - mapLeft),
    mapY: mapTop + (pct(row.lat, latMin, latMax, true) / 100) * (mapBottom - mapTop),
    scatterX: pct(row.frostFreeDays, frostMin, frostMax),
    scatterY: pct(row.gddBase50, gddMin, gddMax, true)
  }));
}

function stateSummaries(rows) {
  const byRegion = new Map();
  for (const row of rows) {
    const key = row.regionKey || row.regionName;
    if (!byRegion.has(key)) {
      byRegion.set(key, {
        regionKey: row.regionKey,
        regionName: row.regionName,
        regionAbbr: row.regionAbbr,
        rows: []
      });
    }
    byRegion.get(key).rows.push(row);
  }

  return Array.from(byRegion.values())
    .map((group) => ({
      regionKey: group.regionKey,
      regionName: group.regionName,
      regionAbbr: group.regionAbbr,
      cityCount: group.rows.length,
      medianFrostFreeDays: median(group.rows.map((row) => row.frostFreeDays)),
      medianGddBase50: median(group.rows.map((row) => row.gddBase50)),
      longestSeasonCity: [...group.rows].sort((a, b) => (b.frostFreeDays || 0) - (a.frostFreeDays || 0))[0] || null,
      highestGddCity: [...group.rows].sort((a, b) => (b.gddBase50 || 0) - (a.gddBase50 || 0))[0] || null
    }))
    .sort((a, b) => a.regionName.localeCompare(b.regionName));
}

const SCATTER_LABELS = {
  anchorage: { dx: 12, dy: 0, note: "Short, cool northern example" },
  seattle: { dx: 12, dy: -16, note: "Longer outdoor window with modest heat" },
  denver: { dx: 12, dy: -16, note: "High-elevation season pressure" },
  minneapolis: { dx: 12, dy: 18, note: "Compressed northern Midwest season" },
  "kansas-city-mo": { dx: 12, dy: -18, note: "Warmer inland crop heat" },
  "st-louis": { dx: 12, dy: -10, note: "Longer, warmer Midwest example" },
  boston: { dx: 12, dy: 0, note: "Coastal Northeast comparison" },
  boise: { dx: 12, dy: 16, note: "Interior Northwest heat" }
};

const MAP_LABEL_KEYS = {
  anchorage: { dx: 10, dy: 12 },
  seattle: { dx: 10, dy: -12 },
  "portland-or": { dx: 10, dy: 12 },
  denver: { dx: 10, dy: -12 },
  minneapolis: { dx: 10, dy: -12 },
  "st-louis": { dx: 10, dy: 12 },
  detroit: { dx: 10, dy: -14 },
  boston: { dx: 10, dy: -12 }
};

const ATLAS_STATE_GUIDES = [
  { label: "AK", x: 8, y: 20 },
  { label: "PNW", x: 35, y: 42 },
  { label: "Rockies", x: 48, y: 48 },
  { label: "Plains", x: 61, y: 58 },
  { label: "Great Lakes", x: 75, y: 50 },
  { label: "Northeast", x: 91, y: 47 }
];

const ATLAS_GUIDE_LINES = [31, 43, 55, 68, 82];

const ATLAS_NORTH_LABELS = [
  { label: "Northern U.S. coverage", x: 55, y: 18 }
];

module.exports = function () {
  const frostByKey = new Map(frostDateReference().cityRecords.map((record) => [record.cityKey, record]));
  const gddByKey = new Map(gddReference().cityRecords.map((record) => [record.cityKey, record]));

  const joined = cities
    .map((city) => {
      const frost = frostByKey.get(city.key);
      const gdd = gddByKey.get(city.key);
      if (!frost || !gdd) return null;
      const frostBand = frostSeasonBand(frost.frostFreeDays);
      const heatBand = gddBand(gdd.gddBase50);
      return {
        cityKey: city.key,
        cityName: city.name,
        regionName: city.regionName,
        regionAbbr: city.regionAbbr,
        regionKey: city.regionKey,
        country: city.country,
        countryLabel: city.country === "canada" ? "Canada" : "United States",
        lat: numberOrNull(city.lat),
        lon: numberOrNull(city.lon),
        cityUrl: frost.cityUrl || gdd.cityUrl || cityPointUrl(city),
        frostFreeDays: numberOrNull(frost.frostFreeDays),
        lastFrostLabel: frost.lastFrostLabel,
        firstFrostLabel: frost.firstFrostLabel,
        gddBase40: numberOrNull(gdd.gddBase40),
        gddBase45: numberOrNull(gdd.gddBase45),
        gddBase50: numberOrNull(gdd.gddBase50),
        frostBand: frostBand.label,
        frostBandClass: frostBand.className,
        gddBand: heatBand.label,
        gddBandClass: heatBand.className
      };
    })
    .filter(Boolean);

  const allCities = chartedRows(joined);
  const usCities = chartedRows(allCities.filter((row) => row.country === "usa" && !EXCLUDED_MAP_STATE_KEYS.has(row.regionKey)));
  const frostMedian = median(usCities.map((row) => row.frostFreeDays));
  const gddMedian = median(usCities.map((row) => row.gddBase50));
  const labelKeys = new Set(Object.keys(SCATTER_LABELS));
  const usWithQuadrants = usCities.map((row) => ({
    ...row,
    isHighlighted: labelKeys.has(row.cityKey),
    quadrant: quadrant(row, frostMedian, gddMedian)
  }));

  const scatterLabelCities = usWithQuadrants
    .filter((row) => labelKeys.has(row.cityKey))
    .map((row) => ({
      ...row,
      labelDx: SCATTER_LABELS[row.cityKey].dx,
      labelDy: SCATTER_LABELS[row.cityKey].dy,
      note: SCATTER_LABELS[row.cityKey].note
    }));

  const mapLabelCities = usWithQuadrants
    .filter((row) => MAP_LABEL_KEYS[row.cityKey])
    .map((row) => ({
      ...row,
      labelDx: MAP_LABEL_KEYS[row.cityKey].dx,
      labelDy: MAP_LABEL_KEYS[row.cityKey].dy
    }));

  return {
    updated: UPDATED,
    allCities,
    usCities: usWithQuadrants,
    totalUsCities: usWithQuadrants.length,
    totalUsStates: new Set(usWithQuadrants.map((row) => row.regionAbbr)).size,
    medianFrostFreeDays: frostMedian,
    medianGddBase50: gddMedian,
    longestSeasons: [...usWithQuadrants]
      .filter((row) => Number.isFinite(row.frostFreeDays))
      .sort((a, b) => b.frostFreeDays - a.frostFreeDays)
      .slice(0, 10),
    shortestSeasons: [...usWithQuadrants]
      .filter((row) => Number.isFinite(row.frostFreeDays))
      .sort((a, b) => a.frostFreeDays - b.frostFreeDays)
      .slice(0, 10),
    highestGdd: [...usWithQuadrants]
      .filter((row) => Number.isFinite(row.gddBase50))
      .sort((a, b) => b.gddBase50 - a.gddBase50)
      .slice(0, 10),
    lowestGdd: [...usWithQuadrants]
      .filter((row) => Number.isFinite(row.gddBase50))
      .sort((a, b) => a.gddBase50 - b.gddBase50)
      .slice(0, 10),
    stateSummaries: stateSummaries(usWithQuadrants),
    mapLabelCities,
    atlasProvinceGuides: ATLAS_STATE_GUIDES,
    atlasGuideLines: ATLAS_GUIDE_LINES,
    atlasNorthLabels: ATLAS_NORTH_LABELS,
    scatterLabelCities,
    exampleCities: scatterLabelCities.slice(0, 8),
    frostBands: [
      { label: "Very short", range: "Under 100 days", className: "very-short" },
      { label: "Short", range: "100–129 days", className: "short" },
      { label: "Moderate", range: "130–159 days", className: "moderate" },
      { label: "Long", range: "160–189 days", className: "long" },
      { label: "Very long", range: "190+ days", className: "very-long" }
    ],
    gddBands: [
      { label: "Very cool", range: "Under 1,000 base-50 GDD", className: "very-cool" },
      { label: "Cool", range: "1,000–1,499", className: "cool" },
      { label: "Moderate heat", range: "1,500–1,999", className: "moderate" },
      { label: "Warm", range: "2,000–2,499", className: "warm" },
      { label: "High heat", range: "2,500+", className: "high-heat" }
    ],
    scatterQuadrants: [
      { label: "Long + warm", meaning: "More outdoor time and more seasonal crop heat." },
      { label: "Long + cool", meaning: "A wide frost-free window, but slower heat accumulation." },
      { label: "Short + warm", meaning: "A compressed season with stronger summer heat." },
      { label: "Short + cool", meaning: "The tightest pattern for heat-loving crops." }
    ]
  };
};
