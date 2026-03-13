const { buildRegionSummaries } = require("./_lib/regionSummaries");

const INCLUDED_STATES = new Set([
  "minnesota",
  "wisconsin",
  "michigan",
  "montana",
  "north-dakota",
  "south-dakota",
  "wyoming",
  "idaho",

  "colorado",
  "pennsylvania",
  "new-york",
  "ohio",
  "massachusetts",
  "illinois",

  "washington",
  "oregon",
  "maine",
  "vermont",
  "new-hampshire",
  "alaska",

  "indiana",
  "iowa",
  "kansas",
  "missouri",
  "nebraska",
]);

module.exports = function () {
  const all = buildRegionSummaries({ kind: "US", base: 50 });
  return all.filter(r => INCLUDED_STATES.has(r.key));
};