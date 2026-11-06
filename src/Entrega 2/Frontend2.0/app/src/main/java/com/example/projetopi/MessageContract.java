package com.example.projetopi;

import org.json.JSONException;
import org.json.JSONObject;

/** RFM11/15: somente a mensagem destinada ao aluno; sem lista de destinatarios no cache. */
public final class MessageContract {
    private MessageContract() { }

    public static void validate(JSONObject record) throws JSONException {
        for (String field : new String[]{"corpo", "origem", "enviado_em", "publico_alvo"}) {
            Object value = record.get(field);
            if (!(value instanceof String) || ((String) value).trim().isEmpty()) {
                throw new JSONException("Comunicado incompleto");
            }
        }
        String scope = record.getString("publico_alvo");
        if (!scope.equals("todos") && !scope.equals("curso") && !scope.equals("individual")) {
            throw new JSONException("Publico desconhecido");
        }
        if (record.getString("corpo").length() > 10000 || record.getString("titulo").length() > 160) {
            throw new JSONException("Comunicado excede o limite");
        }
        Object readAt = record.get("lido_em");
        if (readAt != JSONObject.NULL && (!(readAt instanceof String) || ((String) readAt).trim().isEmpty())) {
            throw new JSONException("Leitura invalida");
        }
        for (String field : new String[]{"curso_id", "curso_titulo"}) {
            Object value = record.get(field);
            if (value != JSONObject.NULL && !(value instanceof String)) {
                throw new JSONException("Curso invalido");
            }
            if (scope.equals("curso") && (value == JSONObject.NULL || ((String) value).trim().isEmpty())) {
                throw new JSONException("Curso ausente");
            }
        }
    }
}
