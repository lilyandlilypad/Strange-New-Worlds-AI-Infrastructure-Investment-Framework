const predictionSymbols = [
  { symbol: "NVDA", name: "NVIDIA", currency: "USD" },
  { symbol: "TSM", name: "TSMC", currency: "USD" },
  { symbol: "QCOM", name: "Qualcomm", currency: "USD" },
  { symbol: "AAPL", name: "Apple", currency: "USD" },
  { symbol: "005930.KS", name: "Samsung Electronics", currency: "KRW" },
  { symbol: "AMD", name: "AMD", currency: "USD" },
  { symbol: "INTC", name: "Intel", currency: "USD" },
  { symbol: "AVGO", name: "Broadcom", currency: "USD" },
  { symbol: "GOOGL", name: "Alphabet / Google", currency: "USD" },
  { symbol: "AMZN", name: "Amazon", currency: "USD" },
];
const config = window.PREDICTION_SUPABASE_CONFIG ?? {};
const form = document.querySelector("#prediction-form");
const roundSelect = document.querySelector("#prediction-round");
const symbolSelect = document.querySelector("#prediction-symbol");
const modeSelect = document.querySelector("#prediction-mode");
const priceInput = document.querySelector("#prediction-price");
const percentInput = document.querySelector("#prediction-percent");
const exactPriceField = document.querySelector("#prediction-exact-field");
const percentField = document.querySelector("#prediction-percent-field");
const pricePreview = document.querySelector("#prediction-price-preview");
const submitButton = document.querySelector("#prediction-submit");
const formStatus = document.querySelector("#prediction-status");
const quoteStatus = document.querySelector("#prediction-price-status");
const leaderboardBody = document.querySelector("#prediction-leaderboard-body");
const gameStatus = document.querySelector("#prediction-game-status");

let marketData;
let rounds = [];
let quotesLoaded = false;
let isConnected = false;

function currencyText(value, currency) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(value);
}

function predictionRounds(schedule) {
  const result = [];
  for (let year = schedule.firstYear; year <= schedule.lastYear; year += 1) {
    schedule.quarterlyTargetDates.forEach((monthDay, index) => {
      const quarter = index + 1;
      result.push({
        id: `quarterly-${year}-q${quarter}`,
        label: `${year} Q${quarter} · quarter-end close`,
        horizon: "Quarterly",
        targetDate: `${year}-${monthDay}`,
      });
    });
  }
  for (let year = schedule.firstYear; year <= schedule.annualLastYear; year += 1) {
    result.push({
      id: `annual-${year}`,
      label: `${year} annual · year-end close`,
      horizon: "Annual",
      targetDate: `${year}-12-31`,
    });
  }
  result.push({
    id: "five-year-2031",
    label: "Five-year mark · October 12, 2031",
    horizon: "Five-year",
    targetDate: schedule.fiveYearTargetDate,
  });
  return result.sort((left, right) => left.targetDate.localeCompare(right.targetDate)
    || left.horizon.localeCompare(right.horizon));
}

function renderQuotes() {
  const container = document.querySelector("#prediction-current-prices");
  container.replaceChildren();
  for (const item of predictionSymbols) {
    const record = marketData.prices[item.symbol];
    const entry = document.createElement("span");
    entry.className = "prediction-price-chip";
    const name = document.createElement("strong");
    name.textContent = item.symbol;
    const price = document.createElement("span");
    price.textContent = currencyText(record.price, item.currency);
    entry.append(name, price);
    container.append(entry);
  }
  if (!marketData.updatedAt) {
    quoteStatus.textContent = "Weekly quote snapshot not entered yet; prices will show after the JSON file is updated.";
  } else {
    quoteStatus.textContent = `Manual weekly prices · updated ${marketData.updatedAt}.`;
  }
}

function renderOptions() {
  for (const item of predictionSymbols) {
    const option = document.createElement("option");
    option.value = item.symbol;
    option.textContent = `${item.name} (${item.symbol})`;
    symbolSelect.append(option);
  }
  rounds = predictionRounds(marketData.roundSchedule);
  const today = new Date().toISOString().slice(0, 10);
  const defaultRound = rounds.find((round) => round.targetDate > today);
  for (const round of rounds) {
    const option = document.createElement("option");
    option.value = round.id;
    option.textContent = `${round.label} · target ${round.targetDate}`;
    option.disabled = round.targetDate <= today;
    roundSelect.append(option);
  }
  if (defaultRound) roundSelect.value = defaultRound.id;
  updateFormState();
}

