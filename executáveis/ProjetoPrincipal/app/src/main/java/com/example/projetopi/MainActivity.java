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

public class MainActivity extends AppCompatActivity {

    private EditText editEmail, editSenha;
    private Button btnEntrar;
    private TextView txtErroLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
        this.editEmail = findViewById(R.id.editEmail);
        this.editSenha = findViewById(R.id.editSenha);
        this.btnEntrar = findViewById(R.id.btnEntrar);
        this.txtErroLogin = findViewById(R.id.txtErroLogin);

        btnEntrar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                String Email = editEmail.getText().toString();
                String Senha = editSenha.getText().toString();
                Intent intent;

                if (Email.equals("admin@gmail.com") &&
                        Senha.equals("123456")) {
                    intent = new Intent(MainActivity.this, TelaInicial.class);
                    //Caso de tudo certo ira ser direcionado a outra pagina
                    //pagina Home
                    startActivity(intent);
                } else {
                    txtErroLogin.setVisibility(View.VISIBLE);
                    //Caso de erro o codigo era tornar visivel
                    // o codigo abaixo do Botão e encima do texto "esqueceu a senha"
                }

            }
        });
    }
}