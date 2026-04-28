/* src/assets/js/frost-lookup.js
   Static-first frost lookup for GrowByDate. No backend. No external APIs. */

let _cachePromise = null;
let _cacheData = null;

function _fetchDataset() {
  if (_cacheData) return Promise.resolve(_cacheData);
  if (_cachePromise) return _cachePromise;

  _cachePromise = fetch("/assets/data/frost-dates.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load frost dataset");
      return r.json();
    })
    .then((data) => {
      _cacheData = Array.isArray(data) ? data : [];
      return _cacheData;
    })
    .catch(() => {
      _cacheData = [];
      return _cacheData;
    });

  return _cachePromise;
}

export function normalizeFrostKey(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";

  const hasLetters = /[a-z]/i.test(s);
  if (hasLetters) {
    const up = s.toUpperCase().replace(/\s+/g, "");
    return up.slice(0, 3);
  }

  return s.replace(/\D+/g, "").slice(0, 5);
}

export async function lookupFrost(rawInput) {
  const key = normalizeFrostKey(rawInput);
  if (!key) return null;

  const data = await _fetchDataset();

  const candidates = [key];
  if (/^\d{5}$/.test(key)) candidates.push(key.slice(0, 3));

  const hit = candidates
    .map((k) => data.find((row) => String(row.key).toUpperCase() === String(k).toUpperCase()))
    .find(Boolean);

  if (!hit) return null;

  return {
    key,
    lastFrost: hit.lastFrost,
    firstFrost: hit.firstFrost,
    name: hit.name,
    region: hit.region,
    country: hit.country,
    sourceLabel: hit.sourceLabel
  };
}

export function mmddToDateValue(mmdd, year = new Date().getFullYear()) {
  const m = String(mmdd || "").slice(0, 2);
  const d = String(mmdd || "").slice(3, 5);
  if (!/^\d{2}$/.test(m) || !/^\d{2}$/.test(d)) return "";
  return `${year}-${m}-${d}`;
}

export function populateDateInput(dateInputEl, mmdd) {
  if (!dateInputEl) return false;
  const v = mmddToDateValue(mmdd);
  if (!v) return false;
  dateInputEl.value = v;
  dateInputEl.dispatchEvent(new Event("input", { bubbles: true }));
  dateInputEl.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

export function buildPlannerLink(path, paramName, value) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set(paramName, value);
  return url.pathname + url.search;
}

export function formatMmddLong(mmdd) {
  const s = String(mmdd || "").trim();
  const m = s.slice(0, 2);
  const d = s.slice(3, 5);
  if (!/^\d{2}$/.test(m) || !/^\d{2}$/.test(d)) return s;

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const mi = parseInt(m, 10) - 1;
  const di = parseInt(d, 10);

  if (mi < 0 || mi > 11 || di < 1 || di > 31) return s;
  return `${months[mi]} ${di}`;
}

function mmddToDoy(mmdd) {
  const s = String(mmdd || "").trim();
  const m = parseInt(s.slice(0, 2), 10);
  const d = parseInt(s.slice(3, 5), 10);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return -1;

  const dt = new Date(Date.UTC(2025, m - 1, d));
  if (Number.isNaN(dt.getTime())) return -1;

  const start = new Date(Date.UTC(2025, 0, 1));
  return Math.floor((dt - start) / 86400000) + 1;
}

export function frostFreeDays(lastFrost, firstFrost) {
  const lastDoy = mmddToDoy(lastFrost);
  const firstDoy = mmddToDoy(firstFrost);
  if (lastDoy < 1 || firstDoy < 1 || firstDoy <= lastDoy) return null;
  return firstDoy - lastDoy;
}

function buildGddPlannerLink(frost) {
  const key = normalizeFrostKey(frost?.key || "");
  if (!key) return "/tools/growing-degree-day-planner/";
  return buildPlannerLink("/tools/growing-degree-day-planner/", "loc", key);
}

function buildInterpretation(frostFreeWindow) {
  if (!Number.isFinite(frostFreeWindow)) {
    return "Use these frost dates as your planning boundaries, then check crop maturity against your season length before planting.";
  }

  if (frostFreeWindow < 75) {
    return "This is a very short season. Margin is limited here, so timing, protection, and crop selection all matter a lot.";
  }

  if (frostFreeWindow < 100) {
    return "This is a short season. You still have options, but it helps to stay disciplined on timing and avoid crops that need a long finish window.";
  }

  if (frostFreeWindow < 120) {
    return "This is a workable season for a lot of gardens, but timing still matters. Frost dates set the boundaries, and maturity speed still matters inside them.";
  }

  if (frostFreeWindow < 150) {
    return "This season gives you more flexibility on the calendar, but maturity still depends on temperature. Use frost dates for timing and GDD for crop fit.";
  }

  return "This is a relatively long season by calendar length. That gives you more room to work with, but heat accumulation still matters for slower crops.";
}

