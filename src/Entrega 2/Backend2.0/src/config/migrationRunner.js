const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

function loadMigration(version, name) {
  const sql = fs
    .readFileSync(
      path.join(__dirname, "../../database/migrations", name),
      "utf8",
    )
    .replace(/\r\n/g, "\n");
  return {
    version,
    name,
    sql,
    checksum: crypto.createHash("sha256").update(sql).digest("hex"),
  };
}

const migrations = [
  loadMigration(5, "005_baseline.sql"),
  loadMigration(6, "006_foreign_key_indexes.sql"),
  loadMigration(7, "007_access_events.sql"),
];
const latestVersion = migrations.at(-1).version;
const historySql = `CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`;

function fail(code) {
  const error = new Error(code);
  error.migrationCode = code;
  throw error;
}

function safeError(error) {
  if (/^[A-Z_]+$/.test(error.migrationCode || "")) {
    return error.migrationCode;
  }
  if (/^SQLITE_[A-Z_]+$/.test(error.code || "")) {
    return error.code;
  }
  return "DATABASE_OPERATION_FAILED";
}

const schemaObjects = (db) =>
  db.prepare(
    "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name",
  ).all();
const normalizeSchemaSql = (sql) =>
  sql.replace(/\s+/g, " ").trim().replace(/;$/, "");

// Contrato congelado do schema v5: constraints, indices, views e triggers.
// Objetos extras da ONG sao permitidos e nunca removidos. Divergencias exigem
// uma migracao especifica revisada; nao se adivinha conversao de dados legados.
function assertContract(db, version) {
  const reference = new Database(":memory:");
  try {
    for (const migration of migrations.filter(
      (migration) => migration.version <= version,
    )) {
      reference.exec(migration.sql);
    }
    const actual = new Map(
      schemaObjects(db).map((schemaObject) => [
        schemaObject.name,
        schemaObject,
      ]),
    );
    for (const expected of schemaObjects(reference)) {
      const found = actual.get(expected.name);
      if (
        !found ||
        found.type !== expected.type ||
        normalizeSchemaSql(found.sql || "") !==
          normalizeSchemaSql(expected.sql || "")
      ) {
        fail("SCHEMA_INCOMPATIBLE");
      }
    }
  } finally {
    reference.close();
  }
}

function assertIntegrity(db) {
  if (db.pragma("foreign_keys", { simple: true }) !== 1) {
    fail("FOREIGN_KEYS_DISABLED");
  }
  if (db.pragma("quick_check", { simple: true }) !== "ok") {
    fail("INTEGRITY_CHECK_FAILED");
  }
  if (db.pragma("foreign_key_check").length) {
    fail("FOREIGN_KEY_CHECK_FAILED");
  }
}

function readHistory(db) {
  const table = schemaObjects(db).find(
    (schemaObject) => schemaObject.name === "schema_migrations",
  );
  if (!table) {
    return [];
  }
  if (
    table.type !== "table" ||
    normalizeSchemaSql(table.sql) !== normalizeSchemaSql(historySql)
  ) {
    fail("HISTORY_INCOMPATIBLE");
  }
  const rows = db
    .prepare(
      "SELECT version, name, checksum FROM schema_migrations ORDER BY version",
    )
    .all();
  if (!rows.length) {
    fail("HISTORY_INCOMPATIBLE");
  }
  rows.forEach((row, index) => {
    const expected = migrations[index];
    if (
      !expected ||
      row.version !== expected.version ||
      row.name !== expected.name ||
      row.checksum !== expected.checksum
    ) {
      fail("HISTORY_INCOMPATIBLE");
    }
  });
  if (db.pragma("user_version", { simple: true }) !== rows.at(-1).version) {
    fail("VERSION_INCOMPATIBLE");
  }
  return rows;
}

function assertCurrent(db) {
  const rows = readHistory(db);
  if (rows.at(-1)?.version !== latestVersion) {
    fail("MIGRATION_REQUIRED");
  }
  assertContract(db, latestVersion);
  assertIntegrity(db);
}

function runMigrations(db, { initialize = false } = {}) {
  // Uma transacao IMMEDIATE protege verificacao, DDL, historico e versao.
  // Em erro, better-sqlite3 reverte tudo; foreign_keys nunca e desligado.
  return db
    .transaction(() => {
      assertIntegrity(db);
      const existingObjects = schemaObjects(db);
      const isEmpty = existingObjects.length === 0;
      const version = db.pragma("user_version", { simple: true });
      if (initialize && (!isEmpty || version !== 0)) {
        fail("INITIALIZATION_REQUIRES_EMPTY_DATABASE");
      }
      if (isEmpty && !initialize) {
        fail("INITIALIZATION_REQUIRED");
      }
      const history = readHistory(db);
      if (!history.length && !isEmpty) {
        if (![0, 5].includes(version)) {
          fail("VERSION_INCOMPATIBLE");
        }
        assertContract(db, 5);
      } else if (!history.length && version !== 0) {
        fail("VERSION_INCOMPATIBLE");
      }
      if (history.length) {
        assertContract(db, history.at(-1).version);
      }
      if (history.length === migrations.length) {
        return [];
      }
      if (!history.length) {
        db.exec(historySql);
      }
      const record = db.prepare(
        "INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)",
      );
      const applied = [];
      for (const migration of migrations.slice(history.length)) {
        // v5 existente e validado e adotado sem executar novamente o schema.
        if (!(migration.version === 5 && !isEmpty)) {
          db.exec(migration.sql);
        }
        assertContract(db, migration.version);
        assertIntegrity(db);
        record.run(migration.version, migration.name, migration.checksum);
        db.pragma(`user_version = ${migration.version}`);
        applied.push(migration.version);
      }
      return applied;
    })
    .immediate();
}

module.exports = { runMigrations, assertCurrent, safeError };
