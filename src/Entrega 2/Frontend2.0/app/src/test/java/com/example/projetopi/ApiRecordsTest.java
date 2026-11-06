package com.example.projetopi;

import com.example.projetopi.model.Curso;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

public class ApiRecordsTest {
    @Test
    public void coursesAllowNullableDescriptionAndZeroHours() throws Exception {
        String response = "[{\"id\":\"c1\",\"titulo\":\"Curso real\","
                + "\"descricao\":null,\"carga_horaria_horas\":0}]";
        JSONArray courses = ApiRecords.parse(response, "cursos");
        assertEquals("c1", courses.getJSONObject(0).getString("id"));

        Curso course = new Curso("c1", "Curso real", null, 0);
        assertEquals("", course.getDescricao());
        assertEquals(0, course.getCargaHoraria());
    }

    @Test
    public void emptyListIsValid() throws Exception {
        assertEquals(0, ApiRecords.parse("[]", "agenda").length());
    }

    @Test(expected = JSONException.class)
    public void invalidResponseRejected() throws Exception {
        ApiRecords.parse("{\"erro\":\"falha\"}", "agenda");
    }

    @Test(expected = JSONException.class)
    public void missingIdentityRejected() throws Exception {
        ApiRecords.parse("[{\"titulo\":\"Curso\",\"carga_horaria_horas\":1}]", "cursos");
    }

    @Test(expected = JSONException.class)
    public void duplicateIdentityRejected() throws Exception {
        String response = "[{\"id\":\"c1\",\"titulo\":\"Curso\",\"carga_horaria_horas\":1},"
                + "{\"id\":\"c1\",\"titulo\":\"Curso\",\"carga_horaria_horas\":1}]";
        ApiRecords.parse(response, "cursos");
    }

    @Test
    public void courseProjectionPreservesAllowedNullFieldsAndOmitsOtherFields() throws Exception {
        String[] allowedFields = {
            "id", "titulo", "descricao", "carga_horaria_horas", "modalidade",
            "data_inicio", "data_fim", "vagas_disponiveis", "status", "universidade_id"
        };
        JSONObject responseRecord = new JSONObject();
        for (String field : allowedFields) {
            responseRecord.put(field, JSONObject.NULL);
        }
        responseRecord.put("id", "c1").put("titulo", "Curso").put("carga_horaria_horas", 0);
        responseRecord.put("senha_hash", "NAO-SALVAR").put("token", "NAO-SALVAR");
        JSONObject projectedRecord = ApiRecords.parse(
            new JSONArray().put(responseRecord).toString(), "cursos"
        ).getJSONObject(0);
        assertEquals(allowedFields.length, projectedRecord.length());
        for (String field : allowedFields) {
            assertTrue(projectedRecord.has(field));
        }
        assertSame(JSONObject.NULL, projectedRecord.get("descricao"));
        assertFalse(projectedRecord.has("senha_hash"));
        assertFalse(projectedRecord.has("token"));
        assertFalse(ApiRecords.parse(
            "[{\"id\":\"c1\",\"titulo\":\"Curso\",\"carga_horaria_horas\":0}]", "cursos"
        ).getJSONObject(0).has("descricao"));
    }

    @Test
    public void historyProjectionPreservesItsAllowlistAndRequiresPresenceFields() throws Exception {
        JSONObject historyRecord = new JSONObject()
            .put("id", "p1").put("titulo", "Encontro").put("curso_id", "c1")
            .put("curso_titulo", "Curso").put("data", "2026-01-01")
            .put("hora_inicio", "09:00").put("hora_fim", "11:00")
            .put("local", JSONObject.NULL).put("link_online", JSONObject.NULL)
            .put("inscricao_id", "i1").put("atividade_id", "at1")
            .put("checkin_em", "2026-01-01T12:00:00Z").put("metodo", "qrcode")
            .put("aluno_id", "NAO-SALVAR");
        JSONObject projectedRecord = ApiRecords.parse(
            new JSONArray().put(historyRecord).toString(), "historico"
        ).getJSONObject(0);
        assertEquals(13, projectedRecord.length());
        assertFalse(projectedRecord.has("aluno_id"));
        assertSame(JSONObject.NULL, projectedRecord.get("local"));
        historyRecord.remove("atividade_id");
        assertThrows(JSONException.class, () -> ApiRecords.parse(
            new JSONArray().put(historyRecord).toString(), "historico"
        ));
    }

    @Test
    public void unknownRecordKindKeepsTheExistingProjectionFallback() throws Exception {
        JSONObject projectedRecord = ApiRecords.parse(
            "[{\"id\":\"r1\",\"titulo\":\"Registro\",\"curso_id\":null,\"interno\":true}]",
            "tipo-desconhecido"
        ).getJSONObject(0);
        assertEquals(3, projectedRecord.length());
        assertTrue(projectedRecord.has("curso_id"));
        assertFalse(projectedRecord.has("interno"));
    }
}
