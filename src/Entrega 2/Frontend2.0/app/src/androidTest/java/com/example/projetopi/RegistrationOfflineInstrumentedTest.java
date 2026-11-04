package com.example.projetopi;

import android.graphics.Rect;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.TextView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Assume;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class RegistrationOfflineInstrumentedTest {
    private void assertErrorDoesNotCoverLogin(CadastroActivity activity) {
        TextView error = activity.findViewById(R.id.txtErroCadastro);
        TextView login = activity.findViewById(R.id.txtEntrar);
        int[] errorPosition = new int[2];
        int[] loginPosition = new int[2];
        error.getLocationInWindow(errorPosition);
        login.getLocationInWindow(loginPosition);
        Rect errorBounds = new Rect(errorPosition[0], errorPosition[1],
                errorPosition[0] + error.getWidth(), errorPosition[1] + error.getHeight());
        Rect loginBounds = new Rect(loginPosition[0], loginPosition[1],
                loginPosition[0] + login.getWidth(), loginPosition[1] + login.getHeight());
        assertTrue(error.getHeight() > 0);
        assertFalse("Erro nao deve sobrepor o link Entrar", Rect.intersects(errorBounds, loginBounds));
        assertTrue("Entrar deve ficar abaixo da mensagem", loginBounds.top >= errorBounds.bottom);
    }

    @Test public void validationErrorRemainsSeparateFromLoginLink() throws Exception {
        try (ActivityScenario<CadastroActivity> screen = ActivityScenario.launch(CadastroActivity.class)) {
            screen.onActivity(activity -> ((Button) activity.findViewById(R.id.btnCadastrar)).performClick());
            InstrumentationRegistry.getInstrumentation().waitForIdleSync();
            screen.onActivity(this::assertErrorDoesNotCoverLogin);
        }
    }

    @Test public void failedConnectionRestoresButtonAndDisplaysReadableError() throws Exception {
        Assume.assumeTrue("Executar apenas com encaminhamento de teste para porta sem servidor",
                "true".equals(InstrumentationRegistry.getArguments().getString("offline_test")));
        try (ActivityScenario<CadastroActivity> screen = ActivityScenario.launch(CadastroActivity.class)) {
            screen.onActivity(activity -> {
                ((EditText) activity.findViewById(R.id.EditarNome)).setText("Teste ficticio sem conexao");
                ((EditText) activity.findViewById(R.id.EditarEmail)).setText("offline@example.invalid");
                ((EditText) activity.findViewById(R.id.EditSenha)).setText("Ficticio-offline-2026!");
                ((CheckBox) activity.findViewById(R.id.checkConsentimento)).setChecked(true);
                ((Button) activity.findViewById(R.id.btnCadastrar)).performClick();
            });
            AtomicBoolean restored = new AtomicBoolean();
            long deadline = System.currentTimeMillis() + 18000;
            while (!restored.get() && System.currentTimeMillis() < deadline) {
                screen.onActivity(activity -> restored.set(
                        activity.findViewById(R.id.btnCadastrar).isEnabled()));
                Thread.sleep(100);
            }
            assertTrue("Botao deve sair de Criando conta apos falha", restored.get());
            InstrumentationRegistry.getInstrumentation().waitForIdleSync();
            screen.onActivity(activity -> {
                TextView error = activity.findViewById(R.id.txtErroCadastro);
                assertEquals(activity.getString(R.string.signup_connection), error.getText().toString());
                assertFalse(activity.isFinishing());
                assertErrorDoesNotCoverLogin(activity);
            });
        }
    }
}
