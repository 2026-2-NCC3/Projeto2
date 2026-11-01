package com.example.projetopi;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.UUID;

public final class SessionManager {
    private final SharedPreferences prefs;
    public SessionManager(Context context) { prefs=context.getSharedPreferences("sessao_usuario",Context.MODE_PRIVATE); }
    public String userId() { return prefs.getString("usuario_id",""); }
    public String token() { return prefs.getString("token",""); }
    public String version() { return prefs.getString("session_version","") + ":" + userId() + ":" + token(); }
    public boolean active() { return !userId().isEmpty() && !token().isEmpty(); }
    public void clear() { prefs.edit().clear().commit(); }
    public void save(JSONObject response) throws JSONException {
        JSONObject user=response.getJSONObject("usuario");
        String id=user.getString("id"), token=response.getString("token");
        if(id.isEmpty() || token.isEmpty()) throw new JSONException("Sessao invalida");
        prefs.edit().clear().putString("usuario_id",id).putString("token",token)
            .putString("nome_completo",user.optString("nome_completo", ""))
            .putString("email",user.optString("email", ""))
            .putString("papel",user.optString("papel", ""))
            .putString("session_version",UUID.randomUUID().toString()).putBoolean("usuario_logado",true).commit();
    }
}
