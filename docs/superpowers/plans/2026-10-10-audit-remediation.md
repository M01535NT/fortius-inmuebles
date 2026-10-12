# Audit remediation implementation plan

Execution: native, authorized by the owner's instruction to advance independently.

Goal: correct independently verifiable audit findings without locking users out or retiring infrastructure with unknown dependencies.
Architecture: preserve Next.js modular monolith, Supabase RLS and transactional integrity.
Spec: docs/architecture/audit/findings.md; current user authorization supersedes the earlier audit-only scope for these corrections.

## Constraints
Preserve pre-existing documentation and test-results. Do not publish changes before verification. Use synthetic isolated DB tests, not customer exports. No automatic mandatory MFA, business stage gates or removal of old deployments.

## Tasks
- [x] F01: update owner export and backup validation to 18 tables; add schema-coverage tests; implement current-schema isolated restoration with FK validation and exact content comparison; retain historical rehearsal.
- [x] F08: test public informacionPublica allowlist; add versioned migration preserving other projection fields and privileges.
- [x] F09: add server-generated request ID to API responses and sanitized structured logging for server failures; tests must exclude raw errors/PII.
- [x] F03: reproduce focus test, correct JSDOM geometry fixture without weakening browser behavior, run existing regressions; check access to deployment gates.
- [x] F02/F04: inspect authorized configuration access; apply only precise verifiable fixes or document access blockers.
- [x] F05/F06/F11: inspect consumers before changing pagination contracts; extract shared domain types independently of React where safe.
- [x] Run focused tests then required full verification; report implemented versus unactivated work.

## Review focus
Incomplete backups must fail; restored orphan FKs must fail; public JSON must not leak unknown keys; error logs must not contain exception text; pagination must not silently change consumers.

Results and remaining operational dependencies: docs/audit-remediation-2026-10-10.md. Checked tasks mean the scoped implementation/inspection was performed, not that all twelve findings are closed.
