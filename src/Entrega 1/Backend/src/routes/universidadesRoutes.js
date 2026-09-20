const express = require("express");
const universidadesController = require("../controllers/universidadesController");

const router = express.Router();

router.get("/", universidadesController.listar);
router.post("/", universidadesController.criar);

module.exports = router;