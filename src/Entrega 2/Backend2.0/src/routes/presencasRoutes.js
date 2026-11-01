const express=require('express');
const db=require('../../database/database');
const {requireAuth}=require('../middlewares/authMiddleware');
const router=express.Router();
function history(alunoId) {
 return db.prepare(`
  SELECT p.id, p.inscricao_id, p.atividade_id, p.checkin_em, p.metodo,
         a.titulo, a.data, a.hora_inicio, a.hora_fim, a.curso_id, c.titulo AS curso_titulo
  FROM presencas p JOIN inscricoes i ON i.id=p.inscricao_id
  JOIN atividades a ON a.id=p.atividade_id JOIN cursos c ON c.id=a.curso_id
  WHERE i.aluno_id=? ORDER BY p.checkin_em DESC, p.id
 `).all(alunoId);
}
router.use(requireAuth);
router.get('/minhas',(req,res,next)=>{
 if(req.usuario.papel!=='aluno') return res.status(403).json({erro:'Operacao pessoal exclusiva para alunos'});
 try {res.json(history(req.usuario.id));}catch(e){next(e);}
});
router.get('/alunos/:id',(req,res,next)=>{
 if(req.usuario.id!==req.params.id && !['admin_operador','admin_super'].includes(req.usuario.papel)) return res.status(403).json({erro:'Acesso negado'});
 try {res.json(history(req.params.id));}catch(e){next(e);}
});
module.exports=router;
