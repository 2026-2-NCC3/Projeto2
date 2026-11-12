param([switch]$Offline)

$ErrorActionPreference = 'Stop'
$android = Join-Path $PSScriptRoot 'src/Entrega 2/Frontend2.0'
$destination = Join-Path $PSScriptRoot 'documentos/Entrega 2/Programação para Dispositivos Móveis'

Push-Location -LiteralPath $android
try {
    $gradleArguments = @(':app:assembleDebug', ':app:testDebugUnitTest', ':app:lintDebug')
    if ($Offline) {
        $gradleArguments += '--offline'
    }
    & .\gradlew.bat @gradleArguments
    if ($LASTEXITCODE -ne 0) {
        throw 'O build ou os testes Android falharam.'
    }

    $apk = & node -p "require('./scripts/debug-apks.cjs').apk"
    if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $apk -PathType Leaf)) {
        throw 'O APK debug não foi encontrado após o build.'
    }

    $fileName = 'proxima-etapa-entrega2.apk'
    $copied = Join-Path $destination $fileName
    Copy-Item -LiteralPath $apk -Destination $copied
    $hash = (Get-FileHash -LiteralPath $copied -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $fileName" | Set-Content -LiteralPath (Join-Path $destination 'CHECKSUM_APK.txt') -Encoding ascii
    Get-Item -LiteralPath $copied
}
finally {
    Pop-Location
}
