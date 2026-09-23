const crypto = require("crypto");
const model = require("../models/universidadesModel");
const erroDoBanco = (res,e) => e.code?.startsWith("SQLITE_CONSTRAINT") || /constraint/i.test(e.message) ? res.status(400).json({erro:`Dados inválidos: ${e.message}`}) : null;
function dados(body,atual={}) { return {nome:body.nome ?? atual.nome,logo_url:body.logo_url ?? atual.logo_url ?? null,site:body.site ?? atual.site ?? null,descricao:body.descricao ?? atual.descricao ?? null}; }
function listar(req,res,next) { try{return res.json(model.listar());}catch(e){return next(e);} }
function buscarPorId(req,res,next) { try{const item=model.buscarPorId(req.params.id);return item?res.json(item):res.status(404).json({erro:"Universidade não encontrada"});}catch(e){return next(e);} }
function criar(req,res,next) { try{const item=dados(req.body);if(!item.nome)return res.status(400).json({erro:"nome é obrigatório"});return res.status(201).json(model.criar({...item,id:crypto.randomUUID()}));}catch(e){return erroDoBanco(res,e)||next(e);} }
function atualizar(req,res,next) { try{const atual=model.buscarPorId(req.params.id);if(!atual)return res.status(404).json({erro:"Universidade não encontrada"});const item=dados(req.body,atual);if(!item.nome)return res.status(400).json({erro:"nome é obrigatório"});return res.json(model.atualizar(req.params.id,item));}catch(e){return erroDoBanco(res,e)||next(e);} }
function excluir(req,res,next) { try{return model.excluir(req.params.id)?res.status(204).end():res.status(404).json({erro:"Universidade não encontrada"});}catch(e){return erroDoBanco(res,e)||next(e);} }
module.exports={listar,buscarPorId,criar,atualizar,excluir};
