package com.example.projetopi;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import org.junit.Test;
import static org.junit.Assert.*;

public class NotificationContractTest {
    private JSONObject notification() throws Exception {
        return new JSONObject().put("id","n1").put("titulo","Aviso").put("corpo","Conteudo")
                .put("tipo","mensagem").put("lida",0).put("criado_em","2026-11-05T12:00:00Z")
                .put("destino",new JSONObject().put("tela","mensagens").put("id","m1"));
    }
    private JSONArray parse(JSONObject record) throws Exception {
        return ApiRecords.parse(new JSONArray().put(record).toString(),NotificationContract.KIND);
    }
    @Test public void emptyReadAndUnreadCountsPreserveRecords() throws Exception {
        assertEquals(0,NotificationContract.unread(ApiRecords.parse("[]",NotificationContract.KIND)));
        JSONArray records=parse(notification());
        assertEquals(1,NotificationContract.unread(records));
        assertEquals(0,NotificationContract.unread(parse(notification().put("lida",1))));
        assertEquals(0,records.getJSONObject(0).getInt("lida"));
    }
    @Test public void projectionDropsRecipientCredentialsAndArbitraryUrlInsideDestination() throws Exception {
        JSONObject record=notification().put("aluno_id","OUTRO-ALUNO").put("token","SEGREDO").put("link","https://private.invalid");
        record.getJSONObject("destino").put("url","https://private.invalid").put("token","SEGREDO");
        String projected=parse(record).toString();
        assertFalse(projected.contains("OUTRO-ALUNO"));
        assertFalse(projected.contains("SEGREDO"));
        assertFalse(projected.contains("private.invalid"));
        assertEquals(2,parse(record).getJSONObject(0).getJSONObject("destino").length());
        assertTrue(parse(notification().put("destino",JSONObject.NULL)).getJSONObject(0).isNull("destino"));
    }
    @Test public void malformedReadStatesAndUntrustedNavigationAreRejected() throws Exception {
        for(Object read:new Object[]{true,"1",2,0.5,JSONObject.NULL}) {
            assertThrows(JSONException.class,()->parse(notification().put("lida",read)));
        }
        for(JSONObject destination:new JSONObject[]{
                new JSONObject().put("tela","webview").put("id","m1"),
                new JSONObject().put("tela","mensagens").put("id","https://private.invalid")}) {
            assertThrows(JSONException.class,()->parse(notification().put("destino",destination)));
        }
        assertThrows(JSONException.class,()->parse(notification().put("tipo","push-inventado")));
    }
    @Test public void duplicateIdsAndMissingFieldsNeverBecomeSuccessfulSnapshots() throws Exception {
        JSONObject record=notification();
        assertThrows(JSONException.class,()->ApiRecords.parse(new JSONArray().put(record).put(record).toString(),NotificationContract.KIND));
        record.remove("destino");
        assertThrows(JSONException.class,()->parse(record));
    }
}
