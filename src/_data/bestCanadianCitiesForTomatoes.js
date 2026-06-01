const cropCitySummaries = require("./cropCitySummaries");
const { scoreCropFit } = require("./_lib/dataRankingScoring");

function tomatoReason(row, fit) {
  const margin = Number(row.gddMargin);
  if (fit.score >= 90) {
    return `${row.cityName} has a large tomato heat margin, making outdoor tomatoes a realistic crop in a typical season.`;
  }
  if (fit.score >= 75) {
    return `${row.cityName} has enough outdoor heat for tomatoes when gardeners transplant on time and choose sensible varieties.`;
  }
  if (fit.score >= 60) {
    return `${row.cityName} can support outdoor tomatoes, but variety choice and timing still matter.`;
  }
  if (fit.score >= 40) {
    return `${row.cityName} is a borderline tomato location. The typical GDD margin is ${margin >= 0 ? "small" : "negative"}, so early varieties and good timing matter.`;
  }
  return `${row.cityName} is a difficult outdoor tomato location in a typical season without early varieties, warm sites, or protection.`;
}

module.exports = function () {
  const entries = cropCitySummaries()
    .filter((summary) => summary.country === "canada" && summary.cropKey === "tomatoes")
    .map((summary) => {
      const fit = scoreCropFit(summary);
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
        score: fit.score,
        label: fit.label,
        badgeClass: fit.badgeClass,
        reason: tomatoReason(summary, fit),
        confidence: summary.confidence,
        frostFreeDays: summary.frostFreeDays,
        availableGddFromPlanting: summary.availableGddFromPlanting,
        targetGdd: summary.targetGdd,
        gddMargin: summary.gddMargin,
        primaryPlantingDate: summary.primaryPlantingDate,
        springFrost: summary.springFrost,
        fallFrost: summary.fallFrost,
        fittingVarietyLabels: summary.fittingVarietyLabels || [],
        bestVarietyLabel: summary.fit?.bestVarietyLabel || null,
        mainRiskSentence: summary.fit?.mainRiskSentence || null,
        components: fit.components
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.gddMargin - a.gddMargin;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    key: "best-canadian-cities-for-tomatoes",
    title: "Best Canadian Cities for Tomatoes",
    shortTitle: "Best Canadian Tomato Cities",
    slug: "best-canadian-cities-for-tomatoes",
    permalink: "/data/rankings/best-canadian-cities-for-tomatoes/",
    description:
      "Canadian cities ranked by outdoor tomato fit.",
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      "Scores use local GDD margin, frost-free season length, delay tolerance, and tomato variety flexibility.",
    caveat:
      "Use this as a planning signal, not a guarantee. Microclimates, soil warmth, wind, irrigation, pests, and gardener skill can change real-world results.",
    top: entries[0] || null,
    hardest: entries[entries.length - 1] || null,
    entries
  };
};
