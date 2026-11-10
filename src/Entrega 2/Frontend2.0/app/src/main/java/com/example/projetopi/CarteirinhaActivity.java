package com.example.projetopi;

import android.content.ClipData;
import android.content.Intent;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.view.WindowManager;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import android.os.Bundle;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

public class CarteirinhaActivity extends AppCompatActivity {
    private SessionManager session;
    private String openingSessionVersion;
    private String exportSessionVersion;
    private final ActivityResultLauncher<String> savePdf = registerForActivityResult(
            new ActivityResultContracts.CreateDocument("application/pdf"), this::salvarPdf);

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
        if (savedInstanceState != null) {
            exportSessionVersion = savedInstanceState.getString("exportSessionVersion");
        }
        configurarNavegacao();
    }

    @Override protected void onStart() {
        super.onStart();
        if (!sessaoOriginalAtiva()) {
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
        findViewById(R.id.btnCompartilhar).setOnClickListener(view -> compartilharPdf());
        findViewById(R.id.btnBaixarPdf).setOnClickListener(view -> {
            if (!sessaoOriginalAtiva()) return;
            exportSessionVersion = openingSessionVersion;
            savePdf.launch("carteirinha-proxima-etapa.pdf");
        });
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

    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        state.putString("exportSessionVersion", exportSessionVersion);
    }

    private boolean sessaoOriginalAtiva() {
        return session.active() && openingSessionVersion.equals(session.version());
    }

    private void salvarPdf(Uri uri) {
        String requestedSession = exportSessionVersion;
        exportSessionVersion = null;
        if (uri == null || !sessaoOriginalAtiva()
                || !openingSessionVersion.equals(requestedSession)) return;
        try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
            if (output == null) throw new IOException();
            escreverPdf(output);
        } catch (IOException | SecurityException error) {
            informarFalhaDeExportacao();
        }
    }

    private void compartilharPdf() {
        if (!sessaoOriginalAtiva()) return;
        File directory = new File(getCacheDir(), "student-card");
        File file = null;
        try {
            if (!directory.isDirectory() && !directory.mkdirs()) throw new IOException();
            file = File.createTempFile("carteirinha-", ".pdf", directory);
            try (OutputStream output = new FileOutputStream(file)) {
                escreverPdf(output);
            }
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".studentcard", file);
            Intent send = new Intent(Intent.ACTION_SEND)
                    .setType("application/pdf")
                    .putExtra(Intent.EXTRA_STREAM, uri)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            send.setClipData(ClipData.newRawUri("Carteirinha", uri));
            startActivity(Intent.createChooser(send, getString(R.string.student_card_share_pdf)));
        } catch (IOException | RuntimeException error) {
            if (file != null) file.delete();
            informarFalhaDeExportacao();
        }
    }

    private void escreverPdf(OutputStream output) throws IOException {
        String content = getString(R.string.student_card_pdf_title) + "\n\n"
                + session.fullName() + "\n"
                + getString(R.string.student_card_id, session.userId()) + "\n\n"
                + getString(R.string.student_card_pdf_notice);
        TextPaint paint = new TextPaint(TextPaint.ANTI_ALIAS_FLAG);
        paint.setTextSize(16);
        StaticLayout layout = StaticLayout.Builder.obtain(content, 0, content.length(), paint, 500)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .build();
        PdfDocument pdf = new PdfDocument();
        try {
            PdfDocument.Page page = pdf.startPage(new PdfDocument.PageInfo.Builder(
                    580, Math.max(240, layout.getHeight() + 80), 1).create());
            page.getCanvas().translate(40, 40);
            layout.draw(page.getCanvas());
            pdf.finishPage(page);
            pdf.writeTo(output);
        } finally {
            pdf.close();
        }
    }

    private void informarFalhaDeExportacao() {
        Toast.makeText(this, R.string.student_card_export_error, Toast.LENGTH_LONG).show();
    }

    private void abrirTela(Class<? extends AppCompatActivity> destino) {
        Intent intent = new Intent(this, destino);
        startActivity(intent);
    }
}
