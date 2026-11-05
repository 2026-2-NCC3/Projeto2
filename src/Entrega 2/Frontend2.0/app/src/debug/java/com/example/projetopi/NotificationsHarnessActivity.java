package com.example.projetopi;

/** Sessao e SQLite isolados de quaisquer dados reais do aplicativo. Somente debug. */
public class NotificationsHarnessActivity extends NotificationsActivity {
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
