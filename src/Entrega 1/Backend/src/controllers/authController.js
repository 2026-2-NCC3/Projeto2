const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const banco = require("../../database/database");

function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "E-mail e senha são obrigatórios."
      });
    }

    const usuario = banco.prepare(`
      SELECT
        p.id,
        p.full_name,
        p.email,
        p.password_hash,
        p.is_blocked,
        ur.role
      FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE LOWER(p.email) = LOWER(?)
      LIMIT 1
    `).get(email.trim());

    if (!usuario) {
      return res.status(401).json({
        erro: "E-mail ou senha incorretos."
      });
    }

    const senhaCorreta = bcrypt.compareSync(
      senha,
      usuario.password_hash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: "E-mail ou senha incorretos."
      });
    }

    if (usuario.is_blocked) {
      return res.status(403).json({
        erro: "Usuário bloqueado."
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        erro: "Configuração de autenticação ausente."
      });
    }

    const papel = usuario.role === "student"
      ? "aluno"
      : usuario.role;

    const token = jwt.sign(
      {
        usuario_id: usuario.id,
        papel
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h"
      }
    );

    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nome_completo: usuario.full_name,
        email: usuario.email,
        papel
      }
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = { login };