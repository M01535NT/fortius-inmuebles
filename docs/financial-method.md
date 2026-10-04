# Financial tools: method and maintenance

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
