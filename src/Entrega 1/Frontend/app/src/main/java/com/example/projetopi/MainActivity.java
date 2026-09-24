package com.example.projetopi;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
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

public class MainActivity extends AppCompatActivity {

    private EditText editEmail;
    private EditText editSenha;
    private Button btnEntrar;
    private TextView txtErroLogin;
    private TextView txtCadastro;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        ViewCompat.setOnApplyWindowInsetsListener(
                findViewById(R.id.main),
                (view, insets) -> {
                    Insets systemBars = insets.getInsets(
                            WindowInsetsCompat.Type.systemBars()
                    );

                    view.setPadding(
                            systemBars.left,
                            systemBars.top,
                            systemBars.right,
                            systemBars.bottom
                    );

                    return insets;
                }
        );

        editEmail = findViewById(R.id.editEmail);
        editSenha = findViewById(R.id.editSenha);
        btnEntrar = findViewById(R.id.btnEntrar);
        txtErroLogin = findViewById(R.id.txtErroLogin);
        txtCadastro = findViewById(R.id.txtCadastro);

        txtCadastro.setOnClickListener(view -> {
            Intent intent = new Intent(
                    MainActivity.this,
                    CadastroActivity.class
            );

            startActivity(intent);
        });

        btnEntrar.setOnClickListener(view -> {
            String email = editEmail.getText().toString().trim();
            String senha = editSenha.getText().toString();

            esconderErro();

            if (email.isEmpty() || senha.isEmpty()) {
                mostrarErro("Preencha o e-mail e a senha.");
                return;
            }

            fazerLogin(email, senha);
        });
    }

    private void fazerLogin(String email, String senha) {
        JSONObject body = new JSONObject();

        try {
            body.put("email", email);
            body.put("senha", senha);
        } catch (JSONException erro) {
            mostrarErro("Não foi possível preparar os dados do login.");
            return;
        }

        alterarEstadoDoBotao(true);

        executor.execute(() -> enviarLogin(body));
    }

    private void enviarLogin(JSONObject body) {
        HttpURLConnection conexao = null;

        try {
            URL url = new URL(ApiConfig.LOGIN_URL);
            conexao = (HttpURLConnection) url.openConnection(Proxy.NO_PROXY);
            conexao.setRequestMethod("POST");
            conexao.setConnectTimeout(15_000);
            conexao.setReadTimeout(15_000);
            conexao.setDoOutput(true);
            conexao.setRequestProperty(
                    "Content-Type",
                    "application/json; charset=UTF-8"
            );

            try (OutputStream saida = conexao.getOutputStream()) {
                saida.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }

            int codigo = conexao.getResponseCode();
            String resposta = lerResposta(conexao, codigo);

            runOnUiThread(() -> processarRespostaLogin(codigo, resposta));
        } catch (IOException erro) {
            runOnUiThread(() -> {
                alterarEstadoDoBotao(false);
                mostrarErro("Não foi possível conectar ao servidor.");
            });
        } finally {
            if (conexao != null) {
                conexao.disconnect();
            }
        }
    }

    private String lerResposta(HttpURLConnection conexao, int codigo)
            throws IOException {
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

    private void processarRespostaLogin(int codigo, String resposta) {
        alterarEstadoDoBotao(false);

        try {
            JSONObject json = new JSONObject(resposta);

            if (codigo < 200 || codigo >= 300) {
                mostrarErro(json.optString(
                        "erro",
                        "Não foi possível realizar o login."
                ));
                return;
            }

            salvarSessao(json);

            Intent intent = new Intent(
                    MainActivity.this,
                    TelaInicial.class
            );

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_CLEAR_TASK
            );

            startActivity(intent);
            finish();
        } catch (JSONException erro) {
            mostrarErro("Resposta inválida recebida do servidor.");
        }
    }

    private void salvarSessao(JSONObject response) throws JSONException {
        String token = response.getString("token");
        JSONObject usuario = response.getJSONObject("usuario");

        SharedPreferences preferences = getSharedPreferences(
                "sessao_usuario",
                MODE_PRIVATE
        );

        preferences.edit()
                .putString("token", token)
                .putString("usuario_id", usuario.getString("id"))
                .putString(
                        "nome_completo",
                        usuario.optString("nome_completo", "")
                )
                .putString("email", usuario.optString("email", ""))
                .putString("papel", usuario.optString("papel", ""))
                .putBoolean("usuario_logado", true)
                .apply();
    }

    private void alterarEstadoDoBotao(boolean carregando) {
        btnEntrar.setEnabled(!carregando);
        btnEntrar.setText(carregando ? "Entrando..." : "Entrar");
    }

    private void mostrarErro(String mensagem) {
        txtErroLogin.setText(mensagem);
        txtErroLogin.setVisibility(View.VISIBLE);
    }

    private void esconderErro() {
        txtErroLogin.setVisibility(View.GONE);
    }
}
