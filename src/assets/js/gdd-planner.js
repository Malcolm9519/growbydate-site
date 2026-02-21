/* src/assets/js/gdd-planner.js
   Normals-based GDD maturity estimator (static-only, deterministic).
   UI behavior aligned with frost planners: multi-crop picker, stacked inputs,
   results actions (copy/print/download), and scroll-to-results.
*/

import { lookupFrost, formatMmddLong } from "/assets/js/frost-lookup.js";
import { lookupStationId, loadStationSeries } from "/assets/js/gdd-lookup.js";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

let _cropsPromise = null;
let _crops = [];

let lastPlan = null; // { meta, rows }

// ---- Site crop metadata (slug, etc.) from Eleventy data. Used for consistent linking and crop lists.
function readJsonScript(id) {
  try {
    const el = document.getElementById(id);
    if (!el) return [];
    return JSON.parse(el.textContent || "[]");
  } catch (e) {
    return [];
  }
}

const SITE_CROPS = readJsonScript("siteCropsJson");
const SITE_CROPS_BY_ID = Object.create(null);
for (const c of (SITE_CROPS || [])) {
  if (c && c.id) SITE_CROPS_BY_ID[c.id] = c;
}

const GDD_CROPS_RAW = readJsonScript("gddCropsJson");
const GDD_BY_SLUG = Object.create(null);
for (const g of (GDD_CROPS_RAW || [])) {
  if (g && g.slug) GDD_BY_SLUG[g.slug] = g;
}

// Tool crop IDs don't always match site crop IDs (tomato → tomatoes, etc.)
const SITE_ID_TO_GDD_SLUG = {
  tomatoes: "tomato",
  peppers: "pepper",
  carrots: "carrot",
  beets: "beet",
  onions: "onion",
  peas: "pea",
  beans: "bean-bush"
};

function gddSlugForSiteId(siteId) {
  return SITE_ID_TO_GDD_SLUG[siteId] || siteId;
}

function toolCropsFromSite() {
  // Use the same system as other planners: site crops filtered by relatedTools.
  const eligible = (SITE_CROPS || []).filter(c =>
    c && c.id && Array.isArray(c.relatedTools) && c.relatedTools.includes("gdd-planner")
  );

  // Join with GDD config (base_f, required, category). Skip if not found.
  const out = [];
  for (const c of eligible) {
    const gSlug = gddSlugForSiteId(c.id);
    const g = GDD_BY_SLUG[gSlug];
    if (!g) continue;
    out.push({
      siteId: c.id,
      slug: c.slug || c.id,
      name: c.name || g.name || c.id,
      gddSlug: gSlug,
      base_f: g.base_f,
      gdd_required: g.gdd_required,
      category: g.category
    });
  }

  out.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));
  return out;
}

// Emoji map (mirrors frost/seed planners)
const CROP_ICONS = {
  tomato: "🍅",
  tomatoes: "🍅",
  pepper: "🫑",
  peppers: "🫑",
  eggplant: "🍆",
  cucumber: "🥒",
  zucchini: "🥒",
  "winter-squash": "🎃",
  squash: "🎃",
  pumpkin: "🎃",
  "corn-sweet": "🌽",
  corn: "🌽",
  "bean-bush": "🫘",
  beans: "🫘",
  bean: "🫘",
  pea: "🫛",
  peas: "🫛",
  carrot: "🥕",
  carrots: "🥕",
  beet: "🫜",
  beets: "🫜",
  potato: "🥔",
  onion: "🧅",
  onions: "🧅",
  garlic: "🧄",
  broccoli: "🥦",
  cauliflower: "🥦",
  cabbage: "🥬",
  lettuce: "🥬",
  spinach: "🍃",
  kale: "🥬",
  radish: "🌱",
  turnip: "🌱",
  melon: "🍈",
  watermelon: "🍉",
  strawberry: "🍓",
  sunflower: "🌻",
  basil: "🌿",
  herb: "🌿"
};

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mmddToDoy(mmdd) {
  const s = String(mmdd || "").trim();
  const m = parseInt(s.slice(0, 2), 10);
  const d = parseInt(s.slice(3, 5), 10);
  if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return -1;

  let doy = 0;
  for (let i = 0; i < m - 1; i++) doy += DAYS_IN_MONTH[i];
  doy += (d - 1);
  if (doy < 0 || doy > 364) return -1;
  return doy;
}

