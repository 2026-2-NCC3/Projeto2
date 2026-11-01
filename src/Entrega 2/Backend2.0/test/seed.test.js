const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const bcrypt=require('bcryptjs');
const {withApi,root}=require('./helpers/api');
test('provisionamento e manual, valida entradas e recusa repeticao sem trocar senha ou papel',async t=>{
 const {db,filename,request}=await withApi(t);
 const seed=(email,password)=>spawnSync(process.execPath,['src/config/seedAdmin.js'],{cwd:root,encoding:'utf8',timeout:15000,env:{...process.env,DB_PATH:filename,ADMIN_EMAIL:email,ADMIN_PASSWORD:password}});
 const count=()=>db.prepare('SELECT count(*) AS n FROM usuarios').get().n;
 assert.equal(count(),4); // Startup e migracoes nao provisionam contas.
 for(const [email,password] of [['',''],['sem-email','Ficticio-administrador-123!'],['novo@example.invalid','curta'],['novo@example.invalid','á'.repeat(40)]]) {
  assert.equal(seed(email,password).status,1); assert.equal(count(),4);
 }
 const password='Ficticio-administrador-123!';
 const result=seed('novo@example.invalid',password); assert.equal(result.status,0,result.stderr);
 const saved=db.prepare('SELECT u.id,c.senha_hash,p.papel FROM usuarios u JOIN credenciais c ON c.usuario_id=u.id JOIN papeis p ON p.usuario_id=u.id WHERE u.email=?').get('novo@example.invalid');
 assert.equal(saved.papel,'admin_super'); assert.ok(bcrypt.compareSync(password,saved.senha_hash));
 assert.doesNotMatch(result.stdout+result.stderr,new RegExp(password));
 assert.equal(seed('NOVO@example.invalid','Outra-senha-ficticia-123!').status,1);
 assert.equal(db.prepare('SELECT senha_hash FROM credenciais WHERE usuario_id=?').get(saved.id).senha_hash,saved.senha_hash);
 assert.equal(seed('a1@example.invalid',password).status,1);
 assert.equal(db.prepare("SELECT papel FROM papeis WHERE usuario_id='a1'").get().papel,'aluno');
 assert.equal((await request('/api/admins','super','POST',{nome_completo:'Ficticio',email:'bad',senha:password,papel:'admin_super'})).status,400);
 assert.equal((await request('/api/admins/op/senha','super','PATCH',{senha:'curta'})).status,400);
 assert.equal(count(),5);
});
