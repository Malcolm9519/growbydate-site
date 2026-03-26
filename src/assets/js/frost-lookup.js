/* src/assets/js/frost-lookup.js
   Static-first frost lookup for GrowByDate. No backend. No external APIs. */

let _cachePromise = null;
let _cacheData = null;

function _fetchDataset() {
  if (_cacheData) return Promise.resolve(_cacheData);
  if (_cachePromise) return _cachePromise;

  _cachePromise = fetch("/assets/data/frost-dates.json", { cache: "force-cache" })
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

  // If letters are present, treat as postal code (FSA).
  const hasLetters = /[a-z]/i.test(s);
  if (hasLetters) {
    const up = s.toUpperCase().replace(/\s+/g, "");
    return up.slice(0, 3);
  }

  // Otherwise digits-only (ZIP)
  return s.replace(/\D+/g, "").slice(0, 5);
}

export async function lookupFrost(rawInput) {
  const key = normalizeFrostKey(rawInput);
  if (!key) return null;

  const data = await _fetchDataset();

  // Candidate keys:
  // - Exact match (ZIP5 or FSA)
  // - ZIP3 fallback (store rows with 3-digit ZIP keys for broader coverage)
  const candidates = [key];
  if (/^\d{5}$/.test(key)) candidates.push(key.slice(0, 3));

  const hit = candidates
    .map((k) => data.find((row) => String(row.key).toUpperCase() === String(k).toUpperCase()))
    .find(Boolean);

  if (!hit) return null;

  return {
    lastFrost: hit.lastFrost,
    firstFrost: hit.firstFrost,
    name: hit.name,
    region: hit.region,
    country: hit.country,
    sourceLabel: hit.sourceLabel
  };
}


// Converts "MM-DD" -> "YYYY-MM-DD" using current year (for <input type="date">).
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

export function buildPlannerLink(path, paramName, mmdd) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set(paramName, mmdd);
  return url.pathname + url.search;
}

export function formatMmddLong(mmdd) {
  const s = String(mmdd || "").trim();
  const m = s.slice(0, 2);
  const d = s.slice(3, 5);
  if (!/^\d{2}$/.test(m) || !/^\d{2}$/.test(d)) return s;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const mi = parseInt(m, 10) - 1;
  const di = parseInt(d, 10);
  if (mi < 0 || mi > 11 || di < 1 || di > 31) return s;
  return `${months[mi]} ${di}`;
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

      <div class="frostResultCard__dates">
        <div class="frostResultCard__row">
          <div class="frostResultCard__label">Average last spring frost</div>
          <div class="frostResultCard__value">${formatMmddLong(frost.lastFrost)}</div>
        </div>

        <div class="frostResultCard__row">
          <div class="frostResultCard__label">Average first fall frost</div>
          <div class="frostResultCard__value">${formatMmddLong(frost.firstFrost)}</div>
        </div>
      </div>

      <div class="frostResultCard__threshold">32°F / 0°C threshold</div>
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


