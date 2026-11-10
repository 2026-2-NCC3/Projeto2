package com.example.projetopi;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.util.AttributeSet;
import android.view.Gravity;
import android.view.View;
import android.widget.GridLayout;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.constraintlayout.widget.ConstraintSet;
import android.widget.TextView;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;

/** Grade mensal reutilizável, acessível e com preview no editor sem XML duplicado. */
public class AgendaCalendarGrid extends GridLayout {
    public interface DaySelectionListener {
        void onDaySelected(int day);
    }

    private static final Locale PT_BR = new Locale("pt", "BR");
    private static final String[] HEADINGS = {"D", "S", "T", "Q", "Q", "S", "S"};

    public AgendaCalendarGrid(Context context, AttributeSet attributes) {
        super(context, attributes);
        setColumnCount(7);
    }

    @Override
    protected void onFinishInflate() {
        super.onFinishInflate();
        if (isInEditMode()) {
            // Dados somente da prévia; a Activity fornece os valores reais na execução.
            Calendar preview = Calendar.getInstance();
            preview.set(2024, Calendar.OCTOBER, 1);
            render(preview, 25, Collections.emptySet(), day -> { });
        }
    }

    public void render(Calendar displayedMonth, int selectedDay, Set<Integer> eventDays,
                       DaySelectionListener listener) {
        removeAllViews();
        Calendar first = (Calendar) displayedMonth.clone();
        first.set(Calendar.DAY_OF_MONTH, 1);
        int offset = first.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY;
        int totalDays = first.getActualMaximum(Calendar.DAY_OF_MONTH);
        int weeks = (offset + totalDays + 6) / 7;
        setRowCount(weeks + 1);

        for (int col = 0; col < 7; col++) {
            TextView heading = label(HEADINGS[col]);
            heading.setTextSize(12);
            heading.setTextColor(getResources().getColor(R.color.texto_secundario, getContext().getTheme()));
            addCell(heading, 0, col, dp(42));
        }

        for (int index = 0; index < weeks * 7; index++) {
            int day = index + 1 - offset;
            int row = 1 + index / 7;
            int col = index % 7;
            View cell = day < 1 || day > totalDays ? new View(getContext())
                    : dayCell(day, displayedMonth, day == selectedDay,
                              eventDays.contains(day), listener);
            addCell(cell, row, col, dp(54));
        }
    }

    private void addCell(View child, int row, int col, int height) {
        GridLayout.LayoutParams params = new GridLayout.LayoutParams(
                GridLayout.spec(row), GridLayout.spec(col, 1f));
        params.width = 0;
        params.height = height;
        params.setGravity(Gravity.FILL_HORIZONTAL | Gravity.CENTER_VERTICAL);
        addView(child, params);
    }

    private View dayCell(int day, Calendar month, boolean selected, boolean marked,
                         DaySelectionListener listener) {
        // Células de calendário montadas com constraints, com ConstraintLayout.
        ConstraintLayout cell = new ConstraintLayout(getContext());
        cell.setClickable(true);
        cell.setFocusable(true);
        cell.setContentDescription("Dia " + day + " de "
                + new SimpleDateFormat("MMMM yyyy", PT_BR).format(month.getTime())
                + (marked ? ", com encontros" : ""));

        TextView number = label(Integer.toString(day));
        number.setId(View.generateViewId());
        if (selected) {
            number.setBackgroundResource(R.drawable.agenda_dia_selecionado);
            number.setTextColor(Color.WHITE);
            number.setElevation(dp(3));
        } else if (marked) {
            number.setBackgroundResource(R.drawable.agenda_dia_evento);
        }

        View marker = new View(getContext());
        marker.setId(View.generateViewId());
        if (marked) {
            GradientDrawable dot = new GradientDrawable();
            dot.setShape(GradientDrawable.OVAL);
            dot.setColor(selected ? Color.WHITE : getResources().getColor(
                    R.color.acao_primaria, getContext().getTheme()));
            marker.setBackground(dot);
        } else {
            marker.setVisibility(View.INVISIBLE);
        }

        ConstraintLayout.LayoutParams numberSize = new ConstraintLayout.LayoutParams(
                0, dp(39));
        numberSize.setMarginStart(dp(2));
        numberSize.setMarginEnd(dp(2));
        numberSize.startToStart = ConstraintSet.PARENT_ID;
        numberSize.endToEnd = ConstraintSet.PARENT_ID;
        numberSize.topToTop = ConstraintSet.PARENT_ID;
        numberSize.bottomToTop = marker.getId();
        numberSize.verticalChainStyle = ConstraintSet.CHAIN_PACKED;
        cell.addView(number, numberSize);

        ConstraintLayout.LayoutParams markerSize = new ConstraintLayout.LayoutParams(dp(4), dp(4));
        markerSize.topMargin = dp(3);
        markerSize.topToBottom = number.getId();
        markerSize.bottomToBottom = ConstraintSet.PARENT_ID;
        markerSize.startToStart = ConstraintSet.PARENT_ID;
        markerSize.endToEnd = ConstraintSet.PARENT_ID;
        cell.addView(marker, markerSize);
        cell.setOnClickListener(view -> listener.onDaySelected(day));
        return cell;
    }

    private TextView label(String label) {
        TextView view = new TextView(getContext());
        view.setText(label);
        view.setTextSize(13);
        view.setTextColor(getResources().getColor(R.color.texto_primario, getContext().getTheme()));
        view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        view.setGravity(Gravity.CENTER);
        return view;
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
