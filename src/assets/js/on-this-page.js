(function () {
  const main = document.querySelector("main.siteMain");
  const content = document.querySelector("#page-content");
  const aside = document.querySelector(".onThisPage");
  const details = document.querySelector(".onThisPageDetails");
  const nav = document.querySelector(".onThisPageNav");

  if (!main || !content || !aside || !details || !nav) return;

  const pageUrl = main.getAttribute("data-page-url") || window.location.pathname;
  const isGuide = main.classList.contains("guideMain") || document.body.classList.contains("guidePage");
  const isCityPage = document.body.classList.contains("cityPage");
  const isCropCityPage = document.body.classList.contains("cropCityPage");

  const isUsefulPage = isGuide ||
    isCityPage ||
    isCropCityPage ||
    pageUrl.startsWith("/data/") ||
    pageUrl.startsWith("/guides/") ||
    pageUrl.startsWith("/crops/") ||
    pageUrl.startsWith("/planting-dates/canada/provinces/") ||
    pageUrl.startsWith("/planting-dates/states/");

  if (!isUsefulPage) return;

  if (window.matchMedia("(max-width: 860px)").matches) {
    return;
  }

  function isIgnoredTarget(target) {
    return Boolean(
      target.closest(
        ".onThisPage, .relatedGuides, .footer, nav, header, [hidden], [aria-hidden='true'], [data-toc-ignore], [data-role='resultsCard']"
      )
    );
  }

  function cleanLabel(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function getIndexItemLabel(item) {
    return cleanLabel(
      item.getAttribute("data-on-this-page-label") ||
      (item.querySelector("[data-on-this-page-label]") || {}).textContent ||
      (item.querySelector(".index-link strong") || {}).textContent ||
      (item.querySelector("a strong") || {}).textContent ||
      (item.querySelector("a") || {}).textContent ||
      item.textContent
    );
  }

  const headingTargets = Array.from(content.querySelectorAll("h2")).filter((heading) => {
    if (!cleanLabel(heading.textContent)) return false;

    if (isIgnoredTarget(heading)) return false;

    return true;
  }).map((heading) => ({
    target: heading,
    label: cleanLabel(heading.textContent),
    className: `onThisPageItem--${heading.tagName.toLowerCase()}`
  }));

  const indexTargets = Array.from(content.querySelectorAll("[data-on-this-page-list]")).flatMap((list) => {
    if (isIgnoredTarget(list)) return [];

    return Array.from(list.children).filter((item) => {
      const label = getIndexItemLabel(item);

      if (!label) return false;

      if (item.hasAttribute("hidden")) return false;
      if (isIgnoredTarget(item)) return false;

      return true;
    }).map((item) => ({
      target: item,
      label: getIndexItemLabel(item),
      className: "onThisPageItem--index"
    }));
  });

  const items = headingTargets.length >= 3 ? headingTargets : indexTargets;

  if (items.length < 3) return;

  const usedIds = new Set(Array.from(document.querySelectorAll("[id]")).map((el) => el.id));

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 70) || "section";
  }

  function ensureId(target, label) {
    if (target.id) return target.id;

    const base = slugify(label || target.textContent);
    let id = base;
    let index = 2;

    while (usedIds.has(id)) {
      id = `${base}-${index}`;
      index += 1;
    }

    target.id = id;
    usedIds.add(id);
    return id;
  }

  const list = document.createElement("ol");
  list.className = "onThisPageList";

  items.forEach((navItem) => {
    const id = ensureId(navItem.target, navItem.label);
    const item = document.createElement("li");
    item.className = `onThisPageItem ${navItem.className}`;

    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = navItem.label;

    item.appendChild(link);
    list.appendChild(item);
  });

  nav.appendChild(list);
  aside.hidden = false;
  main.classList.add("hasOnThisPage");
  details.setAttribute("open", "");

  const links = Array.from(nav.querySelectorAll("a[href^='#']"));
  const linksById = new Map(
    links.map((link) => [decodeURIComponent(link.getAttribute("href").slice(1)), link])
  );

  function setActiveLink(id) {
    links.forEach((link) => link.classList.remove("is-active"));

    const activeLink = linksById.get(id);
    if (!activeLink) return;

    activeLink.classList.add("is-active");

    const activeItem = activeLink.closest(".onThisPageItem");
    if (activeItem && activeItem.scrollIntoView) {
      activeItem.scrollIntoView({
        block: "nearest",
        inline: "nearest"
      });
    }
  }

  if (items[0] && items[0].target.id) {
    setActiveLink(items[0].target.id);
  }

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visibleEntries.length) {
        setActiveLink(visibleEntries[0].target.id);
      }
    },
    {
      rootMargin: "-130px 0px -65% 0px",
      threshold: 0
    }
  );

  items.forEach((navItem) => observer.observe(navItem.target));
})();
