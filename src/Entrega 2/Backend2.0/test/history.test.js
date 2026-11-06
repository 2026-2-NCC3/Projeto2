const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withApi } = require("./helpers/api");
test("historico retorna somente presencas persistidas do proprio aluno ou para admin atual", async (t) => {
  const { db, request, token } = await withApi(t);
  db.exec(
    "INSERT INTO cursos (id,titulo,data_inicio,vagas_total) VALUES ('c1','Ficticio','2026-01-01',10); INSERT INTO atividades (id,curso_id,titulo,data,hora_inicio,hora_fim) VALUES ('at1','c1','Encontro','2026-01-01','10:00','11:00'); INSERT INTO inscricoes (id,aluno_id,curso_id) VALUES ('i1','a1','c1'); INSERT INTO presencas (id,inscricao_id,atividade_id) VALUES ('p1','i1','at1')",
  );
  assert.equal((await request("/api/presencas/minhas")).status, 401);
  assert.deepEqual((await request("/api/presencas/minhas", "a2")).body, []);
  const ownHistoryResponse = await request(
    "/api/presencas/minhas?aluno_id=a2",
    "a1",
  );
  assert.equal(ownHistoryResponse.status, 200);
  assert.equal(ownHistoryResponse.body[0].id, "p1");
  assert.equal(ownHistoryResponse.body[0].titulo, "Encontro");
  assert.equal((await request("/api/presencas/alunos/a1", "a2")).status, 403);
  assert.equal((await request("/api/presencas/alunos/a1", "op")).status, 200);
  const tokenBeforeBlocking = token("a1");
  db.exec("UPDATE alunos SET bloqueado=1 WHERE usuario_id='a1'");
  assert.equal(
    (await request("/api/presencas/minhas", tokenBeforeBlocking)).status,
    401,
  );
});
