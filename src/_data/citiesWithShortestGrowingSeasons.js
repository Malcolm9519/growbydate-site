const citySummaries = require("./citySummaries");
const { getGddRemaining } = require("./_lib/dataRankingScoring");

function seasonLabel(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return "Insufficient data";
  if (n < 90) return "Very short";
  if (n < 115) return "Short";
  if (n < 140) return "Short to moderate";
  if (n < 170) return "Moderate";
  return "Longer season";
}

function reason(row) {
  const days = Number(row.frostFreeDays);
  if (days < 90) {
    return `${row.cityName} has a very short median frost-free window, which makes long-season warm crops much more dependent on protection or unusually warm sites.`;
  }
  if (days < 120) {
    return `${row.cityName} has a short outdoor season, so spring timing and first-frost margin matter for warm-season crops.`;
  }
  if (days < 150) {
    return `${row.cityName} has a moderate but still timing-sensitive frost-free season.`;
  }
  return `${row.cityName} has a comparatively longer frost-free window in the current dataset.`;
}

module.exports = function () {
  const entries = citySummaries()
    .map((summary) => {
      const frostFreeDays = summary.season?.derived?.frostFreeDays ?? null;
      return {
        rank: null,
        cityKey: summary.key,
        cityName: summary.name,
        regionKey: summary.regionKey,
        regionName: summary.regionName,
        country: summary.country,
        url:
          summary.country === "canada"
            ? `/planting-dates/canada/${summary.regionKey}/${summary.key}/`
            : `/planting-dates/${summary.regionKey}/${summary.key}/`,
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
      if (a.frostFreeDays !== b.frostFreeDays) return a.frostFreeDays - b.frostFreeDays;
      return (a.gddRemainingMay1 || 0) - (b.gddRemainingMay1 || 0);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1, reason: reason(entry) }));

  return {
    key: "cities-with-the-shortest-growing-seasons",
    title: "Cities With the Shortest Growing Seasons",
    shortTitle: "Shortest Growing Seasons",
    slug: "cities-with-the-shortest-growing-seasons",
    permalink: "/data/rankings/cities-with-the-shortest-growing-seasons/",
    description:
      "Cities ranked by median frost-free windows.",
    updated: "2026-05-23",
    category: "Data ranking",
    methodology:
      "Cities are ranked by median frost-free days between the typical last spring frost and first fall frost. Ties use remaining base-50 GDD as a secondary signal.",
    caveat:
      "A short frost-free window does not mean gardening is impossible. It means crop choice, variety speed, warm microclimates, and season extension matter more.",
    top: entries[0] || null,
    longest: entries[entries.length - 1] || null,
    entries
  };
};
