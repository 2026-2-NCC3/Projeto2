# Contratos REST da Entrega 2

Referência do servidor Express em `94bac71241964c22432b10e667db127e6f4c85e3`. As tabelas abaixo descrevem rotas registradas no servidor da Entrega 2. [Montagem das rotas](../src/Entrega%202/Backend2.0/server.js) · [Rotas e permissões](../src/Entrega%202/Backend2.0/src/routes/)

## Convenções e autenticação

- Base local do host `http://localhost:3000`. Para a configuração Android, consulte o [README](../README.md).
- Use `Content-Type: application/json` em requisições com JSON e `Authorization: Bearer <token>` nas rotas protegidas. O login emite JWT HS256 com duração de oito horas. O middleware verifica o token e consulta atividade, bloqueio e papel atuais no SQLite.
- **Admin** significa `admin_operador` ou `admin_super`. **Super** significa somente `admin_super`. **Aluno** significa sessão com papel `aluno`. IDs são strings da API. `:id` identifica o recurso da rota. As consultas sem parâmetros indicados não oferecem filtros documentados.
- As tabelas indicam a resposta de sucesso. `204` não tem corpo. Em erros JSON, o formato é `{"erro":"mensagem"}`. `400` indica entrada inválida ou restrição SQLite tratada. `401` indica credenciais ou sessão rejeitadas. `403` indica acesso insuficiente. `404` indica recurso indisponível, inclusive quando a rota oculta recursos alheios. `409` indica conflito de estado nas operações que o preveem. Falhas internas tratadas pelo servidor retornam `500`.
- Nos formulários comuns de atualização, campos omitidos usam os valores atuais. Os controladores que usam `??` também preservam o valor atual se o campo vier como `null`. Mensagens têm validação própria e exigem o payload completo.

## Saúde, sessão e perfis

| Método | Rota | Acesso | Parâmetros ou corpo | Sucesso |
| --- | --- | --- | --- | --- |
| GET | `/` | Público | — | 200 `{mensagem}` |
| GET | `/api/health` | Público | — | 200 `{status:"online", mensagem}`. 503 se a consulta de saúde falhar |
| POST | `/auth/login` | Público | `{email, senha}`, strings. Senha de até 72 bytes UTF-8 | 200 `{token, usuario:{id,nome_completo,email,papel}}` |
| GET | `/api/profiles` | Admin | — | 200 lista de perfis administrativos de alunos |
| POST | `/api/profiles` | Público | `nome_completo`, `email` e `senha` obrigatórios. Campos adicionais do perfil e `consentimento_lgpd` 0/1, padrão 0. O app envia 1 após consentimento | 201 perfil pessoal. Cria aluno |
| GET | `/api/profiles/me` | Próprio aluno | ID pela sessão | 200 perfil pessoal |
| PUT | `/api/profiles/me` | Próprio aluno | Campos de perfil editáveis | 200 perfil pessoal atualizado |
| GET | `/api/profiles/:id` | Titular ou admin | ID de aluno | 200 perfil conforme o papel |
| PUT | `/api/profiles/:id` | Titular ou admin | ID de aluno e campos editáveis | 200 perfil atualizado conforme o papel |
| PATCH | `/api/profiles/:id/bloqueio` | Admin | ID de aluno, `bloqueado` verdadeiro/falso e `motivo_bloqueio` opcional | 200 perfil administrativo |
| DELETE | `/api/profiles/:id` | Admin | ID de aluno | 204 |

Campos editáveis do perfil: `nome_completo`, `email`, `telefone`, `foto_url`, `escola`, `serie`, `ano_letivo`, `cidade`. O cadastro valida formato de e-mail e senha não vazia de até 72 bytes. O perfil pessoal acrescenta `id`, `consentimento_lgpd` e `consentimento_em`. A projeção administrativa acrescenta `ativo`, `bloqueado`, `motivo_bloqueio`, `criado_em` e `atualizado_em`. Nenhuma dessas projeções retorna hash de senha.

## Administradores

| Método | Rota | Acesso | Parâmetros ou corpo | Sucesso |
| --- | --- | --- | --- | --- |
| GET | `/api/admins` | Super | — | 200 lista de administradores |
| POST | `/api/admins` | Super | `{nome_completo,email,senha,papel}`, todos obrigatórios | 201 administrador criado |
| PUT | `/api/admins/:id` | Super | ID e campos `nome_completo`, `email`, `papel` | 200 administrador atualizado |
| PATCH | `/api/admins/:id/senha` | Super | ID e `{senha}` | 204 |
| DELETE | `/api/admins/:id` | Super | ID | 204 |

Resposta de administrador: `id`, `nome_completo`, `email`, `criado_em`, `papel`. Os papéis admitidos são `admin_operador` e `admin_super`. A senha administrativa tem mínimo de 12 caracteres e máximo de 72 bytes. A API recusa exclusão ou mudança de papel que retire o último superadministrador.

