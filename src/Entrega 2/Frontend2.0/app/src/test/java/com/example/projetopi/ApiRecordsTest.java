package com.example.projetopi;
import org.junit.Test;
import org.json.JSONException;
import org.json.JSONArray;
import com.example.projetopi.model.Curso;
import static org.junit.Assert.*;
public class ApiRecordsTest {
    @Test public void coursesAllowNullableDescriptionAndZeroHours() throws Exception {
        JSONArray data=ApiRecords.parse("[{\"id\":\"c1\",\"titulo\":\"Curso real\",\"descricao\":null,\"carga_horaria_horas\":0}]","cursos");
        assertEquals("c1",data.getJSONObject(0).getString("id"));
        Curso model=new Curso("c1","Curso real",null,0);
        assertEquals("",model.getDescricao()); assertEquals(0,model.getCargaHoraria());
    }
    @Test public void emptyListIsValid() throws Exception {assertEquals(0,ApiRecords.parse("[]","agenda").length());}
    @Test(expected=JSONException.class) public void invalidResponseRejected() throws Exception {ApiRecords.parse("{\"erro\":\"falha\"}","agenda");}
    @Test(expected=JSONException.class) public void missingIdentityRejected() throws Exception {ApiRecords.parse("[{\"titulo\":\"Curso\",\"carga_horaria_horas\":1}]","cursos");}
    @Test(expected=JSONException.class) public void duplicateIdentityRejected() throws Exception {ApiRecords.parse("[{\"id\":\"c1\",\"titulo\":\"Curso\",\"carga_horaria_horas\":1},{\"id\":\"c1\",\"titulo\":\"Curso\",\"carga_horaria_horas\":1}]","cursos");}
}
