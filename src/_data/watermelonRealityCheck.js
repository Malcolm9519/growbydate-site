const cropCitySummaries = require("./cropCitySummaries");
const { scoreWatermelonReality } = require("./_lib/watermelonRealityScoring");

function confidenceToBadge(confidence) {
  const key = String(confidence || "").toLowerCase();
  if (key === "surplus") return "surplus";
  if (key === "strong") return "strong";
  if (key === "good") return "good";
  if (key === "borderline") return "borderline";
  return "risky";
}

module.exports = function () {
  const rows = cropCitySummaries()
    .filter((summary) => summary.cropKey === "watermelons")
    .map((summary) => {
      const reality = scoreWatermelonReality(summary);
      const twoWeeksLate = summary.delayAnalysis?.rows?.find((row) => row.label === "2 weeks late");

      return {
        rank: null,
        cityKey: summary.cityKey,
        cityName: summary.cityName,
        regionKey: summary.regionKey,
        regionName: summary.regionName,
        country: summary.country,
        cropKey: summary.cropKey,
        cropName: summary.cropName,
        url: summary.url,
        score: reality.score,
        label: reality.label,
        tone: reality.tone,
        reason: reality.reason,
        badgeClass: confidenceToBadge(summary.confidence),
        confidence: summary.confidence,
        frostFreeDays: summary.frostFreeDays,
        availableGddFromPlanting: summary.availableGddFromPlanting,
        targetGdd: summary.targetGdd,
        gddMargin: summary.gddMargin,
        twoWeekLateMargin: twoWeeksLate?.gddMargin ?? null,
        primaryPlantingDate: summary.primaryPlantingDate,
        springFrost: summary.springFrost,
        fallFrost: summary.fallFrost,
        fittingVarietyLabels: summary.fittingVarietyLabels || [],
        bestVarietyLabel: summary.fit?.bestVarietyLabel || null,
        varietyFitSentence: summary.fit?.varietyFitSentence || null,
        mainRiskSentence: summary.fit?.mainRiskSentence || null,
        components: reality.components
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.gddMargin - a.gddMargin;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const top = rows[0] || null;
  const hardest = rows[rows.length - 1] || null;
  const borderline = rows.filter((row) => row.score >= 40 && row.score < 60);
  const longShots = rows.filter((row) => row.score < 40);

  return {
    key: "the-watermelon-reality-check",
    title: "The Watermelon Reality Check",
    shortTitle: "Watermelon Reality Check",
    slug: "the-watermelon-reality-check",
    permalink: "/data/rankings/the-watermelon-reality-check/",
    description:
      "Watermelon locations ranked by how realistic outdoor watermelon is in a typical outdoor season.",
    updated: "2026-05-23",
    cropKey: "watermelons",
    cropName: "Watermelons",
    methodology:
      "Scores use local GDD margin, frost-free season length, delay tolerance, and the number of watermelon variety classes that fit the season.",
    caveat:
      "This is a planning signal, not a guarantee. It assumes outdoor growing in a typical season and does not fully capture microclimates, soil warmth, wind exposure, irrigation, or greenhouse conditions.",
    top,
    hardest,
    borderline,
    longShots,
    entries: rows
  };
};
