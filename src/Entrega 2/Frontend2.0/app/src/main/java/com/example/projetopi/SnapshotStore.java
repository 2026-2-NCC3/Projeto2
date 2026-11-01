package com.example.projetopi;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Comparator;
import java.util.UUID;

/** Snapshots completos, imutaveis e publicados por rename. Nunca recebe credenciais. */
public final class SnapshotStore {
    private static final int SNAPSHOT_FORMAT_VERSION = 1;
    private static final long MAX_SNAPSHOT_BYTES = 5_000_000;
    private static final int READ_BUFFER_BYTES = 4096;

    public static final class Snapshot {
        public final JSONArray data;
        public final long updatedAt;

        Snapshot(JSONArray records, long updatedAt) {
            this.data = records;
            this.updatedAt = updatedAt;
        }
    }

    private final File rootDirectory;

    public SnapshotStore(File rootDirectory) {
        this.rootDirectory = rootDirectory;
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexadecimal = new StringBuilder();
            for (byte digestByte : digest) {
                hexadecimal.append(String.format("%02x", digestByte & 255));
            }
            return hexadecimal.toString();
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }

    private File directory(String owner) {
        if (owner == null || owner.isEmpty()) {
            throw new IllegalArgumentException("Usuario obrigatorio");
        }
        return new File(rootDirectory, hash(owner));
    }

    public Snapshot read(String owner, String key, String recordType) {
        synchronized (SnapshotStore.class) {
            File[] snapshotFiles = directory(owner).listFiles((parent, filename) ->
                    filename.startsWith(hash(key) + "-") && filename.endsWith(".json"));
            if (snapshotFiles == null) {
                return null;
            }

            Arrays.sort(snapshotFiles, Comparator.comparing(File::getName).reversed());
            for (File snapshotFile : snapshotFiles) {
                if (snapshotFile.length() > MAX_SNAPSHOT_BYTES) {
                    continue;
                }
                try {
                    Snapshot snapshot = readSnapshotFile(snapshotFile, owner, key, recordType);
                    if (snapshot != null) {
                        return snapshot;
                    }
                } catch (Exception ignored) {
                    // Uma publicacao incompleta ou corrompida nao substitui um snapshot valido.
                }
            }
            return null;
        }
    }

    private Snapshot readSnapshotFile(File snapshotFile, String owner, String key, String recordType)
            throws IOException, JSONException {
        try (InputStream input = new FileInputStream(snapshotFile);
             ByteArrayOutputStream contents = new ByteArrayOutputStream()) {
            byte[] readBuffer = new byte[READ_BUFFER_BYTES];
            int bytesRead;
            while ((bytesRead = input.read(readBuffer)) != -1) {
                contents.write(readBuffer, 0, bytesRead);
            }

            JSONObject envelope = new JSONObject(contents.toString("UTF-8"));
            if (envelope.getInt("format") != SNAPSHOT_FORMAT_VERSION
                    || !owner.equals(envelope.getString("owner"))
                    || !key.equals(envelope.getString("key"))) {
                return null;
            }

            long updatedAt = envelope.getLong("updated_at");
            if (updatedAt <= 0) {
                return null;
            }

            JSONArray records = ApiRecords.parse(
                    envelope.getJSONArray("data").toString(), recordType);
            return new Snapshot(records, updatedAt);
        }
    }

    public Snapshot save(String owner, String key, String recordType, String response, long now)
            throws IOException, JSONException {
        synchronized (SnapshotStore.class) {
            JSONArray records = ApiRecords.parse(response, recordType);
            Snapshot previousSnapshot = read(owner, key, recordType);
            long minimumTimestamp = previousSnapshot == null ? 1 : previousSnapshot.updatedAt + 1;
            long updatedAt = Math.max(Math.max(1, now), minimumTimestamp);

            File ownerDirectory = directory(owner);
            if (!ownerDirectory.isDirectory() && !ownerDirectory.mkdirs()) {
                throw new IOException("Cache indisponivel");
            }

            String resourcePrefix = hash(key) + "-";
            File temporaryFile = File.createTempFile(resourcePrefix, ".tmp", ownerDirectory);
            File publishedFile = new File(ownerDirectory,
                    resourcePrefix + String.format("%019d", updatedAt)
                            + "-" + UUID.randomUUID() + ".json");

            try {
                JSONObject envelope = new JSONObject()
                        .put("format", SNAPSHOT_FORMAT_VERSION)
                        .put("owner", owner)
                        .put("key", key)
                        .put("updated_at", updatedAt)
                        .put("data", records);
                writeSnapshotFile(temporaryFile, envelope);

                if (!temporaryFile.renameTo(publishedFile)) {
                    throw new IOException("Nao foi possivel publicar cache");
                }
                removeOlderSnapshots(ownerDirectory, resourcePrefix, publishedFile);
                return new Snapshot(records, updatedAt);
            } finally {
                temporaryFile.delete();
            }
        }
    }

    private void writeSnapshotFile(File temporaryFile, JSONObject envelope) throws IOException {
        try (FileOutputStream output = new FileOutputStream(temporaryFile)) {
            output.write(envelope.toString().getBytes(StandardCharsets.UTF_8));
            output.getFD().sync();
        }
    }

    private void removeOlderSnapshots(File ownerDirectory, String resourcePrefix, File publishedFile) {
        File[] previousFiles = ownerDirectory.listFiles((parent, filename) ->
                filename.startsWith(resourcePrefix) && filename.endsWith(".json"));
        if (previousFiles == null) {
            return;
        }
        for (File previousFile : previousFiles) {
            if (!previousFile.equals(publishedFile)) {
                previousFile.delete();
            }
        }
    }

    public void clear(String owner) {
        synchronized (SnapshotStore.class) {
            if (owner == null || owner.isEmpty()) {
                return;
            }
            File ownerDirectory = directory(owner);
            File[] cachedFiles = ownerDirectory.listFiles();
            if (cachedFiles != null) {
                for (File cachedFile : cachedFiles) {
                    if (cachedFile.isFile()) {
                        cachedFile.delete();
                    }
                }
            }
            ownerDirectory.delete();
        }
    }
}
