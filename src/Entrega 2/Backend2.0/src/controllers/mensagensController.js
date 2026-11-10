const model = require("../models/mensagensModel");
const { tratarErroDoBanco } = require("../utils/controllerUtils");

function invalid() { throw new model.MessageError(400, "Informe titulo, corpo e destinatarios validos"); }
function validId(value) { return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= 128; }

function payload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)
      || Object.keys(body).some(key => !["titulo", "corpo", "publico_alvo", "curso_id", "aluno_ids"].includes(key))
      || typeof body.titulo !== "string" || !body.titulo.trim() || body.titulo.length > 160
      || typeof body.corpo !== "string" || !body.corpo.trim() || body.corpo.length > 10000
      || /\u0000/.test(body.titulo + body.corpo)
      || !["todos", "curso", "individual"].includes(body.publico_alvo)) invalid();
  const data = { titulo: body.titulo.trim(), corpo: body.corpo.trim(), publico_alvo: body.publico_alvo,
    curso_id: null, aluno_ids: [] };
  if (body.publico_alvo === "curso") {
    if (!validId(body.curso_id) || body.aluno_ids !== undefined) invalid();
    data.curso_id = body.curso_id;
  } else if (body.publico_alvo === "individual") {
    if (body.curso_id != null || !Array.isArray(body.aluno_ids) || !body.aluno_ids.length
        || body.aluno_ids.length > 500 || body.aluno_ids.some(id => !validId(id))
        || new Set(body.aluno_ids).size !== body.aluno_ids.length) invalid();
    data.aluno_ids = body.aluno_ids;
  } else if (body.curso_id != null || body.aluno_ids !== undefined) invalid();
  return data;
}

function noFields(body) {
  if (body !== undefined && (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length)) {
    throw new model.MessageError(400, "Esta operacao nao recebe campos");
  }
}

function handler(operation) {
  return (req, res, next) => {
    try { return operation(req, res); }
    catch (error) {
      if (error instanceof model.MessageError) return res.status(error.status).json({ erro: error.message });
      return tratarErroDoBanco(res, next, error);
    }
  };
}

module.exports = {
  listar: handler((req, res) => res.json(model.listarAdmin())),
  minhas: handler((req, res) => res.json(model.listarMinhas(req.usuario.id))),
  buscar: handler((req, res) => {
    const message = req.usuario.papel === "aluno"
      ? model.studentMessage(req.usuario.id, req.params.id) : model.adminMessage(req.params.id);
    if (!message) throw new model.MessageError(404, "Mensagem indisponivel");
    return res.json(message);
  }),
  criar: handler((req, res) => res.status(201).json(model.criar(req.usuario.id, payload(req.body)))),
  editar: handler((req, res) => res.json(model.editar(req.usuario.id, req.params.id, payload(req.body)))),
  excluir: handler((req, res) => { model.excluir(req.usuario.id, req.params.id); return res.status(204).end(); }),
  publicar: handler((req, res) => {
    noFields(req.body);
    const result = model.publicar(req.usuario.id, req.params.id);
    return res.status(result.created ? 201 : 200).json(result.message);
  }),
  ler: handler((req, res) => {
    noFields(req.body);
    return res.json(model.marcarLida(req.usuario.id, req.params.id));
  }),
};
