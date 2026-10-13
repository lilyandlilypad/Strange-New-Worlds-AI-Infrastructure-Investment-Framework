const svgNamespace = "http://www.w3.org/2000/svg";
const seriesColors = ["#64b5f6", "#ffb74d", "#ce93d8", "#80cbc4"];
const averageColor = "#8be9d1";

function svgElement(tag, attributes = {}, text = "") {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  if (text) element.textContent = text;
  return element;
}

function calculateTierSeries(symbols, securities, allDates) {
  const cursors = Object.fromEntries(symbols.map((symbol) => [symbol, 0]));
  const latestPrices = Object.fromEntries(symbols.map((symbol) => [symbol, null]));
  const companyReturns = Object.fromEntries(symbols.map((symbol) => [symbol, []]));
  const averageReturns = [];

  for (const date of allDates) {
    const currentReturns = [];
    for (const symbol of symbols) {
      const points = securities[symbol].points;
      while (cursors[symbol] < points.length && points[cursors[symbol]].date <= date) {
        latestPrices[symbol] = points[cursors[symbol]].adjustedClose;
        cursors[symbol] += 1;
      }
      const basePrice = points[0].adjustedClose;
      const latestPrice = latestPrices[symbol];
      if (latestPrice !== null && Number.isFinite(basePrice) && basePrice > 0) {
        const change = ((latestPrice / basePrice) - 1) * 100;
        companyReturns[symbol].push({ date, change });
        currentReturns.push(change);
      }
    }
    if (currentReturns.length) {
      averageReturns.push({
        date,
        change: currentReturns.reduce((sum, value) => sum + value, 0) / currentReturns.length,
      });
    }
  }

  return { companyReturns, averageReturns };
}

function formatPercent(value, decimals) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

