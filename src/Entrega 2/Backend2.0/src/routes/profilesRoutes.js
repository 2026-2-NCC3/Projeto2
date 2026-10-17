const express = require("express");
const profilesController = require("../controllers/profilesController");
const {
  requireAuth,
  requireAdmin
} = require("../middlewares/authMiddleware");

const router = express.Router();

// A listagem e o cadastro são públicos para o fluxo atual do aplicativo.
router.get("/", profilesController.listar);
router.post("/", profilesController.criar);

// Perfil individual só pode ser lido/editado pelo dono autenticado ou por um administrador.
router.get("/:id", requireAuth, profilesController.buscarPorId);
router.put("/:id", requireAuth, profilesController.atualizar);

// Bloqueio e exclusão alteram o acesso do aluno e são exclusivos de administradores.
router.patch(
  "/:id/bloqueio",
  requireAuth,
  requireAdmin,
  profilesController.bloquear
);
router.delete("/:id", requireAuth, requireAdmin, profilesController.excluir);

module.exports = router;
