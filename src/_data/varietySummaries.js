const recordsSource = require('./cropClimateRecords');
const { buildCropClimateCopy } = require('./_lib/buildCropClimateCopy');
const { getVarietyClassDisplay, getCropGrammar, titleCaseWords } = require('./_lib/cropGrammar');
const { enabledCityCrops } = require('./cropCityRollout');

function getRecords() {
  return typeof recordsSource === 'function' ? recordsSource() : recordsSource;
}

const BEST_VARIETY_MIN_GDD_MARGIN = 150;

const VARIETY_COPY_OVERRIDES = {
  kale: {
    'red russian': {
      bestFor: 'fast leafy harvests',
      note: 'A quick, forgiving kale that is useful when you want earlier leaf harvests and a wide margin in cooler seasons.'
    },
    siberian: {
      bestFor: 'cold-tolerant leafy kale',
      note: 'A hardy leafy kale that is useful when reliability and cool-weather harvests matter more than a large curled plant.'
    },
    winterbor: {
      bestFor: 'dependable curled kale',
      note: 'A sturdy curled kale that works well as a reliable default where cool-weather greens are a good fit.'
    },
    vates: {
      bestFor: 'compact curled kale',
      note: 'A dependable compact curled kale that is useful when gardeners want steady leaves without especially large plants.'
    },
    lacinato: {
      bestFor: 'fuller dark-leaf harvests',
      note: 'A popular dark-leaf kale that can be productive, but usually needs a little more time to size up than the fastest types.'
    },
    redbor: {
      bestFor: 'purple curled kale',
      note: 'A colorful curled kale that is better chosen for cold-season color and ornamental value than for maximum speed.'
    }
  },

  'swiss-chard': {
    barese: {
      bestFor: 'quick compact harvests',
      note: 'A faster, compact chard that is useful when you want the safest path or less pressure on the season.'
    },
    'perpetual spinach': {
      bestFor: 'spinach-like greens',
      note: 'A leaf-beet type that gives spinach-like harvests with more staying power through warm weather than true spinach.'
    },
    'bright lights': {
      bestFor: 'dependable color mix',
      note: 'A practical, widely grown chard mix that gives most gardeners the best balance of reliability, color, and usable harvests.'
    },
    'rhubarb chard': {
      bestFor: 'red-stemmed chard',
      note: 'A colorful chard that works well when gardeners want red stems without changing the basic harvest style.'
    },
    'fordhook giant': {
      bestFor: 'larger plants and heavier harvests',
      note: 'A vigorous green chard that can be productive, but it makes more sense when you are comfortable giving it a little more room than the quickest types.'
    },
    peppermint: {
      bestFor: 'specialty stem color',
      note: 'A specialty chard chosen mostly for visual interest, stem color, and mixed plantings rather than maximum short-season safety.'
    }
  },

    tomatoes: {
    stupice: {
      bestFor: 'very early tomatoes',
      note: 'A dependable early tomato that is useful where the season is cooler, shorter, or less forgiving.'
    },
    glacier: {
      bestFor: 'cool-season tomato insurance',
      note: 'A fast-ripening slicer often chosen when gardeners need tomatoes to start producing before the warm season slips away.'
    },
    'early girl': {
      bestFor: 'reliable early slicers',
      note: 'A familiar early tomato that balances speed, production, and broad garden reliability.'
    },
    'fourth of july': {
      bestFor: 'early-to-mid harvests',
      note: 'A quicker tomato that can bridge the gap between very early types and larger midseason slicers.'
    },
    celebrity: {
      bestFor: 'dependable main-season tomatoes',
      note: 'A reliable hybrid that makes sense when the season can support a solid main-crop tomato without pushing too late.'
    },
    juliet: {
      bestFor: 'productive saladette harvests',
      note: 'A productive saladette tomato that can perform well when there is enough warmth for steady fruit set and ripening.'
    },
    brandywine: {
      bestFor: 'large heirloom flavor',
      note: 'A large heirloom tomato valued for flavor, but much more exposed to short-season risk than earlier varieties.'
    },
    'mortgage lifter': {
      bestFor: 'large late tomatoes',
      note: 'A slower large-fruited tomato that usually needs a longer, warmer run to finish well.'
    },
    'cherokee purple': {
      bestFor: 'heirloom color and flavor',
      note: 'A flavorful heirloom that is usually better saved for places with more heat or a protected growing setup.'
    }
  },

  peppers: {
    ace: {
      bestFor: 'short-season bell peppers',
      note: 'A very early bell pepper that gives short-season gardeners one of the more realistic paths to ripe fruit.'
    },
    'king of the north': {
      bestFor: 'cool-climate bell peppers',
      note: 'A classic short-season bell pepper often chosen where summers are cooler or the frost-free window is tight.'
    },
    gypsy: {
      bestFor: 'early sweet peppers',
      note: 'An earlier sweet pepper that can be a practical choice when full-size bells feel too slow for the local season.'
    },
    lipstick: {
      bestFor: 'early red sweet peppers',
      note: 'A sweet pepper that can ripen earlier than many standard bells, though full color still benefits from steady warmth.'
    },
    'california wonder': {
      bestFor: 'standard bell peppers',
      note: 'A familiar bell pepper that is best treated as a main-season choice rather than the safest short-season option.'
    },
    carmen: {
      bestFor: 'tapered sweet peppers',
      note: 'A productive tapered sweet pepper that can do well when the season is warm enough to support steady ripening.'
    },
    'corno di toro': {
      bestFor: 'large sweet frying peppers',
      note: 'A flavorful long pepper that is more rewarding where plants get a strong run of warmth.'
    },
    'marconi red': {
      bestFor: 'large red sweet peppers',
      note: 'A larger sweet pepper that usually needs a long, warm season to size and color well.'
    },
    'chocolate beauty': {
      bestFor: 'specialty bell color',
      note: 'A slower coloring bell pepper that is better chosen for novelty and flavor than for short-season safety.'
    }
  },

  'sweet-corn': {
    'yukon chief': {
      bestFor: 'short-season corn',
      note: 'A very early sweet corn bred with short seasons in mind, useful where getting mature ears is the main challenge.'
    },
    'early sunglow': {
      bestFor: 'early yellow sweet corn',
      note: 'A dependable early yellow sweet corn that gives gardeners a quicker path to harvest than most main-season types.'
    },
    'peaches and cream': {
      bestFor: 'bicolor sweet corn',
      note: 'A familiar bicolor sweet corn that can be worth growing when planted promptly into warming soil.'
    },
    peaches_and_cream: {
      bestFor: 'bicolor sweet corn',
      note: 'A familiar bicolor sweet corn that can be worth growing when planted promptly into warming soil.'
    },
    bodacious: {
      bestFor: 'main-season sweet corn',
      note: 'A flavorful sweet corn that makes more sense where summer heat is steady enough for a normal corn finish.'
    },
    'silver queen': {
      bestFor: 'classic white sweet corn',
      note: 'A well-known sweet corn that usually needs a more comfortable season than the fastest early types.'
    },
    ambrosia: {
      bestFor: 'sweet bicolor ears',
      note: 'A widely grown sweet corn that performs best when it has a decent run of warm weather.'
    },
    'kandy korn': {
      bestFor: 'later sweet corn',
      note: 'A later sweet corn that is better suited to longer summers with less pressure from early fall.'
    },
    incredible: {
      bestFor: 'fuller main-season ears',
      note: 'A vigorous sweet corn that can be productive, but is more exposed where the season is short.'
    },
    'honey select': {
      bestFor: 'premium eating quality',
      note: 'A high-quality sweet corn that is better chosen where there is enough runway for a slower finish.'
    }
  },

  beans: {
    provider: {
      bestFor: 'early reliable beans',
      note: 'A dependable early bean that is useful where cool starts, variable conditions, or shorter seasons are common.'
    },
    mascotte: {
      bestFor: 'compact early harvests',
      note: 'A compact bean that gives gardeners a quicker return and works well where space or season length is limited.'
    },
    contender: {
      bestFor: 'steady early beans',
      note: 'An early bean valued for reliability and practical performance in variable garden conditions.'
    },
    'blue lake': {
      bestFor: 'classic green beans',
      note: 'A classic bean with strong garden appeal when the warm season comfortably supports it.'
    },
    'kentucky wonder': {
      bestFor: 'productive pole beans',
      note: 'A productive, familiar bean that benefits from a decent stretch of warm weather.'
    },
    'roma ii': {
      bestFor: 'flat Italian beans',
      note: 'A reliable Italian-type bean that usually works well when planting is timely and soil is warm.'
    },
    rattlesnake: {
      bestFor: 'vigorous pole beans',
      note: 'A vigorous bean that can be productive, but is better where the season leaves a little more room.'
    },
    'scarlet runner': {
      bestFor: 'showy edible vines',
      note: 'A showy and productive runner bean that can be more exposed in shorter or cooler seasons.'
    },
    fortex: {
      bestFor: 'high-quality long beans',
      note: 'An excellent-quality pole bean that is generally happier when warmth and season length are less limiting.'
    }
  },

  cucumbers: {
    'cool breeze': {
      bestFor: 'early cucumber harvests',
      note: 'An earlier cucumber that gives gardeners a more forgiving path when the season needs a fast start.'
    },
    'suyo long': {
      bestFor: 'long slicing cucumbers',
      note: 'A productive long cucumber that can do well when warmth arrives on time and growth is steady.'
    },
    'marketmore 76': {
      bestFor: 'classic slicing cucumbers',
      note: 'A familiar slicer that often fits well when planted into reliably warm conditions.'
    },
    spacemaster: {
      bestFor: 'compact cucumber plants',
      note: 'A compact cucumber that is useful where gardeners want faster returns or a smaller plant footprint.'
    },
    'straight eight': {
      bestFor: 'productive slicers',
      note: 'A well-known slicing cucumber that is happier when the warm season is not especially compressed.'
    },
    telegraph: {
      bestFor: 'protected or warm sites',
      note: 'A longer cucumber type that usually makes more sense with supportive warmth or protected growing.'
    },
    lemon: {
      bestFor: 'specialty cucumber shape',
      note: 'A fun, round cucumber that can be productive, but is more exposed if summer heat arrives late.'
    }
  },

  zucchini: {
    dunja: {
      bestFor: 'early zucchini harvests',
      note: 'A productive, relatively quick zucchini that works well when gardeners want early fruit from a shorter warm season.'
    },
    'black beauty': {
      bestFor: 'classic zucchini',
      note: 'A classic zucchini that often works well when planted on time into warm soil.'
    },
    raven: {
      bestFor: 'vigorous early zucchini',
      note: 'A vigorous zucchini that is fairly approachable where warmth arrives on schedule.'
    },
    'costata romanesco': {
      bestFor: 'flavor and texture',
      note: 'A distinctive ribbed zucchini with excellent eating quality, but it benefits from a reasonably supportive season.'
    },
    cocozelle: {
      bestFor: 'striped heirloom zucchini',
      note: 'A more exposed zucchini choice where the warm season is short, late, or unreliable.'
    }
  },

  potatoes: {
    'yukon gold': {
      bestFor: 'early yellow potatoes',
      note: 'A familiar yellow potato that gives gardeners a faster, more forgiving path than longer-season storage types.'
    },
    norland: {
      bestFor: 'early harvests',
      note: 'A reliable early potato choice when you want a shorter-season crop with less pressure on the back end of the season.'
    },
    'dark red norland': {
      bestFor: 'early red potatoes',
      note: 'A red-skinned early potato that can work well when you want something a little more substantial than the very fastest choices.'
    },
    kennebec: {
      bestFor: 'dependable main-crop potatoes',
      note: 'A productive, versatile potato that makes sense when the season has enough room for a solid main-crop harvest.'
    },
    'gold rush': {
      bestFor: 'main-crop russets',
      note: 'A russet-type potato that can do well with timely planting and enough runway, but is less forgiving than faster early potatoes.'
    },
    'russet burbank': {
      bestFor: 'long-season russets',
      note: 'A classic long-season russet that is better treated as a stretch or specialty choice unless the local season gives it plenty of room.'
    }
  },

  peas: {
    alaska: {
      bestFor: 'very early peas',
      note: 'A classic early pea that gives gardeners a quick, practical fit for cool spring planting.'
    },
    'little marvel': {
      bestFor: 'compact shelling peas',
      note: 'A compact, dependable pea that fits many shorter seasons when planted early.'
    },
    'sugar ann': {
      bestFor: 'quick snap peas',
      note: 'An early snap pea that is useful when gardeners want fast spring production.'
    },
    'green arrow': {
      bestFor: 'productive shelling peas',
      note: 'A productive, popular pea that still works best when planted promptly into cool spring conditions.'
    },
    'tall telephone': {
      bestFor: 'tall late peas',
      note: 'A slower tall pea that is more exposed where spring turns warm quickly or planting is delayed.'
    }
  },

  broccoli: {
    'de cicco': {
      bestFor: 'flexible early broccoli',
      note: 'An early broccoli that is useful when gardeners want flexibility, side shoots, and a quicker harvest path.'
    },
    packman: {
      bestFor: 'dependable early heads',
      note: 'A practical early broccoli with good short-season usefulness.'
    },
    'green magic': {
      bestFor: 'strong early hybrids',
      note: 'A strong early hybrid that often handles the main spring broccoli window well.'
    },
    belstar: {
      bestFor: 'reliable main-season broccoli',
      note: 'A productive broccoli that works well where the season gives a reasonable cool-weather runway.'
    },
    marathon: {
      bestFor: 'later broccoli plantings',
      note: 'A slower broccoli that is more exposed if spring is delayed or summer heat arrives early.'
    }
  },

  cabbage: {
    'golden acre': {
      bestFor: 'early compact heads',
      note: 'A classic early cabbage that gives gardeners a practical short-season path to firm heads.'
    },
    stonehead: {
      bestFor: 'reliable early cabbage',
      note: 'A dependable cabbage that is especially useful when gardeners want a firm early head.'
    },
    'early jersey wakefield': {
      bestFor: 'early pointed cabbage',
      note: 'A quick pointed cabbage that is useful when speed and spring harvests matter more than storage.'
    },
    cheers: {
      bestFor: 'productive main-season cabbage',
      note: 'A strong cabbage choice where the season offers a comfortable cool run.'
    },
    'red express': {
      bestFor: 'faster red cabbage',
      note: 'A useful red cabbage option when gardeners want color without moving all the way into slow storage types.'
    },
    'storage no. 4': {
      bestFor: 'storage cabbage',
      note: 'A longer-season cabbage better suited to places with enough room for a full finish.'
    }
  },

  carrots: {
    amsterdam: {
      bestFor: 'fast baby carrots',
      note: 'A quick carrot type that is useful when preserving time matters more than growing the largest roots.'
    },
    nelson: {
      bestFor: 'dependable early carrots',
      note: 'A strong early Nantes-type carrot that balances speed, quality, and reliability in shorter growing seasons.'
    },
    yaya: {
      bestFor: 'reliable Nantes carrots',
      note: 'A smooth, quick Nantes-type carrot that is a good default when you want quality roots without pushing into a slow maturity range.'
    },
    bolero: {
      bestFor: 'dependable storage carrots',
      note: 'A productive carrot that can be a good choice when the season gives enough room for roots to size up well.'
    },
    'danvers 126': {
      bestFor: 'heavier storage roots',
      note: 'A classic storage-leaning carrot that benefits from a little more runway than faster early types.'
    }
  },

  onions: {
    'walla walla': {
      bestFor: 'large sweet onions',
      note: 'A large, popular onion that can be rewarding, but still needs an early enough start to build size.'
    },
    copra: {
      bestFor: 'dependable storage onions',
      note: 'A practical storage onion with good all-around usefulness when started early.'
    },
    redwing: {
      bestFor: 'red storage onions',
      note: 'A strong red onion that makes sense where the season is supportive enough for good bulb sizing.'
    },
    patterson: {
      bestFor: 'long-keeping onions',
      note: 'A solid keeping onion that wants enough runway to size up well before the season closes.'
    },
    'ailsa craig': {
      bestFor: 'large exhibition onions',
      note: 'A large onion that is more exposed in shorter seasons because it benefits from a longer finishing run.'
    }
  },

  beets: {
    'early wonder': {
      bestFor: 'fast early beets',
      note: 'A quick beet choice when you want to protect margin and avoid relying on a long finish.'
    },
    'red ace': {
      bestFor: 'reliable round beets',
      note: 'A dependable round red beet that works well as a practical all-purpose garden choice.'
    },
    'detroit dark red': {
      bestFor: 'dependable standard beets',
      note: 'A familiar all-purpose beet that works well as a balanced default when the season has reasonable room.'
    },
    'touchstone gold': {
      bestFor: 'golden beet color',
      note: 'A golden beet that adds color and sweetness while staying in a practical maturity range.'
    },
    chioggia: {
      bestFor: 'specialty color',
      note: 'A striped specialty beet that can be worth growing for color and novelty when you are comfortable giving up some margin.'
    },
    cylindra: {
      bestFor: 'long slicing roots',
      note: 'A cylindrical beet that is useful for slicing, but it benefits from loose soil and steady sizing time.'
    }
  },

  lettuce: {
    'black seeded simpson': {
      bestFor: 'quick leaf lettuce',
      note: 'A fast leaf lettuce that is useful when you want quick harvests and more flexibility in the planting window.'
    },
    'new red fire': {
      bestFor: 'red leaf lettuce',
      note: 'A colorful loose-leaf lettuce that gives gardeners visual variety without asking for a long heading window.'
    },
    buttercrunch: {
      bestFor: 'dependable butterhead lettuce',
      note: 'A reliable butterhead type that gives a good balance of quality and manageable timing.'
    },
    jericho: {
      bestFor: 'heat-tolerant romaine',
      note: 'A romaine-type lettuce that can be useful when gardeners want upright heads with more tolerance for warming conditions.'
    },
    'parris island cos': {
      bestFor: 'classic romaine heads',
      note: 'A familiar romaine that works best when the planting window stays cool enough for heads to form cleanly.'
    },
    salanova: {
      bestFor: 'polished specialty lettuce',
      note: 'A specialty lettuce type that makes sense when uniform heads, attractive leaves, and harvest presentation matter.'
    }
  },

  spinach: {
    bloomsdale: {
      bestFor: 'cold-tolerant spinach',
      note: 'A classic spinach that works well for early spring planting and cool-weather harvests.'
    },
    space: {
      bestFor: 'bolt-resistant spring spinach',
      note: 'A reliable spinach that is useful when you want a little more protection against a fast spring warm-up.'
    },
    tyee: {
      bestFor: 'longer spinach harvests',
      note: 'A dependable semi-savoyed spinach that is useful when you want a broader harvest window and better bolting resistance.'
    },
    regiment: {
      bestFor: 'productive full-size spinach',
      note: 'A sturdy spinach choice for gardeners who want reliable full-size spring or fall leaves.'
    },
    avon: {
      bestFor: 'quick spinach leaves',
      note: 'A faster spinach option that works well when the goal is earlier leaves or baby-leaf harvests.'
    },
    reflect: {
      bestFor: 'fast spring production',
      note: 'A fast-growing spinach that can be useful when you want quick production before heat pressure builds.'
    }
  },

  radishes: {
    'cherry belle': {
      bestFor: 'quick round radishes',
      note: 'A fast, dependable radish for early harvests and tight planting windows.'
    },
    'french breakfast': {
      bestFor: 'mild oblong radishes',
      note: 'A slightly slower but popular radish that still fits easily in most cool planting windows.'
    }
  },

  cauliflower: {
    'snow crown': {
      bestFor: 'very early cauliflower',
      note: 'A very early white cauliflower that gives short-season gardeners one of the safest paths to a finished head.'
    },
    snowball: {
      bestFor: 'early cauliflower heads',
      note: 'A classic early cauliflower that gives gardeners one of the more approachable paths to a finished head.'
    },
    amazing: {
      bestFor: 'main-season cauliflower',
      note: 'A productive cauliflower that can do well when timing is steady and growing conditions stay consistent.'
    },
    cheddar: {
      bestFor: 'orange cauliflower',
      note: 'A colorful cauliflower option for gardeners who want something different without choosing only for the fastest finish.'
    },
    graffiti: {
      bestFor: 'purple specialty cauliflower',
      note: 'A purple cauliflower that is best chosen for color and novelty rather than maximum short-season safety.'
    },
    skywalker: {
      bestFor: 'larger later heads',
      note: 'A later cauliflower that usually needs a cleaner and more generous season than the safest early types.'
    }
  },

  garlic: {
    music: {
      bestFor: 'cold-climate hardneck garlic',
      note: 'A widely grown hardneck garlic that is well adapted to cold climates and fall planting.'
    },
    'california early': {
      bestFor: 'softneck garlic',
      note: 'A softneck garlic more common in milder climates, but still worth considering where storage or braiding traits matter.'
    }
  }
};

