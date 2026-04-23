const gddStations = require("../gddStations.json");
const stationsMeta = require("../stationsMeta.json");
const stationSeriesAliases = require("./stationSeriesAliases");
const cityStationOverrides = require("./cityStationOverrides");

const stationSeriesCache = new Map();

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

function normalizeCandidates(rawKey) {
  const s = String(rawKey || "").trim().toUpperCase();
  if (!s) return [];

  const out = [s];

  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(s.replace(/\s+/g, ""))) {
    out.push(s.replace(/\s+/g, "").slice(0, 3));
  } else if (/^[A-Z]\d[A-Z]/.test(s)) {
    out.push(s.slice(0, 3));
  }

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

function getStationSeries(stationId) {
  if (!stationId) return null;

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

function getAliasedSeriesStationId(stationId) {
  if (!stationId) return null;

  if (stationSeriesAliases[stationId]) {
    const aliased = stationSeriesAliases[stationId];
    return getStationSeries(aliased) ? aliased : null;
  }

  if (getStationSeries(stationId)) {
    return stationId;
  }

  return null;
}

function getSeriesType(stationId) {
  const data = getStationSeries(stationId);
  if (!data) return null;

  if (data.daily || data.dailyNormals || data.daily_normals) return "daily";
  if (data.monthly || data.monthlyNormals || data.monthly_normals) return "monthly";

  if (data.remaining || data.remainingByBase || data.remainingGddByBase || data.bases) {
    return "daily";
  }

  return "unknown";
}

function hasUsableSeries(stationId) {
  return Boolean(getAliasedSeriesStationId(stationId));
}

function pickBestMetadataStationForCity(city) {
  if (city.lat == null || city.lon == null) {
    return lookupStationId(city.lookupKey);
  }

  const cityName = normalizeName(city.name || "");
  const firstWord = cityName.split(" ")[0] || "";

  let bestStation = null;
  let bestScore = Infinity;

  for (const [stationId, meta] of Object.entries(stationsMeta)) {
    if (!meta || meta.lat == null || meta.lon == null) continue;

    const dist = haversineKm(city.lat, city.lon, meta.lat, meta.lon);
    if (dist > 120) continue;

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
    const lookupId = lookupStationId(city.lookupKey);
    return lookupId ? getAliasedSeriesStationId(lookupId) : null;
  }

  let bestStation = null;
  let bestScore = Infinity;
  let bestType = null;

  const cityName = normalizeName(city.name || "");
  const firstWord = cityName.split(" ")[0] || "";

  for (const [stationId, meta] of Object.entries(stationsMeta)) {
    if (!meta || meta.lat == null || meta.lon == null) continue;

    const usableSeriesStationId = getAliasedSeriesStationId(stationId);
    if (!usableSeriesStationId) continue;

    const seriesType = getSeriesType(usableSeriesStationId);
    const dist = haversineKm(originLat, originLon, meta.lat, meta.lon);
    if (dist > 120) continue;

    const stationName = normalizeName(meta.name || "");
    const exactNameMatch = cityName && stationName.includes(cityName);
    const firstWordMatch = firstWord && stationName.includes(firstWord);

    let score = dist;

    if (exactNameMatch) score -= 25;
    else if (firstWordMatch) score -= 10;

    if (seriesType === "daily") score -= 2;

    if (score < bestScore) {
      bestScore = score;
      bestStation = usableSeriesStationId;
      bestType = seriesType;
    }
  }

  return {
    stationId: bestStation || null,
    seriesType: bestType || null
  };
}

function resolveCityStation(city) {
  const overrideStationId = cityStationOverrides[city.key] || null;
  const lookupStationIdValue = lookupStationId(city.lookupKey);

  const preferredStationId =
    overrideStationId ||
    lookupStationIdValue ||
    pickBestMetadataStationForCity(city) ||
    null;

  const preferredStationMeta = preferredStationId
    ? stationsMeta[preferredStationId] || null
    : null;

  const directSeriesStationId = getAliasedSeriesStationId(preferredStationId);

  let runtimeStationId = null;
  let runtimeSource = "none";
  let runtimeSeriesType = null;
  let aliasFromStationId = null;
  let aliasToStationId = null;

  if (directSeriesStationId) {
    runtimeStationId = directSeriesStationId;
    runtimeSeriesType = getSeriesType(directSeriesStationId);

    if (directSeriesStationId !== preferredStationId) {
      runtimeSource = "alias";
      aliasFromStationId = preferredStationId;
      aliasToStationId = directSeriesStationId;
    } else {
      runtimeSource = "preferred_direct";
    }
  } else {
    const nearby = pickBestSeriesStationForCity(city, preferredStationMeta);

    if (nearby && nearby.stationId) {
      runtimeStationId = nearby.stationId;
      runtimeSeriesType = nearby.seriesType || getSeriesType(nearby.stationId);
      runtimeSource =
        runtimeSeriesType === "monthly"
          ? "nearest_valid_monthly"
          : "nearest_valid_daily";
    } else if (lookupStationIdValue) {
      const lookupSeriesStationId = getAliasedSeriesStationId(lookupStationIdValue);

      if (lookupSeriesStationId) {
        const lookupMeta = stationsMeta[lookupStationIdValue] || null;

        const originLat =
          preferredStationMeta && preferredStationMeta.lat != null
            ? preferredStationMeta.lat
            : city.lat;

        const originLon =
          preferredStationMeta && preferredStationMeta.lon != null
            ? preferredStationMeta.lon
            : city.lon;

        let allowLookupFallback = true;

        if (
          lookupMeta &&
          lookupMeta.lat != null &&
          lookupMeta.lon != null &&
          originLat != null &&
          originLon != null
        ) {
          const dist = haversineKm(originLat, originLon, lookupMeta.lat, lookupMeta.lon);
          allowLookupFallback = dist <= 120;
        }

        if (allowLookupFallback) {
          runtimeStationId = lookupSeriesStationId;
          runtimeSeriesType = getSeriesType(lookupSeriesStationId);

          if (lookupSeriesStationId !== lookupStationIdValue) {
            runtimeSource = "lookup_alias";
            aliasFromStationId = lookupStationIdValue;
            aliasToStationId = lookupSeriesStationId;
          } else {
            runtimeSource = "lookup_fallback";
          }
        }
      }
    }
  }

  const runtimeStationMeta = runtimeStationId
    ? stationsMeta[runtimeStationId] || null
    : null;

  const stationDistanceKm =
    preferredStationMeta &&
    runtimeStationMeta &&
    preferredStationMeta.lat != null &&
    preferredStationMeta.lon != null &&
    runtimeStationMeta.lat != null &&
    runtimeStationMeta.lon != null
      ? Math.round(
          haversineKm(
            preferredStationMeta.lat,
            preferredStationMeta.lon,
            runtimeStationMeta.lat,
            runtimeStationMeta.lon
          ) * 10
        ) / 10
      : null;

  const stationMismatchFlag =
    stationDistanceKm != null && stationDistanceKm > 25 ? "review" : "";

  return {
    cityKey: city.key,
    cityName: city.name || null,
    lookupKey: city.lookupKey || null,

    preferredStationId: preferredStationId || null,
    preferredStationMeta,
    runtimeStationId: runtimeStationId || null,
    runtimeStationMeta,

    runtimeSource,
    runtimeSeriesType: runtimeSeriesType || null,

    overrideStationId,
    lookupStationId: lookupStationIdValue || null,
    aliasFromStationId,
    aliasToStationId,

    stationDistanceKm,
    stationMismatchFlag,

    flags: {
      usedOverride: Boolean(overrideStationId),
      usedLookupStation: Boolean(lookupStationIdValue),
      usedAlias:
        runtimeSource === "alias" || runtimeSource === "lookup_alias",
      missingPreferredStation: !preferredStationId,
      missingPreferredMeta: !preferredStationMeta,
      missingRuntimeStation: !runtimeStationId,
      missingRuntimeMeta: !runtimeStationMeta,
      missingRuntimeSeries: !runtimeStationId || !hasUsableSeries(runtimeStationId),
      longDistanceProxy: Number.isFinite(stationDistanceKm) && stationDistanceKm > 25,
      severeDistanceProxy: Number.isFinite(stationDistanceKm) && stationDistanceKm > 150
    }
  };
}

module.exports = {
  haversineKm,
  normalizeName,
  normalizeCandidates,
  lookupStationId,
  getStationSeries,
  getAliasedSeriesStationId,
  getSeriesType,
  hasUsableSeries,
  pickBestMetadataStationForCity,
  pickBestSeriesStationForCity,
  resolveCityStation
};