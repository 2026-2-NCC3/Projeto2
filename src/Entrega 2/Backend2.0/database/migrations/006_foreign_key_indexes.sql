-- Indices aditivos para consultas e verificacao de chaves estrangeiras.
-- Nenhuma linha de negocio e escrita ou substituida.
CREATE INDEX idx_cursos_criado_por ON cursos(criado_por);
CREATE INDEX idx_resultado_respostas_pergunta_id ON resultado_respostas(pergunta_id);
CREATE INDEX idx_resultado_respostas_alternativa_id ON resultado_respostas(alternativa_id);
