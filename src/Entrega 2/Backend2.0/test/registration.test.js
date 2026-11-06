const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { withApi, root } = require("./helpers/api");

test("cadastro publico confirma criacao, login e perfil sem elevar privilegios", async (t) => {
  const { db, request } = await withApi(t);
  const credentials = { nome_completo: "Teste ficticio cadastro", email: "cadastro@example.invalid",
    senha: "Teste-ficticio-123!", consentimento_lgpd: 1, papel: "admin_super" };
  const created = await request("/api/profiles", null, "POST", credentials);
  assert.equal(created.status, 201);
  assert.equal(created.body.email, credentials.email);
  assert.equal(created.body.senha_hash, undefined);
  assert.equal(db.prepare("SELECT papel FROM papeis WHERE usuario_id=?").get(created.body.id).papel, "aluno");
  const login = await request("/auth/login", null, "POST", credentials);
  assert.equal(login.status, 200);
  assert.equal(typeof login.body.token, "string");
  assert.equal((await request("/api/profiles/me", login.body.token)).body.id, created.body.id);
  assert.equal((await request("/api/profiles", null, "POST", credentials)).status, 400);
  assert.equal(db.prepare("SELECT count(*) AS n FROM usuarios WHERE email=?").get(credentials.email).n, 1);
});

test("cadastro recusa tipos invalidos e senha excessiva sem alterar registros", async (t) => {
  const { db, request } = await withApi(t);
  const before = db.prepare("SELECT * FROM usuarios ORDER BY id").all();
  const valid = { nome_completo: "Teste", email: "novo@example.invalid", senha: "Ficticio-123!" };
  for (const body of [null, [], {}, { ...valid, nome_completo: "   " }, { ...valid, nome_completo: {} },
    { ...valid, email: [] }, { ...valid, email: "invalido" }, { ...valid, senha: {} },
    { ...valid, senha: "a".repeat(73) }]) {
    const response = await request("/api/profiles", null, "POST", body);
    assert.equal(response.status, 400);
    assert.doesNotMatch(JSON.stringify(response.body), /bcrypt|sqlite|stack|TypeError/i);
  }
  assert.deepEqual(db.prepare("SELECT * FROM usuarios ORDER BY id").all(), before);
});

test("startup interrompe sem segredo antes de abrir HTTP ou banco", () => {
  const result = spawnSync(process.execPath, [path.join(root, "server.js")], {
    cwd: require("node:os").tmpdir(),
    env: { ...process.env, JWT_SECRET: "", DB_PATH: "banco-que-nao-deve-ser-criado.db", PORT: "0" },
    encoding: "utf8", timeout: 10000
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /configure JWT_SECRET/);
  assert.doesNotMatch(result.stdout, /Servidor executando/);
});

test("porta ocupada encerra com mensagem segura sem TypeError nem alterar o banco", async (t) => {
  const { db, filename } = await withApi(t);
  const blocker = require("node:net").createServer();
  await new Promise((resolve, reject) => {
    blocker.once("error", reject);
    blocker.listen(0, "0.0.0.0", resolve);
  });
  t.after(() => new Promise((resolve) => blocker.close(resolve)));
  const before = db.prepare("SELECT * FROM usuarios ORDER BY id").all();
  const result = spawnSync(process.execPath, [path.join(root, "server.js")], {
    cwd: root,
    env: { ...process.env, JWT_SECRET: "ficticio-startup-test", DB_PATH: filename,
      PORT: String(blocker.address().port) },
    encoding: "utf8", timeout: 10000
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /porta HTTP ja esta em uso/);
  assert.doesNotMatch(result.stderr, /TypeError|reading 'port'|senha_hash/);
  assert.doesNotMatch(result.stdout, /Servidor executando/);
  assert.deepEqual(db.prepare("SELECT * FROM usuarios ORDER BY id").all(), before);
});
