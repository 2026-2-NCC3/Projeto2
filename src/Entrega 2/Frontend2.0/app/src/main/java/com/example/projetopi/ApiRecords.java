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
        JSONArray clean=new JSONArray();
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
            JSONObject safe=new JSONObject();
            String[] allowed=kind.equals("cursos")
                ? new String[]{"id","titulo","descricao","carga_horaria_horas","modalidade","data_inicio","data_fim","vagas_disponiveis","status","universidade_id"}
                : new String[]{"id","titulo","curso_id","curso_titulo","data","hora_inicio","hora_fim","local","link_online","inscricao_id","atividade_id","checkin_em","metodo"};
            for(String field:allowed) if(item.has(field)) safe.put(field,item.get(field));
            clean.put(safe);
        }
        return clean;
    }
    private static String text(JSONObject item,String field) throws JSONException {
        Object value=item.get(field);
        if(!(value instanceof String) || ((String)value).trim().isEmpty()) throw new JSONException("Campo invalido");
        return (String)value;
    }
}