const VARIETY_DECISION_OVERRIDES = {
  kale: {
    'red russian': {
      chooseWhen: 'earlier leafy harvests',
      tradeoff: 'it is not the heaviest curled kale option',
      growingNote: 'harvest leaves young for the quickest return'
    },
    siberian: {
      chooseWhen: 'cold-tolerant leafy kale',
      tradeoff: 'it is more about reliability than refined leaf texture',
      growingNote: 'use it where cool-weather toughness matters most'
    },
    winterbor: {
      chooseWhen: 'a dependable curled kale for steady harvests',
      tradeoff: 'it is not quite as fast as the quickest leafy types',
      growingNote: 'give it steady moisture so the plants keep producing leaves'
    },
    vates: {
      chooseWhen: 'compact curled kale plants',
      tradeoff: 'it is not as large or showy as some full-size kale choices',
      growingNote: 'use it where dependable leaves matter more than maximum plant size'
    },
    lacinato: {
      chooseWhen: 'larger dark leaves and a more substantial kale plant',
      tradeoff: 'it usually needs more time to size up than faster kale choices',
      growingNote: 'plant early enough that it has time to build a strong plant before conditions turn stressful'
    },
    redbor: {
      chooseWhen: 'purple curled leaves and ornamental color',
      tradeoff: 'it is chosen for color more than speed',
      growingNote: 'grow it when appearance and cold-season interest matter'
    }
  },

  'swiss-chard': {
    barese: {
      chooseWhen: 'quick compact chard harvests',
      tradeoff: 'it is less about large plants and more about speed',
      growingNote: 'use it when you want a safer, smaller chard planting'
    },
    'perpetual spinach': {
      chooseWhen: 'spinach-like greens with better heat staying power',
      tradeoff: 'it is not true spinach and has a chard-like character',
      growingNote: 'harvest leaves regularly before they get oversized'
    },
    'bright lights': {
      chooseWhen: 'a dependable colorful chard mix',
      tradeoff: 'it is not the fastest or largest single-purpose chard choice',
      growingNote: 'pick outer leaves regularly to keep plants productive'
    },
    'rhubarb chard': {
      chooseWhen: 'red stems and colorful harvests',
      tradeoff: 'it is chosen for color as much as performance',
      growingNote: 'keep harvests steady so plants continue producing tender leaves'
    },
    'fordhook giant': {
      chooseWhen: 'larger green chard plants and heavier harvests',
      tradeoff: 'it needs more room and time than compact chard types',
      growingNote: 'give it space and a clean start so the plants can size up'
    },
    peppermint: {
      chooseWhen: 'specialty stem color',
      tradeoff: 'it is more about appearance than the safest harvest path',
      growingNote: 'use it where visual variety matters in the bed'
    }
  },

tomatoes: {
  stupice: {
    chooseWhen: 'the earliest practical harvests',
    tradeoff: 'fruit size is not the main reason to grow it',
    growingNote: 'use it when first ripe tomatoes matter more than large slicers'
  },
  glacier: {
    chooseWhen: 'the safest short-season tomato option',
    tradeoff: 'it is chosen for reliability more than big main-season fruit',
    growingNote: 'start it strongly indoors so the early advantage is not lost'
  },
  'early girl': {
    chooseWhen: 'reliable early slicers',
    tradeoff: 'it is not as early as the smallest short-season tomato types',
    growingNote: 'plant it where it gets the warmest practical exposure'
  },
  'fourth of july': {
    chooseWhen: 'an early harvest without going to the very fastest tomato types',
    tradeoff: 'it still needs enough warmth to keep ripening steadily',
    growingNote: 'use it when you want an early tomato with a little more size and production'
  },
  celebrity: {
    chooseWhen: 'a dependable main-season tomato',
    tradeoff: 'it needs more season than very early tomato choices',
    growingNote: 'choose it where the season has enough room for a normal tomato crop'
  },
  juliet: {
    chooseWhen: 'productive saladette tomatoes',
    tradeoff: 'it still needs steady warmth for good fruiting',
    growingNote: 'use it where productivity matters more than large slicing tomatoes'
  },
  brandywine: {
    chooseWhen: 'large heirloom flavor',
    tradeoff: 'it is much riskier in short or cool tomato seasons',
    growingNote: 'save it for protected sites, warmer gardens, or years when you can accept more risk'
  },
  'mortgage lifter': {
    chooseWhen: 'large late-season tomatoes',
    tradeoff: 'it needs a long warm run to finish well',
    growingNote: 'avoid it when the season is already tight'
  },
  'cherokee purple': {
    chooseWhen: 'heirloom color and flavor',
    tradeoff: 'it is less forgiving than early tomato varieties',
    growingNote: 'grow it where warmth, shelter, and timing are all helping'
  }
},

  peppers: {
    ace: {
      chooseWhen: 'short-season bell peppers',
      tradeoff: 'ripe color still depends on warmth and timing',
      growingNote: 'give it the warmest site you can and avoid slow starts'
    },
    'king of the north': {
      chooseWhen: 'cool-climate bell peppers',
      tradeoff: 'it is still a pepper, so cold starts can erase the advantage',
      growingNote: 'start indoors early and transplant into warm soil'
    },
    gypsy: {
      chooseWhen: 'early sweet peppers',
      tradeoff: 'it is not a classic blocky bell pepper',
      growingNote: 'use it when earlier sweet peppers matter more than bell shape'
    },
    lipstick: {
      chooseWhen: 'early red sweet peppers',
      tradeoff: 'full red color still takes enough warm weather',
      growingNote: 'plant where the fruit can ripen in the warmest part of the season'
    },
    'california wonder': {
      chooseWhen: 'standard bell peppers',
      tradeoff: 'it is slower and less forgiving than the earliest pepper choices',
      growingNote: 'choose it where the season is warm enough for full-size bells'
    },
    carmen: {
      chooseWhen: 'tapered sweet peppers',
      tradeoff: 'it still needs steady warmth for good ripening',
      growingNote: 'use it when you want sweet pepper quality and have a supportive warm site'
    },
    'corno di toro': {
      chooseWhen: 'large sweet frying peppers',
      tradeoff: 'it is better with a longer warm season',
      growingNote: 'avoid it where peppers already feel marginal'
    },
    'marconi red': {
      chooseWhen: 'large red sweet peppers',
      tradeoff: 'it needs more time to size and color than faster peppers',
      growingNote: 'use it only where the warm season is generous enough'
    },
    'chocolate beauty': {
      chooseWhen: 'specialty bell color',
      tradeoff: 'it is chosen for novelty more than short-season safety',
      growingNote: 'grow it only when you can accept extra ripening risk'
    }
  },

  'sweet-corn': {
    'yukon chief': {
      chooseWhen: 'the shortest practical sweet corn path',
      tradeoff: 'ear size and yield may not match longer-season corn',
      growingNote: 'plant into warm soil so the early maturity advantage is not wasted'
    },
    'early sunglow': {
      chooseWhen: 'early yellow sweet corn',
      tradeoff: 'it is chosen for speed more than maximum ear size',
      growingNote: 'use it where finishing ears is the main challenge'
    },
    'peaches and cream': {
      chooseWhen: 'familiar bicolor sweet corn',
      tradeoff: 'it needs more heat and time than the earliest corn choices',
      growingNote: 'plant promptly once soil is warm'
    },
    bodacious: {
      chooseWhen: 'main-season sweet corn flavor',
      tradeoff: 'it is riskier where summer heat is limited',
      growingNote: 'choose it only where corn has enough time to finish normally'
    },
    'silver queen': {
      chooseWhen: 'classic white sweet corn',
      tradeoff: 'it usually needs more season than short-season gardens can spare',
      growingNote: 'save it for warmer or longer-season sites'
    },
    ambrosia: {
      chooseWhen: 'sweet bicolor ears',
      tradeoff: 'it is less safe than very early corn in short seasons',
      growingNote: 'use it where warm weather is steady enough'
    },
    'kandy korn': {
      chooseWhen: 'later sweet corn',
      tradeoff: 'it spends more of the season than early types',
      growingNote: 'avoid it where the first fall frost comes early'
    },
    incredible: {
      chooseWhen: 'fuller main-season ears',
      tradeoff: 'it is more exposed in short-season areas',
      growingNote: 'give it warm soil and a full corn window'
    },
    'honey select': {
      chooseWhen: 'premium eating quality',
      tradeoff: 'it needs enough runway for a slower finish',
      growingNote: 'choose it where quality matters and season length is not the limiting factor'
    }
  },

  beans: {
    provider: {
      chooseWhen: 'early reliable bush beans',
      tradeoff: 'it is practical more than specialty',
      growingNote: 'use it where fast, dependable bean production matters'
    },
    mascotte: {
      chooseWhen: 'compact early bean harvests',
      tradeoff: 'it is not the choice for tall pole-bean production',
      growingNote: 'good for smaller spaces or quicker returns'
    },
    contender: {
      chooseWhen: 'steady early beans',
      tradeoff: 'it is less about novelty and more about reliability',
      growingNote: 'plant once soil is warm enough for quick germination'
    },
    'blue lake': {
      chooseWhen: 'classic green beans',
      tradeoff: 'it needs a comfortable warm window',
      growingNote: 'choose it when the bean season is not especially tight'
    },
    'kentucky wonder': {
      chooseWhen: 'productive pole beans',
      tradeoff: 'it needs more time and support than bush beans',
      growingNote: 'give it a trellis and a warm, steady start'
    },
    'roma ii': {
      chooseWhen: 'flat Italian beans',
      tradeoff: 'it is chosen for pod type more than maximum speed',
      growingNote: 'plant into warm soil and harvest before pods get oversized'
    },
    rattlesnake: {
      chooseWhen: 'vigorous pole beans',
      tradeoff: 'it needs a longer warm run than early bush beans',
      growingNote: 'use it where vines have time to climb and produce'
    },
    'scarlet runner': {
      chooseWhen: 'showy edible vines',
      tradeoff: 'it is more exposed in short or cool seasons',
      growingNote: 'choose it when flowers, vines, and edible harvest all matter'
    },
    fortex: {
      chooseWhen: 'high-quality long beans',
      tradeoff: 'it needs a supportive warm season',
      growingNote: 'give it a trellis and avoid late planting'
    }
  },

  cucumbers: {
    'cool breeze': {
      chooseWhen: 'early cucumber harvests',
      tradeoff: 'it is chosen for speed more than classic slicer size',
      growingNote: 'use it when the cucumber window needs a fast start'
    },
    'suyo long': {
      chooseWhen: 'long slicing cucumbers',
      tradeoff: 'it still needs warmth and steady growth',
      growingNote: 'give it a warm site and consistent moisture'
    },
    'marketmore 76': {
      chooseWhen: 'classic slicing cucumbers',
      tradeoff: 'it is not the very fastest cucumber option',
      growingNote: 'plant after soil warms so growth does not stall'
    },
    spacemaster: {
      chooseWhen: 'compact cucumber plants',
      tradeoff: 'it is chosen for plant size as much as yield',
      growingNote: 'use it in small spaces, containers, or tighter beds'
    },
    'straight eight': {
      chooseWhen: 'productive slicers',
      tradeoff: 'it wants a comfortable warm cucumber season',
      growingNote: 'avoid late or cold starts'
    },
    telegraph: {
      chooseWhen: 'protected or warm growing sites',
      tradeoff: 'it is less forgiving in open short-season gardens',
      growingNote: 'best with warmth, shelter, or protected culture'
    },
    lemon: {
      chooseWhen: 'specialty cucumber shape',
      tradeoff: 'it is not the safest speed choice',
      growingNote: 'choose it when novelty matters and timing is good'
    }
  },

  zucchini: {
    dunja: {
      chooseWhen: 'early zucchini harvests',
      tradeoff: 'it is chosen for speed more than specialty flavor',
      growingNote: 'plant into warm soil for the quickest return'
    },
    'black beauty': {
      chooseWhen: 'classic zucchini',
      tradeoff: 'it is not the very fastest zucchini option',
      growingNote: 'use it as a familiar all-around choice when planting on time'
    },
    raven: {
      chooseWhen: 'vigorous early zucchini',
      tradeoff: 'it still needs warmth to move quickly',
      growingNote: 'give it room and warm soil'
    },
    'costata romanesco': {
      chooseWhen: 'flavor and texture',
      tradeoff: 'it benefits from better timing than faster zucchini choices',
      growingNote: 'choose it when eating quality matters more than the quickest possible harvest'
    },
    cocozelle: {
      chooseWhen: 'striped heirloom zucchini',
      tradeoff: 'it is less forgiving where the warm season is short',
      growingNote: 'save it for timely plantings and warm sites'
    }
  },

  potatoes: {
    'yukon gold': {
      chooseWhen: 'early yellow potatoes',
      tradeoff: 'it is not a long-season storage russet',
      growingNote: 'use it when a forgiving earlier harvest matters'
    },
    norland: {
      chooseWhen: 'early potato harvests',
      tradeoff: 'it is more about speed than maximum main-crop yield',
      growingNote: 'good when you want less pressure at the end of the season'
    },
    'dark red norland': {
      chooseWhen: 'early red potatoes',
      tradeoff: 'it needs more room than the very fastest potato choices',
      growingNote: 'choose it when you want a red potato without going fully late-season'
    },
    kennebec: {
      chooseWhen: 'dependable main-crop potatoes',
      tradeoff: 'it needs more runway than early potatoes',
      growingNote: 'use it where the season can support a solid main-crop harvest'
    },
    'gold rush': {
      chooseWhen: 'main-crop russets',
      tradeoff: 'it is less forgiving than early potatoes',
      growingNote: 'plant on time so it has enough room to finish'
    },
    'russet burbank': {
      chooseWhen: 'long-season russets',
      tradeoff: 'it is a stretch in short-season areas',
      growingNote: 'save it for warmer sites, timely planting, and years when you can accept more risk'
    }
  },

  peas: {
    alaska: {
      chooseWhen: 'very early peas',
      tradeoff: 'it is practical more than a high-yield specialty pea',
      growingNote: 'plant early while conditions are still cool'
    },
    'little marvel': {
      chooseWhen: 'compact shelling peas',
      tradeoff: 'it is not a tall heavy-production pea',
      growingNote: 'use it where space or season length is limited'
    },
    'sugar ann': {
      chooseWhen: 'quick snap peas',
      tradeoff: 'it is about early snap production rather than long vines',
      growingNote: 'plant early for the best spring performance'
    },
    'green arrow': {
      chooseWhen: 'productive shelling peas',
      tradeoff: 'it needs a good cool window',
      growingNote: 'avoid late planting where spring heats quickly'
    },
    'tall telephone': {
      chooseWhen: 'tall late peas',
      tradeoff: 'it needs more cool-season runway than shorter pea types',
      growingNote: 'choose it only when spring timing is strong'
    }
  },

  broccoli: {
    'de cicco': {
      chooseWhen: 'flexible early broccoli and side shoots',
      tradeoff: 'heads may be less uniform than hybrid types',
      growingNote: 'harvest side shoots to extend production'
    },
    packman: {
      chooseWhen: 'dependable early broccoli heads',
      tradeoff: 'it is practical more than specialty',
      growingNote: 'use it for a straightforward early broccoli plan'
    },
    'green magic': {
      chooseWhen: 'strong early hybrid broccoli',
      tradeoff: 'it still needs cool growing conditions to finish well',
      growingNote: 'start early enough to avoid the worst heat'
    },
    belstar: {
      chooseWhen: 'reliable main-season broccoli',
      tradeoff: 'it needs more cool-season runway than early broccoli',
      growingNote: 'choose it where timing and temperature are supportive'
    },
    marathon: {
      chooseWhen: 'later broccoli plantings',
      tradeoff: 'it is more exposed if spring is delayed or summer heat arrives early',
      growingNote: 'save it for conditions where the crop can finish without heat pressure'
    }
  },

  cabbage: {
    'golden acre': {
      chooseWhen: 'early compact cabbage heads',
      tradeoff: 'it is not the biggest or best storage cabbage',
      growingNote: 'use it where fast, firm heads matter'
    },
    stonehead: {
      chooseWhen: 'reliable early cabbage',
      tradeoff: 'it is more about dependable heading than maximum size',
      growingNote: 'plant early enough for steady cool growth'
    },
    'early jersey wakefield': {
      chooseWhen: 'early pointed spring cabbage',
      tradeoff: 'it is not a storage-focused cabbage',
      growingNote: 'use it for earlier harvests rather than long keeping'
    },
    cheers: {
      chooseWhen: 'productive main-season cabbage',
      tradeoff: 'it needs more room than compact early cabbage',
      growingNote: 'choose it where the season supports a fuller cabbage crop'
    },
    'red express': {
      chooseWhen: 'a faster red cabbage option',
      tradeoff: 'it is chosen for color as much as storage or size',
      growingNote: 'use it when red cabbage matters but the season is not ideal for very slow types'
    },
    'storage no. 4': {
      chooseWhen: 'storage cabbage',
      tradeoff: 'it needs a longer finish than early cabbage',
      growingNote: 'save it for places with enough cool-season runway'
    }
  },

  carrots: {
    amsterdam: {
      chooseWhen: 'fast baby carrots',
      tradeoff: 'it is not the best choice for large storage roots',
      growingNote: 'harvest young rather than waiting for big roots'
    },
    nelson: {
      chooseWhen: 'dependable early Nantes carrots',
      tradeoff: 'it is not as storage-focused as heavier carrot types',
      growingNote: 'use it when quality roots matter but you still want a safer timeline'
    },
    yaya: {
      chooseWhen: 'smooth Nantes carrots',
      tradeoff: 'it is less about storage bulk than root quality',
      growingNote: 'choose it for a reliable eating carrot with a reasonable timeline'
    },
    bolero: {
      chooseWhen: 'full-size carrots with better storage potential',
      tradeoff: 'it needs more time than baby or early Nantes types',
      growingNote: 'give it loose soil and enough time for roots to size up'
    },
    'danvers 126': {
      chooseWhen: 'heavier roots in deeper soil',
      tradeoff: 'it is slower than early Nantes or baby carrot types',
      growingNote: 'use it where soil depth and timing both support larger roots'
    }
  },

  onions: {
    'walla walla': {
      chooseWhen: 'large sweet onions',
      tradeoff: 'it needs an early enough start to build size',
      growingNote: 'start early and avoid treating it like a quick crop'
    },
    copra: {
      chooseWhen: 'dependable storage onions',
      tradeoff: 'it still needs enough season to size up',
      growingNote: 'use it when storage matters more than sweetness'
    },
    redwing: {
      chooseWhen: 'red storage onions',
      tradeoff: 'it needs a supportive season for good bulb sizing',
      growingNote: 'plant early and keep growth steady'
    },
    patterson: {
      chooseWhen: 'long-keeping onions',
      tradeoff: 'it needs enough runway before the season closes',
      growingNote: 'choose it for storage-focused onion plantings'
    },
    'ailsa craig': {
      chooseWhen: 'large exhibition onions',
      tradeoff: 'it is more exposed in shorter seasons',
      growingNote: 'start early and grow it only where size is worth the extra risk'
    }
  },

  beets: {
    'early wonder': {
      chooseWhen: 'fast early beets',
      tradeoff: 'it is less about specialty color or novelty',
      growingNote: 'use it when speed and margin matter'
    },
    'red ace': {
      chooseWhen: 'reliable round red beets',
      tradeoff: 'it is practical more than specialty',
      growingNote: 'use it as a dependable all-purpose beet'
    },
    'detroit dark red': {
      chooseWhen: 'dependable standard beets',
      tradeoff: 'it is a balanced choice rather than the fastest beet',
      growingNote: 'use it as a straightforward all-purpose beet'
    },
    'touchstone gold': {
      chooseWhen: 'golden beet color',
      tradeoff: 'it is chosen partly for color and sweetness rather than maximum speed',
      growingNote: 'keep soil moisture steady so roots size smoothly'
    },
    chioggia: {
      chooseWhen: 'specialty color',
      tradeoff: 'it is chosen for novelty more than maximum margin',
      growingNote: 'grow it when the striped roots are worth a little extra timing risk'
    },
    cylindra: {
      chooseWhen: 'long slicing roots',
      tradeoff: 'it needs loose soil and steady sizing time',
      growingNote: 'avoid compacted beds if you want straighter roots'
    }
  },

  lettuce: {
    'black seeded simpson': {
      chooseWhen: 'quick leaf lettuce',
      tradeoff: 'it is not a structured head lettuce',
      growingNote: 'harvest leaves early and often'
    },
    'new red fire': {
      chooseWhen: 'red loose-leaf harvests',
      tradeoff: 'it is more about color than heading structure',
      growingNote: 'pick leaves young for the most flexible harvest window'
    },
    buttercrunch: {
      chooseWhen: 'dependable butterhead lettuce',
      tradeoff: 'it needs a little more time than loose-leaf lettuce',
      growingNote: 'use it when quality heads matter more than the fastest harvest'
    },
    jericho: {
      chooseWhen: 'romaine heads with better heat tolerance',
      tradeoff: 'it still needs a clean enough window to form upright heads',
      growingNote: 'use it where ordinary romaine struggles with warming conditions'
    },
    'parris island cos': {
      chooseWhen: 'classic romaine heads',
      tradeoff: 'it needs a cleaner cool-weather window than loose-leaf lettuce',
      growingNote: 'avoid planting it where heat will arrive before heads form'
    },
    salanova: {
      chooseWhen: 'uniform specialty lettuce heads',
      tradeoff: 'it is more specialized than a basic loose-leaf variety',
      growingNote: 'use it when harvest presentation and leaf quality matter'
    }
  },

  spinach: {
    bloomsdale: {
      chooseWhen: 'classic cool-weather spinach',
      tradeoff: 'it can struggle if spring warms quickly',
      growingNote: 'plant early and harvest before heat pressure builds'
    },
    space: {
      chooseWhen: 'spring spinach with better bolt resistance',
      tradeoff: 'it still prefers cool growing conditions',
      growingNote: 'use it when the spring window may warm faster than ideal'
    },
    tyee: {
      chooseWhen: 'a longer spinach harvest window',
      tradeoff: 'it is not always the quickest baby-leaf option',
      growingNote: 'use it where bolting pressure is a concern'
    },
    regiment: {
      chooseWhen: 'productive full-size spinach leaves',
      tradeoff: 'it needs enough cool weather to size up well',
      growingNote: 'plant it early enough that plants mature before heat stress'
    },
    avon: {
      chooseWhen: 'quick spinach leaves',
      tradeoff: 'it is more about speed than long harvest duration',
      growingNote: 'harvest young when the season is moving quickly'
    },
    reflect: {
      chooseWhen: 'fast spring spinach production',
      tradeoff: 'it still needs cool conditions for the best quality',
      growingNote: 'use it when you need spinach to move quickly before heat builds'
    }
  },

  radishes: {
    'cherry belle': {
      chooseWhen: 'quick round radishes',
      tradeoff: 'it is practical more than specialty',
      growingNote: 'harvest promptly before roots get pithy'
    },
    'french breakfast': {
      chooseWhen: 'mild oblong radishes',
      tradeoff: 'it is slightly less about pure speed than Cherry Belle',
      growingNote: 'use it when shape and mild flavor matter'
    }
  },

  cauliflower: {
    'snow crown': {
      chooseWhen: 'very early cauliflower heads',
      tradeoff: 'it is chosen for speed more than specialty color or size',
      growingNote: 'use it where finishing a head reliably matters most'
    },
    snowball: {
      chooseWhen: 'early cauliflower heads',
      tradeoff: 'it still needs steady conditions to make a good head',
      growingNote: 'avoid stress from heat, drought, or uneven growth'
    },
    amazing: {
      chooseWhen: 'main-season cauliflower',
      tradeoff: 'it is less forgiving than the earliest cauliflower choices',
      growingNote: 'use it where timing and temperature are steady enough'
    },
    cheddar: {
      chooseWhen: 'orange cauliflower color',
      tradeoff: 'it is chosen for color as much as short-season safety',
      growingNote: 'give it steady growth so heads form before heat or stress builds'
    },
    graffiti: {
      chooseWhen: 'purple specialty cauliflower',
      tradeoff: 'it is less about the safest finish and more about novelty',
      growingNote: 'save it for plantings where timing is clean and stress is manageable'
    },
    skywalker: {
      chooseWhen: 'larger later cauliflower heads',
      tradeoff: 'it needs more runway than early cauliflower choices',
      growingNote: 'avoid it where the crop already feels tight or heat-stressed'
    }
  },
  
  garlic: {
    music: {
      chooseWhen: 'cold-climate hardneck garlic',
      tradeoff: 'it is not the softneck choice for braiding',
      growingNote: 'plant in fall and give it winter protection where needed'
    },
    'california early': {
      chooseWhen: 'softneck garlic traits',
      tradeoff: 'it is less naturally suited to cold-climate hardneck conditions',
      growingNote: 'consider it where storage or braiding matters and winters are not too harsh'
    }
  }
};

