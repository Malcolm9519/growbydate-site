const { mmddToLong, getFitLabel, getFitRank } = require('./cropClimateHelpers');
const { PAGE_CONTRACTS } = require('./pageContracts');
const { getCropSubjectPhrase, getBeVerb } = require('./cropGrammar');

function formatMargin(margin) {
  return Number.isFinite(margin) ? `${Math.round(margin)}` : null;
}

function getConstraintExplanation(record) {
  const constraint = record?.diagnostics?.primaryConstraint;
  const profile = record?.diagnostics?.decisionProfile;

  switch (constraint) {
    case 'season_length':
      return profile === 'very_comfortable' || profile === 'comfortable'
        ? `The basic season length is usually not the problem here. The more useful question is how much of that room gardeners want to preserve.`
        : `The main local pressure is season length. Once the crop starts from its normal planting date, the remaining season is not especially forgiving if time gets lost.`;

    case 'heat_accumulation':
      return profile === 'very_comfortable' || profile === 'comfortable'
        ? `The crop usually gets enough heat here, so the real question is not basic maturity but how steadily that heat gets turned into good progress.`
        : `The main local pressure is usable heat accumulation. The crop may have enough calendar time on paper, but not enough useful heat to finish comfortably once progress slips.`;

    case 'late_start':
      return `The main local pressure is how quickly the answer changes once planting slips beyond the normal window. This crop loses useful room faster than it first appears.`;

    case 'slow_varieties':
      return `The main local pressure is variety speed. Slower classes spend local margin quickly enough that the page answer changes even when the crop still looks workable in the abstract.`;

    case 'cold_start':
      return `The main local pressure is the quality of the start. When early growth stalls in cool conditions, the crop often spends margin before the main season really begins.`;

    default:
      return profile === 'very_comfortable' || profile === 'comfortable'
        ? `This crop usually has enough local room. The more useful question is what tends to protect or waste that room in practice.`
        : `The main local pressure is not one dramatic cutoff, but how cleanly the crop gets established and keeps moving once the season is already doing less of the work for you.`;
  }
}

function getBufferLossBullets(record) {
  const rows = Array.isArray(record?.timing?.delayAnalysis?.rows) ? record.timing.delayAnalysis.rows : [];

  return rows
    .filter((row) => row?.label && Number.isFinite(row?.gddMargin))
    .map((row) => ({
      label: row.label,
      text: `${row.label} leaves about ${row.gddMargin} GDD of margin from a planting date around ${mmddToLong(row.date) || row.date}.`
    }));
}

function getSuccessPatternText(record) {
  const profile = record?.diagnostics?.decisionProfile;
  const rawCropSubject = getCropSubjectPhrase(record);
  const cropSubject = rawCropSubject
    ? rawCropSubject.charAt(0).toUpperCase() + rawCropSubject.slice(1)
    : 'This crop';
  const beVerb = getBeVerb(record);
  const workVerb = beVerb === 'is' ? 'works' : 'work';

  if (profile === 'very_comfortable') {
    return `${cropSubject} usually ${workVerb} here without much rescue logic. Success mostly comes from using the extra margin to improve consistency, harvest quality, or scheduling ease rather than merely chasing maturity.`;
  }

  if (profile === 'comfortable') {
    return `${cropSubject} usually ${workVerb} well here when started on time. Success tends to look like a normal, steady run through the season rather than a crop that is constantly asking for protection.`;
  }

  if (profile === 'workable') {
    return `${cropSubject} usually ${workVerb} here when the start is clean and the crop does not lose momentum. Success is less about having excess room and more about avoiding the kind of ordinary setback that quietly spends the buffer.`;
  }

  if (profile === 'tight') {
    return `${cropSubject} can still succeed here, but success usually looks selective rather than casual: the right class, decent timing, and early progress that never falls far enough behind to turn the finish into salvage.`;
  }

  return `${cropSubject} ${beVerb} more of a deliberate push than a default local choice. Success usually comes from stacking the right advantages early enough that the crop is not asking the remaining season to do too much recovery work.`;
}

