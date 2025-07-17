# PowerShell script to update .ttl/.shacl files with a canonical prefixes block, supporting optional arguments
# Update all files (default)
# > .\update-prefixes.ps1

# Update a specific file with a specific prefixes file
# > .\update-prefixes.ps1 -PrefixFilePath "my-prefixes.ttl" -TargetFile "testfile.ttl"


param(
    [string]$PrefixFilePath = $(Join-Path $PSScriptRoot 'prefixes.ttl'),
    [string]$TargetFile = ''
)

$prefixBlock = Get-Content $PrefixFilePath

if ($TargetFile) {
    $files = @(Get-Item -Path $TargetFile)
} else {
    # Find all .ttl and .shacl files recursively in the TTL folder
    $files = Get-ChildItem -Path $PSScriptRoot -Recurse -Include *.ttl,*.shacl
}

foreach ($file in $files) {
    # Backup the original file
    Copy-Item $file.FullName "$($file.FullName).bak"

    # Read the file content
    $lines = Get-Content $file.FullName

    # Find the index of the first @prefix or @base line (PowerShell compatible)
    $firstPrefixIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^[ \t]*(@prefix|@base)\b') {
            $firstPrefixIdx = $i
            break
        }
    }
    if ($firstPrefixIdx -eq -1) {
        # No prefix block found, just prepend the prefix block after comments/blank lines
        $newContent = $prefixBlock + $lines
    } else {
        # Find where the prefix block ends (first non-@prefix/@base line after the first)
        $prefixEnd = $firstPrefixIdx
        for ($i = $firstPrefixIdx; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^[ \t]*(@prefix|@base)\b') {
                $prefixEnd = $i
            } else {
                break
            }
        }
        # Compose new content: preserve initial comments/blank lines, insert prefix block, then rest of file
        $newContent = @()
        if ($firstPrefixIdx -gt 0) {
            $newContent += $lines[0..($firstPrefixIdx-1)]
        }
        $newContent += $prefixBlock
        if ($prefixEnd+1 -lt $lines.Count) {
            $newContent += $lines[($prefixEnd+1)..($lines.Count-1)]
        }
    }

    # Write back to the file
    Set-Content $file.FullName $newContent
}

if ($TargetFile) {
    Write-Host "Updated $TargetFile with the canonical prefixes block."
} else {
    Write-Host "All .ttl and .shacl files in TTL have been updated with the canonical prefixes block, preserving initial comments and blank lines."
}
