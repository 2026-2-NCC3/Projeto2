package com.example.projetopi;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class LocalStudentStoreInstrumentedTest {
    private Context context;
    private File directory;
    private LocalStudentStore store;
    static final String ORIGIN = "https://api.example.invalid";
    static final String HISTORY = ORIGIN + "/api/presencas/minhas";

    static String course(String id) {
        return "[{\"id\":\"" + id + "\",\"titulo\":\"Curso ficticio\",\"carga_horaria_horas\":12,"
                + "\"senha_hash\":\"NAO-PERSISTIR\",\"qr_token\":\"NAO-PERSISTIR\"}]";
    }

    static String receipt(String id) {
        return "{\"id\":\"" + id + "\",\"inscricao_id\":\"i1\",\"atividade_id\":\"at1\","
                + "\"checkin_em\":\"2026-11-05T12:00:00Z\",\"metodo\":\"qrcode\"}";
    }

    static String history(String id) {
        return "[" + receipt(id).replace("}", ",\"titulo\":\"Encontro ficticio\",\"curso_id\":\"c1\","
                + "\"curso_titulo\":\"Curso ficticio\",\"data\":\"2026-11-05\","
                + "\"hora_inicio\":\"10:00\",\"hora_fim\":\"11:00\"}") + "]";
    }

    @Before public void createIsolatedDatabase() {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        directory = new File(context.getCacheDir(), "sqlite-test-" + UUID.randomUUID());
        assertTrue(directory.mkdirs());
        store = open();
    }

    private LocalStudentStore open() {
        return new LocalStudentStore(context, new File(directory, "fictional.db"), new File(directory, "legacy"));
    }

    @After public void closeIsolatedDatabase() {
        store.close(); // Arquivos privados e ficticios ficam no cache de testes; nao limpa dados do app.
    }

    @Test public void restartUsesRealSqliteAndNeverInventsRecords() throws Exception {
        assertNull(store.read("a1", ORIGIN + "/api/cursos", "cursos"));
        store.save("a1", ORIGIN + "/api/cursos", "cursos", course("c1"), 100, -1);
        store.close();
        store = open();
        SnapshotStore.Snapshot snapshot = store.read("a1", ORIGIN + "/api/cursos", "cursos");
        assertEquals(100, snapshot.updatedAt);
        assertEquals("c1", snapshot.data.getJSONObject(0).getString("id"));
        assertFalse(snapshot.data.toString().contains("NAO-PERSISTIR"));
        assertEquals("wal", android.database.DatabaseUtils.stringForQuery(
                store.getReadableDatabase(), "PRAGMA journal_mode", null));
        assertEquals(1, android.database.DatabaseUtils.longForQuery(
                store.getReadableDatabase(), "PRAGMA foreign_keys", null));
    }

    @Test public void importsLegacyWithoutDeletingOriginalFiles() throws Exception {
        File legacyDirectory = new File(directory, "legacy");
        SnapshotStore legacy = new SnapshotStore(legacyDirectory);
        legacy.save("a1", ORIGIN + "/api/cursos", "cursos", course("c1"), 90);
        File original = legacyDirectory.listFiles()[0].listFiles()[0];
        long length = original.length();
        assertEquals(90, store.read("a1", ORIGIN + "/api/cursos", "cursos").updatedAt);
        assertTrue(original.exists());
        assertEquals(length, original.length());
        store.close();
        store = open();
        assertEquals(90, store.read("a1", ORIGIN + "/api/cursos", "cursos").updatedAt);
    }

    @Test public void isolatesAccountsOriginsAndLogout() throws Exception {
        store.save("a1", ORIGIN + "/api/cursos", "cursos", course("c1"), 1, -1);
        store.save("a2", ORIGIN + "/api/cursos", "cursos", course("c2"), 1, -1);
        store.recordReceipt("a1", ORIGIN, 201, receipt("p1"));
        assertNull(store.read("a1", "https://other.invalid/api/cursos", "cursos"));
        assertEquals(0, store.receipts("a2", ORIGIN).length());
        assertEquals(0, store.receipts("a1", "https://other.invalid").length());
        store.clear("a1");
        assertNull(store.read("a1", ORIGIN + "/api/cursos", "cursos"));
        assertEquals(0, store.receipts("a1", ORIGIN).length());
        assertEquals(0, store.historyRevision("a1", ORIGIN));
        assertNotNull(store.read("a2", ORIGIN + "/api/cursos", "cursos"));
    }

    @Test public void repeatedConfirmationsRemainUniqueAndUnconfirmedResultsAreNotStored() throws Exception {
        store.recordReceipt("a1", ORIGIN, 201, receipt("p1"));
        for (int repetition = 0; repetition < 5; repetition++) {
            store.recordReceipt("a1", ORIGIN, 200, receipt("p1"));
        }
        assertEquals(1, store.receipts("a1", ORIGIN).length());
        try {
            store.recordReceipt("a1", ORIGIN, 500, receipt("p2"));
            fail("Erro HTTP nao confirma presenca");
        } catch (org.json.JSONException expected) { }
        assertEquals(1, store.receipts("a1", ORIGIN).length());
    }

    @Test public void invalidJsonAndValidEmptySnapshotPreserveTheCorrectMeaning() throws Exception {
        String key = ORIGIN + "/api/cursos";
        store.save("a1", key, "cursos", course("c1"), 10, -1);
        try {
            store.save("a1", key, "cursos", "incompleto", 20, -1);
            fail("JSON invalido deve ser recusado");
        } catch (org.json.JSONException expected) { }
        assertEquals(10, store.read("a1", key, "cursos").updatedAt);
        store.save("a1", key, "cursos", "[]", 20, -1);
        assertEquals(0, store.read("a1", key, "cursos").data.length());
    }

    @Test public void transactionFailureKeepsHistoryReceiptsAndPendingRevision() throws Exception {
        store.save("a1", HISTORY, "historico", history("p1"), 10, 0);
        store.markHistoryPending("a1", ORIGIN);
        long revision = store.historyRevision("a1", ORIGIN);
        store.getWritableDatabase().execSQL("CREATE TRIGGER fictional_failure BEFORE INSERT ON confirmed_presence"
                + " BEGIN SELECT RAISE(ABORT,'fictional'); END");
        try {
            store.save("a1", HISTORY, "historico", history("p2"), 20, revision);
            fail("Falha de escrita deve reverter a transacao");
        } catch (IOException expected) { }
        assertEquals("p1", store.read("a1", HISTORY, "historico").data.getJSONObject(0).getString("id"));
        assertEquals("p1", store.receipts("a1", ORIGIN).getJSONObject(0).getString("id"));
        assertEquals(revision, store.historyRevision("a1", ORIGIN));
    }

    @Test public void olderGetCannotEraseNewReceiptOrPendingWork() throws Exception {
        store.markHistoryPending("a1", ORIGIN);
        long earlierRequest = store.historyRevision("a1", ORIGIN);
        store.recordReceipt("a1", ORIGIN, 201, receipt("p1"));
        store.save("a1", HISTORY, "historico", "[]", 10, earlierRequest);
        assertEquals(1, store.receipts("a1", ORIGIN).length());
        assertTrue(store.historyRevision("a1", ORIGIN) > earlierRequest);
        long latestRequest = store.historyRevision("a1", ORIGIN);
        store.save("a1", HISTORY, "historico", history("p1"), 20, latestRequest);
        assertEquals(0, store.historyRevision("a1", ORIGIN));
        assertEquals(1, store.receipts("a1", ORIGIN).length());
    }

    @Test public void parallelUpdatesStayCompleteAndDoNotDuplicateRows() throws Exception {
        ExecutorService workers = Executors.newFixedThreadPool(4);
        try {
            List<Future<?>> pending = new ArrayList<>();
            for (int index = 0; index < 12; index++) {
                pending.add(workers.submit(() -> {
                    try {
                        store.save("a1", ORIGIN + "/api/cursos", "cursos", course("c1"), 1, -1);
                        store.recordReceipt("a1", ORIGIN, 200, receipt("p1"));
                    } catch (Exception error) {
                        throw new RuntimeException(error);
                    }
                }));
            }
            for (Future<?> result : pending) result.get();
        } finally {
            workers.shutdownNow();
        }
        assertEquals(1, store.receipts("a1", ORIGIN).length());
        assertEquals(1, store.read("a1", ORIGIN + "/api/cursos", "cursos").data.length());
        assertEquals(1, android.database.DatabaseUtils.longForQuery(
                store.getReadableDatabase(), "SELECT COUNT(*) FROM snapshots", null));
    }
}
