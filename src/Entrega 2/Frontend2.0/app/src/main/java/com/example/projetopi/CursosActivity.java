package com.example.projetopi;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Apresentação de cursos: mantém as rotas, o cache, a sessão e os cliques de
 * DataListActivity. Os filtros de categoria usam dados reais da API.
 */
public class CursosActivity extends DataListActivity {
    private static final String EXTRA_FILTER = "filtro_cursos";
    private static final String FILTER_ALL = "todos";
    private static final String FILTER_ENROLLED = "inscritos";
    private static final String FILTER_TECH = "tecnologia";
    private static final String FILTER_CAREER = "carreira";
    private static final String FILTER_COMPLETED = "concluidos";
    private static final String SAVED_FILTER = "cursos_filtro_atual";

    private JSONArray records = new JSONArray();
    private EditText search;
    private TextView sectionTitle;
    private TextView courseCount;
    private String activeFilter;
    private View[] chips;
    private String[] chipKeys;

    private String startingFilter() {
        String requested = getIntent().getStringExtra(EXTRA_FILTER);
        if (isValidFilter(requested)) return requested;
        return getIntent().getBooleanExtra("somente_inscritos", false)
                ? FILTER_ENROLLED : FILTER_ALL;
    }

    private static boolean isValidFilter(String filter) {
        return FILTER_ALL.equals(filter) || FILTER_ENROLLED.equals(filter)
                || FILTER_TECH.equals(filter) || FILTER_CAREER.equals(filter)
                || FILTER_COMPLETED.equals(filter);
    }

    private static boolean requiresEnrollments(String filter) {
        return FILTER_ENROLLED.equals(filter) || FILTER_COMPLETED.equals(filter);
    }

    private boolean enrolledOnly() {
        // A rota é determinada pela Intent desta instância, não pelo estado da busca.
        return requiresEnrollments(startingFilter());
    }

    @Override protected int layoutResource() {
        return R.layout.activity_cursos;
    }

    @Override protected String route() {
        return enrolledOnly() ? "/api/inscricoes/minhas" : "/api/cursos";
    }

    @Override protected String kind() {
        return enrolledOnly() ? "inscricoes" : "cursos";
    }

    @Override protected String title() {
        return "Cursos";
    }

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        activeFilter = state == null ? startingFilter()
                : state.getString(SAVED_FILTER, startingFilter());
        if (!isValidFilter(activeFilter) || requiresEnrollments(activeFilter) != enrolledOnly()) {
            activeFilter = startingFilter();
        }

        search = findViewById(R.id.courseSearch);
        sectionTitle = findViewById(R.id.coursesSectionTitle);
        courseCount = findViewById(R.id.coursesCount);

        chipKeys = new String[]{FILTER_ALL, FILTER_ENROLLED, FILTER_TECH,
                FILTER_CAREER, FILTER_COMPLETED};
        chips = new View[]{findViewById(R.id.courseTabTodos),
                findViewById(R.id.courseTabInscritos),
                findViewById(R.id.courseTabTecnologia),
                findViewById(R.id.courseTabCarreira),
                findViewById(R.id.courseTabConcluidos)};

