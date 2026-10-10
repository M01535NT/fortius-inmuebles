# Fortius public home — approved implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan in the current session. Preserve the pre-existing audit changes in this checkout.

**Goal:** Make seller and buyer journeys clear, move inventory earlier, and retain Fortius branding, motion and operational content.

**Architecture:** Recompose the existing Next.js server page and its existing client motion components. Keep public Supabase projections and content editor keys unchanged. Reuse the footer invitation as the final conversion section.

**Tech Stack:** Existing Next.js, React, TypeScript, GSAP, Motion, CSS, Vitest and Playwright; no new dependencies.

**Spec:** Phase A in the conversation, approved by the user on October 10, 2026 with this override: **keep demo properties in featured inventory; the owner will remove them later**.

## Global constraints

- Branch: feat/inicio-comercial-fortius; no production deployment, DB writes, SQL migrations or security changes.
- Keep original logo, fonts, palette, photograph carousel, marquee, fixed image transition, mobile stacking and reduced-motion support.
- Exactly six existing method stages, with their operational descriptions unchanged, and all six deliverables.
- Preserve personalized panel copy. Update known old defaults at read time, never by persisting records.
- Real featured properties remain published, featured, and available. All published featured demo records remain eligible, including the existing reserved example, and retain their demonstration and availability labels.
- Keep current routes, hash links, public lead feature flag and financial tools intact.
- Do not stage or commit pre-existing audit changes with this task.

## Review focus

- Legacy stored defaults refresh while bespoke text and source objects remain untouched.
- Demo/real, available/sold/reserved, published/unpublished featured records and empty results.
- Long customized hero headings at narrow widths, both themes and 200% text zoom.
- Accordion expansion changes scroll geometry without breaking subsequent sticky cards or the fixed photograph.
- Closing CTA and calculator links remain available without exposing disabled forms or duplicating invitations.

## Task 1: Content and inventory contracts

Files: src/data/home-copy.ts, src/lib/inventario.ts, tests/admin/home-refresh.test.tsx, tests/admin/public-content.test.tsx, tests/backend/public-web.test.ts.

Interfaces: resolveSiteContent(content) and homeText(content, key) retain their signatures; getFeaturedProperties() returns available featured public properties and preserves all published featured demos with their original states.

- [x] Add failing tests for refreshing last shipped defaults without mutating source/custom copy, and demo eligibility, including the reserved demonstration.
- [x] Run the targeted Vitest suites and inspect expected failures.
- [x] Update only approved copy fields and exact known-default mappings; leave method stage bodies and SEO intact.
- [x] Filter availability for real featured properties without filtering demos; verify all targeted tests pass.

## Task 2: Editorial composition

Files: src/app/page.tsx, src/components/home/editorial-{sections,hero}.tsx, segmentos.tsx, respuestas.tsx, site-footer.tsx, src/app/admin/contenido/page.tsx, src/app/editorial.css, tests/backend/public-render.test.ts.

Interfaces: Existing components/props remain available; stable anchor IDs metodo, entregables, respuestas. New journey links use existing seller and inventory routes; two buyer FAQs are frontend copy, with existing owner FAQ keys preserved.

- [x] Reorder: hero, journeys, featured, specialties, benefits, fixed photo, method, documents, FAQs; footer supplies closing.
- [x] Add two editorial journey links, four compact benefits, specialty heading/action labels, and grouped owner/buyer FAQs.
- [x] Change hero and home-only footer copy, remove the large calculator block from Home, retain contextual calculator access.
- [x] Update admin labels to match their new visible sections, without adding persisted fields.
- [x] Add scoped responsive CSS; preserve all animation mechanisms and existing typography.

## Task 3: Verification and review

Files: relevant existing public browser tests; new home-commercial.spec.ts; documentation result section below.

- [x] Verify visible section order, all six stages/documents, demo labels and real route destinations in a local fixture-backed browser.
- [x] Check animated and reduced-motion behavior on mobile and desktop; both themes, keyboard, image loading, overflow and layout shift.
- [x] Run npm run verify and the relevant Playwright suites; browser uses installed Chromium without disabling TLS verification.
- [x] Obtain a fresh code review of this task's diff, resolve material findings and record results.
- [x] Leave the reviewed branch available locally; no push/deploy without an explicit instruction for publication.

## Execution record

- Approved Phase A is the design authority; the user already authorized Phase B, so no additional planning approval gate.
- Existing audit changes were present before branching. They remain outside this task's scope.
- The previous browser certificate failure will be avoided for product verification by using a local HTTP server and the existing synthetic backend fixture, with no production writes.


## Result — October 10, 2026

