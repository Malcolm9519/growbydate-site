const cities = require("./cities.json");
const gddStations = require("./gddStations.json");
const gddCrops = require("./gddCrops");
const fs = require("fs");
const path = require("path");

function stationIdForCity(city) {
  return gddStations[String(city.lookupKey)] || gddStations[String(city.key)] || null;
}

function countryLabel(country) {
  return country === "canada" ? "Canada" : "United States";
}

function cityPlantingUrl(city) {
  return `/planting-dates/${city.country === "canada" ? "canada/" : ""}${city.regionKey}/${city.key}/`;
}

function lastFinite(values) {
  if (!Array.isArray(values)) return null;
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = Number(values[i]);
    if (Number.isFinite(value)) return Math.round(value);
  }
  return null;
}

function readStationSeries(stationSeriesDir, stationId) {
  if (!stationId) return null;
  const filePath = path.join(stationSeriesDir, `${stationId}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return null;
  }
}

module.exports = function () {
  const stationSeriesDir = path.join(__dirname, "..", "assets", "data", "gdd-stations");
  const totalStationSeries = fs.existsSync(stationSeriesDir)
    ? fs.readdirSync(stationSeriesDir).filter((filename) => filename.endsWith(".json")).length
    : 0;

  const cityRecords = cities
    .map((city) => {
      const stationId = stationIdForCity(city);
      if (!stationId) return null;
      const series = readStationSeries(stationSeriesDir, stationId);
      const bases = series && series.bases ? series.bases : {};
      return {
        cityKey: city.key,
        cityName: city.name,
        regionName: city.regionName,
        regionAbbr: city.regionAbbr,
        regionKey: city.regionKey,
        country: city.country,
        countryLabel: countryLabel(city.country),
        lookupKey: city.lookupKey,
        cityUrl: cityPlantingUrl(city),
        gddBase40: lastFinite(bases["40"]),
        gddBase45: lastFinite(bases["45"]),
        gddBase50: lastFinite(bases["50"])
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const countryCompare = a.countryLabel.localeCompare(b.countryLabel);
      if (countryCompare) return countryCompare;
      const regionCompare = a.regionName.localeCompare(b.regionName);
      if (regionCompare) return regionCompare;
      return a.cityName.localeCompare(b.cityName);
    });

  const byBase = gddCrops.reduce((acc, crop) => {
    const key = `${crop.base_f}°F`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const warmSeasonCrops = gddCrops
    .filter((crop) => crop.category === "warm-season")
    .sort((a, b) => b.gdd_required - a.gdd_required)
    .slice(0, 10);

  const coolSeasonCrops = gddCrops
    .filter((crop) => crop.category !== "warm-season")
    .sort((a, b) => b.gdd_required - a.gdd_required)
    .slice(0, 10);

  const samples = ["calgary", "edmonton", "winnipeg", "toronto", "vancouver", "minneapolis"]
    .map((key) => cityRecords.find((record) => record.cityKey === key))
    .filter(Boolean);

  const highestBase50 = [...cityRecords]
    .filter((record) => Number.isFinite(record.gddBase50))
    .sort((a, b) => b.gddBase50 - a.gddBase50)
    .slice(0, 8);

  const lowestBase50 = [...cityRecords]
    .filter((record) => Number.isFinite(record.gddBase50))
    .sort((a, b) => a.gddBase50 - b.gddBase50)
    .slice(0, 8);

  return {
    totalReferenceCities: cityRecords.length,
    totalMappedLookupKeys: Object.keys(gddStations).length,
    totalStationSeries,
    totalCropRequirements: gddCrops.length,
    byBase,
    samples,
    cityRecords,
    highestBase50,
    lowestBase50,
    warmSeasonCrops,
    coolSeasonCrops,
    downloads: [
      {
        label: "Growing degree day summary JSON",
        url: "/assets/data/reference/growing-degree-days-summary.json",
        description: "A public methodology summary with station counts, sample mappings, and example crop GDD targets."
      }
    ]
  };
};
