function tratarErroDoBanco(res, next, erro) {
  const erroDeRestricao = erro.code?.startsWith("SQLITE_CONSTRAINT");
  const erroDeTrigger = /Curso sem vagas/i.test(erro.message);

  if (erroDeRestricao || erroDeTrigger) {
    return res.status(400).json({
      erro: `Dados inválidos: ${erro.message}`
    });
  }

  return next(erro);
}

function executarEscrita(res, next, operacao) {
  try {
    return operacao();
  } catch (erro) {
    return tratarErroDoBanco(res, next, erro);
  }
}

function registrarAuditoria({
  usuarioId,
  acao,
  entidade,
  entidadeId,
  valoresAntes = null,
  valoresDepois = null
}) {
  banco.prepare(`
    INSERT INTO audit_logs (
      id, usuario_id, acao, entidade, entidade_id, valores_antes, valores_depois
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    usuarioId ?? null,
    acao,
    entidade,
    entidadeId ?? null,
    valoresAntes ? JSON.stringify(valoresAntes) : null,
    valoresDepois ? JSON.stringify(valoresDepois) : null
  );
}

module.exports = {
  tratarErroDoBanco,
  executarEscrita,
  registrarAuditoria
};
const crypto = require("crypto");
const banco = require("../../database/database");
