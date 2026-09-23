const crypto = require("crypto");
const universidadesModel = require("../models/universidadesModel");
const {
  executarEscrita,
  registrarAuditoria
} = require("../utils/controllerUtils");

function dadosDaUniversidade(body, atual = {}) {
  return {
    nome: body.nome ?? atual.nome,
    logo_url: body.logo_url ?? atual.logo_url ?? null,
    site: body.site ?? atual.site ?? null,
    descricao: body.descricao ?? atual.descricao ?? null
  };
}

function listar(req, res, next) {
  try {
    return res.json(universidadesModel.listar());
  } catch (erro) {
    return next(erro);
  }
}

function buscarPorId(req, res, next) {
  try {
    const universidade = universidadesModel.buscarPorId(req.params.id);

    if (!universidade) {
      return res.status(404).json({ erro: "Universidade não encontrada" });
    }

    return res.json(universidade);
  } catch (erro) {
    return next(erro);
  }
}

function criar(req, res, next) {
  return executarEscrita(res, next, () => {
    const universidade = dadosDaUniversidade(req.body);

    if (!universidade.nome) {
      return res.status(400).json({ erro: "nome é obrigatório" });
    }

    const criada = universidadesModel.criar({
      ...universidade,
      id: crypto.randomUUID()
    });

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "criar",
      entidade: "universidades",
      entidadeId: criada.id,
      valoresDepois: criada
    });

    return res.status(201).json(criada);
  });
}

function atualizar(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = universidadesModel.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Universidade não encontrada" });
    }

    const universidade = dadosDaUniversidade(req.body, atual);

    if (!universidade.nome) {
      return res.status(400).json({ erro: "nome é obrigatório" });
    }

    const atualizada = universidadesModel.atualizar(req.params.id, universidade);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "editar",
      entidade: "universidades",
      entidadeId: atual.id,
      valoresAntes: atual,
      valoresDepois: atualizada
    });

    return res.json(atualizada);
  });
}

function excluir(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = universidadesModel.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Universidade não encontrada" });
    }

    universidadesModel.excluir(req.params.id);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "excluir",
      entidade: "universidades",
      entidadeId: atual.id,
      valoresAntes: atual
    });

    return res.status(204).end();
  });
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
