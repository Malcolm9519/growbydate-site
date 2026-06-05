const frostDateReference = require("./frostDateReference");
const gddReference = require("./gddReference");

function seasonLabel(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return "Insufficient data";
  if (n >= 330) return "Nearly year-round season";
  if (n >= 280) return "Very long season";
  if (n >= 220) return "Long season";
  if (n >= 170) return "Moderate to long season";
  return "Shorter season";
}

function reason(row) {
  const days = Number(row.frostFreeDays);
  if (days >= 330) {
    return `${row.cityName} has one of the longest frost-free windows in the current U.S. city list, giving gardeners a nearly year-round outdoor growing window.`;
  }
  if (days >= 280) {
    return `${row.cityName} has a very long frost-free window, giving gardeners more flexibility for succession planting and long-season crops.`;
  }
  if (days >= 220) {
    return `${row.cityName} has a long outdoor growing window, though seasonal heat and summer stress still matter.`;
  }
  return `${row.cityName} is included for comparison, but its frost-free window is not among the longest in the U.S. dataset.`;
}

module.exports = function () {
  const gddByLookup = new Map(
    gddReference().cityRecords.map((record) => [String(record.lookupKey), record])
  );

  const entries = frostDateReference().cityRecords
    .filter((record) => record.country === "usa")
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
    key: "us-cities-with-the-longest-growing-seasons",
    title: "US Cities With the Longest Growing Seasons",
    shortTitle: "Longest U.S. Growing Seasons",
    slug: "us-cities-with-the-longest-growing-seasons",
    permalink: "/data/rankings/us-cities-with-the-longest-growing-seasons/",
    description:
      "U.S. cities ranked by average frost-free growing season length.",
    updated: "2026-06-03",
    category: "Data ranking",
    methodology:
      "U.S. cities are ranked by frost-free days between the typical last spring frost and first fall frost. Ties use base-50 GDD as a secondary signal where available.",
    caveat:
      "A longer frost-free season does not always mean better conditions for every crop. High heat, humidity, drought, cool marine influence, and local microclimates can all affect real-world garden performance.",
    top: entries[0] || null,
    entries
  };
};
