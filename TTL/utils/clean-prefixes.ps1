param(
    [string]$PrefixFilePath = (Join-Path $PSScriptRoot 'prefixes.ttl'),
    [string]$TargetFile = '',
    [string]$TargetDir = '',
    [string[]]$TargetPattern = @('*.ttl', '*.shacl'),
    [switch]$DryRun,
    [switch]$SkipBackup
)

if (-not (Test-Path -LiteralPath $PrefixFilePath)) {
    $fallbackPrefix = Join-Path (Split-Path -Parent $PSScriptRoot) 'prefixes.ttl'
    if (Test-Path -LiteralPath $fallbackPrefix) {
        $PrefixFilePath = (Resolve-Path -LiteralPath $fallbackPrefix).Path
    } else {
        throw "Prefix source file not found: $PrefixFilePath"
    }
}

$prefixFileLines = Get-Content -LiteralPath $PrefixFilePath
$prefixPattern = '^[ \t]*@prefix\s+([A-Za-z][\w\-]*)\:\s*<([^>]+)>\s*\.'

$prefixEntries = @()
$prefixMap = @{}

foreach ($line in $prefixFileLines) {
    if ($line -match $prefixPattern) {
        $prefixName = $matches[1]
        $prefixEntries += [PSCustomObject]@{ Type = 'prefix'; Prefix = $prefixName; Line = $line }
        $prefixMap[$prefixName] = $line
    } elseif ($line -match '^[ \t]*@base\b') {
        $prefixEntries += [PSCustomObject]@{ Type = 'base'; Line = $line }
    } else {
        $prefixEntries += [PSCustomObject]@{ Type = 'other'; Line = $line }
    }
}

if ($prefixMap.Count -eq 0) {
    throw "No @prefix definitions were found in $PrefixFilePath"
}

function Resolve-Directory {
    param([string]$Directory)

    if ([string]::IsNullOrWhiteSpace($Directory)) {
        return $null
    }

    if (Test-Path -LiteralPath $Directory) {
        return (Resolve-Path -LiteralPath $Directory).Path
    }

    $candidate = Join-Path $PSScriptRoot $Directory
    if (Test-Path -LiteralPath $candidate) {
        return (Resolve-Path -LiteralPath $candidate).Path
    }

    throw "Target directory not found: $Directory"
}

$baseDirectories = @()
if ($TargetDir) {
    $resolvedDir = Resolve-Directory -Directory $TargetDir
    $baseDirectories += $resolvedDir
} else {
    $baseDirectories += (Resolve-Path -LiteralPath $PSScriptRoot).Path
}

$files = @()

function Expand-Patterns {
    param(
        [string[]]$Patterns,
        [string[]]$Directories
    )

    $expanded = @()
    foreach ($dir in $Directories) {
        $searchPath = Join-Path $dir '*'
        $expanded += Get-ChildItem -Path $searchPath -Recurse -File -Include $Patterns -ErrorAction SilentlyContinue
    }
    return $expanded
}

if ($TargetFile) {
    $candidateFiles = @()

    $rawCandidates = $TargetFile -split ';|,' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    if ($rawCandidates.Count -eq 0) { $rawCandidates = @($TargetFile) }

    foreach ($candidate in $rawCandidates) {
        $resolved = $null
        $candidatePaths = @($candidate)

        if (-not [System.IO.Path]::IsPathRooted($candidate)) {
            foreach ($dir in $baseDirectories) {
                $candidatePaths += (Join-Path $dir $candidate)
            }
            $candidatePaths += (Join-Path $PSScriptRoot $candidate)
        }

        foreach ($path in ($candidatePaths | Select-Object -Unique)) {
            $item = Get-Item -LiteralPath $path -ErrorAction SilentlyContinue
            if ($item) {
                $resolved = $item
                break
            }
        }

        if ($resolved) {
            $candidateFiles += $resolved
        } else {
            $files += Expand-Patterns -Patterns @($candidate) -Directories $baseDirectories
        }
    }

    if ($candidateFiles.Count -gt 0) {
        $files += $candidateFiles
    }
} else {
    $files += Expand-Patterns -Patterns $TargetPattern -Directories $baseDirectories
}

$files = $files | Sort-Object -Property FullName -Unique

