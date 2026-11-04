param(
    [switch]$Watch,
    [string]$AdbPath = (Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe')
)

function Get-ReadyAndroidSerials {
    param([string[]]$Lines)
    foreach ($line in $Lines) {
        if ($line -match '^(\S+)\s+device(?:\s|$)') {
            $Matches[1]
        }
    }
}

function Connect-LocalAndroidApi {
    param([string]$Adb)
    $deviceLines = @(& $Adb devices -l 2>$null)
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel consultar os dispositivos ADB.' }
    foreach ($serial in @(Get-ReadyAndroidSerials -Lines $deviceLines)) {
        $mappings = @(& $Adb -s $serial reverse --list 2>$null)
        if ($LASTEXITCODE -ne 0) { continue }
        $connected = @($mappings | Where-Object { $_ -match '(^|\s)tcp:3000\s+tcp:3000(\s|$)' }).Count -gt 0
        if (-not $connected) {
            $result = & $Adb -s $serial reverse tcp:3000 tcp:3000 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "API local conectada: $serial (porta 3000)."
            } else {
                Write-Warning "Nao foi possivel conectar $serial. Verifique a autorizacao USB."
            }
        }
    }
}

# Dot-source permite testar o parser sem conectar nem alterar dispositivos.
if ($MyInvocation.InvocationName -ne '.') {
    if (-not (Test-Path -LiteralPath $AdbPath -PathType Leaf)) {
        throw 'ADB nao encontrado. Informe -AdbPath com o executavel do Android SDK.'
    }
    if ($Watch) { Write-Host 'Monitor local ADB ativo. Mantenha o backend iniciado; Ctrl+C encerra o monitor.' }
    do {
        try { Connect-LocalAndroidApi -Adb $AdbPath }
        catch {
            if (-not $Watch) { throw }
            Write-Warning 'ADB indisponivel. A conexao sera verificada novamente.'
        }
        if ($Watch) { Start-Sleep -Seconds 2 }
    } while ($Watch)
}
