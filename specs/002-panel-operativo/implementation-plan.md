# COTA web y panel operativo Implementation Plan

Estado: ejecutado, revisado e integrado el 3 de septiembre de 2026. Código de
COTA publicado y verificado en e146091; plataforma separada en b278fcb.
Las rutas temporales que figuran abajo son referencias históricas del plan:
sus evidencias se retiraron a `C:/Paginas-web/_archivo/COTA-20260903/release-evidence`
con manifiesto SHA-256. Consultar README para operación y alcance vigentes.
La invitación fue aceptada por el proveedor; recepción y contraseña corresponden
a la persona administradora, no se afirman completadas automáticamente.

> For agentic workers: use superpowers:subagent-driven-development task by task, with tests and independent review. Infrastructure is handled by the controller alongside one bounded code task.

**Goal:** COTA web y admin persistentes e independientes, después depuración recuperable.

**Architecture:** Next.js BFF del mismo origen, Auth en cookies HttpOnly, Postgres/Storage exclusivos. Escrituras por registro con versión; proyecciones públicas explícitas.

**Tech Stack:** Next.js 16.2.12 (parche de seguridad), React 19, TypeScript, Supabase JS/SSR, SQL, Vitest y Playwright.

**Spec:** `specs/002-panel-operativo/spec.md`, aprobada en conversación.

## Global Constraints

- Mantener todas las páginas, campos, funciones y diseño actuales. Incorporar clientes como entidad del panel.
- No usar localStorage/sessionStorage para datos operativos o autenticación. La preferencia de tema sí puede ser local.
- No copiar/borrar automáticamente datos privados de plataforma o navegadores.
- No contratar servicios de pago, exponer claves privadas ni afirmar entrega sin pruebas.
- Trabajar en la carpeta existente, rama `codex/cota-panel-independiente`, sin duplicar carpetas de proyecto.
- Leer las guías pertinentes de `node_modules/next/dist/docs/` antes de implementar.

### Task 1: Backend, contratos y pruebas de aislamiento

**Files:** Create `supabase/migrations/202609030001_cota_backend.sql`, `src/lib/backend/{contracts,validation,repository,auth,http,public}.ts`, `src/app/api/auth/{login,logout,session}/route.ts`, `src/app/api/admin/collections/[collection]/route.ts`, `src/app/api/admin/collections/[collection]/[id]/route.ts`, `src/app/api/admin/files/route.ts`, `src/app/api/leads/route.ts`, `tests/backend/*.test.ts`, `vitest.config.ts`, `.env.example`. Modify package files only for backend/testing dependencies and scripts. Do not modify admin store or UI in this task.

**Interfaces:**
- Environment: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only and only if necessary). No fallback project.
- GET `/api/auth/session`: `{user:{id,email,role}}` or 401/403. POST login `{email,password}` establishes HttpOnly session after membership check; POST logout clears session.
- POST `/api/auth/callback`: `{type:"invite"|"recovery",access_token,refresh_token}` or `{type,token_hash}`. Same-origin; validate the Supabase user and existing membership before HttpOnly cookies. POST `/api/auth/password`: `{password}` (minimum 12), authorized member, returns `{ok:true}`. GET session refreshes expired tokens. The admin client reads the invitation hash once, clears it immediately and does not persist tokens in browser storage.
- POST `/api/auth/recovery`: `{email}`, validated and same-origin. Request Supabase recovery returning to `/admin`; generic response to prevent account enumeration, surface service/rate-limit failures without claiming an email was sent when rejected. The login UI includes recovery access.
- GET `/api/admin/collections/:collection`: `{records:[{id,data,version,createdAt,updatedAt}]}`; private no-store response.
- PUT `/api/admin/collections/:collection/:id`: `{data,version}`. Null version creates only; numeric version conditionally updates. Returns `{record}`. Errors: 400 validation, 401 unauthenticated, 403 nonmember, 409 conflict.
- DELETE record accepts `{version}` and returns `{ok:true}`. No silent deletion of referenced entities.
- POST `/api/admin/files`: multipart file and visibility (private default/public explicit), returns `{bucket,path,url,name,type}`. Authorized GET bucket/path resolves private signed URLs. Store paths, not expiring URLs.
- Vercel-safe upload: POST `/api/admin/files/upload` with `{name,size,contentType,visibility}` prepares a private staging signed upload and signed expiring ticket, then browser uploads bytes directly to Storage. POST `/api/admin/files/complete` with `{ticket}` validates actual bytes/size and owner-bound ticket before promoting to private/public final destination and returning the same file metadata. No public exposure before validation, no overwrite grant. UI uses this flow to support the specified 20 MB without crossing Vercel's 4.5 MB request limit.
- POST `/api/leads`: existing ProspectoInput fields/origins, returns `{id}` only after persistence. Validate fields/body limits; backend rate limiting, honeypot; no anonymous record data response/read.
- Server exports `getPublicProperties():Promise<Property[]>`, `getPublicAdvisers():Promise<Asesor[]>`, `getPublicContent():Promise<SiteContent|null>`, `getPublicSettings():Promise<SiteSettings|null>`. Lists only explicit safe published data. Use type-only imports to avoid bringing client store into server module.
- SQL cota_records per-row data/version, staff membership and RLS, explicit grants, atomic conditional mutations, validation and reference safeguards. Start with no fictitious leads/clients. Preserve all existing property/agent fields.

