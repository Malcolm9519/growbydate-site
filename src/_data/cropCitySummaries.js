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
  "swiss-chard": "Swiss chard",
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
  if (!windows.length || !crop) {
    return {
      label: null,
      start: null,
      end: null,
      method: null
    };
  }

  const plantingWindowKeyMap = {
    "sweet-corn": "corn",
    "corn-sweet": "corn",
    "winter-squash": "squash",
    "pumpkin": "squash",
    "zucchini": "cucumbers"
  };

  const lookupKey = plantingWindowKeyMap[crop.key] || crop.key;
  const expectedLabel = PLANTING_WINDOW_LABELS[crop.key] || crop.name || null;

  const matched =
    windows.find((w) => w?.key === lookupKey) ||
    windows.find((w) => w?.label === expectedLabel) ||
    null;

  return {
    label: matched?.label || expectedLabel,
    start: matched?.start || null,
    end: matched?.end || null,
    method: matched?.method || null
  };
}

function getPronoun(crop) {
  return getVerb(crop) === "is" ? "it" : "they";
}

function getPossessive(crop) {
  return getVerb(crop) === "is" ? "its" : "their";
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getCropSubject(crop, { capitalize = false } = {}) {
  const text = String(crop?.name || "").toLowerCase().trim();
  if (!text) return "";
  return capitalize ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function getBehaviorProfile(crop) {
  if (crop?.behaviorProfile) return crop.behaviorProfile;

  if (["spinach", "lettuce", "peas"].includes(crop?.key)) {
    return "cool-season-quality";
  }

  if (["kale", "swiss-chard", "broccoli", "cauliflower", "cabbage"].includes(crop?.key)) {
    return "cool-season-structural";
  }

  if (["radishes", "turnips"].includes(crop?.key)) {
    return "fast-root";
  }

  if (["carrots", "beets", "potatoes", "onions", "garlic"].includes(crop?.key)) {
    return "storage-root";
  }

  if (["tomatoes", "peppers", "eggplant"].includes(crop?.key)) {
    return "warm-season-fruiting";
  }

  if (["beans", "cucumbers", "zucchini", "sweet-corn"].includes(crop?.key)) {
    return "warm-season-direct";
  }

  if (["melons", "watermelons", "pumpkin", "winter-squash"].includes(crop?.key)) {
    return "long-season-risk";
  }

  return "general";
}

function buildMethodSummary({
  crop,
  startIndoorsDate,
  plantOutDate,
  directSowDate,
  plantingWindow
}) {
  const cropSubject = getCropSubject(crop, { capitalize: true });
  const transplantRecommended = !!crop?.transplantRecommended;
  const directSowRecommended = !!crop?.directSowRecommended;

  let primaryLabel = "Typical planting date";
  let primaryDate = null;
  let summarySentence = null;

  if (transplantRecommended && directSowRecommended) {
    primaryLabel = "Typical planting window";
    primaryDate = plantingWindow?.start || directSowDate || plantOutDate || startIndoorsDate || null;

    if (startIndoorsDate && plantingWindow?.start && plantingWindow?.end) {
      summarySentence = `${cropSubject} can usually be started indoors around ${formatMmddForCopy(startIndoorsDate)} or sown directly during the normal local planting window of ${formatMmddForCopy(plantingWindow.start)} to ${formatMmddForCopy(plantingWindow.end)}.`;
    } else if (plantingWindow?.start && plantingWindow?.end) {
      summarySentence = `${cropSubject} is usually planted within the normal local window of ${formatMmddForCopy(plantingWindow.start)} to ${formatMmddForCopy(plantingWindow.end)}, either by direct sowing or by setting out transplants.`;
    } else if (directSowDate && startIndoorsDate && plantOutDate) {
      summarySentence = `${cropSubject} can usually be either sown directly outdoors around ${formatMmddForCopy(directSowDate)} or started indoors around ${formatMmddForCopy(startIndoorsDate)} and transplanted outdoors around ${formatMmddForCopy(plantOutDate)}.`;
    } else if (directSowDate && plantOutDate) {
      summarySentence = `${cropSubject} can usually be either sown directly outdoors around ${formatMmddForCopy(directSowDate)} or planted as transplants around ${formatMmddForCopy(plantOutDate)}.`;
    } else if (directSowDate) {
      summarySentence = `${cropSubject} is usually sown directly outdoors around ${formatMmddForCopy(directSowDate)}.`;
    } else if (startIndoorsDate && plantOutDate) {
      summarySentence = `${cropSubject} is usually started indoors around ${formatMmddForCopy(startIndoorsDate)} and transplanted outdoors around ${formatMmddForCopy(plantOutDate)}.`;
    }
  
} else if (transplantRecommended) {
  primaryLabel = "Typical transplant date";
  primaryDate = plantingWindow?.start || plantOutDate || startIndoorsDate || null;

  if (startIndoorsDate && plantingWindow?.start && plantingWindow?.end) {
    summarySentence = `${cropSubject} ${getVerb(crop)} usually started indoors around ${formatMmddForCopy(startIndoorsDate)} and planted outdoors during the normal local window of ${formatMmddForCopy(plantingWindow.start)} to ${formatMmddForCopy(plantingWindow.end)}.`;
  } else if (plantingWindow?.start && plantingWindow?.end) {
    summarySentence = `${cropSubject} ${getVerb(crop)} usually planted outdoors during the normal local window of ${formatMmddForCopy(plantingWindow.start)} to ${formatMmddForCopy(plantingWindow.end)}.`;
  } else if (startIndoorsDate && plantOutDate) {
    summarySentence = `${cropSubject} ${getVerb(crop)} usually started indoors around ${formatMmddForCopy(startIndoorsDate)} and transplanted outdoors around ${formatMmddForCopy(plantOutDate)}.`;
  } else if (plantOutDate) {
    summarySentence = `${cropSubject} ${getVerb(crop)} usually transplanted outdoors around ${formatMmddForCopy(plantOutDate)}.`;
  }

} else if (directSowRecommended) {
  primaryLabel = "Typical sowing date";
  primaryDate = directSowDate || plantingWindow?.start || null;

  if (directSowDate) {
    summarySentence = `${cropSubject} ${getVerb(crop)} usually sown directly outdoors around ${formatMmddForCopy(directSowDate)}${
      plantingWindow?.start && plantingWindow?.end
        ? `, with a typical local planting window of ${formatMmddForCopy(plantingWindow.start)} to ${formatMmddForCopy(plantingWindow.end)}.`
        : `.`
    }`;
  }
}

  return {
    primaryLabel,
    primaryDate,
    startIndoorsDate,
    plantOutDate,
    directSowDate,
    transplantRecommended,
    directSowRecommended,
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

function cropWithCity(crop, city) {
  const cropSubject = getCropSubject(crop, { capitalize: true });
  return `${cropSubject} in ${city.name}`;
}

function cropInSeason(crop, city) {
  const cropSubject = getCropSubject(crop, { capitalize: true });
  return `${cropSubject} ${getVerb(crop)} usually easy to fit into the season in ${city.name}`;
}

function cropDependable(crop, city) {
  const cropSubject = getCropSubject(crop, { capitalize: true });
  return `${cropSubject} ${getVerb(crop) === "is" ? "is" : "are"} usually a dependable choice in ${city.name}`;
}

function cropEasyToGrow(crop, city) {
  const cropSubject = getCropSubject(crop, { capitalize: true });
  return `${cropSubject} ${getVerb(crop)} usually easy to grow in ${city.name}`;
}

function hereCrop(crop) {
  return `For ${crop.name.toLowerCase()} here`;
}

function inPracticeCrop(crop) {
  return `For ${crop.name.toLowerCase()}`;
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

function getConfidence(gddMargin, gddTargetTypical) {
  if (gddMargin == null || !Number.isFinite(gddMargin)) return null;

  const ratio =
    Number.isFinite(gddTargetTypical) && gddTargetTypical > 0
      ? gddMargin / gddTargetTypical
      : null;

  if (gddMargin >= 1000 || (ratio != null && ratio >= 2)) return "surplus";
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

function getFitsVerb(crop) {
  return getVerb(crop) === "is" ? "fits" : "fit";
}

function getHasVerb(crop) {
  return getVerb(crop) === "is" ? "has" : "have";
}

function getGivesVerb(crop) {
  return getVerb(crop) === "is" ? "gives" : "give";
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

function pickThemedVariant({ city, crop, salt, options, avoidThemes = [] }) {
  if (!Array.isArray(options) || !options.length) return null;

  const start =
    stableVariantIndex(city?.key || city?.name, crop?.key, salt) % options.length;

  for (let step = 0; step < options.length; step += 1) {
    const option = options[(start + step) % options.length];
    if (!avoidThemes.includes(option.theme)) return option;
  }

  return options[start];
}

function mergeAvoidThemes(...themeLists) {
  return [...new Set(themeLists.flat().filter(Boolean))];
}

function stableVariantIndex(...parts) {
  const seed = parts.filter(Boolean).join("|");
  let total = 0;
  for (const ch of seed) total += ch.charCodeAt(0);
  return total;
}

function getHeatMarginSentence({ crop, city, gddMargin }) {
  if (!crop || !city || !Number.isFinite(gddMargin)) return null;

const cropNameLower = getCropSubject(crop);
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

function getClassSubset(varietyClassFits, fitLabels) {
  if (!Array.isArray(varietyClassFits)) return [];
  const allowed = new Set(fitLabels);
  return varietyClassFits.filter((v) => allowed.has(v.fitLabel));
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
  const workableClasses = getClassSubset(varietyClassFits, ["good", "workable"]);
  const tightClasses = getClassSubset(varietyClassFits, ["tight"]);
  const bestRank = getBestFitRank(varietyClassFits);

  if (crop.key === "spinach") {
    return `Spinach usually matures quickly enough here that variety speed is not the main decision. In ${city.name}, the more useful distinctions are bolt resistance, leaf type, and whether you want baby leaves or full-size plants. Gardeners planting later in spring usually get more value from bolt resistance than from shaving a few days off maturity.`;
  }

  if (crop.key === "lettuce") {
    return `Lettuce usually matures quickly enough here that variety speed is not the main decision. In ${city.name}, the more useful distinctions are bolt resistance, head type, and whether you want looseleaf harvest or fuller heads. For many gardeners, planting timing matters more than small differences in maturity.`;
  }

  if (crop.key === "kale") {
    return `Kale usually has enough season here that variety speed is not the main concern. In ${city.name}, the more useful decisions are leaf type, plant size, and how long you want harvest to continue into fall. For most gardeners, choosing the form they want to harvest matters more than small differences in maturity.`;
  }

  if (crop.key === "swiss-chard") {
    return `Swiss chard usually has enough season here that maturity speed is not the main issue. In ${city.name}, the more useful differences are leaf color, plant size, and whether you want baby leaves or larger mature plants. In practice, steady growth and harvest style matter more than shaving a few days off maturity.`;
  }

  const workableText = formatVarietyLabelsForProse(workableClasses);
  const tightText = formatVarietyLabelsForProse(tightClasses);

  if (bestRank === "good") {
    if (workableClasses.length === varietyClassFits.length && varietyClassFits.length >= 3) {
      const idx = stableVariantIndex(city.key || city.name, crop.key) % 3;
      const variants = [
        `Most ${cropNoun} varieties can succeed in ${city.name} in a typical year. That gives gardeners room to choose for the kind of harvest they want, not just for minimum maturity speed.`,
`In ${city.name}, most ${cropNoun} varieties are usually realistic choices. Gardeners can often choose across the maturity range without giving up much day-to-day reliability.`,
        `The season in ${city.name} usually supports most ${cropNoun} varieties comfortably, which means the more useful decision is what kind of crop you want rather than simply how fast it finishes.`
      ];
      return variants[idx];
    }

    return `In ${city.name}, ${workableText} ${cropNoun} varieties are usually the best fit in a typical year. Slower choices can still work when gardeners want their specific qualities and do not give away margin through delay.`;
  }

  if (bestRank === "workable") {
    if (tightClasses.length) {
      return `In ${city.name}, ${workableText} ${cropNoun} varieties are usually the most dependable choices, while ${tightText} types sit closer to the line when planting is delayed or the season is less forgiving.`;
    }

    return `In ${city.name}, ${workableText} ${cropNoun} varieties are usually the most dependable choices. Slower types become more exposed when planting is delayed or early growth is less steady.`;
  }

  if (bestRank === "tight") {
    return `In ${city.name}, ${tightText} ${cropNoun} varieties are usually the safest choice because they leave the least room for the season to turn against you. Slower classes are much less forgiving here.`;
  }

  if (confidence === "risky") {
    if (crop.key === "peppers") {
      return `In ${city.name}, even the fastest pepper varieties sit near the edge of what the season can support. Success usually depends on warm sites, early starts, and favorable weather, while slower classes rarely finish well.`;
    }

    return `In ${city.name}, only the fastest ${cropNoun} varieties are realistic candidates in a typical year. Larger and later types usually run out of season before finishing well.`;
  }

  return `In ${city.name}, earlier ${cropNoun} varieties are usually the safest choice because they need less time and heat to finish before fall frost.`;
}

function buildGddInterpretation({ crop, city, confidence, gddMargin }) {
  const profile = getBehaviorProfile(crop);

  if (confidence === "surplus") {
    if (profile === "cool-season-quality") {
      return `That large heat margin gives gardeners flexibility. Planting can be shifted later and the crop will still mature easily, so the more important effect of timing is on harvest quality and how long the crop stays at its best.`;
    }

    if (profile === "cool-season-structural") {
return `That large heat margin means the crop usually has no trouble reaching maturity here. In practice, planting timing mostly affects how comfortably the crop sizes up and when harvest is ready, not whether the crop can finish.`;
    }

    if (profile === "fast-root" || profile === "storage-root") {
return `That large heat margin means season length is usually not the limiting issue here. The more useful question is how gardeners use that room to improve sizing, finish quality, and harvest timing.`;
    }

return `That large heat margin means season length is usually not the limiting issue here. The season usually gives gardeners room to focus on finish quality, harvest goals, and overall crop performance.`;
  }

  if (confidence === "strong") {
    return `That heat margin usually gives the crop a dependable buffer, so gardeners have some flexibility in planting date and variety choice without pushing the crop close to the edge.`;
  }

  if (confidence === "good") {
    return `That heat margin usually gives the crop enough room to finish, but not so much that delays stop mattering. Timing and variety choice still affect how comfortably the crop fits.`;
  }

  if (confidence === "borderline") {
    return `That narrow heat margin means small delays or slower varieties can quickly reduce the odds of timely maturity.`;
  }

  return `That heat shortfall means the crop usually needs the fastest approach and the warmest local conditions to have a realistic chance of finishing well.`;
}

function buildCheckpointIntro({ crop, city, confidence }) {
  const profile = getBehaviorProfile(crop);

  if (confidence === "surplus") {
    if (profile === "cool-season-quality") {
      return `If planting later than usual, this table shows how much growing degree day heat is still available from each point in the season. For ${crop.name.toLowerCase()}, the table is less about whether the crop will finish and more about how planting date changes harvest timing, crop speed, and the length of the harvest window.`;
    }

return `If planting later than usual, this table shows how much growing degree day heat is still available from each point in the season. For ${crop.name.toLowerCase()}, it is most useful for judging how much freedom you still have to plant for quality, finish, and harvest goals as the season moves along.`;
  }

  if (confidence === "strong" || confidence === "good") {
    return `If planting later than usual, this table shows how much growing degree day heat is still available from each point in the season. It is most useful for judging how much flexibility you still have before the crop starts losing margin.`;
  }

  return `When planting later than usual, this table shows how much growing degree day heat is still available from each point in the season. As planting gets pushed back, the remaining heat drops and the crop becomes less likely to mature on time.`;
}

function buildProtectionSentence({ crop, city, confidence, varietyClassFits }) {
  if (!crop || crop.protectedCultureBenefit !== "high") return null;
  if (!Array.isArray(varietyClassFits) || !varietyClassFits.length) return null;

  const bestRank = getBestFitRank(varietyClassFits);
  const cropNoun = getCropNounSingular(crop);

  if (confidence === "strong" && bestRank === "good") return null;

  if (bestRank === "workable") {
    const variants = [
      `Season extension can improve the margin here, especially for gardeners trying to hold onto slightly slower ${cropNoun} varieties.`,
      `A little protection can widen the buffer here, especially for gardeners hoping to keep slightly slower ${cropNoun} varieties in play.`,
      `Protection is usually most useful here when gardeners want a bit more margin for slightly slower ${cropNoun} varieties.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "protection-workable") %
        variants.length
    ];
  }

  if (bestRank === "tight") {
    const variants = [
      `Season extension can improve the odds here, but it works best when paired with the fastest-maturing ${cropNoun} varieties rather than slower classes.`,
      `Protection can help here, though it usually works best alongside the fastest-maturing ${cropNoun} varieties rather than slower classes.`,
      `A little extra protection can improve the odds here, but it is usually most effective with the quickest ${cropNoun} varieties rather than slower types.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "protection-tight") %
        variants.length
    ];
  }

  if (bestRank === "poor") {
    const variants = [
      `Protection and warm microclimates can still help here, but they usually improve the odds most for the very fastest ${cropNoun} varieties rather than making slower classes realistic.`,
      `Warm sites and season extension can still help here, though they usually matter most for the very fastest ${cropNoun} varieties rather than making slower classes realistic.`,
      `Even with protection, the best gains here usually come from pairing warm sites with the fastest ${cropNoun} varieties rather than expecting slower classes to become practical.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "protection-poor") %
        variants.length
    ];
  }

  return null;
}

function buildFrostInterpretation({ crop, city }) {
  const cropSubject = getCropSubject(crop, { capitalize: true });
  const profile = getBehaviorProfile(crop);

  if (profile === "cool-season-quality") {
    return `${cropSubject} ${getVerb(crop)} usually comfortable with light frost, which makes early planting an advantage rather than a problem. In practice, frost matters less here than timing the crop for cool conditions and good leaf quality.`;
  }

  if (profile === "cool-season-structural") {
    return `${cropSubject} ${getVerb(crop)} usually tolerant enough of cool conditions that light frost is not the main concern. The more useful question is how early planting affects establishment and overall crop quality.`;
  }

  if (profile === "fast-root" || profile === "storage-root") {
    return `${cropSubject} ${getVerb(crop)} usually tolerant enough of cool conditions that frost dates act more like planning markers than hard limits. In practice, timing and steady early growth matter more than avoiding every light frost.`;
  }

  if (profile === "warm-season-fruiting" || profile === "warm-season-direct" || profile === "long-season-risk") {
    return `${cropSubject} ${getVerb(crop)} much more exposed to frost risk, so the frost dates matter as real planting boundaries rather than rough planning markers.`;
  }

  return null;
}

function buildRegionalComparison(summary, peerSummaries) {
  if (!summary || !Array.isArray(peerSummaries) || peerSummaries.length < 3) return null;

  const regionName = summary.regionName || "this region";
const cropNoun = String(summary.cropName || summary.cropNounSingular || "this crop").toLowerCase();

  const plantingMedian = median(
    peerSummaries.map((item) => mmddToDayOfYear(item.primaryPlantingDate))
  );
  const frostMedian = median(peerSummaries.map((item) => item.frostFreeDays));
  const gddMedian = median(peerSummaries.map((item) => item.availableGddFromPlanting));

  const plantingDoy = mmddToDayOfYear(summary.primaryPlantingDate);
  const frostDays = summary.frostFreeDays;
  const availableGdd = summary.availableGddFromPlanting;

  const stableKey = summary.cityKey || summary.cityName || "regional-comparison";
  const cropKey = summary.cropKey || cropNoun;

  if (plantingDoy != null && plantingMedian != null) {
    const diff = Math.round(plantingDoy - plantingMedian);

if (diff >= 5) {
  const variants = [
    `Compared with many ${regionName} locations, ${summary.cityName} usually reaches the planting season for ${cropNoun} a bit later.`,
    `Within ${regionName}, ${summary.cityName} usually reaches planting time for ${cropNoun} a little later than many comparable locations.`,
    `${summary.cityName} usually gets into the planting season for ${cropNoun} slightly later than many other ${regionName} locations.`
  ];

  return variants[
    stableVariantIndex(stableKey, cropKey, "regional-planting-later") %
      variants.length
  ];
}

if (diff <= -5) {
  const variants = [
    `Compared with many ${regionName} locations, ${summary.cityName} usually reaches the planting season for ${cropNoun} a bit earlier.`,
    `Within ${regionName}, ${summary.cityName} usually reaches planting time for ${cropNoun} a little earlier than many comparable locations.`,
    `${summary.cityName} usually gets into the planting season for ${cropNoun} slightly earlier than many other ${regionName} locations.`
  ];

  return variants[
    stableVariantIndex(stableKey, cropKey, "regional-planting-earlier") %
      variants.length
  ];
}
  }

  if (Number.isFinite(frostDays) && Number.isFinite(frostMedian)) {
    const diff = Math.round(frostDays - frostMedian);

if (diff >= 8) {
  if (summary.confidence === "risky" || summary.confidence === "borderline") {
    const variants = [
      `Compared with many ${regionName} locations, ${summary.cityName} usually gives ${cropNoun} a somewhat longer frost-free stretch, but this crop still sits close to the edge here.`,
      `Within ${regionName}, ${summary.cityName} usually gives ${cropNoun} a somewhat longer frost-free window than many comparable places, but the overall seasonal margin is still tight.`,
      `${summary.cityName} usually gives ${cropNoun} a little more frost-free time than many other ${regionName} locations, though not enough to make this an easy fit.`
    ];

    return variants[
      stableVariantIndex(stableKey, cropKey, "regional-frost-longer-risky") %
        variants.length
    ];
  }

  const variants = [
    `Compared with many ${regionName} locations, ${summary.cityName} usually gives ${cropNoun} a somewhat longer frost-free stretch.`,
    `Within ${regionName}, ${summary.cityName} usually gives ${cropNoun} a somewhat longer frost-free window than many comparable places.`,
    `${summary.cityName} usually gives ${cropNoun} a little more frost-free time than many other ${regionName} locations.`
  ];

  return variants[
    stableVariantIndex(stableKey, cropKey, "regional-frost-longer") %
      variants.length
  ];
}

    if (diff <= -8) {
      const variants = [
        `Compared with many ${regionName} locations, ${summary.cityName} usually gives ${cropNoun} a somewhat shorter frost-free stretch.`,
`Within ${regionName}, ${summary.cityName} usually gives ${cropNoun} a somewhat shorter frost-free window than many comparable places.`,
        `${summary.cityName} usually gives ${cropNoun} a little less frost-free time than many other ${regionName} locations.`
      ];

      return variants[
        stableVariantIndex(stableKey, cropKey, "regional-frost-shorter") %
          variants.length
      ];
    }
  }

  if (Number.isFinite(availableGdd) && Number.isFinite(gddMedian)) {
    const diff = Math.round(availableGdd - gddMedian);

if (diff >= 120) {
  if (summary.confidence === "risky" || summary.confidence === "borderline") {
    const variants = [
      `Compared with many ${regionName} locations, ${summary.cityName} usually has a warmer seasonal setup for ${cropNoun}, but the crop still sits close to the edge here.`,
      `Within ${regionName}, ${summary.cityName} usually gives ${cropNoun} a warmer seasonal setup than many comparable locations, but the overall seasonal margin is still tight.`,
      `${summary.cityName} usually offers ${cropNoun} a warmer seasonal setup than many other ${regionName} locations, though not enough to make this an easy fit.`
    ];

    return variants[
      stableVariantIndex(stableKey, cropKey, "regional-gdd-warmer-risky") %
        variants.length
    ];
  }

  const variants = [
    `Compared with many ${regionName} locations, ${summary.cityName} usually has a warmer seasonal setup for ${cropNoun}.`,
    `Within ${regionName}, ${summary.cityName} usually gives ${cropNoun} a warmer seasonal setup than many comparable locations.`,
    `${summary.cityName} usually offers ${cropNoun} a warmer seasonal setup than many other ${regionName} locations.`
  ];

  return variants[
    stableVariantIndex(stableKey, cropKey, "regional-gdd-warmer") %
      variants.length
  ];
}

    if (diff <= -120) {
      const variants = [
        `Compared with many ${regionName} locations, ${summary.cityName} usually has a cooler seasonal runway for ${cropNoun}.`,
        `Within ${regionName}, ${summary.cityName} usually provides ${cropNoun} a cooler seasonal runway than many comparable locations.`,
        `${summary.cityName} usually offers ${cropNoun} a cooler seasonal setup than many other ${regionName} locations.`
      ];

      return variants[
        stableVariantIndex(stableKey, cropKey, "regional-gdd-cooler") %
          variants.length
      ];
    }
  }

  return null;
}

function buildMainRiskSentence({ crop, city, confidence, gddMargin }) {
  const cropNoun = getCropNounSingular(crop);
  const profile = getBehaviorProfile(crop);
  const idx = stableVariantIndex(city.key || city.name, crop.key, `main-risk-${confidence}`) % 3;

  if (confidence === "surplus") {
    if (profile === "cool-season-quality") {
      return [
        `The most common issue here is not climate but timing. Planting too late usually shortens the harvest window and pushes the crop into warmer conditions before it is at its best.`,
        `Gardeners usually lose quality here by timing the crop poorly rather than by running out of season. The crop matures easily, but late planting often means a shorter and less tender harvest.`,
        `The main mistake here is treating ${cropNoun} like a crop that only needs to finish. In practice, results are better when planting is timed for quality, not just maturity.`
      ][idx];
    }

    return [
      `The most common issue here is not climate but management: uneven growth, delayed planting, or harvesting outside the best quality window.`,
      `When this crop disappoints here, the problem is usually practical rather than climatic. Timing, steady growth, and harvest stage matter more than season length.`,
      `The usual setbacks here come from management choices rather than from the season itself.`
    ][idx];
  }

  if (confidence === "strong") {
    return [
      `The usual setback here is giving away seasonal margin through late planting, slow early growth, or slower variety choice than the crop really needs.`,
      `When this crop underperforms in ${city.name}, the culprit is usually timing or variety choice rather than the climate itself.`,
      `The most common problems here are practical ones: planting too late, losing momentum early, or choosing varieties that ask for more season than necessary.`
    ][idx];
  }

  if (confidence === "good") {
    return [
      `Late planting or cool early conditions can still narrow the margin for slower ${cropNoun} varieties.`,
      `The usual risk here is losing time early, since delayed planting or cool starts can slow maturity for longer-season ${cropNoun} varieties.`,
      `This crop generally fits, but slower ${cropNoun} varieties can run into trouble if planting is delayed or early growth stays cool and slow.`
    ][idx];
  }

  if (confidence === "borderline") {
    return [
      `Delays in planting or slower ${cropNoun} varieties can quickly push maturity past fall frost.`,
      `There is not much margin here, so late planting or longer-season ${cropNoun} varieties can easily carry harvest past frost.`,
      `This is close enough that any delay in planting, or any extra days to maturity, can be the difference between finishing and falling short before frost.`
    ][idx];
  }

  return [
    `The season often runs out before the crop finishes well.`,
    `The main issue here is usually simple season length: the crop often runs out of time before finishing properly.`,
    `In this location, the season is often too short for the crop to finish well before conditions turn against it.`
  ][idx];
}

function buildVarietyFitSentence(
  crop,
  city,
  fittingVarietyLabels,
  fittingVarietyClasses,
  confidence
) {
  const labelsText =
    formatVarietyLabelsForProse(fittingVarietyClasses) ||
    formatList(fittingVarietyLabels)?.toLowerCase();

  const labelsTextCapitalized =
    formatVarietyLabelsForProse(fittingVarietyClasses, { capitalize: true }) ||
    (labelsText ? labelsText.charAt(0).toUpperCase() + labelsText.slice(1) : null);

  if (!labelsText) return null;

  if (confidence === "surplus") {
const variants = [
  `${labelsTextCapitalized} varieties are usually easy to fit here in a typical year.`,
  `In a typical year, ${labelsText} varieties are usually well matched to the local season.`,
  `${labelsTextCapitalized} varieties usually have enough seasonal room here that maturity is rarely the hard part.`
];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "variety-fit-surplus") %
        variants.length
    ];
  }

  if (confidence === "strong") {
        const variants = [
      `${labelsTextCapitalized} varieties can usually mature here in a typical year.`,
      `In a typical year, ${labelsText} varieties are usually well matched to the local season.`,
      `${labelsTextCapitalized} varieties generally have enough time to mature here in a normal year.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "variety-fit-strong") %
        variants.length
    ];
  }

  if (confidence === "good") {
    const variants = [
      `${labelsTextCapitalized} varieties are usually a practical fit here in a typical year.`,
      `${labelsTextCapitalized} varieties are often a reasonable match here, especially when planting happens on time.`,
      `In most years, ${labelsText} varieties are workable here, though they leave less margin for delay than faster types.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "variety-fit-good") %
        variants.length
    ];
  }

  if (confidence === "borderline") {
    if (fittingVarietyLabels.length === 1) {
      const variants = [
        `Only ${labelsText} varieties are a realistic fit in a typical year.`,
        `${labelsTextCapitalized} varieties are usually the only realistic option here in a typical year.`,
        `In a normal year, the practical fit is usually limited to ${labelsText} varieties.`
      ];

      return variants[
        stableVariantIndex(city.key || city.name, crop.key, "variety-fit-borderline-single") %
          variants.length
      ];
    }

    const variants = [
      `${labelsTextCapitalized} varieties are usually the best fit here, while slower types face more season risk.`,
      `${labelsTextCapitalized} varieties generally make the most sense here, since slower types leave very little room for delay.`,
      `The safest fit is usually ${labelsText}, while slower varieties carry more risk of running out of season.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "variety-fit-borderline") %
        variants.length
    ];
  }

  const variants = [
    `Only the earliest varieties are realistic candidates here in a typical year.`,
    `In most years, only the fastest varieties are realistic here.`,
    `This location usually favors only the earliest-maturing varieties in a typical year.`
  ];

  return variants[
    stableVariantIndex(city.key || city.name, crop.key, "variety-fit-poor") %
      variants.length
  ];
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
  if (
    confidence === "surplus" ||
    confidence === "strong" ||
    (Number.isFinite(gddMargin) && gddMargin >= 250)
  ) {
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
const cropSubject = getCropSubject(crop, { capitalize: true });
const cropNameLower = getCropSubject(crop);
  const plantingText = formatMmddForCopy(primaryPlantingDate);
  const fallText = formatMmddForCopy(fallFrost);
  const seasonTightness = getSeasonTightness({ confidence, gddMargin, frostFreeDays });
  const alreadyHaveHas = getVerb(crop) === "is" ? "already has" : "already have";
  const usuallyHaveHas = getVerb(crop) === "is" ? "usually has" : "usually have";
  const finishText = getVerb(crop) === "is" ? "it finishes" : "they finish";

if (seasonTightness === "comfortable") {
  const variants = [
    `In ${city.name}, ${cropNameLower} ${alreadyHaveHas} plenty of seasonal room${plantingText ? ` when planted around ${plantingText}` : ""}.`,
    `In ${city.name}, the local season usually gives ${cropNameLower} plenty of breathing room${plantingText ? ` when planting happens around ${plantingText}` : ""}.`,
    `In ${city.name}, ${crop.name.toLowerCase()} ${getVerb(crop) === "is" ? "usually has" : "usually have"} a solid seasonal margin${plantingText ? ` when planted around ${plantingText}` : ""}.`
  ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "micro-baseline-comfortable") %
        variants.length
    ];
  }

  if (seasonTightness === "moderate") {
    const variants = [
      `In ${city.name}, ${cropNameLower} ${usuallyHaveHas} enough season to work well, but site warmth still affects how comfortably ${finishText}${fallText ? ` before the usual fall frost around ${fallText}` : ""}.`,
      `In ${city.name}, the season is usually supportive for ${cropNameLower}, though warmer sites still help with how comfortably ${finishText}${fallText ? ` before fall frost around ${fallText}` : ""}.`,
      `${cropSubject} ${getVerb(crop)} usually workable in ${city.name}, but local site warmth still influences how much margin ${finishText}${fallText ? ` before the usual fall frost around ${fallText}` : ""}.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "micro-baseline-moderate") %
        variants.length
    ];
  }

  if (seasonTightness === "tight") {
    const variants = [
`In ${city.name}, the seasonal margin for ${cropNameLower} is tighter${fallText ? ` before the usual fall frost around ${fallText}` : ""}, so microclimate matters more than it does for easier crops.`,
      `In ${city.name}, the seasonal margin for ${cropNameLower} is tighter${fallText ? ` before the usual fall frost around ${fallText}` : ""}, which makes local site warmth more important than it is for easier crops.`,
      `${cropSubject} ${getVerb(crop) === "is" ? "is" : "are"} closer to the limits of the local season in ${city.name}${fallText ? ` before fall frost around ${fallText}` : ""}, so microclimate plays a bigger role here than it does for easier crops.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "micro-baseline-tight") %
        variants.length
    ];
  }

const variants = [
  `In ${city.name}, the local season usually leaves only a narrow margin for ${cropNameLower}, so microclimate is often part of the strategy rather than a bonus.`,
`In ${city.name}, the local season often leaves ${cropNameLower} close to practical limits, so warmer sites are usually part of the plan rather than just an advantage.`,
  `In ${city.name}, ${crop.name.toLowerCase()} often depends on squeezing the most out of local warmth, so microclimate is something gardeners rely on, not just something that helps.`
];

  return variants[
    stableVariantIndex(city.key || city.name, crop.key, "micro-baseline-edge") %
      variants.length
  ];
}

function buildMicroCropEffect({ crop, city, confidence, gddMargin }) {
  const comfortable =
    confidence === "strong" || (Number.isFinite(gddMargin) && gddMargin >= 250);
  const marginal =
    confidence === "borderline" ||
    confidence === "risky" ||
    (Number.isFinite(gddMargin) && gddMargin < 75);

  if (crop.key === "tomatoes") {
    if (comfortable) {
      const variants = [
        `For tomatoes, that usually changes earliness and ripening speed more than basic feasibility.`,
        `For tomatoes, the main effect is usually earlier ripening and more comfortable timing rather than a simple yes-or-no outcome.`,
        `For tomatoes, those warmer spots usually improve ripening pace more than they change basic viability.`
      ];

      return variants[
        stableVariantIndex(city.key || city.name, crop.key, "micro-effect-tomatoes-comfortable") %
          variants.length
      ];
    }

    if (marginal) {
      const variants = [
        `For tomatoes, that can decide whether fruit ripens fully before fall or stalls late in the season.`,
        `For tomatoes, that extra warmth can be the difference between a full ripe crop and fruit that lingers green too long.`,
        `For tomatoes, the warmest sites can determine whether ripening finishes properly before fall conditions close in.`
      ];

      return variants[
        stableVariantIndex(city.key || city.name, crop.key, "micro-effect-tomatoes-marginal") %
          variants.length
      ];
    }

    const variants = [
      `For tomatoes, warmer sites usually mean earlier flowering, steadier ripening, and less pressure on variety choice.`,
      `For tomatoes, the usual payoff is earlier flowering, smoother ripening, and a little more freedom in variety choice.`,
      `For tomatoes, warmer local sites often translate into earlier bloom, more reliable ripening, and less strain on the calendar.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "micro-effect-tomatoes-middle") %
        variants.length
    ];
  }

  if (crop.key === "peppers") {
    if (comfortable) {
      const variants = [
        `For peppers, the payoff is usually earlier sizing, better color, and more reliable finishing rather than simple yes-or-no success.`,
        `For peppers, warmer sites usually improve sizing, color development, and finishing quality more than they change basic viability.`,
        `For peppers, the main gain is usually better finishing and earlier color rather than a simple question of whether the crop works at all.`
      ];

      return variants[
        stableVariantIndex(city.key || city.name, crop.key, "micro-effect-peppers-comfortable") %
          variants.length
      ];
    }

    if (marginal) {
      const variants = [
        `For peppers, the warmest sites can make the difference between a partial crop and fruit that colors up well before fall.`,
        `For peppers, extra site warmth can separate underfinished fruit from a crop that colors properly before the season turns.`,
        `For peppers, the best local sites can be the difference between modest production and fruit that actually finishes well before fall.`
      ];

      return variants[
        stableVariantIndex(city.key || city.name, crop.key, "micro-effect-peppers-marginal") %
          variants.length
      ];
    }

    const variants = [
      `For peppers, extra warmth mostly shows up as earlier maturity and better finishing on the plant.`,
      `For peppers, warmer sites usually help most with earlier maturity and more complete finishing.`,
      `For peppers, the main benefit is usually faster maturity and fruit that finishes more reliably on the plant.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "micro-effect-peppers-middle") %
        variants.length
    ];
  }

  if (crop.key === "sweet-corn") {
    if (comfortable) {
      const variants = [
        `For sweet corn, warmer sheltered sites mainly speed establishment and make later classes more comfortable.`,
        `For sweet corn, the main benefit of warmer sheltered spots is quicker establishment and a little more room for later classes.`,
        `For sweet corn, those better sites usually help the stand establish faster and make longer-season classes feel more comfortable.`
      ];

      return variants[
        stableVariantIndex(city.key || city.name, crop.key, "micro-effect-corn-comfortable") %
          variants.length
      ];
    }

    if (marginal) {
      const variants = [
        `For sweet corn, warmer sites help the stand establish faster and improve the odds that ears finish on time.`,
        `For sweet corn, the warmest sites usually improve early establishment and raise the chance that ears mature on schedule.`,
        `For sweet corn, better site warmth helps the crop get moving sooner and improves the odds of timely ear maturity.`
      ];

      return variants[
        stableVariantIndex(city.key || city.name, crop.key, "micro-effect-corn-marginal") %
          variants.length
      ];
    }

    const variants = [
      `For sweet corn, site warmth mostly affects how quickly the crop gets established and how much margin later plantings retain.`,
      `For sweet corn, the main difference is usually in early establishment and in how much breathing room later plantings keep.`,
      `For sweet corn, warmer sites mostly influence startup speed and the amount of margin left for later sowings.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "micro-effect-corn-middle") %
        variants.length
    ];
  }

  if (crop.key === "beans") {
    if (marginal) {
      const variants = [
        `For beans, the biggest payoff is quicker early growth and a little more time to keep pods coming before fall conditions turn.`,
        `For beans, the main gain is faster early growth and a bit more time for pod production before the season fades.`,
        `For beans, warmer sites usually help most by speeding early growth and extending productive pod set a little longer into the season.`
      ];

      return variants[
        stableVariantIndex(city.key || city.name, crop.key, "micro-effect-beans-marginal") %
          variants.length
      ];
    }

    const variants = [
      `For beans, the biggest payoff is usually faster early growth and steadier production from warmer soil.`,
      `For beans, warmer sites usually help through quicker early growth and more even production.`,
      `For beans, the main benefit is often faster early growth followed by steadier pod production from warmer soil.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "micro-effect-beans-default") %
        variants.length
    ];
  }

const variants = [
  `For ${crop.name.toLowerCase()}, warmer local sites usually help the crop get established earlier and grow a little more steadily.`,
  `For ${crop.name.toLowerCase()}, the best local sites often help the crop get moving earlier and make timing a little more forgiving.`,
  `For ${crop.name.toLowerCase()}, warmer garden spots usually improve early growth and can make timing a little more forgiving.`
];

  return variants[
    stableVariantIndex(city.key || city.name, crop.key, "micro-effect-default") %
      variants.length
  ];
}

function buildBestStrategy({ crop, city, confidence, avoidThemes = [] }) {
  const idx =
    stableVariantIndex(city.key || city.name, crop.key, `best-strategy-${confidence}`) % 3;

  if (confidence === "surplus") {
    if (["spinach", "lettuce", "peas"].includes(crop.key)) {
      return pickThemedVariant({
        city,
        crop,
        salt: `best-strategy-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "quality-window",
            text: `Use the normal planting window, then focus on keeping the crop in its best quality window rather than worrying about whether it can finish.`
          },
          {
            theme: "bolt-tenderness",
            text: `Plant on time and manage for tenderness, bolt resistance, and harvest timing; season length is rarely the limiting factor here.`
          },
          {
            theme: "harvest-window",
            text: `Treat this as a quality-management crop here: the main strategy is catching the best eating window, not squeezing it to maturity.`
          }
        ]
      })?.text;
    }

    if (["kale", "swiss-chard", "broccoli", "cauliflower", "cabbage"].includes(crop.key)) {
      return pickThemedVariant({
        city,
        crop,
        salt: `best-strategy-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "avoid-growth-checks",
            text: `Use the normal planting window, avoid growth checks, and keep moisture and spacing consistent so the crop sizes evenly.`
          },
          {
            theme: "harvest-stage",
            text: `Plant on time, protect uninterrupted growth, and harvest at the stage you actually want rather than leaving quality in the field.`
          },
          {
            theme: "even-finish",
            text: `Take advantage of the margin by managing for even sizing and a clean finish, not by getting casual about timing.`
          }
        ]
      })?.text;
    }

    if (["carrots", "beets", "radishes", "turnips"].includes(crop.key)) {
      return pickThemedVariant({
        city,
        crop,
        salt: `best-strategy-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "spacing-moisture",
            text: `Sow in the normal window and manage for spacing, even moisture, and harvest size; the season usually gives you room to grow for quality, not just completion.`
          },
          {
            theme: "uniformity",
            text: `Use the normal sowing window, then focus on uniform growth and harvesting at the size and texture you want most.`
          },
          {
            theme: "root-quality",
            text: `The winning strategy here is not racing the calendar but producing straight, even roots with good sizing and consistent moisture.`
          }
        ]
      })?.text;
    }

    if (["onions", "garlic", "potatoes"].includes(crop.key)) {
      return pickThemedVariant({
        city,
        crop,
        salt: `best-strategy-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "steady-growth",
            text: `Plant in the normal window and use the extra margin to focus on steady growth, plant health, and finishing cleanly.`
          },
          {
            theme: "uniformity-finish",
            text: `The local advantage here is flexibility: stay near the normal timing, then manage for sizing, uniformity, and a good finish.`
          },
          {
            theme: "quality-consistency",
            text: `Treat maturity as dependable and put your attention on crop quality, consistency, and harvesting in the condition you want.`
          }
        ]
      })?.text;
    }

    if (["zucchini", "cucumbers", "beans"].includes(crop.key)) {
      return pickThemedVariant({
        city,
        crop,
        salt: `best-strategy-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "harvest-rhythm",
            text: `Plant in the normal window and use the season margin to build healthy plants and a steady picking rhythm.`
          },
          {
            theme: "early-vigor",
            text: `The best results usually come from strong early vigor, good spacing, and regular harvests rather than from pushing for enough season.`
          },
          {
            theme: "production-management",
            text: `Here the strategy is to turn a safe seasonal fit into better production: establish well, keep plants growing, and harvest consistently.`
          }
        ]
      })?.text;
    }

    if (["tomatoes", "peppers"].includes(crop.key)) {
      return pickThemedVariant({
        city,
        crop,
        salt: `best-strategy-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "variety-flexibility",
            text: `Plant on time and use the seasonal cushion to choose for flavor, finish, and ripening pattern rather than just earliness.`
          },
          {
            theme: "ripening-goals",
            text: `The local edge here is choice: you usually have room to think beyond survival and manage for ripening pace, fruit quality, and the kind of crop you want.`
          },
          {
            theme: "site-variety-match",
            text: `Treat this as a crop with real strategic flexibility here; the best results come from matching variety, site warmth, and harvest goals rather than simply chasing maturity.`
          }
        ]
      })?.text;
    }

    return pickThemedVariant({
      city,
      crop,
      salt: `best-strategy-${confidence}`,
      avoidThemes,
      options: [
        {
          theme: "quality-management",
          text: `Use the normal planting window and take advantage of the margin to focus on crop quality, consistency, and harvest timing.`
        },
        {
          theme: "goal-oriented",
          text: `Plant on time, then manage for the result you want rather than worrying about whether the crop can finish.`
        },
        {
          theme: "flexibility",
          text: `The best local strategy is to treat season length as supportive and use that flexibility to grow for quality, not just maturity.`
        }
      ]
    })?.text;
  }

  if (confidence === "strong") {
    if (crop.plantingMethod === "transplant" || crop.transplantRecommended) {
      return [
        `Plant on time, choose the varieties you actually want, and focus on steady growth after transplanting.`,
        `Use the normal transplant window and prioritize healthy early growth, spacing, and even moisture.`,
        `Treat the season as supportive, then focus on consistency and crop quality more than simple maturity insurance.`
      ][idx];
    }

    return [
      `Plant on time and focus on steady growth, spacing, and harvest timing.`,
      `Use the normal planting window and manage for consistency rather than trying to squeeze extra season.`,
      `Treat maturity as dependable here and focus more on variety choice and crop quality.`
    ][idx];
  }

  if (confidence === "good") {
    if (crop.plantingMethod === "transplant" || crop.transplantRecommended) {
      return [
        `Plant on time, use reliable varieties, and protect early growth so the crop keeps its margin.`,
        `Stay close to the normal transplant window and avoid giving up time early in the season.`,
        `Use dependable varieties and focus on a timely start, steady growth, and good spacing.`
      ][idx];
    }

    return [
      `Sow on time, use reliable varieties, and protect early momentum.`,
      `Stay close to the normal planting window and avoid slower choices that eat into the margin.`,
      `Use the normal sowing window and focus on steady growth so the crop keeps its seasonal buffer.`
    ][idx];
  }

  if (confidence === "borderline") {
    if (crop.plantingMethod === "transplant" || crop.transplantRecommended) {
      return [
        `Start early, plant on time, and lean toward faster varieties in the warmest spots you have.`,
        `Use the earliest practical timing, favor quicker varieties, and avoid cooler exposed sites.`,
        `Protect as much early momentum as possible and pair the crop with warm placement and realistic variety choice.`
      ][idx];
    }

    return [
      `Sow as early as conditions safely allow and lean toward faster-maturing varieties.`,
      `Protect the margin by planting promptly, using earlier varieties, and favoring warmer spots.`,
      `Treat timing and variety speed as part of the strategy, not as optional refinements.`
    ][idx];
  }

  if (confidence === "risky") {
    if (crop.plantingMethod === "transplant" || crop.transplantRecommended) {
      return [
        `Use the earliest practical starts, the fastest varieties, and the warmest protected sites available.`,
        `Stack the odds with transplants, very early varieties, and the most favorable microclimate you have.`,
        `Treat this as a higher-risk crop and rely on earliness, warmth, and protection wherever possible.`
      ][idx];
    }

    return [
      `Plant as early as conditions safely allow and use the fastest varieties you can find.`,
      `Treat this crop as a risk-managed project: early timing, warm placement, and quick varieties all matter.`,
      `Use the warmest sites available and avoid giving up any season to delays or slower variety choice.`
    ][idx];
  }

  return null;
}

