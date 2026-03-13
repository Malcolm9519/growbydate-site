module.exports = {
  // Curated city-specific preferred stations.
  // Keep this file focused on cities where the default lookup / nearest-station
  // logic is clearly not picking the best local anchor.

  // --- ALBERTA ---
  "calgary": "CA-3031090",        // CALGARY GLENMORE DAM
  "edmonton": "CA-3012195",       // EDMONTON
  "red-deer": "CA-3025440",       // RED DEER
  "lethbridge": "CA-3033875",     // LETHBRIDGE CDA

  // keep current local choices where still under evaluation
  "medicine-hat": "CA-3034475",   // MEDICINE HAT A
  "cold-lake": "CA-3081675",      // COLD LAKE A
  "fort-mcmurray": "CA-3062693",  // FORT MCMURRAY A
  "canmore": "CA-3051260",        // CANMORE
  "wetaskiwin": "CA-3017280",     // WETASKIWIN

  // Calgary / Edmonton metro suburbs
  "airdrie": "CA-3031093",        // CALGARY INT'L A
  "cochrane-ab": "CA-3031093",    // CALGARY INT'L A
  "okotoks": "CA-3031093",        // CALGARY INT'L A
  "spruce-grove": "CA-3012195",   // EDMONTON
  "st-albert": "CA-3012195",      // EDMONTON

  // --- BRITISH COLUMBIA ---
  "vancouver": "CA-1108430",      // VANCOUVER CITY HALL
"victoria": "CA-1018615",   // VICTORIA HARBOUR A
  "kelowna": "CA-1123930",        // KELOWNA

  // keep under evaluation / runtime issues
  "kamloops": "CA-1163865",       // KAMLOOPS A
  "prince-george": "CA-1096450",  // PRINCE GEORGE A
  "cranbrook": "CA-1152100",      // CRANBROOK A
  "nelson": "CA-1145430",         // NELSON

  // known good BC fixes
  "prince-rupert": "CA-1045100",  // PRINCE RUPERT
  "terrace": "CA-1047050",        // TERRACE A
  "kitimat": "CA-1047075",        // KITIMAT TOWNSITE
  "dawson-creek": "CA-1161200",   // DAWSON CREEK A
  "fort-st-john": "CA-1163000",   // FORT ST JOHN A
  "quesnel": "CA-1096460",        // QUESNEL A
  "williams-lake": "CA-1165790",  // WILLIAMS LAKE A
  "abbotsford": "CA-1100030",     // ABBOTSFORD A
  "courtenay": "CA-1021988",      // COURTENAY GRANTHAM
  "salmon-arm": "CA-1166945",     // SALMON ARM
  "nanaimo": "CA-1025365",        // NANAIMO A
  "whistler": "CA-1048899",       // WHISTLER A
  "revelstoke": "CA-1176745",     // REVELSTOKE A
  "chilliwack": "CA-1101530",     // CHILLIWACK
  "powell-river": "CA-1046391",   // POWELL RIVER A
  "port-alberni": "CA-1036206",   // PORT ALBERNI A

  // --- SASKATCHEWAN ---
  // keep runtime-problem stations under evaluation
  "saskatoon": "CA-4057165",      // SASKATOON RCS
  "regina": "CA-4016561",         // REGINA A
  "prince-albert": "CA-4056230",  // PRINCE ALBERT
  "la-ronge": "CA-4064150",       // LA RONGE A
  "swift-current": "CA-4028040",  // SWIFT CURRENT A
  "moose-jaw": "CA-4015315",      // MOOSE JAW A

  // currently reasonable
  "weyburn": "CA-4018760",        // WEYBURN
  "melfort": "CA-4055079",        // MELFORT

  // --- MANITOBA ---
  // keep runtime-problem stations under evaluation
  "brandon": "CA-5010480",        // BRANDON A
  "thompson": "CA-5062921",       // THOMPSON A
"winnipeg": "CA-5023222",   // WINNIPEG RICHARDSON INT'L A
"selkirk": "CA-5022630",    // SELKIRK
"steinbach": "CA-5022780",  // STEINBACH

  // override corrections
  "morden": "CA-5021848",         // MORDEN CDA
  "winkler": "CA-5021848",        // MORDEN CDA

  // keep current
  "dauphin": "CA-5040680",        // DAUPHIN A
  "the-pas": "CA-5052864",        // THE PAS

  // --- ONTARIO ---
  "ottawa": "CA-6105978",         // OTTAWA CDA RCS
  "kingston": "CA-6104146",       // KINGSTON A
  "london-on": "CA-6134890",      // LONDON
  "windsor-on": "CA-6139525",     // WINDSOR
  "cambridge-on": "CA-6141100",   // CAMBRIDGE-STEWART
  "chatham-kent": "CA-6131414",   // CHATHAM KENT
  "guelph": "CA-6143083",         // GUELPH OAC
  "thunder-bay": "CA-6048261",    // THUNDER BAY A
  "barrie": "CA-6110549",         // BARRIE
  "sault-ste-marie-on": "CA-6057591", // SAULT STE MARIE A
  "owen-sound": "CA-6116128",     // OWEN SOUND
  "leamington": "CA-6134390",     // LEAMINGTON
  "niagara-falls-on": "CA-6135638", // NIAGARA FALLS
  "kitchener": "CA-6144239",      // KITCHENER/WATERLOO
  "sudbury": "CA-6068150",        // SUDBURY A
  "waterloo-on": "CA-6149388",    // REGION OF WATERLOO INT'L AIRPORT
  "st-catharines": "CA-6137286",  // ST. CATHARINES / NIAGARA DISTRICT A
  "belleville": "CA-6150689",     // BELLEVILLE
  "north-bay": "CA-6085680",      // NORTH BAY A
  "timmins": "CA-6078286",        // TIMMINS A
  "woodstock-on": "CA-6149625",   // WOODSTOCK
  "peterborough": "CA-6166415",   // PETERBOROUGH A
  "stratford-on": "CA-6148100",   // STRATFORD
  "brantford": "CA-6140942",      // BRANTFORD AIRPORT
  "orillia": "CA-6115820",        // ORILLIA TS

  // --- QUEBEC ---
  "montreal": "CA-7025250",       // MONTREAL INTL A
  "quebec-city": "CA-7016293",    // QUEBEC INTL A

  // override corrections
  "saguenay": "CA-7060400",       // BAGOTVILLE A
  "saint-hyacinthe": "CA-7027360",// ST HYACINTHE

  // --- ATLANTIC CANADA ---
  "halifax": "CA-8202200",        // HALIFAX
  "new-glasgow": "CA-8203905",    // NEW GLASGOW TRENTON
  "gander": "CA-8401700",         // GANDER INT'L A
  "corner-brook": "CA-8401298",   // CORNER BROOK
  "st-johns": "CA-8403505",       // ST. JOHN'S INTL A
  "yarmouth": "CA-8206495",       // YARMOUTH A
  "kentville": "CA-8202800",      // KENTVILLE CDA
  "truro": "CA-8205988",          // TRURO

  // --- NORTH ---
  "whitehorse": "CA-2101300",     // WHITEHORSE A
  "yellowknife": "CA-2204100",    // YELLOWKNIFE A

  // --- MINNESOTA ---
  "minneapolis": "US1MNHN0181",
  "saint-paul": "US1MNRM0002",
  "duluth": "US1MNSL0005",

  // --- WISCONSIN ---
  "milwaukee": "US1WIMW0014",
  "madison": "US1WIDA0013",
  "green-bay": "US1WIBN0014",

  // --- MICHIGAN ---
  "detroit": "CA-6139533",        // WINDSOR FORD PLANT
  "grand-rapids": "USW00014865",  // Grand Rapids Intl Airport
  "lansing": "USW00014836",       // Lansing Capital City Airport

  // --- NORTH DAKOTA ---
  "fargo": "USW00014914",
  "bismarck": "USW00024011",

  // --- SOUTH DAKOTA ---
  "sioux-falls": "USW00014944",
  "rapid-city": "USW00024090",
};