/* Navegación, impresión y recursos compartidos de los dos reportes. */
(() => {
  "use strict";

  const groups = Array.from(document.querySelectorAll("[data-report-menu]"));
  const hoverOpened = new Set();
  const closeTimers = new Map();

  function cancelClose(group) {
    if (!closeTimers.has(group)) return;
    clearTimeout(closeTimers.get(group));
    closeTimers.delete(group);
  }

  function closeMenu(group, returnFocus = false) {
    cancelClose(group);
    hoverOpened.delete(group);
    const button = group.querySelector(".nav-toggle");
    const menu = group.querySelector(".nav-dropdown");
    const wasOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    group.classList.remove("is-open");
    if (returnFocus && wasOpen) button.focus();
  }

  function openMenu(group, focusFirst = false, fromHover = false) {
    cancelClose(group);
    groups.filter(other => other !== group).forEach(other => closeMenu(other));
    group.querySelector(".nav-toggle").setAttribute("aria-expanded", "true");
    group.querySelector(".nav-dropdown").hidden = false;
    group.classList.add("is-open");
    if (fromHover) hoverOpened.add(group);
    else hoverOpened.delete(group);
    if (focusFirst) group.querySelector(".nav-dropdown a")?.focus();
  }

  groups.forEach(group => {
    const button = group.querySelector(".nav-toggle");
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-expanded") === "true" && !hoverOpened.has(group)) closeMenu(group);
      else openMenu(group);
    });
    group.addEventListener("pointerenter", event => {
      if (event.pointerType !== "mouse") return;
      cancelClose(group);
      if (button.getAttribute("aria-expanded") === "false") openMenu(group, false, true);
    });
    group.addEventListener("pointerleave", event => {
      if (event.pointerType !== "mouse") return;
      cancelClose(group);
      closeTimers.set(group, setTimeout(() => {
        closeTimers.delete(group);
        if (!group.contains(document.activeElement)) closeMenu(group);
      }, 160));
    });
    button.addEventListener("keydown", event => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        openMenu(group, true);
      }
    });
    group.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(group, true);
      }
    });
    group.addEventListener("focusout", () => {
      queueMicrotask(() => {
        if (!group.contains(document.activeElement)) closeMenu(group);
      });
    });
    group.querySelectorAll(".nav-dropdown a").forEach(link => {
      link.addEventListener("click", () => closeMenu(group));
    });
  });

  document.addEventListener("click", event => {
    groups.filter(group => !group.contains(event.target)).forEach(group => closeMenu(group));
  });

  const localLinks = Array.from(document.querySelectorAll(".report-menu.is-active .nav-dropdown a"));
  const sections = localLinks.map(link => ({ link, section: document.getElementById(new URL(link.href).hash.slice(1)) })).filter(item => item.section);
  function setCurrentSection(id) {
    sections.forEach(({ link, section }) => {
      const active = section.id === id;
      link.classList.toggle("is-current", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  setCurrentSection(location.hash.slice(1) || sections[0]?.section.id);
  if ("IntersectionObserver" in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      const current = Array.from(visible).sort((a, b) => Math.abs(a.getBoundingClientRect().top - window.innerHeight * .25) - Math.abs(b.getBoundingClientRect().top - window.innerHeight * .25))[0];
      if (current) setCurrentSection(current.id);
    }, { rootMargin: "-15% 0px -60% 0px", threshold: 0 });
    sections.forEach(({ section }) => observer.observe(section));
  }

  let printDetails = null;
  document.getElementById("print-report")?.addEventListener("click", () => window.print());
  window.addEventListener("beforeprint", () => {
    groups.forEach(group => closeMenu(group));
    if (printDetails) return;
    printDetails = Array.from(document.querySelectorAll("details"), detail => ({ detail, open: detail.open }));
    printDetails.forEach(({ detail }) => { detail.open = true; });
  });
  window.addEventListener("afterprint", () => {
    if (!printDetails) return;
    printDetails.forEach(({ detail, open }) => { detail.open = open; });
    printDetails = null;
  });

  document.querySelectorAll("[data-optional-asset]").forEach(img => {
    const hideMissing = () => img.classList.add("asset-missing");
    img.addEventListener("error", hideMissing);
    if (img.complete && img.naturalWidth === 0) hideMissing();
  });

  const progress = document.getElementById("reading-progress");
  let scrollFrame = null;
  function updateProgress() {
    if (!progress) return;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (distance > 0 ? Math.max(0, Math.min(100, window.scrollY / distance * 100)) : 0) + "%";
  }
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      updateProgress();
      scrollFrame = null;
    });
  }, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();
  document.documentElement.classList.add("has-navigation");
})();
