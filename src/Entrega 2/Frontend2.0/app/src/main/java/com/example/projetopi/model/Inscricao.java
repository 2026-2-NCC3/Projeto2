package com.example.projetopi.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Inscricao {

    private final String id;
    private final Aluno aluno;
    private final Curso curso;
    private final LocalDateTime criadaEm;
    private boolean ativa;

    public Inscricao(String id, Aluno aluno, Curso curso, LocalDateTime criadaEm) {
        this.id = validarTexto(id, "O identificador da inscrição é obrigatório.");
        this.aluno = Objects.requireNonNull(aluno, "O aluno da inscrição é obrigatório.");
        this.curso = Objects.requireNonNull(curso, "O curso da inscrição é obrigatório.");
        this.criadaEm = Objects.requireNonNull(criadaEm, "A data da inscrição é obrigatória.");
        this.ativa = true;
    }

    public String getId() {
        return id;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public Curso getCurso() {
        return curso;
    }

    public LocalDateTime getCriadaEm() {
        return criadaEm;
    }

    public boolean isAtiva() {
        return ativa;
    }

    public void cancelar() {
        ativa = false;
    }

    private String validarTexto(String valor, String mensagem) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException(mensagem);
        }

        return valor.trim();
    }
}
