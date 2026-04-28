/* src/assets/js/gdd-planner.js
   Normals-based GDD maturity estimator (static-only, deterministic).

   Refactor (2026-02): embed-safe widget initialization.
   - Initializes any widget root: [data-tool="gdd-planner"]
   - Scopes all DOM queries to each widget root
   - Reads build-time crop data from JSON scripts inside each widget:
       <script type="application/json" data-site-crops>...</script>
       <script type="application/json" data-gdd-crops>...</script>
   - Supports optional embed config via data-* on the widget root:
       data-mode="default|late-season|single-crop"
       data-crop-default="tomatoes" (comma/pipe/space separated; can be siteId, site slug, or gdd slug)
       data-date-default="today|MM-DD|YYYY-MM-DD"
       data-hide-date="true|false"
       data-hide-crops="true|false"  (hide crop picker and lock to crop-default)
   - Supports URL param prefills (override widget defaults):
       ?loc=90210&crop=corn-sweet&plantDate=today
       crop supports comma-separated or repeated crop params
*/

import { formatMmddLong } from "./frost-lookup.js";
import { lookupPlannerClimate } from "./planner-climate-lookup.js";
import { loadStationSeries } from "./gdd-lookup.js";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

// Emoji map (mirrors frost/seed planners)
const CROP_ICONS = {
  tomato: "🍅",
  tomatoes: "🍅",
  pepper: "🫑",
  peppers: "🫑",
  cucumber: "🥒",
  cucumbers: "🥒",
  zucchini: "🥒",
  "winter-squash": "🎃",
  pumpkin: "🎃",
  "corn-sweet": "🌽",
  "sweet-corn": "🌽",
  "bean-bush": "🫘",
  bean: "🫘",
  beans: "🫘",
  pea: "🟢",
  peas: "🟢",
  carrot: "🥕",
  carrots: "🥕",
  beet: "🟣",
  beets: "🟣",
  potato: "🥔",
  potatoes: "🥔",
  onion: "🧅",
  onions: "🧅",
  garlic: "🧄",
  broccoli: "🥦",
  cauliflower: "🥦",
  cabbage: "🥬",
  lettuce: "🥬",
  spinach: "🍃",
  "swiss-chard": "🥬",
  chard: "🥬",
  kale: "🥬",
  radish: "🌱"
};

// Tool crop IDs don't always match site crop IDs (tomato → tomatoes, etc.)
const SITE_ID_TO_GDD_SLUG = {
  tomatoes: "tomato",
  peppers: "pepper",
  cucumbers: "cucumber",
  carrots: "carrot",
  beets: "beet",
  onions: "onion",
  peas: "pea",
  potatoes: "potato",
  beans: "bean-bush",
  "sweet-corn": "corn-sweet"
};

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cropIcon(slug) {
  return CROP_ICONS[slug] || "🌱";
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
  if (frostDoy < 0) {
    return { score: 1, label: "Unknown", note: "Not enough data to compare." };
  }
  if (maturityDoy < 0) {
    return { score: 2, label: "Unlikely to mature before typical frost", note: "In a typical year, the crop does not reach maturity before the season ends." };
  }
  if (maturityDoy < frostDoy - 14) {
    return { score: 0, label: "Likely to mature before typical frost", note: "In a typical year, maturity lands comfortably before first frost." };
  }
  if (maturityDoy < frostDoy) {
    return { score: 1, label: "At risk in cooler seasons", note: "Maturity is close to first frost. A cool year can push you past frost." };
  }
  return { score: 2, label: "Unlikely to mature before typical frost", note: "In a typical year, first frost arrives before maturity." };
}

function setStatus(el, msg) {
  if (!el) return;
  el.textContent = msg || "";
}

function show(el, yes) {
  if (!el) return;
  el.style.display = yes ? "" : "none";
}

function selectedCropIds(cropListEl) {
  if (!cropListEl) return [];
  return Array.from(cropListEl.querySelectorAll("input[type='checkbox']:checked"))
    .map((cb) => cb.value)
    .filter(Boolean);
}

