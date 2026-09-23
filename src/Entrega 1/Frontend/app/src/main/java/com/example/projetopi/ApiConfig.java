package com.example.projetopi;

public final class ApiConfig {

    private ApiConfig() {
    }

    // Com adb reverse ativo, 127.0.0.1 do Android é encaminhado ao computador.
    public static final String BASE_URL = "http://127.0.0.1:3000";

    public static final String LOGIN_URL = BASE_URL + "/auth/login";
    public static final String PROFILES_URL = BASE_URL + "/api/profiles";
    public static final String UNIVERSIDADES_URL = BASE_URL + "/api/universidades";
    public static final String CURSOS_URL = BASE_URL + "/api/cursos";
}