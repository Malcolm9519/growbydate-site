const { getStationSeries } = require('./resolveCityStation');

const { CHECKPOINTS, MONTH_CHECKPOINTS } = require('./climateCheckpoints');

const PLANTING_WINDOW_LABELS = {
  tomatoes: 'Tomatoes',
  peppers: 'Peppers',
  eggplant: 'Eggplant',
  cucumbers: 'Cucumbers',
  zucchini: 'Zucchini',
  'winter-squash': 'Squash',
  pumpkin: 'Pumpkins',
  'sweet-corn': 'Sweet corn',
  beans: 'Beans',
  peas: 'Peas',
  carrots: 'Carrots',
  beets: 'Beets',
  potatoes: 'Potatoes',
  onions: 'Onions',
  garlic: 'Garlic',
  broccoli: 'Broccoli',
  cauliflower: 'Cauliflower',
  cabbage: 'Cabbage',
  lettuce: 'Lettuce',
  kale: 'Kale',
  'swiss-chard': 'Swiss chard',
  spinach: 'Spinach',
  radishes: 'Radishes',
  turnips: 'Turnips',
  melons: 'Melons',
  watermelons: 'Watermelons',
  strawberries: 'Strawberries',
  sunflowers: 'Sunflowers',
  basil: 'Basil'
};

const { buildCropDiagnostics } = require('./buildCropDiagnostics');

function mmddToDayOfYear(mmdd) {
  if (!mmdd) return null;
  const [m, d] = String(mmdd).split('-').map(Number);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return null;
  return Math.floor((Date.UTC(2021, m - 1, d) - Date.UTC(2021, 0, 1)) / 86400000);
}

function getWindowStartDay(primaryPlantingDate, plantingWindow) {
  if (plantingWindow?.start) return mmddToDayOfYear(plantingWindow.start);
  return mmddToDayOfYear(primaryPlantingDate);
}

function getWindowEndDay(primaryPlantingDate, plantingWindow) {
  if (plantingWindow?.end) return mmddToDayOfYear(plantingWindow.end);
  return mmddToDayOfYear(primaryPlantingDate);
}

function buildCheckpointDayByKey() {
  const result = {};
  for (const checkpoint of CHECKPOINTS) {
    result[checkpoint] = mmddToDayOfYear(checkpoint);
  }
  return result;
}

