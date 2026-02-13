const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

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
