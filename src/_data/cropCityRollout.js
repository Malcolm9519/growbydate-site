const cityRollout = require("./cityRollout");

const DEFAULT_CROPS = [
  "tomatoes",
  "peppers",
  "sweet-corn",
  "beans"
];

function withDefaultCrops(cityKeys) {
  return Object.fromEntries(
    cityKeys.map((cityKey) => [cityKey, [...DEFAULT_CROPS]])
  );
}

const MANUAL_CITY_CROP_ALLOWLIST = {
  ...withDefaultCrops([
    "minneapolis",
    "saint-paul",
    "duluth",
    "milwaukee",
    "madison",
    "green-bay",
    "detroit",
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
    "edmonton",
    "red-deer",
    "lethbridge",
    "medicine-hat",
    "vancouver",
    "victoria",
    "kelowna",
    "saskatoon",
    "regina",
    "prince-albert",
    "winnipeg",
    "brandon"
  ])

  // Example manual overrides:
  // winnipeg: ["beans"],
  // regina: ["tomatoes", "beans"]
};

const liveCitySet = new Set(cityRollout);

module.exports = {
  enabledCityCrops: Object.fromEntries(
    Object.entries(MANUAL_CITY_CROP_ALLOWLIST).filter(([cityKey]) =>
      liveCitySet.has(cityKey)
    )
  )
};