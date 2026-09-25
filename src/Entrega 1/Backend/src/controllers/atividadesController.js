const crypto = require("crypto");
const atividadesModel = require("../models/atividadesModel");
const cursosModel = require("../models/cursosModel");
const { executarEscrita, registrarAuditoria } = require("../utils/controllerUtils");

function dadosDaAtividade(body, atual = {}) {
  return {
    curso_id: body.curso_id ?? atual.curso_id,
    titulo: body.titulo ?? atual.titulo,
    tipo: body.tipo ?? atual.tipo ?? "aula",
    data: body.data ?? atual.data,
    hora_inicio: body.hora_inicio ?? atual.hora_inicio,
    hora_fim: body.hora_fim ?? atual.hora_fim,
    local: body.local ?? atual.local ?? null,
    link_online: body.link_online ?? atual.link_online ?? null
  };
}

function validar(atividade, res) {
  if (!atividade.curso_id || !atividade.titulo || !atividade.data ||
      !atividade.hora_inicio || !atividade.hora_fim) {
    res.status(400).json({ erro: "curso_id, titulo, data, hora_inicio e hora_fim são obrigatórios" });
    return false;
  }

  if (atividade.hora_fim <= atividade.hora_inicio) {
    res.status(400).json({ erro: "hora_fim deve ser posterior a hora_inicio" });
    return false;
  }

  if (!cursosModel.buscarPorId(atividade.curso_id)) {
    res.status(404).json({ erro: "Curso não encontrado" });
    return false;
  }

  return true;
}

function listar(req, res, next) {
  try {
    return res.json(atividadesModel.listar(req.query.curso_id ?? null));
  } catch (erro) {
    return next(erro);
  }
}

function criar(req, res, next) {
  return executarEscrita(res, next, () => {
    const atividade = dadosDaAtividade(req.body);

    if (!validar(atividade, res)) {
      return;
    }

    const criada = atividadesModel.criar({ ...atividade, id: crypto.randomUUID() });
    registrarAuditoria({ usuarioId: req.usuario.id, acao: "criar", entidade: "atividades", entidadeId: criada.id, valoresDepois: criada });
    return res.status(201).json(criada);
  });
}

function atualizar(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = atividadesModel.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Atividade não encontrada" });
    }

    const atividade = dadosDaAtividade(req.body, atual);

    if (!validar(atividade, res)) {
      return;
    }

    const atualizada = atividadesModel.atualizar(atual.id, atividade);
    registrarAuditoria({ usuarioId: req.usuario.id, acao: "editar", entidade: "atividades", entidadeId: atual.id, valoresAntes: atual, valoresDepois: atualizada });
    return res.json(atualizada);
  });
}

function excluir(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = atividadesModel.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Atividade não encontrada" });
    }

    atividadesModel.excluir(atual.id);
    registrarAuditoria({ usuarioId: req.usuario.id, acao: "excluir", entidade: "atividades", entidadeId: atual.id, valoresAntes: atual });
    return res.status(204).end();
  });
}

module.exports = { listar, criar, atualizar, excluir };
