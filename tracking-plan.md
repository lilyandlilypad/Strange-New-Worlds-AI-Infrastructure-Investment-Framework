# Tracking Plan and Conclusion

## Public Share-Price Charts

The tier charts on the [project homepage](./index.html#performance) use October 12, 2026 as
Day 1. Each listed company is rebased to its Yahoo Finance adjusted closing price on that date
(0% return). The charts show individual public-company returns and the equal-weight average of
the public companies in each tier.

Private companies and TBD positions are excluded because they have no public share-price history.
Samsung Electronics is plotted in Korean won; the chart compares percentage returns and does not
convert currencies. Prices are sourced from Yahoo Finance and may be corrected or delayed.

The homepage embeds a TradingView ticker tape and individual quotes beside public holding names.
Quote timing depends on the exchange and data entitlement and may be delayed. These third-party
feeds are separate from the historical charts; use the dated Yahoo Finance dataset for the chart
methodology and review records.

To refresh the dataset, run `python3 scripts/update_prices.py` after the relevant markets close,
then reload the homepage. The updater retrieves the full history from Day 1 and replaces
`price-history.json`; it does not make trades or run automatically.

## Visitor Prediction Game

The homepage places a visitor challenge beside the tracking timeline. Visitors choose an avatar,
a public stock, a quarterly/annual/five-year round, and either an exact predicted closing price
or a percentage move from that stock's manually updated weekly reference price. Percentage
predictions are converted to a target price at submission and require a valid weekly reference
price for the selected ticker. Quarterly
rounds target each calendar quarter-end from 2027 through 2031; annual rounds target December 31
from 2027 through 2030; the five-year round targets October 12, 2031. Since Q4 and annual rounds
share a close date, they are distinct leaderboard rounds. Entries close at the start of the target
date (UTC), before the market-close result is known.

Predictions are stored in a shared Supabase table and shown publicly. The leaderboard score is
`max(0, 100 × (1 - abs(prediction - actual) / actual))`; higher percentage accuracy ranks first.
Scoring stays pending until the round's actual closing prices are added to the JSON data. Actual
prices should be split-adjusted closing prices from the target date or the last trading session
before it, using each security's exchange calendar and currency.

### One-Time Supabase Setup

1. Create a Supabase project and run [`supabase/predictions.sql`](./supabase/predictions.sql)
   in its SQL Editor.
2. In [`prediction-config.js`](./prediction-config.js), set `url` to the project URL and
   `publishableKey` to that project's public publishable/anon key. These client values are
   intended for the public page; never put a service-role or secret key in the repository.
3. Publish the configuration and site. The game will show an explicit setup status until the
   project URL and key are supplied.

The SQL script seeds the same dated rounds offered by the page and enforces the cutoff in the
database, so a direct API request cannot submit to a round on or after its target date.

The table is publicly readable and accepts anonymous inserts; it does not accept edits or
deletions from page visitors. Each normalized avatar can enter once per stock in each round.
Use an avatar rather than a real name, and do not submit personal information. The SQL
constraints validate avatar format, ticker, price, one-entry limit, and round cutoff, but this
simple public setup does not provide identity verification or strong abuse/rate limiting.

### Weekly Price and Results Updates

Edit [`prediction-market-data.json`](./prediction-market-data.json) manually once a week:

- Set `updatedAt` to the date of the snapshot (`YYYY-MM-DD`).
- For each symbol in `prices`, set `price` to the latest observed market price in the listed
  currency. Keep the source link; use the same convention each week.
- After a round closes, add the official split-adjusted close and its actual trading date under
  `actuals`, keyed by round ID and ticker. For example:

```json
"actuals": {
  "quarterly-2027-q1": {
    "NVDA": { "price": 123.45, "closeDate": "2027-03-31" }
  }
}
```

The example values illustrate the JSON shape only; replace them with verified prices. Leave other
symbols absent until their actuals have been checked. Commit and publish the edited JSON so the
leaderboard can score predictions against the recorded results.

## Quarterly Tracking Schedule

The first scheduled tracking checkpoint is January 1, 2027 (Q1). Continue every three months
on the first day of each quarter. These are review dates, not quarter-end dates: record the
latest available portfolio and market data, and note the date range covered.

| Checkpoint | Review date | Year-over-year overlay |
| --- | --- | --- |
| 2027 Q1 | January 1, 2027 | Establish the first scheduled-review baseline |
| 2027 Q2 | April 1, 2027 | First same-quarter comparison will be 2028 Q2 |
| 2027 Q3 | July 1, 2027 | First same-quarter comparison will be 2028 Q3 |
| 2027 Q4 | October 1, 2027 | First same-quarter comparison will be 2028 Q4 |
| 2028 Q1 | January 1, 2028 | Compare directly with 2027 Q1 |
| 2028 Q2 | April 1, 2028 | Overlay and compare with 2027 Q2 |
| 2028 Q3 | July 1, 2028 | Overlay and compare with 2027 Q3 |
| 2028 Q4 | October 1, 2028 | Overlay and compare with 2027 Q4 |

Continue the same January/April/July/October cadence after 2028. At each checkpoint from 2028
onward, compare against the corresponding quarter one year earlier. Keep both observations
visible side by side; the newer quarter does not replace the prior-year record.

### Quarterly Review Template

Copy this block for each checkpoint and retain completed entries as the review history.

```text
Checkpoint:
Review date:
Data through / period covered:

Portfolio performance
- Infrastructure portfolio return:
- App Tier comparison return:
- Benchmark or baseline used:
- Are infrastructure stocks outperforming? Evidence:

Market and thesis indicators
- Personal / distributed AI adoption:
- Cloud AI spending and growth:
- GPU, chip, and manufacturing demand / margins:
- Evidence for or against the thesis:

Watchlist and valuation
- New or changed distributed-AI companies:
- IPO / public-market developments:
- Valuation changes relevant to the thesis:

Same-quarter year-over-year overlay
- Prior-year checkpoint:
- Portfolio performance then / now:
- Market and thesis indicators then / now:
- What changed, and what did not:

Thesis confidence
- Previous score (start at 90% for 2027 Q1):
- Current score:
- Evidence supporting the change:
- What evidence would materially weaken or break the thesis:

Actions and next checkpoint
- Follow-up items:
- Next review date:
```

### Annual Review Overlay

The annual review happens on December 31, attached to the Q4 record rather than replacing the
regular October 1 Q4 checkpoint. At year-end, compare the full-year result with the prior
year-end, summarize all four quarterly records, assess whether the thesis assumptions still
hold, and document changes to the watchlist, risks, and confidence score. Continue the quarterly
same-quarter overlays as usual; for example, Q2 2028 is compared with Q2 2027, and the December
31, 2028 annual review is compared with December 31, 2027.


## Conclusion
Infrastructure has dominated computing for 60 years.

We believe it will dominate the AI era too.

Nvidia, TSMC, Qualcomm, Apple own the personal data center layer
Applications depend on hardware, not vice versa
History suggests 20-50x returns are possible over 30 years
Current valuations still leave room for growth

We're putting $10,000 where our mouth is.

30 years. Public commitment. Quarterly updates.

If we're right, infrastructure wins (again).

If we're wrong, we'll document why the pattern broke.

Either way, we'll learn something valuable.

🖖



Last Updated: October 12, 2026 Next Review: January 1, 2027 (Q1 tracking) 30-Year Review Date: October 12, 2056