        for (int i = 0; i < chips.length; i++) {
            final String filter = chipKeys[i];
            chips[i].setOnClickListener(v -> chooseFilter(filter));
        }

        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) { }
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { }
            @Override public void afterTextChanged(Editable s) { showFilteredRecords(); }
        });

        findViewById(R.id.courseFilterButton).setOnClickListener(this::showFilterMenu);
        updateFilterAppearance();
        showFilteredRecords();
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        out.putString(SAVED_FILTER, activeFilter);
        super.onSaveInstanceState(out);
    }

    private void showFilterMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        menu.getMenu().add("Todos").setOnMenuItemClickListener(item -> chooseMenuFilter(FILTER_ALL));
        menu.getMenu().add("Inscritos").setOnMenuItemClickListener(item -> chooseMenuFilter(FILTER_ENROLLED));
        menu.getMenu().add("Tecnologia").setOnMenuItemClickListener(item -> chooseMenuFilter(FILTER_TECH));
        menu.getMenu().add("Carreira").setOnMenuItemClickListener(item -> chooseMenuFilter(FILTER_CAREER));
        menu.getMenu().add("Concluídos").setOnMenuItemClickListener(item -> chooseMenuFilter(FILTER_COMPLETED));
        menu.getMenu().add("Atualizar dados").setOnMenuItemClickListener(item -> {
            findViewById(R.id.dataRetry).performClick();
            return true;
        });
        menu.getMenu().add("Sair da conta").setOnMenuItemClickListener(item -> {
            findViewById(R.id.dataLogout).performClick();
            return true;
        });
        menu.show();
    }

    private boolean chooseMenuFilter(String filter) {
        chooseFilter(filter);
        return true;
    }

    private void chooseFilter(String filter) {
        if (requiresEnrollments(filter) != enrolledOnly()) {
            // Preserva a abordagem existente: outra Activity para trocar a rota.
            Intent intent = new Intent(this, CursosActivity.class)
                    .putExtra(EXTRA_FILTER, filter)
                    .putExtra("somente_inscritos", requiresEnrollments(filter));
            startActivity(intent);
            finish(); // Evita empilhar filtros na pilha de navegação.
            return;
        }
        activeFilter = filter;
        updateFilterAppearance();
        showFilteredRecords();
    }

    private void updateFilterAppearance() {
        if (chips == null || activeFilter == null) return;
        final int primary = Color.rgb(114, 20, 250);
        final int text = Color.rgb(102, 96, 120);
        for (int i = 0; i < chips.length; i++) {
            boolean selected = activeFilter.equals(chipKeys[i]);
            TextView chip = (TextView) chips[i];
            GradientDrawable shape = new GradientDrawable();
            shape.setColor(selected ? primary : Color.WHITE);
            shape.setCornerRadius(dp(26));
            if (!selected) shape.setStroke(dp(1), Color.rgb(234, 229, 242));
            chip.setBackground(shape);
            chip.setTextColor(selected ? Color.WHITE : text);
            chip.setTypeface(null, selected ? Typeface.BOLD : Typeface.NORMAL);
            chip.setSelected(selected);
        }
        String header;
        switch (activeFilter) {
            case FILTER_ENROLLED: header = "Meus cursos"; break;
            case FILTER_COMPLETED: header = "Concluídos"; break;
            case FILTER_TECH: header = "Tecnologia"; break;
            case FILTER_CAREER: header = "Carreira"; break;
            default: header = "Cursos disponíveis"; break;
        }
        sectionTitle.setText(header);
    }

    @Override protected void render(JSONArray data) throws Exception {
        records = data;
        showFilteredRecords();
    }

    @Override protected void handleRefreshFailure(int httpStatus) {
        super.handleRefreshFailure(httpStatus);
        // Não permitir que a busca reapresente registros após falha de autorização.
        if (httpStatus >= 400 && httpStatus < 500) {
            records = new JSONArray();
            if (items != null) items.removeAllViews();
            if (courseCount != null) courseCount.setText("0 cursos");
        }
    }

    private void showFilteredRecords() {
        if (items == null || courseCount == null || activeFilter == null) return;
        items.removeAllViews();
        final String needle = normalize(search == null ? "" : search.getText().toString());
        int visible = 0;
        for (int i = 0; i < records.length(); i++) {
            JSONObject record = records.optJSONObject(i);
            if (record == null || !matchesFilter(record, needle)) continue;
            items.addView(createCourseCard(record));
            visible++;
        }
        courseCount.setText(String.format(Locale.getDefault(), "%d %s",
                visible, visible == 1 ? "curso" : "cursos"));
        if (visible == 0) {
            TextView empty = new TextView(this);
            empty.setText(records.length() == 0
                    ? "Ainda não há cursos para mostrar. Atualize para verificar novidades."
                    : "Nenhum curso corresponde ao filtro selecionado.");
            empty.setTextSize(14);
            empty.setTextColor(Color.rgb(102, 96, 120));
            empty.setPadding(dp(14), dp(20), dp(14), dp(20));
            items.addView(empty);
        }
    }

    private boolean matchesFilter(JSONObject record, String needle) {
        String text = normalize(record.optString("titulo", "") + " "
                + record.optString("descricao", "") + " "
                + record.optString("modalidade", "") + " "
                + record.optString("categoria", ""));
        if (!needle.isEmpty() && !text.contains(needle)) return false;
        if (FILTER_COMPLETED.equals(activeFilter))
            return "concluido".equals(normalize(record.optString("status", "")));
        if (FILTER_TECH.equals(activeFilter) || FILTER_CAREER.equals(activeFilter)) {
            String category = normalize(record.optString("categoria", ""));
            return category.contains(activeFilter);
        }
        return true;
    }

    private View createCourseCard(JSONObject record) {
        View card = LayoutInflater.from(this).inflate(R.layout.item_curso_visual, items, false);
        TextView name = card.findViewById(R.id.courseItemTitle);
        TextView metadata = card.findViewById(R.id.courseItemMeta);
        TextView badge = card.findViewById(R.id.courseItemBadge);
        ImageView icon = card.findViewById(R.id.courseItemIcon);
        View tile = card.findViewById(R.id.courseItemTile);
        ProgressBar progress = card.findViewById(R.id.courseItemProgress);

        String courseName = record.optString("titulo", "Curso");
        name.setText(courseName);
        int hours = record.optInt("carga_horaria_horas", 0);
        StringBuilder meta = new StringBuilder();
        if (hours > 0) meta.append(hours).append(" horas");
        String mode = record.optString("modalidade", "");
        if (!mode.isEmpty() && !"null".equalsIgnoreCase(mode)) {
            if (meta.length() > 0) meta.append(" · ");
            meta.append(capitalize(mode));
        }
        // Inscrições retornam somente carga horária: não inventar local ou modalidade.
        if (meta.length() == 0) meta.append("Detalhes disponíveis ao abrir o curso");
        metadata.setText(meta);

        String state = normalize(record.optString("status", ""));
        boolean done = enrolledOnly() && "concluido".equals(state);
        String label = statusLabel(state);
        if (!enrolledOnly() && ("ativo".equals(state) || "publicado".equals(state))
                && record.has("vagas_disponiveis")
                && !record.isNull("vagas_disponiveis")
                && record.optInt("vagas_disponiveis", 1) <= 0) {
            label = "Sem vagas";
        }
        badge.setText(label);
        int badgeBg = done ? Color.rgb(236, 248, 229)
                : enrolledOnly() ? Color.rgb(244, 237, 255)
                : Color.rgb(255, 246, 220);
        int badgeText = done ? Color.rgb(35, 104, 38)
                : enrolledOnly() ? Color.rgb(114, 20, 250)
                : Color.rgb(137, 94, 9);
        badge.setTextColor(badgeText);
        badge.setBackground(roundRect(badgeBg, dp(14)));

        String category = normalize(record.optString("categoria", ""));
        int tileBg = Color.rgb(255, 243, 213);
        int iconTint = Color.rgb(177, 123, 8);
        int iconId = R.drawable.ic_menu_book;
        if (done) {
            tileBg = Color.rgb(254, 236, 244);
            iconTint = Color.rgb(205, 64, 122);
            iconId = R.drawable.course_ic_document;
        } else if (category.contains("tecnologia")) {
            tileBg = Color.rgb(230, 246, 226);
            iconTint = Color.rgb(53, 160, 39);
            iconId = R.drawable.course_ic_laptop;
        } else if (category.contains("carreira")) {
            tileBg = Color.rgb(240, 228, 255);
            iconTint = Color.rgb(114, 20, 250);
            iconId = R.drawable.course_ic_briefcase;
        }
        tile.setBackground(roundRect(tileBg, dp(19)));
        icon.setImageResource(iconId);
        icon.setImageTintList(ColorStateList.valueOf(iconTint));

        // A API desta branch NÃO informa percentual de progresso.
        // Exibimos 100% apenas quando o status real da inscrição é "concluido".
        progress.setVisibility(done ? View.VISIBLE : View.GONE);
        if (done) progress.setProgress(100);

        card.setContentDescription(courseName + ". " + metadata.getText() + ". " + label);
        card.setOnClickListener(view -> select(record)); // preserva detalhes e acesso à Agenda.
        return card;
    }

    private String statusLabel(String state) {
        if (enrolledOnly()) {
            switch (state) {
                case "inscrito": return "Inscrito";
                case "cursando": return "Em andamento";
                case "concluido": return "Concluído";
                case "cancelado": return "Cancelado";
                default: return "Inscrição: " + (state.isEmpty() ? "não informada" : state);
            }
        }
        switch (state) {
            case "ativo":
            case "publicado": return "Disponível";
            case "planejado": return "Planejado";
            case "encerrado": return "Encerrado";
            case "cancelado": return "Indisponível";
            default: return state.isEmpty() ? "Informações" : capitalize(state);
        }
    }

    private static String normalize(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT).trim();
    }

    private static String capitalize(String value) {
        return value.isEmpty() ? value : value.substring(0, 1).toUpperCase(Locale.ROOT)
                + value.substring(1);
    }

    private static GradientDrawable roundRect(int color, float radius) {
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(color);
        shape.setCornerRadius(radius);
        return shape;
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
