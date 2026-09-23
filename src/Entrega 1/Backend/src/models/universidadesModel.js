const banco = require("../../database/database");

const colunas = "id, nome, logo_url, site, descricao, criado_em";

function listar() {
  return banco.prepare(`
    SELECT ${colunas}
    FROM universidades
    ORDER BY criado_em DESC
  `).all();
}

function buscarPorId(id) {
  return banco.prepare(`
    SELECT ${colunas}
    FROM universidades
    WHERE id = ?
  `).get(id);
}

function criar(item) {
  banco.prepare(`
    INSERT INTO universidades (id, nome, logo_url, site, descricao)
    VALUES (?, ?, ?, ?, ?)
  `).run(item.id, item.nome, item.logo_url, item.site, item.descricao);

  return buscarPorId(item.id);
}

function atualizar(id, item) {
  banco.prepare(`
    UPDATE universidades
    SET nome = ?, logo_url = ?, site = ?, descricao = ?
    WHERE id = ?
  `).run(item.nome, item.logo_url, item.site, item.descricao, id);

  return buscarPorId(id);
}

function excluir(id) {
  return banco.prepare("DELETE FROM universidades WHERE id = ?").run(id).changes > 0;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  excluir
};
