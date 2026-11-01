package com.example.projetopi;
import java.util.HashMap;
import java.util.Map;
/** Coordena requisicoes da mesma sessao e recurso; respostas antigas nao podem aplicar. */
public final class SyncGate {
    public static final SyncGate GLOBAL=new SyncGate();
    public static final class Ticket {
        final String key, session;
        Ticket(String key,String session) {this.key=key;this.session=session;}
        public boolean matches(String currentSession) {return session.equals(currentSession);}
    }
    private final Map<String,Ticket> pending=new HashMap<>();
    public synchronized Ticket begin(String session,String resource) {
        String key=session+"\n"+resource;
        if(pending.containsKey(key)) return null;
        Ticket ticket=new Ticket(key,session);pending.put(key,ticket);return ticket;
    }
    public synchronized void finish(Ticket ticket) {if(ticket!=null && pending.get(ticket.key)==ticket) pending.remove(ticket.key);}
}
