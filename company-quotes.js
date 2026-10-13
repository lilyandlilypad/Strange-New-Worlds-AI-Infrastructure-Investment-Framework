const marketQuoteSymbols = {
  nvidia: "NASDAQ:NVDA",
  tsmc: "NYSE:TSM",
  qualcomm: "NASDAQ:QCOM",
  apple: "NASDAQ:AAPL",
  samsung: "KRX:005930",
  amd: "NASDAQ:AMD",
  intel: "NASDAQ:INTC",
  broadcom: "NASDAQ:AVGO",
  google: "NASDAQ:GOOGL",
  amazon: "NASDAQ:AMZN",
};

for (const name of document.querySelectorAll("[data-company-logo]")) {
  const symbol = marketQuoteSymbols[name.dataset.companyLogo];
  if (!symbol) continue;

  const quote = document.createElement("span");
  quote.className = "company-market-quote";
  quote.setAttribute("role", "group");
  quote.setAttribute("aria-label", `TradingView quote for ${symbol}`);

  const widget = document.createElement("div");
  widget.className = "tradingview-widget-container";

  const content = document.createElement("div");
  content.className = "tradingview-widget-container__widget";
  widget.append(content);

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
  script.async = true;
  script.textContent = JSON.stringify({
    symbol,
    width: 150,
    colorTheme: "dark",
    isTransparent: true,
    locale: "en",
  });
  widget.append(script);
  quote.append(widget);
  name.append(quote);
}
