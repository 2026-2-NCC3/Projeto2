package com.example.projetopi;

/** Sessao e banco privados de testes, sem tocar na conta conectada do aplicativo. */
public class StudentCardHarnessActivity extends CarteirinhaActivity {
    private LocalStudentStore store;

    @Override protected SessionManager createSession() {
        store = CertificatesHarnessActivity.isolatedStore(this);
        return new SessionManager(CertificatesHarnessActivity.isolatedContext(this), store);
    }

    @Override protected void onDestroy() {
        super.onDestroy();
        if (store != null) store.close();
    }
}
