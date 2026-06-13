const frostDateReference = require("./frostDateReference");
const gddReference = require("./gddReference");

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
    return `${row.cityName} has a very short frost-free window, which makes long-season warm crops much more dependent on protection or unusually warm sites.`;
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
  const gddByLookup = new Map(
    gddReference().cityRecords.map((record) => [String(record.lookupKey), record])
  );

  const entries = frostDateReference().cityRecords
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
      if (a.frostFreeDays !== b.frostFreeDays) return a.frostFreeDays - b.frostFreeDays;
      return (Number(a.gddBase50) || 0) - (Number(b.gddBase50) || 0);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1, reason: reason(entry) }));

  return {
    key: "cities-with-the-shortest-growing-seasons",
    title: "Cities With the Shortest Growing Seasons",
    shortTitle: "Shortest Growing Seasons",
    slug: "cities-with-the-shortest-growing-seasons",
    permalink: "/data/rankings/cities-with-the-shortest-growing-seasons/",
    description:
      "North American cities ranked by frost-free season length.",
    updated: "2026-06-13",
    category: "Data ranking",
    methodology:
      "Cities are ranked by frost-free days between the typical last spring frost and first fall frost. Ties use base-50°F GDD as a secondary signal where available.",
    caveat:
      "A short frost-free window does not mean gardening is impossible. It means crop choice, variety speed, warm microclimates, and season extension matter more.",
    top: entries[0] || null,
    longest: entries[entries.length - 1] || null,
    entries
  };
};
