const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const adminModel = require("../models/adminModel");
const {
  executarEscrita,
  registrarAuditoria
} = require("../utils/controllerUtils");

const papeisAdministrativos = ["admin_operador", "admin_super"];

function papelAdministrativoValido(papel) {
  return papeisAdministrativos.includes(papel);
}

function dadosDoAdmin(body, atual = {}) {
  return {
    nome_completo: body.nome_completo ?? atual.nome_completo,
    email: body.email ?? atual.email,
    papel: body.papel ?? atual.papel
  };
}

function listar(req, res, next) {
  try {
    return res.json(adminModel.listar());
  } catch (erro) {
    return next(erro);
  }
}

function criar(req, res, next) {
  return executarEscrita(res, next, () => {
    const admin = dadosDoAdmin(req.body);

    if (!admin.nome_completo || !admin.email || !req.body.senha || !admin.papel) {
      return res.status(400).json({
        erro: "nome_completo, email, senha e papel são obrigatórios"
      });
    }

    if (!papelAdministrativoValido(admin.papel)) {
      return res.status(400).json({
        erro: "papel deve ser admin_operador ou admin_super"
      });
    }

    if (adminModel.buscarPorEmail(admin.email)) {
      return res.status(400).json({
        erro: "Este e-mail já está cadastrado"
      });
    }

    const criado = adminModel.criar({
      ...admin,
      id: crypto.randomUUID(),
      senha_hash: bcrypt.hashSync(req.body.senha, 12)
    });

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "criar",
      entidade: "usuarios",
      entidadeId: criado.id,
      valoresDepois: criado
    });

    return res.status(201).json(criado);
  });
}

function atualizar(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = adminModel.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Administrador não encontrado" });
    }

    const admin = dadosDoAdmin(req.body, atual);

    if (!admin.nome_completo || !admin.email || !admin.papel) {
      return res.status(400).json({
        erro: "nome_completo, email e papel são obrigatórios"
      });
    }

    if (!papelAdministrativoValido(admin.papel)) {
      return res.status(400).json({
        erro: "papel deve ser admin_operador ou admin_super"
      });
    }

    if (
      atual.papel === "admin_super" &&
      admin.papel !== "admin_super" &&
      adminModel.contarSuperAdmins() <= 1
    ) {
      return res.status(400).json({
        erro: "Não é possível remover o último admin_super do sistema"
      });
    }

    const atualizado = adminModel.atualizar(atual.id, admin);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "editar",
      entidade: "usuarios",
      entidadeId: atual.id,
      valoresAntes: atual,
      valoresDepois: atualizado
    });

    return res.json(atualizado);
  });
}

function redefinirSenha(req, res, next) {
  return executarEscrita(res, next, () => {
    const admin = adminModel.buscarPorId(req.params.id);

    if (!admin) {
      return res.status(404).json({ erro: "Administrador não encontrado" });
    }

    if (!req.body.senha) {
      return res.status(400).json({ erro: "senha é obrigatória" });
    }

    adminModel.redefinirSenha(
      admin.id,
      bcrypt.hashSync(req.body.senha, 12)
    );

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "editar",
      entidade: "credenciais",
      entidadeId: admin.id,
      valoresAntes: { usuario_id: admin.id },
      valoresDepois: { usuario_id: admin.id }
    });

    return res.status(204).end();
  });
}

function excluir(req, res, next) {
  return executarEscrita(res, next, () => {
    const admin = adminModel.buscarPorId(req.params.id);

    if (!admin) {
      return res.status(404).json({ erro: "Administrador não encontrado" });
    }

    if (admin.papel === "admin_super" && adminModel.contarSuperAdmins() <= 1) {
      return res.status(400).json({
        erro: "Não é possível excluir o último admin_super do sistema"
      });
    }

    adminModel.excluir(admin.id);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "excluir",
      entidade: "usuarios",
      entidadeId: admin.id,
      valoresAntes: admin
    });

    return res.status(204).end();
  });
}

module.exports = {
  listar,
  criar,
  atualizar,
  redefinirSenha,
  excluir
};