- [x] Write RED tests for 401/403, invalid collection/payload, create/update/version conflict, anonymous no-read and public-field exclusion. Use real validation/repository behavior, not source grep.
- [x] Implement minimal backend; test DB policies with a local Postgres-compatible runner or clearly separate unexecuted live checks from passing unit tests.
- [x] Run GREEN tests and lint; send stable SQL path/interfaces to controller for provisioning.
- [x] Commit only owned files; write report including RED/GREEN output and any external prerequisites.

### Task 2: Panel persistente y acceso real

**Files:** `src/lib/admin/store.ts`, all existing `src/app/admin/**/page.tsx`, `src/components/admin/{admin-shell,ui,property-form}.tsx`, new `src/app/admin/clientes/page.tsx`, `src/data/propiedades.ts` type-only adjustments, tests for store and flows. Package/test configuration changes only as necessary for this task's test coverage.

**Interfaces:** consume Task 1. Keep business types/collection names. Stores hold in-memory UI cache only, load through GET, track per-record versions and clear on logout. Async upsert/remove/singleton save callers await persistence before success or navigation. Refresh on focus; loading and error states never masquerade as empty success.

The version submitted must belong to the record snapshot the user started editing, not a newer version silently picked from a refreshed cache. Retain existing demo flags and noindex behavior; permit real records (`demo:boolean` instead of literal true), while `publicada` defaults false. New records must not be forced to demo. Existing seeded examples remain marked as demo. All current Property fields, gallery/documents/video/360 remain editable.

Use the current COTA interface tokens, Archivo/Plex typography, border/card treatment and component patterns. Add only functional controls/states required here; no visual redesign. Existing `Ver sitio` link to `/` stays: it is the same product, unlike the removed platform links.

- [x] RED tests: reload persistence through API, failed save no success/rollback, 409 conflict, session/cache clearing.
- [x] Replace demo auth and plaintext shared password with email/password server session. Keep modules/layout; make all modules and logout reachable on mobile.
- [x] Handle secure invitation/recovery on `/admin` with the callback/password endpoints; do not send invitations before this flow is deployed or ready locally.
- [x] Convert every mutation caller to awaited operations and explicit errors. Add client management, publication control and validated uploads/private URL resolution.
- [x] GREEN tests/lint and commit; independent review before next task.

### Task 3: Web reads panel and products no longer cross-link

**Files:** `src/lib/{inventario,prospectos}.ts`, relevant home/property/sections components, `src/data/site.ts`, layout, inventory/zone/detail/sitemap routes, `next.config.ts`; platform `src/components/app-shell/{nav.ts,nav-links.tsx}`, `src/lib/web.ts`, targeted unit tests and `docs/DECISIONES.md` to supersede its old integration decision.

Current website data is already preserved in the dedicated backend: three published demo properties with their identical local `/hero` gallery files, two advisers, content/settings and existing asset references. Do not replace these with other static demo fixtures or seed private operational collections. Use only the new configured project's public bucket for Supabase image optimization; retain other currently allowed external image hosts. The platform's existing directory has its own clean local branch `codex/separar-cota-web` from `de94a689b5e369cc2b872ca8bd0eec2b005c17ef`; change only the reverse links/default destination and directly contradictory documentation. Its data model, existing DB, other functions and dependencies are out of scope.

The currently deployed footer explicitly shows `WhatsApp: por confirmar` and `Teléfono: por confirmar` for placeholder contact values. Preserve that honest placeholder handling until actual public contact details are supplied. Never publish the private administrator email as contact by inference.