## Catálogo e agenda

| Método | Rota | Acesso | Parâmetros ou corpo | Sucesso |
| --- | --- | --- | --- | --- |
| GET | `/api/universidades` | Público | — | 200 lista de universidades |
| GET | `/api/universidades/:id` | Público | ID | 200 universidade |
| POST | `/api/universidades` | Admin | `nome` obrigatório, `logo_url`, `site`, `descricao` opcionais | 201 universidade |
| PUT | `/api/universidades/:id` | Admin | ID e campos do cadastro | 200 universidade |
| DELETE | `/api/universidades/:id` | Admin | ID | 204 |
| GET | `/api/cursos` | Público | — | 200 lista de cursos |
| GET | `/api/cursos/:id` | Público | ID | 200 curso |
| POST | `/api/cursos` | Admin | `titulo` e `data_inicio` obrigatórios. Demais campos abaixo | 201 curso |
| PUT | `/api/cursos/:id` | Admin | ID e campos do cadastro | 200 curso |
| DELETE | `/api/cursos/:id` | Admin | ID | 204 |
| GET | `/api/atividades` | Público | Query `curso_id` opcional | 200 lista de atividades com `curso_titulo` |
| POST | `/api/atividades` | Admin | `curso_id`, `titulo`, `data`, `hora_inicio`, `hora_fim` obrigatórios. `tipo`, `local`, `link_online` opcionais | 201 atividade |
| PUT | `/api/atividades/:id` | Admin | ID e campos do cadastro | 200 atividade |
| DELETE | `/api/atividades/:id` | Admin | ID | 204 |
| GET | `/api/agenda` | Aluno | Query `curso_id` opcional, string | 200 lista pessoal com `curso_titulo` e `inscricao_id` |

- **Universidade.** Resposta com campos do cadastro, `id` e `criado_em`.
- **Curso.** Opcionais `descricao`, `categoria`, `carga_horaria_horas`, `universidade_id`, `modalidade`, `local`, `link_online`, `data_fim`, `vagas_total`, `emite_certificado`, `status` e `banner_url`. Carga e vagas têm padrão 0 e devem ser não negativas. Modalidade aceita `presencial` (padrão), `online` ou `hibrido`. Status aceita `planejado` (padrão), `em_andamento`, `encerrado` ou `cancelado`. `emite_certificado` é 0/1 e tem padrão 0. Resposta acrescenta `id`, `vagas_disponiveis`, `criado_por`, `criado_em` e `atualizado_em`.
- **Atividade.** Tipo aceita `aula` (padrão), `workshop`, `palestra` ou `avaliacao`. Curso deve existir e `hora_fim` deve ser posterior a `hora_inicio`. Use datas `AAAA-MM-DD` e horários de 24 horas `HH:mm` para manter a ordenação textual usada no código. O cadastro e a atualização retornam os campos persistidos com `id` e `criado_em`. A agenda pessoal retorna a projeção da atividade sem `criado_em`, acrescida dos campos da tabela acima. A lista pessoal considera inscrições `inscrito` ou `cursando` e exclui cursos cancelados.

## Inscrições, QR e histórico

| Método | Rota | Acesso | Parâmetros ou corpo | Sucesso |
| --- | --- | --- | --- | --- |
| GET | `/api/inscricoes/minhas` | Aluno | ID pela sessão | 200 lista de inscrições com dados do curso |
| POST | `/api/inscricoes` | Aluno | `{curso_id}` | 201 inscrição com status `inscrito`. Duplicata retorna 409 |
| PATCH | `/api/inscricoes/:cursoId/cancelamento` | Aluno | ID do curso. Identidade pela sessão | 204 |
| POST | `/api/presencas/qr-token` | Admin | Somente `{atividade_id,valido_de,valido_ate}` | 201 `{qr_token}` |
| POST | `/api/presencas/check-in` | Aluno | Somente `{qr_token}`, até 4096 caracteres | 201 presença criada ou 200 presença existente |
| GET | `/api/presencas/minhas` | Aluno | ID pela sessão | 200 lista pessoal de histórico |
| GET | `/api/presencas/alunos/:id` | Titular ou admin | ID de aluno | 200 lista do aluno indicado |

Inscrição retorna `id`, `aluno_id`, `curso_id`, `status` e `criado_em`. A lista acrescenta `titulo`, `descricao`, `carga_horaria_horas`, `vagas_disponiveis`, `universidade_id` e `universidade_nome`.

O QR usa UTC explícito no formato `YYYY-MM-DDTHH:mm:ssZ`. O fim deve ser posterior ao início e ao instante de emissão. O QR assinado é distinto do Bearer de sessão. No check-in, QR inválido ou fora da janela retorna 400. Falta de autorização, inscrição elegível ou emissor autorizado retorna 403. O servidor deriva aluno e atividade da sessão e do QR e usa o seu relógio para a gravação.