function buildDecisionSentence({ crop, city, confidence, fittingVarietyLabels, fittingVarietyClasses, gddMargin }) {
  const cropSubject = getCropSubject(crop, { capitalize: true });
  const cropNameLower = getCropSubject(crop);
  const varietyText =
    formatVarietyLabelsForProse(fittingVarietyClasses) ||
    formatList(fittingVarietyLabels)?.toLowerCase();
    
  if (confidence === "surplus") {
    return `Most gardeners in ${city.name} can treat ${cropNameLower} as an easy climate fit; the main decisions are usually planting timing, quality, and harvest goals rather than whether the crop can mature at all.`;
  }

  if (confidence === "strong") {
    return `Most gardeners in ${city.name} can approach ${cropNameLower} as a dependable crop; the main decision is usually how much variety range they want rather than whether it can work at all.`;
  }

  if (confidence === "good") {
    return `${cropSubject} ${getVerb(crop)} a practical choice in ${city.name}, especially when gardeners stay close to planting windows${varietyText ? ` and lean toward ${varietyText.toLowerCase()} varieties` : ""}.`;
  }

  if (confidence === "borderline") {
    return `${cropSubject} ${getVerb(crop)} possible in ${city.name}, but it makes more sense to treat early maturity and warm placement as part of the plan rather than pushing the longest-season types.`;
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
  const cropSubject = getCropSubject(crop, { capitalize: true });
  const profile = getBehaviorProfile(crop);
  const variant =
    stableVariantIndex(city.key || city.name, crop.key, `local-interpretation-${confidence}`) % 3;

  const cropLower = crop.name.toLowerCase();

if (regionalComparisonSentence && confidence !== "strong" && confidence !== "surplus") {
  return regionalComparisonSentence;
}

if (confidence === "surplus") {
  if (profile === "cool-season-quality") {
    return [
      `Even here, the climate does not protect ${cropLower} from bolting or quality loss once conditions warm. The real advantage is having more room to target the best eating window.`,
`What the extra seasonal room changes for ${cropLower} is not whether the crop can finish, but how precisely gardeners can aim for tenderness, slower bolting, and better harvest quality.`,
      `The easiest mistake with ${cropLower} here is assuming a comfortable fit guarantees top quality. The better use of the margin is timing the crop for its best texture and flavor.`
    ][variant];
  }

  if (profile === "cool-season-structural") {
    return [
      `Even in an easier climate, this crop still pays back uninterrupted growth. The season helps with maturity, but it does not erase the effects of checks that reduce sizing or finish quality.`,
      `What the local margin changes most is that gardeners can hold out for a better-sized, better-finished crop instead of cutting early just to stay on schedule.`,
      `The climate usually makes this crop possible without strain, but the difference between an average result and a strong one still comes from steady growth and harvesting at the right stage.`
    ][variant];
  }

if (profile === "fast-root") {
  return [
    `Even with plenty of seasonal room, this crop still rewards uniform growth. The climate helps with timing, but spacing and moisture still decide how even the roots turn out.`,
    `What the easier season buys gardeners here is freedom to choose harvest size instead of pulling early out of necessity, but root shape and texture still depend on steady growth.`,
    `The climate rarely limits this crop here. What still matters is avoiding uneven growth that leads to rough shape, variable sizing, or roots that miss their best texture.`
  ][variant];
}

if (profile === "storage-root") {
  return [
    `Even here, the climate does not guarantee an even finish. The better results still come from steady growth, consistent sizing, and harvesting when the crop is actually ready.`,
    `What the easier season changes most is that gardeners can grow for a more even finish instead of settling for whatever matures first.`,
    `The local margin usually makes this crop comfortable to finish, but uniformity, finish quality, and harvest judgment still separate average results from strong ones.`
  ][variant];
}

  if (profile === "warm-season-fruiting") {
    return [
`The local season usually gives this crop enough time to finish, but warmer sites still improve ripening speed and overall finish quality.`,
      `What the easier climate changes is that gardeners can choose more deliberately for flavor, finish, or ripening style instead of selecting only for survival.`,
      `Even with a comfortable margin, this crop still gets better when site warmth is used to improve ripening pace and finish quality rather than merely protect maturity.`
    ][variant];
  }

  return [
    `The local season usually makes this crop easy enough to finish, so the more useful question is what separates an acceptable result from a really good one.`,
    `What the extra room changes here is not whether the crop can make it, but how much control gardeners have over finish quality and harvest timing.`,
    `Even in a supportive climate, the season only solves the timing side of the problem. The rest still comes down to how the crop is managed.`
  ][variant];
}

if (confidence === "strong") {
  if (profile === "cool-season-quality") {
    return [
      `This crop usually has enough room to work well here, but the climate still does not protect it from missing its best quality window.`,
      `The local advantage is real, though the better results still come from using that margin to target tenderness, slower bolting, and a cleaner harvest window.`,
      `Even as a dependable crop here, ${cropLower} still rewards gardeners who use the season for better quality, not just for a successful finish.`
    ][variant];
  }

  if (profile === "cool-season-structural") {
    return [
      `The season is usually supportive here, but it still pays to protect uninterrupted growth because the climate does not erase setbacks that affect sizing and finish.`,
      `What stronger local margin really changes is that gardeners can wait for a better-finished crop instead of harvesting defensively.`,
      `This crop is usually dependable here, though the difference between decent and excellent results still comes from steady growth and harvest stage.`
    ][variant];
  }

  if (profile === "fast-root") {
    return [
      `The climate usually gives this crop enough room, but root quality still depends much more on uniform growth than on the margin itself.`,
      `What a stronger fit changes here is that growers can aim for better size and texture instead of pulling early to stay ahead of the season.`,
      `Even as a dependable crop here, this one still rewards spacing, moisture consistency, and good harvest judgment more than it rewards climate luck.`
    ][variant];
  }

  if (profile === "storage-root") {
    return [
      `The extra room here is most valuable when gardeners use it to improve finish quality and uniform sizing rather than merely count on maturity.`,
      `This crop usually has enough season to finish well here, which means the stronger results come from managing for uniformity, finish, and holding quality.`,
      `The climate is supportive here, but the season still does not substitute for the work that goes into producing a cleaner, more even finish.`
    ][variant];
  }

  if (profile === "warm-season-fruiting") {
    return [
      `This crop is usually workable here, though warmer sites still do more than add comfort: they improve ripening pace and help the crop finish more completely.`,
`The local cushion means gardeners can think beyond minimum earliness, but site warmth still shapes ripening quality by season’s end.`,
      `Even as a stronger fit here, this crop still improves when warmth is used to turn workable ripening into a better finish.`
    ][variant];
  }

  return [
    `The season is usually supportive here, but the more useful question is still what turns a safe crop into a notably better one.`,
    `A stronger fit here gives gardeners more control over finish and timing, but it does not remove the value of careful management.`,
    `This crop usually works well here, though the climate mainly buys flexibility; the finish still depends on how that flexibility is used.`
  ][variant];
}

  if (confidence === "good") {
    if (profile === "cool-season-quality") {
      return [
        `${cropSubject} can work well here, but the margin is not so wide that timing stops mattering. Planting windows still do much of the work.`,
        `${inPracticeCrop(crop)}, gardeners usually do best when they use the season efficiently instead of assuming quality will hold indefinitely.`,
        `The local season is workable for ${cropLower}, though this is still a crop that rewards timely planting more than casual delay.`
      ][variant];
    }

    if (profile === "cool-season-structural") {
      return [
        `${cropSubject} is workable here, though the crop benefits from using the season efficiently rather than assuming there is margin to waste.`,
        `${inPracticeCrop(crop)}, most growers have enough room for success, but not so much that timing stops mattering.`,
        `The local season can support ${cropLower}, though steady growth and timely planting still do a lot of the work.`
      ][variant];
    }

    if (profile === "fast-root") {
      return [
        `${cropSubject} is workable here, though better timing and steady growth still matter if gardeners want the cleanest roots and most even sizing.`,
        `${inPracticeCrop(crop)}, the season generally works, but the margin is not so wide that it disappears as a factor.`,
        `The local season is usually enough for ${cropLower}, though growers still get better results when they stay close to normal planting windows.`
      ][variant];
    }

    if (profile === "storage-root") {
      return [
        `${cropSubject} is usually workable here, though gardeners still do best when they protect the season margin with timely planting.`,
        `${inPracticeCrop(crop)}, this is less of an edge crop and more of a crop that rewards not giving away time early.`,
        `The season can support ${cropLower}, though it is not so generous that growers can ignore timing.`
      ][variant];
    }

    if (profile === "warm-season-fruiting") {
      return [
        `${cropSubject} is workable here, though the crop still benefits from warm placement and realistic variety choice if growers want a more comfortable finish.`,
        `${inPracticeCrop(crop)}, the season can support success, but not so easily that site warmth and timing stop mattering.`,
        `The local season is usually enough for ${cropLower}, though this is still a crop that rewards gardeners who protect every bit of margin they have.`
      ][variant];
    }

    return [
      `${cropSubject} is workable here, though the crop still rewards using the local season efficiently rather than assuming there is margin to spare.`,
      `${inPracticeCrop(crop)}, the season can support good results, but timing and variety choice still do a lot of the work.`,
      `This crop usually works here, though gardeners do best when they stay reasonably close to normal planting timing.`
    ][variant];
  }

  if (confidence === "borderline") {
    if (profile === "cool-season-quality") {
      return [
`The seasonal margin for ${crop.name.toLowerCase()} is tighter here, so careful timing and cooler local conditions matter more than they do for easier crops.`,
        `${inPracticeCrop(crop)}, there is usually less room to recover from delay. The crop can work, but it is easier to lose quality or maturity margin.`,
        `The challenge with ${cropLower} here is that the season is usable, but not generous. Timing and local conditions shape the result much more than usual.`
      ][variant];
    }

    if (profile === "cool-season-structural") {
      return [
        `${cropSubject} is more exposed to planting delay and cooler placement here than it would be in a longer season.`,
        `${inPracticeCrop(crop)}, growers usually need to protect the margin with good timing and warmer local spots.`,
        `This is a crop where the local season can work, but there is not much extra room if conditions or timing slip.`
      ][variant];
    }

    if (profile === "fast-root") {
      return [
        `${cropSubject} can work here, but the local margin is narrower than it looks if growers give up time or use cooler sites.`,
        `${inPracticeCrop(crop)}, this becomes more of a timing and placement crop than it would be in a longer season.`,
        `The season can support ${cropLower}, though it does not leave much room for delay or slow growth.`
      ][variant];
    }

    if (profile === "storage-root") {
      return [
`The seasonal margin is tighter here, so gardeners usually need to use the season efficiently and favor better local spots.`,
        `${inPracticeCrop(crop)}, there is enough local season for possible success, but not enough to get casual about timing or slower finishes.`,
        `This is a crop where the local season can work, though it leaves limited room for delayed starts or weaker placement.`
      ][variant];
    }

    if (profile === "warm-season-fruiting") {
      return [
        `${cropSubject} is possible here, but the crop usually needs warmth, timely planting, and realistic variety speed to stay comfortable.`,
        `${inPracticeCrop(crop)}, the season can support success, though it leaves limited room for cool sites, slower ripening, or lost early momentum.`,
        `This is the kind of crop that can work locally, but it asks gardeners to protect warmth and timing much more carefully than easier choices do.`
      ][variant];
    }

    return [
      `${cropSubject} can work here, but the local season does not leave much room for delays or slower choices.`,
      `${inPracticeCrop(crop)}, timing and local site warmth matter more here than they do for easier crops.`,
      `The local season can support ${cropLower}, though it is not generous enough to forgive much drift from the plan.`
    ][variant];
  }

  if (confidence === "risky") {
    if (profile === "cool-season-quality") {
      return [
        `${cropSubject} is one of the crops most exposed to local timing and quality risk here. Even small delays can leave the crop chasing a season that does not stay favorable for long.`,
        `${inPracticeCrop(crop)}, the crop is difficult not just because of maturity, but because local warmth can narrow the quality window quickly.`,
        `With ${cropLower} here, gardeners usually need to stack timing, placement, and variety choice carefully because the local margin is narrow from the start.`
      ][variant];
    }

    if (profile === "cool-season-structural") {
      return [
`${cropSubject} is difficult here because the local season leaves limited room for delay, slower growth, or cooler sites.`,
        `${inPracticeCrop(crop)}, even modest setbacks can turn a possible crop into a weak finish because the margin starts tight.`,
        `The challenge with ${cropLower} here is not just whether it can mature, but whether local conditions give it enough uninterrupted time to finish well.`
      ][variant];
    }

    if (profile === "fast-root") {
      return [
        `${cropSubject} is a riskier crop here because the local season does not leave much room for delays or weaker sites.`,
        `${inPracticeCrop(crop)}, gardeners usually need to keep timing tight because the crop does not have much extra season to waste.`,
        `This crop presses closer to the local seasonal edge, so even smaller setbacks matter more than they do for easier roots.`
      ][variant];
    }

    if (profile === "storage-root") {
      return [
        `${cropSubject} is difficult here because the local season is often too short for a comfortable finish, especially if planting is delayed.`,
        `${inPracticeCrop(crop)}, growers usually need a very good start and favorable site conditions to have a realistic shot at a good finish.`,
        `The main challenge with ${cropLower} here is that the local season does not reliably leave enough room for the kind of finish gardeners usually want.`
      ][variant];
    }

    if (profile === "warm-season-fruiting") {
      return [
`${cropSubject} ${getVerb(crop)} difficult here because the crop is asking for more reliable warmth and finish time than the local season usually provides.`,
        `${inPracticeCrop(crop)}, gardeners typically need speed, warmth, and favorable placement all working together to have a realistic chance at success.`,
        `The real challenge with ${cropLower} here is not just setting fruit, but getting the crop to ripen and finish well before conditions turn against it.`
      ][variant];
    }

    return [
      `${cropSubject} is challenging here because the local season leaves little room for delay, slower varieties, or cooler sites.`,
      `${inPracticeCrop(crop)}, growers usually need to stack timing, variety speed, and local warmth to have a realistic chance at success.`,
      `This crop sits close to the local seasonal edge, so smaller setbacks matter more here than they would in easier climates.`
    ][variant];
  }

  if (Number.isFinite(frostFreeDays) && frostFreeDays <= 115) {
    return `The shorter frost-free period means ${cropLower} ${getRespondVerb(crop)} strongly to early momentum and warm placement.`;
  }

  if (Number.isFinite(gddMargin) && gddMargin < 75) {
    return `Warm placement is less about optimization and more about protecting a crop that already has a fairly tight margin.`;
  }

  return `${cropSubject} ${getRespondVerb(crop)} most to getting the fundamentals right: planting on time, using a warm site, and choosing varieties that match the local season.`;
}

function buildAdvisoryCopy({
  city,
  crop,
  confidence,
  fittingVarietyLabels,
  fittingVarietyClasses,
  gddMargin,
  frostFreeDays,
  primaryPlantingDate,
  fallFrost,
  regionalComparisonSentence
}) {
  if (!city || !crop) return null;
const cropSubject = getCropSubject(crop, { capitalize: true });
  const varietyText =
    formatVarietyLabelsForProse(fittingVarietyClasses) ||
    formatList(fittingVarietyLabels)?.toLowerCase();
  const profile = getClimateProfile(city);

  let succeed = "";

if (confidence === "surplus") {
  const idx = stableVariantIndex(city.key || city.name, crop.key, "surplus-succeed") % 3;
  const behaviorProfile = getBehaviorProfile(crop);

  if (behaviorProfile === "cool-season-quality") {
    succeed = [
      `${cropEasyToGrow(crop, city)}, and the real advantage is having room to aim for tenderness, slower bolting, and a longer harvest window rather than just getting the crop to maturity.`,
      `${cropSubject} usually ${getPerformVerb(crop)} well in ${city.name}. The season is generous enough that gardeners can plant for eating quality and harvest style, not just basic success.`,
      `${cropSubject} usually ${getPerformVerb(crop)} easily with normal timing in ${city.name}. What matters most is how planting date shapes tenderness, bolt resistance, and the kind of harvest you want.`
    ][idx];
  } else if (behaviorProfile === "cool-season-structural") {
    succeed = [
      `${cropInSeason(crop, city)}, and the real payoff is having enough room to size the crop properly and harvest at the stage you actually want.`,
      `${cropSubject} ${getVerb(crop)} usually an easy seasonal fit in ${city.name}. The more useful question is how to turn that margin into better sizing, steadier growth, and a cleaner finish.`,
      `${cropSubject} usually ${getPerformVerb(crop)} comfortably in ${city.name}. Gardeners get the most from this climate when they use the margin to improve finish quality rather than merely count on maturity.`
    ][idx];
  } else if (behaviorProfile === "fast-root") {
    succeed = [
      `${cropEasyToGrow(crop, city)}, and the climate usually gives gardeners room to choose harvest size and grow for better texture instead of pulling roots early out of necessity.`,
      `${cropSubject} ${getVerb(crop)} usually an easy fit in ${city.name}. The bigger difference comes from spacing, moisture consistency, and how evenly the roots size up.`,
      `${cropSubject} usually ${getPerformVerb(crop)} comfortably in ${city.name}. The season usually does its part, so the real gains come from root quality, uniformity, and harvest judgment.`
    ][idx];
  } else if (behaviorProfile === "storage-root") {
    succeed = [
      `${cropEasyToGrow(crop, city)}, and the extra room is most useful for getting a more even finish, steadier sizing, and better keeping quality.`,
      `${cropSubject} ${getVerb(crop)} usually a comfortable fit in ${city.name}. Gardeners usually get the best results when they use that margin to improve finish quality and uniformity.`,
      `${cropSubject} usually ${getPerformVerb(crop)} well in ${city.name}. The local advantage is not just that the crop can finish, but that growers can aim for a cleaner, more complete finish.`
    ][idx];
  } else if (behaviorProfile === "warm-season-fruiting") {
    succeed = [
      `${cropSubject} ${getVerb(crop)} usually one of the easier warm-season crops to finish in ${city.name}. The real advantage is having enough room to choose more deliberately for flavor, finish, and ripening style.`,
`${cropSubject} usually ${getPerformVerb(crop)} well in ${city.name}. The season is comfortable enough that gardeners can think beyond minimum earliness and manage for a better finish.`,
      `${cropSubject} ${getVerb(crop)} usually a strong warm-season fit in ${city.name}. What matters most is how gardeners use that cushion to improve ripening pace, fruit quality, and variety ambition.`
    ][idx];
  } else {
    succeed = [
      `${cropSubject} ${getVerb(crop)} usually very workable in ${city.name}. The extra room is most useful when gardeners use it to aim for a better finish rather than simply relying on the crop to mature.`,
      `${cropSubject} usually ${getPerformVerb(crop)} comfortably in ${city.name}. The better question here is what turns an acceptable crop into a notably better one.`,
      `${cropSubject} ${getVerb(crop)} usually an easy fit in ${city.name}. The season usually solves the timing side of the problem, leaving gardeners room to optimize for finish and quality.`
    ][idx];
  }
  } else if (confidence === "strong") {
    const idx = stableVariantIndex(city.key || city.name, crop.key, "strong-succeed") % 5;

const strongVariants = [
  `${cropSubject} usually ${getPerformVerb(crop)} reliably when planted on time in ${city.name}. Gardeners generally have enough room to choose varieties for preference, not just for speed.`,
  `${cropDependable(crop, city)}. The season is supportive enough that gardeners usually have options instead of feeling pushed into only the quickest path.`,
  `${cropDependable(crop, city)}. Normal timing and realistic variety choice are usually enough to produce dependable results.`,
`${cropSubject} usually ${getPerformVerb(crop)} well in ${city.name}. The practical advantage is that gardeners have some flexibility in timing and variety choice.`,
`${cropSubject} ${getVerb(crop)} usually a strong local fit in ${city.name}. Most gardeners have some room to work with it here rather than feeling pressed against the calendar.`
];

    succeed = strongVariants[idx];
  } else if (confidence === "good") {
    const goodVariants = [
      `${cropSubject} ${getVerb(crop)} usually workable in ${city.name} with normal timing and reasonable variety choice. This is a good fit, but it still rewards gardeners who stay close to the local season.`,
      `${cropSubject} ${getVerb(crop)} generally practical in ${city.name}, especially when gardeners plant on time${varietyText ? ` and stay close to ${varietyText.toLowerCase()} varieties` : ""}.`,
      `${cropSubject} ${getVerb(crop)} usually a solid option in ${city.name}, but this is still a crop where delays or slower varieties can narrow the margin noticeably.`
    ];

    succeed =
      goodVariants[
        stableVariantIndex(city.key || city.name, crop.key, "good-succeed") %
          goodVariants.length
      ];
  } else if (confidence === "borderline") {
    const borderlineVariants = [
      `${cropSubject} can still succeed in ${city.name}, but the crop usually needs better-than-average planning around timing, variety speed, and site warmth.`,
      `${cropSubject} ${getVerb(crop)} possible in ${city.name}, though this is the kind of crop where the margin is narrow enough that small choices start to matter a lot.`,
      `Gardeners can still grow ${crop.name.toLowerCase()} in ${city.name}, but success usually depends on treating earliness and warm placement as part of the plan rather than as nice bonuses.`
    ];

    succeed =
      borderlineVariants[
        stableVariantIndex(city.key || city.name, crop.key, "borderline-succeed") %
          borderlineVariants.length
      ];
  } else {
    const riskyVariants = [
      `${cropSubject} ${getVerb(crop)} challenging in ${city.name}. Gardeners who succeed usually stack the odds with the fastest varieties, the best timing, and the warmest sites they have.`,
      `${cropSubject} ${getVerb(crop)} usually a higher-risk crop in ${city.name}. Success tends to come from careful variety choice and the most favorable microclimates available.`,
      `In ${city.name}, ${crop.name.toLowerCase()} usually needs active risk management rather than ordinary planting. Gardeners normally need speed, warmth, and a bit of luck all working together.`
    ];

    succeed =
      riskyVariants[
        stableVariantIndex(city.key || city.name, crop.key, "risky-succeed") %
          riskyVariants.length
      ];
  }

  let fail = "";

  if (confidence === "surplus") {
    const surplusFailVariants = [
      `Setbacks here usually come from practical decisions rather than from season length: planting later than ideal, uneven growth, poor moisture management, or harvesting outside the best eating window.`,
`When this crop disappoints in ${city.name}, the issue is usually management rather than climate fit. Timing, consistency, and harvest decisions matter more than season length.`,
      `The most common problems here are not climatic ones. Gardeners usually lose ground through timing, uneven growth, or letting the crop move past its best stage.`
    ];

    fail =
      surplusFailVariants[
        stableVariantIndex(city.key || city.name, crop.key, "surplus-fail") %
          surplusFailVariants.length
      ];
  } else if (confidence === "strong") {
    const strongFailVariants = [
      `Problems here usually come from giving up part of the season through late planting, weak early growth, or slower variety choice than the crop really needs.`,
      `When this crop underperforms in ${city.name}, the culprit is usually timing or variety choice rather than the climate itself.`,
      `The most common setbacks here are practical: planting too late, losing momentum early, or choosing varieties that ask for more season than necessary.`
    ];

    fail =
      strongFailVariants[
        stableVariantIndex(city.key || city.name, crop.key, "strong-fail") %
          strongFailVariants.length
      ];
  } else if (confidence === "good") {
    fail = `The usual trouble comes from delayed planting or from choosing slower varieties when the local season would reward simpler, faster choices.`;
  } else if (confidence === "borderline") {
    fail = `The most common problem is running short on season. Late planting, slower varieties, and cooler exposed sites can turn a possible crop into a disappointing one.`;
  } else {
    fail = `The crop usually falls short here because the season runs out before it finishes well. Late planting, cool nights, and slower varieties make that problem much worse.`;
  }

  const siteSentenceVariants = [
    `The warmest garden spots are usually ${profile.warmestSites}. Cooler spots like ${profile.coolestSites} tend to warm up later and usually provide less heat.`,
    `In practical terms, the best spots are usually ${profile.warmestSites}. Cooler spots like ${profile.coolestSites} are more likely to stay cooler and be less forgiving.`,
    `For a better local margin, gardeners usually do best in ${profile.warmestSites}. Cooler spots like ${profile.coolestSites} often make timing tighter.`
  ];

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
    siteSentenceVariants[
      stableVariantIndex(city.key || city.name, crop.key, "micro-sites-wrapper") %
        siteSentenceVariants.length
    ],
    buildMicroCropEffect({ crop, city, confidence, gddMargin })
  ];

if (confidence !== "strong") {
  microParts.splice(1, 0, `${profile.baseline.charAt(0).toUpperCase() + profile.baseline.slice(1)}.`);
}

  const micro = microParts.filter(Boolean).join(" ");

  const decision = buildDecisionSentence({
    crop,
    city,
    confidence,
    fittingVarietyLabels,
    fittingVarietyClasses,
    gddMargin
  });

const ledeThemeMap = {
  surplus: {
    "cool-season-quality": ["easy-fit", "timing-matters-most", "plenty-of-time"],
    "cool-season-structural": ["easy-fit", "well-within-season", "room-to-aim"],
    "fast-root": ["quality-over-maturity", "root-quality", "size-and-harvest"],
    "storage-root": ["comfortable-fit", "finish-well", "harvest-goals"],
    default: ["easy-fit", "well-within-season", "result-oriented"]
  }
};

const localThemeMap = {
  surplus: {
    "cool-season-quality": ["quality-window", "warmup-pressure", "cool-conditions"],
    "cool-season-structural": ["window-flexibility", "finish-quality", "timing-variety-freedom"],
    "fast-root": ["root-quality", "even-growth", "size-and-timing"],
    "storage-root": ["consistency-and-sizing", "finish-well", "finish-goals"],
    default: ["maturity-easy", "comfortable-margin", "harvest-goals"]
  }
};

const bestStrategyThemeMap = {
  surplus: {
    leafy: ["quality-window", "bolt-tenderness", "harvest-window"],
    brassica: ["avoid-growth-checks", "harvest-stage", "even-finish"],
    roots: ["spacing-moisture", "uniformity", "root-quality"],
    storage: ["steady-growth", "uniformity-finish", "quality-consistency"],
    summer: ["harvest-rhythm", "early-vigor", "production-management"],
    warm_fruit: ["variety-flexibility", "ripening-goals", "site-variety-match"],
    default: ["quality-management", "goal-oriented", "flexibility"]
  }
};

function getSurplusLedeThemes(profile) {
  return ledeThemeMap.surplus[profile] || ledeThemeMap.surplus.default;
}

function getSurplusLocalThemes(profile) {
  return localThemeMap.surplus[profile] || localThemeMap.surplus.default;
}

function getSurplusStrategyThemes(cropKey) {
  if (["spinach", "lettuce", "peas"].includes(cropKey)) return bestStrategyThemeMap.surplus.leafy;
  if (["kale", "swiss-chard", "broccoli", "cauliflower", "cabbage"].includes(cropKey)) return bestStrategyThemeMap.surplus.brassica;
  if (["carrots", "beets", "radishes", "turnips"].includes(cropKey)) return bestStrategyThemeMap.surplus.roots;
  if (["onions", "garlic", "potatoes"].includes(cropKey)) return bestStrategyThemeMap.surplus.storage;
  if (["zucchini", "cucumbers", "beans"].includes(cropKey)) return bestStrategyThemeMap.surplus.summer;
  if (["tomatoes", "peppers"].includes(cropKey)) return bestStrategyThemeMap.surplus.warm_fruit;
  return bestStrategyThemeMap.surplus.default;
}

const profileKey = getBehaviorProfile(crop);
const ledeThemesToAvoid =
  confidence === "surplus" ? getSurplusLedeThemes(profileKey) : [];

const localInterpretation = buildLocalInterpretation({
  crop,
  city,
  confidence,
  gddMargin,
  regionalComparisonSentence,
  frostFreeDays,
  avoidThemes: ledeThemesToAvoid
});

const localThemesToAvoid =
  confidence === "surplus" ? getSurplusLocalThemes(profileKey) : [];

const bestStrategy = buildBestStrategy({
  crop,
  city,
  confidence,
  avoidThemes:
    confidence === "surplus"
      ? mergeAvoidThemes(ledeThemesToAvoid, localThemesToAvoid, getSurplusStrategyThemes(crop.key))
      : []
});

return {
    heading: `What Local Garden Sites Change for ${crop.name}`,
    succeed,
    fail,
    micro,
    decision,
    localInterpretation,
    bestStrategy
  };
}

