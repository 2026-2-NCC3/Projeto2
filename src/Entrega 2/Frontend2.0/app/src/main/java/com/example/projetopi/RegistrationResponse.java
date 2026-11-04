package com.example.projetopi;

import org.json.JSONException;
import org.json.JSONObject;

public final class RegistrationResponse {
    private RegistrationResponse() { }

    public static boolean isCreated(int status, String body) {
        if (status != 201 || body == null) {
            return false;
        }
        try {
            JSONObject profile = new JSONObject(body);
            for (String field : new String[]{"id", "nome_completo", "email"}) {
                Object value = profile.get(field);
                if (!(value instanceof String) || ((String) value).trim().isEmpty()) {
                    return false;
                }
            }
            return true;
        } catch (JSONException error) {
            return false;
        }
    }
}
