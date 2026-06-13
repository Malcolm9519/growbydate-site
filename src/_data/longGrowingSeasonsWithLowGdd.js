const { buildClimateSignalRows } = require("./_lib/rankingClimateSignals");

function reason(row) {
  if (row.seasonHeatGap >= 45) {
    return `${row.cityName} has a long frost-free window relative to its heat accumulation, so cool-summer crops may feel easier than long-season heat lovers.`;
  }
  if (row.seasonHeatGap >= 30) {
    return `${row.cityName} has enough calendar room to look forgiving, but base 50°F GDD is modest compared with the season length.`;
  }
  return `${row.cityName} leans more calendar-rich than heat-rich, which can matter for tomatoes, peppers, melons, and other warm-season crops.`;
}

module.exports = function () {
  const allRows = buildClimateSignalRows();
  const entries = allRows
    .filter((row) => row.frostFreeDays >= 150 && row.seasonHeatGap >= 18)
    .sort((a, b) => {
      if (b.seasonHeatGap !== a.seasonHeatGap) return b.seasonHeatGap - a.seasonHeatGap;
      if (b.frostFreeDays !== a.frostFreeDays) return b.frostFreeDays - a.frostFreeDays;
      return a.gddBase50 - b.gddBase50;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      reason: reason(entry)
    }));

  return {
    key: "long-growing-seasons-with-low-growing-degree-days",
    title: "Long Growing Seasons With Low Growing Degree Days",
    shortTitle: "Long Seasons, Lower Heat",
    slug: "long-growing-seasons-with-low-growing-degree-days",
    permalink: "/data/rankings/long-growing-seasons-with-low-growing-degree-days/",
    description:
      "Cities with long frost-free seasons but comparatively modest base 50°F growing degree day accumulation.",
    updated: "2026-06-13",
    category: "Data ranking",
    methodology:
      "Cities with at least 150 frost-free days are ranked by how much higher their frost-free-days percentile is than their base 50°F GDD percentile. The result highlights places where the outdoor calendar window is longer than the warm-crop heat budget suggests.",
    caveat:
      "Long seasons with lower GDD can still be excellent garden climates. The signal mainly warns that warm-season crops may need faster varieties, warmer sites, or realistic expectations even when frost dates look generous.",
    top: entries[0] || null,
    citiesCompared: allRows.length,
    entries
  };
};
