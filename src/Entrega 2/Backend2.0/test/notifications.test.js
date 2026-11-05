const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withApi } = require("./helpers/api");

function fixtures(db) {
  db.exec("INSERT INTO cursos(id,titulo,data_inicio,vagas_total) VALUES ('c1','Curso A','2026-01-01',10),('c2','Curso B','2026-01-01',10);"
    + "INSERT INTO inscricoes(id,aluno_id,curso_id,status) VALUES ('i1','a1','c1','cursando'),('i2','a2','c2','inscrito');");
}
const sync = (api, user="a1", body={}) => api.request("/api/notificacoes/sincronizar", user, "POST", body);
const mine = async (api, user="a1") => (await api.request("/api/notificacoes/minhas", user)).body;
async function message(api, scope="todos", extra={}) {
  const draft = await api.request("/api/mensagens", "op", "POST",
    { titulo:"Aviso ficticio", corpo:"Conteudo ficticio completo", publico_alvo:scope, ...extra });
  assert.equal(draft.status,201);
  assert.equal((await api.request("/api/mensagens/"+draft.body.id+"/publicar","op","POST",{})).status,201);
  return draft.body.id;
}
const notifications = db => db.prepare("SELECT * FROM notificacoes ORDER BY id").all();

test("notificacoes exigem aluno ativo, isolam destinatario e recusam campos forjados", async t => {
  const api=await withApi(t);fixtures(api.db);
  assert.equal((await sync(api,null)).status,401);
  assert.equal((await sync(api,"op")).status,403);
  assert.equal((await sync(api,"a1",{aluno_id:"a2"})).status,400);
  assert.equal((await api.request("/api/notificacoes/minhas","super")).status,403);
  const own=(await sync(api)).body;
  assert.equal(own.length,2);
  const id=own[0].id;
  assert.equal((await api.request("/api/notificacoes/"+id,"a2")).status,404);
  assert.equal((await api.request("/api/notificacoes/"+id+"/leitura","a2","PUT",{})).status,404);
  assert.equal((await api.request("/api/notificacoes/"+id+"/leitura","a1","PUT",{lida:1})).status,400);
  assert.equal((await api.request("/api/notificacoes/minhas?aluno_id=a1","a2")).body.length,0);
  api.db.exec("UPDATE alunos SET bloqueado=1 WHERE usuario_id='a1'");
  assert.equal((await sync(api)).status,401);
});

test("publicacao global e por grupos gera alertas atomicos; leitura de alerta e comunicado sao independentes", async t => {
  const api=await withApi(t);fixtures(api.db);
  const global=await message(api);
  const course=await message(api,"curso",{curso_id:"c1"});
  await message(api,"individual",{aluno_ids:["a1"]});
  assert.equal((await mine(api)).length,3);
  assert.equal((await mine(api,"a2")).length,1);
  const notification=(await mine(api)).find(n=>n.destino.id===global);
  assert.equal((await api.request("/api/notificacoes/"+notification.id+"/leitura","a1","PUT",{})).body.lida,1);
  assert.equal((await api.request("/api/notificacoes/"+notification.id+"/leitura","a1","PUT",{})).body.lida,1);
  assert.equal((await api.request("/api/mensagens/"+global,"a1")).body.lido_em,null);
  await api.request("/api/mensagens/"+course+"/leitura","a1","PUT",{});
  assert.equal((await mine(api)).find(n=>n.destino.id===course).lida,0);
  api.db.exec("UPDATE inscricoes SET status='cancelado' WHERE id='i1'");
  assert.ok(!(await mine(api)).some(n=>n.destino?.id===course));
  assert.equal((await mine(api,"a2"))[0].lida,0);
});

test("sincronizacoes concorrentes e publicacao repetida nao duplicam alertas nem alteram leitura", async t => {
  const api=await withApi(t);fixtures(api.db);
  const id=await message(api);
  await Promise.all(Array.from({length:8},()=>sync(api)));
  const original=notifications(api.db);
  assert.equal(original.length,4); // Dois alertas globais imediatos e dois cursos para a1.
  await api.request("/api/mensagens/"+id+"/publicar","op","POST",{});
  await Promise.all(Array.from({length:8},()=>sync(api)));
  assert.deepEqual(notifications(api.db),original);
  assert.deepEqual(api.db.pragma("foreign_key_check"),[]);
});

test("cursos reais e certificados emitidos sao reconciliados sem expor arquivos ou simular emissao", async t => {
  const api=await withApi(t);fixtures(api.db);
  api.db.exec("INSERT INTO certificados(id,inscricao_id,status,arquivo_url) VALUES ('ce1','i1','pendente','https://private.invalid/SEGREDO.pdf');"
    + "INSERT INTO certificado_criterios VALUES ('cc1','ce1','frequencia',1),('cc2','ce1','avaliacao',1),('cc3','ce1','carga_horaria',1);");
  const certificatesBefore=api.db.prepare("SELECT * FROM certificados").all();
  assert.ok(!(await sync(api)).body.some(n=>n.tipo==="certificado"));
  assert.deepEqual(api.db.prepare("SELECT * FROM certificados").all(),certificatesBefore);
  api.db.exec("UPDATE certificados SET status='emitido',emitido_em=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id='ce1'");
  const response=await sync(api);
  const certificate=response.body.find(n=>n.tipo==="certificado");
  assert.equal(certificate.destino.id,"ce1");
  assert.ok(!JSON.stringify(response.body).includes("SEGREDO"));
  assert.ok(!JSON.stringify(response.body).includes("aluno_id"));
  assert.equal((await sync(api,"a2")).body.some(n=>n.tipo==="certificado"),false);
  api.db.exec("UPDATE certificados SET status='revogado',motivo_revogacao='Ficticio' WHERE id='ce1';UPDATE cursos SET status='cancelado' WHERE id='c1'");
  assert.ok(!(await mine(api)).some(n=>n.destino?.id==="ce1"||n.destino?.id==="c1"));
});

