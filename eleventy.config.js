const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Collections for navigation + index pages
  // Uses URL prefixes so you don't have to maintain front matter flags.
 eleventyConfig.addCollection("tools", (collectionApi) => {
  return collectionApi.getAll().filter((p) => {
    const url = p.url || "";
    return url.startsWith("/tools/") && url !== "/tools/";
  });
});

eleventyConfig.addCollection("guides", (collectionApi) => {
  return collectionApi.getAll().filter((p) => {
    const url = p.url || "";
    return url.startsWith("/guides/") && url !== "/guides/";
  });
});
// Strip site suffix from titles in nav labels
eleventyConfig.addFilter("stripSiteSuffix", function (title) {
  if (!title) return "";
  return String(title)
    .replace(/\s*\|\s*GrowByDate(?:\.com)?\s*$/i, "")
    .trim();
});

  // ✅ Add this filter (used by crops/crop.njk)
  eleventyConfig.addFilter("fileExists", function (relativeIncludePath) {
    // Your includes dir is: src/_includes/
    const fullPath = path.join(process.cwd(), "src", "_includes", relativeIncludePath);
    return fs.existsSync(fullPath);
  });

  eleventyConfig.addPassthroughCopy({ "src/styles.css": "styles.css" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/sitemap.xml": "sitemap.xml" });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk"
  };
};
