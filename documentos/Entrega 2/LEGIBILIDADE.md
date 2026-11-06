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

## Painel administrativo

Foram expandidos somente blocos JSX comprimidos dos formularios e modais,
sem reformatar os arquivos claros da area nem o projeto inteiro. A expansao
foi conferida pela arvore compilada para preservar textos, atributos, classes
e callbacks. Em Tests.jsx foram expandidos apenas os atributos extensos: o texto
foi mantido literalmente para nao introduzir espacos ou fragmentos adicionais.

As tres telas CRUD passaram a usar replaceOrPrependRecord para a mesma
politica anterior: edicao substitui correspondencias estritas, sem inserir um
ID ausente; criacao insere no inicio sem deduplicar implicitamente. Quatro
testes cobrem imutabilidade, ordem, referencias, duplicatas e tipos de IDs.
Handlers de alunos foram expandidos, erros mantem as mesmas mensagens e a
selecao de API criar/atualizar usa condicionais explicitas. Alternativas de
perguntas usam guardas e nomes como questionId e alternativeId. O timer de
toasts ganhou constante nomeada e configuracoes de site ganharam chaves
explicitas sem trocar valores, URL da API ou funcionamento do preview.

Validacao: npm test — 9 testes aprovados (5 de build existentes e 4 da politica
de listas); npm run build aprovado. Os testes verificam API padrao/explicita,
recursos estaticos na raiz e em subdiretorio, configuracao Figma e erros. Doze
cenarios dos callbacks de alternativas foram comparados ao codigo original
com IDs presentes, ausentes e de tipos diferentes, sem diferencas ou mutacao
dos dados de entrada. Ajustes finais de terminadores preservaram a AST.
O aviso de bundle maior que 500 kB ja existia e continua registrado.

Arquivos alterados nesta area:
- src/Entrega 2/Painel Administrativo2.0/config/site-config.js
- src/Entrega 2/Painel Administrativo2.0/src/components/Navbar.jsx
- src/Entrega 2/Painel Administrativo2.0/src/components/Toast.jsx
- src/Entrega 2/Painel Administrativo2.0/src/pages/Certificates.jsx
- src/Entrega 2/Painel Administrativo2.0/src/pages/Courses.jsx
- src/Entrega 2/Painel Administrativo2.0/src/pages/Login.jsx
- src/Entrega 2/Painel Administrativo2.0/src/pages/Messages.jsx
- src/Entrega 2/Painel Administrativo2.0/src/pages/Reports.jsx
- src/Entrega 2/Painel Administrativo2.0/src/pages/Students.jsx
- src/Entrega 2/Painel Administrativo2.0/src/pages/Tests.jsx
- src/Entrega 2/Painel Administrativo2.0/src/pages/Universities.jsx
- src/Entrega 2/Painel Administrativo2.0/src/utils/records.js
- src/Entrega 2/Painel Administrativo2.0/test/build.test.js
- src/Entrega 2/Painel Administrativo2.0/test/records.test.js

Possivel bug adicional mantido fora desta refatoracao: IDs de toast gerados
somente com Date.now podem colidir quando duas notificacoes sao criadas no
mesmo milissegundo. Nao foi alterada a geracao de IDs nesta tarefa.

## Exemplos representativos

Android, antes:

```java
for(String field:allowed) if(item.has(field)) safe.put(field,item.get(field));
```

Android, depois, em copyAllowedFields:

```java
for (String field : allowedFields) {
    if (record.has(field)) {
        projectedRecord.put(field, record.get(field));
    }
}
```

Backend, antes:

```js
const old=token('a1'); db.prepare("UPDATE alunos SET bloqueado=1 WHERE usuario_id='a1'").run();
```

Backend, depois:

```js
const tokenBeforeBlocking = token("a1");
db.prepare("UPDATE alunos SET bloqueado=1 WHERE usuario_id='a1'").run();
```

Painel, antes:

```js
setCursos((atuais) => cursoEmEdicao ? atuais.map((curso) => curso.id === salvo.id ? salvo : curso) : [salvo, ...atuais]);
```

Painel, depois:

```js
setCursos((cursosAtuais) => replaceOrPrependRecord(
    cursosAtuais, cursoSalvo, Boolean(cursoEmEdicao)
));
```

O helper tem um if explicito para criacao e um map com nomes do dominio para
edicao; seus casos de comportamento estao em test/records.test.js.

## Conferencia final e limites

- Backend: 15 testes aprovados. Android: 17 testes JUnit aprovados, builds debug
  e release e lint aprovados. Painel: 9 testes e build aprovados.
- Permanecem os 263 avisos de lint Android, o aviso AGP/SDK e o aviso de tamanho
  do bundle do painel. Nao foram ocultados ou tratados como novas regras.
- Nenhuma dependencia, migracao, checksum, schema.sql, recurso/ID Android,
  permissao, versao ou arquivo de build versionado foi alterado.
- O contrato textual de schema_migrations permaneceu identico. A referencia main
  foi comparada com a referencia inicial e permaneceu em e44d9db.
- Arquivos de build foram somente gerados pelas ferramentas de validacao e nao
  entram nos commits. Hashes dos artefatos de validacoes anteriores sao historicos;
  nao se pretende que os novos binarios tenham identidade de bytes com os antigos.
- Nenhum banco real foi aberto ou alterado. Nao houve push, deploy ou mudanca em main.
- Nao foram feitos testes visuais em dispositivo. Os possiveis bugs listados acima
  continuam pendentes de uma tarefa funcional separada.
