const banco = require("../../database/database");

function listarDoAluno(alunoId) {
  return banco.prepare(`
    SELECT i.*, c.titulo, c.descricao, c.carga_horaria_horas, c.vagas_disponiveis,
           c.universidade_id, u.nome AS universidade_nome
    FROM inscricoes i
    INNER JOIN cursos c ON c.id = i.curso_id
    LEFT JOIN universidades u ON u.id = c.universidade_id
    WHERE i.aluno_id = ?
    ORDER BY i.criado_em DESC
  `).all(alunoId);
}

function buscarPorAlunoECurso(alunoId, cursoId) {
  return banco.prepare(`
    SELECT * FROM inscricoes
    WHERE aluno_id = ? AND curso_id = ?
  `).get(alunoId, cursoId);
}

function criar(inscricao) {
  banco.prepare(`
    INSERT INTO inscricoes (id, aluno_id, curso_id, status)
    VALUES (?, ?, ?, ?)
  `).run(inscricao.id, inscricao.aluno_id, inscricao.curso_id, inscricao.status);

  return banco.prepare("SELECT * FROM inscricoes WHERE id = ?").get(inscricao.id);
}

function cancelar(alunoId, cursoId) {
  return banco.prepare(`
    UPDATE inscricoes
    SET status = 'cancelado'
    WHERE aluno_id = ? AND curso_id = ? AND status != 'cancelado'
  `).run(alunoId, cursoId).changes > 0;
}

module.exports = { listarDoAluno, buscarPorAlunoECurso, criar, cancelar };
