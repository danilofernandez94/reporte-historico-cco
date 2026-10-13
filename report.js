/* Café Conquistadores · reporte histórico abril–septiembre de 2026.
 * Sin dependencias externas. Los gráficos se dibujan con SVG.
 */
(() => {
  "use strict";

  const REPORT_DATA = {
    actual: [
      { month: "Abril", short: "Abr", google: 240186.90, meta: 181730.30 },
      { month: "Mayo", short: "May", google: 735784.90, meta: 523208.57 },
      { month: "Junio", short: "Jun", google: 723848.13, meta: 514249.58 },
      { month: "Julio", short: "Jul", google: 914173.39, meta: 1039403.82 },
      { month: "Agosto", short: "Ago", google: 782737.21, meta: 1644479.63 },
      { month: "Septiembre", short: "Sep", google: 534057.17, meta: 1095628.47 }
    ],
    planned: [
      { month: "Octubre", short: "Oct", google: 920531, meta: 1394097 },
      { month: "Noviembre", short: "Nov", google: 579710, meta: 1017035 },
      { month: "Diciembre", short: "Dic", google: 579710, meta: 1017035 }
    ],
    contacts: [
      { month: "Abril", short: "Abr", count: 15 },
      { month: "Mayo", short: "May", count: 74 },
      { month: "Junio", short: "Jun", count: 79 },
      { month: "Julio", short: "Jul", count: 70 },
      { month: "Agosto", short: "Ago", count: 85 },
      { month: "Septiembre", short: "Sep", count: 69 }
    ]
  };
  const SVG_NS = "http://www.w3.org/2000/svg";
  const whole = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const percent = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const money = value => "$" + whole.format(value);
  const millions = value => "$" + decimal.format(value / 1000000) + " M";
  const totals = rows => rows.reduce((sum, row) => ({ google: sum.google + row.google, meta: sum.meta + row.meta }), { google: 0, meta: 0 });
  const byId = id => document.getElementById(id);
  let budgetView = "actual";
  let selectedMonth = null;
  let resizeFrame = null;
  let printState = null;

  function svgElement(tag, attrs, content) {
    const node = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, String(value)));
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function appendText(parent, x, y, content, className, anchor) {
    const node = svgElement("text", { x, y, class: className, "text-anchor": anchor || "start" }, content);
    parent.append(node);
    return node;
  }

  function describeChart(svg, id, title, description) {
    const titleNode = svgElement("title", { id: id + "-title" }, title);
    const descriptionNode = svgElement("desc", { id: id + "-description" }, description);
    svg.prepend(titleNode, descriptionNode);
    svg.setAttribute("aria-labelledby", titleNode.id);
    svg.setAttribute("aria-describedby", descriptionNode.id);
  }

  function readoutSpan(label, amount, className) {
    const span = document.createElement("span");
    if (className) span.className = className;
    span.append(label + " ");
    const strong = document.createElement("b");
    strong.textContent = money(amount);
    span.append(strong);
    return span;
  }

  function updateReadout() {
    const rows = REPORT_DATA[budgetView];
    const row = selectedMonth === null ? null : rows[selectedMonth];
    const sum = row || totals(rows);
    const period = row ? row.month + " 2026" : (budgetView === "actual" ? "Abril–septiembre" : "Octubre–diciembre");
    const box = byId("budget-readout");
    const label = document.createElement("span");
    label.className = "readout-period";
    label.textContent = period;
    box.replaceChildren(label, readoutSpan("Google", sum.google), readoutSpan("Meta", sum.meta), readoutSpan("Total", sum.google + sum.meta, "readout-total"));
    byId("investment-chart").querySelectorAll(".chart-bar").forEach((bar, i) => {
      const selected = i === selectedMonth;
      bar.classList.toggle("is-selected", selected);
      bar.setAttribute("aria-pressed", String(selected));
    });
  }

  function drawInvestmentChart() {
    const container = byId("investment-chart");
    const rows = REPORT_DATA[budgetView];
    const width = Math.max(Math.round(container.clientWidth), 275);
    const height = 280;
    const left = width < 400 ? 33 : 39;
    const right = 13;
    const top = 34;
    const bottom = 38;
    const plotHeight = height - top - bottom;
    const plotWidth = width - left - right;
    const slot = plotWidth / rows.length;
    const barWidth = Math.min(52, slot * (width < 400 ? 0.53 : 0.52));
    const maxValue = Math.ceil(Math.max(...rows.map(row => row.google + row.meta)) / 1000000) * 1000000;
    const svg = svgElement("svg", { viewBox: "0 0 " + width + " " + height, role: "group" });
    describeChart(svg, "investment", budgetView === "actual" ? "Inversión realizada por mes y plataforma" : "Inversión programada por mes y plataforma", "Barras apiladas. Google en negro y Meta en rojo. Seleccioná una barra con clic, Enter o espacio para consultar los importes.");
    const defs = svgElement("defs");
    svg.append(defs);
    for (let value = 0; value <= maxValue; value += 1000000) {
      const y = height - bottom - (value / maxValue) * plotHeight;
      svg.append(svgElement("line", { x1: left, x2: width - right, y1: y, y2: y, class: "chart-grid-line" }));
      appendText(svg, left - 9, y + 3, value === 0 ? "0" : whole.format(value / 1000000) + " M", "chart-axis-label", "end");
    }
    rows.forEach((row, index) => {
      const center = left + slot * (index + 0.5);
      const total = row.google + row.meta;
      const googleHeight = row.google / maxValue * plotHeight;
      const metaHeight = row.meta / maxValue * plotHeight;
      const totalHeight = googleHeight + metaHeight;
      const y = height - bottom - totalHeight;
      const clipId = "budget-bar-" + budgetView + "-" + index;
      const clipPath = svgElement("clipPath", { id: clipId });
      clipPath.append(svgElement("rect", { x: center - barWidth / 2, y, width: barWidth, height: totalHeight, rx: 5 }));
      defs.append(clipPath);
      const group = svgElement("g", {
        class: "chart-bar",
        role: "button",
        tabindex: 0,
        "aria-pressed": selectedMonth === index,
        "aria-label": row.month + ": Google " + money(row.google) + ", Meta " + money(row.meta) + ", total " + money(total)
      });
      group.append(svgElement("title", null, row.month + " · " + money(total)));
      group.append(svgElement("rect", { x: center - slot * 0.43, y: 5, width: slot * 0.86, height: height - 9, rx: 7, class: "bar-selection" }));
      const bars = svgElement("g", { "clip-path": "url(#" + clipId + ")" });
      bars.append(svgElement("rect", { x: center - barWidth / 2, y: height - bottom - googleHeight, width: barWidth, height: googleHeight + 0.2, fill: "#171715" }));
      bars.append(svgElement("rect", { x: center - barWidth / 2, y, width: barWidth, height: metaHeight + 0.2, fill: "#dc292f" }));
      if (budgetView === "planned") {
        bars.setAttribute("opacity", "0.77");
        group.append(svgElement("rect", { x: center - barWidth / 2 - 3, y: y - 3, width: barWidth + 6, height: totalHeight + 6, rx: 6, fill: "none", stroke: "#b9afa1", "stroke-width": 1, "stroke-dasharray": "3 3" }));
      }
      group.append(bars);
      appendText(group, center, y - 11, decimal.format(total / 1000000), "chart-value-label", "middle");
      appendText(group, center, height - 13, width < 500 ? row.short : row.month, "chart-month-label", "middle");
      group.addEventListener("click", () => {
        selectedMonth = selectedMonth === index ? null : index;
        updateReadout();
      });
      group.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectedMonth = selectedMonth === index ? null : index;
          updateReadout();
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const barsList = container.querySelectorAll(".chart-bar");
          const next = (index + (event.key === "ArrowRight" ? 1 : -1) + rows.length) % rows.length;
          barsList[next].focus();
        } else if (event.key === "Escape") {
          selectedMonth = null;
          updateReadout();
        }
      });
      svg.append(group);
    });
    container.replaceChildren(svg);
    updateReadout();
  }

  function drawInvestmentDonut() {
    const sum = totals(REPORT_DATA[budgetView]);
    const total = sum.google + sum.meta;
    const radius = 88;
    const circumference = 2 * Math.PI * radius;
    const googleLength = sum.google / total * circumference;
    const metaLength = sum.meta / total * circumference;
    const svg = svgElement("svg", { viewBox: "0 0 220 220", role: "img" });
    describeChart(svg, "distribution", "Distribución de la inversión por plataforma", "Google Ads: " + money(sum.google) + ", " + percent.format(sum.google / total * 100) + "%; Meta Ads: " + money(sum.meta) + ", " + percent.format(sum.meta / total * 100) + "%.");
    svg.append(svgElement("circle", { cx: 110, cy: 110, r: radius, fill: "none", stroke: "#e5dfd5", "stroke-width": 17 }));
    const ring = svgElement("g", { transform: "rotate(-90 110 110)" });
    ring.append(svgElement("circle", { cx: 110, cy: 110, r: radius, fill: "none", stroke: "#171715", "stroke-width": 17, "stroke-dasharray": googleLength + " " + (circumference - googleLength) }));
    ring.append(svgElement("circle", { cx: 110, cy: 110, r: radius, fill: "none", stroke: "#dc292f", "stroke-width": 17, "stroke-dasharray": metaLength + " " + (circumference - metaLength), "stroke-dashoffset": -googleLength }));
    svg.append(ring);
    const wrap = byId("investment-donut");
    wrap.querySelector("svg")?.remove();
    wrap.prepend(svg);
    byId("donut-total").textContent = millions(total);
    byId("donut-label").textContent = budgetView === "actual" ? "Invertidos" : "Programados";
    byId("distribution-title").textContent = budgetView === "actual" ? "Inversión realizada" : "Inversión programada";
    const legend = byId("investment-donut-legend");
    const entries = [["Meta Ads", sum.meta, "meta-dot"], ["Google Ads", sum.google, "google-dot"]].map(([name, amount, dotClass]) => {
      const row = document.createElement("div");
      const nameSpan = document.createElement("span");
      const dot = document.createElement("i");
      dot.className = "dot " + dotClass;
      dot.setAttribute("aria-hidden", "true");
      nameSpan.append(dot, name);
      const value = document.createElement("strong");
      value.textContent = percent.format(amount / total * 100) + "%";
      const detail = document.createElement("small");
      detail.textContent = money(amount);
      value.append(detail);
      row.append(nameSpan, value);
      return row;
    });
    legend.replaceChildren(...entries);
  }

  function drawContactsChart() {
    const container = byId("contacts-chart");
    const rows = REPORT_DATA.contacts;
    const width = Math.max(Math.round(container.clientWidth), 270);
    const height = 252;
    const left = width < 400 ? 27 : 32;
    const right = 12;
    const bottom = 31;
    const top = 23;
    const plotHeight = height - top - bottom;
    const slot = (width - left - right) / rows.length;
    const barWidth = Math.min(58, slot * 0.59);
    const svg = svgElement("svg", { viewBox: "0 0 " + width + " " + height, role: "img" });
    describeChart(svg, "contacts", "Registros de contacto por mes", "Abril 15, mayo 74, junio 79, julio 70, agosto 85 y septiembre 69. Total 392 registros utilizables, antes de consolidar reiteraciones.");
    for (let value = 0; value <= 100; value += 25) {
      const y = height - bottom - value / 100 * plotHeight;
      svg.append(svgElement("line", { x1: left, x2: width - right, y1: y, y2: y, class: "chart-grid-line" }));
      appendText(svg, left - 8, y + 3, String(value), "chart-axis-label", "end");
    }
    rows.forEach((row, index) => {
      const center = left + slot * (index + 0.5);
      const barHeight = row.count / 100 * plotHeight;
      const y = height - bottom - barHeight;
      const rect = svgElement("rect", { x: center - barWidth / 2, y, width: barWidth, height: barHeight, rx: 5, fill: index === 4 ? "#dc292f" : "#bba792" });
      rect.append(svgElement("title", null, row.month + ": " + row.count + " registros"));
      svg.append(rect);
      appendText(svg, center, y - 11, String(row.count), "chart-value-label", "middle");
      appendText(svg, center, height - 10, width < 500 ? row.short : row.month, "chart-month-label", "middle");
    });
    container.replaceChildren(svg);
  }

  function setBudgetView(view) {
    if (!REPORT_DATA[view]) return;
    budgetView = view;
    selectedMonth = null;
    document.querySelectorAll("[data-budget-view]").forEach(button => {
      const active = button.dataset.budgetView === view;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    byId("budget-chart-panel").setAttribute("aria-labelledby", "tab-" + view);
    byId("investment-chart-title").textContent = view === "actual" ? "Ejecución mensual" : "Programación mensual";
    byId("investment-chart-subtitle").textContent = view === "actual" ? "Inversión registrada en las plataformas." : "Plan compartido para octubre–diciembre.";
    drawInvestmentChart();
    drawInvestmentDonut();
  }

  function preparePrint() {
    if (printState) return;
    printState = { view: budgetView, month: selectedMonth };
    setBudgetView("actual");
    drawContactsChart();
  }

  function restoreAfterPrint() {
    if (!printState) return;
    const state = printState;
    printState = null;
    setBudgetView(state.view);
    selectedMonth = state.month;
    updateReadout();
    drawContactsChart();
  }

  function resizeCharts() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      drawInvestmentChart();
      drawContactsChart();
      resizeFrame = null;
    });
  }

  document.querySelectorAll("[data-budget-view]").forEach(button => {
    button.addEventListener("click", () => setBudgetView(button.dataset.budgetView));
    button.addEventListener("keydown", event => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const target = event.key === "Home" ? "actual" : event.key === "End" ? "planned" : budgetView === "actual" ? "planned" : "actual";
        setBudgetView(target);
        byId("tab-" + target).focus();
      }
    });
  });
  window.addEventListener("beforeprint", preparePrint);
  window.addEventListener("afterprint", restoreAfterPrint);

  drawInvestmentChart();
  drawInvestmentDonut();
  drawContactsChart();
  document.documentElement.classList.remove("no-js");
  // Los contenedores recién visibles necesitan una medición con su ancho final.
  drawInvestmentChart();
  drawContactsChart();
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(resizeCharts);
    observer.observe(byId("investment-chart"));
    observer.observe(byId("contacts-chart"));
  } else {
    window.addEventListener("resize", resizeCharts);
  }
})();
