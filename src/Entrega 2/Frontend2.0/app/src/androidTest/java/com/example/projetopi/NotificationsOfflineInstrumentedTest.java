package com.example.projetopi;

import android.app.Activity;
import android.app.Instrumentation;
import android.view.View;
import android.view.inspector.WindowInspector;
import android.widget.TextView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NotificationsOfflineInstrumentedTest extends NotificationTestSupport {
    @Test public void offlineCacheNeverInventsReadConfirmationOrOpensAnUnvalidatedTarget() throws Exception {
        org.junit.Assume.assumeTrue(android.os.Build.VERSION.SDK_INT >= 29);
        session.save(PresenceSynchronizerInstrumentedTest.login("a1"));
        store.save("a1", KEY, NotificationContract.KIND, new JSONArray().put(cachedFixture()).toString(), 100, -1);
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Instrumentation.ActivityMonitor navigation = instrumentation.addMonitor(MessagesActivity.class.getName(),
                new Instrumentation.ActivityResult(Activity.RESULT_OK, null), true);
        try (ActivityScenario<NotificationsHarnessActivity> scenario = ActivityScenario.launch(NotificationsHarnessActivity.class)) {
            waitStatus(scenario, "Sem atualizacao");
            scenario.onActivity(activity -> {
                assertEquals("Aviso salvo ficticio", ((TextView) activity.findViewById(R.id.messageTitle)).getText().toString());
                activity.items.getChildAt(0).performClick();
            });
            waitStatus(scenario, context.getString(R.string.notification_read_unconfirmed));
            assertEquals(0, store.read("a1", KEY, NotificationContract.KIND).data.getJSONObject(0).getInt("lida"));
            assertNull(store.read("a2", KEY, NotificationContract.KIND));
            scenario.onActivity(activity -> {
                for (View window : WindowInspector.getGlobalWindowViews()) {
                    if (window.findViewById(R.id.notificationFullBody) != null) window.findViewById(android.R.id.button1).performClick();
                }
            });
            waitStatus(scenario, context.getString(R.string.notification_open_offline));
            assertEquals(0, navigation.getHits());
        } finally { instrumentation.removeMonitor(navigation); }
    }

    private void waitStatus(ActivityScenario<NotificationsHarnessActivity> scenario, String expected) throws Exception {
        AtomicBoolean found = new AtomicBoolean();
        long deadline = System.currentTimeMillis() + 18000;
        while (!found.get() && System.currentTimeMillis() < deadline) {
            scenario.onActivity(activity -> found.set(((TextView) activity.findViewById(R.id.dataStatus))
                    .getText().toString().contains(expected)));
            Thread.sleep(100);
        }
        assertTrue("Estado esperado deve encerrar carregamento: " + expected, found.get());
    }
}
