const {
  getCropConceptPhrase,
  getCropSubjectPhrase,
  getCropAdjectiveSingular,
  getBeVerb,
  getHaveVerb,
  getMatureVerb,
  getBestVarietyPhrase,
  getBestVarietySentence
} = require('./cropGrammar');

const { mmddToLong, getFitLabel, getFitRank } = require('./cropClimateHelpers');

const FIT_RANKS = {
  'Risky': 0,
  'Borderline': 1,
  'Good Fit': 2,
  'Strong Fit': 3,
  'Excellent Fit': 4
};

const { buildPageSections } = require('./buildPageSections');

function getFitSummary(pageType, fitLabel, record) {
  const fitRank = getFitRank(record);
  const cityName = record?.cityName || 'this location';
  const cropConcept = getCropConceptPhrase(record);
  const cropSubject = getCropSubjectPhrase(record);
  const haveVerb = getHaveVerb(record);

  if (pageType === 'maturity') {
    if (fitRank >= 3) {
      return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${cityName} usually leaves enough seasonal heat for the crop to mature when planted on time.`;
    }
    if (fitRank === 2) {
      return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${cityName} is usually workable, though variety choice and planting date still affect how comfortably the crop finishes.`;
    }
    if (fitRank === 1) {
      return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${cityName} can work, but the result depends more on timing and variety speed than it does in easier climates.`;
    }
    return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${cityName} is usually a stretch unless gardeners gain time with faster varieties or added protection.`;
  }

  if (pageType === 'tooLate') {
    const subject = cropSubject.charAt(0).toUpperCase() + cropSubject.slice(1);

    if (fitRank >= 4) {
      return `${subject} still usually ${haveVerb} comfortable planting room in ${cityName}.`;
    }
    if (fitRank === 3) {
      return `${subject} still usually ${haveVerb} workable planting room in ${cityName}, though the remaining margin is less forgiving than the normal window.`;
    }
    if (fitRank === 2) {
      return `${subject} can still work from a later planting in ${cityName}, but the remaining margin gets less forgiving as the normal window closes.`;
    }
    if (fitRank === 1) {
      return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${cityName} becomes a narrower bet once the easy planting window closes.`;
    }
    return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${cityName} is usually beyond the comfortable planting window when gardeners are relying on local frost and heat averages alone.`;
  }

  if (pageType === 'varieties') {
    const bestVarietySentence = getBestVarietySentence(record);
    if (bestVarietySentence) return bestVarietySentence;
    return `Variety speed matters for ${getCropNameLower(record)} in ${cityName}.`;
  }

  if (pageType === 'monthly') {
    return getMonthlyIntro(record, pageType);
  }

  return null;
}

function getActionStartClass(record) {
  const fitRank = getFitRank(record);
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};

  const defaultVarietyLabel =
    varietyStrategy.defaultRecommendedVarietyLabel ||
    getBestVarietyLabel(record) ||
    'a well-matched';

  const safestVarietyLabel =
    varietyStrategy.fastestReliableVarietyLabel ||
    defaultVarietyLabel;

  if (fitRank <= 1) {
    return safestVarietyLabel;
  }

  if (fitRank === 2) {
    return defaultVarietyLabel;
  }

  return defaultVarietyLabel;
}

function getCropSpecificActionBullet(record) {
  const cropKey = record?.cropKey || null;
  const fitLabel = getFitLabel(record);

  switch (cropKey) {
    case 'carrots':
      if (fitLabel === 'Excellent Fit') {
        return 'Use the extra margin to improve quality and sizing, because carrots here are usually limited more by execution than by season length.';
      }
      if (fitLabel === 'Strong Fit') {
        return 'Protect root-sizing time by sowing on schedule, because carrots usually work well here when they get a full, steady run through the season.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Avoid delay if you want full root sizing, because carrots can still work well here but lose flexibility faster once planting slips.';
      }
      if (fitLabel === 'Borderline') {
        return 'Protect root-sizing time aggressively, because later sowing shortens the useful growing window faster than many gardeners expect.';
      }
      return 'Only push carrots here if you can protect early momentum, because once root growth falls behind, the remaining season is less forgiving than it looks.';

    case 'onions':
      if (fitLabel === 'Excellent Fit') {
        return 'Use the available margin to improve bulb size and consistency, because onions here usually have enough season if they start cleanly.';
      }
      if (fitLabel === 'Strong Fit') {
        return 'Protect early bulb-building time, because the biggest gain here comes from getting onions established early and growing steadily.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Start as early as your system allows, because onions still work here but lose final bulb size when too much early runway disappears.';
      }
      if (fitLabel === 'Borderline') {
        return 'Preserve every bit of early runway, because onions become much less forgiving once late starts cut into bulb-building time.';
      }
      return 'Only push onions here if you can preserve early establishment, because once bulb-building time shrinks too far, the finish gets much tighter.';

    case 'beans':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Use warm soil and a quick start to keep beans moving, because the main gain here is consistency rather than rescue.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Wait for warm enough soil and protect early momentum, because beans here usually work but can lose margin quickly after a slow start.';
      }
      if (fitLabel === 'Borderline') {
        return 'Prioritize warm soil and quick emergence, because beans pay a bigger penalty for a slow start than many gardeners expect.';
      }
      return 'Only push beans here when soil warmth and timing are both working in your favor, because a slow start is hard to recover from in a tight season.';

    case 'cucumbers':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Use the available margin to improve steadiness and harvest quality, because cucumbers here usually benefit most from a clean early run.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Prioritize warmth early, because delayed flowering can quietly erase more of the remaining season than the raw margin suggests.';
      }
      if (fitLabel === 'Borderline') {
        return 'Protect early warmth and flowering time, because cucumbers can still work here but often lose margin faster than they appear to on paper.';
      }
      return 'Only push cucumbers here if you can create extra warmth early, because once flowering is delayed, the remaining season tightens quickly.';

    case 'tomatoes':
      if (fitLabel === 'Good Fit') {
        return 'Treat early time as your most valuable resource, because tomatoes here stay workable only when ripening is not already starting from behind.';
      }
      if (fitLabel === 'Borderline') {
        return 'Protect ripening time by starting with the fastest realistic classes, because tomatoes lose comfort quickly once fruiting begins too late.';
      }
      return 'Treat early time as your most valuable resource, because once tomatoes fall behind, ripening usually becomes the real bottleneck.';

    case 'peppers':
      if (fitLabel === 'Good Fit') {
        return 'Protect warmth and early momentum, because peppers can work here but stay much more sensitive to cool setbacks than easier crops.';
      }
      if (fitLabel === 'Borderline') {
        return 'Use the fastest realistic classes and protect heat early, because peppers rarely have enough spare room to recover from cool slowdowns.';
      }
      return 'Protect heat and early momentum aggressively, because peppers rarely recover well once cool conditions slow them down.';

    case 'sweet-corn':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Plant promptly into warm soil, because sweet corn usually performs best when early progress stays smooth and uninterrupted.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Preserve early momentum in warm soil, because sweet corn here usually works best when it does not have to recover lost time.';
      }
      if (fitLabel === 'Borderline') {
        return 'Plant promptly into warm soil, because sweet corn usually needs steady early progress more than rescue tactics later.';
      }
      return 'Only push sweet corn here if warm soil, fast classes, and timing all line up, because the crop usually does not forgive delay once the margin is tight.';

    case 'cauliflower':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Focus on steady, even growth rather than extra heat, because consistency usually matters more than raw season length once cauliflower fits.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Keep growth even and avoid timing slips, because cauliflower here usually works best when the crop never loses momentum.';
      }
      if (fitLabel === 'Borderline') {
        return 'Protect consistency as much as timing, because cauliflower can still work here but becomes much less forgiving once conditions swing hard.';
      }
      return 'Only push cauliflower here if you can keep timing and conditions unusually steady, because the crop is sensitive once local margin turns tight.';

    case 'broccoli':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Keep broccoli moving steadily into its heading window, because the best gains here come from consistency rather than stretching the season.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Protect heading timing by keeping growth steady, because broccoli still works here but warm-weather quality problems become more likely once progress slips.';
      }
      if (fitLabel === 'Borderline') {
        return 'Keep the crop on schedule into its heading window, because broccoli loses comfort quickly once timing drifts late.';
      }
      return 'Only push broccoli here if you can preserve a clean heading window, because late progress usually exposes the crop to weaker finishing conditions.';

    case 'cabbage':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Protect early establishment and even growth, because cabbage here usually benefits more from steadiness than from extra season tricks.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Keep cabbage on schedule and growing evenly, because the crop still works here but gets less forgiving once growth becomes uneven.';
      }
      if (fitLabel === 'Borderline') {
        return 'Preserve early establishment carefully, because cabbage can still work here but loses reliability faster once timing slips.';
      }
      return 'Only push cabbage here if you can keep establishment and timing unusually clean, because the local margin is not naturally forgiving.';

    case 'lettuce':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Use the margin to improve quality and timing, because lettuce here is usually limited more by conditions than by basic maturity.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Use the workable margin to protect quality, because lettuce usually fits here but still loses quality when conditions swing too hard.';
      }
      if (fitLabel === 'Borderline') {
        return 'Protect the coolest, steadiest part of the season, because lettuce can still work here but quality drops faster once timing slips.';
      }
      return 'Only push lettuce here if you can preserve cool, steady conditions, because the crop stops feeling easy once margin and quality both tighten.';

    case 'spinach':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Use the available margin to stay in the cooler part of the season, because spinach quality usually depends more on temperature stability than on basic maturity.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Protect the cool growing window, because spinach still works here but becomes less dependable once heat arrives too early.';
      }
      if (fitLabel === 'Borderline') {
        return 'Use the coolest workable part of the season, because spinach loses quality and flexibility quickly once the timing drifts warmer.';
      }
      return 'Only push spinach here if you can preserve a cool growing window, because the crop is much less forgiving once timing and temperature both tighten.';

    case 'peas':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Protect the cool part of the season, because peas here usually work best when flowering and pod fill happen before warmer conditions build.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Keep peas in the cooler part of the season, because the crop still works here but loses comfort once flowering drifts late.';
      }
      if (fitLabel === 'Borderline') {
        return 'Protect the early cool window carefully, because peas can still work here but quickly lose reliability once warmth arrives too soon.';
      }
      return 'Only push peas here if you can preserve the cool flowering window, because the crop is much less forgiving once the season warms out of sync.';

    case 'potatoes':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Preserve bulking time by planting on schedule, because potatoes usually work best here when they get a long, uninterrupted run before fall slows them down.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Protect bulking time early, because potatoes still work here but lose comfort once too much of the season disappears before tubers size up.';
      }
      if (fitLabel === 'Borderline') {
        return 'Keep bulking time as intact as possible, because potatoes can still work here but become tighter once early runway shrinks.';
      }
      return 'Only push potatoes here if you can preserve a long enough bulking window, because the crop gets much less forgiving once timing slips too far.';

    case 'beets':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Protect root-development time by keeping growth even, because beets usually benefit most here from steadiness rather than rescue tactics.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Protect root-development time by avoiding delay, because beets still work here but lose flexibility once growth slips later into the season.';
      }
      if (fitLabel === 'Borderline') {
        return 'Preserve steady root growth from the start, because beets become much less forgiving once early progress slows in a tight season.';
      }
      return 'Only push beets here if you can keep growth even from the start, because the crop usually does not recover cleanly once margin tightens too far.';

    case 'zucchini':
      if (fitLabel === 'Excellent Fit' || fitLabel === 'Strong Fit') {
        return 'Get zucchini moving quickly in warm conditions, because the best gains here usually come from momentum rather than late recovery efforts.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Protect warm early growth, because zucchini usually works here but becomes less forgiving once momentum is lost at the start.';
      }
      if (fitLabel === 'Borderline') {
        return 'Prioritize warm, fast early growth, because zucchini can still work here but often tightens quickly once early progress slips.';
      }
      return 'Only push zucchini here if you can create fast, warm early momentum, because late recovery usually comes too slowly once the season is tight.';

    default:
      if (fitLabel === 'Excellent Fit') {
        return 'Use the available margin to improve consistency and quality rather than spending it casually.';
      }
      if (fitLabel === 'Strong Fit') {
        return 'Use the comfortable margin to improve consistency and preserve flexibility rather than relying on rescue tactics.';
      }
      if (fitLabel === 'Good Fit') {
        return 'Protect the workable margin early, because it is easier to preserve progress than to recover lost time later.';
      }
      if (fitLabel === 'Borderline') {
        return 'Protect every part of the remaining margin, because this fit depends on keeping timing and progress aligned.';
      }
      return 'Stack advantages early, because this crop usually does not give much room for recovery once it falls behind.';
    }
}

