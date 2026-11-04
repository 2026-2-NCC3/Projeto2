package com.example.projetopi;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

import static org.junit.Assert.*;

public class CheckinContractTest {
    private String presence(String method) throws Exception {
        return new JSONObject().put("id", "p1").put("inscricao_id", "i1")
                .put("atividade_id", "a1").put("checkin_em", "2026-11-02T10:00:00Z")
                .put("metodo", method).toString();
    }

    @Test public void sendsOnlyQrTokenWithoutStudentIdentity() throws Exception {
        JSONObject request = CheckinContract.requestBody("header.payload.signature");
        assertEquals(1, request.length());
        assertEquals("header.payload.signature", request.getString("qr_token"));
    }

    @Test public void rejectsMalformedOrOversizedQrWithoutSending() throws Exception {
        for (String token : new String[]{null, "", "http://example.invalid", "{}", "a.b.", "x".repeat(4097)}) {
            try {
                CheckinContract.requestBody(token);
                fail("Deve rejeitar QR invalido");
            } catch (JSONException expected) {
                // Nenhuma credencial e exibida ou gravada no teste.
            }
        }
    }

    @Test public void confirmsOnlyCreatedResponseWithCompletePresence() throws Exception {
        assertEquals(CheckinContract.Result.CONFIRMED, CheckinContract.result(201, presence("qrcode")));
        assertEquals(CheckinContract.Result.ALREADY_RECORDED, CheckinContract.result(200, presence("qrcode")));
        assertEquals(CheckinContract.Result.ALREADY_RECORDED, CheckinContract.result(200, presence("manual")));
        assertEquals(CheckinContract.Result.UNCONFIRMED, CheckinContract.result(201, presence("manual")));
    }

    @Test public void neverConfirmsErrorsOrIncompleteServerResponses() throws Exception {
        for (int code : new int[]{0, 202, 204, 400, 401, 403, 500}) {
            assertEquals(CheckinContract.Result.UNCONFIRMED, CheckinContract.result(code, presence("qrcode")));
        }
        for (String body : new String[]{null, "", "invalid", "{}", "[]", "{\"id\":null}", presence("inventado")}) {
            assertEquals(CheckinContract.Result.UNCONFIRMED, CheckinContract.result(201, body));
        }
        JSONObject missingField = new JSONObject(presence("qrcode"));
        missingField.put("atividade_id", JSONObject.NULL);
        assertEquals(CheckinContract.Result.UNCONFIRMED, CheckinContract.result(201, missingField.toString()));
    }
}
