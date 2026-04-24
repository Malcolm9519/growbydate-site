const fs = require("fs");
const path = require("path");

const siteUrl = "https://growbydate.com";
const outputDir = path.join(process.cwd(), "_site");
const sitemapPath = path.join(outputDir, "sitemap.xml");

function walk(dir) {
  let files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "qa") continue;
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
    let urlPath = "/" + relative.replace(/\\/g, "/").replace(/index\.html$/, "");
    return siteUrl + urlPath;
  })
  .sort();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(sitemapPath, xml);
console.log(`Generated sitemap with ${urls.length} URLs`);
