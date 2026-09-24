package com.example.projetopi.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Presenca {

    private final String id;
    private final Inscricao inscricao;
    private final Atividade atividade;
    private final LocalDateTime registradaEm;
    private boolean presente;

    public Presenca(
            String id,
            Inscricao inscricao,
            Atividade atividade,
            LocalDateTime registradaEm,
            boolean presente
    ) {
        this.id = validarTexto(id, "O identificador da presença é obrigatório.");
        this.inscricao = Objects.requireNonNull(inscricao, "A inscrição é obrigatória.");
        this.atividade = Objects.requireNonNull(atividade, "A atividade é obrigatória.");
        this.registradaEm = Objects.requireNonNull(registradaEm, "A data da presença é obrigatória.");
        this.presente = presente;

        validarCursoDaAtividade();
    }

    public String getId() {
        return id;
    }

    public Inscricao getInscricao() {
        return inscricao;
    }

    public Atividade getAtividade() {
        return atividade;
    }

    public LocalDateTime getRegistradaEm() {
        return registradaEm;
    }

    public boolean isPresente() {
        return presente;
    }

    public void atualizarStatus(boolean presente) {
        this.presente = presente;
    }

    private void validarCursoDaAtividade() {
        if (!inscricao.getCurso().equals(atividade.getCurso())) {
            throw new IllegalArgumentException(
                    "A atividade deve pertencer ao curso da inscrição."
            );
        }
    }

    private String validarTexto(String valor, String mensagem) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException(mensagem);
        }

        return valor.trim();
    }
}
