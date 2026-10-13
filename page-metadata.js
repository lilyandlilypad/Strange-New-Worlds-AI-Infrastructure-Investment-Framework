const lastModified = document.getElementById("last-modified");
const seasonalLily = document.getElementById("seasonal-lily");
const modifiedDate = new Date(document.lastModified);
const timeZone = "America/New_York";

if (Number.isNaN(modifiedDate.getTime())) {
  lastModified.textContent = "Unavailable";
} else {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(modifiedDate);
  const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  const month = Number(parts.month);
  const season = month >= 3 && month <= 5
    ? "spring"
    : month >= 6 && month <= 8
      ? "summer"
      : month >= 9 && month <= 11
        ? "fall"
        : "winter";
  seasonalLily.src = `assets/lily_4seasons/${season}.png`;
  seasonalLily.alt = "";
  seasonalLily.title = `${season[0].toUpperCase()}${season.slice(1)} lily logo`;
  seasonalLily.hidden = false;
  seasonalLily.addEventListener("error", () => {
    seasonalLily.hidden = true;
  }, { once: true });

  lastModified.dateTime = modifiedDate.toISOString();
  lastModified.textContent = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(modifiedDate);
}
