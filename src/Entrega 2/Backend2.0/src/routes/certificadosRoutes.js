const express = require("express");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const model = require("../models/certificadosModel");
const router = express.Router();

// Origem de PDFs ainda nao validada: nunca publica arquivo_url nem busca URLs externas.
function publico(registro, administrativo) {
  const metadata = {
    id: registro.id,
    inscricao_id: registro.inscricao_id,
    curso_id: registro.curso_id,
    titulo: registro.titulo,
    carga_horaria_horas: registro.carga_horaria_horas,
    status: registro.status,
    emitido_em: registro.emitido_em,
    criterios: registro.criterios,
    arquivo_disponivel: false,
    arquivo_indisponivel_motivo: "armazenamento_nao_validado",
  };
  if (administrativo) {
    metadata.aluno_id = registro.aluno_id;
    metadata.aluno_nome = registro.aluno_nome;
  }
  return metadata;
}

router.use(requireAuth);
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.get("/minhas", (req, res, next) => {
  if (req.usuario.papel !== "aluno") {
    return res.status(403).json({ erro: "Consulta pessoal exclusiva para alunos" });
  }
  try {
    return res.json(model.listar(req.usuario.id).map(registro => publico(registro, false)));
  } catch (error) {
    return next(error);
  }
});
router.get("/", requireAdmin, (req, res, next) => {
  try {
    return res.json(model.listar().map(registro => publico(registro, true)));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
