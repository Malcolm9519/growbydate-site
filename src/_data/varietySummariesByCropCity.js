const recordsSource = require('./cropClimateRecords');
const { buildVarietySummary } = require('./varietySummaries');
const { enabledCityCrops } = require('./cropCityRollout');

let recordIndex = null;

function getRecords() {
  return typeof recordsSource === 'function' ? recordsSource() : recordsSource;
}

function isCityCropEnabled(record) {
  const cityKey = record?.cityKey;
  const cropKey = record?.cropKey;

  if (!cityKey || !cropKey) return false;

  const allowedCrops = enabledCityCrops[cityKey];
  if (!Array.isArray(allowedCrops)) return false;

  return allowedCrops.includes(cropKey);
}

function getRecordIndex() {
  if (recordIndex) return recordIndex;

  const records = Array.isArray(getRecords()) ? getRecords() : [];
  recordIndex = new Map();

  records.forEach((record) => {
    if (!isCityCropEnabled(record)) return;
    const key = [record.country, record.regionKey, record.cityKey, record.cropKey].join('|');
    recordIndex.set(key, record);
  });

  return recordIndex;
}

module.exports = function () {
  return function lookupVarietySummary(country, regionKey, cityKey, cropKey) {
    const key = [country, regionKey, cityKey, cropKey].join('|');
    const record = getRecordIndex().get(key);
    return record ? buildVarietySummary(record) : null;
  };
};
