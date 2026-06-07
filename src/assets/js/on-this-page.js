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
    pageUrl.startsWith("/crops/") ||
    pageUrl.startsWith("/planting-dates/canada/provinces/") ||
    pageUrl.startsWith("/planting-dates/states/");

  if (!isUsefulPage) return;

  if (window.matchMedia("(max-width: 860px)").matches) {
  return;
}

const selector = "h2";

  const headings = Array.from(content.querySelectorAll(selector)).filter((heading) => {
    if (!heading.textContent.trim()) return false;

    if (
      heading.closest(
        ".onThisPage, .relatedGuides, .footer, nav, header, [hidden], [aria-hidden='true'], [data-toc-ignore], [data-role='resultsCard']"
      )
    ) {
      return false;
    }

    return true;
  });

  if (headings.length < 3) return;

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

  function ensureId(heading) {
    if (heading.id) return heading.id;

    const base = slugify(heading.textContent);
    let id = base;
    let index = 2;

    while (usedIds.has(id)) {
      id = `${base}-${index}`;
      index += 1;
    }

    heading.id = id;
    usedIds.add(id);
    return id;
  }

  const list = document.createElement("ol");
  list.className = "onThisPageList";

  headings.forEach((heading) => {
    const id = ensureId(heading);
    const item = document.createElement("li");
    item.className = `onThisPageItem onThisPageItem--${heading.tagName.toLowerCase()}`;

    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = heading.textContent.trim();

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

  if (headings[0] && headings[0].id) {
    setActiveLink(headings[0].id);
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

  headings.forEach((heading) => observer.observe(heading));
})();