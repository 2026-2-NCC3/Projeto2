const express = require("express");
const adminController = require("../controllers/adminController");
const {
  requireAuth,
  requireSuperAdmin
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Todas as rotas administrativas exigem um admin_super autenticado.
router.use(requireAuth, requireSuperAdmin);

router.get("/", adminController.listar);
router.post("/", adminController.criar);
router.put("/:id", adminController.atualizar);
router.patch("/:id/senha", adminController.redefinirSenha);
router.delete("/:id", adminController.excluir);

module.exports = router;