function normalizeFitLabel(fitLabel) {
  if (fitLabel === 'good') return 'Good fit';
  if (fitLabel === 'workable') return 'Workable';
  if (fitLabel === 'tight') return 'Tight';
  if (fitLabel === 'poor') return 'Poor fit';
  return '—';
}

function buildClassRows(record) {
  const classes = Array.isArray(record?.fit?.varietyClassFits)
    ? record.fit.varietyClassFits
    : [];

  return classes.map((item) => ({
    label: item?.label || 'Unknown class',
    daysToMaturity: item?.daysToMaturity || record?.crop?.daysToMaturityTypical || null,
    gddTarget: item?.gddTarget || null,
    fitLabel: item?.fitLabel || null,
    fitLabelText: normalizeFitLabel(item?.fitLabel),
    fits: item?.fits === true
  }));
}

function buildVarietyPageCropName(record) {
  const grammar = getCropGrammar(record);
  return titleCaseWords(grammar?.adjectiveSingular || record?.cropName || 'Crop');
}

function buildCropPluralForVarieties(record) {
  const grammar = getCropGrammar(record);
  return String(grammar?.pluralLabel || record?.cropName || 'this crop').toLowerCase();
}

function buildCropVarietyForm(record) {
  const grammar = getCropGrammar(record);
  return grammar?.adjectiveSingular || grammar?.singularLabel || record?.cropName || 'crop';
}

