const banco = require("../../database/database");

function listar() {
    return banco.prepare(`
        SELECT id, name, logo_url, description, created_at
        FROM universities
        ORDER BY created_at DESC
    `).all();
}

function criar(universidade) {
    const comando = banco.prepare(`
        INSERT INTO universities (
            id,
            name,
            logo_url,
            description,
            created_at
        ) VALUES (?, ?, ?, ?, ?)
    `);

    comando.run(
        universidade.id,
        universidade.name,
        universidade.logo_url || null,
        universidade.description || null,
        universidade.created_at
    );

    return banco.prepare(`
        SELECT id, name, logo_url, description, created_at
        FROM universities
        WHERE id = ?
    `).get(universidade.id);
}

module.exports = { listar, criar };