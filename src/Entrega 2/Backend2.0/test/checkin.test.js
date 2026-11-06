const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { withApi } = require("./helpers/api");

function prepararAtividade(db) {
  db.exec(`
    INSERT INTO cursos (id,titulo,data_inicio,vagas_total)
      VALUES ('c1','Curso ficticio','2026-01-01',10), ('c2','Outro ficticio','2026-01-01',10);
    INSERT INTO atividades (id,curso_id,titulo,data,hora_inicio,hora_fim)
      VALUES ('at1','c1','Encontro ficticio','2026-01-01','10:00','11:00'),
             ('at2','c2','Outro encontro','2026-01-01','10:00','11:00');
    INSERT INTO inscricoes (id,aluno_id,curso_id) VALUES ('i1','a1','c1');
  `);
}

function instante(deslocamentoSegundos) {
  const segundos = Math.floor(Date.now() / 1000) + deslocamentoSegundos;
  return new Date(segundos * 1000).toISOString().replace(".000Z", "Z");
}

async function emitir(request, campos = {}, usuario = "op") {
  return request("/api/presencas/qr-token", usuario, "POST", {
    atividade_id: "at1", valido_de: instante(-60), valido_ate: instante(600), ...campos
  });
}

function checkin(request, usuario, qrToken, extras = {}) {
  return request("/api/presencas/check-in", usuario, "POST", { qr_token: qrToken, ...extras });
}

function contar(db, tabela) {
  // Apenas nomes constantes dos fixtures; nunca recebe entrada HTTP.
  return db.prepare(`SELECT COUNT(*) AS total FROM ${tabela}`).get().total;
}

test("check-in autentica papeis e separa token QR de token de sessao", async (t) => {
  const { db, request, token, secret } = await withApi(t);
  prepararAtividade(db);
  assert.equal((await emitir(request, {}, null)).status, 401);
  assert.equal((await emitir(request, {}, "a1")).status, 403);
  const qr = await emitir(request);
  assert.equal(qr.status, 201);
  assert.equal((await checkin(request, null, qr.body.qr_token)).status, 401);
  assert.equal((await checkin(request, "op", qr.body.qr_token)).status, 403);
  assert.equal((await request("/api/presencas/minhas", qr.body.qr_token)).status, 401);
  assert.equal((await checkin(request, "a1", token("a1"))).status, 400);
  const payload = jwt.decode(qr.body.qr_token);
  assert.equal(payload.usuario_id, undefined);
  assert.equal(payload.atividade_id, "at1");
  for (const options of [{ audience: "outra" }, { issuer: "outro" }, { algorithm: "HS384" }]) {
    const invalidPayload = { ...payload };
    if (options.audience) delete invalidPayload.aud;
    if (options.issuer) delete invalidPayload.iss;
    const invalid = jwt.sign(invalidPayload, secret, options);
    assert.equal((await checkin(request, "a1", invalid)).status, 400);
  }
  assert.equal(contar(db, "presencas"), 0);
});

test("check-in persiste somente o aluno autenticado e integra o historico existente", async (t) => {
  const { db, request } = await withApi(t);
  prepararAtividade(db);
  const qr = await emitir(request);
  const response = await checkin(request, "a1", qr.body.qr_token);
  assert.equal(response.status, 201);
  assert.deepEqual(Object.keys(response.body).sort(),
    ["id", "inscricao_id", "atividade_id", "checkin_em", "metodo"].sort());
  assert.equal(response.body.inscricao_id, "i1");
  assert.equal(response.body.atividade_id, "at1");
  assert.equal(response.body.metodo, "qrcode");
  assert.ok(Number.isFinite(Date.parse(response.body.checkin_em)));
  const persisted = db.prepare("SELECT * FROM presencas").get();
  assert.equal(persisted.registrado_por, "a1");
  assert.equal((await request("/api/presencas/minhas", "a1")).body[0].id, persisted.id);
  assert.deepEqual((await request("/api/presencas/minhas", "a2")).body, []);
  assert.equal((await checkin(request, "a1", qr.body.qr_token, { aluno_id: "a2" })).status, 400);
  assert.equal((await checkin(request, "a1", qr.body.qr_token, { atividade_id: "at2" })).status, 400);
  assert.equal((await checkin(request, "a1", qr.body.qr_token, { checkin_em: "2026-01-01" })).status, 400);
  assert.deepEqual(db.pragma("foreign_key_check"), []);
});

test("check-ins HTTP concorrentes sao idempotentes e preservam dados relacionados", async (t) => {
  const { db, request } = await withApi(t);
  prepararAtividade(db);
  const before = ["usuarios", "alunos", "inscricoes", "cursos", "atividades"]
    .map((table) => db.prepare(`SELECT * FROM ${table}`).all());
  const qr = await emitir(request);
  const responses = await Promise.all(Array.from({ length: 12 }, () => checkin(request, "a1", qr.body.qr_token)));
  assert.equal(responses.filter((r) => r.status === 201).length, 1);
  assert.equal(responses.filter((r) => r.status === 200).length, 11);
  assert.equal(new Set(responses.map((r) => JSON.stringify(r.body))).size, 1);
  assert.equal(contar(db, "presencas"), 1);
  assert.equal(contar(db, "audit_logs"), 1);
  assert.deepEqual(["usuarios", "alunos", "inscricoes", "cursos", "atividades"]
    .map((table) => db.prepare(`SELECT * FROM ${table}`).all()), before);
  const audit = db.prepare("SELECT * FROM audit_logs").get();
  assert.equal(audit.entidade, "presencas");
  assert.equal(audit.usuario_id, "a1");
  assert.ok(!JSON.stringify(audit).includes(qr.body.qr_token));
});

