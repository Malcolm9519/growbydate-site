const fs = require("fs");
const path = require("path");

const isQaBuild = process.env.BUILD_QA === "true";
const buildTarget = process.env.SITE_BUILD_TARGET || "main";

const indexNowKey = "78dd8b7095134bcc9613bbcf7be523c9";
const indexNowKeyFile = `${indexNowKey}.txt`;

// Replace this with the exact XML filename Bing gives you.
const bingVerificationFile = "BingSiteAuth.xml";

module.exports = function (eleventyConfig) {
  if (buildTarget === "main") {
    eleventyConfig.ignores.add("src/planting-dates/varieties/varieties.njk");

    // Individual variety guide pages live only on varieties.growbydate.com
    eleventyConfig.ignores.add("src/carrots/**");
    eleventyConfig.ignores.add("src/beets/**");
    eleventyConfig.ignores.add("src/lettuce/**");
    eleventyConfig.ignores.add("src/tomatoes/**");
    eleventyConfig.ignores.add("src/peppers/**");
    eleventyConfig.ignores.add("src/melons/**");
    eleventyConfig.ignores.add("src/watermelons/**");
    eleventyConfig.ignores.add("src/strawberries/**");
    eleventyConfig.ignores.add("src/kale/**");
    eleventyConfig.ignores.add("src/basil/**");
    eleventyConfig.ignores.add("src/spinach/**");
    eleventyConfig.ignores.add("src/peas/**");
    eleventyConfig.ignores.add("src/beans/**");
    eleventyConfig.ignores.add("src/broccoli/**");
    eleventyConfig.ignores.add("src/cabbage/**");
    eleventyConfig.ignores.add("src/cauliflower/**");
    eleventyConfig.ignores.add("src/cucumbers/**");
    eleventyConfig.ignores.add("src/onions/**");
    eleventyConfig.ignores.add("src/potatoes/**");
    eleventyConfig.ignores.add("src/pumpkin/**");
    eleventyConfig.ignores.add("src/sweet-corn/**");
    eleventyConfig.ignores.add("src/swiss-chard/**");
    eleventyConfig.ignores.add("src/winter-squash/**");
    eleventyConfig.ignores.add("src/zucchini/**");
  }


  if (buildTarget === "varieties") {
    eleventyConfig.ignores.add("src/planting-dates/crop-city/crop-city.njk");

    // Keep non-variety planting page families out of the varieties subdomain build.
    eleventyConfig.ignores.add("src/planting-dates/monthly/**");
    eleventyConfig.ignores.add("src/planting-dates/too-late/**");
    eleventyConfig.ignores.add("src/planting-dates/maturity/**");

    eleventyConfig.ignores.add("src/planting-dates/cities/**");
    eleventyConfig.ignores.add("src/planting-dates/states/**");
    eleventyConfig.ignores.add("src/planting-dates/canada/provinces/**");
    eleventyConfig.ignores.add("src/guides/**");
    eleventyConfig.ignores.add("src/tools/**");
    eleventyConfig.ignores.add("src/qa/**");
    eleventyConfig.ignores.add("src/index.njk");
    eleventyConfig.ignores.add("src/privacy-policy.njk");
    eleventyConfig.ignores.add("src/crops/**");
    eleventyConfig.ignores.add("src/data/**");
    eleventyConfig.ignores.add("src/assets/data/rankings/**");
  }

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  eleventyConfig.addFilter("toVarietiesUrl", function (url) {
    if (!url) return "";
    const pagePath = String(url).startsWith("/") ? String(url) : `/${url}`;
    return `https://varieties.growbydate.com${pagePath}`;
  });

  eleventyConfig.addFilter("toMainSiteUrl", function (url) {
    if (!url) return "https://growbydate.com/";
    const pagePath = String(url).startsWith("/") ? String(url) : `/${url}`;
    return `https://growbydate.com${pagePath}`;
  });

  eleventyConfig.addFilter("amazonSearchUrl", function (query, marketplace = "default") {
    const marketplaces = {
      canada: { domain: "www.amazon.ca", tag: "growbydate-20" },
      usa: { domain: "www.amazon.com", tag: "growbydate-20" },
      default: { domain: "www.amazon.com", tag: "growbydate-20" }
    };

    const config = marketplaces[marketplace] || marketplaces.default;
    const params = new URLSearchParams({ k: String(query || ""), tag: config.tag });

    return `https://${config.domain}/s?${params.toString()}`;
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


  eleventyConfig.addFilter("findVarietyGuide", function (guides, varietyName) {
    if (!Array.isArray(guides) || !varietyName) return null;
    const target = String(varietyName).trim().toLowerCase();

    return guides.find((guide) => {
      return String(guide.name || "").trim().toLowerCase() === target;
    }) || null;
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

  if (buildTarget === "varieties") {
    eleventyConfig.addPassthroughCopy({ "src/robots-varieties.txt": "robots.txt" });
  } else {
    eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  }

  eleventyConfig.addPassthroughCopy({ "src/site.webmanifest": "site.webmanifest" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });

  // Optional AI/LLM discovery file.
  // Source file should live in the project root:
  // llms.txt
  // It will be copied to the deployed site root.
  eleventyConfig.addPassthroughCopy({
    "llms.txt": "llms.txt"
  });

  // IndexNow verification key.
  // Source file should live in the project root:
  // 78dd8b7095134bcc9613bbcf7be523c9.txt
  // It will be copied to the deployed site root.
  eleventyConfig.addPassthroughCopy({
    [indexNowKeyFile]: indexNowKeyFile
  });

  // Bing Webmaster Tools XML verification file.
  // Source file should live in the project root.
  // Replace BingSiteAuth.xml above with the exact filename Bing downloaded.
  // It will be copied to the deployed site root.
  eleventyConfig.addPassthroughCopy({
    [bingVerificationFile]: bingVerificationFile
  });

  return {
    dir: {
      input: "src",
      output: buildTarget === "varieties" ? "_site-varieties" : "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk"
  };
};