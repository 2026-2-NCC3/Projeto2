# Entrega 2: verificacoes, evidencias e pendencias

Validacao realizada em 01/11/2026, na branch fix/p0-seguranca-entrega2,
sobre o repositorio principal. Nenhum banco real foi aberto, migrado ou alterado.
Nao houve deploy, push, force-push ou alteracao de main.

## Fontes e limites dos requisitos

O README descreve cursos, atividades, agenda, presenca, certificados, mensagens
e perfil. O arquivo src/Entrega 2/Painel Administrativo2.0/src/imports/pasted_text/admin-panel-spec.md
faz referencia a RFM01-RFM15 e ao roteiro academico, mas e uma especificacao
importada de painel, nao a rubrica oficial da FECAP. Foram usados como fontes
diretas os Prompts 2-7 fornecidos pelo usuario, o codigo e o schema v5 original.
A pasta documentos/Entrega 2 continha apenas cinco arquivos de convite/template;
nao foi localizada nela uma rubrica ou especificacao oficial detalhada.
Nao foram inventados criterios de avaliacao nem declarada conformidade integral
com um roteiro ausente. Os identificadores UC abaixo sao rotulos tecnicos locais.

## Matriz de implementacao e evidencias

| Pedido / UC local | Implementacao atual | Verificacao efetiva | Situacao |
| --- | --- | --- | --- |
| P2 / UC-Login | Login bcrypt, JWT HS256 com expiracao, estado e papel lidos do SQLite em cada requisicao protegida | test/auth.test.js: sem token, invalido, expirado, login, bloqueio, inativacao, exclusao, mudanca de papel | Aprovado no backend |
| P2 / UC-Perfil | /api/profiles/me deriva identidade da sessao; outros IDs restritos ao dono ou admin; listagem e bloqueio so admin | test/auth.test.js: proprio, outro aluno, tentativa de elevar papel, admin autorizado, operador sem gestao de admins, erros sem dados internos | Aprovado no backend |
| P3 / UC-Provisionar | Seed manual, email valido e senha 12 caracteres/72 bytes, bcrypt custo 12, transacao, duplicatas recusadas | test/seed.test.js: configuracao ausente/invalida, criacao, repeticao sem troca de hash/papel, startup sem seed | Aprovado; rotacao real pendente |
| P4 / UC-Cursos | CursosActivity -> ApiClient -> /api/cursos; campos nulos/carga zero aceitos; ID persistido filtra navegacao para agenda | test/agenda.test.js e ApiRecordsTest; assembleDebug | API e compilacao aprovadas; visual pendente |
| P4 / UC-Agenda | /api/agenda usa aluno autenticado e inscricoes inscrito/cursando; curso cancelado excluido; ordenacao por data/hora | test/agenda.test.js: dois alunos, ID forjado, aluno sem inscricao, filtro, cancelamento e admin sem agenda pessoal | Backend aprovado |
| P5 / UC-Historico | /api/presencas/minhas e /alunos/:id; HistoricoActivity aberta pela agenda | test/history.test.js: historico persistido, outro aluno negado, admin autorizado, bloqueio imediato | Consulta aprovada; QR incompleto |
| P5 / UC-Checkin | Emissao, validade e horario de check-in ainda sem regra confirmada | Pergunta de negocio enviada ao usuario; nenhuma regra presumida | Pendente; nao ha endpoint de check-in ou scanner implementado |
| P6 / UC-Offline | SnapshotStore privado, dados validados por usuario/origem/rota, publicacao completa, sincronizacao ao abrir/reconectar/manualmente | SnapshotStoreTest: 7 casos; ApiRecordsTest: 5 casos; compilacao debug | JVM aprovado; cenarios visuais de rede/sessao pendentes |
| P7 / Reproducao | Comandos e limitacoes neste documento, README e guias de banco/admin/cache | Logs reais em evidencias/ | Evidencias organizadas; entrega integral nao aprovada |

Os testes do backend usam bancos temporarios, usuarios ficticios e servidores
HTTP em porta efemera. Nao usam a base de producao. O teste de historico insere
uma presenca ficticia diretamente no fixture e comprova a consulta/autorizacao;
ele nao comprova o fluxo QR nem representa um registro feito pelo aplicativo.

## Comandos executados e resultados

| Local | Comando | Resultado |
| --- | --- | --- |
| Backend2.0 | npm ci; npm test | 15 testes, 15 aprovados, zero falhas |
| Backend2.0 | node --check server.js; node --check src/config/migrationRunner.js | Aprovado na revisao da missao inicial; sintaxe tambem carregada pela suite atual |
| Frontend2.0 | gradlew.bat :app:assembleDebug :app:testDebugUnitTest | BUILD SUCCESSFUL; 12 testes JVM, zero falhas |
| Frontend2.0 | gradlew.bat :app:lintDebug | BUILD SUCCESSFUL; zero erros, 263 avisos |
| Frontend2.0 | gradlew.bat :app:bundleRelease | Falhou: Version code not found in manifest |
| Painel Administrativo2.0 | npm ci; npm run build | Dependencias instaladas; build falhou ao resolver ./.figma/make/site.json |
| API configurada | GET http://127.0.0.1:3000/api/health | Sem resposta disponivel. Os health checks dos servidores temporarios passaram |
| Android | adb devices | Nenhum dispositivo/emulador conectado |
| Git | git diff --check | Aprovado nos arquivos preparados para cada commit |

Ambiente: Node.js v24.21.0, SQLite 3.53.1, JBR do Android Studio, SDK local com
plataforma 37.0, Gradle wrapper 9.5.0, Android Gradle Plugin 9.0.1. O plugin avisa
que foi testado ate SDK 36.1; esse aviso nao foi silenciado nem ocultado. Os 263
avisos de lint incluem materiais e layouts existentes; o lint nao e prova de
funcionamento visual, seguranca integral ou aprovacao academica.

