const cropCitySummaries = require("./cropCitySummaries");
const { clamp, scoreCropFit } = require("./_lib/dataRankingScoring");

function getPainLabel(score) {
  if (score >= 85) return "High pepper pain";
  if (score >= 70) return "Very timing-sensitive";
  if (score >= 55) return "Moderate pepper pain";
  if (score >= 35) return "Manageable with care";
  return "Relatively forgiving";
}

function getPainBadgeClass(score) {
  if (score >= 85) return "risky";
  if (score >= 70) return "borderline";
  if (score >= 55) return "good";
  return "strong";
}

function getTone(score) {
  if (score >= 85) return "Possible, but dramatic.";
  if (score >= 70) return "Plan on early starts and warm sites.";
  if (score >= 55) return "Not impossible, but not casual.";
  if (score >= 35) return "Reasonable with good timing.";
  return "One of the easier pepper climates in this dataset.";
}

function reason(row, fit, painScore) {
  const margin = Number(row.gddMargin);
  if (painScore >= 85) {
    return `${row.cityName} has a tight pepper heat window, so peppers are highly dependent on transplants, warm microclimates, and fast varieties.`;
  }
  if (painScore >= 70) {
    return `${row.cityName} can grow peppers outdoors, but the GDD margin leaves limited room for late planting or slow-ripening varieties.`;
  }
  if (painScore >= 55) {
    return `${row.cityName} has enough season for peppers with disciplined timing, though the crop is still more sensitive than tomatoes or squash.`;
  }
  if (margin >= 500 && fit.score >= 75) {
    return `${row.cityName} has a comfortable pepper margin compared with colder short-season locations.`;
  }
  return `${row.cityName} is one of the more manageable pepper locations in the current dataset.`;
}

module.exports = function () {
  const entries = cropCitySummaries()
    .filter((summary) => summary.cropKey === "peppers")
    .map((summary) => {
      const fit = scoreCropFit(summary);
      const margin = Number(summary.gddMargin);
      const frostFreeDays = Number(summary.frostFreeDays);
      const varietyCount = Array.isArray(summary.fittingVarietyLabels) ? summary.fittingVarietyLabels.length : 0;

      const marginPenalty = Number.isFinite(margin)
        ? margin < -300
          ? 24
          : margin < 0
            ? 16
            : margin < 150
              ? 10
              : margin < 350
                ? 5
                : -4
        : 0;
      const frostPenalty = Number.isFinite(frostFreeDays)
        ? frostFreeDays < 115
          ? 9
          : frostFreeDays < 135
            ? 5
            : frostFreeDays > 180
              ? -3
              : 0
        : 0;
      const varietyPenalty = varietyCount === 0 ? 10 : varietyCount === 1 ? 6 : varietyCount === 2 ? 2 : -2;
      const painScore = clamp(100 - fit.score + marginPenalty + frostPenalty + varietyPenalty);

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
        score: painScore,
        label: getPainLabel(painScore),
        badgeClass: getPainBadgeClass(painScore),
        tone: getTone(painScore),
        reason: reason(summary, fit, painScore),
        cropFitScore: fit.score,
        cropFitLabel: fit.label,
        confidence: summary.confidence,
        frostFreeDays: summary.frostFreeDays,
        availableGddFromPlanting: summary.availableGddFromPlanting,
        targetGdd: summary.targetGdd,
        gddMargin: summary.gddMargin,
        primaryPlantingDate: summary.primaryPlantingDate,
        springFrost: summary.springFrost,
        fallFrost: summary.fallFrost,
        fittingVarietyLabels: summary.fittingVarietyLabels || [],
        components: {
          cropFitScore: fit.score,
          marginPenalty,
          frostPenalty,
          varietyPenalty,
          fitComponents: fit.components
        }
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.gddMargin - b.gddMargin;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    key: "the-pepper-pain-index",
    title: "The Pepper Pain Index",
    shortTitle: "Pepper Pain Index",
    slug: "the-pepper-pain-index",
    permalink: "/data/rankings/the-pepper-pain-index/",
    description:
      "A GrowByDate Data Ranking of where outdoor peppers are most likely to feel timing-sensitive, heat-limited, or fussy.",
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      "The Pepper Pain Index starts with each published pepper crop-city fit score, then adds pressure for low or negative GDD margin, shorter frost-free windows, and limited pepper variety flexibility. Higher scores mean peppers are more likely to need early transplants, warm sites, fast varieties, or protection.",
    caveat:
      "This is not a claim that peppers are impossible in high-pain locations. It is a practical warning that peppers are less forgiving there than easier warm-season crops.",
    top: entries[0] || null,
    easiest: entries[entries.length - 1] || null,
    entries
  };
};
