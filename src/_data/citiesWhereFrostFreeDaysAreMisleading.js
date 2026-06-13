const { buildClimateSignalRows } = require("./_lib/rankingClimateSignals");

module.exports = function () {
  const allRows = buildClimateSignalRows();
  const entries = allRows
    .filter((row) => row.mismatchScore >= 18)
    .sort((a, b) => {
      if (b.mismatchScore !== a.mismatchScore) return b.mismatchScore - a.mismatchScore;
      return b.gddBase50 - a.gddBase50;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const longLowGdd = entries.filter((row) => row.mismatchType === "long-low-gdd");
  const shortHighGdd = entries.filter((row) => row.mismatchType === "short-high-gdd");

  return {
    key: "cities-where-frost-free-days-are-misleading",
    title: "Cities Where Frost-Free Days Are Misleading",
    shortTitle: "Misleading Frost-Free Days",
    slug: "cities-where-frost-free-days-are-misleading",
    permalink: "/data/rankings/cities-where-frost-free-days-are-misleading/",
    description:
      "North American cities where frost-free season length and seasonal heat tell different garden-planning stories.",
    updated: "2026-06-13",
    category: "Data ranking",
    methodology:
      "Cities are compared by the gap between their frost-free-days percentile and base 50°F GDD percentile within the GrowByDate reference city dataset. Larger gaps mean the calendar season and heat budget point in different directions.",
    caveat:
      "This ranking is a diagnostic signal, not a crop guarantee. Local microclimates, water, wind, soil warmth, variety choice, and year-to-year weather can change real garden outcomes.",
    top: entries[0] || null,
    topLongLowGdd: longLowGdd[0] || null,
    topShortHighGdd: shortHighGdd[0] || null,
    citiesCompared: allRows.length,
    longLowGddCount: longLowGdd.length,
    shortHighGddCount: shortHighGdd.length,
    entries
  };
};
