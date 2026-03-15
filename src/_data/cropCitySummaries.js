// cropCitySummaries.js

const citySummariesSource = require("./citySummaries");
const cropCityCrops = require("./cropCityCrops");
const cropCityRollout = require("./cropCityRollout");

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
  const singularCrops = new Set(["sweet-corn"]);
  return singularCrops.has(crop.key) ? "is" : "are";
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
  const byKey = {
    tomatoes: "tomato",
    peppers: "pepper",
    beans: "bean",
    "sweet-corn": "sweet corn"
  };

  if (crop && byKey[crop.key]) return byKey[crop.key];

  const fallback = String(crop?.name || "").toLowerCase().trim();
  return fallback.endsWith("s") ? fallback.slice(0, -1) : fallback;
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

function buildVarietyFitSentence(crop, fittingVarietyLabels, confidence) {
  const labelsText = formatList(fittingVarietyLabels);
  if (!labelsText) return null;

  if (confidence === "strong") {
    return `${labelsText} varieties can usually mature here in a typical year.`;
  }

  if (confidence === "good") {
    return `${labelsText} varieties are usually a practical fit here in a typical year.`;
  }

  if (confidence === "borderline") {
    if (fittingVarietyLabels.length === 1) {
      return `Only ${labelsText.toLowerCase()} varieties are a realistic fit in a typical year.`;
    }
    return `${labelsText} varieties are the most realistic fit here, while slower types are more exposed to season risk.`;
  }

  return `Only the earliest varieties are realistic candidates here in a typical year.`;
}

function buildAdvisoryCopy({ city, crop, confidence, fittingVarietyLabels }) {
  if (!city || !crop) return null;

  const cropNameLower = crop.name.toLowerCase();
  const varietyText = formatList(fittingVarietyLabels);
  const warmCrop = ["tomatoes", "peppers", "sweet-corn"].includes(crop.key);
  const protectedCultureHigh = crop.protectedCultureBenefit === "high";

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
    succeed = `${crop.name} ${getVerb(crop)} usually workable in ${city.name} with normal timing and reasonable variety choice. Gardeners tend to do best when they plant on schedule and match the crop to the local season rather than stretching into the slowest types.`;
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

  let micro = `Growing conditions within ${city.name} are not perfectly uniform. South-facing yards, sheltered gardens, and urban spots often warm earlier and hold more heat, while low areas and exposed sites tend to stay cooler and frost earlier.`;
  if (warmCrop) {
    micro += ` Those differences matter even more for heat-loving crops like ${cropNameLower}, where a modest gain in warmth can noticeably improve maturity odds.`;
  }

  let decision = "";
  if (confidence === "strong") {
    decision = `Most gardeners can approach ${cropNameLower} confidently in a typical year. The main decision is less about whether it can work and more about how much variety flexibility you want.`;
  } else if (confidence === "good") {
    decision = `${crop.name} ${getVerb(crop)} a reasonable crop choice here, especially if you plant on time and choose varieties that match the season.`;
  } else if (confidence === "borderline") {
    decision = `${crop.name} ${getVerb(crop)} possible here, but the safer choice is to lean toward earlier varieties and warm planting locations rather than pushing for the longest-season types.`;
  } else {
    decision = `Grow ${cropNameLower} only if you are comfortable managing some risk. The safest path is to stick with the fastest varieties and treat protected, warm sites as part of the plan rather than a bonus.`;
  }

  let localInterpretation = "";
  if (protectedCultureHigh && confidence !== "strong") {
    localInterpretation = `${crop.name} ${getBecomeVerb(crop)} more realistic when gardeners can add heat or protection early in the season. Row cover, reflective walls, and sheltered planting spots can all improve outcomes.`;
  } else if (!protectedCultureHigh && confidence === "strong") {
    localInterpretation = `${crop.name} generally ${getDoVerb(crop)} not require much special treatment here beyond good timing and normal site selection in a typical year.`;
  } else {
    localInterpretation = `${crop.name} ${getRespondVerb(crop)} most to the basics here: good timing, a site that warms reasonably well, and a variety class that matches the local season.`;
  }

  return {
    succeed,
    fail,
    micro,
    decision,
    localInterpretation
  };
}

