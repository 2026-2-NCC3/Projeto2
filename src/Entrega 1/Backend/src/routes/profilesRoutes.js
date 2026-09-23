const express=require("express"); const c=require("../controllers/profilesController"); const {requireAuth,requireAdmin}=require("../middlewares/authMiddleware"); const r=express.Router();
r.get("/",c.listar); r.post("/",c.criar);
// Perfil individual só pode ser lido/editado pelo dono autenticado ou por um administrador.
r.get("/:id",requireAuth,c.buscarPorId); r.put("/:id",requireAuth,c.atualizar);
// Bloqueio e exclusão alteram o acesso do aluno e são exclusivos de administradores.
r.patch("/:id/bloqueio",requireAuth,requireAdmin,c.bloquear); r.delete("/:id",requireAuth,requireAdmin,c.excluir);
module.exports=r;
