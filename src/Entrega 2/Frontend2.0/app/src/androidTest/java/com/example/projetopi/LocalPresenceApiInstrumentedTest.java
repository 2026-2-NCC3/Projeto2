package com.example.projetopi;

import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.android.volley.Request;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import com.google.zxing.qrcode.QRCodeWriter;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Assume;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Executar apenas contra o backend de fixtures temporarias; nunca contra banco real. */
@RunWith(AndroidJUnit4.class)
public class LocalPresenceApiInstrumentedTest {
    private static final class Reply {
        final int status;
        final String body;
        Reply(int status, String body) { this.status = status; this.body = body; }
    }

    private Reply request(ApiClient api, String route, int method, JSONObject body, String token) throws Exception {
        CountDownLatch completed = new CountDownLatch(1);
        AtomicInteger status = new AtomicInteger(-1);
        AtomicReference<String> response = new AtomicReference<>("");
        Object tag = new Object();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
                api.requestWithStatus(tag, route, method, body, token, new ApiClient.StatusCallback() {
                    @Override public void success(int code, String text) {
                        status.set(code); response.set(text); completed.countDown();
                    }
                    @Override public void failure(int code) { status.set(code); completed.countDown(); }
                }));
        try {
            assertTrue("API temporaria deve responder", completed.await(15, TimeUnit.SECONDS));
            return new Reply(status.get(), response.get());
        } finally {
            api.cancel(tag);
        }
    }

    private JSONObject login(ApiClient api, String email) throws Exception {
        Reply reply = request(api, "/auth/login", Request.Method.POST,
                new JSONObject().put("email", email).put("senha", "Ficticio-teste-123!"), "");
        assertEquals(200, reply.status);
        return new JSONObject(reply.body);
    }

    private String utc(long time) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.ROOT);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(new Date(time));
    }

    @Test public void loginCoursesAgendaQrSqliteRecoveryAndHistoryUseRealApi() throws Exception {
        Assume.assumeTrue("Requer fixture temporaria explicitamente autorizada",
                "true".equals(InstrumentationRegistry.getArguments().getString("fixture_api")));
        Context base = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String prefix = "presence-api-test-" + UUID.randomUUID();
        File directory = new File(base.getCacheDir(), prefix);
        assertTrue(directory.mkdirs());
        Context context = PresenceSynchronizerInstrumentedTest.isolatedContext(base, directory, prefix);
        File database = new File(directory, "fictional.db");
        LocalStudentStore store = new LocalStudentStore(context, database, new File(directory, "legacy"));
        SessionManager session = new SessionManager(context, store);
        ApiClient api = new ApiClient(base);
        PresenceSynchronizer sync = null;
        try {
            session.save(login(api, "a1@example.invalid"));
            Reply courses = request(api, "/api/cursos", Request.Method.GET, null, session.token());
            assertEquals(200, courses.status);
            store.save(session.userId(), ApiConfig.BASE_URL + "/api/cursos", "cursos", courses.body, 1, -1);
            assertEquals("c1", new JSONArray(courses.body).getJSONObject(0).getString("id"));
            Reply agenda = request(api, "/api/agenda", Request.Method.GET, null, session.token());
            assertEquals(200, agenda.status);
            assertEquals("at1", new JSONArray(agenda.body).getJSONObject(0).getString("id"));
            store.save(session.userId(), ApiConfig.BASE_URL + "/api/agenda", "agenda", agenda.body, 1, -1);
            String adminToken = login(api, "op@example.invalid").getString("token");
            Reply emission = request(api, "/api/presencas/qr-token", Request.Method.POST,
                    new JSONObject().put("atividade_id", "at1").put("valido_de", utc(System.currentTimeMillis()-60000))
                            .put("valido_ate", utc(System.currentTimeMillis()+600000)), adminToken);
            assertEquals(201, emission.status);
            String token = new JSONObject(emission.body).getString("qr_token");
            BitMatrix qr = new QRCodeWriter().encode(token, BarcodeFormat.QR_CODE, 640, 640);
            int[] pixels = new int[qr.getWidth() * qr.getHeight()];
            for (int y = 0; y < qr.getHeight(); y++) {
                for (int x = 0; x < qr.getWidth(); x++) pixels[y * qr.getWidth()+x] = qr.get(x,y) ? 0xFF000000 : 0xFFFFFFFF;
            }
            String scanned = new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(
                    new RGBLuminanceSource(qr.getWidth(), qr.getHeight(), pixels)))).getText();
            assertTrue(scanned.equals(token));
            store.markHistoryPending(session.userId(), ApiConfig.BASE_URL);
            Reply created = request(api, "/api/presencas/check-in", Request.Method.POST,
                    CheckinContract.requestBody(scanned), session.token());
            assertEquals(201, created.status);
            // Simula a resposta do POST perdida: a API gravou, mas nao aplicamos seu corpo localmente.
            assertEquals(0, store.receipts(session.userId(), ApiConfig.BASE_URL).length());

            PresenceSynchronizerInstrumentedTest.FakeTransport unavailable =
                    new PresenceSynchronizerInstrumentedTest.FakeTransport();
            sync = new PresenceSynchronizer(session, store, unavailable, ApiConfig.BASE_URL);
            sync.start(null);
            unavailable.callback.failure(0);
            assertTrue(store.historyRevision(session.userId(), ApiConfig.BASE_URL) > 0);
            sync.cancel();
            store.close();
            store = new LocalStudentStore(context, database, new File(directory, "legacy"));
            session = new SessionManager(context, store);
            assertTrue(session.active());
            assertEquals(0, store.receipts(session.userId(), ApiConfig.BASE_URL).length());
            assertEquals(1, store.read(session.userId(), ApiConfig.BASE_URL + "/api/agenda", "agenda").data.length());
            CountDownLatch reconciled = new CountDownLatch(1);
            sync = new PresenceSynchronizer(session, store, api);
            PresenceSynchronizer activeSync = sync;
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activeSync.start(reconciled::countDown));
            assertTrue(reconciled.await(15, TimeUnit.SECONDS));
            assertEquals(0, store.historyRevision(session.userId(), ApiConfig.BASE_URL));
            JSONArray history = store.read(session.userId(),
                    ApiConfig.BASE_URL + "/api/presencas/minhas", "historico").data;
            assertEquals(1, history.length());
            assertEquals(new JSONObject(created.body).getString("id"), history.getJSONObject(0).getString("id"));
            Reply duplicate = request(api, "/api/presencas/check-in", Request.Method.POST,
                    CheckinContract.requestBody(scanned), session.token());
            assertEquals(200, duplicate.status);
            store.recordReceipt(session.userId(), ApiConfig.BASE_URL, duplicate.status, duplicate.body);
            assertEquals(1, store.receipts(session.userId(), ApiConfig.BASE_URL).length());
            String anotherToken = login(api, "a2@example.invalid").getString("token");
            Reply otherHistory = request(api, "/api/presencas/minhas", Request.Method.GET, null, anotherToken);
            assertEquals(200, otherHistory.status);
            assertEquals(0, new JSONArray(otherHistory.body).length());
            assertEquals(403, request(api, "/api/presencas/alunos/a1", Request.Method.GET, null, anotherToken).status);
            assertEquals(0, store.receipts("a2", ApiConfig.BASE_URL).length());
        } finally {
            if (sync != null) sync.cancel();
            session.clear();
            store.close();
            context.deleteSharedPreferences(prefix + "sessao_usuario");
        }
    }

    @Test public void dashboardSessionAndAgendaSelectionSurviveRealNavigation() throws Exception {
        Assume.assumeTrue("Requer fixture temporaria explicitamente autorizada",
                "true".equals(InstrumentationRegistry.getArguments().getString("fixture_api")));
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Context context = instrumentation.getTargetContext();
        LocalStudentStore store = LocalStudentStore.get(context);
        SessionManager session = new SessionManager(context, store);
        assertTrue("Use um emulador sem uma conta conectada", session.userId().isEmpty());

        try {
            Instrumentation.ActivityMonitor homeMonitor =
                    instrumentation.addMonitor(TelaInicial.class.getName(), null, false);
            try (ActivityScenario<MainActivity> login = ActivityScenario.launch(MainActivity.class)) {
                login.onActivity(activity -> {
                    ((EditText) activity.findViewById(R.id.editEmail)).setText("a1@example.invalid");
                    ((EditText) activity.findViewById(R.id.editSenha)).setText("Ficticio-teste-123!");
                    activity.findViewById(R.id.btnEntrar).performClick();
                });
                assertNotNull("Login deve abrir o Dashboard",
                        instrumentation.waitForMonitorWithTimeout(homeMonitor, 15000));
            }
            assertTrue(session.active());
            assertEquals("a1", session.userId());

            TelaInicial resumed = (TelaInicial) openAndAwait(instrumentation, context,
                    MainActivity.class, TelaInicial.class);
            AtomicReference<String> nextTitle = new AtomicReference<>("");
            long dashboardDeadline = System.currentTimeMillis() + 15000;
            do {
                instrumentation.runOnMainSync(() -> nextTitle.set(((TextView) resumed
                        .findViewById(R.id.dashboardActivityTitle)).getText().toString()));
                if ("Encontro ficticio de integracao".equals(nextTitle.get())) break;
                Thread.sleep(100);
            } while (System.currentTimeMillis() < dashboardDeadline);
            assertEquals("Encontro ficticio de integracao", nextTitle.get());
            instrumentation.runOnMainSync(() -> {
                assertTrue(((TextView) resumed.findViewById(R.id.txtSaudacao))
                        .getText().toString().contains(session.fullName()));
            });

            Reply onlineAgenda = request(new ApiClient(context), "/api/agenda",
                    Request.Method.GET, null, session.token());
            assertEquals(200, onlineAgenda.status);
            String dateValue = new JSONArray(onlineAgenda.body).getJSONObject(0).getString("data");
            Calendar eventDay = Calendar.getInstance();
            eventDay.setTime(new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).parse(dateValue));
            SimpleDateFormat dayLabel = new SimpleDateFormat("d 'de' MMMM", new Locale("pt", "BR"));
            String initialDay = dayLabel.format(eventDay.getTime());
            int dayToSelect = eventDay.get(Calendar.DAY_OF_MONTH) == 1 ? 2 : 1;
            eventDay.set(Calendar.DAY_OF_MONTH, dayToSelect);
            String selectedDay = dayLabel.format(eventDay.getTime());

            Intent agendaIntent = new Intent(context, AgendaActivity.class)
                    .putExtra("registro_id", "at1");
            try (ActivityScenario<AgendaActivity> agenda = ActivityScenario.launch(agendaIntent)) {
                awaitAgendaStatus(agenda, "Dados atualizados.");
                agenda.onActivity(activity -> {
                    TextView date = activity.findViewById(R.id.txtDataSelecionada);
                    assertEquals(initialDay, date.getText().toString());
                    AgendaCalendarGrid calendar = activity.findViewById(R.id.gradeCalendario);
                    boolean selected = false;
                    for (int index = 0; index < calendar.getChildCount(); index++) {
                        View day = calendar.getChildAt(index);
                        CharSequence description = day.getContentDescription();
                        if (description != null && description.toString().startsWith("Dia " + dayToSelect + " de ")) {
                            selected = day.performClick();
                            break;
                        }
                    }
                    assertTrue(selected);
                    activity.findViewById(R.id.dataRetry).performClick();
                });
                awaitAgendaStatus(agenda, "Dados atualizados.");
                assertSelectedDay(agenda, selectedDay);
                agenda.recreate();
                awaitAgendaStatus(agenda, "Dados atualizados.");
                assertSelectedDay(agenda, selectedDay);
                agenda.onActivity(activity -> activity.findViewById(R.id.btnProximoMes).performClick());
                eventDay.add(Calendar.MONTH, 1);
                eventDay.set(Calendar.DAY_OF_MONTH, 1);
                assertSelectedDay(agenda, dayLabel.format(eventDay.getTime()));
            }
            assertNotNull(store.read("a1", ApiConfig.BASE_URL + "/api/agenda", "agenda"));

            Instrumentation.ActivityMonitor loginMonitor =
                    instrumentation.addMonitor(MainActivity.class.getName(), null, false);
            instrumentation.runOnMainSync(() -> resumed.findViewById(R.id.btnSair).performClick());
            assertNotNull("Sair deve retornar ao Login",
                    instrumentation.waitForMonitorWithTimeout(loginMonitor, 10000));
            assertTrue(session.userId().isEmpty());
            assertNull(store.read("a1", ApiConfig.BASE_URL + "/api/agenda", "agenda"));
            openAndAwait(instrumentation, context, TelaInicial.class, MainActivity.class);
            assertFalse(session.active());
        } finally {
            if ("a1".equals(session.userId())) session.clear();
        }
    }

    @Test public void agendaDisplaysSavedRecordsWhenConnectionFails() throws Exception {
        Assume.assumeTrue("Requer encaminhamento para uma conexao de teste indisponivel",
                "true".equals(InstrumentationRegistry.getArguments().getString("offline_test")));
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        LocalStudentStore store = LocalStudentStore.get(context);
        SessionManager session = new SessionManager(context, store);
        assertTrue("Use um emulador sem uma conta conectada", session.userId().isEmpty());
        String owner = "agenda-offline-fixture";
        try {
            session.save(PresenceSynchronizerInstrumentedTest.login(owner));
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date());
            JSONObject record = new JSONObject().put("id", "fixture")
                    .put("titulo", "Atividade fictícia salva").put("curso_id", "fixture-course")
                    .put("data", today).put("hora_inicio", "10:00").put("hora_fim", "11:00");
            store.save(owner, ApiConfig.BASE_URL + "/api/agenda", "agenda",
                    new JSONArray().put(record).toString(), System.currentTimeMillis(), -1);

            try (ActivityScenario<AgendaActivity> agenda = ActivityScenario.launch(AgendaActivity.class)) {
                awaitAgendaStatus(agenda, "Sem atualizacao online.");
                agenda.onActivity(activity -> assertEquals("Atividade fictícia salva",
                        ((TextView) activity.findViewById(R.id.agendaItemTitulo)).getText().toString()));
            }
        } finally {
            if (owner.equals(session.userId())) session.clear();
        }
    }

    private static android.app.Activity openAndAwait(Instrumentation instrumentation, Context context,
                                                     Class<?> start, Class<?> expected) {
        Instrumentation.ActivityMonitor monitor = instrumentation.addMonitor(expected.getName(), null, false);
        instrumentation.runOnMainSync(() -> context.startActivity(new Intent(context, start)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK)));
        android.app.Activity activity = instrumentation.waitForMonitorWithTimeout(monitor, 15000);
        assertNotNull("Tela esperada: " + expected.getSimpleName(), activity);
        return activity;
    }

    private static void awaitAgendaStatus(ActivityScenario<AgendaActivity> agenda, String expected)
            throws InterruptedException {
        AtomicReference<String> status = new AtomicReference<>("");
        long deadline = System.currentTimeMillis() + 15000;
        do {
            agenda.onActivity(activity -> status.set(((TextView) activity.findViewById(R.id.dataStatus))
                    .getText().toString()));
            if (status.get().startsWith(expected)) return;
            Thread.sleep(100);
        } while (System.currentTimeMillis() < deadline);
        fail("Agenda não atingiu o estado esperado: " + status.get());
    }

    private static void assertSelectedDay(ActivityScenario<AgendaActivity> agenda, String expected) {
        agenda.onActivity(activity -> assertEquals(expected,
                ((TextView) activity.findViewById(R.id.txtDataSelecionada)).getText().toString()));
    }
}
