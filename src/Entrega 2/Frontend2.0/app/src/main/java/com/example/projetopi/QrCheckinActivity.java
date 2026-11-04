package com.example.projetopi;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.android.volley.Request;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.ResultPoint;
import com.journeyapps.barcodescanner.BarcodeCallback;
import com.journeyapps.barcodescanner.BarcodeResult;
import com.journeyapps.barcodescanner.CameraPreview;
import com.journeyapps.barcodescanner.DecoratedBarcodeView;
import com.journeyapps.barcodescanner.DefaultDecoderFactory;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collections;
import java.util.List;

public class QrCheckinActivity extends AppCompatActivity {
    private SessionManager session;
    private ApiClient api;
    private String openingSessionVersion;
    private DecoratedBarcodeView scanner;
    private TextView status;
    private Button scanButton;
    private View settingsButton;
    private View progress;
    private boolean resumed;
    private boolean scanning;
    private boolean sending;
    private boolean scanAfterPermission;
    private int generation;

    private final ActivityResultLauncher<String> cameraPermission = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(), granted -> {
                if (granted) {
                    scanAfterPermission = true;
                    if (resumed) {
                        startScanning();
                    }
                } else {
                    status.setText(R.string.checkin_camera_denied);
                    settingsButton.setVisibility(View.VISIBLE);
                }
            });

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        setContentView(R.layout.activity_qr_checkin);
        session = new SessionManager(this);
        openingSessionVersion = session.version();
        api = new ApiClient(this);
        scanner = findViewById(R.id.checkinScanner);
        status = findViewById(R.id.checkinStatus);
        scanButton = findViewById(R.id.checkinScan);
        settingsButton = findViewById(R.id.checkinSettings);
        progress = findViewById(R.id.checkinProgress);
        scanner.setStatusText("");
        scanner.getBarcodeView().setDecoderFactory(
                new DefaultDecoderFactory(Collections.singletonList(BarcodeFormat.QR_CODE)));
        scanner.getBarcodeView().addStateListener(new CameraPreview.StateListener() {
            @Override public void previewSized() { }
            @Override public void previewStarted() { }
            @Override public void previewStopped() { }
            @Override public void cameraClosed() { }
            @Override public void cameraError(Exception error) {
                if (resumed) {
                    stopCamera();
                    scanButton.setEnabled(true);
                    status.setText(R.string.checkin_camera_unavailable);
                }
            }
        });
        scanButton.setOnClickListener(view -> requestCamera());
        settingsButton.setOnClickListener(view -> startActivity(new Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))));
        findViewById(R.id.checkinHistory).setOnClickListener(view ->
                startActivity(new Intent(this, HistoricoActivity.class)));
        findViewById(R.id.checkinClose).setOnClickListener(view -> finish());
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        if (!ensureSession()) {
            return;
        }
        if (scanAfterPermission) {
            startScanning();
        }
    }

    @Override
    protected void onPause() {
        resumed = false;
        generation++;
        api.cancel(this);
        boolean interrupted = scanning || sending;
        stopCamera();
        sending = false;
        progress.setVisibility(View.GONE);
        scanButton.setEnabled(true);
        if (interrupted) {
            status.setText(R.string.checkin_interrupted);
        }
        super.onPause();
    }

    private boolean ensureSession() {
        if (session.active() && openingSessionVersion.equals(session.version())) {
            return true;
        }
        startActivity(new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
        finish();
        return false;
    }

    private void requestCamera() {
        if (sending || !ensureSession()) {
            return;
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            startScanning();
        } else if (shouldShowRequestPermissionRationale(Manifest.permission.CAMERA)) {
            new AlertDialog.Builder(this)
                    .setMessage(R.string.checkin_camera_reason)
                    .setPositiveButton(R.string.checkin_permission_allow,
                            (dialog, which) -> cameraPermission.launch(Manifest.permission.CAMERA))
                    .setNegativeButton(R.string.checkin_permission_later, null)
                    .show();
        } else {
            cameraPermission.launch(Manifest.permission.CAMERA);
        }
    }

    private void startScanning() {
        scanAfterPermission = false;
        if (!resumed || sending || !ensureSession()) {
            return;
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            status.setText(R.string.checkin_camera_denied);
            settingsButton.setVisibility(View.VISIBLE);
            return;
        }
        settingsButton.setVisibility(View.GONE);
        scanning = true;
        scanButton.setEnabled(false);
        status.setText(R.string.checkin_scanning);
        scanner.setVisibility(View.VISIBLE);
        scanner.decodeSingle(new BarcodeCallback() {
            @Override public void barcodeResult(BarcodeResult result) {
                if (!resumed || !scanning || sending) {
                    return;
                }
                stopCamera();
                try {
                    sendCheckin(CheckinContract.requestBody(result.getText()));
                } catch (JSONException error) {
                    status.setText(R.string.checkin_bad_format);
                    scanButton.setEnabled(true);
                }
            }
            @Override public void possibleResultPoints(List<ResultPoint> points) { }
        });
        try {
            scanner.resume();
        } catch (RuntimeException error) {
            stopCamera();
            scanButton.setEnabled(true);
            status.setText(R.string.checkin_camera_unavailable);
        }
    }

    private void stopCamera() {
        scanning = false;
        scanner.getBarcodeView().stopDecoding();
        scanner.pause();
        scanner.setVisibility(View.GONE);
    }

    private void sendCheckin(JSONObject body) {
        if (!ensureSession()) {
            return;
        }
        sending = true;
        scanButton.setEnabled(false);
        progress.setVisibility(View.VISIBLE);
        status.setText(R.string.checkin_sending);
        final int requestGeneration = ++generation;
        final String sessionVersion = session.version();
        api.requestWithStatus(this, "/api/presencas/check-in", Request.Method.POST, body,
                session.token(), new ApiClient.StatusCallback() {
                    @Override public void success(int httpStatus, String responseBody) {
                        if (!acceptResponse(requestGeneration, sessionVersion)) {
                            return;
                        }
                        CheckinContract.Result result = CheckinContract.result(httpStatus, responseBody);
                        if (result == CheckinContract.Result.CONFIRMED) {
                            status.setText(R.string.checkin_confirmed);
                        } else if (result == CheckinContract.Result.ALREADY_RECORDED) {
                            status.setText(R.string.checkin_duplicate);
                        } else {
                            status.setText(R.string.checkin_uncertain);
                        }
                    }
                    @Override public void failure(int httpStatus) {
                        if (!acceptResponse(requestGeneration, sessionVersion)) {
                            return;
                        }
                        if (httpStatus == 401) {
                            session.clear();
                            ensureSession();
                        } else if (httpStatus == 400) {
                            status.setText(R.string.checkin_invalid);
                        } else if (httpStatus == 403) {
                            status.setText(R.string.checkin_forbidden);
                        } else if (httpStatus == 0) {
                            status.setText(R.string.checkin_network);
                        } else {
                            status.setText(R.string.checkin_uncertain);
                        }
                    }
                });
    }

    private boolean acceptResponse(int requestGeneration, String sessionVersion) {
        if (!resumed || generation != requestGeneration || !sessionVersion.equals(session.version())) {
            return false;
        }
        if (!ensureSession()) {
            return false;
        }
        sending = false;
        progress.setVisibility(View.GONE);
        scanButton.setEnabled(true);
        return true;
    }
}
