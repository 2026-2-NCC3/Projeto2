# Guia técnico da Entrega 2

Este guia descreve o ambiente verificável do Próxima Etapa e complementa a documentação histórica. A demonstração local usa Android Java/XML, Express com SQLite e painel React/Vite.

## Execução local

Use Node.js 24, o lockfile de cada módulo, o Gradle Wrapper e o SDK Android configurado no projeto. No backend, defina `JWT_SECRET` em `.env` privado e `DB_PATH` apontando para um banco de demonstração separado. Gere uma chave própria. Execute `npm ci`, `npm run db:init` somente em banco vazio e `npm start`. Para bases existentes, siga o procedimento de backup e migração explícita. O comando `npm run seed:admin` requer as variáveis locais `ADMIN_EMAIL` e `ADMIN_PASSWORD`. [Procedimento do banco](../src/Entrega%202/Backend2.0/database/MIGRATIONS.md)

No painel, execute `npm ci` e `npm run dev`. O cliente usa `VITE_API_URL` quando definido e `http://localhost:3000` por padrão. Para validar o artefato de produção localmente, execute `npm run build` e `npm run preview`. [Guia do painel](../src/Entrega%202/Painel%20Administrativo2.0/BUILD.md)

No Android, gere o debug com `gradlew.bat :app:assembleDebug`. Encaminhe a porta com `adb -s emulator-5554 reverse tcp:3000 tcp:3000` para um backend local com dados fictícios. O endereço no app é `http://127.0.0.1:3000`. Use o serial do dispositivo de teste. O APK está em `app/build/outputs/apk/debug/app-debug.apk`.

Para compilar release com uma URL de demonstração autorizada, forneça `-PproximaReleaseApiUrl=https://HOST_AUTORIZADO` a `gradlew.bat :app:assembleRelease :app:bundleRelease`. Substitua o exemplo pela URL real. O release exige HTTPS para o tráfego e exibe uma mensagem de configuração se a URL estiver ausente. Os artefatos gerados localmente exigem assinatura autorizada para distribuição como release. O APK debug assinado pelo SDK serve para validação local.

## Contratos REST dos fluxos demonstrados

Para o catálogo completo de métodos, permissões, parâmetros e respostas, consulte os [contratos REST da Entrega 2](API_REST_ENTREGA2.md).

Envie JSON em requisições com corpo e `Authorization: Bearer <token>` nas operações protegidas. O servidor verifica assinatura, expiração e papel atual no banco. O token da sessão e o token do QR têm finalidades diferentes.

| Método e rota | Acesso | Entrada e resposta relevantes |
| --- | --- | --- |
| GET `/api/health` | Público | 200 com estado online ou 503 se o banco estiver indisponível |
| POST `/auth/login` | Público | `email` e `senha`; devolve `token` e `usuario` |
| POST `/api/profiles` | Público | Cadastro com `nome_completo`, `email`, `senha` e `consentimento_lgpd`; cria conta de aluno |
| GET/PUT `/api/profiles/me` | Autenticado | Consulta ou atualização autorizada do próprio perfil |
| GET `/api/cursos` | Público | Catálogo persistido |
| GET `/api/agenda` | Aluno | Agenda pessoal; filtro opcional `curso_id` |
| GET `/api/inscricoes/minhas` | Aluno | Inscrições da sessão |
| POST `/api/presencas/qr-token` | Administrador | `atividade_id`, `valido_de`, `valido_ate` em UTC; 201 com `qr_token` |
| POST `/api/presencas/check-in` | Aluno | Somente `qr_token`; 201 na criação ou 200 na repetição válida |
| GET `/api/presencas/minhas` | Aluno | Histórico de presenças persistidas |
| GET `/api/certificados/minhas` e `/api/certificados` | Aluno e administrador, respectivamente | Metadados; arquivo indisponível até haver armazenamento validado |
| GET `/api/mensagens/minhas` | Aluno | Comunicados publicados e autorizados para a sessão |
| GET `/api/mensagens/:id` | Aluno destinatário ou administrador | Detalhe autorizado |
| GET/POST `/api/mensagens`; PUT/DELETE `/api/mensagens/:id` | Administrador | Lista ou cria rascunho; edição e exclusão restritas a rascunhos |
| POST `/api/mensagens/:id/publicar` | Administrador | Corpo vazio; fixa destinatários e grava alertas na mesma transação |
| PUT `/api/mensagens/:id/leitura` | Aluno destinatário | Corpo vazio; confirmação de leitura do comunicado |
| POST `/api/notificacoes/sincronizar` | Aluno | Corpo vazio; reconcilia eventos reais e devolve os alertas autorizados |
| GET `/api/notificacoes/minhas` e `/api/notificacoes/:id` | Aluno destinatário | Lista ou detalhe com destino interno autorizado |
| PUT `/api/notificacoes/:id/leitura` | Aluno destinatário | Corpo vazio; confirmação independente da leitura do comunicado |

Erros de entrada retornam 400. Sessão ausente ou inválida retorna 401. Papel insuficiente retorna 403. Um recurso ausente ou ocultado por isolamento pode retornar 404. Operações sobre rascunhos incompatíveis com o estado publicado retornam 409. Os módulos de rotas e os testes de integração registram os detalhes das validações. [Rotas do backend](../src/Entrega%202/Backend2.0/src/routes)

## Repetição dos testes

Execute `npm test` no backend, `node --test --test-concurrency=1 test/*.test.js` e `npm run build` no painel. No Android, execute `gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest :app:testDebugUnitTest :app:lintDebug`. Rode separadamente os scripts `test-presence-api.cjs`, `test-certificates-api.cjs`, `test-messages-api.cjs` e `test-notifications-api.cjs` com `node scripts/<arquivo> <serial>`. Eles executam o servidor Express real com bancos temporários e restauram o encaminhamento ADB anterior.

Na demonstração, entre com um aluno fictício, abra Cursos e Agenda, emita o QR no painel com um administrador fictício, faça o check-in e confira o histórico. Interrompa a conexão depois da confirmação para verificar a consulta local e reconecte para reconciliar os dados. Repita com outra conta para demonstrar o isolamento. O aplicativo não confirma presença nem leitura sem resposta da API.

## Technical overview

The Android client uses Java, XML and SQLite. The Express API authenticates protected requests and derives the student identity from the verified session. An administrator issues a time-bound QR token for a specific activity. The server checks the student's enrollment and records attendance in a transaction. The mobile client stores the confirmed result and refreshes the attendance history after reconnecting. Administrative announcements and student notifications share the same publication flow. The certificate interface exposes metadata while authorized file storage is pending. Use fictional accounts and an isolated database for demonstrations.
