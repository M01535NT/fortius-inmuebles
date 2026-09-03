# COTA-20260903 restoration

The immutable archive manifest is `docs/archive/COTA-20260903-manifest.json`. An identical copy named
`MANIFEST.json` is stored at the root of
`C:\Paginas-web\_archivo\COTA-20260903`.

For each restoration, compare the archived file's bytes and SHA-256 with its
manifest entry. Then copy that single relative path back into
`C:\Paginas-web\Inmobiliaria`; never delete recursively and never restore an
entry whose hash differs. `sourceRemoved: false` marks snapshots intentionally
retained in the plan workspace; the archive is an additional recovery copy.

The archival command ran once on 2026-09-03 after all source hashes were
validated. It requires the pre-cleanup candidate inventory and source files,
which are intentionally no longer active; it is not a re-validation or
restoration tool. Use the manifest for all later verification.
