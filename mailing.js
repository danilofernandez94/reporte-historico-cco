/* Mailing · octubre 2026.
 * Los datos del gráfico se leen de mailing.html y conservan las tasas de la PPT.
 * Los clics sectoriales de referencia no se utilizan como resultados reales.
 */
(() => {
  "use strict";

  const rows = Array.from(document.querySelectorAll("[data-mailing-row]"));
  const tabs = Array.from(document.querySelectorAll("[data-mailing-metric]"));
  const byId = id => document.getElementById(id);
  const metrics = {
    opens: { title: "Tasa de apertura por email", key: "openRate", decimals: 2 },
    delivery: { title: "Tasa de entrega por email", key: "deliveryRate", decimals: 1 }
  };
  let selectedMetric = "opens";
  let printMetric = null;

  function selectMetric(metric, announce = true) {
    const config = metrics[metric];
    if (!config || !rows.length) return;
    selectedMetric = metric;
    tabs.forEach(tab => {
      const active = tab.dataset.mailingMetric === metric;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    byId("mailing-chart-title").textContent = config.title;
    byId("mailing-chart-panel").setAttribute("aria-labelledby", "mailing-tab-" + metric);
    const format = new Intl.NumberFormat("es-AR", { minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals });
    const reference = Math.max(...rows.map(row => Number(row.dataset[config.key])));
    const labels = [];
    rows.forEach(row => {
      const value = Number(row.dataset[config.key]);
      const label = format.format(value) + "%";
      row.querySelector(".mailing-bar-value").textContent = label;
      row.querySelector(".mailing-bar-track span").style.width = (reference > 0 ? value / reference * 100 : 0) + "%";
      row.querySelector(".mailing-bar-detail").textContent = metric === "opens"
        ? "≈ " + row.dataset.opens + " aperturas únicas"
        : row.dataset.delivered + " de 392 contactos";
      labels.push(row.dataset.name + ": " + label);
    });
    if (announce) byId("mailing-metric-status").textContent = config.title + ". " + labels.join(". ") + ".";
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectMetric(tab.dataset.mailingMetric));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      selectMetric(tabs[next].dataset.mailingMetric);
      tabs[next].focus();
    });
  });

  window.addEventListener("beforeprint", () => {
    if (printMetric !== null) return;
    printMetric = selectedMetric;
    selectMetric("opens", false);
  });
  window.addEventListener("afterprint", () => {
    if (printMetric === null) return;
    const metric = printMetric;
    printMetric = null;
    selectMetric(metric, false);
  });

  selectMetric(selectedMetric, false);
  document.documentElement.classList.remove("no-js");
})();
