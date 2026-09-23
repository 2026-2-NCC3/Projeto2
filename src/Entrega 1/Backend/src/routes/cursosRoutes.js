const express = require("express");
const cursosController = require("../controllers/cursosController");

const router = express.Router();

router.get("/", cursosController.listar);
router.post("/", cursosController.criar);

module.exports = router;
