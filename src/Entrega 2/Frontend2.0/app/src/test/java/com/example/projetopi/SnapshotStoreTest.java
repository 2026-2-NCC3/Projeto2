package com.example.projetopi;
import org.junit.*;
import org.junit.rules.TemporaryFolder;
import java.io.File;
import java.io.FileWriter;
import java.util.concurrent.*;
import static org.junit.Assert.*;
public class SnapshotStoreTest {
    @Rule public TemporaryFolder directory=new TemporaryFolder();
    private String course(String id) {return "[{\"id\":\""+id+"\",\"titulo\":\"Curso\",\"carga_horaria_horas\":0,\"senha_hash\":\"NAO-SALVAR\"}]";}
    @Test public void firstOfflineAccessHasNoInventedData() {assertNull(new SnapshotStore(directory.getRoot()).read("a1","courses","cursos"));}
    @Test public void restartRestoresSnapshotAndLastUpdate() throws Exception {
        SnapshotStore store=new SnapshotStore(directory.getRoot());store.save("a1","courses","cursos",course("c1"),100);
        SnapshotStore.Snapshot saved=new SnapshotStore(directory.getRoot()).read("a1","courses","cursos");
        assertEquals(100,saved.updatedAt);assertEquals("c1",saved.data.getJSONObject(0).getString("id"));assertFalse(saved.data.toString().contains("NAO-SALVAR"));
    }
    @Test public void accountsAndApiOriginsAreIsolated() throws Exception {
        SnapshotStore store=new SnapshotStore(directory.getRoot());store.save("a1","host1/courses","cursos",course("c1"),1);
        assertNull(store.read("a2","host1/courses","cursos"));assertNull(store.read("a1","host2/courses","cursos"));
        store.save("a2","host1/courses","cursos",course("c2"),2);
        store.clear("a1");assertNull(store.read("a1","host1/courses","cursos"));assertNotNull(store.read("a2","host1/courses","cursos"));
    }
    @Test public void failedAndPartialUpdatesPreservePreviousSnapshot() throws Exception {
        SnapshotStore store=new SnapshotStore(directory.getRoot());store.save("a1","courses","cursos",course("c1"),10);
        try {store.save("a1","courses","cursos","invalid",20);fail();}catch(org.json.JSONException expected){}
        assertEquals("c1",store.read("a1","courses","cursos").data.getJSONObject(0).getString("id"));
        File owner=directory.getRoot().listFiles()[0];try(FileWriter writer=new FileWriter(new File(owner,"interrupted.tmp"))){writer.write("{partial");}
        assertEquals(10,store.read("a1","courses","cursos").updatedAt);
    }
    @Test public void repeatedSyncReplacesAndEmptyResponseClearsOldRows() throws Exception {
        SnapshotStore store=new SnapshotStore(directory.getRoot());for(int i=0;i<5;i++) store.save("a1","courses","cursos",course("c1"),1);
        assertEquals(1,store.read("a1","courses","cursos").data.length());
        assertEquals(1,directory.getRoot().listFiles()[0].listFiles().length);
        store.save("a1","courses","cursos","[]",10);assertEquals(0,store.read("a1","courses","cursos").data.length());
    }
    @Test public void concurrentPublicationsAreCompleteAndDoNotDuplicate() throws Exception {
        SnapshotStore store=new SnapshotStore(directory.getRoot());ExecutorService pool=Executors.newFixedThreadPool(4);
        try {java.util.List<Future<?>> futures=new java.util.ArrayList<>();for(int i=0;i<12;i++) futures.add(pool.submit(()->{try {store.save("a1","courses","cursos",course("c1"),1);}catch(Exception e){throw new RuntimeException(e);}}));for(Future<?> future:futures) future.get();}
        finally {pool.shutdownNow();}
        assertEquals(1,store.read("a1","courses","cursos").data.length());assertEquals(1,directory.getRoot().listFiles()[0].listFiles().length);
    }
    @Test public void syncGateRejectsOverlapAndResponsesAfterAccountChange() {
        SyncGate gate=new SyncGate();SyncGate.Ticket first=gate.begin("session-a","agenda");assertNotNull(first);
        assertNull(gate.begin("session-a","agenda"));assertFalse(first.matches("session-b"));
        gate.finish(first);SyncGate.Ticket second=gate.begin("session-a","agenda");assertNotNull(second);
        gate.finish(first);assertNull(gate.begin("session-a","agenda"));gate.finish(second);
        assertNotNull(gate.begin("session-b","agenda"));
    }
}
