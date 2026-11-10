package com.example.projetopi;

import android.content.Context;
import android.content.ContextWrapper;
import android.content.SharedPreferences;
import android.util.Base64;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class PresenceSynchronizerInstrumentedTest {
    private LocalStudentStore store;
    private SessionManager session;
    private PresenceSynchronizer sync;
    private FakeTransport transport;
    private Context context;
    private String prefix;

    static Context isolatedContext(Context base, File directory, String prefix) {
        return new ContextWrapper(base) {
            @Override public SharedPreferences getSharedPreferences(String name, int mode) {
                return super.getSharedPreferences(prefix + name, mode);
            }
            @Override public File getNoBackupFilesDir() { return directory; }
        };
    }

    static JSONObject login(String user) throws Exception {
        String payload = new JSONObject().put("exp", System.currentTimeMillis() / 1000 + 3600).toString();
        String token = "test." + Base64.encodeToString(payload.getBytes(StandardCharsets.UTF_8),
                Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING) + ".fictitious";
        return new JSONObject().put("token", token).put("usuario",
                new JSONObject().put("id", user).put("nome_completo", "Teste ficticio").put("papel", "aluno"));
    }

    static final class FakeTransport implements PresenceSynchronizer.Transport {
        ApiClient.Callback callback;
        int requests;
        boolean cancelled;
        @Override public void history(String token, ApiClient.Callback callback) {
            requests++;
            this.callback = callback;
        }
        @Override public void cancel() { cancelled = true; }
    }

    @Before public void setup() throws Exception {
        Context base = InstrumentationRegistry.getInstrumentation().getTargetContext();
        prefix = "sync-test-" + UUID.randomUUID();
        File directory = new File(base.getCacheDir(), prefix);
        assertTrue(directory.mkdirs());
        context = isolatedContext(base, directory, prefix);
        store = new LocalStudentStore(context, new File(directory, "fictional.db"), new File(directory, "legacy"));
        session = new SessionManager(context, store);
        session.save(login("a1"));
        transport = new FakeTransport();
        sync = new PresenceSynchronizer(session, store, transport, LocalStudentStoreInstrumentedTest.ORIGIN);
    }

    @After public void finish() {
        sync.cancel();
        session.clear();
        context.deleteSharedPreferences(prefix + "sessao_usuario");
        store.close();
    }

    @Test public void lostConnectionSurvivesRestartAndReconcilesOnlyServerHistory() throws Exception {
        String origin = LocalStudentStoreInstrumentedTest.ORIGIN;
        store.markHistoryPending("a1", origin);
        sync.start(null);
        transport.callback.failure(0);
        assertTrue(store.historyRevision("a1", origin) > 0);
        assertEquals(0, store.receipts("a1", origin).length());
        sync.cancel();
        sync = new PresenceSynchronizer(new SessionManager(context, store), store, transport, origin);
        sync.start(null);
        transport.callback.success(LocalStudentStoreInstrumentedTest.history("p1"));
        assertEquals(0, store.historyRevision("a1", origin));
        assertEquals(1, store.receipts("a1", origin).length());
    }

    @Test public void invalidAndServerErrorResponsesKeepPreviousDataAndRetryState() throws Exception {
        String origin = LocalStudentStoreInstrumentedTest.ORIGIN;
        String history = LocalStudentStoreInstrumentedTest.HISTORY;
        store.save("a1", history, "historico", LocalStudentStoreInstrumentedTest.history("p1"), 1, 0);
        store.markHistoryPending("a1", origin);
        sync.start(null);
        transport.callback.success("incompleto");
        assertTrue(store.historyRevision("a1", origin) > 0);
        assertEquals(1, store.read("a1", history, "historico").data.length());
        sync.start(null);
        transport.callback.failure(503);
        assertTrue(store.historyRevision("a1", origin) > 0);
    }

    @Test public void overlappingQueriesAndCancellationNeverApplyLateResponses() throws Exception {
        String origin = LocalStudentStoreInstrumentedTest.ORIGIN;
        store.markHistoryPending("a1", origin);
        sync.start(null);
        sync.start(null);
        assertEquals(1, transport.requests);
        ApiClient.Callback old = transport.callback;
        sync.cancel();
        assertTrue(transport.cancelled);
        old.success(LocalStudentStoreInstrumentedTest.history("p1"));
        assertEquals(0, store.receipts("a1", origin).length());
        sync.start(null);
        transport.callback.success("[]");
        assertEquals(0, store.historyRevision("a1", origin));
    }

    @Test public void responseFromPreviousAccountCannotPopulateNewAccount() throws Exception {
        String origin = LocalStudentStoreInstrumentedTest.ORIGIN;
        store.markHistoryPending("a1", origin);
        sync.start(null);
        ApiClient.Callback old = transport.callback;
        session.save(login("a2"));
        old.success(LocalStudentStoreInstrumentedTest.history("p1"));
        assertNull(store.read("a1", LocalStudentStoreInstrumentedTest.HISTORY, "historico"));
        assertNull(store.read("a2", LocalStudentStoreInstrumentedTest.HISTORY, "historico"));
        assertEquals(0, store.receipts("a2", origin).length());
    }

    @Test public void unauthorizedSessionIsClearedWithoutErasingAnotherUser() throws Exception {
        String origin = LocalStudentStoreInstrumentedTest.ORIGIN;
        store.save("a2", origin + "/api/cursos", "cursos", LocalStudentStoreInstrumentedTest.course("c2"), 1, -1);
        store.markHistoryPending("a1", origin);
        sync.start(null);
        transport.callback.failure(401);
        assertFalse(session.active());
        assertEquals(0, store.historyRevision("a1", origin));
        assertNotNull(store.read("a2", origin + "/api/cursos", "cursos"));
    }
}
