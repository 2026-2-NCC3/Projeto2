package com.example.projetopi;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

public class CarteirinhaActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_carteiraestudante);

        preencherDadosDoAluno();
        configurarNavegacao();
    }

    private void preencherDadosDoAluno() {
        SharedPreferences preferencias = getSharedPreferences(
                "sessao_usuario",
                MODE_PRIVATE
        );
        String nome = preferencias.getString("nome_completo", "Nome do aluno");
        String id = preferencias.getString("usuario_id", "");
        String identificador = id.isEmpty()
                ? "ID do aluno: --"
                : "ID do aluno: " + id.substring(0, Math.min(8, id.length())).toUpperCase();

        ((TextView) findViewById(R.id.txtNomeAluno)).setText(nome);
        ((TextView) findViewById(R.id.txtRA)).setText(identificador);
    }

    private void configurarNavegacao() {
        findViewById(R.id.navInicio).setOnClickListener(
                view -> abrirTela(TelaInicial.class)
        );

        findViewById(R.id.navCursos).setOnClickListener(
                view -> abrirTela(CursosActivity.class)
        );

        findViewById(R.id.navAgenda).setOnClickListener(
                view -> abrirTela(AgendaActivity.class)
        );
    }

    private void abrirTela(Class<? extends AppCompatActivity> destino) {
        Intent intent = new Intent(this, destino);
        startActivity(intent);
    }
}
