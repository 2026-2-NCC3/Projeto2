package com.example.projetopi;

public class CursosActivity extends DataListActivity {
    @Override
    protected String route() {
        return "/api/cursos";
    }

    @Override
    protected String kind() {
        return "cursos";
    }

    @Override
    protected String title() {
        return "Cursos";
    }
}