function capitalizeFirst(text) {
  if (!text) return text;
  const value = String(text).trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function normalizeVarietyNameKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function getVarietyCopyOverride(record, item) {
  const cropKey = record?.cropKey || null;
  const varietyKey = normalizeVarietyNameKey(item?.name);

  if (!cropKey || !varietyKey) return null;

  return VARIETY_COPY_OVERRIDES[cropKey]?.[varietyKey] || null;
}

function getVarietyDecisionOverride(record, item) {
  const cropKey = record?.cropKey || null;
  const varietyKey = normalizeVarietyNameKey(item?.name);

  if (!cropKey || !varietyKey) return null;

  return VARIETY_DECISION_OVERRIDES[cropKey]?.[varietyKey] || null;
}

function buildTradeoffDisplay(text) {
  if (!text) return null;

  let value = String(text)
    .trim()
    .replace(/\s+/g, ' ');

  if (!value) return null;

  value = value
    .replace(/^it is\s+/i, '')
    .replace(/^it\s+/i, '');

  value = capitalizeFirst(value);

  if (!/[.!?]$/.test(value)) {
    value += '.';
  }

  return value;
}

function normalizeClassLabel(label) {
  if (!label) return null;

  const normalized = String(label)
    .trim()
    .toLowerCase()
    .replace(/\bvarieties\b/g, '')
    .replace(/\bvariety\b/g, '')
    .replace(/\brange\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized === 'very early' || normalized === 'very-early') return 'Very early';
  if (normalized === 'early') return 'Early';
  if (normalized === 'mid' || normalized === 'mid-season' || normalized === 'mid season') return 'Mid-season';
  if (normalized === 'late') return 'Late';

  return titleCaseWords(String(label).trim());
}

function inferBestForText(record, item) {
  const override = getVarietyCopyOverride(record, item);
  if (override?.bestFor) return override.bestFor;

  const cropKey = record?.cropKey || null;
  const classLabel = normalizeClassLabel(item?.classLabel || null);
  const note = String(item?.note || '').toLowerCase();

  if (note.includes('storage')) return 'storage';
  if (note.includes('runway')) return 'larger harvests';
  if (note.includes('early')) return 'earlier harvests';
  if (note.includes('forgiving')) return 'forgiving fit';
  if (note.includes('reliable')) return 'dependable default';
  if (note.includes('quick')) return 'speed';
  if (note.includes('classic')) return 'traditional performance';

  if (cropKey === 'sweet-corn' && classLabel === 'Very early') return 'short-season safety';
  if (cropKey === 'carrots' && classLabel === 'Early') return 'dependable default';
  if (cropKey === 'beets' && classLabel === 'Very early') return 'faster harvests';
  if (cropKey === 'lettuce' && classLabel === 'Very early') return 'quick harvest cycles';
  if (cropKey === 'swiss-chard' && classLabel === 'Mid-season') return 'larger harvests';

  if (classLabel === 'Very early') return 'safer short-season fit';
  if (classLabel === 'Early') return 'reliable early harvests';
  if (classLabel === 'Mid-season') return 'balanced main-season choice';
  if (classLabel === 'Late') return 'longer-season goals';

  return null;
}

function joinNamesForProse(items, limit = 3) {
  const names = (Array.isArray(items) ? items : [])
    .slice(0, limit)
    .map((item) => item?.name)
    .filter(Boolean);

  if (!names.length) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]}, and ${names[2]}`;
}

function lowercaseFirst(text) {
  if (!text) return '';
  const value = String(text).trim();
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : '';
}

function joinPhrasesForProse(phrases, conjunction = 'or') {
  const cleaned = [...new Set(
    (Array.isArray(phrases) ? phrases : [])
      .map((item) => lowercaseFirst(item))
      .filter(Boolean)
  )];

  if (!cleaned.length) return '';
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} ${conjunction} ${cleaned[1]}`;
  return `${cleaned[0]}, ${cleaned[1]}, ${conjunction} ${cleaned[2]}`;
}

