const banco = require("../../database/database");
const profiles = require("./profilesModel");
const mensagens = require("./mensagensModel");
const service = require("../services/notificationService");

class NotificationError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function requireStudent(userId) {
  const user = profiles.buscarEstadoAutenticacao(userId);
  if (!user || user.ativo !== 1 || user.bloqueado !== 0) throw new NotificationError(401, "Sessao indisponivel");
  if (user.papel !== "aluno") throw new NotificationError(403, "Operacao exclusiva para alunos");
}

function destino(row, userId) {
  if (typeof row.link !== "string") return row.tipo === "sistema" || row.tipo === "presenca" ? null : undefined;
  const separator = row.link.indexOf(":");
  const target = row.link.slice(0, separator);
  const id = row.link.slice(separator + 1);
  if (separator < 1 || !id || id.length > 128 || /[\s/\\?#]/.test(id)) {
    return row.tipo === "sistema" || row.tipo === "presenca" ? null : undefined;
  }
  if (target === "mensagem" && row.tipo === "mensagem") {
    return mensagens.studentMessage(userId, id) ? { tela: "mensagens", id } : undefined;
  }
  if (target === "curso" && row.tipo === "curso") {
    const course = banco.prepare("SELECT id FROM cursos WHERE id=? AND status IN ('planejado','em_andamento')").get(id);
    return course ? { tela: "cursos", id } : undefined;
  }
  if (target === "certificado" && row.tipo === "certificado") {
    const certificate = banco.prepare(`
      SELECT ce.id FROM certificados ce JOIN inscricoes i ON i.id=ce.inscricao_id
      WHERE ce.id=? AND ce.status='emitido' AND i.aluno_id=?
    `).get(id, userId);
    return certificate ? { tela: "certificados", id } : undefined;
  }
  if (target === "agenda" && row.tipo === "sistema") {
    const subscription = banco.prepare("SELECT id FROM inscricoes WHERE aluno_id=? AND curso_id=? AND status!='cancelado'").get(userId, id);
    return subscription ? { tela: "agenda", id } : undefined;
  }
  // Links legados externos nunca viram URLs navegaveis ou intents arbitrarias.
  return row.tipo === "sistema" || row.tipo === "presenca" ? null : undefined;
}

function publico(row, userId) {
  const target = destino(row, userId);
  if (target === undefined) return null;
  return { id: row.id, tipo: row.tipo, titulo: row.titulo, corpo: row.corpo,
    lida: row.lida, criado_em: row.criado_em, destino: target };
}

function listar(userId) {
  requireStudent(userId);
  return banco.prepare(`
    SELECT * FROM notificacoes WHERE aluno_id=? AND julianday(criado_em)<=julianday('now')
    ORDER BY criado_em DESC,id
  `).all(userId).map(row => publico(row, userId)).filter(Boolean);
}

function buscar(userId, id) {
  requireStudent(userId);
  const row = banco.prepare("SELECT * FROM notificacoes WHERE id=? AND aluno_id=? AND julianday(criado_em)<=julianday('now')").get(id, userId);
  return row ? publico(row, userId) : null;
}

const sincronizar = banco.transaction(userId => {
  requireStudent(userId);
  service.reconciliar(userId);
  return listar(userId);
});

const ler = banco.transaction((userId, id) => {
  if (!buscar(userId, id)) throw new NotificationError(404, "Notificacao indisponivel");
  banco.prepare("UPDATE notificacoes SET lida=1 WHERE id=? AND aluno_id=?").run(id, userId);
  return buscar(userId, id);
});

module.exports = { NotificationError, listar, buscar, sincronizar: sincronizar.immediate, ler: ler.immediate };
