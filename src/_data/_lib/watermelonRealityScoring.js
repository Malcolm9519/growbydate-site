function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scoreMargin(gddMargin) {
  const margin = Number(gddMargin);
  if (!Number.isFinite(margin)) return 0;

  if (margin >= 750) return 72;
  if (margin >= 500) return 66;
  if (margin >= 250) return 58;
  if (margin >= 100) return 50;
  if (margin >= 0) return 42;
  if (margin >= -150) return 32;
  if (margin >= -350) return 22;
  if (margin >= -600) return 13;
  if (margin >= -900) return 7;
  return 2;
}

function scoreVarietyFlexibility(fittingVarietyLabels = []) {
  const count = Array.isArray(fittingVarietyLabels) ? fittingVarietyLabels.length : 0;
  if (count >= 3) return 14;
  if (count === 2) return 9;
  if (count === 1) return 4;
  return 0;
}

function scoreFrostFreeDays(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return 0;
  if (n >= 200) return 10;
  if (n >= 160) return 8;
  if (n >= 130) return 5;
  if (n >= 110) return 3;
  if (n >= 90) return 1;
  return 0;
}

function scoreDelayTolerance(delayRows = []) {
  if (!Array.isArray(delayRows) || !delayRows.length) return 0;
  const oneWeekLate = delayRows.find((row) => row.label === "1 week late");
  const twoWeeksLate = delayRows.find((row) => row.label === "2 weeks late");
  const oneWeekMargin = Number(oneWeekLate?.gddMargin);
  const twoWeekMargin = Number(twoWeeksLate?.gddMargin);

  if (Number.isFinite(twoWeekMargin) && twoWeekMargin >= 0) return 4;
  if (Number.isFinite(oneWeekMargin) && oneWeekMargin >= 0) return 3;
  if (Number.isFinite(oneWeekMargin) && oneWeekMargin >= -150) return 1;
  return 0;
}

function getRealityLabel(score) {
  if (score >= 90) return "Very realistic";
  if (score >= 75) return "Realistic";
  if (score >= 60) return "Possible with care";
  if (score >= 40) return "Borderline";
  if (score >= 20) return "Long shot";
  return "Very difficult outdoors";
}

function getRealityTone(score) {
  if (score >= 90) return "Relaxed watermelon country";
  if (score >= 75) return "Outdoor watermelon is realistic";
  if (score >= 60) return "Worth trying with discipline";
  if (score >= 40) return "Possible, but not casual";
  if (score >= 20) return "Try only with the warmest setup";
  return "Greenhouse or serious protection territory";
}

function getReason(record, score) {
  const margin = Number(record.gddMargin);
  const city = record.cityName;
  const varietyLabels = Array.isArray(record.fittingVarietyLabels)
    ? record.fittingVarietyLabels
    : [];

  if (score >= 90) {
    return `${city} has a large heat margin for watermelons, and multiple watermelon variety classes fit the outdoor season.`;
  }

  if (score >= 75) {
    return `${city} has enough seasonal heat for outdoor watermelons in a typical year, especially when gardeners transplant on time.`;
  }

  if (score >= 60) {
    return `${city} can support outdoor watermelons, but the margin is not huge. Fast varieties and timely transplanting still matter.`;
  }

  if (score >= 40) {
    return `${city} is a borderline watermelon location. The typical GDD margin is ${margin >= 0 ? "small" : "negative"}, so variety choice and site warmth matter.`;
  }

  if (varietyLabels.length) {
    return `${city} usually favors only the fastest watermelon approach. The typical heat margin is negative, so protection or a warm microclimate can make the difference.`;
  }

  return `${city} does not have enough typical outdoor heat margin for relaxed watermelon growing without major season extension.`;
}

function scoreWatermelonReality(record) {
  const marginScore = scoreMargin(record.gddMargin);
  const varietyScore = scoreVarietyFlexibility(record.fittingVarietyLabels);
  const frostScore = scoreFrostFreeDays(record.frostFreeDays);
  const delayScore = scoreDelayTolerance(record.delayAnalysis?.rows);

  const score = clamp(marginScore + varietyScore + frostScore + delayScore);

  return {
    score,
    label: getRealityLabel(score),
    tone: getRealityTone(score),
    components: {
      marginScore,
      varietyScore,
      frostScore,
      delayScore
    },
    reason: getReason(record, score)
  };
}

module.exports = {
  scoreWatermelonReality,
  getRealityLabel,
  getRealityTone
};
