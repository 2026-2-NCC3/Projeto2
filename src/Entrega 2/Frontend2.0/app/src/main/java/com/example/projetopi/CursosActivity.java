package com.example.projetopi;

import android.content.Intent;
import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

public class CursosActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_cursos);

        configurarNavegacao();
    }

    private void configurarNavegacao() {
        findViewById(R.id.navInicio).setOnClickListener(
                view -> abrirTela(TelaInicial.class)
        );

        findViewById(R.id.navAgenda).setOnClickListener(
                view -> abrirTela(AgendaActivity.class)
        );

        findViewById(R.id.navPerfil).setOnClickListener(
                view -> abrirTela(CarteirinhaActivity.class)
        );
    }

    private void abrirTela(Class<? extends AppCompatActivity> destino) {
        Intent intent = new Intent(this, destino);
        startActivity(intent);
    }
}
