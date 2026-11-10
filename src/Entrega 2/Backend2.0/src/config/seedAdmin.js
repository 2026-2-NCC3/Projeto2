require("dotenv").config();
const crypto = require("crypto");
const { validEmail, validPassword } = require("../utils/credentials");

let banco;

try {
  const email = (process.env.ADMIN_EMAIL || "").trim();
  const senha = process.env.ADMIN_PASSWORD;

  if (!validEmail(email) || !validPassword(senha)) {
    throw new Error("Informe ADMIN_EMAIL e ADMIN_PASSWORD com no minimo 12 caracteres.");
  }

  const bcrypt = require("bcryptjs");
  banco = require("../../database/database");

  const criado = banco.transaction(() => {
    const existente = banco.prepare(
      "SELECT id FROM usuarios WHERE email = ? COLLATE NOCASE"
    ).get(email);

    if (existente) {
      throw new Error("ACCOUNT_ALREADY_EXISTS");
    }

    const id = crypto.randomUUID();
    const senhaHash = bcrypt.hashSync(senha, 12);

    banco.prepare(`
      INSERT INTO usuarios (id, nome_completo, email) VALUES (?, ?, ?)
    `).run(id, "Administrador", email);
    banco.prepare(`
      INSERT INTO credenciais (usuario_id, senha_hash) VALUES (?, ?)
    `).run(id, senhaHash);
    banco.prepare(`
      INSERT INTO papeis (usuario_id, papel) VALUES (?, ?)
    `).run(id, "admin_super");

    return true;
  }).immediate();

  console.log(criado
    ? "Administrador criado com sucesso."
    : "Conta ja existe. Nenhum dado foi alterado.");
} catch (erro) {
  console.error("Seed nao executado. Verifique ADMIN_EMAIL, ADMIN_PASSWORD (minimo 12 caracteres) e a estrutura do banco.");
  process.exitCode = 1;
} finally {
  if (banco) {
    banco.close();
  }
}
