// src/_data/cropCityRollout.js
// Controlled rollout for crop-city pages.
// DENY BY DEFAULT — only listed cities + crops will build.

const DEFAULT_CROPS = [
  "tomatoes",
  "peppers",
  "sweet-corn",
  "beans"
];

/**
 * Helper: assign default crops to a list of city keys
 */
function withDefaultCrops(cityKeys) {
  return Object.fromEntries(
    cityKeys.map((cityKey) => [cityKey, [...DEFAULT_CROPS]])
  );
}

/**
 * MAIN ALLOWLIST
 * Only cities listed here will publish.
 */
module.exports = {
  enabledCityCrops: {
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

    // Example custom overrides later:
    // winnipeg: ["beans"],          // test rollout
    // regina: ["tomatoes","beans"]  // partial rollout
  }
};