const recordsSource = require('./cropClimateRecords');
const { getVarietyClassDisplay } = require('./_lib/cropGrammar');
const { enabledCityCrops } = require('./cropCityRollout');

let cache = null;

function getRecords() {
  if (typeof recordsSource === 'function') return recordsSource();
  return recordsSource;
}

function isCityCropEnabled(record) {
  if (!record?.cityKey || !record?.cropKey) return false;
  const allowed = enabledCityCrops?.[record.cityKey];
  return Array.isArray(allowed) ? allowed.includes(record.cropKey) : false;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function pickRecommendedVariety(record) {
  const strategy = record?.diagnostics?.varietyStrategy || {};
  const preferredLabel =
    strategy.defaultRecommendedVarietyLabel ||
    strategy.fastestReliableVarietyLabel ||
    strategy.slowestStillFittingVarietyLabel ||
    record?.fit?.bestVarietyLabel ||
    null;

  const classes = Array.isArray(record?.crop?.varietyClasses)
    ? record.crop.varietyClasses
    : [];

  const matchedClass = classes.find((item) => normalize(item?.label) === normalize(preferredLabel));
  const firstExample = Array.isArray(matchedClass?.examples)
    ? matchedClass.examples.find((example) => example?.name)
    : null;

  if (firstExample?.name) return firstExample.name;

  const display = getVarietyClassDisplay(preferredLabel);
  return display?.label || display?.name || preferredLabel || null;
}

module.exports = function () {
  if (cache) return cache;

  const records = Array.isArray(getRecords()) ? getRecords() : [];
  const byCityCrop = {};

  for (const record of records) {
    if (!isCityCropEnabled(record)) continue;

    const key = `${record.cityKey}|${record.cropKey}`;
    byCityCrop[key] = {
      cityKey: record.cityKey,
      cropKey: record.cropKey,
      url: `${record.urlBase}best-varieties/`,
      recommendedVariety: pickRecommendedVariety(record)
    };
  }

  cache = byCityCrop;
  return cache;
};
