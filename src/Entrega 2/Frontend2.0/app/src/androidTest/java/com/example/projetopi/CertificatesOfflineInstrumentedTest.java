package com.example.projetopi;

import android.content.Context;
import android.widget.TextView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Assume;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class CertificatesOfflineInstrumentedTest {
    @Test public void lostConnectionKeepsAuthorizedCachedMetadataAndFileUnavailable() throws Exception {
        Assume.assumeTrue("Somente com ponte ADB apontando para socket de teste indisponivel",
                "true".equals(InstrumentationRegistry.getArguments().getString("offline_test")));
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        LocalStudentStore store = CertificatesHarnessActivity.isolatedStore(context);
        SessionManager session = new SessionManager(CertificatesHarnessActivity.isolatedContext(context), store);
        try {
            session.save(PresenceSynchronizerInstrumentedTest.login("a1"));
            JSONObject certificate = new JSONObject().put("id", "ce-offline").put("inscricao_id", "i1")
                    .put("curso_id", "c1").put("titulo", "Curso ficticio salvo").put("carga_horaria_horas", 24)
                    .put("status", "emitido").put("emitido_em", "2026-11-05T12:00:00Z")
                    .put("criterios", new JSONArray()).put("arquivo_disponivel", false)
                    .put("arquivo_indisponivel_motivo", "armazenamento_nao_validado");
            store.save("a1", ApiConfig.BASE_URL + "/api/certificados/minhas", "certificados",
                    new JSONArray().put(certificate).toString(), 100, -1);
            try (ActivityScenario<CertificatesHarnessActivity> scenario = ActivityScenario.launch(CertificatesHarnessActivity.class)) {
                AtomicBoolean failed = new AtomicBoolean();
                long deadline = System.currentTimeMillis() + 18000;
                while (!failed.get() && System.currentTimeMillis() < deadline) {
                    scenario.onActivity(activity -> failed.set(
                            ((TextView) activity.findViewById(R.id.dataStatus)).getText().toString().contains("Sem atualizacao")));
                    Thread.sleep(100);
                }
                assertTrue("Falha deve encerrar carregamento e manter dados salvos", failed.get());
                scenario.onActivity(activity -> {
                    assertEquals("Curso ficticio salvo", ((TextView) activity.findViewById(R.id.certificateName)).getText().toString());
                    assertFalse(activity.findViewById(R.id.certificateFile).isEnabled());
                    assertTrue(activity.findViewById(R.id.dataRetry).isEnabled());
                });
            }
        } finally {
            session.clear();
            store.close();
        }
    }
}
