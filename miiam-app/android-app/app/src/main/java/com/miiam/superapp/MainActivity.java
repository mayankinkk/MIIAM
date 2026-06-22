package com.miiam.superapp;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;

import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private ValueCallback<Uri[]> fileChooserCallback;
    private static final int FILE_CHOOSER_REQUEST = 100;
    private static final int PERMISSION_REQUEST_CODE = 200;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(0xFFBA001C);
        getWindow().setNavigationBarColor(0xFFBA001C);

        // Layout
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xFFFFFFFF);

        // Progress bar
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, dpToPx(4));
        progressBar.setLayoutParams(progressParams);
        root.addView(progressBar);

        // Error layout
        errorLayout = createErrorLayout();
        errorLayout.setVisibility(View.GONE);
        root.addView(errorLayout, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT));

        // WebView
        webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT));
        webView.setVisibility(View.GONE);
        root.addView(webView);

        setContentView(root);

        setupWebView();
        requestPermissions();
        setupPushNotifications();
        loadUrl();
    }

    // ─── Permissions ──────────────────────────────────────────────

    private void requestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+
            String[] perms = {
                Manifest.permission.POST_NOTIFICATIONS,
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.READ_MEDIA_IMAGES,
            };
            ActivityCompat.requestPermissions(this, perms, PERMISSION_REQUEST_CODE);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Android 6-12
            String[] perms = {
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
            };
            ActivityCompat.requestPermissions(this, perms, PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        // Permissions handled gracefully — WebView works without them too
    }

    // ─── Push Notifications ──────────────────────────────────────

    private void setupPushNotifications() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    String token = task.getResult();
                    // TODO: Send token to your server
                }
            });
    }

    // ─── WebView Setup ──────────────────────────────────────────

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setGeolocationEnabled(true);

        // User agent
        String ua = settings.getUserAgentString();
        settings.setUserAgentString(ua + " MIIAMApp/1.0");

        // WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(0);
                errorLayout.setVisibility(View.GONE);
                webView.setVisibility(View.GONE);
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress == 100) progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                errorLayout.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request,
                                        WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    webView.setVisibility(View.GONE);
                    errorLayout.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // Let miiam.in load in WebView
                if (url.contains("miiam.in")) return false;

                // External HTTP links → browser
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    return true;
                }

                // tel, mailto, sms
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:")) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    return true;
                }

                // WhatsApp
                if (url.startsWith("whatsapp:")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception ignored) {}
                    return true;
                }

                return false;
            }
        });

        // WebChromeClient
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress == 100) progressBar.setVisibility(View.GONE);
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message,
                                    JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                    .setTitle("MIIAM")
                    .setMessage(message)
                    .setPositiveButton("OK", (d, w) -> result.confirm())
                    .setCancelable(false)
                    .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message,
                                      JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                    .setTitle("MIIAM")
                    .setMessage(message)
                    .setPositiveButton("OK", (d, w) -> result.confirm())
                    .setNegativeButton("Cancel", (d, w) -> result.cancel())
                    .setCancelable(false)
                    .show();
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                    GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public boolean onShowFileChooser(WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    fileChooserCallback = null;
                    return false;
                }
                return true;
            }
        });
    }

    // ─── Share Feature ──────────────────────────────────────────

    private void shareCurrentPage() {
        String url = webView.getUrl();
        if (url == null) url = "https://miiam.in";

        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, "Check out MIIAM");
        shareIntent.putExtra(Intent.EXTRA_TEXT, "Check this out on MIIAM: " + url);
        startActivity(Intent.createChooser(shareIntent, "Share via"));
    }

    // ─── URL Loading ────────────────────────────────────────────

    private void loadUrl() {
        if (isNetworkAvailable()) {
            webView.loadUrl("https://miiam.in");
        } else {
            webView.setVisibility(View.GONE);
            errorLayout.setVisibility(View.VISIBLE);
        }
    }

    private void loadUrl(String url) {
        if (isNetworkAvailable()) {
            webView.loadUrl(url);
        } else {
            webView.setVisibility(View.GONE);
            errorLayout.setVisibility(View.VISIBLE);
        }
    }

    // ─── Error Layout ───────────────────────────────────────────

    private LinearLayout createErrorLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setPadding(dpToPx(32), dpToPx(32), dpToPx(32), dpToPx(32));

        TextView icon = new TextView(this);
        icon.setText("📶");
        icon.setTextSize(48);
        icon.setGravity(Gravity.CENTER);
        layout.addView(icon);

        TextView title = new TextView(this);
        title.setText("No Internet Connection");
        title.setTextSize(20);
        title.setTextColor(0xFF333333);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        tp.topMargin = dpToPx(16);
        layout.addView(title, tp);

        TextView sub = new TextView(this);
        sub.setText("Please check your internet connection and try again.");
        sub.setTextSize(14);
        sub.setTextColor(0xFF666666);
        sub.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        sp.topMargin = dpToPx(8);
        layout.addView(sub, sp);

        TextView retryBtn = new TextView(this);
        retryBtn.setText("RETRY");
        retryBtn.setTextSize(16);
        retryBtn.setTextColor(0xFFFFFFFF);
        retryBtn.setBackgroundColor(0xFFBA001C);
        retryBtn.setPadding(dpToPx(32), dpToPx(12), dpToPx(32), dpToPx(12));
        retryBtn.setGravity(Gravity.CENTER);
        retryBtn.setOnClickListener(v -> loadUrl());
        LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        rp.topMargin = dpToPx(24);
        layout.addView(retryBtn, rp);

        return layout;
    }

    // ─── Helpers ────────────────────────────────────────────────

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkInfo info = cm.getActiveNetworkInfo();
            return info != null && info.isConnected();
        }
        return false;
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    // ─── Lifecycle ──────────────────────────────────────────────

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                .setTitle("Exit MIIAM?")
                .setMessage("Are you sure you want to exit?")
                .setPositiveButton("Yes", (d, w) -> finish())
                .setNegativeButton("No", null)
                .show();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.hasExtra("open_url")) {
            String url = intent.getStringExtra("open_url");
            if (url != null && !url.isEmpty()) {
                loadUrl(url);
            }
        }
        // Handle deep links
        if (intent != null && intent.getData() != null) {
            Uri data = intent.getData();
            if (data.getHost() != null && data.getHost().contains("miiam.in")) {
                loadUrl(data.toString());
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && fileChooserCallback != null) {
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) results = new Uri[]{Uri.parse(dataString)};
            }
            fileChooserCallback.onReceiveValue(results);
            fileChooserCallback = null;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        webView.restoreState(savedInstanceState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
