const { buildRegionSummaries } = require("./_lib/regionSummaries");

const ALLOW_PROVINCES = new Set([
  "alberta",
  // add more later
]);

module.exports = function () {
  const all = buildRegionSummaries({ kind: "CA", base: 50 });
  return all.filter((r) => ALLOW_PROVINCES.has(r.key));
};