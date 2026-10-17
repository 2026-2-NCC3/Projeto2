const Database = require("better-sqlite3");
const path = require("path");

// Define o caminho do arquivo físico do banco de dados
const caminhoBanco = path.join(__dirname, "proxima_etapa.db");

// Abre o banco ou cria o arquivo caso ele ainda não exista
const banco = new Database(caminhoBanco);

// Ativa o uso das chaves estrangeiras no SQLite
banco.pragma("foreign_keys = ON");

// Ativa o modo WAL para melhorar a segurança e o desempenho
banco.pragma("journal_mode = WAL");

console.log("Banco de dados SQLite conectado com sucesso!");

module.exports = banco;