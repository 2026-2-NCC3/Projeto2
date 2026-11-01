const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runMigrations } = require('../../src/config/migrationRunner');
const root = path.resolve(__dirname, '../..');
const secret = 'fictitious-integration-secret-only';
async function withApi(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxima-api-'));
  const filename = path.join(dir, 'fictional.db');
  const db = new Database(filename);
  db.pragma('foreign_keys = ON'); db.pragma('journal_mode = WAL');
  runMigrations(db, { initialize: true });
  const hash = bcrypt.hashSync('Ficticio-teste-123!', 4);
  for (const [id, role] of [['a1','aluno'], ['a2','aluno'], ['op','admin_operador'], ['super','admin_super']]) {
    db.prepare('INSERT INTO usuarios (id,nome_completo,email) VALUES (?,?,?)').run(id, 'Ficticio ' + id, id + '@example.invalid');
    db.prepare('INSERT INTO credenciais VALUES (?,?,?)').run(id, hash, new Date().toISOString());
    db.prepare('INSERT INTO papeis (usuario_id,papel) VALUES (?,?)').run(id, role);
    if (role === 'aluno') db.prepare('INSERT INTO alunos (usuario_id) VALUES (?)').run(id);
  }
  const child = spawn(process.execPath, ['server.js'], { cwd:root, env:{...process.env, DB_PATH:filename, PORT:'0', JWT_SECRET:secret}, stdio:['ignore','pipe','pipe'] });
  const exited = once(child, 'exit');
  t.after(async () => {
    if (child.exitCode === null) { child.kill(); await exited; }
    db.close(); fs.rmSync(dir, {recursive:true, force:true});
  });
  const port = await new Promise((resolve,reject) => {
    let output='';
    const timer = setTimeout(()=>reject(new Error('Startup timeout')),10000);
    child.stdout.on('data',chunk=>{output+=chunk; const m=output.match(/localhost:(\d+)/); if(m){clearTimeout(timer);resolve(m[1]);}});
    child.once('error',e=>{clearTimeout(timer);reject(e);});
    child.once('exit',()=>{clearTimeout(timer);reject(new Error('Server exited before startup'));});
  });
  const token = (id, role = 'admin_super', options = {}) => jwt.sign({usuario_id:id,papel:role},secret,{expiresIn:'1h',...options});
  async function request(url, who, method='GET', body) {
    const headers = {'Content-Type':'application/json'};
    if (who) headers.Authorization = 'Bearer ' + (who.startsWith('ey') ? who : token(who));
    const res = await fetch('http://127.0.0.1:' + port + url,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    const text = await res.text();
    return {status:res.status, body:text?JSON.parse(text):null};
  }
  return {db,filename,request,token,dir,secret};
}
module.exports={withApi,root};
