package com.example.projetopi;

public class HistoricoActivity extends DataListActivity {
    @Override
    protected String route() {
        return "/api/presencas/minhas";
    }

    @Override
    protected String kind() {
        return "historico";
    }

    @Override
    protected String title() {
        return "Meu historico de presenca";
    }
}
