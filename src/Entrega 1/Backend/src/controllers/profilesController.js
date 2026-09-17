const crypto = require("crypto");
const { promisify } = require("util");
const profilesModel = require("../models/profilesModel");

const scrypt = promisify(crypto.scrypt);

async function gerarHashDaSenha(senha) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await scrypt(senha, salt, 64);
    return `${salt}:${hash.toString("hex")}`;
}

function listar(req, res, next) {
    try {
        return res.status(200).json(profilesModel.listar());
    } catch (erro) {
        return next(erro);
    }
}

async function criar(req, res, next) {
    try {
        const { full_name, email, password, school, grade, school_year, city, phone } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ erro: "Os campos full_name, email e password são obrigatórios." });
        }

        const agora = new Date().toISOString();
        const perfil = profilesModel.criar({
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
