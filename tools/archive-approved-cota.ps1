[CmdletBinding()]
param(
  [string]$RepositoryRoot = "C:\Paginas-web\Inmobiliaria",
  [string]$ArchiveRoot = "C:\Paginas-web\_archivo\COTA-20260903"
)

$ErrorActionPreference = "Stop"

function Resolve-ExactPath {
  param([string]$Path)
  return [System.IO.Path]::GetFullPath($Path)
}

function Assert-WithinRoot {
  param([string]$Path, [string]$Root, [string]$Label)
  $fullPath = Resolve-ExactPath $Path
  $fullRoot = (Resolve-ExactPath $Root).TrimEnd([IO.Path]::DirectorySeparatorChar)
  if ($fullPath -ne $fullRoot -and -not $fullPath.StartsWith($fullRoot + "\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "$Label escapes its approved root: $fullPath"
  }
  return $fullPath
}

function Assert-NoReparseTraversal {
  param([string]$Path, [string]$Root, [string]$Label)
  $fullPath = Assert-WithinRoot $Path $Root $Label
  $fullRoot = (Resolve-ExactPath $Root).TrimEnd([IO.Path]::DirectorySeparatorChar)
  $cursor = $fullRoot
  if (Test-Path -LiteralPath $cursor) {
    if ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
      throw "$Label root is a reparse point: $cursor"
    }
  }
  $relative = [IO.Path]::GetRelativePath($fullRoot, $fullPath)
  foreach ($part in $relative.Split([IO.Path]::DirectorySeparatorChar, [System.StringSplitOptions]::RemoveEmptyEntries)) {
    $cursor = Join-Path $cursor $part
    if (Test-Path -LiteralPath $cursor) {
      if ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "$Label traverses a reparse point: $cursor"
      }
    }
  }
  return $fullPath
}

function Get-Sha256 {
  param([string]$Path)
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant()
}

$repo = Resolve-ExactPath $RepositoryRoot
$archive = Resolve-ExactPath $ArchiveRoot
$archiveParent = Split-Path -Parent $archive
Assert-NoReparseTraversal $repo $repo "Repository" | Out-Null
Assert-WithinRoot $archive $archiveParent "Archive destination" | Out-Null
if (Test-Path -LiteralPath $archiveParent) {
  Assert-NoReparseTraversal $archiveParent $archiveParent "Archive parent" | Out-Null
} else {
  throw "Approved archive parent does not exist: $archiveParent"
}

$candidatePath = Join-Path $repo ".superpowers\sdd\implementation-plan\archive-candidates.json"
Assert-NoReparseTraversal $candidatePath $repo "Candidate inventory" | Out-Null
$approved = Get-Content -Raw -LiteralPath $candidatePath | ConvertFrom-Json
if (@($approved).Count -ne 20) { throw "Expected 20 approved historical files; found $(@($approved).Count)" }

$supplemental = @(
  @{ path = ".superpowers\sdd\implementation-plan\cota-initial-data.json"; removeSource = $false },
  @{ path = ".superpowers\sdd\implementation-plan\public-inventory-before.json"; removeSource = $false },
  @{ path = ".superpowers\sdd\implementation-plan\public-asset-manifest.json"; removeSource = $false },
  @{ path = "tests\live\seed-current-public.mjs"; removeSource = $true }
)

$items = @()
foreach ($entry in $approved) {
  $source = Assert-NoReparseTraversal $entry.path $repo "Approved source"
  $relative = [IO.Path]::GetRelativePath($repo, $source)
  if ([IO.Path]::IsPathRooted($relative) -or $relative -eq ".." -or $relative.StartsWith("..\")) {
    throw "Approved source has an invalid relative path: $source"
  }
  $item = Get-Item -LiteralPath $source -Force
  if ($item.PSIsContainer) { throw "Approved source is not a file: $source" }
  if ($item.Length -ne [int64]$entry.bytes) { throw "Byte count changed: $source" }
  if ((Get-Sha256 $source) -ne $entry.sha256.ToUpperInvariant()) { throw "SHA-256 changed: $source" }
  $items += [pscustomobject]@{ Source = $source; Relative = $relative; Bytes = $item.Length; Sha256 = $entry.sha256.ToUpperInvariant(); RemoveSource = $true }
}
foreach ($entry in $supplemental) {
  $source = Assert-NoReparseTraversal (Join-Path $repo $entry.path) $repo "Supplemental source"
  $relative = [IO.Path]::GetRelativePath($repo, $source)
  if ([IO.Path]::IsPathRooted($relative) -or $relative -eq ".." -or $relative.StartsWith("..\")) {
    throw "Supplemental source has an invalid relative path: $source"
  }
  $item = Get-Item -LiteralPath $source -Force
  if ($item.PSIsContainer) { throw "Supplemental source is not a file: $source" }
  $items += [pscustomobject]@{ Source = $source; Relative = $relative; Bytes = $item.Length; Sha256 = (Get-Sha256 $source); RemoveSource = [bool]$entry.removeSource }
}

if ((@($items | Select-Object -ExpandProperty Relative | Sort-Object -Unique).Count) -ne $items.Count) {
  throw "Archive contains duplicate relative paths"
}

if (-not (Test-Path -LiteralPath $archive)) {
  New-Item -ItemType Directory -Path $archive -Force | Out-Null
}
Assert-NoReparseTraversal $archive $archiveParent "Archive root" | Out-Null

foreach ($item in $items) {
  $destination = Assert-WithinRoot (Join-Path $archive $item.Relative) $archive "Archive destination"
  $parent = Split-Path -Parent $destination
  if (-not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }
  Assert-NoReparseTraversal $parent $archive "Archive destination parent" | Out-Null
  if (Test-Path -LiteralPath $destination) {
    if ((Get-Item -LiteralPath $destination -Force).PSIsContainer) { throw "Archive destination is a directory: $destination" }
    if ((Get-Sha256 $destination) -ne $item.Sha256) { throw "Existing archive file differs: $destination" }
  } else {
    Copy-Item -LiteralPath $item.Source -Destination $destination -ErrorAction Stop
  }
}

foreach ($item in $items) {
  $destination = Assert-NoReparseTraversal (Join-Path $archive $item.Relative) $archive "Archive verification"
  $destinationItem = Get-Item -LiteralPath $destination -Force
  if ($destinationItem.Length -ne $item.Bytes -or (Get-Sha256 $destination) -ne $item.Sha256) {
    throw "Archive verification failed: $destination"
  }
}

$removed = 0
foreach ($item in $items | Where-Object RemoveSource) {
  $source = Assert-NoReparseTraversal $item.Source $repo "Exact source removal"
  Remove-Item -LiteralPath $source -Force
  if (Test-Path -LiteralPath $source) { throw "Exact source removal failed: $source" }
  $removed++
}

[pscustomobject]@{
  archivedFiles = $items.Count
  archivedBytes = ($items | Measure-Object -Property Bytes -Sum).Sum
  removedSources = $removed
  archiveRoot = $archive
} | ConvertTo-Json -Compress
