const fs = require("fs");
const path = require("path");
const banco = require("../../database/database");

const versaoSchema = 5;
const tabelasCentrais = [
  "usuarios", "credenciais", "papeis", "alunos", "universidades", "cursos",
  "atividades", "inscricoes", "presencas", "certificados", "certificado_criterios",
  "cards", "testes_perfil", "perguntas", "alternativas", "resultados_perfil",
  "resultado_respostas", "mensagens", "mensagem_destinatarios", "notificacoes", "audit_logs"
];

function ensureSchema() {
  banco.transaction(() => {
    const existentes = new Set(banco.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    ).all().map((tabela) => tabela.name));
    const presentes = tabelasCentrais.filter((nome) => existentes.has(nome));

    if (presentes.length === tabelasCentrais.length) {
      return;
    }

    if (presentes.length > 0) {
      const faltantes = tabelasCentrais.filter((nome) => !existentes.has(nome));
      throw new Error(`Banco com schema parcial. Nenhuma tabela foi alterada. Faltam: ${faltantes.join(", ")}. Revise o banco antes de iniciar o servidor.`);
    }

    const schema = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
    if (/\bDROP\b/i.test(schema)) {
      throw new Error("Inicializacao recusada: schema.sql contem DROP.");
    }

    banco.exec(schema);
    banco.pragma(`user_version = ${versaoSchema}`);
  }).immediate();
}

module.exports = ensureSchema;
