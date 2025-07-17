# PowerShell script to update all .ttl and .shacl files in the TTL folder with the canonical prefixes.ttl block

$prefixFile = Join-Path $PSScriptRoot 'prefixes.ttl'
$prefixBlock = Get-Content $prefixFile

# Find all .ttl and .shacl files recursively in the TTL folder
$files = Get-ChildItem -Path $PSScriptRoot -Recurse -Include *.ttl,*.shacl

foreach ($file in $files) {
    # Backup the original file
    Copy-Item $file.FullName "$($file.FullName).bak"

    # Read the file content
    $lines = Get-Content $file.FullName

    # Find where the prefix block ends (first non-@prefix/@base line)
    $prefixEnd = 0
    foreach ($line in $lines) {
        if ($line -match '^[ \t]*(@prefix|@base)\\b') {
            $prefixEnd++
        } else {
            break
        }
    }

    # Compose new content: prefix block + rest of file (skipping old prefix block)
    $newContent = $prefixBlock + $lines[$prefixEnd..($lines.Count - 1)]

    # Write back to the file
    Set-Content $file.FullName $newContent
}

Write-Host "All .ttl and .shacl files in TTL have been updated with the canonical prefixes block."
