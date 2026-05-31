const frostBasics = {
  title: "How to Use Your Frost Dates to Plan Your Garden",
  url: "/guides/how-to-use-your-frost-dates-to-plan-your-garden/",
  note: "Use last frost, first frost, and local season length to make planting decisions."
};

const gddBasics = {
  title: "How Frost Dates and Growing Degree Days Work Together",
  url: "/guides/how-frost-dates-and-growing-degree-days-work-together/",
  note: "Combine frost timing with accumulated warmth before deciding whether a crop fits."
};

const maturityBasics = {
  title: "Why Days to Maturity Isn’t Enough in Cold Climates",
  url: "/guides/why-days-to-maturity-isnt-enough-in-cold-climates/",
  note: "Catalog maturity numbers need to be checked against local heat and frost risk."
};

const matureBeforeFrost = {
  title: "Will My Crop Mature Before First Frost?",
  url: "/guides/will-my-crop-mature-before-first-frost/",
  note: "Use this framework when season length or crop heat needs are the main risk."
};

const fallHarvest = {
  title: "When Is It Too Late to Plant for Fall Harvest?",
  url: "/guides/when-is-it-too-late-to-plant-for-fall-harvest/",
  note: "Work backward from first frost for late sowings and second crops."
};

const rowCover = {
  title: "Floating Row Cover vs Frost Blanket",
  url: "/guides/floating-row-cover-vs-frost-blanket/",
  note: "Compare light protection, frost blankets, and crop-covering use cases."
};

const seasonExtension = {
  title: "How to Add 2 to 4 Weeks to Your Growing Season",
  url: "/guides/how-to-add-2-to-4-weeks-to-your-growing-season/",
  note: "Use protection and timing adjustments when a crop is close but not comfortable."
};

const fastVarieties = {
  title: "Where to Look for Fast-Maturing Varieties",
  url: "/guides/best-seed-company-for-fast-maturing-varieties/",
  note: "Find seed listings that make short-season variety comparison easier."
};

const shortSeasonCrops = {
  title: "Crops That Mature in Under 90 Frost-Free Days",
  url: "/guides/crops-that-mature-in-under-90-frost-free-days/",
  note: "Compare safer crop options when your frost-free window is short."
};

const under1000Gdd = {
  title: "Crops That Need Fewer Than 1000 Growing Degree Days",
  url: "/guides/crops-that-need-fewer-than-1000-growing-degree-days/",
  note: "Use lower-heat crops as comparisons in cool or short-season locations."
};

const transplantOutdoors = {
  title: "When to Transplant Seedlings Outdoors",
  url: "/guides/when-to-transplant-seedlings-outdoors/",
  note: "Move seedlings outside based on plant tolerance and weather, not only the calendar."
};

const seedStarting = {
  title: "Seed Starting in a Short Growing Season",
  url: "/guides/seed-starting-in-a-short-growing-season/",
  note: "Use indoor starts to gain time without creating weak or overgrown seedlings."
};

const frostAfterPlanting = {
  title: "Average Frost Date vs Actual Weather",
  url: "/guides/average-frost-date-vs-actual-weather/",
  note: "Use actual forecasts and local conditions instead of relying only on calendar averages."
};