function getRecommendedAdjustmentBullets(record) {
  const strategy = record?.diagnostics?.bestDefaultStrategy;
  const variety = record?.diagnostics?.varietyStrategy || {};
  const bullets = [];

  if (strategy === 'choose_faster_varieties' && variety.fastestReliableVarietyLabel) {
    bullets.push({
      label: 'Choose the faster end first',
      text: `${variety.fastestReliableVarietyLabel} is usually the first place to protect local margin before trying anything more ambitious.`
    });
  }

  if (strategy === 'gain_time_with_transplants') {
    bullets.push({
      label: 'Gain time at the start',
      text: `A stronger head start usually matters more here than trying to rescue the crop after it falls behind.`
    });
  }

  if (strategy === 'use_warmest_site') {
    bullets.push({
      label: 'Protect the warmest part of the setup',
      text: `The warmest site and quickest early growth usually do more here than smaller late adjustments.`
    });
  }

  if (strategy === 'use_season_extension') {
    bullets.push({
      label: 'Use extension where it buys real time',
      text: `Season extension helps most when it protects early or late heat the crop would otherwise lose, not when it is added after the crop is already behind.`
    });
  }

  if (strategy === 'switch_to_easier_crop') {
    bullets.push({
      label: 'Be willing to switch crops',
      text: `When this crop already needs stacked advantages, a faster backup crop is often the better practical move.`
    });
  }

  if (!bullets.length) {
    bullets.push({
      label: 'Stay close to the normal schedule',
      text: `This crop usually benefits more from preserving the room it already has than from trying to recover lost time later.`
    });
  }

  return bullets;
}

