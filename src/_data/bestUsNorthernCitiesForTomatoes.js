const cities = require("./cities.json");
const cropCityCrops = require("./cropCityCrops");
const { buildCitySummaries } = require("./_lib/citySummaries");
const { buildCropClimateRecord } = require("./_lib/buildCropClimateRecord");
const { scoreCropFit } = require("./_lib/dataRankingScoring");

const MIN_NORTHERN_LATITUDE = 40;

let cache = null;

function tomatoReason(row, fit) {
  const margin = Number(row.gddMargin);
  if (fit.score >= 95 && margin >= 1500) {
    return `${row.cityName} combines a northern latitude with a very large tomato heat margin, giving gardeners strong variety flexibility in a typical season.`;
  }
  if (fit.score >= 85) {
    return `${row.cityName} has enough heat and season length for tomatoes to be a strong outdoor fit when transplants go out on time.`;
  }
  if (fit.score >= 70) {
    return `${row.cityName} is a good tomato city by northern standards, though variety choice and planting timing still matter.`;
  }
  if (fit.score >= 50) {
    return `${row.cityName} can grow tomatoes outdoors, but the margin is tighter and early varieties are a safer bet.`;
  }
  return `${row.cityName} is a difficult northern tomato location in a typical season without fast varieties, warmer sites, or protection.`;
}

module.exports = function () {
  if (cache) return cache;

  const tomato = cropCityCrops.find((crop) => crop.key === "tomatoes");
  const northernUsCities = cities.filter(
    (city) => city.country === "usa" && Number(city.lat) >= MIN_NORTHERN_LATITUDE
  );
  const citySummaries = buildCitySummaries(northernUsCities);

  const entries = citySummaries
    .map((citySummary) => {
      if (!tomato) return null;
      const record = buildCropClimateRecord(citySummary, tomato);
      const originalCity = northernUsCities.find((city) => city.key === record.cityKey);
      if (!originalCity) return null;

      const scoreInput = {
        cityName: record.cityName,
        confidence: record.fit?.confidence || null,
        gddMargin: record.heat?.margin ?? null,
        frostFreeDays: record.frost?.frostFreeDays ?? null,
        fittingVarietyLabels: record.fit?.fittingVarietyLabels || [],
        delayAnalysis: record.timing?.delayAnalysis || null
      };
      const fit = scoreCropFit(scoreInput);

      return {
        rank: null,
        cityKey: record.cityKey,
        cityName: record.cityName,
        regionKey: record.regionKey,
        regionName: record.regionName,
        regionAbbr: originalCity.regionAbbr,
        country: record.country,
        cropKey: record.cropKey,
        cropName: record.cropName,
        latitude: Number(originalCity.lat),
        url: record.urlBase,
        score: fit.score,
        label: fit.label,
        badgeClass: fit.badgeClass,
        reason: tomatoReason(scoreInput, fit),
        confidence: scoreInput.confidence,
        frostFreeDays: scoreInput.frostFreeDays,
        availableGddFromPlanting: record.heat?.availableFromPlanting ?? null,
        targetGdd: record.heat?.targetTypical ?? null,
        gddMargin: scoreInput.gddMargin,
        primaryPlantingDate: record.planting?.primaryPlantingDate || null,
        springFrost: record.frost?.spring50 || null,
        fallFrost: record.frost?.fall50 || null,
        fittingVarietyLabels: scoreInput.fittingVarietyLabels,
        bestVarietyLabel: record.fit?.bestVarietyLabel || null,
        mainRiskSentence: record.diagnostics?.mainRiskSentence || null,
        components: fit.components
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.gddMargin !== a.gddMargin) return b.gddMargin - a.gddMargin;
      if (b.frostFreeDays !== a.frostFreeDays) return b.frostFreeDays - a.frostFreeDays;
      return a.cityName.localeCompare(b.cityName);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  cache = {
    key: "best-us-northern-cities-for-tomatoes",
    title: "Best U.S. Northern Cities for Tomatoes",
    shortTitle: "Best Northern U.S. Tomato Cities",
    slug: "best-us-northern-cities-for-tomatoes",
    permalink: "/data/rankings/best-us-northern-cities-for-tomatoes/",
    description:
      "Northern U.S. cities ranked by outdoor tomato suitability, heat margin, frost-free days, and variety flexibility.",
    updated: "2026-06-13",
    category: "Data ranking",
    methodology:
      "U.S. cities at or above 40°N latitude are ranked for outdoor tomato fit using local GDD margin from the typical planting window, frost-free days, delay tolerance, and tomato variety flexibility.",
    caveat:
      "This ranking compares climate fit, not gardener skill or local garden conditions. Tomatoes still respond strongly to transplant quality, soil warmth, sunlight, wind shelter, watering, disease pressure, and variety choice.",
    northernLatitudeCutoff: MIN_NORTHERN_LATITUDE,
    top: entries[0] || null,
    hardest: entries[entries.length - 1] || null,
    entries
  };

  return cache;
};
