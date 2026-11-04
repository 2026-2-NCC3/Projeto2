package com.example.projetopi;

import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class RegistrationResponseTest {
    @Test public void requiresCreatedStatusAndProfileBeforeShowingSuccess() throws Exception {
        String profile = new JSONObject().put("id", "ficticio").put("nome_completo", "Teste")
                .put("email", "teste@example.invalid").toString();
        assertTrue(RegistrationResponse.isCreated(201, profile));
        for (int status : new int[]{0, 200, 202, 204, 400, 401, 403, 500}) {
            assertFalse(RegistrationResponse.isCreated(status, profile));
        }
    }

    @Test public void malformedOrMissingFieldsNeverConfirmRegistration() throws Exception {
        for (String body : new String[]{null, "", "{}", "[]", "invalid",
                "{\"id\":null,\"email\":\"x\",\"nome_completo\":\"Teste\"}"}) {
            assertFalse(RegistrationResponse.isCreated(201, body));
        }
    }
}
