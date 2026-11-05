const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withApi } = require("./helpers/api");

function fixtures(db) {
  db.exec("INSERT INTO cursos(id,titulo,data_inicio,vagas_total) VALUES ('c1','Curso A','2026-01-01',10),('c2','Curso B','2026-01-01',10);"
    + "INSERT INTO inscricoes(id,aluno_id,curso_id,status) VALUES ('i1','a1','c1','cursando'),('i2','a2','c2','inscrito');");
}
const body = (scope = "todos", extra = {}) => ({ titulo: "Comunicado ficticio", corpo: "Conteudo completo ficticio.", publico_alvo: scope, ...extra });
async function create(api, payload = body()) {
  const result = await api.request("/api/mensagens", "op", "POST", payload);
  assert.equal(result.status, 201);
  return result.body;
}
const publish = (api, id, user = "op") => api.request("/api/mensagens/" + id + "/publicar", user, "POST", {});
const mine = async (api, user) => (await api.request("/api/mensagens/minhas", user)).body;

test("mensagens autenticam papeis, mantem rascunhos privados e nao confiam em identidade fornecida", async t => {
  const api = await withApi(t); fixtures(api.db);
  assert.equal((await api.request("/api/mensagens/minhas", null)).status, 401);
  assert.equal((await api.request("/api/mensagens", "a1")).status, 403);
  assert.equal((await api.request("/api/mensagens/minhas", "op")).status, 403);
  assert.equal((await api.request("/api/mensagens", "a1", "POST", body())).status, 403);
  assert.equal((await api.request("/api/mensagens", "op", "POST", body("todos", { autor_id: "a1" }))).status, 400);
  const draft = await create(api);
  assert.equal(draft.autor_id, "op");
  assert.equal(draft.enviado_em, null);
  assert.deepEqual(await mine(api, "a1"), []);
  assert.equal((await api.request("/api/mensagens/" + draft.id, "a1")).status, 404);
  assert.equal((await publish(api, draft.id, "a1")).status, 403);
  assert.equal((await api.request("/api/mensagens", "super")).body.length, 1);
  api.db.exec("UPDATE papeis SET papel='aluno' WHERE usuario_id='op'");
  assert.equal((await publish(api, draft.id)).status, 403);
});

test("publicacao global, individual e por curso respeita destinatarios e vinculos atuais", async t => {
  const api = await withApi(t); fixtures(api.db);
  const global = await create(api); await publish(api, global.id);
  const personal = await create(api, body("individual", { aluno_ids: ["a1"] })); await publish(api, personal.id);
  const course = await create(api, body("curso", { curso_id: "c1" })); await publish(api, course.id);
  assert.equal((await mine(api, "a1")).length, 3);
  assert.deepEqual((await mine(api, "a2")).map(m => m.id), [global.id]);
  assert.equal((await api.request("/api/mensagens/" + personal.id, "a2")).status, 404);
  assert.equal((await api.request("/api/mensagens/" + personal.id + "/leitura", "a2", "PUT", {})).status, 404);
  assert.equal((await api.request("/api/mensagens/minhas?aluno_id=a1", "a2")).body.length, 1);
  api.db.exec("INSERT INTO inscricoes(id,aluno_id,curso_id) VALUES ('i3','a2','c1')");
  assert.equal((await mine(api, "a2")).length, 1); // Destinatarios nao sao ampliados retroativamente.
  api.db.exec("UPDATE inscricoes SET status='cancelado' WHERE id='i1'");
  assert.equal((await api.request("/api/mensagens/" + course.id, "a1")).status, 404);
  assert.equal((await mine(api, "a1")).length, 2);
  assert.deepEqual(api.db.pragma("foreign_key_check"), []);
});

test("leitura e idempotente, pertence ao aluno e alimenta contagens reais sem criar notificacoes", async t => {
  const api = await withApi(t);
  const message = await create(api); await publish(api, message.id);
  const first = await api.request("/api/mensagens/" + message.id + "/leitura", "a1", "PUT", {});
  const repeated = await api.request("/api/mensagens/" + message.id + "/leitura", "a1", "PUT", {});
  assert.equal(first.status, 200);
  assert.ok(first.body.lido_em);
  assert.equal(first.body.lido_em, repeated.body.lido_em);
  assert.deepEqual(Object.keys(first.body).sort(), ["id","titulo","corpo","publico_alvo","curso_id","curso_titulo","enviado_em","lido_em","origem"].sort());
  assert.equal((await mine(api, "a2"))[0].lido_em, null);
  assert.equal((await api.request("/api/mensagens/" + message.id + "/leitura", "a1", "PUT", { aluno_id: "a2" })).status, 400);
  const admin = (await api.request("/api/mensagens", "op")).body[0];
  assert.equal(admin.total_lidos, 1);
  assert.equal(admin.total_destinatarios, 2);
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM notificacoes").get().n, 0);
});

