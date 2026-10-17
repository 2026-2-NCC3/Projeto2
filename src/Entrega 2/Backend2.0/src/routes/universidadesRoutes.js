const express = require("express");
const universidadesController = require("../controllers/universidadesController");
const {
  requireAuth,
  requireAdmin
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Universidades são públicas para que o aplicativo possa listar parceiros.
router.get("/", universidadesController.listar);
router.get("/:id", universidadesController.buscarPorId);

// Escritas mudam parceiros institucionais; por isso exigem um administrador autenticado.
router.post("/", requireAuth, requireAdmin, universidadesController.criar);
router.put("/:id", requireAuth, requireAdmin, universidadesController.atualizar);
router.delete("/:id", requireAuth, requireAdmin, universidadesController.excluir);

module.exports = router;