function buildLede({
  crop,
  city,
  confidence,
  fittingVarietyLabels,
  fittingVarietyClasses,
  avoidThemes = []
}) {
  const labelsText =
    formatVarietyLabelsForProse(fittingVarietyClasses) ||
    formatList(fittingVarietyLabels)?.toLowerCase();

  const cropSubject = getCropSubject(crop, { capitalize: true });
  const cropNameLower = getCropSubject(crop);
  const verb = getVerb(crop);
  const idx =
    stableVariantIndex(city.key || city.name, crop.key, `lede-${confidence}`) % 3;

  const profile = getBehaviorProfile(crop);

  if (confidence === "surplus") {
    if (profile === "cool-season-quality") {
      return pickThemedVariant({
        city,
        crop,
        salt: `lede-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "easy-fit",
            text: `${cropSubject} ${verb} one of the easiest crops to fit into the season in ${city.name}. The real decisions are about timing the crop for tenderness and harvest quality, not whether it can mature.`
          },
          {
            theme: "timing-matters-most",
            text: `${cropSubject} ${verb} usually an easy seasonal fit in ${city.name}. What matters most is planting at the right time for the kind of harvest you want.`
          },
          {
            theme: "plenty-of-time",
text: `${cropSubject} ${verb} usually very easy to grow in ${city.name}. The crop typically has plenty of time, so timing and eating quality matter more than whether the crop can finish.`
          }
        ]
      })?.text;
    }

    if (profile === "cool-season-structural") {
      return pickThemedVariant({
        city,
        crop,
        salt: `lede-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "easy-fit",
            text: `${cropSubject} ${verb} usually an easy fit in ${city.name}. The season is generally not the hard part, so gardeners can focus more on quality, consistency, and harvest timing.`
          },
          {
            theme: "well-within-season",
            text: `${cropSubject} ${verb} usually well within the local season in ${city.name}. The practical questions are more about crop quality and harvest goals than about racing to maturity.`
          },
          {
            theme: "room-to-aim",
            text: `${cropSubject} ${verb} usually straightforward to fit into the season in ${city.name}. Gardeners typically get more value from steady growth and timing than from worrying about whether the crop will finish.`
          }
        ]
      })?.text;
    }

    if (profile === "fast-root") {
      return pickThemedVariant({
        city,
        crop,
        salt: `lede-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "quality-over-maturity",
            text: `${cropSubject} ${verb} usually an easy crop to fit into the season in ${city.name}. The more useful decisions are about spacing, sizing, and harvest timing rather than whether the crop can mature.`
          },
          {
            theme: "root-quality",
            text: `${cropSubject} ${verb} usually a very easy seasonal fit in ${city.name}. Gardeners usually get more value from managing for root quality than from worrying about season length.`
          },
          {
            theme: "size-and-harvest",
            text: `${cropSubject} ${verb} usually easy to grow in ${city.name}. The crop typically has enough time, so the real decisions are about quality, size, and when to harvest.`
          }
        ]
      })?.text;
    }

    if (profile === "storage-root") {
      return pickThemedVariant({
        city,
        crop,
        salt: `lede-${confidence}`,
        avoidThemes,
        options: [
          {
            theme: "comfortable-fit",
            text: `${cropSubject} ${verb} usually a comfortable fit in ${city.name}. The season is generally supportive enough that consistency, sizing, and harvest goals matter more than season pressure.`
          },
          {
            theme: "finish-well",
text: `${cropSubject} ${verb} usually well matched to the season in ${city.name}. The practical focus is usually crop quality and finishing well rather than merely getting the crop to maturity.`
          },
          {
            theme: "harvest-goals",
            text: `${cropSubject} ${verb} usually easy to fit into the local season in ${city.name}. Gardeners typically have enough room to think about harvest goals, not just about whether the crop will finish.`
          }
        ]
      })?.text;
    }

    return pickThemedVariant({
      city,
      crop,
      salt: `lede-${confidence}`,
      avoidThemes,
      options: [
        {
          theme: "easy-fit",
          text: `${cropSubject} ${verb} usually an easy fit in ${city.name}. The season is generally supportive enough that gardeners can focus more on timing and crop quality than on whether the crop can mature.`
        },
        {
          theme: "well-within-season",
          text: `In ${city.name}, ${cropNameLower} ${verb} usually well within the local season. The more useful decisions are about performance and harvest goals rather than about squeezing in enough time.`
        },
        {
          theme: "result-oriented",
          text: `${cropSubject} ${verb} usually straightforward to fit into the season in ${city.name}. Gardeners generally have room to think about the kind of result they want, not just whether the crop will finish.`
        }
      ]
    })?.text;
  }

  if (confidence === "strong") {
    return [
      `${cropSubject} ${verb} usually a dependable crop in ${city.name}. The season is supportive enough that gardeners usually have real flexibility in timing and variety choice${labelsText ? `, including ${labelsText} varieties` : ""}.`,
      `In ${city.name}, ${cropNameLower} ${verb} usually a strong local fit. Most gardeners have some room to work with this crop rather than feeling close to the edge.`,
      `${cropSubject} ${verb} usually a good match for the season in ${city.name}. Gardeners generally have enough margin to think about preference and quality, not just speed.`
    ][idx];
  }

  if (confidence === "good") {
    return [
      `${cropSubject} ${verb} usually a practical fit in ${city.name}, though this is still a crop that rewards timely planting and sensible variety choice${labelsText ? `, especially among ${labelsText} varieties` : ""}.`,
      `In ${city.name}, ${cropNameLower} ${verb} usually workable with enough season for solid results, but not so much room that timing stops mattering.`,
      `${cropSubject} ${verb} generally a good local option in ${city.name}, especially when gardeners stay close to planting windows and choose varieties that match local conditions.`
    ][idx];
  }

  if (confidence === "borderline") {
    return [
      `${cropSubject} ${verb} more marginal in ${city.name} because the season is workable but not roomy. Timing, variety speed, and warm placement usually need to be part of the plan.`,
      `In ${city.name}, ${cropNameLower} can work, but the local season leaves limited room for delay or slower choices.`,
      `${cropSubject} ${verb} possible in ${city.name}, though this is the kind of crop where planning details matter much more than they do for easier crops.`
    ][idx];
  }

  return [
    `${cropSubject} ${verb} often difficult in ${city.name} because the local season is short enough that the crop can easily run out of time or heat before finishing well.`,
    `In ${city.name}, ${cropNameLower} usually has only a narrow seasonal margin, so earlier varieties and good planting timing matter much more than they do for easier crops.`,
    `${cropSubject} ${verb} a more demanding choice in ${city.name}, usually favoring only the quickest and most climate-appropriate approaches.`
  ][idx];
}

function getSummary({ crop, city, confidence, fittingVarietyLabels, fittingVarietyClasses }) {
  if (!crop || !city) return "";

  const cropSubject = getCropSubject(crop, { capitalize: true });
  const cropNameLower = getCropSubject(crop);
  const verb = getVerb(crop);
  const varietyText =
    formatVarietyLabelsForProse(fittingVarietyClasses) ||
    formatList(fittingVarietyLabels)?.toLowerCase();

if (confidence === "surplus") {
  const variants = [
    `${cropSubject} ${verb} usually an excellent fit in ${city.name}. The season normally provides more than enough room for reliable maturity${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`,
    `${cropSubject} ${verb} very easy to fit into the season in ${city.name}. Growers can usually focus more on timing and crop quality than on whether the crop can finish.`,
    `In ${city.name}, ${crop.name.toLowerCase()} ${verb} usually well within the local season${varietyText ? `, and ${varietyText.toLowerCase()} varieties are generally within reach` : ""}.`,
`${cropSubject} ${verb} usually one of the easier crops to grow in ${city.name}. The season is generous enough that timing, crop quality, and harvest goals matter more than season pressure.`,
`${cropSubject} ${verb} well suited to ${city.name}. The local season is usually generous enough that timing and crop quality matter more than squeezing out enough time to finish.`
  ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "summary-surplus") %
        variants.length
    ];
  }

  if (confidence === "strong") {
    const variants = [
      `${cropSubject} ${verb} typically a strong fit in ${city.name}. There is usually enough season for reliable maturity${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`,
      `${cropSubject} ${verb} usually well suited to ${city.name}. The season normally leaves gardeners enough room to grow this crop with confidence${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`,
      `In ${city.name}, ${crop.name.toLowerCase()} ${verb} generally a comfortable crop choice. Reliable maturity is usually achievable with normal timing${varietyText ? `, and ${varietyText.toLowerCase()} varieties are commonly within reach` : ""}.`,
      `${cropSubject} ${verb} usually a dependable crop in ${city.name}. The season is supportive enough that gardeners usually have flexibility instead of being forced into only the quickest options.`,
      `${cropSubject} ${verb} a practical and forgiving fit for ${city.name}. Most gardeners can expect reliable maturity when planting stays reasonably close to the normal window.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "summary-strong") %
        variants.length
    ];
  }

  if (confidence === "good") {
    const variants = [
      `${cropSubject} ${verb} generally a good fit in ${city.name}. Planting on time and choosing sensible varieties usually lead to solid results${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`,
      `${cropSubject} ${verb} usually workable in ${city.name}, especially when planting is timely and variety choice matches the local season${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`,
      `In ${city.name}, ${crop.name.toLowerCase()} ${verb} generally a practical option, though timing and variety choice matter more here than they do for easier crops${varietyText ? `, with ${varietyText.toLowerCase()} varieties often the best fit` : ""}.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "summary-good") %
        variants.length
    ];
  }

  if (confidence === "borderline") {
    const variants = [
      `${cropSubject} ${verb} more marginal in ${city.name}. Earlier varieties and warm planting sites improve the odds of success${varietyText ? `, with ${varietyText.toLowerCase()} types usually the best candidates` : ""}.`,
      `${cropSubject} ${verb} possible in ${city.name}, but the margin is narrow enough that timing and variety speed need to be treated seriously${varietyText ? `, especially among ${varietyText.toLowerCase()} types` : ""}.`,
      `In ${city.name}, ${crop.name.toLowerCase()} ${verb} a closer call. Good timing, favorable placement, and realistic variety choice all matter much more here${varietyText ? `, with ${varietyText.toLowerCase()} types usually the safest fit` : ""}.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "summary-borderline") %
        variants.length
    ];
  }

  if (confidence === "risky") {
    const variants = [
      `${cropSubject} ${verb} often difficult in ${city.name}. Only the earliest varieties and warmest sites typically succeed.`,
      `${cropSubject} ${verb} usually a difficult fit in ${city.name}, where only the earliest varieties and most favorable sites tend to finish well.`,
      `In ${city.name}, ${crop.name.toLowerCase()} ${verb} close to the limits of the local season. Success usually depends on the fastest varieties and the warmest growing spots.`
    ];

    return variants[
      stableVariantIndex(city.key || city.name, crop.key, "summary-risky") %
        variants.length
    ];
  }

  return `${cropSubject} can be evaluated in ${city.name} using local frost and heat data.`;
}

function buildLinkBlurbOptions({
  crop,
  city,
  confidence,
  fittingVarietyLabels,
  fittingVarietyClasses,
}) {
const cropSubject = getCropSubject(crop, { capitalize: true });
const cropNameLower = getCropSubject(crop);
  const labelsText = formatVarietyLabelsForProse(fittingVarietyClasses);
  const cityName = city.name;
  const verb = getVerb(crop);
  const performVerb = getPerformVerb(crop);

if (confidence === "surplus") {
  return [
    `${cropSubject} ${verb} usually one of the easier crops to grow here.`,
    `${cityName} usually gives ${cropNameLower} enough season that maturity is rarely the hard part.`,
    `${cropSubject} ${performVerb} easily here in a typical year.`,
    `This crop usually has enough season here that maturity is rarely the hard part.`,
    `${labelsText ? `${capitalize(labelsText)} varieties` : `A wide range of ${crop.name} varieties`} usually fit comfortably here.`
  ];
}

if (confidence === "strong") {
  return [
    `${cropSubject} ${verb} usually a dependable crop choice here.`,
    `${cityName} usually gives ${cropNameLower} enough season for reliable maturity.`,
    `${cropSubject} ${performVerb} well here when planted on time.`,
    `This crop usually gives gardeners some real room to work with.`,
    `${labelsText ? `${capitalize(labelsText)} varieties` : `A broad range of ${crop.name} varieties`} usually fit well here.`
  ];
}

if (confidence === "good") {
  return [
    `${cropSubject} ${verb} usually a practical crop here with good timing.`,
    `${cropSubject} generally works well here when gardeners stay on schedule.`,
    `${cityName} usually gives ${cropNameLower} enough season, but not much room for sloppy timing.`,
    `This crop fits here, though slower choices still carry more risk.`,
    `${labelsText ? `${capitalize(labelsText)} varieties` : `${crop.name} varieties`} are usually the safest match for local conditions.`
  ];
}

if (confidence === "borderline") {
  return [
    `${cropSubject} can work here, but timing and variety choice matter a lot.`,
    `${cityName} can support ${cropNameLower}, though the margin is not generous.`,
`This crop stays closer to the edge of the season than easier choices do.`,
    `Earlier varieties and warmer spots usually improve the odds here.`,
    `${labelsText ? `${capitalize(labelsText)} varieties` : `Earlier ${crop.name} varieties`} are usually the most realistic fit here.`
  ];
}

return [
  `${cropSubject} ${verb} harder to finish well here and usually needs the fastest approach.`,
  `${cityName} usually gives ${cropNameLower} a narrow margin for maturity.`,
  `This is a higher-risk crop here unless the site and timing are especially favorable.`,
  `Growers usually do best with quick varieties and the warmest spots they have.`,
  `${labelsText ? `${capitalize(labelsText)} varieties` : `Only very early ${crop.name} varieties`} usually have the best chance here.`
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

const transplantRecommended = !!crop.transplantRecommended;
const directSowRecommended = !!crop.directSowRecommended;

if (transplantRecommended && directSowRecommended) {
  primaryPlantingDate = directSowDate || plantOutDate || startIndoorsDate || null;
} else {
  primaryPlantingDate = plantOutDate || directSowDate || startIndoorsDate || null;
}

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

const confidence = getConfidence(gddMargin, gddTargetTypical);
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

  const bestStrategy = buildBestStrategy({
  crop,
  city,
  confidence
});

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
      frostInterpretation: buildFrostInterpretation({
  crop,
  city
}),
      checkpointIntro: buildCheckpointIntro({
  crop,
  city,
  confidence
}),
      gddInterpretation: buildGddInterpretation({
  crop,
  city,
  confidence,
  gddMargin
}),
      bestVarietyLabel: fittingVarietyLabels.length
        ? fittingVarietyLabels[fittingVarietyLabels.length - 1]
        : null,
      varietyFitSentence: buildVarietyFitSentence(
        crop,
        city,
        fittingVarietyLabels,
        fittingVarietyClasses,
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
        city,
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
        city,
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
  fittingVarietyClasses,
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
  fittingVarietyClasses: getFittingVarietyClasses(summary.crop, summary.availableGddFromPlanting),
  gddMargin: summary.gddMargin,
  frostFreeDays: summary.frostFreeDays,
  primaryPlantingDate: summary.primaryPlantingDate,
  fallFrost: summary.fallFrost,
  regionalComparisonSentence: summary.fit.regionalComparisonSentence
});
  }

  return output;
};

