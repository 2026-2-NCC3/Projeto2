package com.example.projetopi;

public final class ApiConfig {

    private ApiConfig() {
    }

    public static final String BASE_URL = BuildConfig.API_BASE_URL;
    public static final String LOGIN_URL = BASE_URL + "/auth/login";
    public static final String PROFILES_URL = BASE_URL + "/api/profiles";
    public static final String UNIVERSIDADES_URL = BASE_URL + "/api/universidades";
    public static final String CURSOS_URL = BASE_URL + "/api/cursos";
}
