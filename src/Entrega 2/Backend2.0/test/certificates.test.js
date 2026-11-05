const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withApi } = require("./helpers/api");

function fixtures(db) {
  db.exec(`
    INSERT INTO cursos (id,titulo,data_inicio,vagas_total) VALUES
      ('c1','Curso ficticio A','2026-01-01',10), ('c2','Curso ficticio B','2026-01-01',10);
    INSERT INTO inscricoes (id,aluno_id,curso_id) VALUES ('i1','a1','c1'),('i2','a2','c2');
    INSERT INTO certificados (id,inscricao_id,status,arquivo_url,emitido_em) VALUES
      ('ce1','i1','pendente','https://private.example.invalid/segredo.pdf?token=NAO-EXPOR',NULL),
      ('ce2','i2','pendente','C:/privado/aluno2.pdf',NULL);
    INSERT INTO certificado_criterios (id,certificado_id,criterio,atendido) VALUES
      ('cc1','ce1','frequencia',1),('cc2','ce1','avaliacao',1),('cc3','ce1','carga_horaria',1),
      ('cc4','ce2','frequencia',0);
    UPDATE certificados SET status='emitido', emitido_em='2026-11-05T12:00:00Z' WHERE id='ce1';
  `);
}

test("certificados autenticam, isolam aluno e usam permissao administrativa atual", async t => {
  const api = await withApi(t);
  fixtures(api.db);
  assert.equal((await api.request("/api/certificados/minhas", null)).status, 401);
  assert.equal((await api.request("/api/certificados", null)).status, 401);
  assert.equal((await api.request("/api/certificados", "a1")).status, 403);
  assert.equal((await api.request("/api/certificados/minhas", "op")).status, 403);
  const aluno = await api.request("/api/certificados/minhas?aluno_id=a2", "a1");
  assert.equal(aluno.status, 200);
  assert.deepEqual(aluno.body.map(c => c.id), ["ce1"]);
  assert.deepEqual((await api.request("/api/certificados/minhas", "a2")).body.map(c => c.id), ["ce2"]);
  assert.equal((await api.request("/api/certificados", "op")).body.length, 2);
  assert.equal((await api.request("/api/certificados", "super")).body.length, 2);
  assert.equal((await api.request("/api/certificados", api.token("a1", "admin_super"))).status, 403);
  api.db.exec("UPDATE papeis SET papel='aluno' WHERE usuario_id='op'");
  assert.equal((await api.request("/api/certificados", "op")).status, 403);
});

test("certificados projetam somente metadados seguros sem URLs, caminhos ou criterios inventados", async t => {
  const api = await withApi(t);
  fixtures(api.db);
  const response = await api.request("/api/certificados/minhas", "a1");
  const metadata = response.body[0];
  assert.deepEqual(Object.keys(metadata).sort(), [
    "id", "inscricao_id", "curso_id", "titulo", "carga_horaria_horas", "status", "emitido_em",
    "criterios", "arquivo_disponivel", "arquivo_indisponivel_motivo",
  ].sort());
  assert.equal(metadata.status, "emitido");
  assert.equal(metadata.arquivo_disponivel, false);
  assert.equal(metadata.arquivo_indisponivel_motivo, "armazenamento_nao_validado");
  assert.equal(metadata.criterios.length, 3);
  assert.ok(metadata.criterios.every(c => c.atendido === 1));
  assert.doesNotMatch(JSON.stringify(response.body), /private\.example|NAO-EXPOR|arquivo_url|aluno_nome|senha|emitido_por/);
  const admin = (await api.request("/api/certificados", "op")).body;
  assert.ok(admin.every(c => typeof c.aluno_nome === "string" && !Object.hasOwn(c, "arquivo_url")));
  const header = await fetch(api.baseUrl + "/api/certificados", { headers: { Authorization: "Bearer " + api.token("op") } });
  assert.equal(header.headers.get("cache-control"), "no-store");
});

test("consulta vazia, estados pendentes e revogados preservam o banco e seus relacionamentos", async t => {
  const api = await withApi(t);
  assert.deepEqual((await api.request("/api/certificados/minhas", "a1")).body, []);
  fixtures(api.db);
  api.db.exec("UPDATE certificados SET status='revogado', motivo_revogacao='Ficticio' WHERE id='ce1'");
  const before = ["certificados", "certificado_criterios", "inscricoes", "usuarios"]
    .map(table => api.db.prepare("SELECT * FROM " + table + " ORDER BY 1").all());
  assert.equal((await api.request("/api/certificados/minhas", "a1")).body[0].status, "revogado");
  const pending = (await api.request("/api/certificados/minhas", "a2")).body[0];
  assert.equal(pending.status, "pendente");
  assert.equal(pending.emitido_em, null);
  assert.deepEqual(pending.criterios, [{ criterio: "frequencia", atendido: 0 }]);
  await api.request("/api/certificados", "op");
  assert.deepEqual(["certificados", "certificado_criterios", "inscricoes", "usuarios"]
    .map(table => api.db.prepare("SELECT * FROM " + table + " ORDER BY 1").all()), before);
  assert.deepEqual(api.db.pragma("foreign_key_check"), []);
});

test("usuarios bloqueados, inativos ou com sessao expirada nao consultam certificados", async t => {
  const api = await withApi(t);
  fixtures(api.db);
  assert.equal((await api.request("/api/certificados/minhas", api.token("a1", "aluno", { expiresIn: -1 }))).status, 401);
  api.db.exec("UPDATE alunos SET bloqueado=1 WHERE usuario_id='a1'");
  assert.equal((await api.request("/api/certificados/minhas", "a1")).status, 401);
  api.db.exec("UPDATE usuarios SET ativo=0 WHERE id='super'");
  assert.equal((await api.request("/api/certificados", "super")).status, 401);
});

test("sem origem de arquivo validada nao ha download, emissao ou atualizacao por esta API", async t => {
  const api = await withApi(t);
  fixtures(api.db);
  for (const [route, method] of [
    ["/api/certificados/ce1/arquivo", "GET"],
    ["/api/certificados", "POST"],
    ["/api/certificados/ce1", "PUT"],
    ["/api/certificados/ce1", "DELETE"],
  ]) {
    const response = await fetch(api.baseUrl + route, { method, headers: { Authorization: "Bearer " + api.token("op") } });
    assert.equal(response.status, 404);
  }
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM certificados").get().n, 2);
});
