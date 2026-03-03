// src/_data/regionContent.js
// Region “content packs” (defaults + per-region overrides).
// Values may be strings OR functions(summary) => string/object.

function defaultHeroNote(summary) {
  if (summary.frost?.status !== "normal") {
    return "Use this page as a normals-based baseline. If a typical frost date isn’t available here, focus on heat accumulation and local microclimates instead of a single cutoff date.";
  }
  return null;
}

function defaultIndexCardLede(summary) {
  const st = summary.frost?.status;

  if (st === "frost_free") {
    return "Typically frost-free in climate normals; focus on heat accumulation and crop maturity.";
  }

  if (st === "insufficient_data") {
    return "Frost normals are limited here; use remaining heat and local observations as your baseline.";
  }

  // normal
  const n = summary.frost?.totalCount || summary.frost?.stationCount || null;
  if (n) return `Typical first frost timing and remaining growing degree days (based on ${n} locations).`;
  return "Typical first frost timing and remaining growing degree days based on climate normals.";
}

module.exports = {
  // Global defaults for all regions
  defaults: {
    hero: {
      note: defaultHeroNote,
    },

    // NEW: what the index cards should show under “Montana”, “Alberta”, etc.
    indexCard: {
      lede: defaultIndexCardLede,
    },

    modules: ["what-can-i-grow"],
  },

  US: {
    defaults: {
      hero: {},
    },

    montana: {
      hero: {
        extraNote:
          "Montana’s elevation swings are a big driver of first frost differences—valleys, benches, and foothills can behave like different zones.",
      },
      // If you use this elsewhere
      addModules: ["montana-local-patterns"],
    },
  },

  CA: {
    defaults: {
      hero: {
        eyebrow: "",
      },
    },

    alberta: {
      hero: {
        extraNote:
          "In Alberta, a fast summer heat ramp can make July productive—but variety choice and early fall frost risk still dominate outcomes.",
      },
      addModules: ["alberta-local-patterns"],
    },
  },
};