package com.example.projetopi;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

public class SessionManager {

    private static final String PREFERENCIAS = "sessao_usuario";

    private static final String CHAVE_TOKEN = "token";
    private static final String CHAVE_USUARIO_ID = "usuario_id";
    private static final String CHAVE_NOME = "nome_completo";
    private static final String CHAVE_EMAIL = "email";
    private static final String CHAVE_PAPEL = "papel";
    private static final String CHAVE_LOGADO = "usuario_logado";

    private final SharedPreferences preferences;

    public SessionManager(Context context) {
        preferences = context.getSharedPreferences(
                PREFERENCIAS,
                Context.MODE_PRIVATE
        );
    }

    public void salvarSessao(JSONObject resposta) throws JSONException {
        String token = resposta.getString("token");
        JSONObject usuario = resposta.getJSONObject("usuario");

        preferences.edit()
                .putString(CHAVE_TOKEN, token)
                .putString(
                        CHAVE_USUARIO_ID,
                        usuario.getString("id")
                )
                .putString(
                        CHAVE_NOME,
                        usuario.optString("nome_completo", "")
                )
                .putString(
                        CHAVE_EMAIL,
                        usuario.optString("email", "")
                )
                .putString(
                        CHAVE_PAPEL,
                        usuario.optString("papel", "")
                )
                .putBoolean(CHAVE_LOGADO, true)
                .apply();
    }

    public boolean usuarioEstaLogado() {
        boolean usuarioLogado = preferences.getBoolean(
                CHAVE_LOGADO,
                false
        );

        String token = getToken();

        return usuarioLogado
                && token != null
                && !token.trim().isEmpty();
    }

    public String getToken() {
        return preferences.getString(CHAVE_TOKEN, null);
    }

    public String getUsuarioId() {
        return preferences.getString(CHAVE_USUARIO_ID, "");
    }

    public String getNomeCompleto() {
        return preferences.getString(CHAVE_NOME, "");
    }

    public String getEmail() {
        return preferences.getString(CHAVE_EMAIL, "");
    }

    public String getPapel() {
        return preferences.getString(CHAVE_PAPEL, "");
    }

    public void encerrarSessao() {
        preferences.edit().clear().apply();
    }
}