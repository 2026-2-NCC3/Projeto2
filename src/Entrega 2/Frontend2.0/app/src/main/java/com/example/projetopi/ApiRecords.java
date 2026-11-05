package com.example.projetopi;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

public final class ApiRecords {
    private static final String[] COURSE_FIELDS = {
        "id",
        "titulo",
        "descricao",
        "carga_horaria_horas",
        "modalidade",
        "data_inicio",
        "data_fim",
        "vagas_disponiveis",
        "status",
        "universidade_id"
    };
    private static final String[] ACTIVITY_FIELDS = {
        "id",
        "titulo",
        "curso_id",
        "curso_titulo",
        "data",
        "hora_inicio",
        "hora_fim",
        "local",
        "link_online",
        "inscricao_id",
        "atividade_id",
        "checkin_em",
        "metodo"
    };

    private static final String[] CERTIFICATE_FIELDS = {
        "id", "inscricao_id", "curso_id", "titulo", "carga_horaria_horas", "status", "emitido_em",
        "criterios", "arquivo_disponivel", "arquivo_indisponivel_motivo"
    };

    private static final String[] MESSAGE_FIELDS = {
        "id", "titulo", "corpo", "origem", "publico_alvo", "curso_id", "curso_titulo", "enviado_em", "lido_em"
    };

    private ApiRecords() {
    }

    public static JSONArray parse(String body, String recordType) throws JSONException {
        JSONArray responseRecords = new JSONArray(body);
        Set<String> seenRecordIds = new HashSet<>();
        JSONArray projectedRecords = new JSONArray();

        for (int index = 0; index < responseRecords.length(); index++) {
            JSONObject record = responseRecords.getJSONObject(index);
            String recordId = text(record, "id");
            text(record, "titulo");

            if (!seenRecordIds.add(recordId)) {
                throw new JSONException("Identificador duplicado");
            }

            validateRecordFields(record, recordType);
            projectedRecords.put(copyAllowedFields(record, recordType));
        }

        return projectedRecords;
    }

    private static void validateRecordFields(JSONObject record, String recordType)
            throws JSONException {
        if (recordType.equals("mensagens")) {
            MessageContract.validate(record);
        } else if (recordType.equals("certificados")) {
            CertificateContract.validate(record);
        } else if (recordType.equals("cursos")) {
            Object courseHours = record.get("carga_horaria_horas");
            if (!(courseHours instanceof Number) || ((Number) courseHours).intValue() < 0) {
                throw new JSONException("Carga horaria invalida");
            }
        } else if (recordType.equals("agenda") || recordType.equals("historico")) {
            if (recordType.equals("historico")) {
                text(record, "checkin_em");
                text(record, "atividade_id");
            }
            text(record, "curso_id");
            text(record, "data");
            text(record, "hora_inicio");
            text(record, "hora_fim");
        }
    }

    private static JSONObject copyAllowedFields(JSONObject record, String recordType)
            throws JSONException {
        String[] allowedFields;
        if (recordType.equals("mensagens")) {
            allowedFields = MESSAGE_FIELDS;
        } else if (recordType.equals("certificados")) {
            allowedFields = CERTIFICATE_FIELDS;
        } else if (recordType.equals("cursos")) {
            allowedFields = COURSE_FIELDS;
        } else {
            allowedFields = ACTIVITY_FIELDS;
        }

        JSONObject projectedRecord = new JSONObject();
        for (String field : allowedFields) {
            if (record.has(field)) {
                if (recordType.equals("certificados") && field.equals("criterios")) {
                    projectedRecord.put(field, CertificateContract.safeCriteria(record.getJSONArray(field)));
                } else {
                    projectedRecord.put(field, record.get(field));
                }
            }
        }
        return projectedRecord;
    }

    private static String text(JSONObject record, String field) throws JSONException {
        Object fieldValue = record.get(field);
        if (!(fieldValue instanceof String) || ((String) fieldValue).trim().isEmpty()) {
            throw new JSONException("Campo invalido");
        }
        return (String) fieldValue;
    }
}