Presença retorna `id`, `inscricao_id`, `atividade_id`, `checkin_em` e `metodo`. Histórico acrescenta `titulo`, `data`, `hora_inicio`, `hora_fim`, `curso_id` e `curso_titulo`.

## Certificados

| Método | Rota | Acesso | Parâmetros ou corpo | Sucesso |
| --- | --- | --- | --- | --- |
| GET | `/api/certificados/minhas` | Aluno | ID pela sessão | 200 lista de metadados pessoais |
| GET | `/api/certificados` | Admin | — | 200 lista com projeção administrativa |

Metadados: `id`, `inscricao_id`, `curso_id`, `titulo`, `carga_horaria_horas`, `status`, `emitido_em`, `criterios` como lista de `{criterio,atendido}`, `arquivo_disponivel:false` e `arquivo_indisponivel_motivo:"armazenamento_nao_validado"`. A projeção admin acrescenta `aluno_id` e `aluno_nome`. As respostas não incluem URL de PDF.

## Comunicados

| Método | Rota | Acesso | Parâmetros ou corpo | Sucesso |
| --- | --- | --- | --- | --- |
| GET | `/api/mensagens` | Admin | — | 200 lista administrativa |
| GET | `/api/mensagens/minhas` | Aluno | ID pela sessão | 200 lista autorizada |
| GET | `/api/mensagens/:id` | Destinatário ou admin | ID da mensagem | 200 detalhe conforme papel |
| POST | `/api/mensagens` | Admin | Payload de rascunho | 201 rascunho |
| PUT | `/api/mensagens/:id` | Admin | ID e payload completo de rascunho | 200 rascunho atualizado |
| DELETE | `/api/mensagens/:id` | Admin | ID de rascunho | 204 |
| POST | `/api/mensagens/:id/publicar` | Admin | ID, sem corpo ou `{}` | 201 publicação ou 200 se já publicada |
| PUT | `/api/mensagens/:id/leitura` | Aluno destinatário | ID, sem corpo ou `{}` | 200 detalhe com leitura registrada |

O payload aceita `titulo` (1–160 caracteres), `corpo` (1–10000) e `publico_alvo`. Para `todos`, dispense `curso_id` e `aluno_ids`. Para `curso`, envie `curso_id` sem `aluno_ids`. Para `individual`, envie `aluno_ids` com 1–500 IDs únicos, sem `curso_id`. IDs dos alvos têm até 128 caracteres. Campos extras são recusados. Exemplo fictício:

```json
{"titulo":"Aviso de atividade","corpo":"Confira sua agenda.","publico_alvo":"todos"}
```

Resposta do aluno: `id`, `titulo`, `corpo`, `publico_alvo`, `curso_id`, `curso_titulo`, `enviado_em`, `lido_em` e `origem`. A resposta admin inclui os campos persistidos do comunicado e `autor_nome`, `curso_titulo`, `total_destinatarios`, `total_lidos` e `aluno_ids` para público individual (lista vazia nos demais públicos). Publicar grava destinatários e alertas na mesma transação. Edição ou exclusão após publicação, publicação de registro agendado e ausência de destinatários elegíveis geram 409.

## Notificações internas

| Método | Rota | Acesso | Parâmetros ou corpo | Sucesso |
| --- | --- | --- | --- | --- |
| GET | `/api/notificacoes/minhas` | Aluno | ID pela sessão | 200 lista autorizada |
| POST | `/api/notificacoes/sincronizar` | Aluno | Sem corpo ou `{}` | 200 lista após reconciliação |
| GET | `/api/notificacoes/:id` | Aluno destinatário | ID do alerta | 200 detalhe |
| PUT | `/api/notificacoes/:id/leitura` | Aluno destinatário | ID, sem corpo ou `{}` | 200 alerta com leitura registrada |

Resposta: `id`, `tipo`, `titulo`, `corpo`, `lida` (0/1), `criado_em` e `destino`. O destino é `null` ou `{tela,id}` com tela `mensagens`, `cursos`, `certificados` ou `agenda`. A autorização do destino é reavaliada no servidor. A leitura de um alerta é separada da leitura do comunicado.

## Funcionalidades sem rota implementada

| Escopo | Limite atual |
| --- | --- |
| Testes de perfil e chat de dúvidas | Sem rotas registradas |
| Card integrado à identificação do aluno | Sem rota registrada para o card |
| Emissão, visualização e download de PDF de certificado | Somente consultas de metadados registradas |
| Push com o app fechado | Somente notificações internas registradas |
| Agendamento de publicação | A API publica imediatamente. O agendamento não é executado |

[Evidências verificadas](EVIDENCIAS_TESTES_ENTREGA2.md) · [Guia técnico](ENTREGA2_GUIA_TECNICO.md)
