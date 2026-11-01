package com.example.projetopi;

import android.net.Uri;
public class AgendaActivity extends DataListActivity {
    @Override protected void onCreate(android.os.Bundle state) {
        super.onCreate(state);
        android.widget.Button history=new android.widget.Button(this);
        history.setText("Historico de presenca");
        history.setOnClickListener(v->startActivity(new android.content.Intent(this,HistoricoActivity.class)));
        ((android.widget.LinearLayout)findViewById(R.id.dataActions)).addView(history);
    }
    @Override protected String route() {
        String course=getIntent().getStringExtra("curso_id");
        return "/api/agenda"+(course==null?"":"?curso_id="+Uri.encode(course));
    }
    @Override protected String kind() { return "agenda"; }
    @Override protected String title() { return "Minha agenda"; }
}
