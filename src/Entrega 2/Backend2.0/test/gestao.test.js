const {test} = require('node:test');
const assert = require('node:assert/strict');
const {withApi} = require('./helpers/api');

test('rotas de gestão: autenticadas, números reais e sem dados fictícios', async t=>{
  const api=await withApi(t);
  assert.equal((await api.request('/api/gestao/dashboard')).status,401);
  assert.equal((await api.request('/api/gestao/dashboard','a1')).status,403);
  const response=await api.request('/api/gestao/dashboard','op');
  assert.equal(response.status,200);
  assert.equal(response.body.indicadores.usuarios_total,4);
  assert.equal(response.body.indicadores.alunos_ativos,2);
  assert.equal(response.body.indicadores.cursos_total,0);
  assert.equal(response.body.indicadores.taxa_presenca,null);
  assert.deepEqual(response.body.ultimas_inscricoes,[]);
  assert.equal(response.body.indicadores.acessos_ultimos_7dias,0);
  assert.equal((await api.request('/api/gestao/relatorios?periodo=ruim','op')).status,400);
  assert.equal((await api.request('/api/gestao/auditoria','op')).status,403);
  assert.equal((await api.request('/api/gestao/auditoria','super')).status,200);
});

test('gestão calcula inscrições, presença e filtros sobre banco persistido', async t=>{
  const api=await withApi(t);
  const day=new Date(Date.now()-24*3600*1000).toISOString().slice(0,10);
  api.db.prepare("INSERT INTO cursos(id,titulo,data_inicio,vagas_total,universidade_id,status) VALUES ('c1','Curso QA','2020-01-01',10,NULL,'em_andamento')").run();
  api.db.prepare("INSERT INTO inscricoes(id,aluno_id,curso_id,status,criado_em) VALUES ('i1','a1','c1','cursando','2020-01-01T00:00:00Z')").run();
  api.db.prepare("INSERT INTO atividades(id,curso_id,titulo,data,hora_inicio,hora_fim) VALUES (?,?,?,?,?,?)")
    .run('act','c1','Aula QA',day,'09:00','10:00');
  api.db.prepare("INSERT INTO presencas(id,inscricao_id,atividade_id) VALUES ('pres','i1','act')").run();
  const data=(await api.request('/api/gestao/dashboard','op')).body;
  assert.equal(data.indicadores.cursos_total,1);
  assert.equal(data.indicadores.presencas_registradas,1);
  assert.equal(data.indicadores.taxa_presenca,100);
  assert.equal(data.alunos_por_curso[0].alunos,1);
  const report=await api.request('/api/gestao/relatorios?periodo=6m&curso_id=c1','op');
  assert.equal(report.status,200);
  assert.equal(report.body.frequencia_por_curso[0].taxa_presenca,100);
  assert.equal(report.body.frequencia_por_curso[0].inscritos,1);
});

test('testes de perfil: sem mock e persistência de rascunho, sem acesso de aluno', async t=>{
  const api=await withApi(t);
  assert.equal((await api.request('/api/gestao/testes','a1')).status,403);
  assert.deepEqual((await api.request('/api/gestao/testes','op')).body,[]);
  const testData={titulo:'Avaliação QA',versao:'1',perguntas:[{texto:'Como aprender?',alternativas:[
    {texto:'Visual',classificacao:'Visual',peso:2},{texto:'Prática',classificacao:'Prática',peso:4}
  ]}]};
  const created=await api.request('/api/gestao/testes','op','POST',testData);
  assert.equal(created.status,201);
  assert.equal(created.body.ativo,0);
  assert.equal((await api.request('/api/gestao/testes','op','POST',testData)).status,409);
  const listing=await api.request('/api/gestao/testes','op');
  assert.equal(listing.body[0].perguntas[0].alternativas.length,2);
  assert.equal((await api.request('/api/gestao/testes/resultados','op')).body.length,0);
});

test('login registra apenas acessos bem-sucedidos', async t=>{
  const api=await withApi(t);
  const login=await api.request('/auth/login',null,'POST',{email:'op@example.invalid',senha:'Ficticio-teste-123!'});
  assert.equal(login.status,200);
  const metrics=(await api.request('/api/gestao/dashboard','op')).body;
  assert.equal(metrics.indicadores.acessos_ultimos_7dias,1);
  const invalid=await api.request('/auth/login',null,'POST',{email:'op@example.invalid',senha:'errada'});
  assert.equal(invalid.status,401);
  assert.equal(api.db.prepare('SELECT COUNT(*) AS total FROM acessos').get().total,1);
});
