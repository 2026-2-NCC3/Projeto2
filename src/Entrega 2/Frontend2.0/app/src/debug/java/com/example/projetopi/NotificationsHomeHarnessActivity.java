package com.example.projetopi;

/** Testa o contador sem substituir a sessao de um aluno real. Somente debug. */
public class NotificationsHomeHarnessActivity extends TelaInicial {
    private LocalStudentStore isolated;
    @Override protected LocalStudentStore createStore() {
        isolated = CertificatesHarnessActivity.isolatedStore(this);
        return isolated;
    }
    @Override protected SessionManager createSession(LocalStudentStore store) {
        return new SessionManager(CertificatesHarnessActivity.isolatedContext(this), store);
    }
    @Override protected void onDestroy() {
        super.onDestroy();
        if (isolated != null) isolated.close();
    }
}
