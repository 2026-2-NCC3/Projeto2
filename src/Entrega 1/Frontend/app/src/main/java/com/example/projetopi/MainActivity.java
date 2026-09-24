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

import com.android.volley.Request;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;

public class MainActivity extends AppCompatActivity {

    private EditText editEmail;
    private EditText editSenha;
    private Button btnEntrar;
    private TextView txtErroLogin;
    private TextView txtCadastro;

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

        JsonObjectRequest request = new JsonObjectRequest(
                Request.Method.POST,
                ApiConfig.LOGIN_URL,
                body,
                response -> {
                    alterarEstadoDoBotao(false);

                    try {
                        salvarSessao(response);

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
                },
                error -> {
                    alterarEstadoDoBotao(false);
                    mostrarErro(obterMensagemDeErro(error));
                }
        );

        VolleySingleton
                .getInstance(this)
                .addToRequestQueue(request);
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

    private String obterMensagemDeErro(VolleyError error) {
        if (error.networkResponse == null) {
            return "Não foi possível conectar ao servidor.";
        }

        byte[] dados = error.networkResponse.data;

        if (dados == null || dados.length == 0) {
            return "Não foi possível realizar o login.";
        }

        try {
            String resposta = new String(
                    dados,
                    StandardCharsets.UTF_8
            );

            JSONObject json = new JSONObject(resposta);

            return json.optString(
                    "erro",
                    "Não foi possível realizar o login."
            );
        } catch (JSONException erro) {
            return "Não foi possível realizar o login.";
        }
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