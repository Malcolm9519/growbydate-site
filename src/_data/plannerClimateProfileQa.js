const cities = require("./cities.json");
const cityStationOverrides = require("./_lib/cityStationOverrides");
const stationSeriesAliases = require("./_lib/stationSeriesAliases");
const coverageGroups = require("./_lib/plannerClimateCoverageGroups");
const buildPlannerClimateProfiles = require("./plannerClimateProfiles");
const probeKeys = require("./_lib/plannerClimateQaProbeKeys");

const CANADIAN_POSTAL_SUFFIX_LETTERS = "ABCEGHJKLMNPRSTVWXYZ";

function normalizeKey(rawKey) {
  const compact = String(rawKey || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return "";
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)) return compact.slice(0, 3);
  if (/^[A-Z]\d[A-Z]$/.test(compact)) return compact;
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
  for (const key of group.keys || []) keys.push(...lookupCandidates(key));
  for (const range of group.fsaRanges || []) keys.push(...expandFsaRange(range));
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

function resolveCityStation(city) {
  if (!city) return "";
  const cityKey = String(city.key || "");
  const stationId = cityStationOverrides[cityKey] || cityStationOverrides[cityKey.toLowerCase()] || city.gddStationId || "";
  return stationId ? (stationSeriesAliases[stationId] || stationId) : "";
}

function resolveGroupStation(group, cityIndex) {
  if (group.stationId) return stationSeriesAliases[group.stationId] || group.stationId;
  if (!group.cityKey) return "";
  return resolveCityStation(cityIndex.get(normalizeCityKey(group.cityKey)));
}

function countryCodeForCity(city) {
  const country = String(city?.country || "").trim().toLowerCase();
  if (country === "canada") return "CA";
  if (country === "united-states" || country === "united states" || country === "usa") return "US";
  return String(city?.country || "").trim().toUpperCase();
}

function expectedGroupIdentity(group, cityIndex) {
  const city = group.cityKey ? cityIndex.get(normalizeCityKey(group.cityKey)) : null;
  return {
    name: group.name || city?.name || "",
    region: group.region || city?.regionAbbr || city?.region || "",
    country: group.country || countryCodeForCity(city) || ""
  };
}

