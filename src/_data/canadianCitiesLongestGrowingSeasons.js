const frostDateReference = require("./frostDateReference");
const gddReference = require("./gddReference");

function seasonLabel(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return "Insufficient data";
  if (n >= 210) return "Very long season";
  if (n >= 180) return "Long season";
  if (n >= 150) return "Longer Canadian season";
  if (n >= 120) return "Moderate season";
  return "Shorter season";
}

function reason(row) {
  const days = Number(row.frostFreeDays);
  if (days >= 210) {
    return `${row.cityName} has one of the longest frost-free windows in the Canadian reference dataset.`;
  }
  if (days >= 180) {
    return `${row.cityName} has a long frost-free window by Canadian standards, giving gardeners more time for warm-season crops.`;
  }
  if (days >= 150) {
    return `${row.cityName} has a comparatively longer outdoor window than many short-season Canadian locations.`;
  }
  return `${row.cityName} is included for comparison, but its frost-free window is not among the longest in the dataset.`;
}

module.exports = function () {
  const gddByLookup = new Map(
    gddReference().cityRecords.map((record) => [String(record.lookupKey), record])
  );

  const entries = frostDateReference().cityRecords
    .filter((record) => record.country === "canada")
    .filter((record) => Number.isFinite(Number(record.frostFreeDays)))
    .map((row) => {
      const gdd = gddByLookup.get(String(row.lookupKey));
      return {
        rank: null,
        cityKey: row.cityKey,
        cityName: row.cityName,
        regionKey: row.regionKey,
        regionName: row.regionName,
        regionAbbr: row.regionAbbr,
        country: row.country,
        countryLabel: row.countryLabel,
        lookupKey: row.lookupKey,
        url: row.cityUrl,
        springFrost: row.lastFrostLabel || row.lastFrost,
        fallFrost: row.firstFrostLabel || row.firstFrost,
        frostFreeDays: row.frostFreeDays,
        gddBase50: gdd ? gdd.gddBase50 : null,
        label: seasonLabel(row.frostFreeDays),
        reason: null
      };
    })
    .sort((a, b) => {
      if (b.frostFreeDays !== a.frostFreeDays) return b.frostFreeDays - a.frostFreeDays;
      return (Number(b.gddBase50) || 0) - (Number(a.gddBase50) || 0);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1, reason: reason(entry) }));

  return {
    key: "canadian-cities-with-the-longest-growing-seasons",
    title: "Canadian Cities With the Longest Growing Seasons",
    shortTitle: "Longest Canadian Growing Seasons",
    slug: "canadian-cities-with-the-longest-growing-seasons",
    permalink: "/data/rankings/canadian-cities-with-the-longest-growing-seasons/",
    description:
      "Canadian cities ranked by median frost-free season length.",
    updated: "2026-06-13",
    category: "Data ranking",
    methodology:
      "Canadian cities are ranked by frost-free days between the typical last spring frost and first fall frost. Ties use base-50°F GDD as a secondary signal where available.",
    caveat:
      "A longer frost-free season does not guarantee more heat. Cool coastal locations can have long frost-free windows but modest heat accumulation.",
    top: entries[0] || null,
    entries
  };
};
