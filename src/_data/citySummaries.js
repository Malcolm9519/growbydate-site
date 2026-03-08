const cities = require("./cities.json");
const { buildCitySummaries } = require("./_lib/citySummaries");

/*
ROLL OUT IN PHASES
*/

const ALLOWED_CITIES = new Set([
  "calgary",
  "minneapolis",
  "edmonton",
  "fargo",
  "winnipeg",
  "red-deer",
  "lethbridge",
  "duluth",
  "billings",
  "milwaukee",
  "madison",
  "green-bay",
  "grand-rapids",
  "lansing",
  "bismarck",

  "sioux-falls",
  "rapid-city",
  "missoula",
  "bozeman",
  "brandon"
]);

module.exports = function () {
  const filtered = cities.filter(c => ALLOWED_CITIES.has(c.key));
  return buildCitySummaries(filtered);
};