function isCityCropEnabled(record) {
  const cityKey = record?.cityKey;
  const cropKey = record?.cropKey;

  if (!cityKey || !cropKey) return false;

  const allowedCrops = enabledCityCrops[cityKey];
  if (!Array.isArray(allowedCrops)) return false;

  return allowedCrops.includes(cropKey);
}

function getBestForPhrase(items, limit = 3) {
  return joinPhrasesForProse(
    (Array.isArray(items) ? items : [])
      .slice(0, limit)
      .map((item) => item?.bestFor)
      .filter(Boolean),
    'or'
  );
}

function getChoicePhrase(items, limit = 3) {
  return joinPhrasesForProse(
    (Array.isArray(items) ? items : [])
      .slice(0, limit)
      .map((item) => item?.chooseWhen || item?.bestFor)
      .filter(Boolean),
    'or'
  );
}

function getTradeoffPhrase(items, limit = 2) {
  return joinPhrasesForProse(
    (Array.isArray(items) ? items : [])
      .slice(0, limit)
      .map((item) => item?.tradeoff)
      .filter(Boolean),
    'and'
  );
}

function getGrowingNotePhrase(items, limit = 2) {
  return joinPhrasesForProse(
    (Array.isArray(items) ? items : [])
      .slice(0, limit)
      .map((item) => item?.growingNote)
      .filter(Boolean),
    'and'
  );
}

