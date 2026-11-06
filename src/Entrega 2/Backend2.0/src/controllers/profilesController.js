const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const model = require("../models/profilesModel");
const {
  executarEscrita,
  registrarAuditoria
} = require("../utils/controllerUtils");

function dadosDoPerfil(body, atual = {}) {
  return {
    nome_completo: body.nome_completo ?? atual.nome_completo,
    email: body.email ?? atual.email,
    telefone: body.telefone ?? atual.telefone ?? null,
    foto_url: body.foto_url ?? atual.foto_url ?? null,
    escola: body.escola ?? atual.escola ?? null,
    serie: body.serie ?? atual.serie ?? null,
    ano_letivo: body.ano_letivo ?? atual.ano_letivo ?? null,
    cidade: body.cidade ?? atual.cidade ?? null
  };
}

function perfilPublico(perfil, administrativo) {
  if (administrativo) {
    return perfil;
  }
  const {
    ativo,
    bloqueado,
    motivo_bloqueio,
    criado_em,
    atualizado_em,
    ...pessoal
  } = perfil;
  return pessoal;
}

function ehAdmin(req) {
  return ["admin_operador", "admin_super"].includes(req.usuario.papel);
}

function listar(req, res, next) {
  try {
    return res.json(model.listar());
  } catch (erro) {
    return next(erro);
  }
}

function buscarPorId(req, res, next) {
  try {
    if (!ehAdmin(req) && req.usuario.id !== req.params.id) {
      return res.status(403).json({ erro: "Acesso negado" });
    }
    const perfil = model.buscarPorId(req.params.id);

    if (!perfil) {
      return res.status(404).json({ erro: "Aluno não encontrado" });
    }

    if (!ehAdmin(req) && req.usuario.id !== perfil.id) {
      return res.status(403).json({
        erro: "Você só pode consultar o próprio perfil"
      });
    }

    return res.json(perfilPublico(perfil, ehAdmin(req)));
  } catch (erro) {
    return next(erro);
  }
}

function criar(req, res, next) {
  return executarEscrita(res, next, () => {
    const body = req.body;
    if (!body || Array.isArray(body) || typeof body !== "object"
        || typeof body.nome_completo !== "string" || !body.nome_completo.trim()
        || typeof body.email !== "string" || !body.email.trim()
        || typeof body.senha !== "string" || !body.senha
        || Buffer.byteLength(body.senha, "utf8") > 72) {
      return res.status(400).json({ erro: "Informe nome, e-mail e senha validos (senha de ate 72 bytes)." });
    }
    const perfil = dadosDoPerfil(body);
    perfil.nome_completo = perfil.nome_completo.trim();
    const consentimentoLgp = req.body.consentimento_lgpd ?? 0;

    if (!perfil.nome_completo || !perfil.email || !req.body.senha) {
      return res.status(400).json({
        erro: "nome_completo, email e senha são obrigatórios"
      });
    }

    const email = String(perfil.email || "").trim();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email)) {
      return res.status(400).json({
        erro: "Informe um e-mail válido."
      });
    }

    perfil.email = email;

    const criado = model.criar({
      ...perfil,
      id: crypto.randomUUID(),
      senha_hash: bcrypt.hashSync(req.body.senha, 12),
      consentimento_lgpd: consentimentoLgp,
      consentimento_em: consentimentoLgp ? new Date().toISOString() : null
    });

    registrarAuditoria({
      usuarioId: req.usuario?.id,
      acao: "criar",
      entidade: "alunos",
      entidadeId: criado.id,
      valoresDepois: criado
    });

    return res.status(201).json(perfilPublico(criado, false));
  });
}

function atualizar(req, res, next) {
  return executarEscrita(res, next, () => {
    if (!ehAdmin(req) && req.usuario.id !== req.params.id) {
      return res.status(403).json({ erro: "Acesso negado" });
    }
    const atual = model.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Aluno não encontrado" });
    }

    if (!ehAdmin(req) && req.usuario.id !== atual.id) {
      return res.status(403).json({
        erro: "Você só pode editar o próprio perfil"
      });
    }

    const perfil = dadosDoPerfil(req.body, atual);

    if (!perfil.nome_completo || !perfil.email) {
      return res.status(400).json({
        erro: "nome_completo e email são obrigatórios"
      });
    }

    const atualizado = model.atualizar(atual.id, perfil);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "editar",
      entidade: "alunos",
      entidadeId: atual.id,
      valoresAntes: atual,
      valoresDepois: atualizado
    });

    return res.json(perfilPublico(atualizado, ehAdmin(req)));
  });
}

function bloquear(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = model.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Aluno não encontrado" });
    }

    const bloqueado = req.body.bloqueado ? 1 : 0;
    const motivo = bloqueado ? req.body.motivo_bloqueio ?? null : null;

    const atualizado = model.bloquear(atual.id, bloqueado, motivo);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: bloqueado ? "bloquear" : "desbloquear",
      entidade: "alunos",
      entidadeId: atual.id,
      valoresAntes: atual,
      valoresDepois: atualizado
    });

    return res.json(atualizado);
  });
}

function excluir(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = model.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Aluno não encontrado" });
    }

    model.excluir(req.params.id);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "excluir",
      entidade: "alunos",
      entidadeId: atual.id,
      valoresAntes: atual
    });

    return res.status(204).end();
  });
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  bloquear,
  excluir
};
