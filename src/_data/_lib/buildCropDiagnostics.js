const { MONTH_CHECKPOINTS } = require('./climateCheckpoints');
const { getFitRank } = require('./cropClimateHelpers');

function getDecisionProfile(input) {
  const fitRank = getFitRank({
    heat: input?.heat,
    fit: input?.fit
  });

  if (fitRank >= 4) return 'very_comfortable';
  if (fitRank === 3) return 'comfortable';
  if (fitRank === 2) return 'workable';
  if (fitRank === 1) return 'tight';
  return 'stretch';
}

function getPrimaryConstraint({ crop, heat, fit, timing, strategy }) {
  const margin = heat?.margin;
  const fittingCount = Array.isArray(fit?.fittingVarietyLabels) ? fit.fittingVarietyLabels.length : 0;
  const oneWeekLate = timing?.delayAnalysis?.rows?.find((row) => row.key === 'one-week-late')?.gddMargin;
  const twoWeeksLate = timing?.delayAnalysis?.rows?.find((row) => row.key === 'two-weeks-late')?.gddMargin;

  const cropKey = crop?.key || null;
  const warmSeasonKeys = new Set([
    'tomatoes',
    'peppers',
    'eggplant',
    'melons',
    'watermelons',
    'pumpkin',
    'winter-squash',
    'sweet-corn',
    'basil',
    'cucumbers',
    'zucchini'
  ]);

  const isWarmSeason = warmSeasonKeys.has(cropKey);

  if (fittingCount <= 1) return 'slow_varieties';
  if (Number.isFinite(margin) && margin < 75) return 'season_length';
  if (Number.isFinite(oneWeekLate) && Number.isFinite(twoWeeksLate) && twoWeeksLate < 0 && oneWeekLate >= -100) {
    return 'late_start';
  }
  if (isWarmSeason && strategy?.frostTolerance === 'tender') return 'cold_start';
  if (Number.isFinite(margin) && margin < 250) return 'heat_accumulation';
  return 'execution_quality';
}

function getBestDefaultStrategy({ diagnostics, planting, crop }) {
  const constraint = diagnostics?.primaryConstraint;
  const transplantRecommended = Boolean(planting?.transplantRecommended);
  const cropKey = crop?.key || null;

  if (constraint === 'slow_varieties') return 'choose_faster_varieties';
  if (constraint === 'late_start') {
    return transplantRecommended ? 'gain_time_with_transplants' : 'choose_faster_varieties';
  }
  if (constraint === 'cold_start') return 'use_warmest_site';
  if (constraint === 'heat_accumulation') return transplantRecommended ? 'gain_time_with_transplants' : 'use_season_extension';
  if (constraint === 'season_length') return 'switch_to_easier_crop';

  if (['peppers', 'eggplant', 'melons', 'watermelons'].includes(cropKey)) {
    return 'use_warmest_site';
  }

  return 'normal_timing';
}

function getFailurePattern({ diagnostics, crop, strategy }) {
  const constraint = diagnostics?.primaryConstraint;
  const cropKey = crop?.key || null;

  if (constraint === 'late_start') return 'loses_margin_with_delay';
  if (constraint === 'slow_varieties') return 'slow_class_pushes_too_far';
  if (constraint === 'cold_start') return 'cold_soil_stalls_start';
  if (constraint === 'heat_accumulation') return 'runs_out_of_heat';

  if (cropKey === 'peppers') return 'falls_behind_early';
  if (strategy?.commonFailureMode) return 'falls_behind_early';

  return 'loses_margin_with_delay';
}

