# MIIAM ProGuard Rules

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Keep Material
-keep class com.google.android.material.** { *; }

# Keep WebView
-keep class android.webkit.** { *; }
