--schema sqlite, tabelas de cursos, perfis, universidades/faculdades, certificados
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 1. USUÁRIOS (alunos e administradores)
-- Sem Supabase Auth: profiles é a raiz do usuário, com email/senha próprios
-- ---------------------------------------------------------------------

CREATE TABLE profiles (
    id                TEXT PRIMARY KEY,
    full_name         TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    password_hash     TEXT NOT NULL,          -- nunca armazenar senha em texto puro
    school            TEXT,
    grade             TEXT,
    school_year       TEXT,
    city              TEXT,
    phone             TEXT,
    points            INTEGER NOT NULL DEFAULT 0,
    courses_completed INTEGER NOT NULL DEFAULT 0,
    no_shows          INTEGER NOT NULL DEFAULT 0,
    is_blocked        INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
);

CREATE TABLE user_roles (
    id      TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role    TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    created_at TEXT NOT NULL,

    UNIQUE (user_id, role),

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. UNIVERSIDADES (instituições parceiras)
-- ---------------------------------------------------------------------

CREATE TABLE universities (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    logo_url    TEXT,
    description TEXT,
    created_at  TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- 3. CURSOS (dependem de universities)
-- ---------------------------------------------------------------------

CREATE TABLE courses (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    banner_url      TEXT,
    university_id   TEXT,
    location        TEXT,
    course_date     TEXT NOT NULL,
    total_spots     INTEGER NOT NULL DEFAULT 30,
    available_spots INTEGER NOT NULL DEFAULT 30,
    has_certificate INTEGER NOT NULL DEFAULT 0,
    category        TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,

    FOREIGN KEY (university_id)
        REFERENCES universities(id)
        ON DELETE SET NULL
);

-- 4. INSCRIÇÕES / PRESENÇA


CREATE TABLE enrollments (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    course_id     TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (
        status IN ('enrolled', 'attended', 'no_show', 'cancelled')
    ),

    attended_at   TEXT,
    created_at    TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,
    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    UNIQUE (user_id, course_id)
);


-- 5. CERTIFICADOS

CREATE TABLE certificates (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    course_id       TEXT,       -- opcional, conforme documento original
    certificate_url TEXT,
    issued_at       TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE,
    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE SET NULL
);

-- 6. ÍNDICES

CREATE INDEX idx_user_roles_user_id     ON user_roles(user_id);
CREATE INDEX idx_courses_university_id  ON courses(university_id);
CREATE INDEX idx_enrollments_user_id    ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id  ON enrollments(course_id);
CREATE INDEX idx_certificates_user_id   ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);

-- 7. VIEW DE APOIO

CREATE VIEW active_courses AS
SELECT * FROM courses WHERE is_active = 1;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    school TEXT,
    grade TEXT,
    school_year TEXT,
    city TEXT,
    phone TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    courses_completed INTEGER NOT NULL DEFAULT 0,
    no_shows INTEGER NOT NULL DEFAULT 0,
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
