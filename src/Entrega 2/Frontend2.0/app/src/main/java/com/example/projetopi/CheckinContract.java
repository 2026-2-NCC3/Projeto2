package com.example.projetopi;

import org.json.JSONException;
import org.json.JSONObject;

/** Validacao de formato local; assinatura, validade e autorizacao pertencem a API. */
public final class CheckinContract {
    public enum Result { CONFIRMED, ALREADY_RECORDED, UNCONFIRMED }

    private CheckinContract() { }

    public static JSONObject requestBody(String qrToken) throws JSONException {
        if (qrToken == null || qrToken.length() > 4096
                || !qrToken.matches("[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+")) {
            throw new JSONException("Formato QR invalido");
        }
        return new JSONObject().put("qr_token", qrToken);
    }

    public static Result result(int httpStatus, String body) {
        if (httpStatus != 200 && httpStatus != 201) {
            return Result.UNCONFIRMED;
        }
        try {
            JSONObject presence = new JSONObject(body);
            for (String field : new String[]{"id", "inscricao_id", "atividade_id", "checkin_em", "metodo"}) {
                Object value = presence.get(field);
                if (!(value instanceof String) || ((String) value).trim().isEmpty()) {
                    return Result.UNCONFIRMED;
                }
            }
            String method = presence.getString("metodo");
            if (!method.equals("qrcode") && !method.equals("manual")) {
                return Result.UNCONFIRMED;
            }
            if (httpStatus == 201 && !method.equals("qrcode")) {
                return Result.UNCONFIRMED;
            }
            return httpStatus == 201 ? Result.CONFIRMED : Result.ALREADY_RECORDED;
        } catch (JSONException | NullPointerException error) {
            return Result.UNCONFIRMED;
        }
    }
}
