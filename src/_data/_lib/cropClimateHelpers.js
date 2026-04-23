function mmddToLong(mmdd) {
  if (!mmdd) return null;
  const [month, day] = String(mmdd).split('-').map(Number);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;

  const date = new Date(Date.UTC(2021, month - 1, day));
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function getFitRank(record) {
  const margin = record?.heat?.margin;
  const confidence = record?.fit?.confidence;

  if (confidence === 'surplus') return 4;
  if (confidence === 'strong') return 3;
  if (confidence === 'good') return 2;
  if (confidence === 'borderline') return 1;
  if (confidence === 'risky') return 0;

  if (Number.isFinite(margin)) {
    if (margin >= 800) return 4;
    if (margin >= 250) return 3;
    if (margin >= 75) return 2;
    if (margin >= -200) return 1;
    return 0;
  }

  return 1;
}

function getFitLabel(record) {
  const rank = getFitRank(record);

  if (rank >= 4) return 'Very comfortably matures here';
  if (rank === 3) return 'Usually matures comfortably';
  if (rank === 2) return 'Usually enough room to mature';
  if (rank === 1) return 'Can mature, but the margin is tighter';
  return 'A narrow maturity fit';
}

module.exports = {
  mmddToLong,
  getFitRank,
  getFitLabel
};