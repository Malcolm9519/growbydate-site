// Internal QA probe keys for the GDD planner climate resolver.
//
// Add any ZIP, ZIP+4, Canadian FSA, or full Canadian postal code here, rebuild,
// then open /assets/data/qa/planner-climate-profile-qa.json to inspect how the
// planner resolves that input.
module.exports = [
  // Regression cases from the Abbotsford / Fraser Valley issue.
  "V2T",
  "V2T 1A1",
  "V2S",
  "V3G",
  "V4X",
  "V2P",
  "V2R",
  "V2Z",

  // Alberta metro coverage groups.
  "T5A",
  "T5J",
  "T6A",
  "T6Z",
  "T2P",
  "T3A"
];
