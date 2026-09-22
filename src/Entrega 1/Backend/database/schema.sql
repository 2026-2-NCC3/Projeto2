
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

CREATE TABLE universities (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    logo_url    TEXT,
    description TEXT,
    created_at  TEXT NOT NULL
);


-- 4. CURSOS
-- Cursos disponibilizados pelas universidades

CREATE TABLE courses (
    id              TEXT PRIMARY KEY,
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

    FOREIGN KEY (university_id)
        REFERENCES universities(id)
        ON DELETE SET NULL
);


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