const citySummaries = require("./citySummaries");
const { getGddRemaining } = require("./_lib/dataRankingScoring");

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
    return `${row.cityName} has one of the longest frost-free windows in the current Canadian city list.`;
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
  const entries = citySummaries()
    .filter((summary) => summary.country === "canada")
    .map((summary) => {
      const frostFreeDays = summary.season?.derived?.frostFreeDays ?? null;
      return {
        rank: null,
        cityKey: summary.key,
        cityName: summary.name,
        regionKey: summary.regionKey,
        regionName: summary.regionName,
        country: summary.country,
        url: `/planting-dates/canada/${summary.regionKey}/${summary.key}/`,
        springFrost: summary.frost_spring?.median50 || null,
        fallFrost: summary.frost?.median50 || null,
        frostFreeDays,
        label: seasonLabel(frostFreeDays),
        gddRemainingMay1: getGddRemaining(summary, "05-01"),
        gddRemainingJun1: getGddRemaining(summary, "06-01"),
        reason: null
      };
    })
    .filter((entry) => Number.isFinite(Number(entry.frostFreeDays)))
    .sort((a, b) => {
      if (b.frostFreeDays !== a.frostFreeDays) return b.frostFreeDays - a.frostFreeDays;
      return (b.gddRemainingMay1 || 0) - (a.gddRemainingMay1 || 0);
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
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      "Canadian cities are ranked by median frost-free days between the typical last spring frost and first fall frost. Ties use remaining base-50 GDD as a secondary signal.",
    caveat:
      "A longer frost-free season does not guarantee more heat. Cool coastal locations can have long frost-free windows but modest heat accumulation.",
    top: entries[0] || null,
    entries
  };
};
