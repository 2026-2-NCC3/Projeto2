package com.example.projetopi;

import android.content.Intent;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.Network;
import android.os.Bundle;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.StyleSpan;
import android.view.View;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.Request;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.text.DateFormat;
import java.util.Date;

public abstract class DataListActivity extends AppCompatActivity {
    private static final int HTTP_UNAUTHORIZED = 401;
    private static final int HTTP_FORBIDDEN = 403;
    private static final int HTTP_SERVER_ERROR = 500;
    private static final int NO_HTTP_RESPONSE = 0;
    private static final int CARD_TEXT_SIZE_SP = 17;
    private static final int CARD_PADDING_PX = 24;
    private static final int CARD_BOTTOM_MARGIN_PX = 20;

    protected SessionManager session;
    protected ApiClient api;
    protected ConstraintStackLayout items;
    protected TextView status;

    private boolean relatedRecordOpened;
    private boolean loading;
    private int generation;
    private LocalStudentStore store;
    private PresenceSynchronizer presenceSync;
    private long requestedHistoryRevision;
    private SyncGate.Ticket ticket;
    private ConnectivityManager connectivity;
    private ConnectivityManager.NetworkCallback networkCallback;

    protected abstract String route();
    protected abstract String kind();
    protected abstract String title();
    protected int refreshMethod() { return Request.Method.GET; }
    protected JSONObject refreshBody() { return null; }
    protected int layoutResource() { return R.layout.activity_data_list; }
    protected LocalStudentStore createStore() { return LocalStudentStore.get(this); }
    protected SessionManager createSession(LocalStudentStore store) { return new SessionManager(this, store); }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(layoutResource());

