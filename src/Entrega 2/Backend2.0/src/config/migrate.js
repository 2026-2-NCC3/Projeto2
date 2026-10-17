const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const banco = require("../../database/database");

const caminhoSchema = path.join(__dirname, "../../database/schema.sql");
const caminhoBanco = path.join(__dirname, "../../database/proxima_etapa.db");
const caminhoBackup = path.join(__dirname, "../../database/proxima_etapa.pre-v5.db");
const schema = fs.readFileSync(caminhoSchema, "utf-8");

const tabelasV5 = [
  "usuarios", "credenciais", "papeis", "alunos", "universidades", "cursos",
  "atividades", "inscricoes", "presencas", "certificados", "certificado_criterios",
  "cards", "testes_perfil", "perguntas", "alternativas", "resultados_perfil",
  "resultado_respostas", "mensagens", "mensagem_destinatarios", "notificacoes", "audit_logs"
];

const senhaAdminDeDesenvolvimento = "ProximaEtapa@2026";

function criarAdminsDeTeste() {
  const admins = [
    { id: "admin-super-desenvolvimento", nome_completo: "Administração Principal", email: "admin.super@proximaetapa.local", papel: "admin_super" },
    { id: "admin-operador-desenvolvimento", nome_completo: "Administração Operacional", email: "admin.operador@proximaetapa.local", papel: "admin_operador" }
  ];

  const inserirUsuario = banco.prepare(`
    INSERT INTO usuarios (id, nome_completo, email) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET nome_completo = excluded.nome_completo, email = excluded.email,
      atualizado_em = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `);
  const inserirCredencial = banco.prepare(`
    INSERT INTO credenciais (usuario_id, senha_hash) VALUES (?, ?)
    ON CONFLICT(usuario_id) DO UPDATE SET senha_hash = excluded.senha_hash,
      atualizado_em = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `);
  const inserirPapel = banco.prepare(`
    INSERT INTO papeis (usuario_id, papel) VALUES (?, ?)
    ON CONFLICT(usuario_id) DO UPDATE SET papel = excluded.papel
  `);

  banco.transaction(() => {
    for (const admin of admins) {
      inserirUsuario.run(admin.id, admin.nome_completo, admin.email);
      inserirCredencial.run(admin.id, bcrypt.hashSync(senhaAdminDeDesenvolvimento, 12));
      inserirPapel.run(admin.id, admin.papel);
    }
  })();

  console.log("Administradores de desenvolvimento prontos para login.");
}

function nomesDasTabelas() {
  return banco
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((item) => item.name);
}

function bancoJaEstaNoSchemaV5() {
  const tabelasAtuais = nomesDasTabelas().sort();
  const tabelasEsperadas = [...tabelasV5].sort();

  return banco.pragma("user_version", { simple: true }) === 5
    && tabelasAtuais.length === tabelasEsperadas.length
    && tabelasAtuais.every((nome, indice) => nome === tabelasEsperadas[indice]);
}

function apagarEstruturaAnterior() {
  const objetos = banco.prepare(`
    SELECT type, name
    FROM sqlite_master
    WHERE name NOT LIKE 'sqlite_%'
      AND type IN ('view', 'trigger', 'table')
    ORDER BY CASE type WHEN 'view' THEN 1 WHEN 'trigger' THEN 2 ELSE 3 END
  `).all();

  banco.pragma("foreign_keys = OFF");
  for (const objeto of objetos) {
    const tipo = objeto.type.toUpperCase();
    const nomeSeguro = objeto.name.replace(/"/g, '""');
    banco.exec(`DROP ${tipo} IF EXISTS "${nomeSeguro}"`);
  }
  banco.pragma("foreign_keys = ON");
}

try {
  if (bancoJaEstaNoSchemaV5()) {
    console.log("Banco já está no schema v5. Nenhuma alteração foi necessária.");
  } else {
    if (fs.existsSync(caminhoBanco) && !fs.existsSync(caminhoBackup)) {
      fs.copyFileSync(caminhoBanco, caminhoBackup);
      console.log("Backup do banco anterior criado em database/proxima_etapa.pre-v5.db.");
    }

    apagarEstruturaAnterior();
    banco.exec(schema);
    banco.pragma("user_version = 5");

    console.log("Migração para o schema v5 executada com sucesso.");
    console.log(`Tabelas criadas: ${nomesDasTabelas().join(", ")}`);
  }

  criarAdminsDeTeste();
} catch (erro) {
  console.error("Erro ao executar a migration:", erro.message);
  process.exitCode = 1;
} finally {
  banco.close();
}
