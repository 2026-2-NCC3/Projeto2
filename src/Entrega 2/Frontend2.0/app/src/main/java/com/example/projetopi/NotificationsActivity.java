package com.example.projetopi;

import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.RadioGroup;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.appcompat.app.AlertDialog;
import androidx.core.view.ViewCompat;
import com.android.volley.Request;
import org.json.JSONArray;
import org.json.JSONObject;

public class NotificationsActivity extends DataListActivity {
    private static final long REFRESH_INTERVAL_MS = 30000;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Object readTag = new Object();
    private final Object detailTag = new Object();
    private final Runnable poll = new Runnable() {
        @Override public void run() {
            if (session.active() && !isFinishing()) refresh();
            handler.postDelayed(this, REFRESH_INTERVAL_MS);
        }
    };
    private JSONArray displayed = new JSONArray();
    private AlertDialog dialog;
    private String openedId;
    private boolean onlyUnread;
    private int operationGeneration;

    @Override protected String route() { return NotificationContract.ROUTE; }
    @Override protected String kind() { return NotificationContract.KIND; }
    @Override protected String title() { return getString(R.string.notifications_title); }
    @Override protected int layoutResource() { return R.layout.activity_notifications; }
    @Override protected int refreshMethod() { return Request.Method.POST; }
    @Override protected JSONObject refreshBody() { return new JSONObject(); }

    @Override protected void configureNavigation() {
        ViewCompat.setAccessibilityHeading(findViewById(R.id.dataTitle), true);
        findViewById(R.id.messageBack).setOnClickListener(view -> finish());
        findViewById(R.id.dataRetry).setOnClickListener(view -> refresh());
        ((RadioGroup) findViewById(R.id.notificationFilters)).setOnCheckedChangeListener((group, checked) -> {
            onlyUnread = checked == R.id.notificationsUnread;
            try { render(displayed); } catch (Exception error) { status.setText(R.string.notifications_invalid); }
        });
    }

    @Override protected void render(JSONArray records) throws Exception {
        displayed = records;
        items.removeAllViews();
        boolean openedStillAuthorized = false;
        for (int index = 0; index < records.length(); index++) {
            JSONObject notification = records.getJSONObject(index);
            if (notification.getString("id").equals(openedId)) openedStillAuthorized = true;
            if (onlyUnread && notification.getInt("lida") == 1) continue;
            View card = LayoutInflater.from(this).inflate(R.layout.item_message, items, false);
            card.setTag(notification.getString("id"));
            ((TextView) card.findViewById(R.id.messageTitle)).setText(notification.getString("titulo"));
            ((TextView) card.findViewById(R.id.messagePreview)).setText(notification.getString("corpo"));
            ((TextView) card.findViewById(R.id.messageOrigin)).setText(
                    getString(R.string.message_origin_date, getString(R.string.notifications_origin), notification.getString("criado_em")));
            ((TextView) card.findViewById(R.id.messageReadState)).setText(
                    notification.getInt("lida") == 0 ? R.string.message_unread : R.string.message_read);
            card.setOnClickListener(view -> open(notification));
            items.addView(card);
        }
        if (!openedStillAuthorized && dialog != null && dialog.isShowing()) {
            operationGeneration++;
            api.cancel(readTag);
            api.cancel(detailTag);
            dialog.dismiss();
        }
        int unread = NotificationContract.unread(records);
        ((TextView) findViewById(R.id.messageTotal)).setText(
                getResources().getQuantityString(R.plurals.notifications_unread_count, unread, unread));
        findViewById(R.id.messageEmpty).setVisibility(items.getChildCount() == 0 ? View.VISIBLE : View.GONE);
    }

