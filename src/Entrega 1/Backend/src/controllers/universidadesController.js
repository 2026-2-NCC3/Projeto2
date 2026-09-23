const crypto = require("crypto");
const universidadesModel = require("../models/universidadesModel");

function listar(req, res, next) {
    try {
        return res.status(200).json(universidadesModel.listar());
    } catch (erro) {
        return next(erro);
    }
}

function criar(req, res, next) {
    try {
        const { name, logo_url, description } = req.body;

        if (!name) {
            return res.status(400).json({
                erro: "O campo name é obrigatório."
            });
        }

        const universidade = universidadesModel.criar({
            id: crypto.randomUUID(),
            name,
            logo_url,
            description,
            created_at: new Date().toISOString()
        });

        return res.status(201).json(universidade);
    } catch (erro) {
        return next(erro);
    }
}

module.exports = { listar, criar };