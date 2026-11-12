# Versionamento e bundle release local

A Entrega 2 define versionCode = 2 e versionName = 1.1.0 em defaultConfig do
modulo app. Sao os valores comuns de debug e release. Nao ha productFlavors,
versionNameSuffix, versionCodeOverride nem hooks androidComponents que alterem
esses campos no codigo versionado. Os arquivos raiz build.gradle.kts,
settings.gradle.kts, gradle.properties e catalogo de versoes nao os redefinem.
Nao foi alterado applicationId, minSdk, targetSdk, assinatura ou logica do app.

## Evidencia para os valores

- O commit e44d9db introduziu a Entrega 2 com versionCode 1 e versionName 1.0.
- O commit aa3c733 removeu esses campos (junto de targetSdk); por isso o bundle
  release passou a falhar com Version code not found in manifest.
- A Entrega 1 versionada usa codigo 1/nome 1.0. aapt2 dump badging confirmou
  os mesmos valores nos dois APKs historicos de documentos/Entrega 1.
- Nenhum codigo superior a 1 foi encontrado no historico Git disponivel desses
  arquivos. Codigo 2 e a proxima revisao local comprovavel; 1.1.0 identifica as
  novas integracoes de API, autenticacao, historico e cache sem renomear o app.

## Limite de publicacao

Nao houve acesso ao Google Play Console nem a outro registro de distribuicao.
Nao foi comprovado o maior versionCode ja publicado. Gerar um AAB local nao
comprova que codigo 2 sera aceito pela loja, que substituira uma versao instalada
ou que exista uma assinatura de producao compativel. Antes de publicar, o
responsavel deve consultar o maior codigo distribuido e escolher um inteiro
superior, revisar versionName/targetSdk e configurar a assinatura autorizada.
Nenhuma chave de release foi criada, acessada ou alterada nesta correcao.

## Reproducao e verificacao

Debug e release usam https://projeto2-krn7.onrender.com por padrao.
Para testes isolados, compile debug com -PproximaApiUrl=http://127.0.0.1:3000
e use adb reverse tcp:3000 tcp:3000; no emulador, tambem e permitido 10.0.2.2.
HTTP e permitido somente nesses hosts locais no debug. Release continua exigindo
HTTPS e pode ser configurado com -PproximaReleaseApiUrl=https://seu-backend.
Nao execute testes que gravam dados usando o endpoint de producao.

Com JAVA_HOME/ANDROID_HOME configurados, execute nesta pasta:

    ./gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:bundleRelease :app:lintDebug

O AAB local fica em app/build/outputs/bundle/release/app-release.aab e o APK debug
em app/build/outputs/apk/debug/app-debug.apk. AAB release sem signingConfig e
um artefato local nao assinado, distinto do APK assinado com Android Debug.
A validacao deve conferir manifests efetivos de debug/release, manifesto dentro
do AAB via bundletool, integridade do bundle e ausencia de assinatura release.
Os hashes e logs sao registrados em documentos/Entrega 2/evidencias, mantendo
os binarios na pasta de build ignorada pelo Git. Nao houve publicacao ou deploy.

A compilacao ainda avisa sobre AGP 9.0.1 versus compileSdk 37.0 e o lint registra
avisos preexistentes. Isso e separado da correcao dos campos de versao e nao
representa aprovacao para distribuicao em producao.
Referencia: https://developer.android.com/studio/publish/versioning.
