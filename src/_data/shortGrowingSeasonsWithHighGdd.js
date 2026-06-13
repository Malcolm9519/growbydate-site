const { buildClimateSignalRows } = require("./_lib/rankingClimateSignals");

function reason(row) {
  if (row.seasonHeatGap <= -45) {
    return `${row.cityName} has a short frost-free window compared with its heat accumulation, so timing is tight but summer heat can be surprisingly useful.`;
  }
  if (row.seasonHeatGap <= -30) {
    return `${row.cityName} gives gardeners fewer frost-free days than many locations, but the available heat ranks much better than the calendar window.`;
  }
  return `${row.cityName} is shorter on calendar room than on seasonal heat, which can reward prompt planting and fast warm-season varieties.`;
}

module.exports = function () {
  const allRows = buildClimateSignalRows();
  const entries = allRows
    .filter((row) => row.frostFreeDays <= 180 && row.seasonHeatGap <= -18)
    .sort((a, b) => {
      if (a.seasonHeatGap !== b.seasonHeatGap) return a.seasonHeatGap - b.seasonHeatGap;
      if (b.gddBase50 !== a.gddBase50) return b.gddBase50 - a.gddBase50;
      return a.frostFreeDays - b.frostFreeDays;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      reason: reason(entry)
    }));

  return {
    key: "short-growing-seasons-with-high-growing-degree-days",
    title: "Short Growing Seasons With Surprisingly High Heat",
    shortTitle: "Short Seasons, Higher Heat",
    slug: "short-growing-seasons-with-high-growing-degree-days",
    permalink: "/data/rankings/short-growing-seasons-with-high-growing-degree-days/",
    description:
      "Cities with shorter frost-free windows but stronger-than-expected base 50°F growing degree day accumulation.",
    updated: "2026-06-13",
    category: "Data ranking",
    methodology:
      "Cities with 180 or fewer frost-free days are ranked by how much higher their base 50°F GDD percentile is than their frost-free-days percentile. The result highlights places where timing is tight but seasonal heat is stronger than the calendar suggests.",
    caveat:
      "These cities still have short-season risk. The advantage is heat intensity inside the window, not immunity from late spring frost, early fall frost, hail, wind, drought, or cold garden pockets.",
    top: entries[0] || null,
    citiesCompared: allRows.length,
    entries
  };
};
