package com.example.projetopi;

import android.content.Context;
import com.android.volley.Request;
import com.android.volley.DefaultRetryPolicy;
import com.android.volley.toolbox.StringRequest;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public final class ApiClient {
    public interface Callback { void success(String body); void failure(int status); }
    private final Context context;
    public ApiClient(Context context) { this.context=context.getApplicationContext(); }
    public void request(Object tag, String route, int method, JSONObject body, String token, Callback callback) {
        StringRequest request=new StringRequest(method,ApiConfig.BASE_URL+route,callback::success,error ->
            callback.failure(error.networkResponse==null?0:error.networkResponse.statusCode)) {
            @Override public Map<String,String> getHeaders() {
                Map<String,String> headers=new HashMap<>();
                headers.put("Accept","application/json");
                if(!token.isEmpty()) headers.put("Authorization","Bearer "+token);
                return headers;
            }
            @Override public String getBodyContentType() { return "application/json; charset=UTF-8"; }
            @Override public byte[] getBody() { return body==null?null:body.toString().getBytes(StandardCharsets.UTF_8); }
        };
        request.setTag(tag);
        request.setShouldCache(false); // Dados pessoais nao entram no cache global do Volley.
        request.setRetryPolicy(new DefaultRetryPolicy(10000,0,1));
        VolleySingleton.getInstance(context).addToRequestQueue(request);
    }
    public void cancel(Object tag) { VolleySingleton.getInstance(context).getRequestQueue().cancelAll(tag); }
}
