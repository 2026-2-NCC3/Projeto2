const express=require("express"); const c=require("../controllers/universidadesController"); const {requireAuth,requireAdmin}=require("../middlewares/authMiddleware"); const r=express.Router();
r.get("/",c.listar); r.get("/:id",c.buscarPorId);
// Escritas mudam parceiros institucionais; por isso exigem um administrador autenticado.
r.post("/",requireAuth,requireAdmin,c.criar); r.put("/:id",requireAuth,requireAdmin,c.atualizar); r.delete("/:id",requireAuth,requireAdmin,c.excluir);
module.exports=r;