function dateValueToDoy(dateValue) {
  // "YYYY-MM-DD" -> doy (non-leap)
  const s = String(dateValue || "");
  const m = parseInt(s.slice(5, 7), 10);
  const d = parseInt(s.slice(8, 10), 10);
  if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return -1;
  let doy = 0;
  for (let i = 0; i < m - 1; i++) doy += DAYS_IN_MONTH[i];
  doy += (d - 1);
  if (doy < 0 || doy > 364) return -1;
  return doy;
}

function doyToLabel(doy) {
  let remaining = doy;
  for (let m = 0; m < 12; m++) {
    const dim = DAYS_IN_MONTH[m];
    if (remaining < dim) return `${MONTHS[m]} ${remaining + 1}`;
    remaining -= dim;
  }
  return "";
}

function pickBaseKey(baseF) {
  const b = safeNum(baseF, 50);
  if (b <= 40) return "40";
  if (b <= 45) return "45";
  return "50";
}

// Cumulative arrays are "through day" values.
function startTotalBeforeDoy(cum, plantingDoy) {
  if (!Array.isArray(cum) || cum.length < 365) return 0;
  if (!(plantingDoy >= 0 && plantingDoy <= 364)) return 0;
  return plantingDoy > 0 ? safeNum(cum[plantingDoy - 1], 0) : 0;
}

function findMaturityDoy(cum, plantingDoy, requiredGdd) {
  if (!Array.isArray(cum) || cum.length < 365) return -1;
  if (!(plantingDoy >= 0 && plantingDoy <= 364)) return -1;

  const startTotal = startTotalBeforeDoy(cum, plantingDoy);
  const target = startTotal + safeNum(requiredGdd, 0);

  for (let i = plantingDoy; i < 365; i++) {
    if (safeNum(cum[i], 0) >= target) return i;
  }
  return -1;
}

function availableGddBeforeFrost(cum, plantingDoy, frostDoy) {
  if (!Array.isArray(cum) || cum.length < 365) return 0;
  if (!(plantingDoy >= 0 && plantingDoy <= 364)) return 0;
  if (!(frostDoy >= 0 && frostDoy <= 364)) return 0;
  if (frostDoy <= plantingDoy) return 0;

  const start = startTotalBeforeDoy(cum, plantingDoy);
  const end = safeNum(cum[frostDoy], 0);
  return Math.max(0, Math.round(end - start));
}

function latestPlantingDoyToMatureBeforeFrost(cum, frostDoy, requiredGdd) {
  if (!Array.isArray(cum) || cum.length < 365) return -1;
  if (!(frostDoy >= 0 && frostDoy <= 364)) return -1;

  const required = safeNum(requiredGdd, 0);
  if (!(required > 0)) return -1;

  for (let p = frostDoy - 1; p >= 0; p--) {
    const avail = availableGddBeforeFrost(cum, p, frostDoy);
    if (avail >= required) return p;
  }
  return -1;
}

function riskLabel(maturityDoy, frostDoy) {
  if (maturityDoy < 0 || frostDoy < 0) {
    return { score: 1, label: "Unknown", note: "Not enough data to compare." };
  }
  if (maturityDoy < frostDoy - 14) {
    return { score: 0, label: "Likely to mature before typical frost", note: "In a typical year, maturity lands comfortably before first frost." };
  }
  if (maturityDoy < frostDoy) {
    return { score: 1, label: "At risk in cooler seasons", note: "Maturity is close to first frost. A cool year can push you past frost." };
  }
  return { score: 2, label: "Unlikely to mature before typical frost", note: "In a typical year, first frost arrives before maturity." };
}

async function loadCrops() {
  if (_crops.length) return _crops;
  if (_cropsPromise) return _cropsPromise;

  _cropsPromise = Promise.resolve().then(() => {
    _crops = toolCropsFromSite();
    return _crops;
  });

  return _cropsPromise;
}

