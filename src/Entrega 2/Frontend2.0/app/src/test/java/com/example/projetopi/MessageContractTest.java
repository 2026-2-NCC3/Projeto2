package com.example.projetopi;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import org.junit.Test;
import static org.junit.Assert.*;

public class MessageContractTest {
    private JSONObject message() throws Exception {
        return new JSONObject().put("id","m1").put("titulo","Aviso").put("corpo","Conteudo completo")
                .put("origem","Proxima Etapa").put("publico_alvo","todos").put("curso_id",JSONObject.NULL)
                .put("curso_titulo",JSONObject.NULL).put("enviado_em","2026-11-05T12:00:00Z").put("lido_em",JSONObject.NULL);
    }
    private JSONArray parse(JSONObject message) throws Exception {
        return ApiRecords.parse(new JSONArray().put(message).toString(),"mensagens");
    }
    @Test public void emptyUnreadAndReadMessagesHaveDistinctValidStates() throws Exception {
        assertEquals(0,ApiRecords.parse("[]","mensagens").length());
        assertTrue(parse(message()).getJSONObject(0).isNull("lido_em"));
        assertEquals("2026-11-05T12:01:00Z",parse(message().put("lido_em","2026-11-05T12:01:00Z")).getJSONObject(0).getString("lido_em"));
    }
    @Test public void recipientListsAuthorIdsAndCredentialsNeverEnterStudentCache() throws Exception {
        JSONObject record=message().put("aluno_ids",new JSONArray().put("OUTRO-ALUNO"))
                .put("autor_id","PRIVADO").put("token","NAO-SALVAR");
        String safe=parse(record).toString();
        assertFalse(safe.contains("OUTRO-ALUNO"));
        assertFalse(safe.contains("PRIVADO"));
        assertFalse(safe.contains("NAO-SALVAR"));
    }
    @Test public void draftsUnknownScopesAndFalseReadDatesAreRejected() throws Exception {
        for(JSONObject record:new JSONObject[]{message().put("enviado_em",JSONObject.NULL),
                message().put("publico_alvo","inventado"),message().put("lido_em",true),
                message().put("publico_alvo","curso"),message().put("corpo","")}) {
            assertThrows(JSONException.class,()->parse(record));
        }
    }
}
