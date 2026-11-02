package com.example.projetopi;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

public class TelaInicial extends AppCompatActivity {

    private TextView txtSaudacao;
    private TextView btnSair;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_paginainicial);

        sessionManager = new SessionManager(this);

        if (!sessionManager.usuarioEstaLogado()) {
            abrirTelaDeLogin();
            return;
        }

        txtSaudacao = findViewById(R.id.txtSaudacao);
        btnSair = findViewById(R.id.btnSair);

        exibirNomeDoUsuario();
        configurarNavegacao();
        configurarLogout();
    }

    private void exibirNomeDoUsuario() {
        String nome = sessionManager.getNomeCompleto();

        if (nome != null && !nome.trim().isEmpty()) {
            txtSaudacao.setText(
                    "Olá, " + nome.trim() + "! 👋"
            );
        } else {
            txtSaudacao.setText("Olá! 👋");
        }
    }

    private void configurarNavegacao() {
        findViewById(R.id.navCursos).setOnClickListener(
                view -> abrirTela(CursosActivity.class)
        );

        findViewById(R.id.navAgenda).setOnClickListener(
                view -> abrirTela(AgendaActivity.class)
        );

        findViewById(R.id.navPerfil).setOnClickListener(
                view -> abrirTela(CarteirinhaActivity.class)
        );

        findViewById(R.id.atalhoCursos).setOnClickListener(
                view -> abrirTela(CursosActivity.class)
        );

        findViewById(R.id.atalhoAgenda).setOnClickListener(
                view -> abrirTela(AgendaActivity.class)
        );

        findViewById(R.id.atalhoCarteirinha).setOnClickListener(
                view -> abrirTela(CarteirinhaActivity.class)
        );
    }

    private void configurarLogout() {
        btnSair.setOnClickListener(view -> {
            sessionManager.encerrarSessao();
            abrirTelaDeLogin();
        });
    }

    private void abrirTelaDeLogin() {
        Intent intent = new Intent(
                TelaInicial.this,
                MainActivity.class
        );

        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_CLEAR_TASK
        );

        startActivity(intent);
        finish();
    }

    private void abrirTela(Class<?> tela) {
        Intent intent = new Intent(this, tela);
        startActivity(intent);
    }
}