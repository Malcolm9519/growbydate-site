const fs = require("fs");
const path = require("path");

const siteUrl = "https://varieties.growbydate.com";
const outputDir = path.join(process.cwd(), "_site-varieties");
const sitemapPath = path.join(outputDir, "sitemap.xml");

function walk(dir) {
  let files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else if (entry.isFile() && entry.name === "index.html") {
      files.push(fullPath);
    }
  }

  return files;
}

const htmlFiles = walk(outputDir);

const urls = htmlFiles
  .map((file) => {
    const relative = path.relative(outputDir, file);
    const urlPath = "/" + relative.replace(/\\/g, "/").replace(/index\.html$/, "");
    const lastmod = fs.statSync(file).mtime.toISOString();

    return {
      urlPath,
      loc: siteUrl + urlPath,
      lastmod
    };
  })
  .filter((url) =>
    url.urlPath.startsWith("/planting-dates/") &&
    url.urlPath.endsWith("/best-varieties/")
  )
  .sort((a, b) => a.loc.localeCompare(b.loc));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url.loc}</loc><lastmod>${url.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(sitemapPath, xml);
console.log(`Generated varieties sitemap with ${urls.length} URLs`);