        store = createStore();
        session = createSession(store);
        api = new ApiClient(this);
        presenceSync = new PresenceSynchronizer(session, store, api);
        items = findViewById(R.id.dataItems);
        status = findViewById(R.id.dataStatus);
        ((TextView) findViewById(R.id.dataTitle)).setText(title());
        configureNavigation();
    }

    protected void configureNavigation() {
        findViewById(R.id.dataRetry).setOnClickListener(view -> refresh());
        findViewById(R.id.dataLogout).setOnClickListener(view -> {
            session.clear();
            toLogin();
        });
        findViewById(R.id.navInicio).setOnClickListener(view ->
                startActivity(new Intent(this, TelaInicial.class)));
        findViewById(R.id.navCursos).setOnClickListener(view ->
                startActivity(new Intent(this, CursosActivity.class)));
        findViewById(R.id.navAgenda).setOnClickListener(view ->
                startActivity(new Intent(this, AgendaActivity.class)));
        findViewById(R.id.navPerfil).setOnClickListener(view ->
                startActivity(new Intent(this, CarteirinhaActivity.class)));
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (!session.active()) {
            toLogin();
            return;
        }
        showSaved("Consulta local. Atualizando...");
        refresh();
        registerNetworkCallback();
    }

    private void registerNetworkCallback() {
        connectivity = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                runOnUiThread(() -> {
                    if (!isFinishing() && session.active() && networkCallback != null) {
                        refresh();
                    }
                });
            }
        };
        connectivity.registerDefaultNetworkCallback(networkCallback);
    }

    @Override
    protected void onStop() {
        generation++;
        loading = false;
        api.cancel(this);
        presenceSync.cancel();
        SyncGate.GLOBAL.finish(ticket);
        ticket = null;
        if (connectivity != null && networkCallback != null) {
            connectivity.unregisterNetworkCallback(networkCallback);
        }
        networkCallback = null;
        super.onStop();
    }

    protected void toLogin() {
        Intent loginIntent = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(loginIntent);
        finish();
    }

    private String cacheKey() {
        return ApiConfig.BASE_URL + route();
    }

    private String savedMessage(long updatedAt) {
        String formattedTime = DateFormat.getDateTimeInstance().format(new Date(updatedAt));
        return "Dados salvos • ultima atualizacao: " + formattedTime;
    }

    private boolean showSaved(String message) {
        SnapshotStore.Snapshot cachedSnapshot = store.read(session.userId(), cacheKey(), kind());
        if (cachedSnapshot == null) {
            items.removeAllViews();
            int confirmed = appendLocalReceipts(new JSONArray());
            status.setText(confirmed > 0 ? getString(R.string.history_local_receipts) : message + " Nenhum dado salvo.");
            return confirmed > 0;
        }
        try {
            render(cachedSnapshot.data);
            appendLocalReceipts(cachedSnapshot.data);
            status.setText(message + "\n" + savedMessage(cachedSnapshot.updatedAt));
            return true;
        } catch (Exception error) {
            items.removeAllViews();
            status.setText("Cache invalido. Tente atualizar online.");
            return false;
        }
    }

    private int appendLocalReceipts(JSONArray detailedHistory) {
        if (!kind().equals("historico")) return 0;
        int added = 0;
        try {
            java.util.Set<String> detailedIds = new java.util.HashSet<>();
            for (int index = 0; index < detailedHistory.length(); index++) {
                detailedIds.add(detailedHistory.getJSONObject(index).getString("id"));
            }
            JSONArray receipts = store.receipts(session.userId(), ApiConfig.BASE_URL);
            for (int index = 0; index < receipts.length(); index++) {
                JSONObject receipt = receipts.getJSONObject(index);
                if (detailedIds.contains(receipt.getString("id"))) continue;
                TextView card = new TextView(this);
                card.setText(getString(R.string.history_local_receipt, receipt.getString("atividade_id"),
                        receipt.getString("checkin_em"), receipt.getString("metodo")));
                card.setTextSize(CARD_TEXT_SIZE_SP);
                card.setPadding(CARD_PADDING_PX, CARD_PADDING_PX, CARD_PADDING_PX, CARD_PADDING_PX);
                card.setBackgroundResource(R.drawable.bg_card_branco);
                items.addView(card);
                added++;
            }
        } catch (Exception ignored) {
            // Nao monta registros de presenca a partir de dados incompletos.
        }
        return added;
    }

    protected void refresh() {
        if (!session.active()) {
            toLogin();
            return;
        }
        if (loading) {
            return;
        }
        if (!kind().equals("historico")) {
            presenceSync.start(() -> { if (!session.active()) toLogin(); });
        }
        try {
            requestedHistoryRevision = kind().equals("historico")
                    ? store.historyRevision(session.userId(), ApiConfig.BASE_URL) : -1;
        } catch (RuntimeException error) {
            requestedHistoryRevision = -1;
        }
        ticket = SyncGate.GLOBAL.begin(session.version(), cacheKey());
        if (ticket == null) {
            return;
        }

        loading = true;
        final int requestGeneration = ++generation;
        final String sessionVersion = session.version();
        status.setText("Atualizando pela API...");
        findViewById(R.id.dataProgress).setVisibility(View.VISIBLE);

        api.request(this, route(), refreshMethod(), refreshBody(), session.token(), new ApiClient.Callback() {
            @Override
            public void success(String responseBody) {
                if (!isCurrentRequest(requestGeneration, sessionVersion)) {
                    return;
                }
                finishRefresh();
                try {
                    displayOnlineRecords(responseBody);
                } catch (Exception error) {
                    showSaved("Resposta invalida. Ultimo conteudo valido preservado.");
                }
            }

            @Override
            public void failure(int httpStatus) {
                if (!isCurrentRequest(requestGeneration, sessionVersion)) {
                    return;
                }
                finishRefresh();
                handleRefreshFailure(httpStatus);
            }
        });
    }

    private boolean isCurrentRequest(int requestGeneration, String sessionVersion) {
        return generation == requestGeneration
                && sessionVersion.equals(session.version())
                && !isFinishing();
    }

    private void finishRefresh() {
        SyncGate.GLOBAL.finish(ticket);
        ticket = null;
        loading = false;
        findViewById(R.id.dataProgress).setVisibility(View.GONE);
    }

    // A confirmacao de escrita invalida GETs anteriores antes de atualizar o snapshot.
    protected final void applyMutationSnapshot(String responseBody) throws Exception {
        generation++;
        api.cancel(this);
        finishRefresh();
        displayOnlineRecords(responseBody);
    }

    private void displayOnlineRecords(String responseBody) throws Exception {
        JSONArray records = ApiRecords.parse(responseBody, kind());
        render(records);
        focusRelatedRecord(records);
        try {
            SnapshotStore.Snapshot savedSnapshot = store.save(
                    session.userId(), cacheKey(), kind(), records.toString(),
                    System.currentTimeMillis(), requestedHistoryRevision);
            String updateMessage = records.length() == 0
                    ? "Nenhum registro encontrado. "
                    : "Dados atualizados. ";
            status.setText(updateMessage + savedMessage(savedSnapshot.updatedAt));
        } catch (IOException error) {
            status.setText("Dados online. Nao foi possivel salvar para consulta offline.");
        }
    }

    private void focusRelatedRecord(JSONArray records) throws Exception {
        String requestedId = getIntent().getStringExtra("registro_id");
        if (relatedRecordOpened || requestedId == null) return;
        for (int index = 0; index < records.length(); index++) {
            if (!requestedId.equals(records.getJSONObject(index).getString("id"))) continue;
            View card = items.getChildAt(index);
            if (card == null) return;
            relatedRecordOpened = true;
            String version = session.version();
            card.post(() -> {
                if (!isFinishing() && card.getParent() == items && session.active() && version.equals(session.version())) {
                    card.setFocusableInTouchMode(true);
                    card.requestFocus();
                    card.requestRectangleOnScreen(new android.graphics.Rect(0, 0, card.getWidth(), card.getHeight()));
                    if (card.hasOnClickListeners()) card.performClick();
                }
            });
            return;
        }
    }

    protected void handleRefreshFailure(int httpStatus) {
        if (httpStatus == HTTP_UNAUTHORIZED) {
            session.clear();
            toLogin();
            return;
        }
        if (httpStatus == HTTP_FORBIDDEN) {
            try { store.clear(session.userId()); } catch (RuntimeException ignored) { }
            items.removeAllViews();
            status.setText("Acesso nao autorizado.");
            return;
        }
        if (httpStatus == NO_HTTP_RESPONSE || httpStatus >= HTTP_SERVER_ERROR) {
            showSaved("Sem atualizacao online. Tente novamente.");
        } else {
            items.removeAllViews();
            status.setText("Nao foi possivel consultar os dados.");
        }
    }

    protected void render(JSONArray records) throws Exception {
        items.removeAllViews();
        for (int index = 0; index < records.length(); index++) {
            JSONObject record = records.getJSONObject(index);
            items.addView(createRecordCard(record));
        }
    }

    private TextView createRecordCard(JSONObject record) throws Exception {
        TextView card = new TextView(this);
        String title = record.getString("titulo");
        SpannableString cardText = new SpannableString(title + "\n" + details(record));
        if (!title.isEmpty()) {
            cardText.setSpan(new StyleSpan(Typeface.BOLD), 0, title.length(),
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
        card.setText(cardText);
        card.setTextSize(16);
        card.setTextColor(getColor(R.color.texto_primario));
        card.setLineSpacing(getResources().getDimension(R.dimen.espacamento_entre_cards), 1f);

        int padding = Math.round(20f * getResources().getDisplayMetrics().density);
        card.setPadding(padding, padding, padding, padding);
        card.setBackgroundResource(R.drawable.bg_card_branco);

        androidx.constraintlayout.widget.ConstraintLayout.LayoutParams layoutParams = new androidx.constraintlayout.widget.ConstraintLayout.LayoutParams(
                androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.MATCH_PARENT, androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.WRAP_CONTENT);
        layoutParams.setMargins(0, 0, 0, CARD_BOTTOM_MARGIN_PX);
        card.setLayoutParams(layoutParams);
        card.setOnClickListener(view -> select(record));
        return card;
    }

    protected String details(JSONObject record) {
        if (kind().equals("inscricoes")) {
            return record.optInt("carga_horaria_horas") + "h • " + record.optString("status", "");
        }
        if (kind().equals("cursos")) {
            return record.optInt("carga_horaria_horas") + "h • "
                    + record.optString("modalidade", "") + "\n"
                    + record.optString("data_inicio", "")
                    + (record.isNull("data_fim") ? "" : " - " + record.optString("data_fim", ""))
                    + (record.isNull("local") ? "" : "\n" + record.optString("local", ""));
        }
        if (kind().equals("historico")) {
            return "Presenca confirmada pelo servidor • " + record.optString("metodo", "")
                    + "\n" + record.optString("checkin_em", "");
        }
        return record.optString("data", "") + " • " + record.optString("hora_inicio", "")
                + " - " + record.optString("hora_fim", "") + " (horario da ONG)\n"
                + record.optString("curso_titulo", "");
    }

    protected void select(JSONObject record) {
        if (!kind().equals("cursos") && !kind().equals("inscricoes")) {
            new AlertDialog.Builder(this)
                    .setTitle(record.optString("titulo"))
                    .setMessage(details(record) + "\n" + record.optString("local", ""))
                    .setPositiveButton("Fechar", null)
                    .show();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle(record.optString("titulo"))
                .setMessage(record.optString("descricao", "") + "\n" + details(record))
                .setPositiveButton("Minha agenda", (dialog, selectedButton) ->
                        startActivity(new Intent(this, AgendaActivity.class)
                                .putExtra("curso_id", record.optString("curso_id", record.optString("id")))))
                .setNegativeButton("Fechar", null)
                .show();
    }
}
