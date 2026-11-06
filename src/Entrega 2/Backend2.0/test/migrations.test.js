const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const { once } = require("node:events");
const Database = require("better-sqlite3");
const { runMigrations, assertCurrent } = require("../src/config/migrationRunner");

const root = path.resolve(__dirname, "..");
const baseline = fs.readFileSync(path.join(root, "database/schema.sql"), "utf8");

function fixture(t, legacy = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "proxima-migration-"));
  const filename = path.join(dir, "fictional.db");
  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("wal_autocheckpoint = 0");
  t.after(() => {
    if (db.open) db.close();
    // dir e exclusivamente o diretorio temporario criado acima.
    fs.rmSync(dir, { recursive: true, force: true });
  });
  if (legacy) {
    db.exec(baseline);
    db.pragma("user_version = 5");
  }
  return { db, filename, dir };
}

function populate(db) {
  db.exec(`
    INSERT INTO usuarios (id,nome_completo,email) VALUES ('u1','Aluno ficticio','teste@example.invalid');
    INSERT INTO credenciais (usuario_id,senha_hash) VALUES ('u1','hash-ficticio');
    INSERT INTO alunos (usuario_id,escola) VALUES ('u1','ONG teste');
    INSERT INTO papeis (usuario_id,papel) VALUES ('u1','aluno');
    INSERT INTO universidades (id,nome) VALUES ('uni1','Universidade ficticia');
    INSERT INTO cursos (id,titulo,data_inicio,vagas_total,universidade_id) VALUES ('c1','Curso ficticio','2026-01-01',10,'uni1');
    INSERT INTO atividades (id,curso_id,titulo,data,hora_inicio,hora_fim) VALUES ('a1','c1','Aula ficticia','2026-01-01','10:00','11:00');
    INSERT INTO inscricoes (id,aluno_id,curso_id) VALUES ('i1','u1','c1');
    INSERT INTO presencas (id,inscricao_id,atividade_id) VALUES ('p1','i1','a1');
    INSERT INTO certificados (id,inscricao_id) VALUES ('cert1','i1');
    INSERT INTO cards (aluno_id,numero_card) VALUES ('u1','FICTICIO-001');
    CREATE TABLE ong_original (id INTEGER PRIMARY KEY, valor TEXT);
    INSERT INTO ong_original VALUES (1,'preservar');
  `);
}