test("agenda usa auditoria real, grupos atuais e ignora PUT sem alteracao", async t => {
  const api=await withApi(t);fixtures(api.db);
  const activity={curso_id:"c1",titulo:"Encontro ficticio",data:"2026-11-06",hora_inicio:"14:00",hora_fim:"15:00"};
  const created=await api.request("/api/atividades","op","POST",activity);
  assert.equal(created.status,201);
  await sync(api);
  const first=(await mine(api)).filter(n=>n.tipo==="sistema");
  assert.equal(first.length,1);
  assert.deepEqual(first[0].destino,{tela:"agenda",id:"c1"});
  assert.equal((await api.request("/api/atividades/"+created.body.id,"op","PUT",{hora_inicio:"13:00"})).status,200);
  await sync(api);
  assert.equal((await mine(api)).filter(n=>n.tipo==="sistema").length,2);
  await api.request("/api/atividades/"+created.body.id,"op","PUT",{hora_inicio:"13:00"});
  await sync(api);
  assert.equal((await mine(api)).filter(n=>n.tipo==="sistema").length,2);
  assert.equal((await sync(api,"a2")).body.filter(n=>n.tipo==="sistema").length,0);
  assert.equal((await api.request("/api/atividades/"+created.body.id,"op","DELETE")).status,204);
  await sync(api);
  assert.equal((await mine(api)).filter(n=>n.tipo==="sistema").length,3);
  api.db.exec("UPDATE inscricoes SET status='cancelado' WHERE id='i1'");
  assert.equal((await mine(api)).filter(n=>n.tipo==="sistema").length,0);
});

test("falha na entrega reverte publicacao e reconciliacao integralmente", async t => {
  const api=await withApi(t);fixtures(api.db);
  api.db.exec("CREATE TRIGGER falha_alerta BEFORE INSERT ON notificacoes BEGIN SELECT RAISE(ABORT,'Ficticio'); END");
  const draft=await api.request("/api/mensagens","op","POST",{titulo:"Ficticio",corpo:"Teste",publico_alvo:"todos"});
  assert.equal((await api.request("/api/mensagens/"+draft.body.id+"/publicar","op","POST",{})).status,400);
  assert.equal(api.db.prepare("SELECT enviado_em FROM mensagens WHERE id=?").get(draft.body.id).enviado_em,null);
  assert.equal(api.db.prepare("SELECT COUNT(*) AS n FROM mensagem_destinatarios").get().n,0);
  assert.equal((await sync(api)).status,400);
  assert.equal(notifications(api.db).length,0);
  api.db.exec("DROP TRIGGER falha_alerta");
  assert.equal((await sync(api)).status,200);
});

test("links legados nunca sao publicados e destinos revogados deixam de ser acessiveis", async t => {
  const api=await withApi(t);fixtures(api.db);
  api.db.exec("INSERT INTO notificacoes(id,aluno_id,tipo,titulo,corpo,link) VALUES ('legacy','a1','sistema','Aviso','Texto','https://private.invalid/NAO-EXPOR'),('foreign','a1','certificado','Certificado','Texto','certificado:ce-other')");
  const own=await mine(api);
  assert.equal(own.length,1);
  assert.equal(own[0].destino,null);
  assert.ok(!JSON.stringify(own).includes("NAO-EXPOR"));
  assert.deepEqual(Object.keys(own[0]).sort(),["id","tipo","titulo","corpo","lida","criado_em","destino"].sort());
  assert.equal((await api.request("/api/notificacoes/foreign","a1")).status,404);
  api.db.exec("UPDATE usuarios SET ativo=0 WHERE id='a1'");
  assert.equal((await api.request("/api/notificacoes/legacy","a1")).status,401);
});

test("novo curso da API administrativa produz oportunidade real e respeita cancelamento", async t => {
  const api=await withApi(t);
  assert.deepEqual((await sync(api)).body,[]);
  const created=await api.request("/api/cursos","op","POST",{titulo:"Oportunidade ficticia",data_inicio:"2026-11-06",vagas_total:10});
  assert.equal(created.status,201);
  const result=await sync(api);
  assert.equal(result.body.length,1);
  assert.equal(result.body[0].destino.id,created.body.id);
  assert.equal((await sync(api,"a2")).body.length,1);
  const notification=result.body[0];
  await api.request("/api/notificacoes/"+notification.id+"/leitura","a1","PUT",{});
  await sync(api);
  assert.equal((await mine(api))[0].lida,1);
  assert.equal((await api.request("/api/cursos/"+created.body.id,"op","PUT",{status:"cancelado"})).status,200);
  assert.equal((await api.request("/api/notificacoes/"+notification.id,"a1")).status,404);
});
