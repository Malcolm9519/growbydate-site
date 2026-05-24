const cropCitySummaries = require("./cropCitySummaries");
const { clamp, scoreCropFit } = require("./_lib/dataRankingScoring");

function frostSensitivity(crop) {
  const tolerance = String(crop?.frostTolerance || "").toLowerCase();
  if (["none", "tender"].includes(tolerance)) return 14;
  if (["light"].includes(tolerance)) return 7;
  if (["moderate"].includes(tolerance)) return 2;
  if (["hardy", "strong"].includes(tolerance)) return -5;
  return 4;
}

function delayPressure(summary) {
  const rows = summary.delayAnalysis?.rows || [];
  const one = rows.find((row) => row.label === "1 week late");
  const two = rows.find((row) => row.label === "2 weeks late");
  const oneMargin = Number(one?.gddMargin);
  const twoMargin = Number(two?.gddMargin);
  if (Number.isFinite(twoMargin) && twoMargin < -250) return 10;
  if (Number.isFinite(oneMargin) && oneMargin < 0) return 8;
  if (Number.isFinite(twoMargin) && twoMargin < 0) return 5;
  if (Number.isFinite(twoMargin) && twoMargin > 200) return -4;
  return 0;
}

function getPanicLabel(score) {
  if (score >= 85) return "Maximum frost panic";
  if (score >= 70) return "High frost panic";
  if (score >= 55) return "Timing-sensitive";
  if (score >= 35) return "Watch the calendar";
  return "Low panic";
}

function getPanicBadgeClass(score) {
  if (score >= 85) return "risky";
  if (score >= 70) return "borderline";
  if (score >= 55) return "good";
  return "strong";
}

function reason(summary, score) {
  const margin = Number(summary.gddMargin);
  const cropName = summary.cropName;
  if (score >= 85) {
    return `${summary.cityName} gives ${cropName.toLowerCase()} very little outdoor margin before fall frost in the current model.`;
  }
  if (score >= 70) {
    return `${summary.cityName} makes ${cropName.toLowerCase()} highly timing-sensitive; late starts or slow varieties can quickly erase the season.`;
  }
  if (score >= 55) {
    return `${summary.cityName} can make ${cropName.toLowerCase()} workable, but the crop still needs attention to timing and first-frost margin.`;
  }
  if (Number.isFinite(margin) && margin >= 500) {
    return `${summary.cityName} gives ${cropName.toLowerCase()} a comfortable GDD buffer before fall frost compared with tighter locations.`;
  }
  return `${summary.cityName} is less frost-stressed for ${cropName.toLowerCase()} than the highest-risk combinations in this dataset.`;
}

module.exports = function () {
  const allEntries = cropCitySummaries()
    .map((summary) => {
      const fit = scoreCropFit(summary);
      const margin = Number(summary.gddMargin);
      const marginPressure = Number.isFinite(margin)
        ? margin < -500
          ? 35
          : margin < -250
            ? 28
            : margin < 0
              ? 21
              : margin < 100
                ? 14
                : margin < 250
                  ? 8
                  : margin < 500
                    ? 2
                    : -5
        : 0;
      const confidencePressure = 100 - fit.score;
      const frostPressure = frostSensitivity(summary.crop);
      const delay = delayPressure(summary);
      const varietyCount = Array.isArray(summary.fittingVarietyLabels) ? summary.fittingVarietyLabels.length : 0;
      const varietyPressure = varietyCount === 0 ? 8 : varietyCount === 1 ? 4 : 0;
      const panicScore = clamp(confidencePressure * 0.65 + marginPressure + frostPressure + delay + varietyPressure);

      return {
        rank: null,
        cropKey: summary.cropKey,
        cropName: summary.cropName,
        cityKey: summary.cityKey,
        cityName: summary.cityName,
        regionKey: summary.regionKey,
        regionName: summary.regionName,
        country: summary.country,
        url: summary.url,
        score: panicScore,
        label: getPanicLabel(panicScore),
        badgeClass: getPanicBadgeClass(panicScore),
        reason: reason(summary, panicScore),
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
          confidencePressure,
          marginPressure,
          frostPressure,
          delayPressure: delay,
          varietyPressure,
          fitComponents: fit.components
        }
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.gddMargin - b.gddMargin;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const entries = allEntries.slice(0, 50);

  return {
    key: "the-frost-panic-index",
    title: "The Frost Panic Index",
    shortTitle: "Frost Panic Index",
    slug: "the-frost-panic-index",
    permalink: "/data/rankings/the-frost-panic-index/",
    description:
      "A GrowByDate Data Ranking of crop-location combinations where fall frost pressure is highest in the current dataset.",
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      "The Frost Panic Index combines crop fit score, GDD margin, frost sensitivity, planting-delay pressure, and variety flexibility. Higher scores mean the crop-location combination leaves less outdoor margin before first fall frost.",
    caveat:
      "This ranking highlights the highest-pressure crop-location combinations in the current GrowByDate dataset. It does not account for individual microclimates, protected culture, soil temperature, wind, irrigation, pests, or gardener skill.",
    totalCandidates: allEntries.length,
    top: entries[0] || null,
    lowestDisplayed: entries[entries.length - 1] || null,
    entries
  };
};
