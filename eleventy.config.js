const fs = require("fs");
const path = require("path");

const isQaBuild = process.env.BUILD_QA === "true";
const buildTarget = process.env.SITE_BUILD_TARGET || "main";

module.exports = function (eleventyConfig) {
  if (buildTarget === "main") {
    eleventyConfig.ignores.add("src/planting-dates/varieties/varieties.njk");
  }

  if (buildTarget === "varieties") {
    eleventyConfig.ignores.add("src/planting-dates/crop-city/crop-city.njk");
    eleventyConfig.ignores.add("src/planting-dates/cities/**");
    eleventyConfig.ignores.add("src/planting-dates/states/**");
    eleventyConfig.ignores.add("src/planting-dates/canada/provinces/**");
    eleventyConfig.ignores.add("src/guides/**");
    eleventyConfig.ignores.add("src/tools/**");
    eleventyConfig.ignores.add("src/qa/**");
    eleventyConfig.ignores.add("src/index.njk");
    eleventyConfig.ignores.add("src/privacy-policy.njk");
    eleventyConfig.ignores.add("src/crops/**");
  }

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  eleventyConfig.addFilter("toVarietiesUrl", function (url) {
    if (!url) return "";
    const path = String(url).startsWith("/") ? String(url) : `/${url}`;
    return `https://varieties.growbydate.com${path}`;
  });

  eleventyConfig.addFilter("toMainSiteUrl", function (url) {
    if (!url) return "https://growbydate.com/";
    const path = String(url).startsWith("/") ? String(url) : `/${url}`;
    return `https://growbydate.com${path}`;
  });

  eleventyConfig.addFilter("toSitemapDate", (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  });

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

    const mi = parseInt(m, 10) - 1;
    const di = parseInt(d, 10);

    if (mi < 0 || mi > 11 || di < 1 || di > 31) return s;
    return `${months[mi]} ${di}`;
  });

  eleventyConfig.addFilter("fileExists", function (relativeIncludePath) {
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