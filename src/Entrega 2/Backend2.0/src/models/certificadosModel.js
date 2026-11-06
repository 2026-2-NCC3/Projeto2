const banco = require("../../database/database");

// RFM09: somente leitura das entidades e criterios ja definidos pelo banco da ONG.
function listar(alunoId = null) {
  const registros = banco.prepare(`
    SELECT ce.id, ce.inscricao_id, ce.status, ce.emitido_em,
           c.id AS curso_id, c.titulo, c.carga_horaria_horas,
           i.aluno_id, u.nome_completo AS aluno_nome
    FROM certificados ce
    JOIN inscricoes i ON i.id = ce.inscricao_id
    JOIN cursos c ON c.id = i.curso_id
    JOIN usuarios u ON u.id = i.aluno_id
    ${alunoId === null ? "" : "WHERE i.aluno_id = ?"}
    ORDER BY ce.emitido_em DESC, c.titulo, ce.id
  `);
  const certificados = alunoId === null ? registros.all() : registros.all(alunoId);
  const consultarCriterios = banco.prepare(
    "SELECT criterio, atendido FROM certificado_criterios WHERE certificado_id = ? ORDER BY criterio"
  );
  return certificados.map(certificado => ({
    ...certificado,
    criterios: consultarCriterios.all(certificado.id),
  }));
}

module.exports = { listar };
