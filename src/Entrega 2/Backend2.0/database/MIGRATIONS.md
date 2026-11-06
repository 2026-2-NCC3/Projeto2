# Banco e migrações da Entrega 2

Os comandos abaixo devem ser executados em `src/Entrega 2/Backend2.0`.
O caminho padrão continua `database/proxima_etapa.db`. `DB_PATH` permite um
caminho alternativo; caminhos relativos são resolvidos a partir do diretório de
execução. Use a mesma configuração no init, backup, migrate, seed e start.
Os comandos carregam o `.env` desse diretório.

## Operação

- Banco novo: `npm ci`, `npm run db:init`, `npm start`.
- Banco v5 existente: pare o servidor e outros escritores, execute
  `npm run db:backup`, confira o backup, execute `npm run migrate` e `npm start`.
- `npm start` abre somente arquivo existente, valida o contrato do esquema,
  histórico e integridade e só então abre HTTP. Não aplica DDL nem escreve
  registros. Banco vazio, incompleto ou com migração pendente interrompe o start.
- `db:init` exige banco vazio e versão zero. Nunca reinicializa banco populado.
- `migrate` exige arquivo existente e não inicializa banco vazio. Execuções
  seguintes em banco atualizado não escrevem nem histórico ou timestamps.
- `seed:admin` permanece uma operação manual independente, após a preparação
  do banco. Nenhum comando de inicialização o executa automaticamente.

`CONFIRMAR_DROP` não tem efeito. Não existe opção de reset no fluxo novo.
Não coloque init, seed ou migrate em `prestart`, start ou build/deploy automático.

## Versões e compatibilidade

`migrations/005_baseline.sql` congela o `schema.sql` original, que foi preservado.
As 21 tabelas, colunas, constraints, índices, views e triggers originais não foram
alterados. Um v5 existente com `user_version` 0 ou 5 é adotado somente após
validar seu contrato, sem reexecutar os comandos de criação. Objetos adicionais
da ONG são mantidos. Não há INSERT, UPDATE, DELETE ou REPLACE sobre registros de
negócio nas migrações adicionadas.

A v6 adiciona três índices em chaves estrangeiras já existentes: `cursos.criado_por`,
`resultado_respostas.pergunta_id` e `resultado_respostas.alternativa_id`.
`schema_migrations` registra versão, nome, SHA-256 e data; `user_version` acompanha
a última versão. Os hashes normalizam CRLF para LF para funcionar entre sistemas.

Todos os passos pendentes, incluindo adoção, DDL, histórico e versão, usam uma
única transação IMMEDIATE. Qualquer falha provoca rollback integral. As chaves
estrangeiras ficam habilitadas; `quick_check` e `foreign_key_check` são verificados
antes e depois das alterações. O timeout de bloqueio é de cinco segundos.

A comparação do contrato é conservadora: normaliza espaços no SQL armazenado
pelo SQLite e exige as definições esperadas, incluindo regras de negócio. Uma
definição equivalente escrita de outra forma também pode ser recusada. Versões
antigas desconhecidas, tabelas parciais, constraints diferentes, versões futuras,
histórico adulterado, índices em conflito ou registros órfãos exigem análise e
uma migração específica com testes em uma cópia segura. Nunca apague o banco
nem altere `user_version` ou o histórico para contornar a validação.

Novas alterações devem criar um arquivo numerado, ser registradas no catálogo
de `migrationRunner.js` e incluir testes de preservação e rollback. Nunca edite
migrações já aplicadas nem use o schema completo para atualizar banco populado.
Migrações devem permanecer aditivas, sem controles de transação próprios ou
desativação de chaves estrangeiras. A validação de contrato é reconstruída em
memória; somente o comando explícito aplica as alterações no banco alvo.

## WAL, backup e falhas

Conexões usam WAL, `synchronous=FULL` e chaves estrangeiras habilitadas.
Não copie apenas o `.db` enquanto houver conexões abertas e não apague ou mova
isoladamente os arquivos `-wal` ou `-shm`: commits ainda podem estar no WAL.
`db:backup` usa a API de backup SQLite e gera um novo arquivo com nome único ao
lado da origem, sem sobrescrever backups anteriores. O processo deve ter espaço
e permissão de escrita nesse diretório. Não exponha esses arquivos em commits ou
downloads públicos. O backend já ignora arquivos `database/*.db` e auxiliares.

Não há restauração automática. Teste a restauração em caminho separado; mantenha
o arquivo original e seus auxiliares intactos até confirmar a integridade. WAL
deve usar armazenamento local ao host do servidor, não compartilhamento de rede.

Falhas de migração encerram o comando com código 1, um código de erro seguro e
rollback. O start também encerra com código 1 antes de abrir HTTP se a validação
falhar. Não são registrados SQL, dados pessoais, senhas ou caminhos do banco.
Bloqueio (`SQLITE_BUSY`) exige encerrar o escritor concorrente e tentar novamente;
incompatibilidade exige revisão do esquema. Nenhum desses erros autoriza reset.

Referências: [WAL](https://www.sqlite.org/wal.html),
[transações IMMEDIATE](https://www.sqlite.org/lang_transaction.html),
[API de backup](https://www.sqlite.org/backup.html).

## Validação desta correção

`npm test` usa exclusivamente diretórios temporários com dados fictícios e cobre:
criação inicial; adoção de v5 populado com e sem versão; idempotência; três
reinícios HTTP com health check; comparação de todas as linhas, relacionamentos,
timestamps, esquema e histórico; falha após DDL parcial; lock concorrente;
histórico adulterado; versão futura; schema parcial; órfãos preexistentes;
recusa de startup sem arquivo, em banco vazio ou não migrado; backup com WAL ativo.

A auditoria encontrou exclusão de toda a estrutura no antigo `migrate.js`, sem
transação e com cópia física incompleta para backup. O startup anterior não
chamava esse comando, mas criava schema no start e verificava bancos existentes
apenas pela presença das tabelas. A separação explícita elimina esses caminhos.
O seed usa INSERT transacional e recusa conta já existente; não usa substituição.
A Entrega 1 é material histórico e não foi alterada. Nenhum banco real foi aberto,
migrado ou modificado durante esta validação.

Resultado: 11 testes aprovados, zero falhas, em Node.js v24.21.0 e SQLite 3.53.1.
A execução final incluiu acesso ao localhost, pois o sandbox bloqueia a conexão
HTTP dos testes com EACCES. A checagem de sintaxe e `git diff --check` dos arquivos
da correção também passaram. `schema.sql` e `package-lock.json` não foram alterados.
