const cities = require("./cities.json");
const frostDates = require("./frostDates.json");
const cityPublishAllowlist = require("./cityPublishAllowlist");
const cityQaAllowlist = require("./cityQaAllowlist");
const {
  haversineKm,
  getStationSeries,
  resolveCityStation
} = require("./_lib/resolveCityStation");

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

function findFrostRow(city) {
  const frostKey = String(city.lookupKey || "").trim().toUpperCase();
  return (
    frostDates.find(
      (r) => String(r.key || "").trim().toUpperCase() === frostKey
    ) || null
  );
}

function roundedKm(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

function computeCityToStationKm(city, stationMeta) {
  if (
    !city ||
    city.lat == null ||
    city.lon == null ||
    !stationMeta ||
    stationMeta.lat == null ||
    stationMeta.lon == null
  ) {
    return null;
  }

  return roundedKm(
    haversineKm(city.lat, city.lon, stationMeta.lat, stationMeta.lon)
  );
}

function buildDetailedReasons(row) {
  const fixReasons = [];
  const checkReasons = [];
  const flags = { ...row.flags };

  if (flags.missingPreferredStation) fixReasons.push("missing_preferred_station");
  if (flags.missingRuntimeStation) fixReasons.push("missing_runtime_station");
  if (flags.missingRuntimeSeries) fixReasons.push("missing_runtime_series");
  if (flags.missingFrost) fixReasons.push("missing_frost");
  if (flags.missingCheckpointApr15) fixReasons.push("missing_gdd_apr15");
  if (flags.missingCheckpointMay01) fixReasons.push("missing_gdd_may01");
  if (flags.missingCheckpointJun01) fixReasons.push("missing_gdd_jun01");
  if (flags.severeDistanceProxy) fixReasons.push("severe_station_distance");
  if (flags.suspiciousRuntimeMismatch) fixReasons.push("suspicious_runtime_mismatch");
  if (flags.cityPreferredVeryFar) fixReasons.push("city_preferred_station_very_far");
  if (flags.cityRuntimeVeryFar) fixReasons.push("city_runtime_station_very_far");

  if (flags.usedAlias) checkReasons.push("alias_runtime");
  if (row.runtimeSource === "nearest_valid_daily") checkReasons.push("nearest_daily_runtime");
  if (row.runtimeSource === "nearest_valid_monthly") checkReasons.push("nearest_monthly_runtime");
  if (row.runtimeSource === "lookup_fallback") checkReasons.push("lookup_fallback_runtime");
  if (row.runtimeSource === "lookup_alias") checkReasons.push("lookup_alias_runtime");
  if (flags.longDistanceProxy) checkReasons.push("station_distance_review");
  if (flags.missingPreferredMeta) checkReasons.push("missing_preferred_meta");
  if (flags.missingRuntimeMeta) checkReasons.push("missing_runtime_meta");
  if (flags.cityPreferredFar) checkReasons.push("city_preferred_station_far");
  if (flags.cityRuntimeFar) checkReasons.push("city_runtime_station_far");

  return {
    fixReasons,
    checkReasons,
    allReasons: [...fixReasons, ...checkReasons]
  };
}

function deriveRegionalSanity(row) {
  const flags = row.flags || {};

  if (
    flags.severeDistanceProxy ||
    flags.suspiciousRuntimeMismatch ||
    flags.cityPreferredVeryFar ||
    flags.cityRuntimeVeryFar
  ) {
    return "suspicious";
  }

  if (
    flags.longDistanceProxy ||
    flags.cityPreferredFar ||
    flags.cityRuntimeFar ||
    row.runtimeSource === "nearest_valid_daily" ||
    row.runtimeSource === "nearest_valid_monthly" ||
    row.runtimeSource === "lookup_fallback" ||
    row.runtimeSource === "lookup_alias" ||
    row.runtimeSource === "alias" ||
    flags.missingPreferredMeta ||
    flags.missingRuntimeMeta
  ) {
    return "borderline";
  }

  return "normal";
}

function deriveSuggestedFix(row, reasons) {
  const all = new Set(reasons.allReasons);

  if (all.has("missing_frost")) return "fix frost mapping";

  if (
    all.has("missing_runtime_station") ||
    all.has("missing_runtime_series") ||
    all.has("missing_gdd_apr15") ||
    all.has("missing_gdd_may01") ||
    all.has("missing_gdd_jun01") ||
    all.has("nearest_daily_runtime") ||
    all.has("nearest_monthly_runtime")
  ) {
    return "seed station";
  }

  if (
    all.has("missing_preferred_station") ||
    all.has("lookup_fallback_runtime") ||
    all.has("lookup_alias_runtime") ||
    all.has("city_preferred_station_far") ||
    all.has("city_preferred_station_very_far") ||
    all.has("city_runtime_station_far") ||
    all.has("city_runtime_station_very_far")
  ) {
    return "add city override";
  }

  if (all.has("alias_runtime")) {
    if (Number.isFinite(row.stationDistanceKm) && row.stationDistanceKm <= 15) {
      return "none";
    }
    return "fix alias";
  }

  if (
    all.has("severe_station_distance") ||
    all.has("suspicious_runtime_mismatch")
  ) {
    return "inspect manually";
  }

  if (
    all.has("missing_preferred_meta") ||
    all.has("missing_runtime_meta") ||
    all.has("station_distance_review")
  ) {
    return "inspect manually";
  }

  return "none";
}

function deriveOutcome(row, reasons, regionalSanity) {
  if (reasons.fixReasons.length > 0) return "fix";
  if (regionalSanity === "suspicious") return "fix";
  if (reasons.checkReasons.length > 0 || regionalSanity === "borderline") return "check";
  return "pass";
}

module.exports = cities
  .map((city) => {
    const stationResolution = resolveCityStation(city);
    const frostRow = findFrostRow(city);
    const curve = stationResolution.runtimeStationId
      ? getStationSeries(stationResolution.runtimeStationId)
      : null;

    const springFrost = frostRow?.lastFrost || null;
    const fallFrost = frostRow?.firstFrost || null;

    const springDoy = mmddToDayOfYear(springFrost);
    const fallDoy = mmddToDayOfYear(fallFrost);

    const frostFreeDays =
      Number.isFinite(springDoy) &&
      Number.isFinite(fallDoy) &&
      fallDoy > springDoy
        ? Math.round(fallDoy - springDoy)
        : null;

    const gddApr15 = getRemainingFromCurve(curve, 50, "04-15");
    const gddMay01 = getRemainingFromCurve(curve, 50, "05-01");
    const gddJun01 = getRemainingFromCurve(curve, 50, "06-01");

    const preferredStationMeta = stationResolution.preferredStationMeta || null;
    const runtimeStationMeta = stationResolution.runtimeStationMeta || null;

    const preferredStationName = preferredStationMeta?.name || null;
    const runtimeStationName = runtimeStationMeta?.name || null;

    const sameStation =
      stationResolution.preferredStationId &&
      stationResolution.runtimeStationId &&
      stationResolution.preferredStationId === stationResolution.runtimeStationId;

    const suspiciousRuntimeMismatch =
      !sameStation &&
      Number.isFinite(stationResolution.stationDistanceKm) &&
      stationResolution.stationDistanceKm > 150;

    const cityToPreferredStationKm = computeCityToStationKm(city, preferredStationMeta);
    const cityToRuntimeStationKm = computeCityToStationKm(city, runtimeStationMeta);

    const row = {
      key: city.key,
      name: city.name,
      lookupKey: city.lookupKey || null,
      country: city.country || null,
      regionKind: city.regionKind || null,
      regionKey: city.regionKey || null,
      regionName: city.regionName || null,
      regionAbbr: city.regionAbbr || null,

      cityLat: city.lat != null ? city.lat : null,
      cityLon: city.lon != null ? city.lon : null,

      preferredStationId: stationResolution.preferredStationId || null,
      preferredStationName,
      runtimeStationId: stationResolution.runtimeStationId || null,
      runtimeStationName,

      runtimeSource: stationResolution.runtimeSource || null,
      runtimeSeriesType: stationResolution.runtimeSeriesType || null,
      aliasFromStationId: stationResolution.aliasFromStationId || null,
      aliasToStationId: stationResolution.aliasToStationId || null,

      stationDistanceKm: stationResolution.stationDistanceKm,
      stationMismatchFlag: stationResolution.stationMismatchFlag || "",

      cityToPreferredStationKm,
      cityToRuntimeStationKm,

      springFrost,
      fallFrost,
      frostFreeDays,

      gddApr15: Number.isFinite(gddApr15) ? gddApr15 : null,
      gddMay01: Number.isFinite(gddMay01) ? gddMay01 : null,
      gddJun01: Number.isFinite(gddJun01) ? gddJun01 : null,

      frostStatus: springFrost && fallFrost ? "ok" : "missing",
      gddStatus: {
        apr15: Number.isFinite(gddApr15) ? "ok" : "missing",
        may01: Number.isFinite(gddMay01) ? "ok" : "missing",
        jun01: Number.isFinite(gddJun01) ? "ok" : "missing"
      },

      flags: {
        ...stationResolution.flags,
        missingFrost: !springFrost || !fallFrost,
        missingCheckpointApr15: !Number.isFinite(gddApr15),
        missingCheckpointMay01: !Number.isFinite(gddMay01),
        missingCheckpointJun01: !Number.isFinite(gddJun01),
        suspiciousRuntimeMismatch,

        cityPreferredFar:
          Number.isFinite(cityToPreferredStationKm) && cityToPreferredStationKm > 50,
        cityPreferredVeryFar:
          Number.isFinite(cityToPreferredStationKm) && cityToPreferredStationKm > 100,

        cityRuntimeFar:
          Number.isFinite(cityToRuntimeStationKm) && cityToRuntimeStationKm > 50,
        cityRuntimeVeryFar:
          Number.isFinite(cityToRuntimeStationKm) && cityToRuntimeStationKm > 100
      },

      manualPublishAllowed: cityPublishAllowlist.has(city.key),
      qaAllowed: cityQaAllowlist.has(city.key)
    };

    const reasons = buildDetailedReasons(row);
    const regionalSanity = deriveRegionalSanity(row);
    const outcome = deriveOutcome(row, reasons, regionalSanity);
    const suggestedFix = deriveSuggestedFix(row, reasons);

    return {
      ...row,

      outcome,
      suggestedFix,
      regionalSanity,

      detailedReasons: reasons.allReasons,
      fixReasons: reasons.fixReasons,
      checkReasons: reasons.checkReasons,

      readinessStatus:
        outcome === "pass" ? "ready" : outcome === "check" ? "review" : "hold",
      readinessReasons: reasons.allReasons,
      readinessReason: reasons.allReasons.join(", ") || "clean",

      recommendedPublish:
        row.manualPublishAllowed && outcome === "pass"
    };
  })
  .sort((a, b) => {
    if (a.regionName !== b.regionName) {
      return String(a.regionName || "").localeCompare(String(b.regionName || ""));
    }
    return String(a.name || "").localeCompare(String(b.name || ""));
  });