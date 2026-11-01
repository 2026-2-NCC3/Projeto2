# Entrega 2: verificacoes, evidencias e pendencias

Validacao realizada em 01/11/2026, na branch fix/p0-seguranca-entrega2,
sobre o repositorio principal. Nenhum banco real foi aberto, migrado ou alterado.
Nao houve deploy, push, force-push ou alteracao de main.

Atualizacao desta etapa: os dois bloqueios de compilacao foram resolvidos.
Os logs das falhas originais foram preservados como historico, junto dos logs
de sucesso e verificacoes dos artefatos. Isso nao aprova as pendencias funcionais.

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
| Frontend2.0 | gradlew.bat :app:bundleRelease | Aprovado: AAB local nao assinado, versionCode 2 / versionName 1.1.0 |
| AAB/variantes | bundletool validate/dump manifest; jarsigner; aapt2 | Bundle valido, versoes internas confirmadas; release sem assinatura; APK Android Debug |
| Painel Administrativo2.0 | npm ci; npm test; npm run build | Aprovado: 5 testes e build, sem .figma/make/site.json |
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
[falha original de release](evidencias/android-release-falha.txt),
[Android corrigido](evidencias/android-release-ok.txt),
[metadados verificados do AAB](evidencias/android-release-metadados.txt),
[falha original do painel](evidencias/painel-build-falha.txt),
[painel corrigido e testes](evidencias/painel-build-ok.txt).
A execucao final do Gradle aproveitou tarefas e resultados incrementais validos;
a primeira execucao dos testes JVM e da compilacao tambem passou.

## Artefatos encontrados e gerados

O APK atual esta em src/Entrega 2/Frontend2.0/app/build/outputs/apk/debug/app-debug.apk.
Tem 5898958 bytes e SHA-256
89a069e43d3f40860180ae2638bfc232a8de022f36893beb0e30950a5ed16900.
Foi verificado pelo apksigner e esta assinado como Android Debug. E um APK de
desenvolvimento, sem instalacao ou publicacao nesta etapa.

O AAB atual esta em src/Entrega 2/Frontend2.0/app/build/outputs/bundle/release/app-release.aab.
Tem 4274465 bytes e SHA-256
64f07f30e4fa92c588e13499f8f0e8a88888975f030e7ec6227bbe758367ffcf.
bundletool 1.18.3 validate aprovou sua estrutura e dump manifest confirmou codigo 2,
nome 1.1.0. Os manifests efetivos de debug/release e aapt2 no APK confirmaram
os mesmos valores. jarsigner confirmou que o bundle e nao assinado; o nome da
tarefa Gradle signReleaseBundle no log nao comprova assinatura de producao.

Os binarios permanecem nas pastas de build ignoradas pelo Git. Os APKs de
Entrega 1 sao historicos e registram codigo 1 / nome 1.0. Nao comprovam a maior
versao publicada. Nao houve acesso ao Play Console ou outro registro da loja:
gerar um AAB local nao comprova aceitacao da versao, assinatura de producao,
compatibilidade de atualizacao ou publicacao. Confira o maior codigo distribuido
antes de qualquer publicacao e use um valor superior. Veja o guia VERSIONING.md
do Android e [metadados e hashes](evidencias/artefato-android.json).

## Falhas e pendencias externas ou fora do escopo desta validacao

1. QR: falta confirmar emissor, janela e validade. Proposta enviada: admin_operador
   ou admin_super emite QR por atividade, valido por cinco minutos e somente no
   horario da atividade em America/Sao_Paulo, para aluno ativo inscrito/cursando.
   A proposta nao foi presumida aceita. Emissao, scanner, camera, expiracao,
   adulteracao, repeticao e concorrencia do check-in ainda precisam ser
   implementados/testados depois da decisao. Nao foi criado commit que declare
   check-in por QR concluido. O UNIQUE(inscricao_id,atividade_id) original foi
   preservado, mas isso sozinho nao implementa check-in seguro.
2. Painel: bloqueio resolvido. site.config.json versiona metadados reais do produto
   e config/site-config.js admite override Figma somente quando presente. Nao foi
   criado .figma/make/site.json. Plugins e pontos de extensao do HTML foram mantidos.
   Cinco testes comprovaram ausencia de Figma, overrides, JSON invalido, API padrao
   e explicita e recursos JS/CSS com HTTP 200 na raiz e em /painel/. npm ci e build
   passaram; permanece aviso de chunk JS acima de 500 kB. VITE_API_URL continua
   independente dos metadados e do base estatico. Veja o guia BUILD.md do painel.
3. Release: bloqueio de compilacao resolvido. defaultConfig define codigo 2 e
   nome 1.1.0 para debug/release; nao ha flavors ou overrides de versao no codigo.
   O commit aa3c733 removeu codigo 1 / nome 1.0, presentes desde e44d9db e nos dois
   APKs historicos. O proximo codigo local e 2, mas o maior codigo publicado nao
   foi comprovado. Bundle, APK, testes JVM e lint passaram. Publicacao continua
   pendente de conferir o registro da loja, targetSdk, compatibilidade SDK/AGP e
   assinatura release autorizada. Nao foi criada chave nem houve publicacao.
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
pendencias funcionais e validacoes ausentes estao explicitadas acima; os dois
bloqueios de compilacao desta etapa foram resolvidos.
