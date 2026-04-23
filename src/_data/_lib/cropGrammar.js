function normalizeLower(value) {
  return value ? String(value).toLowerCase() : '';
}

function getDefaultGrammar(record) {
  const cropName = record?.cropName || record?.crop?.name || 'This crop';
  const singularName = record?.cropSingularName || record?.crop?.singularName || cropName;

  return {
    nounStyle: 'mass',
    conceptLabel: `growing ${normalizeLower(cropName)}`,
    singularLabel: normalizeLower(singularName),
    pluralLabel: normalizeLower(cropName),
    adjectiveSingular: normalizeLower(singularName),
    beVerb: 'is',
    matureVerb: 'matures'
  };
}

function getVarietyClassDisplay(label) {
  if (!label) return null;

  const normalized = String(label).trim();
  const lower = normalized.toLowerCase();

  return {
    raw: normalized,
    lower,
    nounPhrasePlural: `${lower} varieties`,
    nounPhraseTypes: `${lower} types`,
    classPhrase: `the ${lower} class`,
    rangePhrase: `the ${lower} range`,
    endPhrase: `the ${lower} end of the range`
  };
}

function getHaveVerb(record) {
  const grammar = getCropGrammar(record);
  return grammar.beVerb === 'are' ? 'have' : 'has';
}

