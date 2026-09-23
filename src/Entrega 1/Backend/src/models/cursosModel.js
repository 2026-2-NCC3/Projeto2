const banco = require("../../database/database");
const colunas = "id, titulo, descricao, categoria, carga_horaria_horas, universidade_id, modalidade, local, link_online, data_inicio, data_fim, vagas_total, vagas_disponiveis, emite_certificado, status, banner_url, criado_por, criado_em, atualizado_em";
const listar = () => banco.prepare(`SELECT ${colunas} FROM cursos ORDER BY criado_em DESC`).all();
const buscarPorId = (id) => banco.prepare(`SELECT ${colunas} FROM cursos WHERE id = ?`).get(id);
function criar(curso) {
  banco.prepare("INSERT INTO cursos (id,titulo,descricao,categoria,carga_horaria_horas,universidade_id,modalidade,local,link_online,data_inicio,data_fim,vagas_total,emite_certificado,status,banner_url,criado_por) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(curso.id, curso.titulo, curso.descricao, curso.categoria, curso.carga_horaria_horas, curso.universidade_id, curso.modalidade, curso.local, curso.link_online, curso.data_inicio, curso.data_fim, curso.vagas_total, curso.emite_certificado, curso.status, curso.banner_url, curso.criado_por);
  return buscarPorId(curso.id);
}
function atualizar(id, curso) {
  banco.prepare("UPDATE cursos SET titulo=?,descricao=?,categoria=?,carga_horaria_horas=?,universidade_id=?,modalidade=?,local=?,link_online=?,data_inicio=?,data_fim=?,vagas_total=?,emite_certificado=?,status=?,banner_url=? WHERE id=?").run(curso.titulo, curso.descricao, curso.categoria, curso.carga_horaria_horas, curso.universidade_id, curso.modalidade, curso.local, curso.link_online, curso.data_inicio, curso.data_fim, curso.vagas_total, curso.emite_certificado, curso.status, curso.banner_url, id);
  return buscarPorId(id);
}
const excluir = (id) => banco.prepare("DELETE FROM cursos WHERE id = ?").run(id).changes > 0;
module.exports = { listar, buscarPorId, criar, atualizar, excluir };
