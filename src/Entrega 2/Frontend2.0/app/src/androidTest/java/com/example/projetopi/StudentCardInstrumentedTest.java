package com.example.projetopi;

import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import android.view.View;
import android.widget.TextView;
import java.io.File;
import java.util.Arrays;
import java.util.HashSet;
import java.util.concurrent.atomic.AtomicReference;
import androidx.lifecycle.Lifecycle;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class StudentCardInstrumentedTest {
    private SessionManager session;
    private Instrumentation instrumentation;
    private Instrumentation.ActivityMonitor login;

    @Before public void setup() {
        instrumentation = InstrumentationRegistry.getInstrumentation();
        Context context = instrumentation.getTargetContext();
        session = new SessionManager(CertificatesHarnessActivity.isolatedContext(context));
        session.clear();
        login = instrumentation.addMonitor(MainActivity.class.getName(), null, true);
    }

    @After public void cleanup() {
        session.clear();
        instrumentation.removeMonitor(login);
    }

    @Test public void cardUsesCurrentIdentityWithoutInventingInstitutionalData() throws Exception {
        session.save(PresenceSynchronizerInstrumentedTest.login("aluno-card-ficticio"));
        try (ActivityScenario<StudentCardHarnessActivity> screen = ActivityScenario.launch(StudentCardHarnessActivity.class)) {
            screen.onActivity(activity -> {
                assertEquals("Teste ficticio", ((TextView) activity.findViewById(R.id.txtNomeAluno)).getText().toString());
                assertEquals(activity.getString(R.string.student_card_id, "aluno-card-ficticio"),
                        ((TextView) activity.findViewById(R.id.txtRA)).getText().toString());
                assertEquals(View.GONE, activity.findViewById(R.id.imgQrCode).getVisibility());
                assertEquals(activity.getString(R.string.student_card_validity_unavailable),
                        ((TextView) activity.findViewById(R.id.txtValidade)).getText().toString());
            });
        }
    }

    @Test public void logoutWhileStoppedPreventsReturningToPrivateCard() throws Exception {
        session.save(PresenceSynchronizerInstrumentedTest.login("aluno-card-ficticio"));
        try (ActivityScenario<StudentCardHarnessActivity> screen = ActivityScenario.launch(StudentCardHarnessActivity.class)) {
            AtomicReference<StudentCardHarnessActivity> previous = new AtomicReference<>();
            screen.onActivity(previous::set);
            screen.moveToState(Lifecycle.State.CREATED);
            session.clear();
            // O card deve finalizar no onStart, antes de chegar a RESUMED.
            instrumentation.runOnMainSync(() -> instrumentation.callActivityOnStart(previous.get()));
            instrumentation.waitForIdleSync();
            assertEquals(1, login.getHits());
            assertTrue(previous.get().isFinishing());
            assertEquals("", ((TextView) previous.get().findViewById(R.id.txtNomeAluno)).getText().toString());
        }
    }

    @Test public void shareCreatesReadablePdfBeforeOpeningChooser() throws Exception {
        session.save(PresenceSynchronizerInstrumentedTest.login("aluno-card-ficticio"));
        File directory = new File(instrumentation.getTargetContext().getCacheDir(), "student-card");
        String[] previous = directory.list();
        HashSet<String> existing = new HashSet<>();
        if (previous != null) existing.addAll(Arrays.asList(previous));
        Instrumentation.ActivityMonitor chooser = instrumentation.addMonitor(
                new IntentFilter(Intent.ACTION_CHOOSER), null, true);
        try (ActivityScenario<StudentCardHarnessActivity> screen = ActivityScenario.launch(StudentCardHarnessActivity.class)) {
            screen.onActivity(activity -> activity.findViewById(R.id.btnCompartilhar).performClick());
            assertEquals(1, chooser.getHits());
            File[] exports = directory.listFiles(file -> !existing.contains(file.getName()));
            assertNotNull(exports);
            assertEquals(1, exports.length);
            try (ParcelFileDescriptor input = ParcelFileDescriptor.open(exports[0], ParcelFileDescriptor.MODE_READ_ONLY);
                 PdfRenderer pdf = new PdfRenderer(input)) {
                assertEquals(1, pdf.getPageCount());
            } finally {
                exports[0].delete();
            }
        } finally {
            instrumentation.removeMonitor(chooser);
        }
    }

    @Test public void changedAccountCannotReusePreviousCard() throws Exception {
        session.save(PresenceSynchronizerInstrumentedTest.login("aluno-card-a"));
        try (ActivityScenario<StudentCardHarnessActivity> screen = ActivityScenario.launch(StudentCardHarnessActivity.class)) {
            AtomicReference<StudentCardHarnessActivity> previous = new AtomicReference<>();
            screen.onActivity(previous::set);
            screen.moveToState(Lifecycle.State.CREATED);
            session.save(PresenceSynchronizerInstrumentedTest.login("aluno-card-b"));
            // O card deve finalizar no onStart, antes de chegar a RESUMED.
            instrumentation.runOnMainSync(() -> instrumentation.callActivityOnStart(previous.get()));
            instrumentation.waitForIdleSync();
            assertEquals(1, login.getHits());
            assertTrue(previous.get().isFinishing());
            assertEquals("", ((TextView) previous.get().findViewById(R.id.txtNomeAluno)).getText().toString());
        }
    }
}
