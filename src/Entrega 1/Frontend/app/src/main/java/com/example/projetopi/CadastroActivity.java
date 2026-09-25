package com.example.projetopi;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.Proxy;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CadastroActivity extends AppCompatActivity {

    private EditText EditarNome, EditarEmail, EditSenha;
    private Button btnCadastrar;
    private TextView txtErroCadastro;
    private TextView txtEntrar;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_cadastro);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.txtErroCadastro), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
        this.EditarNome = findViewById(R.id.EditarNome);
        this.EditarEmail = findViewById(R.id.EditarEmail);
        this.EditSenha = findViewById(R.id.EditSenha);
        this.btnCadastrar = findViewById(R.id.btnCadastrar);
        this.txtErroCadastro = findViewById(R.id.txtErroCadastro);
        this.txtEntrar = findViewById(R.id.txtEntrar);

        txtEntrar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Intent intent = new Intent(
                        CadastroActivity.this,
                        MainActivity.class
                );

                startActivity(intent);
            }
        });

        btnCadastrar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String nome = EditarNome.getText().toString().trim();
                String email = EditarEmail.getText().toString().trim();
                String senha = EditSenha.getText().toString().trim();

                if (nome.isEmpty() || email.isEmpty() || senha.isEmpty()) {
                    txtErroCadastro.setText("Preencha todos os campos.");
                    txtErroCadastro.setVisibility(View.VISIBLE);
                    return;
                }

                txtErroCadastro.setVisibility(View.GONE);
                cadastrar(nome, email, senha);
            }
        });
    }

    private void cadastrar(String nome, String email, String senha) {
        JSONObject body = new JSONObject();
        try {
            body.put("nome_completo", nome);
            body.put("email", email);
            body.put("senha", senha);
            body.put("consentimento_lgpd", 1);
        } catch (JSONException e) {
            e.printStackTrace();
            return;
        }

        btnCadastrar.setEnabled(false);
        btnCadastrar.setText("Criando conta...");
        executor.execute(() -> enviarCadastro(body));
    }

    private void enviarCadastro(JSONObject body) {
        HttpURLConnection conexao = null;

        try {
            URL url = new URL(ApiConfig.PROFILES_URL);
            conexao = (HttpURLConnection) url.openConnection(Proxy.NO_PROXY);
            conexao.setRequestMethod("POST");
            conexao.setConnectTimeout(15_000);
            conexao.setReadTimeout(15_000);
            conexao.setDoOutput(true);
            conexao.setRequestProperty("Content-Type", "application/json; charset=UTF-8");

            try (OutputStream saida = conexao.getOutputStream()) {
                saida.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }

            int codigo = conexao.getResponseCode();
            String resposta = lerResposta(conexao, codigo);
            runOnUiThread(() -> processarRespostaCadastro(codigo, resposta));
        } catch (IOException erro) {
            Log.e("CadastroActivity", "Falha de rede em " + ApiConfig.PROFILES_URL, erro);
            runOnUiThread(() -> mostrarErro("Não foi possível conectar ao servidor."));
        } finally {
            if (conexao != null) {
                conexao.disconnect();
            }
        }
    }

    private String lerResposta(HttpURLConnection conexao, int codigo) throws IOException {
        InputStream entrada = codigo >= 200 && codigo < 300
                ? conexao.getInputStream()
                : conexao.getErrorStream();

        if (entrada == null) {
            return "";
        }

        StringBuilder resposta = new StringBuilder();
        try (BufferedReader leitor = new BufferedReader(
                new InputStreamReader(entrada, StandardCharsets.UTF_8)
        )) {
            String linha;
            while ((linha = leitor.readLine()) != null) {
                resposta.append(linha);
            }
        }
        return resposta.toString();
    }

    private void processarRespostaCadastro(int codigo, String resposta) {
        if (codigo >= 200 && codigo < 300) {
            Intent intent = new Intent(CadastroActivity.this, MainActivity.class);
            startActivity(intent);
            finish();
            return;
        }

        try {
            JSONObject json = new JSONObject(resposta);
            mostrarErro(json.optString("erro", "Erro ao cadastrar. Verifique os dados."));
        } catch (JSONException erro) {
            mostrarErro("Erro ao cadastrar. Verifique os dados.");
        }
    }

    private void mostrarErro(String mensagem) {
        btnCadastrar.setEnabled(true);
        btnCadastrar.setText("Criar conta ->");
        txtErroCadastro.setText(mensagem);
        txtErroCadastro.setVisibility(View.VISIBLE);
    }
}
