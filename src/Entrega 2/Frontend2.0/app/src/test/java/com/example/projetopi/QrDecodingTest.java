package com.example.projetopi;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import com.google.zxing.qrcode.QRCodeWriter;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class QrDecodingTest {
    @Test public void decodesQrPayloadWithoutChangingToken() throws Exception {
        String fictionalToken = "header.payload.signature";
        BitMatrix qr = new QRCodeWriter().encode(fictionalToken, BarcodeFormat.QR_CODE, 240, 240);
        int[] pixels = new int[qr.getWidth() * qr.getHeight()];
        for (int y = 0; y < qr.getHeight(); y++) {
            for (int x = 0; x < qr.getWidth(); x++) {
                pixels[y * qr.getWidth() + x] = qr.get(x, y) ? 0xFF000000 : 0xFFFFFFFF;
            }
        }
        BinaryBitmap image = new BinaryBitmap(new HybridBinarizer(
                new RGBLuminanceSource(qr.getWidth(), qr.getHeight(), pixels)));
        String decoded = new QRCodeReader().decode(image).getText();
        assertEquals(fictionalToken, CheckinContract.requestBody(decoded).getString("qr_token"));
    }
}
