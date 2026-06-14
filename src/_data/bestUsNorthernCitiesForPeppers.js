const cities = require("./cities.json");
const cropCityCrops = require("./cropCityCrops");
const { buildCitySummaries } = require("./_lib/citySummaries");
const { buildCropClimateRecord } = require("./_lib/buildCropClimateRecord");
const { scoreCropFit } = require("./_lib/dataRankingScoring");

const MIN_NORTHERN_LATITUDE = 40;

let cache = null;

function pepperReason(row, fit) {
  const margin = Number(row.gddMargin);
  if (fit.score >= 90 && margin >= 1000) {
    return `${row.cityName} combines northern latitude with a large pepper heat margin, giving gardeners more room for sweet, hot, and longer-season pepper types.`;
  }
  if (fit.score >= 75) {
    return `${row.cityName} has enough warmth and season length for outdoor peppers to be a strong fit when transplants go out on time.`;
  }
  if (fit.score >= 60) {
    return `${row.cityName} is workable for peppers by northern standards, though timely starts, warm soil, and variety choice still matter.`;
  }
  if (fit.score >= 40) {
    return `${row.cityName} can grow peppers outdoors, but the margin is tight enough that fast varieties and warm microclimates become important.`;
  }
  return `${row.cityName} is a difficult northern pepper location in a typical season without early transplants, fast varieties, protection, or a warmer site.`;
}

module.exports = function () {
  if (cache) return cache;

  const peppers = cropCityCrops.find((crop) => crop.key === "peppers");
  const northernUsCities = cities.filter(
    (city) => city.country === "usa" && Number(city.lat) >= MIN_NORTHERN_LATITUDE
  );
  const citySummaries = buildCitySummaries(northernUsCities);

  const entries = citySummaries
    .map((citySummary) => {
      if (!peppers) return null;
      const record = buildCropClimateRecord(citySummary, peppers);
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
      const twoWeeksLate = record.timing?.delayAnalysis?.rows?.find((row) => row.label === "2 weeks late");

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
        reason: pepperReason(scoreInput, fit),
        confidence: scoreInput.confidence,
        frostFreeDays: scoreInput.frostFreeDays,
        availableGddFromPlanting: record.heat?.availableFromPlanting ?? null,
        targetGdd: record.heat?.targetTypical ?? null,
        gddMargin: scoreInput.gddMargin,
        twoWeekLateMargin: twoWeeksLate?.gddMargin ?? null,
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
    key: "best-us-northern-cities-for-peppers",
    title: "Best U.S. Northern Cities for Peppers",
    shortTitle: "Best Northern U.S. Pepper Cities",
    slug: "best-us-northern-cities-for-peppers",
    permalink: "/data/rankings/best-us-northern-cities-for-peppers/",
    description:
      "Northern U.S. cities ranked by outdoor pepper suitability, heat margin, frost-free days, and variety flexibility.",
    updated: "2026-06-13",
    category: "Data ranking",
    methodology:
      "U.S. cities at or above 40°N latitude are ranked for outdoor pepper fit using local GDD margin from the typical transplant window, frost-free days, delay tolerance, and pepper variety flexibility.",
    caveat:
      "This ranking compares climate fit, not gardener skill or local garden conditions. Peppers are especially sensitive to transplant quality, soil warmth, night temperatures, sunlight, wind shelter, watering, and variety choice.",
    northernLatitudeCutoff: MIN_NORTHERN_LATITUDE,
    top: entries[0] || null,
    hardest: entries[entries.length - 1] || null,
    entries
  };

  return cache;
};