test("check-in nao substitui uma presenca manual ja registrada", async (t) => {
  const { db, request } = await withApi(t);
  prepararAtividade(db);
  db.prepare(`INSERT INTO presencas (id,inscricao_id,atividade_id,metodo,justificativa,registrado_por)
    VALUES ('original','i1','at1','manual','Registro ficticio autorizado','op')`).run();
  const before = db.prepare("SELECT * FROM presencas").all();
  const qr = await emitir(request);
  assert.equal((await checkin(request, "a1", qr.body.qr_token)).status, 200);
  assert.deepEqual(db.prepare("SELECT * FROM presencas").all(), before);
  assert.equal(contar(db, "audit_logs"), 0);
});

test("check-in recusa falta de inscricao, cancelamento e estados atuais de acesso", async (t) => {
  const { db, request } = await withApi(t);
  prepararAtividade(db);
  const qr = await emitir(request);
  assert.equal((await checkin(request, "a2", qr.body.qr_token)).status, 403);
  db.exec("UPDATE inscricoes SET status='cancelado' WHERE id='i1'");
  assert.equal((await checkin(request, "a1", qr.body.qr_token)).status, 403);
  db.exec("UPDATE inscricoes SET status='cursando' WHERE id='i1'; UPDATE cursos SET status='cancelado' WHERE id='c1'");
  assert.equal((await checkin(request, "a1", qr.body.qr_token)).status, 403);
  assert.equal((await emitir(request)).status, 404);
  db.exec("UPDATE cursos SET status='em_andamento' WHERE id='c1'; UPDATE alunos SET bloqueado=1 WHERE usuario_id='a1'");
  assert.equal((await checkin(request, "a1", qr.body.qr_token)).status, 401);
  db.exec("UPDATE alunos SET bloqueado=0 WHERE usuario_id='a1'; UPDATE usuarios SET ativo=0 WHERE id='a1'");
  assert.equal((await checkin(request, "a1", qr.body.qr_token)).status, 401);
  db.exec("UPDATE usuarios SET ativo=1 WHERE id='a1'; UPDATE papeis SET papel='aluno' WHERE usuario_id='op'");
  assert.equal((await checkin(request, "a1", qr.body.qr_token)).status, 403);
  assert.equal(contar(db, "presencas"), 0);
});

test("QR exige janela UTC explicita e recusa tokens expirados, futuros ou adulterados", async (t) => {
  const { db, request, secret } = await withApi(t);
  prepararAtividade(db);
  for (const fields of [
    { valido_de: null }, { valido_ate: "2026-02-30T10:00:00Z" },
    { valido_de: "2026-01-01T10:00:00" }, { valido_ate: instante(-120) },
    { atividade_id: {} }, { atividade_id: "at1' OR 1=1 --" }
  ]) {
    assert.ok([400, 404].includes((await emitir(request, fields)).status));
  }
  const future = await emitir(request, { valido_de: instante(60) });
  assert.equal(future.status, 201);
  assert.equal((await checkin(request, "a1", future.body.qr_token)).status, 400);
  const qr = await emitir(request);
  const expiredPayload = { ...jwt.decode(qr.body.qr_token), nbf: 1, exp: 2 };
  const expired = jwt.sign(expiredPayload, secret);
  assert.equal((await checkin(request, "a1", expired)).status, 400);
  const pieces = qr.body.qr_token.split(".");
  pieces[1] = Buffer.from(JSON.stringify({ ...jwt.decode(qr.body.qr_token), atividade_id: "at2" })).toString("base64url");
  assert.equal((await checkin(request, "a1", pieces.join("."))).status, 400);
  assert.equal((await checkin(request, "a1", "invalido")).status, 400);
  assert.equal((await request("/api/presencas/check-in", "a1", "POST", null)).status, 400);
  assert.equal(contar(db, "presencas"), 0);
});

test("falha de auditoria reverte a presenca e permite repetir sem registros parciais", async (t) => {
  const { db, request } = await withApi(t);
  prepararAtividade(db);
  const qr = await emitir(request);
  db.exec(`CREATE TRIGGER falha_auditoria_ficticia BEFORE INSERT ON audit_logs
    BEGIN SELECT RAISE(ABORT, 'Falha ficticia'); END`);
  const failed = await checkin(request, "a1", qr.body.qr_token);
  assert.equal(failed.status, 400);
  assert.ok(!JSON.stringify(failed.body).includes("Falha ficticia"));
  assert.equal(contar(db, "presencas"), 0);
  assert.equal(contar(db, "audit_logs"), 0);
  db.exec("DROP TRIGGER falha_auditoria_ficticia");
  assert.equal((await checkin(request, "a1", qr.body.qr_token)).status, 201);
  assert.deepEqual(db.pragma("foreign_key_check"), []);
});
