const { buildRegionSummaries } = require("./_lib/regionSummaries");

const EXCLUDED_PROVINCES = new Set([
  "yukon",
  "nunavut",
  "northwest-territories"
]);

module.exports = function () {
  const all = buildRegionSummaries({ kind: "CA", base: 50 });
  return all.filter(r => !EXCLUDED_PROVINCES.has(r.key));
};