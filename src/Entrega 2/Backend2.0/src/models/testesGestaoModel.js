'use strict';
const crypto = require('node:crypto');
const dbPadrao = require('../../database/database');

class DadosTesteInvalidos extends Error {
  constructor(message,status=400) { super(message); this.status=status; }
}
const textoValido = (s,max=300)=>typeof s==='string' && s.trim().length>0 && s.trim().length<=max;

function modeloTestes(db=dbPadrao) {
  function listar() {
    const tests = db.prepare(`SELECT t.id, t.titulo, t.versao, t.ativo, t.criado_em,
      (SELECT COUNT(*) FROM resultados_perfil r WHERE r.teste_id=t.id) AS respostas
      FROM testes_perfil t ORDER BY t.criado_em DESC, t.id DESC`).all();
    const questions = db.prepare('SELECT id, teste_id, texto, ordem FROM perguntas ORDER BY ordem,id').all();
    const alternatives = db.prepare('SELECT id, pergunta_id, texto, classificacao, peso, ordem FROM alternativas ORDER BY ordem,id').all();
    const byQuestion=new Map();
    for(const alt of alternatives){ if(!byQuestion.has(alt.pergunta_id))byQuestion.set(alt.pergunta_id,[]); byQuestion.get(alt.pergunta_id).push(alt); }
    const byTest = new Map();
    for(const q of questions){if(!byTest.has(q.teste_id))byTest.set(q.teste_id,[]);byTest.get(q.teste_id).push({...q,alternativas:byQuestion.get(q.id)??[]});}
    return tests.map(test=>({...test,perguntas:byTest.get(test.id)??[]}));
  }
  function resultados(){
    return db.prepare(`SELECT r.id, r.classificacao_final, r.pontuacao_total, r.respondido_em,
      u.nome_completo AS aluno, t.titulo AS teste, t.versao
      FROM resultados_perfil r
      JOIN usuarios u ON u.id=r.aluno_id
      JOIN testes_perfil t ON t.id=r.teste_id
      ORDER BY r.respondido_em DESC LIMIT 100`).all();
  }
  function criar(body){
    if(!body || !textoValido(body.titulo,150) || !textoValido(body.versao,40) ||
      !Array.isArray(body.perguntas) || body.perguntas.length<1 || body.perguntas.length>60){
      throw new DadosTesteInvalidos('Informe título, versão e entre 1 e 60 perguntas');
    }
    for(const [qi,q] of body.perguntas.entries()){
      if(!textoValido(q?.texto,1000) || !Array.isArray(q?.alternativas) ||
         q.alternativas.length<2 || q.alternativas.length>10){
        throw new DadosTesteInvalidos(`Pergunta ${qi+1}: informe texto e de 2 a 10 alternativas`);
      }
      for(const alt of q.alternativas){
        if(!textoValido(alt?.texto,500) || !textoValido(alt?.classificacao,100) ||
           !Number.isInteger(alt?.peso) || alt.peso<1 || alt.peso>5){
          throw new DadosTesteInvalidos(`Pergunta ${qi+1}: alternativa, classificação ou peso inválido`);
        }
      }
    }
    return db.transaction(()=>{
      const exists=db.prepare('SELECT id FROM testes_perfil WHERE titulo=? AND versao=?').get(body.titulo.trim(),body.versao.trim());
      if(exists) throw new DadosTesteInvalidos('Já existe um teste com este título e versão',409);
      const id=crypto.randomUUID();
      // Novo teste em rascunho: não publica um instrumento ainda não revisado.
      db.prepare('INSERT INTO testes_perfil(id,titulo,versao,ativo) VALUES(?,?,?,0)')
        .run(id,body.titulo.trim(),body.versao.trim());
      const putQ=db.prepare('INSERT INTO perguntas(id,teste_id,texto,ordem) VALUES (?,?,?,?)');
      const putA=db.prepare('INSERT INTO alternativas(id,pergunta_id,texto,classificacao,peso,ordem) VALUES(?,?,?,?,?,?)');
      body.perguntas.forEach((q,qi)=>{
        const qid=crypto.randomUUID();
        putQ.run(qid,id,q.texto.trim(),qi);
        q.alternativas.forEach((a,ai)=>putA.run(crypto.randomUUID(),qid,a.texto.trim(),a.classificacao.trim(),a.peso,ai));
      });
      return {id,titulo:body.titulo.trim(),versao:body.versao.trim(),ativo:0};
    })();
  }
  return {listar,resultados,criar};
}
module.exports={modeloTestes,DadosTesteInvalidos};
