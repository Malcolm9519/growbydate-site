// Compact planner-only lookup coverage groups.
//
// The broad gddStations.json crosswalk is useful as a fallback, but it can map
// some postal prefixes to stations that are technically nearby yet wrong for a
// gardening heat model. These groups let the public GDD planner use the same
// curated city station anchors as crop-city / QA pages across nearby ZIP/FSA
// prefixes without maintaining one huge flat override file.
//
// Supported fields:
// - cityKey: preferred; resolves to cityStationOverrides[cityKey] or city.gddStationId
// - stationId: optional direct station override when no city exists
// - keys: exact ZIP, ZIP3, FSA, or full Canadian postal keys
// - fsaRanges: compact Canadian FSA ranges, e.g. "T5" expands to T5A, T5B, ...
//
// Keep this file intentionally curated. Use broad fsaRanges only where the
// prefix is strongly associated with a single urban climate area. Use exact
// keys in regions like the Fraser Valley where neighbouring V2* FSAs can belong
// to meaningfully different growing climates.
module.exports = [
  // --- Alberta major urban FSAs ---
  // Edmonton city FSAs. This prevents nearby-but-wrong fallback stations from
  // being used when a user enters T5A, T6A, etc.
  { cityKey: "edmonton", fsaRanges: ["T5", "T6"] },

  // Calgary city FSAs. Keep Okotoks/Airdrie/Cochrane as their own city keys.
  { cityKey: "calgary", fsaRanges: ["T2", "T3"] },

  // --- British Columbia / Fraser Valley ---
  // Abbotsford-area FSAs should use Abbotsford A, not coastal/marine stations.
{ stationId: "CA-1100030", keys: ["V2S", "V2T", "V3G", "V4X"] },
  // Chilliwack/Sardis/Yarrow-area FSAs should resolve to the Chilliwack anchor,
  // not inherit Abbotsford or unrelated BC stations.
  { cityKey: "chilliwack", keys: ["V2P", "V2R", "V2Z"] },
];
