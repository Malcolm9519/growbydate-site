const cropCitySummariesSource = require('./cropCitySummaries');

let cache = null;

function getCropCitySummaries() {
  if (typeof cropCitySummariesSource === 'function') return cropCitySummariesSource();
  return cropCitySummariesSource;
}

function confidenceRank(confidence) {
  return {
    surplus: 0,
    strong: 1,
    good: 2,
    borderline: 3,
    risky: 4
  }[confidence] ?? 99;
}

module.exports = function () {
  if (cache) return cache;

  const rows = Array.isArray(getCropCitySummaries()) ? getCropCitySummaries() : [];
  const byCity = {};

  for (const row of rows) {
    if (!row?.cityKey) continue;
    if (!byCity[row.cityKey]) byCity[row.cityKey] = [];
    byCity[row.cityKey].push(row);
  }

  for (const cityKey of Object.keys(byCity)) {
    byCity[cityKey].sort((a, b) => {
      const rankDiff = confidenceRank(a.confidence) - confidenceRank(b.confidence);
      if (rankDiff !== 0) return rankDiff;
      return String(a.cropName || '').localeCompare(String(b.cropName || ''));
    });
  }

  cache = byCity;
  return cache;
};
