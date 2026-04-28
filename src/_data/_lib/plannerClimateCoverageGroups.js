// Unified climate-profile coverage groups for the GDD planner.
//
// These groups are used to build /assets/data/planner-climate-profiles.json.
// A climate profile keeps frost dates and GDD station selection together so the
// planner does not accidentally combine one location's frost dates with another
// location's heat accumulation series.
//
// Supported fields:
// - cityKey: resolves the anchor city, its lookupKey, and its curated GDD station
// - stationId: direct GDD station override when a city anchor is not available
// - frostKey: anchor frost key to use when an expanded key has no exact frost row
// - keys: exact ZIP, ZIP3, FSA, or full Canadian postal keys
// - fsaRanges: compact Canadian FSA ranges, e.g. "T5" expands to T5A, T5B, ...
// - confidence: optional label for QA/debugging
//
// Use broad fsaRanges only for clearly urban postal blocks. Use exact keys in
// mixed climate regions such as the Fraser Valley, coast, islands, mountains,
// or large rural postal prefixes.
module.exports = [
  // Alberta major urban FSAs. These ranges are strongly associated with the
  // city climate anchors used by the crop-city pages.
  { cityKey: "edmonton", fsaRanges: ["T5", "T6"], confidence: "high" },
  { cityKey: "calgary", fsaRanges: ["T2", "T3"], confidence: "high" },

  // Fraser Valley: explicit keys only. Avoid broad V2* assignment because V2*
  // spans multiple growing climates.
  {
    name: "Abbotsford",
    region: "BC",
    country: "CA",
    frostKey: "V2T",
    stationId: "CA-1100030",
    keys: ["V2S", "V2T", "V3G", "V4X"],
    confidence: "high"
  },
  {
    cityKey: "chilliwack",
    keys: ["V2P", "V2R", "V2Z"],
    confidence: "high"
  }
];
