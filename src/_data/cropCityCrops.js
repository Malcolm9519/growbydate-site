const crops = require("./crops");

module.exports = crops
  .filter((crop) => crop.tools?.cropCity && crop.cropCity)
  .map((crop) => ({
    key: crop.key,
    name: crop.name,
    singularName: crop.singularName,
    category: crop.taxonomy.category,
    relatedCrops: crop.cropCity.relatedCrops,

    plantingMethod: crop.planning.plantingMethod,
    startingMethod: crop.planning.startingMethod,
    transplantRecommended: crop.planning.transplantRecommended,
    directSowRecommended: crop.planning.directSowRecommended,

    daysBeforeLastFrostStartIndoors: crop.planning.daysBeforeLastFrostStartIndoors,
    daysAfterLastFrostPlantOut: crop.planning.daysAfterLastFrostPlantOut,
    daysAfterLastFrostDirectSow: crop.planning.daysAfterLastFrostDirectSow,

    gddBase: crop.climate.gddBaseF,
    gddTargetTypical: crop.climate.gddTargetTypical,
    maturityFrom: crop.planning.maturityFrom,
    daysToMaturityTypical: crop.planning.daysToMaturityTypical,

frostTolerance: crop.climate.frostTolerance,
frostToleranceLabel: crop.climate.frostToleranceLabel || null,
minSafeTempF: crop.climate.minSafeTempF,

    varietyClasses: crop.cropCity.varietyClasses,

    oneSentenceSummary: crop.cropCity.oneSentenceSummary,
    shortSeasonStrategy: crop.cropCity.shortSeasonStrategy,
    commonFailureMode: crop.cropCity.commonFailureMode,
    protectedCultureBenefit: crop.climate.protectedCultureBenefit
  }));