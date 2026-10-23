const jwt = require("jsonwebtoken");
const profilesModel = require("../models/profilesModel");

function requireAuth(req, res, next) {
  const cabecalho = req.headers.authorization;
  const token = cabecalho && cabecalho.startsWith("Bearer ")
    ? cabecalho.slice(7)
    : null;

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof payload.usuario_id !== "string" || !payload.usuario_id) {
      return res.status(401).json({ erro: "Não autorizado" });
    }

    const usuario = profilesModel.buscarEstadoAutenticacao(payload.usuario_id);
    if (!usuario || usuario.ativo !== 1 || usuario.bloqueado !== 0) {
      return res.status(401).json({ erro: "Não autorizado" });
    }

    req.usuario = {
      id: usuario.id,
      papel: usuario.papel
    };

    return next();
  } catch (erro) {
    return res.status(401).json({ erro: "Não autorizado" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.usuario || !["admin_operador", "admin_super"].includes(req.usuario.papel)) {
    return res.status(403).json({
      erro: "Acesso restrito a administradores"
    });
  }

  return next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.usuario || req.usuario.papel !== "admin_super") {
    return res.status(403).json({
      erro: "Acesso restrito a administradores principais"
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireSuperAdmin
};