function buildPracticalQuickAnswer(record, namedVarieties, qa) {
  const bestDefaults = namedVarieties.bestDefaults || [];
  const safest = namedVarieties.safest || [];
  const workable = namedVarieties.workable || [];

  const bestChoicePhrase = getChoicePhrase(bestDefaults, 2);
  const safeChoicePhrase = getChoicePhrase(safest, 2);
  const workableChoicePhrase = getChoicePhrase(workable, 3);

  if (qa.isWorkableOnly && qa.workableNames) {
    return `For ${qa.cityName}, ${qa.workableNames} ${qa.workableIsPlural ? 'are' : 'is'} the most realistic ${qa.cropVarietyForm} ${qa.workableIsPlural ? 'options' : 'option'} for this short-season fit. ${qa.workableIsPlural ? 'They need' : 'It needs'} good timing, steady early growth, and realistic expectations.`;
  }

  if (qa.isBestOnly && qa.bestNames) {
    const allVeryEarly = bestDefaults.length > 0 &&
      bestDefaults.every((item) => normalizeClassLabel(item.classLabel) === 'Very early');

    if (allVeryEarly) {
      return `For ${qa.cityName}, ${qa.bestNames} ${qa.bestIsPlural ? 'are' : 'is'} the earliest ${qa.cropVarietyForm} ${qa.bestIsPlural ? 'varieties' : 'variety'} that make sense given the local growing season.`;
    }

    if (bestChoicePhrase) {
      return `For ${qa.cityName}, start with ${qa.bestNames} for ${qa.cropLabel} when you want ${bestChoicePhrase}.`;
    }

    return `For ${qa.cityName}, start with ${qa.bestNames} for ${qa.cropLabel}.`;
  }

  const parts = [];

  if (qa.bestNames) {
    parts.push(
      `For ${qa.cityName}, start with ${qa.bestNames} for ${qa.cropLabel}` +
      (bestChoicePhrase ? ` when you want ${bestChoicePhrase}.` : '.')
    );
  }

  if (qa.safeNames) {
    parts.push(
      `Choose ${qa.safeNames}` +
      (safeChoicePhrase ? ` when you want ${safeChoicePhrase}` : ' when you want more cushion or an earlier harvest') +
      '.'
    );
  }

  if (qa.workableNames) {
    parts.push(
      `Explore ${qa.workableNames}` +
      (workableChoicePhrase ? ` when you specifically want ${workableChoicePhrase}.` : ' when a specific variety trait matters more than the safest default.')
    );
  }

  return parts.join(' ');
}

function getNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function getRecordGddAvailable(record) {
  const direct =
    getNumber(record?.heat?.gddAvailable) ??
    getNumber(record?.heat?.available) ??
    getNumber(record?.heat?.availableTypical) ??
    getNumber(record?.heat?.seasonTotal) ??
    getNumber(record?.fit?.gddAvailable) ??
    getNumber(record?.fit?.heatAvailable);

  if (direct != null) return direct;

  const target = getNumber(record?.heat?.targetTypical);
  const margin = getNumber(record?.heat?.margin);

  if (target != null && margin != null) {
    return target + margin;
  }

  return null;
}

function getVarietyMargin(record, item) {
  const available = getRecordGddAvailable(record);
  const target = getNumber(item?.gddTarget);

  if (available == null || target == null) return null;
  return available - target;
}

function getVarietySortTarget(item) {
  return getNumber(item?.gddTarget) ?? -99999;
}

function getFastestVarieties(items) {
  return items
    .slice()
    .filter((item) => getVarietySortTarget(item) > 0)
    .sort((a, b) => {
      const targetDiff = getVarietySortTarget(a) - getVarietySortTarget(b);
      if (targetDiff !== 0) return targetDiff;
      return a.name.localeCompare(b.name);
    });
}

function getBestDefaultVarieties(record, items) {
  const available = getRecordGddAvailable(record);

  if (available == null) return [];

  const comfortable = items
    .filter((item) => {
      const margin = getVarietyMargin(record, item);
      return margin != null && margin >= 150;
    })
    .sort((a, b) => {
      const targetDiff = getVarietySortTarget(b) - getVarietySortTarget(a);
      if (targetDiff !== 0) return targetDiff;
      return a.name.localeCompare(b.name);
    });

  if (comfortable.length) return comfortable;

  return items
    .filter((item) => {
      const margin = getVarietyMargin(record, item);
      return margin != null && margin >= 0;
    })
    .sort((a, b) => {
      const marginA = getVarietyMargin(record, a) ?? -99999;
      const marginB = getVarietyMargin(record, b) ?? -99999;

      if (marginB !== marginA) return marginB - marginA;
      return a.name.localeCompare(b.name);
    });
}

function getFallbackClassGroupedVarieties(record, items) {
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const recommendedClass = normalizeClassLabel(varietyStrategy.defaultRecommendedVarietyLabel || null);
  const fastestClass = normalizeClassLabel(varietyStrategy.fastestReliableVarietyLabel || null);

  const bestDefaults = [];
  const safest = [];
  const workable = [];

  for (const item of items) {
    if (recommendedClass && item.classLabel === recommendedClass) {
      bestDefaults.push(item);
      continue;
    }

    if (fastestClass && item.classLabel === fastestClass) {
      safest.push(item);
      continue;
    }

    workable.push(item);
  }

  return { bestDefaults, safest, workable };
}

