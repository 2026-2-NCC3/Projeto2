package com.example.projetopi;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.UUID;

public final class SessionManager {
    private final SharedPreferences prefs;
    private final java.io.File cacheRoot;
    public SessionManager(Context context) { prefs=context.getSharedPreferences("sessao_usuario",Context.MODE_PRIVATE); cacheRoot=new java.io.File(context.getNoBackupFilesDir(),"snapshots"); }
    public String userId() { return prefs.getString("usuario_id",""); }
    public String token() { return prefs.getString("token",""); }
    public String version() { return prefs.getString("session_version","") + ":" + userId() + ":" + token(); }
    public boolean active() {
        if(userId().isEmpty() || token().isEmpty()) return false;
        try {
            String[] parts=token().split("\\.");
            if(parts.length!=3) {clear();return false;}
            String payload=new String(android.util.Base64.decode(parts[1],android.util.Base64.URL_SAFE|android.util.Base64.NO_WRAP),java.nio.charset.StandardCharsets.UTF_8);
            long expiry=new JSONObject(payload).getLong("exp");
            if(expiry<=System.currentTimeMillis()/1000L) {clear();return false;}
            return true;
        } catch(Exception error) {clear();return false;}
    }
    public void clear() { new SnapshotStore(cacheRoot).clear(userId()); prefs.edit().clear().commit(); }
    public void save(JSONObject response) throws JSONException {
        JSONObject user=response.getJSONObject("usuario");
        String id=user.getString("id"), token=response.getString("token");
        if(id.isEmpty() || token.isEmpty()) throw new JSONException("Sessao invalida");
        new SnapshotStore(cacheRoot).clear(userId());
        prefs.edit().clear().putString("usuario_id",id).putString("token",token)
            .putString("nome_completo",user.optString("nome_completo", ""))
            .putString("email",user.optString("email", ""))
            .putString("papel",user.optString("papel", ""))
            .putString("session_version",UUID.randomUUID().toString()).putBoolean("usuario_logado",true).commit();
    }
}
