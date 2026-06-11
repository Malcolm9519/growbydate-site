const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const gitDateCache = new Map();
const frontMatterCache = new Map();
const fsDateCache = new Map();

function walk(dir, options = {}) {
  const { skipDirs = new Set() } = options;
  let files = [];

  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      files = files.concat(walk(fullPath, options));
    } else if (entry.isFile() && entry.name === "index.html") {
      files.push(fullPath);
    }
  }

  return files;
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeUrlPathFromHtml(outputDir, file) {
  const relative = path.relative(outputDir, file);
  const urlPath = "/" + relative.replace(/\\/g, "/").replace(/index\.html$/, "");
  return urlPath === "//" ? "/" : urlPath;
}

function parseFrontMatter(file) {
  if (frontMatterCache.has(file)) return frontMatterCache.get(file);
  const result = {};

  if (!fs.existsSync(file)) {
    frontMatterCache.set(file, result);
    return result;
  }

  const raw = fs.readFileSync(file, "utf8");
  if (!raw.startsWith("---")) {
    frontMatterCache.set(file, result);
    return result;
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    frontMatterCache.set(file, result);
    return result;
  }

  const fm = raw.slice(3, end).split(/\r?\n/);
  for (const line of fm) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*["']?([^"'#]+)["']?\s*(?:#.*)?$/);
    if (match) result[match[1].trim()] = match[2].trim();
  }

  frontMatterCache.set(file, result);
  return result;
}

