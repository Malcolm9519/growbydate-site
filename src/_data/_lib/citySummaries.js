const frostDates = require("../frostDates.json");
const gddStations = require("../gddStations.json");
const gddCrops = require("../gddCrops.json");
const stationsMeta = require("../stationsMeta.json");
const stationSeriesAliases = require("./stationSeriesAliases");

const CITY_STATION_OVERRIDES = {
};

function pickBestSeriesStationForCity(city, preferredStationMeta) {
  const originLat =
    preferredStationMeta && preferredStationMeta.lat != null
      ? preferredStationMeta.lat
      : city.lat;

  const originLon =
    preferredStationMeta && preferredStationMeta.lon != null
      ? preferredStationMeta.lon
      : city.lon;

  if (originLat == null || originLon == null) {
    return lookupStationId(city.lookupKey);
  }

  let bestStation = null;
  let bestScore = Infinity;

  const cityName = normalizeName(city.name || "");
  const firstWord = cityName.split(" ")[0] || "";

  for (const [stationId, meta] of Object.entries(stationsMeta)) {
    if (!meta || meta.lat == null || meta.lon == null) continue;

    const series = getStationSeries(stationId);
    if (!series) continue;

    const dist = haversineKm(originLat, originLon, meta.lat, meta.lon);
    if (dist > 60) continue;

    const stationName = normalizeName(meta.name || "");
    const exactNameMatch = cityName && stationName.includes(cityName);
    const firstWordMatch = firstWord && stationName.includes(firstWord);

    let score = dist;

    if (exactNameMatch) score -= 25;
    else if (firstWordMatch) score -= 10;

    if (score < bestScore) {
      bestScore = score;
      bestStation = stationId;
    }
  }

  return bestStation || lookupStationId(city.lookupKey);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickBestMetadataStationForCity(city) {
  if (!city.lat || !city.lon) {
    return lookupStationId(city.lookupKey);
  }

  const cityName = normalizeName(city.name);

  let bestStation = null;
  let bestDistance = Infinity;

  for (const [stationId, meta] of Object.entries(stationsMeta)) {
    if (!meta || meta.lat == null || meta.lon == null) continue;

    const dist = haversineKm(city.lat, city.lon, meta.lat, meta.lon);
    if (dist > 80) continue;

    const stationName = normalizeName(meta.name || "");
    const exactNameMatch = stationName.includes(cityName);

    let score = dist;
    if (exactNameMatch) score -= 15;

    if (score < bestDistance) {
      bestDistance = score;
      bestStation = stationId;
    }
  }

  return bestStation || null;
}

function resolveSeriesStation(preferredStationId, city) {
  if (!preferredStationId) return null;
  if (stationSeriesAliases[preferredStationId]) {
  return stationSeriesAliases[preferredStationId];
}

  if (getStationSeries(preferredStationId)) {
    return preferredStationId;
  }

  const preferredMeta = stationsMeta[preferredStationId];
  if (!preferredMeta || preferredMeta.lat == null || preferredMeta.lon == null) {
    return lookupStationId(city.lookupKey);
  }

  const cityName = normalizeName(city.name);
  const firstWord = cityName.split(" ")[0];

  let strictBestStation = null;
  let strictBestDistance = Infinity;

  let looseBestStation = null;
  let looseBestDistance = Infinity;

  for (const [stationId, meta] of Object.entries(stationsMeta)) {
    if (!meta || meta.lat == null || meta.lon == null) continue;

    const series = getStationSeries(stationId);
    if (!series) continue;

    const stationName = normalizeName(meta.name);
    const dist = haversineKm(
      preferredMeta.lat,
      preferredMeta.lon,
      meta.lat,
      meta.lon
    );

    const sameCityName =
      stationName.includes(cityName) ||
      (firstWord && stationName.includes(firstWord));

    // Strict pass: same-city-ish name and nearby
    if (sameCityName && dist <= 80) {
      if (dist < strictBestDistance) {
        strictBestDistance = dist;
        strictBestStation = stationId;
      }
    }

    // Loose pass: nearby only
    if (dist <= 35) {
      if (dist < looseBestDistance) {
        looseBestDistance = dist;
        looseBestStation = stationId;
      }
    }
  }

  if (strictBestStation) return strictBestStation;
  if (looseBestStation) return looseBestStation;

  return lookupStationId(city.lookupKey);
}

function mmddToDayOfYear(mmdd) {
  if (!mmdd || typeof mmdd !== "string") return null;
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;

  const mdays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > mdays[month - 1]) return null;

  let doy = 0;
  for (let i = 0; i < month - 1; i++) doy += mdays[i];
  doy += day;
  return doy;
}

