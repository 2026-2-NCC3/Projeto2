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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class CertificateApiInstrumentedTest {
    private Context context;
    private LocalStudentStore store;
    private SessionManager session;
    private ApiClient api;

    private static final class Reply {
        int status;
        String body;
    }

    @Before public void setup() {
        Assume.assumeTrue("Somente contra fixtures de API temporaria",
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
                        reply.status = status; reply.body = data; finished.countDown();
                    }
                    @Override public void failure(int status) { reply.status = status; finished.countDown(); }
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

    @Test public void authenticatedMetadataUsesRealApiSqliteAndIsolatesAccounts() throws Exception {
        session.save(login("a1@example.invalid"));
        Reply mine = request("/api/certificados/minhas?aluno_id=a2", Request.Method.GET, null, session.token());
        assertEquals(200, mine.status);
        JSONArray certificates = ApiRecords.parse(mine.body, "certificados");
        assertEquals(1, certificates.length());
        assertEquals("ce1", certificates.getJSONObject(0).getString("id"));
        assertFalse(mine.body.contains("arquivo_url"));
        assertFalse(mine.body.contains("NAO-EXPOR"));
        String key = ApiConfig.BASE_URL + "/api/certificados/minhas";
        store.save(session.userId(), key, "certificados", mine.body, 100, -1);
        assertEquals(1, store.read("a1", key, "certificados").data.length());
        assertNull(store.read("a2", key, "certificados"));
        assertEquals(403, request("/api/certificados", Request.Method.GET, null, session.token()).status);
        session.save(login("a2@example.invalid"));
        assertNull(store.read("a1", key, "certificados"));
        Reply other = request("/api/certificados/minhas", Request.Method.GET, null, session.token());
        assertEquals("ce2", new JSONArray(other.body).getJSONObject(0).getString("id"));
    }

    @Test public void nativeScreenLoadsMetadataDisablesFilesAndNavigatesBack() throws Exception {
        session.save(login("a1@example.invalid"));
        try (ActivityScenario<CertificatesHarnessActivity> scenario = ActivityScenario.launch(CertificatesHarnessActivity.class)) {
            CountDownLatch rendered = new CountDownLatch(1);
            long deadline = System.currentTimeMillis() + 15000;
            while (rendered.getCount() > 0 && System.currentTimeMillis() < deadline) {
                scenario.onActivity(activity -> {
                    if (activity.findViewById(R.id.certificateName) != null) rendered.countDown();
                });
                Thread.sleep(100);
            }
            assertEquals(0, rendered.getCount());
            scenario.onActivity(activity -> {
                assertEquals("Curso ficticio certificado", ((TextView) activity.findViewById(R.id.certificateName)).getText().toString());
                assertFalse(activity.findViewById(R.id.certificateFile).isEnabled());
                assertTrue(((TextView) activity.findViewById(R.id.certificateTotal)).getText().toString().contains("1"));
                assertEquals(View.GONE, activity.findViewById(R.id.certificateEmpty).getVisibility());
                activity.findViewById(R.id.certificateBack).performClick();
                assertTrue(activity.isFinishing());
            });
            long finishDeadline = System.currentTimeMillis() + 5000;
            while (scenario.getState() != androidx.lifecycle.Lifecycle.State.DESTROYED
                    && System.currentTimeMillis() < finishDeadline) {
                Thread.sleep(100);
            }
            assertEquals(androidx.lifecycle.Lifecycle.State.DESTROYED, scenario.getState());
        }
    }

    @Test public void layoutSupportsNarrowWidthAndTwoHundredPercentFontWithoutHorizontalOverflow() {
        Configuration configuration = new Configuration(context.getResources().getConfiguration());
        configuration.fontScale = 2f;
        Context themed = new ContextThemeWrapper(context.createConfigurationContext(configuration), R.style.Theme_ProjetoPI);
        AtomicReference<Throwable> failure = new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            try {
                View view = LayoutInflater.from(themed).inflate(R.layout.activity_certificates, null);
                ((TextView) view.findViewById(R.id.certificateTotal)).setText("1 certificado emitido");
                int width = Math.round(320 * themed.getResources().getDisplayMetrics().density);
                int height = Math.round(640 * themed.getResources().getDisplayMetrics().density);
                view.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
                view.layout(0, 0, width, height);
                View title = view.findViewById(R.id.dataTitle);
                View retry = view.findViewById(R.id.dataRetry);
                assertTrue(title.getWidth() > 0);
                assertTrue(title.getRight() <= ((View) title.getParent()).getWidth());
                assertTrue(retry.getWidth() > 0);
                assertTrue(retry.getRight() <= ((View) retry.getParent()).getWidth());
                assertTrue(retry.getHeight() >= 48 * themed.getResources().getDisplayMetrics().density);
            } catch (Throwable error) { failure.set(error); }
        });
        if (failure.get() != null) throw new AssertionError(failure.get());
    }
}
