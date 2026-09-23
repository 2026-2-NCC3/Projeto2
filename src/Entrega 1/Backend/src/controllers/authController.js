const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const banco = require("../../database/database");

function login(req, res, next) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(401).json({ erro: "Credenciais inválidas" });

    const usuario = banco.prepare(`
      SELECT u.id, u.nome_completo, u.email, c.senha_hash, p.papel
      FROM usuarios u
      INNER JOIN credenciais c ON c.usuario_id = u.id
      INNER JOIN papeis p ON p.usuario_id = u.id
      WHERE u.email = ? AND u.ativo = 1
    `).get(email);

    if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ erro: "Configuração de autenticação ausente." });
    }

    const token = jwt.sign(
      { usuario_id: usuario.id, papel: usuario.papel },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    return res.status(200).json({
      token,
      usuario: { id: usuario.id, nome_completo: usuario.nome_completo, email: usuario.email, papel: usuario.papel }
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = { login };
