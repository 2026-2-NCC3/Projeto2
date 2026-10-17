const crypto = require("crypto");
const cursosModel = require("../models/cursosModel");
const {
  executarEscrita,
  registrarAuditoria
} = require("../utils/controllerUtils");

function dadosDoCurso(body, atual = {}) {
  return {
    titulo: body.titulo ?? atual.titulo,
    descricao: body.descricao ?? atual.descricao ?? null,
    categoria: body.categoria ?? atual.categoria ?? null,
    carga_horaria_horas: body.carga_horaria_horas ?? atual.carga_horaria_horas ?? 0,
    universidade_id: body.universidade_id ?? atual.universidade_id ?? null,
    modalidade: body.modalidade ?? atual.modalidade ?? "presencial",
    local: body.local ?? atual.local ?? null,
    link_online: body.link_online ?? atual.link_online ?? null,
    data_inicio: body.data_inicio ?? atual.data_inicio,
    data_fim: body.data_fim ?? atual.data_fim ?? null,
    vagas_total: body.vagas_total ?? atual.vagas_total ?? 0,
    emite_certificado: body.emite_certificado ?? atual.emite_certificado ?? 0,
    status: body.status ?? atual.status ?? "planejado",
    banner_url: body.banner_url ?? atual.banner_url ?? null
  };
}

function listar(req, res, next) {
  try {
    return res.json(cursosModel.listar());
  } catch (erro) {
    return next(erro);
  }
}

function buscarPorId(req, res, next) {
  try {
    const curso = cursosModel.buscarPorId(req.params.id);

    if (!curso) {
      return res.status(404).json({ erro: "Curso não encontrado" });
    }

    return res.json(curso);
  } catch (erro) {
    return next(erro);
  }
}

function criar(req, res, next) {
  return executarEscrita(res, next, () => {
    const curso = dadosDoCurso(req.body);

    if (!curso.titulo || !curso.data_inicio) {
      return res.status(400).json({
        erro: "titulo e data_inicio são obrigatórios"
      });
    }

    const criado = cursosModel.criar({
      ...curso,
      id: crypto.randomUUID(),
      criado_por: req.usuario.id
    });

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "criar",
      entidade: "cursos",
      entidadeId: criado.id,
      valoresDepois: criado
    });

    return res.status(201).json(criado);
  });
}

function atualizar(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = cursosModel.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Curso não encontrado" });
    }

    const curso = dadosDoCurso(req.body, atual);

    if (!curso.titulo || !curso.data_inicio) {
      return res.status(400).json({
        erro: "titulo e data_inicio são obrigatórios"
      });
    }

    const atualizado = cursosModel.atualizar(req.params.id, curso);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "editar",
      entidade: "cursos",
      entidadeId: atual.id,
      valoresAntes: atual,
      valoresDepois: atualizado
    });

    return res.json(atualizado);
  });
}

function excluir(req, res, next) {
  return executarEscrita(res, next, () => {
    const atual = cursosModel.buscarPorId(req.params.id);

    if (!atual) {
      return res.status(404).json({ erro: "Curso não encontrado" });
    }

    cursosModel.excluir(req.params.id);

    registrarAuditoria({
      usuarioId: req.usuario.id,
      acao: "excluir",
      entidade: "cursos",
      entidadeId: atual.id,
      valoresAntes: atual
    });

    return res.status(204).end();
  });
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
