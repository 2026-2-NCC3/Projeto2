const express = require("express");
const inscricoesController = require("../controllers/inscricoesController");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/minhas", requireAuth, inscricoesController.listarMinhas);
router.post("/", requireAuth, inscricoesController.criar);
router.patch("/:cursoId/cancelamento", requireAuth, inscricoesController.cancelar);

module.exports = router;
