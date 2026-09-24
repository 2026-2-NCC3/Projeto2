package com.example.projetopi.model;

import java.util.Objects;

public class Curso {

    private final String id;
    private String titulo;
    private String descricao;
    private int cargaHoraria;

    public Curso(String id, String titulo, String descricao, int cargaHoraria) {
        this.id = validarTexto(id, "O identificador do curso é obrigatório.");
        atualizarDados(titulo, descricao, cargaHoraria);
    }

    public String getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public int getCargaHoraria() {
        return cargaHoraria;
    }

    public void atualizarDados(String titulo, String descricao, int cargaHoraria) {
        this.titulo = validarTexto(titulo, "O título do curso é obrigatório.");
        this.descricao = validarTexto(descricao, "A descrição do curso é obrigatória.");

        if (cargaHoraria <= 0) {
            throw new IllegalArgumentException("A carga horária deve ser maior que zero.");
        }

        this.cargaHoraria = cargaHoraria;
    }

    private String validarTexto(String valor, String mensagem) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException(mensagem);
        }

        return valor.trim();
    }

    @Override
    public boolean equals(Object outroObjeto) {
        if (this == outroObjeto) {
            return true;
        }

        if (!(outroObjeto instanceof Curso)) {
            return false;
        }

        Curso outroCurso = (Curso) outroObjeto;
        return id.equals(outroCurso.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