function buildLede({ crop, city, confidence, fittingVarietyLabels }) {
  const labelsText = formatList(fittingVarietyLabels);
  const cropNameLower = crop.name.toLowerCase();
  const verb = getVerb(crop);

  const ledeOptions = {
    strong: [
      `${crop.name} ${verb} usually a strong fit in ${city.name} because the local season is long enough to support reliable maturity. Gardeners generally have room to grow ${labelsText ? labelsText.toLowerCase() : cropNameLower} varieties without pushing the season too hard.`,
      `In ${city.name}, {{crop}} usually ${getPerformVerb(crop)} well because the season provides enough time and heat for reliable maturity. Gardeners typically have flexibility in both variety choice and timing.`,
      `${city.name} usually gives ${cropNameLower} enough runway for dependable maturity in a typical year. That makes this one of the more comfortable local crop fits when planting is reasonably timed.`
    ],
    good: [
      `${crop.name} ${verb} usually a good fit in ${city.name}, though results still depend on timely planting and sensible variety choice. ${labelsText ? `${labelsText} varieties are typically the most practical match for a normal season.` : ""}`,
      `In ${city.name}, ${cropNameLower} usually ${getVerb(crop) === "is" ? "has" : "have"} enough season to perform well, though the local window still rewards timely planting and realistic variety choice.`,
      `${crop.name} ${verb} generally workable in ${city.name} because the season is supportive, even if it is not completely forgiving. Gardeners usually do best when they stay close to timely planting and locally appropriate varieties.`
    ],
    borderline: [
      `${crop.name} ${verb} more marginal in ${city.name} because the season is workable but does not leave much room for delay or slower varieties. ${labelsText ? `${labelsText} varieties are usually the most realistic fit.` : ""}`,
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

function getSummary({ crop, city, confidence, fittingVarietyLabels }) {
  if (!crop || !city) return "";

  const verb = getVerb(crop);
  const varietyText = formatList(fittingVarietyLabels);

  if (confidence === "strong") {
    return `${crop.name} ${verb} typically a strong fit in ${city.name}. There is usually enough seasonal heat for reliable maturity with timely planting${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`;
  }

  if (confidence === "good") {
    return `${crop.name} ${verb} generally a good fit in ${city.name}. Timely planting and variety choice help ensure good results${varietyText ? `, including ${varietyText.toLowerCase()} varieties` : ""}.`;
  }

  if (confidence === "borderline") {
    return `${crop.name} ${verb} more marginal in ${city.name}. Earlier varieties and warm planting sites improve the odds of success${varietyText ? `, with ${varietyText.toLowerCase()} types the best candidates` : ""}.`;
  }

  if (confidence === "risky") {
    return `${crop.name} ${verb} often difficult in ${city.name}. Only the earliest varieties and warmest sites typically succeed.`;
  }

  return `${crop.name} can be evaluated in ${city.name} using local frost and heat data.`;
}

function buildLinkBlurbOptions({ crop, city, confidence, fittingVarietyLabels }) {
  const cropNameLower = crop.name.toLowerCase();
  const labelsText = formatList(fittingVarietyLabels);
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
      `${crop.name} generally fit this season well, especially with sensible variety choice.`,
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
    `${crop.name} ${getVerb(crop)} harder to finish well here and usually favor the fastest varieties.`,
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
      startIndoorsDate = addDays(spring50, -crop.daysBeforeLastFrostStartIndoors);
    }

    if (crop.daysAfterLastFrostPlantOut != null) {
      plantOutDate = addDays(spring50, crop.daysAfterLastFrostPlantOut);
    }

    if (crop.daysAfterLastFrostDirectSow != null) {
      directSowDate = addDays(spring50, crop.daysAfterLastFrostDirectSow);
    }
  }

  primaryPlantingDate = plantOutDate || directSowDate || startIndoorsDate || null;

  let gddCheckpointUsed = null;
  let availableGddFromPlanting = null;

  if (primaryPlantingDate) {
    gddCheckpointUsed = chooseClosestCheckpoint(primaryPlantingDate);
    availableGddFromPlanting = gddCheckpointUsed
      ? getRemainingGdd(city, gddCheckpointUsed, "50")
      : null;
  }

  const gddTargetTypical = Number.isFinite(crop.gddTargetTypical)
    ? crop.gddTargetTypical
    : null;

  const gddMargin =
    gddTargetTypical != null && Number.isFinite(availableGddFromPlanting)
      ? availableGddFromPlanting - gddTargetTypical
      : null;

  const confidence = getConfidence(gddMargin);
  const fittingVarietyClasses = getFittingVarietyClasses(crop, availableGddFromPlanting);
  const fittingVarietyLabels = getFittingVarietyLabels(fittingVarietyClasses);
  const fittingVarietyExamplesDetailed = getFittingVarietyExamplesDetailed(
    fittingVarietyClasses
  );
  const varietyClassFits = buildVarietyClassFits(crop, availableGddFromPlanting);
  const cropNounSingular = getCropNounSingular(crop);

  const advisory = buildAdvisoryCopy({
    city,
    crop,
    confidence,
    fittingVarietyLabels
  });

  return {
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
      fittingVarietyLabels
    }),

    springFrost: spring50,
    fallFrost: fall50,
    frostFreeDays,

    primaryPlantingDate,
    gddCheckpointUsed,

    gddAtApr15: getRemainingGdd(city, "04-15", "50"),
    gddAtMay01: getRemainingGdd(city, "05-01", "50"),
    gddAtJun01: getRemainingGdd(city, "06-01", "50"),

    availableGddFromPlanting,
    targetGdd: gddTargetTypical,
    gddMargin,
    confidence,
    fittingVarietyLabels,

    plantingWindows: city.plantingWindows || [],

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
      gddCheckpointUsed
    },

    gdd: {
      base: 50,
      remainingMar15: getRemainingGdd(city, "03-15", "50"),
      remainingApr1: getRemainingGdd(city, "04-01", "50"),
      remainingApr15: getRemainingGdd(city, "04-15", "50"),
      remainingMay1: getRemainingGdd(city, "05-01", "50"),
      remainingMay15: getRemainingGdd(city, "05-15", "50"),
      remainingJun1: getRemainingGdd(city, "06-01", "50"),
      remainingJun15: getRemainingGdd(city, "06-15", "50"),
      remainingJul1: getRemainingGdd(city, "07-01", "50"),
      remainingJul15: getRemainingGdd(city, "07-15", "50"),
      remainingAug1: getRemainingGdd(city, "08-01", "50"),
      remainingAug15: getRemainingGdd(city, "08-15", "50")
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
        fittingVarietyLabels
      }),
      summary: getSummary({ crop, city, confidence, fittingVarietyLabels })
    },

    advisory,

    copy: {
      oneSentenceSummary: crop.oneSentenceSummary || null,
      shortSeasonStrategy: crop.shortSeasonStrategy || null,
      commonFailureMode: crop.commonFailureMode || null
    }
  };
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
  }

  return output;
};
