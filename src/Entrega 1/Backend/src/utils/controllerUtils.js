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

module.exports = { tratarErroDoBanco, executarEscrita };
