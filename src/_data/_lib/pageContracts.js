const PAGE_CONTRACTS = {
  maturity: {
    purpose: 'Explain whether this crop usually matures here from a standard planting date.',
    readerIntent: 'Does this crop normally have enough season here?',
    sections: [
      'verdictAndSeasonMath',
      'controllingFactor',
      'bufferLoss',
      'successPattern',
      'recommendedAdjustments'
    ]
  },

  tooLate: {
    purpose: 'Explain whether a late planting still makes sense and what changes after the normal window.',
    readerIntent: 'Am I too late, and if not, what has to change?',
    sections: [
      'lateVerdict',
      'whatChangedAfterWindow',
      'viableLateAttempt',
      'whenToStopPushing',
      'fallbackOptions'
    ]
  },

  varieties: {
    purpose: 'Explain which maturity classes are safest, workable, or ambitious here.',
    readerIntent: 'Which maturity class should I choose?',
    sections: [
      'recommendedDefaultClass',
      'varietyLadder',
      'fasterVsSlowerTradeoff',
      'overreachingFailureMode',
      'exampleVarietiesByPurpose'
    ]
  },

  monthly: {
    purpose: 'Explain what is still worth planting this month and what is better skipped.',
    readerIntent: 'What can I still plant now?',
    sections: [
      'seasonStageThisMonth',
      'normalWindowCrops',
      'tighteningCrops',
      'mostlyTooLateCrops',
      'nextMoves'
    ]
  }
};

module.exports = { PAGE_CONTRACTS };