package com.example.projetopi;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteException;
import android.database.sqlite.SQLiteOpenHelper;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * RFM03/05/06/07/15: snapshots autorizados e comprovantes do servidor em SQLite.
 * Não armazena senha, token de sessão ou token QR. O banco da API não é alterado.
 */
public final class LocalStudentStore extends SQLiteOpenHelper {
    private static final int VERSION = 1;
    private static final int MAX_BYTES = 5_000_000;
    private static LocalStudentStore instance;
    private final SnapshotStore legacy;

    public static synchronized LocalStudentStore get(Context context) {
        if (instance == null) {
            Context app = context.getApplicationContext();
            instance = new LocalStudentStore(app,
                    new File(app.getNoBackupFilesDir(), "student_cache.db"),
                    new File(app.getNoBackupFilesDir(), "snapshots"));
        }
        return instance;
    }

    LocalStudentStore(Context context, File database, File legacyDirectory) {
        super(context, database.getAbsolutePath(), null, VERSION);
        legacy = new SnapshotStore(legacyDirectory);
        setWriteAheadLoggingEnabled(true);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE snapshots (owner TEXT NOT NULL, resource TEXT NOT NULL,"
                + " kind TEXT NOT NULL, records TEXT NOT NULL, updated_at INTEGER NOT NULL CHECK(updated_at>0),"
                + " PRIMARY KEY(owner,resource))");
        db.execSQL("CREATE TABLE confirmed_presence (owner TEXT NOT NULL, origin TEXT NOT NULL,"
                + " id TEXT NOT NULL, inscricao_id TEXT NOT NULL, atividade_id TEXT NOT NULL,"
                + " checkin_em TEXT NOT NULL, metodo TEXT NOT NULL CHECK(metodo IN ('qrcode','manual')),"
                + " PRIMARY KEY(owner,origin,id), UNIQUE(owner,origin,inscricao_id,atividade_id))");
        db.execSQL("CREATE TABLE history_sync (owner TEXT NOT NULL, origin TEXT NOT NULL,"
                + " revision INTEGER NOT NULL CHECK(revision>0), PRIMARY KEY(owner,origin))");
    }

    @Override
    public void onConfigure(SQLiteDatabase db) {
        db.setForeignKeyConstraintsEnabled(true);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        throw new SQLiteException("Atualizacao local requer migracao incremental explicita");
    }

    private void requireScope(String owner, String resource) {
        if (owner == null || owner.isEmpty() || resource == null || resource.isEmpty()) {
            throw new IllegalArgumentException("Usuario e recurso obrigatorios");
        }
    }

    public synchronized SnapshotStore.Snapshot read(String owner, String resource, String kind) {
        requireScope(owner, resource);
        try (Cursor row = getReadableDatabase().query("snapshots",
                new String[]{"kind", "records", "updated_at"}, "owner=? AND resource=?",
                new String[]{owner, resource}, null, null, null)) {
            if (row.moveToFirst()) {
                if (!kind.equals(row.getString(0))) return null;
                return new SnapshotStore.Snapshot(ApiRecords.parse(row.getString(1), kind), row.getLong(2));
            }
        } catch (SQLiteException | JSONException error) {
            return null; // Nunca recria nem apaga um banco local invalido.
        }

        SnapshotStore.Snapshot previous = legacy.read(owner, resource, kind);
        if (previous != null) {
            try {
                return save(owner, resource, kind, previous.data.toString(), previous.updatedAt, -1);
            } catch (IOException | JSONException error) {
                return previous; // O arquivo legado permanece intacto se a importacao falhar.
            }
        }
        return null;
    }

    public synchronized SnapshotStore.Snapshot save(String owner, String resource, String kind,
            String response, long now, long requestedRevision) throws IOException, JSONException {
        requireScope(owner, resource);
        JSONArray records = ApiRecords.parse(response, kind);
        String filtered = records.toString();
        if (filtered.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            throw new IOException("Resposta excede o limite local");
        }
        SQLiteDatabase db;
        try {
            db = getWritableDatabase();
            db.beginTransaction();
            try {
                long updatedAt = Math.max(1, now);
                try (Cursor current = db.rawQuery(
                        "SELECT updated_at FROM snapshots WHERE owner=? AND resource=?",
                        new String[]{owner, resource})) {
                    if (current.moveToFirst()) updatedAt = Math.max(updatedAt, current.getLong(0) + 1);
                }
                ContentValues values = new ContentValues();
                values.put("owner", owner);
                values.put("resource", resource);
                values.put("kind", kind);
                values.put("records", filtered);
                values.put("updated_at", updatedAt);
                if (db.update("snapshots", values, "owner=? AND resource=?",
                        new String[]{owner, resource}) == 0) {
                    db.insertOrThrow("snapshots", null, values);
                }

                if ("historico".equals(kind)) {
                    String suffix = "/api/presencas/minhas";
                    if (!resource.endsWith(suffix)) throw new JSONException("Recurso de historico invalido");
                    String origin = resource.substring(0, resource.length() - suffix.length());
                    long currentRevision = revision(db, owner, origin);
                    // Um GET anterior a outro check-in nao pode remover seu comprovante ou sua pendencia.
                    if (requestedRevision >= 0 && currentRevision <= requestedRevision) {
                        db.delete("confirmed_presence", "owner=? AND origin=?", new String[]{owner, origin});
                    }
                    for (int index = 0; index < records.length(); index++) {
                        putReceipt(db, owner, origin, records.getJSONObject(index));
                    }
                    if (requestedRevision >= 0) {
                        db.delete("history_sync", "owner=? AND origin=? AND revision<=?",
                                new String[]{owner, origin, Long.toString(requestedRevision)});
                    }
                }
                db.setTransactionSuccessful();
                return new SnapshotStore.Snapshot(records, updatedAt);
            } finally {
                db.endTransaction();
            }
        } catch (SQLiteException error) {
            throw new IOException("Nao foi possivel persistir os dados locais");
        }
    }

