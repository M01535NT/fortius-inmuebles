# Fortius administration workspace Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the nine approved administration improvements with a personally reorderable navigation.
**Architecture:** Small client components consume the existing permission-scoped stores. Pure selectors power operations, filters and reports. Durable recovery and change history use authenticated database operations; preferences contain presentation data only.
**Tech Stack:** Next 16, React 19, TypeScript, Supabase, Vitest, Playwright.
**Spec:** The nine recommendations approved in this conversation, plus draggable/reorderable left modules.

## Global Constraints
- Preserve server authorization, version conflicts and public/private file separation.
- All controls work at 320px, with touch and keyboard; respect reduced motion.
- No fabricated interactions, response times, offers or closures.
- Preference persistence is user-scoped in this browser. Draft recovery is opt-in and session-scoped; never persist credentials.
- No production data writes during browser verification.

## Review Focus
- Changed roles and corrupted stored preferences cannot reveal restricted modules.
- A failed save or stale version must preserve the editor draft.
- Filters and dates must not misrepresent historical conversion or scheduled visits as completed sales.
- Recovering a deleted record cannot overwrite a replacement or bypass relationship validation.
- Touch reordering and narrow forms must remain usable without horizontal page overflow.

### Task 1: Navigation and operational overview (recommendations 1, 2, 7)
Files: admin-shell.tsx; new workspace/navigation, workspace/search, workspace/today components; lib/admin/workspace.ts.
Interfaces: normalized order helper; existing db stores and authenticated session.
- [x] Test invalid/duplicate navigation IDs, move boundaries, saved order and editor restriction.
- [x] Implement grouped, reorderable navigation, user-scoped preferences, global search and quick creation.
- [x] Implement today's tasks, follow-ups, visits and overdue dossiers with actionable links.
- [x] Run focused tests ; include in the final feature commit.

### Task 2: Inventory and property editor (recommendations 3, 4, 7, 8)
Files: propiedades/page.tsx; property-form.tsx; new inventory-controls and property-workbench components.
Interfaces: existing versioned save, property shape and upload control.
- [x] Test filters, draft preservation, explicit publication and image ordering.
- [x] Implement thumbnails, saved filters, previews, section progress, photo controls and recoverable in-tab draft.
- [x] Separate save from publish, preserve version conflicts and warn on dirty navigation.
- [x] Run editor and list tests ; include in the final feature commit.

### Task 3: Relationships and dossiers (recommendations 5, 6)
Files: leads/page.tsx; lead/client details; property editor; expedientes/page.tsx; new related-work and dossier-tabs components.
Interfaces: existing lead/client/property/task/event references; existing dossier APIs.
- [x] Test normalized duplicate detection and cross-record relationships.
- [x] Implement stage/list views, duplicates, related tasks/visits/people and next-contact summary.
- [x] Implement dossier summary and accessible section navigation; separate receipt from recorded review using existing activity.
- [x] Run related module tests ; include in the final feature commit.

### Task 4: Recovery, history and reporting (recommendations 8, 9)
Files: authenticated history/recovery API and migration; workspace history component; reportes/page.tsx and report selectors.
Interfaces: admin-only history endpoint; existing immutable task/dossier histories.
- [x] Test role enforcement, safe restore and report date/assignee boundaries.
- [x] Add server-recorded activity and recovery for suitable collections without weakening deletion guards.
- [x] Add period/assignee report controls, drilldowns and explicit available-data coverage.
- [x] Run backend/report tests ; include in the final feature commit.

### Task 5: Verification and review
- [x] Run lint, types, unit suites and production build.
- [x] Exercise populated admin on mobile and desktop, reorder persistence, filters and editor in browser.
- [x] Fresh whole-branch review; fix important findings and verify.
- [ ] Integration choice: keep local, merge or publish PR. Production migration and deployment remain pending.

## Execution ledger
- Base: 2d459d8 on feat/admin-workspace. Existing checkout is clean; working on a dedicated feature branch keeps the configured preview environment available.
- Plan approved by the user's explicit implementation request; execute inline without another approval round.

- Tasks 1–4 implemented as shared workspace components, keeping existing permission-scoped stores and version checks.
- Final independent review found five important issues. Fixed history retry/current-tab state, button-only dirty mutations, complete stale-copy visibility, one-time portfolio deep links, and repeated same-route quick creation.
- Regression evidence: history + button-only mutations reproduced four failures before the fixes; focused final editor/history/commercial suite passed 26 tests. Browser exercises repeated same-route creation and drag/touch persistence.
- Full verification: lint, typecheck, backend 483/483, admin 209/209, production build passed. Browser final result recorded below after completion.
- Browser test maintenance: publication assertions now target the explicit button; dossier status assertions are scoped to main to coexist with accessible navigation announcements.
- Visual inspection: 320px draft preview and desktop dashboard screenshots reviewed.
- Read-only remote check: history table returned PGRST205; migration has not been applied. No production records were written.
- Delivery decisions: retain configured checkout on a dedicated feature branch; combine the cross-module implementation into one feature commit. No merge, remote push or production deployment without the integration choice.
- Operational limits: navigation and saved views are browser/user scoped; temporary drafts are opt-in and tab-scoped. History begins when the migration is applied, not retroactively.
- Final browser run: 28/28 passed (workspace, populated mobile panel, dossier recovery and general panel), 320–1440px. Latest lint and TypeScript rerun also exited 0. Stream-closed notices occurred during intentional rapid route changes; assertions and page requests completed successfully.
