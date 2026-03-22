// src/_data/crops.js

const GDD_BY_KEY = {
  tomatoes: { base_f: 50, gdd_required: 1200, category: "warm-season" },
  peppers: { base_f: 50, gdd_required: 1100, category: "warm-season" },
  cucumbers: { base_f: 50, gdd_required: 800, category: "warm-season" },
  zucchini: { base_f: 50, gdd_required: 750, category: "warm-season" },
  "winter-squash": { base_f: 50, gdd_required: 1300, category: "warm-season" },
  pumpkin: { base_f: 50, gdd_required: 1300, category: "warm-season" },
  "sweet-corn": { base_f: 50, gdd_required: 1100, category: "warm-season" },
  beans: { base_f: 50, gdd_required: 600, category: "warm-season" },

  broccoli: { base_f: 40, gdd_required: 900, category: "cool-season" },
  cabbage: { base_f: 40, gdd_required: 1000, category: "cool-season" },
  cauliflower: { base_f: 40, gdd_required: 1050, category: "cool-season" },
  carrots: { base_f: 40, gdd_required: 750, category: "cool-season" },
  beets: { base_f: 40, gdd_required: 600, category: "cool-season" },
  lettuce: { base_f: 40, gdd_required: 450, category: "cool-season" },
  spinach: { base_f: 40, gdd_required: 400, category: "cool-season" },
  peas: { base_f: 40, gdd_required: 600, category: "cool-season" },

  potatoes: { base_f: 45, gdd_required: 1100, category: "cool-season" },
  onions: { base_f: 45, gdd_required: 1300, category: "cool-season" }
};


