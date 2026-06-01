const cropCitySummaries = require("./cropCitySummaries");
const { average, clamp, scoreCropFit } = require("./_lib/dataRankingScoring");

const SHORT_SEASON_FROST_FREE_DAYS = 140;
const SHORT_SEASON_GDD = 1500;

function getDifficultyLabel(score) {
  if (score >= 85) return "Extremely difficult";
  if (score >= 70) return "Very difficult";
  if (score >= 55) return "Difficult";
  if (score >= 40) return "Mixed";
  return "Usually manageable";
}

function cropVerb(cropName) {
  return String(cropName || "").toLowerCase().endsWith("s") ? "have" : "has";
}

function cropReason(cropName, entry) {
  const verb = cropVerb(cropName);
  if (entry.averageGddMargin < -400) {
    return `${cropName} ${verb} a large average GDD deficit across the short-season test locations.`;
  }
  if (entry.averageGddMargin < -100) {
    return `${cropName} often run short on heat margin in short-season locations, so fast varieties or protection matter.`;
  }
  if (entry.averageFitScore < 55) {
    return `${cropName} are timing-sensitive in short seasons even when they are not impossible outdoors.`;
  }
  return `${cropName} are not always hard, but they are less forgiving than simpler short-season crops.`;
}

module.exports = function () {
  const shortSeasonRows = cropCitySummaries().filter((summary) => {
    const frostFreeDays = Number(summary.frostFreeDays);
    const availableGdd = Number(summary.availableGddFromPlanting);
    return (
      Number.isFinite(frostFreeDays) && frostFreeDays <= SHORT_SEASON_FROST_FREE_DAYS
    ) || (
      Number.isFinite(availableGdd) && availableGdd <= SHORT_SEASON_GDD
    );
  });

  const byCrop = new Map();
  for (const summary of shortSeasonRows) {
    const fit = scoreCropFit(summary);
    if (!byCrop.has(summary.cropKey)) {
      byCrop.set(summary.cropKey, {
        cropKey: summary.cropKey,
        cropName: summary.cropName,
        cropCategory: summary.crop?.category || null,
        frostTolerance: summary.crop?.frostTolerance || null,
        targetGdd: summary.targetGdd,
        rows: [],
        fitScores: [],
        gddMargins: [],
        frostFreeDays: []
      });
    }
    const group = byCrop.get(summary.cropKey);
    group.rows.push(summary);
    group.fitScores.push(fit.score);
    group.gddMargins.push(summary.gddMargin);
    group.frostFreeDays.push(summary.frostFreeDays);
  }

  const entries = Array.from(byCrop.values())
    .map((group) => {
      const avgFit = average(group.fitScores);
      const avgMargin = average(group.gddMargins);
      const avgFrostFreeDays = average(group.frostFreeDays);
      const noFitCount = group.rows.filter((row) => !Array.isArray(row.fittingVarietyLabels) || row.fittingVarietyLabels.length === 0).length;
      const riskyCount = group.rows.filter((row) => ["risky", "borderline"].includes(String(row.confidence).toLowerCase())).length;
      const warmSeasonPenalty = group.cropCategory === "warm-season" ? 6 : 0;
      const noFitPenalty = group.rows.length ? (noFitCount / group.rows.length) * 10 : 0;
      const riskyPenalty = group.rows.length ? (riskyCount / group.rows.length) * 6 : 0;
      const difficultyScore = clamp(100 - avgFit + warmSeasonPenalty + noFitPenalty + riskyPenalty);

      return {
        rank: null,
        cropKey: group.cropKey,
        cropName: group.cropName,
        cropCategory: group.cropCategory,
        targetGdd: group.targetGdd,
        score: difficultyScore,
        label: getDifficultyLabel(difficultyScore),
        averageFitScore: Math.round(avgFit),
        averageGddMargin: Math.round(avgMargin),
        averageFrostFreeDays: Math.round(avgFrostFreeDays),
        shortSeasonLocations: group.rows.length,
        riskyLocationCount: riskyCount,
        noClearVarietyFitCount: noFitCount,
        reason: cropReason(group.cropName, {
          averageFitScore: avgFit,
          averageGddMargin: avgMargin
        })
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.averageGddMargin - b.averageGddMargin;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    key: "hardest-crops-to-grow-in-short-seasons",
    title: "Hardest Crops to Grow in Short Seasons",
    shortTitle: "Hardest Short-Season Crops",
    slug: "hardest-crops-to-grow-in-short-seasons",
    permalink: "/data/rankings/hardest-crops-to-grow-in-short-seasons/",
    description:
      "Crops ranked by how much timing pressure they create in short frost windows and lower-GDD locations.",
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      `This ranking uses published crop-city rows where frost-free days are ${SHORT_SEASON_FROST_FREE_DAYS} or fewer, or available GDD is ${SHORT_SEASON_GDD} or lower. Crops are ranked by average Crop Fit score, GDD margin, risky/borderline locations, and whether variety classes clearly fit the season.`,
    caveat:
      "This identifies crops that are more timing-sensitive outdoors, not crops that are impossible. Variety speed, microclimate, protection, and gardener skill can change the result.",
    top: entries[0] || null,
    easiestOfThisSet: entries[entries.length - 1] || null,
    entries
  };
};
