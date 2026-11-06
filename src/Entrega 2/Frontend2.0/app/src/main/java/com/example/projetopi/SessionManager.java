package com.example.projetopi;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public final class SessionManager {
    private final SharedPreferences preferences;
    private final File snapshotDirectory;
    private final LocalStudentStore localStore;

    public SessionManager(Context context) {
        this(context, LocalStudentStore.get(context));
    }

    SessionManager(Context context, LocalStudentStore localStore) {
        this.localStore = localStore;
        preferences = context.getSharedPreferences("sessao_usuario", Context.MODE_PRIVATE);
        snapshotDirectory = new File(context.getNoBackupFilesDir(), "snapshots");
    }

    public String userId() {
        return preferences.getString("usuario_id", "");
    }

    public String token() {
        return preferences.getString("token", "");
    }

    public String fullName() {
        return preferences.getString("nome_completo", "");
    }

    public String version() {
        return preferences.getString("session_version", "") + ":" + userId() + ":" + token();
    }

    public boolean active() {
        if (userId().isEmpty() || token().isEmpty()) {
            return false;
        }
        try {
            String[] tokenParts = token().split("\\.");
            if (tokenParts.length != 3) {
                clear();
                return false;
            }

            byte[] decodedPayload = Base64.decode(tokenParts[1], Base64.URL_SAFE | Base64.NO_WRAP);
            String payload = new String(decodedPayload, StandardCharsets.UTF_8);
            long expiresAtSeconds = new JSONObject(payload).getLong("exp");
            if (expiresAtSeconds <= System.currentTimeMillis() / 1000L) {
                clear();
                return false;
            }
            return true;
        } catch (Exception error) {
            clear();
            return false;
        }
    }

    public void clear() {
        try {
            localStore.clear(userId());
        } catch (RuntimeException error) {
            // Uma falha no cache nao pode manter credenciais ativas apos logout.
            new SnapshotStore(snapshotDirectory).clear(userId());
        } finally {
            preferences.edit().clear().commit();
        }
    }

    public void save(JSONObject response) throws JSONException {
        JSONObject user = response.getJSONObject("usuario");
        String userId = user.getString("id");
        String accessToken = response.getString("token");
        if (userId.isEmpty() || accessToken.isEmpty()) {
            throw new JSONException("Sessao invalida");
        }

        try {
            localStore.clear(userId());
        } catch (RuntimeException error) {
            throw new JSONException("Nao foi possivel limpar os dados da sessao anterior");
        }
        preferences.edit()
                .clear()
                .putString("usuario_id", userId)
                .putString("token", accessToken)
                .putString("nome_completo", user.optString("nome_completo", ""))
                .putString("email", user.optString("email", ""))
                .putString("papel", user.optString("papel", ""))
                .putString("session_version", UUID.randomUUID().toString())
                .putBoolean("usuario_logado", true)
                .commit();
    }
}
