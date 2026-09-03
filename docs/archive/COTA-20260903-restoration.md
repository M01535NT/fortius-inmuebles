# COTA-20260903 restoration

The immutable archive manifest is `docs/archive/COTA-20260903-manifest.json`. An identical copy named
`MANIFEST.json` is stored at the root of
`C:\Paginas-web\_archivo\COTA-20260903`.

For each restoration, compare the archived file's bytes and SHA-256 with its
manifest entry. Then copy that single relative path back into
`C:\Paginas-web\Inmobiliaria`; never delete recursively and never restore an
entry whose hash differs. `sourceRemoved: false` records the INITIAL retention
of three snapshots; the immutable manifest is historical, not a live source inventory.

At delivery closure the completed plan workspace, QA artifacts and one-time
archival script were also copied, SHA-256 verified and retired: 106 files,
17,023,391 bytes. Their independent inventory is
`C:\Paginas-web\_archivo\COTA-20260903\release-evidence\MANIFEST.json`, SHA-256
`95587E69B42B6433D6E3ADD09DBE572F02AEEDB6711A6FE0A58640A327790D37`.
It preserves repository-relative paths beneath `release-evidence`. Verify each
entry before restoring; scripts there are historical evidence, not runnable
operations for the current environment. No credentials or active backups were
included. The original 24-entry manifest and its archive copy remain unchanged.

The archival command ran once on 2026-09-03 after all source hashes were
validated. It requires the pre-cleanup candidate inventory and source files,
which are intentionally no longer active; it is not a re-validation or
restoration tool. Use the manifest for all later verification.
