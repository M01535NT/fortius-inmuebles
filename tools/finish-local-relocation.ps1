param(
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
  [Parameter(Mandatory=$true)][int]$BlockingProcessId,
  [int]$WaitMinutes=30
)
$ErrorActionPreference='Stop'
$mntSource='C:\Paginas-web\Inmobiliaria'
$mntDestination='C:\Paginas-web\MNT-Inmuebles'
$mntReport='C:\Paginas-web\MNT-traslado-resultado.json'
$mntProjectId='ab1d4a3b-c8ca-4b0a-9d18-25295529d9d7'
$mntClock=[Diagnostics.Stopwatch]::StartNew()
function Save-MntResult([hashtable]$Value) {
  $Value['checkedAt']=[DateTimeOffset]::UtcNow.ToString('o')
  $Value | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $mntReport -Encoding utf8
}
try {
  if ([IO.Path]::GetFullPath($mntSource) -cne $mntSource -or [IO.Path]::GetFullPath($mntDestination) -cne $mntDestination) { throw 'Unexpected absolute paths' }
  Save-MntResult @{status='waiting_for_codex_exit';source=$mntSource;destination=$mntDestination;timeoutMinutes=$WaitMinutes}
  while (Get-Process -Id $BlockingProcessId -ErrorAction SilentlyContinue) {
    if ($mntClock.Elapsed.TotalMinutes -ge $WaitMinutes) { throw 'Codex remains open; no files were moved. Run the helper again after closing it.' }
    Start-Sleep -Seconds 2
  }
  if (!(Test-Path -LiteralPath $mntSource) -or (Test-Path -LiteralPath $mntDestination)) { throw 'Source/destination precondition failed' }
  if ((Get-Item -LiteralPath $mntSource).LinkType) { throw 'Source is a filesystem link' }
  $mntHead=git -C $mntSource rev-parse HEAD
  if ($LASTEXITCODE -ne 0 -or $mntHead -ne $ExpectedHead) { throw 'Cannot verify expected project commit; refusing relocation' }
  $mntChanges=git -C $mntSource status --porcelain
  if ($LASTEXITCODE -ne 0 -or $mntChanges) { throw 'Cannot verify clean working tree; refusing relocation' }
  # Stop only this project's verified dev/test Node processes, never sibling products.
  Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'node.exe' -and $_.CommandLine -like '*C:\Paginas-web\Inmobiliaria\*'
  } | ForEach-Object {
    $mntPidToStop=$_.ProcessId
    Stop-Process -Id $mntPidToStop -ErrorAction Stop
    Wait-Process -Id $mntPidToStop -Timeout 10 -ErrorAction SilentlyContinue
    if (Get-Process -Id $mntPidToStop -ErrorAction SilentlyContinue) { throw 'A project server did not stop; refusing relocation' }
  }
  Move-Item -LiteralPath $mntSource -Destination $mntDestination -ErrorAction Stop
  $mntMovedHead=git -C $mntDestination rev-parse HEAD
  if ($LASTEXITCODE -ne 0 -or $mntMovedHead -ne $ExpectedHead) { throw 'Moved commit mismatch' }
  Set-Location -LiteralPath $mntDestination
  node .superpowers/update-codex-project-state.mjs --relocate
  if ($LASTEXITCODE -ne 0) { throw 'Folder moved, but saved project update needs attention' }
  node tools/mnt-backup.mjs --verify .superpowers/backups/2026-09-06T01-41-21-144Z
  if ($LASTEXITCODE -ne 0) { throw 'Moved backup verification failed' }
  $mntState=Get-Content -LiteralPath 'C:\Users\Moise\.codex\.codex-global-state.json' -Raw | ConvertFrom-Json -AsHashtable
  if ($mntState['local-projects'][$mntProjectId]['name'] -ne 'MNT Inmuebles' -or $mntState['local-projects'][$mntProjectId]['rootPaths'][0] -ne $mntDestination) { throw 'Saved project verification failed' }
  $env:MNT_SITE_URL='http://localhost:3001'
  $env:MNT_PUBLIC_LEADS_ENABLED='false'
  $mntNode=(Get-Command node.exe).Source
  $mntNext=Join-Path $mntDestination 'node_modules\next\dist\bin\next'
  $mntDev=Start-Process -FilePath $mntNode -ArgumentList @($mntNext,'dev','--hostname','127.0.0.1','--port','3001') -WorkingDirectory $mntDestination -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $mntDestination '.superpowers\dev-after-relocation.log') -RedirectStandardError (Join-Path $mntDestination '.superpowers\dev-after-relocation-errors.log')
  $mntHealthy=$false
  for($mntAttempt=0;$mntAttempt -lt 20;$mntAttempt++) {
    try { $mntResponse=Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -TimeoutSec 10; if ($mntResponse.StatusCode -eq 200) { $mntHealthy=$true;break } } catch {}
    Start-Sleep -Seconds 2
  }
  $mntResult=@{status=$(if($mntHealthy){'completed'}else{'moved_local_health_pending'});sourceAbsent=(!(Test-Path -LiteralPath $mntSource));destination=$mntDestination;commit=$ExpectedHead;savedProject='MNT Inmuebles';projectId=$mntProjectId;backupVerified=$true;localHealth=$mntHealthy;devProcessId=$mntDev.Id}
  Save-MntResult $mntResult
  $mntResult | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $mntDestination '.superpowers\relocation-result.json') -Encoding utf8
} catch {
  Save-MntResult @{status='needs_attention';message=$_.Exception.Message;sourceExists=(Test-Path -LiteralPath $mntSource);destinationExists=(Test-Path -LiteralPath $mntDestination)}
  exit 1
}
