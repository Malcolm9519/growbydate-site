// src/_data/regionContent.js
// Region “content packs” (defaults + per-region overrides).
// Values may be strings OR functions(summary) => string/object.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function mmddToDayOfYear(mmdd) {
  if (!mmdd) return null;
  const m = Number(String(mmdd).slice(0, 2));
  const d = Number(String(mmdd).slice(3, 5));
  if (!Number.isFinite(m) || !Number.isFinite(d)) return null;

  // Non-leap year anchor for consistent DOY math
  const dt = new Date(Date.UTC(2001, m - 1, d));
  const jan1 = new Date(Date.UTC(2001, 0, 1));
  const doy = Math.round((dt - jan1) / 86400000) + 1;
  return Number.isFinite(doy) ? doy : null;
}

function formatMmdd(mmdd) {
  if (!mmdd) return null;
  const m = Number(String(mmdd).slice(0, 2));
  const d = Number(String(mmdd).slice(3, 5));
  if (!Number.isFinite(m) || !Number.isFinite(d) || m < 1 || m > 12) return mmdd;
  return `${MONTHS[m - 1]} ${d}`;
}

function frostWindow(summary) {
  const e = summary.frost?.earliest50;
  const l = summary.frost?.latest50;
  const med = summary.frost?.median50;
  if (e && l && e !== l) return `${formatMmdd(e)}–${formatMmdd(l)}`;
  if (med) return `around ${formatMmdd(med)}`;
  return null;
}

function defaultHeroExtraNote(summary) {
  const st = summary.frost?.status;

  if (st === "frost_free") {
    return "Long-season conditions in the normals—your main limiter is heat units and crop maturity, not a hard frost cutoff.";
  }

  if (st === "insufficient_data") {
    return "Frost normals are sparse here; use the heat runway as a baseline and lean on local observations and microclimates.";
  }

  // normal
  const e = mmddToDayOfYear(summary.frost?.earliest50);
  const l = mmddToDayOfYear(summary.frost?.latest50);
  const med = mmddToDayOfYear(summary.frost?.median50);
  const rangeDays = e && l ? Math.max(0, l - e) : null;

  if (Number.isFinite(rangeDays) && rangeDays >= 45) {
    return "First frost can shift by weeks within the region—elevation, exposure, and nearby water often matter as much as latitude.";
  }

  // Early/late cues (roughly: Sep 17 / Oct 17)
  if (Number.isFinite(med) && med <= 260) {
    return "An early-frost lean makes variety maturity and harvest buffers especially important—plan for a shorter finish window.";
  }

  if (Number.isFinite(med) && med >= 290) {
    return "Later first frost adds runway, but cooling nights can slow finish—track heat accumulation into September and October.";
  }

  return "A mid-range frost window: outcomes usually improve most with variety maturity matched to your typical first-frost timing.";
}


function defaultHeroNote(summary) {
  if (summary.frost?.status !== "normal") {
    return "Use this page as a normals-based baseline. If a typical frost date isn’t available here, focus on heat accumulation and local microclimates instead of a single cutoff date.";
  }
  return null;
}

function defaultIndexCardLede(summary) {
  const st = summary.frost?.status;

  const n =
    summary.frost?.totalCount ||
    summary.frost?.stationCount ||
    null;

  if (st === "frost_free") {
    return n
      ? `Frost-free in climate normals; compare remaining heat units from ${n} reference locations.`
      : "Frost-free in climate normals; compare remaining heat units through the season.";
  }

  if (st === "insufficient_data") {
    return n
      ? `Limited frost normals; use remaining heat as the baseline (${n} reference locations).`
      : "Limited frost normals; use remaining heat as the baseline.";
  }

  // normal
  const win = frostWindow(summary);
  const med = summary.frost?.median50 ? formatMmdd(summary.frost.median50) : null;

  const e = mmddToDayOfYear(summary.frost?.earliest50);
  const l = mmddToDayOfYear(summary.frost?.latest50);
  const rangeDays = e && l ? Math.max(0, l - e) : null;

  // A couple of deterministic, non-repetitive phrasings
  if (Number.isFinite(rangeDays) && rangeDays >= 35) {
    return n
      ? `Wide first-frost spread (${win}); remaining heat is summarized from ${n} locations.`
      : `Wide first-frost spread (${win}); see remaining heat through the season.`;
  }

  if (med && win) {
    return n
      ? `Typical first frost is ${med} (${win}); remaining heat is based on ${n} locations.`
      : `Typical first frost is ${med} (${win}); see remaining heat through the season.`;
  }

  return n
    ? `First-frost timing plus remaining heat, summarized from ${n} locations.`
    : "First-frost timing plus remaining heat, summarized from climate normals.";
}


