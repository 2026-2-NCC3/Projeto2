<<<<<<< HEAD
-- ============================================================================
-- PRÓXIMA ETAPA — SCHEMA DEFINITIVO (v5)
-- SQLite | Projeto Interdisciplinar 3º CCOMP
--
-- Decisões de design (leia antes de usar):
-- 1. Uma única tabela raiz de identidade (usuarios) + tabela de papéis com
--    3 níveis (aluno, admin_operador, admin_super) — corrige a limitação
--    binária admin/student de todos os schemas anteriores do grupo.
-- 2. Dados específicos de aluno ficam em tabela de extensão (alunos), não
--    misturados na tabela raiz — evita colunas NULL para admins.
-- 3. Nenhum contador redundante (tipo fornecedor.seguidores do outro banco
--    que você mandou): vagas_disponiveis é mantido por TRIGGER a partir da
--    tabela real de inscricoes, nunca calculado só na aplicação.
-- 4. audit_logs existe desde o início (lacuna que 3 dos 4 schemas anteriores
--    do grupo deixaram de fora).
-- 5. Nenhuma tabela de conteúdo fora do escopo do PDF (sem news_posts,
--    videos, ai_knowledge — isso pertence ao site institucional, não ao
--    RFM01-15 do app do aluno).
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. IDENTIDADE E ACESSO
-- ----------------------------------------------------------------------------

