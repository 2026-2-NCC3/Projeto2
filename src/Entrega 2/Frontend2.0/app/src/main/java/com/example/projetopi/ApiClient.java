package com.example.projetopi;

import android.content.Context;

import com.android.volley.DefaultRetryPolicy;
import com.android.volley.NetworkResponse;
import com.android.volley.Response;
import com.android.volley.toolbox.StringRequest;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public final class ApiClient {
    private static final int REQUEST_TIMEOUT_MS = 10000;
    private static final int AUTOMATIC_RETRIES = 0;
    private static final float BACKOFF_MULTIPLIER = 1;
    private static final int NO_HTTP_RESPONSE = 0;

    public interface Callback {
        void success(String body);
        void failure(int status);
    }

    public interface StatusCallback {
        void success(int status, String body);
        void failure(int status);
    }

    private final Context context;

    public ApiClient(Context context) {
        this.context = context.getApplicationContext();
    }

    public void request(Object tag, String route, int method, JSONObject body,
                        String token, Callback callback) {
        requestWithStatus(tag, route, method, body, token, new StatusCallback() {
            @Override
            public void success(int status, String responseBody) {
                callback.success(responseBody);
            }

            @Override
            public void failure(int status) {
                callback.failure(status);
            }
        });
    }

    public void requestWithStatus(Object tag, String route, int method, JSONObject body,
                                  String token, StatusCallback callback) {
        final int[] responseStatus = {NO_HTTP_RESPONSE};
        StringRequest request = new StringRequest(
                method,
                ApiConfig.BASE_URL + route,
                responseBody -> callback.success(responseStatus[0], responseBody),
                error -> {
                    int httpStatus = error.networkResponse == null
                            ? NO_HTTP_RESPONSE
                            : error.networkResponse.statusCode;
                    callback.failure(httpStatus);
                }) {
            @Override
            protected Response<String> parseNetworkResponse(NetworkResponse response) {
                responseStatus[0] = response.statusCode;
                return super.parseNetworkResponse(response);
            }

            @Override
            public Map<String, String> getHeaders() {
                Map<String, String> headers = new HashMap<>();
                headers.put("Accept", "application/json");
                if (!token.isEmpty()) {
                    headers.put("Authorization", "Bearer " + token);
                }
                return headers;
            }

            @Override
            public String getBodyContentType() {
                return "application/json; charset=UTF-8";
            }

            @Override
            public byte[] getBody() {
                if (body == null) {
                    return null;
                }
                return body.toString().getBytes(StandardCharsets.UTF_8);
            }
        };
        request.setTag(tag);
        // Dados pessoais nao entram no cache global do Volley.
        request.setShouldCache(false);
        request.setRetryPolicy(new DefaultRetryPolicy(
                REQUEST_TIMEOUT_MS, AUTOMATIC_RETRIES, BACKOFF_MULTIPLIER));
        VolleySingleton.getInstance(context).addToRequestQueue(request);
    }

    public void cancel(Object tag) {
        VolleySingleton.getInstance(context).getRequestQueue().cancelAll(tag);
    }
}
