package com.example.projetopi;

import android.content.Intent;
import android.os.Bundle;
import android.text.format.DateFormat;
import android.view.View;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.android.volley.Request;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParsePosition;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class TelaInicial extends AppCompatActivity {

    private static final String AGENDA_ROUTE = "/api/agenda";
    private static final String AGENDA_KIND = "agenda";
    private static final Locale PORTUGUESE = new Locale("pt", "BR");

    private TextView txtSaudacao;
    private TextView activityTitle;
    private TextView activityDetails;
    private LocalStudentStore store;
    private SessionManager session;
    private ApiClient api;
    private Object agendaRequest;
    private NotificationBadgeController notifications;

    protected LocalStudentStore createStore() { return LocalStudentStore.get(this); }
    protected SessionManager createSession(LocalStudentStore store) { return new SessionManager(this, store); }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_paginainicial);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return windowInsets;
        });

        txtSaudacao = findViewById(R.id.txtSaudacao);
        activityTitle = findViewById(R.id.dashboardActivityTitle);
        activityDetails = findViewById(R.id.dashboardActivityDetails);

        store = createStore();
        session = createSession(store);
        configurarNavegacao();
        api = new ApiClient(this);
        notifications = new NotificationBadgeController(session, store, api,
                findViewById(R.id.notificationBadge), findViewById(R.id.notificationButton));
    }

    @Override protected void onStart() {
        super.onStart();
        if (!session.active()) {
            abrirTelaDeLogin();
            return;
        }

        String name = session.fullName().trim();
        txtSaudacao.setText(name.isEmpty() ? getString(R.string.dashboard_greeting)
                : getString(R.string.dashboard_greeting_named, name));
        notifications.start();
        TextView date = findViewById(R.id.dashboardDate);
        date.setText(new SimpleDateFormat("EEEE, d 'de' MMMM", PORTUGUESE).format(new Date()));
        consultarProximaAtividade();
    }

    @Override protected void onStop() {
        cancelarConsultas();
        super.onStop();
    }

    private void cancelarConsultas() {
        notifications.stop();
        if (agendaRequest != null) {
            api.cancel(agendaRequest);
            agendaRequest = null;
        }
    }

    private void sair() {
        cancelarConsultas();
        session.clear();
        abrirTelaDeLogin();
    }

    private void abrirTelaDeLogin() {
        Intent login = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(login);
        finish();
    }

    private void configurarNavegacao() {
        findViewById(R.id.btnSair).setOnClickListener(view -> sair());
        findViewById(R.id.dashboardExplore).setOnClickListener(view -> abrirTela(CursosActivity.class));
        findViewById(R.id.dashboardCheckin).setOnClickListener(view -> abrirTela(QrCheckinActivity.class));
        findViewById(R.id.dashboardCertificates).setOnClickListener(view -> abrirTela(CertificatesActivity.class));
        findViewById(R.id.imgAvatar).setOnClickListener(view -> abrirTela(CarteirinhaActivity.class));
        findViewById(R.id.txtVerDetalhes).setOnClickListener(view -> abrirTela(AgendaActivity.class));
        findViewById(R.id.notificationButton).setOnClickListener(view -> abrirTela(NotificationsActivity.class));
        findViewById(R.id.atalhoMensagens).setOnClickListener(view -> abrirTela(MessagesActivity.class));
        findViewById(R.id.navCursos).setOnClickListener(
                view -> abrirTela(CursosActivity.class)
        );

        findViewById(R.id.navAgenda).setOnClickListener(
                view -> abrirTela(AgendaActivity.class)
        );

        findViewById(R.id.navPerfil).setOnClickListener(
                view -> abrirTela(CarteirinhaActivity.class)
        );

        findViewById(R.id.atalhoCursos).setOnClickListener(
                view -> abrirTela(CursosActivity.class)
        );

        findViewById(R.id.atalhoAgenda).setOnClickListener(
                view -> abrirTela(AgendaActivity.class)
        );

        findViewById(R.id.atalhoCarteirinha).setOnClickListener(
                view -> abrirTela(CarteirinhaActivity.class)
        );
    }


    private void consultarProximaAtividade() {
        if (!session.active()) {
            showActivity(getString(R.string.dashboard_activity_unavailable),
                    getString(R.string.dashboard_activity_sign_in));
            return;
        }

        showActivity(getString(R.string.dashboard_activity_loading), "");
        Object request = new Object();
        agendaRequest = request;
        String sessionVersion = session.version();
        api.request(request, AGENDA_ROUTE, Request.Method.GET, null, session.token(),
                new ApiClient.Callback() {
                    @Override public void success(String body) {
                        if (!isCurrentAgendaRequest(request, sessionVersion)) return;
                        try {
                            renderAgenda(ApiRecords.parse(body, AGENDA_KIND), null);
                        } catch (JSONException error) {
                            showSavedAgenda();
                        }
                    }

                    @Override public void failure(int status) {
                        if (!isCurrentAgendaRequest(request, sessionVersion)) return;
                        if (status == 401) {
                            sair();
                        } else if (status == 403) {
                            showActivity(getString(R.string.dashboard_activity_unavailable),
                                    getString(R.string.dashboard_activity_sign_in));
                        } else if (status == 0 || status >= 500) {
                            showSavedAgenda();
                        } else {
                            showAgendaUnavailable();
                        }
                    }
                });
    }

    private boolean isCurrentAgendaRequest(Object request, String sessionVersion) {
        return request == agendaRequest && sessionVersion.equals(session.version()) && session.active();
    }

    private void showSavedAgenda() {
        SnapshotStore.Snapshot snapshot = store.read(
                session.userId(), ApiConfig.BASE_URL + AGENDA_ROUTE, AGENDA_KIND);
        if (snapshot != null) {
            try {
                renderAgenda(snapshot.data, snapshot.updatedAt);
                return;
            } catch (JSONException error) {
                // O snapshot não permite determinar uma atividade futura.
            }
        }
        showAgendaUnavailable();
    }

    private void showAgendaUnavailable() {
        showActivity(getString(R.string.dashboard_activity_unavailable),
                getString(R.string.dashboard_activity_unavailable_details));
    }

    private void renderAgenda(JSONArray records, Long savedAt) throws JSONException {
        JSONObject nextActivity = null;
        Date nextStart = null;
        Date now = new Date();

        for (int index = 0; index < records.length(); index++) {
            JSONObject record = records.getJSONObject(index);
            Date start = parseAgendaStart(record.getString("data"), record.getString("hora_inicio"));
            if (start == null) throw new JSONException("Data ou horário inválido na agenda");
            if (!start.before(now) && (nextStart == null || start.before(nextStart))) {
                nextStart = start;
                nextActivity = record;
            }
        }

        if (nextActivity == null) {
            int title = savedAt == null ? R.string.dashboard_activity_empty
                    : R.string.dashboard_activity_cached_empty;
            showActivity(getString(title),
                    withSavedDate(getString(R.string.dashboard_activity_empty_details), savedAt));
            return;
        }

        String details = new SimpleDateFormat("EEE, dd MMM · HH:mm", PORTUGUESE).format(nextStart);
        String location = nextActivity.optString("local", "").trim();
        if (nextActivity.isNull("local")) location = "";
        if (location.isEmpty() && !nextActivity.isNull("link_online")
                && !nextActivity.optString("link_online").trim().isEmpty()) {
            location = getString(R.string.dashboard_activity_online);
        }
        if (!location.isEmpty()) {
            details = getString(R.string.dashboard_activity_with_location, details, location);
        }
        showActivity(nextActivity.getString("titulo"), withSavedDate(details, savedAt));
    }

    private static Date parseAgendaStart(String date, String time) {
        String pattern;
        if (time.length() == 5) {
            pattern = "yyyy-MM-dd HH:mm";
        } else if (time.length() == 8) {
            pattern = "yyyy-MM-dd HH:mm:ss";
        } else {
            return null;
        }
        String value = date + " " + time;
        if (value.length() != pattern.length()) return null;

        // A agenda envia data e hora locais separadas, sem offset.
        SimpleDateFormat parser = new SimpleDateFormat(pattern, Locale.ROOT);
        parser.setLenient(false);
        ParsePosition position = new ParsePosition(0);
        Date parsed = parser.parse(value, position);
        return position.getIndex() == value.length() ? parsed : null;
    }

    private String withSavedDate(String details, Long savedAt) {
        if (savedAt == null) return details;
        Date date = new Date(savedAt);
        String timestamp = DateFormat.getDateFormat(this).format(date) + " "
                + DateFormat.getTimeFormat(this).format(date);
        return getString(R.string.dashboard_activity_cached, details, timestamp);
    }

    private void showActivity(String title, String details) {
        activityTitle.setText(title);
        activityDetails.setText(details);
        activityDetails.setVisibility(details.isEmpty() ? View.GONE : View.VISIBLE);
    }

    private void abrirTela(Class<?> tela) {
        Intent intent = new Intent(this, tela);

        startActivity(intent);
    }
}
