package com.example.projetopi;

import android.content.Context;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.android.volley.Request;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Backend local iniciado; cria somente uma conta ficticia de integracao. */
@RunWith(AndroidJUnit4.class)
public class RegistrationApiInstrumentedTest {
    private static final class Reply {
        final int status;
        final String body;
        Reply(int status, String body) { this.status = status; this.body = body; }
    }

    private Reply request(String route, int method, JSONObject body, String token) throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        CountDownLatch completed = new CountDownLatch(1);
        AtomicInteger status = new AtomicInteger(-1);
        AtomicReference<String> response = new AtomicReference<>("");
        ApiClient client = new ApiClient(context);
        Object tag = new Object();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
                client.requestWithStatus(tag, route, method, body, token, new ApiClient.StatusCallback() {
                    @Override public void success(int code, String result) {
                        status.set(code);
                        response.set(result);
                        completed.countDown();
                    }
                    @Override public void failure(int code) {
                        status.set(code);
                        completed.countDown();
                    }
                }));
        try {
            assertTrue("A API deve responder sem espera indefinida", completed.await(20, TimeUnit.SECONDS));
            return new Reply(status.get(), response.get());
        } finally {
            client.cancel(tag);
        }
    }

    @Test public void registrationLoginAndValidationUseRealAndroidNetworkStack() throws Exception {
        String email = "android-instrumentado-" + UUID.randomUUID() + "@example.invalid";
        JSONObject credentials = new JSONObject().put("nome_completo", "Teste ficticio Android")
                .put("email", email).put("senha", "Ficticio-android-2026!").put("consentimento_lgpd", 1);
        Reply created = request("/api/profiles", Request.Method.POST, credentials, "");
        assertTrue("Cadastro exige HTTP 201 e perfil valido", RegistrationResponse.isCreated(created.status, created.body));
        assertEquals(400, request("/api/profiles", Request.Method.POST, credentials, "").status);
        Reply login = request("/auth/login", Request.Method.POST, credentials, "");
        assertEquals(200, login.status);
        String token = new JSONObject(login.body).getString("token");
        Reply profile = request("/api/profiles/me", Request.Method.GET, null, token);
        assertEquals(200, profile.status);
        assertEquals(new JSONObject(created.body).getString("id"), new JSONObject(profile.body).getString("id"));
        JSONObject invalid = new JSONObject(credentials.toString()).put("senha", new JSONObject());
        assertEquals(400, request("/api/profiles", Request.Method.POST, invalid, "").status);
    }
    @Test public void registrationScreenAcceptsOptionalWhatsappAndStopsLoading() throws Exception {
        assertRegistrationScreenCreatesAccount("", null);
        assertRegistrationScreenCreatesAccount("+55 (11) 90000-0000", "11900000000");
    }

    private void assertRegistrationScreenCreatesAccount(String whatsapp, String expectedPhone) throws Exception {
        String email = "android-tela-" + UUID.randomUUID() + "@example.invalid";
        AtomicReference<CadastroActivity> screen = new AtomicReference<>();
        try (ActivityScenario<CadastroActivity> scenario = ActivityScenario.launch(CadastroActivity.class)) {
            scenario.onActivity(activity -> {
                screen.set(activity);
                ((EditText) activity.findViewById(R.id.EditarNome)).setText("Teste ficticio tela Android");
                ((EditText) activity.findViewById(R.id.EditarEmail)).setText(email);
                ((EditText) activity.findViewById(R.id.EditSenha)).setText("Ficticio-tela-2026!");
                ((EditText) activity.findViewById(R.id.EditarConfirmarSenha)).setText("Ficticio-tela-2026!");
                ((EditText) activity.findViewById(R.id.EditarWhatsapp)).setText(whatsapp);
                ((CheckBox) activity.findViewById(R.id.checkConsentimento)).setChecked(true);
                Button button = activity.findViewById(R.id.btnCadastrar);
                button.performClick();
                assertFalse(button.isEnabled());
            });
            long deadline = System.currentTimeMillis() + 18000;
            java.util.concurrent.atomic.AtomicBoolean finished = new java.util.concurrent.atomic.AtomicBoolean();
            while (System.currentTimeMillis() < deadline && !finished.get()) {
                InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
                        finished.set(screen.get().isFinishing() || screen.get().isDestroyed()));
                Thread.sleep(100);
            }
            assertTrue("A tela deve encerrar o carregamento apos HTTP 201", finished.get());
            JSONObject credentials = new JSONObject().put("email", email).put("senha", "Ficticio-tela-2026!");
            Reply login = request("/auth/login", Request.Method.POST, credentials, "");
            assertEquals(200, login.status);
            String token = new JSONObject(login.body).getString("token");
            Reply profile = request("/api/profiles/me", Request.Method.GET, null, token);
            assertEquals(200, profile.status);
            JSONObject student = new JSONObject(profile.body);
            if (expectedPhone == null) {
                assertTrue(student.isNull("telefone"));
            } else {
                assertEquals(expectedPhone, student.getString("telefone"));
            }
        }
    }
}
