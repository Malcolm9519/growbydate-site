const cropCitySummaries = require("./cropCitySummaries");
const { average, scoreCropFit } = require("./_lib/dataRankingScoring");

const SCORE_BANDS = [
  {
    label: "Excellent fit",
    range: "90–100",
    meaning: "The crop usually has a comfortable outdoor margin in the local season."
  },
  {
    label: "Strong fit",
    range: "75–89",
    meaning: "The crop is usually realistic with normal timing and sensible variety choice."
  },
  {
    label: "Workable fit",
    range: "60–74",
    meaning: "The crop can work, but timing, variety speed, and site warmth matter."
  },
  {
    label: "Borderline fit",
    range: "40–59",
    meaning: "The crop is timing-sensitive and often benefits from fast varieties or protection."
  },
  {
    label: "Difficult outdoor fit",
    range: "0–39",
    meaning: "The crop is usually difficult outdoors without a warmer site, protection, or an unusually favorable season."
  }
];

function cityCropLabel(row) {
  return `${row.cropName} in ${row.cityName}`;
}

function exampleReason(row, fit) {
  const margin = Number(row.gddMargin);
  if (fit.score >= 75) {
    return `${cityCropLabel(row)} has enough seasonal margin to be a practical outdoor fit when planted on schedule.`;
  }
  if (fit.score >= 60) {
    return `${cityCropLabel(row)} is workable, but variety speed and planting timing still affect the margin before frost.`;
  }
  if (fit.score >= 40) {
    return `${cityCropLabel(row)} is borderline; the heat margin is ${Number.isFinite(margin) ? `${Math.round(margin)} GDD` : "tight"}, so delays matter.`;
  }
  return `${cityCropLabel(row)} is a difficult outdoor fit in a typical season and usually needs a warmer strategy.`;
}

function summarizeByCrop(rows) {
  const byCrop = new Map();
  for (const row of rows) {
    const fit = scoreCropFit(row);
    if (!byCrop.has(row.cropKey)) {
      byCrop.set(row.cropKey, {
        cropKey: row.cropKey,
        cropName: row.cropName,
        cropCategory: row.crop?.category || null,
        targetGdd: row.targetGdd,
        scores: [],
        margins: [],
        rows: []
      });
    }
    const group = byCrop.get(row.cropKey);
    group.scores.push(fit.score);
    group.margins.push(row.gddMargin);
    group.rows.push(row);
  }

  return Array.from(byCrop.values())
    .map((group) => ({
      cropKey: group.cropKey,
      cropName: group.cropName,
      cropCategory: group.cropCategory,
      targetGdd: group.targetGdd,
      publishedLocations: group.rows.length,
      averageScore: Math.round(average(group.scores)),
      averageGddMargin: Math.round(average(group.margins)),
      strongestExample: group.rows
        .map((row) => ({ row, fit: scoreCropFit(row) }))
        .sort((a, b) => b.fit.score - a.fit.score)[0]
    }))
    .sort((a, b) => b.averageScore - a.averageScore);
}

module.exports = function () {
  const rows = cropCitySummaries();
  const scored = rows
    .map((row) => {
      const fit = scoreCropFit(row);
      return {
        cityKey: row.cityKey,
        cityName: row.cityName,
        regionName: row.regionName,
        country: row.country,
        cropKey: row.cropKey,
        cropName: row.cropName,
        url: row.url,
        score: fit.score,
        label: fit.label,
        confidence: row.confidence,
        frostFreeDays: row.frostFreeDays,
        availableGddFromPlanting: row.availableGddFromPlanting,
        targetGdd: row.targetGdd,
        gddMargin: row.gddMargin,
        fittingVarietyLabels: row.fittingVarietyLabels || [],
        bestVarietyLabel: row.fit?.bestVarietyLabel || null,
        reason: exampleReason(row, fit),
        components: fit.components
      };
    })
    .sort((a, b) => b.score - a.score);

  const strongExamples = scored.filter((row) => row.score >= 75).slice(0, 4);
  const workableExamples = scored.filter((row) => row.score >= 60 && row.score < 75).slice(0, 4);
  const borderlineExamples = scored.filter((row) => row.score >= 40 && row.score < 60).slice(0, 4);
  const difficultExamples = scored.filter((row) => row.score < 40).slice(0, 4);

  const cropSummaries = summarizeByCrop(rows);

  return {
    title: "Crop Fit Index",
    totalCropCityRows: rows.length,
    totalCrops: new Set(rows.map((row) => row.cropKey)).size,
    totalCities: new Set(rows.map((row) => `${row.country}:${row.regionKey}:${row.cityKey}`)).size,
    scoreBands: SCORE_BANDS,
    factors: [
      {
        name: "GDD margin",
        description: "How much estimated heat remains after the crop's typical GDD target is met."
      },
      {
        name: "Frost-free window",
        description: "The local span between typical last spring frost and first fall frost."
      },
      {
        name: "Variety flexibility",
        description: "Whether multiple maturity classes appear to fit the local season."
      },
      {
        name: "Delay tolerance",
        description: "How much margin remains if planting slips by one or two weeks."
      },
      {
        name: "Crop behavior",
        description: "Whether the crop is warm-season, frost-sensitive, or usually easier in cool conditions."
      }
    ],
    examples: {
      strong: strongExamples,
      workable: workableExamples,
      borderline: borderlineExamples,
      difficult: difficultExamples
    },
    cropSummaries: cropSummaries.slice(0, 12),
    methodology:
      "The Crop Fit Index is an explainable planning score built from GrowByDate crop-city data. It uses local frost windows, estimated GDD margin, crop heat targets, variety fit, and delay tolerance. It is intended as a planning signal, not a guarantee."
  };
};
