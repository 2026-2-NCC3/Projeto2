const express = require("express");
const atividadesController = require("../controllers/atividadesController");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", atividadesController.listar);
router.post("/", requireAuth, requireAdmin, atividadesController.criar);
router.put("/:id", requireAuth, requireAdmin, atividadesController.atualizar);
router.delete("/:id", requireAuth, requireAdmin, atividadesController.excluir);

module.exports = router;
