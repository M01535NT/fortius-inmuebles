# Financial tools legal research — October 4, 2026

Jurisdiction: Baja California municipal acquisition taxes and state registration rights; Mexican federal provisional real-estate income tax. Purpose: user-operated budget estimates, not credit origination, tax filing or an official tax determination. Ordinary purchase/sale only; no special acquisitions, co-ownership, exemptions or public/social housing incentives.

## Primary sources opened and verified

- [Tijuana Revenue Law 2026, Art. 8](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_II/20251230_LEYINGRESOTIJUANA2026-3.PDF): progressive table in daily UMA. Published overlap at 49,496.20 and fractional-unit gaps withheld. Printed 3.318% in the seventh bracket is preserved. This law expressly replaces the general annual-UMA deduction and 2% rate.
- [Rosarito Revenue Law 2026, Art. 9](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_II/20251230_LEYINGRESOROSARITO2026.PDF): progressive MXN table.
- [Tecate Revenue Law 2026, Art. 18](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_II/20251230_LEYINGRESOTECATE2026.PDF): progressive MXN table. Final printed fixed fee 160,500 is preserved. No automatic annual-UMA deduction.
- [Ensenada Revenue Law 2026, Art. 4](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_II/20251230_LEYINGRESOENSENADA2026.PDF): progressive MXN table plus 0.25% of taxable base for public security.
- [Municipal Finance Law, Art. 75 BIS B](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_II/20241104_LEYHAMUN.PDF): base involves updated transaction price, cadastral value and approved commercial valuation, with statutory adjustments and municipal powers. Price alone is not automatically a determined fiscal base.
- [BC State Revenue Law 2026, updated June 18, Arts. 12–13](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_II/20260618_LEYINGRESOSESTADO2026.PDF): registration rights per act/document/notice. Model covers one purchase, one analysis, editable preventive notices and one new mortgage if financed. Earlier 2026 tariff version not verified: quote required before June 18.
- [INEGI UMA 2026, release 1/26](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/uma/uma2026.pdf): daily 117.31 effective February 1, 2026. [UMA 2025](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/uma/uma2025.pdf): daily 113.14 applicable January 2026.
- [SAT Annex 8 RMF 2026, DOF December 28, 2025, A.I](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo-8-RMF-2026_DOF-28122025.pdf): specific Art. 126 provisional real-estate table, distinct from the general annual salary table.
- [Income Tax Law, Arts. 121, 124, 126–127](https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf): updated costs/deductions, 10% acquisition-cost floor, fiscal holding years capped at 20, state 5% payment credited toward total provisional. No automatic residence exemption or annual income-tax determination.
- [Banxico CAT methodology](https://www.banxico.org.mx/CAT/): CAT is an annual comparison measure including relevant credit costs, not the nominal rate used for amortization. The tool only retains a user-supplied bank CAT.
- [Federal Consumer Protection Law, Art. 32](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf): information/publicity must be truthful and verifiable. Tool avoids official-CAT, approval, savings-after-unknown-costs and definitive-tax claims. Regulated financial service exclusions in Art. 5 were considered; Fortius is not originating a bank credit.

The [official Congress catalog](https://www.congresobc.gob.mx/TrabajoLegislativo/Leyes) identified the current legislative PDF versions. PDF byte hashes and verification date are recorded in `tools/financial-sources.json`. Subsequent remote failures cannot be interpreted as confirmation of continuing legal validity.

## Numerical cross-checks

Base 3,000,000 on October 4, 2026: Tijuana 69,080.07; Rosarito 76,500; Tecate 91,250; Ensenada tariff 69,000 + surcharge 7,500 = 76,500. Ordinary cash registration with two notices = 13,384.22; with one new mortgage = 25,261.56.

ISR sale 3,000,000, updated acquisition cost 1,800,000, updated deductions 200,000, fiscal years 5: gain 1,000,000; provisional 102,089.04; state 50,000 credited; federal remainder 52,089.04. No state amount is added to the provisional again.

## Remaining transaction-specific determinations

Taxable base, exemptions, updated fiscal cost/deductions, INPC, depreciation, actual appraisal, notarial quote, applicability of invoice VAT, exact registration acts, mortgage cancellation/payoff and lender fees must come from the operation's documents or quotations. The tool exposes missing amounts and supports captured determinations without fabricating them.

## Addendum, 12 November 2026: seller ISR (HER-03)

- Re-read the [Income Tax Law](https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf). The latest reform shown is DOF 01-04-2024, and the file's hash matches the 4 October snapshot.
- Rules taken from it:
  - Art. 93, XIX, a): the main-residence exemption up to 700,000 UDIS of consideration. It must be formalized before a notary, with no exempt sale in the prior three years (sworn statement). On the excess, the gain uses deductions in the proportion excess / consideration.
  - Art. 121: deductions, with the 10% cost floor.
  - Art. 124: 20% land when it cannot be separated, 3% annual construction decrease with a 20% floor, and the update period from the acquisition month to the month before the sale.
  - Arts. 120 and 126: years transcurred, at most 20.
  - Art. 127: 5% state payment, creditable.
- Art. 92 places spouses under the co-ownership rules. The tool computes each owner's equal share separately; this is an assumption to verify with the notary.
- [Federal Tax Code](https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf), last reform DOF 09-04-2026. Art. 17-A: the update factor is never below 1, and factors are computed to the ten-thousandth.
- The user captures the UDI value ([Banxico CP150](https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=8&accion=consultarCuadro&idCuadro=CP150&locale=es)) and the INPC values ([INEGI](https://www.inegi.org.mx/temas/inpc/)). The tool stores no index series, so a missing value stays pending.
- Not covered: sales by companies, non-residents, installment payments, inheritance cost rules beyond the captured date, and annual-return effects (art. 120). The owner validates the results against Nuvigant; no accountant review was requested.

