const recordsSource = require('./cropClimateRecords');
const { buildCropClimateCopy } = require('./_lib/buildCropClimateCopy');

function getRecords() {
  return typeof recordsSource === 'function' ? recordsSource() : recordsSource;
}

const ENABLE_MATURITY_PAGES = false;

module.exports = function () {
  if (!ENABLE_MATURITY_PAGES) return [];

  const records = Array.isArray(getRecords()) ? getRecords() : [];

  return records.map((record) => ({
    ...record,
    pageType: 'maturity',
    copy: buildCropClimateCopy(record, 'maturity'),
    url: `${record.urlBase}will-it-mature-before-frost/`
  }));
};