const byCrop = {
  basil: [
    { title: "Can Seedlings Survive 40 Degrees?", url: "/guides/can-seedlings-survive-40-degrees/", note: "Basil is tender enough that chilly nights can stall growth even after frost risk drops." },
    transplantOutdoors,
    { title: "Should You Wait 2 Weeks After Frost to Plant?", url: "/guides/should-you-wait-2-weeks-after-frost-to-plant/", note: "A useful check for tender herbs and warm-season transplants." },
    gddBasics
  ],
  beans: [
    { title: "Is It Too Late to Plant Beans?", url: "/guides/is-it-too-late-to-plant-beans/", note: "Check whether direct-sown beans still have enough warm season left." },
    gddBasics,
    shortSeasonCrops,
    frostAfterPlanting
  ],
  beets: [
    fallHarvest,
    shortSeasonCrops,
    rowCover,
    { title: "Best Hand Seeder for Carrots and Lettuce", url: "/guides/best-hand-seeder-for-carrots-and-lettuce/", note: "Useful for small seeds and close spacing in direct-sown beds." }
  ],
  broccoli: [
    seedStarting,
    fallHarvest,
    { title: "Best Row Cover for Early Spring Brassicas", url: "/guides/best-row-cover-for-early-spring-brassicas/", note: "Protect young brassicas from cold, wind, and insects." },
    { title: "Insect Netting vs Row Cover for Brassicas", url: "/guides/insect-netting-vs-row-cover-for-brassicas/", note: "Choose the right cover when pests matter more than frost." }
  ],
  cabbage: [
    seedStarting,
    fallHarvest,
    { title: "Best Row Cover for Early Spring Brassicas", url: "/guides/best-row-cover-for-early-spring-brassicas/", note: "Useful for early cabbage transplants and cold spring weather." },
    { title: "Insect Netting vs Row Cover for Brassicas", url: "/guides/insect-netting-vs-row-cover-for-brassicas/", note: "Compare covers for cabbage moth pressure and weather protection." }
  ],
  carrots: [
    fallHarvest,
    shortSeasonCrops,
    { title: "Best Hand Seeder for Carrots and Lettuce", url: "/guides/best-hand-seeder-for-carrots-and-lettuce/", note: "A practical tool guide for tiny seeds and even spacing." },
    { title: "Best Netting for Carrot Rust Fly vs Cabbage Moth", url: "/guides/best-netting-for-carrot-rust-fly-vs-cabbage-moth/", note: "Use the right cover when pest protection matters." }
  ],
  cauliflower: [
    seedStarting,
    fallHarvest,
    rowCover,
    { title: "Best Insect Netting for Brassicas", url: "/guides/best-insect-netting-for-brassicas/", note: "Helpful where brassica pests pressure young cauliflower plants." }
  ],
  "corn-sweet": [
    { title: "Can Sweet Corn Mature Before First Frost?", url: "/guides/can-sweet-corn-mature-before-first-frost/", note: "Sweet corn needs a warm runway after planting, not just a frost-free date." },
    under1000Gdd,
    gddBasics,
    matureBeforeFrost
  ],
  cucumbers: [
    { title: "Is It Too Late to Plant Cucumbers?", url: "/guides/is-it-too-late-to-plant-cucumbers/", note: "Check delayed cucumber plantings against frost and warm-season runway." },
    seasonExtension,
    { title: "Best Cucumber Clips for Vertical Growing", url: "/guides/best-cucumber-clips-for-vertical-growing/", note: "Useful if you grow cucumbers up supports in a small space." },
    { title: "Cucumber Clips vs Tomato Clips", url: "/guides/cucumber-clips-vs-tomato-clips/", note: "Compare plant clips before setting up vertical cucumber support." }
  ],
  garlic: [
    frostBasics,
    frostAfterPlanting,
    { title: "Average Frost Date vs Actual Weather", url: "/guides/average-frost-date-vs-actual-weather/", note: "Use climate normals carefully when fall weather changes quickly." },
    { title: "How Microclimates Change Frost Dates", url: "/guides/how-microclimates-change-frost-dates/", note: "Garlic beds can experience different freeze patterns across the same yard." }
  ],
  kale: [
    fallHarvest,
    rowCover,
    { title: "What Is a Killing Frost?", url: "/guides/what-is-a-killing-frost/", note: "Hardy greens can handle more cold than tender crops, but limits still matter." },
    shortSeasonCrops
  ],
  lettuce: [
    fallHarvest,
    rowCover,
    { title: "Best Shade Cloth Percentage for Tomatoes vs Lettuce", url: "/guides/best-shade-cloth-percentage-for-tomatoes-vs-lettuce/", note: "Useful when lettuce struggles in heat rather than cold." },
    { title: "Best Hand Seeder for Carrots and Lettuce", url: "/guides/best-hand-seeder-for-carrots-and-lettuce/", note: "Helpful for direct sowing small lettuce seed evenly." }
  ],
  melons: [
    matureBeforeFrost,
    seasonExtension,
    maturityBasics,
    { title: "Fruit Sling vs Net Bag for Trellised Melons", url: "/guides/fruit-sling-vs-net-bag-for-trellised-melons/", note: "Useful for vertical melon growing and heavy fruit support." }
  ],
  onions: [
    maturityBasics,
    gddBasics,
    fastVarieties,
    frostBasics
  ],
  peas: [
    fallHarvest,
    rowCover,
    frostAfterPlanting,
    shortSeasonCrops
  ],
  peppers: [
    { title: "Is It Too Late to Plant Peppers?", url: "/guides/is-it-too-late-to-plant-peppers/", note: "Peppers need more heat and margin than most short-season crops." },
    { title: "Will Peppers Mature Before First Frost in a Short Season?", url: "/guides/will-peppers-mature-before-first-frost-in-a-short-growing-season/", note: "Check whether your season can finish pepper fruit before frost." },
    { title: "How Cold Is Too Cold for Pepper Seedlings?", url: "/guides/how-cold-is-too-cold-for-pepper-seedlings/", note: "Avoid cold stress before pepper plants are established outside." },
    { title: "When a Heat Mat Helps for Seed Starting", url: "/guides/when-a-heat-mat-helps-for-seed-starting/", note: "Relevant when pepper starts are slow in cool indoor conditions." }
  ],
  potato: [
    { title: "How Many Frost-Free Days Do Potatoes Need?", url: "/guides/how-many-frost-free-days-do-potatoes-need/", note: "Estimate whether potatoes have enough season for useful yield." },
    fallHarvest,
    frostAfterPlanting,
    rowCover
  ],
  pumpkin: [
    { title: "Is It Too Late to Plant Pumpkins?", url: "/guides/is-it-too-late-to-plant-pumpkins/", note: "Pumpkins need time to size, color, and mature before frost." },
    seasonExtension,
    matureBeforeFrost,
    gddBasics
  ],
  radishes: [
    fallHarvest,
    shortSeasonCrops,
    rowCover,
    frostAfterPlanting
  ],
  spinach: [
    fallHarvest,
    rowCover,
    frostAfterPlanting,
    shortSeasonCrops
  ],
  strawberries: [
    frostBasics,
    frostAfterPlanting,
    { title: "How Microclimates Change Frost Dates", url: "/guides/how-microclimates-change-frost-dates/", note: "Low spots and exposed beds can change frost risk for strawberries." },
    rowCover
  ],
  "swiss-chard": [
    fallHarvest,
    rowCover,
    shortSeasonCrops,
    frostAfterPlanting
  ],
  tomatoes: [
    { title: "Is It Too Late to Plant Tomatoes?", url: "/guides/is-it-too-late-to-plant-tomatoes/", note: "Use this when the tomato planting window is slipping later than planned." },
    { title: "How Many Growing Degree Days Do Tomatoes Need?", url: "/guides/how-many-growing-degree-days-do-tomatoes-need/", note: "Compare tomato maturity against local accumulated heat." },
    { title: "Will Tomatoes Grow in a 100-Day Growing Season?", url: "/guides/will-tomatoes-grow-in-a-100-day-growing-season/", note: "A practical short-season tomato risk check." },
    { title: "Best Products to Ripen Tomatoes Before Frost", url: "/guides/best-products-to-ripen-tomatoes-before-frost/", note: "Useful when fall frost arrives before every fruit has ripened." }
  ],
  watermelons: [
    matureBeforeFrost,
    seasonExtension,
    maturityBasics,
    { title: "Best Watermelon Support Net for Vertical Growing", url: "/guides/best-watermelon-support-net-for-vertical-growing/", note: "Useful for compact vertical watermelon setups." }
  ],
  "winter-squash": [
    { title: "Do You Have Enough Growing Degree Days for Winter Squash?", url: "/guides/do-you-have-enough-growing-degree-days-for-winter-squash/", note: "Winter squash needs full maturity, not just full-size fruit." },
    seasonExtension,
    matureBeforeFrost,
    gddBasics
  ],
  zucchini: [
    matureBeforeFrost,
    seasonExtension,
    { title: "Is It Too Late to Plant Cucumbers?", url: "/guides/is-it-too-late-to-plant-cucumbers/", note: "A nearby warm-season cucurbit timing guide for delayed plantings." },
    gddBasics
  ]
};

