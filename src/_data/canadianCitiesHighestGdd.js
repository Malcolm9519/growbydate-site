const gddReference = require("./gddReference");

function heatLabel(gdd) {
  const n = Number(gdd);
  if (!Number.isFinite(n)) return "Insufficient data";
  if (n >= 3600) return "Very high heat accumulation";
  if (n >= 3000) return "High heat accumulation";
  if (n >= 2400) return "Moderate to high heat";
  if (n >= 1800) return "Moderate heat";
  return "Lower heat accumulation";
}

function reason(row) {
  const gdd = Number(row.gddBase50);
  if (gdd >= 3600) {
    return `${row.cityName} has one of the strongest base 50°F GDD totals in the current city list, giving warm-season crops more accumulated heat to work with.`;
  }
  if (gdd >= 3000) {
    return `${row.cityName} has a high base 50°F GDD total, which generally gives crops like tomatoes, peppers, corn, squash, and melons more heat margin than cooler locations.`;
  }
  if (gdd >= 2400) {
    return `${row.cityName} has a solid base 50°F GDD profile, though crop choice, variety speed, and frost timing still matter.`;
  }
  return `${row.cityName} remains part of the ranking, but its base 50°F GDD total is less favorable for long-season warm crops than the top heat-accumulation cities.`;
}

module.exports = function () {
  const reference = gddReference();
  const entries = reference.cityRecords
    .filter((record) => record.country === "canada")
    .filter((record) => Number.isFinite(Number(record.gddBase50)))
    .sort((a, b) => Number(b.gddBase50) - Number(a.gddBase50))
    .map((row, index) => ({
      rank: index + 1,
      cityKey: row.cityKey,
      cityName: row.cityName,
      regionKey: row.regionKey,
      regionName: row.regionName,
      regionAbbr: row.regionAbbr,
      country: row.country,
      countryLabel: row.countryLabel,
      url: row.cityUrl,
      gddBase50: row.gddBase50,
      gddBase45: row.gddBase45,
      gddBase40: row.gddBase40,
      label: heatLabel(row.gddBase50),
      reason: reason(row)
    }));

  return {
    key: "canadian-cities-with-the-highest-growing-degree-days",
    title: "Canadian Cities With the Highest Growing Degree Days",
    shortTitle: "Highest GDD Cities",
    slug: "canadian-cities-with-the-highest-growing-degree-days",
    permalink: "/data/rankings/canadian-cities-with-the-highest-growing-degree-days/",
    description:
      "Canadian cities ranked by base 50°F growing degree day accumulation for warm-season crop planning.",
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      "Canadian cities are ranked by their base 50°F seasonal growing degree day reference value. Base 50°F GDD is a useful broad comparison point for warm-season crops, though individual crops may use different base temperatures.",
    caveat:
      "High GDD does not guarantee crop success. Frost timing, soil temperature, irrigation, cloud cover, variety choice, microclimate, and gardener timing still affect real-world maturity and harvest quality.",
    top: entries[0] || null,
    entries
  };
};
