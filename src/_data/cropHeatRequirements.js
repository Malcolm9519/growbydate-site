const gddCrops = require("./gddCrops");

function heatDemandLabel(gdd) {
  const value = Number(gdd);
  if (!Number.isFinite(value)) return "Unknown";
  if (value >= 1300) return "Very high heat demand";
  if (value >= 1100) return "High heat demand";
  if (value >= 850) return "Moderate heat demand";
  if (value >= 650) return "Lower heat demand";
  return "Fast / lower heat";
}

function shortSeasonRead(crop) {
  const gdd = Number(crop.gdd_required);
  if (crop.category === "warm-season" && gdd >= 1300) {
    return "Often tight in short seasons; variety speed and warm sites matter.";
  }
  if (crop.category === "warm-season" && gdd >= 1000) {
    return "Usually possible in warmer short-season sites, but timing still matters.";
  }
  if (crop.category === "warm-season") {
    return "Often more forgiving than long-season warm crops when planted on time.";
  }
  if (gdd >= 900) {
    return "Can still be timing-sensitive, especially for fall maturity or late starts.";
  }
  return "Generally more forgiving where frost and planting timing are managed.";
}

function cropUrl(crop) {
  return `/crops/${crop.slug || crop.canonicalKey}/`;
}

module.exports = function () {
  const rows = gddCrops
    .map((crop) => ({
      cropKey: crop.canonicalKey || crop.slug,
      slug: crop.slug || crop.canonicalKey,
      cropName: crop.name,
      baseF: crop.base_f,
      gddRequired: crop.gdd_required,
      category: crop.category,
      heatDemand: heatDemandLabel(crop.gdd_required),
      shortSeasonRead: shortSeasonRead(crop),
      cropUrl: cropUrl(crop)
    }))
    .sort((a, b) => {
      if (b.gddRequired !== a.gddRequired) return b.gddRequired - a.gddRequired;
      return a.cropName.localeCompare(b.cropName);
    });

  return {
    totalCrops: rows.length,
    warmSeasonCount: rows.filter((row) => row.category === "warm-season").length,
    coolSeasonCount: rows.filter((row) => row.category !== "warm-season").length,
    highestRequirement: rows[0] || null,
    rows,
    warmSeasonRows: rows.filter((row) => row.category === "warm-season"),
    coolSeasonRows: rows.filter((row) => row.category !== "warm-season"),
    methodology:
      "Crop heat requirements are typical GDD planning targets used by GrowByDate's maturity tools and data rankings. They are not guarantees; variety, transplant size, soil warmth, microclimate, water stress, and weather swings all affect real outcomes."
  };
};
