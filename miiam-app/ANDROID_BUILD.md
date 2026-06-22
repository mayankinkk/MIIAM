# MIIAM Android WebView App

## Native Features

| Feature | Status |
|---------|--------|
| Splash Screen | MIIAM branded (red bg, white M, app name) |
| Push Notifications | Firebase Cloud Messaging |
| Back Button | WebView history + exit confirmation |
| File Upload | Image picker from camera/gallery |
| Camera | Permission requested at startup |
| Location | Permission requested at startup |
| Share | Share current page URL |
| Deep Links | `https://miiam.in` opens in app |
| Offline Screen | "No Internet" with retry |
| HTTPS Only | Network security config |

## Setup

### Prerequisites
1. **Android Studio** — https://developer.android.com/studio
2. **JDK 17+**
3. **Google Services JSON** — for push notifications (see below)

### Open in Android Studio
```
File → Open → select miiam-app/android-app/
```

### Firebase Setup (Push Notifications)
1. Go to https://console.firebase.google.com
2. Create project (or use existing)
3. Add Android app → package name: `com.miiam.superapp`
4. Download `google-services.json`
5. Place at `android-app/app/google-services.json`

### Build
```
# Debug APK (test on device)
Build → Build Bundle(s) / APK(s) → Build APK(s)
# Output: android-app/app/build/outputs/apk/debug/app-debug.apk

# Release AAB (Play Store)
Build → Generate Signed Bundle / APK
→ Android App Bundle
→ Create keystore (first time) or select existing
→ Release
# Output: android-app/app/build/outputs/bundle/release/app-release.aab
```

## Generate Release Keystore
```bash
keytool -genkey -v \
  -keystore miiam-release.keystore \
  -alias miiam \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
**Store this securely. You cannot update your app without it.**

Then in `app/build.gradle`, add:
```gradle
android {
    signingConfigs {
        release {
            storeFile file("../miiam-release.keystore")
            storePassword "your-store-password"
            keyAlias "miiam"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## Google Play Console Steps

### 1. Create Account
https://play.google.com/console — pay one-time $25 fee

### 2. Create App
- App Name: **MIIAM**
- Default Language: English
- App Category: Food & Drink
- Type: App
- Price: Free

### 3. Upload AAB
```
Release → Production → Create New Release
→ Upload app-release.aab
→ Add release notes
→ Save
```

### 4. Store Listing
- **App name:** MIIAM
- **Short description:** Your super app for food, services & more
- **Full description:** (4000 chars max — describe features)
- **Screenshots:** min 2 phone screenshots (16:9 ratio)
- **App icon:** 512x512 PNG
- **Feature graphic:** 1024x500 PNG

### 5. Required Forms
- **Data Safety** — data you collect (location, contacts, etc.)
- **Content Rating** — fill questionnaire
- **App Access** — login credentials if needed for review
- **Ads** — Yes/No declaration
- **Target Audience** — age groups

### 6. Submit
```
Production → Review Release → Start Rollout
```
Review: hours to a few days.

## App Details

| Field | Value |
|-------|-------|
| Package | `com.miiam.superapp` |
| Min SDK | 23 (Android 6.0) |
| Target SDK | 35 (Android 15) |
| URL | `https://miiam.in` |
| Permissions | Internet, Camera, Location, Notifications, Phone |

## File Structure
```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/miiam/superapp/
│   │   │   ├── SplashActivity.java      # Branded splash screen
│   │   │   ├── MainActivity.java        # WebView + all features
│   │   │   └── MiiamFirebaseService.java # Push notifications
│   │   ├── AndroidManifest.xml
│   │   └── res/
│   │       ├── layout/activity_main.xml
│   │       ├── drawable/ic_launcher_foreground.xml
│   │       ├── mipmap-anydpi-v26/       # Adaptive icons
│   │       ├── values/colors.xml
│   │       ├── values/styles.xml
│   │       └── xml/network_security_config.xml
│   ├── build.gradle
│   └── proguard-rules.pro
├── build.gradle                         # Google services plugin
├── settings.gradle
├── gradle.properties
└── gradle/wrapper/
```

## Troubleshooting

**White screen:** Check internet. WebView loads miiam.in remotely.

**Build fails without google-services.json:**
Temporarily remove `apply plugin: 'com.google.gms.google-services'` from `app/build.gradle`.

**Push notifications not working:**
Ensure `google-services.json` is in `android-app/app/` and SHA-1 is added in Firebase console.

**App rejected:**
- Ensure targetSdk >= 34
- Add Privacy Policy URL
- Complete Data Safety form
- Add valid screenshots
