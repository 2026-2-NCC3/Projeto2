const banco = require("../../database/database");

const campos = `
  u.id,
  u.nome_completo,
  u.email,
  u.telefone,
  u.foto_url,
  u.ativo,
  u.criado_em,
  u.atualizado_em,
  a.escola,
  a.serie,
  a.ano_letivo,
  a.cidade,
  a.consentimento_lgpd,
  a.consentimento_em,
  a.bloqueado,
  a.motivo_bloqueio
`;

function listar() {
  return banco.prepare(`
    SELECT ${campos}
    FROM usuarios u
    INNER JOIN alunos a ON a.usuario_id = u.id
    ORDER BY u.criado_em DESC
  `).all();
}

function buscarPorId(id) {
  return banco.prepare(`
    SELECT ${campos}
    FROM usuarios u
    INNER JOIN alunos a ON a.usuario_id = u.id
    WHERE u.id = ?
  `).get(id);
}

function criar(perfil) {
  const inserir = banco.transaction(() => {
    banco.prepare(`
      INSERT INTO usuarios (id, nome_completo, email, telefone, foto_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      perfil.id,
      perfil.nome_completo,
      perfil.email,
      perfil.telefone,
      perfil.foto_url
    );

    banco.prepare(`
      INSERT INTO credenciais (usuario_id, senha_hash)
      VALUES (?, ?)
    `).run(perfil.id, perfil.senha_hash);

    banco.prepare(`
      INSERT INTO papeis (usuario_id, papel)
      VALUES (?, ?)
    `).run(perfil.id, "aluno");

    banco.prepare(`
      INSERT INTO alunos (
        usuario_id, escola, serie, ano_letivo, cidade,
        consentimento_lgpd, consentimento_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      perfil.id,
      perfil.escola,
      perfil.serie,
      perfil.ano_letivo,
      perfil.cidade,
      perfil.consentimento_lgpd,
      perfil.consentimento_em
    );
  });

  inserir();

  return buscarPorId(perfil.id);
}

function atualizar(id, perfil) {
  const atualizarPerfil = banco.transaction(() => {
    banco.prepare(`
      UPDATE usuarios
      SET nome_completo = ?, email = ?, telefone = ?, foto_url = ?
      WHERE id = ?
    `).run(
      perfil.nome_completo,
      perfil.email,
      perfil.telefone,
      perfil.foto_url,
      id
    );

    banco.prepare(`
      UPDATE alunos
      SET escola = ?, serie = ?, ano_letivo = ?, cidade = ?
      WHERE usuario_id = ?
    `).run(
      perfil.escola,
      perfil.serie,
      perfil.ano_letivo,
      perfil.cidade,
      id
    );
  });

  atualizarPerfil();

  return buscarPorId(id);
}

function bloquear(id, bloqueado, motivo) {
  banco.prepare(`
    UPDATE alunos
    SET bloqueado = ?, motivo_bloqueio = ?
    WHERE usuario_id = ?
  `).run(bloqueado, motivo, id);

  return buscarPorId(id);
}

function excluir(id) {
  return banco.prepare("DELETE FROM usuarios WHERE id = ?").run(id).changes > 0;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  bloquear,
  excluir
};
