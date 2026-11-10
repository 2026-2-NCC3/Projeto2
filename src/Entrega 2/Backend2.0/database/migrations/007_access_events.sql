-- Auditoria mínima de login bem-sucedido: dados reais, sem IP, senha ou token.
-- Exclusão de um usuário também remove seus eventos (privacidade LGPD).
CREATE TABLE acessos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE INDEX idx_acessos_criado_em ON acessos(criado_em);
CREATE INDEX idx_acessos_usuario_id ON acessos(usuario_id);
