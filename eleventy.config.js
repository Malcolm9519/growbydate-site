const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  eleventyConfig.addFilter("toSitemapDate", (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  });

  // your other filters / collections stay as they are below
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

eleventyConfig.addFilter("mmddLong", (mmdd) => {
  const s = String(mmdd || "").trim();
  const m = s.slice(0, 2);
  const d = s.slice(3, 5);
  if (!/^\d{2}$/.test(m) || !/^\d{2}$/.test(d)) return s;

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const mi = parseInt(m, 10) - 1;
  const di = parseInt(d, 10);

  if (mi < 0 || mi > 11 || di < 1 || di > 31) return s;
  return `${months[mi]} ${di}`;
});

  // ✅ Add this filter (used by crops/crop.njk)
  eleventyConfig.addFilter("fileExists", function (relativeIncludePath) {
    // Your includes dir is: src/_includes/
    const fullPath = path.join(process.cwd(), "src", "_includes", relativeIncludePath);
    return fs.existsSync(fullPath);
  });

  eleventyConfig.addPassthroughCopy({ "src/styles.css": "styles.css" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/site.webmanifest": "site.webmanifest" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  
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