function selectedRound() {
  return rounds.find((round) => round.id === roundSelect.value);
}

function predictionPrice() {
  if (modeSelect.value === "exact") {
    const price = Number(priceInput.value);
    return Number.isFinite(price) && price > 0 && price < 1_000_000_000 ? price : null;
  }
  const referencePrice = marketData.prices[symbolSelect.value]?.price;
  const percent = Number(percentInput.value);
  if (!Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(percent)) {
    return null;
  }
  const price = referencePrice * (1 + percent / 100);
  return Number.isFinite(price) && price > 0 && price < 1_000_000_000 ? price : null;
}

function updatePredictionMode() {
  const isPercent = modeSelect.value === "percent";
  exactPriceField.hidden = isPercent;
  priceInput.disabled = isPercent;
  percentField.hidden = !isPercent;
  percentInput.disabled = !isPercent;
  percentInput.required = isPercent;
  priceInput.required = !isPercent;
  if (isPercent) {
    const item = predictionSymbols.find(({ symbol }) => symbol === symbolSelect.value);
    const referencePrice = marketData.prices[symbolSelect.value]?.price;
    if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
      pricePreview.textContent = "Percentage mode needs this stock’s weekly reference price; it has not been entered yet.";
    } else if (percentInput.value && predictionPrice() !== null) {
      pricePreview.textContent = `${percentInput.value}% of ${currencyText(referencePrice, item.currency)} = ${currencyText(predictionPrice(), item.currency)} predicted close.`;
    } else {
      pricePreview.textContent = `Reference: ${currencyText(referencePrice, item.currency)}. Enter a positive or negative percentage move.`;
    }
  } else {
    pricePreview.textContent = "Enter your predicted closing price in the stock’s trading currency.";
  }
}

function updateFormState() {
  if (!quotesLoaded) return;
  updatePredictionMode();
  const round = selectedRound();
  const isOpen = round && round.targetDate > new Date().toISOString().slice(0, 10);
  const hasPredictionPrice = predictionPrice() !== null;
  submitButton.disabled = !isConnected || !isOpen || !hasPredictionPrice;
  if (!isOpen) {
    formStatus.textContent = "Predictions close at the start of the target date. Choose an upcoming round.";
  } else if (!isConnected) {
    formStatus.textContent = "Shared leaderboard is not configured yet. Add the Supabase project URL and publishable key to prediction-config.js.";
  } else if (modeSelect.value === "percent" && !hasPredictionPrice) {
    formStatus.textContent = "Enter a percentage move and make sure this stock has a valid weekly reference price.";
  } else {
    formStatus.textContent = "Your entry will be public and cannot be edited. Use an avatar name, not your real name.";
  }
}

function predictionAccuracy(prediction, actual) {
  if (!Number.isFinite(actual) || actual <= 0) return null;
  return Math.max(0, (1 - Math.abs(prediction - actual) / actual) * 100);
}

function renderLeaderboard(rows, round) {
  leaderboardBody.replaceChildren();
  const actuals = marketData.actuals[round.id] ?? {};
  const scoredRows = rows.map((row) => {
    const actualRecord = actuals[row.symbol];
    const closeDate = actualRecord?.closeDate;
    const hasValidCloseDate = typeof closeDate === "string"
      && /^\d{4}-\d{2}-\d{2}$/.test(closeDate)
      && closeDate <= round.targetDate;
    const actual = hasValidCloseDate && typeof actualRecord.price === "number"
      ? actualRecord.price
      : Number.NaN;
    return {
      ...row,
      actual,
      closeDate: hasValidCloseDate ? closeDate : null,
      accuracy: predictionAccuracy(Number(row.predicted_price), actual),
    };
  }).sort((left, right) => {
    if (left.accuracy !== null && right.accuracy !== null) return right.accuracy - left.accuracy;
    if (left.accuracy !== null) return -1;
    if (right.accuracy !== null) return 1;
    return new Date(left.created_at) - new Date(right.created_at);
  });

  if (!scoredRows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No predictions yet for this round. Be the first!";
    row.append(cell);
    leaderboardBody.append(row);
    return;
  }

  scoredRows.forEach((prediction, index) => {
    const currency = marketData.prices[prediction.symbol].currency;
    const row = document.createElement("tr");
    const values = [
      `${index + 1}. ${prediction.avatar_name}`,
      prediction.symbol,
      currencyText(Number(prediction.predicted_price), currency),
      prediction.accuracy === null
        ? "Pending"
        : `${prediction.accuracy.toFixed(1)}%${prediction.closeDate ? ` · ${prediction.closeDate}` : ""}`,
      currencyText(prediction.actual, currency),
    ];
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    leaderboardBody.append(row);
  });
}

