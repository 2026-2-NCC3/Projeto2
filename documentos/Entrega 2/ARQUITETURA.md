# Entrega 2: diagramas e contratos atuais

Este documento descreve o codigo atual. Nao substitui uma rubrica academica.
O diagrama drawio da Entrega 1 foi preservado como historico. Ele inclui RA,
quantidadeFaltas, codigoQrCode do aluno, pontos e enums de status que nao existem
como colunas equivalentes no schema v5. Nao se deve usa-lo como contrato da API
atual. As notas abaixo alinham a Entrega 2 ao banco sem reescrever o original.

## Autorizacao e dados

~~~mermaid
sequenceDiagram
    participant Cliente as App ou painel
    participant API as Express
    participant DB as SQLite
    Cliente->>API: Login com email e senha
    API->>DB: Usuario ativo, bloqueio, hash bcrypt e papel
    API-->>Cliente: JWT HS256 expira em 8h e usuario publico
    Cliente->>API: Requisicao protegida com Bearer
    API->>API: Verifica assinatura e expiracao
    API->>DB: Consulta estado e papel atuais
    alt Sem acesso
        API-->>Cliente: 401 ou 403, sem dados sensiveis
    else Acesso autorizado
        API->>DB: Consulta ou escrita com identidade validada
        API-->>Cliente: Campos permitidos
    end
~~~

## Relacoes persistidas relevantes

~~~mermaid
erDiagram
    usuarios ||--o| credenciais : autentica
    usuarios ||--o| papeis : autoriza
    usuarios ||--o| alunos : estende
    universidades ||--o{ cursos : oferece
    alunos ||--o{ inscricoes : possui
    cursos ||--o{ inscricoes : recebe
    cursos ||--o{ atividades : organiza
    inscricoes ||--o{ presencas : registra
    atividades ||--o{ presencas : recebe
~~~

A presenca referencia inscricao e atividade; aluno e derivado da inscricao.
O banco protege UNIQUE(inscricao_id,atividade_id). Nao existe coluna de codigo
QR do aluno no schema v5 nem emissao de QR implementada nesta etapa. A agenda
nao e uma tabela separada: e a projecao das atividades das inscricoes ativas.
Os papeis atuais sao aluno, admin_operador e admin_super; estado de acesso usa
usuarios.ativo e alunos.bloqueado. O servidor usa o papel atual, nunca o papel
enviado em body nem o papel antigo do token para autorizar.

## Cache e sincronizacao

~~~mermaid
flowchart TD
    A[Abrir tela autenticada] --> B[Mostrar snapshot privado se houver]
    B --> C[Consultar API sem cache global do Volley]
    C --> D{Resposta}
    D -->|200 com lista valida| E[Publicar snapshot completo e atualizar tela]
    D -->|Rede ou servidor indisponivel| F[Preservar ultimo snapshot e indicar dados salvos]
    D -->|JSON invalido| F
    D -->|401| G[Limpar sessao e cache e abrir login]
    D -->|403| H[Limpar cache e negar acesso]
    E --> I[Reconectar ou atualizar manualmente]
    F --> I
    I --> C
~~~

O cache nao envia escritas nem confirma presenca. Tickets de sincronizacao,
geracao da Activity e versao da sessao impedem aplicar respostas antigas apos
logout/troca de conta. Veja o guia OFFLINE.md do Android para limites e testes.

## Casos de uso locais e contratos

| UC local | Entrada | Condicao no servidor | Saida |
| --- | --- | --- | --- |
| Login | POST /auth/login | Credenciais corretas, ativo e nao bloqueado | Token e usuario sem hash |
| Perfil pessoal | GET/PUT /api/profiles/me | Sessao valida; identidade derivada do token verificado | Perfil pessoal sem campos internos |
| Gerir alunos | /api/profiles; bloqueio/exclusao | Admin atual; cadastro publico cria somente aluno | Lista/alteracao autorizada |
| Gerir admins | /api/admins | Admin_super atual | Dados administrativos sem hash |
| Consultar cursos | GET /api/cursos | Catalogo publico | Lista com IDs persistidos; carga_horaria_horas aceita zero |
| Agenda pessoal | GET /api/agenda, curso_id opcional | Aluno atual; inscricao inscrito/cursando; curso nao cancelado | Atividades ordenadas, sem agenda alheia |
| Historico pessoal | GET /api/presencas/minhas | Aluno atual | Presencas persistidas do proprio aluno |
| Consultar historico individual | GET /api/presencas/alunos/:id | Dono ou admin atual | Presencas do aluno solicitado |
| Check-in QR | Ainda sem contrato implementado | Pendente de regra de negocio | Nao disponivel |

As atividades armazenam data, hora_inicio e hora_fim em campos de texto;
a interface os exibe conforme cadastro da ONG, sem conversao automatica.
checkin_em e um timestamp UTC do banco e historico informa o registro retornado.
A definicao de fuso/janela para validacao de QR ainda precisa ser confirmada.