function escapeCsv(v) {
  const s = String(v ?? "");
  if (/[\",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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

function buildTextPlan(meta, rows) {
  const lines = [];
  lines.push("GrowByDate — GDD maturity estimate (typical year)");
  lines.push(" ");
  if (meta.location) lines.push(`Location: ${meta.location}`);
  if (meta.stationId) lines.push(`GDD station: ${meta.stationId}`);
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

function normalizeBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return false;
  return s === "1" || s === "true" || s === "yes";
}

function todayYyyyMmDd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function coerceDateDefaultToInputValue(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "today") return todayYyyyMmDd();

  // MM-DD
  if (/^\d{2}-\d{2}$/.test(s)) {
    const yyyy = new Date().getFullYear();
    return `${yyyy}-${s}`;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  return "";
}

function parseCropList(v) {
  if (!v) return [];
  // allow crop=tomatoes,peppers OR crop=tomatoes|peppers
  return String(v)
    .split(/[\s,|]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function readJsonScriptWithin(root, selector) {
  try {
    const el = root.querySelector(selector);
    if (!el) return [];
    return JSON.parse(el.textContent || "[]");
  } catch (e) {
    return [];
  }
}

function gddSlugForSiteId(siteId) {
  return SITE_ID_TO_GDD_SLUG[siteId] || siteId;
}

function buildToolCropsFromEmbeddedData(siteCrops, gddCropsRaw) {
  const siteCropsById = Object.create(null);
  for (const c of (siteCrops || [])) {
    if (c && c.id) siteCropsById[c.id] = c;
  }

  const gddBySlug = Object.create(null);
  for (const g of (gddCropsRaw || [])) {
    if (g && g.slug) gddBySlug[g.slug] = g;
  }

  // Use the same system as other planners: site crops filtered by relatedTools.
  const eligible = (siteCrops || []).filter(c =>
    c && c.id && Array.isArray(c.relatedTools) && c.relatedTools.includes("gdd-planner")
  );

  // Join with GDD config (base_f, required, category). Skip if not found.
  const out = [];
  for (const c of eligible) {
    const gSlug = gddSlugForSiteId(c.id);
    const g = gddBySlug[gSlug];
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
  return { toolCrops: out, siteCropsById };
}

function cropUrlFromSiteId(siteCropsById, siteId, fallbackSlug) {
  const meta = siteCropsById?.[siteId];
  const slug = (meta && meta.slug) ? meta.slug : (fallbackSlug || siteId);
  return `/crops/${slug}/`;
}

function initCropList(instanceId, crops, listEl) {
  if (!listEl) return;

  listEl.innerHTML = "";

  for (const c of (crops || [])) {
    const siteId = c.siteId || c.id || "";
    if (!siteId) continue;

    const id = `${instanceId}-crop-${siteId}`;
    const row = document.createElement("div");
    row.className = "cropPickRow";
row.innerHTML = `
  <label class="cropPickLabel" for="${escapeHtml(id)}">
    <input id="${escapeHtml(id)}" type="checkbox" value="${escapeHtml(siteId)}" />
    <span class="cropPickName">
      <span>${escapeHtml(c.name || siteId)}</span>
    </span>
  </label>
`;
    listEl.appendChild(row);
  }
}

function applyPrefills({ root, instanceId, toolCrops, locEl, plantEl, cropListEl, cropHelpEl, plantingWrapEl, cropWrapEl }) {
  const params = new URLSearchParams(window.location.search || "");

  const urlLoc = params.get("loc") || params.get("zip") || params.get("postal") || "";
  const urlPlant = params.get("plantDate") || params.get("date") || "";
  const urlCrop = params.getAll("crop").flatMap(parseCropList).join(",");

  const cfg = root?.dataset || {};

  // Hide date (optional)
  const hideDate = normalizeBool(cfg.hideDate);
  if (plantingWrapEl && hideDate) plantingWrapEl.style.display = "none";

  // Hide crop picker (optional)
  const hideCrops = normalizeBool(cfg.hideCrops) || String(cfg.mode || "").toLowerCase() === "single-crop";
  if (cropWrapEl && hideCrops) cropWrapEl.style.display = "none";

  // Location: URL overrides default (we only support URL here)
  if (locEl && urlLoc && !locEl.value) locEl.value = urlLoc;

  // Planting date: URL overrides data-date-default overrides blank
  if (plantEl) {
    const fromUrl = coerceDateDefaultToInputValue(urlPlant);
    const fromCfg = coerceDateDefaultToInputValue(cfg.dateDefault);

    if (fromUrl) {
      plantEl.value = fromUrl;
    } else if (!plantEl.value && fromCfg) {
      plantEl.value = fromCfg;
    } else if (!plantEl.value) {
      plantEl.value = todayYyyyMmDd();
    }
  }

  // Crop default selection: URL overrides data-crop-default
  const cropsFromUrl = parseCropList(urlCrop);
  const cropsFromCfg = parseCropList(cfg.cropDefault);

  // If hideCrops, we *only* select defaults (URL if present, else cfg). If neither, do nothing.
  const toSelect = (cropsFromUrl.length ? cropsFromUrl : cropsFromCfg);

  if (toSelect.length && cropListEl) {
    const want = new Set(toSelect);

    // Select by siteId OR by gddSlug OR by site slug (be generous)
    for (const cb of Array.from(cropListEl.querySelectorAll("input[type='checkbox']"))) {
      const siteId = cb.value;
      const crop = toolCrops.find(c => c.siteId === siteId);
      const gddSlug = crop?.gddSlug;
      const siteSlug = crop?.slug;
      cb.checked = !!(
        want.has(siteId) ||
        (gddSlug && want.has(gddSlug)) ||
        (siteSlug && want.has(siteSlug))
      );
    }
  }

  // If hiding crops, enforce exactly one checked crop (first matched).
  if (hideCrops && cropListEl) {
    const checked = Array.from(cropListEl.querySelectorAll("input[type='checkbox']:checked"));
    if (checked.length > 1) {
      checked.slice(1).forEach(cb => (cb.checked = false));
    }
  }

  // Fix up aria-describedby deterministically per instance.
  if (cropHelpEl && cropListEl) {
    const helpId = `${instanceId}-cropHelp`;
    cropHelpEl.id = helpId;
    cropListEl.setAttribute("aria-describedby", helpId);
  }
}

function resetForm({ locEl, plantEl, cropListEl, resultsCardEl, resultsBodyEl, riskBoxEl, statusEl, footnoteEl, actionEls, defaultDateValue }) {
  if (locEl) locEl.value = "";
  if (plantEl) plantEl.value = defaultDateValue || todayYyyyMmDd();
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
}

let _instanceCounter = 0;

async function initWidget(root) {
  const q = (sel) => root.querySelector(sel);

  // Optional text hooks (for embeds)
  const widgetTitleEl = q('[data-role="widgetTitle"]');
  const widgetIntroEl = q('[data-role="widgetIntro"]');

  // If the embed provided custom copy (via gddWidget.widgetTitle / widgetLede),
// the template will set data-has-custom-title/lede on the root.
// In that case, DO NOT overwrite on init.
  const hasCustomTitle = root.dataset.hasCustomTitle === "true";
  const hasCustomLede  = root.dataset.hasCustomLede === "true";

  // --- Elements (data-role based)
  const locEl = q('[data-role="location"]');
  const cropHelpEl = q('[data-role="cropHelp"]');
  const cropListEl = q('[data-role="cropList"]');
  const cropWrapEl = q('[data-role="cropWrap"]') || (cropListEl ? cropListEl.parentElement : null);
  const plantEl = q('[data-role="planting"]');
  const plantingWrapEl = q('[data-role="plantingWrap"]');

const runEl = q('[data-role="run"]');
const resetEl = q('[data-role="reset"]');
const useLocationEl = q('[data-role="useLocation"]');
const statusEl = q('[data-role="status"]');
const locationStatusEl = q('[data-role="locationStatus"]');
const formWarnEl = q('[data-role="formWarn"]');

  const resultsCardEl = q('[data-role="resultsCard"]');
  const resultsBodyEl = q('[data-role="resultsBody"]');
  const riskBoxEl = q('[data-role="riskBox"]');
  const riskLabelEl = q('[data-role="riskLabel"]');
  const riskNoteEl = q('[data-role="riskNote"]');
  const footnoteEl = q('[data-role="footnote"]');

  const copyBtn = q('[data-role="copyBtn"]');
  const printBtn = q('[data-role="printBtn"]');
  const csvBtn = q('[data-role="csvBtn"]');
  const txtBtn = q('[data-role="txtBtn"]');

  if (!runEl || !cropListEl) return;

  const instanceId = root.dataset.instance || `gdd-${++_instanceCounter}`;
  root.dataset.instance = instanceId;

  // Embedded data (per-widget, deterministic at build time)
  const siteCrops = readJsonScriptWithin(root, "script[data-site-crops]");
  const gddCropsRaw = readJsonScriptWithin(root, "script[data-gdd-crops]");
  const { toolCrops, siteCropsById } = buildToolCropsFromEmbeddedData(siteCrops, gddCropsRaw);

  initCropList(instanceId, toolCrops, cropListEl);

  // Prefills (URL params override widget data-* defaults)
  applyPrefills({
    root,
    instanceId,
    toolCrops,
    locEl,
    plantEl,
    cropListEl,
    cropHelpEl,
    plantingWrapEl,
    cropWrapEl
  });

// Optional single-crop copy tweaks
{
  const cfg = root.dataset || {};
  const hideCrops =
    normalizeBool(cfg.hideCrops) || String(cfg.mode || "").toLowerCase() === "single-crop";

  if (hideCrops && (widgetTitleEl || widgetIntroEl)) {
    const chosen = selectedCropIds(cropListEl);
    const first = chosen[0] || parseCropList(cfg.cropDefault)[0] || "";
    const crop = toolCrops.find((c) => c.siteId === first || c.slug === first || c.gddSlug === first);
    const cropName = crop?.name || "this crop";

    if (widgetTitleEl && !hasCustomTitle) {
      widgetTitleEl.textContent = `Check ${cropName} Timing`;
    }

    if (widgetIntroEl && !hasCustomLede) {
      const cropNameLower = (cropName || "this crop").toLowerCase();
      widgetIntroEl.innerHTML =
        `Enter your ZIP / Postal and planting date to see whether ${cropNameLower} can typically mature before first fall frost.`;
    }
  }
}
  // Widget-scoped last plan for actions
  let lastPlan = null; // { meta, rows }

  async function validateLocationOnly() {
  const rawLoc = locEl ? locEl.value : "";

  // Clear old warning
  if (formWarnEl) {
    formWarnEl.textContent = "";
    show(formWarnEl, false);
  }

  setStatus(locationStatusEl || statusEl, "");

  if (!String(rawLoc || "").trim()) {
    if (formWarnEl) {
      formWarnEl.textContent = "Enter a 5-digit ZIP (U.S.) or the first 3 characters of your postal code (e.g., T5A).";
      show(formWarnEl, true);
    }
    if (locEl) locEl.focus();
    return;
  }

  setStatus(locationStatusEl || statusEl, "Checking location…");

  try {
    const frost = await lookupPlannerClimate(rawLoc);
    if (!frost) {
      setStatus(locationStatusEl || statusEl, "");
      if (formWarnEl) {
        formWarnEl.textContent = "No match found for that ZIP / postal code. Try a nearby ZIP (U.S.) or FSA (Canada).";
        show(formWarnEl, true);
      }
      return;
    }

    const stationId = frost.stationId || frost.gddStationId || "";
    const where = [frost.name, frost.region].filter(Boolean).join(", ");

    if (!stationId) {
      setStatus(locationStatusEl || statusEl, "");
      if (formWarnEl) {
        formWarnEl.textContent = "This location matched frost data, but GDD station coverage isn’t available yet. Try a nearby ZIP / postal code.";
        show(formWarnEl, true);
      }
      return;
    }

    show(formWarnEl, false);
    setStatus(locationStatusEl || statusEl, `Loaded ${where}. Continue below.`);

const cropAnchor = q('[data-scroll-anchor="cropStart"]') || q('[data-role="cropWrap"]');
if (cropAnchor) {
  setTimeout(() => {
    cropAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}
  } catch (err) {
    setStatus(locationStatusEl || statusEl, "");
    if (formWarnEl) {
      formWarnEl.textContent = "Something didn’t load correctly. Please try again.";
      show(formWarnEl, true);
    }
    console.error("GDD location validation error", err);
  }
}

  async function run() {
    setStatus(statusEl, "Working…");

    // Clear prior warning
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

  // Clear results UI completely
  if (resultsBodyEl) resultsBodyEl.innerHTML = "";
  if (footnoteEl) footnoteEl.textContent = "";
  if (riskLabelEl) riskLabelEl.textContent = "";
  if (riskNoteEl) riskNoteEl.textContent = "";
  show(riskBoxEl, false);
  show(resultsCardEl, false);

  // Show form warning instead
  if (formWarnEl) {
    formWarnEl.textContent = "Select at least one crop to estimate.";
    show(formWarnEl, true);
  }

  // Scroll to crops section
const cropAnchor = q('[data-scroll-anchor="cropStart"]') || q('[data-role="cropWrap"]');
if (cropAnchor) cropAnchor.scrollIntoView({ behavior: "smooth", block: "start" });

  return;
}

    const plantingDoy = dateValueToDoy(plantEl ? plantEl.value : "");
if (plantingDoy < 0) {
  setStatus(statusEl, "");

  if (resultsBodyEl) resultsBodyEl.innerHTML = "";
  if (footnoteEl) footnoteEl.textContent = "";
  if (riskLabelEl) riskLabelEl.textContent = "";
  if (riskNoteEl) riskNoteEl.textContent = "";
  show(riskBoxEl, false);
  show(resultsCardEl, false);

  if (formWarnEl) {
    formWarnEl.textContent = "Choose a valid planting date.";
    show(formWarnEl, true);
  }

  if (plantEl) plantEl.focus();
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
      const frost = await lookupPlannerClimate(rawLoc);
      if (!frost) {
        setStatus(statusEl, "");
        if (formWarnEl) {
          formWarnEl.textContent = "No match found for that ZIP / postal code. Try a nearby ZIP (U.S.) or FSA (Canada).";
          show(formWarnEl, true);
        }
        return;
      }

      const stationId = frost.stationId || frost.gddStationId || "";
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

const rowsHtml = [];
const planRows = [];

let worstRisk = { score: -1, label: "", note: "" };
const cropAssessments = [];
let anyLatePlant = false;

for (const siteId of chosen) {
  const crop = toolCrops.find((c) => (c.siteId || c.id) === siteId);
  if (!crop) continue;

  const baseKey = pickBaseKey(crop?.base_f);
  const cum = station.bases?.[baseKey];

  const required = Math.round(safeNum(crop?.gdd_required, 0));
  const maturityDoy = findMaturityDoy(cum, plantingDoy, required);
  const maturityLabel = maturityDoy >= 0 ? doyToLabel(maturityDoy) : "Usually not reached before season end";
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
  cropAssessments.push({ cropName, risk });
  const link = cropUrlFromSiteId(siteCropsById, crop.siteId || siteId, crop.slug || siteId);
    const exportSlug = crop.gddSlug || crop.siteId || crop.slug || siteId;

  rowsHtml.push(`
    <tr class="cropHeaderRow">
      <td>
        <span class="cropHeaderIcon" aria-hidden="true">${escapeHtml(icon)}</span>
        <a class="cropHeaderLink" href="${escapeHtml(link)}">${escapeHtml(cropName)}</a>
        <span class="small muted">· Base ${escapeHtml(baseKey)}°F</span>
      </td>
      <td class="cropHeaderMeta">
<span class="small muted">Outdoor sow / Transplant date</span>
        <strong>${escapeHtml(plantingLabel)}</strong>
      </td>
    </tr>
  `);

  const add = (key, valueHtml, valuePlain, notes = "") => {
    rowsHtml.push(`<tr><th scope="row">${escapeHtml(key)}</th><td>${valueHtml}</td></tr>`);
    planRows.push({ type: "row", key, valuePlain, notes });
  };

  planRows.push({ type: "cropHeader", slug: exportSlug, cropName });

  add("Estimated maturity date", `${escapeHtml(maturityLabel)}`, maturityLabel);
  if (daysToMaturity !== null) add("Days from planting", `${daysToMaturity}`, String(daysToMaturity));
  add("GDD target", `${required}`, String(required));
  add("Available GDD before typical first frost", `${avail}`, String(avail));
  if (maturityDoy < 0 || maturityDoy >= frostDoy) {
    add("Estimated shortfall by frost", `${deficit} GDD`, `${deficit} GDD`);
  }
  add("Average first fall frost", `${escapeHtml(frostLabel)}`, frostLabel);
  add("Latest typical planting date to mature before frost", `${escapeHtml(latestSafeLabel)}`, latestSafeLabel);
  add("Location", `${escapeHtml(where)}`, where);
  add("Assessment", `${escapeHtml(risk.label)}`, risk.label, risk.note);
}

      if (resultsBodyEl) resultsBodyEl.innerHTML = rowsHtml.join("");

      // Risk block: avoid a misleading worst-case summary when multiple crops have mixed outcomes
      const hasRisk = !!(worstRisk && worstRisk.label);
      if (hasRisk) {
        if (chosen.length > 1) {
          const uniqueLabels = Array.from(new Set(cropAssessments.map((entry) => entry.risk?.label).filter(Boolean)));
const perCropSummary = cropAssessments
  .map((entry) => `<div><strong>${entry.cropName}</strong>: ${((entry.risk && entry.risk.label) || "Unknown")}</div>`)
  .join("");

          if (uniqueLabels.length === 1) {
            if (riskLabelEl) riskLabelEl.textContent = `All selected crops: ${uniqueLabels[0]}`;
if (riskNoteEl) riskNoteEl.innerHTML = perCropSummary;
          } else {
            if (riskLabelEl) riskLabelEl.textContent = "See below for each crop assessment";
if (riskNoteEl) riskNoteEl.innerHTML = perCropSummary;
          }
        } else {
          if (riskLabelEl) riskLabelEl.textContent = worstRisk.label;
          if (riskNoteEl) riskNoteEl.textContent = (worstRisk.note || "").trim();
        }
        show(riskBoxEl, true);
      } else {
        if (riskLabelEl) riskLabelEl.textContent = "";
        if (riskNoteEl) riskNoteEl.textContent = "";
        show(riskBoxEl, false);
      }

if (footnoteEl) {
  const latePlantNote = anyLatePlant ? "You’re planting after the typical “latest safe” date for at least one selected crop. " : "";
  footnoteEl.innerHTML = `
    <span class="gddPlanningTipLine"><span class="pill">Planning tip</span> For short seasons, aim to mature <strong>before</strong> the risk window, not inside it.</span>
    ${latePlantNote ? `<span class="gddLatePlantNote">${latePlantNote}</span>` : ""}
  `;
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
        plantingLabel,
        firstFrostLabel: frostLabel
      };

      lastPlan = { meta, rows: planRows };

      // Scroll to results
setTimeout(() => {
  if (resultsCardEl) {
    const y = resultsCardEl.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}, 50);
    } catch (err) {
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
if (useLocationEl) useLocationEl.addEventListener("click", validateLocationOnly);
if (locEl) {
  locEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateLocationOnly();
    }
  });
}

  const defaultDateValue = plantEl?.value || todayYyyyMmDd();

if (resetEl) {
  resetEl.addEventListener("click", () => {
    resetForm({
      locEl,
      plantEl,
      cropListEl,
      resultsCardEl,
      resultsBodyEl,
      riskBoxEl,
      statusEl,
      footnoteEl,
      actionEls: [copyBtn, printBtn, csvBtn, txtBtn],
      defaultDateValue
    });

    if (locationStatusEl) locationStatusEl.textContent = "";
    if (formWarnEl) {
      formWarnEl.textContent = "";
      show(formWarnEl, false);
    }
  });
}

  if (copyBtn) copyBtn.addEventListener("click", copyResults);
  if (csvBtn) csvBtn.addEventListener("click", downloadCsv);
  if (txtBtn) txtBtn.addEventListener("click", downloadText);
  if (printBtn) printBtn.addEventListener("click", printResults);
}

function initAll() {
  const roots = Array.from(document.querySelectorAll('[data-tool="gdd-planner"]'));
  if (!roots.length) return;

  const g = window;
  g.__gbd_gddPlannerInitializedRoots = g.__gbd_gddPlannerInitializedRoots || new WeakSet();

  for (const root of roots) {
    if (g.__gbd_gddPlannerInitializedRoots.has(root)) continue;
    g.__gbd_gddPlannerInitializedRoots.add(root);
    initWidget(root);
  }
}

// ---- Bootstrapping / duplicate-script safety
(function boot() {
  const g = window;

  if (g.__gbd_gddPlannerBooted) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => g.__gbd_gddPlannerInitAll?.(), { once: true });
    } else {
      g.__gbd_gddPlannerInitAll?.();
    }
    return;
  }

  g.__gbd_gddPlannerBooted = true;
  g.__gbd_gddPlannerInitAll = initAll;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();