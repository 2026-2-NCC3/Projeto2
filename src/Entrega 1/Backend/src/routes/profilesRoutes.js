const express = require("express");
const profilesController = require("../controllers/profilesController");

const router = express.Router();

router.get("/", profilesController.listar);
router.post("/", profilesController.criar);

module.exports = router;
