package com.example.projetopi;

public final class ApiConfig {

    private ApiConfig() {
    }

    // 10.0.2.2 é o endereço do computador host visto pelo emulador Android.
    public static final String BASE_URL = "http://10.0.2.2:3000";

    public static final String LOGIN_URL = BASE_URL + "/auth/login";
    public static final String PROFILES_URL = BASE_URL + "/api/profiles";
    public static final String UNIVERSIDADES_URL = BASE_URL + "/api/universidades";
    public static final String CURSOS_URL = BASE_URL + "/api/cursos";
}
