const recordsSource = require('./cropClimateRecords');
const citySummariesSource = require('./citySummaries');
const { MONTH_CHECKPOINTS } = require('./_lib/climateCheckpoints');

function getRecords() {
  return typeof recordsSource === 'function' ? recordsSource() : recordsSource;
}

function getCitySummaries() {
  return typeof citySummariesSource === 'function' ? citySummariesSource() : citySummariesSource;
}

const ENABLE_MONTHLY_PAGES = false;

function getCountryPrefix(country) {
  return country === 'canada' ? 'canada/' : '';
}

function getCityUrlBase(record) {
  return `/planting-dates/${getCountryPrefix(record.country)}${record.regionKey}/${record.cityKey}/${record.cropKey}/`;
}

function getMonthlyItemHref(record, bucket) {
  const base = getCityUrlBase(record);

  if (bucket === 'good') return base;
  if (bucket === 'marginal') return `${base}is-it-too-late-to-plant/`;
  return `${base}will-it-mature-before-frost/`;
}

function getBestVarietyLabel(record) {
  return (
    record?.diagnostics?.varietyStrategy?.defaultRecommendedVarietyLabel ||
    record?.fit?.bestVarietyLabel ||
    null
  );
}

function mmddToDayOfYear(mmdd) {
  if (!mmdd || typeof mmdd !== 'string' || !mmdd.includes('-')) return null;
  const [monthStr, dayStr] = mmdd.split('-');
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;

  const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > monthLengths[month - 1]) return null;

  let total = day;
  for (let i = 0; i < month - 1; i += 1) total += monthLengths[i];
  return total;
}

function getSeasonFacts(citySummary, checkpoint) {
  const springLastFrost = citySummary?.season?.frost?.spring?.p50 || null;
  const fallFirstFrost = citySummary?.season?.frost?.fall?.p50 || null;
  const frostFreeDays = citySummary?.season?.derived?.frostFreeDays_p50 || null;
  const gddRemaining = citySummary?.season?.gdd?.remaining?.[checkpoint] ?? null;

  const start = mmddToDayOfYear(checkpoint);
  const end = mmddToDayOfYear(fallFirstFrost);

  return {
    springLastFrost,
    fallFirstFrost,
    frostFreeDays,
    gddRemaining,
    daysUntilFallFrost:
      Number.isFinite(start) && Number.isFinite(end)
        ? Math.max(0, end - start)
        : null
  };
}

function getMonthSpecificGddAvailable(citySummary, checkpoint) {
  const value = citySummary?.season?.gdd?.remaining?.[checkpoint] ?? null;
  return Number.isFinite(value) ? value : null;
}

function getMonthSpecificGddMargin(record, citySummary, checkpoint) {
  const available = getMonthSpecificGddAvailable(citySummary, checkpoint);
  const target = record?.heat?.targetTypical ?? null;

  if (!Number.isFinite(available) || !Number.isFinite(target)) return null;
  return available - target;
}

function classifyForMonth(record, citySummary, checkpoint) {
  const margin = getMonthSpecificGddMargin(record, citySummary, checkpoint);

  if (!Number.isFinite(margin)) return 'marginal';
  if (margin >= 150) return 'good';
  if (margin >= -150) return 'marginal';
  return 'late';
}

function getStartGuidance(record, bucket) {
  const crop = record?.crop || {};
  const bestVarietyLabel = getBestVarietyLabel(record);

  if (bucket === 'late') {
    if (crop.transplantRecommended && bestVarietyLabel) {
      return `Only worth trying from transplants, and only with ${bestVarietyLabel.toLowerCase()} types`;
    }

    if (bestVarietyLabel) {
      return `Only worth trying with ${bestVarietyLabel.toLowerCase()} types`;
    }

    return 'Usually better treated as a late-path experiment than a normal planting choice';
  }

  if (crop.transplantRecommended && crop.directSowRecommended) {
    if (bucket === 'marginal') {
      return 'Still possible either way, but transplants usually leave the safer path now';
    }
    return 'Direct sow now or transplant now';
  }

  if (crop.plantingMethod === 'transplant' && crop.startingMethod === 'indoors') {
    return bucket === 'marginal'
      ? 'Still possible now, but transplants are the safer route'
      : 'Transplant now';
  }

  if (crop.plantingMethod === 'direct-sow') {
    return 'Direct sow now';
  }

  return null;
}

