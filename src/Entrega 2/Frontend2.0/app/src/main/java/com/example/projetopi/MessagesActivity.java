package com.example.projetopi;

import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.appcompat.app.AlertDialog;
import androidx.core.view.ViewCompat;
import com.android.volley.Request;
import org.json.JSONArray;
import org.json.JSONObject;

public class MessagesActivity extends DataListActivity {
    private JSONArray displayed = new JSONArray();
    private int readGeneration;
    private AlertDialog openedMessage;
    private String openedId;

    @Override protected String route() { return "/api/mensagens/minhas"; }
    @Override protected String kind() { return "mensagens"; }
    @Override protected String title() { return getString(R.string.messages_title); }
    @Override protected int layoutResource() { return R.layout.activity_messages; }

    @Override protected void configureNavigation() {
        ViewCompat.setAccessibilityHeading(findViewById(R.id.dataTitle), true);
        findViewById(R.id.messageBack).setOnClickListener(view -> finish());
        findViewById(R.id.dataRetry).setOnClickListener(view -> refresh());
    }

    @Override protected void render(JSONArray records) throws Exception {
        displayed = records;
        if (openedMessage != null && openedMessage.isShowing()) {
            boolean stillAuthorized = false;
            for (int index = 0; index < records.length(); index++) {
                if (records.getJSONObject(index).getString("id").equals(openedId)) stillAuthorized = true;
            }
            if (!stillAuthorized) openedMessage.dismiss();
        }
        items.removeAllViews();
        int unread = 0;
        for (int index = 0; index < records.length(); index++) {
            JSONObject message = records.getJSONObject(index);
            boolean isUnread = message.isNull("lido_em");
            if (isUnread) unread++;
            View card = LayoutInflater.from(this).inflate(R.layout.item_message, items, false);
            ((TextView) card.findViewById(R.id.messageTitle)).setText(message.getString("titulo"));
            ((TextView) card.findViewById(R.id.messagePreview)).setText(message.getString("corpo"));
            ((TextView) card.findViewById(R.id.messageOrigin)).setText(
                    getString(R.string.message_origin_date, message.getString("origem"), message.getString("enviado_em")));
            ((TextView) card.findViewById(R.id.messageReadState)).setText(
                    isUnread ? R.string.message_unread : R.string.message_read);
            card.setOnClickListener(view -> open(message));
            items.addView(card);
        }
        ((TextView) findViewById(R.id.messageTotal)).setText(
                getResources().getQuantityString(R.plurals.messages_unread_count, unread, unread));
        findViewById(R.id.messageEmpty).setVisibility(records.length() == 0 ? View.VISIBLE : View.GONE);
    }

    private void open(JSONObject message) {
        if (!session.active()) { toLogin(); return; }
        TextView content = new TextView(this);
        content.setId(R.id.messageFullBody);
        content.setTextSize(16);
        int padding = Math.round(20 * getResources().getDisplayMetrics().density);
        content.setPadding(padding, padding, padding, padding);
        content.setText(getString(R.string.message_detail, message.optString("origem"),
                message.optString("enviado_em"), message.optString("corpo")));
        ScrollView scroll = new ScrollView(this);
        scroll.addView(content);
        openedId = message.optString("id");
        openedMessage = new AlertDialog.Builder(this).setTitle(message.optString("titulo"))
                .setView(scroll).setPositiveButton(android.R.string.ok, null).create();
        openedMessage.show();
        if (message.isNull("lido_em")) confirmRead(message.optString("id"));
    }

    private JSONArray replace(String id, JSONObject updated) throws Exception {
        JSONArray records = new JSONArray();
        for (int index = 0; index < displayed.length(); index++) {
            JSONObject current = displayed.getJSONObject(index);
            if (!id.equals(current.getString("id"))) records.put(current);
            else if (updated != null) records.put(updated);
        }
        return records;
    }

    private void confirmRead(String id) {
        final String version = session.version();
        final int requestGeneration = ++readGeneration;
        api.request(this, "/api/mensagens/" + Uri.encode(id) + "/leitura", Request.Method.PUT,
                new JSONObject(), session.token(), new ApiClient.Callback() {
                    private boolean current() {
                        if (readGeneration != requestGeneration || !version.equals(session.version()) || isFinishing()) return false;
                        if (!session.active()) {
                            if (openedMessage != null) openedMessage.dismiss();
                            toLogin();
                            return false;
                        }
                        return true;
                    }
                    @Override public void success(String body) {
                        if (!current()) return;
                        try {
                            JSONObject confirmed = ApiRecords.parse("[" + body + "]", kind()).getJSONObject(0);
                            if (!id.equals(confirmed.getString("id")) || confirmed.isNull("lido_em")) {
                                throw new IllegalStateException("Leitura nao confirmada");
                            }
                            applyMutationSnapshot(replace(id, confirmed).toString());
                            refresh();
                        } catch (Exception error) {
                            status.setText(R.string.message_read_unconfirmed);
                        }
                    }
                    @Override public void failure(int code) {
                        if (!current()) return;
                        if (code == 401) {
                            session.clear();
                            if (openedMessage != null) openedMessage.dismiss();
                            toLogin();
                        } else if (code == 403 || code == 404) {
                            if (openedMessage != null) openedMessage.dismiss();
                            try { applyMutationSnapshot(replace(id, null).toString()); }
                            catch (Exception ignored) { }
                            refresh();
                        } else {
                            status.setText(R.string.message_read_unconfirmed);
                        }
                    }
                });
    }

    @Override protected void handleRefreshFailure(int httpStatus) {
        if (httpStatus == 401 || httpStatus == 403 || httpStatus == 404) {
            displayed = new JSONArray();
            if (openedMessage != null) openedMessage.dismiss();
        }
        super.handleRefreshFailure(httpStatus);
    }

    @Override protected void onStop() {
        readGeneration++;
        if (openedMessage != null) openedMessage.dismiss();
        super.onStop();
    }
}