function getActionLayer(record, pageType) {
  if (pageType !== 'maturity') return [];

  const fitLabel = getFitLabel(record);
  const actionStartClass = getActionStartClass(record);
  const cropKey = record?.cropKey || null;

  const warmSeasonKeys = new Set([
    'peppers',
    'tomatoes',
    'eggplant',
    'melons',
    'watermelons',
    'pumpkin',
    'winter-squash',
    'sweet-corn',
    'basil',
    'cucumbers',
    'zucchini'
  ]);

  const isWarmSeason = warmSeasonKeys.has(cropKey);
  const cropSpecificBullet = getCropSpecificActionBullet(record);

  if (fitLabel === 'Excellent Fit') {
    return [
      `Use ${String(actionStartClass).toLowerCase()} selections when you want the easiest balance between flexibility and reliability.`,
      'Stay close to the normal planting window if you want the widest local margin.',
      cropSpecificBullet || 'Use the extra room here to improve consistency and harvest goals, not just basic maturity.'
    ];
  }

  if (fitLabel === 'Strong Fit') {
    return [
      `Start with ${String(actionStartClass).toLowerCase()} selections if you want the safest result.`,
      'Stay close to the normal planting window so the crop keeps a comfortable local buffer.',
      cropSpecificBullet || 'Use the comfortable margin to improve consistency rather than relying on rescue tactics later.'
    ];
  }

  if (fitLabel === 'Good Fit') {
    return [
      `Start with ${String(actionStartClass).toLowerCase()} selections if you want the most dependable finish.`,
      'Protect early progress, because this fit is workable but not endlessly forgiving.',
      cropSpecificBullet || 'Treat this crop as a selective fit rather than a casual one.'
    ];
  }

  if (fitLabel === 'Borderline') {
    return [
      `Stay close to ${String(actionStartClass).toLowerCase()} selections, because slower classes spend margin quickly.`,
      'Avoid delay wherever possible, since even a small timing loss can change the answer.',
      cropSpecificBullet || (
        isWarmSeason
          ? 'Prioritize warm starts, warm sites, or protection if you want this crop to remain realistic.'
          : 'Protect early growth, because a slow start is harder to recover from in a tight season.'
      )
    ];
  }

  return [
    `Treat ${record.cropName} as a stretch crop here and start with ${String(actionStartClass).toLowerCase()} selections only.`,
    'Stack advantages early, because this crop does not naturally fit the local season on averages alone.',
    cropSpecificBullet || (
      isWarmSeason
        ? 'Use protection, warm sites, and strong starts if you want a realistic chance of success.'
        : 'Only push this crop if you have a clear reason and a setup that offsets the local season limits.'
    )
  ];
}

function getWhatBreaksFirst(record, pageType) {
  if (pageType !== 'maturity') return null;

  const fitRank = getFitRank(record);
  const cropKey = record?.cropKey || null;
  const commonFailureMode = record?.strategy?.commonFailureMode || null;

  if (fitRank >= 3) {
    if (commonFailureMode) {
      return `The first issue here is usually not basic maturity, but whether growth stays on a steady path to good performance. ${commonFailureMode}`;
    }
    return `The first issue here is usually not basic maturity, but consistency. Once the crop already fits comfortably, quality or steadiness tends to become the more useful concern.`;
  }

  if (fitRank === 2) {
    if (commonFailureMode) {
      return `This crop usually works here, but the first thing that tends to narrow the margin is a less-than-ideal start or growing pattern. ${commonFailureMode}`;
    }
    return `This crop usually works here, but the first thing that tends to cause trouble is losing part of an otherwise workable buffer through timing or slower progress.`;
  }

  if (fitRank === 1) {
    if (cropKey === 'beans') {
      return `Beans can work here, but the first thing that usually causes trouble is a slow start. Cold soil, delayed sowing, or slower classes can use up a narrow local margin surprisingly quickly.`;
    }

    if (commonFailureMode) {
      return `The first thing that usually goes wrong here is that a narrow local margin gets used up earlier than gardeners expect. ${commonFailureMode}`;
    }

    return `The first thing that usually goes wrong here is that a narrow local margin disappears quickly once planting slips or crop progress slows.`;
  }

  if (cropKey === 'peppers') {
    return `For peppers here, the first thing that usually goes wrong is that the crop falls behind early and never fully catches up. Cool conditions slow growth, fruiting starts late, and ripening runs out of season.`;
  }

  if (commonFailureMode) {
    return `The first thing that usually goes wrong here is that the crop falls behind early enough that the local season cannot fully recover the loss. ${commonFailureMode}`;
  }

  return `The first thing that usually goes wrong here is that the crop loses time early and never fully recovers enough local margin to finish comfortably.`;
}

function getPlantingRoomMeaning(record, pageType) {
  if (pageType !== 'tooLate') return null;

  const fitRank = getFitRank(record);
  const cropNameLower = getCropNameLower(record);

  if (fitRank >= 4) {
    return `There is still real planting room left for ${cropNameLower} here. The question is usually not whether the crop still fits, but how much flexibility you want to preserve before the easier window narrows further.`;
  }

  if (fitRank === 3) {
    return `There is still comfortable planting room left here, but less of the season is now doing the work for you. Waiting longer usually changes the answer gradually rather than all at once.`;
  }

  if (fitRank === 2) {
    return `There is still workable planting room left here, but it is no longer the same kind of forgiving decision as the earlier window. The crop can still work, but the remaining room is easier to spend accidentally.`;
  }

  if (fitRank === 1) {
    return `This is a narrow late-planting decision now. The crop can still work, but there is not much room left for slower classes, weak starts, or another meaningful delay.`;
  }

  return `This is already beyond the comfortable late-planting window on average local conditions. A realistic attempt usually depends on faster varieties, stronger starts, warmer setups, or added protection all working together.`;
}