const CROP_CITY_BY_KEY = {
  tomatoes: {
    relatedCrops: ["peppers", "sweet-corn"],

    plantingMethod: "transplant",
    startingMethod: "indoors",
    transplantRecommended: true,
    directSowRecommended: false,

    daysBeforeLastFrostStartIndoors: 42,
    daysAfterLastFrostPlantOut: 7,
    daysAfterLastFrostDirectSow: null,

    gddBase: 50,
    gddTargetTypical: 1200,
    maturityFrom: "transplant",
    daysToMaturityTypical: "75–85",

    frostTolerance: "tender",
    minSafeTempF: 32,
    protectedCultureBenefit: "high",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "55–70",
        gddTarget: 850,
        examples: [
          { name: "Stupice", note: "very early and dependable, with good performance in shorter or cooler seasons" },
          { name: "Glacier", note: "one of the faster ripening slicers, often chosen where summer heat is limited" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "65–75",
        gddTarget: 1000,
        examples: [
          { name: "Early Girl", note: "popular for combining relatively quick maturity with solid production" },
          { name: "Fourth of July", note: "often treated like an early-to-mid bridge variety with faster ripening than larger slicers" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "75–85",
        gddTarget: 1200,
        examples: [
          { name: "Celebrity", note: "a reliable midseason hybrid that balances yield, disease resistance, and manageable maturity" },
          { name: "Juliet", note: "a productive saladette type that can perform well when the season is reasonably supportive" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "85–100",
        gddTarget: 1400,
        examples: [
          { name: "Brandywine", note: "a large heirloom type valued for flavor but much more exposed to short-season risk" },
          { name: "Mortgage Lifter", note: "a slower large-fruited tomato that usually needs a longer, warmer run to finish well" },
          { name: "Cherokee Purple", note: "excellent flavor, but usually better suited to places with more seasonal heat" }
        ]
      }
    ],

    oneSentenceSummary: "Tomatoes need a warm season and enough heat to ripen fruit reliably.",
    shortSeasonStrategy: "Use transplants and favor very early or early varieties in shorter seasons.",
    commonFailureMode: "Late varieties often run out of heat before fall frost."
  },

  peppers: {
    relatedCrops: ["tomatoes", "beans"],

    plantingMethod: "transplant",
    startingMethod: "indoors",
    transplantRecommended: true,
    directSowRecommended: false,

    daysBeforeLastFrostStartIndoors: 49,
    daysAfterLastFrostPlantOut: 10,
    daysAfterLastFrostDirectSow: null,

    gddBase: 50,
    gddTargetTypical: 1300,
    maturityFrom: "transplant",
    daysToMaturityTypical: "70–85",

    frostTolerance: "tender",
    minSafeTempF: 32,
    protectedCultureBenefit: "high",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "60–70",
        gddTarget: 950,
        examples: [
          { name: "King of the North", note: "a classic short-season bell pepper chosen for earlier maturity in cooler climates" },
          { name: "Ace", note: "often grown where gardeners want dependable bell peppers without pushing late-season risk" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "65–75",
        gddTarget: 1100,
        examples: [
          { name: "Gypsy", note: "an earlier hybrid sweet pepper that matures more quickly than many full-size bells" },
          { name: "Lipstick", note: "sometimes treated as relatively early, though fuller ripening still improves with more heat" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "75–85",
        gddTarget: 1300,
        examples: [
          { name: "California Wonder", note: "a familiar standard bell pepper, but usually more comfortable where the season has decent heat" },
          { name: "Carmen", note: "a tapered sweet pepper that can perform well when the local season is supportive" },
          { name: "Corno di Toro", note: "productive and flavorful, but generally better where plants get a stronger run of warmth" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "85–100",
        gddTarget: 1500,
        examples: [
          { name: "Marconi Red", note: "a larger sweet pepper that usually benefits from a long, warm season" },
          { name: "Chocolate Beauty", note: "slower to color fully, making it more exposed to short-season pressure" }
        ]
      }
    ],

    oneSentenceSummary: "Peppers need steady warmth and a reasonably long season to size up and ripen well.",
    shortSeasonStrategy: "Use transplants, choose very early or early varieties, and prioritize the warmest spots in the garden.",
    commonFailureMode: "Cool conditions slow growth and delay ripening."
  },

  "sweet-corn": {
    relatedCrops: ["beans", "tomatoes"],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: 7,

    gddBase: 50,
    gddTargetTypical: 1100,
    maturityFrom: "direct-sow",
    daysToMaturityTypical: "70–85",

    frostTolerance: "tender",
    minSafeTempF: 32,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "60–70",
        gddTarget: 850,
        examples: [
          { name: "Yukon Chief", note: "bred with short seasons in mind and often chosen where early maturity matters most" },
          { name: "Early Sunglow", note: "a dependable early yellow sweet corn that reaches harvest relatively quickly" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "65–75",
        gddTarget: 950,
        examples: [
          { name: "Peaches and Cream", note: "widely grown and approachable, though still best when planted promptly into warming soil" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "75–85",
        gddTarget: 1100,
        examples: [
          { name: "Bodacious", note: "a flavorful midseason type that fits best where summer heat is reasonably steady" },
          { name: "Silver Queen", note: "popular and well known, but usually more comfortable where the season is not especially tight" },
          { name: "Ambrosia", note: "a sweet, widely grown corn that performs best when it has a decent run of heat" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "85–95",
        gddTarget: 1250,
        examples: [
          { name: "Kandy Korn", note: "a later corn that generally benefits from longer summers and less pressure from early fall" },
          { name: "Incredible", note: "vigorous and productive, but more exposed where the season is short" },
          { name: "Honey Select", note: "excellent eating quality, though it usually wants more runway than fast early types" }
        ]
      }
    ],

    oneSentenceSummary: "Sweet corn needs decent summer heat and enough season length to fill ears before fall frost.",
    shortSeasonStrategy: "Favor very early or early varieties and plant promptly once soil has warmed.",
    commonFailureMode: "Late planting can leave ears short on time and heat."
  },

  beans: {
    relatedCrops: ["sweet-corn", "peppers"],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: 7,

    gddBase: 50,
    gddTargetTypical: 900,
    maturityFrom: "direct-sow",
    daysToMaturityTypical: "50–65",

    frostTolerance: "tender",
    minSafeTempF: 32,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "45–52",
        gddTarget: 725,
        examples: [
          { name: "Provider", note: "a dependable early bean often chosen where cool starts and shorter seasons are common" },
          { name: "Mascotte", note: "compact and relatively quick, making it useful where gardeners want a fast return" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "50–55",
        gddTarget: 800,
        examples: [
          { name: "Contender", note: "valued for earliness and steadiness, especially in variable conditions" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "55–65",
        gddTarget: 900,
        examples: [
          { name: "Blue Lake", note: "a classic bean with strong garden appeal when the season comfortably supports it" },
          { name: "Kentucky Wonder", note: "productive and popular, though it benefits from a decent amount of warm weather" },
          { name: "Roma II", note: "a reliable Italian-type bean that usually works well where planting is timely" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "65–75",
        gddTarget: 1000,
        examples: [
          { name: "Rattlesnake", note: "vigorous and productive, but better where the season leaves a little more room" },
          { name: "Scarlet Runner", note: "showy and productive, though often more exposed in shorter seasons" },
          { name: "Fortex", note: "excellent quality, but generally happier when warmth and season length are less limiting" }
        ]
      }
    ],

    oneSentenceSummary: "Beans are one of the more manageable warm-season crops where summer heat is decent.",
    shortSeasonStrategy: "Plant once frost risk has passed and favor very early or early bush types in shorter seasons.",
    commonFailureMode: "Cold soil and late frosts can stall or damage young plants."
  },

  cucumbers: {
    relatedCrops: ["zucchini", "beans"],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: 7,

    gddBase: 50,
    gddTargetTypical: 800,
    maturityFrom: "direct-sow",
    daysToMaturityTypical: "50–60",

    frostTolerance: "tender",
    minSafeTempF: 32,
    protectedCultureBenefit: "medium",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "45–50",
        gddTarget: 700,
        examples: [
          { name: "Cool Breeze", note: "an earlier type that is more forgiving where gardeners want a faster start" },
          { name: "Suyo Long", note: "can be productive in a decent season, especially where warmth arrives on time" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "50–55",
        gddTarget: 800,
        examples: [
          { name: "Marketmore 76", note: "a classic slicing cucumber that often fits reasonably well when planted into warmth" },
          { name: "Spacemaster", note: "compact and relatively approachable where gardeners want fast returns" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "55–65",
        gddTarget: 900,
        examples: [
          { name: "Straight Eight", note: "productive and well known, but happier when the season is not especially compressed" },
          { name: "Telegraph", note: "better suited to supportive warmth or protected growing" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "65–75",
        gddTarget: 1000,
        examples: [
          { name: "Lemon", note: "fun and productive, but more exposed if summer heat arrives late" }
        ]
      }
    ],

    oneSentenceSummary: "Cucumbers need warm planting conditions and enough summer heat to start producing quickly.",
    shortSeasonStrategy: "Direct sow only after soil has warmed, or use the warmest sites and earlier varieties if the season is tight.",
    commonFailureMode: "Cold soil and cool early growth can delay flowering and push harvest too late."
  },

  zucchini: {
    relatedCrops: ["cucumbers", "beans"],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: 7,

    gddBase: 50,
    gddTargetTypical: 750,
    maturityFrom: "direct-sow",
    daysToMaturityTypical: "50–55",

    frostTolerance: "tender",
    minSafeTempF: 32,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "45–48",
        gddTarget: 675,
        examples: [
          { name: "Dunja", note: "productive and relatively quick, with a good fit for gardeners who want early harvest" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "48–52",
        gddTarget: 750,
        examples: [
          { name: "Black Beauty", note: "a classic zucchini that often works well when planted on time" },
          { name: "Raven", note: "vigorous and fairly approachable where warmth arrives on schedule" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "52–58",
        gddTarget: 850,
        examples: [
          { name: "Costata Romanesco", note: "excellent quality, though it benefits from a reasonably supportive season" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "58–65",
        gddTarget: 950,
        examples: [
          { name: "Cocozelle", note: "more exposed where the warm season is short or delayed" }
        ]
      }
    ],

    oneSentenceSummary: "Zucchini is one of the more manageable warm-season crops when planted into genuinely warm soil.",
    shortSeasonStrategy: "Plant promptly after frost risk passes and favor earlier summer squash types where the season is tighter.",
    commonFailureMode: "Cold starts slow plants down and delay early fruit production."
  },

  potatoes: {
    relatedCrops: ["onions", "peas"],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: -21,

    gddBase: 45,
    gddTargetTypical: 1100,
    maturityFrom: "direct-sow",
    daysToMaturityTypical: "80–100",

    frostTolerance: "light",
    minSafeTempF: 28,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "70–80",
        gddTarget: 900,
        examples: [
          { name: "Yukon Gold", note: "widely grown and relatively approachable where gardeners want dependable earlier harvest" },
          { name: "Norland", note: "often chosen for earliness and good fit in shorter-season gardens" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "80–90",
        gddTarget: 1000,
        examples: [
          { name: "Dark Red Norland", note: "a familiar early potato with solid short-season appeal" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "90–105",
        gddTarget: 1100,
        examples: [
          { name: "Kennebec", note: "productive and versatile, but better with a decent amount of runway" },
          { name: "Gold Rush", note: "can do well where the season is supportive and planting is timely" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "105–120",
        gddTarget: 1250,
        examples: [
          { name: "Russet Burbank", note: "more exposed in short-season areas because it wants a longer finish" }
        ]
      }
    ],

    oneSentenceSummary: "Potatoes are usually feasible in cool climates, but longer varieties need enough season length to size up fully.",
    shortSeasonStrategy: "Plant early into workable soil and lean toward earlier potatoes where the fall window closes quickly.",
    commonFailureMode: "Late planting leaves less time for bulking before the season winds down."
  },

  peas: {
    relatedCrops: ["broccoli", "potatoes"],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: -28,

    gddBase: 40,
    gddTargetTypical: 600,
    maturityFrom: "direct-sow",
    daysToMaturityTypical: "55–65",

    frostTolerance: "hardy",
    minSafeTempF: 24,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "55–58",
        gddTarget: 500,
        examples: [
          { name: "Alaska", note: "a classic early pea with a strong fit for cool spring planting" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "58–62",
        gddTarget: 600,
        examples: [
          { name: "Little Marvel", note: "compact and dependable, with a good fit for many shorter seasons" },
          { name: "Sugar Ann", note: "a favorite early snap pea where gardeners want quick spring production" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "62–70",
        gddTarget: 700,
        examples: [
          { name: "Green Arrow", note: "productive and popular, but still best when planted promptly into spring conditions" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "70–75",
        gddTarget: 800,
        examples: [
          { name: "Tall Telephone", note: "more exposed where spring turns warm quickly or the planting is delayed" }
        ]
      }
    ],

    oneSentenceSummary: "Peas are one of the easiest cool-season crops to fit into shorter climates when planted early.",
    shortSeasonStrategy: "Direct sow as early as workable soil allows so flowering and pod fill happen before warmer weather arrives.",
    commonFailureMode: "Late sowing pushes production into heat, which usually shortens the harvest window."
  },

  broccoli: {
    relatedCrops: ["cabbage", "peas"],

    plantingMethod: "transplant",
    startingMethod: "indoors",
    transplantRecommended: true,
    directSowRecommended: false,

    daysBeforeLastFrostStartIndoors: 49,
    daysAfterLastFrostPlantOut: -7,
    daysAfterLastFrostDirectSow: null,

    gddBase: 40,
    gddTargetTypical: 900,
    maturityFrom: "transplant",
    daysToMaturityTypical: "60–75",

    frostTolerance: "light",
    minSafeTempF: 28,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "55–60",
        gddTarget: 750,
        examples: [
          { name: "De Cicco", note: "an early broccoli often chosen where gardeners want flexibility and quicker harvest" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "60–68",
        gddTarget: 850,
        examples: [
          { name: "Packman", note: "a dependable standard with good short-season practicality" },
          { name: "Green Magic", note: "a strong early hybrid that often handles the main spring window well" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "68–78",
        gddTarget: 950,
        examples: [
          { name: "Belstar", note: "productive and reliable where the season gives a reasonable cool-weather runway" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "78–90",
        gddTarget: 1050,
        examples: [
          { name: "Marathon", note: "more exposed if spring is delayed or summer heat arrives early" }
        ]
      }
    ],

    oneSentenceSummary: "Broccoli is a strong cool-season crop when planted early enough to mature before summer heat builds.",
    shortSeasonStrategy: "Start indoors, transplant into cool conditions, and favor earlier broccoli where spring warmth arrives quickly.",
    commonFailureMode: "Late planting can push heading into warmer weather, which increases bolting and reduces head quality."
  },

  cabbage: {
    relatedCrops: ["broccoli", "onions"],

    plantingMethod: "transplant",
    startingMethod: "indoors",
    transplantRecommended: true,
    directSowRecommended: false,

    daysBeforeLastFrostStartIndoors: 56,
    daysAfterLastFrostPlantOut: -21,
    daysAfterLastFrostDirectSow: null,

    gddBase: 40,
    gddTargetTypical: 1000,
    maturityFrom: "transplant",
    daysToMaturityTypical: "70–90",

    frostTolerance: "light",
    minSafeTempF: 28,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "60–70",
        gddTarget: 800,
        examples: [
          { name: "Golden Acre", note: "a classic early cabbage with strong practical fit in shorter seasons" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "70–80",
        gddTarget: 900,
        examples: [
          { name: "Stonehead", note: "reliable and approachable, especially where gardeners want a firm early head" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "80–95",
        gddTarget: 1000,
        examples: [
          { name: "Cheers", note: "productive and strong where the season offers a comfortable cool run" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "95–110",
        gddTarget: 1150,
        examples: [
          { name: "Storage No. 4", note: "better suited where the growing window gives longer room for finishing" }
        ]
      }
    ],

    oneSentenceSummary: "Cabbage is usually very workable in cool climates if it gets started early enough.",
    shortSeasonStrategy: "Use transplants, plant into cool spring conditions, and favor earlier heads where the spring window is tighter.",
    commonFailureMode: "Late starts can leave heads sizing up into warmer weather, which raises splitting and quality issues."
  },

  carrots: {
    relatedCrops: ["beets", "onions"],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: -7,

    gddBase: 40,
    gddTargetTypical: 750,
    maturityFrom: "direct-sow",
    daysToMaturityTypical: "65–75",

    frostTolerance: "light",
    minSafeTempF: 28,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "55–60",
        gddTarget: 650,
        examples: [
          { name: "Amsterdam", note: "quick and well suited where gardeners want a fast early carrot" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "60–68",
        gddTarget: 750,
        examples: [
          { name: "Nelson", note: "a reliable early Nantes-type with broad short-season appeal" },
          { name: "Yaya", note: "smooth and quick, with a strong fit for earlier harvest goals" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "68–75",
        gddTarget: 850,
        examples: [
          { name: "Bolero", note: "productive and dependable where the season gives enough room" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "75–80",
        gddTarget: 925,
        examples: [
          { name: "Danvers 126", note: "a classic storage-leaning type that benefits from a little more runway" }
        ]
      }
    ],

    oneSentenceSummary: "Carrots are usually a good fit for cool climates when sown early enough into workable soil.",
    shortSeasonStrategy: "Direct sow as early as the bed can be prepared, and lean toward earlier carrots if you want a faster harvest.",
    commonFailureMode: "Late sowing shortens the time roots have to size up before cool fall conditions slow growth."
  },

  onions: {
    relatedCrops: ["potatoes", "carrots"],

    plantingMethod: "transplant",
    startingMethod: "indoors",
    transplantRecommended: true,
    directSowRecommended: false,

    daysBeforeLastFrostStartIndoors: 77,
    daysAfterLastFrostPlantOut: -21,
    daysAfterLastFrostDirectSow: null,

    gddBase: 45,
    gddTargetTypical: 1300,
    maturityFrom: "transplant",
    daysToMaturityTypical: "95–110",

    frostTolerance: "light",
    minSafeTempF: 28,
    protectedCultureBenefit: "low",

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "90–95",
        gddTarget: 1100,
        examples: [
          { name: "Walla Walla", note: "large and popular, but still best when started early enough to build size" }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "95–105",
        gddTarget: 1200,
        examples: [
          { name: "Copra", note: "a dependable storage onion with good all-around practicality" }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "105–115",
        gddTarget: 1300,
        examples: [
          { name: "Redwing", note: "a strong red storage type where the season is reasonably supportive" },
          { name: "Patterson", note: "a solid keeping onion that wants enough runway to size up well" }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "115–120",
        gddTarget: 1400,
        examples: [
          { name: "Ailsa Craig", note: "more exposed in shorter seasons because it benefits from a longer finishing run" }
        ]
      }
    ],

    oneSentenceSummary: "Onions usually work well in cool climates, but they need an early start to size up fully before the season closes.",
    shortSeasonStrategy: "Start early indoors and transplant into cool spring weather so bulbs have maximum time to develop.",
    commonFailureMode: "Starting too late reduces plant size before bulbing, which usually means smaller harvestable onions."
  },
  beets: {
  relatedCrops: ["carrots", "spinach"],

  plantingMethod: "direct-sow",
  startingMethod: "outdoors",
  transplantRecommended: false,
  directSowRecommended: true,

  daysBeforeLastFrostStartIndoors: null,
  daysAfterLastFrostPlantOut: null,
  daysAfterLastFrostDirectSow: -14,

  gddBase: 40,
  gddTargetTypical: 650,
  maturityFrom: "direct-sow",
  daysToMaturityTypical: "50–60",

  frostTolerance: "light",
  minSafeTempF: 28,
  protectedCultureBenefit: "low",

  varietyClasses: [
    {
      key: "very-early",
      label: "Very early",
      daysToMaturity: "45–50",
      gddTarget: 600,
      examples: [
        { name: "Early Wonder", note: "a classic early beet that fits well into shorter growing windows" }
      ]
    },
    {
      key: "early",
      label: "Early",
      daysToMaturity: "50–55",
      gddTarget: 650,
      examples: [
        { name: "Detroit Dark Red", note: "widely grown and dependable when planted early" }
      ]
    },
    {
      key: "mid",
      label: "Mid-season",
      daysToMaturity: "55–65",
      gddTarget: 725,
      examples: [
        { name: "Chioggia", note: "distinctive and productive, but benefits from a bit more growing time" }
      ]
    }
  ],

  oneSentenceSummary: "Beets are a dependable cool-season crop when sown early into workable soil.",
  shortSeasonStrategy: "Direct sow early and consider staggered plantings to spread harvest.",
  commonFailureMode: "Late sowing limits root sizing before cooler fall conditions slow growth."
},
lettuce: {
  relatedCrops: ["spinach", "radishes"],

  plantingMethod: "direct-sow",
  startingMethod: "outdoors",
  transplantRecommended: false,
  directSowRecommended: true,

  daysBeforeLastFrostStartIndoors: null,
  daysAfterLastFrostPlantOut: null,
  daysAfterLastFrostDirectSow: -21,

  gddBase: 40,
  gddTargetTypical: 500,
  maturityFrom: "direct-sow",
  daysToMaturityTypical: "45–55",

  frostTolerance: "light",
  minSafeTempF: 28,
  protectedCultureBenefit: "low",

  varietyClasses: [
    {
      key: "very-early",
      label: "Very early",
      daysToMaturity: "40–45",
      gddTarget: 450,
      examples: [
        { name: "Black Seeded Simpson", note: "fast and forgiving, often used for early spring planting" }
      ]
    },
    {
      key: "early",
      label: "Early",
      daysToMaturity: "45–55",
      gddTarget: 500,
      examples: [
        { name: "Buttercrunch", note: "widely grown and reliable across a range of conditions" }
      ]
    },
    {
      key: "mid",
      label: "Mid-season",
      daysToMaturity: "55–65",
      gddTarget: 600,
      examples: [
        { name: "Romaine", note: "productive but benefits from stable cool growing conditions" }
      ]
    }
  ],

  oneSentenceSummary: "Lettuce is one of the easiest cool-season crops to fit into short climates.",
  shortSeasonStrategy: "Plant early and often, using succession sowing to extend harvest.",
  commonFailureMode: "Heat causes bolting, which shortens harvest windows."
},
spinach: {
  relatedCrops: ["lettuce", "peas"],

  plantingMethod: "direct-sow",
  startingMethod: "outdoors",
  transplantRecommended: false,
  directSowRecommended: true,

  daysAfterLastFrostDirectSow: -21,

  gddBase: 40,
  gddTargetTypical: 450,
  maturityFrom: "direct-sow",
  daysToMaturityTypical: "40–50",

  frostTolerance: "moderate",
  minSafeTempF: 25,
  protectedCultureBenefit: "low",

  varietyClasses: [
    {
      key: "very-early",
      label: "Very early",
      daysToMaturity: "35–40",
      gddTarget: 400,
      examples: [
        { name: "Bloomsdale", note: "cold-tolerant and well suited to early spring planting" }
      ]
    },
    {
      key: "early",
      label: "Early",
      daysToMaturity: "40–45",
      gddTarget: 450,
      examples: [
        { name: "Space", note: "reliable and relatively slow to bolt compared to some types" }
      ]
    }
  ],

  oneSentenceSummary: "Spinach thrives in cool weather and is one of the earliest crops you can plant.",
  shortSeasonStrategy: "Sow as early as possible and prioritize spring and fall windows.",
  commonFailureMode: "Warm weather causes rapid bolting and short harvest windows."
},
radishes: {
  relatedCrops: ["lettuce", "carrots"],

  plantingMethod: "direct-sow",
  startingMethod: "outdoors",
  directSowRecommended: true,

  daysAfterLastFrostDirectSow: -21,

  gddBase: 40,
  gddTargetTypical: 350,
  maturityFrom: "direct-sow",
  daysToMaturityTypical: "25–35",

  frostTolerance: "light",
  minSafeTempF: 28,
  protectedCultureBenefit: "low",

  varietyClasses: [
    {
      key: "very-early",
      label: "Very early",
      daysToMaturity: "22–28",
      gddTarget: 300,
      examples: [
        { name: "Cherry Belle", note: "quick and dependable for early harvest" }
      ]
    },
    {
      key: "early",
      label: "Early",
      daysToMaturity: "28–35",
      gddTarget: 350,
      examples: [
        { name: "French Breakfast", note: "slightly slower but popular and reliable" }
      ]
    }
  ],

  oneSentenceSummary: "Radishes are one of the fastest crops and fit easily into short seasons.",
  shortSeasonStrategy: "Use frequent succession planting for continuous harvest.",
  commonFailureMode: "Heat or delays can cause woody or bitter roots."
},
cauliflower: {
  relatedCrops: ["broccoli", "cabbage"],

  plantingMethod: "transplant",
  startingMethod: "indoors",
  transplantRecommended: true,

  daysBeforeLastFrostStartIndoors: 42,
  daysAfterLastFrostPlantOut: -7,

  gddBase: 40,
  gddTargetTypical: 1000,
  maturityFrom: "transplant",
  daysToMaturityTypical: "65–85",

  frostTolerance: "light",
  minSafeTempF: 28,
  protectedCultureBenefit: "low",

  varietyClasses: [
    {
      key: "early",
      label: "Early",
      daysToMaturity: "60–70",
      gddTarget: 900,
      examples: [
        { name: "Snowball", note: "a classic early cauliflower with reasonable reliability" }
      ]
    },
    {
      key: "mid",
      label: "Mid-season",
      daysToMaturity: "70–85",
      gddTarget: 1000,
      examples: [
        { name: "Amazing", note: "productive but sensitive to timing and conditions" }
      ]
    }
  ],

  oneSentenceSummary: "Cauliflower can work well but requires careful timing and stable conditions.",
  shortSeasonStrategy: "Use transplants and aim for consistent cool growth conditions.",
  commonFailureMode: "Temperature swings can prevent proper head formation."
},
garlic: {
  relatedCrops: ["onions"],

  plantingMethod: "direct-sow",
  startingMethod: "outdoors",
  directSowRecommended: true,

  daysAfterLastFrostDirectSow: null,

  gddBase: 40,
  gddTargetTypical: 1200,
  maturityFrom: "overwintered",
  daysToMaturityTypical: "240–270",

  frostTolerance: "hardy",
  minSafeTempF: 0,
  protectedCultureBenefit: "low",

  varietyClasses: [
    {
      key: "hardneck",
      label: "Hardneck",
      daysToMaturity: "full season",
      gddTarget: 1200,
      examples: [
        { name: "Music", note: "well adapted to cold climates and widely grown in northern regions" }
      ]
    },
    {
      key: "softneck",
      label: "Softneck",
      daysToMaturity: "full season",
      gddTarget: 1200,
      examples: [
        { name: "California Early", note: "more common in milder climates but still grown in colder areas" }
      ]
    }
  ],

  oneSentenceSummary: "Garlic is planted in fall and overwinters, making it very reliable in cold climates.",
  shortSeasonStrategy: "Plant in fall and let natural overwintering provide the growing advantage.",
  commonFailureMode: "Late planting or poor establishment before winter reduces bulb size."
},

};



const RAW_CROPS = [
{
  id: "broccoli",
  name: "Broccoli",
  slug: "broccoli",
  order: 1,
  indexBlurb: "Cool-season staple—start indoors and transplant early to beat heat.",
  description: "Broccoli grows best in cool weather—use an indoor start and a clear transplant window to stay ahead of heat in short seasons.",
  tagline: "A cool-season crop that rewards early timing.",
  lede: "Broccoli performs best when it grows through cool spring temperatures. In short seasons, start indoors, transplant on time, and aim to mature heads before summer heat speeds up bolting.",
  seasonType: "cool",
  frostTolerance: "light (tolerates light frost)",
  daysToMaturity: [55, 90],
  indoorStartWeeks: [8, 6],
  transplantWeeks: [2, 0],
  directSowWeeks: [4, 2],
  relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
  singularName: "broccoli",

  key: "broccoli",
  aliases: [],

  detailPartial: "crops/broccoli-details.njk",
  gddBaseF: 40,
  gddTargetTypical: 900,
  category: "cool-season",

  taxonomy: {
    seasonType: "cool",
    category: "cool-season"
  },

  editorial: {
    indexBlurb: "Cool-season staple—start indoors and transplant early to beat heat.",
    description: "Broccoli grows best in cool weather—use an indoor start and a clear transplant window to stay ahead of heat in short seasons.",
    tagline: "A cool-season crop that rewards early timing.",
    lede: "Broccoli performs best when it grows through cool spring temperatures. In short seasons, start indoors, transplant on time, and aim to mature heads before summer heat speeds up bolting.",
    detailPartial: "crops/broccoli-details.njk"
  },

  planning: {
    daysToMaturity: [55, 90],
    indoorStartWeeks: [8, 6],
    transplantWeeks: [2, 0],
    directSowWeeks: [4, 2],

    plantingMethod: "transplant",
    startingMethod: "indoors",
    transplantRecommended: true,
    directSowRecommended: false,

    daysBeforeLastFrostStartIndoors: 49,
    daysAfterLastFrostPlantOut: -7,
    daysAfterLastFrostDirectSow: null,

    maturityFrom: "transplant",
    daysToMaturityTypical: "60–75"
  },

  climate: {
    frostToleranceLabel: "light (tolerates light frost)",
    frostTolerance: "light",
    minSafeTempF: 28,
    gddBaseF: 40,
    gddTargetTypical: 900,
    protectedCultureBenefit: "low"
  },

  cropCity: {
    oneSentenceSummary: "Broccoli is a strong cool-season crop when planted early enough to mature before summer heat builds.",
    shortSeasonStrategy: "Start indoors, transplant into cool conditions, and favor earlier broccoli where spring warmth arrives quickly.",
    commonFailureMode: "Late planting can push heading into warmer weather, which increases bolting and reduces head quality.",
    relatedCrops: ["cabbage", "peas"],

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "55–60",
        gddTarget: 750,
        examples: [
          {
            name: "De Cicco",
            note: "an early broccoli often chosen where gardeners want flexibility and quicker harvest"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "60–68",
        gddTarget: 850,
        examples: [
          {
            name: "Packman",
            note: "a dependable standard with good short-season practicality"
          },
          {
            name: "Green Magic",
            note: "a strong early hybrid that often handles the main spring window well"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "68–78",
        gddTarget: 950,
        examples: [
          {
            name: "Belstar",
            note: "productive and reliable where the season gives a reasonable cool-weather runway"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "78–90",
        gddTarget: 1050,
        examples: [
          {
            name: "Marathon",
            note: "more exposed if spring is delayed or summer heat arrives early"
          }
        ]
      }
    ]
  },

  tools: {
    seedStartPlanner: true,
    firstFrostPlanner: true,
    gddPlanner: true,
    cropCity: true
  }
},
  {
    id: "kale",
    name: "Kale",
    slug: "kale",
    order: 2,
    indexBlurb: "Hardy greens—reliable spring and fall crop in short seasons.",
    description: "Kale is one of the most forgiving short-season crops—start early and keep it growing into fall.",
    tagline: "Cold-tolerant greens with a long harvest window.",
    lede: "Kale handles cool weather better than most crops. In short seasons, the main advantage is flexibility: you can start early, transplant into cool conditions, and keep harvesting as fall temperatures drop.",
    seasonType: "cool",
    frostTolerance: "hardy (handles multiple frosts)",
    daysToMaturity: [45, 75],
    indoorStartWeeks: [6, 4],
    transplantWeeks: [4, 1],
    directSowWeeks: [4, 2],
    relatedTools: ["seed-start-planner", "first-frost-planner"],
    singularName: "kale"
  },
  {
    id: "spinach",
    name: "Spinach",
    slug: "spinach",
    order: 3,
    indexBlurb: "Fast cool-season crop—best timed for spring and late summer sowing.",
    description: "Spinach prefers cool temperatures—timing matters more than fertilizing in short seasons.",
    tagline: "Quick greens that prefer cool weather.",
    lede: "Spinach grows quickly when temperatures are cool and often struggles once heat arrives. In short seasons, the key is sowing early for spring harvest and again later so plants mature into fall conditions.",
    seasonType: "cool",
    frostTolerance: "hardy (handles multiple frosts)",
    daysToMaturity: [35, 55],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: [6, 2],
    relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
    singularName: "spinach"
  },
  {
    id: "tomatoes",
    name: "Tomatoes",
    slug: "tomatoes",
    order: 4,
    indexBlurb: "Warm-season staple—start indoors and transplant after stable nights.",
    description: "Tomatoes can succeed in short seasons with the right indoor start window and early varieties.",
    tagline: "Frost-sensitive, high reward—timing is everything.",
    lede: "Tomatoes are tender warm-season plants that don’t tolerate frost and slow down in cool nights. In short seasons, start indoors on time, transplant after frost risk declines, and prioritize earlier varieties for reliable harvest.",
    seasonType: "warm",
    frostTolerance: "None (protect from all frost)",
    daysToMaturity: [55, 85],
    indoorStartWeeks: [8, 6],
    transplantWeeks: [3, 1],
    directSowWeeks: null,
    relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
    singularName: "tomato"
  },
  {
    id: "peppers",
    name: "Peppers",
    slug: "peppers",
    order: 5,
    indexBlurb: "Heat-loving crop—start early indoors and avoid cold soil.",
    description: "Peppers need a longer runway than tomatoes—start indoors early and protect heat.",
    tagline: "Slow to start, high payoff—needs warmth to thrive.",
    lede: "Peppers are more cold-sensitive than tomatoes and often stall if transplanted into cool conditions. In short seasons, start indoors early, wait for warm nights and soil, and choose varieties that mature reliably before fall cool-down.",
    seasonType: "warm",
    frostTolerance: "None (protect from all frost)",
    daysToMaturity: [60, 100],
    indoorStartWeeks: [10, 8],
    transplantWeeks: [4, 2],
    directSowWeeks: null,
    relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
    singularName: "pepper"
  },
  {
    id: "lettuce",
    name: "Lettuce",
    slug: "lettuce",
    order: 6,
    indexBlurb: "Fast, cool-season greens—best when timed to avoid heat.",
    description: "Lettuce is one of the easiest short-season wins—success is mostly about timing and steady moisture.",
    tagline: "Cool-weather greens that reward good timing.",
    lede: "Lettuce grows quickly in cool conditions. In short seasons, the main goal is to get it established early and keep it from bolting in summer heat.",
    seasonType: "cool",
    frostTolerance: "light (tolerates light frost)",
    daysToMaturity: [30, 60],
    indoorStartWeeks: [6, 4],
    transplantWeeks: [-2, 0],
    directSowWeeks: [6, 2],
    relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
    singularName: "lettuce"
  },
{
  id: "cabbage",
  name: "Cabbage",
  slug: "cabbage",
  order: 7,
  indexBlurb: "Cool-season staple—start early and transplant with protection if needed.",
  description: "Cabbage is dependable in short seasons when you start early and transplant on time—heat and delays are the main problems.",
  tagline: "A cool-season staple that likes an early start.",
  lede: "Cabbage handles cool weather well, but it needs time. Start indoors, transplant into cool spring conditions, and plan harvest before peak heat where possible.",
  seasonType: "cool",
  frostTolerance: "light to moderate (tolerates light frost)",
  daysToMaturity: [60, 110],
  indoorStartWeeks: [10, 8],
  transplantWeeks: [-4, -2],
  directSowWeeks: [4, 2],
  relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
  singularName: "cabbage",

  key: "cabbage",
  aliases: [],

  detailPartial: "crops/cabbage-details.njk",
  gddBaseF: 40,
  gddTargetTypical: 1000,
  category: "cool-season",

  taxonomy: {
    seasonType: "cool",
    category: "cool-season"
  },

  editorial: {
    indexBlurb: "Cool-season staple—start early and transplant with protection if needed.",
    description: "Cabbage is dependable in short seasons when you start early and transplant on time—heat and delays are the main problems.",
    tagline: "A cool-season staple that likes an early start.",
    lede: "Cabbage handles cool weather well, but it needs time. Start indoors, transplant into cool spring conditions, and plan harvest before peak heat where possible.",
    detailPartial: "crops/cabbage-details.njk"
  },

  planning: {
    daysToMaturity: [60, 110],
    indoorStartWeeks: [10, 8],
    transplantWeeks: [-4, -2],
    directSowWeeks: [4, 2],

    plantingMethod: "transplant",
    startingMethod: "indoors",
    transplantRecommended: true,
    directSowRecommended: false,

    daysBeforeLastFrostStartIndoors: 56,
    daysAfterLastFrostPlantOut: -21,
    daysAfterLastFrostDirectSow: null,

    maturityFrom: "transplant",
    daysToMaturityTypical: "70–90"
  },

  climate: {
    frostToleranceLabel: "light to moderate (tolerates light frost)",
    frostTolerance: "light",
    minSafeTempF: 28,
    gddBaseF: 40,
    gddTargetTypical: 1000,
    protectedCultureBenefit: "low"
  },

  cropCity: {
    oneSentenceSummary: "Cabbage is usually very workable in cool climates if it gets started early enough.",
    shortSeasonStrategy: "Use transplants, plant into cool spring conditions, and favor earlier heads where the spring window is tighter.",
    commonFailureMode: "Late starts can leave heads sizing up into warmer weather, which raises splitting and quality issues.",
    relatedCrops: ["broccoli", "onions"],

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "60–70",
        gddTarget: 800,
        examples: [
          {
            name: "Golden Acre",
            note: "a classic early cabbage with strong practical fit in shorter seasons"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "70–80",
        gddTarget: 900,
        examples: [
          {
            name: "Stonehead",
            note: "reliable and approachable, especially where gardeners want a firm early head"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "80–95",
        gddTarget: 1000,
        examples: [
          {
            name: "Cheers",
            note: "productive and strong where the season offers a comfortable cool run"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "95–110",
        gddTarget: 1150,
        examples: [
          {
            name: "Storage No. 4",
            note: "better suited where the growing window gives longer room for finishing"
          }
        ]
      }
    ]
  },

  tools: {
    seedStartPlanner: true,
    firstFrostPlanner: true,
    gddPlanner: true,
    cropCity: true
  }
},
  {
    id: "beans",
    name: "Beans",
    slug: "beans",
    order: 8,
    indexBlurb: "Direct-sow warm-season crop—wait for soil warmth, not just the calendar.",
    description: "Beans are simple and productive in short seasons when you wait for warm soil and choose varieties that mature quickly.",
    tagline: "Direct sow, warm soil, and quick wins.",
    lede: "Beans dislike cold soil. In short seasons, the reliable approach is to sow after last frost when soil has warmed, and pick varieties with shorter maturity.",
    seasonType: "warm",
    frostTolerance: "None (protect from all frost)",
    daysToMaturity: [50, 70],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: [1, 3],
    relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
    singularName: "bean"
  },
{
  id: "cucumbers",
  name: "Cucumbers",
  slug: "cucumbers",
  order: 9,
  indexBlurb: "Warm-season vines—start only if you can give consistent warmth.",
  description: "Cucumbers can work in short seasons with warm soil, sun, and varieties that mature quickly—cold nights slow everything down.",
  tagline: "Warm soil first, then fast growth.",
  lede: "Cucumbers hate cold starts. In short seasons, focus on warm planting conditions and early varieties so you’re harvesting before fall cool-down.",
  seasonType: "warm",
  frostTolerance: "None (protect from all frost)",
  daysToMaturity: [45, 70],
  indoorStartWeeks: [4, 3],
  transplantWeeks: [3, 2],
  directSowWeeks: [2, 4],
  relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
  singularName: "cucumber",

  key: "cucumbers",
  aliases: ["cucumber"],

  detailPartial: "crops/cucumbers-details.njk",
  gddBaseF: 50,
  gddTargetTypical: 800,
  category: "warm-season",

  taxonomy: {
    seasonType: "warm",
    category: "warm-season"
  },

  editorial: {
    indexBlurb: "Warm-season vines—start only if you can give consistent warmth.",
    description: "Cucumbers can work in short seasons with warm soil, sun, and varieties that mature quickly—cold nights slow everything down.",
    tagline: "Warm soil first, then fast growth.",
    lede: "Cucumbers hate cold starts. In short seasons, focus on warm planting conditions and early varieties so you’re harvesting before fall cool-down.",
    detailPartial: "crops/cucumbers-details.njk"
  },

  planning: {
    daysToMaturity: [45, 70],
    indoorStartWeeks: [4, 3],
    transplantWeeks: [3, 2],
    directSowWeeks: [2, 4],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: 7,

    maturityFrom: "direct-sow",
    daysToMaturityTypical: "50–60"
  },

  climate: {
    frostToleranceLabel: "None (protect from all frost)",
    frostTolerance: "tender",
    minSafeTempF: 32,
    gddBaseF: 50,
    gddTargetTypical: 800,
    protectedCultureBenefit: "medium"
  },

  cropCity: {
    oneSentenceSummary: "Cucumbers need warm planting conditions and enough summer heat to start producing quickly.",
    shortSeasonStrategy: "Direct sow only after soil has warmed, or use the warmest sites and earlier varieties if the season is tight.",
    commonFailureMode: "Cold soil and cool early growth can delay flowering and push harvest too late.",
    relatedCrops: ["zucchini", "beans"],

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "45–50",
        gddTarget: 700,
        examples: [
          {
            name: "Cool Breeze",
            note: "an earlier type that is more forgiving where gardeners want a faster start"
          },
          {
            name: "Suyo Long",
            note: "can be productive in a decent season, especially where warmth arrives on time"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "50–55",
        gddTarget: 800,
        examples: [
          {
            name: "Marketmore 76",
            note: "a classic slicing cucumber that often fits reasonably well when planted into warmth"
          },
          {
            name: "Spacemaster",
            note: "compact and relatively approachable where gardeners want fast returns"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "55–65",
        gddTarget: 900,
        examples: [
          {
            name: "Straight Eight",
            note: "productive and well known, but happier when the season is not especially compressed"
          },
          {
            name: "Telegraph",
            note: "better suited to supportive warmth or protected growing"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "65–75",
        gddTarget: 1000,
        examples: [
          {
            name: "Lemon",
            note: "fun and productive, but more exposed if summer heat arrives late"
          }
        ]
      }
    ]
  },

  tools: {
    seedStartPlanner: true,
    firstFrostPlanner: true,
    gddPlanner: true,
    cropCity: true
  }
},
{
  id: "zucchini",
  name: "Zucchini",
  slug: "zucchini",
  order: 10,
  indexBlurb: "Warm-season squash—direct sow after last frost once soil is warm.",
  description: "Zucchini is productive but temperature-sensitive—warm soil and steady watering matter more than fertilizing early.",
  tagline: "Warm soil, steady water, fast harvest.",
  lede: "Zucchini grows quickly once conditions are warm. In short seasons, avoid cold starts and aim for early fruit set before nights cool down.",
  seasonType: "warm",
  frostTolerance: "None (protect from all frost)",
  daysToMaturity: [45, 65],
  indoorStartWeeks: [4, 3],
  transplantWeeks: [3, 2],
  directSowWeeks: [2, 4],
  relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
  singularName: "zucchini",

  key: "zucchini",
  aliases: [],

  detailPartial: "crops/zucchini-details.njk",
  gddBaseF: 50,
  gddTargetTypical: 750,
  category: "warm-season",

  taxonomy: {
    seasonType: "warm",
    category: "warm-season"
  },

  editorial: {
    indexBlurb: "Warm-season squash—direct sow after last frost once soil is warm.",
    description: "Zucchini is productive but temperature-sensitive—warm soil and steady watering matter more than fertilizing early.",
    tagline: "Warm soil, steady water, fast harvest.",
    lede: "Zucchini grows quickly once conditions are warm. In short seasons, avoid cold starts and aim for early fruit set before nights cool down.",
    detailPartial: "crops/zucchini-details.njk"
  },

  planning: {
    daysToMaturity: [45, 65],
    indoorStartWeeks: [4, 3],
    transplantWeeks: [3, 2],
    directSowWeeks: [2, 4],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: 7,

    maturityFrom: "direct-sow",
    daysToMaturityTypical: "50–55"
  },

  climate: {
    frostToleranceLabel: "None (protect from all frost)",
    frostTolerance: "tender",
    minSafeTempF: 32,
    gddBaseF: 50,
    gddTargetTypical: 750,
    protectedCultureBenefit: "low"
  },

  cropCity: {
    oneSentenceSummary: "Zucchini is one of the more manageable warm-season crops when planted into genuinely warm soil.",
    shortSeasonStrategy: "Plant promptly after frost risk passes and favor earlier summer squash types where the season is tighter.",
    commonFailureMode: "Cold starts slow plants down and delay early fruit production.",
    relatedCrops: ["cucumbers", "beans"],

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "45–48",
        gddTarget: 675,
        examples: [
          {
            name: "Dunja",
            note: "productive and relatively quick, with a good fit for gardeners who want early harvest"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "48–52",
        gddTarget: 750,
        examples: [
          {
            name: "Black Beauty",
            note: "a classic zucchini that often works well when planted on time"
          },
          {
            name: "Raven",
            note: "vigorous and fairly approachable where warmth arrives on schedule"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "52–58",
        gddTarget: 850,
        examples: [
          {
            name: "Costata Romanesco",
            note: "excellent quality, though it benefits from a reasonably supportive season"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "58–65",
        gddTarget: 950,
        examples: [
          {
            name: "Cocozelle",
            note: "more exposed where the warm season is short or delayed"
          }
        ]
      }
    ]
  },

  tools: {
    seedStartPlanner: true,
    firstFrostPlanner: true,
    gddPlanner: true,
    cropCity: true
  }
},
{
  id: "carrots",
  name: "Carrots",
  slug: "carrots",
  order: 11,
  indexBlurb: "Direct-sown roots—sow early in workable soil; count back from first frost for fall.",
  description: "Carrots are a cool-season, direct-sow crop—short-season success comes from early sowing and choosing days-to-maturity that fit before fall frost slows growth.",
  tagline: "Cool-season roots that reward early sowing.",
  lede: "Carrots grow best in cool temperatures and can handle light frost once established. In short seasons, sow as soon as soil is workable and plan fall sowings backward from first frost so roots size up before cold nights slow growth.",
  seasonType: "cool",
  frostTolerance: "light to moderate (tolerates light frost; hard freezes can damage tops)",
  daysToMaturity: [60, 80],
  indoorStartWeeks: null,
  transplantWeeks: null,
  directSowWeeks: [-2, 2],
  relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
  singularName: "carrot",

  key: "carrots",
  aliases: ["carrot"],

  detailPartial: "crops/carrots-details.njk",
  gddBaseF: 40,
  gddTargetTypical: 750,
  category: "cool-season",

  taxonomy: {
    seasonType: "cool",
    category: "cool-season"
  },

  editorial: {
    indexBlurb: "Direct-sown roots—sow early in workable soil; count back from first frost for fall.",
    description: "Carrots are a cool-season, direct-sow crop—short-season success comes from early sowing and choosing days-to-maturity that fit before fall frost slows growth.",
    tagline: "Cool-season roots that reward early sowing.",
    lede: "Carrots grow best in cool temperatures and can handle light frost once established. In short seasons, sow as soon as soil is workable and plan fall sowings backward from first frost so roots size up before cold nights slow growth.",
    detailPartial: "crops/carrots-details.njk"
  },

  planning: {
    daysToMaturity: [60, 80],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: [-2, 2],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: -7,

    maturityFrom: "direct-sow",
    daysToMaturityTypical: "65–75"
  },

  climate: {
    frostToleranceLabel: "light to moderate (tolerates light frost; hard freezes can damage tops)",
    frostTolerance: "light",
    minSafeTempF: 28,
    gddBaseF: 40,
    gddTargetTypical: 750,
    protectedCultureBenefit: "low"
  },

  cropCity: {
    oneSentenceSummary: "Carrots are usually a good fit for cool climates when sown early enough into workable soil.",
    shortSeasonStrategy: "Direct sow as early as the bed can be prepared, and lean toward earlier carrots if you want a faster harvest.",
    commonFailureMode: "Late sowing shortens the time roots have to size up before cool fall conditions slow growth.",
    relatedCrops: ["beets", "onions"],

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "55–60",
        gddTarget: 650,
        examples: [
          {
            name: "Amsterdam",
            note: "quick and well suited where gardeners want a fast early carrot"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "60–68",
        gddTarget: 750,
        examples: [
          {
            name: "Nelson",
            note: "a reliable early Nantes-type with broad short-season appeal"
          },
          {
            name: "Yaya",
            note: "smooth and quick, with a strong fit for earlier harvest goals"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "68–75",
        gddTarget: 850,
        examples: [
          {
            name: "Bolero",
            note: "productive and dependable where the season gives enough room"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "75–80",
        gddTarget: 925,
        examples: [
          {
            name: "Danvers 126",
            note: "a classic storage-leaning type that benefits from a little more runway"
          }
        ]
      }
    ]
  },

  tools: {
    seedStartPlanner: true,
    firstFrostPlanner: true,
    gddPlanner: true,
    cropCity: true
  }
},
  {
    id: "beets",
    name: "Beets",
    slug: "beets",
    order: 12,
    indexBlurb: "Reliable cool-season roots—direct sow near last frost; strong fall fit.",
    description: "Beets handle cool weather well—direct sow early and use days-to-maturity to set clear fall cutoffs from first frost.",
    tagline: "Direct-sown roots that fit spring and fall.",
    lede: "Beets tolerate cool conditions and can handle light frosts once established. In short seasons, sow into workable soil near last frost, and plan fall roots by counting back from first frost using variety days-to-maturity.",
    seasonType: "cool",
    frostTolerance: "light (tolerates light frost; hard freezes can damage foliage)",
    daysToMaturity: [50, 70],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: [-2, 2],
    relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
    singularName: "beet"
  },
  {
    id: "radishes",
    name: "Radishes",
    slug: "radishes",
    order: 13,
    indexBlurb: "Fast cool-season crop—ideal for tight frost windows and fall sowings.",
    description: "Radishes mature quickly in cool weather—timing is mostly about staying out of heat and using first frost to plan late sowings.",
    tagline: "Short maturity—built for frost-first timing.",
    lede: "Radishes are one of the fastest crops you can grow and perform best in cool temperatures. In short seasons, sow early in spring and again late enough that roots mature into fall before hard freezes.",
    seasonType: "cool",
    frostTolerance: "light to moderate (tolerates light frost; growth slows in cold nights)",
    daysToMaturity: [20, 35],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: [-4, 4],
    relatedTools: ["seed-start-planner", "first-frost-planner"],
    singularName: "radish"
  },
{
  id: "onions",
  name: "Onions",
  slug: "onions",
  order: 14,
  indexBlurb: "Long-runway crop—start indoors early; transplant before or around last frost.",
  description: "Onions need time. In short seasons, early indoor starts and early transplanting are the reliable path to mature bulbs.",
  tagline: "Start early indoors—bulb size depends on runway.",
  lede: "Onions are time-dependent. In short seasons, start seeds early indoors and transplant into cool spring conditions so plants build size before bulbing and before fall cool-down slows growth.",
  seasonType: "cool",
  frostTolerance: "light (tolerates light frost once established)",
  daysToMaturity: [90, 120],
  indoorStartWeeks: [12, 10],
  transplantWeeks: [-4, -2],
  directSowWeeks: null,
  relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
  singularName: "onion",

  key: "onions",
  aliases: ["onion"],

  detailPartial: "crops/onions-details.njk",
  gddBaseF: 45,
  gddTargetTypical: 1300,
  category: "cool-season",

  taxonomy: {
    seasonType: "cool",
    category: "cool-season"
  },

  editorial: {
    indexBlurb: "Long-runway crop—start indoors early; transplant before or around last frost.",
    description: "Onions need time. In short seasons, early indoor starts and early transplanting are the reliable path to mature bulbs.",
    tagline: "Start early indoors—bulb size depends on runway.",
    lede: "Onions are time-dependent. In short seasons, start seeds early indoors and transplant into cool spring conditions so plants build size before bulbing and before fall cool-down slows growth.",
    detailPartial: "crops/onions-details.njk"
  },

  planning: {
    daysToMaturity: [90, 120],
    indoorStartWeeks: [12, 10],
    transplantWeeks: [-4, -2],
    directSowWeeks: null,

    plantingMethod: "transplant",
    startingMethod: "indoors",
    transplantRecommended: true,
    directSowRecommended: false,

    daysBeforeLastFrostStartIndoors: 77,
    daysAfterLastFrostPlantOut: -21,
    daysAfterLastFrostDirectSow: null,

    maturityFrom: "transplant",
    daysToMaturityTypical: "95–110"
  },

  climate: {
    frostToleranceLabel: "light (tolerates light frost once established)",
    frostTolerance: "light",
    minSafeTempF: 28,
    gddBaseF: 45,
    gddTargetTypical: 1300,
    protectedCultureBenefit: "low"
  },

  cropCity: {
    oneSentenceSummary: "Onions usually work well in cool climates, but they need an early start to size up fully before the season closes.",
    shortSeasonStrategy: "Start early indoors and transplant into cool spring weather so bulbs have maximum time to develop.",
    commonFailureMode: "Starting too late reduces plant size before bulbing, which usually means smaller harvestable onions.",
    relatedCrops: ["potatoes", "carrots"],

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "90–95",
        gddTarget: 1100,
        examples: [
          {
            name: "Walla Walla",
            note: "large and popular, but still best when started early enough to build size"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "95–105",
        gddTarget: 1200,
        examples: [
          {
            name: "Copra",
            note: "a dependable storage onion with good all-around practicality"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "105–115",
        gddTarget: 1300,
        examples: [
          {
            name: "Redwing",
            note: "a strong red storage type where the season is reasonably supportive"
          },
          {
            name: "Patterson",
            note: "a solid keeping onion that wants enough runway to size up well"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "115–120",
        gddTarget: 1400,
        examples: [
          {
            name: "Ailsa Craig",
            note: "more exposed in shorter seasons because it benefits from a longer finishing run"
          }
        ]
      }
    ]
  },

  tools: {
    seedStartPlanner: true,
    firstFrostPlanner: true,
    gddPlanner: true,
    cropCity: true
  }
},
  {
    id: "swiss-chard",
    name: "Swiss Chard",
    slug: "swiss-chard",
    order: 15,
    indexBlurb: "Flexible cool-season greens—handles cool nights and keeps producing into fall.",
    description: "Swiss chard is durable in short seasons—start early, transplant around last frost, and harvest as fall temperatures drop.",
    tagline: "A cool-season workhorse with a long harvest window.",
    lede: "Swiss chard is resilient across a wide temperature range. In short seasons, it’s valuable because it can be started early, planted into cool conditions, and harvested into fall as temperatures drop.",
    seasonType: "cool",
    frostTolerance: "light to moderate (tolerates light frost; hard freezes can damage leaves)",
    daysToMaturity: [50, 70],
    indoorStartWeeks: [6, 4],
    transplantWeeks: [-2, 0],
    directSowWeeks: [-2, 2],
    relatedTools: ["seed-start-planner", "first-frost-planner"],
    singularName: "swiss chard"
  },
  {
    id: "cauliflower",
    name: "Cauliflower",
    slug: "cauliflower",
    order: 16,
    indexBlurb: "Timing-sensitive cool-season crop—start indoors and transplant on schedule.",
    description: "Cauliflower rewards precision: start indoors, transplant into cool conditions, and avoid heat that disrupts head formation.",
    tagline: "A precision cool-season crop—hit the window.",
    lede: "Cauliflower is less forgiving than many brassicas. In short seasons, start indoors, transplant on time into cool spring conditions, and aim to mature before sustained heat affects head quality.",
    seasonType: "cool",
    frostTolerance: "light (tolerates light frost; protect from hard freezes)",
    daysToMaturity: [60, 100],
    indoorStartWeeks: [8, 6],
    transplantWeeks: [2, 0],
    directSowWeeks: null,
    relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
    singularName: "cauliflower"
  },
{
  id: "peas",
  name: "Peas",
  slug: "peas",
  order: 17,
  indexBlurb: "Hardy spring crop—direct sow early (often before last frost) when soil is workable.",
  description: "Peas thrive in cool weather—short-season success comes from early sowing into workable soil and harvesting before heat.",
  tagline: "Cool-weather crop that can be sown early.",
  lede: "Peas are one of the most cold-tolerant garden crops and perform best in cool spring temperatures. In short seasons, sow early into workable soil so flowering and pods set before heat slows production.",
  seasonType: "cool",
  frostTolerance: "hardy (handles multiple frosts)",
  daysToMaturity: [55, 75],
  indoorStartWeeks: null,
  transplantWeeks: null,
  directSowWeeks: [-6, -2],
  relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
  singularName: "pea",

  key: "peas",
  aliases: ["pea"],

  detailPartial: "crops/peas-details.njk",
  gddBaseF: 40,
  gddTargetTypical: 600,
  category: "cool-season",

  taxonomy: {
    seasonType: "cool",
    category: "cool-season"
  },

  editorial: {
    indexBlurb: "Hardy spring crop—direct sow early (often before last frost) when soil is workable.",
    description: "Peas thrive in cool weather—short-season success comes from early sowing into workable soil and harvesting before heat.",
    tagline: "Cool-weather crop that can be sown early.",
    lede: "Peas are one of the most cold-tolerant garden crops and perform best in cool spring temperatures. In short seasons, sow early into workable soil so flowering and pods set before heat slows production.",
    detailPartial: "crops/peas-details.njk"
  },

  planning: {
    daysToMaturity: [55, 75],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: [-6, -2],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: -28,

    maturityFrom: "direct-sow",
    daysToMaturityTypical: "55–65"
  },

  climate: {
    frostToleranceLabel: "hardy (handles multiple frosts)",
    frostTolerance: "hardy",
    minSafeTempF: 24,
    gddBaseF: 40,
    gddTargetTypical: 600,
    protectedCultureBenefit: "low"
  },

  cropCity: {
    oneSentenceSummary: "Peas are one of the easiest cool-season crops to fit into shorter climates when planted early.",
    shortSeasonStrategy: "Direct sow as early as workable soil allows so flowering and pod fill happen before warmer weather arrives.",
    commonFailureMode: "Late sowing pushes production into heat, which usually shortens the harvest window.",
    relatedCrops: ["broccoli", "potatoes"],

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "55–58",
        gddTarget: 500,
        examples: [
          {
            name: "Alaska",
            note: "a classic early pea with a strong fit for cool spring planting"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "58–62",
        gddTarget: 600,
        examples: [
          {
            name: "Little Marvel",
            note: "compact and dependable, with a good fit for many shorter seasons"
          },
          {
            name: "Sugar Ann",
            note: "a favorite early snap pea where gardeners want quick spring production"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "62–70",
        gddTarget: 700,
        examples: [
          {
            name: "Green Arrow",
            note: "productive and popular, but still best when planted promptly into spring conditions"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "70–75",
        gddTarget: 800,
        examples: [
          {
            name: "Tall Telephone",
            note: "more exposed where spring turns warm quickly or the planting is delayed"
          }
        ]
      }
    ]
  },

  tools: {
    seedStartPlanner: true,
    firstFrostPlanner: true,
    gddPlanner: true,
    cropCity: true
  }
},
  {
    id: "winter-squash",
    name: "Winter Squash",
    slug: "winter-squash",
    order: 18,
    indexBlurb: "Long warm-season crop—plant into warm soil and make sure it finishes before first frost.",
    description: "Winter squash is a long-maturity warm-season crop—short-season success depends on warm planting conditions and enough time to mature before fall frost.",
    tagline: "Warm soil + long runway—first frost sets the limit.",
    lede: "Winter squash is frost-tender and time-hungry. In short seasons, you’re balancing planting after last frost with enough days-to-maturity to finish fruit before first frost ends the season.",
    seasonType: "warm",
    frostTolerance: "None (protect from all frost)",
    daysToMaturity: [80, 110],
    indoorStartWeeks: [4, 3],
    transplantWeeks: [3, 2],
    directSowWeeks: [1, 3],
    relatedTools: ["seed-start-planner", "first-frost-planner", "gdd-planner"],
    singularName: "winter squash"
  },
  {
    id: "garlic",
    name: "Garlic",
    slug: "garlic",
    order: 19,
    indexBlurb: "Fall-planted crop—frost-timed establishment, harvested next summer.",
    description: "Garlic is usually planted in fall and harvested the following summer. It’s frost-hardy once established but doesn’t match single-season maturity timing.",
    tagline: "Planted before winter, harvested next summer.",
    lede: "Garlic is planted in fall, establishes roots before freeze-up, then resumes growth in spring for a summer harvest. It’s frost-timed, but it doesn’t fit a single-season first-frost maturity cutoff.",
    seasonType: "cool",
    frostTolerance: "hardy (handles multiple frosts once established)",
    daysToMaturity: [240, 300],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: null,
    relatedTools: [],
    singularName: "garlic"
  },
  {
    id: "sweet-corn",
    name: "Sweet Corn",
    slug: "corn-sweet",
    order: 20,
    indexBlurb: "Warm-season classic—needs enough heat units before frost.",
    description: "Sweet corn is a warm-season crop that depends on heat accumulation. In short seasons, variety selection and timely planting determine whether ears finish before fall frost.",
    tagline: "Heat-hungry, variety-dependent, and sensitive to timing.",
    lede: "Sweet corn matures on a heat schedule. In cooler summers, choose earlier varieties and plant when soil is warm enough to germinate reliably.",
    seasonType: "warm",
    frostTolerance: "none (tender—protect from frost)",
    daysToMaturity: [70, 100],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: [2, 4],
    relatedTools: ["gdd-planner", "seed-start-planner", "first-frost-planner"],
    singularName: "sweet corn"
  },
{
  id: "potatoes",
  name: "Potatoes",
  slug: "potato",
  order: 21,
  indexBlurb: "Cool-season staple—can be planted before last frost, but needs time to finish.",
  description: "Potatoes tolerate cool weather and can be planted before the last frost date. In short seasons, planting date and variety maturity length are the main constraints.",
  tagline: "A cool-season crop that rewards early planting.",
  lede: "Plant seed potatoes as soon as soil can be worked. Earlier planting helps long-season varieties finish before fall frost, but protect new growth if a hard freeze is forecast.",
  seasonType: "cool",
  frostTolerance: "light (new growth can be damaged by hard freezes)",
  daysToMaturity: [70, 120],
  indoorStartWeeks: null,
  transplantWeeks: null,
  directSowWeeks: [-4, -2],
  relatedTools: ["gdd-planner", "seed-start-planner", "first-frost-planner"],
  singularName: "potato",

  key: "potatoes",
  aliases: ["potato"],

  detailPartial: "crops/potato-details.njk",
  gddBaseF: 45,
  gddTargetTypical: 1100,
  category: "cool-season",

  taxonomy: {
    seasonType: "cool",
    category: "cool-season"
  },

  editorial: {
    indexBlurb: "Cool-season staple—can be planted before last frost, but needs time to finish.",
    description: "Potatoes tolerate cool weather and can be planted before the last frost date. In short seasons, planting date and variety maturity length are the main constraints.",
    tagline: "A cool-season crop that rewards early planting.",
    lede: "Plant seed potatoes as soon as soil can be worked. Earlier planting helps long-season varieties finish before fall frost, but protect new growth if a hard freeze is forecast.",
    detailPartial: "crops/potato-details.njk"
  },

  planning: {
    daysToMaturity: [70, 120],
    indoorStartWeeks: null,
    transplantWeeks: null,
    directSowWeeks: [-4, -2],

    plantingMethod: "direct-sow",
    startingMethod: "outdoors",
    transplantRecommended: false,
    directSowRecommended: true,

    daysBeforeLastFrostStartIndoors: null,
    daysAfterLastFrostPlantOut: null,
    daysAfterLastFrostDirectSow: -21,

    maturityFrom: "direct-sow",
    daysToMaturityTypical: "80–100"
  },

  climate: {
    frostToleranceLabel: "light (new growth can be damaged by hard freezes)",
    frostTolerance: "light",
    minSafeTempF: 28,
    gddBaseF: 45,
    gddTargetTypical: 1100,
    protectedCultureBenefit: "low"
  },

  cropCity: {
    oneSentenceSummary: "Potatoes are usually feasible in cool climates, but longer varieties need enough season length to size up fully.",
    shortSeasonStrategy: "Plant early into workable soil and lean toward earlier potatoes where the fall window closes quickly.",
    commonFailureMode: "Late planting leaves less time for bulking before the season winds down.",
    relatedCrops: ["onions", "peas"],

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "70–80",
        gddTarget: 900,
        examples: [
          {
            name: "Yukon Gold",
            note: "widely grown and relatively approachable where gardeners want dependable earlier harvest"
          },
          {
            name: "Norland",
            note: "often chosen for earliness and good fit in shorter-season gardens"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "80–90",
        gddTarget: 1000,
        examples: [
          {
            name: "Dark Red Norland",
            note: "a familiar early potato with solid short-season appeal"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "90–105",
        gddTarget: 1100,
        examples: [
          {
            name: "Kennebec",
            note: "productive and versatile, but better with a decent amount of runway"
          },
          {
            name: "Gold Rush",
            note: "can do well where the season is supportive and planting is timely"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "105–120",
        gddTarget: 1250,
        examples: [
          {
            name: "Russet Burbank",
            note: "more exposed in short-season areas because it wants a longer finish"
          }
        ]
      }
    ]
  },

  tools: {
    seedStartPlanner: true,
    firstFrostPlanner: true,
    gddPlanner: true,
    cropCity: true
  }
},
  {
    id: "pumpkin",
    name: "Pumpkin",
    slug: "pumpkin",
    order: 22,
    indexBlurb: "Warm-season crop with a big heat demand—timing is all about beating first frost.",
    description: "Pumpkins need sustained warmth to size up and ripen. In short seasons, success comes from starting early, choosing smaller/earlier varieties, and using first frost + GDD to confirm you have enough seasonal heat.",
    tagline: "High heat demand—start early, finish before frost.",
    lede: "Pumpkins are a warm-season crop that can run out of season fast in short growing areas. The key is getting established early (often with a short indoor head start) and choosing varieties that can reliably reach maturity before your typical first fall frost.",
    seasonType: "warm",
    frostTolerance: "tender (damaged by frost; vines and fruit quality drop quickly after a hard freeze)",
    daysToMaturity: [85, 120],
    indoorStartWeeks: [2, 4],
    transplantWeeks: [1, 3],
    directSowWeeks: [0, 2],
    relatedTools: ["gdd-planner", "seed-start-planner", "first-frost-planner"],
    singularName: "pumpkin"
  }
];

const DETAIL_PARTIAL_BY_KEY = {
  beans: "crops/beans-details.njk",
  beets: "crops/beets-details.njk",
  broccoli: "crops/broccoli-details.njk",
  cabbage: "crops/cabbage-details.njk",
  carrots: "crops/carrots-details.njk",
  cauliflower: "crops/cauliflower-details.njk",
  cucumbers: "crops/cucumbers-details.njk",
  garlic: "crops/garlic-details.njk",
  kale: "crops/kale-details.njk",
  lettuce: "crops/lettuce-details.njk",
  onions: "crops/onions-details.njk",
  peas: "crops/peas-details.njk",
  peppers: "crops/peppers-details.njk",
  potatoes: "crops/potato-details.njk",
  radishes: "crops/radishes-details.njk",
  spinach: "crops/spinach-details.njk",
  "sweet-corn": "crops/corn-sweet-details.njk",
  "swiss-chard": "crops/swiss-chard-details.njk",
  tomatoes: "crops/tomatoes-details.njk",
  "winter-squash": "crops/winter-squash-details.njk",
  zucchini: "crops/zucchini-details.njk"
};

const ALIASES = {
  tomato: "tomatoes",
  tomatoes: "tomatoes",

  pepper: "peppers",
  peppers: "peppers",

  bean: "beans",
  beans: "beans",
  "bean-bush": "beans",

  cucumber: "cucumbers",
  cucumbers: "cucumbers",

  carrot: "carrots",
  carrots: "carrots",

  beet: "beets",
  beets: "beets",

  radish: "radishes",
  radishes: "radishes",

  onion: "onions",
  onions: "onions",

  pea: "peas",
  peas: "peas",

  potato: "potatoes",
  potatoes: "potatoes",

  broccoli: "broccoli",
  kale: "kale",
  spinach: "spinach",
  lettuce: "lettuce",
  cabbage: "cabbage",
  zucchini: "zucchini",
  cauliflower: "cauliflower",
  garlic: "garlic",
  pumpkin: "pumpkin",
  "winter-squash": "winter-squash",
  "winter squash": "winter-squash",

  "swiss-chard": "swiss-chard",
  "swiss chard": "swiss-chard",

  "sweet-corn": "sweet-corn",
  "sweet corn": "sweet-corn",
  "corn-sweet": "sweet-corn"
};

function inferCategoryFromSeasonType(seasonType) {
  return seasonType === "warm" ? "warm-season" : "cool-season";
}

function buildToolFlags(relatedTools = [], key) {
  const set = new Set(relatedTools);
  return {
    seedStartPlanner: set.has("seed-start-planner"),
    firstFrostPlanner: set.has("first-frost-planner"),
    gddPlanner: set.has("gdd-planner"),
    cropCity: Boolean(CROP_CITY_BY_KEY[key])
  };
}

function makeCrop(raw) {
  const key = raw.id;
  const gdd = GDD_BY_KEY[key] || null;
  const cropCity = CROP_CITY_BY_KEY[key] || null;
  const detailPartial = DETAIL_PARTIAL_BY_KEY[key] || null;
  const tools = buildToolFlags(raw.relatedTools, key);

  return {
    // existing top-level shape preserved for template compatibility
    ...raw,

    // canonical identity
    key,
    slug: raw.slug,
    singularName: raw.singularName,
    aliases: Object.keys(ALIASES).filter((alias) => ALIASES[alias] === key && alias !== key),

    // extra convenience for compatibility
    detailPartial,
    gddBaseF: gdd?.base_f ?? null,
    gddTargetTypical: cropCity?.gddTargetTypical ?? gdd?.gdd_required ?? null,
    category: cropCity?.category || gdd?.category || inferCategoryFromSeasonType(raw.seasonType),

    // nested future-facing shape
    taxonomy: {
      seasonType: raw.seasonType,
      category: cropCity?.category || gdd?.category || inferCategoryFromSeasonType(raw.seasonType)
    },

    editorial: {
      indexBlurb: raw.indexBlurb,
      description: raw.description,
      tagline: raw.tagline,
      lede: raw.lede,
      detailPartial
    },

    planning: {
      daysToMaturity: raw.daysToMaturity,
      indoorStartWeeks: raw.indoorStartWeeks,
      transplantWeeks: raw.transplantWeeks,
      directSowWeeks: raw.directSowWeeks,

      plantingMethod: cropCity?.plantingMethod || null,
      startingMethod: cropCity?.startingMethod || null,
      transplantRecommended: cropCity?.transplantRecommended ?? null,
      directSowRecommended: cropCity?.directSowRecommended ?? null,

      daysBeforeLastFrostStartIndoors: cropCity?.daysBeforeLastFrostStartIndoors ?? null,
      daysAfterLastFrostPlantOut: cropCity?.daysAfterLastFrostPlantOut ?? null,
      daysAfterLastFrostDirectSow: cropCity?.daysAfterLastFrostDirectSow ?? null,

      maturityFrom: cropCity?.maturityFrom ?? null,
      daysToMaturityTypical: cropCity?.daysToMaturityTypical ?? null
    },

    climate: {
      frostToleranceLabel: raw.frostTolerance,
      frostTolerance: cropCity?.frostTolerance ?? null,
      minSafeTempF: cropCity?.minSafeTempF ?? null,
      gddBaseF: gdd?.base_f ?? null,
      gddTargetTypical: cropCity?.gddTargetTypical ?? gdd?.gdd_required ?? null,
      protectedCultureBenefit: cropCity?.protectedCultureBenefit ?? null
    },

    cropCity: cropCity
      ? {
          oneSentenceSummary: cropCity.oneSentenceSummary,
          shortSeasonStrategy: cropCity.shortSeasonStrategy,
          commonFailureMode: cropCity.commonFailureMode,
          relatedCrops: cropCity.relatedCrops,
          varietyClasses: cropCity.varietyClasses
        }
      : null,

    tools
  };
}

const crops = RAW_CROPS.map(makeCrop);
const cropByKey = Object.fromEntries(crops.map((crop) => [crop.key, crop]));

function normalizeCropKey(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return ALIASES[normalized] || null;
}

module.exports = crops;