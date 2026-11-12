const crypto = require("crypto");
const banco = require("../../database/database");
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
  const { curso_id, titulo, tipo, data, hora_inicio, hora_fim, local, link_online } = atividade;
  const texto = valor => typeof valor === "string" && valor.trim().length > 0;
  const horario = valor => typeof valor === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(valor);
  const instante = typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)
    ? new Date(data + "T00:00:00Z")
    : null;
  if (!texto(curso_id) || !texto(titulo) || !Number.isFinite(instante?.getTime()) ||
      instante.toISOString().slice(0, 10) !== data || !horario(hora_inicio) || !horario(hora_fim) ||
      !["aula", "workshop", "palestra", "avaliacao"].includes(tipo) ||
      (local !== null && typeof local !== "string") ||
      (link_online !== null && typeof link_online !== "string")) {
    res.status(400).json({ erro: "Informe curso, título, data e horários válidos." });
    return false;
  }

  if (hora_fim.padEnd(8, ":00") <= hora_inicio.padEnd(8, ":00")) {
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

function corpoValido(body, res) {
  if (body && typeof body === "object" && !Array.isArray(body)) return true;
  res.status(400).json({ erro: "Informe os dados da atividade." });
  return false;
}

function criar(req, res, next) {
  if (!corpoValido(req.body, res)) return;
  return executarEscrita(res, next, () => {
    const criada = banco.transaction(() => {
      const atividade = dadosDaAtividade(req.body);
      if (!validar(atividade, res)) return;
      const registro = atividadesModel.criar({ ...atividade, id: crypto.randomUUID() });
      registrarAuditoria({
        usuarioId: req.usuario.id,
        acao: "criar",
        entidade: "atividades",
        entidadeId: registro.id,
        valoresDepois: registro
      });
      return registro;
    }).immediate();
    if (criada) return res.status(201).json(criada);
  });
}

function atualizar(req, res, next) {
  if (!corpoValido(req.body, res)) return;
  return executarEscrita(res, next, () => {
    const atualizada = banco.transaction(() => {
      const atual = atividadesModel.buscarPorId(req.params.id);
      if (!atual) {
        res.status(404).json({ erro: "Atividade não encontrada" });
        return;
      }
      const atividade = dadosDaAtividade(req.body, atual);
      if (!validar(atividade, res)) return;
      const registro = atividadesModel.atualizar(atual.id, atividade);
      registrarAuditoria({
        usuarioId: req.usuario.id,
        acao: "editar",
        entidade: "atividades",
        entidadeId: atual.id,
        valoresAntes: atual,
        valoresDepois: registro
      });
      return registro;
    }).immediate();
    if (atualizada) return res.json(atualizada);
  });
}

function excluir(req, res, next) {
  return executarEscrita(res, next, () => {
    const excluida = banco.transaction(() => {
      const atual = atividadesModel.buscarPorId(req.params.id);
      if (!atual) return false;
      atividadesModel.excluir(atual.id);
      registrarAuditoria({
        usuarioId: req.usuario.id,
        acao: "excluir",
        entidade: "atividades",
        entidadeId: atual.id,
        valoresAntes: atual
      });
      return true;
    }).immediate();
    if (!excluida) return res.status(404).json({ erro: "Atividade não encontrada" });
    return res.status(204).end();
  });
}

module.exports = { listar, criar, atualizar, excluir };