byCrop["sweet-corn"] = byCrop["corn-sweet"];
byCrop.potatoes = byCrop.potato;

const localDefault = [frostBasics, gddBasics, maturityBasics];

const localByCrop = Object.fromEntries(
  Object.entries(byCrop).map(([key, guides]) => [
    key,
    guides
      .filter((guide) => !guide.url.includes("best-") || guide.url.includes("fast-maturing-varieties"))
      .slice(0, 3)
  ])
);

const varietyDefault = [maturityBasics, gddBasics, fastVarieties];

const varietyByCrop = {
  basil: [maturityBasics, gddBasics, transplantOutdoors],
  beans: [maturityBasics, gddBasics, { title: "Is It Too Late to Plant Beans?", url: "/guides/is-it-too-late-to-plant-beans/", note: "Use this when comparing fast bean varieties against a late planting date." }],
  beets: [maturityBasics, fallHarvest, fastVarieties],
  broccoli: [maturityBasics, seedStarting, fastVarieties],
  cabbage: [maturityBasics, seedStarting, fastVarieties],
  carrots: [maturityBasics, fallHarvest, fastVarieties],
  cauliflower: [maturityBasics, seedStarting, fastVarieties],
  "corn-sweet": [maturityBasics, { title: "Can Sweet Corn Mature Before First Frost?", url: "/guides/can-sweet-corn-mature-before-first-frost/", note: "Use this before choosing slower sweet corn varieties." }, fastVarieties],
  cucumbers: [maturityBasics, { title: "Is It Too Late to Plant Cucumbers?", url: "/guides/is-it-too-late-to-plant-cucumbers/", note: "Check short-season cucumber choices against delayed planting." }, fastVarieties],
  garlic: [frostBasics, { title: "Average Frost Date vs Actual Weather", url: "/guides/average-frost-date-vs-actual-weather/", note: "Useful context when fall planting depends on real weather, not just normals." }, { title: "How Microclimates Change Frost Dates", url: "/guides/how-microclimates-change-frost-dates/", note: "Garlic beds can differ by exposure, slope, and snow cover." }],
  kale: [maturityBasics, fallHarvest, fastVarieties],
  lettuce: [maturityBasics, fallHarvest, fastVarieties],
  melons: [maturityBasics, matureBeforeFrost, fastVarieties],
  onions: [maturityBasics, gddBasics, fastVarieties],
  peas: [maturityBasics, fallHarvest, fastVarieties],
  peppers: [maturityBasics, { title: "Will Peppers Mature Before First Frost in a Short Season?", url: "/guides/will-peppers-mature-before-first-frost-in-a-short-growing-season/", note: "Use this before choosing slower pepper varieties." }, fastVarieties],
  potato: [maturityBasics, { title: "How Many Frost-Free Days Do Potatoes Need?", url: "/guides/how-many-frost-free-days-do-potatoes-need/", note: "Compare potato maturity classes against the local season." }, fastVarieties],
  pumpkin: [maturityBasics, { title: "Is It Too Late to Plant Pumpkins?", url: "/guides/is-it-too-late-to-plant-pumpkins/", note: "Use this before choosing larger or slower pumpkin varieties." }, fastVarieties],
  radishes: [maturityBasics, fallHarvest, fastVarieties],
  spinach: [maturityBasics, fallHarvest, fastVarieties],
  strawberries: [maturityBasics, frostBasics, { title: "How Microclimates Change Frost Dates", url: "/guides/how-microclimates-change-frost-dates/", note: "Useful when choosing varieties for exposed, sheltered, or low-lying beds." }],
  "swiss-chard": [maturityBasics, fallHarvest, fastVarieties],
  tomatoes: [maturityBasics, { title: "Will Tomatoes Grow in a 100-Day Growing Season?", url: "/guides/will-tomatoes-grow-in-a-100-day-growing-season/", note: "Use this before choosing slower tomato varieties." }, fastVarieties],
  watermelons: [maturityBasics, matureBeforeFrost, fastVarieties],
  "winter-squash": [maturityBasics, { title: "Do You Have Enough Growing Degree Days for Winter Squash?", url: "/guides/do-you-have-enough-growing-degree-days-for-winter-squash/", note: "Use this before choosing slower storage squash varieties." }, fastVarieties],
  zucchini: [maturityBasics, matureBeforeFrost, fastVarieties]
};

varietyByCrop["sweet-corn"] = varietyByCrop["corn-sweet"];
varietyByCrop.potatoes = varietyByCrop.potato;

module.exports = {
  byCrop,
  default: [gddBasics, maturityBasics, matureBeforeFrost, frostBasics],
  localByCrop,
  localDefault,
  varietyByCrop,
  varietyDefault
};
