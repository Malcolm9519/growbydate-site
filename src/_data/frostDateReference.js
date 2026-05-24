const cities = require("./cities.json");
const frostDates = require("./frostDates.json");

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function mmddToDayOfYear(mmdd) {
  const s = String(mmdd || "").trim();
  const month = Number(s.slice(0, 2));
  const day = Number(s.slice(3, 5));
  if (!month || !day) return null;
  const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return monthStarts[month - 1] + day;
}

function mmddLong(mmdd) {
  const s = String(mmdd || "").trim();
  const month = Number(s.slice(0, 2));
  const day = Number(s.slice(3, 5));
  if (!month || !day || month < 1 || month > 12) return s;
  return `${MONTHS[month - 1]} ${day}`;
}

function frostFreeDays(lastFrost, firstFrost) {
  const last = mmddToDayOfYear(lastFrost);
  const first = mmddToDayOfYear(firstFrost);
  if (last == null || first == null) return null;
  if (first >= last) return first - last;
  return 365 - last + first;
}

function median(values) {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : Math.round((clean[mid - 1] + clean[mid]) / 2);
}

function countryLabel(country) {
  return country === "canada" ? "Canada" : "United States";
}

function cityPlantingUrl(city) {
  return `/planting-dates/${city.country === "canada" ? "canada/" : ""}${city.regionKey}/${city.key}/`;
}

module.exports = function () {
  const frostByKey = new Map(frostDates.map((record) => [String(record.key), record]));

  const cityRecords = cities
    .map((city) => {
      const frost = frostByKey.get(String(city.lookupKey));
      if (!frost) return null;
      const seasonDays = frostFreeDays(frost.lastFrost, frost.firstFrost);
      return {
        cityKey: city.key,
        cityName: city.name,
        regionName: city.regionName,
        regionAbbr: city.regionAbbr,
        regionKey: city.regionKey,
        country: city.country,
        countryLabel: countryLabel(city.country),
        lookupKey: city.lookupKey,
        cityUrl: cityPlantingUrl(city),
        lastFrost: frost.lastFrost,
        lastFrostLabel: mmddLong(frost.lastFrost),
        firstFrost: frost.firstFrost,
        firstFrostLabel: mmddLong(frost.firstFrost),
        frostFreeDays: seasonDays,
        sourceLabel: frost.sourceLabel
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const countryCompare = a.countryLabel.localeCompare(b.countryLabel);
      if (countryCompare) return countryCompare;
      const regionCompare = a.regionName.localeCompare(b.regionName);
      if (regionCompare) return regionCompare;
      return a.cityName.localeCompare(b.cityName);
    });

  const byCountry = cityRecords.reduce((acc, record) => {
    acc[record.countryLabel] = (acc[record.countryLabel] || 0) + 1;
    return acc;
  }, {});

  const shortest = [...cityRecords]
    .filter((record) => Number.isFinite(record.frostFreeDays))
    .sort((a, b) => a.frostFreeDays - b.frostFreeDays)
    .slice(0, 8);

  const longest = [...cityRecords]
    .filter((record) => Number.isFinite(record.frostFreeDays))
    .sort((a, b) => b.frostFreeDays - a.frostFreeDays)
    .slice(0, 8);

  const samples = ["calgary", "edmonton", "winnipeg", "toronto", "vancouver", "minneapolis"]
    .map((key) => cityRecords.find((record) => record.cityKey === key))
    .filter(Boolean);

  return {
    totalPostalRecords: frostDates.length,
    totalReferenceCities: cityRecords.length,
    byCountry,
    medianFrostFreeDays: median(cityRecords.map((record) => record.frostFreeDays)),
    sourceLabels: [...new Set(frostDates.map((record) => record.sourceLabel).filter(Boolean))],
    samples,
    cityRecords,
    shortest,
    longest,
    downloads: [
      {
        label: "Frost date summary JSON",
        url: "/assets/data/reference/frost-dates-summary.json",
        description: "A public methodology summary with record counts, sample cities, and frost-free season examples."
      }
    ]
  };
};
