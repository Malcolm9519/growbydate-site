// cropCitySummaries.js

const citySummariesSource = require("./citySummaries");
const cropCityCrops = require("./cropCityCrops");
const cropCityRollout = require("./cropCityRollout");
const { getStationSeries } = require("./_lib/resolveCityStation");

const CHECKPOINTS = [
  "03-15",
  "04-01",
  "04-15",
  "05-01",
  "05-15",
  "06-01",
  "06-15",
  "07-01",
  "07-15",
  "08-01",
  "08-15"
];

const PLANTING_WINDOW_LABELS = {
  tomatoes: "Tomatoes",
  peppers: "Peppers",
  eggplant: "Eggplant",
  cucumbers: "Cucumbers",
  zucchini: "Zucchini",
  "winter-squash": "Squash",
  pumpkin: "Pumpkins",
  "sweet-corn": "Sweet corn",
  beans: "Beans",
  peas: "Peas",
  carrots: "Carrots",
  beets: "Beets",
  potatoes: "Potatoes",
  onions: "Onions",
  garlic: "Garlic",
  broccoli: "Broccoli",
  cauliflower: "Cauliflower",
  cabbage: "Cabbage",
  lettuce: "Lettuce",
  kale: "Kale",
  spinach: "Spinach",
  radishes: "Radishes",
  turnips: "Turnips",
  melons: "Melons",
  watermelons: "Watermelons",
  strawberries: "Strawberries",
  sunflowers: "Sunflowers",
  basil: "Basil"
};

