const crypto = require("crypto");
const cursosModel = require("../models/cursosModel");
const inscricoesModel = require("../models/inscricoesModel");
const { executarEscrita, registrarAuditoria } = require("../utils/controllerUtils");

function exigirAluno(req, res) {
  if (req.usuario.papel !== "aluno") {
    res.status(403).json({ erro: "Esta operação é exclusiva para alunos" });
    return false;
  }

  return true;
}

function listarMinhas(req, res, next) {
  try {
    if (!exigirAluno(req, res)) {
      return;
    }

    return res.json(inscricoesModel.listarDoAluno(req.usuario.id));
  } catch (erro) {
    return next(erro);
  }
}

function criar(req, res, next) {
  return executarEscrita(res, next, () => {
    if (!exigirAluno(req, res)) {
      return;
    }

    const cursoId = req.body.curso_id;

    if (!cursoId) {
      return res.status(400).json({ erro: "curso_id é obrigatório" });
    }

    const curso = cursosModel.buscarPorId(cursoId);

    if (!curso) {
      return res.status(404).json({ erro: "Curso não encontrado" });
    }

    if (inscricoesModel.buscarPorAlunoECurso(req.usuario.id, cursoId)) {
      return res.status(409).json({ erro: "Você já possui uma inscrição neste curso" });
    }

    const inscricao = inscricoesModel.criar({
      id: crypto.randomUUID(),
      aluno_id: req.usuario.id,
      curso_id: cursoId,
      status: "inscrito"
    });

    registrarAuditoria({ usuarioId: req.usuario.id, acao: "criar", entidade: "inscricoes", entidadeId: inscricao.id, valoresDepois: inscricao });
    return res.status(201).json(inscricao);
  });
}

function cancelar(req, res, next) {
  return executarEscrita(res, next, () => {
    if (!exigirAluno(req, res)) {
      return;
    }

    const atual = inscricoesModel.buscarPorAlunoECurso(req.usuario.id, req.params.cursoId);

    if (!atual || atual.status === "cancelado") {
      return res.status(404).json({ erro: "Inscrição ativa não encontrada" });
    }

    inscricoesModel.cancelar(req.usuario.id, req.params.cursoId);
    registrarAuditoria({ usuarioId: req.usuario.id, acao: "editar", entidade: "inscricoes", entidadeId: atual.id, valoresAntes: atual, valoresDepois: { ...atual, status: "cancelado" } });
    return res.status(204).end();
  });
}

module.exports = { listarMinhas, criar, cancelar };