function dedupeVarieties(rows) {
  const seen = new Set();

  return rows.filter((item) => {
    const key = `${item.name}::${item.classLabel || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removePicked(rows, pickedGroups) {
  const pickedNames = new Set(
    pickedGroups
      .flat()
      .map((item) => item.name)
      .filter(Boolean)
  );

  return rows.filter((item) => !pickedNames.has(item.name));
}

function getClassFitMap(record) {
  const classes = Array.isArray(record?.fit?.varietyClassFits)
    ? record.fit.varietyClassFits
    : [];

  const map = new Map();

  for (const item of classes) {
    const label = normalizeClassLabel(
      item?.label ||
      item?.classLabel ||
      item?.displayLabel ||
      item?.name ||
      item?.key ||
      null
    );

    if (!label) continue;

    map.set(label, {
      label,
      daysToMaturity: item?.daysToMaturity || record?.crop?.daysToMaturityTypical || null,
      gddTarget: item?.gddTarget || null,
      fitLabel: item?.fitLabel || null,
      fitLabelText: normalizeFitLabel(item?.fitLabel),
      fits: item?.fits === true
    });
  }

  return map;
}

function getClassSpeedRank(classLabel) {
  const normalized = normalizeClassLabel(classLabel);

  if (normalized === 'Very early') return 1;
  if (normalized === 'Early') return 2;
  if (normalized === 'Mid-season') return 3;
  if (normalized === 'Late') return 4;

  return 99;
}

function getClassFitRank(fitLabel) {
  if (fitLabel === 'good') return 4;
  if (fitLabel === 'workable') return 3;
  if (fitLabel === 'tight') return 2;
  if (fitLabel === 'poor') return 1;
  return 0;
}

function normalizeNamedVarietyItem(record, item, classFitMap = null) {
  const classLabel = normalizeClassLabel(item?.classLabel || null);
  const classFit = classLabel && classFitMap ? classFitMap.get(classLabel) : null;
  const override = getVarietyCopyOverride(record, item);
  const decision = getVarietyDecisionOverride(record, item);
  const tradeoff = decision?.tradeoff || null;

  return {
    name: item?.name || 'Unnamed variety',
    note: capitalizeFirst(override?.note || item?.note || null),
    classLabel,
    daysToMaturity: item?.daysToMaturity || classFit?.daysToMaturity || null,
    gddTarget: item?.gddTarget || classFit?.gddTarget || null,
    fitLabel: classFit?.fitLabel || null,
    fitLabelText: classFit?.fitLabelText || null,
    fits: classFit?.fits === true,
    bestFor: override?.bestFor || inferBestForText(record, item),
    chooseWhen: decision?.chooseWhen || null,
    tradeoff,
    tradeoffDisplay: buildTradeoffDisplay(tradeoff),
    growingNote: decision?.growingNote || null
  };
}

function getStrongestFitRank(items) {
  return items.reduce((best, item) => {
    const rank = getClassFitRank(item.fitLabel);
    return rank > best ? rank : best;
  }, 0);
}

function sortBySpeedThenName(items) {
  return items.slice().sort((a, b) => {
    const speedDiff = getClassSpeedRank(a.classLabel) - getClassSpeedRank(b.classLabel);
    if (speedDiff !== 0) return speedDiff;
    return a.name.localeCompare(b.name);
  });
}

function sortBySlowerThenName(items) {
  return items.slice().sort((a, b) => {
    const speedDiff = getClassSpeedRank(b.classLabel) - getClassSpeedRank(a.classLabel);
    if (speedDiff !== 0) return speedDiff;
    return a.name.localeCompare(b.name);
  });
}

function classifyNamedVarieties(record) {
  const examples = Array.isArray(record?.fit?.fittingVarietyExamplesDetailed)
    ? record.fit.fittingVarietyExamplesDetailed
    : [];

  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const recommendedClass = normalizeClassLabel(varietyStrategy.defaultRecommendedVarietyLabel || null);
  const fastestClass = normalizeClassLabel(varietyStrategy.fastestReliableVarietyLabel || null);
  const slowestStillFittingClass = normalizeClassLabel(varietyStrategy.slowestStillFittingVarietyLabel || null);

  const classFitMap = getClassFitMap(record);

  const allExamples = dedupeVarieties(
    examples.map((item) => normalizeNamedVarietyItem(record, item, classFitMap))
  );

  const hasMatchedFitData = allExamples.some((item) => item.fitLabel);

  if (!hasMatchedFitData) {
    const grouped = getFallbackClassGroupedVarieties(record, allExamples);

    const bestDefaults = dedupeVarieties(grouped.bestDefaults);
    const safest = sortBySpeedThenName(
      removePicked(dedupeVarieties(grouped.safest), [bestDefaults])
    );
    const workable = sortBySlowerThenName(
      removePicked(dedupeVarieties(grouped.workable), [bestDefaults, safest])
    );

    return {
      bestDefaults,
      safest,
      workable,
      slowestStillFittingClass,
      totalNamedExamples: allExamples.length
    };
  }

  const fittingExamples = allExamples.filter((item) =>
    item.fitLabel === 'good' || item.fitLabel === 'workable'
  );

  const tightExamples = allExamples.filter((item) =>
    item.fitLabel === 'tight'
  );

  const usableExamples = fittingExamples.length ? fittingExamples : tightExamples;

  let bestDefaults = [];

  if (recommendedClass) {
    bestDefaults = usableExamples.filter((item) =>
      item.classLabel === recommendedClass &&
      item.fitLabel !== 'tight' &&
      item.fitLabel !== 'poor'
    );
  }

  if (!bestDefaults.length) {
    const strongestFitRank = getStrongestFitRank(usableExamples);

    bestDefaults = usableExamples.filter((item) =>
      item.classLabel &&
      getClassFitRank(item.fitLabel) === strongestFitRank &&
      item.fitLabel !== 'tight' &&
      item.fitLabel !== 'poor'
    );
  }

  if (!bestDefaults.length) {
    bestDefaults = usableExamples.filter((item) =>
      item.fitLabel &&
      getClassFitRank(item.fitLabel) === getStrongestFitRank(usableExamples)
    );
  }

  bestDefaults = sortBySlowerThenName(dedupeVarieties(bestDefaults));

  const bestSpeedRanks = bestDefaults
    .map((picked) => getClassSpeedRank(picked.classLabel))
    .filter((rank) => Number.isFinite(rank) && rank < 99);

  const fastestBestRank = bestSpeedRanks.length ? Math.min(...bestSpeedRanks) : 99;

  let safest = usableExamples.filter((item) => {
    if (!item.classLabel) return false;

    if (fastestClass && item.classLabel === fastestClass) {
      return true;
    }

    return getClassSpeedRank(item.classLabel) < fastestBestRank;
  });

  safest = sortBySpeedThenName(
    removePicked(dedupeVarieties(safest), [bestDefaults])
  );

  const workable = sortBySlowerThenName(
    removePicked(
      dedupeVarieties([
        ...fittingExamples,
        ...tightExamples
      ]),
      [bestDefaults, safest]
    )
  );

  return {
    bestDefaults,
    safest,
    workable,
    slowestStillFittingClass,
    totalNamedExamples: allExamples.length
  };
}

function buildTraitBasedVarietySummary(record) {
  const cityName = record?.cityName || 'this location';
  const cropKey = record?.cropKey || null;

  const summaries = {
    spinach: `Spinach variety choice in ${cityName} is mostly about cool-weather reliability, bolt resistance, and fit for the spring or fall planting window.`,
    radishes: `Radish variety choice in ${cityName} is mostly about harvest speed, root shape, flavor, and how quickly you want to pick.`,
    lettuce: `Lettuce variety choice in ${cityName} is mostly about leaf type, head type, heat tolerance, bolt resistance, and succession planting.`,
    kale: `Kale variety choice in ${cityName} is mostly about leaf type, plant size, harvest style, and how quickly you want usable leaves.`,
    'swiss-chard': `Swiss chard variety choice in ${cityName} is mostly about plant size, stem color, harvest style, and how quickly you want usable leaves.`,
    peas: `Pea variety choice in ${cityName} is mostly about whether you want shelling peas, snap peas, compact plants, or the quickest cool-season harvest.`,
    garlic: `Garlic variety choice in ${cityName} is mostly about winter hardiness, storage, clove type, and whether hardneck or softneck traits matter more.`,
    beets: `Beet variety choice in ${cityName} is mostly about root size, storage, color, flavor, and how much timing cushion you want.`,
    carrots: `Carrot variety choice in ${cityName} is mostly about baby carrots, Nantes-style fresh eating roots, heavier storage roots, and how much timing cushion you want.`
  };

  return summaries[cropKey] || null;
}

function getAvailableVarietyClassLabels(record) {
  const classes = Array.isArray(record?.fit?.varietyClassFits)
    ? record.fit.varietyClassFits
    : [];

  return [...new Set(
    classes
      .map((item) => normalizeClassLabel(
        item?.label ||
        item?.classLabel ||
        item?.displayLabel ||
        item?.name ||
        item?.key ||
        null
      ))
      .filter(Boolean)
  )];
}

function hasNarrowEarlyVarietyRange(record) {
  const labels = getAvailableVarietyClassLabels(record);

  if (!labels.length || labels.length > 2) return false;

  return labels.every((label) =>
    label === 'Very early' || label === 'Early'
  );
}

function buildVarietySeasonContext(record) {
  const cityName = record?.cityName || 'this location';
  const cropKey = record?.cropKey || null;
  const cropLabel = buildCropPluralForVarieties(record);
  const decisionProfile = record?.diagnostics?.decisionProfile || null;

  const cropContexts = {
    beets: `The local season can support ${cropLabel}, but earlier choices leave more room for cool starts, delayed planting, and roots sizing up cleanly.`,
    carrots: `The local season can support ${cropLabel}, but variety choice still affects whether you are aiming for fast roots, fresh eating quality, or better storage.`,
    onions: `The local season can support ${cropLabel}, so the main choice is usually about bulb size, sweetness, color, and keeping quality.`,
    lettuce: `The local season gives ${cropLabel} plenty of chances, but faster types are easier to fit around heat, bolting, and succession planting.`,
    kale: `The local season is usually forgiving for ${cropLabel}, so variety choice is mostly about leaf type, harvest style, and how much time you want plants to size up.`,
    'swiss-chard': `The local season is usually forgiving for ${cropLabel}, so variety choice is mostly about speed, plant size, color, and harvest style.`,
    cabbage: `The local season can support ${cropLabel}, but slower storage types need a cleaner run than compact early heads.`,
    broccoli: `The local season can support ${cropLabel}, but timing still matters because heat, stress, or delayed starts can reduce head quality.`,
    cauliflower: `The local season can support ${cropLabel}, but cauliflower is less forgiving of stress, heat, or uneven growth than many other cool-season crops.`,
    potatoes: `The local season can support ${cropLabel}, but early types give more cushion while main-crop types ask for a longer finish.`,
    peas: `The local season can support ${cropLabel}, but earlier types are easier to fit into the cool part of the season before heat becomes a problem.`,
    beans: `The local season can support ${cropLabel}, but faster bush types give more cushion than longer-running pole or specialty beans.`,
    cucumbers: `The local season can support ${cropLabel}, but earlier and compact types are more forgiving when warm weather starts late or growth stalls.`,
    zucchini: `The local season can support ${cropLabel}, but faster varieties give you more room if spring soil warms slowly or the first planting struggles.`,
    spinach: `For spinach, the useful choice is usually about cool-weather reliability, bolt resistance, and how well the variety fits the spring or fall window.`,
    radishes: `For radishes, the useful choice is usually about speed, root shape, flavor, and how quickly you want to harvest.`,
    garlic: `The local season can support ${cropLabel}, but variety choice still matters for winter hardiness, storage, and whether you want hardneck or softneck traits.`,
    tomatoes: `The local season can support ${cropLabel} better when varieties ripen early, because slower types spend more of the warm window before they start producing well.`,
    peppers: `The local season can support ${cropLabel} only when plants get a warm start, steady growth, and enough heat to ripen before conditions fade.`,
    'sweet-corn': `The local season can support ${cropLabel} best when varieties are quick enough to finish ears before the warm window closes.`
  };

  if (cropContexts[cropKey]) {
    return cropContexts[cropKey];
  }

  if (decisionProfile === 'very_comfortable') {
    return `The local season gives ${cropLabel} enough room, so variety choice is more about harvest style, storage, flavor, or size than basic maturity.`;
  }

  if (decisionProfile === 'comfortable') {
    return `The season can support ${cropLabel}, but staying near the recommended range leaves more room for ordinary delays, cool stretches, and uneven early growth.`;
  }

  if (decisionProfile === 'workable') {
    return `The season is workable for ${cropLabel}, but faster varieties leave more room for cool starts, delayed planting, and a clean finish.`;
  }

  if (decisionProfile === 'tight' || decisionProfile === 'constrained') {
    return `The season is tight for ${cropLabel}, so slower varieties spend margin quickly and faster choices usually make the crop more forgiving.`;
  }

  return `Local season length still matters, especially when slower varieties need more time to size up or finish cleanly.`;
}

function buildVarietyFitSummary(record) {
  const cityName = record?.cityName || 'this location';
  const cropLabel = buildCropPluralForVarieties(record);
  const cropVarietyForm = String(buildCropVarietyForm(record)).toLowerCase();
  const cropKey = record?.cropKey || null;
  const strategy = record?.diagnostics?.varietyStrategy || {};
  const decisionProfile = record?.diagnostics?.decisionProfile || null;
  const recommendedDisplay = getVarietyClassDisplay(strategy.defaultRecommendedVarietyLabel);
  const context = buildVarietySeasonContext(record);
  const isNarrowEarlyRange = hasNarrowEarlyVarietyRange(record);

  const demandingCropCopy = {
    tomatoes: `${capitalizeFirst(cropLabel)} are often difficult in ${cityName} because the local season can run out of time or heat before slower varieties finish well.`,
    peppers: `${capitalizeFirst(cropVarietyForm)} variety choice matters in ${cityName} because even quicker types need warm starts, steady growth, and enough heat to ripen well.`,
    'sweet-corn': `${capitalizeFirst(cropVarietyForm)} is a demanding choice in ${cityName}, usually favoring the quickest varieties that can finish ears before the season closes.`
  };

const traitBasedCropCopy = {
  spinach: `Spinach variety choice in ${cityName} is mostly about cool-weather reliability, bolt resistance, and fit for the spring or fall planting window.`,
  radishes: `Radish variety choice in ${cityName} is mostly about harvest speed, root shape, flavor, and how quickly you want to pick.`,
  lettuce: `Lettuce variety choice in ${cityName} is mostly about leaf type, head type, heat tolerance, bolt resistance, and succession planting.`,
  kale: `Kale variety choice in ${cityName} is mostly about leaf type, plant size, harvest style, and how quickly you want usable leaves.`,
  'swiss-chard': `Swiss chard variety choice in ${cityName} is mostly about plant size, stem color, harvest style, and how quickly you want usable leaves.`,
  peas: `Pea variety choice in ${cityName} is mostly about whether you want shelling peas, snap peas, compact plants, or the quickest cool-season harvest.`,
  garlic: `Garlic variety choice in ${cityName} is mostly about winter hardiness, storage, clove type, and whether hardneck or softneck traits matter more.`,
  beets: `Beet variety choice in ${cityName} is mostly about root size, storage, color, flavor, and how much timing cushion you want.`,
  carrots: `Carrot variety choice in ${cityName} is mostly about baby carrots, Nantes-style fresh eating roots, heavier storage roots, and how much timing cushion you want.`,
  cabbage: `Cabbage variety choice in ${cityName} is mostly about head size, storage quality, compactness, and how much time you want to give the crop before harvest.`,
  cauliflower: `Cauliflower variety choice in ${cityName} is mostly about head reliability, stress tolerance, timing, and whether you want the safest early path or a fuller main-season crop.`,
  broccoli: `Broccoli variety choice in ${cityName} is mostly about head reliability, side-shoot production, stress tolerance, and how cleanly the crop fits the cool part of the season.`,
cucumbers: `Cucumber variety choice in ${cityName} is mostly about slicer type, plant size, harvest speed, warmth needs, and whether you want a compact, classic, long, or specialty cucumber.`,
beans: `Bean variety choice in ${cityName} is mostly about bush versus pole habit, harvest speed, pod type, plant size, and how much warm-season runway the crop needs.`,
zucchini: `Zucchini variety choice in ${cityName} is mostly about harvest speed, plant vigor, flavor, texture, and whether you want the safest early crop or a more distinctive type.`,
};

  if (
    demandingCropCopy[cropKey] &&
    (decisionProfile === 'workable' || decisionProfile === 'tight' || decisionProfile === 'constrained')
  ) {
    return demandingCropCopy[cropKey];
  }

  if (traitBasedCropCopy[cropKey]) {
    return traitBasedCropCopy[cropKey];
  }

  if (isNarrowEarlyRange) {
    return `${capitalizeFirst(cropVarietyForm)} variety choice in ${cityName} is mostly about harvest style, reliability, and the growing traits that fit your planting window.`;
  }

  if (recommendedDisplay) {
    return `${capitalizeFirst(recommendedDisplay.lower)} ${cropVarietyForm} varieties are usually the strongest all-around match in ${cityName}. ${context}`;
  }

  return `${capitalizeFirst(cropVarietyForm)} variety choice matters in ${cityName}, especially when slower maturity ranges start spending too much local margin. ${context}`;
}

function buildQuickAnswer(record, namedVarieties) {
  const qa = buildQuickAnswerParts(record, namedVarieties);
  return qa.practicalQuickAnswer ||
    `For ${qa.cityName}, the best choices for ${qa.cropLabel} are usually the earlier and more reliable varieties rather than slower options that spend too much local margin.`;
}

function hasMultipleNames(value) {
  return Boolean(value && (value.includes(' and ') || value.includes(',')));
}

function buildQuickAnswerParts(record, namedVarieties) {
  const cityName = record?.cityName || 'this location';
  const cropLabel = buildCropPluralForVarieties(record);
  const cropVarietyForm = String(buildCropVarietyForm(record)).toLowerCase();
  const decisionProfile = record?.diagnostics?.decisionProfile || null;

  const bestDefaults = namedVarieties.bestDefaults || [];
  const safest = namedVarieties.safest || [];
  const workable = namedVarieties.workable || [];

  const bestNames = joinNamesForProse(bestDefaults, 3);
  const safeNames = joinNamesForProse(safest, 2);
  const workableNames = joinNamesForProse(workable, 3);

  const bestIsPlural = hasMultipleNames(bestNames);
  const safeIsPlural = hasMultipleNames(safeNames);
  const workableIsPlural = hasMultipleNames(workableNames);

  const bestRanks = bestDefaults
    .map((picked) => getClassSpeedRank(picked.classLabel))
    .filter((rank) => Number.isFinite(rank) && rank < 99);

  const bestSlowestRank = bestRanks.length ? Math.max(...bestRanks) : null;

  const slowerSecondaries = workable.filter((item) => {
    const classRank = getClassSpeedRank(item.classLabel);
    if (bestSlowestRank == null) return false;
    return classRank > bestSlowestRank;
  });

  const slowerNames = joinNamesForProse(slowerSecondaries, 2);
  const slowerIsPlural = hasMultipleNames(slowerNames);

  const qa = {
    cityName,
    cropLabel,
    cropVarietyForm,
    decisionProfile,
    bestNames,
    safeNames,
    workableNames,
    slowerNames,
    bestIsPlural,
    safeIsPlural,
    workableIsPlural,
    slowerIsPlural,
    bestForPhrase: getBestForPhrase(bestDefaults, 2),
    safeForPhrase: getBestForPhrase(safest, 2),
    workableForPhrase: getBestForPhrase(workable, 3),
    bestChoicePhrase: getChoicePhrase(bestDefaults, 2),
    safeChoicePhrase: getChoicePhrase(safest, 2),
    workableChoicePhrase: getChoicePhrase(workable, 3),
    bestTradeoffPhrase: getTradeoffPhrase(bestDefaults, 2),
    safeTradeoffPhrase: getTradeoffPhrase(safest, 2),
    workableTradeoffPhrase: getTradeoffPhrase(workable, 3),
    bestGrowingNotePhrase: getGrowingNotePhrase(bestDefaults, 2),
    safeGrowingNotePhrase: getGrowingNotePhrase(safest, 2),
    workableGrowingNotePhrase: getGrowingNotePhrase(workable, 3),
    isWorkableOnly: !bestNames && !safeNames && !!workableNames,
    isBestOnly: !!bestNames && !safeNames && !workableNames
  };

  return {
    ...qa,
    practicalQuickAnswer: buildPracticalQuickAnswer(record, namedVarieties, qa)
  };
}

function buildVarietyLocalContext(record, namedVarieties) {
  const cityName = record?.cityName || 'this location';
  const cropLabel = buildCropPluralForVarieties(record);
  const cropVarietyForm = String(buildCropVarietyForm(record)).toLowerCase();
  const decisionProfile = record?.diagnostics?.decisionProfile || null;

  const bestDefaults = namedVarieties.bestDefaults || [];
  const safest = namedVarieties.safest || [];
  const workable = namedVarieties.workable || [];

  const bestNames = joinNamesForProse(bestDefaults, 2);
  const safeNames = joinNamesForProse(safest, 2);

  const bestRanks = bestDefaults
    .map((picked) => getClassSpeedRank(picked.classLabel))
    .filter((rank) => Number.isFinite(rank) && rank < 99);

  const bestSlowestRank = bestRanks.length ? Math.max(...bestRanks) : null;

  const slowerSecondaries = workable.filter((item) => {
    const classRank = getClassSpeedRank(item.classLabel);
    if (bestSlowestRank == null) return false;
    return classRank > bestSlowestRank;
  });

  const fasterSecondaries = workable.filter((item) => {
    const classRank = getClassSpeedRank(item.classLabel);
    if (bestSlowestRank == null) return false;
    return classRank < bestSlowestRank;
  });

  const slowerNames = joinNamesForProse(slowerSecondaries, 2);
  const fasterSecondaryNames = joinNamesForProse(fasterSecondaries, 2);
  const hasFastSafest = safest.length > 0;

  if (decisionProfile === 'very_comfortable') {
    if (slowerNames && bestNames) {
      return `In ${cityName}, you have enough seasonal room to consider slower ${cropLabel}, but ${bestNames} still make the most sense as the starting point. Choose ${slowerNames} when you specifically want what those varieties offer, not because you need to push the season harder.`;
    }

    if (hasFastSafest && bestNames && safeNames) {
      return `In ${cityName}, ${bestNames} do not have to be the absolute fastest ${cropVarietyForm} choices to be practical. Use ${safeNames} when you want extra insurance or an earlier harvest.`;
    }
  }

  if (decisionProfile === 'comfortable') {
    if (slowerNames && bestNames && safeNames) {
      return `In ${cityName}, ${bestNames} are the steadier starting point. Choose ${safeNames} when you want an earlier or safer harvest, and save ${slowerNames} for plantings where you can give the crop a cleaner start and a little more patience.`;
    }

    if (slowerNames && bestNames) {
      return `In ${cityName}, ${bestNames} are the cleaner default. ${slowerNames} can still be worth growing, but they make more sense when you are choosing for a specific harvest type rather than the safest finish.`;
    }

    if (hasFastSafest && bestNames && safeNames) {
      return `In ${cityName}, ${bestNames} are still practical defaults, but ${safeNames} give you more room for delays, cool stretches, or uneven early growth.`;
    }
  }

  if (decisionProfile === 'workable' || decisionProfile === 'tight' || decisionProfile === 'constrained') {
    if (hasFastSafest && bestNames && safeNames) {
      return `In ${cityName}, the safer move is to keep the crop on the faster side. ${bestNames} are the practical starting point, while ${safeNames} give you the most room if conditions are slow or planting is delayed.`;
    }

    if (slowerNames) {
      return `In ${cityName}, slower ${cropLabel} should be treated carefully. ${slowerNames} can still be worth trying for a specific goal, but they are not the safest default when the season has less spare room.`;
    }
  }

  if (slowerNames && bestNames) {
    return `In ${cityName}, ${bestNames} are the cleaner default, while ${slowerNames} are better saved for a specific harvest goal or a year when timing is especially good.`;
  }

  if (hasFastSafest && bestNames && safeNames) {
    return `In ${cityName}, ${bestNames} are the main starting point, while ${safeNames} are the safer choice when you want more cushion.`;
  }

  if (fasterSecondaryNames && bestNames) {
    return `In ${cityName}, ${bestNames} are the default, but ${fasterSecondaryNames} can still make sense when reliability matters more than pushing the crop harder.`;
  }

  return null;
}

module.exports = function () {
  const records = Array.isArray(getRecords()) ? getRecords() : [];

  return records
    .filter((record) => isCityCropEnabled(record))
    .map((record) => {
      const classRows = buildClassRows(record);
      const namedVarieties = classifyNamedVarieties(record);
      const copy = buildCropClimateCopy(record, 'varieties');
      const strategy = record?.diagnostics?.varietyStrategy || {};

      const defaultVarietyDisplay = getVarietyClassDisplay(strategy.defaultRecommendedVarietyLabel);
      const fastestVarietyDisplay = getVarietyClassDisplay(strategy.fastestReliableVarietyLabel);
      const slowestStillFittingDisplay = getVarietyClassDisplay(strategy.slowestStillFittingVarietyLabel);

      return {
        ...record,
        pageType: 'varieties',
        copy: {
          ...copy,
          fitSummary: buildVarietyFitSummary(record),
          cropDisplayName: buildVarietyPageCropName(record),
          varietyPageCropName: buildVarietyPageCropName(record),
          varietyQuickAnswer: buildQuickAnswer(record, namedVarieties),
          varietyQuickAnswerParts: buildQuickAnswerParts(record, namedVarieties),
          availableGddFromPlanting: getRecordGddAvailable(record),
          defaultVarietyDisplay,
          fastestVarietyDisplay,
          slowestStillFittingDisplay
        },
        url: `${record.urlBase}best-varieties/`,
        varietyTables: {
          strongerRows: classRows.filter((item) => item.fitLabel === 'good' || item.fitLabel === 'workable'),
          slowerRiskRows: classRows.filter((item) => item.fitLabel === 'tight' || item.fitLabel === 'poor')
        },
        namedVarieties
      };
    });
};