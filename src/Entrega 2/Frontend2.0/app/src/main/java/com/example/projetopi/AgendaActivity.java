package com.example.projetopi;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;

public class AgendaActivity extends DataListActivity {
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Button historyButton = new Button(this);
        historyButton.setText("Historico de presenca");
        historyButton.setOnClickListener(view ->
                startActivity(new Intent(this, HistoricoActivity.class)));
        ((LinearLayout) findViewById(R.id.dataActions)).addView(historyButton);
    }

    @Override
    protected String route() {
        String courseId = getIntent().getStringExtra("curso_id");
        if (courseId == null) {
            return "/api/agenda";
        }
        return "/api/agenda" + "?curso_id=" + Uri.encode(courseId);
    }

    @Override
    protected String kind() {
        return "agenda";
    }

    @Override
    protected String title() {
        return "Minha agenda";
    }
}
