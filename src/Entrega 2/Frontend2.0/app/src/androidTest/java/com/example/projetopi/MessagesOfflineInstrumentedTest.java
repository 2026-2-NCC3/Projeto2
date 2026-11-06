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
public class MessagesOfflineInstrumentedTest {
    @Test public void connectionLossKeepsCachedContentWithoutInventingReadConfirmation() throws Exception {
        Assume.assumeTrue("Somente com socket de teste indisponivel",
                "true".equals(InstrumentationRegistry.getArguments().getString("offline_test")));
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        LocalStudentStore store = CertificatesHarnessActivity.isolatedStore(context);
        SessionManager session = new SessionManager(CertificatesHarnessActivity.isolatedContext(context), store);
        String key = ApiConfig.BASE_URL + "/api/mensagens/minhas";
        try {
            session.save(PresenceSynchronizerInstrumentedTest.login("a1"));
            JSONObject cached = new JSONObject().put("id", "message-offline").put("titulo", "Aviso salvo ficticio")
                    .put("corpo", "Conteudo completo disponivel offline.").put("origem", "Proxima Etapa")
                    .put("publico_alvo", "todos").put("curso_id", JSONObject.NULL).put("curso_titulo", JSONObject.NULL)
                    .put("enviado_em", "2026-01-01T12:00:00Z").put("lido_em", JSONObject.NULL);
            store.save("a1", key, "mensagens", new JSONArray().put(cached).toString(), 100, -1);
            try (ActivityScenario<MessagesHarnessActivity> scenario = ActivityScenario.launch(MessagesHarnessActivity.class)) {
                AtomicBoolean failed = new AtomicBoolean();
                long deadline = System.currentTimeMillis() + 18000;
                while (!failed.get() && System.currentTimeMillis() < deadline) {
                    scenario.onActivity(activity -> failed.set(((TextView) activity.findViewById(R.id.dataStatus))
                            .getText().toString().contains("Sem atualizacao")));
                    Thread.sleep(100);
                }
                assertTrue("GET com falha deve encerrar carregamento", failed.get());
                scenario.onActivity(activity -> {
                    assertEquals("Aviso salvo ficticio", ((TextView) activity.findViewById(R.id.messageTitle)).getText().toString());
                    activity.items.getChildAt(0).performClick();
                });
                failed.set(false);
                deadline = System.currentTimeMillis() + 18000;
                while (!failed.get() && System.currentTimeMillis() < deadline) {
                    scenario.onActivity(activity -> failed.set(((TextView) activity.findViewById(R.id.dataStatus))
                            .getText().toString().equals(activity.getString(R.string.message_read_unconfirmed))));
                    Thread.sleep(100);
                }
                assertTrue("Falha de PUT deve informar leitura nao confirmada", failed.get());
                assertTrue(store.read("a1", key, "mensagens").data.getJSONObject(0).isNull("lido_em"));
                assertNull(store.read("a2", key, "mensagens"));
            }
        } finally { session.clear(); store.close(); }
    }
}
