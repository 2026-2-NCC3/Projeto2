package com.example.projetopi;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.Set;

/** RFM09/15: metadados autorizados; referencia privada de arquivo nunca entra no cache. */
public final class CertificateContract {
    private CertificateContract() { }

    public static void validate(JSONObject record) throws JSONException {
        for (String field : new String[]{"inscricao_id", "curso_id", "status"}) {
            Object value = record.get(field);
            if (!(value instanceof String) || ((String) value).trim().isEmpty()) {
                throw new JSONException("Certificado incompleto");
            }
        }
        String status = record.getString("status");
        if (!status.equals("pendente") && !status.equals("pronto")
                && !status.equals("emitido") && !status.equals("revogado")) {
            throw new JSONException("Situacao de certificado desconhecida");
        }
        Object hours = record.get("carga_horaria_horas");
        if (!(hours instanceof Number) || ((Number) hours).doubleValue() < 0) {
            throw new JSONException("Carga horaria invalida");
        }
        Object emitted = record.get("emitido_em");
        if (emitted != JSONObject.NULL && !(emitted instanceof String)) {
            throw new JSONException("Data de emissao invalida");
        }
        if (status.equals("emitido") && (!(emitted instanceof String) || ((String) emitted).trim().isEmpty())) {
            throw new JSONException("Data de emissao ausente");
        }
        if (!Boolean.FALSE.equals(record.get("arquivo_disponivel"))
                || !"armazenamento_nao_validado".equals(record.getString("arquivo_indisponivel_motivo"))) {
            throw new JSONException("Contrato de arquivo nao suportado nesta versao");
        }
        safeCriteria(record.getJSONArray("criterios"));
    }

    public static JSONArray safeCriteria(JSONArray criteria) throws JSONException {
        JSONArray projected = new JSONArray();
        Set<String> seen = new HashSet<>();
        for (int index = 0; index < criteria.length(); index++) {
            JSONObject criterion = criteria.getJSONObject(index);
            String name = criterion.getString("criterio");
            Object met = criterion.get("atendido");
            if ((!name.equals("frequencia") && !name.equals("avaliacao") && !name.equals("carga_horaria"))
                    || !seen.add(name) || !(met instanceof Number)
                    || (((Number) met).doubleValue() != 0 && ((Number) met).doubleValue() != 1)) {
                throw new JSONException("Criterio de certificado invalido");
            }
            projected.put(new JSONObject().put("criterio", name).put("atendido", ((Number) met).intValue()));
        }
        return projected;
    }
}
