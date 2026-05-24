const cropCitySummaries = require("./cropCitySummaries");
const { average, clamp, scoreCropFit } = require("./_lib/dataRankingScoring");

const SHORT_SEASON_FROST_FREE_DAYS = 140;
const SHORT_SEASON_GDD = 1500;

function toleranceBonus(crop) {
  const tolerance = String(crop?.frostTolerance || "").toLowerCase();
  if (["hardy", "strong"].includes(tolerance)) return 10;
  if (tolerance === "moderate") return 7;
  if (tolerance === "light") return 4;
  if (["none", "tender"].includes(tolerance)) return -6;
  return 0;
}

function categoryBonus(crop) {
  const category = String(crop?.category || "").toLowerCase();
  if (category === "cool-season") return 7;
  if (category === "warm-season") return -4;
  return 0;
}

function targetGddBonus(targetGdd) {
  const gdd = Number(targetGdd);
  if (!Number.isFinite(gdd)) return 0;
  if (gdd <= 500) return 8;
  if (gdd <= 800) return 5;
  if (gdd <= 1100) return 2;
  if (gdd >= 1700) return -7;
  if (gdd >= 1400) return -4;
  return 0;
}

function getForgivenessLabel(score) {
  if (score >= 90) return "Very forgiving";
  if (score >= 78) return "Forgiving";
  if (score >= 65) return "Usually manageable";
  if (score >= 50) return "Mixed";
  return "Not very forgiving";
}

function reason(group, entry) {
  if (entry.score >= 90) {
    return `${group.cropName} are highly forgiving in this dataset because they combine strong short-season fit with useful frost tolerance or a lower heat requirement.`;
  }
  if (entry.score >= 78) {
    return `${group.cropName} usually leave enough timing margin to be practical in short-season gardens.`;
  }
  if (entry.averageFitScore >= 70) {
    return `${group.cropName} fit many short-season locations, but still need reasonable timing.`;
  }
  return `${group.cropName} are not impossible, but they are less forgiving than the crops above them.`;
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
        crop: summary.crop,
        rows: [],
        fitScores: [],
        gddMargins: [],
        frostFreeDays: [],
        varietyCounts: []
      });
    }
    const group = byCrop.get(summary.cropKey);
    group.rows.push(summary);
    group.fitScores.push(fit.score);
    group.gddMargins.push(summary.gddMargin);
    group.frostFreeDays.push(summary.frostFreeDays);
    group.varietyCounts.push(Array.isArray(summary.fittingVarietyLabels) ? summary.fittingVarietyLabels.length : 0);
  }

  const entries = Array.from(byCrop.values())
    .map((group) => {
      const avgFit = average(group.fitScores);
      const avgMargin = average(group.gddMargins);
      const avgFrostFreeDays = average(group.frostFreeDays);
      const avgVarietyCount = average(group.varietyCounts);
      const riskyCount = group.rows.filter((row) => ["risky", "borderline"].includes(String(row.confidence).toLowerCase())).length;
      const riskyPenalty = group.rows.length ? (riskyCount / group.rows.length) * 10 : 0;
      const varietyBonus = Number.isFinite(avgVarietyCount) ? Math.min(7, avgVarietyCount * 2) : 0;
      const score = clamp(
        avgFit +
          toleranceBonus(group.crop) +
          categoryBonus(group.crop) +
          targetGddBonus(group.targetGdd) +
          varietyBonus -
          riskyPenalty
      );

      const entry = {
        rank: null,
        cropKey: group.cropKey,
        cropName: group.cropName,
        cropCategory: group.cropCategory,
        frostTolerance: group.frostTolerance,
        targetGdd: group.targetGdd,
        score,
        label: getForgivenessLabel(score),
        averageFitScore: Math.round(avgFit),
        averageGddMargin: Math.round(avgMargin),
        averageFrostFreeDays: Math.round(avgFrostFreeDays),
        averageVarietyCount: Math.round(avgVarietyCount * 10) / 10,
        shortSeasonLocations: group.rows.length,
        riskyLocationCount: riskyCount,
        reason: ""
      };
      entry.reason = reason(group, entry);
      return entry;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.averageGddMargin - a.averageGddMargin;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    key: "most-forgiving-crops-for-short-season-gardeners",
    title: "Most Forgiving Crops for Short-Season Gardeners",
    shortTitle: "Most Forgiving Short-Season Crops",
    slug: "most-forgiving-crops-for-short-season-gardeners",
    permalink: "/data/rankings/most-forgiving-crops-for-short-season-gardeners/",
    description:
      "A GrowByDate Data Ranking of crops that leave short-season gardeners the most practical timing margin.",
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      `This ranking uses published crop-city rows where frost-free days are ${SHORT_SEASON_FROST_FREE_DAYS} or fewer, or available GDD is ${SHORT_SEASON_GDD} or lower. Crops are rewarded for high average Crop Fit score, frost tolerance, lower heat requirement, variety flexibility, and fewer risky or borderline locations.`,
    caveat:
      "Forgiving does not mean foolproof. Local soil temperature, pests, watering, wind, and planting technique still matter.",
    top: entries[0] || null,
    leastForgiving: entries[entries.length - 1] || null,
    entries
  };
};
