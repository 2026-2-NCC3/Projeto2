package com.example.projetopi;

import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.TextView;
import com.android.volley.Request;
import org.json.JSONArray;
import org.json.JSONObject;

/** Atualiza somente em primeiro plano; nao e um servico de push ou de segundo plano. */
public final class NotificationBadgeController {
    private static final long REFRESH_INTERVAL_MS = 30000;
    private final SessionManager session;
    private final LocalStudentStore store;
    private final ApiClient api;
    private final TextView badge;
    private final View button;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean running;
    private int generation;
    private final Runnable poll = new Runnable() {
        @Override public void run() {
            if (!running) return;
            refresh();
            handler.postDelayed(this, REFRESH_INTERVAL_MS);
        }
    };

    public NotificationBadgeController(SessionManager session, LocalStudentStore store, ApiClient api,
                                       TextView badge, View button) {
        this.session = session;
        this.store = store;
        this.api = api;
        this.badge = badge;
        this.button = button;
    }

    private String key() { return ApiConfig.BASE_URL + NotificationContract.ROUTE; }

    private void show(JSONArray records, boolean saved) {
        try {
            int unread = NotificationContract.unread(records);
            badge.setText(String.valueOf(unread));
            badge.setVisibility(unread > 0 ? View.VISIBLE : View.GONE);
            button.setContentDescription(button.getContext().getResources().getQuantityString(
                    saved ? R.plurals.notifications_badge_saved : R.plurals.notifications_badge_current, unread, unread));
        } catch (Exception error) { hide(); }
    }

    private void hide() {
        badge.setVisibility(View.GONE);
        button.setContentDescription(button.getContext().getString(R.string.notifications_title));
    }

    private void saved() {
        try {
            SnapshotStore.Snapshot snapshot = store.read(session.userId(), key(), NotificationContract.KIND);
            if (snapshot != null) show(snapshot.data, true);
            else hide();
        } catch (RuntimeException error) { hide(); }
    }

    private void refresh() {
        if (!session.active()) { hide(); return; }
        int requestGeneration = generation;
        String version = session.version();
        String userId = session.userId();
        api.request(this, NotificationContract.ROUTE, Request.Method.POST, new JSONObject(), session.token(), new ApiClient.Callback() {
            private boolean current() { return running && requestGeneration == generation && version.equals(session.version()) && session.active(); }
            @Override public void success(String body) {
                if (!current()) { hide(); return; }
                try {
                    JSONArray records = ApiRecords.parse(body, NotificationContract.KIND);
                    store.save(userId, key(), NotificationContract.KIND, records.toString(), System.currentTimeMillis(), -1);
                    show(records, false);
                } catch (Exception error) { saved(); }
            }
            @Override public void failure(int code) {
                if (!current()) { hide(); return; }
                if (code == 401 || code == 403) {
                    try { store.clear(userId); } catch (RuntimeException ignored) { }
                    if (code == 401) session.clear();
                    hide();
                } else saved();
            }
        });
    }

    public void start() {
        generation++;
        running = true;
        if (session.active()) saved(); else hide();
        handler.removeCallbacks(poll);
        handler.post(poll);
    }

    public void stop() {
        generation++;
        running = false;
        handler.removeCallbacks(poll);
        api.cancel(this);
    }
}
