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
    // Wave 1
    "seattle",
    "columbus",
    "montreal",
    "vancouver",
    "boston",
    "calgary",
    "edmonton",
    "ottawa",
    "minneapolis",
    "saint-paul",
    "portland",
    "detroit",

    // Wave 2
    "milwaukee",
    "winnipeg",
    "cleveland",
    "pittsburgh",
    "colorado-springs",
    "omaha",
    "madison",
    "buffalo",
    "quebec-city",
    "saskatoon"
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