module.exports = {
  // Global defaults for all regions
  defaults: {
    hero: {
      note: defaultHeroNote,
      extraNote: defaultHeroExtraNote,
    },

    // NEW: what the index cards should show under “Montana”, “Alberta”, etc.
    indexCard: {
      lede: defaultIndexCardLede,
    },

    modules: ["what-can-i-grow"],
  },

  US: {
    alabama: {
      hero: {
        extraNote:
          "Alabama’s long growing season supports multiple plantings, but summer heat and humidity can stress cool-season crops.",
      },
    },
    alaska: {
      hero: {
        extraNote:
          "Alaska’s extreme daylight shifts accelerate summer growth, but frost timing varies dramatically by region.",
      },
    },
    arizona: {
      hero: {
        extraNote:
          "Arizona gardeners manage two distinct seasons—mild winters and intense summer heat shape planting strategy.",
      },
    },
    arkansas: {
      hero: {
        extraNote:
          "Arkansas’ humid climate supports vigorous growth, though fungal pressure can increase in wet summers.",
      },
    },
    california: {
      hero: {
        extraNote:
          "California’s diverse microclimates mean coastal, valley, and mountain gardens follow very different timelines.",
      },
    },
    colorado: {
      hero: {
        extraNote:
          "Colorado’s elevation swings create major frost differences—even nearby towns can have different planting windows.",
      },
  addModules: ["colorado-local-patterns"],
    },
    connecticut: {
      hero: {
        extraNote:
          "Connecticut’s coastal influence slightly moderates frost timing compared to inland areas.",
      },
    },
    delaware: {
      hero: {
        extraNote:
          "Delaware’s proximity to the Atlantic lengthens the growing season in coastal communities.",
      },
    },
    florida: {
      hero: {
        extraNote:
          "Florida’s subtropical climate allows year-round gardening, but summer heat shifts many crops to winter.",
      },
    },
    georgia: {
      hero: {
        extraNote:
          "Georgia’s warm springs encourage early planting, though late frosts still occur in northern areas.",
      },
    },
    hawaii: {
      hero: {
        extraNote: null,
      },
    },
    idaho: {
      hero: {
        extraNote:
          "Idaho’s high desert climate creates sharp day-night temperature swings that affect crop maturity.",
      },
    },
    illinois: {
      hero: {
        extraNote:
          "Illinois’ central location means weather patterns can shift quickly between warm and cold fronts.",
      },
    },
    indiana: {
      hero: {
        extraNote:
          "Indiana’s growing season is steady but can see sudden late-spring cold snaps.",
      },
    },
    iowa: {
      hero: {
        extraNote:
          "Iowa’s fertile soils support strong yields, though early fall frosts can arrive quickly.",
      },
    },
    kansas: {
      hero: {
        extraNote:
          "Kansas’ open plains allow rapid weather changes that influence planting and harvest timing.",
      },
    },
    kentucky: {
      hero: {
        extraNote:
          "Kentucky’s rolling terrain creates microclimates that affect frost timing across short distances.",
      },
    },
    louisiana: {
      hero: {
        extraNote:
          "Louisiana’s humidity supports lush growth but increases disease pressure in summer.",
      },
    },
    maine: {
      hero: {
        extraNote:
          "Maine’s short growing season rewards quick-maturing varieties and careful frost planning.",
      },
    },
    maryland: {
      hero: {
        extraNote:
          "Maryland spans coastal and mountain zones, creating varied planting calendars statewide.",
      },
    },
    massachusetts: {
      hero: {
        extraNote:
          "Massachusetts’ coastal areas warm later in spring but cool more slowly in fall.",
      },
    },
    michigan: {
      hero: {
        extraNote:
          "Michigan’s Great Lakes moderate temperatures, extending the season near the shoreline.",
      },
        addModules: ["michigan-local-patterns"],
    },
    minnesota: {
      hero: {
        extraNote:
          "Minnesota’s short summers mean timing is critical for heat-loving crops.",
      },
  addModules: ["minnesota-local-patterns"],
    },
    mississippi: {
      hero: {
        extraNote:
          "Mississippi’s long warm season supports extended harvest windows for many crops.",
      },
    },
    missouri: {
      hero: {
        extraNote:
          "Missouri’s central location brings variable spring weather that can delay planting.",
      },
    },
    montana: {
      hero: {
        extraNote:
          "Montana’s elevation swings create significant frost variation between valleys and foothills.",
      },
  addModules: ["montana-local-patterns"],
    },
    nebraska: {
      hero: {
        extraNote:
          "Nebraska’s open plains allow strong winds that can impact early seedlings.",
      },
    },
    nevada: {
      hero: {
        extraNote:
          "Nevada’s arid climate requires irrigation planning and attention to soil health.",
      },
    },
    "new-hampshire": {
      hero: {
        extraNote:
          "New Hampshire’s northern latitude shortens the growing season compared to southern New England.",
      },
    },
    "new-jersey": {
      hero: {
        extraNote:
          "New Jersey’s coastal areas benefit from slightly extended frost-free periods.",
      },
    },
    "new-mexico": {
      hero: {
        extraNote:
          "New Mexico’s high desert elevation creates intense sun exposure and rapid cooling at night.",
      },
    },
    "new-york": {
      hero: {
        extraNote:
          "New York’s climate ranges from coastal moderation to upstate frost sensitivity.",
      },
    },
    "north-carolina": {
      hero: {
        extraNote:
          "North Carolina’s mountains, piedmont, and coast all follow different planting timelines.",
      },
    },
    "north-dakota": {
      hero: {
        extraNote:
          "North Dakota’s short growing window makes early-season planning essential.",
      },
        addModules: ["north-dakota-local-patterns"],
    },
    ohio: {
      hero: {
        extraNote:
          "Ohio’s lake effect can delay spring warming in northern regions.",
      },
    },
    oklahoma: {
      hero: {
        extraNote:
          "Oklahoma’s strong storm systems can disrupt early planting schedules.",
      },
    },
    oregon: {
      hero: {
        extraNote:
          "Oregon’s coastal and inland valleys experience very different frost timing.",
      },
    },
    pennsylvania: {
      hero: {
        extraNote:
          "Pennsylvania’s elevation and latitude shifts create varied microclimates.",
      },
    },
    "rhode-island": {
      hero: {
        extraNote:
          "Rhode Island’s coastal influence moderates temperature extremes.",
      },
    },
    "south-carolina": {
      hero: {
        extraNote:
          "South Carolina’s mild winters allow earlier spring planting than northern states.",
      },
    },
    "south-dakota": {
      hero: {
        extraNote:
          "South Dakota’s plains climate brings rapid seasonal transitions.",
      },
    },
    tennessee: {
      hero: {
        extraNote:
          "Tennessee’s varied elevation influences frost dates across the state.",
      },
    },
    texas: {
      hero: {
        extraNote:
          "Texas spans multiple climate zones—from humid east to arid west—requiring regional planning.",
      },
    },
    utah: {
      hero: {
        extraNote:
          "Utah’s high elevation shortens frost-free periods in many areas.",
      },
    },
    vermont: {
      hero: {
        extraNote:
          "Vermont’s northern latitude and elevation mean a shorter, cooler season.",
      },
    },
    virginia: {
      hero: {
        extraNote:
          "Virginia’s coastal plain warms earlier than its mountainous western region.",
      },
    },
    washington: {
      hero: {
        extraNote:
          "Washington’s west-east mountain divide creates dramatically different growing conditions.",
      },
    },
    "west-virginia": {
      hero: {
        extraNote:
          "West Virginia’s hills and valleys create localized frost variation.",
      },
    },
    wisconsin: {
      hero: {
        extraNote:
          "Wisconsin’s proximity to the Great Lakes moderates temperatures near shorelines.",
      },
    },
    wyoming: {
      hero: {
        extraNote:
          "Wyoming’s elevation and wind exposure shorten effective growing windows.",
      },
    },
  },

  CA: {
    alberta: {
      hero: {
        extraNote:
          "Alberta’s short summers require fast-maturing varieties and frost awareness.",
      },
  addModules: ["alberta-local-patterns"],
    },
    "british-columbia": {
      hero: {
        extraNote:
          "British Columbia’s coastal zones enjoy longer seasons than interior mountain regions.",
      },
        addModules: ["british-columbia-local-patterns"],
    },

manitoba: {
  hero: {
    extraNote:
      "Manitoba’s cold winters and brief summers demand precise planting timing.",
  },
  addModules: ["manitoba-local-patterns"],
},

    "new-brunswick": {
      hero: {
        extraNote:
          "New Brunswick’s maritime climate moderates temperature extremes.",
      },
        addModules: ["new-brunswick-local-patterns"],
    },
    "newfoundland-and-labrador": {
      hero: {
        extraNote:
          "Newfoundland and Labrador’s coastal climate shortens the growing season.",
      },
              addModules: ["newfoundland-and-labrador-local-patterns"],
    },
    "northwest-territories": {
      hero: {
        extraNote:
          "Northwest Territories’ extreme latitude limits outdoor growing to a brief summer window.",
      },
        addModules: ["northwest-territories-local-patterns"],
    },
    "nova-scotia": {
      hero: {
        extraNote:
          "Nova Scotia’s ocean influence extends fall harvest slightly.",
  },
  addModules: ["nova-scotia-local-patterns"],
},
    nunavut: {
      hero: {
        extraNote: null,
      },
    },
    ontario: {
      hero: {
        extraNote:
          "Ontario’s Great Lakes create warmer microclimates near the shoreline.",
      },
        addModules: ["ontario-local-patterns"],
    },
    "prince-edward-island": {
      hero: {
        extraNote:
          "Prince Edward Island’s maritime setting moderates frost timing.",
      },
        addModules: ["prince-edward-island-local-patterns"],
    },
    quebec: {
      hero: {
        extraNote:
          "Quebec’s northern latitude shortens the growing season compared to southern provinces.",
      },
        addModules: ["quebec-local-patterns"],
    },
    saskatchewan: {
      hero: {
        extraNote:
          "Saskatchewan’s prairie climate brings rapid seasonal shifts.",
      },
        addModules: ["saskatchewan-local-patterns"],
    },
    yukon: {
      hero: {
        extraNote: null,
      },
    },
  },
};