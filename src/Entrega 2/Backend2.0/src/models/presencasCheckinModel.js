const crypto = require("node:crypto");
const banco = require("../../database/database");
const profilesModel = require("./profilesModel");
const { registrarAuditoria } = require("../utils/controllerUtils");

function buscarAtividadeDisponivel(atividadeId) {
  return banco.prepare(`
    SELECT a.id FROM atividades a JOIN cursos c ON c.id = a.curso_id
    WHERE a.id = ? AND c.status != 'cancelado'
  `).get(atividadeId);
}

function possuiAcessoAtual(usuarioId, papeisPermitidos) {
  const usuario = profilesModel.buscarEstadoAutenticacao(usuarioId);
  return usuario && usuario.ativo === 1 && usuario.bloqueado === 0
    && papeisPermitidos.includes(usuario.papel);
}

// A identidade vem da sessao e a atividade vem somente do token verificado.
// A transacao serializa repeticoes sem substituir presencas ja existentes.
const registrarCheckin = banco.transaction((alunoId, autorizacao) => {
  const agora = Math.floor(Date.now() / 1000);
  if (agora < autorizacao.nbf || agora >= autorizacao.exp) {
    return null;
  }
  if (!possuiAcessoAtual(alunoId, ["aluno"])
      || !possuiAcessoAtual(autorizacao.emissor_id, ["admin_operador", "admin_super"])) {
    return null;
  }
  const inscricao = banco.prepare(`
    SELECT i.id FROM inscricoes i
    JOIN atividades a ON a.curso_id = i.curso_id
    JOIN cursos c ON c.id = i.curso_id
    WHERE a.id = ? AND i.aluno_id = ?
      AND i.status IN ('inscrito', 'cursando') AND c.status != 'cancelado'
  `).get(autorizacao.atividade_id, alunoId);
  if (!inscricao) {
    return null;
  }
  const consultarPresenca = banco.prepare(`
    SELECT id, inscricao_id, atividade_id, checkin_em, metodo
    FROM presencas WHERE inscricao_id = ? AND atividade_id = ?
  `);
  const existente = consultarPresenca.get(inscricao.id, autorizacao.atividade_id);
  if (existente) {
    return { criada: false, presenca: existente };
  }
  banco.prepare(`
    INSERT INTO presencas (id, inscricao_id, atividade_id, metodo, registrado_por)
    VALUES (?, ?, ?, 'qrcode', ?)
  `).run(crypto.randomUUID(), inscricao.id, autorizacao.atividade_id, alunoId);
  const presenca = consultarPresenca.get(inscricao.id, autorizacao.atividade_id);
  registrarAuditoria({
    usuarioId: alunoId,
    acao: "criar",
    entidade: "presencas",
    entidadeId: presenca.id,
    valoresDepois: presenca
  });
  return { criada: true, presenca };
});

module.exports = { buscarAtividadeDisponivel, registrarCheckin };
