const crops = require("./crops");

const LEGACY_GDD_SLUG_BY_KEY = {
  tomatoes: "tomato",
  peppers: "pepper",
  cucumbers: "cucumber",
  carrots: "carrot",
  beets: "beet",
  peas: "pea",
  onions: "onion",
  potatoes: "potato",
  beans: "bean-bush",
  "sweet-corn": "corn-sweet"
};

module.exports = crops
  .filter(
    (crop) =>
      crop.tools?.gddPlanner &&
      crop.climate?.gddBaseF != null &&
      crop.climate?.gddTargetTypical != null
  )
  .map((crop) => ({
    slug: LEGACY_GDD_SLUG_BY_KEY[crop.key] || crop.key,
    canonicalKey: crop.key,
    name: crop.singularName
      ? crop.singularName.charAt(0).toUpperCase() + crop.singularName.slice(1)
      : crop.name,
    base_f: crop.climate.gddBaseF,
    gdd_required: crop.climate.gddTargetTypical,
    category: crop.taxonomy.category
  }));