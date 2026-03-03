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

// crop page slugs + crop requirements
let siteCrops = null;
let gddCrops = null;
try {
  siteCrops = require("../crops.json");
} catch {
  siteCrops = null;
}
try {
  gddCrops = require("../gddCrops.json");
} catch {
  gddCrops = null;
}

// Optional region content packs
let regionContent = null;
try {
  regionContent = require("../regionContent.js");
} catch {
  regionContent = null;
}

const STATION_DIR = path.join(__dirname, "../../assets/data/gdd-stations");

// -------------------------
// Small utilities
// -------------------------

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function deepMerge(a, b) {
  const out = { ...(a || {}) };
  for (const k of Object.keys(b || {})) {
    const av = out[k];
    const bv = b[k];

    if (Array.isArray(av) && Array.isArray(bv)) out[k] = bv; // override arrays
    else if (av && typeof av === "object" && bv && typeof bv === "object") out[k] = deepMerge(av, bv);
    else out[k] = bv;
  }
  return out;
}

function resolveValue(v, summary) {
  if (typeof v === "function") return v(summary);
  if (Array.isArray(v)) return v.map((x) => resolveValue(x, summary));
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = resolveValue(v[k], summary);
    return o;
  }
  return v;
}

function buildRegionPack({ kind, key, summary }) {
  if (!regionContent) return null;

  const globalDefaults = regionContent.defaults || {};
  const countryDefaults = regionContent[kind]?.defaults || {};
  const region = regionContent[kind]?.[key] || {};

  let pack = deepMerge(globalDefaults, countryDefaults);
  pack = deepMerge(pack, region);

  const baseModules = pack.modules || [];
  const addModules = pack.addModules || [];
  pack.modules = [...baseModules, ...addModules].filter(Boolean);
  delete pack.addModules;

  return resolveValue(pack, summary);
}

// -------------------------
// Region display metadata (abbr -> name/slug)
// -------------------------

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

// -------------------------
// Date helpers (non-leap)
// -------------------------

function mmddToDayOfYear(mmdd) {
  const [m, d] = String(mmdd || "").split("-").map(Number);
  if (!m || !d) return null;
  const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let doy = d;
  for (let i = 0; i < m - 1; i++) doy += monthLengths[i];
  return doy; // 1..365
}

function dayOfYearToMmdd(doy) {
  if (!Number.isFinite(doy)) return null;
  const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = 0;
  let n = Math.round(doy);
  while (month < 12 && n > monthLengths[month]) {
    n -= monthLengths[month];
    month++;
  }
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(n).padStart(2, "0");
  return `${mm}-${dd}`;
}

function medianNumber(arr) {
  const s = arr.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// -------------------------
// Key normalization (ZIP/FSA)
// -------------------------

function normalizeCandidates(rawKey) {
  const s = String(rawKey ?? "").trim().toUpperCase();
  const compact = s.replace(/[^A-Z0-9]/g, "");

  if (/^\d{5}/.test(compact)) {
    const zip5 = compact.slice(0, 5);
    return [zip5, zip5.slice(0, 3)];
  }

  if (/^[A-Z]\d[A-Z]/.test(compact)) {
    return [compact.slice(0, 3)];
  }

  return compact ? [compact] : [];
}

function isUSKey(rawKey) {
  const compact = String(rawKey ?? "").trim().replace(/[^A-Z0-9]/gi, "");
  return /^\d{5}/.test(compact);
}

function isCAKey(rawKey) {
  const compact = String(rawKey ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]\d[A-Z]/.test(compact);
}

function matchesKind(row, kind) {
  if (kind === "US") return isUSKey(row?.key);
  if (kind === "CA") return isCAKey(row?.key);
  return true;
}

// -------------------------
// Frost-free detection
// -------------------------

function isFrostFreeRow(row) {
  if (row && row.frostFree === true) return true;
  const ff = String(row?.firstFrost ?? "").trim();
  return !ff;
}

// -------------------------
// Station cache
// -------------------------

const _stationCache = new Map();

function loadStationFile(stationId) {
  const id = String(stationId || "").trim();
  if (!id) return null;

  if (_stationCache.has(id)) return _stationCache.get(id);

  const filePath = path.join(STATION_DIR, `${id}.json`);
  let data = null;

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed?.bases) data = parsed;
  } catch {
    data = null;
  }

  _stationCache.set(id, data);
  return data;
}

// -------------------------
// Region summaries: frost
// -------------------------

