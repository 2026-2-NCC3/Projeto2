package com.example.projetopi;

import android.content.Context;
import com.android.volley.Request;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
import org.json.JSONArray;
import org.junit.After;
import org.junit.Assume;
import org.junit.Before;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;

public abstract class NotificationTestSupport {
    protected Context context;
    protected LocalStudentStore store;
    protected SessionManager session;
    protected ApiClient api;
    protected static final String KEY = ApiConfig.BASE_URL + NotificationContract.ROUTE;

    protected static final class Reply {
        int status;
        String body;
    }

    @Before public void isolatedSetup() {
        Assume.assumeTrue("Somente API ou socket de fixtures",
                "true".equals(InstrumentationRegistry.getArguments().getString("fixture_api"))
                || "true".equals(InstrumentationRegistry.getArguments().getString("offline_test")));
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        store = CertificatesHarnessActivity.isolatedStore(context);
        session = new SessionManager(CertificatesHarnessActivity.isolatedContext(context), store);
        api = new ApiClient(context);
    }

    @After public void isolatedCleanup() {
        if (session != null) session.clear();
        if (store != null) store.close();
    }

    protected Reply request(String route, int method, JSONObject body, String token) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        Reply reply = new Reply();
        Object tag = new Object();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
                api.requestWithStatus(tag, route, method, body, token, new ApiClient.StatusCallback() {
                    @Override public void success(int status, String data) {
                        reply.status = status; reply.body = data; done.countDown();
                    }
                    @Override public void failure(int status) { reply.status = status; done.countDown(); }
                }));
        try {
            assertTrue("API deve responder", done.await(15, TimeUnit.SECONDS));
            return reply;
        } finally { api.cancel(tag); }
    }

    protected void login(String email) throws Exception {
        Reply reply = request("/auth/login", Request.Method.POST,
                new JSONObject().put("email", email).put("senha", "Ficticio-teste-123!"), "");
        assertEquals(200, reply.status);
        session.save(new JSONObject(reply.body));
    }

    protected JSONArray synchronize() throws Exception {
        Reply reply = request(NotificationContract.ROUTE, Request.Method.POST, new JSONObject(), session.token());
        assertEquals(200, reply.status);
        return ApiRecords.parse(reply.body, NotificationContract.KIND);
    }

    protected JSONObject cachedFixture() throws Exception {
        return new JSONObject().put("id", "offline-only").put("titulo", "Aviso salvo ficticio").put("corpo", "Conteudo offline ficticio")
                .put("tipo", "mensagem").put("lida", 0).put("criado_em", "2026-01-01T12:00:00Z")
                .put("destino", new JSONObject().put("tela", "mensagens").put("id", "offline-message"));
    }
}
