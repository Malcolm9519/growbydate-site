const frostDates = require("../frostDates.json");
const gddCrops = require("../gddCrops");
const locationContent = require("../locationContent");
const {
  getStationSeries,
  resolveCityStation
} = require("./resolveCityStation");

const CROP_SLUG_ALIASES = {
  tomato: "tomatoes",
  pepper: "peppers",
  cucumber: "cucumbers",
  pea: "peas",
  carrot: "carrots",
  beet: "beets",
  onion: "onions",
  potato: "potatoes",
  pumpkin: "pumpkins",
  radish: "radishes",
  "bean-bush": "beans",
  bean: "beans"
};

function normalizeCuratedContent(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const text = entry.trim();
    return text ? { afterQuickRef: text } : null;
  }

  if (typeof entry !== "object") return null;

  const out = {};

  for (const [key, value] of Object.entries(entry)) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (text) out[key] = text;
  }

  return Object.keys(out).length ? out : null;
}

function canonicalSiteSlug(slug) {
  const s = String(slug || "").trim();
  return CROP_SLUG_ALIASES[s] || s;
}

function cropHrefFromSlug(siteSlug) {
  return `/crops/${String(siteSlug || "").trim()}/`;
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

function getCityMascotKey({ springMedian, frostFreeDays }) {
  if (Number.isFinite(frostFreeDays)) {
    if (frostFreeDays < 125) return "shortSeason";
    if (frostFreeDays >= 180) return "warmSeason";
  }

  if (Number.isFinite(springMedian) && springMedian >= 140) {
    return "coolSpring";
  }

  return "comfortableSeason";
}

function getCityMascotSeed(city) {
  return `${city.regionKey || ""}/${city.key || ""}`;
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
  { key: "radishes", label: "Radishes", offsetDays: -21, windowDays: 14, method: "direct sow" },
  { key: "potatoes", label: "Potatoes", offsetDays: -7, windowDays: 14, method: "plant seed potatoes" },
  { key: "onions", label: "Onions", offsetDays: -14, windowDays: 14, method: "sets / transplants" },
  { key: "garlic", label: "Garlic", offsetDays: -14, windowDays: 10, method: "plant cloves" },
  { key: "broccoli", label: "Broccoli", offsetDays: -7, windowDays: 14, method: "transplant" },
  { key: "cauliflower", label: "Cauliflower", offsetDays: -7, windowDays: 14, method: "transplant" },
  { key: "cabbage", label: "Cabbage", offsetDays: -7, windowDays: 14, method: "transplant" },
  { key: "kale", label: "Kale", offsetDays: -14, windowDays: 21, method: "direct sow / transplant" },
  { key: "swiss-chard", label: "Swiss chard", offsetDays: -10, windowDays: 21, method: "direct sow / transplant" },

  { key: "beans", label: "Beans", offsetDays: 7, windowDays: 14, method: "direct sow" },
  { key: "corn-sweet", label: "Sweet corn", offsetDays: 10, windowDays: 10, method: "direct sow" },
  { key: "cucumbers", label: "Cucumbers", offsetDays: 14, windowDays: 10, method: "direct sow / transplant" },
  { key: "zucchini", label: "Zucchini", offsetDays: 14, windowDays: 10, method: "direct sow / transplant" },
  { key: "squash", label: "Squash", offsetDays: 14, windowDays: 10, method: "direct sow / transplant" },  { key: "tomatoes", label: "Tomatoes", offsetDays: 14, windowDays: 10, method: "transplant" },
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

  const catalog = gddCrops
    .map((c) => {
      const base = Number(c?.base_f ?? c?.base ?? 50);
      const req = Number(c?.gdd_required ?? c?.gddRequired ?? c?.gdd50 ?? c?.gdd);

      if (!Number.isFinite(base) || !Number.isFinite(req)) return null;

      const rawSlug = String(c?.slug || c?.key || c?.name || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      const siteSlug = canonicalSiteSlug(rawSlug);

      return {
        slug: siteSlug,
        key: siteSlug,
        name: String(c?.name || siteSlug),
        href: cropHrefFromSlug(siteSlug),
        base,
        gddRequired: req,
        category: String(c?.category || "")
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.gddRequired - b.gddRequired);

  const out = {
    meta: {
      marginPct,
      dates,
      bases: [40, 45, 50],
      sitemapOnly: false,
      catalog
    },
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

      const rawSlug = String(c?.slug || c?.key || c?.name || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      const siteSlug = canonicalSiteSlug(rawSlug);

      const item = {
        slug: siteSlug,
        name: String(c?.name || siteSlug),
        href: cropHrefFromSlug(siteSlug),
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

    const stationResolution = resolveCityStation(city);

    const preferredStationMeta = stationResolution.preferredStationMeta;
    const stationMeta = stationResolution.runtimeStationMeta;
    const stationId = stationResolution.runtimeStationId;

    const curve = stationId ? getStationSeries(stationId) : null;

    const gdd50 = checkDates.map((d) => ({
      date: d,
      base: 50,
      gdd: getRemainingFromCurve(curve, 50, d)
    }));

    const gdd45 = checkDates.map((d) => ({
      date: d,
      base: 45,
      gdd: getRemainingFromCurve(curve, 45, d)
    }));

    const gdd40 = checkDates.map((d) => ({
      date: d,
      base: 40,
      gdd: getRemainingFromCurve(curve, 40, d)
    }));

    const remainingMap50 = Object.fromEntries(
      gdd50.map((r) => [r.date, Number.isFinite(r.gdd) ? r.gdd : null])
    );

    const frostFreeDays_p50 =
      Number.isFinite(springMedian) &&
      Number.isFinite(fallMedian) &&
      fallMedian > springMedian
        ? Math.round(fallMedian - springMedian)
        : null;
        const mascotKey = getCityMascotKey({
  springMedian,
  frostFreeDays: frostFreeDays_p50
});

const mascotSeed = getCityMascotSeed(city);

    const fallSpreadDays50 =
      Number.isFinite(earliestFall) &&
      Number.isFinite(latestFall) &&
      latestFall >= earliestFall
        ? Math.round(latestFall - earliestFall)
        : null;


const locationKey = `${city.regionKey}/${city.key}`;
const curatedContent = normalizeCuratedContent(
  locationContent?.cities?.[locationKey]
);

    const summary = {
      key: city.key,
      name: city.name,
      country: city.country,
      regionKind: city.regionKind,
      regionAbbr: city.regionAbbr,
      regionKey: city.regionKey,
      regionName: city.regionName,
      abbr: city.regionAbbr,
      content: curatedContent || null,
      mascotKey,
      mascotSeed,

      lookupKey: city.lookupKey || null,

      preferredStationId: stationResolution.preferredStationId || null,
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
      stationId: stationId || null,
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

      stationDistanceKm: stationResolution.stationDistanceKm,
      stationMismatchFlag: stationResolution.stationMismatchFlag || "",
      stationRuntimeSource: stationResolution.runtimeSource || null,
      stationSeriesType: stationResolution.runtimeSeriesType || null,
      stationAliasFromId: stationResolution.aliasFromStationId || null,
      stationAliasToId: stationResolution.aliasToStationId || null,

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
        gdd: {
          remaining: remainingMap50
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
    summary.plantingWindowsByKey = Object.fromEntries(
  (summary.plantingWindows || []).map((row) => [row.key, row])
);
    summary.cropFit = buildCityCropFit(summary, checkDates);

    return summary;
  });
}

module.exports = { buildCitySummaries };