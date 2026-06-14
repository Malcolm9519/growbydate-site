const cities = require("./cities.json");
const cropCityCrops = require("./cropCityCrops");
const { buildCitySummaries } = require("./_lib/citySummaries");
const { buildCropClimateRecord } = require("./_lib/buildCropClimateRecord");
const { scoreWatermelonReality } = require("./_lib/watermelonRealityScoring");

const MIN_NORTHERN_LATITUDE = 40;

let cache = null;

function confidenceToBadge(confidence) {
  const key = String(confidence || "").toLowerCase();
  if (key === "surplus") return "surplus";
  if (key === "strong") return "strong";
  if (key === "good") return "good";
  if (key === "borderline") return "borderline";
  return "risky";
}

module.exports = function () {
  if (cache) return cache;

  const watermelons = cropCityCrops.find((crop) => crop.key === "watermelons");
  const northernUsCities = cities.filter(
    (city) => city.country === "usa" && Number(city.lat) >= MIN_NORTHERN_LATITUDE
  );
  const citySummaries = buildCitySummaries(northernUsCities);

  const entries = citySummaries
    .map((citySummary) => {
      if (!watermelons) return null;
      const record = buildCropClimateRecord(citySummary, watermelons);
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
      const reality = scoreWatermelonReality(scoreInput);
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
        score: reality.score,
        label: reality.label,
        tone: reality.tone,
        reason: reality.reason,
        badgeClass: confidenceToBadge(scoreInput.confidence),
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
        varietyFitSentence: record.diagnostics?.varietyFitSentence || null,
        mainRiskSentence: record.diagnostics?.mainRiskSentence || null,
        components: reality.components
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

  const borderline = entries.filter((row) => row.score >= 40 && row.score < 60);
  const longShots = entries.filter((row) => row.score < 40);

  cache = {
    key: "best-us-northern-cities-for-watermelon",
    title: "Best U.S. Northern Cities for Watermelon",
    shortTitle: "Best Northern U.S. Watermelon Cities",
    slug: "best-us-northern-cities-for-watermelon",
    permalink: "/data/rankings/best-us-northern-cities-for-watermelon/",
    description:
      "Northern U.S. cities ranked by how realistic outdoor watermelon is in a typical outdoor season.",
    updated: "2026-06-13",
    category: "Data ranking",
    cropKey: "watermelons",
    cropName: "Watermelons",
    methodology:
      "U.S. cities at or above 40°N latitude are ranked for outdoor watermelon fit using local GDD margin from the typical planting window, frost-free days, delay tolerance, and watermelon variety flexibility.",
    caveat:
      "This ranking compares climate fit, not gardener skill or local garden conditions. Watermelon still depends heavily on warm soil, full sun, wind shelter, transplant quality, irrigation, plastic mulch, row cover, and variety choice.",
    northernLatitudeCutoff: MIN_NORTHERN_LATITUDE,
    top: entries[0] || null,
    hardest: entries[entries.length - 1] || null,
    borderline,
    longShots,
    entries
  };

  return cache;
};
