# Revisao de legibilidade da Entrega 2

Base da revisao: f056294, branch fix/p0-seguranca-entrega2. Git estava limpo.
Nenhum AGENTS.md aplicavel foi encontrado nos ancestrais ou na Entrega 2.
Foram mapeados 39 arquivos JS do backend, 26 arquivos Java/Kotlin do Android
(incluindo configuracoes e testes) e 20 arquivos JS/JSX do painel, alem dos
recursos Android relacionados. O objetivo foi clareza, nao alterar regras.
Dependencias, Entrega 1, arquivos gerados, SQL de migracoes e contratos do esquema
ficam fora das edicoes. Compilacoes e testes de referencia passaram antes de editar.

## Backend

Guardas e autorizacoes foram expandidas com chaves. Chamadas de auditoria foram
separadas em campos por linha. O executor de migracoes ganhou nomes explicitos
(schemaObjects, normalizeSchemaSql, latestVersion) e fluxo mais facil de acompanhar.
O texto de historySql foi conferido sem alteracao; arquivos SQL e checksums nao
foram modificados. Limites existentes de credenciais receberam constantes nomeadas.
Nos testes, cada assercao ocupa uma instrucao, respostas recebem nomes por cenario,
e o helper distingue criacao dos usuarios ficticios, espera do servidor e requisicao.
Os aliases retornados pelo helper e os contratos HTTP permaneceram iguais.

Validacao: npm test — 15 testes aprovados antes e depois. A suite inclui banco
vazio/populado, rollback, WAL, concorrencia, startup repetido, papeis e privacidade.
git diff --check passou. Os valores literais foram conferidos durante as expansoes.

Arquivos alterados nesta area:
- src/Entrega 2/Backend2.0/src/config/migrationRunner.js
- src/Entrega 2/Backend2.0/src/controllers/adminController.js
- src/Entrega 2/Backend2.0/src/controllers/atividadesController.js
- src/Entrega 2/Backend2.0/src/controllers/authController.js
- src/Entrega 2/Backend2.0/src/controllers/inscricoesController.js
- src/Entrega 2/Backend2.0/src/controllers/profilesController.js
- src/Entrega 2/Backend2.0/src/middlewares/authMiddleware.js
- src/Entrega 2/Backend2.0/src/routes/agendaRoutes.js
- src/Entrega 2/Backend2.0/src/routes/presencasRoutes.js
- src/Entrega 2/Backend2.0/src/utils/credentials.js
- src/Entrega 2/Backend2.0/test/agenda.test.js
- src/Entrega 2/Backend2.0/test/auth.test.js
- src/Entrega 2/Backend2.0/test/helpers/api.js
- src/Entrega 2/Backend2.0/test/history.test.js
- src/Entrega 2/Backend2.0/test/seed.test.js

## Mapeamento das outras areas

- Android: ApiRecords, DataListActivity, SnapshotStore, SessionManager, ApiClient,
  SyncGate, atividades de lista e seus testes concentram blocos comprimidos,
  nomes genericos e metodos que misturam parse, exibicao, persistencia e sincronizacao.
- Painel: JSX concentrado em linhas extensas nos formularios/listagens; callbacks
  compactos; ternarios aninhados em salvar/atualizar listas; testes de build comprimidos.
- Codigo que ja estava claro e recursos sem necessidade de mudanca sao preservados.

## Possiveis bugs separados da refatoracao

- Cadastro publico com senha de tipo invalido responde 500 generico (ja documentado
  e coberto pela suite). Melhorar a validacao seria mudanca funcional e nao foi feito.
- ApiRecords aceita alguns valores numericos fracionarios de carga horaria porque
  usa Number.intValue para a verificacao de sinal. Nao foi alterada essa regra.
- SnapshotStore ignora o retorno de delete() na limpeza; pode deixar arquivos
  residuais se o armazenamento negar a exclusao. A politica de erros foi preservada.

Esses pontos nao foram corrigidos silenciosamente nesta tarefa.

## Android

ApiRecords ganhou listas de campos nomeadas, validacao e copia separadas e nomes
como recordType, projectedRecord e allowedFields. Os nomes publicos, campos JSON,
Snapshot.data e o fallback de tipos desconhecidos foram preservados. SnapshotStore
mantem synchronized(SnapshotStore.class), publicacao por rename, fsync, formato e
isolamento, com leitura/publicacao/limpeza divididas em metodos. Falhas de exclusao
continuam com a politica original; falha no rename de publicacao continua sendo erro.
DataListActivity separa navegacao, ciclo de sincronizacao, estados HTTP, persistencia
e criacao de cards. Constantes mantem as mesmas medidas em px e sp; nenhum recurso
Android, texto de tela, versao, permissao ou configuracao de compilacao foi alterado.

Validacao: cinco testes de caracterizacao adicionados para lacunas reais (allowlists,
nulos, campos ausentes, fallback, dono e versao do envelope). Os mesmos 17 testes
JUnit passaram contra as classes originais f056294 recuperadas em pasta temporaria
e contra as classes refatoradas. Os testes tambem foram executados pelo Gradle.
assembleDebug, bundleRelease e lintDebug passaram. A pasta antiga de resultados
do Gradle falhou ao ser excluida pelo sistema de arquivos; um init script temporario
redirecionou apenas os resultados dos testes, sem alterar configuracao versionada.
Nao foi um erro de assercao ou compilacao. Nao houve validacao visual em dispositivo.

Arquivos alterados nesta area:
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/AgendaActivity.java
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/ApiClient.java
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/ApiRecords.java
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/CursosActivity.java
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/DataListActivity.java
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/HistoricoActivity.java
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/SessionManager.java
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/SnapshotStore.java
- src/Entrega 2/Frontend2.0/app/src/main/java/com/example/projetopi/SyncGate.java
- src/Entrega 2/Frontend2.0/app/src/test/java/com/example/projetopi/ApiRecordsTest.java
- src/Entrega 2/Frontend2.0/app/src/test/java/com/example/projetopi/SnapshotStoreTest.java
