package com.example.projetopi;

public final class ApiConfig {

    private ApiConfig() {
    }

    // Desenvolvimento local por USB/ADB: adb reverse tcp:3000 tcp:3000.
    // Vale para telefone e emulador; nao depende da rota especial 10.0.2.2.
    public static final String BASE_URL = "http://127.0.0.1:3000";    public static final String LOGIN_URL = BASE_URL + "/auth/login";
    public static final String PROFILES_URL = BASE_URL + "/api/profiles";
    public static final String UNIVERSIDADES_URL = BASE_URL + "/api/universidades";
    public static final String CURSOS_URL = BASE_URL + "/api/cursos";
}