    private void open(JSONObject notification) {
        if (!session.active()) { toLogin(); return; }
        operationGeneration++;
        api.cancel(readTag);
        api.cancel(detailTag);
        if (dialog != null) dialog.dismiss();
        openedId = notification.optString("id");
        TextView content = new TextView(this);
        content.setId(R.id.notificationFullBody);
        content.setTextSize(16);
        int padding = Math.round(20 * getResources().getDisplayMetrics().density);
        content.setPadding(padding, padding, padding, padding);
        content.setText(getString(R.string.message_detail, getString(R.string.notifications_origin),
                notification.optString("criado_em"), notification.optString("corpo")));
        ScrollView scroll = new ScrollView(this);
        scroll.addView(content);
        AlertDialog.Builder builder = new AlertDialog.Builder(this).setTitle(notification.optString("titulo"))
                .setView(scroll).setNegativeButton(android.R.string.ok, null);
        if (!notification.isNull("destino")) builder.setPositiveButton(R.string.notification_open, null);
        dialog = builder.create();
        dialog.show();
        if (!notification.isNull("destino")) dialog.getButton(AlertDialog.BUTTON_POSITIVE)
                .setOnClickListener(view -> requestNotification(notification.optString("id"), false));
        if (notification.optInt("lida") == 0) requestNotification(notification.optString("id"), true);
    }

    private boolean current(int generation, String version) {
        if (generation != operationGeneration || !version.equals(session.version()) || isFinishing()) return false;
        if (!session.active()) { if (dialog != null) dialog.dismiss(); toLogin(); return false; }
        return true;
    }

    private JSONArray replace(String id, JSONObject updated) throws Exception {
        JSONArray result = new JSONArray();
        for (int index = 0; index < displayed.length(); index++) {
            JSONObject notification = displayed.getJSONObject(index);
            if (!id.equals(notification.getString("id"))) result.put(notification);
            else if (updated != null) result.put(updated);
        }
        return result;
    }

    private void requestNotification(String id, boolean markRead) {
        final int generation = operationGeneration;
        final String version = session.version();
        Object tag = markRead ? readTag : detailTag;
        api.cancel(tag);
        String path = "/api/notificacoes/" + Uri.encode(id) + (markRead ? "/leitura" : "");
        api.request(tag, path, markRead ? Request.Method.PUT : Request.Method.GET,
                markRead ? new JSONObject() : null, session.token(), new ApiClient.Callback() {
                    @Override public void success(String response) {
                        if (!current(generation, version)) return;
                        try {
                            JSONObject confirmed = ApiRecords.parse("[" + response + "]", kind()).getJSONObject(0);
                            if (!id.equals(confirmed.getString("id")) || (markRead && confirmed.getInt("lida") != 1)) {
                                throw new IllegalStateException("Resposta nao confirmada");
                            }
                            if (markRead) {
                                applyMutationSnapshot(replace(id, confirmed).toString());
                                refresh();
                            } else {
                                Intent target = NotificationNavigator.intent(NotificationsActivity.this, confirmed);
                                if (target != null) startActivity(target);
                            }
                        } catch (Exception error) { status.setText(R.string.notifications_invalid); }
                    }
                    @Override public void failure(int code) {
                        if (!current(generation, version)) return;
                        if (code == 401) {
                            session.clear();
                            if (dialog != null) dialog.dismiss();
                            toLogin();
                        } else if (code == 403 || code == 404) {
                            if (dialog != null) dialog.dismiss();
                            try { applyMutationSnapshot(replace(id, null).toString()); } catch (Exception ignored) { }
                            refresh();
                        } else status.setText(markRead ? R.string.notification_read_unconfirmed : R.string.notification_open_offline);
                    }
                });
    }

    @Override protected void handleRefreshFailure(int code) {
        if (code == 401 || code == 403 || code == 404) {
            operationGeneration++;
            displayed = new JSONArray();
            if (dialog != null) dialog.dismiss();
            try { render(displayed); } catch (Exception ignored) { }
        }
        super.handleRefreshFailure(code);
    }

    @Override protected void onStart() {
        super.onStart();
        handler.postDelayed(poll, REFRESH_INTERVAL_MS);
    }

    @Override protected void onStop() {
        handler.removeCallbacks(poll);
        operationGeneration++;
        if (dialog != null) dialog.dismiss();
        api.cancel(readTag);
        api.cancel(detailTag);
        super.onStop();
    }
}
