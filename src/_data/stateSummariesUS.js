const { buildRegionSummaries } = require("./_lib/regionSummaries");

const INCLUDED_STATES = new Set([
  "montana"
]);

module.exports = function () {
  const all = buildRegionSummaries({ kind: "US", base: 50 });
  return all.filter(r => INCLUDED_STATES.has(r.key));
};