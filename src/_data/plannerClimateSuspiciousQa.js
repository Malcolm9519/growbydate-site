const fs = require("fs");
const path = require("path");
const buildPlannerClimateProfiles = require("./plannerClimateProfiles");

const GDD_BASE = "50";
const REPORT_LIMIT = 1000;

const THRESHOLDS = {
  longSeasonDays: 180,
  longSeasonLowGdd: 900,
  veryLowGdd: 600,
  veryHighGdd: 4500,
  shortSeasonHighGddDays: 130,
  shortSeasonHighGdd: 2800
};

function parseMonthDay(value) {
  const match = String(value || "").match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { month, day };
}

function dayOfYear(monthDay) {
  if (!monthDay) return null;
  const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 0;
  for (let i = 0; i < monthDay.month - 1; i += 1) total += monthLengths[i];
  return total + monthDay.day;
}

function frostWindowDays(lastFrost, firstFrost) {
  const lastDoy = dayOfYear(parseMonthDay(lastFrost));
  const firstDoy = dayOfYear(parseMonthDay(firstFrost));
  if (!lastDoy || !firstDoy) return null;

  let days = firstDoy - lastDoy;
  if (days < 0) days += 365;
  return days;
}

function loadStationSeries(stationId, cache) {
  if (!stationId) return null;
  if (Object.prototype.hasOwnProperty.call(cache, stationId)) return cache[stationId];

  const filePath = path.join(__dirname, "..", "assets", "data", "gdd-stations", `${stationId}.json`);

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    cache[stationId] = parsed;
    return parsed;
  } catch (error) {
    cache[stationId] = null;
    return null;
  }
}

function cumulativeValue(series, doy) {
  if (!Array.isArray(series) || !doy) return null;
  const index = Math.max(0, Math.min(series.length - 1, doy - 1));
  const value = Number(series[index]);
  return Number.isFinite(value) ? value : null;
}

function seasonGdd(profile, stationSeries) {
  const baseSeries = stationSeries && stationSeries.bases && stationSeries.bases[GDD_BASE];
  if (!Array.isArray(baseSeries)) return null;

  const lastDoy = dayOfYear(parseMonthDay(profile.lastFrost));
  const firstDoy = dayOfYear(parseMonthDay(profile.firstFrost));
  if (!lastDoy || !firstDoy) return null;

  const start = cumulativeValue(baseSeries, lastDoy) ?? 0;
  const end = cumulativeValue(baseSeries, firstDoy);
  if (end === null) return null;

  // Most supported locations are northern-hemisphere profiles where first fall
  // frost is later in the same calendar year. If a row wraps around the year,
  // fall back to the cumulative value at first frost rather than manufacturing
  // a cross-year total from one climatology curve.
  if (firstDoy < lastDoy) return Math.round(end);

  return Math.max(0, Math.round(end - start));
}

function priorityForReasons(reasons) {
  if (reasons.includes("missing-station-series") || reasons.includes("missing-base50-series")) return "high";
  if (reasons.includes("long-season-low-gdd")) return "high";
  if (reasons.includes("very-low-gdd")) return "medium";
  if (reasons.includes("very-high-gdd")) return "medium";
  return "low";
}

function addReason(counts, reason) {
  counts[reason] = (counts[reason] || 0) + 1;
}

function publicProfile(profile) {
  return {
    key: profile.key,
    name: profile.name,
    region: profile.region,
    country: profile.country,
    firstFrost: profile.firstFrost,
    lastFrost: profile.lastFrost,
    gddStationId: profile.gddStationId,
    matchedFrostKey: profile.matchedFrostKey,
    climateProfileSource: profile.climateProfileSource,
    confidence: profile.confidence
  };
}

module.exports = function plannerClimateSuspiciousQa() {
  const profiles = buildPlannerClimateProfiles();
  const stationCache = {};
  const reasonCounts = {};
  const sourceCounts = {};
  const suspicious = [];

  for (const profile of Object.values(profiles || {})) {
    const source = profile.climateProfileSource || "unknown";
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;

    const reasons = [];
    const station = loadStationSeries(profile.gddStationId, stationCache);
    const frostDays = frostWindowDays(profile.lastFrost, profile.firstFrost);
    const gdd = station ? seasonGdd(profile, station) : null;

    if (!station) {
      reasons.push("missing-station-series");
    } else if (gdd === null) {
      reasons.push("missing-base50-series");
    } else {
      if (frostDays !== null && frostDays >= THRESHOLDS.longSeasonDays && gdd < THRESHOLDS.longSeasonLowGdd) {
        reasons.push("long-season-low-gdd");
      }
      if (gdd < THRESHOLDS.veryLowGdd) {
        reasons.push("very-low-gdd");
      }
      if (gdd > THRESHOLDS.veryHighGdd) {
        reasons.push("very-high-gdd");
      }
      if (frostDays !== null && frostDays <= THRESHOLDS.shortSeasonHighGddDays && gdd > THRESHOLDS.shortSeasonHighGdd) {
        reasons.push("short-season-high-gdd");
      }
    }

    if (reasons.length) {
      for (const reason of reasons) addReason(reasonCounts, reason);
      suspicious.push({
        ...publicProfile(profile),
        frostWindowDays: frostDays,
        base50GddBetweenFrostDates: gdd,
        priority: priorityForReasons(reasons),
        reasons
      });
    }
  }

  suspicious.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    const priorityDiff = (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    if (priorityDiff) return priorityDiff;
    return String(a.key).localeCompare(String(b.key));
  });

  const totalProfiles = Object.keys(profiles || {}).length;
  const suspiciousCount = suspicious.length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProfiles,
      suspiciousCount,
      percentSuspicious: totalProfiles ? Number(((suspiciousCount / totalProfiles) * 100).toFixed(2)) : 0,
      reportLimit: REPORT_LIMIT,
      truncated: suspiciousCount > REPORT_LIMIT,
      sourceCounts,
      reasonCounts,
      thresholds: THRESHOLDS
    },
    howToUse: {
      openReportAt: "/assets/data/qa/planner-climate-suspicious.json",
      mainSignal: "Start with high-priority long-season-low-gdd rows. Those are most likely to be wrong station/profile pairings.",
      fixPattern: "When many rows share a geography or prefix, add one curated coverage group rather than patching rows one by one."
    },
    suspiciousProfiles: suspicious.slice(0, REPORT_LIMIT)
  };
};