function supabaseEndpoint(path) {
  return `${config.url.replace(/\/$/, "")}/rest/v1/${path}`;
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: config.publishableKey,
    Authorization: `Bearer ${config.publishableKey}`,
    ...extra,
  };
}

async function loadLeaderboard() {
  const round = selectedRound();
  if (!round) return;
  gameStatus.textContent = "Loading shared leaderboard…";
  try {
    const query = new URLSearchParams({
      select: "avatar_name,symbol,predicted_price,created_at",
      round_id: `eq.${round.id}`,
      order: "created_at.asc",
      limit: "200",
    });
    const response = await fetch(supabaseEndpoint(`predictions?${query}`), {
      headers: supabaseHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Could not load leaderboard (HTTP ${response.status}): ${await response.text()}`);
    }
    renderLeaderboard(await response.json(), round);
    gameStatus.textContent = `Leaderboard · ${round.label} · target ${round.targetDate}`;
  } catch (error) {
    gameStatus.textContent = error.message;
  }
}

async function submitPrediction(event) {
  event.preventDefault();
  const round = selectedRound();
  const predictedPrice = predictionPrice();
  if (!round || round.targetDate <= new Date().toISOString().slice(0, 10)
    || !isConnected || predictedPrice === null) {
    updateFormState();
    return;
  }
  const body = {
    avatar_name: form.elements.avatar.value.trim(),
    round_id: round.id,
    symbol: symbolSelect.value,
    predicted_price: predictedPrice,
  };
  const submittedRound = round.id;
  submitButton.disabled = true;
  formStatus.textContent = "Submitting prediction…";
  try {
    const response = await fetch(supabaseEndpoint("predictions"), {
      method: "POST",
      headers: supabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      }),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Could not submit prediction (HTTP ${response.status}): ${await response.text()}`);
    }
    form.reset();
    roundSelect.value = submittedRound;
    symbolSelect.selectedIndex = 0;
    priceInput.value = "";
    percentInput.value = "";
    modeSelect.value = "exact";
    updatePredictionMode();
    formStatus.textContent = "Prediction submitted. Good luck!";
    await loadLeaderboard();
  } catch (error) {
    formStatus.textContent = error.message;
  } finally {
    const roundIsOpen = round && round.targetDate > new Date().toISOString().slice(0, 10);
    submitButton.disabled = !isConnected || !roundIsOpen;
  }
}

async function initializePredictionGame() {
  try {
    const response = await fetch("prediction-market-data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load prediction-market-data.json (HTTP ${response.status}).`);
    }
    marketData = await response.json();
    quotesLoaded = true;
    renderQuotes();
    renderOptions();
    if (config.url && config.publishableKey) {
      const parsedUrl = new URL(config.url);
      if (parsedUrl.protocol !== "https:") {
        throw new Error("Supabase URL must use HTTPS.");
      }
      isConnected = true;
      updateFormState();
      await loadLeaderboard();
    } else {
      gameStatus.textContent = "Shared leaderboard setup is pending Supabase project configuration.";
    }
    roundSelect.addEventListener("change", () => {
      updateFormState();
      if (isConnected) loadLeaderboard();
    });
    symbolSelect.addEventListener("change", updateFormState);
    modeSelect.addEventListener("change", updateFormState);
    priceInput.addEventListener("input", updateFormState);
    percentInput.addEventListener("input", updateFormState);
    form.addEventListener("submit", submitPrediction);
  } catch (error) {
    gameStatus.textContent = error.message;
    formStatus.textContent = "Prediction game could not initialize.";
  }
}

initializePredictionGame();
