const banco = require("../../database/database");

const campos = `
  u.id,
  u.nome_completo,
  u.email,
  u.criado_em,
  p.papel
`;

function listar() {
  return banco.prepare(`
    SELECT ${campos}
    FROM usuarios u
    INNER JOIN papeis p ON p.usuario_id = u.id
    WHERE p.papel IN (?, ?)
    ORDER BY u.criado_em DESC
  `).all("admin_operador", "admin_super");
}

function buscarPorId(id) {
  return banco.prepare(`
    SELECT ${campos}
    FROM usuarios u
    INNER JOIN papeis p ON p.usuario_id = u.id
    WHERE u.id = ?
      AND p.papel IN (?, ?)
  `).get(id, "admin_operador", "admin_super");
}

function buscarPorEmail(email) {
  return banco.prepare(`
    SELECT id, email
    FROM usuarios
    WHERE email = ?
  `).get(email);
}

function contarSuperAdmins() {
  return banco.prepare(`
    SELECT COUNT(*) AS total
    FROM papeis
    WHERE papel = ?
  `).get("admin_super").total;
}

function criar(admin) {
  const inserir = banco.transaction(() => {
    banco.prepare(`
      INSERT INTO usuarios (id, nome_completo, email)
      VALUES (?, ?, ?)
    `).run(admin.id, admin.nome_completo, admin.email);

    banco.prepare(`
      INSERT INTO credenciais (usuario_id, senha_hash)
      VALUES (?, ?)
    `).run(admin.id, admin.senha_hash);

    banco.prepare(`
      INSERT INTO papeis (usuario_id, papel)
      VALUES (?, ?)
    `).run(admin.id, admin.papel);
  });

  inserir();

  return buscarPorId(admin.id);
}

function atualizar(id, admin) {
  const atualizarAdmin = banco.transaction(() => {
    banco.prepare(`
      UPDATE usuarios
      SET nome_completo = ?, email = ?
      WHERE id = ?
    `).run(admin.nome_completo, admin.email, id);

    banco.prepare(`
      UPDATE papeis
      SET papel = ?
      WHERE usuario_id = ?
    `).run(admin.papel, id);
  });

  atualizarAdmin();

  return buscarPorId(id);
}

function redefinirSenha(id, senhaHash) {
  banco.prepare(`
    UPDATE credenciais
    SET senha_hash = ?
    WHERE usuario_id = ?
  `).run(senhaHash, id);
}

function excluir(id) {
  return banco.prepare("DELETE FROM usuarios WHERE id = ?").run(id).changes > 0;
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorEmail,
  contarSuperAdmins,
  criar,
  atualizar,
  redefinirSenha,
  excluir
};
