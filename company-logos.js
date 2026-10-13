const companyLogos = {
  nvidia: { file: "assets/logos/nvidia.svg", fallback: "N" },
  tsmc: { fallback: "TS" },
  qualcomm: { file: "assets/logos/qualcomm.svg", fallback: "Q" },
  apple: { file: "assets/logos/apple.svg", fallback: "A" },
  samsung: { file: "assets/logos/samsung.svg", fallback: "S" },
  amd: { file: "assets/logos/amd.svg", fallback: "AMD" },
  intel: { file: "assets/logos/intel.svg", fallback: "i" },
  broadcom: { file: "assets/logos/broadcom.svg", fallback: "B" },
  openai: { fallback: "OA" },
  anthropic: { file: "assets/logos/anthropic.svg", fallback: "A" },
  google: { file: "assets/logos/google.svg", fallback: "G" },
  amazon: { fallback: "a" },
  xai: { fallback: "xAI" },
  crewai: { file: "assets/logos/crewai.svg", fallback: "C" },
  langchain: { file: "assets/logos/langchain.svg", fallback: "L" },
  huggingface: { file: "assets/logos/huggingface.svg", fallback: "HF" },
  tbd: { fallback: "?" },
};

const tickerLogos = {
  NVDA: "nvidia",
  TSM: "tsmc",
  QCOM: "qualcomm",
  AAPL: "apple",
  "005930.KS": "samsung",
  AMD: "amd",
  INTC: "intel",
  AVGO: "broadcom",
  GOOGL: "google",
  AMZN: "amazon",
};

function createCompanyLogo(key, className = "company-logo") {
  const definition = companyLogos[key];
  if (!definition) return null;

  const logo = document.createElement("span");
  logo.className = className;
  logo.setAttribute("aria-hidden", "true");
  if (definition.file) {
    const image = document.createElement("img");
    image.src = definition.file;
    image.alt = "";
    image.decoding = "async";
    image.addEventListener("error", () => {
      const fallback = document.createElement("span");
      fallback.className = "company-logo-fallback";
      fallback.textContent = definition.fallback;
      logo.replaceChildren(fallback);
    }, { once: true });
    logo.append(image);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "company-logo-fallback";
    fallback.textContent = definition.fallback;
    logo.append(fallback);
  }
  return logo;
}

for (const name of document.querySelectorAll("[data-company-logo]")) {
  const logo = createCompanyLogo(name.dataset.companyLogo);
  if (logo) name.prepend(logo);
}

window.createCompanyLogo = createCompanyLogo;
window.tickerLogos = tickerLogos;
