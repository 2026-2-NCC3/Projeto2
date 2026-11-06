package com.example.projetopi;

import org.json.JSONException;
import org.json.JSONObject;

/** RFM13: contrato restrito ao destinatario, sem URLs externas ou identificacao de outros alunos. */
public final class NotificationContract {
    public static final String ROUTE = "/api/notificacoes/sincronizar";
    public static final String KIND = "notificacoes";
    private NotificationContract() { }

    public static void validate(JSONObject record) throws JSONException {
        for (String field : new String[]{"corpo", "tipo", "criado_em"}) {
            Object value = record.get(field);
            if (!(value instanceof String) || ((String) value).trim().isEmpty()) {
                throw new JSONException("Notificacao incompleta");
            }
        }
        String type = record.getString("tipo");
        if (!type.equals("curso") && !type.equals("certificado") && !type.equals("presenca")
                && !type.equals("mensagem") && !type.equals("sistema")) throw new JSONException("Tipo desconhecido");
        Object read = record.get("lida");
        if (!(read instanceof Number) || (((Number) read).doubleValue() != 0 && ((Number) read).doubleValue() != 1)) {
            throw new JSONException("Leitura invalida");
        }
        safeDestination(record.get("destino"));
    }

    public static Object safeDestination(Object value) throws JSONException {
        if (value == JSONObject.NULL) return JSONObject.NULL;
        if (!(value instanceof JSONObject)) throw new JSONException("Destino invalido");
        JSONObject destination = (JSONObject) value;
        Object screen = destination.get("tela");
        Object id = destination.get("id");
        if (!(screen instanceof String) || !(id instanceof String)
                || !((String) id).matches("[A-Za-z0-9_.:-]{1,128}")) throw new JSONException("Destino invalido");
        if (!screen.equals("cursos") && !screen.equals("agenda") && !screen.equals("mensagens") && !screen.equals("certificados")) {
            throw new JSONException("Tela nao autorizada");
        }
        return new JSONObject().put("tela", screen).put("id", id);
    }

    public static int unread(org.json.JSONArray records) throws JSONException {
        int count = 0;
        for (int index = 0; index < records.length(); index++) {
            if (records.getJSONObject(index).getInt("lida") == 0) count++;
        }
        return count;
    }
}