function explicitFrontMatterDate(file) {
  const fm = parseFrontMatter(file);
  const value = fm.sitemapLastmod || fm.lastmod || fm.updated || fm.dateModified || fm.date;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function gitLastModifiedDate(projectRoot, file) {
  const relative = path.relative(projectRoot, file).replace(/\\/g, "/");
  if (gitDateCache.has(relative)) return gitDateCache.get(relative);

  let date = null;
  try {
    const output = execFileSync("git", ["log", "-1", "--format=%cI", "--", relative], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    if (output) {
      const parsed = new Date(output);
      if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
  } catch (error) {
    date = null;
  }

  gitDateCache.set(relative, date);
  return date;
}

function fsLastModifiedDate(file) {
  if (fsDateCache.has(file)) return fsDateCache.get(file);
  let date = null;
  try {
    date = fs.statSync(file).mtime;
  } catch (error) {
    date = null;
  }
  fsDateCache.set(file, date);
  return date;
}

function dateForFile(projectRoot, file) {
  const explicit = explicitFrontMatterDate(file);
  if (explicit) return explicit;

  const gitDate = gitLastModifiedDate(projectRoot, file);
  if (gitDate) return gitDate;

  // Avoid using deploy/build-time filesystem mtimes by default.
  // On hosts like Cloudflare Pages, those mtimes can make every URL
  // look freshly updated on every deploy.
  return process.env.SITEMAP_ALLOW_FS_MTIME === "true" ? fsLastModifiedDate(file) : null;
}

function latestDateForFiles(projectRoot, files) {
  const dates = files
    .filter(Boolean)
    .filter((file) => fs.existsSync(file))
    .map((file) => dateForFile(projectRoot, file))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime());

  return dates[0] || null;
}

function existingFiles(projectRoot, relativeFiles) {
  return relativeFiles
    .map((file) => path.join(projectRoot, file))
    .filter((file) => fs.existsSync(file));
}

function staticSourceCandidates(projectRoot, urlPath) {
  const clean = urlPath.replace(/^\//, "").replace(/\/$/, "");
  const candidates = [];

  if (urlPath === "/") {
    candidates.push("src/index.njk", "src/index.md");
  } else {
    candidates.push(
      `src/${clean}/index.njk`,
      `src/${clean}/index.md`,
      `src/${clean}.njk`,
      `src/${clean}.md`
    );

    // Many crop variety/cluster pages are stored outside /src/crops/ but
    // publish to /crops/{crop}/{page}/ through front matter permalinks.
    const cropPageMatch = clean.match(/^crops\/([^/]+)\/([^/]+)$/);
    if (cropPageMatch) {
      const [, cropSlug, pageSlug] = cropPageMatch;
      candidates.push(
        `src/${cropSlug}/${pageSlug}.njk`,
        `src/${cropSlug}/${pageSlug}.md`,
        `src/${cropSlug}/${pageSlug}/index.njk`,
        `src/${cropSlug}/${pageSlug}/index.md`
      );
    }
  }

  return existingFiles(projectRoot, candidates);
}

function resolveMainSourceFiles(projectRoot, urlPath) {
  const staticFiles = staticSourceCandidates(projectRoot, urlPath);
  if (staticFiles.length) return staticFiles;

  // Keep shared layout/sitewide files out of URL-level lastmod calculations.
  // Otherwise a layout or SEO partial edit can make the entire sitemap appear
  // freshly updated, even when the page content did not materially change.
  const commonGeneratedData = [];
  
  const regionData = [
    "src/_data/cities.json",
    "src/_data/frostDates.json",
    "src/_data/frostStations.json",
    "src/_data/gddStations.json",
    "src/_data/gddStationSeries.json",
    "src/_data/regionContent.js",
    "src/_data/locationContent.js",
    "src/_data/provinceSummariesCA.js",
    "src/_data/stateSummariesUS.js",
    "src/_data/_lib/regionSummaries.js",
    "src/_data/_lib/citySummaries.js"
  ];

  const cropData = [
    "src/_data/crops.js",
    "src/_data/cropRegistry.js",
    "src/_data/cropHeatRequirements.js",
    "src/_data/gddCrops.js",
    "src/_data/cropClimateRecords.js",
    "src/_data/cropCityCrops.js"
  ];

  if (/^\/planting-dates\/canada\/provinces\/[^/]+\/$/.test(urlPath)) {
    return existingFiles(projectRoot, [
      "src/planting-dates/canada/provinces/province.njk",
      ...regionData,
      ...commonGeneratedData
    ]);
  }

  if (/^\/planting-dates\/states\/[^/]+\/$/.test(urlPath)) {
    return existingFiles(projectRoot, [
      "src/planting-dates/states/state.njk",
      ...regionData,
      ...commonGeneratedData
    ]);
  }

  if (/^\/planting-dates\/(?:canada\/)?[^/]+\/[^/]+\/[^/]+\/$/.test(urlPath)) {
    return existingFiles(projectRoot, [
      "src/planting-dates/crop-city/crop-city.njk",
      "src/_data/cropCitySummaries.js",
      "src/_data/cropCityByCity.js",
      "src/_data/cropCityRollout.js",
      "src/_data/varietySummaries.js",
      "src/_data/varietyRecommendationIndex.js",
      "src/_data/varietyGuides.js",
      ...regionData,
      ...cropData,
      ...commonGeneratedData
    ]);
  }

  if (/^\/planting-dates\/(?:canada\/)?[^/]+\/[^/]+\/$/.test(urlPath)) {
    return existingFiles(projectRoot, [
      "src/planting-dates/cities/city.njk",
      "src/_data/citySummaries.js",
      "src/_data/cityRollout.js",
      ...regionData,
      ...commonGeneratedData
    ]);
  }

  if (/^\/crops\/[^/]+\/$/.test(urlPath)) {
    return existingFiles(projectRoot, [
      "src/crops/crop.njk",
      ...cropData,
      ...commonGeneratedData
    ]);
  }

  return existingFiles(projectRoot, commonGeneratedData);
}

function resolveVarietiesSourceFiles(projectRoot, urlPath) {
  if (/^\/planting-dates\/(?:canada\/)?[^/]+\/[^/]+\/best-varieties\/$/.test(urlPath)) {
    return existingFiles(projectRoot, [
      "src/planting-dates/varieties/varieties.njk",
      "src/_data/varietySummaries.js",
      "src/_data/varietyGuides.js",
      "src/_data/varietyRecommendationIndex.js",
      "src/_data/cropCitySummaries.js",
      "src/_data/crops.js",
      "src/_data/cities.json",
      "src/_data/frostDates.json",
      "src/_data/gddStations.json",
      "src/_data/site.json",
      "src/_includes/layout-base.njk"
    ]);
  }

  return resolveMainSourceFiles(projectRoot, urlPath);
}

function lastmodForUrl(projectRoot, urlPath, resolver) {
  const files = resolver(projectRoot, urlPath);
  const date = latestDateForFiles(projectRoot, files);
  return date ? date.toISOString() : null;
}

module.exports = {
  escapeXml,
  lastmodForUrl,
  normalizeUrlPathFromHtml,
  resolveMainSourceFiles,
  resolveVarietiesSourceFiles,
  walk
};
