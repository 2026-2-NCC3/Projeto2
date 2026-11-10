package com.example.projetopi;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.File;
import java.io.FileWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;

public class SnapshotStoreTest {
    @Rule
    public TemporaryFolder directory = new TemporaryFolder();

    private String course(String courseId) {
        return "[{\"id\":\"" + courseId + "\",\"titulo\":\"Curso\","
                + "\"carga_horaria_horas\":0,\"senha_hash\":\"NAO-SALVAR\"}]";
    }

    @Test
    public void firstOfflineAccessHasNoInventedData() {
        SnapshotStore store = new SnapshotStore(directory.getRoot());
        assertNull(store.read("a1", "courses", "cursos"));
    }

    @Test
    public void restartRestoresSnapshotAndLastUpdate() throws Exception {
        SnapshotStore store = new SnapshotStore(directory.getRoot());
        store.save("a1", "courses", "cursos", course("c1"), 100);

        SnapshotStore restartedStore = new SnapshotStore(directory.getRoot());
        SnapshotStore.Snapshot savedSnapshot = restartedStore.read("a1", "courses", "cursos");
        assertEquals(100, savedSnapshot.updatedAt);
        assertEquals("c1", savedSnapshot.data.getJSONObject(0).getString("id"));
        assertFalse(savedSnapshot.data.toString().contains("NAO-SALVAR"));
    }

    @Test
    public void accountsAndApiOriginsAreIsolated() throws Exception {
        SnapshotStore store = new SnapshotStore(directory.getRoot());
        store.save("a1", "host1/courses", "cursos", course("c1"), 1);
        assertNull(store.read("a2", "host1/courses", "cursos"));
        assertNull(store.read("a1", "host2/courses", "cursos"));

        store.save("a2", "host1/courses", "cursos", course("c2"), 2);
        store.clear("a1");
        assertNull(store.read("a1", "host1/courses", "cursos"));
        assertNotNull(store.read("a2", "host1/courses", "cursos"));
    }

    @Test
    public void failedAndPartialUpdatesPreservePreviousSnapshot() throws Exception {
        SnapshotStore store = new SnapshotStore(directory.getRoot());
        store.save("a1", "courses", "cursos", course("c1"), 10);
        assertThrows(JSONException.class, () ->
                store.save("a1", "courses", "cursos", "invalid", 20));
        assertEquals("c1", store.read("a1", "courses", "cursos")
                .data.getJSONObject(0).getString("id"));

        File ownerDirectory = directory.getRoot().listFiles()[0];
        try (FileWriter writer = new FileWriter(new File(ownerDirectory, "interrupted.tmp"))) {
            writer.write("{partial");
        }
        assertEquals(10, store.read("a1", "courses", "cursos").updatedAt);
    }

    @Test
    public void repeatedSyncReplacesAndEmptyResponseClearsOldRows() throws Exception {
        SnapshotStore store = new SnapshotStore(directory.getRoot());
        for (int repetition = 0; repetition < 5; repetition++) {
            store.save("a1", "courses", "cursos", course("c1"), 1);
        }
        assertEquals(1, store.read("a1", "courses", "cursos").data.length());
        assertEquals(1, directory.getRoot().listFiles()[0].listFiles().length);

        store.save("a1", "courses", "cursos", "[]", 10);
        assertEquals(0, store.read("a1", "courses", "cursos").data.length());
    }

    @Test
    public void concurrentPublicationsAreCompleteAndDoNotDuplicate() throws Exception {
        SnapshotStore store = new SnapshotStore(directory.getRoot());
        ExecutorService workers = Executors.newFixedThreadPool(4);
        try {
            List<Future<?>> publications = new ArrayList<>();
            for (int publication = 0; publication < 12; publication++) {
                publications.add(workers.submit(() -> {
                    try {
                        store.save("a1", "courses", "cursos", course("c1"), 1);
                    } catch (Exception error) {
                        throw new RuntimeException(error);
                    }
                }));
            }
            for (Future<?> publication : publications) {
                publication.get();
            }
        } finally {
            workers.shutdownNow();
        }
        assertEquals(1, store.read("a1", "courses", "cursos").data.length());
        assertEquals(1, directory.getRoot().listFiles()[0].listFiles().length);
    }

    @Test
    public void syncGateRejectsOverlapAndResponsesAfterAccountChange() {
        SyncGate gate = new SyncGate();
        SyncGate.Ticket firstRequest = gate.begin("session-a", "agenda");
        assertNotNull(firstRequest);
        assertNull(gate.begin("session-a", "agenda"));
        assertFalse(firstRequest.matches("session-b"));

        gate.finish(firstRequest);
        SyncGate.Ticket secondRequest = gate.begin("session-a", "agenda");
        assertNotNull(secondRequest);
        gate.finish(firstRequest);
        assertNull(gate.begin("session-a", "agenda"));
        gate.finish(secondRequest);
        assertNotNull(gate.begin("session-b", "agenda"));
    }

    @Test
    public void snapshotEnvelopeWithAnotherOwnerIsRejected() throws Exception {
        SnapshotStore store = new SnapshotStore(directory.getRoot());
        store.save("a1", "courses", "cursos", course("c1"), 100);
        rewriteEnvelopeField("owner", "a2");
        assertNull(store.read("a1", "courses", "cursos"));
    }

    @Test
    public void unsupportedSnapshotEnvelopeVersionIsRejected() throws Exception {
        SnapshotStore store = new SnapshotStore(directory.getRoot());
        store.save("a1", "courses", "cursos", course("c1"), 100);
        rewriteEnvelopeField("format", 2);
        assertNull(store.read("a1", "courses", "cursos"));
    }

    private void rewriteEnvelopeField(String field, Object value) throws Exception {
        File snapshotFile = directory.getRoot().listFiles()[0].listFiles()[0];
        String contents = new String(Files.readAllBytes(snapshotFile.toPath()), StandardCharsets.UTF_8);
        JSONObject envelope = new JSONObject(contents).put(field, value);
        try (FileWriter writer = new FileWriter(snapshotFile)) {
            writer.write(envelope.toString());
        }
    }
}
