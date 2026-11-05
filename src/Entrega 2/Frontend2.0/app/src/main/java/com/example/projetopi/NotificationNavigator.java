package com.example.projetopi;

import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

/** Somente telas internas conhecidas; nenhum ACTION_VIEW ou URI vindo do servidor. */
public final class NotificationNavigator {
    private NotificationNavigator() { }

    public static Intent intent(Context context, JSONObject notification) throws Exception {
        Object value = NotificationContract.safeDestination(notification.get("destino"));
        if (value == JSONObject.NULL) return null;
        JSONObject destination = (JSONObject) value;
        Class<?> screen;
        switch (destination.getString("tela")) {
            case "cursos": screen = CursosActivity.class; break;
            case "agenda": screen = AgendaActivity.class; break;
            case "mensagens": screen = MessagesActivity.class; break;
            case "certificados": screen = CertificatesActivity.class; break;
            default: throw new IllegalArgumentException("Destino indisponivel");
        }
        Intent intent = new Intent(context, screen).putExtra("registro_id", destination.getString("id"));
        if (screen == AgendaActivity.class) intent.putExtra("curso_id", destination.getString("id"));
        return intent;
    }
}