function getLatePlantingLevers(record, pageType) {
  if (pageType !== 'tooLate') return { intro: null, items: [] };

  const fitRank = getFitRank(record);
  const cropKey = record?.cropKey || null;
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const safestVarietyLabel =
    varietyStrategy.fastestReliableVarietyLabel ||
    getBestVarietyLabel(record) ||
    'the fastest realistic';

  const warmSeasonKeys = new Set([
    'peppers',
    'tomatoes',
    'eggplant',
    'melons',
    'watermelons',
    'pumpkin',
    'winter-squash',
    'sweet-corn',
    'basil',
    'cucumbers',
    'zucchini'
  ]);

  const isWarmSeason = warmSeasonKeys.has(cropKey);

  const siteText = isWarmSeason
    ? 'Warm sites, reflected heat, and protection matter more now because the crop has less season left to recover from cool slowdowns.'
    : 'Site quality still matters, but the first gains usually come from timing and variety speed once the late window tightens.';

  const timingText = record?.planting?.transplantRecommended
    ? 'A strong head start or transplant timing can preserve much more of the remaining season than a delayed direct start.'
    : 'Another delay after this point usually costs more than gardeners expect because the remaining room is already shrinking.';

  if (fitRank >= 4) {
    return {
      intro: 'This is still more of a flexibility decision than a rescue decision.',
      items: [
        {
          title: 'Variety speed',
          text: `${safestVarietyLabel} still leaves the most room, but the crop is not yet depending on the fastest class just to stay realistic.`
        },
        {
          title: 'Timing',
          text: 'Waiting still spends some margin, but not usually fast enough to turn the crop into a narrow salvage attempt right away.'
        },
        {
          title: 'Execution quality',
          text: 'A clean start and steady growth matter more now than dramatic rescue tactics.'
        }
      ]
    };
  }

  if (fitRank === 3) {
    return {
      intro: 'This is still a workable late window, but the crop is now becoming less forgiving than it was from the normal schedule.',
      items: [
        {
          title: 'Variety speed',
          text: `${safestVarietyLabel} usually keeps the late answer on the easier side.`
        },
        {
          title: 'Timing',
          text: 'The crop still has room, but the answer is no longer as relaxed once more of the normal window is gone.'
        },
        {
          title: 'Execution quality',
          text: 'The more cleanly the crop gets moving now, the less likely the finish is to depend on rescue later.'
        }
      ]
    };
  }

  if (fitRank === 2) {
    return {
      intro: 'This late window is still real, but it now behaves more like a narrower decision than a normal planting choice.',
      items: [
        {
          title: 'Variety speed',
          text: `${safestVarietyLabel} usually preserves the most dependable remaining room.`
        },
        {
          title: 'Timing',
          text: timingText
        },
        {
          title: 'Site quality',
          text: siteText
        }
      ]
    };
  }

  if (fitRank === 1) {
    return {
      intro: 'At this point, the crop usually depends on a small set of levers all pointing in the right direction.',
      items: [
        {
          title: 'Fast enough varieties',
          text: `${safestVarietyLabel} matters first because slower classes usually spend the little remaining room too quickly.`
        },
        {
          title: 'Lost time',
          text: 'Even a modest extra delay can change the answer from tight-but-realistic to not especially sensible.'
        },
        {
          title: 'Warmth and protection',
          text: siteText
        }
      ]
    };
  }

  return {
    intro: 'At this point, a late planting only becomes realistic when gardeners can stack multiple advantages instead of relying on ordinary timing alone.',
    items: [
      {
        title: 'Fastest realistic varieties',
        text: `${safestVarietyLabel} is usually the starting point, not just the cautious option.`
      },
      {
        title: 'Head start',
        text: timingText
      },
      {
        title: 'Warm sites and protection',
        text: siteText
      }
    ]
  };
}

function getMaturityFitBadgeClass(record) {
  const fitRank = getFitRank(record);

  if (fitRank >= 4) return 'surplus';
  if (fitRank === 3) return 'strong';
  if (fitRank === 2) return 'good';
  if (fitRank === 1) return 'borderline';
  return 'risky';
}

function getMaturityFitBadgeLabel(record) {
  const fitRank = getFitRank(record);

  if (fitRank >= 4) return 'Excellent chance of maturity here';
  if (fitRank === 3) return 'Strong chance of maturity here';
  if (fitRank === 2) return 'Good fit for maturity here';
  if (fitRank === 1) return 'Borderline conditions for maturity here';
  return 'Risky fit for maturity here';
}

function getMaturityFitBoxText(record) {
  const fitRank = getFitRank(record);
  const cropSubject = getCropSubjectPhrase(record);
  const beVerb = getBeVerb(record);
  const haveVerb = beVerb === 'is' ? 'has' : 'have';
  const matureVerb = beVerb === 'is' ? 'matures' : 'mature';
  const subject =
    cropSubject.charAt(0).toUpperCase() + cropSubject.slice(1);

  if (fitRank >= 4) {
    return `${subject} usually ${haveVerb} plenty of local season and heat to mature here, so the main question is usually how much flexibility you want to keep.`;
  }

  if (fitRank === 3) {
    return `${subject} usually ${matureVerb} comfortably here when planted on time, though timing and variety choice still shape how easy the finish feels.`;
  }

  if (fitRank === 2) {
    return `${subject} usually ${beVerb === 'is' ? 'works' : 'work'} here, but the local margin is less forgiving once planting slips or maturity classes get slower.`;
  }

  if (fitRank === 1) {
    return `${subject} can still mature here, but the local margin is narrow enough that timing, variety speed, and steady early progress matter a lot.`;
  }

  return `${subject} ${beVerb} more of a stretch crop here unless gardeners gain time with faster varieties, earlier starts, or added protection.`;
}


function getVarietyFitBreakdown(record, pageType) {
  if (pageType !== 'varieties') return [];

  const fits = Array.isArray(record?.fit?.varietyClassFits)
    ? record.fit.varietyClassFits
    : [];

  return fits.map((item) => {
    let meaning = 'no clear local margin estimate';

    if (item?.margin != null) {
      if (item.margin >= 800) {
        meaning = 'very comfortable here';
      } else if (item.margin >= 300) {
        meaning = 'usually realistic here';
      } else if (item.margin > 0) {
        meaning = 'a tighter but still workable fit';
      } else {
        meaning = 'more of a stretch here';
      }
    }

    return {
      label: item?.label || 'Unknown',
      margin: item?.margin ?? null,
      meaning
    };
  });
}

function getVarietyFitIntro(record, pageType) {
  if (pageType !== 'varieties') return null;

  const fitRank = getFitRank(record);
  const cropAdjective = getCropAdjectiveSingular(record);
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const defaultVarietyLabel =
    varietyStrategy.defaultRecommendedVarietyLabel ||
    getBestVarietyLabel(record) ||
    'the safest';
  const fastestVarietyLabel =
    varietyStrategy.fastestReliableVarietyLabel || defaultVarietyLabel;

  if (fitRank >= 4) {
    return `Several ${cropAdjective} maturity classes can make sense here, so the main question is usually which ones give the best balance of flexibility, reliability, and harvest goals.`;
  }

  if (fitRank === 3) {
    return `${defaultVarietyLabel} selections are usually the strongest default here, but more than one maturity class can still work with comfortable room to spare.`;
  }

  if (fitRank === 2) {
    return `More than one maturity class can work here, but the better choices usually stay close to the classes that leave the most dependable local margin.`;
  }

  if (fitRank === 1) {
    return `Variety speed matters a lot here because the local season leaves much less room once classes get slower. ${fastestVarietyLabel} selections usually protect the best remaining margin.`;
  }

  return `Only the fastest realistic ${cropAdjective} classes are usually worth serious attention here, because slower options leave too little room for a normal finish.`;
}

