package com.example.projetopi;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/** Agenda individual integrada à API e ao cache de DataListActivity. */
public class AgendaActivity extends DataListActivity {
    private static final String KEY_MONTH = "agenda_month";
    private static final String KEY_DAY = "agenda_day";
    private static final Locale PT_BR = new Locale("pt", "BR");

    private final Calendar visibleMonth = Calendar.getInstance();
    private JSONArray activities = new JSONArray();
    private int selectedDay;
    private boolean loaded;
    private boolean accessDenied;
    private AgendaCalendarGrid calendarGrid;
    private TextView monthText;
    private TextView dayText;

    @Override
    protected int layoutResource() {
        return R.layout.activity_agenda;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        selectedDay = visibleMonth.get(Calendar.DAY_OF_MONTH);
        visibleMonth.set(Calendar.DAY_OF_MONTH, 1);
        if (savedInstanceState != null) {
            visibleMonth.setTimeInMillis(savedInstanceState.getLong(
                    KEY_MONTH, visibleMonth.getTimeInMillis()));
            visibleMonth.set(Calendar.DAY_OF_MONTH, 1);
            selectedDay = savedInstanceState.getInt(KEY_DAY, selectedDay);
        }
        calendarGrid = findViewById(R.id.gradeCalendario);
        monthText = findViewById(R.id.txtMesAno);
        dayText = findViewById(R.id.txtDataSelecionada);

        findViewById(R.id.btnMesAnterior).setOnClickListener(v -> changeMonth(-1));
        findViewById(R.id.btnProximoMes).setOnClickListener(v -> changeMonth(1));
        findViewById(R.id.agendaMenu).setOnClickListener(this::showMenu);
        addActions();
        updateCalendar();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        outState.putLong(KEY_MONTH, visibleMonth.getTimeInMillis());
        outState.putInt(KEY_DAY, selectedDay);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (session.active() && items != null && items.getChildCount() == 0) {
            addEmpty("Carregando agenda", "Consultando seus encontros e dados salvos.");
        }
    }

    @Override
    protected void handleRefreshFailure(int httpStatus) {
        super.handleRefreshFailure(httpStatus);
        if (httpStatus == 403) {
            accessDenied = true;
            // Nunca mantém marcadores derivados de registros que deixaram de ser autorizados.
            activities = new JSONArray();
            calendarGrid.render(visibleMonth, selectedDay, eventDays(), day -> {
                selectedDay = day;
                updateCalendar();
            });
            items.removeAllViews();
            addEmpty("Acesso não autorizado", "Não foi possível consultar esta agenda.");
        } else if (httpStatus != 401 && session.active() && items.getChildCount() == 0) {
            addEmpty("Agenda indisponível", "Verifique a conexão e tente atualizar novamente.");
        }
    }

    @Override
    protected String route() {
        String courseId = getIntent().getStringExtra("curso_id");
        return courseId == null || courseId.trim().isEmpty()
                ? "/api/agenda"
                : "/api/agenda?curso_id=" + Uri.encode(courseId);
    }

    @Override protected String kind() { return "agenda"; }
    @Override protected String title() { return "Minha agenda"; }

    // A classe base chama render tanto após consultar a API quanto após ler o cache.
    @Override
    protected void render(JSONArray records) throws Exception {
        activities = records;
        loaded = true;
        accessDenied = false;

        String requestedId = getIntent().getStringExtra("registro_id");
        if (requestedId != null) {
            for (int index = 0; index < records.length(); index++) {
                JSONObject record = records.getJSONObject(index);
                if (!requestedId.equals(record.optString("id"))) continue;
                Calendar date = parseDate(record.optString("data"));
                if (date != null) {
                    visibleMonth.setTimeInMillis(date.getTimeInMillis());
                    visibleMonth.set(Calendar.DAY_OF_MONTH, 1);
                    selectedDay = date.get(Calendar.DAY_OF_MONTH);
                }
                break;
            }
        }
        updateCalendar();
    }

