const cropsThatLoseMarginWhenPlantedLate = require("./cropsThatLoseMarginWhenPlantedLate");

function penaltyGroup(entry) {
  const score = Number(entry.score);
  if (Number.isFinite(score) && score >= 68) return "High penalty";
  if (Number.isFinite(score) && score >= 52) return "Moderate penalty";
  return "More forgiving";
}

function byLossThenName(a, b) {
  if (b.averageTwoWeekMarginLoss !== a.averageTwoWeekMarginLoss) {
    return b.averageTwoWeekMarginLoss - a.averageTwoWeekMarginLoss;
  }
  return a.cropName.localeCompare(b.cropName);
}

module.exports = function () {
  const board = cropsThatLoseMarginWhenPlantedLate();
  const maxLoss = Math.max(...board.entries.map((entry) => Number(entry.averageTwoWeekMarginLoss) || 0));
  const maxMargin = Math.max(
    ...board.entries.flatMap((entry) => [
      Number(entry.averageOnTimeMargin) || 0,
      Number(entry.averageTwoWeekLateMargin) || 0
    ])
  );

  const entries = board.entries.map((entry) => {
    const loss = Number(entry.averageTwoWeekMarginLoss) || 0;
    const onTime = Number(entry.averageOnTimeMargin) || 0;
    const late = Number(entry.averageTwoWeekLateMargin) || 0;
    const group = penaltyGroup(entry);
    return {
      ...entry,
      group,
      groupClass: group.toLowerCase().replace(/\s+/g, "-"),
      lossBarPct: maxLoss ? Math.max(2, Math.round((loss / maxLoss) * 100)) : 0,
      onTimeBarPct: maxMargin ? Math.max(2, Math.round((onTime / maxMargin) * 100)) : 0,
      lateBarPct: maxMargin ? Math.max(2, Math.round((late / maxMargin) * 100)) : 0
    };
  }).sort(byLossThenName);

  const highPenalty = entries.filter((entry) => entry.group === "High penalty");
  const moderatePenalty = entries.filter((entry) => entry.group === "Moderate penalty");
  const moreForgiving = entries.filter((entry) => entry.group === "More forgiving");

  return {
    ...board,
    entries,
    featuredEntries: entries.slice(0, 10),
    comparisonEntries: [
      ...highPenalty.slice(0, 3),
      ...moderatePenalty.slice(0, 3),
      ...moreForgiving.slice(0, 3)
    ],
    highPenalty,
    moderatePenalty,
    moreForgiving,
    maxLoss,
    maxMargin
  };
};