function snapshot(db) {
  return Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'schema_migrations' ORDER BY name").all()
    .map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replace(/"/g, '""')}" ORDER BY rowid`).all()]));
}

function cli(filename, args, extraEnv = {}) {
  return spawnSync(process.execPath, args, {
    cwd: root, encoding: "utf8", timeout: 15000,
    env: { ...process.env, DB_PATH: filename, JWT_SECRET: "test-only-secret", ...extraEnv }
  });
}

test("db:init cria banco vazio, versoes e esquema original; migrate e idempotente", (t) => {
  const { db, filename } = fixture(t);
  const result = cli(filename, ["src/config/migrate.js", "--init"]);
  assert.equal(result.status, 0, result.stderr);
  assertCurrent(db);
  assert.equal(db.pragma("user_version", { simple: true }), 6);
  assert.equal(db.prepare("SELECT count(*) AS n FROM schema_migrations").get().n, 2);
  const before = db.prepare("SELECT * FROM schema_migrations").all();
  assert.deepEqual(runMigrations(db), []);
  assert.deepEqual(db.prepare("SELECT * FROM schema_migrations").all(), before);
});

test("migra v5 populado com WAL ativo preservando todas as linhas, extras e relacionamentos", (t) => {
  const { db, filename } = fixture(t, true);
  populate(db);
  assert.ok(fs.statSync(`${filename}-wal`).size > 0);
  const before = snapshot(db);
  const result = cli(filename, ["src/config/migrate.js"], { CONFIRMAR_DROP: "sim" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(snapshot(db), before);
  assert.deepEqual(db.pragma("foreign_key_check"), []);
  assert.equal(db.prepare("SELECT vagas_disponiveis FROM cursos").get().vagas_disponiveis, 9);
  assert.throws(() => db.prepare("INSERT INTO alunos (usuario_id) VALUES ('ausente')").run(), /FOREIGN KEY/);
  assertCurrent(db);
  assert.equal(cli(filename, ["src/config/migrate.js", "--init"]).status, 1);
  assert.deepEqual(snapshot(db), before);
});

test("adota v5 sem user_version e sem substituir registros", (t) => {
  const { db } = fixture(t, true);
  populate(db);
  db.pragma("user_version = 0");
  const before = snapshot(db);
  assert.deepEqual(runMigrations(db), [5, 6]);
  assert.deepEqual(snapshot(db), before);
});

test("falha no segundo indice reverte DDL anterior, historico e versao", (t) => {
  const { db, filename } = fixture(t, true);
  populate(db);
  // Colisao real de nome: o primeiro CREATE INDEX da v6 funciona antes da falha.
  db.exec("CREATE INDEX idx_resultado_respostas_pergunta_id ON ong_original(valor)");
  const before = snapshot(db);
  const structure = db.prepare("SELECT * FROM sqlite_master ORDER BY name").all();
  assert.throws(() => runMigrations(db), /already exists/);
  const result = cli(filename, ["src/config/migrate.js"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SQLITE_ERROR/);
  assert.doesNotMatch(result.stderr, /already exists|ONG teste|hash-ficticio/);
  assert.deepEqual(snapshot(db), before);
  assert.deepEqual(db.prepare("SELECT * FROM sqlite_master ORDER BY name").all(), structure);
  assert.equal(db.pragma("user_version", { simple: true }), 5);
  assert.equal(db.pragma("foreign_keys", { simple: true }), 1);
  assert.deepEqual(db.pragma("foreign_key_check"), []);
});

test("esquema legado desconhecido ou parcial e recusado sem alteracao", (t) => {
  const { db, filename } = fixture(t);
  db.exec("CREATE TABLE usuarios (id TEXT PRIMARY KEY, email TEXT); INSERT INTO usuarios VALUES ('u1','ficticio@example.invalid')");
  const before = snapshot(db);
  assert.throws(() => runMigrations(db), /SCHEMA_INCOMPATIBLE/);
  assert.deepEqual(snapshot(db), before);
  assert.equal(cli(filename, ["server.js"]).status, 1);
  assert.deepEqual(snapshot(db), before);
});

test("versao futura e historico adulterado sao recusados", (t) => {
  const { db } = fixture(t, true);
  db.pragma("user_version = 99");
  assert.throws(() => runMigrations(db), /VERSION_INCOMPATIBLE/);
  db.pragma("user_version = 5");
  runMigrations(db);
  db.prepare("UPDATE schema_migrations SET checksum = 'adulterado' WHERE version = 5").run();
  assert.throws(() => assertCurrent(db), /HISTORY_INCOMPATIBLE/);
  assert.throws(() => runMigrations(db), /HISTORY_INCOMPATIBLE/);
});

test("orfao preexistente bloqueia migracao sem tentar corrigir ou apagar dados", (t) => {
  const { db } = fixture(t, true);
  db.pragma("foreign_keys = OFF");
  db.exec("INSERT INTO alunos (usuario_id) VALUES ('orfao-ficticio')");
  db.pragma("foreign_keys = ON");
  const before = snapshot(db);
  assert.throws(() => runMigrations(db), /FOREIGN_KEY_CHECK_FAILED/);
  assert.deepEqual(snapshot(db), before);
  assert.equal(db.pragma("user_version", { simple: true }), 5);
});

test("lock concorrente causa interrupcao sem alteracoes parciais", (t) => {
  const { db, filename } = fixture(t, true);
  populate(db);
  const before = snapshot(db);
  const competitor = new Database(filename, { timeout: 20 });
  competitor.pragma("foreign_keys = ON");
  try {
    db.exec("BEGIN IMMEDIATE");
    assert.throws(() => runMigrations(competitor), /locked/);
    db.exec("ROLLBACK");
    assert.deepEqual(snapshot(db), before);
    assert.equal(db.pragma("user_version", { simple: true }), 5);
  } finally {
    if (db.inTransaction) db.exec("ROLLBACK");
    competitor.close();
  }
});

test("backup via API inclui registros ainda no WAL sem modificar a origem", async (t) => {
  const { db, filename, dir } = fixture(t, true);
  populate(db);
  const before = snapshot(db);
  const result = cli(filename, ["src/config/backup.js"]);
  assert.equal(result.status, 0, result.stderr);
  const backup = new Database(path.join(dir, fs.readdirSync(dir).find((name) => name.includes(".backup-") && name.endsWith(".db"))));
  try {
    assert.deepEqual(snapshot(backup), before);
    assert.equal(backup.pragma("quick_check", { simple: true }), "ok");
    assert.deepEqual(backup.pragma("foreign_key_check"), []);
  } finally {
    backup.close();
  }
  assert.deepEqual(snapshot(db), before);
});

test("startup nao cria arquivo ausente nem inicializa banco vazio ou migra v5", (t) => {
  const { db, dir, filename } = fixture(t);
  const absent = path.join(dir, "missing.db");
  assert.equal(cli(absent, ["server.js"]).status, 1);
  assert.equal(fs.existsSync(absent), false);
  assert.equal(cli(filename, ["server.js"]).status, 1);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master").get().n, 0);
  db.exec(baseline);
  populate(db);
  const before = snapshot(db);
  assert.equal(cli(filename, ["server.js"]).status, 1);
  assert.deepEqual(snapshot(db), before);
});

async function startAndStop(filename) {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, DB_PATH: filename, PORT: "0", JWT_SECRET: "test-only-secret" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  const exited = once(child, "exit");
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Startup timeout: ${output}`)), 10000);
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.includes("Servidor executando")) { clearTimeout(timer); resolve(); }
      });
      child.once("error", (error) => { clearTimeout(timer); reject(error); });
      child.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Startup exit ${code}: ${output}`)); });
      child.stderr.on("data", (chunk) => { output += chunk; });
    });
    const port = output.match(/localhost:(\d+)/)[1];
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "online");
  } finally {
    child.kill();
    await exited;
  }
}

test("tres inicializacoes HTTP reais preservam todas as linhas, esquema e historico", async (t) => {
  const { db, filename } = fixture(t);
  runMigrations(db, { initialize: true });
  populate(db);
  const before = snapshot(db);
  const structure = db.prepare("SELECT * FROM sqlite_master ORDER BY name").all();
  const history = db.prepare("SELECT * FROM schema_migrations").all();
  for (let index = 0; index < 3; index++) {
    await startAndStop(filename);
    assert.deepEqual(snapshot(db), before);
    assert.deepEqual(db.prepare("SELECT * FROM sqlite_master ORDER BY name").all(), structure);
    assert.deepEqual(db.prepare("SELECT * FROM schema_migrations").all(), history);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  }
});
