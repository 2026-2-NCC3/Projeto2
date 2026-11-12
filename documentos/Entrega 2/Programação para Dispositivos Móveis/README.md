# Programação para Dispositivos Móveis — Entrega 2

## Onde está o código do aplicativo

`src/Entrega 2/Frontend2.0`

Linguagem Java, UI Android XML com `ConstraintLayout`, arquitetura existente com Activities, Volley, cache SQLite e leitura QR Code ZXing. Os sistemas backend e painel continuam em `src/Entrega 2/Backend2.0` e `src/Entrega 2/Painel Administrativo2.0`.

## Onde deve estar o APK

Depois da compilação e dos testes, o script na raiz `GERAR_E_ORGANIZAR_APK_ENTREGA2.ps1` copia o APK recém-gerado para esta pasta com o nome:

`proxima-etapa-entrega2.apk`

O script também cria `CHECKSUM_APK.txt`. **Se esses arquivos não estiverem aqui, a entrega ainda não está pronta para a avaliação.** Não utilize APK histórico da Entrega 1 nem `app-debug.apk` anterior à migração.

## Passo a passo

1. Abra `src/Entrega 2/Frontend2.0` no Android Studio, configure Android SDK/JDK compatíveis e sincronize o Gradle. Instale Node.js para executar o script de empacotamento.
2. Em um PowerShell na raiz do repositório, execute `./GERAR_E_ORGANIZAR_APK_ENTREGA2.ps1`.
3. Confirme que os comandos `assembleDebug`, `testDebugUnitTest` e `lintDebug` terminaram sem erros.
4. Instale o APK no emulador/aparelho e teste login, cursos, agenda, QR, histórico, mensagens, notificações e certificados.
5. Execute os testes instrumentados, quando possível: `./gradlew.bat :app:connectedDebugAndroidTest` na pasta Android.
6. Confira o arquivo final e o hash na pasta desta disciplina.

A configuração debug usa `http://127.0.0.1:3000`; com o backend no computador e o dispositivo conectado, execute `adb reverse tcp:3000 tcp:3000`. O servidor deve estar iniciado. A política de rede permite HTTP **apenas para loopback em debug**; release permanece restrito a HTTPS.

## Atenção aos requisitos

A presença de um layout convertido não comprova todas as funcionalidades. Certificados PDFs oficiais, chat bidirecional, teste de perfil e a sincronização prevista na documentação precisam ser avaliados por evidências de execução; não foram inventados neste pacote.