Logs sanitizados: [backend](evidencias/backend-tests.txt),
[Android debug/testes/lint](evidencias/android-debug-tests-lint.txt),
[falha de release](evidencias/android-release-falha.txt),
[falha do painel](evidencias/painel-build-falha.txt).
A execucao final do Gradle aproveitou tarefas e resultados incrementais validos;
a primeira execucao dos testes JVM e da compilacao tambem passou.

## Artefatos encontrados e gerados

O APK atual esta em src/Entrega 2/Frontend2.0/app/build/outputs/apk/debug/app-debug.apk.
Tem 5.916.310 bytes e SHA-256
493b47c67e4a524e56136c4c83e941cd7759fe4aeb27fccb25ecdd88001e1523.
Foi verificado pelo apksigner e esta assinado como Android Debug. E um APK de
desenvolvimento; nao e release, nao foi instalado em dispositivo nem publicado.
O arquivo permanece na pasta de build ignorada pelo Git, evitando duplicar
binarios no historico. Os APKs em documentos/Entrega 1 sao historicos e nao sao
prova desta Entrega 2. Nenhum AAB release valido foi gerado nesta validacao.
Veja tambem [metadados do artefato](evidencias/artefato-android.json).

## Falhas e pendencias externas ou fora do escopo desta validacao

1. QR: falta confirmar emissor, janela e validade. Proposta enviada: admin_operador
   ou admin_super emite QR por atividade, valido por cinco minutos e somente no
   horario da atividade em America/Sao_Paulo, para aluno ativo inscrito/cursando.
   A proposta nao foi presumida aceita. Emissao, scanner, camera, expiracao,
   adulteracao, repeticao e concorrencia do check-in ainda precisam ser
   implementados/testados depois da decisao. Nao foi criado commit que declare
   check-in por QR concluido. O UNIQUE(inscricao_id,atividade_id) original foi
   preservado, mas isso sozinho nao implementa check-in seguro.
2. Painel: vite.config.js importa .figma/make/site.json, ausente e ignorado pelo
   repositorio. Impacto: build limpo nao reproduzivel. Correcao necessaria:
   versionar configuracao publica apropriada ou tornar a integracao Figma opcional
   no build independente, preservando o comportamento de preview. A validacao
   nao inventou esse arquivo nem alterou a configuracao do painel.
3. Release: app/build.gradle.kts nao define versionCode. Impacto: bundleRelease
   falha. Definir versionCode/versionName conforme politica de versoes do projeto,
   revisar targetSdk e compatibilidade SDK/AGP, e configurar assinatura release
   em ambiente seguro antes de distribuicao. Nenhuma assinatura de producao existe
   como evidencia aqui; nao foi criada chave de release.
4. Credenciais antigas: o responsavel pelo ambiente precisa rotacionar as senhas
   reais e avaliar a invalidacao de sessoes. Nao ha evidencia de que isso ocorreu.
5. Validacao visual: sem emulador/dispositivo, camera negada, offline em processo
   Android reiniciado, reconexao da interface, logout/troca de conta na UI e fluxo
   mobile-API completo nao foram executados. Os testes JVM comprovam o armazenamento
   e a coordenacao; nao substituem esses cenarios.
6. API de ambiente: Android usa ApiConfig.BASE_URL (10.0.2.2:3000, host visto pelo
   emulador) e painel usa VITE_API_URL ou localhost:3000. Nao foi localizada uma
   URL publica de API configurada para esta Entrega 2. Nao houve deploy. SupabaseConfig
   permanece como material legado sem consumo na camada de rede atual.
7. Funcionalidades demonstrativas fora desta tarefa: painel ainda tem exemplos em
   Attendance, Dashboard, Certificates, Tests, Messages e Reports, e placeholders
   de administradores/atividades/auditoria. Telas antigas de inicio/carteirinha do
   Android tambem contem indicadores de exemplo. Nao sao evidencia de dados reais
   nem foram declaradas integradas. O CRUD e as permissoes do backend nao tornam
   esses placeholders funcionais. Integracao dessas areas exige tarefa propria.
8. Cadastro publico ainda deve ganhar politica de senha e validacao de tipos
   consistente com os clientes; payload de senha com tipo invalido recebe erro
   generico 500 sem detalhes. Nao compromete as restricoes de perfil testadas,
   mas e uma lacuna de qualidade: validar entradas e responder 400 antes do bcrypt.

## Roteiro manual a executar quando houver dispositivo e regra de QR

1. Prepare banco de teste separado, configure ApiConfig e dois alunos ficticios
   com inscricoes distintas; nao reutilize dados reais nem salve tokens em evidencias.
2. Abra cursos e agenda. Confira lista vazia e filtro por curso usando IDs da API;
   datas e horas das atividades sao exibidas como horario cadastrado pela ONG,
   sem conversao silenciosa para o fuso do dispositivo.
3. Abra historico, corte a rede e reabra o app mantendo a sessao. Confira indicacao
   de dados salvos/ultima atualizacao; reconecte e confira atualizacao sem duplicatas.
4. Saia, entre com o outro aluno e confira ausencia de cache da conta anterior.
   Force HTTP 401/403 ou aguarde expiracao: a tela deve descartar os dados locais
   correspondentes. Bloqueio remoto so pode ser conhecido offline ao reconectar.
5. Depois de implementar o QR, execute todos os cenarios do Prompt 5, inclusive
   camera negada, QR expirado/adulterado, aluno sem inscricao e duplicidade concorrente.

A Entrega 2 nao foi declarada integralmente concluida: P5 continua parcial e as
falhas de build e validacoes ausentes estao explicitadas acima.
