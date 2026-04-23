const recordsSource = require('./cropClimateRecords');
const { getFitRank } = require('./_lib/cropClimateHelpers');
const { buildCropClimateCopy } = require('./_lib/buildCropClimateCopy');
const { getVarietyClassDisplay } = require('./_lib/cropGrammar');

function getRecords() {
  return typeof recordsSource === 'function' ? recordsSource() : recordsSource;
}

const ENABLE_TOO_LATE_PAGES = false;

function getAlternativeBucket(record) {
  const rank = getFitRank(record);
  if (rank >= 2) return 'good';
  if (rank === 1) return 'marginal';
  return 'late';
}

function getBestVarietyLabel(record) {
  return (
    record?.diagnostics?.varietyStrategy?.defaultRecommendedVarietyLabel ||
    record?.fit?.bestVarietyLabel ||
    null
  );
}

function getAlternativeCropSwitchReason(currentRecord, alternativeRecord) {
  const currentCropName = String(currentRecord?.cropName || 'this crop').toLowerCase();
  const altCropKey = alternativeRecord?.cropKey || null;
  const altFitLabel = alternativeRecord?.fit?.label || null;

  const directSow = !!alternativeRecord?.planting?.directSowRecommended;
  const transplant = !!alternativeRecord?.planting?.transplantRecommended;
  const altBestVarietyLabel = getBestVarietyLabel(alternativeRecord);

  if (altCropKey === 'lettuce') {
    return 'a better backup if you want a quick finish from this point';
  }

  if (altCropKey === 'radishes') {
    return 'one of the fastest direct-sow backups when timing is already getting tight';
  }

  if (altCropKey === 'beets') {
    return `still one of the easier root crops to sow from this point than ${currentCropName}`;
  }

  if (altCropKey === 'beans') {
    return `a more forgiving summer crop than ${currentCropName} if you still want a productive planting`;
  }

  if (directSow && !transplant && altFitLabel === 'good') {
    return 'still one of the easier direct-sow choices from this point in the season';
  }

  if (transplant && !directSow && altFitLabel === 'good') {
    return 'still leaves a clearer path if you are planting from transplants';
  }

  if (altBestVarietyLabel) {
    return `${altBestVarietyLabel.toLowerCase()} varieties still leave a clearer path from this point`;
  }

  return 'still leaves a more forgiving path from this point in the season';
}

module.exports = function () {
  if (!ENABLE_TOO_LATE_PAGES) return [];

  const records = Array.isArray(getRecords()) ? getRecords() : [];
  const recordsByCity = new Map();

  for (const record of records) {
    if (!recordsByCity.has(record.cityKey)) recordsByCity.set(record.cityKey, []);
    recordsByCity.get(record.cityKey).push(record);
  }

  return records.map((record) => {
    const copy = buildCropClimateCopy(record, 'tooLate') || {};
    const cityPool = recordsByCity.get(record.cityKey) || [];
    const varietyStrategy = record?.diagnostics?.varietyStrategy || {};

    const fastestVarietyDisplay = getVarietyClassDisplay(varietyStrategy.fastestReliableVarietyLabel);
    const defaultVarietyDisplay = getVarietyClassDisplay(varietyStrategy.defaultRecommendedVarietyLabel);

    const alternativeCrops = cityPool
      .filter((item) => item.cropKey !== record.cropKey)
      .map((item) => {
        const altCopy = buildCropClimateCopy(item, 'tooLate') || {};

        return {
          cropKey: item.cropKey,
          cropName: item.cropName,
          bucket: getAlternativeBucket(item),
          fitLabel: altCopy.fitLabel || null,
          bestVarietyLabel:
            altCopy.bestVarietyLabel ||
            item?.diagnostics?.varietyStrategy?.defaultRecommendedVarietyLabel ||
            item?.fit?.bestVarietyLabel ||
            null,
          safeDate: item?.timing?.latestPlantingDates?.safe || null,
          borderlineDate: item?.timing?.latestPlantingDates?.borderline || null,
          switchReason: getAlternativeCropSwitchReason(record, item)
        };
      })
      .filter((item) => item.bucket === 'good' || item.bucket === 'marginal')
      .sort((a, b) => {
        const rank = { good: 0, marginal: 1 };
        const bucketDiff = rank[a.bucket] - rank[b.bucket];
        if (bucketDiff !== 0) return bucketDiff;
        return a.cropName.localeCompare(b.cropName);
      })
      .slice(0, 8);

    return {
      ...record,
      pageType: 'tooLate',
      copy: {
        ...copy,
        fastestVarietyDisplay,
        defaultVarietyDisplay
      },
      url: `${record.urlBase}is-it-too-late-to-plant/`,
      safeDate: record?.timing?.latestPlantingDates?.safe || null,
      borderlineDate: record?.timing?.latestPlantingDates?.borderline || null,
      alternativeCrops
    };
  });
};