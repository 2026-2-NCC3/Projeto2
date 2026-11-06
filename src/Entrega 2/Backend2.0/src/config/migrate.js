require("dotenv").config();
const { openDatabase } = require("../../database/connection");
const { runMigrations, safeError } = require("./migrationRunner");

let db;
try {
  const initialize = process.argv.includes("--init");
  db = openDatabase({ create: initialize });
  const applied = runMigrations(db, { initialize });
  console.log(applied.length
    ? `Migracoes concluidas: ${applied.join(", ")}.`
    : "Banco atualizado. Nenhuma alteracao necessaria.");
} catch (error) {
  console.error(`Migracao interrompida [${safeError(error)}]. Nenhuma migracao parcial foi mantida. Consulte database/MIGRATIONS.md.`);
  process.exitCode = 1;
} finally {
  if (db) db.close();
}