    private void putReceipt(SQLiteDatabase db, String owner, String origin, JSONObject receipt)
            throws JSONException {
        if (CheckinContract.result(200, receipt.toString()) == CheckinContract.Result.UNCONFIRMED) {
            throw new JSONException("Comprovante de presenca invalido");
        }
        ContentValues values = new ContentValues();
        values.put("owner", owner);
        values.put("origin", origin);
        for (String field : new String[]{"id", "inscricao_id", "atividade_id", "checkin_em", "metodo"}) {
            values.put(field, receipt.getString(field));
        }
        if (db.update("confirmed_presence", values, "owner=? AND origin=? AND id=?",
                new String[]{owner, origin, receipt.getString("id")}) == 0) {
            db.insertOrThrow("confirmed_presence", null, values);
        }
    }

    public synchronized void recordReceipt(String owner, String origin, int status, String body)
            throws IOException, JSONException {
        requireScope(owner, origin);
        if (CheckinContract.result(status, body) == CheckinContract.Result.UNCONFIRMED) {
            throw new JSONException("A API nao confirmou a presenca");
        }
        try {
            SQLiteDatabase db = getWritableDatabase();
            db.beginTransaction();
            try {
                putReceipt(db, owner, origin, new JSONObject(body));
                incrementRevision(db, owner, origin);
                db.setTransactionSuccessful();
            } finally {
                db.endTransaction();
            }
        } catch (SQLiteException error) {
            throw new IOException("Nao foi possivel salvar o comprovante");
        }
    }

    public synchronized JSONArray receipts(String owner, String origin) {
        requireScope(owner, origin);
        JSONArray records = new JSONArray();
        try (Cursor rows = getReadableDatabase().query("confirmed_presence",
                new String[]{"id", "inscricao_id", "atividade_id", "checkin_em", "metodo"},
                "owner=? AND origin=?", new String[]{owner, origin}, null, null, "checkin_em DESC,id")) {
            while (rows.moveToNext()) {
                JSONObject receipt = new JSONObject();
                for (int column = 0; column < rows.getColumnCount(); column++) {
                    receipt.put(rows.getColumnName(column), rows.getString(column));
                }
                records.put(receipt);
            }
        } catch (SQLiteException | JSONException error) {
            return new JSONArray();
        }
        return records;
    }

    private long revision(SQLiteDatabase db, String owner, String origin) {
        try (Cursor row = db.rawQuery("SELECT revision FROM history_sync WHERE owner=? AND origin=?",
                new String[]{owner, origin})) {
            return row.moveToFirst() ? row.getLong(0) : 0;
        }
    }

    private void incrementRevision(SQLiteDatabase db, String owner, String origin) {
        ContentValues values = new ContentValues();
        values.put("revision", revision(db, owner, origin) + 1);
        if (db.update("history_sync", values, "owner=? AND origin=?", new String[]{owner, origin}) == 0) {
            values.put("owner", owner);
            values.put("origin", origin);
            db.insertOrThrow("history_sync", null, values);
        }
    }

    public synchronized void markHistoryPending(String owner, String origin) {
        requireScope(owner, origin);
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            incrementRevision(db, owner, origin);
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    public synchronized long historyRevision(String owner, String origin) {
        requireScope(owner, origin);
        return revision(getReadableDatabase(), owner, origin);
    }

    public synchronized void clear(String owner) {
        if (owner == null || owner.isEmpty()) return;
        try {
            SQLiteDatabase db = getWritableDatabase();
            db.beginTransaction();
            try {
                for (String table : new String[]{"snapshots", "confirmed_presence", "history_sync"}) {
                    db.delete(table, "owner=?", new String[]{owner});
                }
                db.setTransactionSuccessful();
            } finally {
                db.endTransaction();
            }
        } finally {
            legacy.clear(owner);
        }
    }
}