function publicProfile(profile) {
  if (!profile) return null;
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

function resolveProfileForInput(profiles, rawKey) {
  for (const candidate of lookupCandidates(rawKey)) {
    if (profiles[candidate]) return profiles[candidate];
  }
  return null;
}

function checkKnownRegressions(profiles) {
  const expected = [
    { input: "V2T", expectedStationId: "CA-1100030", note: "Abbotsford should not resolve to Bonilla Island." },
    { input: "V2T 1A1", expectedStationId: "CA-1100030", note: "Full Canadian postal code should normalize to V2T." },
    { input: "V2S", expectedStationId: "CA-1100030", note: "Abbotsford-area FSA." },
    { input: "V3G", expectedStationId: "CA-1100030", note: "Abbotsford-area FSA." },
    { input: "V4X", expectedStationId: "CA-1100030", note: "Abbotsford-area FSA." }
  ];

  return expected.map((test) => {
    const profile = resolveProfileForInput(profiles, test.input);
    const actual = profile && profile.gddStationId;
    return {
      ...test,
      normalizedKey: normalizeKey(test.input),
      actualStationId: actual || "",
      status: actual === test.expectedStationId ? "ok" : "review",
      profile: publicProfile(profile)
    };
  });
}

function checkCoverageGroups(profiles, cityIndex) {
  return (coverageGroups || []).map((group, index) => {
    const expectedStationId = resolveGroupStation(group, cityIndex);
    const expectedIdentity = expectedGroupIdentity(group, cityIndex);
    const keys = expandCoverageGroupKeys(group);
    const rows = keys.map((key) => {
      const profile = profiles[key];
      const actualStationId = profile && profile.gddStationId;
      const missing = !profile;
      const stationMismatch = expectedStationId && actualStationId && actualStationId !== expectedStationId;
      const sourceLooksCurated = profile && profile.climateProfileSource === "coverage-group";
      const nameMismatch = expectedIdentity.name && profile && profile.name !== expectedIdentity.name;
      const regionMismatch = expectedIdentity.region && profile && profile.region !== expectedIdentity.region;
      const countryMismatch = expectedIdentity.country && profile && profile.country !== expectedIdentity.country;

      return {
        key,
        expectedStationId,
        actualStationId: actualStationId || "",
        expectedName: expectedIdentity.name,
        actualName: profile ? profile.name : "",
        expectedRegion: expectedIdentity.region,
        actualRegion: profile ? profile.region : "",
        expectedCountry: expectedIdentity.country,
        actualCountry: profile ? profile.country : "",
        matchedFrostKey: profile ? profile.matchedFrostKey : "",
        source: profile ? profile.climateProfileSource : "missing",
        confidence: profile ? profile.confidence : "missing",
        status: missing || stationMismatch || !sourceLooksCurated || nameMismatch || regionMismatch || countryMismatch ? "review" : "ok"
      };
    });

    const reviewCount = rows.filter((row) => row.status !== "ok").length;
    return {
      index,
      label: group.name || group.cityKey || group.stationId || `coverage-group-${index}`,
      cityKey: group.cityKey || "",
      stationId: group.stationId || "",
      expectedStationId,
      expectedIdentity,
      keyCount: keys.length,
      reviewCount,
      status: reviewCount ? "review" : "ok",
      rows
    };
  });
}

function checkProbeKeys(profiles) {
  return (probeKeys || []).map((rawInput) => {
    const profile = resolveProfileForInput(profiles, rawInput);
    return {
      input: rawInput,
      normalizedKey: normalizeKey(rawInput),
      candidates: lookupCandidates(rawInput),
      status: profile ? "resolved" : "missing",
      profile: publicProfile(profile)
    };
  });
}

function summarizeSources(profiles) {
  const counts = {};
  for (const profile of Object.values(profiles || {})) {
    const source = profile.climateProfileSource || "unknown";
    counts[source] = (counts[source] || 0) + 1;
  }
  return counts;
}

function sampleFallbackProfiles(profiles, limit = 50) {
  return Object.values(profiles || [])
    .filter((profile) => profile.climateProfileSource === "base-frost-plus-planner-gdd")
    .slice(0, limit)
    .map(publicProfile);
}

module.exports = function plannerClimateProfileQa() {
  const profiles = buildPlannerClimateProfiles();
  const cityIndex = buildCityIndex(cities);
  const knownRegressions = checkKnownRegressions(profiles);
  const coverageGroupChecks = checkCoverageGroups(profiles, cityIndex);
  const probeKeyChecks = checkProbeKeys(profiles);

  const reviewItems = [
    ...knownRegressions.filter((row) => row.status !== "ok"),
    ...coverageGroupChecks.flatMap((group) => group.rows.filter((row) => row.status !== "ok"))
  ];

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      profileCount: Object.keys(profiles || {}).length,
      sourceCounts: summarizeSources(profiles),
      knownRegressionReviewCount: knownRegressions.filter((row) => row.status !== "ok").length,
      coverageGroupCount: coverageGroupChecks.length,
      coverageGroupReviewCount: coverageGroupChecks.reduce((sum, group) => sum + group.reviewCount, 0),
      probeKeyCount: probeKeyChecks.length,
      reviewItemCount: reviewItems.length
    },
    howToUse: {
      addMoreProbeKeysIn: "src/_data/_lib/plannerClimateQaProbeKeys.js",
      openReportAt: "/assets/data/qa/planner-climate-profile-qa.json",
      mainSignal: "Known regressions and coverage groups should be ok. Probe keys are for manual spot checks of random user inputs."
    },
    knownRegressions,
    coverageGroupChecks,
    probeKeyChecks,
    fallbackProfileSample: sampleFallbackProfiles(profiles, 50),
    reviewItems
  };
};