function byId(id) { return document.getElementById(id); }

function setStatus(el, msg) {
  if (!el) return;
  el.textContent = msg || "";
}

function show(el, yes) {
  if (!el) return;
  el.style.display = yes ? "" : "none";
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cropUrlFromSiteId(siteId, fallbackSlug) {
  const meta = SITE_CROPS_BY_ID[siteId];
  const slug = (meta && meta.slug) ? meta.slug : (fallbackSlug || siteId);
  return `/crops/${slug}/`;
}

function cropIcon(slug) {
  return CROP_ICONS[slug] || "🌱";
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
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function escapeCsv(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function initCropList(crops, listEl) {
  if (!listEl) return;

  listEl.innerHTML = "";

  for (const c of (crops || [])) {
        const siteId = c.siteId || c.id || "";
    if (!siteId) continue;

    const id = `gdd-crop-${siteId}`;
    const row = document.createElement("div");
    row.className = "cropPickRow";
    row.innerHTML = `
      <label class="cropPickLabel" for="${escapeHtml(id)}">
        <input id="${escapeHtml(id)}" type="checkbox" value="${escapeHtml(siteId)}" />
        <span class="cropPickName">
          <span class="cropPickIcon" aria-hidden="true">${escapeHtml(cropIcon(c.siteId || c.gddSlug || siteId))}</span>
          <span>${escapeHtml(c.name || siteId)}</span>
        </span>
      </label>
    `;
    listEl.appendChild(row);
  }
}

function selectedCropIds(listEl) {
  if (!listEl) return [];
  return Array.from(listEl.querySelectorAll("input[type='checkbox']:checked")).map((cb) => cb.value).filter(Boolean);
}

function resetForm({ locEl, plantEl, overrideEl, cropListEl, resultsCardEl, resultsBodyEl, riskBoxEl, statusEl, footnoteEl, actionEls }) {
  if (locEl) locEl.value = "";
  if (overrideEl) overrideEl.value = "";
  if (plantEl) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    plantEl.value = `${yyyy}-${mm}-${dd}`;
  }
  if (cropListEl) {
    Array.from(cropListEl.querySelectorAll("input[type='checkbox']")).forEach((cb) => (cb.checked = false));
  }
  if (resultsBodyEl) resultsBodyEl.innerHTML = "";
  if (footnoteEl) footnoteEl.textContent = "";
  if (riskBoxEl) riskBoxEl.style.display = "none";
  if (resultsCardEl) resultsCardEl.style.display = "none";
  if (statusEl) statusEl.textContent = "";
  for (const el of (actionEls || [])) {
    if (el) el.style.display = "none";
  }
  lastPlan = null;
}

function buildTextPlan(meta, rows) {
  const lines = [];
  lines.push("GrowByDate — GDD maturity estimate (typical year)");
  lines.push(" ");
  if (meta.location) lines.push(`Location: ${meta.location}`);
  if (meta.stationId) lines.push(`GDD station: ${meta.stationId} (Base ${meta.baseKey}°F)`);
  if (meta.plantingLabel) lines.push(`Planting date: ${meta.plantingLabel}`);
  if (meta.firstFrostLabel) lines.push(`Average first fall frost: ${meta.firstFrostLabel}`);
  lines.push(" ");

  for (const r of rows) {
    if (r.type === "cropHeader") {
      lines.push(`${r.cropName} (${r.slug})`);
    } else if (r.type === "row") {
      lines.push(`- ${r.key}: ${r.valuePlain}${r.notes ? ` (${r.notes})` : ""}`);
    }
  }

  return lines.join("\n");
}

function buildCsv(rows) {
  const lines = [];
  lines.push(["Crop","Field","Value","Notes"].map(escapeCsv).join(","));
  let currentCrop = "";
  for (const r of rows) {
    if (r.type === "cropHeader") {
      currentCrop = r.cropName;
      continue;
    }
    if (r.type === "row") {
      lines.push([currentCrop, r.key, r.valuePlain, r.notes || ""].map(escapeCsv).join(","));
    }
  }
  return lines.join("\n");
}

async function init() {
  const locEl = byId("gdd-location");
  const cropListEl = byId("gdd-cropList");
  const plantEl = byId("gdd-planting");
  const runEl = byId("gdd-run");
  const resetEl = byId("gdd-reset");
  const statusEl = byId("gdd-status");
  const formWarnEl = byId("gdd-formWarn");

  const resultsCardEl = byId("gdd-resultsCard");
  const resultsBodyEl = byId("gdd-resultsBody");
  const riskBoxEl = byId("gdd-riskBox");
  const riskLabelEl = byId("gdd-riskLabel");
  const riskNoteEl = byId("gdd-riskNote");
  const footnoteEl = byId("gdd-footnote");

  const copyBtn = byId("gdd-copyBtn");
  const printBtn = byId("gdd-printBtn");
  const csvBtn = byId("gdd-csvBtn");
  const txtBtn = byId("gdd-txtBtn");

  if (!runEl) return;

  const crops = await loadCrops();
  initCropList(crops, cropListEl);

  // Default planting date: today (local)
  if (plantEl && !plantEl.value) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    plantEl.value = `${yyyy}-${mm}-${dd}`;
  }

  async function run() {
    setStatus(statusEl, "Working…");

    // Clear any prior inline warning near the form.
    if (formWarnEl) {
      formWarnEl.textContent = "";
      show(formWarnEl, false);
    }

    if (resultsBodyEl) resultsBodyEl.innerHTML = "";
    if (footnoteEl) footnoteEl.textContent = "";
    if (riskLabelEl) riskLabelEl.textContent = "";
    if (riskNoteEl) riskNoteEl.textContent = "";
    show(riskBoxEl, false);
    show(resultsCardEl, false);

    if (copyBtn) copyBtn.style.display = "none";
    if (printBtn) printBtn.style.display = "none";
    if (csvBtn) csvBtn.style.display = "none";
    if (txtBtn) txtBtn.style.display = "none";

    const chosen = selectedCropIds(cropListEl);
    if (!chosen.length) {
      setStatus(statusEl, "");
      if (resultsBodyEl) {
        resultsBodyEl.innerHTML = `
          <tr><th scope="row">Status</th><td><span class="small">Select at least one crop to estimate.</span></td></tr>
        `;
      }
      show(resultsCardEl, true);
      return;
    }

    const plantingDoy = dateValueToDoy(plantEl ? plantEl.value : "");
    if (plantingDoy < 0) {
      setStatus(statusEl, "");
      if (resultsBodyEl) resultsBodyEl.innerHTML = `<tr><th scope="row">Status</th><td><span class="small">Choose a valid planting date.</span></td></tr>`;
      show(resultsCardEl, true);
      return;
    }

    const rawLoc = locEl ? locEl.value : "";
    if (!String(rawLoc || "").trim()) {
      setStatus(statusEl, "");
      if (formWarnEl) {
        formWarnEl.textContent = "Enter a 5-digit ZIP (U.S.) or the first 3 characters of your postal code (e.g., T5A).";
        show(formWarnEl, true);
      }
      if (locEl) locEl.focus();
      return;
    }

    try {
    const frost = await lookupFrost(rawLoc);
    if (!frost) {
      setStatus(statusEl, "");
      if (formWarnEl) {
        formWarnEl.textContent = "No match found for that ZIP / postal code. Try a nearby ZIP (U.S.) or FSA (Canada).";
        show(formWarnEl, true);
      }
      return;
    }

    const stationId = await lookupStationId(rawLoc);
    const where = [frost.name, frost.region].filter(Boolean).join(", ");
    const frostLabel = formatMmddLong(frost.firstFrost);

    if (!stationId) {
      setStatus(statusEl, "");
      if (resultsBodyEl) {
        resultsBodyEl.innerHTML = `
          <tr><th scope="row">Location</th><td><strong>${escapeHtml(where)}</strong></td></tr>
          <tr><th scope="row">Average first fall frost</th><td><strong>${escapeHtml(frostLabel)}</strong></td></tr>
          <tr><th scope="row">Status</th><td><span class="small">GDD station coverage isn’t available for this location yet.</span></td></tr>
        `;
      }
      show(resultsCardEl, true);
      return;
    }

    const station = await loadStationSeries(stationId);
    if (!station?.bases) {
      setStatus(statusEl, "");
      if (resultsBodyEl) {
        resultsBodyEl.innerHTML = `
          <tr><th scope="row">Location</th><td><strong>${escapeHtml(where)}</strong></td></tr>
          <tr><th scope="row">Average first fall frost</th><td><strong>${escapeHtml(frostLabel)}</strong></td></tr>
          <tr><th scope="row">GDD station</th><td><strong>${escapeHtml(stationId)}</strong></td></tr>
          <tr><th scope="row">Status</th><td><span class="small">Station series file not found for this location.</span></td></tr>
        `;
      }
      show(resultsCardEl, true);
      return;
    }

    const frostDoy = mmddToDoy(frost.firstFrost);
    const plantingLabel = doyToLabel(plantingDoy);
    const hasOverride = false;

    const rows = [];
    const planRows = []; // export-friendly

    // Summary rows first (like other planners)
    rows.push(`<tr><th scope="row">Location</th><td><strong>${escapeHtml(where)}</strong></td></tr>`);
    rows.push(`<tr><th scope="row">Average first fall frost</th><td><strong>${escapeHtml(frostLabel)}</strong></td></tr>`);
    rows.push(`<tr><th scope="row">Planting date</th><td><strong>${escapeHtml(plantingLabel)}</strong></td></tr>`);

    // Multi-crop body
    let worstRisk = { score: -1, label: "", note: "" };
    let anyLatePlant = false;

        for (const siteId of chosen) {
      const crop = crops.find((c) => (c.siteId || c.id) === siteId);
      if (!crop) continue;

      const baseKey = pickBaseKey(crop?.base_f);
      const cum = station.bases?.[baseKey];

      const required = Math.round(safeNum(crop?.gdd_required, 0));
      const maturityDoy = findMaturityDoy(cum, plantingDoy, required);
      const maturityLabel = maturityDoy >= 0 ? doyToLabel(maturityDoy) : "Not reached before year-end in a typical year";
      const daysToMaturity = maturityDoy >= 0 ? (maturityDoy - plantingDoy + 1) : null;

      const avail = availableGddBeforeFrost(cum, plantingDoy, frostDoy);
      const deficit = Math.max(0, Math.round(required - avail));

      const latestSafePlantDoy = latestPlantingDoyToMatureBeforeFrost(cum, frostDoy, required);
      const latestSafeLabel = latestSafePlantDoy >= 0 ? doyToLabel(latestSafePlantDoy) : "Not possible in a typical year";

      const risk = riskLabel(maturityDoy, frostDoy);
      if (risk.score > worstRisk.score) worstRisk = risk;

      if (latestSafePlantDoy >= 0 && plantingDoy > latestSafePlantDoy) anyLatePlant = true;

      const icon = cropIcon(crop.siteId || crop.gddSlug || siteId);
      const cropName = crop?.name || siteId;
      const link = cropUrlFromSiteId(crop.siteId || siteId, crop.slug || siteId);
      const exportSlug = crop.gddSlug || crop.siteId || crop.slug || siteId;

      rows.push(`
        <tr class="cropHeaderRow"><td colspan="2">
          <span class="cropHeaderIcon" aria-hidden="true">${escapeHtml(icon)}</span>
          <a class="cropHeaderLink" href="${escapeHtml(link)}">${escapeHtml(cropName)}</a>
          <span class="small muted">· Base ${escapeHtml(baseKey)}°F</span>
        </td></tr>
      `);

      const add = (key, valueHtml, valuePlain, notes = "") => {
        rows.push(`<tr><th scope="row">${escapeHtml(key)}</th><td>${valueHtml}</td></tr>`);
        planRows.push({ type: "row", key, valuePlain, notes });
      };

      planRows.push({ type: "cropHeader", slug: exportSlug, cropName });

      add("Estimated maturity date", `${escapeHtml(maturityLabel)}`, maturityLabel);
      if (daysToMaturity !== null) add("Days from planting", `${daysToMaturity}`, String(daysToMaturity));
      add("GDD target", `${required}`, String(required));
      add("Available GDD before typical first frost", `${avail}`, String(avail));
      if (maturityDoy < 0 || maturityDoy >= frostDoy) add("Estimated shortfall by frost", `${deficit} GDD`, `${deficit} GDD`);
      add("Latest typical planting date to mature before frost", `${escapeHtml(latestSafeLabel)}`, latestSafeLabel);
      add("Assessment", `${escapeHtml(risk.label)}`, risk.label, risk.note);
    }

    if (resultsBodyEl) resultsBodyEl.innerHTML = rows.join("");

    // Risk block: summarize worst-case across selected crops
    const hasRisk = !!(worstRisk && worstRisk.label);
    if (hasRisk) {
      if (riskLabelEl) riskLabelEl.textContent = chosen.length > 1 ? `Overall: ${worstRisk.label}` : worstRisk.label;

      const extra = chosen.length > 1 ? " Review each crop section above for crop-specific details." : "";
      const note = (worstRisk.note || "").trim();
      if (riskNoteEl) riskNoteEl.textContent = note ? (note + extra) : (chosen.length > 1 ? "Review each crop section above for details." : "");
      show(riskBoxEl, true);
    } else {
      // Should not happen, but avoid an empty warning box.
      if (riskLabelEl) riskLabelEl.textContent = "";
      if (riskNoteEl) riskNoteEl.textContent = "";
      show(riskBoxEl, false);
    }

    if (footnoteEl) {
      const latePlantNote = anyLatePlant ? "You’re planting after the typical “latest safe” date for at least one selected crop. " : "";
      footnoteEl.textContent = `${latePlantNote}This is based on climate normals. A warm year can mature faster; a cool year can slip later.`;
    }

    setStatus(statusEl, "");
    show(resultsCardEl, true);

    // Enable actions
    if (copyBtn) copyBtn.style.display = "inline-block";
    if (printBtn) printBtn.style.display = "inline-block";
    if (csvBtn) csvBtn.style.display = "inline-block";
    if (txtBtn) txtBtn.style.display = "inline-block";

    const meta = {
      location: where,
      stationId,
      baseKey: "varies",
      plantingLabel,
      firstFrostLabel: frostLabel
    };

    lastPlan = { meta, rows: planRows };

    // Scroll to results (match other tools)
    setTimeout(() => {
      const results = byId("gdd-resultsCard");
      if (results) results.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    } catch (err) {
      // Fail safely: clear the "Working" state and surface a useful message.
      setStatus(statusEl, "");
      if (formWarnEl) {
        formWarnEl.textContent = "Something didn’t load correctly. Please try again, or try a nearby ZIP / postal code.";
        show(formWarnEl, true);
      }
      // eslint-disable-next-line no-console
      console.error("GDD planner error", err);
    }
  }

  function copyResults() {
    if (!lastPlan) return;
    const text = buildTextPlan(lastPlan.meta, lastPlan.rows);
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function downloadCsv() {
    if (!lastPlan) return;
    const csv = buildCsv(lastPlan.rows);
    downloadBlob("growbydate-gdd-results.csv", csv, "text/csv;charset=utf-8");
  }

  function downloadText() {
    if (!lastPlan) return;
    const text = buildTextPlan(lastPlan.meta, lastPlan.rows);
    downloadBlob("growbydate-gdd-results.txt", text, "text/plain;charset=utf-8");
  }

  function printResults() { window.print(); }

  runEl.addEventListener("click", run);
  if (locEl) locEl.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });

  if (resetEl) resetEl.addEventListener("click", () => resetForm({
    locEl,
    plantEl,
    overrideEl: null,
    cropListEl,
    resultsCardEl,
    resultsBodyEl,
    riskBoxEl,
    statusEl,
    footnoteEl,
    actionEls: [copyBtn, printBtn, csvBtn, txtBtn]
  }));

  if (copyBtn) copyBtn.addEventListener("click", copyResults);
  if (csvBtn) csvBtn.addEventListener("click", downloadCsv);
  if (txtBtn) txtBtn.addEventListener("click", downloadText);
  if (printBtn) printBtn.addEventListener("click", printResults);
}


// Ensure DOM is ready even if this module is loaded in <head>
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
