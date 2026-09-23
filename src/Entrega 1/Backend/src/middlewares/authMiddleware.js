const jwt = require("jsonwebtoken");

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

    req.usuario = {
      id: payload.usuario_id,
      papel: payload.papel
    };

    return next();
  } catch (erro) {
    return res.status(401).json({ erro: "Não autorizado" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.usuario || req.usuario.papel === "aluno") {
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
