const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withApi } = require("./helpers/api");

const path = "/api/atividades";
const atividade = {
  curso_id: "c1", titulo: "Encontro", data: "2026-01-15", hora_inicio: "10:00", hora_fim: "11:00"
};

async function prepararCurso(t) {
  const api = await withApi(t);
  api.db.exec("INSERT INTO cursos (id,titulo,data_inicio,vagas_total) VALUES ('c1','Curso','2026-01-01',10)");
  return api;
}

test("atividades recusam datas, horários e corpos inválidos", async t => {
  const { db, request } = await prepararCurso(t);
  assert.equal((await request(path, "op", "POST", { ...atividade, data: "2026-02-30" })).status, 400);
  assert.equal((await request(path, "op", "POST", { ...atividade, hora_inicio: "09:90" })).status, 400);
  assert.equal((await request(path, "op", "POST", { ...atividade, titulo: {} })).status, 400);
  assert.equal((await request(path, "op", "POST", { ...atividade, tipo: {} })).status, 400);
  assert.equal((await request(path, "op", "POST")).status, 400);
  assert.equal(db.prepare("SELECT COUNT(*) AS total FROM atividades").get().total, 0);
});

test("atividades revertem criação, edição e exclusão se a auditoria falhar", async t => {
  const { db, request } = await prepararCurso(t);
  const criada = await request(path, "op", "POST", atividade);
  assert.equal(criada.status, 201);
  db.exec(`CREATE TRIGGER falhar_auditoria BEFORE INSERT ON audit_logs
    BEGIN SELECT RAISE(ABORT, 'Falha de teste'); END`);
  const resource = path + "/" + criada.body.id;
  assert.equal((await request(path, "op", "POST", atividade)).status, 400);
  assert.equal((await request(resource, "op", "PUT", { titulo: "Mudança" })).status, 400);
  assert.equal((await request(resource, "op", "DELETE")).status, 400);
  assert.deepEqual(db.prepare("SELECT * FROM atividades").all(), [criada.body]);
  assert.equal(db.prepare("SELECT COUNT(*) AS total FROM audit_logs").get().total, 1);
});