function buildChart(card, history) {
  const symbols = card.dataset.symbols.split(",");
  for (const symbol of symbols) {
    const security = history.securities[symbol];
    if (!security || !Array.isArray(security.points) || security.points.length === 0) {
      throw new Error(`No price history found for ${symbol}.`);
    }
    if (security.points[0].date !== history.dayOne) {
      throw new Error(`${symbol} is missing its ${history.dayOne} Day 1 closing price.`);
    }
  }

  const allDates = [...new Set(
    symbols.flatMap((symbol) => history.securities[symbol].points.map((point) => point.date)),
  )].sort();
  const { companyReturns, averageReturns } = calculateTierSeries(
    symbols,
    history.securities,
    allDates,
  );
  const series = symbols.map((symbol, index) => ({
    name: symbol,
    color: seriesColors[index % seriesColors.length],
    values: companyReturns[symbol],
  }));
  series.push({ name: "Equal-weight public average", color: averageColor, values: averageReturns });

  const chartWidth = 900;
  const chartHeight = 360;
  const plot = { left: 76, right: 22, top: 22, bottom: 48 };
  const plotWidth = chartWidth - plot.left - plot.right;
  const plotHeight = chartHeight - plot.top - plot.bottom;
  const values = series.flatMap((item) => item.values.map((point) => point.change));
  let minimum = Math.min(0, ...values);
  let maximum = Math.max(0, ...values);
  const spread = maximum - minimum;
  const padding = spread === 0 ? 2 : spread * 0.12;
  minimum -= padding;
  maximum += padding;

  const dates = allDates.map((date) => Date.parse(`${date}T00:00:00Z`));
  const firstDate = dates[0];
  const finalDate = dates[dates.length - 1];
  const xForDate = (date) => {
    if (finalDate === firstDate) return plot.left + plotWidth / 2;
    return plot.left + ((Date.parse(`${date}T00:00:00Z`) - firstDate) / (finalDate - firstDate)) * plotWidth;
  };
  const yForValue = (value) => plot.top + ((maximum - value) / (maximum - minimum)) * plotHeight;

  const svg = svgElement("svg", {
    class: "tier-chart",
    viewBox: `0 0 ${chartWidth} ${chartHeight}`,
    role: "img",
    "aria-label": `${card.dataset.name} public-company percentage return since ${history.dayOne}`,
  });
  svg.append(svgElement("title", {}, `${card.dataset.name}: adjusted-close return from Day 1`));

  const tickCount = 4;
  for (let index = 0; index <= tickCount; index += 1) {
    const value = maximum - ((maximum - minimum) * index) / tickCount;
    const y = yForValue(value);
    svg.append(svgElement("line", {
      x1: plot.left,
      y1: y,
      x2: chartWidth - plot.right,
      y2: y,
      class: "chart-gridline",
    }));
    svg.append(svgElement("text", {
      x: plot.left - 9,
      y: y + 4,
      "text-anchor": "end",
      class: "chart-axis-label",
    }, formatPercent(value, spread < 10 ? 1 : 0)));
  }
  svg.append(svgElement("line", {
    x1: plot.left,
    y1: yForValue(0),
    x2: chartWidth - plot.right,
    y2: yForValue(0),
    class: "chart-baseline",
  }));

  const labelCount = Math.min(5, allDates.length);
  const dateIndices = [...new Set(Array.from(
    { length: labelCount },
    (_, index) => Math.round((index * (allDates.length - 1)) / Math.max(1, labelCount - 1)),
  ))];
  for (const index of dateIndices) {
    const date = allDates[index];
    const label = new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
    svg.append(svgElement("text", {
      x: xForDate(date),
      y: chartHeight - 15,
      "text-anchor": index === 0 ? "start" : index === allDates.length - 1 ? "end" : "middle",
      class: "chart-axis-label",
    }, label));
  }

  for (const item of series) {
    if (item.values.length === 0) continue;
    const pathData = item.values.map((point, index) => (
      `${index === 0 ? "M" : "L"} ${xForDate(point.date).toFixed(2)} ${yForValue(point.change).toFixed(2)}`
    )).join(" ");
    const path = svgElement("path", {
      d: pathData,
      stroke: item.color,
      class: item.name === "Equal-weight public average"
        ? "chart-line chart-line-average"
        : "chart-line",
    });
    path.append(svgElement("title", {}, `${item.name}: ${formatPercent(item.values.at(-1).change, 2)}`));
    svg.append(path);
    const lastPoint = item.values.at(-1);
    svg.append(svgElement("circle", {
      cx: xForDate(lastPoint.date),
      cy: yForValue(lastPoint.change),
      r: item.name === "Equal-weight public average" ? 4 : 2.5,
      fill: item.color,
    }));
  }

  const content = card.querySelector(".chart-content");
  content.replaceChildren(svg);

  const legend = document.createElement("div");
  legend.className = "chart-legend";
  legend.setAttribute("aria-label", "Chart legend");
  for (const item of series) {
    const entry = document.createElement("span");
    entry.className = "chart-legend-item";
    const swatch = document.createElement("span");
    swatch.className = "chart-legend-swatch";
    swatch.style.setProperty("--series-color", item.color);
    swatch.setAttribute("aria-hidden", "true");
    const logoKey = window.tickerLogos[item.name];
    const logo = logoKey ? window.createCompanyLogo(logoKey, "company-logo chart-company-logo") : null;
    entry.append(swatch);
    if (logo) entry.append(logo);
    entry.append(document.createTextNode(item.name));
    legend.append(entry);
  }
  content.append(legend);

  const updatedAt = new Date(history.updatedAt);
  const latestDate = allDates.at(-1);
  const statusText = allDates.length === 1
    ? `Day 1 baseline recorded (${history.dayOne}); no later trading-day prices are in the dataset yet.`
    : `Prices through ${latestDate} · ${allDates.length} trading dates · Data refreshed ${updatedAt.toLocaleString()}.`;
  const status = document.createElement("p");
  status.className = "chart-status";
  status.setAttribute("role", "status");
  status.textContent = statusText;
  content.append(status);
}

async function loadTierCharts() {
  const cards = [...document.querySelectorAll("[data-tier-chart]")];
  try {
    const response = await fetch("price-history.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load price-history.json (HTTP ${response.status}).`);
    }
    const history = await response.json();
    if (history.dayOne !== "2026-10-12" || !history.securities) {
      throw new Error("Price history is missing the October 12, 2026 Day 1 baseline.");
    }
    for (const card of cards) {
      try {
        buildChart(card, history);
      } catch (error) {
        const status = card.querySelector(".chart-status");
        status.textContent = `Chart unavailable: ${error.message}`;
        console.error(error);
      }
    }
  } catch (error) {
    for (const card of cards) {
      const status = card.querySelector(".chart-status");
      status.textContent = `Chart unavailable: ${error.message}`;
    }
    console.error(error);
  }
}

loadTierCharts();
