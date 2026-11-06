package com.example.projetopi;

import android.view.LayoutInflater;
import android.view.View;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;

/** RFM09: consulta nativa; arquivo indisponivel ate existir armazenamento autorizado. */
public class CertificatesActivity extends DataListActivity {
    @Override protected String route() { return "/api/certificados/minhas"; }
    @Override protected String kind() { return "certificados"; }
    @Override protected String title() { return getString(R.string.certificates_title); }
    @Override protected int layoutResource() { return R.layout.activity_certificates; }

    @Override protected void configureNavigation() {
        findViewById(R.id.certificateBack).setOnClickListener(view -> finish());
        findViewById(R.id.dataRetry).setOnClickListener(view -> refresh());
    }

    @Override protected void render(JSONArray records) throws Exception {
        items.removeAllViews();
        int issued = 0;
        for (int index = 0; index < records.length(); index++) {
            JSONObject certificate = records.getJSONObject(index);
            if (certificate.getString("status").equals("emitido")) issued++;
            View card = LayoutInflater.from(this).inflate(R.layout.item_certificate, items, false);
            ((TextView) card.findViewById(R.id.certificateName)).setText(certificate.getString("titulo"));
            ((TextView) card.findViewById(R.id.certificateState)).setText(statusLabel(certificate.getString("status")));
            String emission = certificate.isNull("emitido_em") ? getString(R.string.certificate_date_missing)
                    : getString(R.string.certificate_emission, certificate.getString("emitido_em"));
            ((TextView) card.findViewById(R.id.certificateMetadata)).setText(
                    getString(R.string.certificate_hours, certificate.getInt("carga_horaria_horas")) + " · " + emission);
            ((TextView) card.findViewById(R.id.certificateCriteria)).setText(criteriaText(certificate.getJSONArray("criterios")));
            items.addView(card);
        }
        ((TextView) findViewById(R.id.certificateTotal)).setText(
                getResources().getQuantityString(R.plurals.certificates_emitted, issued, issued));
        findViewById(R.id.certificateEmpty).setVisibility(records.length() == 0 ? View.VISIBLE : View.GONE);
    }

    private String statusLabel(String status) {
        switch (status) {
            case "emitido": return getString(R.string.certificate_issued);
            case "pronto": return getString(R.string.certificate_ready);
            case "revogado": return getString(R.string.certificate_revoked);
            default: return getString(R.string.certificate_pending);
        }
    }

    private String criteriaText(JSONArray criteria) throws Exception {
        if (criteria.length() == 0) return getString(R.string.certificate_no_criteria);
        StringBuilder text = new StringBuilder();
        for (int index = 0; index < criteria.length(); index++) {
            JSONObject criterion = criteria.getJSONObject(index);
            if (index > 0) text.append("\n");
            int label;
            switch (criterion.getString("criterio")) {
                case "frequencia": label = R.string.certificate_frequency; break;
                case "avaliacao": label = R.string.certificate_assessment; break;
                default: label = R.string.certificate_workload;
            }
            text.append(getString(label)).append(": ").append(getString(
                    criterion.getInt("atendido") == 1 ? R.string.certificate_met : R.string.certificate_not_met));
        }
        return text.toString();
    }
}