function buildMaturitySections(record) {
  const fitLabel = getFitLabel(record);
  const profile = record?.diagnostics?.decisionProfile;
  const margin = record?.heat?.margin;
  const available = record?.heat?.availableFromPlanting;
  const target = record?.heat?.targetTypical;
  const plantingDateLong = mmddToLong(record?.planting?.primaryPlantingDate);
  const fallFrostLong = mmddToLong(record?.frost?.fall50);

  return {
    verdictAndSeasonMath: {
      title: 'How the season math looks locally',
intro:
  record?.diagnostics?.decisionProfile === 'very_comfortable'
    ? `${record.cropName} usually has plenty of season and heat to mature in ${record.cityName} when planted on time.`
    : record?.diagnostics?.decisionProfile === 'comfortable'
      ? `${record.cropName} usually has enough season and heat to mature comfortably in ${record.cityName} when planted on time.`
      : record?.diagnostics?.decisionProfile === 'workable'
        ? `${record.cropName} is usually workable in ${record.cityName}, though variety choice and timing still affect how comfortably it finishes.`
        : record?.diagnostics?.decisionProfile === 'tight'
          ? `${record.cropName} can mature in ${record.cityName}, but the margin is tighter and depends more on timing and variety speed.`
          : `${record.cropName} is usually a stretch in ${record.cityName} unless gardeners gain time with faster varieties, earlier starts, or added protection.`,
          
      bullets: [
        {
          label: 'Typical planting date',
          text: plantingDateLong ? `The normal local planting date is around ${plantingDateLong}.` : `The normal local planting date is part of the maturity calculation here.`
        },
        {
          label: 'Available GDD',
          text: Number.isFinite(available) ? `From that start, the city typically has about ${available} GDD available before the usual fall frost.` : `Available seasonal heat is part of the maturity calculation here.`
        },
        {
          label: 'Typical target',
          text: Number.isFinite(target) ? `A typical crop target is about ${target} GDD.` : `Typical maturity target data helps set the baseline here.`
        },
        {
          label: 'Margin',
          text: Number.isFinite(margin) ? `That leaves about ${margin} GDD of margin before the usual fall frost around ${fallFrostLong || 'fall'}.` : `The local margin is what decides how comfortably this crop fits.`
        }
      ],
takeaway:
  profile === 'very_comfortable'
    ? `This is not a crop that usually needs rescue logic here. The more useful question is how much flexibility you want to keep.`
    : profile === 'comfortable'
      ? `This is usually a comfortable fit, but timing and consistency still shape how easily the crop finishes.`
      : `The real question is not just whether the crop can finish on paper, but how much of this margin is easy to lose in real life.`
        },

controllingFactor: {
  title: 'Why the local answer looks like this',
  intro: getConstraintExplanation(record),
  bullets: [
    {
      label: 'Main limiting factor',
      text:
        record?.diagnostics?.primaryConstraint === 'execution_quality'
          ? 'Steady establishment and crop consistency matter more here than raw season length.'
          : record?.diagnostics?.primaryConstraint === 'season_length'
            ? 'The crop is mainly limited by how much season is left after the normal planting date.'
            : record?.diagnostics?.primaryConstraint === 'heat_accumulation'
              ? 'The crop is mainly limited by how much usable heat it can still accumulate before fall conditions close in.'
              : record?.diagnostics?.primaryConstraint === 'late_start'
                ? 'The crop is mainly limited by how quickly the remaining margin shrinks once planting is delayed.'
                : record?.diagnostics?.primaryConstraint === 'slow_varieties'
                  ? 'The crop is mainly limited by variety speed, because slower classes use up the local buffer much faster.'
                  : record?.diagnostics?.primaryConstraint === 'cold_start'
                    ? 'The crop is mainly limited by how well it gets moving early, especially in cooler start conditions.'
                    : 'The crop is mainly limited by how cleanly it gets established and keeps moving through the season.'
    },
    {
      label: 'Most common setback',
      text:
        record?.cropKey === 'broccoli'
          ? 'Late planting can push heading into warmer weather, which raises the risk of bolting and lower-quality heads.'
          : record?.diagnostics?.failurePattern === 'falls_behind_early'
            ? 'The crop loses momentum early and never fully makes use of the local margin.'
            : record?.diagnostics?.failurePattern === 'runs_out_of_heat'
              ? 'The crop keeps moving, but not quickly enough to finish comfortably before useful heat runs out.'
              : record?.diagnostics?.failurePattern === 'loses_margin_with_delay'
                ? 'A workable margin disappears faster than it first appears once planting slips.'
                : record?.diagnostics?.failurePattern === 'slow_class_pushes_too_far'
                  ? 'Slower varieties use up the local buffer and leave too little room for an ordinary finish.'
                  : record?.diagnostics?.failurePattern === 'cold_soil_stalls_start'
                    ? 'Cool early conditions hold the crop back enough that the rest of the season has to work harder to recover it.'
                    : 'The crop falls behind just enough that the remaining season stops feeling forgiving.'
    }
  ],
  takeaway: `This section is about the pressure point behind the verdict, not the rescue plan.`
},

bufferLoss: {
  title: 'What usually erodes the margin',
  intro:
    record?.diagnostics?.decisionProfile === 'very_comfortable'
      ? `Even comfortable pages still spend room over time. The point here is to show how much flexibility the local season usually leaves from a normal start.`
      : record?.diagnostics?.decisionProfile === 'comfortable'
        ? `This crop still has good local room, but delay and uneven progress can spend part of that flexibility faster than gardeners expect.`
        : record?.diagnostics?.decisionProfile === 'workable'
          ? `The useful question here is not just whether the crop fits, but how quickly that workable margin can narrow once time or momentum is lost.`
          : record?.diagnostics?.decisionProfile === 'tight'
            ? `This is where a narrow fit starts to feel fragile. The remaining room is real, but it does not absorb much delay or drag.`
            : `This fit is already under pressure, so further delay usually makes the problem meaningfully harder rather than just slightly less comfortable.`,
  bullets: getBufferLossBullets(record),
  takeaway: `This section is about where the buffer goes once real-world delay or drag starts using it up.`
},

successPattern: {
  title: 'What success usually looks like here',
  intro: getSuccessPatternText(record),
  bullets: [],
  takeaway: `This section is about the kind of season the crop usually needs, not the numbers behind the verdict.`
},

recommendedAdjustments: {
  title: 'What to change first if you want better odds',
  intro: `The best adjustments here are usually the ones that protect margin before it disappears, rather than asking the crop to recover it later.`,
  bullets: getRecommendedAdjustmentBullets(record),
  takeaway: `This is the action layer: what to change first once you know what is actually limiting the crop locally.`
}
  };
}

function buildTooLateSections(record) {
  return {
    lateVerdict: {
      title: 'How much planting room is really left',
      intro: 'Stub for next phase.',
      bullets: [],
      takeaway: null
    }
  };
}

function buildVarietiesSections(record) {
  return {
    recommendedDefaultClass: {
      title: 'Which maturity class is the best default',
      intro: 'Stub for next phase.',
      bullets: [],
      takeaway: null
    }
  };
}

function buildMonthlySections(record) {
  return {
    seasonStageThisMonth: {
      title: 'Where this month sits in the local season',
      intro: 'Stub for next phase.',
      bullets: [],
      takeaway: null
    }
  };
}

function buildPageSections(record, pageType) {
  if (!PAGE_CONTRACTS[pageType]) return {};

  switch (pageType) {
    case 'maturity':
      return buildMaturitySections(record);
    case 'tooLate':
      return buildTooLateSections(record);
    case 'varieties':
      return buildVarietiesSections(record);
    case 'monthly':
      return buildMonthlySections(record);
    default:
      return {};
  }
}

module.exports = {
  buildPageSections
};