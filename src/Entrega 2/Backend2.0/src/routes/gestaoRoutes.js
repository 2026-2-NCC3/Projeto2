'use strict';
const express = require('express');
const {requireAuth, requireAdmin, requireSuperAdmin} = require('../middlewares/authMiddleware');
const {modeloGestao} = require('../models/gestaoModel');
const {modeloTestes,DadosTesteInvalidos} = require('../models/testesGestaoModel');
const { registrarAuditoria } = require('../utils/controllerUtils');
const banco = require('../../database/database');
const router = express.Router();
router.use(requireAuth, requireAdmin);
router.use((req,res,next)=>{res.set('Cache-Control','no-store, private'); next();});
const model = modeloGestao();
const testes = modeloTestes();
const serve = fn => (req,res,next)=>{try { res.json(fn(req)); } catch (error) {next(error);} };
router.get('/dashboard', serve(()=>model.dashboard()));
router.get('/relatorios', (req,res,next)=>{
  const periodo = req.query.periodo ?? '6m';
  const cursoId = req.query.curso_id ?? null;
  if (typeof periodo!=='string' || !['6m','12m','ano'].includes(periodo) ||
      (cursoId !== null && (typeof cursoId!=='string' || cursoId.length>128 || !cursoId.trim()))) {
    return res.status(400).json({erro:'Filtros inválidos'});
  }
  return serve(()=>model.relatorios(periodo, cursoId))(req,res,next);
});
router.get('/eventos', serve(()=>model.eventos()));
router.get('/testes', serve(()=>testes.listar()));
router.get('/testes/resultados', serve(()=>testes.resultados()));
router.post('/testes', (req,res,next)=>{
  try {
    const result = banco.transaction(() => {
      const created = testes.criar(req.body);
      registrarAuditoria({usuarioId:req.usuario.id, acao:'criar', entidade:'testes_perfil', entidadeId:created.id, valoresDepois:created});
      return created;
    })();
    return res.status(201).json(result);
  } catch(error) {
    if(error instanceof DadosTesteInvalidos) return res.status(error.status).json({erro:error.message});
    return next(error);
  }
});
router.get('/auditoria', requireSuperAdmin, serve(()=>model.auditoria()));
module.exports=router;
