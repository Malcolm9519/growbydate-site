const { buildVarietySummaries } = require('./varietySummaries');

module.exports = function () {
  const summaries = buildVarietySummaries();

  return summaries.reduce((index, item) => {
    const key = [item.country, item.regionKey, item.cityKey, item.cropKey].join('|');
    index[key] = item;
    return index;
  }, {});
};
