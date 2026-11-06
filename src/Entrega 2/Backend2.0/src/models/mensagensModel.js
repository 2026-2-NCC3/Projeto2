const crypto = require("node:crypto");
const banco = require("../../database/database");
const profiles = require("./profilesModel");
const { registrarAuditoria } = require("../utils/controllerUtils");

class MessageError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function requireRole(userId, roles) {
  const user = profiles.buscarEstadoAutenticacao(userId);
  if (!user || user.ativo !== 1 || user.bloqueado !== 0) throw new MessageError(401, "Sessao indisponivel");
  if (!roles.includes(user.papel)) throw new MessageError(403, "Operacao nao autorizada");
}

const eligibleStudents = `
  SELECT u.id FROM usuarios u JOIN alunos a ON a.usuario_id=u.id
  JOIN papeis p ON p.usuario_id=u.id
  WHERE u.ativo=1 AND a.bloqueado=0 AND p.papel='aluno'
`;

function eligibleIds(ids) {
  if (!ids.length) return [];
  return banco.prepare(eligibleStudents + ` AND u.id IN (${ids.map(() => "?").join(",")})`)
    .all(...ids).map(row => row.id);
}

function recipients(message) {
  if (message.publico_alvo === "todos") return banco.prepare(eligibleStudents).all().map(row => row.id);
  if (message.publico_alvo === "curso") {
    return banco.prepare(eligibleStudents + `
      AND EXISTS (SELECT 1 FROM inscricoes i WHERE i.aluno_id=u.id AND i.curso_id=? AND i.status!='cancelado')
    `).all(message.curso_id).map(row => row.id);
  }
  const selected = banco.prepare("SELECT aluno_id FROM mensagem_destinatarios WHERE mensagem_id=?")
    .all(message.id).map(row => row.aluno_id);
  return eligibleIds(selected);
}

function adminMessage(id) {
  const message = banco.prepare(`
    SELECT m.*, u.nome_completo AS autor_nome, c.titulo AS curso_titulo,
      (SELECT COUNT(*) FROM mensagem_destinatarios d WHERE d.mensagem_id=m.id) AS total_destinatarios,
      (SELECT COUNT(*) FROM mensagem_destinatarios d WHERE d.mensagem_id=m.id AND d.lido_em IS NOT NULL) AS total_lidos
    FROM mensagens m JOIN usuarios u ON u.id=m.autor_id LEFT JOIN cursos c ON c.id=m.curso_id WHERE m.id=?
  `).get(id);
  if (!message) return null;
  message.aluno_ids = message.publico_alvo === "individual"
    ? banco.prepare("SELECT aluno_id FROM mensagem_destinatarios WHERE mensagem_id=? ORDER BY aluno_id")
      .all(id).map(row => row.aluno_id) : [];
  return message;
}

function listarAdmin() {
  return banco.prepare("SELECT id FROM mensagens ORDER BY criado_em DESC,id").all().map(row => adminMessage(row.id));
}

function studentQuery() {
  return `
    SELECT m.id,m.titulo,m.corpo,m.publico_alvo,m.curso_id,c.titulo AS curso_titulo,m.enviado_em,d.lido_em
    FROM mensagens m JOIN mensagem_destinatarios d ON d.mensagem_id=m.id
    LEFT JOIN cursos c ON c.id=m.curso_id
    WHERE d.aluno_id=? AND m.enviado_em IS NOT NULL
      AND julianday(m.enviado_em)<=julianday('now')
      AND (m.agendado_para IS NULL OR julianday(m.agendado_para)<=julianday('now'))
      AND (m.publico_alvo!='curso' OR EXISTS (
        SELECT 1 FROM inscricoes i WHERE i.aluno_id=d.aluno_id AND i.curso_id=m.curso_id AND i.status!='cancelado'
      ))
  `;
}

function studentMessage(userId, id) {
  const row = banco.prepare(studentQuery() + " AND m.id=?").get(userId, id);
  return row ? { ...row, origem: "Próxima Etapa" } : null;
}

function listarMinhas(userId) {
  return banco.prepare(studentQuery() + " ORDER BY m.enviado_em DESC,m.id").all(userId)
    .map(row => ({ ...row, origem: "Próxima Etapa" }));
}

