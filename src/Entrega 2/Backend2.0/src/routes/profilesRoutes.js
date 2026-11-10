const express = require("express");
const profilesController = require("../controllers/profilesController");
const {
  requireAuth,
  requireAdmin
} = require("../middlewares/authMiddleware");

const router = express.Router();

// A listagem exige administrador; o cadastro continua público.
router.get("/", requireAuth, requireAdmin, profilesController.listar);
router.post("/", profilesController.criar);

// A identidade das operacoes pessoais vem exclusivamente da sessao.
router.get("/me", requireAuth, (req, res, next) => {
  req.params.id = req.usuario.id;
  return profilesController.buscarPorId(req, res, next);
});
router.put("/me", requireAuth, (req, res, next) => {
  req.params.id = req.usuario.id;
  return profilesController.atualizar(req, res, next);
});

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
