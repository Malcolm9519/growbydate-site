const cities = require("./cities.json");
const cityRollout = require("./cityRollout");
const { buildCitySummaries } = require("./_lib/citySummaries");

const ENABLED_CITIES = new Set(cityRollout);

module.exports = function () {
  const allowedCities = cities.filter((city) => ENABLED_CITIES.has(city.key));
  return buildCitySummaries(allowedCities);
};