package com.example.projetopi;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;

public class CursosActivity extends DataListActivity {
    private boolean enrolledOnly() { return getIntent().getBooleanExtra("somente_inscritos", false); }

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        Button toggle = new Button(this);
        toggle.setText(enrolledOnly() ? R.string.courses_catalog : R.string.courses_enrolled);
        toggle.setAllCaps(false);
        toggle.setOnClickListener(view -> startActivity(new Intent(this, CursosActivity.class)
                .putExtra("somente_inscritos", !enrolledOnly())));
        ((LinearLayout) findViewById(R.id.dataActions)).addView(toggle);
    }

    @Override protected String route() { return enrolledOnly() ? "/api/inscricoes/minhas" : "/api/cursos"; }
    @Override protected String kind() { return enrolledOnly() ? "inscricoes" : "cursos"; }
    @Override protected String title() {
        return getString(enrolledOnly() ? R.string.courses_enrolled : R.string.courses_catalog);
    }
}
