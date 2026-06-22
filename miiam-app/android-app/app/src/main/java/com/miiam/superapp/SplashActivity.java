package com.miiam.superapp;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Full screen
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(0xFFBA001C);
        getWindow().setNavigationBarColor(0xFFBA001C);

        // Build splash screen programmatically
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(0xFFBA001C);
        root.setPadding(dp(48), dp(48), dp(48), dp(48));

        // M icon
        TextView mIcon = new TextView(this);
        mIcon.setText("M");
        mIcon.setTextSize(72);
        mIcon.setTextColor(0xFFFFFFFF);
        mIcon.setGravity(Gravity.CENTER);
        mIcon.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        root.addView(mIcon);

        // App name
        TextView appName = new TextView(this);
        appName.setText("MIIAM");
        appName.setTextSize(32);
        appName.setTextColor(0xFFFFFFFF);
        appName.setGravity(Gravity.CENTER);
        appName.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        LinearLayout.LayoutParams nameParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        nameParams.topMargin = dp(16);
        root.addView(appName, nameParams);

        // Tagline
        TextView tagline = new TextView(this);
        tagline.setText("Your Super App");
        tagline.setTextSize(14);
        tagline.setTextColor(0xCCFFFFFF);
        tagline.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tagParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        tagParams.topMargin = dp(8);
        root.addView(tagline, tagParams);

        // Loading indicator
        ProgressBar spinner = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        spinner.setMax(100);
        spinner.setIndeterminate(true);
        LinearLayout.LayoutParams spinParams = new LinearLayout.LayoutParams(dp(120), dp(4));
        spinParams.topMargin = dp(48);
        root.addView(spinner, spinParams);

        setContentView(root);

        // Navigate to MainActivity after 1.5s
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent intent = new Intent(SplashActivity.this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            finish();
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        }, 1500);
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
    }
}
