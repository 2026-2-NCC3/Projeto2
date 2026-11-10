package com.example.projetopi;

/**
 * RFM06/07/15: reconcilia pela API somente dados do aluno da sessao atual.
 * Pendencias persistem sem guardar QR e sem produzir presencas offline.
 */
public final class PresenceSynchronizer {
    public interface Transport {
        void history(String token, ApiClient.Callback callback);
        void cancel();
    }

    private final SessionManager session;
    private final LocalStudentStore store;
    private final Transport transport;
    private final String origin;
    private SyncGate.Ticket ticket;
    private int generation;

    public PresenceSynchronizer(SessionManager session, LocalStudentStore store, ApiClient api) {
        this(session, store, new Transport() {
            private final Object tag = new Object();
            @Override public void history(String token, ApiClient.Callback callback) {
                api.request(tag, "/api/presencas/minhas", com.android.volley.Request.Method.GET,
                        null, token, callback);
            }
            @Override public void cancel() { api.cancel(tag); }
        }, ApiConfig.BASE_URL);
    }

    PresenceSynchronizer(SessionManager session, LocalStudentStore store, Transport transport, String origin) {
        this.session = session;
        this.store = store;
        this.transport = transport;
        this.origin = origin;
    }

    public void start(Runnable completed) {
        if (!session.active() || ticket != null) return;
        final String owner = session.userId();
        final String version = session.version();
        final long requestedRevision;
        try {
            requestedRevision = store.historyRevision(owner, origin);
        } catch (RuntimeException error) {
            return;
        }
        if (requestedRevision == 0) return;
        final SyncGate.Ticket requestTicket = SyncGate.GLOBAL.begin(version, origin + "/api/presencas/minhas");
        if (requestTicket == null) return;
        ticket = requestTicket;
        final int requestGeneration = ++generation;
        transport.history(session.token(), new ApiClient.Callback() {
            private boolean current() {
                if (generation != requestGeneration || !version.equals(session.version()) || !session.active()) {
                    SyncGate.GLOBAL.finish(requestTicket);
                    if (ticket == requestTicket) ticket = null;
                    return false;
                }
                return true;
            }
            private void finish() {
                SyncGate.GLOBAL.finish(requestTicket);
                ticket = null;
                if (completed != null) completed.run();
            }
            @Override public void success(String body) {
                if (!current()) return;
                try {
                    store.save(owner, origin + "/api/presencas/minhas", "historico",
                            body, System.currentTimeMillis(), requestedRevision);
                } catch (Exception error) {
                    // Resposta incompleta ou falha de escrita deixa a pendencia para nova consulta.
                } finally {
                    finish();
                }
            }
            @Override public void failure(int status) {
                if (!current()) return;
                if (status == 401) session.clear();
                if (status == 403) {
                    try { store.clear(owner); } catch (RuntimeException ignored) { }
                }
                finish();
            }
        });
    }

    public void cancel() {
        generation++;
        transport.cancel();
        SyncGate.GLOBAL.finish(ticket);
        ticket = null;
    }
}
