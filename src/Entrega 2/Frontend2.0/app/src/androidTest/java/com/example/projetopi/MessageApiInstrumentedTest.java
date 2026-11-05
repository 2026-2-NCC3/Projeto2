package com.example.projetopi;

import android.content.Context;
import android.content.res.Configuration;
import android.view.ContextThemeWrapper;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.TextView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.android.volley.Request;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Assume;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class MessageApiInstrumentedTest {
    private Context context;
    private LocalStudentStore store;
    private SessionManager session;
    private ApiClient api;
    private static final String ROUTE = "/api/mensagens/minhas";

    private static final class Reply {
        int status;
        String body;
    }

    @Before public void setup() {
        Assume.assumeTrue("Somente contra API de fixtures temporarias",
                "true".equals(InstrumentationRegistry.getArguments().getString("fixture_api")));
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        store = CertificatesHarnessActivity.isolatedStore(context);
        session = new SessionManager(CertificatesHarnessActivity.isolatedContext(context), store);
        api = new ApiClient(context);
    }

    @After public void cleanup() {
        if (session != null) session.clear();
        if (store != null) store.close();
    }

    private Reply request(String route, int method, JSONObject body, String token) throws Exception {
        CountDownLatch finished = new CountDownLatch(1);
        Reply reply = new Reply();
        Object tag = new Object();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
                api.requestWithStatus(tag, route, method, body, token, new ApiClient.StatusCallback() {
                    @Override public void success(int status, String data) {
                        reply.status = status;
                        reply.body = data;
                        finished.countDown();
                    }
                    @Override public void failure(int status) {
                        reply.status = status;
                        finished.countDown();
                    }
                }));
        try {
            assertTrue("API deve responder", finished.await(15, TimeUnit.SECONDS));
            return reply;
        } finally { api.cancel(tag); }
    }

    private JSONObject login(String email) throws Exception {
        Reply reply = request("/auth/login", Request.Method.POST,
                new JSONObject().put("email", email).put("senha", "Ficticio-teste-123!"), "");
        assertEquals(200, reply.status);
        return new JSONObject(reply.body);
    }

    @Test public void realApiPersistsOnlyOwnMessagesAndReadIsIdempotent() throws Exception {
        session.save(login("a1@example.invalid"));
        Reply reply = request(ROUTE + "?aluno_id=a2", Request.Method.GET, null, session.token());
        assertEquals(200, reply.status);
        JSONArray messages = ApiRecords.parse(reply.body, "mensagens");
        assertEquals(3, messages.length());
        assertFalse(reply.body.contains("aluno_ids"));
        assertFalse(reply.body.contains("autor_id"));
        String individual = null;
        for (int index = 0; index < messages.length(); index++) {
            JSONObject message = messages.getJSONObject(index);
            if ("individual".equals(message.getString("publico_alvo"))) individual = message.getString("id");
        }
        assertNotNull(individual);
        String readRoute = "/api/mensagens/" + individual + "/leitura";
        Reply read = request(readRoute, Request.Method.PUT, new JSONObject(), session.token());
        assertEquals(200, read.status);
        assertFalse(new JSONObject(read.body).isNull("lido_em"));
        Reply repeated = request(readRoute, Request.Method.PUT, new JSONObject(), session.token());
        assertEquals(new JSONObject(read.body).getString("lido_em"), new JSONObject(repeated.body).getString("lido_em"));
        String key = ApiConfig.BASE_URL + ROUTE;
        store.save("a1", key, "mensagens", reply.body, 100, -1);
        assertEquals(3, store.read("a1", key, "mensagens").data.length());
        assertNull(store.read("a2", key, "mensagens"));
        assertEquals(403, request("/api/mensagens", Request.Method.GET, null, session.token()).status);
        session.save(login("a2@example.invalid"));
        assertNull(store.read("a1", key, "mensagens"));
        assertEquals(404, request(readRoute, Request.Method.PUT, new JSONObject(), session.token()).status);
        assertEquals(1, new JSONArray(request(ROUTE, Request.Method.GET, null, session.token()).body).length());
    }

    @Test public void nativeListOpensFullContentConfirmsReadAndReturns() throws Exception {
        Assume.assumeTrue("Inspecao publica de janelas disponivel desde API 29", android.os.Build.VERSION.SDK_INT >= 29);
        session.save(login("a1@example.invalid"));
        try (ActivityScenario<MessagesHarnessActivity> scenario = ActivityScenario.launch(MessagesHarnessActivity.class)) {
            long deadline = System.currentTimeMillis() + 15000;
            AtomicReference<View> card = new AtomicReference<>();
            while (card.get() == null && System.currentTimeMillis() < deadline) {
                scenario.onActivity(activity -> card.set(activity.findViewById(R.id.messageTitle)));
                Thread.sleep(100);
            }
            assertNotNull("Lista deve carregar da API real", card.get());
            AtomicReference<String> openedTitle = new AtomicReference<>();
            scenario.onActivity(activity -> {
                assertEquals(View.GONE, activity.findViewById(R.id.messageEmpty).getVisibility());
                for (int index = 0; index < activity.items.getChildCount(); index++) {
                    View candidate = activity.items.getChildAt(index);
                    TextView state = candidate.findViewById(R.id.messageReadState);
                    if (state.getText().toString().equals(activity.getString(R.string.message_unread))) {
                        openedTitle.set(((TextView) candidate.findViewById(R.id.messageTitle)).getText().toString());
                        candidate.performClick();
                        break;
                    }
                }
                assertNotNull("Deve haver um comunicado ainda nao lido", openedTitle.get());
            });
            scenario.onActivity(activity -> {
                boolean found = false;
                for (View window : android.view.inspector.WindowInspector.getGlobalWindowViews()) {
                    TextView content = window.findViewById(R.id.messageFullBody);
                    if (content != null) {
                        assertTrue(content.getText().toString().contains("Conteudo completo de teste."));
                        found = true;
                    }
                }
                assertTrue("Dialogo nativo deve exibir o conteudo integral", found);
            });
            long readDeadline = System.currentTimeMillis() + 15000;
            boolean confirmed = false;
            while (!confirmed && System.currentTimeMillis() < readDeadline) {
                SnapshotStore.Snapshot snapshot = store.read("a1", ApiConfig.BASE_URL + ROUTE, "mensagens");
                if (snapshot != null && snapshot.data.length() > 0) {
                    for (int index = 0; index < snapshot.data.length(); index++) {
                        JSONObject message = snapshot.data.getJSONObject(index);
                        if (openedTitle.get().equals(message.getString("titulo"))) confirmed = !message.isNull("lido_em");
                    }
                }
                Thread.sleep(100);
            }
            assertTrue("Leitura deve ser confirmada e persistida", confirmed);
            scenario.onActivity(activity -> {
                for (View window : android.view.inspector.WindowInspector.getGlobalWindowViews()) {
                    if (window.findViewById(R.id.messageFullBody) != null) {
                        window.findViewById(android.R.id.button1).performClick();
                    }
                }
            });
            scenario.onActivity(activity -> activity.findViewById(R.id.messageBack).performClick());
            long finishDeadline = System.currentTimeMillis() + 5000;
            while (scenario.getState() != androidx.lifecycle.Lifecycle.State.DESTROYED
                    && System.currentTimeMillis() < finishDeadline) Thread.sleep(100);
            assertEquals(androidx.lifecycle.Lifecycle.State.DESTROYED, scenario.getState());
        }
    }

    @Test public void onlineRefreshReplacesStaleSnapshotAfterConnectionReturns() throws Exception {
        session.save(login("a1@example.invalid"));
        String key = ApiConfig.BASE_URL + ROUTE;
        JSONObject previous = new JSONObject().put("id", "stale-fixture").put("titulo", "Aviso antigo salvo")
                .put("corpo", "Snapshot ficticio anterior a recuperacao.").put("origem", "Proxima Etapa")
                .put("publico_alvo", "todos").put("curso_id", JSONObject.NULL).put("curso_titulo", JSONObject.NULL)
                .put("enviado_em", "2026-01-01T12:00:00Z").put("lido_em", JSONObject.NULL);
        store.save("a1", key, "mensagens", new JSONArray().put(previous).toString(), 100, -1);
        try (ActivityScenario<MessagesHarnessActivity> scenario = ActivityScenario.launch(MessagesHarnessActivity.class)) {
            long deadline = System.currentTimeMillis() + 15000;
            boolean reconciled = false;
            while (!reconciled && System.currentTimeMillis() < deadline) {
                SnapshotStore.Snapshot current = store.read("a1", key, "mensagens");
                reconciled = current != null && current.data.length() == 3 && !current.data.toString().contains("stale-fixture");
                Thread.sleep(100);
            }
            assertTrue("GET autorizado deve substituir o snapshot antigo", reconciled);
            scenario.onActivity(activity -> {
                assertEquals(3, activity.items.getChildCount());
                assertTrue(activity.findViewById(R.id.dataRetry).isEnabled());
                assertEquals(View.GONE, activity.findViewById(R.id.dataProgress).getVisibility());
            });
        }
    }

    @Test public void emptyAndNarrowLayoutRemainAccessibleWithLargeFont() {
        Configuration configuration = new Configuration(context.getResources().getConfiguration());
        configuration.fontScale = 2f;
        Context themed = new ContextThemeWrapper(context.createConfigurationContext(configuration), R.style.Theme_ProjetoPI);
        AtomicReference<Throwable> failure = new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            try {
                View screen = LayoutInflater.from(themed).inflate(R.layout.activity_messages, null);
                int width = Math.round(320 * themed.getResources().getDisplayMetrics().density);
                int height = Math.round(640 * themed.getResources().getDisplayMetrics().density);
                screen.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
                screen.layout(0, 0, width, height);
                View refresh = screen.findViewById(R.id.dataRetry);
                assertTrue(refresh.getWidth() > 0);
                assertTrue(refresh.getRight() <= ((View) refresh.getParent()).getWidth());
                assertTrue(refresh.getHeight() >= 48 * themed.getResources().getDisplayMetrics().density);
                View card = LayoutInflater.from(themed).inflate(R.layout.item_message, null);
                ((TextView) card.findViewById(R.id.messageTitle)).setText("Assunto extenso de comunicado de teste");
                card.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
                assertTrue(card.getMeasuredHeight() > 0);
                assertNotNull(screen.findViewById(R.id.messageEmpty));
            } catch (Throwable error) { failure.set(error); }
        });
        if (failure.get() != null) throw new AssertionError(failure.get());
    }
}
