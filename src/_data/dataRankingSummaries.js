const watermelonRealityCheck = require("./watermelonRealityCheck");
const bestCanadianCitiesForTomatoes = require("./bestCanadianCitiesForTomatoes");
const bestUsNorthernCitiesForTomatoes = require("./bestUsNorthernCitiesForTomatoes");
const hardestCropsShortSeasons = require("./hardestCropsShortSeasons");
const citiesWithShortestGrowingSeasons = require("./citiesWithShortestGrowingSeasons");
const citiesWhereFrostFreeDaysAreMisleading = require("./citiesWhereFrostFreeDaysAreMisleading");
const longGrowingSeasonsWithLowGdd = require("./longGrowingSeasonsWithLowGdd");
const shortGrowingSeasonsWithHighGdd = require("./shortGrowingSeasonsWithHighGdd");
const pepperPainIndex = require("./pepperPainIndex");
const frostPanicIndex = require("./frostPanicIndex");
const mostForgivingCropsShortSeason = require("./mostForgivingCropsShortSeason");
const canadianCitiesHighestGdd = require("./canadianCitiesHighestGdd");
const cropsThatLoseMarginWhenPlantedLate = require("./cropsThatLoseMarginWhenPlantedLate");
const canadianCitiesLongestGrowingSeasons = require("./canadianCitiesLongestGrowingSeasons");
const usCitiesHighestGdd = require("./usCitiesHighestGdd");
const usCitiesLongestGrowingSeasons = require("./usCitiesLongestGrowingSeasons");

function summarize(board, topLine) {
  return {
    key: board.key,
    title: board.title,
    description: board.description,
    url: board.permalink,
    status: "Live",
    category: board.category || "Data ranking",
    topLine,
    entriesCount: board.entries.length
  };
}

module.exports = function () {
  const watermelon = watermelonRealityCheck();
  const tomatoes = bestCanadianCitiesForTomatoes();
  const usNorthernTomatoes = bestUsNorthernCitiesForTomatoes();
  const hardest = hardestCropsShortSeasons();
  const shortest = citiesWithShortestGrowingSeasons();
  const frostMismatch = citiesWhereFrostFreeDaysAreMisleading();
  const longLowGdd = longGrowingSeasonsWithLowGdd();
  const shortHighGdd = shortGrowingSeasonsWithHighGdd();
  const pepperPain = pepperPainIndex();
  const frostPanic = frostPanicIndex();
  const forgiving = mostForgivingCropsShortSeason();
  const highestGdd = canadianCitiesHighestGdd();
  const lateMargin = cropsThatLoseMarginWhenPlantedLate();
  const longestSeason = canadianCitiesLongestGrowingSeasons();
  const usHighestGdd = usCitiesHighestGdd();
  const usLongestSeason = usCitiesLongestGrowingSeasons();

  return [
    summarize(
      frostMismatch,
      frostMismatch.top
        ? `${frostMismatch.top.cityName} has the largest frost-free-days vs GDD mismatch in the current dataset.`
        : "Current frost/GDD mismatch ranking data is available."
    ),
    summarize(
      longLowGdd,
      longLowGdd.top
        ? `${longLowGdd.top.cityName} has one of the strongest long-season, lower-heat signals in the current dataset.`
        : "Current long-season, lower-GDD ranking data is available."
    ),
    summarize(
      shortHighGdd,
      shortHighGdd.top
        ? `${shortHighGdd.top.cityName} has one of the strongest short-season, higher-heat signals in the current dataset.`
        : "Current short-season, higher-GDD ranking data is available."
    ),
    summarize(
      watermelon,
      watermelon.top
        ? `${watermelon.top.cityName} leads the current ranking at ${watermelon.top.score}/100.`
        : "Current ranking data is available."
    ),
    summarize(
      tomatoes,
      tomatoes.top
        ? `${tomatoes.top.cityName} leads the current Canadian tomato ranking at ${tomatoes.top.score}/100.`
        : "Current tomato ranking data is available."
    ),
    summarize(
      usNorthernTomatoes,
      usNorthernTomatoes.top
        ? `${usNorthernTomatoes.top.cityName} leads the current northern U.S. tomato ranking at ${usNorthernTomatoes.top.score}/100.`
        : "Current northern U.S. tomato ranking data is available."
    ),
    summarize(
      hardest,
      hardest.top
        ? `${hardest.top.cropName} currently rank as the toughest short-season crop at ${hardest.top.score}/100.`
        : "Current crop difficulty ranking data is available."
    ),
    summarize(
      shortest,
      shortest.top
        ? `${shortest.top.cityName} has the shortest current frost-free window at ${shortest.top.frostFreeDays} days.`
        : "Current growing-season ranking data is available."
    ),
    summarize(
      pepperPain,
      pepperPain.top
        ? `${pepperPain.top.cityName} currently has the highest pepper difficulty score at ${pepperPain.top.score}/100.`
        : "Current pepper ranking data is available."
    ),
    summarize(
      frostPanic,
      frostPanic.top
        ? `${frostPanic.top.cropName} in ${frostPanic.top.cityName} leads the Frost Panic Index at ${frostPanic.top.score}/100.`
        : "Current frost panic ranking data is available."
    ),
    summarize(
      forgiving,
      forgiving.top
        ? `${forgiving.top.cropName} currently rank as the most forgiving short-season crop at ${forgiving.top.score}/100.`
        : "Current forgiving-crop ranking data is available."
    ),
    summarize(
      highestGdd,
      highestGdd.top
        ? `${highestGdd.top.cityName} leads the current Canadian GDD ranking at ${highestGdd.top.gddBase50} base 50°F GDD.`
        : "Current GDD city ranking data is available."
    ),
    summarize(
      lateMargin,
      lateMargin.top
        ? `${lateMargin.top.cropName} lose the most two-week timing margin in the current dataset.`
        : "Current late-planting margin data is available."
    ),
    summarize(
      longestSeason,
      longestSeason.top
        ? `${longestSeason.top.cityName} has the longest current Canadian frost-free window at ${longestSeason.top.frostFreeDays} days.`
        : "Current longest-season ranking data is available."
    ),
    summarize(
      usHighestGdd,
      usHighestGdd.top
        ? `${usHighestGdd.top.cityName} leads the current U.S. GDD ranking at ${usHighestGdd.top.gddBase50} base 50°F GDD.`
        : "Current U.S. GDD city ranking data is available."
    ),
    summarize(
      usLongestSeason,
      usLongestSeason.top
        ? `${usLongestSeason.top.cityName} has the longest current U.S. frost-free window at ${usLongestSeason.top.frostFreeDays} days.`
        : "Current U.S. longest-season ranking data is available."
    )
  ];
};
