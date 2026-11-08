package com.example.projetopi;

import android.content.Intent;
import android.view.WindowManager;
import android.view.View;
import android.widget.Toast;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import android.os.Bundle;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

public class CarteirinhaActivity extends AppCompatActivity {
    private SessionManager session;
    private String openingSessionVersion;

    protected SessionManager createSession() { return new SessionManager(this); }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_carteiraestudante);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return windowInsets;
        });
        session = createSession();
        openingSessionVersion = session.version();
        configurarNavegacao();
    }

    @Override protected void onStart() {
        super.onStart();
        if (!session.active() || !openingSessionVersion.equals(session.version())) {
            ocultarDados();
            startActivity(new Intent(this, MainActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
            finish();
            return;
        }
        preencherDadosDoAluno();
    }

    @Override protected void onStop() {
        ocultarDados();
        super.onStop();
    }

    private void ocultarDados() {
        ((TextView) findViewById(R.id.txtNomeAluno)).setText("");
        ((TextView) findViewById(R.id.txtRA)).setText("");
    }

    private void preencherDadosDoAluno() {
        ((TextView) findViewById(R.id.txtNomeAluno)).setText(session.fullName());
        ((TextView) findViewById(R.id.txtRA)).setText(
                getString(R.string.student_card_id, session.userId()));
    }

    private void configurarNavegacao() {
        View.OnClickListener unavailable = view -> Toast.makeText(this,
                R.string.student_card_export_unavailable, Toast.LENGTH_LONG).show();
        findViewById(R.id.btnCompartilhar).setOnClickListener(unavailable);
        findViewById(R.id.btnBaixarPdf).setOnClickListener(unavailable);
        findViewById(R.id.btnCertificados).setOnClickListener(
                view -> abrirTela(CertificatesActivity.class)
        );
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