function formatVarietyLabelsForProse(fittingVarietyClasses, { capitalize = false } = {}) {
  if (!Array.isArray(fittingVarietyClasses) || !fittingVarietyClasses.length) return null;

  const keys = fittingVarietyClasses
    .map((v) => v?.key)
    .filter(Boolean);

  if (!keys.length) return null;

  const normalized = [];
  for (const key of keys) {
    if (!normalized.includes(key)) normalized.push(key);
  }

  const allOrdered = ["very-early", "early", "mid", "late"];
  const matched = allOrdered.filter((key) => normalized.includes(key));

  let phrase = null;

  if (matched.length === 4) {
    phrase = "very early to late";
  } else if (matched.join("|") === "very-early|early") {
    phrase = "very early and early";
  } else if (matched.join("|") === "early|mid") {
    phrase = "early and mid-season";
  } else if (matched.join("|") === "mid|late") {
    phrase = "mid-season and late";
  } else if (matched.join("|") === "very-early|early|mid") {
    phrase = "very early to mid-season";
  } else if (matched.join("|") === "early|mid|late") {
    phrase = "early through late";
  } else {
    const map = {
      "very-early": "very early",
      "early": "early",
      "mid": "mid-season",
      "late": "late"
    };

    const parts = matched.map((key) => map[key]).filter(Boolean);

    if (parts.length === 1) {
      phrase = parts[0];
    } else if (parts.length === 2) {
      phrase = `${parts[0]} and ${parts[1]}`;
    } else {
      phrase = `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
    }
  }

  if (!phrase) return null;

  if (capitalize) {
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }

  return phrase;
}

function resolvePlantingWindow(city, crop) {
  const windows = Array.isArray(city?.plantingWindows) ? city.plantingWindows : [];
  const expectedLabel = PLANTING_WINDOW_LABELS[crop?.key] || crop?.name || null;
  const matched = windows.find((w) => w?.label === expectedLabel) || null;

  return {
    label: matched?.label || expectedLabel,
    start: matched?.start || null,
    end: matched?.end || null,
    method: matched?.method || null
  };
}

function buildMethodSummary({ crop, startIndoorsDate, plantOutDate, directSowDate, plantingWindow }) {
  let primaryLabel = "Typical planting date";
  let primaryDate = plantOutDate || directSowDate || startIndoorsDate || null;

  if (plantOutDate) primaryLabel = "Typical transplant date";
  else if (directSowDate) primaryLabel = "Typical sowing date";
  else if (startIndoorsDate) primaryLabel = "Typical indoor start date";

  let summarySentence = null;

  if (startIndoorsDate && plantOutDate) {
    summarySentence = `${crop.name} are usually started indoors around ${formatMmddForCopy(startIndoorsDate)} and transplanted outdoors around ${formatMmddForCopy(plantOutDate)} in ${plantingWindow?.start && plantingWindow?.end ? `the normal local planting window of ${formatMmddForCopy(plantingWindow.start)} to ${formatMmddForCopy(plantingWindow.end)}.` : "the usual local planting period."}`;
  } else if (directSowDate) {
    summarySentence = `${crop.name} are usually direct sown outdoors around ${formatMmddForCopy(directSowDate)}${plantingWindow?.start && plantingWindow?.end ? `, with a typical local planting window of ${formatMmddForCopy(plantingWindow.start)} to ${formatMmddForCopy(plantingWindow.end)}.` : "."}`;
  } else if (startIndoorsDate) {
    summarySentence = `${crop.name} are usually started around ${formatMmddForCopy(startIndoorsDate)} in ${crop.name.toLowerCase()} plans for ${formatMmddForCopy(plantingWindow?.start || startIndoorsDate)} onward.`;
  }

  return {
    primaryLabel,
    primaryDate,
    startIndoorsDate,
    plantOutDate,
    directSowDate,
    summarySentence
  };
}

function buildDelayAnalysis({ city, crop, primaryPlantingDate, fall50, gddTargetTypical }) {
  const cropGddBase = crop?.gddBase != null ? String(crop.gddBase) : "50";
  if (!primaryPlantingDate || !fall50 || !Number.isFinite(gddTargetTypical)) {
    return { rows: [], summary: null };
  }

  const scenarios = [
    { label: "On time", offsetDays: 0 },
    { label: "1 week late", offsetDays: 7 },
    { label: "2 weeks late", offsetDays: 14 }
  ];

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
      label: scenario.label,
      date,
      availableGdd,
      gddMargin
    };
  });

  const onTime = rows[0];
  const twoWeeksLate = rows[2];
  let summary = null;

  if (
    Number.isFinite(onTime?.gddMargin) &&
    Number.isFinite(twoWeeksLate?.gddMargin)
  ) {
    const drop = onTime.gddMargin - twoWeeksLate.gddMargin;
    summary = `Waiting two extra weeks typically costs about ${drop} GDD of seasonal margin for ${crop.name.toLowerCase()} in ${city.name}.`;
  }

  return { rows, summary };
}

function buildLatestPlantingDates({ city, crop, fall50 }) {
  const cropGddBase = crop?.gddBase != null ? String(crop.gddBase) : "50";
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

function normalizeArrayLike(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return Array.from(value);
  return [];
}

function getEnabledCityCrops() {
  const raw = cropCityRollout.enabledCityCrops || {};
  const normalized = {};

  for (const [cityKey, cropList] of Object.entries(raw)) {
    normalized[cityKey] = normalizeArrayLike(cropList);
  }

  return normalized;
}

function getCitySummaries() {
  if (Array.isArray(citySummariesSource)) return citySummariesSource;
  if (typeof citySummariesSource === "function") {
    const result = citySummariesSource();
    return Array.isArray(result) ? result : [];
  }
  return [];
}

function getCrops() {
  return Array.isArray(cropCityCrops) ? cropCityCrops : [];
}

function mmddToDayOfYear(mmdd) {
  if (!mmdd) return null;
  const [m, d] = String(mmdd).split("-").map(Number);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return null;
  return Math.floor(
    (Date.UTC(2021, m - 1, d) - Date.UTC(2021, 0, 1)) / 86400000
  );
}

function dayOfYearToMmdd(day) {
  if (day == null || !Number.isFinite(day)) return null;
  const date = new Date(Date.UTC(2021, 0, 1 + day));
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${m}-${d}`;
}

function addDays(mmdd, days) {
  const doy = mmddToDayOfYear(mmdd);
  if (doy == null || !Number.isFinite(days)) return null;
  return dayOfYearToMmdd(doy + days);
}

function getRemainingGdd(city, date, base = "50") {
  const rows =
    city &&
    city.gdd_remaining_by_base &&
    city.gdd_remaining_by_base[String(base)];

  if (!Array.isArray(rows)) return null;

  const row = rows.find((r) => r.date === date);
  return row && Number.isFinite(row.gdd) ? row.gdd : null;
}

function getAvailableGddBeforeFrost(city, startDate, fallFrostDate, base = "50") {
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

function chooseClosestCheckpoint(plantingDate) {
  const plantingDoy = mmddToDayOfYear(plantingDate);
  if (plantingDoy == null) return null;

  let bestCheckpoint = null;
  let bestDistance = Infinity;

  for (const cp of CHECKPOINTS) {
    const cpDoy = mmddToDayOfYear(cp);
    if (cpDoy == null) continue;

    const distance = Math.abs(cpDoy - plantingDoy);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCheckpoint = cp;
    }
  }

  return bestCheckpoint;
}

function getConfidence(gddMargin) {
  if (gddMargin == null || !Number.isFinite(gddMargin)) return null;
  if (gddMargin >= 250) return "strong";
  if (gddMargin >= 75) return "good";
  if (gddMargin >= -200) return "borderline";
  return "risky";
}

function getFittingVarietyClasses(crop, availableGddFromPlanting) {
  if (!crop || !Array.isArray(crop.varietyClasses) || !crop.varietyClasses.length) {
    return [];
  }

  if (!Number.isFinite(availableGddFromPlanting)) {
    return [crop.varietyClasses[0]];
  }

  const fitting = crop.varietyClasses.filter(
    (variety) =>
      Number.isFinite(variety.gddTarget) &&
      availableGddFromPlanting >= variety.gddTarget
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
      if (!example || !example.name) continue;
      if (!examples.find((existing) => existing.name === example.name)) {
        examples.push(example);
      }
    }
  }

  return examples.slice(0, 6);
}

function getVerb(crop) {
  const singular = String(crop?.singularName || "").toLowerCase();
  const plural = String(crop?.name || "").toLowerCase();
  return singular && singular === plural ? "is" : "are";
}

function getPerformVerb(crop) {
  return getVerb(crop) === "is" ? "performs" : "perform";
}

function getRespondVerb(crop) {
  return getVerb(crop) === "is" ? "responds" : "respond";
}

function getBecomeVerb(crop) {
  return getVerb(crop) === "is" ? "becomes" : "become";
}

function getDoVerb(crop) {
  return getVerb(crop) === "is" ? "does" : "do";
}

function getCropNounSingular(crop) {
  return String(crop?.singularName || crop?.name || "").toLowerCase().trim();
}

function formatList(labels) {
  if (!Array.isArray(labels) || !labels.length) return null;
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function median(values) {
  const nums = values.filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function stableVariantIndex(...parts) {
  const seed = parts.filter(Boolean).join("|");
  let total = 0;
  for (const ch of seed) total += ch.charCodeAt(0);
  return total;
}

function getHeatMarginSentence({ crop, city, gddMargin }) {
  if (!crop || !city || !Number.isFinite(gddMargin)) return null;

  const cropNameLower = crop.name.toLowerCase();
  const absMargin = Math.abs(gddMargin);

  if (gddMargin >= 250) {
    return `From the usual planting window, ${city.name} typically has plenty of seasonal heat for ${cropNameLower}, with roughly ${gddMargin} GDD to spare beyond this typical target.`;
  }

  if (gddMargin >= 75) {
    return `From the usual planting window, ${city.name} typically has a modest heat cushion for ${cropNameLower}, with about ${gddMargin} GDD beyond this typical target.`;
  }

  if (gddMargin >= 0) {
    return `From the usual planting window, ${city.name} usually clears this typical ${cropNameLower} target by only about ${gddMargin} GDD, so delays and slower varieties can still narrow the margin.`;
  }

  return `From the usual planting window, ${cropNameLower} in ${city.name} usually come up about ${absMargin} GDD short of this typical target.`;
}

function getVarietyFitLabel(margin) {
  if (!Number.isFinite(margin)) return "unknown";
  if (margin >= 200) return "good";
  if (margin >= 75) return "workable";
  if (margin >= -100) return "tight";
  return "poor";
}

function buildVarietyClassFits(crop, availableGddFromPlanting) {
  if (!crop || !Array.isArray(crop.varietyClasses) || !Number.isFinite(availableGddFromPlanting)) {
    return [];
  }

  return crop.varietyClasses.map((variety) => {
    const gddTarget = Number.isFinite(variety.gddTarget) ? variety.gddTarget : null;
    const margin = gddTarget != null ? availableGddFromPlanting - gddTarget : null;
    const fitLabel = getVarietyFitLabel(margin);

    return {
      ...variety,
      margin,
      fitLabel
    };
  });
}

function hasFit(varietyClassFits, label) {
  return Array.isArray(varietyClassFits) && varietyClassFits.some((v) => v.fitLabel === label);
}

function getBestFitRank(varietyClassFits) {
  if (!Array.isArray(varietyClassFits) || !varietyClassFits.length) return "unknown";
  if (hasFit(varietyClassFits, "good")) return "good";
  if (hasFit(varietyClassFits, "workable")) return "workable";
  if (hasFit(varietyClassFits, "tight")) return "tight";
  return "poor";
}

function getClassLabelSet(varietyClassFits, fitLabels) {
  if (!Array.isArray(varietyClassFits)) return [];
  const allowed = new Set(fitLabels);
  return varietyClassFits
    .filter((v) => allowed.has(v.fitLabel))
    .map((v) => v.label);
}

function formatClassLabelList(labels) {
  if (!Array.isArray(labels) || !labels.length) return null;
  if (labels.length === 1) return labels[0].toLowerCase();
  if (labels.length === 2) return `${labels[0].toLowerCase()} and ${labels[1].toLowerCase()}`;
  const lowered = labels.map((s) => s.toLowerCase());
  return `${lowered.slice(0, -1).join(", ")}, and ${lowered[lowered.length - 1]}`;
}

function buildBestVarietyParagraph({ crop, city, confidence, varietyClassFits }) {
  const cropNoun = getCropNounSingular(crop);
  const workableLabels = getClassLabelSet(varietyClassFits, ["good", "workable"]);
  const tightLabels = getClassLabelSet(varietyClassFits, ["tight"]);
  const bestRank = getBestFitRank(varietyClassFits);

  if (crop.key === "spinach") {
    return `Most spinach varieties are already fairly quick to mature, so variety speed is usually less important here than it is for longer-season crops. In ${city.name}, planting timing, bolting pressure, and whether you want baby leaves or full-size plants usually matter more than choosing between very similar maturity classes.`;
  }

  const workableText = formatClassLabelList(workableLabels);
  const tightText = formatClassLabelList(tightLabels);

  if (bestRank === "good") {
    if (workableLabels.length === varietyClassFits.length && varietyClassFits.length >= 3) {
      const idx = stableVariantIndex(city.key || city.name, crop.key) % 3;

      const variants = [
        `Most ${cropNoun} varieties can succeed in ${city.name} in a typical year. Gardeners usually have enough seasonal heat to grow across the full maturity range with plenty of margin for variety choice and timing.`,
        `Most ${cropNoun} varieties can succeed in ${city.name} in a typical year. Gardeners usually have enough seasonal heat to grow from very early through late varieties without running into serious season limits.`,
        `In ${city.name}, the season usually supports most ${cropNoun} varieties comfortably. Gardeners can often grow across the full maturity range without much seasonal pressure.`
      ];

      return variants[idx];
    }

    return `In ${city.name}, ${workableText} ${cropNoun} varieties are usually the best fit in a typical year. Slower choices can still work when the season margin stays comfortable.`;
  }

  if (bestRank === "workable") {
    if (tightLabels.length) {
      return `In ${city.name}, ${workableText} ${cropNoun} varieties are usually the most dependable choices, while ${tightText} types sit closer to the line when the season is less forgiving.`;
    }

    return `In ${city.name}, ${workableText} ${cropNoun} varieties are usually the most dependable choices. Slower types become more exposed when planting is delayed or summer heat is less steady.`;
  }

  if (bestRank === "tight") {
    return `In ${city.name}, ${tightText} ${cropNoun} varieties are usually the safest choice because they need less time and heat to finish before fall frost. Slower classes are much less forgiving here.`;
  }

  if (confidence === "risky") {
    if (crop.key === "peppers") {
      return `In ${city.name}, even the fastest pepper varieties sit near the edge of what the season can support. Success usually depends on warm sites, early starts, and favorable weather, while slower classes rarely finish well.`;
    }

    return `In ${city.name}, only the fastest ${cropNoun} varieties are realistic candidates in a typical year. Larger and later types usually run out of season before finishing well.`;
  }

  return `In ${city.name}, earlier ${cropNoun} varieties are usually the safest choice because they need less time and heat to finish before fall frost.`;
}

function buildProtectionSentence({ crop, confidence, varietyClassFits }) {
  if (!crop || crop.protectedCultureBenefit !== "high") return null;
  if (!Array.isArray(varietyClassFits) || !varietyClassFits.length) return null;

  const bestRank = getBestFitRank(varietyClassFits);
  const cropNoun = getCropNounSingular(crop);

  if (confidence === "strong" && bestRank === "good") return null;

  if (bestRank === "workable") {
    return `Season extension can improve the margin here, especially for gardeners trying to hold onto slightly slower ${cropNoun} varieties.`;
  }

  if (bestRank === "tight") {
    return `Season extension can improve the odds here, but it works best when paired with the fastest-maturing ${cropNoun} varieties rather than slower classes.`;
  }

  if (bestRank === "poor") {
    return `Protection and warm microclimates can still help here, but they usually improve the odds most for the very fastest ${cropNoun} varieties rather than making slower classes realistic.`;
  }

  return null;
}

function buildRegionalComparison(summary, peerSummaries) {
  if (!summary || !Array.isArray(peerSummaries) || peerSummaries.length < 3) return null;

  const regionName = summary.regionName || "this region";
  const cropNoun = summary.cropNounSingular || "this crop";

  const plantingMedian = median(
    peerSummaries.map((item) => mmddToDayOfYear(item.primaryPlantingDate))
  );
  const frostMedian = median(peerSummaries.map((item) => item.frostFreeDays));
  const gddMedian = median(peerSummaries.map((item) => item.availableGddFromPlanting));

  const plantingDoy = mmddToDayOfYear(summary.primaryPlantingDate);
  const frostDays = summary.frostFreeDays;
  const availableGdd = summary.availableGddFromPlanting;

  if (plantingDoy != null && plantingMedian != null) {
    const diff = Math.round(plantingDoy - plantingMedian);
    if (diff >= 5) {
      return `Compared with many ${regionName} locations, ${summary.cityName} usually reaches ${cropNoun} planting season a bit later.`;
    }
    if (diff <= -5) {
      return `Compared with many ${regionName} locations, ${summary.cityName} usually reaches ${cropNoun} planting season a bit earlier.`;
    }
  }

  if (Number.isFinite(frostDays) && Number.isFinite(frostMedian)) {
    const diff = Math.round(frostDays - frostMedian);
    if (diff >= 8) {
      return `Compared with many ${regionName} locations, ${summary.cityName} usually gives ${cropNoun} a somewhat longer frost-free stretch.`;
    }
    if (diff <= -8) {
      return `Compared with many ${regionName} locations, ${summary.cityName} usually gives ${cropNoun} a somewhat shorter frost-free stretch.`;
    }
  }

  if (Number.isFinite(availableGdd) && Number.isFinite(gddMedian)) {
    const diff = Math.round(availableGdd - gddMedian);
    if (diff >= 120) {
      return `Compared with many ${regionName} locations, ${summary.cityName} usually has a warmer seasonal runway for ${cropNoun}.`;
    }
    if (diff <= -120) {
      return `Compared with many ${regionName} locations, ${summary.cityName} usually has a cooler seasonal runway for ${cropNoun}.`;
    }
  }

  return null;
}

function buildMainRiskSentence({ crop, confidence, gddMargin }) {
  const cropNoun = getCropNounSingular(crop);

  if (confidence === "strong") {
    if (Number.isFinite(gddMargin) && gddMargin >= 500) {
      return `The bigger challenge here is usually not season length but planting later than necessary or choosing slower ${cropNoun} varieties than most gardeners need.`;
    }
    return `Late planting or slow early growth can still narrow the margin for slower ${cropNoun} varieties.`;
  }

  if (confidence === "good") {
    return `Late planting or cool early conditions can delay maturity for slower ${cropNoun} varieties.`;
  }

  if (confidence === "borderline") {
    return `Delays in planting or slower ${cropNoun} varieties can quickly push maturity past fall frost.`;
  }

  return `The season often runs out before the crop finishes well.`;
}

function buildVarietyFitSentence(crop, fittingVarietyLabels, fittingVarietyClasses, confidence) {
  const labelsText =
    formatVarietyLabelsForProse(fittingVarietyClasses) ||
    formatList(fittingVarietyLabels)?.toLowerCase();

  const labelsTextCapitalized =
    formatVarietyLabelsForProse(fittingVarietyClasses, { capitalize: true }) ||
    (labelsText ? labelsText.charAt(0).toUpperCase() + labelsText.slice(1) : null);

  if (!labelsText) return null;

  if (confidence === "strong") {
    return `${labelsTextCapitalized} varieties can usually mature here in a typical year.`;
  }

  if (confidence === "good") {
    return `${labelsTextCapitalized} varieties are usually a practical fit here in a typical year.`;
  }

  if (confidence === "borderline") {
    if (fittingVarietyLabels.length === 1) {
      return `Only ${labelsText} varieties are a realistic fit in a typical year.`;
    }
    return `${labelsTextCapitalized} varieties are usually the best fit here, while slower types face more season risk.`;
  }

  return `Only the earliest varieties are realistic candidates here in a typical year.`;
}

function formatMmddForCopy(mmdd) {
  if (!mmdd) return null;
  const [m, d] = String(mmdd).split("-").map(Number);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return null;

  const date = new Date(Date.UTC(2021, m - 1, d));
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
}

function getSeasonTightness({ confidence, gddMargin, frostFreeDays }) {
  if (confidence === "strong" || (Number.isFinite(gddMargin) && gddMargin >= 250)) {
    return "comfortable";
  }

  if (
    confidence === "good" ||
    (Number.isFinite(gddMargin) && gddMargin >= 75) ||
    (Number.isFinite(frostFreeDays) && frostFreeDays >= 140)
  ) {
    return "moderate";
  }

  if (
    confidence === "borderline" ||
    (Number.isFinite(gddMargin) && gddMargin >= -200) ||
    (Number.isFinite(frostFreeDays) && frostFreeDays >= 110)
  ) {
    return "tight";
  }

  return "very-tight";
}

function getClimateProfile(city) {
  const cityKey = String(city?.key || "").toLowerCase();
  const regionKey = String(city?.regionKey || "").toLowerCase();
  const cityName = String(city?.name || "").toLowerCase();

  const coastalCities = new Set(["vancouver", "victoria"]);
  const prairieCities = new Set([
    "calgary",
    "edmonton",
    "red-deer",
    "lethbridge",
    "medicine-hat",
    "regina",
    "saskatoon",
    "winnipeg",
    "brandon",
    "fargo",
    "bismarck",
    "sioux-falls",
    "rapid-city",
    "billings",
    "bozeman",
    "missoula"
  ]);
  const interiorWarmCities = new Set(["kelowna", "kamloops", "penticton"]);
  const lakesCities = new Set([
    "duluth",
    "green-bay",
    "milwaukee",
    "madison",
    "detroit",
    "grand-rapids",
    "cleveland",
    "buffalo",
    "erie"
  ]);
  const mountainCities = new Set(["calgary", "bozeman", "missoula", "billings"]);

  if (coastalCities.has(cityKey) || regionKey === "british-columbia-coast") {
    return {
      key: "coastal",
      baseline: "the season is usually long enough, but spring heat tends to build more slowly than it does in hotter inland climates",
      warmestSites: "south-facing walls, protected patios, and sunnier urban lots that hold a bit more overnight warmth",
      coolestSites: "shaded gardens, exposed sites, and cooler marine-influenced pockets"
    };
  }

  if (interiorWarmCities.has(cityKey)) {
    return {
      key: "interior-warm",
      baseline: "summer warmth usually builds well, so the main local differences come from exposure, slope, and how quickly spring sites wake up",
      warmestSites: "south-facing slopes, reflected-heat walls, and sunny sheltered lots",
      coolestSites: "shaded yards, low pockets, and breezier exposed properties"
    };
  }

  if (
    prairieCities.has(cityKey) ||
    ["alberta", "saskatchewan", "manitoba", "north-dakota", "south-dakota"].includes(regionKey)
  ) {
    return {
      key: "prairie",
      baseline: "season length is often limited by late spring and an early-closing fall window, especially for warm-season crops",
      warmestSites: "south-facing walls, raised beds, sheltered backyards, and urban heat pockets",
      coolestSites: "open windy yards, low frost pockets, and exposed sites that lose heat quickly"
    };
  }

  if (lakesCities.has(cityKey)) {
    return {
      key: "lakes",
      baseline: "nearby water can soften some temperature swings, but local exposure still changes how quickly soil warms and how early frost settles in",
      warmestSites: "sunny protected urban lots, south-facing beds, and sites with reflected heat",
      coolestSites: "open windy properties, low cold-air pockets, and heavily shaded yards"
    };
  }

  if (mountainCities.has(cityKey) || cityName.includes("mountain")) {
    return {
      key: "mountain",
      baseline: "elevation and exposure can make nearby gardens behave quite differently, even within the same city",
      warmestSites: "sheltered south-facing beds, masonry walls, and spots above cold-air drainage",
      coolestSites: "low pockets, exposed benches, and sites that catch more wind"
    };
  }

  return {
    key: "general",
    baseline: "local gardens do not all warm and cool at the same pace",
    warmestSites: "south-facing walls, sheltered gardens, raised beds, and sunnier urban lots",
    coolestSites: "low spots, exposed sites, and shadier yards"
  };
}

function buildMicroBaseline({
  city,
  crop,
  confidence,
  gddMargin,
  frostFreeDays,
  primaryPlantingDate,
  fallFrost
}) {
  const cropNameLower = crop.name.toLowerCase();
  const plantingText = formatMmddForCopy(primaryPlantingDate);
  const fallText = formatMmddForCopy(fallFrost);
  const seasonTightness = getSeasonTightness({ confidence, gddMargin, frostFreeDays });
  const alreadyHaveHas = getVerb(crop) === "is" ? "already has" : "already have";
  const usuallyHaveHas = getVerb(crop) === "is" ? "usually has" : "usually have";
  const finishText = getVerb(crop) === "is" ? "it finishes" : "they finish";
  const sitText = getVerb(crop) === "is" ? "sits" : "sit";

  if (seasonTightness === "comfortable") {
    return `In ${city.name}, ${cropNameLower} ${alreadyHaveHas} a comfortable seasonal margin in a typical year${plantingText ? ` when planted around ${plantingText}` : ""}.`;
  }

  if (seasonTightness === "moderate") {
    return `In ${city.name}, ${cropNameLower} ${usuallyHaveHas} enough season to work well, but site warmth still affects how comfortably ${finishText}${fallText ? ` before the usual fall frost around ${fallText}` : ""}.`;
  }

  if (seasonTightness === "tight") {
    return `In ${city.name}, ${cropNameLower} ${sitText} closer to the edge of the local season${fallText ? ` before the usual fall frost around ${fallText}` : ""}, so microclimate matters more than it does for easier crops.`;
  }

  return `In ${city.name}, ${cropNameLower} ${sitText} near the edge of what the local season can usually support, so microclimate is often part of the strategy rather than a bonus.`;
}

function buildMicroCropEffect({ crop, confidence, gddMargin }) {
  const comfortable =
    confidence === "strong" || (Number.isFinite(gddMargin) && gddMargin >= 250);
  const marginal =
    confidence === "borderline" ||
    confidence === "risky" ||
    (Number.isFinite(gddMargin) && gddMargin < 75);

  if (crop.key === "tomatoes") {
    if (comfortable) {
      return `For tomatoes, that usually changes earliness and ripening speed more than basic feasibility.`;
    }
    if (marginal) {
      return `For tomatoes, that can decide whether fruit ripens fully before fall or stalls late in the season.`;
    }
    return `For tomatoes, warmer sites usually mean earlier flowering, steadier ripening, and less pressure on variety choice.`;
  }

  if (crop.key === "peppers") {
    if (comfortable) {
      return `For peppers, the payoff is usually earlier sizing, better color, and more reliable finishing rather than simple yes-or-no success.`;
    }
    if (marginal) {
      return `For peppers, the warmest sites can make the difference between a partial crop and fruit that colors up well before fall.`;
    }
    return `For peppers, extra warmth mostly shows up as earlier maturity and better finishing on the plant.`;
  }

  if (crop.key === "sweet-corn") {
    if (comfortable) {
      return `For sweet corn, warmer sheltered sites mainly speed establishment and make later classes more comfortable.`;
    }
    if (marginal) {
      return `For sweet corn, warmer sites help the stand establish faster and improve the odds that ears finish on time.`;
    }
    return `For sweet corn, site warmth mostly affects how quickly the crop gets established and how much margin later plantings retain.`;
  }

  if (crop.key === "beans") {
    if (marginal) {
      return `For beans, the biggest payoff is quicker early growth and a little more time to keep pods coming before fall conditions turn.`;
    }
    return `For beans, the biggest payoff is usually faster early growth and steadier production from warmer soil.`;
  }

  return `For ${crop.name.toLowerCase()}, the warmest sites usually buy earlier growth and a little more seasonal margin.`;
}

function buildDecisionSentence({ crop, city, confidence, fittingVarietyLabels, fittingVarietyClasses, gddMargin }) {
  const cropNameLower = crop.name.toLowerCase();
  const varietyText = formatList(fittingVarietyLabels);

  if (confidence === "strong") {
    return `Most gardeners in ${city.name} can approach ${cropNameLower} as a dependable crop; the main decision is usually how much variety range they want rather than whether it can work at all.`;
  }

  if (confidence === "good") {
    return `${crop.name} ${getVerb(crop)} a practical choice in ${city.name}, especially when gardeners stay close to planting windows${varietyText ? ` and lean toward ${varietyText.toLowerCase()} varieties` : ""}.`;
  }

  if (confidence === "borderline") {
    return `${crop.name} ${getVerb(crop)} possible in ${city.name}, but it makes more sense to treat early maturity and warm placement as part of the plan rather than pushing the longest-season types.`;
  }

  if (Number.isFinite(gddMargin) && gddMargin <= -350) {
    return `In ${city.name}, ${cropNameLower} is usually a higher-risk crop unless gardeners combine the fastest varieties with very warm, protected placement.`;
  }

  return `Grow ${cropNameLower} in ${city.name} only if you are comfortable managing risk with the fastest varieties and the warmest sites you have.`;
}

function buildLocalInterpretation({
  crop,
  city,
  confidence,
  gddMargin,
  regionalComparisonSentence,
  frostFreeDays
}) {
  if (regionalComparisonSentence && confidence !== "strong") {
    return `${regionalComparisonSentence} That makes local site warmth more important for ${crop.name.toLowerCase()} here than it would be in a roomier season.`;
  }

  if (confidence === "strong") {
    if (crop.key === "tomatoes") {
      return `In practice, gardeners in ${city.name} usually use warm sites to bring harvest earlier or make mid-to-late varieties more comfortable, not to make tomatoes possible in the first place.`;
    }

    if (crop.key === "peppers") {
      return `In practice, the warmest sites in ${city.name} usually improve earliness, color, and finishing quality rather than determine whether peppers can be grown at all.`;
    }

    if (crop.key === "sweet-corn") {
      return `In practice, warmer protected sites in ${city.name} mostly help sweet corn establish faster and give later plantings a little more breathing room.`;
    }

    if (crop.key === "beans") {
      return `In practice, warmer sites in ${city.name} mostly help beans get moving faster and produce a little more steadily.`;
    }

    return `In practice, the warmest sites in ${city.name} mostly improve earliness and consistency rather than basic feasibility.`;
  }

  if (crop.protectedCultureBenefit === "high" && (confidence === "borderline" || confidence === "risky")) {
    return `${crop.name} ${getBecomeVerb(crop)} more realistic here when gardeners can add a little protection or reflected heat early in the season.`;
  }

  if (Number.isFinite(frostFreeDays) && frostFreeDays <= 115) {
    return `Because the local frost-free stretch is fairly short, ${crop.name.toLowerCase()} ${getRespondVerb(crop)} most to early momentum, site warmth, and realistic variety choice.`;
  }

  if (Number.isFinite(gddMargin) && gddMargin < 75) {
    return `Here, warm placement is less about optimization and more about protecting a crop that already has a fairly tight margin.`;
  }

  return `${crop.name} ${getRespondVerb(crop)} most here to the basics: planting on time, a site that warms well, and a variety class that matches the local season.`;
}

function buildAdvisoryCopy({
  city,
  crop,
  confidence,
  fittingVarietyLabels,
  gddMargin,
  frostFreeDays,
  primaryPlantingDate,
  fallFrost,
  regionalComparisonSentence
}) {
  if (!city || !crop) return null;

  const varietyText = formatList(fittingVarietyLabels);
  const profile = getClimateProfile(city);

  let succeed = "";
  if (confidence === "strong") {
    const idx = stableVariantIndex(city.key || city.name, crop.key, "strong-succeed") % 3;
    const strongVariants = [
      `${crop.name} usually ${getPerformVerb(crop)} reliably in ${city.name} when planted on time. In a typical year, gardeners have flexibility and can usually grow across the full maturity range with plenty of margin for variety choice and timing.`,
      `${crop.name} usually ${getPerformVerb(crop)} reliably in ${city.name} when planted on time. In a typical year, gardeners have flexibility and can usually grow from very early through late varieties without running into serious season limits.`,
      `${crop.name} usually ${getPerformVerb(crop)} reliably in ${city.name} when planted on time. In a typical year, gardeners have flexibility and can usually grow across the full maturity range without much seasonal pressure.`
    ];
    succeed = strongVariants[idx];
  } else if (confidence === "good") {
    succeed = `${crop.name} ${getVerb(crop)} usually workable in ${city.name} with normal timing and reasonable variety choice. Gardeners tend to do best when they plant on schedule${varietyText ? ` and stay close to ${varietyText.toLowerCase()} varieties` : ""} rather than stretching into the slowest types.`;
  } else if (confidence === "borderline") {
    if (crop.key === "beans") {
      succeed = `Beans can succeed in ${city.name}, but results depend heavily on variety choice and site warmth. Gardeners usually do best with faster-maturing types, warm planting locations, and timely planting.`;
    } else {
      succeed = `${crop.name} can still succeed in ${city.name}, but results depend much more on variety choice and site warmth. Gardeners usually do best with faster-maturing types, warm planting locations, and an early start when the crop benefits from transplants.`;
    }
  } else {
    succeed = `${crop.name} ${getVerb(crop)} challenging in ${city.name}. The gardeners who succeed usually stack the odds in their favor with the fastest varieties, good timing, and the warmest, most protected spaces they have.`;
  }

  let fail = "";
  if (confidence === "strong") {
    fail = `Most disappointments come from avoidable issues like late planting, slow early growth, or choosing varieties that need more time than necessary.`;
  } else if (confidence === "good") {
    fail = `Most problems come from delayed planting or from choosing slower varieties when the local season would favor faster ones. Cool stretches early in the season can also slow momentum.`;
  } else if (confidence === "borderline") {
    fail = `The most common problem is simply running short on season. Planting too late, choosing large or slow-maturing varieties, or growing in cooler exposed spots can make the difference between harvest and disappointment.`;
  } else {
    fail = `The crop usually falls short here because the season runs out before it finishes well. Late planting, cool nights, and slower varieties all make that risk much worse.`;
  }

  const microParts = [
    buildMicroBaseline({
      city,
      crop,
      confidence,
      gddMargin,
      frostFreeDays,
      primaryPlantingDate,
      fallFrost
    }),
    `The warmest sites are usually ${profile.warmestSites}, while ${profile.coolestSites} tend to be less forgiving.`,
    buildMicroCropEffect({ crop, confidence, gddMargin })
  ];

  if (confidence !== "strong") {
    microParts.splice(1, 0, `Here, ${profile.baseline}.`);
  }

  const micro = microParts.filter(Boolean).join(" ");

  const decision = buildDecisionSentence({
    crop,
    city,
    confidence,
    fittingVarietyLabels,
    gddMargin
  });

  const localInterpretation = buildLocalInterpretation({
    crop,
    city,
    confidence,
    gddMargin,
    regionalComparisonSentence,
    frostFreeDays
  });

  return {
    heading: `What Local Garden Sites Change for ${crop.name}`,
    succeed,
    fail,
    micro,
    decision,
    localInterpretation
  };
}

function buildLede({ crop, city, confidence, fittingVarietyLabels, fittingVarietyClasses }) {
  const labelsText =
    formatVarietyLabelsForProse(fittingVarietyClasses) ||
    formatList(fittingVarietyLabels)?.toLowerCase();

  const labelsTextCapitalized =
    formatVarietyLabelsForProse(fittingVarietyClasses, { capitalize: true }) ||
    (labelsText ? labelsText.charAt(0).toUpperCase() + labelsText.slice(1) : null);

  const cropNameLower = crop.name.toLowerCase();
  const verb = getVerb(crop);

const ledeOptions = {
  strong: [
    `${crop.name} ${verb} usually a strong fit in ${city.name} because the local season is long enough to support reliable maturity. Gardeners generally have room to grow ${labelsText ? labelsText : cropNameLower} varieties without needing to stretch the season.`,
    `In ${city.name}, ${cropNameLower} usually ${getPerformVerb(crop)} well because the season provides enough time and heat for reliable maturity. Gardeners typically have flexibility in both variety choice and timing.`,
    `${city.name} usually gives ${cropNameLower} enough runway for dependable maturity in a typical year. That makes this one of the more comfortable local crop fits when planting is reasonably timed.`
  ],
  good: [
    `${crop.name} ${verb} usually a good fit in ${city.name}, though results still depend on timing and sensible variety choice. ${labelsTextCapitalized ? `${labelsTextCapitalized} varieties are typically the most practical match for a normal season.` : ""}`,
    `In ${city.name}, ${cropNameLower} usually ${getVerb(crop) === "is" ? "has" : "have"} enough season to perform well, though the local window still rewards good timing and realistic variety choice.`,
    `${crop.name} ${verb} generally workable in ${city.name} because the season is supportive, even if it is not completely forgiving. Gardeners usually do best when they stay close to typical timing windows and locally appropriate varieties.`
  ],
  borderline: [
    `${crop.name} ${verb} more marginal in ${city.name} because the season is workable but leaves little room for delay or slower varieties. ${labelsTextCapitalized ? `${labelsTextCapitalized} varieties are usually the best fit.` : ""}`,
    `In ${city.name}, ${cropNameLower} can work, but the local season leaves only a modest margin for slower varieties or delayed planting.`,
    `${crop.name} ${verb} possible in ${city.name}, though the season is tight enough that variety choice and planting timing matter much more than they do for easier crops.`
  ],
  risky: [
    `${crop.name} ${verb} often difficult in ${city.name} because the season is short and heat accumulation is limited. Only the earliest varieties typically mature well, especially in warm and protected sites.`,
    `In ${city.name}, ${cropNameLower} usually ${getVerb(crop) === "is" ? "sits" : "sit"} close to the edge of what the local season can support. Faster varieties and warmer sites make the biggest difference.`,
    `${crop.name} ${verb} a more demanding choice in ${city.name} because the local season usually favors only the quickest-maturing types.`
  ]
};

  const options = ledeOptions[confidence] || ledeOptions.risky;
  const cityHash = String(city.key || city.name || "")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const cropHash = String(crop.key || crop.name || "")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = (cityHash + cropHash) % options.length;

  return options[idx].replace("{{crop}}", cropNameLower);
}

function getSummary({ crop, city, confidence, fittingVarietyLabels, fittingVarietyClasses }) {
  if (!crop || !city) return "";

  const verb = getVerb(crop);
  const varietyText =
    formatVarietyLabelsForProse(fittingVarietyClasses) ||
    formatList(fittingVarietyLabels)?.toLowerCase();

  if (confidence === "strong") {
    return `${crop.name} ${verb} typically a strong fit in ${city.name}. There is usually enough seasonal heat for reliable maturity with good timing${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`;
  }

  if (confidence === "good") {
    return `${crop.name} ${verb} generally a good fit in ${city.name}. Planting on time and variety choice help ensure good results${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`;
  }

  if (confidence === "borderline") {
    return `${crop.name} ${verb} more marginal in ${city.name}. Earlier varieties and warm planting sites improve the odds of success${varietyText ? `, with ${varietyText.toLowerCase()} types the best candidates` : ""}.`;
  }

  if (confidence === "risky") {
    return `${crop.name} ${verb} often difficult in ${city.name}. Only the earliest varieties and warmest sites typically succeed.`;
  }

  return `${crop.name} can be evaluated in ${city.name} using local frost and heat data.`;
}

function buildLinkBlurbOptions({ crop, city, confidence, fittingVarietyLabels, fittingVarietyClasses, }) {
  const cropNameLower = crop.name.toLowerCase();
const labelsText = formatVarietyLabelsForProse(fittingVarietyClasses);
  const cityName = city.name;

  if (confidence === "strong") {
    return [
      `${crop.name} ${getVerb(crop)} usually a strong local fit with enough season for reliable maturity.`,
      `${cityName} usually has enough season length to make ${cropNameLower} a dependable option.`,
      `${crop.name} generally ${getVerb(crop) === "is" ? "has" : "have"} good local runway here, with room for broader variety choice.`,
      `${crop.name} ${getVerb(crop) === "is" ? "is" : "are"} one of the easier warm-season fits here in a typical year.`,
      `${labelsText ? `${labelsText} varieties` : `A wide range of ${cropNameLower} varieties`} usually fit this local season well.`
    ];
  }

  if (confidence === "good") {
    return [
      `${crop.name} ${getVerb(crop)} usually a workable local choice when planted on time.`,
      `${crop.name} generally work well here, especially with sensible variety choice.`,
      `${cityName} usually gives ${cropNameLower} enough season to perform well with normal timing.`,
      `${crop.name} ${getVerb(crop)} a practical fit here, though slower varieties carry more risk.`,
      `${labelsText ? `${labelsText} varieties` : `${crop.name}`} are typically the best local match.`
    ];
  }

  if (confidence === "borderline") {
    return [
      `${crop.name} can work here, but earlier choices and good timing matter.`,
      `${crop.name} ${getVerb(crop)} possible locally, though the season does not leave much room for delay.`,
      `${cityName} can support ${cropNameLower}, but faster varieties are usually the safer bet.`,
      `${crop.name} ${getVerb(crop) === "is" ? "sits" : "sit"} closer to the edge of the local season than easier crops do.`,
      `${labelsText ? `${labelsText} varieties` : `Earlier ${cropNameLower} varieties`} are usually the most realistic fit here.`
    ];
  }

  return [
    `${crop.name} ${getVerb(crop)} harder to finish well here and usually does best with the fastest varieties.`,
    `${crop.name} ${getVerb(crop)} a more demanding local choice, especially in cooler or exposed sites.`,
    `${cityName} usually gives ${cropNameLower} a narrow margin for maturity in a typical year.`,
    `${crop.name} ${getVerb(crop)} more realistic here when gardeners prioritize speed, warmth, and protection.`,
    `${labelsText ? `${labelsText} varieties` : `Only very early ${cropNameLower} varieties`} usually have the best chance locally.`
  ];
}

function buildUrl(city, crop) {
  const countryPrefix = city.country === "canada" ? "canada/" : "";
  return `/planting-dates/${countryPrefix}${city.regionKey}/${city.key}/${crop.key}/`;
}

function getMatchedPlantingWindow(city, crop) {
  const plantingWindows = city?.plantingWindows || [];
  if (!plantingWindows.length || !crop?.key) return null;

  const plantingWindowKeyMap = {
    "sweet-corn": "corn",
    "corn-sweet": "corn",
    "winter-squash": "squash",
    "pumpkin": "squash",
    "zucchini": "cucumbers"
  };

  const lookupKey = plantingWindowKeyMap[crop.key] || crop.key;

  return plantingWindows.find((pw) => pw.key === lookupKey) || null;
}

function buildCropCitySummary(city, crop) {
  const spring50 =
    city?.season?.frost?.spring?.p50 ||
    city?.frost_spring?.median50 ||
    null;

  const fall50 =
    city?.season?.frost?.fall?.p50 ||
    city?.frost?.median50 ||
    null;

  const frostFreeDays =
    city?.season?.derived?.frostFreeDays ||
    city?.season?.derived?.frostFreeDays_p50 ||
    null;

  let startIndoorsDate = null;
  let plantOutDate = null;
  let directSowDate = null;
  let primaryPlantingDate = null;

  if (spring50) {
    if (crop.daysBeforeLastFrostStartIndoors != null) {
      startIndoorsDate = addDays(
        spring50,
        -crop.daysBeforeLastFrostStartIndoors
      );
    }

    if (crop.daysAfterLastFrostPlantOut != null) {
      plantOutDate = addDays(spring50, crop.daysAfterLastFrostPlantOut);
    }

    if (crop.daysAfterLastFrostDirectSow != null) {
      directSowDate = addDays(spring50, crop.daysAfterLastFrostDirectSow);
    }
  }

  primaryPlantingDate =
    plantOutDate || directSowDate || startIndoorsDate || null;

  let availableGddFromPlanting = null;
  const cropGddBase = crop?.gddBase != null ? String(crop.gddBase) : "50";

  if (primaryPlantingDate && fall50) {
    availableGddFromPlanting = getAvailableGddBeforeFrost(
      city,
      primaryPlantingDate,
      fall50,
      cropGddBase
    );
  }

  const gddTargetTypical = Number.isFinite(crop.gddTargetTypical)
    ? crop.gddTargetTypical
    : null;

  const gddMargin =
    gddTargetTypical != null && Number.isFinite(availableGddFromPlanting)
      ? availableGddFromPlanting - gddTargetTypical
      : null;

  const confidence = getConfidence(gddMargin);
  const fittingVarietyClasses = getFittingVarietyClasses(
    crop,
    availableGddFromPlanting
  );
  const fittingVarietyLabels = getFittingVarietyLabels(fittingVarietyClasses);
  const fittingVarietyExamplesDetailed = getFittingVarietyExamplesDetailed(
    fittingVarietyClasses
  );
  const varietyClassFits = buildVarietyClassFits(
    crop,
    availableGddFromPlanting
  );

  const cropNounSingular = getCropNounSingular(crop);
  const plantingWindow = resolvePlantingWindow(city, crop);

  const methodSummary = buildMethodSummary({
    crop,
    startIndoorsDate,
    plantOutDate,
    directSowDate,
    plantingWindow
  });

  const delayAnalysis = buildDelayAnalysis({
    city,
    crop,
    primaryPlantingDate,
    fall50,
    gddTargetTypical
  });

  const latestPlantingDates = buildLatestPlantingDates({
    city,
    crop,
    fall50
  });

  const summary = {
    cityKey: city.key,
    cityName: city.name,
    country: city.country,
    regionKey: city.regionKey,
    regionName: city.regionName,

    lookupKey: city.lookupKey || null,

    preferredStationId: city.preferredStationId || null,
    preferredStationName: city.preferredStationName || null,
    preferredStationLat:
      city.preferredStationLat != null ? city.preferredStationLat : null,
    preferredStationLon:
      city.preferredStationLon != null ? city.preferredStationLon : null,

    stationId: city.gddStationId || null,
    gddStationId: city.gddStationId || null,
    stationName: city.stationName || null,
    stationLat: city.stationLat != null ? city.stationLat : null,
    stationLon: city.stationLon != null ? city.stationLon : null,
    stationDistanceKm:
      city.stationDistanceKm != null ? city.stationDistanceKm : null,
    stationMismatchFlag: city.stationMismatchFlag || "",

    cropKey: crop.key,
    cropName: crop.name,
    cropNounSingular,
    crop,

    url: buildUrl(city, crop),
    lede: buildLede({
      crop,
      city,
      confidence,
      fittingVarietyLabels,
      fittingVarietyClasses
    }),

    springFrost: spring50,
    fallFrost: fall50,
    frostFreeDays,

    primaryPlantingDate,

    gddAtApr15: getRemainingGdd(city, "04-15", cropGddBase),
    gddAtMay01: getRemainingGdd(city, "05-01", cropGddBase),
    gddAtJun01: getRemainingGdd(city, "06-01", cropGddBase),

    availableGddFromPlanting,
    targetGdd: gddTargetTypical,
    gddMargin,
    confidence,
    fittingVarietyLabels,

    plantingWindows: city.plantingWindows || [],
    plantingWindow,
    methodSummary,
    delayAnalysis,
    latestPlantingDates,

    frost: {
      spring50,
      fall50,
      frostFreeDays
    },

    planting: {
      startIndoorsDate,
      plantOutDate,
      directSowDate,
      primaryPlantingDate,
      windowStart: plantingWindow?.start || null,
      windowEnd: plantingWindow?.end || null,
      windowMethod: plantingWindow?.method || null
    },

    gdd: {
      base: Number(cropGddBase),
      remainingMar15: getRemainingGdd(city, "03-15", cropGddBase),
      remainingApr1: getRemainingGdd(city, "04-01", cropGddBase),
      remainingApr15: getRemainingGdd(city, "04-15", cropGddBase),
      remainingMay1: getRemainingGdd(city, "05-01", cropGddBase),
      remainingMay15: getRemainingGdd(city, "05-15", cropGddBase),
      remainingJun1: getRemainingGdd(city, "06-01", cropGddBase),
      remainingJun15: getRemainingGdd(city, "06-15", cropGddBase),
      remainingJul1: getRemainingGdd(city, "07-01", cropGddBase),
      remainingJul15: getRemainingGdd(city, "07-15", cropGddBase),
      remainingAug1: getRemainingGdd(city, "08-01", cropGddBase),
      remainingAug15: getRemainingGdd(city, "08-15", cropGddBase)
    },

    fit: {
      availableGddFromPlanting,
      gddMargin,
      confidence,
      fittingVarietyLabels,
      fittingVarietyExamplesDetailed,
      bestVarietyLabel: fittingVarietyLabels.length
        ? fittingVarietyLabels[fittingVarietyLabels.length - 1]
        : null,
      varietyFitSentence: buildVarietyFitSentence(
        crop,
        fittingVarietyLabels,
        confidence
      ),
      varietyClassFits,
      bestVarietyParagraph: buildBestVarietyParagraph({
        crop,
        city,
        confidence,
        varietyClassFits
      }),
      protectionSentence: buildProtectionSentence({
        crop,
        confidence,
        varietyClassFits
      }),
      heatMarginSentence: getHeatMarginSentence({
        crop,
        city,
        gddMargin
      }),
      regionalComparisonSentence: null,
      mainRiskSentence: buildMainRiskSentence({
        crop,
        confidence,
        gddMargin
      }),
      linkBlurbOptions: buildLinkBlurbOptions({
        crop,
        city,
        confidence,
        fittingVarietyLabels,
          fittingVarietyClasses,
      }),
      summary: getSummary({
        crop,
        city,
        confidence,
        fittingVarietyLabels,
        fittingVarietyClasses
      })
    },

    advisory: null,

    copy: {
      oneSentenceSummary: crop.oneSentenceSummary || null,
      shortSeasonStrategy: crop.shortSeasonStrategy || null,
      commonFailureMode: crop.commonFailureMode || null
    }
  };

  summary.advisory = buildAdvisoryCopy({
    city,
    crop,
    confidence,
    fittingVarietyLabels,
    gddMargin,
    frostFreeDays,
    primaryPlantingDate,
    fallFrost: fall50,
    regionalComparisonSentence: summary.fit.regionalComparisonSentence
  });

  return summary;
}

module.exports = function () {
  const allCitySummaries = getCitySummaries();
  const allCrops = getCrops();
  const ENABLED_CITY_CROPS = getEnabledCityCrops();

  const output = [];

  for (const city of allCitySummaries) {
    const allowedCropsForCity = ENABLED_CITY_CROPS[city.key] || [];
    if (!allowedCropsForCity.length) continue;

    for (const crop of allCrops) {
      if (!allowedCropsForCity.includes(crop.key)) continue;
      output.push(buildCropCitySummary(city, crop));
    }
  }

  const peerGroups = new Map();

  for (const summary of output) {
    const groupKey = [summary.country, summary.regionKey, summary.cropKey].join("|");
    if (!peerGroups.has(groupKey)) peerGroups.set(groupKey, []);
    peerGroups.get(groupKey).push(summary);
  }

  for (const summary of output) {
    const groupKey = [summary.country, summary.regionKey, summary.cropKey].join("|");
    const peers = (peerGroups.get(groupKey) || []).filter(
      (item) => item.cityKey !== summary.cityKey
    );

    summary.fit.regionalComparisonSentence = buildRegionalComparison(summary, peers);
    summary.advisory = buildAdvisoryCopy({
      city: {
        key: summary.cityKey,
        name: summary.cityName,
        regionKey: summary.regionKey
      },
      crop: summary.crop,
      confidence: summary.confidence,
      fittingVarietyLabels: summary.fittingVarietyLabels,
      gddMargin: summary.gddMargin,
      frostFreeDays: summary.frostFreeDays,
      primaryPlantingDate: summary.primaryPlantingDate,
      fallFrost: summary.fallFrost,
      regionalComparisonSentence: summary.fit.regionalComparisonSentence
    });
  }

  return output;
};