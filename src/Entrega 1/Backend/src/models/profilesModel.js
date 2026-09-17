const banco = require("../../database/database");

function listar() {
    return banco.prepare(`
        SELECT id, full_name, email, school, grade, school_year, city, phone,
               points, courses_completed, no_shows, is_blocked, created_at, updated_at
        FROM profiles
        ORDER BY created_at DESC
    `).all();
}

function criar(perfil) {
    const comando = banco.prepare(`
        INSERT INTO profiles (
            id, full_name, email, password_hash, school, grade, school_year,
            city, phone, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    comando.run(
        perfil.id, perfil.full_name, perfil.email, perfil.password_hash,
        perfil.school || null, perfil.grade || null, perfil.school_year || null,
        perfil.city || null, perfil.phone || null,
        perfil.created_at, perfil.updated_at
    );

    return banco.prepare(`
        SELECT id, full_name, email, school, grade, school_year, city, phone,
               points, courses_completed, no_shows, is_blocked, created_at, updated_at
        FROM profiles WHERE id = ? 
        `).get(perfil.id);
}

module.exports = { listar, criar };
