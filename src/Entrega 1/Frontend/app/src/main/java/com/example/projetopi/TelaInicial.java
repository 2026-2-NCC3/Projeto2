package com.example.projetopi;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import com.example.projetopi.R;

public class TelaInicial extends AppCompatActivity {

    private TextView txtSaudacao;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_paginainicial);

        txtSaudacao = findViewById(R.id.txtSaudacao);

        exibirNomeDoUsuario();
        configurarNavegacao();
    }

    private void exibirNomeDoUsuario() {
        String nome = getIntent().getStringExtra("nomeUsuario");

        if (nome == null || nome.trim().isEmpty()) {
            SharedPreferences preferences = getSharedPreferences(
                    "sessao_usuario",
                    MODE_PRIVATE
            );

            nome = preferences.getString("nome_completo", "");
        }

        if (nome != null && !nome.trim().isEmpty()) {
            txtSaudacao.setText("Olá, " + nome.trim() + "! 👋");
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

    private void abrirTela(Class<?> tela) {
        Intent intent = new Intent(this, tela);

        startActivity(intent);
    }
}
