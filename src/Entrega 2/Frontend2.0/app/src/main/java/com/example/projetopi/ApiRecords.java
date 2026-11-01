package com.example.projetopi;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.Set;

public final class ApiRecords {
    private ApiRecords() {}
    public static JSONArray parse(String body, String kind) throws JSONException {
        JSONArray array=new JSONArray(body);
        Set<String> ids=new HashSet<>();
        for(int i=0;i<array.length();i++) {
            JSONObject item=array.getJSONObject(i);
            String id=text(item,"id"), title=text(item,"titulo");
            if(!ids.add(id)) throw new JSONException("Identificador duplicado");
            if(kind.equals("cursos")) {
                Object hours=item.get("carga_horaria_horas");
                if(!(hours instanceof Number) || ((Number)hours).intValue()<0) throw new JSONException("Carga horaria invalida");
            } else if(kind.equals("agenda") || kind.equals("historico")) {
                if(kind.equals("historico")) {text(item,"checkin_em");text(item,"atividade_id");}
                text(item,"curso_id"); text(item,"data"); text(item,"hora_inicio"); text(item,"hora_fim");
            }
        }
        return array;
    }
    private static String text(JSONObject item,String field) throws JSONException {
        Object value=item.get(field);
        if(!(value instanceof String) || ((String)value).trim().isEmpty()) throw new JSONException("Campo invalido");
        return (String)value;
    }
}
