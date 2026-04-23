const citySummariesSource = require('./citySummaries');
const cropCityCrops = require('./cropCityCrops');
const cropCityRollout = require('./cropCityRollout');
const { buildCropClimateRecord } = require('./_lib/buildCropClimateRecord');

function normalizeArrayLike(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return Array.from(value);
  return [];
}

function getEnabledCityCrops() {
  const raw = cropCityRollout.enabledCityCrops || {};
  const normalized = {};

  for (const [cityKey, cropList] of Object.entries(raw)) {
    normalized[cityKey] = normalizeArrayLike(cropList);
  }

  return normalized;
}

function getCitySummaries() {
  if (Array.isArray(citySummariesSource)) return citySummariesSource;
  if (typeof citySummariesSource === 'function') {
    const result = citySummariesSource();
    return Array.isArray(result) ? result : [];
  }
  return [];
}

module.exports = function () {
  const allCitySummaries = getCitySummaries();
  const allCrops = Array.isArray(cropCityCrops) ? cropCityCrops : [];
  const enabledCityCrops = getEnabledCityCrops();

  const output = [];

  for (const city of allCitySummaries) {
    const allowedCropsForCity = enabledCityCrops[city.key] || [];
    if (!allowedCropsForCity.length) continue;

    for (const crop of allCrops) {
      if (!allowedCropsForCity.includes(crop.key)) continue;
      output.push(buildCropClimateRecord(city, crop));
    }
  }

  return output;
};