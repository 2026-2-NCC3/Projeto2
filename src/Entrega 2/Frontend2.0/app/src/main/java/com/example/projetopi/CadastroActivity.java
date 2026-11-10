
package com.example.projetopi;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Patterns;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.android.volley.Request;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;

public class CadastroActivity extends AppCompatActivity {

    private static final long REQUEST_DEADLINE_MS = 15000;

    private EditText nameInput;
    private EditText emailInput;
    private EditText whatsappInput;
    private EditText passwordInput;
    private EditText confirmPasswordInput;

    private Button registerButton;
    private CheckBox consentInput;
    private TextView errorText;
    private TextView loginLink;

    private ApiClient api;

    private boolean submitting;
    private boolean started;
    private int generation;

    private final Handler handler =
            new Handler(Looper.getMainLooper());

    private final Runnable deadline = () -> {
        if (submitting) {
            generation++;
            api.cancel(this);
            finishSubmission();
            showError(getString(R.string.signup_timeout));
        }
    };

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_cadastro);

        // O ID Cadastro identifica o ConstraintLayout raiz; o ScrollView permanece como filho.
        View root = findViewById(R.id.Cadastro);

        final int left = root.getPaddingLeft();
        final int top = root.getPaddingTop();
        final int right = root.getPaddingRight();
        final int bottom = root.getPaddingBottom();

        ViewCompat.setOnApplyWindowInsetsListener(
                root,
                (view, insets) -> {

                    Insets bars = insets.getInsets(
                            WindowInsetsCompat.Type.systemBars()
                    );

                    Insets keyboard = insets.getInsets(
                            WindowInsetsCompat.Type.ime()
                    );

                    view.setPadding(
                            bars.left + left,
                            bars.top + top,
                            bars.right + right,
                            Math.max(bars.bottom, keyboard.bottom) + bottom
                    );

                    return insets;
                }
        );

        // Campos originais
        nameInput = findViewById(R.id.EditarNome);
        emailInput = findViewById(R.id.EditarEmail);
        passwordInput = findViewById(R.id.EditSenha);

        // Novos campos
        whatsappInput = findViewById(R.id.EditarWhatsapp);
        confirmPasswordInput = findViewById(
                R.id.EditarConfirmarSenha
        );

        consentInput = findViewById(R.id.checkConsentimento);
        registerButton = findViewById(R.id.btnCadastrar);
        errorText = findViewById(R.id.txtErroCadastro);
        loginLink = findViewById(R.id.txtEntrar);

        api = new ApiClient(this);

        registerButton.setOnClickListener(view -> register());

        loginLink.setOnClickListener(view -> openLogin());

        // Mantém a seta de voltar, se presente no XML.
        View backButton = findViewById(R.id.btnVoltarCadastro);

        if (backButton != null) {
            backButton.setOnClickListener(view -> openLogin());
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        started = true;
    }

    @Override
    protected void onStop() {
        started = false;
        generation++;

        api.cancel(this);

        boolean interrupted = submitting;

        finishSubmission();

        if (interrupted) {
            showError(
                    getString(R.string.signup_interrupted)
            );
        }

        super.onStop();
    }

    private void register() {

        if (submitting) {
            return;
        }

        // Primeiro obtém os valores de todos os campos.
        String name = nameInput
                .getText()
                .toString()
                .trim();

        String email = emailInput
                .getText()
                .toString()
                .trim();

        String whatsapp = whatsappInput
                .getText()
                .toString()
                .trim();

        String password = passwordInput
                .getText()
                .toString();

        String confirmPassword = confirmPasswordInput
                .getText()
                .toString();

        // 1. Campos obrigatórios
        if (name.isEmpty()
                || email.isEmpty()
                || password.isEmpty()
                || confirmPassword.isEmpty()) {

            showError(
                    "Preencha nome, e-mail, senha e confirmação de senha."
            );
            return;
        }

        // 2. Validar e-mail
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            showError(
                    getString(R.string.signup_invalid_email)
            );
            return;
        }

        // 3. Validar confirmação de senha
        if (!password.equals(confirmPassword)) {
            showError("As senhas não coincidem.");
            return;
        }

        // 4. Limite original da senha
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            showError(
                    getString(R.string.signup_password_limit)
            );
            return;
        }

        // 5. Validar WhatsApp somente se preenchido
        if (!whatsapp.isEmpty()) {

            // Aceita apenas dígitos após remover pontuação.
            String digits = whatsapp.replaceAll("[^0-9]", "");

            // Telefones brasileiros com DDD:
            // 10 ou 11 dígitos, ou com prefixo 55.
            if ((digits.length() == 12 || digits.length() == 13)
                    && digits.startsWith("55")) {
                digits = digits.substring(2);
            }

            if (digits.length() != 10 && digits.length() != 11) {
                showError(
                        "Informe um WhatsApp com DDD válido ou deixe em branco."
                );
                return;
            }

            whatsapp = digits;
        }

        // 6. Consentimento obrigatório
        if (!consentInput.isChecked()) {
            showError(
                    getString(R.string.signup_consent)
            );
            return;
        }

        // 7. Preparar JSON da API
        JSONObject body = new JSONObject();

        try {
            body.put("nome_completo", name);
            body.put("email", email);
            body.put("senha", password);
            body.put("consentimento_lgpd", 1);

            // O backend já aceita o campo telefone.
            // Não enviar quando estiver vazio.
            if (!whatsapp.isEmpty()) {
                body.put("telefone", whatsapp);
            }

            // confirmPassword NÃO vai para a API.

        } catch (JSONException error) {
            showError(
                    getString(R.string.signup_invalid_response)
            );
            return;
        }

        errorText.setVisibility(View.GONE);

        submitting = true;
        registerButton.setEnabled(false);
        registerButton.setText(R.string.signup_loading);

        setInputsEnabled(false);

        final int requestGeneration = ++generation;

        handler.postDelayed(
                deadline,
                REQUEST_DEADLINE_MS
        );

        // Mantém endpoint e tratamento de respostas originais.
        api.requestWithStatus(
                this,
                "/api/profiles",
                Request.Method.POST,
                body,
                "",
                new ApiClient.StatusCallback() {

                    @Override
                    public void success(int status, String response) {

                        if (!acceptResponse(requestGeneration)) {
                            return;
                        }

                        if (RegistrationResponse.isCreated(status, response)) {

                            Toast.makeText(
                                    CadastroActivity.this,
                                    R.string.signup_success,
                                    Toast.LENGTH_LONG
                            ).show();

                            openLogin();

                        } else {
                            showError(
                                    getString(
                                            R.string.signup_invalid_response
                                    )
                            );
                        }
                    }

                    @Override
                    public void failure(int status) {

                        if (!acceptResponse(requestGeneration)) {
                            return;
                        }

                        int message;

                        if (status == 0) {
                            message = R.string.signup_connection;
                        } else if (status == 400 || status == 409) {
                            message = R.string.signup_rejected;
                        } else if (status == 401 || status == 403) {
                            message = R.string.signup_unauthorized;
                        } else {
                            message = R.string.signup_server_error;
                        }

                        showError(getString(message));
                    }
                }
        );
    }

    private boolean acceptResponse(int requestGeneration) {

        if (!started
                || generation != requestGeneration
                || isFinishing()) {
            return false;
        }

        finishSubmission();
        return true;
    }

    private void finishSubmission() {

        handler.removeCallbacks(deadline);

        submitting = false;

        registerButton.setEnabled(true);
        registerButton.setText(R.string.signup_submit);

        setInputsEnabled(true);
    }

    private void setInputsEnabled(boolean enabled) {

        nameInput.setEnabled(enabled);
        emailInput.setEnabled(enabled);

        // Novos campos também ficam bloqueados durante o envio.
        whatsappInput.setEnabled(enabled);
        passwordInput.setEnabled(enabled);
        confirmPasswordInput.setEnabled(enabled);

        consentInput.setEnabled(enabled);
    }

    private void showError(String message) {

        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }

    private void openLogin() {

        startActivity(
                new Intent(this, MainActivity.class)
        );

        finish();
    }
}