function dayOfYearToMmdd(day) {
  if (day == null || !Number.isFinite(day)) return null;
  const date = new Date(Date.UTC(2021, 0, 1 + day));
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${m}-${d}`;
}

function addDays(mmdd, days) {
  const doy = mmddToDayOfYear(mmdd);
  if (doy == null || !Number.isFinite(days)) return null;
  return dayOfYearToMmdd(doy + days);
}

function getRemainingGdd(city, date, base = '50') {
  const rows = city?.gdd_remaining_by_base?.[String(base)];
  if (!Array.isArray(rows)) return null;
  const row = rows.find((entry) => entry.date === date);
  return row && Number.isFinite(row.gdd) ? row.gdd : null;
}

function getAvailableGddBeforeFrost(city, startDate, fallFrostDate, base = '50') {
  if (!startDate || !fallFrostDate) return null;

  const stationId = city?.gddStationId || city?.stationId || null;
  const curve = stationId ? getStationSeries(stationId) : null;
  const series = curve?.bases?.[String(base)];
  const startDoy = mmddToDayOfYear(startDate);
  const frostDoy = mmddToDayOfYear(fallFrostDate);

  if (
    Array.isArray(series) &&
    Number.isFinite(startDoy) &&
    Number.isFinite(frostDoy) &&
    startDoy >= 0 &&
    frostDoy >= 0 &&
    frostDoy < series.length
  ) {
    const startValue = startDoy > 0 ? series[startDoy - 1] : 0;
    const frostValue = series[frostDoy - 1];

    if (Number.isFinite(startValue) && Number.isFinite(frostValue)) {
      return Math.max(0, Math.round(frostValue - startValue));
    }
  }

  const remainingAtStart = getRemainingGdd(city, startDate, base);
  const remainingAtFallFrost = getRemainingGdd(city, fallFrostDate, base);

  if (!Number.isFinite(remainingAtStart) || !Number.isFinite(remainingAtFallFrost)) {
    return null;
  }

  return Math.max(0, remainingAtStart - remainingAtFallFrost);
}

function getConfidence(gddMargin, gddTargetTypical) {
  if (gddMargin == null || !Number.isFinite(gddMargin)) return null;

  const ratio =
    Number.isFinite(gddTargetTypical) && gddTargetTypical > 0
      ? gddMargin / gddTargetTypical
      : null;

  if (gddMargin >= 1000 || (ratio != null && ratio >= 2)) return 'surplus';
  if (gddMargin >= 250) return 'strong';
  if (gddMargin >= 75) return 'good';
  if (gddMargin >= -200) return 'borderline';
  return 'risky';
}

function getFittingVarietyClasses(crop, availableGddFromPlanting) {
  if (!crop || !Array.isArray(crop.varietyClasses) || !crop.varietyClasses.length) {
    return [];
  }

  if (!Number.isFinite(availableGddFromPlanting)) {
    return [crop.varietyClasses[0]];
  }

  const fitting = crop.varietyClasses.filter(
    (variety) => Number.isFinite(variety.gddTarget) && availableGddFromPlanting >= variety.gddTarget
  );

  return fitting.length ? fitting : [crop.varietyClasses[0]];
}

function getFittingVarietyLabels(fittingVarietyClasses) {
  if (!Array.isArray(fittingVarietyClasses)) return [];
  return fittingVarietyClasses.map((variety) => variety.label).filter(Boolean);
}

function getFittingVarietyExamplesDetailed(fittingVarietyClasses) {
  if (!Array.isArray(fittingVarietyClasses)) return [];

  const examples = [];

  for (const variety of fittingVarietyClasses) {
    if (!Array.isArray(variety.examples)) continue;

    for (const example of variety.examples) {
      if (!example?.name) continue;

      if (!examples.find((existing) => existing.name === example.name)) {
        examples.push({
          name: example.name,
          note: example.note || null,
          classLabel: variety?.label || null,
          daysToMaturity: Number.isFinite(variety?.daysToMaturity) ? variety.daysToMaturity : null,
          gddTarget: Number.isFinite(variety?.gddTarget) ? variety.gddTarget : null
        });
      }
    }
  }

  return examples.slice(0, 10);
}

function buildVarietyClassFits(crop, availableGddFromPlanting) {
  if (!crop || !Array.isArray(crop.varietyClasses) || !Number.isFinite(availableGddFromPlanting)) {
    return [];
  }

  return crop.varietyClasses.map((variety) => {
    const gddTarget = Number.isFinite(variety?.gddTarget) ? variety.gddTarget : null;
    const margin = gddTarget != null ? availableGddFromPlanting - gddTarget : null;
    return {
      ...variety,
      gddTarget,
      margin,
      fits: Number.isFinite(margin) ? margin >= 0 : null,
      confidence: getConfidence(margin, gddTarget)
    };
  });
}

function buildLatestPlantingDates({ city, crop, fall50 }) {
  const cropGddBase = crop?.gddBase != null ? String(crop.gddBase) : '50';
  if (!fall50 || !Number.isFinite(crop?.gddTargetTypical)) {
    return { safe: null, borderline: null };
  }

  let safe = null;
  let borderline = null;

  for (const checkpoint of CHECKPOINTS) {
    const available = getAvailableGddBeforeFrost(city, checkpoint, fall50, cropGddBase);
    if (!Number.isFinite(available)) continue;
    const margin = available - crop.gddTargetTypical;
    if (margin >= 75) safe = checkpoint;
    if (margin >= 0) borderline = checkpoint;
  }

  return { safe, borderline };
}

function buildDelayAnalysis({ city, crop, primaryPlantingDate, fall50, gddTargetTypical }) {
  if (!primaryPlantingDate || !fall50 || !Number.isFinite(gddTargetTypical)) {
    return { rows: [], summary: null };
  }

  const scenarios = [
    { key: 'on-time', label: 'On time', offsetDays: 0 },
    { key: 'one-week-late', label: '1 week late', offsetDays: 7 },
    { key: 'two-weeks-late', label: '2 weeks late', offsetDays: 14 }
  ];

  const cropGddBase = crop?.gddBase != null ? String(crop.gddBase) : '50';
  const rows = scenarios.map((scenario) => {
    const date = addDays(primaryPlantingDate, scenario.offsetDays);
    const availableGdd = date
      ? getAvailableGddBeforeFrost(city, date, fall50, cropGddBase)
      : null;
    const gddMargin =
      Number.isFinite(availableGdd) && Number.isFinite(gddTargetTypical)
        ? availableGdd - gddTargetTypical
        : null;

    return {
      ...scenario,
      date,
      availableGdd,
      gddMargin,
      confidence: getConfidence(gddMargin, gddTargetTypical)
    };
  });

  const onTime = rows[0];
  const twoWeeksLate = rows[2];
  let summary = null;

  if (Number.isFinite(onTime?.gddMargin) && Number.isFinite(twoWeeksLate?.gddMargin)) {
    const drop = onTime.gddMargin - twoWeeksLate.gddMargin;
    summary = `Waiting two extra weeks typically costs about ${drop} GDD of seasonal margin.`;
  }

  return { rows, summary };
}

function resolvePlantingWindow(city, crop) {
  const windows = Array.isArray(city?.plantingWindows) ? city.plantingWindows : [];
  if (!windows.length || !crop) {
    return { label: null, start: null, end: null, method: null };
  }

  const plantingWindowKeyMap = {
    'sweet-corn': 'corn',
    'corn-sweet': 'corn',
    'winter-squash': 'squash',
    pumpkin: 'squash',
    zucchini: 'cucumbers'
  };

  const lookupKey = plantingWindowKeyMap[crop.key] || crop.key;
  const expectedLabel = PLANTING_WINDOW_LABELS[crop.key] || crop.name || null;

  const matched =
    windows.find((window) => window?.key === lookupKey) ||
    windows.find((window) => window?.label === expectedLabel) ||
    null;

  return {
    label: matched?.label || expectedLabel,
    start: matched?.start || null,
    end: matched?.end || null,
    method: matched?.method || null
  };
}

function buildMethodSummary({ crop, startIndoorsDate, plantOutDate, directSowDate, plantingWindow }) {
  const transplantRecommended = !!crop?.transplantRecommended;
  const directSowRecommended = !!crop?.directSowRecommended;

  let primaryLabel = 'Typical planting date';
  let primaryDate = null;
  let method = crop?.plantingMethod || null;

  if (transplantRecommended && directSowRecommended) {
    primaryLabel = 'Typical planting window';
    primaryDate = plantingWindow?.start || directSowDate || plantOutDate || startIndoorsDate || null;
    method = 'direct sow / transplant';
  } else if (transplantRecommended) {
    primaryLabel = 'Typical transplant date';
    primaryDate = plantOutDate || startIndoorsDate || null;
    method = 'transplant';
  } else if (directSowRecommended) {
    primaryLabel = 'Typical sowing date';
    primaryDate = directSowDate || plantingWindow?.start || null;
    method = 'direct sow';
  }

  return { primaryLabel, primaryDate, method };
}

function buildUrlBase(city, crop) {
  return `/planting-dates/${city.country === 'canada' ? 'canada/' : ''}${city.regionKey}/${city.key}/${crop.key}/`;
}

function buildCropClimateRecord(city, crop) {
  const spring50 = city?.season?.frost?.spring?.p50 || city?.frost_spring?.median50 || null;
  const fall50 = city?.season?.frost?.fall?.p50 || city?.frost?.median50 || null;
  const frostFreeDays = city?.season?.derived?.frostFreeDays || city?.season?.derived?.frostFreeDays_p50 || null;

  let startIndoorsDate = null;
  let plantOutDate = null;
  let directSowDate = null;

  if (spring50) {
    if (crop.daysBeforeLastFrostStartIndoors != null) {
      startIndoorsDate = addDays(spring50, -crop.daysBeforeLastFrostStartIndoors);
    }
    if (crop.daysAfterLastFrostPlantOut != null) {
      plantOutDate = addDays(spring50, crop.daysAfterLastFrostPlantOut);
    }
    if (crop.daysAfterLastFrostDirectSow != null) {
      directSowDate = addDays(spring50, crop.daysAfterLastFrostDirectSow);
    }
  }

  const transplantRecommended = !!crop.transplantRecommended;
  const directSowRecommended = !!crop.directSowRecommended;
  const primaryPlantingDate = transplantRecommended && directSowRecommended
    ? directSowDate || plantOutDate || startIndoorsDate || null
    : plantOutDate || directSowDate || startIndoorsDate || null;

  const cropGddBase = crop?.gddBase != null ? String(crop.gddBase) : '50';
  const availableGddFromPlanting =
    primaryPlantingDate && fall50
      ? getAvailableGddBeforeFrost(city, primaryPlantingDate, fall50, cropGddBase)
      : null;

  const gddTargetTypical = Number.isFinite(crop.gddTargetTypical) ? crop.gddTargetTypical : null;
  const gddMargin =
    Number.isFinite(gddTargetTypical) && Number.isFinite(availableGddFromPlanting)
      ? availableGddFromPlanting - gddTargetTypical
      : null;

  const confidence = getConfidence(gddMargin, gddTargetTypical);
  const fittingVarietyClasses = getFittingVarietyClasses(crop, availableGddFromPlanting);
  const fittingVarietyLabels = getFittingVarietyLabels(fittingVarietyClasses);
  const fittingVarietyExamplesDetailed = getFittingVarietyExamplesDetailed(fittingVarietyClasses);
  const varietyClassFits = buildVarietyClassFits(crop, availableGddFromPlanting);
  const plantingWindow = resolvePlantingWindow(city, crop);
  const methodSummary = buildMethodSummary({
    crop,
    startIndoorsDate,
    plantOutDate,
    directSowDate,
    plantingWindow
  });
  const latestPlantingDates = buildLatestPlantingDates({ city, crop, fall50 });
  const delayAnalysis = buildDelayAnalysis({
    city,
    crop,
    primaryPlantingDate,
    fall50,
    gddTargetTypical
  });
  const urlBase = buildUrlBase(city, crop);

  const remainingByCheckpoint = Object.fromEntries(
    CHECKPOINTS.map((checkpoint) => [
      checkpoint,
      getRemainingGdd(city, checkpoint, cropGddBase)
    ])
  );

  const diagnostics = buildCropDiagnostics({
    crop,
    city,
    frost: {
      spring50,
      fall50,
      frostFreeDays
    },
    planting: {
      primaryPlantingDate,
      plantingWindow,
      transplantRecommended: Boolean(crop?.transplantRecommended),
      windowStartDay: getWindowStartDay(primaryPlantingDate, plantingWindow),
      windowEndDay: getWindowEndDay(primaryPlantingDate, plantingWindow),
      checkpointDayByKey: buildCheckpointDayByKey()
    },
    heat: {
      targetTypical: gddTargetTypical,
      availableFromPlanting: availableGddFromPlanting,
      margin: gddMargin,
      remainingByCheckpoint
    },
    fit: {
      fittingVarietyLabels,
      fittingVarietyClasses,
      varietyClassFits,
      bestVarietyLabel: fittingVarietyLabels.length
        ? fittingVarietyLabels[fittingVarietyLabels.length - 1]
        : null
    },
    timing: {
      latestPlantingDates,
      delayAnalysis
    },
    strategy: {
      protectedCultureBenefit: crop?.protectedCultureBenefit || null,
      frostTolerance: crop?.frostTolerance || null,
      shortSeasonStrategy: crop?.shortSeasonStrategy || null,
      commonFailureMode: crop?.commonFailureMode || null
    }
  });

  return {
    cityKey: city.key,
    cityName: city.name,
    country: city.country,
    regionKey: city.regionKey,
    regionName: city.regionName,
    lookupKey: city.lookupKey || null,

    cropKey: crop.key,
    cropName: crop.name,
    cropSingularName: crop.singularName || crop.name,
    crop,

    urlBase,
    station: {
      stationId: city.gddStationId || city.stationId || null,
      stationName: city.stationName || null,
      stationDistanceKm: city.stationDistanceKm ?? null,
      stationMismatchFlag: city.stationMismatchFlag || ''
    },

    frost: {
      spring50,
      fall50,
      frostFreeDays
    },

    planting: {
      plantingMethod: crop.plantingMethod || null,
      startingMethod: crop.startingMethod || null,
      transplantRecommended,
      directSowRecommended,
      startIndoorsDate,
      plantOutDate,
      directSowDate,
      primaryPlantingDate,
      windowLabel: plantingWindow?.label || null,
      windowStart: plantingWindow?.start || null,
      windowEnd: plantingWindow?.end || null,
      windowMethod: plantingWindow?.method || null,
      methodSummary
    },

    heat: {
      gddBase: Number(cropGddBase),
      targetTypical: gddTargetTypical,
      availableFromPlanting: availableGddFromPlanting,
      margin: gddMargin,
      remainingByCheckpoint
    },

    fit: {
      confidence,
      fittingVarietyLabels,
      fittingVarietyClasses,
      fittingVarietyExamplesDetailed,
      varietyClassFits,
      varietyStrategy: diagnostics.varietyStrategy,
      bestVarietyLabel: fittingVarietyLabels.length
        ? fittingVarietyLabels[fittingVarietyLabels.length - 1]
        : null
    },

    timing: {
      latestPlantingDates,
      delayAnalysis
    },

    strategy: {
      daysToMaturityTypical: crop.daysToMaturityTypical || null,
      maturityFrom: crop.maturityFrom || null,
      protectedCultureBenefit: crop.protectedCultureBenefit || null,
      frostTolerance: crop.frostTolerance || null,
      frostToleranceLabel: crop.frostToleranceLabel || null,
      minSafeTempF: crop.minSafeTempF ?? null,
      oneSentenceSummary: crop.oneSentenceSummary || null,
      shortSeasonStrategy: crop.shortSeasonStrategy || null,
      commonFailureMode: crop.commonFailureMode || null
    },

    diagnostics
  };
}

module.exports = {
  mmddToDayOfYear,
  dayOfYearToMmdd,
  addDays,
  getRemainingGdd,
  getAvailableGddBeforeFrost,
  getConfidence,
  buildLatestPlantingDates,
  buildDelayAnalysis,
  resolvePlantingWindow,
  buildCropClimateRecord
};