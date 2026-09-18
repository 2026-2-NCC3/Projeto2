const { promisify } = require("util");
const universidadesModel = require("../models/universidadesModel");

const scrypt = promisify(crypto.scrypt);

function listar(req, res, next) {
    try {
        return res.status(200).json(universidadesModel.listar());
    } catch (erro) {
        return next(erro);
    }
}

async function criar(req, res, next) {
    try {
        const { id, name, logo_url, description, created_at } = req.body;

        if (!id || ! name|| !created_at) {
            return res.status(400).json({ erro: "Os campos full_name, email e password são obrigatórios." });
        }

        const agora = new Date().toISOString();
        const universidade = universidadesModel.criar({
            id: crypto.randomUUID(),
            full_name,
            email,
            password_hash: await gerarHashDaSenha(password),
            school, grade, school_year, city, phone,
            created_at: agora,
            updated_at: agora
        });

        return res.status(201).json(perfil);
    } catch (erro) {
        if (erro.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
        }
        return next(erro);
    }
}

module.exports = { listar, criar };