- [x] RED integration tests: publication changes public results, private/unpublished exclusion, lead success requires remote persistence.
- [x] Replace platform clients with Task 1 projections/API; fetch content/settings server-side and pass to client components without visual redesign. Publication and edits update without rebuilding.
- [x] While editing the root layout, resolve the observed Next.js smooth-scroll warning using the documented `data-scroll-behavior` attribute; preserve the existing scrolling design.
- [x] Replace the website's current external platform entry with the internal `/admin` destination labeled `Administración`, retaining its current placement/design. Remove return links/default COTA destination in the separate platform, preserving its unrelated functionality.
- [x] GREEN tests plus visual desktop/mobile/theme/navigation/forms, then commit and review.

### Task 4: Provision and verify operational delivery

**Owner:** controller. Created project qkkirjzhviqwvuqjnmei; no other project removed. Administrator address supplied privately and retained only in the local provisioning ledger, not versioned documentation or public contact settings.

- [x] Apply migration only to new COTA; verify policies, empty sensitive collections and storage visibility.
- [x] Configure local credentials without committing secrets; invite admin and create membership, require password setup. Public content/settings can be seeded from current code; no private platform transfer.
- [x] Preserve currently published COTA inventory from the existing public-only view. Reuse existing local `/hero` images when SHA-256 verifies they are identical; copy into COTA Storage only if an image is absent locally. Snapshot captured at `.superpowers/sdd/implementation-plan/public-inventory-before.json`: three demo listings; `public-asset-manifest.json` verifies all four unique images already exist locally. Do not read/copy private platform tables or replace them with different static fixtures.
- [x] Test unauthorized denial, real login/logout, CRUD/reload/two sessions/concurrent conflict, lead capture, publish/unpublish/content/contact/SEO and private files. Remove only known test fixtures after testing.
- [x] Run npm test, lint, TypeScript and build. Configure Vercel only under user authority, otherwise mark production deployment pending explicitly.
- [x] Resolve and verify runtime dependency security advisories before production; do not apply broad `npm audit fix --force` changes. Re-read installed Next.js docs when upgrading framework.

### Task 5: Approved cleanup after operation works

**Scope:** Only COTA website repository. The controller confirms integrated operation/build before dispatch. Approved historical-file inventory: `.superpowers/sdd/implementation-plan/archive-candidates.json` (20 files,21,655,940bytes with SHA-256). Recoverable destination is `C:/Paginas-web/_archivo/COTA-20260903`; this is an archive, not another active project. Resolve and validate exact paths, reject reparse traversal, copy each candidate preserving its relative path, verify all destination hashes before individually removing originals, and refuse changed/unexpected targets. No broad recursive deletion or Git history rewrite. Add a compact tracked archive manifest containing relative paths, bytes and hashes so restoration stays auditable.

Consolidate current product/setup/security/verification/design guardrails and remaining real-contact/demo-content tasks into one README rather than replacement document sprawl. Preserve valid original visual decisions (Archivo/Plex, both themes, original Cota mark, vertical Método, safe reduced-motion hydration and overflow clipping); supersede demo-login/localStorage/platform-source claims. Keep the approved current specification/plan; do not archive this active plan workspace until final review/integration. Preserve calculator research provenance with the archived relative path/hash and label it historical, without asserting legal/tax currency or changing its behavior. Controller owns final invitation/deployment and will archive local one-time provisioning evidence after those steps. One-time `tests/live/seed-current-public.mjs` is no longer a reusable test: archive it with its source snapshot, and remove it from active tests only after the copy is verified. Keep reusable `tests/live/verify-cota.mjs`.

- [x] Recompute references: previously unused candidates may now be active.
- [x] Inventory/hash/archive original PNGs and business documents outside active project, verify copies before removing active originals. Preserve research-to-calculator traceability.
- [x] Consolidate obsolete eight specs/napkin into README, current criteria and remaining tasks; supersede old platform-as-source-of-truth instructions.
- [x] Remove only confirmed unused UI/motion components and dependencies; preserve active PDFs/assets, Git, environment and lockfile. Clean generated cache only while server is stopped.
- [x] Provide `npm test` as the existing offline backend+admin suites; hosted-mutating and browser checks remain separate explicit commands.
- [x] Run full verification, review diff, reopen localhost:3000, report archive/recovery and remaining blockers precisely.
