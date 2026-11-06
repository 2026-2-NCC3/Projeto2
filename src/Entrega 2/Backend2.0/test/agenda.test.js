const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withApi } = require("./helpers/api");
test("cursos persistidos e agenda isolada por aluno, sem confiar em IDs do cliente", async (t) => {
  const { db, request } = await withApi(t);
  for (const id of ["c1", "c2"]) {
    db.prepare(
      "INSERT INTO cursos (id,titulo,data_inicio,vagas_total) VALUES (?,?,?,?)",
    ).run(id, "Curso " + id, "2026-01-01", 10);
    db.prepare(
      "INSERT INTO atividades (id,curso_id,titulo,data,hora_inicio,hora_fim) VALUES (?,?,?,?,?,?)",
    ).run("at" + id, id, "Encontro " + id, "2026-01-01", "09:00", "11:00");
  }
  const courseResponse = await request("/api/cursos");
  assert.equal(courseResponse.status, 200);
  assert.equal(courseResponse.body.length, 2);
  assert.equal(courseResponse.body[0].carga_horaria_horas, 0);
  assert.equal(courseResponse.body[0].descricao, null);
  assert.equal((await request("/api/agenda")).status, 401);
  assert.deepEqual((await request("/api/agenda", "a1")).body, []);
  for (const [student, course] of [
    ["a1", "c1"],
    ["a2", "c2"],
  ]) {
    assert.equal(
      (
        await request("/api/inscricoes", student, "POST", {
          curso_id: course,
          aluno_id: student === "a1" ? "a2" : "a1",
        })
      ).status,
      201,
    );
  }
  const firstStudentAgenda = await request("/api/agenda?aluno_id=a2", "a1");
  assert.deepEqual(
    firstStudentAgenda.body.map((x) => x.id),
    ["atc1"],
  );
  assert.equal(firstStudentAgenda.body[0].curso_id, "c1");
  assert.ok(firstStudentAgenda.body[0].inscricao_id);
  assert.deepEqual(
    (await request("/api/agenda", "a2")).body.map((x) => x.id),
    ["atc2"],
  );
  assert.deepEqual((await request("/api/agenda?curso_id=c2", "a1")).body, []);
  assert.equal((await request("/api/agenda", "op")).status, 403);
  assert.equal(
    (await request("/api/inscricoes/c1/cancelamento", "a1", "PATCH", {}))
      .status,
    204,
  );
  assert.deepEqual((await request("/api/agenda", "a1")).body, []);
});
