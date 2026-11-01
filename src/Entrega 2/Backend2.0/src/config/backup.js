require("dotenv").config();
const crypto = require("crypto");
const { openDatabase } = require("../../database/connection");
const { safeError } = require("./migrationRunner");

async function main() {
  let db;
  try {
    db = openDatabase();
    // API de backup SQLite inclui commits no WAL. Nome unico evita sobrescrita.
    await db.backup(`${db.name}.backup-${crypto.randomUUID()}.db`);
    console.log("Backup consistente criado ao lado do banco com sufixo backup e identificador unico.");
  } catch (error) {
    console.error(`Backup interrompido [${safeError(error)}].`);
    process.exitCode = 1;
  } finally {
    if (db) db.close();
  }
}

main();