function dayOfYearToMmdd(doy) {
  if (!Number.isFinite(doy)) return null;
  const mdays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let d = Math.max(1, Math.min(365, Math.round(doy)));

  let month = 1;
  while (month <= 12) {
    const max = mdays[month - 1];
    if (d <= max) break;
    d -= max;
    month++;
  }

  return `${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function medianNumber(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const a = nums.slice().sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function normalizeCandidates(rawKey) {
  const s = String(rawKey || "").trim().toUpperCase();
  if (!s) return [];

  const out = [s];

  // Canadian FSA fallback: T2P1J9 -> T2P
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(s.replace(/\s+/g, ""))) {
    out.push(s.replace(/\s+/g, "").slice(0, 3));
  } else if (/^[A-Z]\d[A-Z]/.test(s)) {
    out.push(s.slice(0, 3));
  }

  // US ZIP fallback: 55401 -> 554
  if (/^\d{5}$/.test(s)) out.push(s.slice(0, 3));

  return [...new Set(out)];
}

function lookupStationId(rawKey) {
  const candidates = normalizeCandidates(rawKey);
  for (const c of candidates) {
    if (gddStations[c]) return String(gddStations[c]);
  }
  return null;
}

// Cache so we don’t repeatedly require the same files
const stationSeriesCache = new Map();

function getStationSeries(stationId) {
  if (stationSeriesCache.has(stationId)) {
    return stationSeriesCache.get(stationId);
  }

  let data = null;

  try {
    data = require(`../../assets/data/gdd-stations/${stationId}.json`);
  } catch {
    data = null;
  }

  stationSeriesCache.set(stationId, data);
  return data;
}

function getRemainingFromCurve(curve, base, mmdd) {
  if (!curve) return null;
  const b = String(base);

  if (curve?.remaining?.[b]?.[mmdd] != null) return curve.remaining[b][mmdd];
  if (curve?.remainingByBase?.[b]?.[mmdd] != null) return curve.remainingByBase[b][mmdd];
  if (curve?.remainingGddByBase?.[b]?.[mmdd] != null) return curve.remainingGddByBase[b][mmdd];

  const series = curve?.bases?.[b];
  const doy = mmddToDayOfYear(mmdd);
  if (Array.isArray(series) && Number.isFinite(doy) && series.length >= doy) {
    const last = series[series.length - 1];
    const at = series[doy - 1];
    if (Number.isFinite(last) && Number.isFinite(at)) {
      return Math.round(last - at);
    }
  }

  return null;
}

function buildCropGddIndex(data) {
  const idx = {};
  if (!data) return idx;

  if (Array.isArray(data)) {
    for (const row of data) {
      const key = String(row.slug || row.key || row.crop || row.name || "")
        .trim()
        .toLowerCase();
      if (!key) continue;
      const gdd =
        row.gdd50 ??
        row.gdd_base50 ??
        row.gdd ??
        row.gddRequired ??
        row.gdd_required ??
        null;
      if (Number.isFinite(gdd)) idx[key] = gdd;
    }
  }

  return idx;
}

const DEFAULT_PLANTING_RULES = [
  { key: "peas", label: "Peas", offsetDays: -21, windowDays: 14, method: "direct sow" },
  { key: "spinach", label: "Spinach", offsetDays: -21, windowDays: 14, method: "direct sow" },
  { key: "lettuce", label: "Lettuce", offsetDays: -14, windowDays: 14, method: "direct sow / transplant" },
  { key: "carrots", label: "Carrots", offsetDays: -14, windowDays: 14, method: "direct sow" },
  { key: "beets", label: "Beets", offsetDays: -14, windowDays: 14, method: "direct sow" },
  { key: "potatoes", label: "Potatoes", offsetDays: -7, windowDays: 14, method: "plant seed potatoes" },
  { key: "beans", label: "Beans", offsetDays: 7, windowDays: 14, method: "direct sow" },
  { key: "corn", label: "Sweet corn", offsetDays: 10, windowDays: 10, method: "direct sow" },
  { key: "cucumbers", label: "Cucumbers", offsetDays: 14, windowDays: 10, method: "direct sow / transplant" },
  { key: "squash", label: "Squash", offsetDays: 14, windowDays: 10, method: "direct sow / transplant" },
  { key: "tomatoes", label: "Tomatoes", offsetDays: 14, windowDays: 10, method: "transplant" },
  { key: "peppers", label: "Peppers", offsetDays: 21, windowDays: 10, method: "transplant" }
];

function nextCheckpointDate(mmdd, checkpoints) {
  const d = mmddToDayOfYear(mmdd);
  if (!Number.isFinite(d)) return null;

  for (const c of checkpoints) {
    const cd = mmddToDayOfYear(c);
    if (Number.isFinite(cd) && cd >= d) return c;
  }
  return checkpoints.length ? checkpoints[checkpoints.length - 1] : null;
}

function computePlantingWindows(summary, checkDates) {
  const spring = summary?.season?.frost?.spring?.p50;
  if (!spring) return null;

  const cropGddIndex = buildCropGddIndex(gddCrops);
  const remaining = summary?.season?.gdd?.remaining || {};
  const checkpoints = (checkDates || Object.keys(remaining)).slice().sort();

  const out = [];

  for (const rule of DEFAULT_PLANTING_RULES) {
    const springDoy = mmddToDayOfYear(spring);
    if (!Number.isFinite(springDoy)) continue;

    const center = dayOfYearToMmdd(springDoy + rule.offsetDays);
    const half = Math.floor((rule.windowDays || 14) / 2);

    const centerDoy = mmddToDayOfYear(center);
    const start = dayOfYearToMmdd(centerDoy - half);
    const end = dayOfYearToMmdd(centerDoy + half);

    const cp = nextCheckpointDate(start, checkpoints);
    const remainingAtCp = cp ? remaining[cp] : null;
    const required = cropGddIndex[String(rule.key).toLowerCase()] ?? null;

    let fit = null;
    if (Number.isFinite(required) && Number.isFinite(remainingAtCp)) {
      if (remainingAtCp >= required * 1.1) fit = "good";
      else if (remainingAtCp >= required * 0.9) fit = "tight";
      else fit = "hard";
    }

    out.push({
      key: rule.key,
      label: rule.label,
      method: rule.method,
      start,
      end,
      fit,
      checkpoint: cp || null,
      remainingAtCheckpoint: Number.isFinite(remainingAtCp) ? remainingAtCp : null,
      requiredGdd50: Number.isFinite(required) ? required : null
    });
  }

  return out;
}

function getRowValue(rows, mmdd) {
  if (!Array.isArray(rows)) return null;
  const row = rows.find((r) => r.date === mmdd);
  return row && Number.isFinite(row.gdd) ? row.gdd : null;
}

function buildCityCropFit(
  summary,
  dates = [
    "03-15",
    "04-01",
    "04-15",
    "05-01",
    "05-15",
    "06-01",
    "06-15",
    "07-01",
    "07-15",
    "08-01",
    "08-15"
  ],
  marginPct = 0.15
) {
  if (!Array.isArray(gddCrops) || !gddCrops.length) return null;

  const out = {
    meta: { marginPct, dates, bases: [40, 45, 50], sitemapOnly: false },
    byDate: {}
  };

  for (const mmdd of dates) {
    const runwayByBase = {
      "50": getRowValue(summary.gdd_remaining_by_base?.["50"], mmdd),
      "45": getRowValue(summary.gdd_remaining_by_base?.["45"], mmdd),
      "40": getRowValue(summary.gdd_remaining_by_base?.["40"], mmdd)
    };

    let reliable = [];
    let possible = [];

    for (const c of gddCrops) {
      const base = Number(c?.base_f ?? c?.base ?? 50);
      const req = Number(c?.gdd_required ?? c?.gddRequired ?? c?.gdd50 ?? c?.gdd);
      if (!Number.isFinite(base) || !Number.isFinite(req)) continue;

      const runway = runwayByBase[String(base)];
      if (!Number.isFinite(runway)) continue;

      const safeRunway = Math.max(0, Math.floor(runway * (1 - marginPct)));

      const slug = String(c?.slug || c?.key || c?.name || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      const item = {
        slug,
        name: String(c?.name || slug),
        href: `/crops/${slug}/`,
        base,
        gddRequired: req,
        category: String(c?.category || "")
      };

      if (req <= safeRunway) reliable.push(item);
      else if (req <= runway) possible.push(item);
    }

    out.byDate[mmdd] = { runwayByBase, reliable, possible };
  }

  return out;
}

function buildCitySummaries(cities) {
  const checkDates = [
    "03-15",
    "04-01",
    "04-15",
    "05-01",
    "05-15",
    "06-01",
    "06-15",
    "07-01",
    "07-15",
    "08-01",
    "08-15"
  ];

  return cities.map((city) => {
    const frostKey = String(city.lookupKey || "").trim().toUpperCase();

    const frostRow = frostDates.find(
      (r) => String(r.key || "").trim().toUpperCase() === frostKey
    );

    const springMedian = mmddToDayOfYear(frostRow && frostRow.lastFrost);
    const fallMedian = mmddToDayOfYear(frostRow && frostRow.firstFrost);

const earliestFall = null;
const latestFall = null;

const preferredStationId =
  CITY_STATION_OVERRIDES[city.key] || pickBestMetadataStationForCity(city);

const preferredStationMeta = preferredStationId
  ? stationsMeta[preferredStationId] || null
  : null;

// ✅ THIS is the key change
const stationId = resolveSeriesStation(preferredStationId, city);

const curve = stationId ? getStationSeries(stationId) : null;

const stationMeta = stationId
  ? stationsMeta[stationId] || null
  : null;
  
  const gdd50 = checkDates.map((d) => ({ date: d, base: 50, gdd: getRemainingFromCurve(curve, 50, d) }));
    const gdd45 = checkDates.map((d) => ({ date: d, base: 45, gdd: getRemainingFromCurve(curve, 45, d) }));
    const gdd40 = checkDates.map((d) => ({ date: d, base: 40, gdd: getRemainingFromCurve(curve, 40, d) }));

    const remainingMap50 = Object.fromEntries(
      gdd50.map((r) => [r.date, Number.isFinite(r.gdd) ? r.gdd : null])
    );

    const frostFreeDays_p50 =
      Number.isFinite(springMedian) && Number.isFinite(fallMedian) && fallMedian > springMedian
        ? Math.round(fallMedian - springMedian)
        : null;

    const fallSpreadDays50 =
      Number.isFinite(earliestFall) && Number.isFinite(latestFall) && latestFall >= earliestFall
        ? Math.round(latestFall - earliestFall)
        : null;

const summary = {
  key: city.key,
  name: city.name,
  country: city.country,
  regionKind: city.regionKind,
  regionAbbr: city.regionAbbr,
  regionKey: city.regionKey,
  regionName: city.regionName,
  abbr: city.regionAbbr,

  lookupKey: city.lookupKey || null,

  preferredStationId: preferredStationId || null,
  preferredStationName:
    preferredStationMeta && preferredStationMeta.name
      ? preferredStationMeta.name
      : null,
  preferredStationLat:
    preferredStationMeta && preferredStationMeta.lat != null
      ? preferredStationMeta.lat
      : null,
  preferredStationLon:
    preferredStationMeta && preferredStationMeta.lon != null
      ? preferredStationMeta.lon
      : null,

  gddStationId: stationId || null,
  stationName:
    stationMeta && stationMeta.name
      ? stationMeta.name
      : null,
  stationLat:
    stationMeta && stationMeta.lat != null
      ? stationMeta.lat
      : null,
  stationLon:
    stationMeta && stationMeta.lon != null
      ? stationMeta.lon
      : null,

  stationDistanceKm:
    preferredStationMeta &&
    stationMeta &&
    preferredStationMeta.lat != null &&
    preferredStationMeta.lon != null &&
    stationMeta.lat != null &&
    stationMeta.lon != null
      ? Math.round(
          haversineKm(
            preferredStationMeta.lat,
            preferredStationMeta.lon,
            stationMeta.lat,
            stationMeta.lon
          ) * 10
        ) / 10
      : null,

  stationMismatchFlag:
    preferredStationMeta &&
    stationMeta &&
    preferredStationMeta.name &&
    stationMeta.name &&
    normalizeName(preferredStationMeta.name) !== normalizeName(stationMeta.name)
      ? "review"
      : "",

  frost: {
    status: Number.isFinite(fallMedian) ? "normal" : "insufficient_data",
    median50: dayOfYearToMmdd(fallMedian),
    earliest50: dayOfYearToMmdd(earliestFall),
    latest50: dayOfYearToMmdd(latestFall),
    stationCount: frostRow ? 1 : 0
  },

  frost_spring: {
    status: Number.isFinite(springMedian) ? "normal" : "insufficient_data",
    median50: dayOfYearToMmdd(springMedian),
    earliest50: null,
    latest50: null,
    stationCount: frostRow ? 1 : 0
  },

  gdd_remaining: gdd50,
  gdd_remaining_by_base: {
    "50": gdd50,
    "45": gdd45,
    "40": gdd40
  },

  season: {
    base: 50,
    frost: {
      spring: {
        p50: dayOfYearToMmdd(springMedian),
        earliest50: null,
        latest50: null,
        status: Number.isFinite(springMedian) ? "normal" : "insufficient_data"
      },
      fall: {
        p50: dayOfYearToMmdd(fallMedian),
        earliest50: dayOfYearToMmdd(earliestFall),
        latest50: dayOfYearToMmdd(latestFall),
        spreadDays50: fallSpreadDays50,
        status: Number.isFinite(fallMedian) ? "normal" : "insufficient_data"
      }
    },
    derived: {
      frostFreeDays: frostFreeDays_p50,
      frostFreeDays_p50,
      firstFallSpreadDays50: fallSpreadDays50
    }
  },

  cropFit: null
};

    summary.plantingWindows = computePlantingWindows(summary, checkDates);
    summary.cropFit = buildCityCropFit(summary, checkDates);

    return summary;
  });
}

module.exports = { buildCitySummaries };