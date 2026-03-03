const { buildRegionSummaries } = require("./_lib/regionSummaries");

const EXCLUDED_STATES = new Set([
  "montana"
]);

module.exports = function () {
  const all = buildRegionSummaries({ kind: "US", base: 50 });
  return all.filter(r => !EXCLUDED_STATES.has(r.key));
};