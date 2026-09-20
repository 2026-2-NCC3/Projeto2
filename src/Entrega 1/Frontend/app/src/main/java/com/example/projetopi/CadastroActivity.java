package com.example.projetopi;

import android.content.Intent;
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

public class CadastroActivity extends AppCompatActivity {

    private EditText EditarNome, EditarEmail, EditSenha;
    private Button btnCadastrar;
    private TextView txtErroCadastro;
    private TextView txtEntrar;

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

                cadastrar(nome, email, senha);
            }
        });
    }

    private void cadastrar(String nome, String email, String senha) {
        JSONObject body = new JSONObject();
        try {
            body.put("full_name", nome);
            body.put("email", email);
            body.put("password", senha);
        } catch (JSONException e) {
            e.printStackTrace();
            return;
        }

        JsonObjectRequest request = new JsonObjectRequest(
                Request.Method.POST, ApiConfig.PROFILES_URL, body,
                response -> {
                        Intent intent = new Intent(CadastroActivity.this, MainActivity.class);
                        startActivity(intent);
                        finish();
                },
                error -> {
                        txtErroCadastro.setText(mensagemDeErro(error));
                        txtErroCadastro.setVisibility(View.VISIBLE);
                }
        );

        VolleySingleton.getInstance(this).addToRequestQueue(request);
    }

    private String mensagemDeErro(VolleyError error) {
        if (error.networkResponse == null) {
            return "Não foi possível conectar ao servidor local.";
        }

        try {
            JSONObject resposta = new JSONObject(new String(error.networkResponse.data));
            return resposta.optString("erro", "Erro ao cadastrar. Verifique os dados.");
        } catch (Exception ignored) {
            return "Erro ao cadastrar. Verifique os dados.";
        }
    }
}
