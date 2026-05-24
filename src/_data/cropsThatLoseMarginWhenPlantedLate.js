const cropCitySummaries = require("./cropCitySummaries");
const { average, clamp } = require("./_lib/dataRankingScoring");

function getTwoWeekLoss(summary) {
  const rows = summary.delayAnalysis?.rows || [];
  const onTime = rows.find((row) => row.label === "On time");
  const twoWeeksLate = rows.find((row) => row.label === "2 weeks late");
  const onTimeMargin = Number(onTime?.gddMargin);
  const lateMargin = Number(twoWeeksLate?.gddMargin);
  const onTimeGdd = Number(onTime?.availableGdd);
  const lateGdd = Number(twoWeeksLate?.availableGdd);

  if (Number.isFinite(onTimeMargin) && Number.isFinite(lateMargin)) {
    return {
      marginLoss: onTimeMargin - lateMargin,
      onTimeMargin,
      twoWeekLateMargin: lateMargin,
      availableGddLoss: Number.isFinite(onTimeGdd) && Number.isFinite(lateGdd) ? onTimeGdd - lateGdd : null
    };
  }

  if (Number.isFinite(onTimeGdd) && Number.isFinite(lateGdd)) {
    return {
      marginLoss: onTimeGdd - lateGdd,
      onTimeMargin: null,
      twoWeekLateMargin: null,
      availableGddLoss: onTimeGdd - lateGdd
    };
  }

  return null;
}

function pressureLabel(score) {
  if (score >= 85) return "Extreme late-start pressure";
  if (score >= 70) return "High late-start pressure";
  if (score >= 55) return "Moderate late-start pressure";
  if (score >= 40) return "Some late-start pressure";
  return "More forgiving";
}

function reason(entry) {
  if (entry.averageTwoWeekMarginLoss >= 170) {
    return `${entry.cropName} lose a large amount of heat margin when planting slips by two weeks, so timely starts matter.`;
  }
  if (entry.averageTwoWeekMarginLoss >= 120) {
    return `${entry.cropName} are noticeably punished by late planting, especially in shorter or cooler locations.`;
  }
  if (entry.negativeAfterDelayCount > 0) {
    return `${entry.cropName} can cross from workable to tight when delayed in some published locations.`;
  }
  return `${entry.cropName} still lose margin when delayed, but the typical two-week penalty is less severe than the highest-pressure crops.`;
}

module.exports = function () {
  const byCrop = new Map();

  for (const summary of cropCitySummaries()) {
    const loss = getTwoWeekLoss(summary);
    if (!loss) continue;

    if (!byCrop.has(summary.cropKey)) {
      byCrop.set(summary.cropKey, {
        cropKey: summary.cropKey,
        cropName: summary.cropName,
        cropCategory: summary.crop?.category || null,
        targetGdd: summary.targetGdd,
        rows: [],
        losses: [],
        marginsOnTime: [],
        marginsLate: [],
        availableLosses: []
      });
    }

    const group = byCrop.get(summary.cropKey);
    group.rows.push(summary);
    group.losses.push(loss.marginLoss);
    group.marginsOnTime.push(loss.onTimeMargin);
    group.marginsLate.push(loss.twoWeekLateMargin);
    group.availableLosses.push(loss.availableGddLoss);
  }

  const entries = Array.from(byCrop.values())
    .map((group) => {
      const avgLoss = average(group.losses);
      const avgAvailableLoss = average(group.availableLosses);
      const avgOnTimeMargin = average(group.marginsOnTime);
      const avgLateMargin = average(group.marginsLate);
      const negativeAfterDelayCount = group.rows.filter((row) => {
        const loss = getTwoWeekLoss(row);
        return Number.isFinite(Number(loss?.twoWeekLateMargin)) && Number(loss.twoWeekLateMargin) < 0;
      }).length;
      const negativeShare = group.rows.length ? negativeAfterDelayCount / group.rows.length : 0;
      const warmSeasonPenalty = group.cropCategory === "warm-season" ? 8 : 0;
      const score = clamp((avgLoss / 2.2) + negativeShare * 24 + warmSeasonPenalty);
      const entry = {
        rank: null,
        cropKey: group.cropKey,
        cropName: group.cropName,
        cropCategory: group.cropCategory,
        targetGdd: group.targetGdd,
        score,
        label: pressureLabel(score),
        averageTwoWeekMarginLoss: Math.round(avgLoss),
        averageTwoWeekAvailableGddLoss: Math.round(avgAvailableLoss),
        averageOnTimeMargin: Math.round(avgOnTimeMargin),
        averageTwoWeekLateMargin: Math.round(avgLateMargin),
        negativeAfterDelayCount,
        publishedLocations: group.rows.length,
        reason: null
      };
      return { ...entry, reason: reason(entry) };
    })
    .filter((entry) => Number.isFinite(entry.averageTwoWeekMarginLoss))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.averageTwoWeekMarginLoss - a.averageTwoWeekMarginLoss;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    key: "crops-that-lose-the-most-margin-when-planted-late",
    title: "Crops That Lose the Most Margin When Planted Late",
    shortTitle: "Late-Planting Margin Loss",
    slug: "crops-that-lose-the-most-margin-when-planted-late",
    permalink: "/data/rankings/crops-that-lose-the-most-margin-when-planted-late/",
    description:
      "A GrowByDate Data Ranking of crops that lose the most heat and maturity margin when planting slips by two weeks.",
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      "This ranking compares the typical on-time GDD margin with the margin remaining two weeks later across published GrowByDate crop-city records. Crops rank higher when they lose more margin, cross below zero more often, or are warm-season crops with tighter timing needs.",
    caveat:
      "The ranking uses currently published GrowByDate crop-city records. It measures timing pressure in the model, not every factor that can affect real gardens, such as microclimate, transplant size, soil warmth, irrigation, or variety choice.",
    top: entries[0] || null,
    entries
  };
};
