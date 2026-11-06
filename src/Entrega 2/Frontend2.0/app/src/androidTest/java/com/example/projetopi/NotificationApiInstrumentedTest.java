package com.example.projetopi;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.res.Configuration;
import android.view.ContextThemeWrapper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.inspector.WindowInspector;
import android.widget.RadioButton;
import android.widget.TextView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.android.volley.Request;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NotificationApiInstrumentedTest extends NotificationTestSupport {
    @Test public void realApiAndSqliteIsolateAccountsAndKeepReadIdempotent() throws Exception {
        login("a1@example.invalid");
        JSONArray notifications = synchronize();
        assertEquals(7, notifications.length());
        JSONObject first = notifications.getJSONObject(0);
        String readRoute = "/api/notificacoes/" + first.getString("id") + "/leitura";
        Reply confirmed = request(readRoute, Request.Method.PUT, new JSONObject(), session.token());
        assertEquals(200, confirmed.status);
        assertEquals(1, new JSONObject(confirmed.body).getInt("lida"));
        assertEquals(1, new JSONObject(request(readRoute, Request.Method.PUT, new JSONObject(), session.token()).body).getInt("lida"));
        store.save("a1", KEY, NotificationContract.KIND, notifications.toString(), 100, -1);
        assertNull(store.read("a2", KEY, NotificationContract.KIND));
        login("a2@example.invalid");
        assertNull(store.read("a1", KEY, NotificationContract.KIND));
        assertEquals(404, request(readRoute, Request.Method.PUT, new JSONObject(), session.token()).status);
        JSONArray other = synchronize();
        assertEquals(3, other.length());
        for (int index = 0; index < other.length(); index++) {
            JSONObject record = other.getJSONObject(index);
            assertFalse(record.has("aluno_id"));
            assertFalse(record.has("link"));
            assertNotEquals("certificado", record.getString("tipo"));
        }
    }

    @Test public void nativeFiltersReadConfirmationAndNavigationUseAuthorizedServerState() throws Exception {
        org.junit.Assume.assumeTrue(android.os.Build.VERSION.SDK_INT >= 29);
        login("a1@example.invalid");
        JSONArray initial = synchronize();
        JSONObject target = null;
        for (int index = 0; index < initial.length(); index++) {
            JSONObject candidate = initial.getJSONObject(index);
            if (candidate.getString("tipo").equals("mensagem") && candidate.getInt("lida") == 0) { target = candidate; break; }
        }
        assertNotNull(target);
        String targetId = target.getString("id");
        Intent intent = NotificationNavigator.intent(context, target);
        assertEquals(MessagesActivity.class.getName(), intent.getComponent().getClassName());
        assertEquals(target.getJSONObject("destino").getString("id"), intent.getStringExtra("registro_id"));
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Instrumentation.ActivityMonitor navigation = instrumentation.addMonitor(MessagesActivity.class.getName(),
                new Instrumentation.ActivityResult(Activity.RESULT_OK, null), true);
        try (ActivityScenario<NotificationsHarnessActivity> scenario = ActivityScenario.launch(NotificationsHarnessActivity.class)) {
            AtomicBoolean ready = new AtomicBoolean();
            long deadline = System.currentTimeMillis() + 15000;
            while (!ready.get() && System.currentTimeMillis() < deadline) {
                scenario.onActivity(activity -> ready.set(activity.items.findViewWithTag(targetId) != null));
                Thread.sleep(100);
            }
            assertTrue(ready.get());
            scenario.onActivity(activity -> {
                ((RadioButton) activity.findViewById(R.id.notificationsUnread)).setChecked(true);
                activity.items.findViewWithTag(targetId).performClick();
            });
            boolean confirmed = false;
            deadline = System.currentTimeMillis() + 15000;
            while (!confirmed && System.currentTimeMillis() < deadline) {
                SnapshotStore.Snapshot snapshot = store.read("a1", KEY, NotificationContract.KIND);
                if (snapshot != null) {
                    for (int index = 0; index < snapshot.data.length(); index++) {
                        JSONObject record = snapshot.data.getJSONObject(index);
                        if (targetId.equals(record.getString("id"))) confirmed = record.getInt("lida") == 1;
                    }
                }
                Thread.sleep(100);
            }
            assertTrue("Leitura exige resposta da API e persistencia SQLite", confirmed);
            scenario.onActivity(activity -> {
                assertNull(activity.items.findViewWithTag(targetId));
                boolean dialogFound = false;
                for (View window : WindowInspector.getGlobalWindowViews()) {
                    if (window.findViewById(R.id.notificationFullBody) != null) {
                        dialogFound = true;
                        window.findViewById(android.R.id.button1).performClick();
                    }
                }
                assertTrue(dialogFound);
            });
            deadline = System.currentTimeMillis() + 15000;
            while (navigation.getHits() == 0 && System.currentTimeMillis() < deadline) Thread.sleep(100);
            assertEquals("GET autorizado precede o Intent; Activity real bloqueada para preservar sessao", 1, navigation.getHits());
        } finally { instrumentation.removeMonitor(navigation); }
    }

    @Test public void homeBadgeUsesRealUnreadCountAndRelatedTargetsAreInternal() throws Exception {
        login("a1@example.invalid");
        int expected = NotificationContract.unread(synchronize());
        store.save("a1", KEY, NotificationContract.KIND, new JSONArray().put(cachedFixture()).toString(), 100, -1);
        Intent home = new Intent(context, NotificationsHomeHarnessActivity.class).putExtra("nomeUsuario", "Aluno ficticio");
        try (ActivityScenario<NotificationsHomeHarnessActivity> scenario = ActivityScenario.launch(home)) {
            AtomicBoolean loaded = new AtomicBoolean();
            long deadline = System.currentTimeMillis() + 15000;
            while (!loaded.get() && System.currentTimeMillis() < deadline) {
                scenario.onActivity(activity -> loaded.set(((TextView) activity.findViewById(R.id.notificationBadge))
                        .getText().toString().equals(String.valueOf(expected))));
                Thread.sleep(100);
            }
            assertTrue(loaded.get());
            assertFalse(store.read("a1", KEY, NotificationContract.KIND).data.toString().contains("offline-only"));
            scenario.onActivity(activity -> assertTrue(activity.findViewById(R.id.notificationButton).isClickable()));
        }
        for (String screen : new String[]{"cursos", "agenda", "mensagens", "certificados"}) {
            JSONObject record = cachedFixture().put("destino", new JSONObject().put("tela", screen).put("id", "c1"));
            Intent target = NotificationNavigator.intent(context, record);
            assertNull(target.getData());
            assertEquals(context.getPackageName(), target.getComponent().getPackageName());
            if (screen.equals("agenda")) assertEquals("c1", target.getStringExtra("curso_id"));
        }
    }

    @Test public void rejectedSessionClearsSavedNotificationsBeforeReturningToLogin() throws Exception {
        session.save(PresenceSynchronizerInstrumentedTest.login("a1")); // Expiracao valida; assinatura de fixture recusada pela API.
        store.save("a1", KEY, NotificationContract.KIND, new JSONArray().put(cachedFixture()).toString(), 100, -1);
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Instrumentation.ActivityMonitor login = instrumentation.addMonitor(MainActivity.class.getName(),
                new Instrumentation.ActivityResult(Activity.RESULT_OK, null), true);
        try (ActivityScenario<NotificationsHarnessActivity> scenario = ActivityScenario.launch(NotificationsHarnessActivity.class)) {
            long deadline = System.currentTimeMillis() + 15000;
            while (session.active() && System.currentTimeMillis() < deadline) Thread.sleep(100);
            assertFalse(session.active());
            assertNull(store.read("a1", KEY, NotificationContract.KIND));
            assertTrue(login.getHits() > 0);
        } finally { instrumentation.removeMonitor(login); }
    }

    @Test public void narrowLayoutSupportsLargeFontsAndAnEmptyFilter() {
        Configuration configuration = new Configuration(context.getResources().getConfiguration());
        configuration.fontScale = 2f;
        android.content.Context themed = new ContextThemeWrapper(context.createConfigurationContext(configuration), R.style.Theme_ProjetoPI);
        AtomicReference<Throwable> failure = new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            try {
                View screen = LayoutInflater.from(themed).inflate(R.layout.activity_notifications, null);
                int width = Math.round(320 * themed.getResources().getDisplayMetrics().density);
                screen.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(640, View.MeasureSpec.EXACTLY));
                screen.layout(0, 0, width, screen.getMeasuredHeight());
                for (int id : new int[]{R.id.dataRetry, R.id.notificationsAll, R.id.notificationsUnread}) {
                    View control = screen.findViewById(id);
                    assertTrue(control.getWidth() > 0);
                    assertTrue(control.getRight() <= ((View) control.getParent()).getWidth());
                    assertTrue(control.getHeight() >= 48 * themed.getResources().getDisplayMetrics().density);
                }
                assertNotNull(screen.findViewById(R.id.messageEmpty));
            } catch (Throwable error) { failure.set(error); }
        });
        if (failure.get() != null) throw new AssertionError(failure.get());
    }
}
