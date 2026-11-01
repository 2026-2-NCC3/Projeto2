package com.example.projetopi;

import java.util.HashMap;
import java.util.Map;

/** Coordena requisicoes da mesma sessao e recurso; respostas antigas nao podem aplicar. */
public final class SyncGate {
    public static final SyncGate GLOBAL = new SyncGate();

    public static final class Ticket {
        final String requestKey;
        final String sessionVersion;

        Ticket(String requestKey, String sessionVersion) {
            this.requestKey = requestKey;
            this.sessionVersion = sessionVersion;
        }

        public boolean matches(String currentSession) {
            return sessionVersion.equals(currentSession);
        }
    }

    private final Map<String, Ticket> pendingRequests = new HashMap<>();

    public synchronized Ticket begin(String sessionVersion, String resource) {
        String requestKey = sessionVersion + "\n" + resource;
        if (pendingRequests.containsKey(requestKey)) {
            return null;
        }
        Ticket ticket = new Ticket(requestKey, sessionVersion);
        pendingRequests.put(requestKey, ticket);
        return ticket;
    }

    public synchronized void finish(Ticket ticket) {
        if (ticket != null && pendingRequests.get(ticket.requestKey) == ticket) {
            pendingRequests.remove(ticket.requestKey);
        }
    }
}
