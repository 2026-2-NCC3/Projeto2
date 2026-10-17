package com.example.projetopi.model;

import java.util.Objects;

public class Aluno {

    private final String id;
    private String nomeCompleto;
    private String email;
    private String escola;
    private String cidade;

    public Aluno(
            String id,
            String nomeCompleto,
            String email,
            String escola,
            String cidade
    ) {
        this.id = validarTexto(id, "O identificador do aluno é obrigatório.");
        this.nomeCompleto = validarTexto(nomeCompleto, "O nome do aluno é obrigatório.");
        this.email = validarTexto(email, "O e-mail do aluno é obrigatório.");
        this.escola = validarTexto(escola, "A escola do aluno é obrigatória.");
        this.cidade = validarTexto(cidade, "A cidade do aluno é obrigatória.");
    }

    public String getId() {
        return id;
    }

    public String getNomeCompleto() {
        return nomeCompleto;
    }

    public String getEmail() {
        return email;
    }

    public String getEscola() {
        return escola;
    }

    public String getCidade() {
        return cidade;
    }

    public void atualizarDados(
            String nomeCompleto,
            String email,
            String escola,
            String cidade
    ) {
        this.nomeCompleto = validarTexto(nomeCompleto, "O nome do aluno é obrigatório.");
        this.email = validarTexto(email, "O e-mail do aluno é obrigatório.");
        this.escola = validarTexto(escola, "A escola do aluno é obrigatória.");
        this.cidade = validarTexto(cidade, "A cidade do aluno é obrigatória.");
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

        if (!(outroObjeto instanceof Aluno)) {
            return false;
        }

        Aluno outroAluno = (Aluno) outroObjeto;
        return id.equals(outroAluno.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
