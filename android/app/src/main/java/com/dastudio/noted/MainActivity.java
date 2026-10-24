package com.dastudio.noted;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null && "noted".equals(data.getScheme())) {
            final String url = data.toString();
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().post(() -> {
                    bridge.getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('capacitor:deep-link', { detail: '" + url + "' }));",
                        null
                    );
                });
            }
        }
    }
}