Implemented on `feat/inicio-comercial-fortius`. No production deployment, remote push, persistent content writes, Supabase mutations, new dependencies or legal-copy edits. Pre-existing audit edits remain in the working tree; no unrelated files were reset or staged.

### Product changes

- Home now orders hero → two journeys → featured properties → specialties → four benefits → fixed photographic transition → six-stage method → six deliverables → owner/buyer FAQs. The existing footer provides the final seller, buyer and contact actions.
- All three published fixture demonstrations remain in featured inventory, including the reserved demonstration with its original “Apartada · Demostración” badge. Available real listings remain eligible; unpublished records remain excluded.
- Updated approved copy and exact previous-default recognition. Personalized panel fields, metadata and source objects remain unchanged. Existing admin keys/save flow continue working; labels now match “Por qué Fortius”.
- Preserved carousel, title reveal, GSAP/ScrollTrigger, parallax, fixed image, document stacking, marquee, routes and reduced-motion behavior. Calculators remain in navigation/footer and the expenses FAQ.
- No changes to the six operational method descriptions or stage order. All six deliverable types remain; the expense text clarifies that amounts are estimates.

### Verification evidence

- `npm run verify`: lint, TypeScript, **499 backend tests + 211 admin tests**, and Next production build passed. After refining the reserved-demo exception, lint, TypeScript, the seven public inventory/backend tests and production build passed again.
- Browser verification: **46 distinct tests passed**, covering the new journeys, all three demo listings, menus, real route destinations, property detail navigation, calculators, expanded FAQs, six method stages, mobile document stacking, themes, keyboard interaction and reduced motion. The initial 47-test selection had five failures; their corrected scenarios passed in the final targeted run. The optional three-run Lighthouse budget test remained skipped; no production performance score or conversion improvement is claimed.
- Automatic axe checks for WCAG A/AA passed in both Home themes. Manual screenshots reviewed at 320, 390 and 1440 px; browser tests also covered 375, 414, 768 and 1024 px. Initial local layout-shift observations were zero, not a production Core Web Vitals measurement. Long-title/doubled-font simulations did not overflow horizontally.
- Final demo/browser failures were traced to eligibility and stale test assumptions: all demos now remain eligible; updated contact/about heading assertions match the current pages; in-page document navigation uses scrolling instead of a Playwright same-document `goto` that creates a history entry with null Next router state. The actual footer calculator route and Back action pass.
- Next logged occasional “destination stream closed early” messages during browser runs. The Home interaction suite reported no client-side errors; no infrastructure change was attempted for those server log messages.
- A fresh independent code review found no actionable issues, including a final review of demo eligibility.
- Existing audit-file hashes stayed identical except the intentional hero CTA selector change inside `public-navigation.spec.ts`; its pre-existing navigation/focus corrections were preserved. `git diff --check` passed.

### Scope and publication

Testing used local production builds with the existing synthetic, read-only backend fixture; no live leads or client records were created. The public lead feature flag remains respected, including the disabled-form state. Actual Supabase/Vercel production publication remains outside this implementation authorization.

Main changed files: `src/app/page.tsx`, `src/data/home-copy.ts`, `src/lib/inventario.ts`, `src/app/editorial.css`, `src/app/admin/contenido/page.tsx`, and Home components `editorial-hero`, `editorial-sections`, `segmentos`, `respuestas`, `site-footer`. Supporting unit/render/browser tests and `playwright.public.config.ts` were updated.

Local review evidence: `/tmp/fortius-home-verify-final.log`, `/tmp/fortius-home-build-final.log`, `/tmp/fortius-home-browser.log`, `/tmp/fortius-home-browser-rerun.log`, `/tmp/fortius-home-browser-targeted.log`, `/tmp/fortius-home-visual.log`, and screenshots in `/tmp/fortius-home-visual/`. These are local execution artifacts, not public deployments.

## Publication authorization — October 10, 2026

The owner subsequently requested “Haz el despliegue”, authorizing GitHub publication and the production deployment. The release contains this Home reorganization and its verification fixes. The earlier audit's application, infrastructure, migration, backup and documentation changes remain outside this release and are preserved locally. Two existing test corrections from that audit (JSDOM focus geometry and visible menu-link selectors) are included to validate navigation correctly; neither changes production behavior.

The exact staged release was exported to an isolated directory before publication. `npm run verify` there passed lint, TypeScript, **492 backend + 211 admin tests (703 total)** and the Next production build. The count differs from the earlier 710-test working-tree run because the release excludes seven audit-specific tests. PDF tracing checks confirmed native image libraries, gallery assets and brand fonts in the deployment bundle.

The four commercial/editorial browser scenarios also passed against the isolated production build at mobile and desktop widths, preserving three demo badges, the reserved example, both journeys, document scrolling and calculator return navigation.
