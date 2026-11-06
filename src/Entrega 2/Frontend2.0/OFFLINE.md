# Consulta offline da Entrega 2

Cursos, agenda e historico guardam somente respostas completas e validadas da
API. O cache nao cria alunos, inscricoes ou presencas. Nao ha fila de escritas
nem check-in offline. Registro de presenca confirmado continua exclusivamente
sendo uma linha retornada pela API; tentativas locais nunca viram confirmacao.

Snapshots JSON privados em noBackupFilesDir/snapshots sao separados por hash do
usuario e da origem + rota da API (inclusive filtro de curso). O envelope guarda
somente dono, recurso, data de atualizacao e campos permitidos dos registros.
Senhas, hashes e tokens nao sao serializados. O token existente da sessao fica
nas preferencias privadas; backup do app foi desabilitado. O cache nao e um
cofre criptografado e pressupoe a protecao do sandbox Android do dispositivo.

Cada snapshot e escrito e sincronizado em arquivo temporario, depois publicado
por rename para um nome unico. Somente apos publicar a nova versao sao removidas
as anteriores. Um arquivo parcial .tmp e ignorado. Gravacoes sao serializadas.
Respostas invalidas e falhas de rede nao sobrescrevem o ultimo conteudo valido.
Uma lista vazia valida substitui a anterior. A interface identifica conteudo
salvo e mostra o horario da ultima atualizacao. No primeiro acesso sem cache,
mostra ausencia de dados salvos; nunca inventa exemplos.

A sincronizacao ocorre ao abrir a tela, ao reconectar e ao tocar em Atualizar.
Nao ha tentativas automaticas ilimitadas: cada requisicao usa timeout de 10s,
sem retry automatico do Volley. SyncGate impede requisicoes simultaneas para o
mesmo recurso e sessao. A Activity cancela ao parar e ignora respostas com
outra geracao/sessao, inclusive apos logout e troca de conta.

Logout, token expirado localmente ou HTTP 401 limpam sessao e cache do usuario.
HTTP 403 remove o cache e nao exibe dados salvos para a operacao proibida.
Um bloqueio ocorrido no servidor durante ausencia de rede so pode ser conhecido
na proxima consulta online; offline permite apenas ler o ultimo snapshot local
ate a expiracao do token. O servidor sempre consulta estado e papel atuais em
requisicoes protegidas. O app nao usa a leitura local de exp para autorizar API.

Testes JVM: reinicio recriando o store; isolamento entre usuarios e servidores;
falha e arquivo interrompido; resposta vazia; repeticao e publicacao concorrente
sem duplicatas; limpeza por usuario; descarte de campos secretos; coordenacao
de requisicoes e invalidacao por sessao. A compilacao debug foi executada.
Sem dispositivo/emulador conectado, nao foi comprovada visualmente a troca de
rede, o encerramento do processo Android ou os dialogos de sessao expirada.