function getVarietyChoiceGuidance(record, pageType) {
  if (pageType !== 'varieties') return { intro: null, items: [] };

  const fitRank = getFitRank(record);
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const classes = Array.isArray(record?.fit?.varietyClassFits) ? record.fit.varietyClassFits : [];
  const fitting = classes.filter((item) => item?.fits);

  const defaultVarietyLabel =
    varietyStrategy.defaultRecommendedVarietyLabel ||
    getBestVarietyLabel(record) ||
    'the safest';
  const fastestVarietyLabel =
    varietyStrategy.fastestReliableVarietyLabel || defaultVarietyLabel;
  const slowestVarietyLabel =
    varietyStrategy.slowestStillFittingVarietyLabel || defaultVarietyLabel;

  const cropNameLower = getCropNameLower(record);
  const cropKey = record?.cropKey || null;

  const warmSeasonKeys = new Set([
    'peppers',
    'tomatoes',
    'eggplant',
    'melons',
    'watermelons',
    'pumpkin',
    'winter-squash',
    'sweet-corn',
    'basil',
    'cucumbers',
    'zucchini'
  ]);

  const isWarmSeason = warmSeasonKeys.has(cropKey);
  const hasTightClassSpread =
    fitting.length <= 2 ||
    fastestVarietyLabel === slowestVarietyLabel ||
    defaultVarietyLabel === fastestVarietyLabel && defaultVarietyLabel === slowestVarietyLabel;

  if (hasTightClassSpread) {
    if (fitRank >= 3) {
      return {
        intro: `Here, variety choice is less about drawing a hard line between safe and risky classes, and more about choosing the maturity range that best matches your preferred harvest timing and garden goals.`,
        items: [
          {
            title: 'Most dependable choice',
            text: `${defaultVarietyLabel} is usually the strongest all-around fit in this climate.`
          },
          {
            title: 'Other workable option',
            text: `${slowestVarietyLabel} can still make sense here when gardeners want a slightly different harvest pattern without giving up too much local reliability.`
          }
        ]
      };
    }

return {
  intro: `Here, the workable maturity range is fairly narrow, so the main job is usually choosing the class that preserves the best remaining local margin.`,
  items:
    slowestVarietyLabel && slowestVarietyLabel !== defaultVarietyLabel
      ? [
          {
            title: 'Most dependable choice',
            text: `${defaultVarietyLabel} usually gives the strongest local balance of reliability and timing room.`
          },
          {
            title: 'Other workable option',
            text: `${slowestVarietyLabel} can still work, but it gives away a bit more room once timing slips or conditions are less favorable.`
          }
        ]
      : [
          {
            title: 'Most dependable choice',
            text: `${defaultVarietyLabel} usually gives the strongest local balance of reliability and timing room.`
          }
        ]
};
  }

  if (fitRank >= 4) {
    return {
      intro: `The main choice here is usually not whether ${cropNameLower} can finish at all, but how cautious or ambitious you want to be with your variety selection.`,
      items: [
        {
          title: 'Safest choice',
          text: `${fastestVarietyLabel} selections usually leave the most room for delay, uneven early growth, or a cooler stretch.`
        },
        {
          title: 'Best default choice',
          text: `${defaultVarietyLabel} selections usually give the best overall balance of reliability and local flexibility.`
        },
        {
          title: 'More ambitious choice',
          text: `${slowestVarietyLabel} selections can still make sense when gardeners want a broader harvest window or are optimizing for garden goals rather than basic maturity protection.`
        }
      ]
    };
  }

  if (fitRank === 3) {
    return {
      intro: `This crop usually fits well here, but the choice between safer and slower classes still affects how forgiving the season feels.`,
      items: [
        {
          title: 'Safest choice',
          text: `${fastestVarietyLabel} selections usually preserve the strongest local buffer.`
        },
        {
          title: 'Best default choice',
          text: `${defaultVarietyLabel} selections usually balance a dependable finish with enough flexibility for an ordinary season.`
        },
        {
          title: 'More ambitious choice',
          text: `${slowestVarietyLabel} selections can still work, but they trade away some local margin and make ordinary delays more expensive.`
        }
      ]
    };
  }

  if (fitRank === 2) {
    return {
      intro: `This crop usually works here, but variety choice still affects how forgiving the season feels once planting timing or growing conditions are less than ideal.`,
      items: [
        {
          title: 'Safest choice',
          text: `${fastestVarietyLabel} selections usually leave the most dependable room.`
        },
        {
          title: 'Best default choice',
          text: `${defaultVarietyLabel} selections are often the strongest balance between local realism and crop goals.`
        },
        {
          title: 'More ambitious choice',
          text: `${slowestVarietyLabel} selections may still work, but they reduce the margin for delay, cooler conditions, or weaker early growth.`
        }
      ]
    };
  }

  if (fitRank === 1) {
    return {
      intro: `Here, the difference between a safer and a stretch variety matters a lot because the local season does not leave much extra room once classes get slower.`,
      items: [
        {
          title: 'Safest choice',
          text: `${fastestVarietyLabel} selections are usually the better default because they protect what little margin remains.`
        },
        {
          title: 'Best default choice',
          text: `${defaultVarietyLabel} is usually the strongest realistic choice if gardeners still want a worthwhile local finish.`
        },
        {
          title: 'More ambitious choice',
          text: `${slowestVarietyLabel} selections quickly become narrower bets and usually need stronger timing or more favorable conditions.`
        }
      ]
    };
  }

  return {
    intro: `For ${cropNameLower} here, variety choice is the main factor separating realistic attempts from wishful ones.`,
    items: [
      {
        title: 'Safest choice',
        text: `${fastestVarietyLabel} selections are usually the starting point, not just the cautious option.`
      },
      {
        title: 'Best default choice',
        text: `${defaultVarietyLabel} is only worth choosing when it still leaves a realistic local finish.`
      },
      {
        title: 'More ambitious choice',
        text: isWarmSeason
          ? `${slowestVarietyLabel} selections are usually only worth considering with very strong starts, warm sites, and realistic expectations.`
          : `${slowestVarietyLabel} selections are usually only worth considering when gardeners have a clear reason to push the edge and a setup that offsets the local limits.`
      }
    ]
  };
}

function getVarietyFailureMode(record, pageType) {
  if (pageType !== 'varieties') return null;

  const fitRank = getFitRank(record);
  const cropAdjective = getCropAdjectiveSingular(record);
  const cropKey = record?.cropKey || null;
  const commonFailureMode = record?.strategy?.commonFailureMode || null;

  if (cropKey === 'peppers') {
    return `The most common problem with slower pepper varieties here is that they fall just far enough behind that fruiting and ripening start too late to finish comfortably before frost.`;
  }

  if (cropKey === 'beans') {
    return `The most common problem with slower bean varieties here is not that they always fail outright, but that they leave too little room for delay, cool starts, or a weaker early run through the season.`;
  }

  if (fitRank >= 4) {
    if (commonFailureMode) {
      return `On easier pages, the problem with slower classes is usually less about basic maturity and more about whether they give away unnecessary flexibility or consistency. ${commonFailureMode}`;
    }
    return `On easier pages, the problem with slower classes is usually less about basic maturity and more about whether they give away unnecessary flexibility or consistency.`;
  }

  if (fitRank === 3) {
    if (commonFailureMode) {
      return `The main problem with slower ${cropAdjective} varieties here is that they reduce a comfortable margin enough that ordinary timing slips or weaker early growth become noticeably more expensive. ${commonFailureMode}`;
    }
    return `The main problem with slower ${cropAdjective} varieties here is that they reduce a comfortable margin enough that ordinary timing slips or weaker early growth become noticeably more expensive.`;
  }

  if (fitRank === 2) {
    if (commonFailureMode) {
      return `The most common problem with slower ${cropAdjective} varieties here is that they reduce a workable margin enough that ordinary timing slips or uneven growth become much more expensive. ${commonFailureMode}`;
    }
    return `The most common problem with slower ${cropAdjective} varieties here is that they reduce a workable margin enough that ordinary timing slips or uneven growth become much more expensive.`;
  }

  if (fitRank === 1) {
    if (commonFailureMode) {
      return `The most common problem with slower ${cropAdjective} varieties here is that they fall just far enough behind that the remaining season is no longer forgiving. ${commonFailureMode}`;
    }
    return `The most common problem with slower ${cropAdjective} varieties here is that they leave too little room for a normal finish once the season stops being forgiving.`;
  }

  if (commonFailureMode) {
    return `The most common problem with slower ${cropAdjective} varieties here is that they lose enough early or mid-season time that the local season cannot fully recover the loss. ${commonFailureMode}`;
  }

  return `The most common problem with slower ${cropAdjective} varieties here is that they leave too little room for a realistic local finish.`;
}

function getVarietyExamplesIntro(record, pageType) {
  if (pageType !== 'varieties') return null;

  const fitRank = getFitRank(record);
  const cropNameLower = getCropNameLower(record);

  if (fitRank >= 4) {
    return `These examples reflect the maturity classes that fit comfortably enough to make sense in this climate.`;
  }

  if (fitRank === 3) {
    return `These examples stay close to the maturity classes that usually balance reliable local maturity with enough room to keep the season forgiving.`;
  }

  if (fitRank === 2) {
    return `These examples are tied to the maturity classes that usually give ${cropNameLower} the most dependable local chance to finish well.`;
  }

  if (fitRank === 1) {
    return `These examples stay close to the maturity classes that preserve the most realistic local margin.`;
  }

  return `These examples focus on the fastest realistic classes, because slower options usually leave too little room for a normal local finish.`;
}

function getVarietyExamples(record, pageType) {
  if (pageType !== 'varieties') return [];

  const detailed = Array.isArray(record?.fit?.fittingVarietyExamplesDetailed)
    ? record.fit.fittingVarietyExamplesDetailed
    : [];

  if (detailed.length) {
    return detailed.slice(0, 8).map((item) => ({
      name: item?.name || 'Unnamed variety',
      note: item?.note || null
    }));
  }

  const fallback = Array.isArray(record?.recommendedVarieties)
    ? record.recommendedVarieties
    : [];

  return fallback.slice(0, 8).map((item) => ({
    name: item?.name || 'Unnamed variety',
    note: item?.note || null
  }));
}

function monthNameToIndex(monthName) {
  if (!monthName) return null;

  const map = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
  };

  return map[String(monthName).trim().toLowerCase()] || null;
}

function mmddToMonthIndex(mmdd) {
  if (!mmdd) return null;
  const [month] = String(mmdd).split('-').map(Number);
  return Number.isFinite(month) ? month : null;
}

function getMonthlyWindowPosition(record) {
  const monthIndex =
    Number.isFinite(record?.monthNumber) ? record.monthNumber : monthNameToIndex(record?.monthName);
  const plantingMonth = mmddToMonthIndex(record?.planting?.primaryPlantingDate);
  const safeMonth = mmddToMonthIndex(record?.timing?.latestPlantingDates?.safe);
  const borderlineMonth = mmddToMonthIndex(record?.timing?.latestPlantingDates?.borderline);

  if (!Number.isFinite(monthIndex)) return 'unclear';

  if (Number.isFinite(plantingMonth) && monthIndex < plantingMonth) return 'before_window';
  if (Number.isFinite(plantingMonth) && monthIndex === plantingMonth) return 'normal_window';
  if (Number.isFinite(safeMonth) && monthIndex <= safeMonth) return 'later_but_workable';
  if (Number.isFinite(borderlineMonth) && monthIndex <= borderlineMonth) return 'tight';
  return 'usually_too_late';
}

