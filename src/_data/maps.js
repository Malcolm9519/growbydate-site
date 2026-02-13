const crops = require("./crops.json");
const tools = require("./tools.json");

module.exports = () => {
  const cropsBySlug = Object.fromEntries(crops.map(c => [c.slug, c]));
  const toolsBySlug = Object.fromEntries(tools.map(t => [t.slug, t]));

  // Reverse map: toolSlug -> [{slug, name}, ...]
  const toolToCrops = {};

  for (const crop of crops) {
    const related = crop.relatedTools || [];
    for (const toolSlug of related) {
      if (!toolToCrops[toolSlug]) toolToCrops[toolSlug] = [];
      toolToCrops[toolSlug].push({ slug: crop.slug, name: crop.name });
    }
  }

  // Optional: stable ordering
  for (const slug of Object.keys(toolToCrops)) {
    toolToCrops[slug].sort((a, b) => a.name.localeCompare(b.name));
  }

  return { cropsBySlug, toolsBySlug, toolToCrops };
};
