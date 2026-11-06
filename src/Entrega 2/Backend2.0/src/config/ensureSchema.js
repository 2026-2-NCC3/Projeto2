const { assertCurrent } = require("./migrationRunner");

// Somente leitura: o startup nunca inicializa nem migra o esquema.
module.exports = function ensureSchema(db) {
  db.transaction(() => assertCurrent(db))();
};
