/* Redes sociales · 24 de abril al 9 de octubre de 2026.
 * Totales abreviados de la PPT. No representa un desglose exclusivamente orgánico.
 */
(() => {
  "use strict";

  const SOCIAL_DATA = {
    views: { title: "Visualizaciones por red", instagram: 1400000, facebook: 503400, instagramLabel: "1,4 M", facebookLabel: "503,4 mil", totalLabel: "Suma aproximada de visualizaciones", total: "≈ 1,9 M" },
    interactions: { title: "Interacciones con el contenido", instagram: 2000, facebook: 404, instagramLabel: "2 mil", facebookLabel: "404", totalLabel: "Suma aproximada de interacciones", total: "≈ 2,4 mil" },
    clicks: { title: "Clics en el enlace por red", instagram: 10900, facebook: 2900, instagramLabel: "10,9 mil", facebookLabel: "2,9 mil", totalLabel: "Suma aproximada de clics en el enlace", total: "≈ 13,8 mil" },
    visits: { title: "Visitas registradas por red", instagram: 11400, facebook: 2200, instagramLabel: "11,4 mil", facebookLabel: "2,2 mil", totalLabel: "Suma aproximada de visitas", total: "≈ 13,6 mil" },
    followers: { title: "Seguidores registrados por red", instagram: 724, facebook: 79, instagramLabel: "724", facebookLabel: "79", totalLabel: "Suma de registros de seguidores", total: "803" }
  };
  const byId = id => document.getElementById(id);
  const tabs = Array.from(document.querySelectorAll("[data-social-metric]"));
  let selectedMetric = "views";
  let printMetric = null;

  function selectMetric(metric) {
    const data = SOCIAL_DATA[metric];
    if (!data) return;
    selectedMetric = metric;
    tabs.forEach(tab => {
      const active = tab.dataset.socialMetric === metric;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    byId("social-chart-title").textContent = data.title;
    byId("social-chart-panel").setAttribute("aria-labelledby", "metric-" + metric);
    byId("social-instagram-value").textContent = data.instagramLabel;
    byId("social-facebook-value").textContent = data.facebookLabel;
    const reference = Math.max(data.instagram, data.facebook);
    byId("social-instagram-bar").style.width = data.instagram / reference * 100 + "%";
    byId("social-facebook-bar").style.width = data.facebook / reference * 100 + "%";
    byId("social-total-label").textContent = data.totalLabel;
    byId("social-total-value").textContent = data.total;
    byId("social-comparison").setAttribute("aria-label", data.title + ". Instagram: " + data.instagramLabel + ". Facebook: " + data.facebookLabel + ".");
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectMetric(tab.dataset.socialMetric));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      selectMetric(tabs[next].dataset.socialMetric);
      tabs[next].focus();
    });
  });

  window.addEventListener("beforeprint", () => {
    if (printMetric !== null) return;
    printMetric = selectedMetric;
    selectMetric("views");
  });
  window.addEventListener("afterprint", () => {
    if (printMetric === null) return;
    const metric = printMetric;
    printMetric = null;
    selectMetric(metric);
  });

  selectMetric(selectedMetric);
  document.documentElement.classList.remove("no-js");
})();
