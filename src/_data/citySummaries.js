const cities = require("./cities.json");
const { buildCitySummaries } = require("./_lib/citySummaries");

const ENABLED_CITIES = new Set([
  "minneapolis",
  "saint-paul",
  "duluth",
  "milwaukee",
  "madison",
  "green-bay",
  "grand-rapids",
  "lansing",
  "billings",
  "missoula",
  "bozeman",
  "fargo",
  "bismarck",
  "sioux-falls",
  "rapid-city",

  "calgary",
  "red-deer",
  "lethbridge",
  "vancouver",
  "kelowna",
  "prince-george",
  "saskatoon",
  "regina",
  "prince-albert",
  "winnipeg"
]);

module.exports = function () {
  const allowedCities = cities.filter((city) => ENABLED_CITIES.has(city.key));
  return buildCitySummaries(allowedCities);
};