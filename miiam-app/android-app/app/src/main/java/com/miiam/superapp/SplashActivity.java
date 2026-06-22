package com.miiam.superapp;

import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(0xFFBA001C);
        getWindow().setNavigationBarColor(0xFFBA001C);

        // Root: red background, centered content
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(0xFFBA001C);

        // White circle with M letter
        View circle = new View(this) {
            @Override
            protected void onDraw(Canvas canvas) {
                super.onDraw(canvas);
                float cx = getWidth() / 2f;
                float cy = getHeight() / 2f;
                float radius = Math.min(cx, cy);

                // White circle
                Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                bgPaint.setColor(0xFFFFFFFF);
                canvas.drawCircle(cx, cy, radius, bgPaint);

                // Red M letter
                Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                textPaint.setColor(0xFFBA001C);
                textPaint.setTextSize(radius * 1.1f);
                textPaint.setTextAlign(Paint.Align.CENTER);
                textPaint.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
                Paint.FontMetrics fm = textPaint.getFontMetrics();
                float yOffset = (fm.ascent + fm.descent) / 2f;
                canvas.drawText("M", cx, cy - yOffset, textPaint);
            }
        };

        int circleSize = (int) (getResources().getDisplayMetrics().density * 100);
        LinearLayout.LayoutParams circleParams = new LinearLayout.LayoutParams(circleSize, circleSize);
        root.addView(circle, circleParams);

        // "MIIAM" text below circle
        TextView appName = new TextView(this);
        appName.setText("MIIAM");
        appName.setTextSize(24);
        appName.setTextColor(0xFFFFFFFF);
        appName.setGravity(Gravity.CENTER);
        appName.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        LinearLayout.LayoutParams nameParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        nameParams.topMargin = (int) (getResources().getDisplayMetrics().density * 24);
        root.addView(appName, nameParams);

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
}
