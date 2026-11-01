package com.example.projetopi;

import android.net.Uri;
public class AgendaActivity extends DataListActivity {
    @Override protected String route() {
        String course=getIntent().getStringExtra("curso_id");
        return "/api/agenda"+(course==null?"":"?curso_id="+Uri.encode(course));
    }
    @Override protected String kind() { return "agenda"; }
    @Override protected String title() { return "Minha agenda"; }
}
