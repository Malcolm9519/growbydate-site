const AMAZON_MARKETPLACES = {
  canada: {
    domain: "www.amazon.ca",
    tag: "growbydate-20"
  },
  usa: {
    domain: "www.amazon.com",
    tag: "growbydate-20"
  },
  default: {
    domain: "www.amazon.com",
    tag: "growbydate-20"
  }
};

function buildAmazonSearchUrl(query, marketplace = "default") {
  const config = AMAZON_MARKETPLACES[marketplace] || AMAZON_MARKETPLACES.default;
  const params = new URLSearchParams({ k: query, tag: config.tag });
  return `https://${config.domain}/s?${params.toString()}`;
}

function withUrls(entry) {
  if (!entry || !Array.isArray(entry.links)) return entry;

  return {
    disclosure: true,
    ...entry,
    links: entry.links.map((link) => ({
      ...link,
      url: link.url || buildAmazonSearchUrl(link.query, link.marketplace || entry.marketplace || "default")
    }))
  };
}

const guideCommerce = {
  "best-cold-frame-for-raised-beds": {
    intent: "high",
    title: "Helpful cold-frame searches",
    intro: "These searches are useful starting points if you are comparing cold frames for raised beds. Focus on fit, venting, height, and daily access before choosing a style.",
    links: [
      {
        label: "Search raised bed cold frames",
        query: "raised bed cold frame",
        note: "Good starting point for bed-top frames."
      },
      {
        label: "Search vented garden cold frames",
        query: "vented garden cold frame",
        note: "Useful when spring temperatures swing quickly."
      },
      {
        label: "Search cold frame kits",
        query: "cold frame kit garden",
        note: "Compare kit sizes against your actual bed width."
      },
      {
        label: "Search mini greenhouse cold frames",
        query: "mini greenhouse cold frame",
        note: "Worth comparing if you want more height for trays."
      }
    ]
  },

  "best-grow-lights-for-seedlings": {
    intent: "high",
    title: "Helpful grow-light searches",
    intro: "Use these searches to compare simple seed-starting light setups by tray coverage, adjustability, and shelf fit.",
    links: [
      {
        label: "Search LED grow lights for seed starting",
        query: "LED grow light for seed starting"
      },
      {
        label: "Search shop lights for seedlings",
        query: "shop light for seedlings"
      },
      {
        label: "Search grow light stands for seedlings",
        query: "grow light stand for seedlings"
      },
      {
        label: "Search seed-starting light timers",
        query: "seed starting grow light timer"
      }
    ]
  },

  "best-heat-mat-for-seedlings": {
    intent: "high",
    title: "Helpful heat-mat searches",
    intro: "These searches are useful if you are comparing bottom-heat setups for warm-season crops. For peppers especially, thermostat compatibility can matter in cool rooms.",
    links: [
      {
        label: "Search seedling heat mats with thermostat",
        query: "seedling heat mat thermostat"
      },
      {
        label: "Search seed-starting heat mats",
        query: "seed starting heat mat"
      },
      {
        label: "Search heat mats for peppers and tomatoes",
        query: "heat mat for peppers tomatoes"
      },
      {
        label: "Search waterproof seedling heat mats",
        query: "waterproof seedling heat mat"
      }
    ]
  },

  "best-humidity-dome-for-seed-starting": {
    intent: "medium",
    title: "Helpful humidity-dome searches",
    intro: "These searches can help you compare domes and kits by tray fit, dome height, and airflow control.",
    links: [
      {
        label: "Search seed trays with humidity domes",
        query: "seed starting trays with humidity dome"
      },
      {
        label: "Search humidity domes for seed trays",
        query: "humidity dome for seed trays"
      },
      {
        label: "Search tall humidity domes",
        query: "tall humidity dome seedlings"
      },
      {
        label: "Search seed-starting kits with domes",
        query: "seed starting kit with dome"
      }
    ]
  },

  "do-you-need-a-humidity-dome-for-seed-starting": {
    intent: "soft",
    title: "Helpful seed-starting supplies to compare",
    intro: "You do not need to buy a dome for every tray, but these searches are useful if your room is dry, you use bottom heat, or your trays lose surface moisture quickly.",
    links: [
      {
        label: "Search seed trays with humidity domes",
        query: "seed starting trays with humidity dome"
      },
      {
        label: "Search humidity domes for seed trays",
        query: "humidity dome for seed trays"
      },
      {
        label: "Search seedling heat mats with thermostat",
        query: "seedling heat mat thermostat"
      },
      {
        label: "Search seed-starting kits with domes",
        query: "seed starting kit with dome"
      }
    ]
  }
};

module.exports = Object.fromEntries(
  Object.entries(guideCommerce).map(([slug, entry]) => [slug, withUrls(entry)])
);
