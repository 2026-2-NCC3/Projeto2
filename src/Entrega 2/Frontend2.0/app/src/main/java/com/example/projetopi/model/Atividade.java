package com.example.projetopi.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Atividade {

    private final String id;
    private final Curso curso;
    private String titulo;
    private String descricao;
    private LocalDateTime dataHora;

    public Atividade(
            String id,
            Curso curso,
            String titulo,
            String descricao,
            LocalDateTime dataHora
    ) {
        this.id = validarTexto(id, "O identificador da atividade é obrigatório.");
        this.curso = Objects.requireNonNull(curso, "O curso da atividade é obrigatório.");
        atualizarDados(titulo, descricao, dataHora);
    }

    public String getId() {
        return id;
    }

    public Curso getCurso() {
        return curso;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void atualizarDados(
            String titulo,
            String descricao,
            LocalDateTime dataHora
    ) {
        this.titulo = validarTexto(titulo, "O título da atividade é obrigatório.");
        this.descricao = validarTexto(descricao, "A descrição da atividade é obrigatória.");
        this.dataHora = Objects.requireNonNull(dataHora, "A data da atividade é obrigatória.");
    }

    private String validarTexto(String valor, String mensagem) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException(mensagem);
        }

        return valor.trim();
    }
}
