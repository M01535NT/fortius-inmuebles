# Financial tools: method and maintenance

Source verification note, 12 October 2026: `npm run check:financial-sources` could not fetch any of the ten sources or the legislative catalog in this environment. The fiscal snapshot and hashes remain those reviewed on 4 October; this failed request does not establish an amendment or current validity. Recheck official sources before revising fiscal inputs.

The client uses `decimal.js` with 40 digits of internal precision and half-up cent rounding. Inputs remain in React memory. They are never sent to an API, appended to a URL, or persisted to browser storage. PDFs are generated locally on demand.

## Mortgage

Ordinary MXN bank loan, fixed nominal annual rate, monthly payments in arrears. Payment = `P*r/(1-(1+r)^-n)` where `r = annualRate/1200`; at zero interest, `P/n`. Interest is calculated on opening balance, rounded to cents; scheduled principal is payment less interest. The final payment settles the remaining principal. Monthly and one-off prepayments are applied after that month's installment, capped at outstanding principal.

Term reduction retains the scheduled installment; payment reduction recalculates it over the remaining contractual months. Quoted insurance and monthly administration are constant amounts. Opening and total prepayment commissions are separate one-off quoted costs. A blank quote is pending, not a claim that a loan is fee-free. Comparison uses immutable in-memory snapshots with pending charges exposed. CAT is user-supplied reference data, never computed or used as a nominal rate. USD listing prices require a user exchange rate into MXN; no USD loan is offered.

Payment capacity is a user-selected percentage of net income minus other monthly debts, floored at zero. It is a household budget calculation, not underwriting or bank approval.

## Acquisition and seller budgets

Purchase cash = down payment (or full cash price) + known acquisition expenses. A quoted ISAI or complete registration quote replaces, rather than adds to, the rule calculation. Opening from the mortgage is reused exactly once. Notary quote is captured including its IVA and excluding separately listed taxes/registration. Missing costs remain pending; a subtotal is not presented as a complete final amount.

Sale net = price - commission - commission IVA - cancellation - ISR - other costs - mortgage payoff. IVA included in commission is split out instead of charged twice. IVA 8% or 0% is an explicit invoice assumption, not an automatic border incentive. Quoted ISR and modeled provisional ISR are mutually exclusive.

## Supported fiscal snapshot

Ordinary transactions in Tijuana, Playas de Rosarito, Tecate and Ensenada, dates in 2026. The fiscal base is supplied separately; using price is explicitly labeled a simulation assumption. The tool does not determine statutory updated prices, cadastral/valuation adjustments, special transactions or exemptions. Quoted tax determinations can be captured separately.

The published Tijuana Art. 8 table expresses the base and fixed fee in daily UMA. Use 113.14 in January 2026, then 117.31 from February 1. Preserve all printed rates and bounds. The published 49,496.20 overlap (including ±0.0001 UMA due to cent input resolution) and gaps between two-decimal ranges return pending; no interpolation or correction is invented. Tecate's printed last fixed fee, 160,500, is also preserved despite a discontinuity. Ensenada adds 0.25% of the base for public security, not 0.25% of the tax.

Registration snapshot is the state law updated June 18, 2026: one analysis 395.02, each notice 295.30, ownership registration 12,398.60, new mortgage registration 11,877.34. Default ordinary budget uses two notices and a single document analysis. Count is editable; extra acts or special regimes require a quote. Dates before this snapshot or outside 2026 require a quote.

Optional ISR simulation is only for a resident individual, single owner, ordinary non-exempt sale. Requires already updated fiscal cost/deductions and fiscal holding years supplied by the user. Acquisition cost floor is 10% of price (LISR 121); gain is floored at zero, years capped at 20 (126). Divide gain by years, round quotient to cents, apply **SAT Annex 8 A.I real-estate provisional table**, multiply by years, round cents. State payment is the lesser of 5% of gain and total provisional; it credits that total, with the remainder federal (127). It is not an annual return, exemption determination, or automatic INPC/depreciation calculation. Tiny positive gain with no representable quotient/table range remains pending.

## Evidence and updates

See [legal research](legal/financial-tools-2026-10-04.md), `src/data/financial-rules.ts` and `tools/financial-sources.json`. Expected payment/tax cases were independently calculated with Python Decimal before implementation. Tests also check principal conservation, zero-rate purchases, prepayment limits, pending quotes and registration overrides.

`npm run check:financial-sources` checks PDF hashes, current legislative catalog links and year expiration. The scheduled workflow reports changes as a failed check and uploads a report; it never edits fiscal rates or contacts clients. A failed remote request requires retry/manual source verification; it does not prove a legal amendment. When a rule changes, verify its effective date and transaction scope, update the versioned rules/manifest/research, add independent boundary cases, then review and deploy. The public tool automatically withholds expired date-dependent rules.

## Seller ISR and net in the panel (HER-03, 12 November 2026)

The panel tool «ISR y neto del vendedor» (slug `neto-propietario`, so earlier saved work still opens) estimates the seller's provisional ISR and the net amount. Code: `src/lib/finance/seller-isr.ts`; rules: `SELLER_ISR_RULES` in `src/data/financial-rules.ts`. Scope: resident individual sellers, sale dates in 2026; anything else is pending. Every result is labeled «Estimación» until the owner compares cases against Nuvigant.

- Years: completed anniversaries between purchase and deed, minimum one. Division and multiplication use at most 20 years (LISR 120 and 126). Depreciation uses the uncapped completed years.
- Historic cost (LISR 124): the land is the captured value, or 20% of the cost when it cannot be separated. Construction loses 3% per completed year, never below 20% of its initial cost. Land plus construction is multiplied by the INPC factor: the month before the sale over the purchase month, truncated to the ten-thousandth and never below 1 (CFF 17-A, last reform DOF 09-04-2026). Alternatively, the user enters an already updated cost.
- Cost floor: 10% of the price (LISR 121, I).
- Deductions (LISR 121, II–IV) are captured already updated: improvements, and notary fees, taxes, duties and appraisal from the purchase and this sale. The commission of this sale is deducted automatically, VAT included. This is an assumption to confirm against Nuvigant.
- Main residence (LISR 93, XIX, a): applies only when the seller confirms no exempt sale in the prior three years. Each owner's share of the price is exempt up to 700,000 UDIS × the captured UDI value. On the excess, the gain is taken in proportion excess / price.
- Co-owners, spouses included, are equal shares. Each computes separately and the cents are reconciled on the last owner.
- Tax: the existing A.I 2026 table through `isrFromGain`. The state payment is the lesser of 5% of the taxable gain and the provisional, credited against it (LISR 127).
- Net = price − commission with VAT − ISR − other taxes − loan payoff − pending known expenses. Missing amounts keep the result «preliminar».
- Two PDFs, rebuilt from the saved input: `/api/admin/apps/runs/{id}/export?format=pdf&parte=neto|isr`.

Independent cases (Python Decimal) are in `tests/backend/seller-isr.test.ts`.


## Buyer closing costs in the panel (12 November 2026)

The panel tool «Gastos de compra» (slug `gastos-compra`) reuses `calculateClosingBudget` with the buyer profile, the same rules as the public calculator `/herramientas/gastos-de-cierre`. No new rule or source was added. Differences from the public page: the tax base defaults to the price and the result says so; notary, appraisal, opening fee and other costs are the adviser's quotes, and any missing one keeps the total labeled preliminary. Opened from an operation or a property, it takes the price from `?precio`.
