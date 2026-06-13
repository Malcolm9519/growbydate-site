const frostDateReference = require("../frostDateReference");
const gddReference = require("../gddReference");

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function round(value) {
  return Math.round(Number(value));
}

function addPercentile(rows, field, outputKey) {
  const sorted = rows
    .filter((row) => isFiniteNumber(row[field]))
    .sort((a, b) => Number(a[field]) - Number(b[field]));

  if (!sorted.length) return;

  if (sorted.length === 1) {
    sorted[0][outputKey] = 50;
    return;
  }

  let i = 0;
  while (i < sorted.length) {
    let j = i;
    const value = Number(sorted[i][field]);
    while (j + 1 < sorted.length && Number(sorted[j + 1][field]) === value) {
      j += 1;
    }

    const averageIndex = (i + j) / 2;
    const percentile = Math.round((averageIndex / (sorted.length - 1)) * 100);
    for (let k = i; k <= j; k += 1) {
      sorted[k][outputKey] = percentile;
    }
    i = j + 1;
  }
}

function mismatchLabel(row) {
  if (row.seasonHeatGap >= 30) return "Long season, cooler heat budget";
  if (row.seasonHeatGap >= 18) return "Longer than it is warm";
  if (row.seasonHeatGap <= -30) return "Short season, stronger heat budget";
  if (row.seasonHeatGap <= -18) return "Warmer than the calendar suggests";
  return "Season and heat mostly aligned";
}

function mismatchType(row) {
  if (row.seasonHeatGap > 0) return "long-low-gdd";
  if (row.seasonHeatGap < 0) return "short-high-gdd";
  return "aligned";
}

function mismatchReason(row) {
  const gap = Math.abs(Number(row.seasonHeatGap) || 0);
  if (row.seasonHeatGap >= 18) {
    return `${row.cityName} ranks much higher for frost-free days than for base 50°F GDD, so the calendar season can look more generous than the warm-crop heat budget.`;
  }
  if (row.seasonHeatGap <= -18) {
    return `${row.cityName} ranks much higher for seasonal heat than for frost-free days, so the season may be short but comparatively productive for heat-loving crops.`;
  }
  return `${row.cityName}'s frost-free season and base 50°F GDD rank within about ${gap} percentile points of each other.`;
}

function buildClimateSignalRows() {
  const gddByLookup = new Map(
    gddReference().cityRecords.map((record) => [String(record.lookupKey), record])
  );

  const rows = frostDateReference().cityRecords
    .map((frost) => {
      const gdd = gddByLookup.get(String(frost.lookupKey));
      if (!gdd) return null;
      if (!isFiniteNumber(frost.frostFreeDays) || !isFiniteNumber(gdd.gddBase50)) return null;

      return {
        rank: null,
        cityKey: frost.cityKey,
        cityName: frost.cityName,
        regionKey: frost.regionKey,
        regionName: frost.regionName,
        regionAbbr: frost.regionAbbr,
        country: frost.country,
        countryLabel: frost.countryLabel,
        lookupKey: frost.lookupKey,
        url: frost.cityUrl,
        springFrost: frost.lastFrostLabel || frost.lastFrost,
        fallFrost: frost.firstFrostLabel || frost.firstFrost,
        frostFreeDays: round(frost.frostFreeDays),
        gddBase50: round(gdd.gddBase50),
        gddBase45: isFiniteNumber(gdd.gddBase45) ? round(gdd.gddBase45) : null,
        gddBase40: isFiniteNumber(gdd.gddBase40) ? round(gdd.gddBase40) : null,
        seasonPercentile: null,
        heatPercentile: null,
        seasonHeatGap: null,
        mismatchScore: null,
        label: null,
        mismatchType: null,
        reason: null
      };
    })
    .filter(Boolean);

  addPercentile(rows, "frostFreeDays", "seasonPercentile");
  addPercentile(rows, "gddBase50", "heatPercentile");

  rows.forEach((row) => {
    row.seasonHeatGap = Math.round(row.seasonPercentile - row.heatPercentile);
    row.mismatchScore = Math.abs(row.seasonHeatGap);
    row.label = mismatchLabel(row);
    row.mismatchType = mismatchType(row);
    row.reason = mismatchReason(row);
  });

  return rows;
}

module.exports = {
  buildClimateSignalRows
};
