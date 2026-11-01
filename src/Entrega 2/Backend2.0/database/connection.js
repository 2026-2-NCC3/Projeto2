const path = require("path");
const Database = require("better-sqlite3");

function openDatabase({ create = false } = {}) {
  const filename = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, "proxima_etapa.db");
  const db = new Database(filename, { fileMustExist: !create, timeout: 5000 });
  try {
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = FULL");
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

module.exports = { openDatabase };
