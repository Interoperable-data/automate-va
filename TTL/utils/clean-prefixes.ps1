param(
    [string]$PrefixFilePath = (Join-Path $PSScriptRoot 'prefixes.ttl'),
    [string]$TargetFile = '',
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

if ($TargetFile) {
    $files = @(Get-Item -LiteralPath $TargetFile)
} else {
    $files = Get-ChildItem -Path $PSScriptRoot -Recurse -Include *.ttl,*.shacl | Where-Object { -not $_.PSIsContainer }
}

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