function getVarietyStrategy({ fit, diagnostics, crop }) {
  const classes = Array.isArray(fit?.varietyClassFits) ? fit.varietyClassFits : [];
  const fitting = classes.filter((item) => item?.fits);

  if (!fitting.length) {
    return {
      fastestReliableVarietyLabel: null,
      defaultRecommendedVarietyLabel: null,
      slowestStillFittingVarietyLabel: null
    };
  }

  const cropKey = crop?.key || null;
  const fastestReliableVarietyLabel = fitting[0]?.label || null;
  const slowestStillFittingVarietyLabel = fitting[fitting.length - 1]?.label || null;

  const labelAt = (index) =>
    fitting[Math.max(0, Math.min(fitting.length - 1, index))]?.label ||
    fastestReliableVarietyLabel;

  const hasLabel = (label) => fitting.some((item) => item?.label === label);
  const pickLabel = (label, fallbackIndex) =>
    hasLabel(label) ? label : labelAt(fallbackIndex);

  let defaultRecommendedVarietyLabel = fastestReliableVarietyLabel;

  const mainCropDefault = new Set([
    'potatoes',
    'onions',
    'carrots'
  ]);

  const balancedEarlyDefault = new Set([
    'beets',
    'lettuce',
    'kale',
    'peas',
    'broccoli',
    'cabbage',
    'cauliflower',
    'swiss-chard',
    'beans',
    'zucchini',
    'cucumbers'
  ]);

  if (diagnostics?.decisionProfile === 'very_comfortable') {
    if (mainCropDefault.has(cropKey)) {
      defaultRecommendedVarietyLabel = pickLabel('Mid-season', Math.ceil((fitting.length - 1) / 2));
    } else if (balancedEarlyDefault.has(cropKey)) {
      defaultRecommendedVarietyLabel = pickLabel('Early', Math.min(1, fitting.length - 1));
    } else {
      defaultRecommendedVarietyLabel = pickLabel('Mid-season', Math.ceil((fitting.length - 1) / 2));
    }
  } else if (diagnostics?.decisionProfile === 'comfortable') {
    if (mainCropDefault.has(cropKey)) {
      defaultRecommendedVarietyLabel = pickLabel('Mid-season', Math.max(0, fitting.length - 2));
    } else {
      defaultRecommendedVarietyLabel = pickLabel('Early', Math.min(1, fitting.length - 1));
    }
  } else if (diagnostics?.decisionProfile === 'workable') {
    defaultRecommendedVarietyLabel = pickLabel('Early', Math.min(1, fitting.length - 1));
  } else {
    defaultRecommendedVarietyLabel = fastestReliableVarietyLabel;
  }

  return {
    fastestReliableVarietyLabel,
    defaultRecommendedVarietyLabel,
    slowestStillFittingVarietyLabel
  };
}

function classifyMonthStatus({ checkpoint, planting, heat, fit }) {
  const remaining = heat?.remainingByCheckpoint?.[checkpoint] ?? null;
  const windowStart = planting?.windowStartDay ?? null;
  const windowEnd = planting?.windowEndDay ?? null;
  const checkpointDay = planting?.checkpointDayByKey?.[checkpoint] ?? null;
  const typicalTarget = heat?.targetTypical ?? null;

  const classes = Array.isArray(fit?.varietyClassFits) ? fit.varietyClassFits : [];
  const fastestClassTarget = classes[0]?.gddTarget ?? typicalTarget;
  const recommendedTarget =
    classes.find((item) => item?.label === fit?.bestVarietyLabel)?.gddTarget ??
    typicalTarget;

  const insideNormalWindow =
    Number.isFinite(windowStart) &&
    Number.isFinite(windowEnd) &&
    Number.isFinite(checkpointDay) &&
    checkpointDay >= windowStart &&
    checkpointDay <= windowEnd;

  if (!Number.isFinite(remaining)) return 'mostly_too_late';

  if (insideNormalWindow && Number.isFinite(typicalTarget) && remaining >= typicalTarget) {
    return 'normal_window';
  }

  if (Number.isFinite(recommendedTarget) && remaining >= recommendedTarget) {
    return 'still_reasonable';
  }

  if (Number.isFinite(fastestClassTarget) && remaining >= fastestClassTarget) {
    return 'tight_if_fast';
  }

  return 'mostly_too_late';
}

function getMonthStatusByCheckpoint({ planting, heat, fit }) {
  const result = {};

  for (const month of MONTH_CHECKPOINTS) {
    result[month.monthKey] = classifyMonthStatus({
      checkpoint: month.checkpoint,
      planting,
      heat,
      fit
    });
  }

  return result;
}

function buildCropDiagnostics(input) {
  const diagnostics = {};

  diagnostics.fitRank = getFitRank({
    heat: input?.heat,
    fit: input?.fit
  });
  diagnostics.decisionProfile = getDecisionProfile(input);
  diagnostics.primaryConstraint = getPrimaryConstraint(input);
  diagnostics.bestDefaultStrategy = getBestDefaultStrategy({
    ...input,
    diagnostics
  });
  diagnostics.failurePattern = getFailurePattern({
    ...input,
    diagnostics
  });
  diagnostics.varietyStrategy = getVarietyStrategy({
    ...input,
    diagnostics
  });
  diagnostics.monthStatusByCheckpoint = getMonthStatusByCheckpoint(input);

  return diagnostics;
}

module.exports = {
  buildCropDiagnostics
};