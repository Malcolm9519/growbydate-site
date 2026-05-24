function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function confidenceBase(confidence) {
  const key = String(confidence || "").toLowerCase();
  if (key === "surplus") return 86;
  if (key === "strong") return 76;
  if (key === "good") return 64;
  if (key === "borderline") return 48;
  return 26;
}

function marginAdjustment(gddMargin) {
  const margin = Number(gddMargin);
  if (!Number.isFinite(margin)) return 0;
  if (margin >= 750) return 12;
  if (margin >= 500) return 10;
  if (margin >= 250) return 7;
  if (margin >= 100) return 4;
  if (margin >= 0) return 1;
  if (margin >= -150) return -5;
  if (margin >= -350) return -10;
  if (margin >= -600) return -16;
  return -22;
}

function frostFreeAdjustment(frostFreeDays) {
  const days = Number(frostFreeDays);
  if (!Number.isFinite(days)) return 0;
  if (days >= 210) return 5;
  if (days >= 180) return 4;
  if (days >= 150) return 2;
  if (days >= 120) return 0;
  if (days >= 95) return -3;
  return -7;
}

function varietyAdjustment(fittingVarietyLabels = []) {
  const count = Array.isArray(fittingVarietyLabels) ? fittingVarietyLabels.length : 0;
  if (count >= 4) return 5;
  if (count === 3) return 4;
  if (count === 2) return 2;
  if (count === 1) return -1;
  return -5;
}

function delayAdjustment(delayRows = []) {
  if (!Array.isArray(delayRows) || !delayRows.length) return 0;
  const oneWeekLate = delayRows.find((row) => row.label === "1 week late");
  const twoWeeksLate = delayRows.find((row) => row.label === "2 weeks late");
  const oneWeekMargin = Number(oneWeekLate?.gddMargin);
  const twoWeekMargin = Number(twoWeeksLate?.gddMargin);

  if (Number.isFinite(twoWeekMargin) && twoWeekMargin >= 0) return 3;
  if (Number.isFinite(oneWeekMargin) && oneWeekMargin >= 0) return 1;
  if (Number.isFinite(oneWeekMargin) && oneWeekMargin < -250) return -3;
  return 0;
}

function scoreCropFit(record) {
  const score = clamp(
    confidenceBase(record.confidence) +
      marginAdjustment(record.gddMargin) +
      frostFreeAdjustment(record.frostFreeDays) +
      varietyAdjustment(record.fittingVarietyLabels) +
      delayAdjustment(record.delayAnalysis?.rows)
  );

  return {
    score,
    label: getFitLabel(score),
    badgeClass: getBadgeClass(record.confidence, score),
    components: {
      confidenceBase: confidenceBase(record.confidence),
      marginAdjustment: marginAdjustment(record.gddMargin),
      frostFreeAdjustment: frostFreeAdjustment(record.frostFreeDays),
      varietyAdjustment: varietyAdjustment(record.fittingVarietyLabels),
      delayAdjustment: delayAdjustment(record.delayAnalysis?.rows)
    }
  };
}

function getFitLabel(score) {
  if (score >= 90) return "Excellent fit";
  if (score >= 75) return "Strong fit";
  if (score >= 60) return "Workable fit";
  if (score >= 40) return "Borderline fit";
  if (score >= 20) return "Difficult outdoor fit";
  return "Very difficult outdoors";
}

function getBadgeClass(confidence, score) {
  const key = String(confidence || "").toLowerCase();
  if (["surplus", "strong", "good", "borderline"].includes(key)) return key;
  if (score >= 75) return "strong";
  if (score >= 60) return "good";
  if (score >= 40) return "borderline";
  return "risky";
}

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return null;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

function getGddRemaining(citySummary, date = "05-01") {
  const row = (citySummary.gdd_remaining || []).find((item) => item.date === date && item.base === 50);
  return Number.isFinite(Number(row?.gdd)) ? Number(row.gdd) : null;
}

module.exports = {
  clamp,
  average,
  scoreCropFit,
  getFitLabel,
  getBadgeClass,
  getGddRemaining
};
