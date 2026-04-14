module.exports = {
  // Curated city-specific preferred stations.
  // Keep this file focused on cities where the default lookup / nearest-station
  // logic is clearly not picking the best local anchor.

  // --- ALBERTA ---
  "calgary": "CA-3031090",        // CALGARY GLENMORE DAM
  "edmonton": "CA-3012205",       // EDMONTON
  "red-deer": "CA-3025440",       // RED DEER
  "cochrane-ab": "CA-3031676",    // COCHRANE
  "lethbridge": "CA-3033875",     // LETHBRIDGE CDA

  // keep current local choices where still under evaluation
  "medicine-hat": "CA-3034480",   // MEDICINE HAT A
  "cold-lake": "CA-3081680",      // COLD LAKE A
  "fort-mcmurray": "CA-3062693",  // FORT MCMURRAY A
  "canmore": "CA-3051260",        // CANMORE
  "wetaskiwin": "CA-3017280",     // WETASKIWIN

  // Calgary / Edmonton metro suburbs
  "airdrie": "CA-3031093",        // CALGARY INT'L A
  "spruce-grove": "CA-3012195",   // EDMONTON
  "st-albert": "CA-3012195",      // EDMONTON

  // Alberta fixes
"peace-river": "CA-3075040",
  "leduc": "CA-3012205",                // EDMONTON INT'L A
  "lacombe": "CA-3025440",              // RED DEER
  "drayton-valley": "CA-3012115",       // DRAYTON VALLEY
  "rocky-mountain-house": "CA-3015530", // ROCKY MOUNTAIN HOUSE
  "whitecourt": "CA-3067371",           // WHITECOURT
  "edson": "CA-3062239",                // EDSON
  "hinton": "CA-3063340",               // HINTON
  "grande-cache": "CA-3072910",         // GRANDE PRAIRIE
  "high-level": "CA-3073148",           // HIGH LEVEL
  "fort-vermilion": "CA-3072719",       // FORT VERMILION
  "slave-lake": "CA-3065995",           // SLAVE LAKE

  // --- BRITISH COLUMBIA ---
  "vancouver": "CA-1108430",      // VANCOUVER CITY HALL
"victoria": "CA-1018633",
  "kelowna": "CA-1123930",        // KELOWNA

  // keep under evaluation / runtime issues
"kamloops": "CA-1163780",
  "prince-george": "CA-1096450",  // PRINCE GEORGE A
  "cranbrook": "CA-1152100",      // CRANBROOK A
  "nelson": "CA-1145430",         // NELSON

  // known good BC fixes
  "prince-rupert": "CA-1045100",  // PRINCE RUPERT
"terrace": "CA-1068130",
  "kitimat": "CA-1047075",        // KITIMAT TOWNSITE
  "dawson-creek": "CA-1161200",   // DAWSON CREEK A
"fort-st-john": "CA-1183000",
  "quesnel": "CA-1096600",        // QUESNEL
"williams-lake": "CA-1098940",
  "abbotsford": "CA-1100030",     // ABBOTSFORD A
  "courtenay": "CA-1021988",      // COURTENAY GRANTHAM
  "salmon-arm": "CA-1166945",     // SALMON ARM
  "nanaimo": "CA-1025365",        // NANAIMO A
  "whistler": "CA-1048898",       // WHISTLER
  "revelstoke": "CA-1176745",     // REVELSTOKE A
  "chilliwack": "CA-1101530",     // CHILLIWACK
  "powell-river": "CA-1046391",   // POWELL RIVER A
  "port-alberni": "CA-1036206",   // PORT ALBERNI A
  "burnaby": "CA-1108430",        // VANCOUVER CITY HALL
  "fort-nelson": "CA-1192948",    // FORT NELSON
  "mackenzie-bc": "CA-1184791",   // MACKENZIE
  "smithers": "CA-1077499",       // SMITHERS
  "burns-lake": "CA-1091169",     // BURNS LAKE
  "100-mile-house": "CA-1095790", // 100 MILE HOUSE
  "penticton": "CA-1126145",      // PENTICTON

  // --- SASKATCHEWAN ---
  "saskatoon": "CA-4057165",      // SASKATOON RCS
  "regina": "CA-4016561",         // REGINA A
  "prince-albert": "CA-4056230",  // PRINCE ALBERT
  "la-ronge": "CA-4064150",       // LA RONGE A
  "swift-current": "CA-4028040",  // SWIFT CURRENT A
  "moose-jaw": "CA-4015315",      // MOOSE JAW A
  "weyburn": "CA-4018760",        // WEYBURN
  "melfort": "CA-4055079",        // MELFORT
  "humboldt-sk": "CA-4013401",    // HUMBOLDT
  "kindersley": "CA-4043888",     // KINDERSLEY
  "meadow-lake": "CA-406N0NM",    // MEADOW LAKE

  // --- MANITOBA ---
  "brandon": "CA-5010480",        // BRANDON A
  "thompson": "CA-5062921",       // THOMPSON A
  "winnipeg": "CA-5023222",       // WINNIPEG RICHARDSON INT'L A
  "selkirk": "CA-5022630",        // SELKIRK
  "steinbach": "CA-5022780",      // STEINBACH
  "morden": "CA-5021848",         // MORDEN CDA
  "winkler": "CA-5021848",        // MORDEN CDA
  "dauphin": "CA-5040680",        // DAUPHIN A
  "the-pas": "CA-5052864",        // THE PAS
  "churchill": "CA-5060608",      // CHURCHILL CLIMATE
  "swan-river": "CA-5042800",     // SWAN RIVER

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
  "burlington-on": "CA-6151053",
    "Okotoks": "CA-3031093",

  "waterloo-on": "CA-6149388",    // REGION OF WATERLOO INT'L AIRPORT
"st-catharines": "CA-6137287",
  "belleville": "CA-6150689",     // BELLEVILLE
  "north-bay": "CA-6085680",      // NORTH BAY A
  "timmins": "CA-6078286",        // TIMMINS A
  "woodstock-on": "CA-6149625",   // WOODSTOCK
  "peterborough": "CA-6166415",   // PETERBOROUGH A
  "stratford-on": "CA-6148100",   // STRATFORD
  "brantford": "CA-6140942",      // BRANTFORD AIRPORT
  "orillia": "CA-6115820",        // ORILLIA TS
  "toronto": "CA-6158660",        // TORONTO ISLAND
    "vaughan": "CA-6158660",        // TORONTO ISLAND


  // stronger northern Ontario fixes
  "cochrane-on": "CA-6071712",    // COCHRANE
  "chapleau": "CA-6061358",       // CHAPLEAU
  "dryden": "CA-6032117",         // DRYDEN
  "elliot-lake": "CA-6052258",    // ELLIOT LAKE
  "kapuskasing": "CA-6073960",    // KAPUSKASING CDA
  "kenora": "CA-6034070",         // KENORA
  "marathon-on": "CA-6044959",    // MARATHON
  "moosonee": "CA-6075420",       // MOOSONEE
  "red-lake": "CA-6016970",       // RED LAKE A
  "sioux-lookout": "CA-6037768",  // SIOUX LOOKOUT
  "wawa": "CA-6059409",           // WAWA

  // safer medium southern Ontario adds
  "hamilton-on": "CA-6153192",    // HAMILTON
  "milton-on": "CA-6155187",      // MILTON KELSO
  "mississauga": "CA-6155BA0",    // MISSISSAUGA
  "oshawa": "CA-6155875",         // OSHAWA
  "richmond-hill": "CA-6157012",  // RICHMOND HILL
  "welland": "CA-6139445",        // WELLAND
  "whitby": "CA-6155870",         // WHITBY MUELLER

  // --- QUEBEC ---
  "montreal": "CA-7025250",       // MONTREAL INTL A
  "quebec-city": "CA-7016293",    // QUEBEC INTL A
  "saguenay": "CA-7060400",       // BAGOTVILLE A
  "saint-hyacinthe": "CA-7027360",// ST HYACINTHE

  // stronger Quebec / north fixes
  "amos": "CA-7090120",           // AMOS
  "baie-comeau": "CA-704S001",    // BAIE-COMEAU
  "chibougamau": "CA-7091400",    // CHIBOUGAMAU
  "forestville": "CA-7042378",    // FORESTVILLE
  "gatineau": "CA-7032680",       // GATINEAU
  "havre-saint-pierre": "CA-7043018", // HAVRE-SAINT-PIERRE A
  "matagami": "CA-7094637",       // MATAGAMI
  "rouyn-noranda": "CA-7085560",  // NORANDA
  "sept-iles": "CA-7047914",      // SEPT-ILES
  "shawinigan": "CA-7018000",     // SHAWINIGAN
  "val-dor": "CA-7098603",        // VAL-D'OR

  // --- ATLANTIC CANADA ---
  "halifax": "CA-8202200",        // HALIFAX
  "new-glasgow": "CA-8203905",    // NEW GLASGOW TRENTON
  "gander": "CA-8401700",         // GANDER INT'L A
  "corner-brook": "CA-8401298",   // CORNER BROOK
  "st-johns": "CA-8403505",       // ST. JOHN'S INTL A
  "yarmouth": "CA-8206495",       // YARMOUTH A
  "kentville": "CA-8202800",      // KENTVILLE CDA
  "truro": "CA-8205988",          // TRURO
  "churchill-falls": "CA-8501130", // CHURCHILL FALLS
  "happy-valley-goose-bay": "CA-8501915", // HAPPY VALLEY GOOSE BAY

  // safer medium Atlantic adds
  "fredericton": "CA-8101605",    // FREDERICTON CDA CS
  "miramichi": "CA-8100989",      // MIRAMICHI RCS

  // --- NORTH ---
  "whitehorse": "CA-2101300",     // WHITEHORSE A
  "yellowknife": "CA-2204100",    // YELLOWKNIFE A
  "dawson-city": "CA-2100401",    // DAWSON CITY A
  "fort-smith": "CA-2202196",     // FORT SMITH
  "hay-river": "CA-2202398",      // HAY RIVER
  "inuvik": "CA-2202578",         // INUVIK CLIMATE
  "norman-wells": "CA-2202810",   // NORMAN WELLS CLIMATE

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
  // --- random ---
  "dawson-creek": "CA-1182280",

};