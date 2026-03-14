module.exports = [
  {
    key: "tomatoes",
    name: "Tomatoes",
    singularName: "tomato",
    category: "warm-season",
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

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "55–70",
        gddTarget: 850,
        examples: [
          {
            name: "Stupice",
            note: "very early and dependable, with good performance in shorter or cooler seasons"
          },
          {
            name: "Glacier",
            note: "one of the faster ripening slicers, often chosen where summer heat is limited"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "65–75",
        gddTarget: 1000,
        examples: [
          {
            name: "Early Girl",
            note: "popular for combining relatively quick maturity with solid production"
          },
          {
            name: "Fourth of July",
            note: "often treated like an early-to-mid bridge variety with faster ripening than larger slicers"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "75–85",
        gddTarget: 1200,
        examples: [
          {
            name: "Celebrity",
            note: "a reliable midseason hybrid that balances yield, disease resistance, and manageable maturity"
          },
          {
            name: "Juliet",
            note: "a productive saladette type that can perform well when the season is reasonably supportive"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "85–100",
        gddTarget: 1400,
        examples: [
          {
            name: "Brandywine",
            note: "a large heirloom type valued for flavor but much more exposed to short-season risk"
          },
          {
            name: "Mortgage Lifter",
            note: "a slower large-fruited tomato that usually needs a longer, warmer run to finish well"
          },
          {
            name: "Cherokee Purple",
            note: "excellent flavor, but usually better suited to places with more seasonal heat"
          }
        ]
      }
    ],

    oneSentenceSummary: "Tomatoes need a warm season and enough heat to ripen fruit reliably.",
    shortSeasonStrategy: "Use transplants and favor very early or early varieties in shorter seasons.",
    commonFailureMode: "Late varieties often run out of heat before fall frost.",
    protectedCultureBenefit: "high"
  },

  {
    key: "peppers",
    name: "Peppers",
    singularName: "pepper",
    category: "warm-season",
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

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "60–70",
        gddTarget: 950,
        examples: [
          {
            name: "King of the North",
            note: "a classic short-season bell pepper chosen for earlier maturity in cooler climates"
          },
          {
            name: "Ace",
            note: "often grown where gardeners want dependable bell peppers without pushing late-season risk"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "65–75",
        gddTarget: 1100,
        examples: [
          {
            name: "Gypsy",
            note: "an earlier hybrid sweet pepper that matures more quickly than many full-size bells"
          },
          {
            name: "Lipstick",
            note: "sometimes treated as relatively early, though fuller ripening still improves with more heat"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "75–85",
        gddTarget: 1300,
        examples: [
          {
            name: "California Wonder",
            note: "a familiar standard bell pepper, but usually more comfortable where the season has decent heat"
          },
          {
            name: "Carmen",
            note: "a tapered sweet pepper that can perform well when the local season is supportive"
          },
          {
            name: "Corno di Toro",
            note: "productive and flavorful, but generally better where plants get a stronger run of warmth"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "85–100",
        gddTarget: 1500,
        examples: [
          {
            name: "Marconi Red",
            note: "a larger sweet pepper that usually benefits from a long, warm season"
          },
          {
            name: "Chocolate Beauty",
            note: "slower to color fully, making it more exposed to short-season pressure"
          }
        ]
      }
    ],

    oneSentenceSummary: "Peppers need steady warmth and a reasonably long season to size up and ripen well.",
    shortSeasonStrategy: "Use transplants, choose very early or early varieties, and prioritize the warmest spots in the garden.",
    commonFailureMode: "Cool conditions slow growth and delay ripening.",
    protectedCultureBenefit: "high"
  },

  {
    key: "sweet-corn",
    name: "Sweet Corn",
    singularName: "sweet corn",
    category: "warm-season",
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

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "60–70",
        gddTarget: 850,
        examples: [
          {
            name: "Yukon Chief",
            note: "bred with short seasons in mind and often chosen where early maturity matters most"
          },
          {
            name: "Early Sunglow",
            note: "a dependable early yellow sweet corn that reaches harvest relatively quickly"
          }
        ]
      },
      {
        key: "early",
        label: "Early",
        daysToMaturity: "65–75",
        gddTarget: 950,
        examples: [
          {
            name: "Peaches and Cream",
            note: "widely grown and approachable, though still best when planted promptly into warming soil"
          }
        ]
      },
      {
        key: "mid",
        label: "Mid-season",
        daysToMaturity: "75–85",
        gddTarget: 1100,
        examples: [
          {
            name: "Bodacious",
            note: "a flavorful midseason type that fits best where summer heat is reasonably steady"
          },
          {
            name: "Silver Queen",
            note: "popular and well known, but usually more comfortable where the season is not especially tight"
          },
          {
            name: "Ambrosia",
            note: "a sweet, widely grown corn that performs best when it has a decent run of heat"
          }
        ]
      },
      {
        key: "late",
        label: "Late",
        daysToMaturity: "85–95",
        gddTarget: 1250,
        examples: [
          {
            name: "Kandy Korn",
            note: "a later corn that generally benefits from longer summers and less pressure from early fall"
          },
          {
            name: "Incredible",
            note: "vigorous and productive, but more exposed where the season is short"
          },
          {
            name: "Honey Select",
            note: "excellent eating quality, though it usually wants more runway than fast early types"
          }
        ]
      }
    ],

    oneSentenceSummary: "Sweet corn needs decent summer heat and enough season length to fill ears before fall frost.",
    shortSeasonStrategy: "Favor very early or early varieties and plant promptly once soil has warmed.",
    commonFailureMode: "Late planting can leave ears short on time and heat.",
    protectedCultureBenefit: "low"
  },

  {
    key: "beans",
    name: "Beans",
    singularName: "bean",
    category: "warm-season",
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

    varietyClasses: [
      {
        key: "very-early",
        label: "Very early",
        daysToMaturity: "45–52",
        gddTarget: 725,
        examples: [
          {
            name: "Provider",
            note: "a dependable early bean often chosen where cool starts and shorter seasons are common"
          },
          {
            name: "Mascotte",
            note: "compact and relatively quick, making it useful where gardeners want a fast return"
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
            name: "Contender",
            note: "valued for earliness and steadiness, especially in variable conditions"
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
            name: "Blue Lake",
            note: "a classic bean with strong garden appeal when the season comfortably supports it"
          },
          {
            name: "Kentucky Wonder",
            note: "productive and popular, though it benefits from a decent amount of warm weather"
          },
          {
            name: "Roma II",
            note: "a reliable Italian-type bean that usually works well where planting is timely"
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
            name: "Rattlesnake",
            note: "vigorous and productive, but better where the season leaves a little more room"
          },
          {
            name: "Scarlet Runner",
            note: "showy and productive, though often more exposed in shorter seasons"
          },
          {
            name: "Fortex",
            note: "excellent quality, but generally happier when warmth and season length are less limiting"
          }
        ]
      }
    ],

    oneSentenceSummary: "Beans are one of the more manageable warm-season crops where summer heat is decent.",
    shortSeasonStrategy: "Plant once frost risk has passed and favor very early or early bush types in shorter seasons.",
    commonFailureMode: "Cold soil and late frosts can stall or damage young plants.",
    protectedCultureBenefit: "low"
  }
];
