const cities = require("./cities.json");
const cityRollout = require("./cityRollout");
const { buildCitySummaries } = require("./_lib/citySummaries");

const ENABLED_CITIES = new Set(cityRollout);

let cache = null;

module.exports = function () {
  if (cache) return cache;

  const allowedCities = cities.filter((city) => ENABLED_CITIES.has(city.key));
  cache = buildCitySummaries(allowedCities);

  return cache;
};