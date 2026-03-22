const crops = require("./crops");

const cropByKey = Object.fromEntries(crops.map((crop) => [crop.key, crop]));

const aliases = {
  tomato: "tomatoes",
  tomatoes: "tomatoes",

  pepper: "peppers",
  peppers: "peppers",

  bean: "beans",
  beans: "beans",
  "bean-bush": "beans",

  cucumber: "cucumbers",
  cucumbers: "cucumbers",

  carrot: "carrots",
  carrots: "carrots",

  beet: "beets",
  beets: "beets",

  radish: "radishes",
  radishes: "radishes",

  onion: "onions",
  onions: "onions",

  pea: "peas",
  peas: "peas",

  potato: "potatoes",
  potatoes: "potatoes",

  broccoli: "broccoli",
  kale: "kale",
  spinach: "spinach",
  lettuce: "lettuce",
  cabbage: "cabbage",
  zucchini: "zucchini",
  cauliflower: "cauliflower",
  garlic: "garlic",
  pumpkin: "pumpkin",
  "winter-squash": "winter-squash",
  "winter squash": "winter-squash",

  "swiss-chard": "swiss-chard",
  "swiss chard": "swiss-chard",

  "sweet-corn": "sweet-corn",
  "sweet corn": "sweet-corn",
  "corn-sweet": "sweet-corn"
};

function normalizeCropKey(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return aliases[normalized] || null;
}

module.exports = {
  crops,
  cropByKey,
  normalizeCropKey,
  aliases
};