function assertTargets(data) {
  if (data.publico_alvo === "curso" && !banco.prepare("SELECT id FROM cursos WHERE id=?").get(data.curso_id)) {
    throw new MessageError(400, "Curso indisponivel");
  }
  if (data.publico_alvo === "individual" && eligibleIds(data.aluno_ids).length !== data.aluno_ids.length) {
    throw new MessageError(400, "Selecione apenas alunos ativos e autorizados");
  }
}

function replaceDraftRecipients(id, data) {
  banco.prepare("DELETE FROM mensagem_destinatarios WHERE mensagem_id=?").run(id);
  if (data.publico_alvo === "individual") {
    const insert = banco.prepare("INSERT INTO mensagem_destinatarios(id,mensagem_id,aluno_id) VALUES (?,?,?)");
    for (const studentId of data.aluno_ids) insert.run(crypto.randomUUID(), id, studentId);
  }
}

function audit(userId, action, id, operation, count) {
  registrarAuditoria({ usuarioId: userId, acao: action, entidade: "mensagens", entidadeId: id,
    valoresDepois: { operacao: operation, destinatarios: count } });
}

const criar = banco.transaction((userId, data) => {
  requireRole(userId, ["admin_operador", "admin_super"]);
  assertTargets(data);
  const id = crypto.randomUUID();
  banco.prepare("INSERT INTO mensagens(id,titulo,corpo,autor_id,publico_alvo,curso_id) VALUES (?,?,?,?,?,?)")
    .run(id, data.titulo, data.corpo, userId, data.publico_alvo, data.curso_id);
  replaceDraftRecipients(id, data);
  audit(userId, "criar", id, "rascunho", data.aluno_ids.length);
  return adminMessage(id);
});

function draft(id) {
  const row = adminMessage(id);
  if (!row) throw new MessageError(404, "Mensagem indisponivel");
  if (row.enviado_em !== null) throw new MessageError(409, "Comunicados publicados sao preservados; crie uma nova mensagem");
  return row;
}

const editar = banco.transaction((userId, id, data) => {
  requireRole(userId, ["admin_operador", "admin_super"]);
  draft(id);
  assertTargets(data);
  banco.prepare("UPDATE mensagens SET titulo=?,corpo=?,publico_alvo=?,curso_id=? WHERE id=?")
    .run(data.titulo, data.corpo, data.publico_alvo, data.curso_id, id);
  replaceDraftRecipients(id, data);
  audit(userId, "editar", id, "editar_rascunho", data.aluno_ids.length);
  return adminMessage(id);
});

const excluir = banco.transaction((userId, id) => {
  requireRole(userId, ["admin_operador", "admin_super"]);
  draft(id);
  banco.prepare("DELETE FROM mensagens WHERE id=?").run(id);
  audit(userId, "excluir", id, "excluir_rascunho", 0);
});

const publicar = banco.transaction((userId, id) => {
  requireRole(userId, ["admin_operador", "admin_super"]);
  const message = adminMessage(id);
  if (!message) throw new MessageError(404, "Mensagem indisponivel");
  if (message.enviado_em !== null) return { created: false, message };
  if (message.agendado_para !== null) throw new MessageError(409, "Agendamento nao e executado por este incremento");
  const ids = recipients(message);
  if (!ids.length) throw new MessageError(409, "Nenhum destinatario elegivel para publicar");
  banco.prepare("DELETE FROM mensagem_destinatarios WHERE mensagem_id=?").run(id);
  const insert = banco.prepare("INSERT INTO mensagem_destinatarios(id,mensagem_id,aluno_id) VALUES (?,?,?)");
  for (const studentId of ids) insert.run(crypto.randomUUID(), id, studentId);
  banco.prepare("UPDATE mensagens SET enviado_em=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(id);
  audit(userId, "editar", id, "publicar", ids.length);
  require("../services/notificationService").mensagemPublicada(adminMessage(id), ids);
  return { created: true, message: adminMessage(id) };
});

const marcarLida = banco.transaction((userId, id) => {
  requireRole(userId, ["aluno"]);
  if (!studentMessage(userId, id)) throw new MessageError(404, "Mensagem indisponivel");
  banco.prepare("UPDATE mensagem_destinatarios SET lido_em=COALESCE(lido_em,strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE mensagem_id=? AND aluno_id=?")
    .run(id, userId);
  return studentMessage(userId, id);
});

module.exports = {
  MessageError, listarAdmin, listarMinhas, adminMessage, studentMessage,
  criar: criar.immediate, editar: editar.immediate, excluir: excluir.immediate,
  publicar: publicar.immediate, marcarLida: marcarLida.immediate,
};
