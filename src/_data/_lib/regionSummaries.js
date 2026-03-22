// src/_data/_lib/regionSummaries.js
// Shared build-time summary builder for US states + Canadian provinces
//
// - Uses frost normals in src/_data/frostDates.json
// - Uses ZIP/FSA -> station mapping in src/_data/gddStations.json
// - Loads station curve files from src/assets/data/gdd-stations/<stationId>.json
//
// Adds:
// - region content packs (regionContent.js)
// - cropFit (what tends to mature by date), filtered to crops that have real pages (crops.json)

const fs = require("fs");
const path = require("path");

const frostDates = require("../frostDates.json");
const gddStations = require("../gddStations.json");
const gddCrops = require("../gddCrops");

const locationContent = require("../locationContent");

const US_REGION_META = {
  AL: { name: "Alabama", slug: "alabama" },
  AK: { name: "Alaska", slug: "alaska" },
  AZ: { name: "Arizona", slug: "arizona" },
  AR: { name: "Arkansas", slug: "arkansas" },
  CA: { name: "California", slug: "california" },
  CO: { name: "Colorado", slug: "colorado" },
  CT: { name: "Connecticut", slug: "connecticut" },
  DE: { name: "Delaware", slug: "delaware" },
  FL: { name: "Florida", slug: "florida" },
  GA: { name: "Georgia", slug: "georgia" },
  HI: { name: "Hawaii", slug: "hawaii" },
  ID: { name: "Idaho", slug: "idaho" },
  IL: { name: "Illinois", slug: "illinois" },
  IN: { name: "Indiana", slug: "indiana" },
  IA: { name: "Iowa", slug: "iowa" },
  KS: { name: "Kansas", slug: "kansas" },
  KY: { name: "Kentucky", slug: "kentucky" },
  LA: { name: "Louisiana", slug: "louisiana" },
  ME: { name: "Maine", slug: "maine" },
  MD: { name: "Maryland", slug: "maryland" },
  MA: { name: "Massachusetts", slug: "massachusetts" },
  MI: { name: "Michigan", slug: "michigan" },
  MN: { name: "Minnesota", slug: "minnesota" },
  MS: { name: "Mississippi", slug: "mississippi" },
  MO: { name: "Missouri", slug: "missouri" },
  MT: { name: "Montana", slug: "montana" },
  NE: { name: "Nebraska", slug: "nebraska" },
  NV: { name: "Nevada", slug: "nevada" },
  NH: { name: "New Hampshire", slug: "new-hampshire" },
  NJ: { name: "New Jersey", slug: "new-jersey" },
  NM: { name: "New Mexico", slug: "new-mexico" },
  NY: { name: "New York", slug: "new-york" },
  NC: { name: "North Carolina", slug: "north-carolina" },
  ND: { name: "North Dakota", slug: "north-dakota" },
  OH: { name: "Ohio", slug: "ohio" },
  OK: { name: "Oklahoma", slug: "oklahoma" },
  OR: { name: "Oregon", slug: "oregon" },
  PA: { name: "Pennsylvania", slug: "pennsylvania" },
  RI: { name: "Rhode Island", slug: "rhode-island" },
  SC: { name: "South Carolina", slug: "south-carolina" },
  SD: { name: "South Dakota", slug: "south-dakota" },
  TN: { name: "Tennessee", slug: "tennessee" },
  TX: { name: "Texas", slug: "texas" },
  UT: { name: "Utah", slug: "utah" },
  VT: { name: "Vermont", slug: "vermont" },
  VA: { name: "Virginia", slug: "virginia" },
  WA: { name: "Washington", slug: "washington" },
  WV: { name: "West Virginia", slug: "west-virginia" },
  WI: { name: "Wisconsin", slug: "wisconsin" },
  WY: { name: "Wyoming", slug: "wyoming" },
  DC: { name: "District of Columbia", slug: "district-of-columbia" },
};

const CA_REGION_META = {
  AB: { name: "Alberta", slug: "alberta" },
  BC: { name: "British Columbia", slug: "british-columbia" },
  MB: { name: "Manitoba", slug: "manitoba" },
  NB: { name: "New Brunswick", slug: "new-brunswick" },
  NL: { name: "Newfoundland and Labrador", slug: "newfoundland-and-labrador" },
  NS: { name: "Nova Scotia", slug: "nova-scotia" },
  NT: { name: "Northwest Territories", slug: "northwest-territories" },
  NU: { name: "Nunavut", slug: "nunavut" },
  ON: { name: "Ontario", slug: "ontario" },
  PE: { name: "Prince Edward Island", slug: "prince-edward-island" },
  QC: { name: "Quebec", slug: "quebec" },
  SK: { name: "Saskatchewan", slug: "saskatchewan" },
  YT: { name: "Yukon", slug: "yukon" },
};