test("edicao e exclusao ficam restritas a rascunhos e preservam comunicados publicados", async t => {
  const api = await withApi(t);
  const draft = await create(api, body("individual", { aluno_ids: ["a1"] }));
  const changed = await api.request("/api/mensagens/" + draft.id, "super", "PUT", body("individual", { aluno_ids: ["a2"], titulo: "Novo titulo" }));
  assert.equal(changed.status, 200);
  assert.deepEqual(changed.body.aluno_ids, ["a2"]);
  await publish(api, draft.id);
  assert.equal((await api.request("/api/mensagens/" + draft.id, "op", "DELETE")).status, 409);
  assert.equal((await api.request("/api/mensagens/" + draft.id, "op", "PUT", body())).status, 409);
  const unused = await create(api, body("individual", { aluno_ids: ["a1"] }));
  assert.equal((await api.request("/api/mensagens/" + unused.id, "op", "DELETE")).status, 204);
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM mensagem_destinatarios WHERE mensagem_id=?").get(unused.id).n, 0);
  assert.equal((await mine(api, "a2"))[0].titulo, "Novo titulo");
});

test("validacao rejeita campos forjados, grupos invalidos e destinatarios inelegiveis sem escrita parcial", async t => {
  const api = await withApi(t); fixtures(api.db);
  for (const payload of [null, [], {}, body("outro"), body("todos", { titulo: " " }), body("todos", { corpo: {} }),
    body("todos", { titulo: "x".repeat(161) }), body("todos", { corpo: "x".repeat(10001) }),
    body("todos", { agendado_para: "2099-01-01" }), body("curso", { curso_id: "ausente" }),
    body("individual", { aluno_ids: ["a1","a1"] }), body("individual", { aluno_ids: ["op"] }),
    body("todos", { aluno_ids: ["a1"] })]) {
    assert.equal((await api.request("/api/mensagens", "op", "POST", payload)).status, 400);
  }
  api.db.exec("UPDATE alunos SET bloqueado=1 WHERE usuario_id='a2'");
  assert.equal((await api.request("/api/mensagens", "op", "POST", body("individual", { aluno_ids:["a2"] }))).status, 400);
  const safe = await create(api, body("todos", { titulo: "Texto '); DROP TABLE usuarios; --" }));
  const result = await publish(api, safe.id);
  assert.equal(result.body.total_destinatarios, 1);
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM usuarios").get().n, 4);
});

test("publicacoes concorrentes sao idempotentes e falha de auditoria reverte toda a entrega", async t => {
  const api = await withApi(t);
  const draft = await create(api);
  api.db.exec("CREATE TRIGGER falha_mensagem BEFORE INSERT ON audit_logs WHEN NEW.acao='editar' BEGIN SELECT RAISE(ABORT,'Ficticio'); END");
  assert.equal((await publish(api, draft.id)).status, 400);
  assert.equal(api.db.prepare("SELECT enviado_em FROM mensagens WHERE id=?").get(draft.id).enviado_em, null);
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM mensagem_destinatarios").get().n, 0);
  api.db.exec("DROP TRIGGER falha_mensagem");
  const responses = await Promise.all(Array.from({length:8}, () => publish(api, draft.id)));
  assert.equal(responses.filter(r => r.status===201).length, 1);
  assert.equal(responses.filter(r => r.status===200).length, 7);
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM mensagem_destinatarios").get().n, 2);
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM audit_logs").get().n, 2);
});

test("alunos e administradores inativos perdem acesso; publicacao sem destinatario nao e simulada", async t => {
  const api = await withApi(t);
  const draft = await create(api);
  api.db.exec("UPDATE alunos SET bloqueado=1");
  assert.equal((await publish(api, draft.id)).status, 409);
  assert.equal((await api.request("/api/mensagens/minhas", "a1")).status, 401);
  api.db.exec("UPDATE usuarios SET ativo=0 WHERE id='op'");
  assert.equal((await api.request("/api/mensagens", "op")).status, 401);
  assert.equal(api.db.prepare("SELECT enviado_em FROM mensagens WHERE id=?").get(draft.id).enviado_em, null);
});

test("rascunho legado agendado conserva a data na edicao e nao publica antecipadamente", async t => {
  const api = await withApi(t);
  const draft = await create(api);
  const scheduledAt = "2099-01-01T12:00:00Z";
  api.db.prepare("UPDATE mensagens SET agendado_para=? WHERE id=?").run(scheduledAt, draft.id);
  const edited = await api.request("/api/mensagens/" + draft.id, "op", "PUT", body());
  assert.equal(edited.status, 200);
  assert.equal(edited.body.agendado_para, scheduledAt);
  assert.equal((await publish(api, draft.id)).status, 409);
  assert.deepEqual(await mine(api, "a1"), []);
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM mensagem_destinatarios").get().n, 0);
});
