# Tracking Plan and Conclusion

## Public Share-Price Charts

The tier charts on the [project homepage](./index.html#performance) use October 12, 2026 as
Day 1. Each listed company is rebased to its Yahoo Finance adjusted closing price on that date
(0% return). The charts show individual public-company returns and the equal-weight average of
the public companies in each tier.

Private companies and TBD positions are excluded because they have no public share-price history.
Samsung Electronics is plotted in Korean won; the chart compares percentage returns and does not
convert currencies. Prices are sourced from Yahoo Finance and may be corrected or delayed.

To refresh the dataset, run `python3 scripts/update_prices.py` after the relevant markets close,
then reload the homepage. The updater retrieves the full history from Day 1 and replaces
`price-history.json`; it does not make trades or run automatically.

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
