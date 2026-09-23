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

function ehAdmin(req) {
  return req.usuario.papel !== "aluno";
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
    const perfil = model.buscarPorId(req.params.id);

    if (!perfil) {
      return res.status(404).json({ erro: "Aluno não encontrado" });
    }

    if (!ehAdmin(req) && req.usuario.id !== perfil.id) {
      return res.status(403).json({
        erro: "Você só pode consultar o próprio perfil"
      });
    }

    return res.json(perfil);
  } catch (erro) {
    return next(erro);
  }
}

function criar(req, res, next) {
  return executarEscrita(res, next, () => {
    const perfil = dadosDoPerfil(req.body);
    const consentimentoLgp = req.body.consentimento_lgpd ?? 0;

    if (!perfil.nome_completo || !perfil.email || !req.body.senha) {
      return res.status(400).json({
        erro: "nome_completo, email e senha são obrigatórios"
      });
    }

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

    return res.status(201).json(criado);
  });
}

function atualizar(req, res, next) {
  return executarEscrita(res, next, () => {
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

    return res.json(atualizado);
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
