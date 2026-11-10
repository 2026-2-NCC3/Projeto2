package com.example.projetopi;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class CertificateContractTest {
    private JSONObject metadata() throws Exception {
        return new JSONObject().put("id", "ce1").put("inscricao_id", "i1").put("curso_id", "c1")
                .put("titulo", "Curso ficticio").put("carga_horaria_horas", 24).put("status", "emitido")
                .put("emitido_em", "2026-11-05T12:00:00Z").put("arquivo_disponivel", false)
                .put("arquivo_indisponivel_motivo", "armazenamento_nao_validado")
                .put("criterios", new JSONArray().put(new JSONObject().put("criterio", "frequencia").put("atendido", 1)));
    }

    private JSONArray parse(JSONObject record) throws Exception {
        return ApiRecords.parse(new JSONArray().put(record).toString(), "certificados");
    }

    @Test public void safeProjectionRemovesPrivateFieldsAtBothLevels() throws Exception {
        JSONObject record = metadata().put("arquivo_url", "https://private.invalid/segredo")
                .put("aluno_id", "outro").put("senha_hash", "NAO-SALVAR");
        record.getJSONArray("criterios").getJSONObject(0).put("arquivo_url", "NAO-SALVAR");
        String safe = parse(record).toString();
        assertFalse(safe.contains("arquivo_url"));
        assertFalse(safe.contains("NAO-SALVAR"));
        assertFalse(safe.contains("aluno_id"));
    }

    @Test public void emptyListAndNullableEmissionAreSupported() throws Exception {
        assertEquals(0, ApiRecords.parse("[]", "certificados").length());
        JSONObject pending = metadata().put("status", "pendente").put("emitido_em", JSONObject.NULL);
        assertTrue(parse(pending).getJSONObject(0).isNull("emitido_em"));
    }

    @Test public void invalidStatesMissingEmissionAndUncontractedFileSupportAreRejected() throws Exception {
        for (JSONObject record : new JSONObject[]{
                metadata().put("status", "aprovado"), metadata().put("emitido_em", JSONObject.NULL),
                metadata().put("arquivo_disponivel", true), metadata().put("carga_horaria_horas", -1)}) {
            assertThrows(JSONException.class, () -> parse(record));
        }
    }

    @Test public void criteriaMustUseDatabaseNamesValuesAndUniqueness() throws Exception {
        for (JSONObject criterion : new JSONObject[]{
                new JSONObject().put("criterio", "percentual").put("atendido", 1),
                new JSONObject().put("criterio", "frequencia").put("atendido", true),
                new JSONObject().put("criterio", "frequencia").put("atendido", 0.5)}) {
            JSONObject record = metadata().put("criterios", new JSONArray().put(criterion));
            assertThrows(JSONException.class, () -> parse(record));
        }
        JSONObject duplicate = metadata();
        duplicate.getJSONArray("criterios").put(duplicate.getJSONArray("criterios").getJSONObject(0));
        assertThrows(JSONException.class, () -> parse(duplicate));
    }
}