function joinNaturalList(items) {
  if (!items || !items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function buildCropCard(record, bucket, citySummary, checkpoint) {
  return {
    cropKey: record.cropKey,
    cropName: record.cropName,
    href: getMonthlyItemHref(record, bucket),
    bestStartingMethodNow: getStartGuidance(record, bucket),
    recommendedVarietyType: getBestVarietyLabel(record),
    daysToMaturity: record?.crop?.daysToMaturityTypical || null,
    gddTarget: record?.heat?.targetTypical ?? null,
    gddAvailableFromMonth: getMonthSpecificGddAvailable(citySummary, checkpoint),
    gddMarginFromMonth: getMonthSpecificGddMargin(record, citySummary, checkpoint)
  };
}

function buildFallbackOption(record, citySummary, checkpoint) {
  return {
    cropKey: record.cropKey,
    cropName: record.cropName,
    href: `${getCityUrlBase(record)}will-it-mature-before-frost/`,
    recommendedVarietyType: getBestVarietyLabel(record),
    daysToMaturity: record?.crop?.daysToMaturityTypical || null,
    gddTarget: record?.heat?.targetTypical ?? null,
    gddAvailableFromMonth: getMonthSpecificGddAvailable(citySummary, checkpoint),
    gddMarginFromMonth: getMonthSpecificGddMargin(record, citySummary, checkpoint)
  };
}

function rankCards(cards) {
  return cards.slice().sort((a, b) => {
    const aMargin = Number.isFinite(a.gddMarginFromMonth) ? a.gddMarginFromMonth : -99999;
    const bMargin = Number.isFinite(b.gddMarginFromMonth) ? b.gddMarginFromMonth : -99999;

    if (bMargin !== aMargin) return bMargin - aMargin;
    return a.cropName.localeCompare(b.cropName);
  });
}

function getShowableLateCards(cards) {
  return cards.filter((item) => {
    if (!Number.isFinite(item.gddMarginFromMonth)) return false;

    const margin = item.gddMarginFromMonth;
    const target = Number.isFinite(item.gddTarget) ? item.gddTarget : null;

    if (margin >= -150) return true;

    if (Number.isFinite(target) && target <= 600 && margin >= -225) return true;

    return false;
  });
}

function getWideOpenExamples(bestBets) {
  return bestBets
    .filter((item) => Number.isFinite(item.gddTarget))
    .slice()
    .sort((a, b) => {
      if (b.gddTarget !== a.gddTarget) return b.gddTarget - a.gddTarget;
      return a.cropName.localeCompare(b.cropName);
    })
    .slice(0, 4)
    .map((item) => item.cropName);
}

function getFocusNowItems(monthName, cityName, fallbackOptions) {
  const topNames = fallbackOptions.slice(0, 3).map((item) => item.cropName);

  return [
    topNames.length
      ? `If you still want to plant something in ${monthName}, treat crops like ${joinNaturalList(topNames)} as narrow late-path experiments rather than dependable planting choices.`
      : `Treat any new planting in ${monthName} as a narrow late-path experiment rather than a dependable planting choice.`,
    `Put most of your effort into finishing and protecting the crops already in the ground, because that usually pays back better than starting slower replacements this late.`,
    `Clear weak or underperforming plantings, prep open bed space, and get ready for the next reliable planting window instead of forcing crops that no longer have much room left.`
  ];
}

function getQuickAnswer(monthName, cityName, bestBets, gettingTight, mostlyPast, totalCount) {
  const bestCount = bestBets.length;
  const tightCount = gettingTight.length;
  const lateCount = mostlyPast.length;
  const bestShare = totalCount > 0 ? bestCount / totalCount : 0;

  const wideOpenNames = getWideOpenExamples(bestBets);
  const bestNames = bestBets.slice(0, 4).map((item) => item.cropName);

  if (bestShare >= 0.7) {
    return `${monthName} is still a wide-open planting month in ${cityName}. Even crops like ${joinNaturalList(wideOpenNames)} are still straightforward choices here.`;
  }

  if (bestShare >= 0.4) {
    return `${monthName} is still a useful planting month in ${cityName}, especially for crops like ${joinNaturalList(bestNames)}. The bigger question now is which crops still feel straightforward and which ones are already starting to depend more on timing, head starts, or faster varieties.`;
  }

  if (bestCount >= 1) {
    return `${monthName} still leaves a few solid planting options in ${cityName}, especially for crops like ${joinNaturalList(bestNames)}. Beyond those, more crops are already shifting into tighter timing decisions.`;
  }

  if (tightCount >= 1) {
    const names = gettingTight.slice(0, 3).map((item) => item.cropName);
    return `${monthName} is a narrow planting month in ${cityName}. A few crops such as ${joinNaturalList(names)} can still make sense, but most choices are no longer in the easy part of the local season.`;
  }

  if (lateCount > 0) {
    return `By ${monthName}, easy normal planting choices are mostly gone in ${cityName}. At this point, the more useful question is what still has the least-bad late path and what work is better shifted toward the next reliable planting window.`;
  }

  return `By ${monthName}, easy normal planting choices are mostly gone in ${cityName}.`;
}

function getSeasonalContext(monthName, cityName, seasonFacts, bestBets, gettingTight, totalCount) {
  const daysLeft = seasonFacts?.daysUntilFallFrost;
  const gddLeft = seasonFacts?.gddRemaining;
  const bestShare = totalCount > 0 ? bestBets.length / totalCount : 0;

  if (Number.isFinite(daysLeft) && Number.isFinite(gddLeft)) {
    if (bestShare >= 0.7) {
      return `From ${monthName} 1, ${cityName} still has about ${daysLeft} days until the average first fall frost and roughly ${gddLeft} growing degree days left in the city-level seasonal curve. At this point, the season is still doing most of the work for you, so most common garden crops remain comfortable planting choices.`;
    }

    if (bestBets.length >= 4) {
      return `From ${monthName} 1, ${cityName} still has about ${daysLeft} days until the average first fall frost and roughly ${gddLeft} growing degree days left in the city-level seasonal curve. That still leaves real room for several crops, but it is also where the split between easier choices and tighter ones becomes more obvious.`;
    }

    if (bestBets.length >= 1 || gettingTight.length >= 1) {
      return `From ${monthName} 1, ${cityName} still has about ${daysLeft} days until the average first fall frost and roughly ${gddLeft} growing degree days left in the city-level seasonal curve. That is enough for some crops to remain realistic, but not enough to treat every planting decision like it still has full-season flexibility.`;
    }

    return `From ${monthName} 1, ${cityName} still has about ${daysLeft} days until the average first fall frost and roughly ${gddLeft} growing degree days left in the city-level seasonal curve. At this point, the remaining season is narrow enough that crop speed starts doing much more of the decision work.`;
  }

  if (bestShare >= 0.7) {
    return `${monthName} is still a broad, forgiving planting month in ${cityName}. Most common garden crops still fit comfortably enough that variety choice is often more about harvest goals than rescue timing.`;
  }

  if (bestBets.length >= 4) {
    return `${monthName} is still early enough in the local season that several crops remain normal planting decisions in ${cityName}. The more useful question now is which crops still have broad flexibility and which ones are starting to care more about timing or variety speed.`;
  }

  if (bestBets.length >= 1 || gettingTight.length >= 1) {
    return `${monthName} is the point where the local planting board starts splitting more clearly in ${cityName}. Some crops still behave like normal planting decisions, while others begin depending more on faster varieties, cleaner starts, or a little more care with timing.`;
  }

  return `${monthName} is usually past the easy planting phase in ${cityName}. At this point, the local season is doing less of the work for you, so it becomes much more important to ask how much time and heat are still realistically left for any crop you are considering.`;
}

module.exports = function () {
  if (!ENABLE_MONTHLY_PAGES) return [];

  const records = Array.isArray(getRecords()) ? getRecords() : [];
  const citySummaries = Array.isArray(getCitySummaries()) ? getCitySummaries() : [];

  const byCity = new Map();
  const citySummaryByKey = new Map();

  for (const record of records) {
    if (!byCity.has(record.cityKey)) byCity.set(record.cityKey, []);
    byCity.get(record.cityKey).push(record);
  }

  for (const summary of citySummaries) {
    citySummaryByKey.set(summary.key, summary);
  }

  const pages = [];

  for (const [cityKey, cityRecords] of byCity.entries()) {
    const city = cityRecords[0];
    const citySummary = citySummaryByKey.get(cityKey) || null;

    for (const month of MONTH_CHECKPOINTS) {
      const good = [];
      const marginal = [];
      const late = [];

      for (const record of cityRecords) {
        const bucket = classifyForMonth(record, citySummary, month.checkpoint);
        const card = buildCropCard(record, bucket, citySummary, month.checkpoint);

        if (bucket === 'good') good.push(card);
        if (bucket === 'marginal') marginal.push(card);
        if (bucket === 'late') late.push(card);
      }

const bestBets = rankCards(good);
const gettingTight = rankCards(marginal);
const mostlyPast = getShowableLateCards(rankCards(late));

const noRealOptionsLeft = bestBets.length === 0 && gettingTight.length === 0;

const fallbackOptions = noRealOptionsLeft
  ? getShowableLateCards(
      rankCards(
        cityRecords
          .map((record) => buildFallbackOption(record, citySummary, month.checkpoint))
          .filter((item) => Number.isFinite(item.gddMarginFromMonth))
      )
    ).slice(0, 4)
  : [];

const focusNowItems = noRealOptionsLeft
  ? getFocusNowItems(month.monthName, city.cityName, fallbackOptions)
  : [];

const seasonFacts = getSeasonFacts(citySummary, month.checkpoint);
const totalCount = cityRecords.length;

      pages.push({
        cityKey: city.cityKey,
        cityName: city.cityName,
        country: city.country,
        regionKey: city.regionKey,
        regionName: city.regionName,
        monthKey: month.monthKey,
        monthName: month.monthName,
        checkpoint: month.checkpoint,
        pageType: 'monthly',
        copy: {
          intro: getQuickAnswer(
            month.monthName,
            city.cityName,
            bestBets,
            gettingTight,
            mostlyPast,
            totalCount
          ),
          seasonalContext: getSeasonalContext(
            month.monthName,
            city.cityName,
            seasonFacts,
            bestBets,
            gettingTight,
            totalCount
          )
        },
        seasonFacts,
        sections: {
          bestBets,
          gettingTight,
          mostlyPast
        },
        noRealOptionsLeft,
        fallbackOptions,
        focusNowItems,
        url: `/planting-dates/${city.country === 'canada' ? 'canada/' : ''}${city.regionKey}/${city.cityKey}/what-can-i-plant-in-${month.monthKey}/`
      });
        }
  }

  return pages;
};