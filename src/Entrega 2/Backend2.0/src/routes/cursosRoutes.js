const express = require("express");
const cursosController = require("../controllers/cursosController");
const {
  requireAuth,
  requireAdmin
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Cursos são públicos para permitir sua exibição no aplicativo e no painel.
router.get("/", cursosController.listar);
router.get("/:id", cursosController.buscarPorId);

// Escritas afetam vagas e dados institucionais.
// Por isso, somente administradores autenticados podem executá-las.
router.post("/", requireAuth, requireAdmin, cursosController.criar);
router.put("/:id", requireAuth, requireAdmin, cursosController.atualizar);
router.delete("/:id", requireAuth, requireAdmin, cursosController.excluir);

module.exports = router;
