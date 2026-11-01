package com.example.projetopi;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import com.android.volley.Request;
import org.json.JSONArray;
import org.json.JSONObject;

public abstract class DataListActivity extends AppCompatActivity {
    protected SessionManager session;
    protected ApiClient api;
    protected LinearLayout items;
    protected TextView status;
    private boolean loading;
    private int generation;
    protected abstract String route();
    protected abstract String kind();
    protected abstract String title();
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_data_list);
        session=new SessionManager(this); api=new ApiClient(this);
        items=findViewById(R.id.dataItems); status=findViewById(R.id.dataStatus);
        ((TextView)findViewById(R.id.dataTitle)).setText(title());
        findViewById(R.id.dataRetry).setOnClickListener(v->refresh());
        findViewById(R.id.dataLogout).setOnClickListener(v->{session.clear();toLogin();});
        findViewById(R.id.navInicio).setOnClickListener(v->startActivity(new Intent(this,TelaInicial.class)));
        findViewById(R.id.navCursos).setOnClickListener(v->startActivity(new Intent(this,CursosActivity.class)));
        findViewById(R.id.navAgenda).setOnClickListener(v->startActivity(new Intent(this,AgendaActivity.class)));
        findViewById(R.id.navPerfil).setOnClickListener(v->startActivity(new Intent(this,CarteirinhaActivity.class)));
    }
    @Override protected void onStart() { super.onStart(); if(!session.active()) toLogin(); else refresh(); }
    @Override protected void onStop() { generation++; loading=false; api.cancel(this); super.onStop(); }
    protected void toLogin() {
        startActivity(new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK)); finish();
    }
    protected void refresh() {
        if(loading) return;
        loading=true;
        final int requestGeneration=++generation;
        final String version=session.version();
        status.setText("Carregando..."); findViewById(R.id.dataProgress).setVisibility(View.VISIBLE);
        api.request(this,route(),Request.Method.GET,null,session.token(),new ApiClient.Callback() {
            private boolean current() { return generation==requestGeneration && version.equals(session.version()) && !isFinishing(); }
            public void success(String body) {
                if(!current()) return;
                done();
                try { JSONArray data=ApiRecords.parse(body,kind()); render(data); status.setText(data.length()==0?"Nenhum registro encontrado.":"Dados atualizados pela API."); }
                catch(Exception error) { status.setText("Resposta invalida. Tente novamente."); items.removeAllViews(); }
            }
            public void failure(int code) {
                if(!current()) return;
                done();
                if(code==401) {session.clear();toLogin();return;}
                status.setText(code==403?"Acesso nao autorizado.":"Nao foi possivel carregar. Verifique a conexao e tente novamente.");
            }
            private void done() { loading=false; findViewById(R.id.dataProgress).setVisibility(View.GONE); }
        });
    }
    protected void render(JSONArray data) throws Exception {
        items.removeAllViews();
        for(int i=0;i<data.length();i++) {
            JSONObject item=data.getJSONObject(i);
            TextView card=new TextView(this);
            card.setText(item.getString("titulo")+"\n"+details(item));
            card.setTextSize(17); card.setPadding(24,24,24,24);
            card.setBackgroundResource(R.drawable.bg_card_branco);
            LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,-2); params.setMargins(0,0,0,20);
            card.setLayoutParams(params); card.setOnClickListener(v->select(item)); items.addView(card);
        }
    }
    protected String details(JSONObject item) {
        if(kind().equals("cursos")) return item.optInt("carga_horaria_horas")+"h • "+item.optString("modalidade","")+"\n"+item.optString("data_inicio","");
        if(kind().equals("historico")) return "Presenca confirmada pelo servidor • "+item.optString("metodo","")+"\n"+item.optString("checkin_em","");
        return item.optString("data","")+" • "+item.optString("hora_inicio","")+" - "+item.optString("hora_fim","")+" (horario da ONG)\n"+item.optString("curso_titulo","");
    }
    protected void select(JSONObject item) {
        if(!kind().equals("cursos")) {new AlertDialog.Builder(this).setTitle(item.optString("titulo")).setMessage(details(item)+"\n"+item.optString("local","")).setPositiveButton("Fechar",null).show();return;}
        new AlertDialog.Builder(this).setTitle(item.optString("titulo"))
          .setMessage(item.optString("descricao", "")+"\n"+details(item))
          .setPositiveButton("Minha agenda",(d,w)->startActivity(new Intent(this,AgendaActivity.class).putExtra("curso_id",item.optString("id"))))
          .setNegativeButton("Fechar",null).show();
    }
}
