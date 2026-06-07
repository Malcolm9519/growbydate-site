const fs = require("fs");
const path = require("path");
const {
  escapeXml,
  lastmodForUrl,
  normalizeUrlPathFromHtml,
  resolveMainSourceFiles,
  walk
} = require("./scripts/sitemap-utils");

const siteUrl = "https://growbydate.com";
const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "_site");
const sitemapPath = path.join(outputDir, "sitemap.xml");

const htmlFiles = walk(outputDir, { skipDirs: new Set(["qa"]) });

const urls = htmlFiles
  .map((file) => {
    const urlPath = normalizeUrlPathFromHtml(outputDir, file);
    return {
      loc: siteUrl + urlPath,
      lastmod: lastmodForUrl(projectRoot, urlPath, resolveMainSourceFiles)
    };
  })
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
console.log(`Generated sitemap with ${urls.length} URLs`);