    private void showMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        menu.getMenu().add("Sair da conta");
        menu.setOnMenuItemClickListener(item -> {
            // O handler centralizado da classe base limpa a sessão e navega ao login.
            findViewById(R.id.dataLogout).performClick();
            return true;
        });
        menu.show();
    }

    private void addActions() {
        LinearLayout container = findViewById(R.id.dataActions);
        addAction(container, "QR check-in", R.drawable.ic_qr_placeholder,
                QrCheckinActivity.class, false);
        addAction(container, "Histórico", R.drawable.ic_calendar,
                HistoricoActivity.class, true);
    }

    private void addAction(LinearLayout container, String label, int icon, Class<?> target,
                           boolean second) {
        TextView action = new TextView(this);
        action.setText(label);
        action.setTextSize(13);
        action.setTextColor(getColor(R.color.texto_primario));
        action.setGravity(Gravity.CENTER);
        action.setBackgroundResource(R.drawable.agenda_botao_mes);
        action.setCompoundDrawableTintList(ColorStateList.valueOf(getColor(R.color.acao_primaria)));
        action.setCompoundDrawablesWithIntrinsicBounds(icon, 0, 0, 0);
        action.setCompoundDrawablePadding(dp(7));
        action.setPadding(dp(8), 0, dp(8), 0);
        action.setClickable(true);
        action.setFocusable(true);
        action.setOnClickListener(v -> startActivity(new Intent(this, target)));

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(48), 1);
        if (second) lp.leftMargin = dp(10);
        container.addView(action, lp);
    }

    private void changeMonth(int offset) {
        visibleMonth.add(Calendar.MONTH, offset);
        visibleMonth.set(Calendar.DAY_OF_MONTH, 1);
        Calendar now = Calendar.getInstance();
        selectedDay = sameMonth(now) ? now.get(Calendar.DAY_OF_MONTH) : 1;
        updateCalendar();
    }

    private boolean sameMonth(Calendar date) {
        return date.get(Calendar.YEAR) == visibleMonth.get(Calendar.YEAR)
                && date.get(Calendar.MONTH) == visibleMonth.get(Calendar.MONTH);
    }

    private void updateCalendar() {
        if (calendarGrid == null) return;
        selectedDay = Math.max(1, Math.min(selectedDay,
                visibleMonth.getActualMaximum(Calendar.DAY_OF_MONTH)));
        String monthLabel = new SimpleDateFormat("MMMM yyyy", PT_BR)
                .format(visibleMonth.getTime());
        monthText.setText(monthLabel.substring(0, 1).toUpperCase(PT_BR)
                + monthLabel.substring(1));
        dayText.setText(selectedDay + " de "
                + new SimpleDateFormat("MMMM", PT_BR).format(visibleMonth.getTime()));
        populateGrid();
        populateCommitments();
    }

    private void populateGrid() {
        calendarGrid.render(visibleMonth, selectedDay, eventDays(), day -> {
            selectedDay = day;
            updateCalendar();
        });
    }

    private Set<Integer> eventDays() {
        Set<Integer> result = new HashSet<>();
        for (int i = 0; i < activities.length(); i++) {
            JSONObject record = activities.optJSONObject(i);
            if (record == null) continue;
            Calendar date = parseDate(record.optString("data"));
            if (date != null && sameMonth(date)) {
                result.add(date.get(Calendar.DAY_OF_MONTH));
            }
        }
        return result;
    }

    private void populateCommitments() {
        if (items == null) return;
        items.removeAllViews();
        if (accessDenied) {
            addEmpty("Acesso não autorizado", "Não foi possível consultar esta agenda.");
            return;
        }
        if (!loaded) {
            addEmpty("Carregando agenda", "Consultando suas atividades.");
            return;
        }

        int shown = 0;
        String targetDate = isoDate(selectedDay);
        // Uma view por registro preserva os índices utilizados por
        // DataListActivity.focusRelatedRecord(), inclusive após filtragem visual.
        for (int i = 0; i < activities.length(); i++) {
            JSONObject activity = activities.optJSONObject(i);
            if (activity == null) continue;
            View card = createActivityCard(activity);
            if (!targetDate.equals(activity.optString("data"))) {
                card.setVisibility(View.GONE);
            } else {
                shown++;
            }
            items.addView(card);
        }
        if (shown == 0) {
            addEmpty("Sem atividades neste dia",
                    "Escolha outra data marcada para ver seus encontros.");
        }
    }

    private View createActivityCard(JSONObject activity) {
        View card = LayoutInflater.from(this).inflate(
                R.layout.item_agenda_atividade, items, false);
        ((TextView) card.findViewById(R.id.agendaItemTitulo))
                .setText(activity.optString("titulo", "Atividade"));
        bindOptional(card, R.id.agendaItemCurso, activity.optString("curso_titulo", ""));
        bindOptional(card, R.id.agendaItemHorario,
                activity.optString("hora_inicio", "") + " – "
                        + activity.optString("hora_fim", "") + " • horário da ONG");
        bindOptional(card, R.id.agendaItemLocal, activity.optString("local", ""));
        card.setContentDescription("Detalhes: " + activity.optString("titulo", "atividade"));
        card.setOnClickListener(view -> select(activity));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.bottomMargin = dp(12);
        card.setLayoutParams(params);
        return card;
    }

    private void bindOptional(View card, int viewId, String value) {
        TextView field = card.findViewById(viewId);
        boolean present = value != null && !value.trim().isEmpty()
                && !"null".equalsIgnoreCase(value.trim());
        field.setVisibility(present ? View.VISIBLE : View.GONE);
        if (present) field.setText(value);
    }

    private void addEmpty(String heading, String description) {
        View empty = LayoutInflater.from(this).inflate(R.layout.item_agenda_vazio, items, false);
        ((TextView) empty.findViewById(R.id.agendaEmptyTitle)).setText(heading);
        ((TextView) empty.findViewById(R.id.agendaEmptyDescription)).setText(description);
        items.addView(empty);
    }

    private String isoDate(int day) {
        return String.format(Locale.US, "%04d-%02d-%02d",
                visibleMonth.get(Calendar.YEAR), visibleMonth.get(Calendar.MONTH) + 1, day);
    }

    private Calendar parseDate(String value) {
        if (value == null || !value.matches("\\d{4}-\\d{2}-\\d{2}")) return null;
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        format.setLenient(false);
        try {
            java.util.Date date = format.parse(value);
            Calendar result = Calendar.getInstance();
            if (date == null) return null;
            result.setTime(date);
            return result;
        } catch (ParseException error) {
            return null;
        }
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
