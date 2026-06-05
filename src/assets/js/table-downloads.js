(function () {
  const SITE_NAME = "GrowByDate";
  const SITE_URL = "https://growbydate.com";

  function shouldEnhanceTables() {
    return document.querySelector("table[data-downloadable='true']");
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function csvEscape(value) {
    const text = cleanText(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }

  function tableToRows(table) {
    const rows = [];
    table.querySelectorAll("tr").forEach((tr) => {
      if (tr.hidden || tr.style.display === "none") return;
      const cells = Array.from(tr.querySelectorAll("th,td"));
      if (!cells.length) return;
      rows.push(cells.map((cell) => cleanText(cell.innerText || cell.textContent)));
    });
    return rows;
  }

  function rowsToCsv(rows, title) {
    const meta = [
      [`Source`, SITE_NAME],
      [`URL`, location.href],
      [`Downloaded`, new Date().toISOString().slice(0, 10)],
      [`Table`, title || document.title.replace(/\s*\|\s*GrowByDate.*$/i, "")],
      [`Citation`, `${SITE_NAME}. ${title || document.title}. ${location.href}`]
    ];
    return meta.map((row) => row.map(csvEscape).join(",")).join("\n") +
      "\n\n" +
      rows.map((row) => row.map(csvEscape).join(",")).join("\n") +
      "\n";
  }

  function downloadBlob(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function slugify(value) {
    return cleanText(value || document.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "growbydate-table";
  }

  function titleForTable(table) {
    const caption = table.querySelector("caption");
    if (caption) return cleanText(caption.textContent);

    const labelledBy = table.getAttribute("aria-labelledby");
    if (labelledBy) {
      const heading = document.getElementById(labelledBy);
      if (heading) return cleanText(heading.textContent);
    }
    const section = table.closest("section, article, .card");
    const heading = section && section.querySelector("h2,h3,h1");
    return heading ? cleanText(heading.textContent) : cleanText(document.title);
  }

  function brandedPrintHtml(title, tableHtml) {
    const date = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const pageTitle = document.title.replace(/\s*\|\s*GrowByDate.*$/i, "");
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ${SITE_NAME}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem;
      color: #263d24;
      background: #fff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    .printHeader {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 1rem;
      align-items: start;
      border-bottom: 3px solid #6b8f52;
      padding-bottom: 1rem;
      margin-bottom: 1.2rem;
    }
    .brand {
      color: #2f6b3a;
      font-weight: 900;
      letter-spacing: 0.02em;
      font-size: 1.1rem;
    }
    h1 {
      margin: 0.35rem 0 0;
      font-size: 1.65rem;
      line-height: 1.15;
    }
    .meta {
      margin: 0.3rem 0 0;
      color: #53644d;
      font-size: 0.9rem;
    }
    .printButton {
      border: 1px solid #ccd8c6;
      border-radius: 999px;
      background: #f7faf5;
      color: #263d24;
      cursor: pointer;
      font-weight: 800;
      padding: 0.65rem 0.95rem;
    }
    .tableWrap {
      overflow-x: visible;
      margin-top: 1rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
    }
    th, td {
      border: 1px solid #d8e2d0;
      padding: 0.55rem 0.65rem;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f0f6ec;
      color: #263d24;
      font-weight: 850;
    }
    tr:nth-child(even) td { background: #fbfdf8; }
    .citationBox {
      margin-top: 1.4rem;
      padding: 0.9rem 1rem;
      border: 1px solid #d8e2d0;
      border-radius: 14px;
      background: #fbfdf8;
      color: #425540;
      font-size: 0.9rem;
    }
    .citationBox strong { color: #263d24; }
    @media print {
      body { padding: 0.5in; }
      .printButton { display: none !important; }
      a { color: inherit; text-decoration: none; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <header class="printHeader">
    <div>
      <div class="brand">${SITE_NAME}</div>
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">From ${escapeHtml(pageTitle)} · Generated ${escapeHtml(date)}</p>
    </div>
    <button class="printButton" type="button" onclick="window.print()">Print / Save PDF</button>
  </header>
  <main>
    <div class="tableWrap">${tableHtml}</div>
    <div class="citationBox">
      <strong>Cite this resource:</strong><br />
      ${SITE_NAME}. “${escapeHtml(title)}.” Available at: ${escapeHtml(location.href)}
    </div>
  </main>
</body>
</html>`;
  }

  function printTableAsPdf(table, title) {
    const clone = table.cloneNode(true);
    clone.removeAttribute("style");
    clone.querySelectorAll("script, button, input, select, textarea").forEach((el) => el.remove());
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(brandedPrintHtml(title, clone.outerHTML));
    printWindow.document.close();
    printWindow.focus();
  }

  function addActions(table) {
    if (table.dataset.downloadEnhanced === "true") return;
    const wrap = table.closest(".leaderboardTableWrap, .tableWrap, .table-scroll, .scrollTable, .tableScroller, .wcigTableWrap") || table.parentElement;
    if (!wrap || !wrap.parentNode) return;

    table.dataset.downloadEnhanced = "true";
    const title = cleanText(table.dataset.downloadTitle) || titleForTable(table);
    const bar = document.createElement("div");
    bar.className = "tableDownloadBar";
    bar.setAttribute("data-no-print", "true");
    bar.innerHTML = `
      <span class="tableDownloadBrand">${SITE_NAME}</span>
      <button class="button subtle tableDownloadButton" type="button">Download CSV</button>
      <button class="button subtle tablePdfButton" type="button">Print / Save PDF</button>
      <button class="button subtle tableCopyButton" type="button">Copy source link</button>
    `;

    wrap.insertAdjacentElement("afterend", bar);

    const downloadBtn = bar.querySelector(".tableDownloadButton");
    const pdfBtn = bar.querySelector(".tablePdfButton");
    const copyBtn = bar.querySelector(".tableCopyButton");

    downloadBtn.addEventListener("click", () => {
      const rows = tableToRows(table);
      if (!rows.length) return;
      downloadBlob(`${slugify(title)}-growbydate.csv`, rowsToCsv(rows, title), "text/csv;charset=utf-8");
    });

    pdfBtn.addEventListener("click", () => {
      printTableAsPdf(table, title);
    });

    copyBtn.addEventListener("click", async () => {
      const text = `${title} — ${SITE_NAME}: ${location.href}`;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied";
        window.setTimeout(() => { copyBtn.textContent = "Copy source link"; }, 1800);
      } catch (err) {
        window.prompt("Copy this source link:", text);
      }
    });
  }

  function init() {
    if (!shouldEnhanceTables()) return;
    document.querySelectorAll("table[data-downloadable='true']")
      .forEach(addActions);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
