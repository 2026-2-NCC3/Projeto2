const express = require("express");
const banco = require("../../database/database");
const { requireAuth } = require("../middlewares/authMiddleware");
const router = express.Router();
router.get("/", requireAuth, (req, res, next) => {
  if (req.usuario.papel !== "aluno") {
    return res
      .status(403)
      .json({ erro: "Agenda pessoal exclusiva para alunos" });
  }
  try {
    if (
      req.query.curso_id !== undefined &&
      typeof req.query.curso_id !== "string"
    ) {
      return res.status(400).json({ erro: "Curso invalido" });
    }
    const atividadesAgendadas = banco
      .prepare(`
      SELECT a.id, a.curso_id, a.titulo, a.tipo, a.data, a.hora_inicio, a.hora_fim,
             a.local, a.link_online, c.titulo AS curso_titulo, i.id AS inscricao_id
      FROM atividades a JOIN cursos c ON c.id=a.curso_id
      JOIN inscricoes i ON i.curso_id=c.id
      WHERE i.aluno_id=? AND i.status IN ('inscrito','cursando') AND c.status != 'cancelado'
        AND (? IS NULL OR c.id=?)
      ORDER BY a.data, a.hora_inicio, a.id
    `)
      .all(
        req.usuario.id,
        req.query.curso_id || null,
        req.query.curso_id || null,
      );
    res.json(atividadesAgendadas);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
