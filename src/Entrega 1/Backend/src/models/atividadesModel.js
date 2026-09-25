const banco = require("../../database/database");

function listar(cursoId = null) {
  const consulta = `
    SELECT a.*, c.titulo AS curso_titulo
    FROM atividades a
    INNER JOIN cursos c ON c.id = a.curso_id
    ${cursoId ? "WHERE a.curso_id = ?" : ""}
    ORDER BY a.data, a.hora_inicio
  `;

  return cursoId
    ? banco.prepare(consulta).all(cursoId)
    : banco.prepare(consulta).all();
}

function buscarPorId(id) {
  return banco.prepare("SELECT * FROM atividades WHERE id = ?").get(id);
}

function criar(atividade) {
  banco.prepare(`
    INSERT INTO atividades (
      id, curso_id, titulo, tipo, data, hora_inicio, hora_fim, local, link_online
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    atividade.id,
    atividade.curso_id,
    atividade.titulo,
    atividade.tipo,
    atividade.data,
    atividade.hora_inicio,
    atividade.hora_fim,
    atividade.local,
    atividade.link_online
  );

  return buscarPorId(atividade.id);
}

function atualizar(id, atividade) {
  banco.prepare(`
    UPDATE atividades
    SET curso_id = ?, titulo = ?, tipo = ?, data = ?, hora_inicio = ?,
        hora_fim = ?, local = ?, link_online = ?
    WHERE id = ?
  `).run(
    atividade.curso_id,
    atividade.titulo,
    atividade.tipo,
    atividade.data,
    atividade.hora_inicio,
    atividade.hora_fim,
    atividade.local,
    atividade.link_online,
    id
  );

  return buscarPorId(id);
}

function excluir(id) {
  return banco.prepare("DELETE FROM atividades WHERE id = ?").run(id).changes > 0;
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
