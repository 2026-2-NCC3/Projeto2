const crypto = require("crypto");
const universidadesModel = require("../models/universidadesModel");

function listar(req, res, next) {
    try {
        const universidades = universidadesModel.listar();

        return res.status(200).json(universidades);
    } catch (erro) {
        return next(erro);
    }
}

function criar(req, res, next) {
    try {
        const { name, logo_url, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                erro: "O campo name é obrigatório."
            });
        }

        const universidade = universidadesModel.criar({
            id: crypto.randomUUID(),
            name: name.trim(),
            logo_url: logo_url || null,
            description: description || null,
            created_at: new Date().toISOString()
        });

        return res.status(201).json(universidade);
    } catch (erro) {
        return next(erro);
    }
}

module.exports = { listar, criar };