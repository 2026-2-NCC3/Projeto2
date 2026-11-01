const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { withApi } = require("./helpers/api");
test("autenticacao, privacidade e autorizacao usam identidade e estado atual no servidor", async (t) => {
  const { db, request, token, secret } = await withApi(t);
  assert.equal((await request("/api/profiles")).status, 401);
  assert.equal((await request("/api/profiles", "invalid")).status, 401);
  assert.equal(
    (await request("/api/profiles", token("a1", "aluno", { expiresIn: -1 })))
      .status,
    401,
  );
  const tokenWithoutExpiry = jwt.sign({ usuario_id: "a1" }, secret);
  assert.equal(
    (await request("/api/profiles/me", tokenWithoutExpiry)).status,
    401,
  );
  const login = await request("/auth/login", null, "POST", {
    email: " A1@EXAMPLE.INVALID ",
    senha: "Ficticio-teste-123!",
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  assert.equal(login.body.usuario.senha_hash, undefined);
  const ownProfileResponse = await request("/api/profiles/me", login.body.token);
  assert.equal(ownProfileResponse.status, 200);
  assert.equal(ownProfileResponse.body.id, "a1");
  for (const key of ["senha_hash", "token", "motivo_bloqueio", "ativo"]) {
    assert.equal(ownProfileResponse.body[key], undefined);
  }
  assert.equal((await request("/api/profiles/a2", "a1")).status, 403);
  assert.equal((await request("/api/profiles/nao-existe", "a1")).status, 403);
  assert.equal(
    (
      await request("/api/profiles/a2", "a1", "PUT", {
        nome_completo: "Invasao",
      })
    ).status,
    403,
  );
  const updatedProfileResponse = await request(
    "/api/profiles/me",
    "a1",
    "PUT",
    { nome_completo: "Proprio", id: "a2", papel: "admin_super", ativo: 1 },
  );
  assert.equal(updatedProfileResponse.status, 200);
  assert.equal(updatedProfileResponse.body.id, "a1");
  assert.equal(
    db.prepare("SELECT papel FROM papeis WHERE usuario_id='a1'").get().papel,
    "aluno",
  );
  assert.equal((await request("/api/profiles", "a1")).status, 403);
  assert.equal((await request("/api/admins", "op")).status, 403);
  assert.equal((await request("/api/profiles", "op")).status, 200);
  assert.equal((await request("/api/profiles/a2", "super")).status, 200);
  assert.equal((await request("/api/admins", "super")).status, 200);
  const tokenBeforeBlocking = token("a1");
  db.prepare("UPDATE alunos SET bloqueado=1 WHERE usuario_id='a1'").run();
  assert.equal(
    (await request("/api/profiles/me", tokenBeforeBlocking)).status,
    401,
  );
  assert.equal(
    (
      await request("/auth/login", null, "POST", {
        email: "a1@example.invalid",
        senha: "Ficticio-teste-123!",
      })
    ).status,
    401,
  );
  db.prepare("UPDATE alunos SET bloqueado=0 WHERE usuario_id='a1'").run();
  db.prepare("UPDATE usuarios SET ativo=0 WHERE id='a1'").run();
  assert.equal(
    (await request("/api/profiles/me", tokenBeforeBlocking)).status,
    401,
  );
  const adminToken = token("op");
  db.prepare("UPDATE papeis SET papel='aluno' WHERE usuario_id='op'").run();
  assert.equal((await request("/api/profiles", adminToken)).status, 403);
  const tokenBeforeDeletion = token("a2");
  db.prepare("DELETE FROM usuarios WHERE id='a2'").run();
  assert.equal(
    (await request("/api/profiles/me", tokenBeforeDeletion)).status,
    401,
  );
  const invalidLoginResponse = await request("/auth/login", null, "POST", {
    email: {},
    senha: [],
  });
  assert.equal(invalidLoginResponse.status, 401);
  const invalidRegistrationResponse = await request(
    "/api/profiles",
    null,
    "POST",
    { email: "new@example.invalid", nome_completo: "Teste", senha: {} },
  );
  assert.equal(invalidRegistrationResponse.status, 500);
  assert.doesNotMatch(
    JSON.stringify(invalidRegistrationResponse.body),
    /TypeError|bcrypt|sqlite|stack/i,
  );
});
