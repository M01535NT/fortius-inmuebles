# Financial tools implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Review the completed branch independently before publication.

**Goal:** Deliver reliable mortgage and closing-budget planners for Mint, with local fiscal sources, comparisons, amortization, prepayments and private PDF exports.

**Architecture:** Pure TypeScript financial engines use decimal arithmetic and explicit missing values. Versioned fiscal data is independent of React. Client components consume the same results used by charts, comparisons and downloadable reports; no financial input is sent to the server or placed in a URL.

**Tech stack:** Next.js, React, TypeScript, decimal.js, SVG, existing Motion provider and pdf-lib.

**Spec:** The five-point plan accepted in this conversation on 2026-10-04. Execute without a new approval gate; existing authorization includes GitHub and Vercel publication.

## Global constraints

- Preserve Mint's colors, editorial style, public navigation and property-detail integration.
- First version: MXN fixed-rate bank-credit simulations and ordinary purchase/sale budgets. USD property prices require an explicit exchange rate into MXN.
- Never use CAT as the nominal borrowing rate, promise approval, silently assume a tax exemption, or convert missing quotes into zero.
- Fiscal rules are tied to the operation date and 2026 jurisdiction. Expired, unsupported or ambiguous rules produce a pending item, not a guessed amount.
- Buyer budgets show down payment plus acquisition outlays; seller budgets subtract payoff and known expenses. Do not count commission, loan principal, fees or ISR twice.
- Monetary calculations round half up to cents; final principal is zero, and the final installment adjusts the remaining balance.
- Income/debt data remain in memory. PDF generation happens locally, on request. Reports identify inputs, missing concepts, source dates and model scope.

## Review focus

- Missing insurance, notary or tax amounts must preserve useful subtotals while preventing a complete-total claim.
- Zero rate, 100% down payment and excessive early payments must not produce negative balances or phantom loan charges.
- USD conversions require a valid rate, and an edited property price must propagate to purchase cash requirements.
- 2027 operations and overlapping Tijuana tariff bounds must not silently reuse an invalid tax rule.
- Quoted seller ISR and estimated provisional ISR must not be combined; exemption requires an explicitly supplied determination.

## Task 1: Fiscal rules and money engine

Files: `src/data/financial-rules.ts`, `src/lib/finance/money.ts`, `src/lib/finance/closing.ts`, `tests/backend/financial-closing.test.ts`, `docs/legal/financial-tools-2026-10-04.md`.

Interfaces: `calculateAcquisitionTax({municipality, date, taxBase})` returns amount or pending reason and source; `calculateClosingBudget(input)` returns items, known expenses, pending items and buyer cash or seller net; `calculateSellerIsr(input)` estimates article 126 provisional ISR using updated fiscal costs and fiscal holding years supplied by the user.

- [x] Open municipal laws, state registration fees, UMA and SAT Annex 8. Record source URLs, versions, file hashes, scope and statutory anomalies.
- [x] Write independent expected tax vectors, date/boundary tests, pending-value tests and buyer/seller conservation assertions; run them red.
- [x] Implement explicit decimal rounding, municipal schedules, registration fees and provisional ISR; run tests green.

## Task 2: Mortgage engine

Files: `src/lib/finance/mortgage.ts`, `tests/backend/financial-mortgage.test.ts`.

Interface: `calculateMortgage(input)` returns monthly principal/interest, total known cost, amortization rows, missing-cost labels and baseline prepayment savings. `paymentCapacity(input)` reports disposable budget under a user-selected payment-to-income limit, without approval claims.

- [x] Write independently calculated payment vectors, amortization conservation, zero-rate/full-down-payment, prepayment, fee and conversion tests; run red.
- [x] Implement fixed-rate amortization with one-time and monthly additional payments, term/payment reduction, cent rounding and explicit missing charges; run green.

## Task 3: Client tools and reports

Files: `src/components/tools/*`, existing `src/components/property/mortgage-calculator.tsx`, `src/lib/finance/report.ts`, tool routes and catalog; `tests/admin/financial-tools.test.tsx`, `tests/backend/financial-report.test.ts`.

- [x] Write behavioral tests for scenario comparison, invalid drafts, date jurisdiction, pending values, USD conversions, privacy and edited purchase budgets; run red.
- [x] Build responsive input/results layouts, balance chart, paginated amortization table and three in-memory scenarios. Embed the buyer budget using the current mortgage's down payment, principal and opening fee.
- [x] Replace generic closing percentages with real rules and editable, identified quotes. Add seller payoff, expenses and quoted/estimated ISR modes.
- [x] Generate downloadable PDF summaries and amortization schedules from the same results, including assumptions and missing items; test PDF contents and pagination.
- [x] Update catalog, metadata and tool descriptions to describe actual features.

## Task 4: Verification and maintenance

Files: `tests/admin/browser/financial-tools.spec.ts`, public Playwright configuration, `tools/check-financial-sources.mjs`, source manifest and dedicated scheduled GitHub workflow.

- [x] Check financial invariants and PDFs, then run lint, typecheck, full unit suites and build.
- [x] Exercise both tools at 375, 414, 768 and 1440 pixels, light/dark and reduced motion; check Axe, no overflow, input privacy, comparisons, downloads and property-detail integration.
- [x] Implement a source checker for official catalog updates, changed PDFs and rule expiration; verify it without changing any rate automatically.
- [x] Have a fresh reviewer inspect the full diff and arithmetic/legal assumptions. Address material findings and rerun affected checks.
- [x] Merge the verified branch to main, push GitHub and confirm Vercel deployment and production interactions.

## Validation evidence

- Local full suite: 242 backend + 134 UI tests passed (376 total).
- 6 financial browser tests passed at 375, 414, 768 and 1440 pixels, light/dark and reduced motion; Axe reported no violations within either tool. Mortgage/closing PDFs matched their inputs and full amortization, with no financial uploads or storage writes.
- 11 existing public-navigation/property-PDF browser tests passed.
- Build, lint, typecheck and deployment PDF asset verification passed.
- All 10 fiscal source PDF hashes match; current official catalog and 2026 snapshot checker report no issues.
- Fresh independent review compared fiscal rules against primary source text and tested 2,000 additional amortization cases. Its two findings (stale assumed base, native floating-point down payment) were fixed and covered by regression tests.

Main published in a4bbd55 and 05809c9. Vercel confirmed deployment; production phone/desktop checks verified a 23,961.12 payment, saved scenarios, local PDF, Ensenada ISAI 76,500, seller net 2,776,000, no page overflow and no browser errors. The scheduled source-maintenance workflow passed on GitHub. Legacy offline-backend browser expectations were updated to match the primary-link menu and pending-cost model.
