# Administradores da Entrega 2

O startup, o build e as migracoes nao criam contas nem redefinem senhas.
Use o banco inicializado/migrado e execute manualmente npm run seed:admin,
com ADMIN_EMAIL e ADMIN_PASSWORD explicitamente definidos no ambiente local.
O email deve ser valido. A senha deve conter pelo menos 12 caracteres e no
maximo 72 bytes UTF-8 (limite do bcrypt). Nao ha senha padrao ou fallback.
.env.example deixa os segredos vazios e .env permanece ignorado pelo Git.
O hash usa bcrypt com custo 12; a gravacao de usuario, credencial e papel ocorre
em transacao IMMEDIATE. Uma conta existente, inclusive com email em maiusculas
ou com papel de aluno, causa recusa com codigo 1: senha e privilegios permanecem.

## Credenciais antigas

Nenhuma conta ou banco real foi acessado ou modificado. A rotacao das senhas
antigas continua pendente do responsavel pelo ambiente. Com um admin_super
legitimo autenticado, use a operacao existente PATCH /api/admins/:id/senha
com uma nova senha exclusiva, enviada em canal HTTPS. Essa rota exige
admin_super atual no banco e a mesma politica de senha do provisionamento.
Se nao houver acesso legitimo, organize a recuperacao com o responsavel;
nao use seed para sobrescrever contas. Em suspeita de comprometimento, avalie
com o responsavel a rotacao do JWT_SECRET (invalida todas as sessoes), revogacao
de acessos antigos e revisao dos registros de auditoria. Nao comite segredos.
Nao foi comprovada nem declarada a troca de qualquer senha real.

A varredura dos arquivos atuais da Entrega 2 nao encontrou senha administrativa
fixa. O seed ja era manual; a correcao reforcou validacao, bloqueio de repeticao,
colisao de email sem distincao de caixa e politica nas rotas administrativas.
Materiais historicos da Entrega 1 nao sao scripts de inicializacao da Entrega 2.
