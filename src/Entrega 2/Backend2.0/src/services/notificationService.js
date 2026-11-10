const crypto = require("node:crypto");
const banco = require("../../database/database");

// RFM13: materializacao de eventos reais. Nao envia push nem altera as entidades de origem.
function persistir(alunoId, evento, tipo, titulo, corpo, link, criadoEm) {
  if (!banco.inTransaction) throw new Error("Notificacao exige transacao");
  const id = "n-" + crypto.createHash("sha256").update(JSON.stringify([alunoId, evento])).digest("hex");
  banco.prepare(`
    INSERT INTO notificacoes(id,aluno_id,tipo,titulo,corpo,link,criado_em)
    VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING
  `).run(id, alunoId, tipo, titulo, corpo, link, criadoEm);
}

function mensagemPublicada(message, studentIds) {
  for (const studentId of studentIds) {
    persistir(studentId, "mensagem:" + message.id, "mensagem", "Novo comunicado",
      message.titulo, "mensagem:" + message.id, message.enviado_em);
  }
}

function objetoAuditoria(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

function reconciliarAgenda(alunoId) {
  const subscriptions = banco.prepare(`
    SELECT curso_id,criado_em FROM inscricoes WHERE aluno_id=? AND status!='cancelado'
  `).all(alunoId);
  const eligible = new Map(subscriptions.map(row => [row.curso_id, row.criado_em]));
  if (!eligible.size) return;
  const firstEnrollment = subscriptions.map(row => row.criado_em).sort()[0];
  const events = banco.prepare(`
    SELECT id,acao,entidade_id,valores_antes,valores_depois,criado_em FROM audit_logs
    WHERE entidade='atividades' AND acao IN ('criar','editar','excluir')
      AND julianday(criado_em)>=julianday(?) ORDER BY criado_em,id
  `).all(firstEnrollment);
  for (const event of events) {
    const before = objetoAuditoria(event.valores_antes);
    const after = objetoAuditoria(event.valores_depois);
    const fields = ["curso_id", "titulo", "tipo", "data", "hora_inicio", "hora_fim", "local", "link_online"];
    if (event.acao === "editar" && fields.every(field => before[field] === after[field])) continue;
    const current = banco.prepare("SELECT curso_id FROM atividades WHERE id=?").get(event.entidade_id);
    const candidates = [];
    if (current && after.curso_id === current.curso_id) candidates.push(after.curso_id);
    if (event.acao === "excluir" || before.curso_id !== after.curso_id) candidates.push(before.curso_id);
    const courseId = candidates.find(id => eligible.has(id)
      && Date.parse(eligible.get(id)) <= Date.parse(event.criado_em));
    if (!courseId) continue;
    const removed = event.acao === "excluir" || (courseId === before.curso_id && before.curso_id !== after.curso_id);
    const title = removed ? "Atividade removida da agenda"
      : event.acao === "criar" ? "Nova atividade na agenda" : "Agenda atualizada";
    const body = removed ? "Uma atividade foi retirada da sua agenda. Consulte os encontros atuais."
      : "Consulte a atividade e os horários atualizados na sua agenda.";
    persistir(alunoId, "agenda:" + event.id, "sistema", title, body,
      "agenda:" + courseId, event.criado_em);
  }
}

function reconciliar(alunoId) {
  const courses = banco.prepare(`
    SELECT id,titulo,criado_em FROM cursos WHERE status IN ('planejado','em_andamento')
  `).all();
  for (const course of courses) {
    persistir(alunoId, "curso:" + course.id, "curso", "Curso disponível",
      course.titulo, "curso:" + course.id, course.criado_em);
  }
  // Reutiliza a autorizacao do RFM11 e recupera publicacoes anteriores a este incremento.
  const messages = require("../models/mensagensModel").listarMinhas(alunoId);
  for (const message of messages) mensagemPublicada(message, [alunoId]);
  const certificates = banco.prepare(`
    SELECT ce.id,ce.emitido_em,c.titulo FROM certificados ce
    JOIN inscricoes i ON i.id=ce.inscricao_id JOIN cursos c ON c.id=i.curso_id
    WHERE i.aluno_id=? AND ce.status='emitido' AND ce.emitido_em IS NOT NULL
  `).all(alunoId);
  for (const certificate of certificates) {
    persistir(alunoId, "certificado:" + certificate.id, "certificado", "Certificado emitido",
      certificate.titulo + ". Consulte a situação e os detalhes; o arquivo pode estar indisponível.",
      "certificado:" + certificate.id, certificate.emitido_em);
  }
  reconciliarAgenda(alunoId);
}

module.exports = { mensagemPublicada, reconciliar };
