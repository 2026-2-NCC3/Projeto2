const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { tratarErroDoBanco } = require("../utils/controllerUtils");
const model = require("../models/notificacoesModel");
const router = express.Router();

router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.use(requireAuth);
router.use((req, res, next) => req.usuario.papel === "aluno" ? next()
  : res.status(403).json({ erro: "Operacao exclusiva para alunos" }));

function semCampos(body) {
  if (body !== undefined && (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length)) {
    throw new model.NotificationError(400, "Esta operacao nao recebe campos");
  }
}

function handle(operation) {
  return (req, res, next) => {
    try { return operation(req, res); }
    catch (error) {
      if (error instanceof model.NotificationError) return res.status(error.status).json({ erro: error.message });
      return tratarErroDoBanco(res, next, error);
    }
  };
}

router.get("/minhas", handle((req, res) => res.json(model.listar(req.usuario.id))));
router.post("/sincronizar", handle((req, res) => {
  semCampos(req.body);
  return res.json(model.sincronizar(req.usuario.id));
}));
router.get("/:id", handle((req, res) => {
  const notification = model.buscar(req.usuario.id, req.params.id);
  if (!notification) throw new model.NotificationError(404, "Notificacao indisponivel");
  return res.json(notification);
}));
router.put("/:id/leitura", handle((req, res) => {
  semCampos(req.body);
  return res.json(model.ler(req.usuario.id, req.params.id));
}));
module.exports = router;
