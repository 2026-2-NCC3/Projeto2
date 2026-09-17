const fs = require("fs");
const path = require("path");
const banco = require("../../database/database");

const caminhoSchema = path.join(__dirname, "../../database/schema.sql");
const schema = fs.readFileSync(caminhoSchema, "utf8");

try {
    banco.exec(schema);
    console.log("Migration executada com sucesso. Tabela profiles criada.");
} catch (erro) {
    console.error("Erro ao executar a migration:", erro.message);
    process.exitCode = 1;
} finally {
    banco.close();
}