function getMonthlyIntro(record, pageType) {
  if (pageType !== 'monthly') return null;

  const cropConcept = getCropConceptPhrase(record);
  const cityName = record?.cityName || 'this location';
  const monthName = record?.monthName || 'this month';
  const fitRank = getFitRank(record);
  const windowPosition = getMonthlyWindowPosition(record);

  if (windowPosition === 'before_window') {
    return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${monthName} is usually earlier than the normal planting window in ${cityName}, so the question is usually whether gardeners are intentionally starting early rather than following the normal local schedule.`;
  }

  if (windowPosition === 'normal_window') {
    return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${monthName} usually lines up well with the normal local planting window in ${cityName}.`;
  }

  if (windowPosition === 'later_but_workable') {
    return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${monthName} can still make sense in ${cityName}, but the remaining margin is less forgiving than it is from the normal window.`;
  }

  if (windowPosition === 'tight') {
    return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${monthName} is a tighter local bet in ${cityName}, so timing and variety speed matter more than they do from the normal planting window.`;
  }

  if (fitRank <= 1 || windowPosition === 'usually_too_late') {
    return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${monthName} is usually beyond the safer local planting window in ${cityName} unless gardeners are deliberately stacking the odds in its favor.`;
  }

  return `${cropConcept[0].toUpperCase() + cropConcept.slice(1)} in ${monthName} changes the local planting equation in ${cityName}, so the useful question is how much margin is still left and what has to go right.`;
}

function getMonthStatusBullets(record, pageType) {
  if (pageType !== 'monthly') return [];

  const bullets = [];
  const plantingDateLong = mmddToLong(record?.planting?.primaryPlantingDate);
  const safeDateLong = mmddToLong(record?.timing?.latestPlantingDates?.safe);
  const borderlineDateLong = mmddToLong(record?.timing?.latestPlantingDates?.borderline);
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const defaultVarietyLabel =
    varietyStrategy.defaultRecommendedVarietyLabel ||
    getBestVarietyLabel(record);

  const windowPosition = getMonthlyWindowPosition(record);

  if (windowPosition === 'before_window') {
    bullets.push({
      title: 'Local position',
      text: 'This month usually falls before the normal planting window.'
    });
  } else if (windowPosition === 'normal_window') {
    bullets.push({
      title: 'Local position',
      text: 'This month usually overlaps the normal planting window.'
    });
  } else if (windowPosition === 'later_but_workable') {
    bullets.push({
      title: 'Local position',
      text: 'This month is later than the normal window, but still usually workable from the averages.'
    });
  } else if (windowPosition === 'tight') {
    bullets.push({
      title: 'Local position',
      text: 'This month is usually in the tighter part of the local planting range.'
    });
  } else if (windowPosition === 'usually_too_late') {
    bullets.push({
      title: 'Local position',
      text: 'This month is usually beyond the more comfortable local planting window.'
    });
  }

  if (plantingDateLong) {
    bullets.push({
      title: 'Typical planting date',
      text: `The normal local planting date is around ${plantingDateLong}.`
    });
  }

  if (safeDateLong) {
    bullets.push({
      title: 'Comfortable cutoff',
      text: `The more comfortable late date is around ${safeDateLong}.`
    });
  } else if (borderlineDateLong) {
    bullets.push({
      title: 'Tighter cutoff',
      text: `A tighter last realistic date is around ${borderlineDateLong}.`
    });
  }

  if (defaultVarietyLabel) {
    bullets.push({
      title: 'Best default variety range',
      text: `${defaultVarietyLabel} is usually the strongest default when margin matters.`
    });
  }

  return bullets;
}

function getWindowPositionIntro(record, pageType) {
  if (pageType !== 'monthly') return null;

  const monthName = record?.monthName || 'this month';
  const cityName = record?.cityName || 'this location';
  const cropConcept = getCropConceptPhrase(record);
  const windowPosition = getMonthlyWindowPosition(record);

  if (windowPosition === 'before_window') {
    return `${monthName} usually sits ahead of the normal planting window for ${cropConcept} in ${cityName}, so gardeners are usually deciding whether they are intentionally pushing early rather than following the normal schedule.`;
  }

  if (windowPosition === 'normal_window') {
    return `${monthName} usually sits inside the normal planting window for ${cropConcept} in ${cityName}, so this is more about normal local timing than rescue logic.`;
  }

  if (windowPosition === 'later_but_workable') {
    return `${monthName} usually sits just beyond the main planting window, but not so far beyond it that the crop automatically stops making sense.`;
  }

  if (windowPosition === 'tight') {
    return `${monthName} usually sits in the narrower part of the local window, where the crop can still work but mistakes get more expensive.`;
  }

  return `${monthName} usually sits beyond the safer local planting window, so the main question becomes whether gardeners can still justify the crop with faster classes, stronger starts, or other advantages.`;
}

function getWindowPositionDetails(record, pageType) {
  if (pageType !== 'monthly') return null;

  const safeDateLong = mmddToLong(record?.timing?.latestPlantingDates?.safe);
  const borderlineDateLong = mmddToLong(record?.timing?.latestPlantingDates?.borderline);
  const plantingDateLong = mmddToLong(record?.planting?.primaryPlantingDate);

  if (safeDateLong && borderlineDateLong && safeDateLong === borderlineDateLong) {
    return `In this local data, the month lines up against a single main cutoff around ${safeDateLong}.`;
  }

  if (safeDateLong && borderlineDateLong) {
    return `In this local data, the more comfortable part of the range runs to about ${safeDateLong}, while the tighter edge runs to about ${borderlineDateLong}.`;
  }

  if (plantingDateLong) {
    return `The normal local planting date is around ${plantingDateLong}, which is the baseline this month is being judged against.`;
  }

  return null;
}

function getMonthTradeoffs(record, pageType) {
  if (pageType !== 'monthly') return { intro: null, items: [] };

  const fitRank = getFitRank(record);
  const monthName = record?.monthName || 'this month';
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const defaultVarietyLabel =
    varietyStrategy.defaultRecommendedVarietyLabel ||
    getBestVarietyLabel(record) ||
    'a well-matched';
  const fastestVarietyLabel =
    varietyStrategy.fastestReliableVarietyLabel || defaultVarietyLabel;
  const cropKey = record?.cropKey || null;

  const warmSeasonKeys = new Set([
    'peppers',
    'tomatoes',
    'eggplant',
    'melons',
    'watermelons',
    'pumpkin',
    'winter-squash',
    'sweet-corn',
    'basil',
    'cucumbers',
    'zucchini'
  ]);

  const isWarmSeason = warmSeasonKeys.has(cropKey);
  const windowPosition = getMonthlyWindowPosition(record);

  let intro = `Planting in ${monthName} changes the local margin, so the better decision usually comes from understanding what this month protects and what it spends.`;

  if (windowPosition === 'before_window') {
    intro = `Planting in ${monthName} usually means trying to gain time early, so the tradeoff is between getting a head start and exposing the crop to colder or less settled conditions.`;
  } else if (windowPosition === 'normal_window') {
    intro = `Planting in ${monthName} usually means working inside the normal local window, so the tradeoffs are mostly about execution quality rather than rescue logic.`;
  } else if (windowPosition === 'tight' || fitRank <= 1) {
    intro = `Planting in ${monthName} usually means working with less spare room, so variety speed, timing, and early momentum matter more than they do in easier months.`;
  }

  const items = [
    {
      title: 'Variety speed',
      text: `${fastestVarietyLabel} selections usually protect the most room when this month is tighter or later than the normal window.`
    },
    {
      title: 'Timing inside the month',
      text: windowPosition === 'before_window'
        ? `Starting too early in ${monthName} can expose the crop to less favorable conditions before the local window is ready.`
        : `The earlier gardeners act within ${monthName}, the more of the remaining local margin they usually preserve.`
    },
    {
      title: isWarmSeason ? 'Warmth and site quality' : 'Consistency and early progress',
      text: isWarmSeason
        ? 'Warmer sites, reflected heat, and strong starts matter more when this month already leaves less room for delay.'
        : 'Once the month gets tighter, the crop usually depends more on a clean start and steady progress than on late rescue tactics.'
    }
  ];

  return { intro, items };
}

function getMonthFailureMode(record, pageType) {
  if (pageType !== 'monthly') return null;

  const monthName = record?.monthName || 'this month';
  const cropKey = record?.cropKey || null;
  const commonFailureMode = record?.strategy?.commonFailureMode || null;
  const windowPosition = getMonthlyWindowPosition(record);

  if (windowPosition === 'before_window') {
    return `The main thing that usually goes wrong when planting in ${monthName} is that gardeners gain calendar time without actually gaining useful momentum, because early conditions are not yet supportive enough.`;
  }

  if (cropKey === 'beans' && (windowPosition === 'tight' || windowPosition === 'usually_too_late')) {
    return `For beans, the main thing that usually goes wrong in ${monthName} is a slow start. Once the remaining season gets tighter, cool soil or delayed establishment becomes much harder to recover from.`;
  }

  if (commonFailureMode) {
    return `The main thing that usually goes wrong when planting in ${monthName} is that the crop loses enough early or mid-season time that the local season cannot fully recover the loss. ${commonFailureMode}`;
  }

  if (windowPosition === 'normal_window') {
    return `The main thing that usually goes wrong when planting in ${monthName} is not one dramatic cutoff, but losing enough early momentum that the crop stops making full use of a month that should normally be workable.`;
  }

  if (windowPosition === 'later_but_workable') {
    return `The main thing that usually goes wrong when planting in ${monthName} is that a workable margin becomes much less forgiving once the crop loses early momentum.`;
  }

  if (windowPosition === 'tight' || windowPosition === 'usually_too_late') {
    return `The main thing that usually goes wrong when planting in ${monthName} is that the crop starts just far enough behind that the remaining season is no longer forgiving.`;
  }

  return `The main thing that usually goes wrong when planting in ${monthName} is that the crop loses time it cannot fully recover before the season closes in.`;
}

function getLatePlantingFailurePoint(record, pageType) {
  if (pageType !== 'tooLate') return null;

  const fitRank = getFitRank(record);
  const cropKey = record?.cropKey || null;
  const commonFailureMode = record?.strategy?.commonFailureMode || null;

  if (fitRank >= 4) {
    return `The first issue here is usually not basic maturity, but giving away more flexibility than necessary. Late planting still works, but the crop becomes less forgiving if timing slips further than it needs to.`;
  }

  if (fitRank === 3) {
    return `The first issue here is usually not outright failure, but losing enough remaining margin that the crop stops feeling as easy as it did from the normal schedule.`;
  }

  if (fitRank === 2) {
    return `The first thing that usually goes wrong on a late planting here is that a workable margin becomes much less forgiving once the crop loses early momentum.`;
  }

  if (fitRank === 1) {
    if (cropKey === 'beans') {
      return `For beans, the first thing that usually goes wrong on a late planting is a slow start. Warm enough soil and enough remaining season matter more than most gardeners expect once the margin is already narrow.`;
    }

    if (commonFailureMode) {
      return `The first thing that usually goes wrong on a late planting here is that the remaining margin disappears faster than gardeners expect. ${commonFailureMode}`;
    }

    return `The first thing that usually goes wrong on a late planting here is that the crop falls just far enough behind that the remaining season is no longer forgiving.`;
  }

  if (cropKey === 'peppers') {
    return `For peppers, the first thing that usually goes wrong on a late planting is that the crop starts behind and never catches up. Growth is slow early, fruiting begins too late, and ripening runs out of season.`;
  }

  if (commonFailureMode) {
    return `The first thing that usually goes wrong on a late planting here is that the crop loses early time it cannot recover. ${commonFailureMode}`;
  }

  return `The first thing that usually goes wrong on a late planting here is that the crop starts behind and never regains enough seasonal room to finish comfortably.`;
}

function getLatePlantingSuccessCase(record, pageType) {
  if (pageType !== 'tooLate') return null;

  const fitRank = getFitRank(record);
  const cropKey = record?.cropKey || null;
  const cropNameLower = getCropNameLower(record);

  if (fitRank >= 4) {
    return `A realistic late-planting success case for ${cropNameLower} here is still fairly comfortable. The crop usually fits without needing unusual help, though earlier timing still leaves more flexibility.`;
  }

  if (fitRank === 3) {
    return `A realistic late-planting success case here usually means the crop still finishes well, but with less spare room than the normal planting window provides.`;
  }

  if (fitRank === 2) {
    return `A realistic late-planting success case here usually means the crop still finishes acceptably when gardeners stay close to the safer classes and avoid giving away more time.`;
  }

  if (fitRank === 1) {
    if (cropKey === 'beans') {
      return `A realistic late-planting success case for beans here is a timely sowing into warm enough conditions, using faster classes and not expecting much extra buffer after that.`;
    }

    return `A realistic late-planting success case here usually means staying near the safest maturity range and getting a narrower but still worthwhile finish, rather than expecting a carefree result.`;
  }

  if (cropKey === 'peppers') {
    return `A realistic late-planting success case for peppers here is not a normal full-season crop. It usually means trying very early varieties in the warmest spots with enough support to chase a modest but worthwhile ripe harvest.`;
  }

  return `A realistic late-planting success case here usually means the crop finishes acceptably only when gardeners stack enough advantages to offset a season that is no longer naturally forgiving.`;
}

function getWorthTryingAnyway(record, pageType) {
  if (pageType !== 'maturity') {
    return { show: false, text: null };
  }

  const fitRank = getFitRank(record);
  const cropKey = record?.cropKey || null;
const actionStartClass = getActionStartClass(record);

  if (fitRank >= 2) {
    return { show: false, text: null };
  }

  if (fitRank === 1) {
    if (cropKey === 'beans') {
      return {
        show: true,
        text: `Beans are still worth trying here as long as gardeners stay on schedule and keep variety choice conservative. The crop is less about rescue tactics and more about avoiding lost time at the start.`
      };
    }

    return {
      show: true,
      text: `${record.cropName} is still worth trying here when gardeners are deliberately stacking the odds in its favor, especially by staying close to ${String(actionStartClass).toLowerCase()} selections and avoiding unnecessary delay.`
    };
  }

  if (cropKey === 'peppers') {
    return {
      show: true,
      text: `Peppers are still worth trying here when gardeners are treating them as a stretch crop rather than a default one. The best case is usually a very early variety, a strong indoor head start, and the warmest, most protected site available.`
    };
  }

  return {
    show: true,
    text: `${record.cropName} is usually only worth trying here when gardeners have a clear reason to push the edge and enough advantages to offset a season that is not naturally forgiving.`
  };
}

function getPriorityLevers(record, pageType) {
  if (pageType !== 'maturity') return { intro: null, items: [] };

  const fitRank = getFitRank(record);
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const defaultVarietyLabel =
    varietyStrategy.defaultRecommendedVarietyLabel ||
    getBestVarietyLabel(record) ||
    'a well-matched';
  const safestVarietyLabel =
    varietyStrategy.fastestReliableVarietyLabel ||
    defaultVarietyLabel;
  const cropNameLower = getCropNameLower(record);
  const cropKey = record?.cropKey || null;

  const warmSiteText =
    cropKey === 'peppers' || cropKey === 'tomatoes' || cropKey === 'eggplant' || cropKey === 'melons' || cropKey === 'watermelons'
      ? 'Warm sites, reflected heat, and protection can meaningfully improve the odds on crops that already run short on local margin.'
      : 'Site conditions still matter, but they usually matter most after variety choice and timing are handled well.';

  const beanSpecificText =
    cropKey === 'beans'
      ? 'Warm enough soil and a clean start usually matter more than extra gear on beans, especially when the local margin is already narrow.'
      : null;

  if (fitRank >= 3) {
    return {
      intro: `The main job here is usually not proving that ${cropNameLower} can finish, but deciding which choices give the most reliability and flexibility.`,
      items: [
        {
          title: 'Variety range',
          text: `${defaultVarietyLabel} selections are usually the best default here, though more than one class can often work comfortably.`
        },
        {
          title: 'Normal timing',
          text: 'Staying close to the normal planting window usually preserves the most flexibility.'
        },
        {
          title: 'Execution quality',
          text: record?.strategy?.commonFailureMode
            ? `Consistency still matters because ${record.strategy.commonFailureMode.charAt(0).toLowerCase() + record.strategy.commonFailureMode.slice(1)}`
            : 'Good execution usually matters more than season length once the crop already fits comfortably.'
        }
      ]
    };
  }

  if (fitRank === 2) {
    return {
      intro: `This crop usually works here, but the answer gets less forgiving when variety choice or timing slips.`,
      items: [
        {
          title: 'Variety speed',
          text: `${defaultVarietyLabel} selections usually leave the most dependable room.`
        },
        {
          title: 'Planting timing',
          text: 'Delays do not always ruin the crop, but they noticeably reduce the remaining buffer.'
        },
        {
          title: 'Growing conditions',
          text: beanSpecificText || warmSiteText
        }
      ]
    };
  }

  if (fitRank === 1) {
    return {
      intro: `The answer here can change quickly once planting slips or variety classes get slower.`,
      items: [
        {
          title: 'Variety speed',
          text: `${safestVarietyLabel} selections matter first because slower classes leave much less room.`
        },
        {
          title: 'Timing',
          text: 'Even modest delay can erase a narrow local margin.'
        },
        {
          title: 'Site warmth or protection',
          text: beanSpecificText || warmSiteText
        }
      ]
    };
  }

  return {
    intro: `For ${cropNameLower} here, the main question is whether gardeners can stack enough advantages to make the crop realistic at all.`,
    items: [
      {
        title: 'Fastest realistic varieties',
        text: `${safestVarietyLabel} selections are usually the starting point, not an optional optimization.`
      },
      {
        title: 'Earlier starts',
        text: 'Transplants, early starts, or time gained before outdoor planting usually matter a lot.'
      },
      {
        title: 'Warmer sites and protection',
        text: warmSiteText
      }
    ]
  };
}

function getMarginMeaning(record) {
  const fitRank = getFitRank(record);
  const cropNameLower = getCropNameLower(record);

  if (fitRank >= 3) {
    return `This is a comfortable local margin. The main question is usually not whether ${cropNameLower} can finish before frost, but how dependably it performs and how much flexibility the season leaves.`;
  }

  if (fitRank === 2) {
    return `This is a workable local margin, but not an especially forgiving one. The crop usually fits, though slower classes or planting delays can reduce the buffer noticeably.`;
  }

  if (fitRank === 1) {
    return `This is a narrow but workable local margin. The crop can mature here, but there is not much room for slower classes, late planting, or a cooler-than-usual stretch.`;
  }

  return `This margin falls short of a comfortable local finish. Success usually depends on gaining time with faster varieties, earlier starts, warmer sites, or added protection.`;
}

function getTimeVsHeatDiagnosis(record, pageType) {
  if (pageType !== 'maturity') return null;

  const fitRank = getFitRank(record);
  const cropKey = record?.cropKey || null;
  const cropNameLower = getCropNameLower(record);

  const warmSeasonKeys = new Set([
    'peppers',
    'tomatoes',
    'eggplant',
    'melons',
    'watermelons',
    'pumpkin',
    'winter-squash',
    'sweet-corn',
    'basil',
    'cucumbers',
    'zucchini'
  ]);

  const isWarmSeason = warmSeasonKeys.has(cropKey);

  if (fitRank >= 3) {
    return `In practice, this is not strongly a heat problem or a season-length problem for ${cropNameLower} here. The crop usually has enough room to mature, so the more useful issue is how dependably it performs under local growing conditions.`;
  }

  if (fitRank === 2) {
    if (isWarmSeason) {
      return `This is still more of a comfort problem than a hard stop. ${record.cropName} usually fits here, but warmer sites and good timing help preserve a more dependable finish.`;
    }
    return `This is mostly a timing and execution problem rather than a severe heat problem. The crop usually fits, but slower progress can reduce an otherwise workable buffer.`;
  }

  if (fitRank === 1) {
    if (cropKey === 'beans') {
      return `This is mostly a timing problem rather than a severe heat problem. Beans can work here, but the local margin is narrow enough that delayed sowing or slower progress quickly uses up the season.`;
    }

    if (isWarmSeason) {
      return `This sits between a time problem and a heat problem. The crop needs enough runway to develop, but it also performs best with more warmth than the local margin comfortably provides.`;
    }

    return `This is mostly a timing problem. The crop can work here, but the local season leaves only a narrow buffer for delay or slow development.`;
  }

  if (cropKey === 'peppers') {
    return `For peppers here, this is both a time problem and a heat problem. The crop wants a long enough runway to establish, flower, and ripen, but it also performs best with more sustained warmth than the local season usually delivers.`;
  }

  if (isWarmSeason) {
    return `This is both a time problem and a heat problem. The crop needs more season and more warmth than the local averages usually provide comfortably.`;
  }

  return `This is mostly a time problem. The crop tends to lose enough early or mid-season progress that the remaining local window is not usually forgiving enough to recover comfortably.`;
}

function getRealisticSuccessCase(record, pageType) {
  if (pageType !== 'maturity') return null;

  const fitRank = getFitRank(record);
  const cropKey = record?.cropKey || null;
  const cropNameLower = getCropNameLower(record);

  if (fitRank >= 3) {
    return `A realistic success case for ${cropNameLower} here is usually straightforward: the crop matures on time, and the more useful question becomes how dependably it performs and how consistent the final quality is.`;
  }

  if (fitRank === 2) {
    return `A realistic success case for ${cropNameLower} here usually means timely planting, a well-matched maturity range, and a finish that works without needing unusually favorable conditions.`;
  }

  if (fitRank === 1) {
    if (cropKey === 'beans') {
      return `A realistic success case for beans here is a good harvest from timely sowing and appropriately early classes, without much room for delay. The crop can work well, but success depends more on staying on schedule than on squeezing extra performance out of the season.`;
    }

    return `A realistic success case for ${cropNameLower} here usually means staying near the safer maturity range and keeping the crop on schedule, rather than expecting much extra buffer for delay or slower development.`;
  }

  if (cropKey === 'peppers') {
    return `A realistic success case for peppers here is not a carefree full-season crop. It usually means getting worthwhile ripe fruit from very early varieties, started early and grown in the warmest spots, rather than expecting every class to finish comfortably.`;
  }

  return `A realistic success case for ${cropNameLower} here usually means the crop finishes acceptably only when gardeners stack enough advantages to offset a local season that is not naturally forgiving.`;
}

function getTooLateFitBadgeClass(record) {
  const fitRank = getFitRank(record);

  if (fitRank >= 4) return 'surplus';
  if (fitRank === 3) return 'strong';
  if (fitRank === 2) return 'good';
  if (fitRank === 1) return 'borderline';
  return 'risky';
}

function getTooLateFitBadgeLabel(record) {
  const fitRank = getFitRank(record);

  if (fitRank >= 4) return 'Very comfortable planting room';
  if (fitRank === 3) return 'Comfortable planting room';
  if (fitRank === 2) return 'Good planting room';
  if (fitRank === 1) return 'Borderline when planting late';
  return 'Risky when planting late';
}

function getTooLateFitBoxText(record) {
  const fitRank = getFitRank(record);
  const cropSubject = getCropSubjectPhrase(record);
  const beVerb = getBeVerb(record);
  const subject = cropSubject.charAt(0).toUpperCase() + cropSubject.slice(1);

  if (fitRank >= 4) {
    return `Late planting for ${subject.toLowerCase()} is still very realistic here, so the more useful question is usually how much flexibility you want to preserve rather than whether the crop can still fit at all.`;
  }

  if (fitRank === 3) {
    return `Late planting for ${subject.toLowerCase()} is still workable here, though the remaining margin is less forgiving than it is from the normal planting window.`;
  }

  if (fitRank === 2) {
    return `Late planting for ${subject.toLowerCase()} can still work here, but the remaining margin depends more on timing, variety speed, and getting the crop moving well.`;
  }

  if (fitRank === 1) {
    return `The late planting window for ${subject.toLowerCase()} is tight here, so delay, slower classes, or a weak start quickly become more expensive.`;
  }

  return `This is already beyond a comfortable late-planting window for ${subject.toLowerCase()} unless gardeners can gain time with faster varieties, stronger starts, warmer sites, or added protection.`;
}

function getCropNameLower(record) {
  return record?.cropName ? String(record.cropName).toLowerCase() : 'this crop';
}

function getCropDisplayName(record) {
  return record?.cropSingularName || record?.cropName || 'This crop';
}

function getBestVarietyLabel(record) {
  return record?.fit?.bestVarietyLabel || null;
}

function getVerdictLabel(pageType, fitLabel, record) {
  const fitRank = record ? getFitRank(record) : null;

  if (pageType === 'tooLate') {
    if (fitRank >= 4) return 'Plenty of planting room remains';
    if (fitRank === 3) return 'Still comfortably workable';
    if (fitRank === 2) return 'Still workable';
    if (fitRank === 1) return 'Still possible, but getting tight';
    return 'Usually too late without help';
  }

  if (pageType === 'maturity') {
    if (fitRank >= 4) return 'Very comfortably matures here';
    if (fitRank === 3) return 'Usually matures comfortably';
    if (fitRank === 2) return 'Usually workable';
    if (fitRank === 1) return 'Possible, but timing and variety matter';
    return 'Usually not without help';
  }

  if (pageType === 'varieties') {
    if (fitRank >= 4) return 'Wide margin across fitting classes';
    if (fitRank === 3) return 'Comfortable variety flexibility';
    if (fitRank === 2) return 'Several workable classes';
    if (fitRank === 1) return 'Safer choices matter';
    return 'Fastest realistic options only';
  }

  if (pageType === 'monthly') {
    if (fitRank >= 4) return 'Excellent bet';
    if (fitRank === 3) return 'Strong bet';
    if (fitRank === 2) return 'Good bet';
    if (fitRank === 1) return 'Tighter bet';
    return 'Usually too late';
  }

  return fitLabel;
}

function getActionText(pageType, fitLabel, record) {
  const fitRank = getFitRank(record);
  const cropNameLower = getCropNameLower(record);

  if (pageType === 'tooLate') {
    if (fitRank >= 4) {
      return `There is usually plenty of planting room left for ${cropNameLower} here, especially if you stay close to the normal schedule.`;
    }
    if (fitRank === 3) {
      return `This is usually still comfortably workable, but planting closer to the normal schedule preserves more flexibility.`;
    }
    if (fitRank === 2) {
      return `This is still usually workable, but staying near the normal schedule and using the right maturity range helps preserve margin.`;
    }
    if (fitRank === 1) {
      return `This can still work, but the safer move is to plant soon, lean on faster varieties, and avoid giving away more seasonal margin.`;
    }
    return `The safer move is usually to switch to a faster backup crop or treat this as a protection-dependent planting rather than a normal one.`;
  }

  if (pageType === 'maturity') {
    if (fitRank >= 3) {
      return `The main job here is usually choosing the right maturity range and staying close to the normal planting schedule, rather than worrying about whether the crop can finish at all.`;
    }
    if (fitRank === 2) {
      return `This crop is usually workable here, but the better result usually comes from matching the right maturity range to your timing and growing conditions.`;
    }
    if (fitRank === 1) {
      return `This can mature here, but the outcome depends more on planting date, variety speed, and how much local margin remains.`;
    }
    return `This crop is usually a stretch here unless you gain time with faster varieties, earlier starts, or meaningful season extension.`;
  }

  if (pageType === 'varieties') {
    if (fitRank >= 4) {
      return `Several variety classes can work comfortably here, so the main choice is usually between flexibility, reliability, and your preferred harvest window.`;
    }
    if (fitRank === 3) {
      return `There is usually comfortable room for well-matched varieties here, but the better result still comes from choosing a class that leaves enough local flexibility.`;
    }
    if (fitRank === 2) {
      return `Several options can work here, but the better result usually comes from staying near the most dependable maturity range.`;
    }
    if (fitRank === 1) {
      return `Variety speed matters more here than it does in easier climates, so the safer move is usually to stay close to the fastest realistic classes.`;
    }
    return `Only the fastest realistic options usually make sense here, and even those are often more conditional than comfortable.`;
  }

  return null;
}

function getWorthTryingLate(record, pageType) {
  if (pageType !== 'tooLate') {
    return { show: false, text: null };
  }

  const fitRank = getFitRank(record);
  const cropKey = record?.cropKey || null;
  const cropSubject = getCropSubjectPhrase(record);
  const beVerb = getBeVerb(record);
  const subject = cropSubject.charAt(0).toUpperCase() + cropSubject.slice(1);
  const varietyStrategy = record?.diagnostics?.varietyStrategy || {};
  const safestVarietyLabel =
    varietyStrategy.fastestReliableVarietyLabel ||
    getBestVarietyLabel(record) ||
    'the fastest realistic';

  if (fitRank >= 2) {
    return { show: false, text: null };
  }

  if (fitRank === 1) {
    if (cropKey === 'beans') {
      return {
        show: true,
        text: 'Beans are still worth planting late here when gardeners move promptly, use faster classes, and do not treat the remaining season as more forgiving than it is.'
      };
    }

    return {
      show: true,
      text: `${record.cropName} is still worth planting late here when gardeners deliberately stack the odds in its favor, especially by staying close to ${String(safestVarietyLabel).toLowerCase()} selections and avoiding further delay.`
    };
  }

  if (cropKey === 'peppers') {
    return {
      show: true,
      text: 'Peppers are still worth planting late here only when gardeners are treating them as a stretch project rather than a normal crop, with very early varieties, strong starts, and the warmest protected sites available.'
    };
  }

  return {
    show: true,
    text: `${subject} ${beVerb} usually only worth planting late here when gardeners have a clear reason to push the edge and enough advantages to offset a season that is no longer naturally forgiving.`
  };
}

function getTimingSummary(pageType, fitLabel, record) {
  const fitRank = getFitRank(record);
  const safeDateLong = mmddToLong(record?.timing?.latestPlantingDates?.safe);
  const borderlineDateLong = mmddToLong(record?.timing?.latestPlantingDates?.borderline);
  const monthName = record?.monthName || 'this month';
  const windowPosition = getMonthlyWindowPosition(record);

  if (pageType === 'tooLate') {
    if (safeDateLong) {
      return `Aim to plant by about ${safeDateLong} for the clearest margin.`;
    }
    if (borderlineDateLong) {
      return `The last tighter local date is around ${borderlineDateLong}, but this tends to be a narrower finish than the usual planting window.`;
    }
    return `Most gardeners would switch to a faster backup crop or use protection rather than count on a normal finish.`;
  }

  if (pageType === 'maturity') {
    if (fitRank >= 3) {
      return `The more useful question here is usually which maturity range gives the best mix of reliability and scheduling flexibility.`;
    }
    if (fitRank === 2) {
      return `This crop usually fits here, but variety choice and timing still decide how comfortably it finishes.`;
    }
    if (fitRank === 1) {
      return `This crop can still work here, but maturity range and planting timing matter much more once the local margin gets tight.`;
    }
    return `The realistic question here is whether faster varieties, earlier starts, or added protection can turn this from a stretch into a worthwhile local bet.`;
  }

  if (pageType === 'varieties') {
    if (fitRank >= 3) {
      return `The main choice is usually between earlier reliability and more scheduling flexibility, not whether the crop can finish at all.`;
    }
    if (fitRank === 2) {
      return `Several variety classes can work here, but the most dependable results usually come from staying near the best-fit range.`;
    }
    if (fitRank === 1) {
      return `Safer variety choices matter more here because slower classes leave less room for planting delays or cooler conditions.`;
    }
    return `Only the fastest realistic classes usually make sense here, and even those often need better timing or more help.`;
  }

  if (pageType === 'monthly') {
    if (windowPosition === 'before_window') {
      return `The main question in ${monthName} is whether an earlier start actually helps, or whether it only exposes the crop to less favorable conditions before the normal local window.`;
    }
    if (windowPosition === 'normal_window') {
      return `${monthName} usually lines up with the normal local planting window, so the better question is how cleanly gardeners can preserve margin rather than whether the month works at all.`;
    }
    if (windowPosition === 'later_but_workable') {
      return `${monthName} can still work, but the remaining margin is less forgiving than it is from the core planting window.`;
    }
    if (windowPosition === 'tight') {
      return `${monthName} is a tighter local bet, so variety speed and early progress matter much more than they do from the easier part of the season.`;
    }
    return `${monthName} is usually beyond the safer local window unless gardeners are deliberately using faster classes, stronger starts, or added protection.`;
  }

  return null;
}

function buildCropClimateCopy(record, pageType) {
  const fitLabel = getFitLabel(record);
  const fitRank = getFitRank(record);
  const priorityLevers = getPriorityLevers(record, pageType);
  const worthTryingAnyway = getWorthTryingAnyway(record, pageType);
  const latePlantingLevers = getLatePlantingLevers(record, pageType);
  const worthTryingLate = getWorthTryingLate(record, pageType);
  const varietyChoice = getVarietyChoiceGuidance(record, pageType);
  const diagnostics = record?.diagnostics || {};
  const pageSections = buildPageSections(record, pageType);
  const varietyStrategy = diagnostics.varietyStrategy || {};

  return {
    fitLabel,
    fitRank,
verdictLabel: getVerdictLabel(pageType, fitLabel, record),
    actionText: getActionText(pageType, fitLabel, record),
    cropNameLower: getCropNameLower(record),
    cropDisplayName: getCropDisplayName(record),
    cropConceptPhrase: getCropConceptPhrase(record),
    cropSubjectPhrase: getCropSubjectPhrase(record),
    cropAdjectiveSingular: getCropAdjectiveSingular(record),
    bestVarietyPhrase: getBestVarietyPhrase(record),
    bestVarietySentence: getBestVarietySentence(record),
    primaryPlantingDateLong: mmddToLong(record?.planting?.primaryPlantingDate),
    safeDateLong: mmddToLong(record?.timing?.latestPlantingDates?.safe),
    borderlineDateLong: mmddToLong(record?.timing?.latestPlantingDates?.borderline),
    springFrostLong: mmddToLong(record?.frost?.spring50),
    fallFrostLong: mmddToLong(record?.frost?.fall50),
    fitSummary: getFitSummary(pageType, fitLabel, record),
    timingSummary: getTimingSummary(pageType, fitLabel, record),
    marginMeaning: pageType === 'maturity' ? getMarginMeaning(record) : null,
    priorityLeversIntro: priorityLevers.intro,
    priorityLevers: priorityLevers.items,
    whatBreaksFirst: getWhatBreaksFirst(record, pageType),
    timeVsHeatDiagnosis: getTimeVsHeatDiagnosis(record, pageType),
    realisticSuccessCase: getRealisticSuccessCase(record, pageType),
    actionLayer: getActionLayer(record, pageType),
    showWorthTryingAnyway: worthTryingAnyway.show,
    worthTryingAnyway: worthTryingAnyway.text,
    plantingRoomMeaning: pageType === 'tooLate' ? getPlantingRoomMeaning(record, pageType) : null,
    latePlantingLeversIntro: latePlantingLevers.intro,
    latePlantingLevers: latePlantingLevers.items,
    latePlantingFailurePoint: getLatePlantingFailurePoint(record, pageType),
    latePlantingSuccessCase: getLatePlantingSuccessCase(record, pageType),
    showWorthTryingLate: worthTryingLate.show,
    worthTryingLate: worthTryingLate.text,
    varietyFitIntro: getVarietyFitIntro(record, pageType),
    varietyFitBreakdown: getVarietyFitBreakdown(record, pageType),
    varietyChoiceIntro: varietyChoice.intro,
    varietyChoiceBullets: varietyChoice.items,
    varietyFailureMode: getVarietyFailureMode(record, pageType),
    varietyExamplesIntro: getVarietyExamplesIntro(record, pageType),
    varietyExamples: getVarietyExamples(record, pageType),
    monthIntro: getMonthlyIntro(record, pageType),
    monthStatusBullets: getMonthStatusBullets(record, pageType),
    windowPositionIntro: getWindowPositionIntro(record, pageType),
    windowPositionDetails: getWindowPositionDetails(record, pageType),
    monthTradeoffsIntro: getMonthTradeoffs(record, pageType).intro,
    monthTradeoffsBullets: getMonthTradeoffs(record, pageType).items,
    monthFailureMode: getMonthFailureMode(record, pageType),
    diagnostics,
    varietyStrategy,
    sections: pageSections,
    bestVarietyLabel:
    varietyStrategy.defaultRecommendedVarietyLabel || getBestVarietyLabel(record),
    maturityFitBadgeClass: getMaturityFitBadgeClass(record),
    maturityFitBadgeLabel: getMaturityFitBadgeLabel(record),
    maturityFitBoxText: getMaturityFitBoxText(record),
    tooLateFitBadgeClass: getTooLateFitBadgeClass(record),
    tooLateFitBadgeLabel: getTooLateFitBadgeLabel(record),
    tooLateFitBoxText: getTooLateFitBoxText(record),


  };
}

module.exports = {
  FIT_RANKS,
  buildCropClimateCopy
};
