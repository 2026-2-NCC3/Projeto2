package com.example.projetopi;

import android.content.Context;
import android.content.ContextWrapper;
import android.content.SharedPreferences;
import java.io.File;
import java.util.UUID;

/** Componente apenas do APK debug: testes de UI usam dados privados isolados, nunca a sessao do aluno. */
public class CertificatesHarnessActivity extends CertificatesActivity {
    private static final String RUN = "cert-ui-test-" + UUID.randomUUID();
    private LocalStudentStore isolatedStore;

    static Context isolatedContext(Context context) {
        File directory = new File(context.getCacheDir(), RUN);
        if (!directory.isDirectory() && !directory.mkdirs()) {
            throw new IllegalStateException("Diretorio isolado indisponivel");
        }
        return new ContextWrapper(context) {
            @Override public SharedPreferences getSharedPreferences(String name, int mode) {
                return super.getSharedPreferences(RUN + name, mode);
            }
            @Override public File getNoBackupFilesDir() { return directory; }
        };
    }

    static LocalStudentStore isolatedStore(Context context) {
        Context isolated = isolatedContext(context);
        File directory = isolated.getNoBackupFilesDir();
        return new LocalStudentStore(isolated, new File(directory, "fictional.db"), new File(directory, "legacy"));
    }

    @Override protected LocalStudentStore createStore() {
        isolatedStore = isolatedStore(this);
        return isolatedStore;
    }

    @Override protected SessionManager createSession(LocalStudentStore store) {
        return new SessionManager(isolatedContext(this), store);
    }

    @Override protected void onDestroy() {
        super.onDestroy();
        if (isolatedStore != null) isolatedStore.close();
    }
}