CREATE TABLE usuarios (
    id              TEXT PRIMARY KEY,
    nome_completo   TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    telefone        TEXT,
    foto_url        TEXT,
    ativo           INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
    criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    atualizado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Senha isolada da identidade: nenhuma query de listagem de usuários
-- arrisca trazer o hash por acidente (erro comum de SELECT * em profiles).
CREATE TABLE credenciais (
    usuario_id      TEXT PRIMARY KEY,
    senha_hash      TEXT NOT NULL,
    atualizado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3 níveis reais de acesso, não binário. Ver seção 6.1 do spec de design.
CREATE TABLE papeis (
    usuario_id  TEXT PRIMARY KEY,
    papel       TEXT NOT NULL CHECK (papel IN ('aluno','admin_operador','admin_super')),
    criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
=======

-- SCHEMA SQLITE
-- Sistema de cursos, usuários, universidades e certificados
-- Total: 15 tabelas


PRAGMA foreign_keys = ON;



-- 1. PERFIS
-- Alunos e administradores cadastrados

CREATE TABLE profiles (
    id                TEXT PRIMARY KEY,
    full_name         TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    password_hash     TEXT NOT NULL,
    school            TEXT,
    grade             TEXT,
    school_year       TEXT,
    city              TEXT,
    phone             TEXT,

    points            INTEGER NOT NULL DEFAULT 0
                      CHECK (points >= 0),

    courses_completed INTEGER NOT NULL DEFAULT 0
                      CHECK (courses_completed >= 0),

    no_shows          INTEGER NOT NULL DEFAULT 0
                      CHECK (no_shows >= 0),

    is_blocked        INTEGER NOT NULL DEFAULT 0
                      CHECK (is_blocked IN (0, 1)),

    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
);


-- 2. PAPÉIS DOS USUÁRIOS
-- Define se o usuário é aluno ou administrador

CREATE TABLE user_roles (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,

    role       TEXT NOT NULL
               CHECK (role IN ('admin', 'student')),

    created_at TEXT NOT NULL,

    UNIQUE (user_id, role),

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE
);


-- 3. UNIVERSIDADES
-- Instituições responsáveis pelos cursos
>>>>>>> dbad80bc386efaee23cfb3a9f4c46a4856ebb2ee

-- Extensão de dados só de aluno — mantém "usuarios" limpo para admins.
CREATE TABLE alunos (
    usuario_id          TEXT PRIMARY KEY,
    escola              TEXT,
    serie               TEXT,
    ano_letivo          TEXT,
    cidade              TEXT,
    consentimento_lgpd  INTEGER NOT NULL DEFAULT 0 CHECK (consentimento_lgpd IN (0,1)),
    consentimento_em    TEXT,
    bloqueado           INTEGER NOT NULL DEFAULT 0 CHECK (bloqueado IN (0,1)),
    motivo_bloqueio     TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 2. UNIVERSIDADES E CURSOS
-- ----------------------------------------------------------------------------

CREATE TABLE universidades (
    id          TEXT PRIMARY KEY,
    nome        TEXT NOT NULL UNIQUE,
    logo_url    TEXT,
    site        TEXT,
    descricao   TEXT,
    criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

<<<<<<< HEAD
CREATE TABLE cursos (
    id                  TEXT PRIMARY KEY,
    titulo              TEXT NOT NULL,
    descricao           TEXT,
    categoria           TEXT,
    carga_horaria_horas INTEGER NOT NULL DEFAULT 0 CHECK (carga_horaria_horas >= 0),
    universidade_id     TEXT,
    modalidade          TEXT NOT NULL DEFAULT 'presencial' CHECK (modalidade IN ('presencial','online','hibrido')),
    local               TEXT,
    link_online         TEXT,
    data_inicio         TEXT NOT NULL,
    data_fim            TEXT,
    vagas_total         INTEGER NOT NULL DEFAULT 0 CHECK (vagas_total >= 0),
    -- Coluna derivada mantida por trigger — nunca escrita diretamente pela aplicação.
    vagas_disponiveis   INTEGER NOT NULL DEFAULT 0 CHECK (vagas_disponiveis >= 0 AND vagas_disponiveis <= vagas_total),
    emite_certificado   INTEGER NOT NULL DEFAULT 0 CHECK (emite_certificado IN (0,1)),
    status              TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado','em_andamento','encerrado','cancelado')),
    banner_url          TEXT,
    criado_por          TEXT,
    criado_em           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    atualizado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
=======

-- 4. CURSOS
-- Cursos disponibilizados pelas universidades
>>>>>>> dbad80bc386efaee23cfb3a9f4c46a4856ebb2ee

    FOREIGN KEY (universidade_id) REFERENCES universidades(id) ON DELETE SET NULL,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE TABLE atividades (
    id          TEXT PRIMARY KEY,
    curso_id    TEXT NOT NULL,
    titulo      TEXT NOT NULL,
    tipo        TEXT NOT NULL DEFAULT 'aula' CHECK (tipo IN ('aula','workshop','palestra','avaliacao')),
    data        TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fim    TEXT NOT NULL,
    local       TEXT,
    link_online TEXT,
    criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    CHECK (hora_fim > hora_inicio)
);

-- ----------------------------------------------------------------------------
-- 3. INSCRIÇÕES E PRESENÇA
-- ----------------------------------------------------------------------------

CREATE TABLE inscricoes (
    id          TEXT PRIMARY KEY,
    aluno_id    TEXT NOT NULL,
    curso_id    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'inscrito' CHECK (status IN ('inscrito','cursando','concluido','cancelado')),
    criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

    FOREIGN KEY (aluno_id) REFERENCES alunos(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    UNIQUE (aluno_id, curso_id)
);

-- Uma presença é sempre por atividade específica, nunca "por curso" —
-- exigência explícita do PDF ("evitando duplicidades para o mesmo encontro").
CREATE TABLE presencas (
    id              TEXT PRIMARY KEY,
<<<<<<< HEAD
    inscricao_id    TEXT NOT NULL,
    atividade_id    TEXT NOT NULL,
    checkin_em      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    metodo          TEXT NOT NULL DEFAULT 'qrcode' CHECK (metodo IN ('qrcode','manual')),
    justificativa   TEXT,
    registrado_por  TEXT,
=======
    title           TEXT NOT NULL,
    description     TEXT,
    banner_url      TEXT,
    university_id   TEXT,
    location        TEXT,
    course_date     TEXT NOT NULL,

    total_spots     INTEGER NOT NULL DEFAULT 30
                    CHECK (total_spots >= 0),

    available_spots INTEGER NOT NULL DEFAULT 30
                    CHECK (
                        available_spots >= 0
                        AND available_spots <= total_spots
                    ),

    has_certificate INTEGER NOT NULL DEFAULT 0
                    CHECK (has_certificate IN (0, 1)),

    category        TEXT,

    is_active       INTEGER NOT NULL DEFAULT 1
                    CHECK (is_active IN (0, 1)),

    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
>>>>>>> dbad80bc386efaee23cfb3a9f4c46a4856ebb2ee

    FOREIGN KEY (inscricao_id)   REFERENCES inscricoes(id) ON DELETE CASCADE,
    FOREIGN KEY (atividade_id)   REFERENCES atividades(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE (inscricao_id, atividade_id),
    -- justificativa obrigatória para lançamento manual (rastreabilidade admin)
    CHECK (metodo = 'qrcode' OR justificativa IS NOT NULL)
);

<<<<<<< HEAD
-- ----------------------------------------------------------------------------
-- 4. CERTIFICADOS E CARD DIGITAL
-- ----------------------------------------------------------------------------

CREATE TABLE certificados (
    id                  TEXT PRIMARY KEY,
    inscricao_id        TEXT NOT NULL UNIQUE,
    status              TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pronto','emitido','revogado')),
    arquivo_url         TEXT,
    emitido_em          TEXT,
    emitido_por         TEXT,
    revogado_em         TEXT,
    motivo_revogacao    TEXT,

    FOREIGN KEY (inscricao_id) REFERENCES inscricoes(id) ON DELETE CASCADE,
    FOREIGN KEY (emitido_por)  REFERENCES usuarios(id) ON DELETE SET NULL,
    CHECK (status != 'emitido' OR (arquivo_url IS NOT NULL AND emitido_em IS NOT NULL)),
    CHECK (status != 'revogado' OR motivo_revogacao IS NOT NULL)
);

-- Critérios normalizados em vez de JSON solto — permite consultar
-- "quais alunos faltam só o critério de frequência", por exemplo.
CREATE TABLE certificado_criterios (
    id              TEXT PRIMARY KEY,
    certificado_id  TEXT NOT NULL,
    criterio        TEXT NOT NULL CHECK (criterio IN ('frequencia','avaliacao','carga_horaria')),
    atendido        INTEGER NOT NULL DEFAULT 0 CHECK (atendido IN (0,1)),

    FOREIGN KEY (certificado_id) REFERENCES certificados(id) ON DELETE CASCADE,
    UNIQUE (certificado_id, criterio)
);

CREATE TABLE cards (
    aluno_id        TEXT PRIMARY KEY,
    numero_card     TEXT NOT NULL UNIQUE,
    emitido_em      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    exibir_escola   INTEGER NOT NULL DEFAULT 1 CHECK (exibir_escola IN (0,1)),
    exibir_cidade   INTEGER NOT NULL DEFAULT 1 CHECK (exibir_cidade IN (0,1)),

    FOREIGN KEY (aluno_id) REFERENCES alunos(usuario_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5. TESTES DE PERFIL
-- ----------------------------------------------------------------------------

CREATE TABLE testes_perfil (
    id          TEXT PRIMARY KEY,
    titulo      TEXT NOT NULL,
    versao      TEXT NOT NULL,
    ativo       INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
    criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE perguntas (
    id          TEXT PRIMARY KEY,
    teste_id    TEXT NOT NULL,
    texto       TEXT NOT NULL,
    ordem       INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (teste_id) REFERENCES testes_perfil(id) ON DELETE CASCADE,
    UNIQUE (teste_id, ordem)
);

CREATE TABLE alternativas (
    id              TEXT PRIMARY KEY,
    pergunta_id     TEXT NOT NULL,
    texto           TEXT NOT NULL,
    classificacao   TEXT NOT NULL,  -- ex: 'Analítico','Criativo','Comunicador','Executor'
    peso            INTEGER NOT NULL DEFAULT 1 CHECK (peso BETWEEN 1 AND 5),
    ordem           INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE,
    UNIQUE (pergunta_id, ordem)
);

CREATE TABLE resultados_perfil (
    id                  TEXT PRIMARY KEY,
    aluno_id            TEXT NOT NULL,
    teste_id            TEXT NOT NULL,
    classificacao_final TEXT NOT NULL,
    pontuacao_total     INTEGER NOT NULL DEFAULT 0,
    respondido_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

    FOREIGN KEY (aluno_id) REFERENCES alunos(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (teste_id) REFERENCES testes_perfil(id) ON DELETE CASCADE
);

CREATE TABLE resultado_respostas (
    id              TEXT PRIMARY KEY,
    resultado_id    TEXT NOT NULL,
    pergunta_id     TEXT NOT NULL,
    alternativa_id  TEXT NOT NULL,

    FOREIGN KEY (resultado_id)   REFERENCES resultados_perfil(id) ON DELETE CASCADE,
    FOREIGN KEY (pergunta_id)    REFERENCES perguntas(id) ON DELETE CASCADE,
    FOREIGN KEY (alternativa_id) REFERENCES alternativas(id) ON DELETE CASCADE,
    UNIQUE (resultado_id, pergunta_id)
);

-- ----------------------------------------------------------------------------
-- 6. COMUNICAÇÃO
-- ----------------------------------------------------------------------------

CREATE TABLE mensagens (
    id              TEXT PRIMARY KEY,
    titulo          TEXT NOT NULL,
    corpo           TEXT NOT NULL,
    autor_id        TEXT NOT NULL,
    publico_alvo    TEXT NOT NULL DEFAULT 'todos' CHECK (publico_alvo IN ('todos','curso','individual')),
    curso_id        TEXT,
    agendado_para   TEXT,
    enviado_em      TEXT,
    criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    CHECK (publico_alvo != 'curso' OR curso_id IS NOT NULL)
);

-- Rastreia individualmente quem recebeu e quem leu — necessário pra
-- "taxa de leitura" do painel admin (spec de design, seção 4.7).
CREATE TABLE mensagem_destinatarios (
    id          TEXT PRIMARY KEY,
    mensagem_id TEXT NOT NULL,
    aluno_id    TEXT NOT NULL,
    lido_em     TEXT,

    FOREIGN KEY (mensagem_id) REFERENCES mensagens(id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id)    REFERENCES alunos(usuario_id) ON DELETE CASCADE,
    UNIQUE (mensagem_id, aluno_id)
);

CREATE TABLE notificacoes (
    id          TEXT PRIMARY KEY,
    aluno_id    TEXT NOT NULL,
    tipo        TEXT NOT NULL CHECK (tipo IN ('curso','certificado','presenca','mensagem','sistema')),
    titulo      TEXT NOT NULL,
    corpo       TEXT NOT NULL,
    link        TEXT,
    lida        INTEGER NOT NULL DEFAULT 0 CHECK (lida IN (0,1)),
    criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

    FOREIGN KEY (aluno_id) REFERENCES alunos(usuario_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 7. AUDITORIA (obrigatória — PDF seção 5.2 "registro de logs")
-- ----------------------------------------------------------------------------

CREATE TABLE audit_logs (
    id              TEXT PRIMARY KEY,
    usuario_id      TEXT,
    acao            TEXT NOT NULL CHECK (acao IN ('criar','editar','excluir','bloquear','desbloquear','emitir_certificado','revogar_certificado')),
    entidade        TEXT NOT NULL,
    entidade_id     TEXT,
    valores_antes   TEXT,
    valores_depois  TEXT,
    criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX idx_papeis_papel                  ON papeis(papel);
CREATE INDEX idx_cursos_universidade_id        ON cursos(universidade_id);
CREATE INDEX idx_cursos_status                 ON cursos(status);
CREATE INDEX idx_atividades_curso_id           ON atividades(curso_id);
CREATE INDEX idx_atividades_data               ON atividades(data);
CREATE INDEX idx_inscricoes_aluno_id           ON inscricoes(aluno_id);
CREATE INDEX idx_inscricoes_curso_id           ON inscricoes(curso_id);
CREATE INDEX idx_presencas_inscricao_id        ON presencas(inscricao_id);
CREATE INDEX idx_presencas_atividade_id        ON presencas(atividade_id);
CREATE INDEX idx_certificados_status           ON certificados(status);
CREATE INDEX idx_perguntas_teste_id            ON perguntas(teste_id);
CREATE INDEX idx_alternativas_pergunta_id      ON alternativas(pergunta_id);
CREATE INDEX idx_resultados_perfil_aluno_id    ON resultados_perfil(aluno_id);
CREATE INDEX idx_mensagem_destinatarios_aluno  ON mensagem_destinatarios(aluno_id);
CREATE INDEX idx_notificacoes_aluno_id         ON notificacoes(aluno_id);
CREATE INDEX idx_notificacoes_lida             ON notificacoes(lida);
CREATE INDEX idx_audit_logs_usuario_id         ON audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_entidade           ON audit_logs(entidade, entidade_id);

-- ============================================================================
-- TRIGGERS — regras de negócio garantidas no banco, não só na aplicação
-- ============================================================================

-- (1) vagas_disponiveis inicial = vagas_total ao criar o curso
CREATE TRIGGER trg_cursos_init_vagas
AFTER INSERT ON cursos
BEGIN
    UPDATE cursos SET vagas_disponiveis = NEW.vagas_total WHERE id = NEW.id;
END;

-- (2) decrementa vaga ao inscrever, bloqueia se lotado
CREATE TRIGGER trg_inscricao_decrementa_vaga
BEFORE INSERT ON inscricoes
WHEN (SELECT vagas_disponiveis FROM cursos WHERE id = NEW.curso_id) <= 0
BEGIN
    SELECT RAISE(ABORT, 'Curso sem vagas disponíveis');
END;

CREATE TRIGGER trg_inscricao_aplica_decremento
AFTER INSERT ON inscricoes
BEGIN
    UPDATE cursos SET vagas_disponiveis = vagas_disponiveis - 1 WHERE id = NEW.curso_id;
END;

-- (3) devolve vaga se inscrição for cancelada
CREATE TRIGGER trg_inscricao_cancelada_devolve_vaga
AFTER UPDATE OF status ON inscricoes
WHEN NEW.status = 'cancelado' AND OLD.status != 'cancelado'
BEGIN
    UPDATE cursos SET vagas_disponiveis = vagas_disponiveis + 1 WHERE id = NEW.curso_id;
END;

-- (4) certificado só pode ir para 'pronto' quando os 3 critérios existirem e todos atendidos
CREATE TRIGGER trg_certificado_bloqueia_pronto_sem_criterios
BEFORE UPDATE OF status ON certificados
WHEN NEW.status IN ('pronto','emitido')
     AND (SELECT COUNT(*) FROM certificado_criterios
          WHERE certificado_id = NEW.id AND atendido = 1) < 3
BEGIN
    SELECT RAISE(ABORT, 'Critérios de certificação não atendidos');
END;

-- (5) updated_at automático em cursos
CREATE TRIGGER trg_cursos_updated_at
AFTER UPDATE ON cursos
BEGIN
    UPDATE cursos SET atualizado_em = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

-- (6) só permite papéis admin_* para usuários sem registro em "alunos"
--     e só permite papel 'aluno' para usuários com registro em "alunos"
--     (evita o problema apontado no schema anterior: um usuario com
--     duas linhas em user_roles ao mesmo tempo)
-- Aqui isso é garantido estruturalmente por papeis ter usuario_id como PK
-- (não UNIQUE(usuario_id,role) como nos schemas anteriores) — um usuário
-- só pode ter UM papel por vez.

-- ============================================================================
-- VIEWS DE APOIO
-- ============================================================================

CREATE VIEW vw_cursos_ativos AS
SELECT * FROM cursos WHERE status IN ('planejado','em_andamento');

CREATE VIEW vw_certificados_pendentes AS
SELECT c.id, c.inscricao_id, i.aluno_id, i.curso_id,
       (SELECT COUNT(*) FROM certificado_criterios cc WHERE cc.certificado_id = c.id AND cc.atendido = 1) AS criterios_ok,
       (SELECT COUNT(*) FROM certificado_criterios cc WHERE cc.certificado_id = c.id) AS criterios_total
FROM certificados c
JOIN inscricoes i ON i.id = c.inscricao_id
WHERE c.status = 'pendente';

CREATE VIEW vw_frequencia_por_curso AS
SELECT a.curso_id,
       COUNT(DISTINCT p.inscricao_id) AS alunos_com_presenca,
       COUNT(p.id) AS total_checkins
FROM atividades a
LEFT JOIN presencas p ON p.atividade_id = a.id
GROUP BY a.curso_id;
=======

-- 5. INSCRIÇÕES
-- Relaciona usuários e cursos

CREATE TABLE enrollments (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    course_id   TEXT NOT NULL,

    status      TEXT NOT NULL DEFAULT 'enrolled'
                CHECK (
                    status IN (
                        'enrolled',
                        'attended',
                        'no_show',
                        'cancelled'
                    )
                ),

    attended_at TEXT,
    created_at  TEXT NOT NULL,

    UNIQUE (user_id, course_id),

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);


-- 6. CERTIFICADOS
-- Certificados emitidos após a conclusão dos cursos

CREATE TABLE certificates (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    course_id       TEXT,
    certificate_url TEXT,
    issued_at       TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE SET NULL
);


-- 7. INSTRUTORES
-- Professores ou responsáveis pelos cursos

CREATE TABLE instructors (
    id         TEXT PRIMARY KEY,
    full_name  TEXT NOT NULL,
    email      TEXT,
    bio        TEXT,
    created_at TEXT NOT NULL
);


-- 8. INSTRUTORES DOS CURSOS
-- Permite que um curso tenha um ou mais instrutores

CREATE TABLE course_instructors (
    id            TEXT PRIMARY KEY,
    course_id     TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    created_at    TEXT NOT NULL,

    UNIQUE (course_id, instructor_id),

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    FOREIGN KEY (instructor_id)
        REFERENCES instructors(id)
        ON DELETE CASCADE
);


-- 9. HORÁRIOS DOS CURSOS
-- Um curso pode ter diferentes aulas, datas ou horários

CREATE TABLE course_schedules (
    id         TEXT PRIMARY KEY,
    course_id  TEXT NOT NULL,
    starts_at  TEXT NOT NULL,
    ends_at    TEXT NOT NULL,
    location   TEXT,
    created_at TEXT NOT NULL,

    CHECK (ends_at > starts_at),

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);


-- 10. MATERIAIS DOS CURSOS
-- Links para apostilas, vídeos, apresentações e documentos

CREATE TABLE course_materials (
    id            TEXT PRIMARY KEY,
    course_id     TEXT NOT NULL,
    title         TEXT NOT NULL,
    material_url  TEXT NOT NULL,
    material_type TEXT,
    created_at    TEXT NOT NULL,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);


-- 11. CURSOS FAVORITOS
-- Cursos marcados como favoritos pelos usuários

CREATE TABLE favorites (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    course_id  TEXT NOT NULL,
    created_at TEXT NOT NULL,

    UNIQUE (user_id, course_id),

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);


-- 12. AVALIAÇÕES DOS CURSOS
-- Notas e comentários feitos pelos alunos

CREATE TABLE course_reviews (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    course_id  TEXT NOT NULL,

    rating     INTEGER NOT NULL
               CHECK (rating BETWEEN 1 AND 5),

    comment    TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    UNIQUE (user_id, course_id),

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);


-- 13. NOTIFICAÇÕES
-- Avisos direcionados aos usuários

CREATE TABLE notifications (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,

    is_read    INTEGER NOT NULL DEFAULT 0
               CHECK (is_read IN (0, 1)),

    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE
);


-- 14. LISTA DE ESPERA
-- Usuários interessados em cursos sem vagas disponíveis

CREATE TABLE waitlist (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    course_id  TEXT NOT NULL,

    position   INTEGER NOT NULL
               CHECK (position > 0),

    status     TEXT NOT NULL DEFAULT 'waiting'
               CHECK (
                   status IN (
                       'waiting',
                       'called',
                       'cancelled'
                   )
               ),

    created_at TEXT NOT NULL,

    UNIQUE (user_id, course_id),
    UNIQUE (course_id, position),

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);


-- 15. HISTÓRICO DE ALTERAÇÕES
-- Registra ações importantes realizadas no sistema

CREATE TABLE audit_logs (
    id          TEXT PRIMARY KEY,
    user_id     TEXT,
    action      TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id   TEXT,
    details     TEXT,
    created_at  TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE SET NULL
);


-- ÍNDICES
-- Índices melhoram a velocidade de consultas e relacionamentos

CREATE INDEX idx_user_roles_user_id
    ON user_roles(user_id);

CREATE INDEX idx_courses_university_id
    ON courses(university_id);

CREATE INDEX idx_enrollments_user_id
    ON enrollments(user_id);

CREATE INDEX idx_enrollments_course_id
    ON enrollments(course_id);

CREATE INDEX idx_certificates_user_id
    ON certificates(user_id);

CREATE INDEX idx_certificates_course_id
    ON certificates(course_id);

CREATE INDEX idx_course_instructors_course_id
    ON course_instructors(course_id);

CREATE INDEX idx_course_instructors_instructor_id
    ON course_instructors(instructor_id);

CREATE INDEX idx_course_schedules_course_id
    ON course_schedules(course_id);

CREATE INDEX idx_course_materials_course_id
    ON course_materials(course_id);

CREATE INDEX idx_favorites_user_id
    ON favorites(user_id);

CREATE INDEX idx_favorites_course_id
    ON favorites(course_id);

CREATE INDEX idx_course_reviews_course_id
    ON course_reviews(course_id);

CREATE INDEX idx_notifications_user_id
    ON notifications(user_id);

CREATE INDEX idx_waitlist_course_id
    ON waitlist(course_id);

CREATE INDEX idx_audit_logs_user_id
    ON audit_logs(user_id);


-- VIEW DE APOIO

CREATE VIEW active_courses AS
SELECT *
FROM courses
WHERE is_active = 1;
>>>>>>> dbad80bc386efaee23cfb3a9f4c46a4856ebb2ee