// --- Region meta maps (names/slugs) ---

// --- Region content packs + crop pages list ---
const regionContentMod = require("../regionContent");
const buildRegionPack =
  (regionContentMod && typeof regionContentMod.buildRegionPack === "function"
    ? regionContentMod.buildRegionPack
    : (typeof regionContentMod === "function" ? regionContentMod : null));
const crops = require("../crops");

// -------------------------
// Helpers
// -------------------------

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

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mmddToDoy(mmdd) {
  if (!mmdd) return null;
  const s = String(mmdd);
  const m = Number(s.slice(0, 2));
  const d = Number(s.slice(3, 5));
  if (!Number.isFinite(m) || !Number.isFinite(d)) return null;
  // non-leap-year anchor for stable indexing
  const dt = new Date(Date.UTC(2001, m - 1, d));
  const jan1 = new Date(Date.UTC(2001, 0, 1));
  const doy = Math.round((dt - jan1) / 86400000) + 1;
  return Number.isFinite(doy) ? doy : null;
}

const CA_CODES = new Set([
  "AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"
]);

function matchesKind(row, kind) {
  const r = String(row.region || "").toUpperCase().trim();
  if (r.length !== 2) return false;

  const isCA = CA_CODES.has(r);
  if (kind === "CA") return isCA;
  if (kind === "US") return !isCA;
  return false;
}

function isFrostFreeRow(row) {
  // If your dataset has a boolean or sentinel, add it here.
  // Current behavior: treat missing/empty firstFrost as "frost free".
  return !row?.firstFrost;
}