if (-not $files -or $files.Count -eq 0) {
    Write-Host "No TTL/SHACL files found to process."
    return
}

$prefixSourceFullPath = (Resolve-Path -LiteralPath $PrefixFilePath).Path

$usageRegex = [regex]'([A-Za-z][\w\-]*)\:'

foreach ($file in $files) {
    if ((Resolve-Path -LiteralPath $file.FullName).Path -eq $prefixSourceFullPath) {
        continue
    }

    Write-Host "Processing $($file.FullName)" -ForegroundColor Cyan

    $originalLines = Get-Content -LiteralPath $file.FullName

    $linesWithoutPrefixes = @()
    foreach ($line in $originalLines) {
        if ($line -match '^[ \t]*@prefix\b') {
            continue
        }
        $linesWithoutPrefixes += $line
    }

    $joinedContent = [string]::Join("`n", $linesWithoutPrefixes)
    $usedPrefixes = New-Object System.Collections.Generic.HashSet[string]

    foreach ($match in $usageRegex.Matches($joinedContent)) {
        $prefixName = $match.Groups[1].Value
        if (-not $prefixMap.ContainsKey($prefixName)) { continue }

        $index = $match.Index
        if ($index -gt 0) {
            $prevChar = $joinedContent[$index - 1]
            if ($prevChar -eq '<' -or $prevChar -eq ':') { continue }
        }

        $null = $usedPrefixes.Add($prefixName)
    }

    $selectedLines = @()
    $pendingHeader = @()

    foreach ($entry in $prefixEntries) {
        if ($entry.Type -eq 'other') {
            $pendingHeader += $entry.Line
            continue
        }

        if ($entry.Type -eq 'base') {
            continue
        }

        if ($usedPrefixes.Contains($entry.Prefix)) {
            if ($pendingHeader.Count -gt 0) {
                $selectedLines += $pendingHeader
                $pendingHeader = @()
            }
            $selectedLines += $prefixMap[$entry.Prefix]
        }
    }

    # trailing headers with no prefixes are discarded

    if ($selectedLines.Count -gt 0 -and $selectedLines[-1].Trim().Length -ne 0) {
        $selectedLines += ''
    }

    $filteredLines = $linesWithoutPrefixes
    $insertIndex = 0
    $lastBaseIndex = -1
    $placed = $false

    for ($i = 0; $i -lt $filteredLines.Count; $i++) {
        $trimmed = $filteredLines[$i].Trim()
        if ($trimmed.Length -eq 0 -or $trimmed.StartsWith('#')) {
            continue
        }

        if ($trimmed -like '@base*') {
            $lastBaseIndex = $i
            continue
        }

        if ($lastBaseIndex -ge 0) {
            $insertIndex = $lastBaseIndex + 1
        } else {
            $insertIndex = $i
        }
        $placed = $true
        break
    }

    if (-not $placed) {
        if ($lastBaseIndex -ge 0) {
            $insertIndex = $lastBaseIndex + 1
        } else {
            $insertIndex = $filteredLines.Count
        }
    }

    $newContent = @()
    if ($insertIndex -gt 0) {
        $newContent += $filteredLines[0..($insertIndex - 1)]
    }
    if ($selectedLines.Count -gt 0) {
        $newContent += $selectedLines
    }
    if ($insertIndex -lt $filteredLines.Count) {
        $newContent += $filteredLines[$insertIndex..($filteredLines.Count - 1)]
    }

    $originalJoined = [string]::Join("`n", $originalLines)
    $newJoined = [string]::Join("`n", $newContent)

    if ($originalJoined -eq $newJoined) {
        Write-Host "  No changes required." -ForegroundColor DarkGray
        continue
    }

    if (-not $DryRun) {
        if (-not $SkipBackup) {
            Copy-Item -LiteralPath $file.FullName -Destination "$($file.FullName).bak" -Force
        }
        Set-Content -LiteralPath $file.FullName -Value $newContent
        Write-Host "  Updated prefixes: $($usedPrefixes.Count) included." -ForegroundColor Green
    } else {
        Write-Host "  DRY RUN: would update prefixes (using $($usedPrefixes.Count) entries)." -ForegroundColor Yellow
    }
}
