const gddReference = require("./gddReference");

function heatLabel(gdd) {
  const n = Number(gdd);
  if (!Number.isFinite(n)) return "Insufficient data";
  if (n >= 7000) return "Extreme heat accumulation";
  if (n >= 5500) return "Very high heat accumulation";
  if (n >= 4000) return "High heat accumulation";
  if (n >= 2500) return "Moderate to high heat";
  return "Lower heat accumulation";
}

function reason(row) {
  const gdd = Number(row.gddBase50);
  if (gdd >= 7000) {
    return `${row.cityName} has one of the strongest base 50°F GDD totals in the current U.S. city list, giving heat-loving crops an unusually large seasonal heat supply.`;
  }
  if (gdd >= 5500) {
    return `${row.cityName} has very high base 50°F GDD accumulation, which generally favors long-season warm crops when water and heat stress are managed.`;
  }
  if (gdd >= 4000) {
    return `${row.cityName} has high base 50°F GDD accumulation for warm-season crop planning.`;
  }
  if (gdd >= 2500) {
    return `${row.cityName} has moderate to high seasonal heat, though crop choice, variety speed, frost timing, and irrigation still matter.`;
  }
  return `${row.cityName} remains part of the ranking, but its base 50°F GDD total is lower than the warmest U.S. locations in this dataset.`;
}

module.exports = function () {
  const reference = gddReference();
  const entries = reference.cityRecords
    .filter((record) => record.country === "usa")
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
    key: "us-cities-with-the-highest-growing-degree-days",
    title: "US Cities With the Highest Growing Degree Days",
    shortTitle: "Highest U.S. GDD Cities",
    slug: "us-cities-with-the-highest-growing-degree-days",
    permalink: "/data/rankings/us-cities-with-the-highest-growing-degree-days/",
    description:
      "U.S. cities ranked by base 50°F growing degree day accumulation for warm-season crop planning.",
    updated: "2026-06-03",
    category: "Data ranking",
    methodology:
      "U.S. cities are ranked by their base 50°F seasonal growing degree day reference value. Base 50°F GDD is a useful broad comparison point for warm-season crops, though individual crops may use different base temperatures.",
    caveat:
      "High GDD does not guarantee crop success. Extreme heat, drought, humidity, soil temperature, irrigation, frost timing, variety choice, and local microclimates still affect real-world maturity and harvest quality.",
    top: entries[0] || null,
    entries
  };
};
