const express = require("express");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const controller = require("../controllers/mensagensController");
const router = express.Router();

router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.use(requireAuth);
const aluno = (req, res, next) => req.usuario.papel === "aluno" ? next()
  : res.status(403).json({ erro: "Operacao exclusiva para alunos" });
router.get("/minhas", aluno, controller.minhas);
router.put("/:id/leitura", aluno, controller.ler);
router.get("/", requireAdmin, controller.listar);
router.post("/", requireAdmin, controller.criar);
router.post("/:id/publicar", requireAdmin, controller.publicar);
router.put("/:id", requireAdmin, controller.editar);
router.delete("/:id", requireAdmin, controller.excluir);
router.get("/:id", controller.buscar);
module.exports = router;
