const fs = require("fs");
const path = require("path");
const {
  escapeXml,
  lastmodForUrl,
  normalizeUrlPathFromHtml,
  resolveVarietiesSourceFiles,
  walk
} = require("./sitemap-utils")

const siteUrl = "https://varieties.growbydate.com";
const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "_site-varieties");
const sitemapPath = path.join(outputDir, "sitemap.xml");

const htmlFiles = walk(outputDir);

const urls = htmlFiles
  .map((file) => {
    const urlPath = normalizeUrlPathFromHtml(outputDir, file);
    return {
      urlPath,
      loc: siteUrl + urlPath,
      lastmod: lastmodForUrl(projectRoot, urlPath, resolveVarietiesSourceFiles)
    };
  })
  .filter((url) =>
    url.urlPath.startsWith("/planting-dates/") &&
    url.urlPath.endsWith("/best-varieties/")
  )
  .sort((a, b) => a.loc.localeCompare(b.loc));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => {
  const lastmod = url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : "";
  return `  <url><loc>${escapeXml(url.loc)}</loc>${lastmod}</url>`;
}).join("\n")}
</urlset>
`;

fs.writeFileSync(sitemapPath, xml);
console.log(`Generated varieties sitemap with ${urls.length} URLs`);