function computeFrostSummariesByRegion({ kind }) {
  const buckets = {}; // region -> {valid: [], frostFreeCount, totalCount}

  for (const row of frostDates) {
    if (!row?.region) continue;
    if (!matchesKind(row, kind)) continue;

    const region = row.region;

    if (!buckets[region]) buckets[region] = { valid: [], frostFreeCount: 0, totalCount: 0 };
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
// Region summaries: remaining GDD (median across stations)
// -------------------------

function computeGddRemainingByRegion({ kind, base = 50, checkDates = ["05-15", "06-01", "07-01", "08-01"] }) {
  const baseKey = String(base);
  const buckets = {}; // region -> { "07-01":[...], ...}

  for (const row of frostDates) {
    const region = row?.region;
    const rawKey = row?.key;
    if (!region || !rawKey) continue;
    if (!matchesKind(row, kind)) continue;
    if (isFrostFreeRow(row)) continue;

    const candidates = normalizeCandidates(rawKey);
    let stationId = null;
    for (const k of candidates) {
      if (gddStations[k]) {
        stationId = gddStations[k];
        break;
      }
    }
    if (!stationId) continue;

    const station = loadStationFile(stationId);
    const curve = station?.bases?.[baseKey];
    if (!Array.isArray(curve)) continue;

    const frostDoy = mmddToDayOfYear(row.firstFrost);
    if (!Number.isFinite(frostDoy)) continue;

    const frostIdx = Math.max(0, Math.min(364, frostDoy - 1));
    const atFrost = curve[frostIdx];
    if (!Number.isFinite(atFrost)) continue;

    if (!buckets[region]) buckets[region] = {};
    for (const d of checkDates) if (!buckets[region][d]) buckets[region][d] = [];

    for (const mmdd of checkDates) {
      const doy = mmddToDayOfYear(mmdd);
      if (!Number.isFinite(doy)) continue;

      const idx = Math.max(0, Math.min(364, doy - 1));
      const atDate = curve[idx];
      if (!Number.isFinite(atDate)) continue;

      const remaining = Math.max(0, atFrost - atDate);
      buckets[region][mmdd].push(remaining);
    }
  }

  const results = {};
  for (const region of Object.keys(buckets)) {
    results[region] = checkDates.map((d) => {
      const med = medianNumber(buckets[region][d] || []);
      return { date: d, base, gdd: med == null ? null : Math.round(med) };
    });
  }
  return results;
}

// -------------------------
// Guardrails
// -------------------------

function applyGuardrails({ kind, frostSummaries }) {
  const regions = Object.keys(frostSummaries || {});
  if (!regions.length) return;

  if (kind === "US") {
    const frostFreeRegions = regions.filter((r) => frostSummaries[r]?.status === "frost_free").length;
    const ratio = frostFreeRegions / regions.length;
    if (ratio > 0.05) {
      console.warn(
        `[GDD] WARNING: unusually high frost_free share for US regions: ${frostFreeRegions}/${regions.length} (${Math.round(
          ratio * 100
        )}%). Check frost parsing / frost-free logic.`
      );
    }
  }
}

// -------------------------
// Crop-fit
// -------------------------

function buildSiteCropSlugSet() {
  const set = new Set();
  if (Array.isArray(siteCrops)) {
    for (const c of siteCrops) {
      if (c?.slug) set.add(String(c.slug));
    }
  }
  return set;
}

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
  const dates = Array.isArray(opts.dates) ? opts.dates : ["05-15", "06-01", "07-01", "08-01"];

  if (!Array.isArray(gddCrops) || !gddCrops.length) return null;

  const siteSlugSet = buildSiteCropSlugSet();
  if (!siteSlugSet.size) return null;

  const out = {
    meta: { marginPct, dates, bases: [40, 45, 50], sitemapOnly: true },
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
      if (!siteSlugSet.has(siteSlug)) continue; // keep sitemap-only

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
    reliable = dedupe(reliable);
    possible = dedupe(possible);

    reliable.sort((a, b) => a.gddRequired - b.gddRequired);
    possible.sort((a, b) => a.gddRequired - b.gddRequired);

    out.byDate[mmdd] = { runwayByBase, reliable, possible };
  }

  return out;
}

// -------------------------
// Public builder
// -------------------------

function buildRegionSummaries({
  kind,
  base = 50,
  checkDates = ["05-15", "06-01", "07-01", "08-01"],
}) {
  const frost = computeFrostSummariesByRegion({ kind });
  applyGuardrails({ kind, frostSummaries: frost });

  const gdd50 = computeGddRemainingByRegion({ kind, base: 50, checkDates });
  const gdd45 = computeGddRemainingByRegion({ kind, base: 45, checkDates });
  const gdd40 = computeGddRemainingByRegion({ kind, base: 40, checkDates });

  const regions = Object.keys(frost);
  const metaMap = kind === "US" ? US_REGION_META : kind === "CA" ? CA_REGION_META : null;

  const out = [];

  for (const regionAbbr of regions) {
    const frostObj = frost[regionAbbr] || { status: "insufficient_data" };
    const meta = metaMap ? metaMap[String(regionAbbr).toUpperCase()] : null;

    const key = meta?.slug || slugify(regionAbbr);
    const name = meta?.name || String(regionAbbr);

    const fallbackRows50 = checkDates.map((d) => ({ date: d, base: 50, gdd: null }));
    const fallbackRows45 = checkDates.map((d) => ({ date: d, base: 45, gdd: null }));
    const fallbackRows40 = checkDates.map((d) => ({ date: d, base: 40, gdd: null }));

    const summary = {
      key,
      name,
      abbr: String(regionAbbr).toUpperCase(),
      frost: frostObj,

      // Base 50 table data (keep as-is for your existing table)
      gdd_remaining: gdd50[regionAbbr] || fallbackRows50,

      // Multi-base for crop-fit + other modules
      gdd_remaining_by_base: {
        "50": gdd50[regionAbbr] || fallbackRows50,
        "45": gdd45[regionAbbr] || fallbackRows45,
        "40": gdd40[regionAbbr] || fallbackRows40,
      },

      kind,
    };

    // Attach content pack + crop fit + lede for index cards
    const pack = buildRegionPack({ kind, key, summary });
    const cropFit = computeCropFitForRegion(summary, { marginPct: 0.15, dates: checkDates });

    const lede = pack?.indexCard?.lede || pack?.index?.lede || null;

    out.push({ ...summary, content: pack, cropFit, lede });
  }

  out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return out;
}

module.exports = { buildRegionSummaries };