function getCropGrammar(record) {
  const cropKey = record?.cropKey || record?.crop?.key || null;
  const cropName = record?.cropName || record?.crop?.name || 'This crop';
  const singularName = record?.cropSingularName || record?.crop?.singularName || cropName;

  const grammarMap = {
    peppers: {
      nounStyle: 'plural',
      conceptLabel: 'growing peppers',
      singularLabel: 'pepper',
      pluralLabel: 'peppers',
      adjectiveSingular: 'pepper',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    beans: {
      nounStyle: 'plural',
      conceptLabel: 'growing beans',
      singularLabel: 'bean',
      pluralLabel: 'beans',
      adjectiveSingular: 'bean',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    peas: {
      nounStyle: 'plural',
      conceptLabel: 'growing peas',
      singularLabel: 'pea',
      pluralLabel: 'peas',
      adjectiveSingular: 'pea',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    onions: {
      nounStyle: 'plural',
      conceptLabel: 'growing onions',
      singularLabel: 'onion',
      pluralLabel: 'onions',
      adjectiveSingular: 'onion',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    potatoes: {
      nounStyle: 'plural',
      conceptLabel: 'growing potatoes',
      singularLabel: 'potato',
      pluralLabel: 'potatoes',
      adjectiveSingular: 'potato',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    tomatoes: {
      nounStyle: 'plural',
      conceptLabel: 'growing tomatoes',
      singularLabel: 'tomato',
      pluralLabel: 'tomatoes',
      adjectiveSingular: 'tomato',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    cucumbers: {
      nounStyle: 'plural',
      conceptLabel: 'growing cucumbers',
      singularLabel: 'cucumber',
      pluralLabel: 'cucumbers',
      adjectiveSingular: 'cucumber',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    carrots: {
      nounStyle: 'plural',
      conceptLabel: 'growing carrots',
      singularLabel: 'carrot',
      pluralLabel: 'carrots',
      adjectiveSingular: 'carrot',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    beets: {
      nounStyle: 'plural',
      conceptLabel: 'growing beets',
      singularLabel: 'beet',
      pluralLabel: 'beets',
      adjectiveSingular: 'beet',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    radishes: {
      nounStyle: 'plural',
      conceptLabel: 'growing radishes',
      singularLabel: 'radish',
      pluralLabel: 'radishes',
      adjectiveSingular: 'radish',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    turnips: {
      nounStyle: 'plural',
      conceptLabel: 'growing turnips',
      singularLabel: 'turnip',
      pluralLabel: 'turnips',
      adjectiveSingular: 'turnip',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    melons: {
      nounStyle: 'plural',
      conceptLabel: 'growing melons',
      singularLabel: 'melon',
      pluralLabel: 'melons',
      adjectiveSingular: 'melon',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    watermelons: {
      nounStyle: 'plural',
      conceptLabel: 'growing watermelons',
      singularLabel: 'watermelon',
      pluralLabel: 'watermelons',
      adjectiveSingular: 'watermelon',
      beVerb: 'are',
      matureVerb: 'mature'
    },
    'sweet-corn': {
      nounStyle: 'mass',
      conceptLabel: 'growing sweet corn',
      singularLabel: 'sweet corn',
      pluralLabel: 'sweet corn',
      adjectiveSingular: 'sweet corn',
      beVerb: 'is',
      matureVerb: 'matures'
    },
    cauliflower: {
      nounStyle: 'mass',
      conceptLabel: 'growing cauliflower',
      singularLabel: 'cauliflower',
      pluralLabel: 'cauliflower',
      adjectiveSingular: 'cauliflower',
      beVerb: 'is',
      matureVerb: 'matures'
    },
    lettuce: {
      nounStyle: 'mass',
      conceptLabel: 'growing lettuce',
      singularLabel: 'lettuce',
      pluralLabel: 'lettuce',
      adjectiveSingular: 'lettuce',
      beVerb: 'is',
      matureVerb: 'matures'
    },
    spinach: {
      nounStyle: 'mass',
      conceptLabel: 'growing spinach',
      singularLabel: 'spinach',
      pluralLabel: 'spinach',
      adjectiveSingular: 'spinach',
      beVerb: 'is',
      matureVerb: 'matures'
    },
    kale: {
      nounStyle: 'mass',
      conceptLabel: 'growing kale',
      singularLabel: 'kale',
      pluralLabel: 'kale',
      adjectiveSingular: 'kale',
      beVerb: 'is',
      matureVerb: 'matures'
    },
    cabbage: {
      nounStyle: 'mass',
      conceptLabel: 'growing cabbage',
      singularLabel: 'cabbage',
      pluralLabel: 'cabbage',
      adjectiveSingular: 'cabbage',
      beVerb: 'is',
      matureVerb: 'matures'
    },
    broccoli: {
      nounStyle: 'mass',
      conceptLabel: 'growing broccoli',
      singularLabel: 'broccoli',
      pluralLabel: 'broccoli',
      adjectiveSingular: 'broccoli',
      beVerb: 'is',
      matureVerb: 'matures'
    },
    'swiss-chard': {
      nounStyle: 'mass',
      conceptLabel: 'growing Swiss chard',
      singularLabel: 'Swiss chard',
      pluralLabel: 'Swiss chard',
      adjectiveSingular: 'Swiss chard',
      beVerb: 'is',
      matureVerb: 'matures'
    },
    zucchini: {
      nounStyle: 'mass',
      conceptLabel: 'growing zucchini',
      singularLabel: 'zucchini',
      pluralLabel: 'zucchini',
      adjectiveSingular: 'zucchini',
      beVerb: 'is',
      matureVerb: 'matures'
    }
  };

  const matched = cropKey && grammarMap[cropKey] ? grammarMap[cropKey] : null;
  if (matched) return matched;

  return {
    ...getDefaultGrammar(record),
    conceptLabel: `growing ${normalizeLower(cropName)}`,
    singularLabel: normalizeLower(singularName),
    pluralLabel: normalizeLower(cropName),
    adjectiveSingular: normalizeLower(singularName)
  };
}

function titleCaseWords(value) {
  if (!value) return '';
  return String(value)
    .split(' ')
    .map((word) => {
      if (!word) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function getCropConceptPhrase(record) {
  return getCropGrammar(record).conceptLabel;
}

function getCropSubjectPhrase(record) {
  const grammar = getCropGrammar(record);
  return grammar.nounStyle === 'plural' ? grammar.pluralLabel : grammar.singularLabel;
}

function getCropAdjectiveSingular(record) {
  return getCropGrammar(record).adjectiveSingular;
}

function getBeVerb(record) {
  return getCropGrammar(record).beVerb;
}

function getMatureVerb(record) {
  return getCropGrammar(record).matureVerb;
}

function getBestVarietyPhrase(record) {
  const bestVarietyLabel = record?.fit?.bestVarietyLabel || null;
  if (!bestVarietyLabel) return null;

  const grammar = getCropGrammar(record);
  return `${normalizeLower(bestVarietyLabel)} ${grammar.adjectiveSingular} varieties`;
}

function capitalizeFirst(value) {
  if (!value) return '';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function getBestVarietySentence(record) {
  const phrase = getBestVarietyPhrase(record);
  if (!phrase || !record?.cityName) return null;
  return `${capitalizeFirst(phrase)} are usually the best local match in ${record.cityName}.`;
}

module.exports = {
  getCropGrammar,
  getCropConceptPhrase,
  getCropSubjectPhrase,
  getCropAdjectiveSingular,
  getBeVerb,
  getHaveVerb,
  getMatureVerb,
  getBestVarietyPhrase,
  getBestVarietySentence,
  getVarietyClassDisplay,
  titleCaseWords
};