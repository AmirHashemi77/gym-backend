$ErrorActionPreference = "Stop"

function Normalize-EnvText {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ($null -eq $Value) {
        return $null
    }

    return ($Value -replace '[\uFEFF\u200E\u200F\u202A-\u202E\u2066-\u2069]', '').Trim()
}

function Parse-EnvEntries {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "Environment file '$Path' was not found."
    }

    $entries = New-Object System.Collections.Generic.List[object]

    Get-Content $Path | ForEach-Object {
        $line = Normalize-EnvText $_

        if (-not $line -or $line.StartsWith("#")) {
            return
        }

        $separatorIndex = $line.IndexOf("=")
        if ($separatorIndex -lt 1) {
            return
        }

        $name = Normalize-EnvText $line.Substring(0, $separatorIndex)
        $value = Normalize-EnvText $line.Substring($separatorIndex + 1)

        if (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        $entries.Add([PSCustomObject]@{
            Name = $name
            Value = $value
        })
    }

    return $entries
}

function Import-EnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    foreach ($entry in (Parse-EnvEntries $Path)) {
        $name = $entry.Name
        $value = $entry.Value
        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        Set-Item -Path "Env:$name" -Value $value
    }
}

function Sync-EnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$TargetPath
    )

    $content = foreach ($entry in (Parse-EnvEntries $SourcePath)) {
        $escapedValue = $entry.Value.Replace('\', '\\').Replace('"', '\"')
        "$($entry.Name)=""$escapedValue"""
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines((Resolve-Path $TargetPath), $content, $utf8NoBom)
}