export function renderResultCard(targetEl, frost) {
  if (!targetEl) return;

  if (!frost) {
    targetEl.innerHTML = `
      <div class="frostResultCard" role="status">
        <div class="frostResultCard__location">No match found</div>
        <div class="small muted">
          Enter a valid 5-digit ZIP (U.S.) or the first 3 characters of your postal code (for example, T5A).
        </div>
      </div>
    `;
    return;
  }

  const where = [frost.name, frost.region].filter(Boolean).join(", ");

  targetEl.innerHTML = `
    <div class="frostResultCard" role="status">
      <div class="frostResultCard__location">${where}</div>
      <div class="small muted" style="margin-top:6px;">
        Frost dates found. Full planning results are shown below.
      </div>
    </div>
  `;
}

export function renderExpandedFrostResults(targetEl, frost) {
  if (!targetEl || !frost) return;

  const where = [frost.name, frost.region].filter(Boolean).join(", ");
  const seasonDays = frostFreeDays(frost.lastFrost, frost.firstFrost);
  const gddLink = buildPlannerLink("/tools/growing-degree-day-planner/", "loc", frost.key);
  const interpretation = buildInterpretation(seasonDays);

  const country = String(frost.country || "").toUpperCase();
  const isCanada = country === "CA";

  const regionalBrowseLink = isCanada
    ? "/planting-dates/canada/provinces/"
    : "/planting-dates/states/";

  const regionalBrowseLabel = isCanada
    ? "Browse province planting guides"
    : "Browse state planting guides";

  targetEl.innerHTML = `
    <div class="frostPlannerResult">
      <div class="frostPlannerResult__header">
        <p class="frostPlannerResult__eyebrow">Frost date result</p>
        <h2 class="frostPlannerResult__title">${where}</h2>
        <p class="frostPlannerResult__intro">
          These are typical frost boundary dates at the 32°F / 0°C threshold based on climate normals.
        </p>
      </div>

      <div class="frostPlannerResult__summary">
        <div class="frostPlannerMetric">
          <div class="frostPlannerMetric__label">Average last spring frost</div>
          <div class="frostPlannerMetric__value">${formatMmddLong(frost.lastFrost)}</div>
        </div>

        <div class="frostPlannerMetric">
          <div class="frostPlannerMetric__label">Average first fall frost</div>
          <div class="frostPlannerMetric__value">${formatMmddLong(frost.firstFrost)}</div>
        </div>

        <div class="frostPlannerMetric">
          <div class="frostPlannerMetric__label">Typical frost-free season</div>
          <div class="frostPlannerMetric__value">${seasonDays ? `${seasonDays} days` : "—"}</div>
        </div>
      </div>

      <div class="frostPlannerResult__note card" style="margin-top:16px;">
        <p style="margin:0;">
          <strong>How to use this:</strong> ${interpretation}
        </p>
      </div>

      <div class="frostPlannerActions frostPlannerActions--two">
        <a class="frostPlannerAction card" href="${gddLink}">
          <h3>Check crop maturity with GDD</h3>
          <p>Use your location to test whether your season also delivers enough heat for crop maturity.</p>
          <span class="button">Open GDD Planner</span>
        </a>

        <a class="frostPlannerAction card" href="${regionalBrowseLink}">
          <h3>${regionalBrowseLabel}</h3>
          <p>Move from frost dates into location-based planting guidance organized by region.</p>
          <span class="button">Browse planting guides</span>
        </a>
      </div>

<div class="frostGuideLinks" style="margin-top:16px;">
  <a class="frostGuideLink card" href="/guides/how-to-use-your-frost-dates-to-plan-your-garden/">
    <h4>How to use your frost dates to plan your garden</h4>
    <p>Turn frost dates into planting windows, seed-start timing, and better seasonal decisions.</p>
  </a>

  <a class="frostGuideLink card" href="/guides/when-to-start-seeds-indoors/">
    <h4>When to start seeds indoors</h4>
    <p>Use your last frost date to build a more realistic indoor seed-start schedule.</p>
  </a>

  <a class="frostGuideLink card" href="/guides/best-frost-cloth-for-vegetable-gardens-by-temperature-rating/">
    <h4>Best frost cloth for vegetable gardens by temperature rating</h4>
    <p>Protect crops when real weather pushes beyond the average frost window.</p>
  </a>
</div>
    </div>
  `;
}

export function applyQueryPrefill(paramName, dateInputEl, onAfterSet) {
  try {
    const u = new URL(window.location.href);
    const mmdd = u.searchParams.get(paramName);
    if (!mmdd) return false;

    const ok = populateDateInput(dateInputEl, mmdd);
    if (ok && typeof onAfterSet === "function") onAfterSet(mmdd);
    return ok;
  } catch {
    return false;
  }
}