package com.example.projetopi;

public final class ApiConfig {
    private ApiConfig() {
    }

    // Com adb reverse ativo, 127.0.0.1 do emulador é encaminhado ao PC.
    public static final String BASE_URL = "http://127.0.0.1:3000";
    public static final String PROFILES_URL = BASE_URL + "/api/profiles";
}
