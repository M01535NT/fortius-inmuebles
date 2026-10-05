param(
 [Parameter(Mandatory=$true)][string]$Source,
 [Parameter(Mandatory=$true)][string]$Destination,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][string]$ReportDirectory
)
$ErrorActionPreference='Stop'
$sourcePath=[IO.Path]::GetFullPath($Source)
$destinationPath=[IO.Path]::GetFullPath($Destination)
if($sourcePath -ne 'C:\Paginas-web\Inmobiliaria' -or $destinationPath -ne 'C:\Paginas-web\fortius-inmuebles'){throw 'Unexpected project relocation paths'}
$reportPath=[IO.Path]::GetFullPath($ReportDirectory)
if($reportPath -notlike 'C:\Users\Moise\MNT\INMOBILIARIA\.fortius-migration*'){throw 'Report must stay in the migration workspace'}
if(!(Test-Path -LiteralPath $sourcePath) -or (Test-Path -LiteralPath $destinationPath)){throw 'Source/destination precondition failed'}
if((Get-Item -LiteralPath $sourcePath).LinkType){throw 'Source is a filesystem link'}
$head=git -C $sourcePath rev-parse HEAD
if($LASTEXITCODE -ne 0 -or $head -ne $ExpectedHead){throw 'Unexpected source commit'}
function Get-ProjectManifest([string]$Root){
 $items=Get-ChildItem -LiteralPath $Root -File -Recurse -Force | Where-Object {$_.FullName -notmatch '\\(?:node_modules|\.next|\.git)\\'}
 @($items | ForEach-Object {[pscustomobject]@{path=[IO.Path]::GetRelativePath($Root,$_.FullName);bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash}} | Sort-Object path)
}
$before=Get-ProjectManifest $sourcePath
$before | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $reportPath 'folder-before.json') -Encoding utf8
Move-Item -LiteralPath $sourcePath -Destination $destinationPath
$after=Get-ProjectManifest $destinationPath
$after | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $reportPath 'folder-after.json') -Encoding utf8
if(($before | ConvertTo-Json -Depth 4 -Compress) -cne ($after | ConvertTo-Json -Depth 4 -Compress)){throw 'Relocation content mismatch; both manifests were preserved'}
git -C $destinationPath worktree repair
if($LASTEXITCODE -ne 0){throw 'Worktree repair requires attention'}
$afterHead=git -C $destinationPath rev-parse HEAD
if($LASTEXITCODE -ne 0 -or $afterHead -ne $ExpectedHead){throw 'Unexpected relocated commit'}
[pscustomobject]@{sourceAbsent=(!(Test-Path -LiteralPath $sourcePath));destination=$destinationPath;commit=$afterHead;verifiedFiles=$after.Count;sha256Matched=$true} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $reportPath 'folder-result.json') -Encoding utf8
Get-Content -LiteralPath (Join-Path $reportPath 'folder-result.json')