function mmddToDayOfYear(mmdd) {
  if (!mmdd || typeof mmdd !== "string") return null;
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;

  // non-leap year day-of-year
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

  // clamp
  let d = Math.max(1, Math.min(365, Math.round(doy)));

  let month = 1;
  while (month <= 12) {
    const max = mdays[month - 1];
    if (d <= max) break;
    d -= max;
    month++;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${mm}-${dd}`;
}

function medianNumber(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const a = nums.slice().sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  if (a.length % 2 === 1) return a[mid];
  return (a[mid - 1] + a[mid]) / 2;
}

function mmddToDoy(mmdd) {
  if (!mmdd) return null;

  const [m, d] = String(mmdd).split("-").map(Number);
  if (!m || !d) return null;

  // use non-leap reference year
  const dt = new Date(Date.UTC(2001, m - 1, d));
  const jan1 = new Date(Date.UTC(2001, 0, 1));

  return Math.round((dt - jan1) / 86400000) + 1;
}

// -------------------------
// Frost summaries (fall)
// -------------------------

function computeFrostSummariesByRegion({ kind }) {
  const buckets = {}; // region -> {valid: [], frostFreeCount, totalCount}

  for (const row of frostDates) {
    if (!row?.region) continue;
    if (!matchesKind(row, kind)) continue;

    const region = row.region;

    if (!buckets[region])
      buckets[region] = { valid: [], frostFreeCount: 0, totalCount: 0 };
    buckets[region].totalCount++;

    if (isFrostFreeRow(row)) {
      buckets[region].frostFreeCount++;
      continue;
    }

    const doy = mmddToDayOfYear(row.firstFrost);
    if (!Number.isFinite(doy)) continue;
    buckets[region].valid.push(doy);
  }

  const out = {};
  for (const region of Object.keys(buckets)) {
    const { valid, frostFreeCount, totalCount } = buckets[region];
    const stationCount = valid.length;

    if (stationCount > 0) {
      const med = medianNumber(valid);
      const min = Math.min(...valid);
      const max = Math.max(...valid);
      out[region] = {
        status: "normal",
        median50: dayOfYearToMmdd(med),
        earliest50: dayOfYearToMmdd(min),
        latest50: dayOfYearToMmdd(max),
        stationCount,
        frostFreeCount,
        totalCount,
      };
    } else if (frostFreeCount > 0) {
      out[region] = {
        status: "frost_free",
        median50: null,
        earliest50: null,
        latest50: null,
        stationCount: 0,
        frostFreeCount,
        totalCount,
      };
    } else {
      out[region] = {
        status: "insufficient_data",
        median50: null,
        earliest50: null,
        latest50: null,
        stationCount: 0,
        frostFreeCount: 0,
        totalCount,
      };
    }
  }

  return out;
}

// -------------------------
// Region summaries: last spring frost (median across stations)
// -------------------------
function computeLastFrostSummariesByRegion({ kind }) {
  const buckets = {}; // region -> {valid: [], frostFreeCount, totalCount}

  for (const row of frostDates) {
    if (!row?.region) continue;
    if (!matchesKind(row, kind)) continue;

    const region = row.region;

    if (!buckets[region])
      buckets[region] = { valid: [], frostFreeCount: 0, totalCount: 0 };
    buckets[region].totalCount++;

    if (isFrostFreeRow(row)) {
      buckets[region].frostFreeCount++;
      continue;
    }

    const doy = mmddToDayOfYear(row.lastFrost);
    if (!Number.isFinite(doy)) continue;
    buckets[region].valid.push(doy);
  }

  const out = {};
  for (const region of Object.keys(buckets)) {
    const { valid, frostFreeCount, totalCount } = buckets[region];
    const stationCount = valid.length;

    if (stationCount > 0) {
      const med = medianNumber(valid);
      const min = Math.min(...valid);
      const max = Math.max(...valid);
      out[region] = {
        status: "normal",
        median50: dayOfYearToMmdd(med),
        earliest50: dayOfYearToMmdd(min),
        latest50: dayOfYearToMmdd(max),
        stationCount,
        frostFreeCount,
        totalCount,
      };
    } else if (frostFreeCount > 0) {
      out[region] = {
        status: "frost_free",
        median50: null,
        earliest50: null,
        latest50: null,
        stationCount: 0,
        frostFreeCount,
        totalCount,
      };
    } else {
      out[region] = {
        status: "insufficient_data",
        median50: null,
        earliest50: null,
        latest50: null,
        stationCount: 0,
        frostFreeCount: 0,
        totalCount,
      };
    }
  }

  return out;
}

// -------------------------
// GDD remaining (existing system)
// -------------------------

const _stationCurveCache = new Map(); // stationId -> parsed curve JSON

function readStationCurve(stationId) {
  const id = String(stationId || "").trim();
  if (!id) return null;
  if (_stationCurveCache.has(id)) return _stationCurveCache.get(id);

  const p = path.join(
    process.cwd(),
    "src/assets/data/gdd-stations",
    `${id}.json`
  );

  const raw = fs.readFileSync(p, "utf8");
  const curve = JSON.parse(raw);
  _stationCurveCache.set(id, curve);
  return curve;
}


function computeGddRemainingByRegion({ kind, base = 50, checkDates }) {
  const out = {};

  // Helper: normalize a location key into the same key format used by gddStations.json
  // - Canada: FSA (first 3 chars), uppercase, no spaces
  // - US: ZIP5 digits
  function normalizeGddKey(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    const hasLetters = /[a-z]/i.test(s);
    if (hasLetters) {
      return s.toUpperCase().replace(/\s+/g, "").slice(0, 3);
    }
    return s.replace(/\D+/g, "").slice(0, 5);
  }

  // Helper: candidate keys for lookup (ZIP5 -> ZIP5 then ZIP3 fallback)
  function normalizeCandidates(raw) {
    const key = normalizeGddKey(raw);
    if (!key) return [];
    const candidates = [key];
    if (/^\d{5}$/.test(key)) candidates.push(key.slice(0, 3));
    return candidates;
  }

  function lookupGddStationId(rawKey) {
    const candidates = normalizeCandidates(rawKey);
    for (const k of candidates) {
      const hit = gddStations[k];
      if (hit) return String(hit);
    }
    return null;
  }

  
  function getRemainingFromCurve(curve, baseStr, mmdd) {
    if (!curve || !mmdd) return null;
    const b = String(baseStr);

    // Shape A: precomputed remaining-by-date maps
    if (curve?.remaining?.[b]?.[mmdd] != null) return curve.remaining[b][mmdd];
    if (curve?.remainingByBase?.[b]?.[mmdd] != null) return curve.remainingByBase[b][mmdd];
    if (curve?.remaining_gdd_by_base?.[b]?.[mmdd] != null) return curve.remaining_gdd_by_base[b][mmdd];
    if (curve?.remainingGddByBase?.[b]?.[mmdd] != null) return curve.remainingGddByBase[b][mmdd];
    if (curve?.remaining_gdd?.[b]?.[mmdd] != null) return curve.remaining_gdd[b][mmdd];
    if (curve?.byBase?.[b]?.remaining?.[mmdd] != null) return curve.byBase[b].remaining[mmdd];
    if (curve?.bases?.[b]?.remaining?.[mmdd] != null) return curve.bases[b].remaining[mmdd];

    // Shape B: cumulative GDD series by day-of-year
    // Example: { station_id, bases: { "50": [0.0, 0.0, ...], "45": [...] } }
    const series = curve?.bases?.[b];
    if (Array.isArray(series) && series.length) {
      const doy = mmddToDoy(mmdd);
      if (!doy || doy < 1) return null;
      const idx = Math.min(series.length - 1, doy - 1);
      const total = series[series.length - 1];
      const sofar = series[idx];
      if (!Number.isFinite(total) || !Number.isFinite(sofar)) return null;
      const rem = total - sofar;
      return Number.isFinite(rem) ? rem : null;
    }

    return null;
  }

  function medianInt(values) {
    const nums = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!nums.length) return null;
    const mid = Math.floor(nums.length / 2);
    const m = nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    return Math.round(m);
  }

  // Build region -> date -> [values]
  const bucket = {}; // { [region]: { [mmdd]: number[] } }

  for (const row of frostDates) {
    if (!row || !matchesKind(row, kind)) continue;

    const region = String(row.region || "").toUpperCase().trim();
    const key = row.key; // location key (ZIP/FSA) shared across frostDates + gddStations
    if (!region || !key) continue;

    const stationId = lookupGddStationId(key);
    if (!stationId) continue;

    const curve = readStationCurve(stationId);
    if (!curve) continue;

    for (const d of checkDates) {
      const val = getRemainingFromCurve(curve, base, d);
      if (!Number.isFinite(val)) continue;

      if (!bucket[region]) bucket[region] = {};
      if (!bucket[region][d]) bucket[region][d] = [];
      bucket[region][d].push(Number(val));
    }
  }

  for (const region of Object.keys(bucket)) {
    out[region] = checkDates.map((d) => ({
      date: d,
      base,
      gdd: medianInt(bucket[region][d] || []),
    }));
  }

  return out;
}


function applyGuardrails({ kind, frostSummaries }) {
  // Keep your existing guardrails here if you have them.
  // No-op by default.
  return { kind, frostSummaries };
}

// -------------------------
// Crop fit (existing)
// -------------------------

// -------------------------
// Crop-fit
// -------------------------

function buildSiteCropSlugSet() {
  const set = new Set();

  // supports either:
  // - an array: [{slug:"tomatoes", ...}, ...]
  // - or an object: { crops: [...] }
  const arr =
    Array.isArray(siteCrops) ? siteCrops :
    Array.isArray(siteCrops?.crops) ? siteCrops.crops :
    null;

  if (arr) {
    for (const c of arr) {
      if (c?.slug) set.add(String(c.slug));
    }
  }

  return set;
}

// optional: normalize common slug variations between gddCrops and your site slugs
const CROP_SLUG_ALIASES = {
  tomato: "tomatoes",
  pepper: "peppers",
  cucumber: "cucumbers",
  "bean-bush": "beans",
  bean: "beans",
  carrot: "carrots",
  beet: "beets",
  pea: "peas",
  onion: "onions",
};

function canonicalSiteSlug(slug) {
  const s = String(slug || "").trim();
  return CROP_SLUG_ALIASES[s] || s;
}

function cropHrefFromSlug(siteSlug) {
  return `/crops/${String(siteSlug || "").trim()}/`;
}

function getRemainingGdd(summary, base, mmdd) {
  const rows = summary.gdd_remaining_by_base?.[String(base)] || null;
  if (!Array.isArray(rows)) return null;
  const row = rows.find((r) => r.date === mmdd);
  return row && Number.isFinite(row.gdd) ? row.gdd : null;
}

function computeCropFitForRegion(summary, opts = {}) {
  const marginPct = Number.isFinite(opts.marginPct) ? opts.marginPct : 0.15;
  const dates = Array.isArray(opts.dates) && opts.dates.length
    ? opts.dates
    : ["05-15", "06-01", "07-01", "08-01"];

  if (!Array.isArray(gddCrops) || !gddCrops.length) return null;

  // If crops.json exists, we’ll filter to crops that have real pages.
  // If it doesn’t exist, we still compute cropFit (so your module renders).
const shouldFilterToSite = false; // no crops.json filtering

  const catalog = gddCrops
    .map((c) => {
      const base = Number(c?.base_f);
      const req = Number(c?.gdd_required);
      if (!Number.isFinite(base) || !Number.isFinite(req)) return null;

      const siteSlug = canonicalSiteSlug(c?.slug);

      return {
        slug: siteSlug,
        key: siteSlug,
        name: String(c?.name || siteSlug),
        href: cropHrefFromSlug(siteSlug),
        base,
        gddRequired: req,
        category: String(c?.category || ""),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.gddRequired - b.gddRequired);

  const out = {
    meta: {
      marginPct,
      dates,
      bases: [40, 45, 50],
      sitemapOnly: shouldFilterToSite,
      catalog,
    },
    byDate: {},
  };
  
  for (const mmdd of dates) {
    const runwayByBase = {
      "50": getRemainingGdd(summary, 50, mmdd),
      "45": getRemainingGdd(summary, 45, mmdd),
      "40": getRemainingGdd(summary, 40, mmdd),
    };

    let reliable = [];
    let possible = [];

    for (const c of gddCrops) {
      const base = Number(c?.base_f);
      const req = Number(c?.gdd_required);
      if (!Number.isFinite(base) || !Number.isFinite(req)) continue;

      const runway = runwayByBase[String(base)];
      if (!Number.isFinite(runway)) continue;

      const siteSlug = canonicalSiteSlug(c?.slug);
// no filtering
      const safeRunway = Math.max(0, Math.floor(runway * (1 - marginPct)));

      const item = {
        slug: siteSlug,
        name: String(c?.name || siteSlug),
        href: cropHrefFromSlug(siteSlug),
        base,
        gddRequired: req,
        category: String(c?.category || ""),
      };

      if (req <= safeRunway) reliable.push(item);
      else if (req <= runway) possible.push(item);
    }

    // dedupe by href
    const dedupe = (arr) => {
      const seen = new Set();
      return arr.filter((x) => {
        const k = x.href;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };

    reliable = dedupe(reliable).sort((a, b) => a.gddRequired - b.gddRequired);
    possible = dedupe(possible).sort((a, b) => a.gddRequired - b.gddRequired);

    out.byDate[mmdd] = { runwayByBase, reliable, possible };
  }

  return out;
}

// -------------------------
// Planting windows (simple, data-driven)
// -------------------------

// Simple default rule set (expand anytime)
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
  { key: "peppers", label: "Peppers", offsetDays: 21, windowDays: 10, method: "transplant" },
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

function normalizeCropKey(k) {
  return String(k || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function buildCropGddIndex(gddCropsData) {
  const idx = {};
  if (!gddCropsData) return idx;

  if (Array.isArray(gddCropsData)) {
    for (const row of gddCropsData) {
      const key = normalizeCropKey(row.key || row.crop || row.name);
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
    return idx;
  }

  if (typeof gddCropsData === "object") {
    for (const [k, v] of Object.entries(gddCropsData)) {
      const key = normalizeCropKey(k);
      if (!key) continue;

      const gdd =
        (v &&
          (v.gdd50 ??
            v.gdd_base50 ??
            v.gdd ??
            v.gddRequired ??
            v.gdd_required)) ??
        null;

      if (Number.isFinite(gdd)) idx[key] = gdd;
    }
  }

  return idx;
}

function computePlantingWindows(summary, { checkDates, cropGddIndex }) {
  const spring = summary?.season?.frost?.spring?.p50;
  if (!spring) return null;

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

    const cropKey = normalizeCropKey(rule.key);
    const required = cropGddIndex ? cropGddIndex[cropKey] : null;

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
      requiredGdd50: Number.isFinite(required) ? required : null,
    });
  }

  return out;
}

// -------------------------
// Build region summaries
// -------------------------

function buildRegionSummaries({
  kind,
  base = 50,
  checkDates = ["05-15", "06-01", "07-01", "08-01"],
}) {
  const frostFall = computeFrostSummariesByRegion({ kind });
  applyGuardrails({ kind, frostSummaries: frostFall });

  const frostSpring = computeLastFrostSummariesByRegion({ kind });

  const gdd50 = computeGddRemainingByRegion({ kind, base: 50, checkDates });
  const gdd45 = computeGddRemainingByRegion({ kind, base: 45, checkDates });
  const gdd40 = computeGddRemainingByRegion({ kind, base: 40, checkDates });

  const regions = Object.keys(frostFall);
  const metaMap =
    kind === "US" ? US_REGION_META : kind === "CA" ? CA_REGION_META : null;

  const out = [];

  // Build once, reuse for every region
  const cropGddIndex = buildCropGddIndex(gddCrops);

  for (const regionAbbr of regions) {
    const frostObj = frostFall[regionAbbr] || { status: "insufficient_data" };
    const springObj =
      frostSpring[regionAbbr] || { status: "insufficient_data" };

    const meta = metaMap ? metaMap[String(regionAbbr).toUpperCase()] : null;

    const key = meta?.slug || slugify(regionAbbr);
    const name = meta?.name || String(regionAbbr);

    const fallbackRows50 = checkDates.map((d) => ({
      date: d,
      base: 50,
      gdd: null,
    }));
    const fallbackRows45 = checkDates.map((d) => ({
      date: d,
      base: 45,
      gdd: null,
    }));
    const fallbackRows40 = checkDates.map((d) => ({
      date: d,
      base: 40,
      gdd: null,
    }));

    const gddRows50 = gdd50[regionAbbr] || fallbackRows50;

    const remainingMap50 = Object.fromEntries(
      (gddRows50 || []).map((r) => [
        r.date,
        Number.isFinite(r.gdd) ? r.gdd : null,
      ])
    );

// derived frost-free length (only if both medians exist and fall > spring)
const springDoy = mmddToDayOfYear(springObj.median50);
const fallDoy = mmddToDayOfYear(frostObj.median50);
const frostFreeDays_p50 =
  Number.isFinite(springDoy) &&
  Number.isFinite(fallDoy) &&
  fallDoy > springDoy
    ? Math.round(fallDoy - springDoy)
    : null;

// NEW: fall frost spread (microclimate signal) using earliest/latest
const fallEarliestDoy = mmddToDayOfYear(frostObj.earliest50);
const fallLatestDoy = mmddToDayOfYear(frostObj.latest50);
const fallSpreadDays50 =
  Number.isFinite(fallEarliestDoy) &&
  Number.isFinite(fallLatestDoy) &&
  fallLatestDoy >= fallEarliestDoy
    ? Math.round(fallLatestDoy - fallEarliestDoy)
    : null;

const summary = {
  key,
  name,
  abbr: String(regionAbbr).toUpperCase(),

  // keep existing fall frost object exactly as-is (backward compatible)
  frost: frostObj,

  // NEW: spring frost object (optional for templates/tools)
  frost_spring: springObj,

  // Base 50 table data (keep as-is for your existing table)
  gdd_remaining: gddRows50,

  // Multi-base for crop-fit + other modules
  gdd_remaining_by_base: {
    "50": gddRows50,
    "45": gdd45[regionAbbr] || fallbackRows45,
    "40": gdd40[regionAbbr] || fallbackRows40,
  },

  // NEW: canonical season profile (MM-DD strings to match mmddLong filter)
  season: {
    base: 50,
    frost: {
      spring: {
        p50: springObj.median50 || null,
        earliest50: springObj.earliest50 || null,
        latest50: springObj.latest50 || null,
        status: springObj.status || "insufficient_data",
      },
      fall: {
        p50: frostObj.median50 || null,
        earliest50: frostObj.earliest50 || null,
        latest50: frostObj.latest50 || null,
        status: frostObj.status || "insufficient_data",
      },
    },
    gdd: {
      remaining: remainingMap50, // {"05-15":..., "06-01":..., ...}
    },
    derived: {
      frostFreeDays_p50,
      fallSpreadDays50, // NEW: earliest->latest fall frost spread (days)
    },
  },

  kind,
};

    // Planting windows (computed after summary exists)
    const plantingWindows = computePlantingWindows(summary, {
      checkDates,
      cropGddIndex,
    });

    // Attach content pack + crop fit + lede for index cards

const rawCuratedContent =
  kind === "US"
    ? locationContent?.states?.[key]
    : locationContent?.provinces?.[key];
const curatedContent = normalizeCuratedContent(rawCuratedContent);

const packBase = buildRegionPack ? buildRegionPack({ kind, key, summary }) : null;
const pack = curatedContent
  ? { ...(packBase || {}), ...curatedContent }
  : packBase;

    const cropFit = computeCropFitForRegion(summary, {
      marginPct: 0.15,
      dates: checkDates,
    });

    const lede =
      pack?.indexCard?.lede ||
      pack?.index?.lede ||
      `Typical frost timing, season length, and planting constraints for gardeners in ${summary.name}.`;
      
    out.push({ ...summary, content: pack, cropFit, lede, plantingWindows });
  }

  out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return out;
}

module.exports = { buildRegionSummaries };