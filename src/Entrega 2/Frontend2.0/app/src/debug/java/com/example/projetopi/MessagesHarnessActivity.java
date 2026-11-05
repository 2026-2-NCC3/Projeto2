package com.example.projetopi;

/** Reutiliza o ambiente isolado debug de testes, sem acessar a sessao real do aluno. */
public class MessagesHarnessActivity extends MessagesActivity {
    private LocalStudentStore isolatedStore;
    @Override protected LocalStudentStore createStore() {
        isolatedStore = CertificatesHarnessActivity.isolatedStore(this);
        return isolatedStore;
    }
    @Override protected SessionManager createSession(LocalStudentStore store) {
        return new SessionManager(CertificatesHarnessActivity.isolatedContext(this), store);
    }
    @Override protected void onDestroy() {
        super.onDestroy();
        if (isolatedStore != null) isolatedStore.close();
    }
}
